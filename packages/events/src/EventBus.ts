import type {DomainEvent} from './DomainEvents'
import type {EventHandler} from './types'

export class EventBus {
	#handlers = new Map<string, Set<EventHandler>>()

	emit(event: DomainEvent, payload: unknown): void {
		const handlers = this.#handlers.get(event)
		if (!handlers) return
		for (const handler of handlers) {
			handler(payload)
		}
	}

	on(event: DomainEvent, handler: EventHandler): void {
		if (!this.#handlers.has(event)) {
			this.#handlers.set(event, new Set())
		}
		this.#handlers.get(event)!.add(handler)
	}

	off(event: DomainEvent, handler: EventHandler): void {
		this.#handlers.get(event)?.delete(handler)
	}

	removeAllListeners(event?: DomainEvent): void {
		if (event) {
			this.#handlers.delete(event)
		} else {
			this.#handlers.clear()
		}
	}

	listenerCount(event: DomainEvent): number {
		return this.#handlers.get(event)?.size ?? 0
	}
}
