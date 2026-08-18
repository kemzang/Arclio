import {ipcMain} from 'electron'
import type {ThumbnailService} from '@main/services/ThumbnailService.js'

export function registerThumbnailHandlers(thumbnailService: ThumbnailService): void {
	ipcMain.handle('thumbnail:generate', async (_event, mediaId: string, filePath: string, mediaType: string) => {
		return thumbnailService.generate(mediaId, filePath, mediaType)
	})

	ipcMain.handle('thumbnail:get', async (_event, mediaId: string) => {
		return thumbnailService.get(mediaId)
	})

	ipcMain.handle('thumbnail:regenerate', async (_event, mediaId: string, filePath: string, mediaType: string) => {
		return thumbnailService.regenerate(mediaId, filePath, mediaType)
	})

	ipcMain.handle('thumbnail:delete', async (_event, mediaId: string) => {
		return thumbnailService.delete(mediaId)
	})

	ipcMain.handle('thumbnail:getUrl', (_event, mediaId: string) => {
		return thumbnailService.getThumbnailUrl(mediaId)
	})

	ipcMain.removeHandler('thumbnail:clearCache')
	ipcMain.handle('thumbnail:clearCache', async () => {
		return thumbnailService.clearCache()
	})
}
