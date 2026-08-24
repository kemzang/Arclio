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
})
