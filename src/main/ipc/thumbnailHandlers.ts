import {ipcMain} from 'electron'
import {z} from 'zod'
import {mediaTypeSchema} from '@shared/schemas.js'
import type {ThumbnailService} from '@main/services/ThumbnailService.js'

const idSchema = z.string().min(1)
const filePathSchema = z.string().min(1)

export function registerThumbnailHandlers(thumbnailService: ThumbnailService): void {
	ipcMain.removeHandler('thumbnail:generate')
	ipcMain.handle('thumbnail:generate', async (_event, mediaId: unknown, filePath: unknown, mediaType: unknown) => {
		return thumbnailService.generate(idSchema.parse(mediaId), filePathSchema.parse(filePath), mediaTypeSchema.parse(mediaType))
	})

	ipcMain.removeHandler('thumbnail:get')
	ipcMain.handle('thumbnail:get', async (_event, mediaId: unknown) => {
		return thumbnailService.get(idSchema.parse(mediaId))
	})

	ipcMain.removeHandler('thumbnail:regenerate')
	ipcMain.handle('thumbnail:regenerate', async (_event, mediaId: unknown, filePath: unknown, mediaType: unknown) => {
		return thumbnailService.regenerate(idSchema.parse(mediaId), filePathSchema.parse(filePath), mediaTypeSchema.parse(mediaType))
	})

	ipcMain.removeHandler('thumbnail:delete')
	ipcMain.handle('thumbnail:delete', async (_event, mediaId: unknown) => {
		return thumbnailService.delete(idSchema.parse(mediaId))
	})

	ipcMain.removeHandler('thumbnail:getUrl')
	ipcMain.handle('thumbnail:getUrl', (_event, mediaId: unknown) => {
		return thumbnailService.getThumbnailUrl(idSchema.parse(mediaId))
	})

	ipcMain.removeHandler('thumbnail:clearCache')
	ipcMain.handle('thumbnail:clearCache', async () => {
		return thumbnailService.clearCache()
	})
}
