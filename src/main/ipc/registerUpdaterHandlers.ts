import {app, ipcMain, type BrowserWindow} from 'electron'
import electronUpdater from 'electron-updater'

const {autoUpdater} = electronUpdater
import log from 'electron-log/main.js'
import {IPC_CHANNELS} from '@shared/ipc.js'
import {detectInstallChannel} from '@main/installChannel.js'
import {trackMain} from '@main/services/analytics.js'
import type {InstallChannel, UpdateAvailablePayload, UpdateInstallResult} from '@shared/types.js'

// Channels where the in-app installer should not run — either because an
// external package manager owns updates (scoop/homebrew) or because the
// install layout can't accept an NSIS overwrite (portable). The renderer
// still gets a banner so the user can copy the upgrade command.
const NON_INSTALLABLE: ReadonlySet<InstallChannel> = new Set(['scoop', 'homebrew', 'portable'])

// Map the running version's semver prerelease tag to an electron-updater
// release channel. Stable versions follow `latest` and must never see beta
// releases; prerelease builds follow their own channel so a v0.3.1-beta.3
// install upgrades along beta.yml, not latest.yml.
function resolveUpdateChannel(version: string): {channel: string; allowPrerelease: boolean} {
	const dashIdx = version.indexOf('-')
	if (dashIdx === -1) return {channel: 'latest', allowPrerelease: false}
	const tag = version
		.slice(dashIdx + 1)
		.split('.', 1)[0]
		.toLowerCase()
	if (tag === 'beta' || tag === 'alpha' || tag === 'rc') {
		return {channel: tag, allowPrerelease: true}
	}
	return {channel: 'latest', allowPrerelease: false}
}

export function registerUpdaterHandlers(mainWindow: BrowserWindow): void {
	const installChannel = detectInstallChannel(app.getName())

	// Flatpak updates are managed by the Flatpak ecosystem (flatpak update /
	// GNOME Software). Running the in-app autoUpdater here would be wrong (it
	// can't install) and showing a banner without a real update check would be
	// misleading — the host package manager already notifies the user.
	if (installChannel === 'flatpak') return

	// Portable and scoop targets ship a portable .exe that extracts to %TEMP% —
	// app-update.yml is absent from that extracted bundle, causing ENOENT when
	// electron-updater tries to read the feed. setFeedURL is authoritative and
	// overrides the missing file on all targets (no-op cost on NSIS/DMG/AppImage).
	// The channel must match the running version's semver tag so a beta install
	// queries beta.yml (not latest.yml — which 404s on prerelease releases).
	const {channel, allowPrerelease} = resolveUpdateChannel(app.getVersion())
	autoUpdater.setFeedURL({provider: 'github', owner: 'kemzang', repo: 'Arclio', channel})
	autoUpdater.channel = channel
	autoUpdater.allowDowngrade = false // channel setter silently sets allowDowngrade=true; override it
	autoUpdater.allowPrerelease = allowPrerelease

	autoUpdater.autoDownload = false
	autoUpdater.autoInstallOnAppQuit = false

	autoUpdater.removeAllListeners('update-available')
	autoUpdater.removeAllListeners('update-downloaded')
	autoUpdater.removeAllListeners('error')

	// Track every in-flight install request so an `error`/`update-downloaded`
	// event resolves all of them instead of leaving a caller's renderer
	// spinner hanging forever. A single `pendingInstall` variable meant a
	// second concurrent updater:install call (double-click, a UI retry while
	// the first request was still downloading) silently overwrote the first
	// caller's resolver — that first invoke() promise then never settled.
	let pendingInstalls: Array<(result: UpdateInstallResult) => void> = []

	function settleAllPending(result: UpdateInstallResult): void {
		const resolvers = pendingInstalls
		pendingInstalls = []
		for (const resolve of resolvers) resolve(result)
	}

	autoUpdater.on('update-available', info => {
		if (mainWindow.isDestroyed()) return
		const payload: UpdateAvailablePayload = {version: info.version, currentVersion: app.getVersion(), installChannel}
		mainWindow.webContents.send(IPC_CHANNELS.updaterAvailable, payload)
		trackMain('update_available', {to_version: info.version, install_channel: installChannel})
	})

	autoUpdater.on('update-downloaded', () => {
		settleAllPending({ok: true})
		autoUpdater.quitAndInstall(false, true)
	})

	autoUpdater.on('error', err => {
		log.error('[updater]', err.message)
		settleAllPending({ok: false, error: err.message})
	})

	ipcMain.removeHandler(IPC_CHANNELS.updaterInstall)
	ipcMain.handle(IPC_CHANNELS.updaterInstall, async (): Promise<UpdateInstallResult> => {
		trackMain('update_install_clicked', {install_channel: installChannel})

		// Defense-in-depth: the renderer never exposes the install button on these
		// channels, but a stray invoke must not clobber the external install.
		if (NON_INSTALLABLE.has(installChannel)) {
			return {ok: false, error: `install not supported for channel: ${installChannel}`}
		}

		const {promise, resolve} = Promise.withResolvers<UpdateInstallResult>()
		// A download is already in flight for an earlier call — join it
		// instead of triggering a second, redundant downloadUpdate().
		const alreadyInFlight = pendingInstalls.length > 0
		pendingInstalls.push(resolve)
		if (!alreadyInFlight) {
			autoUpdater.downloadUpdate().catch((err: Error) => {
				settleAllPending({ok: false, error: err.message})
			})
		}
		return promise
	})

	setTimeout(() => {
		autoUpdater.checkForUpdates().catch((err: Error) => {
			log.error('[updater] checkForUpdates failed', err.message)
		})
	}, 5_000)
}
