import {ipcMain} from 'electron'
import {IPC_CHANNELS} from '@shared/ipc.js'
import {PairingError} from '@arclio/auth'
import type {AccountService} from '@main/services/AccountService.js'
import type {SyncScheduler} from '@main/services/SyncScheduler.js'

/**
 * Bridges the account lifecycle to the renderer.
 *
 * Nothing here returns the device token — the renderer gets the code to show
 * and the resulting status, and the token stays in the main process.
 */
export function registerAccountHandlers(accountService: AccountService, syncScheduler: SyncScheduler): void {
	ipcMain.removeHandler(IPC_CHANNELS.accountStatus)
	ipcMain.handle(IPC_CHANNELS.accountStatus, () => accountService.status())

	ipcMain.removeHandler(IPC_CHANNELS.accountBeginPairing)
	ipcMain.handle(IPC_CHANNELS.accountBeginPairing, async () => accountService.beginPairing())

	ipcMain.removeHandler(IPC_CHANNELS.accountAwaitPairing)
	ipcMain.handle(IPC_CHANNELS.accountAwaitPairing, async () => {
		try {
			const status = await accountService.awaitPairing()
			// Now that credentials exist, start syncing without waiting for a restart.
			syncScheduler.start()
			void syncScheduler.runNow()
			return {ok: true as const, status}
		} catch (error) {
			// A pairing that expires, is denied, or is cancelled is an ordinary
			// outcome the UI must explain — not an exception to surface raw.
			if (error instanceof PairingError) return {ok: false as const, reason: error.reason}
			return {ok: false as const, reason: 'failed' as const}
		}
	})

	ipcMain.removeHandler(IPC_CHANNELS.accountCancelPairing)
	ipcMain.handle(IPC_CHANNELS.accountCancelPairing, () => {
		accountService.cancelPairing()
	})

	ipcMain.removeHandler(IPC_CHANNELS.accountDisconnect)
	ipcMain.handle(IPC_CHANNELS.accountDisconnect, () => {
		syncScheduler.stop()
		return accountService.disconnect()
	})
}
