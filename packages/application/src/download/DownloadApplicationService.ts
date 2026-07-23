import {EventBus} from '@arclio/events'

export interface DownloadInput {
	url: string
	outputDir: string
}

export class DownloadApplicationService {
	#events: EventBus

	constructor(events: EventBus) {
		this.#events = events
	}

	start(input: DownloadInput): Promise<void> {
		this.#events.emit('download:started', input)
		// Stub
		return Promise.resolve()
	}

	pause(id: string): Promise<void> {
		this.#events.emit('download:paused', {id})
		return Promise.resolve()
	}

	resume(id: string): Promise<void> {
		this.#events.emit('download:resumed', {id})
		return Promise.resolve()
	}

	cancel(id: string): Promise<void> {
		this.#events.emit('download:cancelled', {id})
		return Promise.resolve()
	}
}
