import {EventBus} from '@arclio/events'

export class LibraryApplicationService {
	#events: EventBus

	constructor(events: EventBus) {
		this.#events = events
	}

	scan(folderPath: string): Promise<void> {
		this.#events.emit('library:scanStarted', {folderPath})
		// Stub
		this.#events.emit('library:scanCompleted', {folderPath})
		return Promise.resolve()
	}

	importMedia(mediaId: string): Promise<void> {
		this.#events.emit('library:updated', {mediaId})
		return Promise.resolve()
	}
}
