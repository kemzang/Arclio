import type {ThumbnailCacheEntry} from './types'

export class ThumbnailCache {
	#entries = new Map<string, ThumbnailCacheEntry>()
	#maxSize: number
	#cacheDir: string

	constructor(cacheDir: string, maxSize = 500) {
		this.#cacheDir = cacheDir
		this.#maxSize = maxSize
	}

	get(key: string): ThumbnailCacheEntry | undefined {
		const entry = this.#entries.get(key)
		if (entry) {
			entry.accessedAt = Date.now()
		}
		return entry
	}

	set(entry: ThumbnailCacheEntry): void {
		if (this.#entries.size >= this.#maxSize) {
			this.#evict()
		}
		this.#entries.set(entry.key, entry)
	}

	has(key: string): boolean {
		return this.#entries.has(key)
	}

	delete(key: string): void {
		this.#entries.delete(key)
	}

	clear(): void {
		this.#entries.clear()
	}

	#evict(): void {
		let oldestKey: string | undefined
		let oldestTime = Infinity
		for (const [key, entry] of this.#entries) {
			if (entry.accessedAt < oldestTime) {
				oldestTime = entry.accessedAt
				oldestKey = key
			}
		}
		if (oldestKey) {
			this.#entries.delete(oldestKey)
		}
	}

	get size(): number {
		return this.#entries.size
	}

	get cacheDir(): string {
		return this.#cacheDir
	}
}
