import {ipcMain} from 'electron'
import {z} from 'zod'
import type {SourcesService} from '@main/services/SourcesService.js'

const pathSchema = z.string().min(1)
const idSchema = z.string().min(1)

export function registerSourcesHandlers(sourcesService: SourcesService): void {
	ipcMain.removeHandler('sources:add')
	ipcMain.handle('sources:add', async (_event, path: unknown, watchEnabled: unknown) => {
		return sourcesService.addSource(pathSchema.parse(path), z.boolean().optional().parse(watchEnabled))
	})

	ipcMain.removeHandler('sources:remove')
	ipcMain.handle('sources:remove', async (_event, id: unknown) => {
		return sourcesService.removeSource(idSchema.parse(id))
	})

	ipcMain.removeHandler('sources:list')
	ipcMain.handle('sources:list', () => {
		return sourcesService.getSources()
	})

	ipcMain.removeHandler('sources:toggleWatch')
	ipcMain.handle('sources:toggleWatch', async (_event, id: unknown, enabled: unknown) => {
		return sourcesService.toggleWatch(idSchema.parse(id), z.boolean().parse(enabled))
	})

	ipcMain.removeHandler('sources:scan')
	ipcMain.handle('sources:scan', async (_event, id: unknown) => {
		return sourcesService.scanSource(idSchema.parse(id))
	})
}
