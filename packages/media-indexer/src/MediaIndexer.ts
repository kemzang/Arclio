import type {IndexingResult} from './types'
import {FolderScanner} from './FolderScanner'
import {IndexingPipeline} from './IndexingPipeline'

export class MediaIndexer {
	#scanner = new FolderScanner()
	#pipeline = new IndexingPipeline()

	async index(folderPath: string): Promise<IndexingResult> {
		const files = await this.#scanner.scan(folderPath)
		let indexed = 0
		const errors: string[] = []

		for (const file of files) {
			try {
				await this.#pipeline.process(file)
				indexed++
			} catch (e) {
				errors.push(`${file}: ${String(e)}`)
			}
		}

		return {indexed, updated: 0, errors}
	}
}
