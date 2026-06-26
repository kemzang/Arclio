import {ipcMain} from 'electron'
import type {DrizzleDatabase} from '@main/db/connection.js'
import {createMediaRepository} from '@main/db/repositories/mediaRepository.js'
import {createCollectionRepository} from '@main/db/repositories/collectionRepository.js'
import {createTagRepository} from '@main/db/repositories/tagRepository.js'
import {createPlaybackRepository} from '@main/db/repositories/playbackRepository.js'
import {createDownloadHistoryRepository} from '@main/db/repositories/downloadHistoryRepository.js'
import type {MediaListFilters} from '@main/db/repositories/mediaRepository.js'

export function registerLibraryHandlers(db: DrizzleDatabase): void {
	const mediaRepo = createMediaRepository(db)
	const collectionRepo = createCollectionRepository(db)
	const tagRepo = createTagRepository(db)
	const playbackRepo = createPlaybackRepository(db)
	const downloadHistoryRepo = createDownloadHistoryRepository(db)

	// ── Media ──────────────────────────────────────────────────────────────────

	ipcMain.handle('library:media:list', (_event, filters?: MediaListFilters) => {
		return mediaRepo.list(filters)
	})

	ipcMain.handle('library:media:get', (_event, id: string) => {
		return mediaRepo.getById(id)
	})

	ipcMain.handle('library:media:search', (_event, query: string, limit?: number) => {
		return mediaRepo.search(query, limit)
	})

	ipcMain.handle('library:media:setFavorite', (_event, id: string, isFavorite: boolean) => {
		mediaRepo.setFavorite(id, isFavorite)
	})

	ipcMain.handle('library:media:setStatus', (_event, id: string, status: string) => {
		mediaRepo.setStatus(id, status as 'AVAILABLE' | 'MISSING' | 'CORRUPTED' | 'DELETED')
	})

	ipcMain.handle('library:media:delete', (_event, id: string) => {
		return mediaRepo.delete(id)
	})

	ipcMain.handle('library:media:count', () => {
		return mediaRepo.count()
	})

	ipcMain.handle('library:media:countByStatus', () => {
		return mediaRepo.countByStatus()
	})

	// ── Collection ─────────────────────────────────────────────────────────────

	ipcMain.handle('library:collection:list', () => {
		return collectionRepo.list()
	})

	ipcMain.handle('library:collection:get', (_event, id: string) => {
		return collectionRepo.getById(id)
	})

	ipcMain.handle('library:collection:create', (_event, data: {name: string; description?: string; icon?: string; color?: string}) => {
		return collectionRepo.create(data)
	})

	ipcMain.handle('library:collection:update', (_event, id: string, data: {name?: string; description?: string; icon?: string; color?: string}) => {
		return collectionRepo.update(id, data)
	})

	ipcMain.handle('library:collection:delete', (_event, id: string) => {
		return collectionRepo.delete(id)
	})

	ipcMain.handle('library:collection:addMedia', (_event, collectionId: string, mediaId: string) => {
		collectionRepo.addMedia(collectionId, mediaId)
	})

	ipcMain.handle('library:collection:removeMedia', (_event, collectionId: string, mediaId: string) => {
		collectionRepo.removeMedia(collectionId, mediaId)
	})

	ipcMain.handle('library:collection:getMediaIds', (_event, collectionId: string) => {
		return collectionRepo.getMediaIds(collectionId)
	})

	ipcMain.handle('library:collection:getForMedia', (_event, mediaId: string) => {
		return collectionRepo.getCollectionIdsForMedia(mediaId)
	})

	// ── Tag ────────────────────────────────────────────────────────────────────

	ipcMain.handle('library:tag:list', () => {
		return tagRepo.list()
	})

	ipcMain.handle('library:tag:create', (_event, data: {name: string; color?: string}) => {
		return tagRepo.create(data)
	})

	ipcMain.handle('library:tag:update', (_event, id: string, data: {name?: string; color?: string}) => {
		return tagRepo.update(id, data)
	})

	ipcMain.handle('library:tag:delete', (_event, id: string) => {
		return tagRepo.delete(id)
	})

	ipcMain.handle('library:tag:addToMedia', (_event, tagId: string, mediaId: string) => {
		tagRepo.addToMedia(tagId, mediaId)
	})

	ipcMain.handle('library:tag:removeFromMedia', (_event, tagId: string, mediaId: string) => {
		tagRepo.removeFromMedia(tagId, mediaId)
	})

	ipcMain.handle('library:tag:getForMedia', (_event, mediaId: string) => {
		return tagRepo.getTagsForMedia(mediaId)
	})

	ipcMain.handle('library:tag:getMediaIds', (_event, tagId: string) => {
		return tagRepo.getMediaIdsForTag(tagId)
	})

	// ── Playback History ───────────────────────────────────────────────────────

	ipcMain.handle('library:playback:updatePosition', (_event, mediaId: string, position: number, duration: number) => {
		playbackRepo.updatePosition(mediaId, position, duration)
	})

	ipcMain.handle('library:playback:getByMedia', (_event, mediaId: string) => {
		return playbackRepo.getByMediaId(mediaId)
	})

	ipcMain.handle('library:playback:listRecent', (_event, limit?: number) => {
		return playbackRepo.listRecent(limit)
	})

	// ── Download History ───────────────────────────────────────────────────────

	ipcMain.handle('library:downloadHistory:list', (_event, options?: {status?: string; limit?: number; offset?: number}) => {
		return downloadHistoryRepo.list(options)
	})

	ipcMain.handle('library:downloadHistory:count', () => {
		return downloadHistoryRepo.count()
	})

	ipcMain.handle('library:downloadHistory:countByStatus', () => {
		return downloadHistoryRepo.countByStatus()
	})
}
