import {readFile} from 'node:fs/promises'
import {extname} from 'node:path'
import type {QueueService} from './QueueService.js'
import type {ProbeInfoJsonCache} from './ProbeInfoJsonCache.js'
import type {QueueItem, QueueArtifact, QueueArtifactKind} from '@shared/types.js'
import type {DrizzleDatabase} from '../db/connection.js'
import {createMediaRepository} from '../db/repositories/mediaRepository.js'
import {createAssetRepository} from '../db/repositories/assetRepository.js'
import {createDownloadHistoryRepository} from '../db/repositories/downloadHistoryRepository.js'
import electronLog from 'electron-log'

const logger = electronLog.scope('library-importer')

interface ProbeInfoMeta {
	uploader?: string
	channel?: string
	creator?: string
	artist?: string
	description?: string
	duration?: number
	extractor?: string
	extractor_key?: string
}

export class LibraryImporter {
	private readonly mediaRepo: ReturnType<typeof createMediaRepository>
	private readonly assetRepo: ReturnType<typeof createAssetRepository>
	private readonly downloadHistoryRepo: ReturnType<typeof createDownloadHistoryRepository>
	private readonly processedItems = new Set<string>()

	constructor(
		db: DrizzleDatabase,
		private readonly queueService: QueueService,
		private readonly probeInfoJsonCache?: ProbeInfoJsonCache
	) {
		this.mediaRepo = createMediaRepository(db)
		this.assetRepo = createAssetRepository(db)
		this.downloadHistoryRepo = createDownloadHistoryRepository(db)

		this.queueService.on('updated', ({item}: {item: QueueItem}) => {
			if (item.status === 'done') {
				void this.handleDownloadCompleted(item)
			}
		})

		logger.info('LibraryImporter initialized')
	}

	private async handleDownloadCompleted(item: QueueItem): Promise<void> {
		// Deduplicate: only process once per item
		if (this.processedItems.has(item.id)) return
		this.processedItems.add(item.id)

		try {
			// Read probe info for metadata (author, description, duration)
			const probeMeta = await this.readProbeMeta(item)

			// Determine media type from artifacts
			const mediaType = this.inferMediaType(item.artifacts)

			// Extract source key from URL
			const sourceKey = this.extractSourceKey(item.url)
			const sourceType = this.inferSourceType(item.url)

			// Create Media
			const mediaRecord = this.mediaRepo.create({
				title: item.title,
				author: probeMeta?.uploader ?? probeMeta?.channel ?? probeMeta?.creator ?? probeMeta?.artist ?? null,
				description: probeMeta?.description ?? null,
				url: item.url,
				sourceKey,
				sourceType,
				duration: probeMeta?.duration ?? null,
				mediaType,
				thumbnailUrl: item.thumbnail || null,
				thumbnailPath: null,
				status: 'AVAILABLE',
				isFavorite: 0,
				createdBy: 'DOWNLOAD',
				downloadDate: item.finishedAt ?? new Date().toISOString()
			})

			// Create Assets from artifacts
			const mediaArtifacts = item.artifacts.filter(a => !a.internal && !a.missing)

			for (const artifact of mediaArtifacts) {
				const assetKind = this.mapArtifactKind(artifact.kind)
				this.assetRepo.create({mediaId: mediaRecord.id, kind: assetKind, path: artifact.path, fileName: artifact.fileName, sizeBytes: artifact.sizeBytes ?? null, mimeType: this.inferMimeType(artifact.fileName), status: 'AVAILABLE'})
			}

			// Record in download history
			this.downloadHistoryRepo.create({url: item.url, outputDir: item.outputDir, mediaId: mediaRecord.id, status: 'completed', formatId: item.job.kind === 'single-format' ? item.job.formatId : undefined, durationMs: null, finishedAt: item.finishedAt ?? new Date().toISOString()})

			logger.info('Media created from download', {mediaId: mediaRecord.id, title: mediaRecord.title, assetCount: mediaArtifacts.length})
		} catch (error) {
			logger.error('Failed to create media from download', {itemId: item.id, error: error instanceof Error ? error.message : String(error)})

			// Still record in download history as failed
			this.downloadHistoryRepo.create({url: item.url, outputDir: item.outputDir, status: 'failed', errorKind: 'import_error', errorRaw: error instanceof Error ? error.message : String(error), finishedAt: item.finishedAt ?? new Date().toISOString()})
		}
	}

