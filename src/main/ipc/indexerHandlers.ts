import {ipcMain} from 'electron'
import type {IndexerService} from '@main/services/IndexerService.js'

export function registerIndexerHandlers(indexerService: IndexerService): void {
	ipcMain.handle('indexer:indexFile', async (_event, filePath: string, options?: {title?: string; sourceKey?: string}) => {
		return indexerService.indexFile(filePath, options)
	})

	ipcMain.handle('indexer:indexFiles', async (_event, filePaths: string[]) => {
		return indexerService.indexFiles(filePaths)
	})
}
