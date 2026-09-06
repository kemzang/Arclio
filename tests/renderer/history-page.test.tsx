import {render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {HistoryPage} from '@renderer/pages/history/HistoryPage.js'
import {buildMockAppApi} from '../shared/mockAppApi.js'

const failedItem = {id: 'd1', url: 'https://example.com/video', outputDir: null, mediaId: null, status: 'failed', errorKind: null, errorRaw: null, formatId: null, durationMs: 185000, finishedAt: new Date().toISOString(), createdAt: new Date().toISOString()}

function setup() {
	const api = buildMockAppApi()
	api.library.downloadHistory.list = vi.fn().mockResolvedValue([failedItem]) as typeof api.library.downloadHistory.list
	Object.defineProperty(window, 'appApi', {value: api, writable: true, configurable: true})
	return api
}

describe('HistoryPage', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('regression: shows a translated status label instead of the raw DB value', async () => {
		// Previously {item.status} rendered the raw string ("failed") verbatim
		// instead of a localized label.
		setup()
		render(<HistoryPage />)

		expect(await screen.findByText(/Failed/)).toBeInTheDocument()
		expect(screen.queryByText(/^failed/)).not.toBeInTheDocument()
	})

	it('regression: formats duration with the shared m:ss format, not "Xm Ys"', async () => {
		// Previously HistoryPage had its own formatDuration returning "3m 5s",
		// diverging from the shared "3:05" format used by Queue and Library.
		setup()
		render(<HistoryPage />)

		expect(await screen.findByText(/3:05/)).toBeInTheDocument()
		expect(screen.queryByText(/3m 5s/)).not.toBeInTheDocument()
	})
})
