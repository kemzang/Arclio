import {create} from 'zustand'
import type {PaddleTier} from '@arclio/cloud'
import type {TranscriptionErrorReason, TranscriptionPhase, TranscriptionProgress} from '@shared/types.js'

export interface TranscriptionItemState {
	phase: TranscriptionPhase
	chunkIndex?: number
	chunkCount?: number
	errorReason?: TranscriptionErrorReason
}

interface TranscriptionState {
	byItemId: Record<string, TranscriptionItemState>
	// undefined until refreshTier() resolves once — the generate button stays
	// hidden until then rather than flashing on for an account that turns out
	// not to have the tier.
	tier: PaddleTier | null | undefined
	start: (itemId: string) => void
	cancel: (itemId: string) => void
	applyProgress: (event: TranscriptionProgress) => void
	refreshTier: () => Promise<void>
}

/**
 * Per-item AI transcription run state, kept separate from the big queue store:
 * this is a short-lived, user-initiated side flow on an already-finished
 * queue item, not part of the download pipeline the queue store projects.
 * The push-event subscription that feeds applyProgress() is wired from
 * systemSlice.initialize(), matching how every other IPC event stream in the
 * app is bound — this file only owns state and pure actions.
 */
export const useTranscriptionStore = create<TranscriptionState>()((set, get) => ({
	byItemId: {},
	tier: undefined,
	start: itemId => {
		set(state => ({byItemId: {...state.byItemId, [itemId]: {phase: 'extracting'}}}))
		void window.appApi.transcription.start(itemId)
	},
	cancel: itemId => {
		void window.appApi.transcription.cancel(itemId)
	},
	applyProgress: event => {
		set(state => ({byItemId: {...state.byItemId, [event.itemId]: {phase: event.phase, chunkIndex: event.chunkIndex, chunkCount: event.chunkCount, errorReason: event.errorReason}}}))
	},
	refreshTier: async () => {
		if (get().tier !== undefined) return
		const status = await window.appApi.account.status()
		set({tier: status.tier ?? null})
	}
}))
