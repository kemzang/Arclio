import type {PlaylistItem} from './types'

export class PlaylistEngine {
	#queue: PlaylistItem[] = []
	#currentIndex = 0
	#shuffle = false
	#repeat: 'none' | 'one' | 'all' = 'none'
	#originalOrder: PlaylistItem[] = []

	setQueue(items: PlaylistItem[]): void {
		this.#queue = [...items]
		this.#originalOrder = [...items]
		this.#currentIndex = 0
	}

	next(): PlaylistItem | undefined {
		if (this.#currentIndex < this.#queue.length - 1) {
			this.#currentIndex++
		} else if (this.#repeat === 'all') {
			this.#currentIndex = 0
		}
		return this.#queue[this.#currentIndex]
	}

	previous(): PlaylistItem | undefined {
		if (this.#currentIndex > 0) {
			this.#currentIndex--
		}
		return this.#queue[this.#currentIndex]
	}

	current(): PlaylistItem | undefined {
		return this.#queue[this.#currentIndex]
	}

	shuffle(): void {
		this.#shuffle = true
		for (let i = this.#queue.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1))
			;[this.#queue[i], this.#queue[j]] = [this.#queue[j], this.#queue[i]]
		}
	}

	unshuffle(): void {
		this.#shuffle = false
		this.#queue = [...this.#originalOrder]
	}

	setRepeat(mode: 'none' | 'one' | 'all'): void {
		this.#repeat = mode
	}

	getQueue(): PlaylistItem[] {
		return [...this.#queue]
	}

	get currentIndex(): number {
		return this.#currentIndex
	}

	get length(): number {
		return this.#queue.length
	}

	get isShuffled(): boolean {
		return this.#shuffle
	}
}
