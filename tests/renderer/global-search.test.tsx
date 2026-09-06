import {fireEvent, render, screen} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {GlobalSearch} from '@renderer/components/search/GlobalSearch.js'
import {buildMockAppApi} from '../shared/mockAppApi.js'

function setup() {
	const api = buildMockAppApi()
	Object.defineProperty(window, 'appApi', {value: api, writable: true, configurable: true})
	return api
}

describe('GlobalSearch', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('regression: a slower, earlier query does not overwrite a faster, newer one', async () => {
		// Reproduces the race: typing "abc", pausing past the debounce so a
		// search kicks off, then typing more before that search resolves used
		// to let the stale first response land after — and overwrite — the
		// second, correct one, since neither request was ever cancelled.
		const api = setup()
		let resolveFirst!: (value: unknown[]) => void
		const firstSearch = new Promise<unknown[]>(resolve => {
			resolveFirst = resolve
		})

		let call = 0
		api.library.media.search = vi.fn(() => {
			call += 1
			return call === 1 ? firstSearch : Promise.resolve([{id: 'm2', title: 'Second Result', author: null}])
		}) as typeof api.library.media.search

		render(
			<MemoryRouter>
				<GlobalSearch />
			</MemoryRouter>
		)

		const input = screen.getByPlaceholderText(/search/i)
		fireEvent.change(input, {target: {value: 'abc'}})
		// Let the 200ms debounce fire the first (slow) search.
		await new Promise(resolve => setTimeout(resolve, 250))

		fireEvent.change(input, {target: {value: 'abcd'}})
		// Let the debounce fire the second (fast) search, which resolves
		// immediately — its results should now be showing.
		await new Promise(resolve => setTimeout(resolve, 250))

		expect(await screen.findByText('Second Result')).toBeInTheDocument()

		// The slow first request finally resolves — it must not clobber the
		// newer, already-displayed results.
		resolveFirst([{id: 'm1', title: 'First Result', author: null}])
		await new Promise(resolve => setTimeout(resolve, 50))

		expect(screen.getByText('Second Result')).toBeInTheDocument()
		expect(screen.queryByText('First Result')).not.toBeInTheDocument()
	})
})
