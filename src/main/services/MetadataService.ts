import {EventEmitter} from 'node:events'
import {access, constants} from 'node:fs/promises'
import {extname} from 'node:path'
import electronLog from 'electron-log/main.js'
import type {MediaMetadata} from '@arclio/metadata'
import {MetadataExtractor} from '@arclio/metadata'
import type {DrizzleDatabase} from '@main/db/connection.js'
import {createMediaRepository} from '@main/db/repositories/mediaRepository.js'
import type {BinaryManager} from '@main/services/BinaryManager.js'

const logger = electronLog.scope('metadata')

type MediaType = 'video' | 'audio' | 'document' | 'comic' | 'image'

const VIDEO_EXTS = new Set(['.mp4', '.mkv', '.webm', '.avi', '.mov', '.flv', '.wmv', '.m4v'])
const AUDIO_EXTS = new Set(['.mp3', '.m4a', '.opus', '.ogg', '.wav', '.flac', '.aac', '.wma'])
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.tif', '.svg', '.avif'])
const DOCUMENT_EXTS = new Set(['.pdf', '.epub', '.doc', '.docx', '.txt', '.rtf', '.odt'])
const COMIC_EXTS = new Set(['.cbz', '.cbr', '.zip', '.rar'])

function inferMediaTypeFromPath(filePath: string): MediaType | null {
	const ext = extname(filePath).toLowerCase()
	if (VIDEO_EXTS.has(ext)) return 'video'
	if (AUDIO_EXTS.has(ext)) return 'audio'
	if (IMAGE_EXTS.has(ext)) return 'image'
	if (DOCUMENT_EXTS.has(ext)) return 'document'
	if (COMIC_EXTS.has(ext)) return 'comic'
	return null
}

export interface MetadataExtractResult {
	success: boolean
	mediaId?: string
	metadata?: MediaMetadata
	filePath?: string
	error?: string
}

export interface MetadataServiceEvents {
	extracted: (event: {mediaId: string; metadata: MediaMetadata}) => void
	failed: (event: {mediaId?: string; filePath: string; error: string}) => void
}

export class MetadataService extends EventEmitter {
	private readonly extractor: MetadataExtractor
	private readonly mediaRepo: ReturnType<typeof createMediaRepository>

	constructor(db: DrizzleDatabase, binaryManager: BinaryManager) {
		super()
		const ffprobePath = binaryManager.getFfprobePath()
		this.extractor = new MetadataExtractor({ffprobePath})
		this.mediaRepo = createMediaRepository(db)
	}

	async extract(filePath: string, mediaType?: MediaType, signal?: AbortSignal): Promise<MediaMetadata> {
		const resolvedType = mediaType ?? inferMediaTypeFromPath(filePath)
		if (!resolvedType) {
			throw new Error(`Cannot infer media type for: ${filePath}`)
		}

		await access(filePath, constants.R_OK)
		logger.info(`Extracting metadata for ${filePath} (type: ${resolvedType})`)

		const metadata = await this.extractor.extract(filePath, resolvedType, signal)
		logger.info(`Metadata extracted: ${JSON.stringify(metadata).slice(0, 200)}...`)
		return metadata
	}

	async extractAndSave(filePath: string, mediaId: string, mediaType?: MediaType, signal?: AbortSignal): Promise<MetadataExtractResult> {
		try {
			const metadata = await this.extract(filePath, mediaType, signal)
			this.mediaRepo.setMetadata(mediaId, metadata as unknown as Record<string, unknown>)

			// Update duration if available
			if (metadata.duration) {
				this.mediaRepo.update(mediaId, {duration: metadata.duration})
			}

			this.emit('extracted', {mediaId, metadata})
			return {success: true, mediaId, metadata}
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error)
			logger.error(`Metadata extraction failed for ${filePath}: ${message}`)
			this.emit('failed', {mediaId, filePath, error: message})
			return {success: false, filePath, error: message}
		}
	}

	async extractBatch(filePaths: string[], signal?: AbortSignal): Promise<MetadataExtractResult[]> {
		const results: MetadataExtractResult[] = []
		for (const filePath of filePaths) {
			const mediaType = inferMediaTypeFromPath(filePath)
			if (!mediaType) {
				results.push({success: false, filePath, error: `Unknown media type for ${filePath}`})
				continue
			}
			try {
				const metadata = await this.extract(filePath, mediaType, signal)
				results.push({success: true, metadata})
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error)
				results.push({success: false, filePath, error: message})
			}
		}
		return results
	}
}
