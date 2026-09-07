import {shell} from 'electron'
import os from 'node:os'
import log from 'electron-log/main.js'
import {PairingClient, PairingError, type PairingStart} from '@arclio/auth'
import {SyncClient, type AccountPlan} from '@arclio/cloud'
import {AccountStore, type StoredAccount} from '@main/stores/AccountStore.js'
import {SITE_URL} from '@shared/constants.js'

const logger = log.scope('account')

export interface AccountStatus {
	connected: boolean
	accountEmail?: string
	deviceId?: string
	/** False when the OS cannot protect a token at rest; connecting is refused. */
	canStoreCredentials: boolean
	/** Undefined until refreshPlan() has fetched it at least once this session. */
	plan?: AccountPlan
}

export interface PairingHandle {
	userCode: string
	verificationUrl: string
	expiresAt: number
}

/**
 * Owns the account lifecycle in the main process.
 *
 * The renderer never sees the device token: it asks to connect, gets back the
 * code to display, and is told when the pairing settles. Keeping the token in
 * main is the whole point of doing this here rather than in the window.
 */
export class AccountService {
	private readonly client: PairingClient
	private readonly store: AccountStore
	private readonly baseUrl: string
	private readonly fetchImpl?: typeof globalThis.fetch
	private pending: {start: PairingStart; controller: AbortController} | null = null
	// Bumped by cancelPairing() (directly, or via a fresh beginPairing()). Lets an
	// in-flight beginPairing() notice that it was superseded while awaiting
	// client.start() and avoid overwriting a newer call's `pending`.
	private pairingGeneration = 0
	// Cached rather than fetched per status() call: status() is synchronous and
	// polled by the renderer, while the plan only changes on upgrade/downgrade —
	// not worth a network round trip per read. null until refreshPlan() runs once.
	private cachedPlan: AccountPlan | null = null

	constructor(options: {baseUrl?: string; store?: AccountStore; fetch?: typeof globalThis.fetch} = {}) {
		this.baseUrl = options.baseUrl ?? SITE_URL
		this.fetchImpl = options.fetch
		this.client = new PairingClient({baseUrl: this.baseUrl, fetch: options.fetch})
		this.store = options.store ?? new AccountStore()
	}

	status(): AccountStatus {
		const stored = this.store.load()
		return {connected: stored !== null, accountEmail: stored?.accountEmail, deviceId: stored?.deviceId, canStoreCredentials: AccountStore.encryptionAvailable(), plan: this.cachedPlan ?? undefined}
	}

	/**
	 * Refreshes the cached plan from the site. Best-effort: a network blip
	 * leaves the previous cached value (or null if there never was one) rather
	 * than throwing, since callers use this opportunistically alongside other
	 * work (after pairing, after a sync round) rather than awaiting it directly.
	 */
	async refreshPlan(): Promise<void> {
		const stored = this.store.load()
		if (!stored) {
			this.cachedPlan = null
			return
		}
		try {
			const client = new SyncClient({baseUrl: this.baseUrl, deviceToken: stored.deviceToken, fetch: this.fetchImpl})
			const result = await client.getPlan()
			this.cachedPlan = result.plan
		} catch (error) {
			logger.info('Plan refresh failed, keeping previous value', {error})
		}
	}

	/**
	 * Starts pairing and opens the browser. Returns as soon as there is a code to
	 * show — the waiting happens in `awaitPairing` so the renderer stays
	 * responsive and can display the code while the user signs in.
	 */
	async beginPairing(): Promise<PairingHandle> {
		if (!AccountStore.encryptionAvailable()) {
			// Refuse before sending the user through a login they cannot benefit
			// from: we would have nowhere safe to keep the resulting token.
			throw new Error('OS credential storage is unavailable')
		}

		this.cancelPairing()
		const generation = this.pairingGeneration

		const start = await this.client.start({deviceName: os.hostname(), devicePlatform: process.platform})

		// A second beginPairing() (or an explicit cancelPairing()) arrived while
		// this request was in flight. That caller's `pending` — and whatever code
		// the user is looking at in the browser tab it opened — must win instead
		// of being silently clobbered once this slower request finally resolves.
		if (generation !== this.pairingGeneration) {
			throw new PairingError('cancelled')
		}

		this.pending = {start, controller: new AbortController()}

		const url = new URL(start.verificationUrl)
		url.searchParams.set('code', start.userCode)
		void shell.openExternal(url.toString())

		return {userCode: start.userCode, verificationUrl: url.toString(), expiresAt: start.expiresAt}
	}

	/** Resolves once the user decides, the pairing expires, or `cancelPairing` runs. */
	async awaitPairing(): Promise<AccountStatus> {
		const pending = this.pending
		if (!pending) throw new Error('No pairing in progress')

		try {
			const credentials = await this.client.waitForApproval(pending.start, {signal: pending.controller.signal})
			const account: StoredAccount = {...credentials, pairedAt: Date.now()}
			if (!this.store.save(account)) throw new Error('Could not store device credentials securely')
			logger.info('Device paired', {deviceId: credentials.deviceId})
			return this.status()
		} catch (error) {
			if (error instanceof PairingError) logger.info('Pairing ended without credentials', {reason: error.reason})
			throw error
		} finally {
			this.pending = null
		}
	}

	cancelPairing(): void {
		this.pairingGeneration++
		this.pending?.controller.abort()
		this.pending = null
	}

	/**
	 * Forgets the account locally. The device row stays on the server so the user
	 * can still see and revoke it from their account page — removing it here is
	 * about this machine, not about the account.
	 */
	disconnect(): AccountStatus {
		this.cancelPairing()
		this.store.clear()
		this.cachedPlan = null
		logger.info('Device disconnected locally')
		return this.status()
	}
}
