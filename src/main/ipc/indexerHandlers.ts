import {ipcMain} from 'electron'
import {z} from 'zod'
import type {IndexerService} from '@main/services/IndexerService.js'

const filePathSchema = z.string().min(1)
const indexOptionsSchema = z.object({title: z.string().optional(), sourceKey: z.string().optional()}).optional()

export function registerIndexerHandlers(indexerService: IndexerService): void {
	ipcMain.removeHandler('indexer:indexFile')
	ipcMain.handle('indexer:indexFile', async (_event, filePath: unknown, options: unknown) => {
		return indexerService.indexFile(filePathSchema.parse(filePath), indexOptionsSchema.parse(options))
	})

	ipcMain.removeHandler('indexer:indexFiles')
	ipcMain.handle('indexer:indexFiles', async (_event, filePaths: unknown) => {
		return indexerService.indexFiles(z.array(filePathSchema).max(2000).parse(filePaths))
	})
}
