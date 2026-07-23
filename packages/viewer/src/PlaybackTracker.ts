import type {PlaybackState} from './types'

export class PlaybackTracker {
	#states = new Map<string, PlaybackState>()

	track(mediaId: string, position: number, duration: number, isPlaying: boolean): void {
		this.#states.set(mediaId, {mediaId, position, duration, progress: duration > 0 ? position / duration : 0, isPlaying})
	}

	getState(mediaId: string): PlaybackState | undefined {
		return this.#states.get(mediaId)
	}

	resumePosition(mediaId: string): number {
		return this.#states.get(mediaId)?.position ?? 0
	}

	clear(mediaId: string): void {
		this.#states.delete(mediaId)
	}

	clearAll(): void {
		this.#states.clear()
	}
}
