import type {Source} from './types'

type ChangeHandler = (path: string, type: 'add' | 'change' | 'unlink') => void

export class SourceWatcher {
	#handlers: ChangeHandler[] = []
	#watchers: Map<string, {close: () => void}> = new Map()

	on(event: 'change', handler: ChangeHandler): void {
		this.#handlers.push(handler)
	}

	off(handler: ChangeHandler): void {
		const idx = this.#handlers.indexOf(handler)
		if (idx !== -1) this.#handlers.splice(idx, 1)
	}

	watch(source: Source): void {
		if (this.#watchers.has(source.id)) return
		// Stub — would use chokidar in full implementation
		this.#watchers.set(source.id, {close: () => {}})
	}

	unwatch(sourceId: string): void {
		this.#watchers.get(sourceId)?.close()
		this.#watchers.delete(sourceId)
	}

	emit(path: string, type: 'add' | 'change' | 'unlink'): void {
		for (const handler of this.#handlers) {
			handler(path, type)
		}
	}
}
