import {EventBus} from '@arclio/events'

export interface QueueItem {
	id: string
	url: string
	status: 'pending' | 'active' | 'paused' | 'completed' | 'failed'
	priority: number
}

export class QueueApplicationService {
	#events: EventBus
	#items: QueueItem[] = []

	constructor(events: EventBus) {
		this.#events = events
	}

	addItem(item: QueueItem): void {
		this.#items.push(item)
		this.#events.emit('queue:itemAdded', item)
	}

	removeItem(id: string): void {
		this.#items = this.#items.filter(i => i.id !== id)
		this.#events.emit('queue:itemRemoved', {id})
	}

	pauseAll(): void {
		this.#events.emit('queue:paused', {})
	}

	resumeAll(): void {
		this.#events.emit('queue:resumed', {})
	}

	clear(): void {
		this.#items = []
		this.#events.emit('queue:cleared', {})
	}

	getItems(): QueueItem[] {
		return [...this.#items]
	}
}
