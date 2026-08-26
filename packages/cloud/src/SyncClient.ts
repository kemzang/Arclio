import type {SyncPullResponse, SyncPushRequest, SyncRecord} from './types.js'

/**
 * HTTP client for library sync.
 *
 * Free of Electron and Node — `fetch` is injected — so the request shapes and
 * error handling are testable without a server. The device token is supplied by
 * the caller rather than read from storage here: this package must not know how
 * credentials are kept.
 */

export interface SyncClientOptions {
	baseUrl: string
	/** Bearer credential obtained by pairing. */
	deviceToken: string
	fetch?: typeof globalThis.fetch
}

/** Thrown when the server rejects our credential; the caller should re-pair. */
export class SyncAuthError extends Error {
	constructor() {
		super('Device is no longer authorised')
		this.name = 'SyncAuthError'
	}
}

/**
 * Thrown when the account's plan does not cover this device.
 *
 * Distinct from an auth failure: the credential is valid and re-pairing would
 * change nothing. The user has to upgrade, or sync from their original device.
 */
export class SyncPlanError extends Error {
	constructor(readonly reason: string) {
		super(`Plan does not allow syncing: ${reason}`)
		this.name = 'SyncPlanError'
	}
}

export class SyncClient {
	private readonly baseUrl: string
	private readonly deviceToken: string
	private readonly fetchImpl: typeof globalThis.fetch

	constructor(options: SyncClientOptions) {
		this.baseUrl = options.baseUrl.replace(/\/+$/, '')
		this.deviceToken = options.deviceToken
		this.fetchImpl = options.fetch ?? globalThis.fetch
	}

	private async request(path: string, body: unknown): Promise<Response> {
		const response = await this.fetchImpl(`${this.baseUrl}${path}`, {method: 'POST', headers: {'content-type': 'application/json', authorization: `Bearer ${this.deviceToken}`}, body: JSON.stringify(body)})
		// 401 means the device was revoked from the account page, or the token is
		// stale. That is a distinct outcome from a transient failure: the caller
		// must stop retrying and ask the user to connect again.
		if (response.status === 401) throw new SyncAuthError()
		// 402 is the plan gate. Retrying cannot help, so it must not be folded in
		// with transient failures the scheduler will try again.
		if (response.status === 402) {
			const body = (await response.json().catch(() => ({}))) as {reason?: string}
			throw new SyncPlanError(body.reason ?? 'plan_required')
		}
		if (!response.ok) throw new Error(`Sync failed: HTTP ${response.status}`)
		return response
	}

	/** Fetches everything changed on the server since `cursor`. */
	async pull(cursor: string | null): Promise<SyncPullResponse> {
		const response = await this.request('/api/sync/pull', {cursor})
		return (await response.json()) as SyncPullResponse
	}

	/** Sends local changes. Returns the cursor to use on the next pull. */
	async push(request: SyncPushRequest): Promise<{cursor: string}> {
		// Nothing to send: skip the round-trip rather than posting an empty batch.
		if (request.records.length === 0) return {cursor: request.cursor ?? ''}
		const response = await this.request('/api/sync/push', request)
		return (await response.json()) as {cursor: string}
	}
}

export type {SyncRecord}
