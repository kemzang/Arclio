import {EventEmitter} from 'node:events'
import {access, constants} from 'node:fs/promises'
import {extname} from 'node:path'
import electronLog from 'electron-log/main.js'
import type {DrizzleDatabase} from '@main/db/connection.js'
import {createMediaRepository} from '@main/db/repositories/mediaRepository.js'
import {createAssetRepository} from '@main/db/repositories/assetRepository.js'
import type {MetadataService} from '@main/services/MetadataService.js'
import type {ThumbnailService} from '@main/services/ThumbnailService.js'

const logger = electronLog.scope('indexer')

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

export interface IndexerResult {
	success: boolean
	mediaId?: string
	error?: string
}

export class IndexerService extends EventEmitter {
	private readonly mediaRepo: ReturnType<typeof createMediaRepository>
	private readonly assetRepo: ReturnType<typeof createAssetRepository>
	private readonly metadataService?: MetadataService
	private readonly thumbnailService?: ThumbnailService

	constructor(
		private readonly db: DrizzleDatabase,
		options?: {metadataService?: MetadataService; thumbnailService?: ThumbnailService}
	) {
		super()
		this.mediaRepo = createMediaRepository(db)
		this.assetRepo = createAssetRepository(db)
		this.metadataService = options?.metadataService
		this.thumbnailService = options?.thumbnailService
	}

	async indexFile(filePath: string, options?: {title?: string; sourceKey?: string}): Promise<IndexerResult> {
		try {
			await access(filePath, constants.R_OK)

			const mediaType = inferMediaTypeFromPath(filePath)
			if (!mediaType) {
				return {success: false, error: `Unknown media type for ${filePath}`}
			}

			// Check if file already exists in library. This must be an exact
			// path lookup, not a media_fts search — media_fts indexes
			// title/author/description, not the file path, so searching it
			// with a raw filesystem path was both semantically wrong (it could
			// only ever match by coincidence) and, on Windows paths containing
			// `:` or on paths with other FTS5 operator characters, a syntax
			// error the search would previously throw on.
			const existingAsset = this.assetRepo.getByPath(filePath)
			if (existingAsset) {
				logger.info(`File already indexed: ${filePath}`)
				return {success: true, mediaId: existingAsset.mediaId}
			}

			const title = options?.title ?? basename(filePath)
			const now = new Date().toISOString()

			// Media + its asset must land atomically — see LibraryImporter's
			// handleDownloadCompleted for the same rationale: a failure between
			// the two inserts must not leave a media row with no asset.
			const media = this.db.transaction(() => {
				const record = this.mediaRepo.create({title, author: null, description: null, url: `file://${filePath}`, sourceKey: options?.sourceKey ?? null, sourceType: 'LOCAL', duration: null, mediaType, thumbnailUrl: null, thumbnailPath: null, status: 'AVAILABLE', isFavorite: 0, createdBy: 'IMPORT', downloadDate: now})
				this.assetRepo.create({mediaId: record.id, kind: 'media', path: filePath, fileName: basename(filePath), sizeBytes: null, mimeType: this.inferMimeType(filePath), status: 'AVAILABLE'})
				return record
			})

			logger.info(`File indexed: ${filePath} -> ${media.id}`)
			this.emit('indexed', {mediaId: media.id, title, mediaType, path: filePath})

			// Extract metadata asynchronously
			if (this.metadataService) {
				this.metadataService.extractAndSave(filePath, media.id, mediaType).catch((err: unknown) => logger.error('Metadata extraction failed during indexing', {mediaId: media.id, error: err instanceof Error ? err.message : String(err)}))
			}

			// Generate thumbnail asynchronously
			if (this.thumbnailService) {
				this.thumbnailService
					.generate(media.id, filePath, mediaType)
					.then(result => {
						if (result.success && result.thumbnailPath) {
							this.mediaRepo.update(media.id, {thumbnailPath: result.thumbnailPath})
						}
					})
					.catch((err: unknown) => logger.error('Thumbnail generation failed during indexing', {mediaId: media.id, error: err instanceof Error ? err.message : String(err)}))
			}

			return {success: true, mediaId: media.id}
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error)
			logger.error(`Indexing failed for ${filePath}: ${message}`)
			this.emit('failed', {path: filePath, error: message})
			return {success: false, error: message}
		}
	}

	async indexFiles(filePaths: string[], options?: {onProgress?: (current: number, total: number) => void}): Promise<IndexerResult[]> {
		const results: IndexerResult[] = []
		const total = filePaths.length

		for (let i = 0; i < filePaths.length; i++) {
			const filePath = filePaths[i]
			options?.onProgress?.(i + 1, total)
			this.emit('progress', {current: i + 1, total, path: filePath})

			const result = await this.indexFile(filePath)
			results.push(result)
		}

		return results
	}

	private inferMimeType(fileName: string): string | null {
		const ext = extname(fileName).toLowerCase()
		const mimeMap: Record<string, string> = {
			'.mp4': 'video/mp4',
			'.mkv': 'video/x-matroska',
			'.webm': 'video/webm',
			'.avi': 'video/x-msvideo',
			'.mov': 'video/quicktime',
			'.mp3': 'audio/mpeg',
			'.m4a': 'audio/mp4',
			'.opus': 'audio/opus',
			'.ogg': 'audio/ogg',
			'.wav': 'audio/wav',
			'.flac': 'audio/flac',
			'.pdf': 'application/pdf',
			'.jpg': 'image/jpeg',
			'.jpeg': 'image/jpeg',
			'.png': 'image/png',
			'.webp': 'image/webp',
			'.cbz': 'application/zip',
			'.cbr': 'application/vnd.rar'
		}
		return mimeMap[ext] ?? null
	}
}

function basename(filePath: string): string {
	return filePath.split('/').pop() ?? filePath
}
