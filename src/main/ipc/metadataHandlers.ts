import {ipcMain} from 'electron'
import {z} from 'zod'
import {mediaTypeSchema} from '@shared/schemas.js'
import type {MetadataService} from '@main/services/MetadataService.js'

const filePathSchema = z.string().min(1)
const mediaTypeOptionalSchema = mediaTypeSchema.optional()

export function registerMetadataHandlers(metadataService: MetadataService): void {
	ipcMain.removeHandler('metadata:extract')
	ipcMain.handle('metadata:extract', async (_event, filePath: unknown, mediaType: unknown) => {
		return metadataService.extract(filePathSchema.parse(filePath), mediaTypeOptionalSchema.parse(mediaType))
	})

	ipcMain.removeHandler('metadata:extractAndSave')
	ipcMain.handle('metadata:extractAndSave', async (_event, filePath: unknown, mediaId: unknown, mediaType: unknown) => {
		return metadataService.extractAndSave(filePathSchema.parse(filePath), z.string().min(1).parse(mediaId), mediaTypeOptionalSchema.parse(mediaType))
	})

	ipcMain.removeHandler('metadata:extractBatch')
	ipcMain.handle('metadata:extractBatch', async (_event, filePaths: unknown) => {
		return metadataService.extractBatch(z.array(filePathSchema).max(500).parse(filePaths))
	})
}
