import {EventBus} from '@arclio/events'

export interface SourceConfig {
	id: string
	name: string
	path: string
	type: string
}

export class SourcesApplicationService {
	#events: EventBus
	#sources = new Map<string, SourceConfig>()

	constructor(events: EventBus) {
		this.#events = events
	}

	register(source: SourceConfig): void {
		this.#sources.set(source.id, source)
	}

	scan(sourceId: string): Promise<void> {
		this.#events.emit('source:scanStarted', {sourceId})
		// Stub
		this.#events.emit('source:scanCompleted', {sourceId})
		return Promise.resolve()
	}
}
