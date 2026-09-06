import {fireEvent, render, screen} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {CollectionsPage} from '@renderer/pages/collections/CollectionsPage.js'
import {buildMockAppApi} from '../shared/mockAppApi.js'

const collection = {id: 'c1', name: 'Old Name', description: null, icon: null, color: null, sortOrder: 0, mediaCount: 3, coverThumbnailUrl: null, createdAt: '', updatedAt: ''}

function setup() {
	const api = buildMockAppApi()
	api.library.collection.list = vi.fn().mockResolvedValue([collection]) as typeof api.library.collection.list
	api.library.collection.update = vi.fn().mockResolvedValue({...collection, name: 'New Name'}) as typeof api.library.collection.update
	api.library.collection.delete = vi.fn().mockResolvedValue(undefined) as typeof api.library.collection.delete
	Object.defineProperty(window, 'appApi', {value: api, writable: true, configurable: true})
	return api
}

describe('CollectionsPage', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('regression: the Edit button lets a collection be renamed, instead of only stopping propagation', async () => {
		// Previously the Edit button's onClick was just `e => e.stopPropagation()`
		// — no handler, no edit UI, nothing happened.
		const api = setup()
		render(
			<MemoryRouter>
				<CollectionsPage />
			</MemoryRouter>
		)

		expect(await screen.findByText('Old Name')).toBeInTheDocument()

		// `:scope > svg` restricts to a *direct* child match — the outer card
		// also has `role="button"` and contains the edit icon as a descendant,
		// so a plain `querySelector` would wrongly match the card too.
		const editButtons = screen.getAllByRole('button').filter(button => button.querySelector(':scope > svg.lucide-pen'))
		expect(editButtons.length).toBeGreaterThan(0)
		fireEvent.click(editButtons[0])

		const input = await screen.findByDisplayValue('Old Name')
		fireEvent.change(input, {target: {value: 'New Name'}})
		fireEvent.keyDown(input, {key: 'Enter'})

		await vi.waitFor(() => {
			expect(api.library.collection.update).toHaveBeenCalledWith('c1', {name: 'New Name'})
		})
	})

	it('regression: deleting a collection requires confirmation before calling the delete IPC', async () => {
		// Previously the Trash button called handleDelete directly on click — a
		// single accidental click permanently removed the collection.
		const api = setup()
		render(
			<MemoryRouter>
				<CollectionsPage />
			</MemoryRouter>
		)

		expect(await screen.findByText('Old Name')).toBeInTheDocument()

		const deleteButtons = screen.getAllByRole('button').filter(button => button.querySelector(':scope > svg.lucide-trash2'))
		expect(deleteButtons.length).toBeGreaterThan(0)
		fireEvent.click(deleteButtons[0])

		expect(api.library.collection.delete).not.toHaveBeenCalled()

		const confirmButton = await screen.findByRole('button', {name: 'Delete'})
		fireEvent.click(confirmButton)

		await vi.waitFor(() => {
			expect(api.library.collection.delete).toHaveBeenCalledWith('c1')
		})
	})
})
