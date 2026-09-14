// @vitest-environment jsdom
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {useTranscriptionStore} from '@renderer/store/useTranscription.js'
import {buildMockAppApi} from '../shared/mockAppApi.js'

function resetStore(): void {
	useTranscriptionStore.setState({byItemId: {}, tier: undefined})
}

beforeEach(() => {
	resetStore()
	vi.clearAllMocks()
})

describe('useTranscriptionStore', () => {
	it('optimistically marks an item extracting and calls the IPC start', () => {
		const api = buildMockAppApi()
		window.appApi = api

		useTranscriptionStore.getState().start('item-1')

		expect(useTranscriptionStore.getState().byItemId['item-1']).toEqual({phase: 'extracting'})
		expect(api.transcription.start).toHaveBeenCalledWith('item-1')
	})

	it('forwards cancel to the IPC layer without touching local state', () => {
		const api = buildMockAppApi()
		window.appApi = api
		useTranscriptionStore.setState({byItemId: {'item-1': {phase: 'transcribing', chunkIndex: 1, chunkCount: 3}}})

		useTranscriptionStore.getState().cancel('item-1')

		expect(api.transcription.cancel).toHaveBeenCalledWith('item-1')
		expect(useTranscriptionStore.getState().byItemId['item-1']).toEqual({phase: 'transcribing', chunkIndex: 1, chunkCount: 3})
	})

	it('applies a progress event onto the matching item, replacing its previous state', () => {
		useTranscriptionStore.setState({byItemId: {'item-1': {phase: 'extracting'}}})

		useTranscriptionStore.getState().applyProgress({itemId: 'item-1', phase: 'transcribing', chunkIndex: 2, chunkCount: 4, at: '2026-09-10T10:00:00.000Z'})

		expect(useTranscriptionStore.getState().byItemId['item-1']).toEqual({phase: 'transcribing', chunkIndex: 2, chunkCount: 4, errorReason: undefined})
	})

	it('only ever fetches the tier once', async () => {
		const api = buildMockAppApi()
		vi.mocked(api.account.status).mockResolvedValue({connected: true, canStoreCredentials: true, plan: 'pro', tier: 'sync_ai'})
		window.appApi = api

		await useTranscriptionStore.getState().refreshTier()
		await useTranscriptionStore.getState().refreshTier()

		expect(useTranscriptionStore.getState().tier).toBe('sync_ai')
		expect(api.account.status).toHaveBeenCalledTimes(1)
	})

	it('caches a null tier for an account with no Sync + AI plan, not undefined', async () => {
		const api = buildMockAppApi()
		vi.mocked(api.account.status).mockResolvedValue({connected: true, canStoreCredentials: true, plan: 'free'})
		window.appApi = api

		await useTranscriptionStore.getState().refreshTier()

		expect(useTranscriptionStore.getState().tier).toBeNull()
	})
})
