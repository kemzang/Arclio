import type {MediaMetadata} from './types'
import type {MediaType} from '@arclio/media'

export class MetadataExtractor {
	extract(_filePath: string, mediaType: MediaType): Promise<MediaMetadata> {
		// Stub — delegates to type-specific extractors in full implementation
		return Promise.reject(new Error(`Metadata extraction not implemented for ${mediaType}`))
	}
}
