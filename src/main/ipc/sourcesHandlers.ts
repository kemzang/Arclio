import {ipcMain} from 'electron'
import type {SourcesService} from '@main/services/SourcesService.js'

export function registerSourcesHandlers(sourcesService: SourcesService): void {
	ipcMain.handle('sources:add', async (_event, path: string, watchEnabled?: boolean) => {
		return sourcesService.addSource(path, watchEnabled)
	})

	ipcMain.handle('sources:remove', async (_event, id: string) => {
		return sourcesService.removeSource(id)
	})

	ipcMain.handle('sources:list', () => {
		return sourcesService.getSources()
	})

	ipcMain.handle('sources:toggleWatch', async (_event, id: string, enabled: boolean) => {
		return sourcesService.toggleWatch(id, enabled)
	})

	ipcMain.handle('sources:scan', async (_event, id: string) => {
		return sourcesService.scanSource(id)
	})
}
