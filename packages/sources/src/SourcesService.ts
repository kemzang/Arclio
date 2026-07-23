import type {Source, SourceScanResult} from './types'
import {FolderSource} from './FolderSource'

export class SourcesService {
	#sources = new Map<string, Source>()
	#folderSource = new FolderSource()

	register(source: Source): void {
		this.#sources.set(source.id, source)
	}

	unregister(sourceId: string): void {
		this.#sources.delete(sourceId)
	}

	list(): Source[] {
		return Array.from(this.#sources.values())
	}

	async scan(sourceId: string): Promise<SourceScanResult> {
		const source = this.#sources.get(sourceId)
		if (!source) throw new Error(`Source ${sourceId} not found`)
		const files = await this.#folderSource.scan(source.path)
		return {sourceId, files, errors: [], scannedAt: new Date()}
	}
}
