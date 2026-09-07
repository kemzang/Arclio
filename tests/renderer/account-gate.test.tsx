// @vitest-environment jsdom
import {beforeEach, describe, expect, it} from 'vitest'
import {useAppStore} from '@renderer/store/useAppStore.js'
import {ensureAccountConnected} from '@renderer/store/wizard/accountGate.js'
import {buildMockAppApi} from '../shared/mockAppApi.js'

function set(patch: Parameters<typeof useAppStore.setState>[0]): void {
	useAppStore.setState(patch)
}

function get(): ReturnType<typeof useAppStore.getState> {
	return useAppStore.getState()
}

beforeEach(() => {
	useAppStore.setState({accountGateOpen: false})
})

describe('ensureAccountConnected', () => {
	it('resolves true immediately when already connected, without opening the gate', async () => {
		window.appApi = buildMockAppApi({})
		window.appApi.account.status = () => Promise.resolve({connected: true, canStoreCredentials: true})

		const connected = await ensureAccountConnected(set, get)

		expect(connected).toBe(true)
		expect(get().accountGateOpen).toBe(false)
	})

	it('opens the gate when not connected, and resolves once resolveAccountGate(true) is called', async () => {
		window.appApi = buildMockAppApi({})
		window.appApi.account.status = () => Promise.resolve({connected: false, canStoreCredentials: true})

		const pending = ensureAccountConnected(set, get)
		await Promise.resolve() // let the status() promise settle
		await Promise.resolve()

		expect(get().accountGateOpen).toBe(true)

		get().resolveAccountGate(true)
		const connected = await pending

		expect(connected).toBe(true)
		expect(get().accountGateOpen).toBe(false)
	})

	it('resolves false when the gate is dismissed without connecting', async () => {
		window.appApi = buildMockAppApi({})
		window.appApi.account.status = () => Promise.resolve({connected: false, canStoreCredentials: true})

		const pending = ensureAccountConnected(set, get)
		await Promise.resolve()
		await Promise.resolve()

		get().resolveAccountGate(false)
		const connected = await pending

		expect(connected).toBe(false)
	})

	it('a second call while the gate is already open shares the same pending resolution instead of opening twice', async () => {
		window.appApi = buildMockAppApi({})
		window.appApi.account.status = () => Promise.resolve({connected: false, canStoreCredentials: true})

		const first = ensureAccountConnected(set, get)
		await Promise.resolve()
		await Promise.resolve()
		expect(get().accountGateOpen).toBe(true)

		const second = ensureAccountConnected(set, get)

		get().resolveAccountGate(true)
		const [firstConnected, secondConnected] = await Promise.all([first, second])

		expect(firstConnected).toBe(true)
		expect(secondConnected).toBe(true)
	})
})
