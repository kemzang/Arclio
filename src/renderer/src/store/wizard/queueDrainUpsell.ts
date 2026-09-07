import {QUEUE_STATUS} from '@shared/schemas.js'
import type {QueueItem, QueueItemStatus} from '@shared/types.js'

const ACTIVE_STATUSES = new Set<QueueItemStatus>([QUEUE_STATUS.pending, QUEUE_STATUS.running, QUEUE_STATUS.pausedHeld, QUEUE_STATUS.pausedActive])

function hasActive(queue: QueueItem[]): boolean {
	return queue.some(item => ACTIVE_STATUSES.has(item.status))
}

/** True the instant the last active item leaves the queue — not while it's still empty. */
export function isQueueDrainEvent(prevQueue: QueueItem[], nextQueue: QueueItem[]): boolean {
	return hasActive(prevQueue) && !hasActive(nextQueue)
}

/**
 * Gates the Spotify-style upgrade nudge shown once a batch finishes: only for
 * free accounts, only on an actual drain, and at most once per app session so
 * finishing several small batches in a row doesn't spam it.
 */
export function shouldShowQueueDrainUpsell(input: {drained: boolean; plan: 'free' | 'pro' | undefined; alreadyShownThisSession: boolean}): boolean {
	if (!input.drained || input.alreadyShownThisSession) return false
	return input.plan === 'free'
}
