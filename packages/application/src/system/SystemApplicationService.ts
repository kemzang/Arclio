import {EventBus} from '@arclio/events'

export class SystemApplicationService {
	#events: EventBus

	constructor(events: EventBus) {
		this.#events = events
	}

	ready(): void {
		this.#events.emit('system:ready', {})
	}

	shutdown(): void {
		this.#events.emit('system:shutdown', {})
	}

	reportError(error: Error): void {
		this.#events.emit('system:error', {message: error.message, stack: error.stack})
	}
}
