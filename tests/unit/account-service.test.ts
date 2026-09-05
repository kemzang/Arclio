import {describe, expect, it, vi} from 'vitest'

vi.mock('electron', async () => {
	const actual = await vi.importActual<Record<string, unknown>>('../__mocks__/electron.js')
	return {...actual, shell: {openExternal: vi.fn()}}
})

const {shell} = await import('electron')
const {AccountService} = await import('@main/services/AccountService.js')
const {AccountStore} = await import('@main/stores/AccountStore.js')

function stubStore(overrides: Partial<Record<string, unknown>> = {}) {
	return {load: vi.fn().mockReturnValue(null), save: vi.fn().mockReturnValue(true), clear: vi.fn(), ...overrides} as unknown as InstanceType<typeof AccountStore>
}

function jsonResponse(body: unknown): Response {
	return new Response(JSON.stringify(body), {status: 200, headers: {'content-type': 'application/json'}})
}

describe('AccountService', () => {
	it('reports a disconnected account before pairing', () => {
		const service = new AccountService({baseUrl: 'https://example.test', store: stubStore()})

		expect(service.status()).toMatchObject({connected: false})
	})

	it('reports the stored account once paired', () => {
		const store = stubStore({load: vi.fn().mockReturnValue({deviceToken: 'tok', deviceId: 'dev-1', accountEmail: 'a@b.test'})})
		const service = new AccountService({baseUrl: 'https://example.test', store})

		expect(service.status()).toMatchObject({connected: true, deviceId: 'dev-1', accountEmail: 'a@b.test'})
	})

	it('never exposes the device token in the status', () => {
		const store = stubStore({load: vi.fn().mockReturnValue({deviceToken: 'super-secret', deviceId: 'dev-1'})})
		const service = new AccountService({baseUrl: 'https://example.test', store})

		expect(JSON.stringify(service.status())).not.toContain('super-secret')
	})

	it('refuses to start pairing when the OS cannot store credentials', async () => {
		// Sending the user through a Google login we cannot capitalise on would
		// waste their time and leave a live device row on the server.
		const spy = vi.spyOn(AccountStore, 'encryptionAvailable').mockReturnValue(false)
		const service = new AccountService({baseUrl: 'https://example.test', store: stubStore()})

		await expect(service.beginPairing()).rejects.toThrow('OS credential storage is unavailable')
		expect(shell.openExternal).not.toHaveBeenCalled()
		spy.mockRestore()
	})

	it('clears stored credentials on disconnect', () => {
		const store = stubStore()
		const service = new AccountService({baseUrl: 'https://example.test', store})

		expect(service.disconnect()).toMatchObject({connected: false})
		expect(store.clear).toHaveBeenCalled()
	})

	it('rejects awaiting a pairing that was never started', async () => {
		const service = new AccountService({baseUrl: 'https://example.test', store: stubStore()})

		await expect(service.awaitPairing()).rejects.toThrow('No pairing in progress')
	})

	it('regression: a slow first beginPairing() cannot clobber a faster second call', async () => {
		// Reproduces the race: two rapid "Connect" clicks each call client.start().
		// If the first call's network request happens to resolve *after* the
		// second's, the naive implementation would overwrite `pending` with the
		// stale first pairing — even though the browser tab the user is looking
		// at, and the code awaitPairing() should be polling for, belongs to the
		// second, faster call.
		let resolveFirst!: (response: Response) => void
		const firstResponse = new Promise<Response>(resolve => {
			resolveFirst = resolve
		})
		let callIndex = 0
		const fetchImpl = vi.fn(async (_url: string, init: {body: string}) => {
			if (callIndex === 0) {
				callIndex++
				return firstResponse
			}
			if (callIndex === 1) {
				callIndex++
				return jsonResponse({userCode: 'SECOND', deviceCode: 'device-2', expiresAt: Date.now() + 60_000, pollIntervalSeconds: 5, verificationUrl: 'https://example.test/pair'})
			}
			// Any later call is awaitPairing()'s poll. Approve only device-2's poll —
			// if the race bug lets the stale first pairing win, awaitPairing() would
			// poll with device-1 and must NOT be told it was approved.
			const {deviceCode} = JSON.parse(init.body) as {deviceCode: string}
			return deviceCode === 'device-2' ? jsonResponse({status: 'approved', deviceToken: 'tok', deviceId: 'device-2'}) : jsonResponse({status: 'denied'})
		})

		let saved: {deviceToken: string; deviceId: string} | null = null
		const store = stubStore({
			load: vi.fn(() => saved),
			save: vi.fn((account: {deviceToken: string; deviceId: string}) => {
				saved = account
				return true
			})
		})
		const service = new AccountService({baseUrl: 'https://example.test', store, fetch: fetchImpl as unknown as typeof fetch})

		const first = service.beginPairing()
		// The first call's fetch is now in flight (pending on firstResponse).
		const second = await service.beginPairing()
		expect(second.userCode).toBe('SECOND')

		// Now let the slower first request resolve. It must not overwrite the
		// second pairing's state.
		resolveFirst(jsonResponse({userCode: 'FIRST', deviceCode: 'device-1', expiresAt: Date.now() + 60_000, pollIntervalSeconds: 5, verificationUrl: 'https://example.test/pair'}))
		await expect(first).rejects.toThrow()

		// awaitPairing() must still be waiting on the second (displayed) pairing,
		// not silently switched to the first one's deviceCode.
		const status = await service.awaitPairing()
		expect(status.connected).toBe(true)
	})
})
