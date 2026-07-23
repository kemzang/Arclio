import type {MediaType} from '@arclio/media'

export interface MediaRecord {
	id: string
	path: string
	mediaType: MediaType
	title: string
	fileSize: number
	createdAt: Date
	modifiedAt: Date
	thumbnailPath?: string
	metadata?: Record<string, unknown>
}

export interface IndexingResult {
	indexed: number
	updated: number
	errors: string[]
}
