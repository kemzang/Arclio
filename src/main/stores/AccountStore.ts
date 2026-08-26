import Store from 'electron-store'
import {safeStorage} from 'electron'
import log from 'electron-log/main.js'

const logger = log.scope('account')

/**
 * Persists the device credentials obtained by pairing.
 *
 * The device token is a bearer credential for the user's account, so it is
 * encrypted with `safeStorage` — which is backed by the OS keychain (Keychain
 * on macOS, DPAPI on Windows, libsecret/kwallet on Linux) — rather than written
 * as plain text into the settings file.
 *
 * On a Linux box with no keyring available, `safeStorage` silently falls back
 * to a weak, machine-local key. We refuse to store anything in that case: an
 * account token sitting in effectively-plaintext on disk is worse than asking
 * the user to pair again, and the app works fully without an account anyway.
 */

interface AccountData {
	/** Base64 of the safeStorage-encrypted device token. */
	encryptedDeviceToken?: string
	deviceId?: string
	/** Kept in the clear on purpose: shown in the UI, useless to an attacker. */
	accountEmail?: string
	pairedAt?: number
	/** How far this device has read the account's sync stream. */
	syncCursor?: string
}

export interface StoredAccount {
	deviceToken: string
	deviceId: string
	accountEmail?: string
	pairedAt?: number
}

export class AccountStore {
	private instance: Store<AccountData> | null = null
	private readonly cwd: string | undefined

	/** `cwd` exists so tests can point the store at a temp directory, matching SettingsStore. */
	constructor(cwd?: string) {
		this.cwd = cwd
	}

	/**
	 * Opened on first use rather than in the constructor: electron-store resolves
	 * an app path as soon as it is instantiated, so building the service would
	 * otherwise touch the filesystem — and fail anywhere the Electron app object
	 * is not fully initialised.
	 */
	private get store(): Store<AccountData> {
		this.instance ??= new Store<AccountData>({name: 'account', defaults: {}, ...(this.cwd ? {cwd: this.cwd} : {})})
		return this.instance
	}

	/** Whether the platform can protect a token at rest. */
	static encryptionAvailable(): boolean {
		return safeStorage.isEncryptionAvailable()
	}

	save(account: StoredAccount): boolean {
		if (!AccountStore.encryptionAvailable()) {
			logger.warn('Refusing to persist device token: OS encryption unavailable')
			return false
		}
		this.store.set('encryptedDeviceToken', safeStorage.encryptString(account.deviceToken).toString('base64'))
		this.store.set('deviceId', account.deviceId)
		if (account.accountEmail) this.store.set('accountEmail', account.accountEmail)
		this.store.set('pairedAt', account.pairedAt ?? Date.now())
		return true
	}

	load(): StoredAccount | null {
		// An unopenable store means "not connected", not a crash. The app is fully
		// usable without an account, so a corrupt or unavailable settings file must
		// never take startup down with it.
		let encrypted: string | undefined
		let deviceId: string | undefined
		try {
			encrypted = this.store.get('encryptedDeviceToken')
			deviceId = this.store.get('deviceId')
		} catch (error) {
			logger.warn('Account store unreadable; treating device as not connected', {error: error instanceof Error ? error.message : String(error)})
			return null
		}
		if (!encrypted || !deviceId) return null
		if (!AccountStore.encryptionAvailable()) {
			logger.warn('Stored device token cannot be read: OS encryption unavailable')
			return null
		}

		try {
			const deviceToken = safeStorage.decryptString(Buffer.from(encrypted, 'base64'))
			return {deviceToken, deviceId, accountEmail: this.store.get('accountEmail'), pairedAt: this.store.get('pairedAt')}
		} catch (error) {
			// Happens when the OS keychain entry is gone or the profile moved to
			// another machine. The stored blob is useless now — drop it so the app
			// offers pairing again instead of failing every request.
			logger.warn('Discarding unreadable device token', {error: error instanceof Error ? error.message : String(error)})
			this.clear()
			return null
		}
	}

	/** Sync cursor. Lives here so disconnecting drops it too: a cursor from one
	 *  account would silently skip another account's history. */
	getSyncCursor(): string | null {
		return this.store.get('syncCursor') ?? null
	}

	setSyncCursor(cursor: string): void {
		this.store.set('syncCursor', cursor)
	}

	clear(): void {
		this.store.delete('syncCursor')
		this.store.delete('encryptedDeviceToken')
		this.store.delete('deviceId')
		this.store.delete('accountEmail')
		this.store.delete('pairedAt')
	}
}
