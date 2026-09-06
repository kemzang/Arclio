import {describe, expect, it, vi} from 'vitest'
import {measureQueueRowElement} from '@renderer/components/queue/measureQueueRowElement.js'

function mockElement(height: number): Element {
	const el = document.createElement('tr')
	vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({height} as DOMRect)
	return el
}

describe('measureQueueRowElement', () => {
	it('measures just the row when it is not expanded', () => {
		const row = mockElement(62)
		expect(measureQueueRowElement(row)).toBe(62)
	})

	it('regression: includes the sibling artifacts row height when the item is expanded', () => {
		// Previously the virtualizer only measured the ref'd row node, so an
		// expanded item's extra QueueArtifactsRow sibling was invisible to it —
		// offsets fell out of sync with the real DOM and produced a visible
		// jump/overlap on scroll.
		const tbody = document.createElement('tbody')
		const row = mockElement(62)
		const artifactsRow = mockElement(140)
		artifactsRow.setAttribute('data-queue-artifacts-row', 'true')
		tbody.appendChild(row)
		tbody.appendChild(artifactsRow)

		expect(measureQueueRowElement(row)).toBe(202)
	})

	it('does not include an unrelated next sibling', () => {
		const tbody = document.createElement('tbody')
		const row = mockElement(62)
		const padding = mockElement(20)
		tbody.appendChild(row)
		tbody.appendChild(padding)

		expect(measureQueueRowElement(row)).toBe(62)
	})
})
