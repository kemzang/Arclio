// @vitest-environment jsdom
import {fireEvent, render, screen} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it} from 'vitest'
import {TranscriptionAction} from '@renderer/components/queue/TranscriptionAction.js'
import {useTranscriptionStore} from '@renderer/store/useTranscription.js'
import {i18next} from '@shared/i18n/index.js'
import en from '@shared/i18n/locales/en.json' with {type: 'json'}
import {makeItem} from '../shared/fixtures.js'
import {buildMockAppApi} from '../shared/mockAppApi.js'

const SUBTITLES_FAILED_ITEM = makeItem({id: 'item-1', status: 'done', lastStatus: {key: 'subtitlesFailed'}})

beforeEach(() => {
	useTranscriptionStore.setState({byItemId: {}, tier: 'sync_ai'})
	const api = buildMockAppApi()
	window.appApi = api
})

afterEach(() => {
	i18next.removeResourceBundle('en', 'translation')
	i18next.addResourceBundle('en', 'translation', en, true, true)
})

describe('TranscriptionAction', () => {
	it('offers to generate subtitles for a finished download that never had subtitles requested at all', () => {
		// Most downloads never ask for subtitles in the first place — gating this
		// on the subtitlesFailed soft-fail alone would hide the paid feature from
		// almost every completed item, not just the ones that tried and missed.
		const item = makeItem({id: 'item-2', status: 'done', lastStatus: null})
		render(<TranscriptionAction item={item} t={i18next.t} />)
		expect(screen.getByRole('button', {name: /generate ai subtitles/i})).toBeInTheDocument()
	})

	it('renders nothing for an item that has not finished downloading yet', () => {
		const item = makeItem({id: 'item-running', status: 'running', lastStatus: null})
		const {container} = render(<TranscriptionAction item={item} t={i18next.t} />)
		expect(container).toBeEmptyDOMElement()
	})

	it('renders nothing once a subtitle artifact already exists, even if lastStatus still says subtitlesFailed', () => {
		const item = makeItem({id: 'item-3', status: 'done', lastStatus: {key: 'subtitlesFailed'}, artifacts: [{id: 'artifact:sub', kind: 'subtitle', path: '/tmp/video.srt', fileName: 'video.srt', discoveredAt: '2026-09-10T10:00:00.000Z'}]})
		const {container} = render(<TranscriptionAction item={item} t={i18next.t} />)
		expect(container).toBeEmptyDOMElement()
	})

	it('renders nothing for an eligible item when the account is not on the Sync + AI tier', () => {
		useTranscriptionStore.setState({tier: 'sync'})
		const {container} = render(<TranscriptionAction item={SUBTITLES_FAILED_ITEM} t={i18next.t} />)
		expect(container).toBeEmptyDOMElement()
	})

	it('renders nothing while the tier has not been fetched yet', () => {
		useTranscriptionStore.setState({tier: undefined})
		const {container} = render(<TranscriptionAction item={SUBTITLES_FAILED_ITEM} t={i18next.t} />)
		expect(container).toBeEmptyDOMElement()
	})

	it('shows a Generate button for an eligible Sync + AI item and starts a run on click', () => {
		const api = window.appApi
		render(<TranscriptionAction item={SUBTITLES_FAILED_ITEM} t={i18next.t} />)

		fireEvent.click(screen.getByRole('button', {name: /generate ai subtitles/i}))

		expect(api.transcription.start).toHaveBeenCalledWith('item-1')
		expect(useTranscriptionStore.getState().byItemId['item-1']).toEqual({phase: 'extracting'})
	})

	it('shows chunk progress and a cancel button while a run is in flight', () => {
		const api = window.appApi
		useTranscriptionStore.setState({byItemId: {'item-1': {phase: 'transcribing', chunkIndex: 2, chunkCount: 5}}}, false)
		render(<TranscriptionAction item={SUBTITLES_FAILED_ITEM} t={i18next.t} />)

		expect(screen.getByText(/transcribing \(2\/5\)/i)).toBeInTheDocument()
		fireEvent.click(screen.getByRole('button', {name: /cancel/i}))

		expect(api.transcription.cancel).toHaveBeenCalledWith('item-1')
	})

	it('shows the mapped error message and offers to retry after a failed run', () => {
		const api = window.appApi
		useTranscriptionStore.setState({byItemId: {'item-1': {phase: 'failed', errorReason: 'quota_exceeded'}}}, false)
		render(<TranscriptionAction item={SUBTITLES_FAILED_ITEM} t={i18next.t} />)

		expect(screen.getByText(/monthly ai transcription quota reached/i)).toBeInTheDocument()
		fireEvent.click(screen.getByRole('button', {name: /retry/i}))

		expect(api.transcription.start).toHaveBeenCalledWith('item-1')
	})
})
