import {describe, expect, it} from 'vitest'
import {isQueueDrainEvent, shouldShowQueueDrainUpsell} from '@renderer/store/wizard/queueDrainUpsell.js'
import type {QueueItem} from '@shared/types.js'

function item(status: QueueItem['status']): QueueItem {
	return {id: `id-${status}`, status} as QueueItem
}

describe('isQueueDrainEvent', () => {
	it('is true when the last active item leaves the queue', () => {
		expect(isQueueDrainEvent([item('running')], [item('done')])).toBe(true)
	})

	it('is false while the queue was already empty of active items', () => {
		expect(isQueueDrainEvent([item('done')], [item('done'), item('done')])).toBe(false)
	})

	it('is false while an active item remains', () => {
		expect(isQueueDrainEvent([item('running'), item('pending')], [item('done'), item('pending')])).toBe(false)
	})

	it('treats paused-held and paused-active as active', () => {
		expect(isQueueDrainEvent([item('paused-held')], [])).toBe(true)
		expect(isQueueDrainEvent([item('paused-active')], [])).toBe(true)
	})
})

describe('shouldShowQueueDrainUpsell', () => {
	it('shows for a free plan on a real drain, not yet shown this session', () => {
		expect(shouldShowQueueDrainUpsell({drained: true, plan: 'free', alreadyShownThisSession: false})).toBe(true)
	})

	it('does not show when not actually a drain event', () => {
		expect(shouldShowQueueDrainUpsell({drained: false, plan: 'free', alreadyShownThisSession: false})).toBe(false)
	})

	it('does not show for a pro plan', () => {
		expect(shouldShowQueueDrainUpsell({drained: true, plan: 'pro', alreadyShownThisSession: false})).toBe(false)
	})

	it('does not show when the plan is unknown (never fetched)', () => {
		expect(shouldShowQueueDrainUpsell({drained: true, plan: undefined, alreadyShownThisSession: false})).toBe(false)
	})

	it('does not show twice in the same session', () => {
		expect(shouldShowQueueDrainUpsell({drained: true, plan: 'free', alreadyShownThisSession: true})).toBe(false)
	})
})
