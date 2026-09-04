import {ipcMain} from 'electron'
import {z} from 'zod'
import {IPC_CHANNELS} from '@shared/ipc.js'
import {mediaStatusSchema, mediaSortBySchema} from '@shared/schemas.js'
import type {DrizzleDatabase} from '@main/db/connection.js'
import {createMediaRepository} from '@main/db/repositories/mediaRepository.js'
import {createCollectionRepository} from '@main/db/repositories/collectionRepository.js'
import {createTagRepository} from '@main/db/repositories/tagRepository.js'
import {createPlaybackRepository} from '@main/db/repositories/playbackRepository.js'
import {createDownloadHistoryRepository} from '@main/db/repositories/downloadHistoryRepository.js'

const idSchema = z.string().min(1)
const nameSchema = z.string().min(1).max(200)

const mediaListFiltersSchema = z
	.object({
		search: z.string().min(1).optional(),
		mediaType: z.enum(['video', 'audio', 'document', 'comic', 'image']).optional(),
		status: z.string().optional(),
		isFavorite: z.boolean().optional(),
		sourceType: z.string().optional(),
		collectionId: z.string().optional(),
		tagId: z.string().optional(),
		sortBy: mediaSortBySchema.optional(),
		sortOrder: z.enum(['asc', 'desc']).optional(),
		limit: z.number().int().positive().optional(),
		offset: z.number().int().nonnegative().optional()
	})
	.optional()

const collectionDataSchema = z.object({name: nameSchema, description: z.string().optional(), icon: z.string().optional(), color: z.string().optional()})
const collectionUpdateSchema = collectionDataSchema.partial()
const tagDataSchema = z.object({name: nameSchema, color: z.string().optional()})
const tagUpdateSchema = tagDataSchema.partial()
const downloadHistoryOptionsSchema = z.object({status: z.string().optional(), limit: z.number().int().positive().optional(), offset: z.number().int().nonnegative().optional()}).optional()

// better-sqlite3 throws a raw Error with a SQLITE_CONSTRAINT* `code` on a
// UNIQUE/FOREIGN KEY violation — e.g. creating a tag whose name already
// exists, or linking a media/collection/tag id that doesn't exist. Left
// unhandled, the renderer sees that raw driver message instead of an
// actionable one.
function isConstraintError(err: unknown): boolean {
	return err instanceof Error && 'code' in err && typeof (err as {code?: unknown}).code === 'string' && (err as {code: string}).code.startsWith('SQLITE_CONSTRAINT')
}

function friendlyConstraintMessage(context: string, err: unknown): Error {
	if (isConstraintError(err)) return new Error(`${context}: value already exists or references a missing record`)
	return err instanceof Error ? err : new Error(String(err))
}

