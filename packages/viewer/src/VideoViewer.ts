import type {ViewerConfig, PlaybackState} from './types'
import {PlaybackTracker} from './PlaybackTracker'

export class VideoViewer {
	#config: ViewerConfig
	#tracker: PlaybackTracker

	constructor(config: ViewerConfig = {}, tracker: PlaybackTracker) {
		this.#config = config
		this.#tracker = tracker
	}

	open(mediaId: string): void {
		const _resumePos = this.#tracker.resumePosition(mediaId)
		// Stub — would initialize Plyr video mode
	}

	updateProgress(mediaId: string, position: number, duration: number, isPlaying: boolean): void {
		this.#tracker.track(mediaId, position, duration, isPlaying)
	}

	getState(mediaId: string): PlaybackState | undefined {
		return this.#tracker.getState(mediaId)
	}

	get config(): ViewerConfig {
		return this.#config
	}
}
