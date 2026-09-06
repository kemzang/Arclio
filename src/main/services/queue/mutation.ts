import type {QueueEvent} from '@shared/queueTransition.js'
import type {QueueItem} from '@shared/types.js'

// Discriminated union covering every shape a mutation can take. QueueService's
// commit() is the only writer; new mutation kinds add a case here (compile-checked
// in commit's exhaustive switch) instead of inventing a new helper.
export type Mutation = {kind: 'add'; items: QueueItem[]} | {kind: 'event'; itemId: string; evt: QueueEvent} | {kind: 'patch'; itemId: string; patcher: (item: QueueItem) => QueueItem; reason: string} | {kind: 'remove'; itemId: string}

export function describeMutation(m: Mutation): string {
	switch (m.kind) {
		case 'add':
			return `add[${m.items.length}]`
		case 'event':
			return `event[${m.itemId}:${m.evt.kind}]`
		case 'patch':
			return `patch[${m.itemId}:${m.reason}]`
		case 'remove':
			return `remove[${m.itemId}]`
	}
}
