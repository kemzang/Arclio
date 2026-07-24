import {EventEmitter} from 'node:events'
import {extname} from 'node:path'
import electronLog from 'electron-log/main.js'
import chokidar from 'chokidar'
import type {IndexerService} from '@main/services/IndexerService.js'

const logger = electronLog.scope('sources')

const WATCHED_EXTENSIONS = new Set([
	'.mp4',
	'.mkv',
	'.webm',
	'.avi',
	'.mov',
	'.flv',
	'.wmv',
	'.m4v',
	'.mp3',
	'.m4a',
	'.opus',
	'.ogg',
	'.wav',
	'.flac',
	'.aac',
	'.wma',
	'.pdf',
	'.epub',
	'.doc',
	'.docx',
	'.txt',
	'.rtf',
	'.odt',
	'.cbz',
	'.cbr',
	'.zip',
	'.rar',
	'.jpg',
	'.jpeg',
	'.png',
	'.gif',
	'.webp',
	'.bmp',
	'.tiff',
	'.tif',
	'.svg',
	'.avif'
])

export interface WatchedSource {
	id: string
	path: string
	watchEnabled: boolean
	createdAt: string
}

export interface SourceEvents {
	fileAdded: (event: {sourceId: string; path: string; mediaId?: string}) => void
	fileRemoved: (event: {sourceId: string; path: string}) => void
	fileChanged: (event: {sourceId: string; path: string}) => void
	error: (event: {sourceId: string; error: string}) => void
}

export class SourcesService extends EventEmitter {
	private readonly watchers = new Map<string, chokidar.FSWatcher>()
	private readonly sources = new Map<string, WatchedSource>()
	private readonly indexerService: IndexerService
	private readonly debounceTimers = new Map<string, NodeJS.Timeout>()

	constructor(indexerService: IndexerService) {
		super()
		this.indexerService = indexerService
	}

	async addSource(path: string, watchEnabled = true): Promise<WatchedSource> {
		const id = `source_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
		const source: WatchedSource = {id, path, watchEnabled, createdAt: new Date().toISOString()}
		this.sources.set(id, source)

		if (watchEnabled) {
			await this.startWatcher(source)
		}

		logger.info(`Source added: ${path} (${id})`)
		return source
	}

	async removeSource(id: string): Promise<void> {
		const source = this.sources.get(id)
		if (!source) return

		await this.stopWatcher(id)
		this.sources.delete(id)
		logger.info(`Source removed: ${source.path} (${id})`)
	}

	async toggleWatch(id: string, enabled: boolean): Promise<void> {
		const source = this.sources.get(id)
		if (!source) return

		source.watchEnabled = enabled
		if (enabled) {
			await this.startWatcher(source)
		} else {
			await this.stopWatcher(id)
		}
		logger.info(`Watch ${enabled ? 'enabled' : 'disabled'} for ${source.path}`)
	}

	async scanSource(id: string): Promise<{indexed: number; errors: number}> {
		const source = this.sources.get(id)
		if (!source) return {indexed: 0, errors: 0}

		const fs = await import('node:fs/promises')
		const {readdirRecursive} = await import('./sourceUtils.js')
		const files = await readdirRecursive(source.path)
		const mediaFiles = files.filter(f => WATCHED_EXTENSIONS.has(extname(f).toLowerCase()))

		let indexed = 0
		let errors = 0

		for (const file of mediaFiles) {
			const result = await this.indexerService.indexFile(file, {sourceKey: id})
			if (result.success) {
				indexed++
				this.emit('fileAdded', {sourceId: id, path: file, mediaId: result.mediaId})
			} else {
				errors++
				logger.warn(`Failed to index ${file}: ${result.error}`)
			}
		}

		logger.info(`Scanned ${source.path}: ${indexed} indexed, ${errors} errors`)
		return {indexed, errors}
	}

	getSources(): WatchedSource[] {
		return Array.from(this.sources.values())
	}

	private async startWatcher(source: WatchedSource): Promise<void> {
		await this.stopWatcher(source.id)

		const watcher = chokidar.watch(source.path, {ignored: /(^|[/\\])\../, persistent: true, ignoreInitial: true, awaitWriteFinish: {stabilityThreshold: 2000, pollInterval: 100}})

		watcher.on('add', filePath => {
			if (!WATCHED_EXTENSIONS.has(extname(filePath).toLowerCase())) return

			// Debounce to avoid indexing files still being copied
			const key = `add:${filePath}`
			const existing = this.debounceTimers.get(key)
			if (existing) clearTimeout(existing)

			const timer = setTimeout(async () => {
				this.debounceTimers.delete(key)
				const result = await this.indexerService.indexFile(filePath, {sourceKey: source.id})
				if (result.success) {
					this.emit('fileAdded', {sourceId: source.id, path: filePath, mediaId: result.mediaId})
				} else {
					this.emit('error', {sourceId: source.id, error: result.error ?? 'Unknown error'})
				}
			}, 2000)
			this.debounceTimers.set(key, timer)
		})

		watcher.on('unlink', filePath => {
			if (!WATCHED_EXTENSIONS.has(extname(filePath).toLowerCase())) return
			this.emit('fileRemoved', {sourceId: source.id, path: filePath})
		})

		watcher.on('change', filePath => {
			if (!WATCHED_EXTENSIONS.has(extname(filePath).toLowerCase())) return

			const key = `change:${filePath}`
			const existing = this.debounceTimers.get(key)
			if (existing) clearTimeout(existing)

			const timer = setTimeout(() => {
				this.debounceTimers.delete(key)
				this.emit('fileChanged', {sourceId: source.id, path: filePath})
			}, 2000)
			this.debounceTimers.set(key, timer)
		})

		watcher.on('error', error => {
			this.emit('error', {sourceId: source.id, error: error.message})
		})

		this.watchers.set(source.id, watcher)
		logger.info(`Watcher started for ${source.path}`)
	}

	private async stopWatcher(id: string): Promise<void> {
		const watcher = this.watchers.get(id)
		if (watcher) {
			await watcher.close()
			this.watchers.delete(id)
			logger.info(`Watcher stopped for source ${id}`)
		}
	}

	async dispose(): Promise<void> {
		for (const [id] of this.watchers) {
			await this.stopWatcher(id)
		}
		for (const [, timer] of this.debounceTimers) {
			clearTimeout(timer)
		}
		this.debounceTimers.clear()
	}
}
