import {ipcMain} from 'electron'
import type {MetadataService} from '@main/services/MetadataService.js'

export function registerMetadataHandlers(metadataService: MetadataService): void {
	ipcMain.handle('metadata:extract', async (_event, filePath: string, mediaType?: string) => {
		return metadataService.extract(filePath, mediaType as 'video' | 'audio' | 'document' | 'comic' | 'image' | undefined)
	})

	ipcMain.handle('metadata:extractAndSave', async (_event, filePath: string, mediaId: string, mediaType?: string) => {
		return metadataService.extractAndSave(filePath, mediaId, mediaType as 'video' | 'audio' | 'document' | 'comic' | 'image' | undefined)
	})

	ipcMain.handle('metadata:extractBatch', async (_event, filePaths: string[]) => {
		return metadataService.extractBatch(filePaths)
	})
}