// Every handler is (re)registered idempotently (removeHandler first) and
// validates its payload before it reaches a repository — these repos call
// straight into better-sqlite3 with no validation of their own, so an
// invalid enum value (status, mediaType, sortBy) or a raw SQL constraint
// violation used to reach the renderer as an unhandled rejection carrying
// internal driver/query detail instead of a clear, expected error.
export function registerLibraryHandlers(db: DrizzleDatabase): void {
	const mediaRepo = createMediaRepository(db)
	const collectionRepo = createCollectionRepository(db)
	const tagRepo = createTagRepository(db)
	const playbackRepo = createPlaybackRepository(db)
	const downloadHistoryRepo = createDownloadHistoryRepository(db)

	// ── Media ──────────────────────────────────────────────────────────────────

	ipcMain.removeHandler(IPC_CHANNELS.libraryMediaList)
	ipcMain.handle(IPC_CHANNELS.libraryMediaList, (_event, filters: unknown) => mediaRepo.list(mediaListFiltersSchema.parse(filters)))

	ipcMain.removeHandler(IPC_CHANNELS.libraryMediaGet)
	ipcMain.handle(IPC_CHANNELS.libraryMediaGet, (_event, id: unknown) => mediaRepo.getById(idSchema.parse(id)))

	ipcMain.removeHandler(IPC_CHANNELS.libraryMediaSearch)
	ipcMain.handle(IPC_CHANNELS.libraryMediaSearch, (_event, query: unknown, limit: unknown) => mediaRepo.search(z.string().parse(query), z.number().int().positive().optional().parse(limit)))

	ipcMain.removeHandler(IPC_CHANNELS.libraryMediaSetFavorite)
	ipcMain.handle(IPC_CHANNELS.libraryMediaSetFavorite, (_event, id: unknown, isFavorite: unknown) => mediaRepo.setFavorite(idSchema.parse(id), z.boolean().parse(isFavorite)))

	ipcMain.removeHandler(IPC_CHANNELS.libraryMediaSetStatus)
	ipcMain.handle(IPC_CHANNELS.libraryMediaSetStatus, (_event, id: unknown, status: unknown) => mediaRepo.setStatus(idSchema.parse(id), mediaStatusSchema.parse(status)))

	ipcMain.removeHandler(IPC_CHANNELS.libraryMediaDelete)
	ipcMain.handle(IPC_CHANNELS.libraryMediaDelete, (_event, id: unknown) => mediaRepo.delete(idSchema.parse(id)))

	ipcMain.removeHandler(IPC_CHANNELS.libraryMediaCount)
	ipcMain.handle(IPC_CHANNELS.libraryMediaCount, () => mediaRepo.count())

	ipcMain.removeHandler(IPC_CHANNELS.libraryMediaCountByStatus)
	ipcMain.handle(IPC_CHANNELS.libraryMediaCountByStatus, () => mediaRepo.countByStatus())

	// ── Collection ─────────────────────────────────────────────────────────────

	ipcMain.removeHandler(IPC_CHANNELS.libraryCollectionList)
	ipcMain.handle(IPC_CHANNELS.libraryCollectionList, () => collectionRepo.list())

	ipcMain.removeHandler(IPC_CHANNELS.libraryCollectionGet)
	ipcMain.handle(IPC_CHANNELS.libraryCollectionGet, (_event, id: unknown) => collectionRepo.getById(idSchema.parse(id)))

	ipcMain.removeHandler(IPC_CHANNELS.libraryCollectionCreate)
	ipcMain.handle(IPC_CHANNELS.libraryCollectionCreate, (_event, data: unknown) => {
		try {
			return collectionRepo.create(collectionDataSchema.parse(data))
		} catch (err) {
			throw friendlyConstraintMessage('Collection creation failed', err)
		}
	})

	ipcMain.removeHandler(IPC_CHANNELS.libraryCollectionUpdate)
	ipcMain.handle(IPC_CHANNELS.libraryCollectionUpdate, (_event, id: unknown, data: unknown) => collectionRepo.update(idSchema.parse(id), collectionUpdateSchema.parse(data)))

	ipcMain.removeHandler(IPC_CHANNELS.libraryCollectionDelete)
	ipcMain.handle(IPC_CHANNELS.libraryCollectionDelete, (_event, id: unknown) => collectionRepo.delete(idSchema.parse(id)))

	ipcMain.removeHandler(IPC_CHANNELS.libraryCollectionAddMedia)
	ipcMain.handle(IPC_CHANNELS.libraryCollectionAddMedia, (_event, collectionId: unknown, mediaId: unknown) => {
		try {
			collectionRepo.addMedia(idSchema.parse(collectionId), idSchema.parse(mediaId))
		} catch (err) {
			throw friendlyConstraintMessage('Adding media to collection failed', err)
		}
	})

	ipcMain.removeHandler(IPC_CHANNELS.libraryCollectionRemoveMedia)
	ipcMain.handle(IPC_CHANNELS.libraryCollectionRemoveMedia, (_event, collectionId: unknown, mediaId: unknown) => collectionRepo.removeMedia(idSchema.parse(collectionId), idSchema.parse(mediaId)))

	ipcMain.removeHandler(IPC_CHANNELS.libraryCollectionGetMediaIds)
	ipcMain.handle(IPC_CHANNELS.libraryCollectionGetMediaIds, (_event, collectionId: unknown) => collectionRepo.getMediaIds(idSchema.parse(collectionId)))

	ipcMain.removeHandler(IPC_CHANNELS.libraryCollectionGetForMedia)
	ipcMain.handle(IPC_CHANNELS.libraryCollectionGetForMedia, (_event, mediaId: unknown) => collectionRepo.getCollectionIdsForMedia(idSchema.parse(mediaId)))

	// ── Tag ────────────────────────────────────────────────────────────────────

	ipcMain.removeHandler(IPC_CHANNELS.libraryTagList)
	ipcMain.handle(IPC_CHANNELS.libraryTagList, () => tagRepo.list())

	ipcMain.removeHandler(IPC_CHANNELS.libraryTagCreate)
	ipcMain.handle(IPC_CHANNELS.libraryTagCreate, (_event, data: unknown) => {
		try {
			return tagRepo.create(tagDataSchema.parse(data))
		} catch (err) {
			throw friendlyConstraintMessage('Tag creation failed', err)
		}
	})

	ipcMain.removeHandler(IPC_CHANNELS.libraryTagUpdate)
	ipcMain.handle(IPC_CHANNELS.libraryTagUpdate, (_event, id: unknown, data: unknown) => {
		try {
			return tagRepo.update(idSchema.parse(id), tagUpdateSchema.parse(data))
		} catch (err) {
			throw friendlyConstraintMessage('Tag update failed', err)
		}
	})

	ipcMain.removeHandler(IPC_CHANNELS.libraryTagDelete)
	ipcMain.handle(IPC_CHANNELS.libraryTagDelete, (_event, id: unknown) => tagRepo.delete(idSchema.parse(id)))

	ipcMain.removeHandler(IPC_CHANNELS.libraryTagAddToMedia)
	ipcMain.handle(IPC_CHANNELS.libraryTagAddToMedia, (_event, tagId: unknown, mediaId: unknown) => {
		try {
			tagRepo.addToMedia(idSchema.parse(tagId), idSchema.parse(mediaId))
		} catch (err) {
			throw friendlyConstraintMessage('Adding tag to media failed', err)
		}
	})

	ipcMain.removeHandler(IPC_CHANNELS.libraryTagRemoveFromMedia)
	ipcMain.handle(IPC_CHANNELS.libraryTagRemoveFromMedia, (_event, tagId: unknown, mediaId: unknown) => tagRepo.removeFromMedia(idSchema.parse(tagId), idSchema.parse(mediaId)))

	ipcMain.removeHandler(IPC_CHANNELS.libraryTagGetForMedia)
	ipcMain.handle(IPC_CHANNELS.libraryTagGetForMedia, (_event, mediaId: unknown) => tagRepo.getTagsForMedia(idSchema.parse(mediaId)))

	ipcMain.removeHandler(IPC_CHANNELS.libraryTagGetMediaIds)
	ipcMain.handle(IPC_CHANNELS.libraryTagGetMediaIds, (_event, tagId: unknown) => tagRepo.getMediaIdsForTag(idSchema.parse(tagId)))

	// ── Playback History ───────────────────────────────────────────────────────

	ipcMain.removeHandler(IPC_CHANNELS.libraryPlaybackUpdatePosition)
	ipcMain.handle(IPC_CHANNELS.libraryPlaybackUpdatePosition, (_event, mediaId: unknown, position: unknown, duration: unknown) => playbackRepo.updatePosition(idSchema.parse(mediaId), z.number().nonnegative().parse(position), z.number().nonnegative().parse(duration)))

	ipcMain.removeHandler(IPC_CHANNELS.libraryPlaybackGetByMedia)
	ipcMain.handle(IPC_CHANNELS.libraryPlaybackGetByMedia, (_event, mediaId: unknown) => playbackRepo.getByMediaId(idSchema.parse(mediaId)))

	ipcMain.removeHandler(IPC_CHANNELS.libraryPlaybackListRecent)
	ipcMain.handle(IPC_CHANNELS.libraryPlaybackListRecent, (_event, limit: unknown) => playbackRepo.listRecent(z.number().int().positive().optional().parse(limit)))

	// ── Download History ───────────────────────────────────────────────────────

	ipcMain.removeHandler(IPC_CHANNELS.libraryDownloadHistoryList)
	ipcMain.handle(IPC_CHANNELS.libraryDownloadHistoryList, (_event, options: unknown) => downloadHistoryRepo.list(downloadHistoryOptionsSchema.parse(options)))

	ipcMain.removeHandler(IPC_CHANNELS.libraryDownloadHistoryCount)
	ipcMain.handle(IPC_CHANNELS.libraryDownloadHistoryCount, () => downloadHistoryRepo.count())

	ipcMain.removeHandler(IPC_CHANNELS.libraryDownloadHistoryCountByStatus)
	ipcMain.handle(IPC_CHANNELS.libraryDownloadHistoryCountByStatus, () => downloadHistoryRepo.countByStatus())
}
