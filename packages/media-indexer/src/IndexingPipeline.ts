import path from 'node:path'
import type {MediaRecord} from './types'
import {resolveMediaType} from '@arclio/media'

function getExtension(filePath: string): string {
	return path.extname(filePath).replace('.', '').toLowerCase()
}

export class IndexingPipeline {
	process(filePath: string): Promise<MediaRecord> {
		const ext = getExtension(filePath)
		const mediaType = resolveMediaType(ext)

		return Promise.resolve({id: this.#generateId(filePath), path: filePath, mediaType, title: path.basename(filePath, path.extname(filePath)), fileSize: 0, createdAt: new Date(), modifiedAt: new Date()})
	}

	#generateId(filePath: string): string {
		return Buffer.from(filePath).toString('base64url')
	}
}
