import {render, screen, fireEvent} from '@testing-library/react'
import {MemoryRouter, Routes, Route} from 'react-router-dom'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {PlayerPage} from '@renderer/pages/player/PlayerPage.js'
import type {LibraryMediaWithAssets} from '@shared/api.js'
import {buildMockAppApi} from '../shared/mockAppApi.js'

const media: LibraryMediaWithAssets = {
	id: 'media-1',
	title: 'A video that got deleted',
	description: null,
	author: null,
	url: 'https://youtube.com/watch?v=1',
	sourceKey: null,
	sourceType: 'YOUTUBE',
	duration: 120,
	mediaType: 'video',
	thumbnailUrl: null,
	thumbnailPath: null,
	metadata: null,
	status: 'AVAILABLE',
	isFavorite: 0,
	createdBy: 'DOWNLOAD',
	downloadDate: '2026-09-15T00:00:00.000Z',
	createdAt: '2026-09-15T00:00:00.000Z',
	updatedAt: '2026-09-15T00:00:00.000Z',
	assets: [{id: 'asset-1', mediaId: 'media-1', kind: 'video', path: '/library/gone.mp4', fileName: 'gone.mp4', sizeBytes: 123, mimeType: 'video/mp4', status: 'AVAILABLE', createdAt: '2026-09-15T00:00:00.000Z'}],
	totalSize: 123
}

function setup(checkAvailabilityResult: 'AVAILABLE' | 'MISSING' | null) {
	const api = buildMockAppApi()
	api.library.media.get = vi.fn().mockResolvedValue(media) as typeof api.library.media.get
	api.library.media.checkAvailability = vi.fn().mockResolvedValue(checkAvailabilityResult) as typeof api.library.media.checkAvailability
	api.library.media.setStatus = vi.fn().mockResolvedValue(undefined) as typeof api.library.media.setStatus
	Object.defineProperty(window, 'appApi', {value: api, writable: true, configurable: true})
	return api
}

function renderPlayerPage() {
	return render(
		<MemoryRouter initialEntries={['/library/media-1']}>
			<Routes>
				<Route path="/library/:id" element={<PlayerPage />} />
			</Routes>
		</MemoryRouter>
	)
}

describe('PlayerPage — a file deleted outside Arclio', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	// Previously nothing ever checked whether a media row's file still
	// existed on disk — a locally-deleted file rendered a silently blank,
	// broken player with no indication anything was wrong.
	it('regression: shows a clear "file missing" message instead of a broken player', async () => {
		setup('MISSING')
		renderPlayerPage()

		expect(await screen.findByText('This file seems to have been moved or deleted outside Arclio.')).toBeInTheDocument()
		expect(screen.getByText('A video that got deleted')).toBeInTheDocument()
		expect(screen.queryByRole('button', {name: /remove from library/i})).toBeInTheDocument()
	})

	it('"Remove from library" marks the row DELETED (the sync tombstone), not a hard delete', async () => {
		const api = setup('MISSING')
		renderPlayerPage()

		const removeButton = await screen.findByRole('button', {name: /remove from library/i})
		fireEvent.click(removeButton)

		await vi.waitFor(() => {
			expect(api.library.media.setStatus).toHaveBeenCalledWith('media-1', 'DELETED')
		})
		expect(api.library.media.delete).not.toHaveBeenCalled()
	})
})