	private async readProbeMeta(item: QueueItem): Promise<ProbeInfoMeta | null> {
		if (!this.probeInfoJsonCache || !item.probeInfoJsonRef) return null

		try {
			const filePath = await this.probeInfoJsonCache.resolve(item.probeInfoJsonRef)
			if (!filePath) return null

			const content = await readFile(filePath, 'utf-8')
			const data = JSON.parse(content) as ProbeInfoMeta
			return {uploader: data.uploader, channel: data.channel, creator: data.creator, artist: data.artist, description: data.description, duration: data.duration, extractor: data.extractor, extractor_key: data.extractor_key}
		} catch {
			return null
		}
	}

	private inferMediaType(artifacts: QueueArtifact[]): 'video' | 'audio' {
		const videoExts = new Set(['.mp4', '.mkv', '.webm', '.avi', '.mov', '.flv', '.wmv'])
		const audioExts = new Set(['.mp3', '.m4a', '.opus', '.ogg', '.wav', '.flac', '.aac'])

		for (const artifact of artifacts) {
			if (artifact.kind !== 'media' || artifact.internal) continue
			const ext = extname(artifact.fileName).toLowerCase()
			if (videoExts.has(ext)) return 'video'
			if (audioExts.has(ext)) return 'audio'
		}

		return 'video' // default
	}

	extractSourceKey(url: string): string | null {
		try {
			const parsed = new URL(url)
			const hostname = parsed.hostname.toLowerCase()

			// YouTube
			if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
				const videoId = parsed.searchParams.get('v')
				if (videoId) return `youtube:${videoId}`
				// youtu.be/ID format
				const pathId = parsed.pathname.slice(1)
				if (pathId && hostname.includes('youtu.be')) return `youtube:${pathId}`
			}

			// Vimeo
			if (hostname.includes('vimeo.com')) {
				const pathId = parsed.pathname.split('/').filter(Boolean).pop()
				if (pathId) return `vimeo:${pathId}`
			}

			// Twitch
			if (hostname.includes('twitch.tv')) {
				const pathId = parsed.pathname.split('/').filter(Boolean).pop()
				if (pathId) return `twitch:${pathId}`
			}

			// TikTok
			if (hostname.includes('tiktok.com')) {
				const pathId = parsed.pathname.split('/').filter(Boolean).pop()
				if (pathId) return `tiktok:${pathId}`
			}

			// Instagram
			if (hostname.includes('instagram.com')) {
				const pathId = parsed.pathname.split('/').filter(Boolean).pop()
				if (pathId) return `instagram:${pathId}`
			}

			return null
		} catch {
			return null
		}
	}

	private inferSourceType(url: string): string {
		try {
			const hostname = new URL(url).hostname.toLowerCase()
			if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) return 'YOUTUBE'
			if (hostname.includes('vimeo.com')) return 'VIMEO'
			if (hostname.includes('twitch.tv')) return 'TWITCH'
			if (hostname.includes('tiktok.com')) return 'TIKTOK'
			if (hostname.includes('instagram.com')) return 'INSTAGRAM'
			return 'UNKNOWN'
		} catch {
			return 'UNKNOWN'
		}
	}

	private mapArtifactKind(kind: QueueArtifactKind): string {
		switch (kind) {
			case 'media':
				return 'video' // refined by mime type in asset creation
			case 'subtitle':
				return 'subtitle'
			case 'thumbnail':
				return 'thumbnail'
			case 'description':
				return 'other'
			case 'companion':
				return 'other'
			default:
				return 'other'
		}
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
			'.srt': 'application/x-subrip',
			'.vtt': 'text/vtt',
			'.ass': 'text/x-ssa',
			'.jpg': 'image/jpeg',
			'.jpeg': 'image/jpeg',
			'.png': 'image/png',
			'.webp': 'image/webp'
		}
		return mimeMap[ext] ?? null
	}
}
