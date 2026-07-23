import type {ReadingMode} from './types'
import {ArchiveExtractor} from './ArchiveExtractor'

export class ComicViewer {
	#extractor = new ArchiveExtractor()
	#currentMode: ReadingMode = 'page-by-page'

	open(archivePath: string): Promise<string[]> {
		if (!this.#extractor.isSupported(archivePath)) {
			throw new Error(`Unsupported archive format: ${archivePath}`)
		}
		// Stub
		return Promise.resolve([])
	}

	setMode(mode: ReadingMode): void {
		this.#currentMode = mode
	}

	getMode(): ReadingMode {
		return this.#currentMode
	}
}
