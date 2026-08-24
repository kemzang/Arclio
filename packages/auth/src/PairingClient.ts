import {PairingError, type DeviceCredentials, type DeviceIdentity, type PairingStart, type PollOutcome} from './types.js'

/**
 * Talks the device-pairing protocol to the Arclio backend.
 *
 * Deliberately free of Electron and of Node: `fetch`, `sleep` and `now` are all
 * injected, so the whole waiting loop — the part with the interesting edge
 * cases — is testable without real timers or a real server.
 */

export interface PairingClientOptions {
	baseUrl: string
	fetch?: typeof globalThis.fetch
	sleep?: (ms: number) => Promise<void>
	now?: () => number
}

export interface WaitOptions {
	/** Aborts the wait; surfaces as PairingError('cancelled'). */
	signal?: AbortSignal
	/** Called on each poll so the UI can show that we are still waiting. */
	onPoll?: (attempt: number) => void
}

const defaultSleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

export class PairingClient {
	private readonly baseUrl: string
	private readonly fetchImpl: typeof globalThis.fetch
	private readonly sleep: (ms: number) => Promise<void>
	private readonly now: () => number

	constructor(options: PairingClientOptions) {
		this.baseUrl = options.baseUrl.replace(/\/+$/, '')
		this.fetchImpl = options.fetch ?? globalThis.fetch
		this.sleep = options.sleep ?? defaultSleep
		this.now = options.now ?? Date.now
	}

	async start(device: DeviceIdentity): Promise<PairingStart> {
		const response = await this.fetchImpl(`${this.baseUrl}/api/pair/start`, {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(device)})
		if (!response.ok) throw new Error(`Pairing request failed: HTTP ${response.status}`)
		return (await response.json()) as PairingStart
	}

	async poll(deviceCode: string): Promise<PollOutcome> {
		const response = await this.fetchImpl(`${this.baseUrl}/api/pair/poll`, {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({deviceCode})})
		// 202 pending, 200 approved, 410 expired/denied — anything else is a fault
		// rather than a protocol answer, and must not be read as "keep waiting".
		if (response.status !== 200 && response.status !== 202 && response.status !== 410) {
			throw new Error(`Pairing poll failed: HTTP ${response.status}`)
		}
		return (await response.json()) as PollOutcome
	}

	/**
	 * Polls until the user decides, the pairing expires, or the caller cancels.
	 *
	 * The deadline is enforced client-side as well as by the server: a machine
	 * whose clock is behind, or a server that stops answering, must not leave the
	 * app polling forever.
	 */
	async waitForApproval(started: PairingStart, options: WaitOptions = {}): Promise<DeviceCredentials> {
		const intervalMs = Math.max(1, started.pollIntervalSeconds) * 1000
		let attempt = 0

		for (;;) {
			if (options.signal?.aborted) throw new PairingError('cancelled')
			if (this.now() >= started.expiresAt) throw new PairingError('expired')

			attempt += 1
			options.onPoll?.(attempt)
			const outcome = await this.poll(started.deviceCode)

			if (outcome.status === 'approved') return {deviceToken: outcome.deviceToken, deviceId: outcome.deviceId}
			if (outcome.status === 'expired') throw new PairingError('expired')
			if (outcome.status === 'denied') throw new PairingError('denied')

			await this.sleep(intervalMs)
		}
	}
}
