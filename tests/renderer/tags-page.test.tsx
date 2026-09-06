import {fireEvent, render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {TagsPage} from '@renderer/pages/tags/TagsPage.js'
import {buildMockAppApi} from '../shared/mockAppApi.js'

const tag = {id: 't1', name: 'Favorites', color: '#6366f1', createdAt: '', mediaCount: 2}

function setup() {
	const api = buildMockAppApi()
	api.library.tag.list = vi.fn().mockResolvedValue([tag]) as typeof api.library.tag.list
	api.library.tag.delete = vi.fn().mockResolvedValue(true) as typeof api.library.tag.delete
	Object.defineProperty(window, 'appApi', {value: api, writable: true, configurable: true})
	return api
}

describe('TagsPage', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('regression: deleting a tag requires confirmation before calling the delete IPC', async () => {
		// Previously the X button called handleDelete directly on click — a
		// single accidental click permanently removed the tag from every media
		// item it was applied to.
		const api = setup()
		render(<TagsPage />)

		expect(await screen.findByText('Favorites')).toBeInTheDocument()
		expect(api.library.tag.delete).not.toHaveBeenCalled()

		const deleteButtons = screen.getAllByRole('button').filter(button => button.querySelector(':scope > svg.lucide-x'))
		expect(deleteButtons.length).toBeGreaterThan(0)
		fireEvent.click(deleteButtons[0])

		expect(api.library.tag.delete).not.toHaveBeenCalled()

		const confirmButton = await screen.findByRole('button', {name: 'Delete'})
		fireEvent.click(confirmButton)

		await vi.waitFor(() => {
			expect(api.library.tag.delete).toHaveBeenCalledWith('t1')
		})
	})
})
