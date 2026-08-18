import {ipcMain} from 'electron'
import type {ArchiveService} from '@main/services/ArchiveService.js'

export function registerArchiveHandlers(archiveService: ArchiveService): void {
	ipcMain.removeHandler('archive:listPages')
	ipcMain.handle('archive:listPages', async (_event, archivePath: string) => {
		return archiveService.listPages(archivePath)
	})

	ipcMain.removeHandler('archive:readPage')
	ipcMain.handle('archive:readPage', async (_event, archivePath: string, entryName: string) => {
		return archiveService.readPage(archivePath, entryName)
	})

	ipcMain.removeHandler('archive:close')
	ipcMain.handle('archive:close', _event => {
		archiveService.close()
	})
}
