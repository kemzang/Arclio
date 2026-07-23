import type {HistoryEntry} from './types'

export class HistoryService {
	#history: HistoryEntry[] = []
	#maxSize = 1000

	record(mediaId: string, action: HistoryEntry['action'], details?: Record<string, unknown>): void {
		const entry: HistoryEntry = {id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, mediaId, action, timestamp: new Date(), details}
		this.#history.unshift(entry)
		if (this.#history.length > this.#maxSize) {
			this.#history.pop()
		}
	}

	getForMedia(mediaId: string): HistoryEntry[] {
		return this.#history.filter(e => e.mediaId === mediaId)
	}

	getRecent(limit = 50): HistoryEntry[] {
		return this.#history.slice(0, limit)
	}

	clear(): void {
		this.#history = []
	}
}
