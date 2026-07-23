import {app, BrowserWindow, ipcMain} from 'electron'
import {Arclio} from '@arclio/core'

let mainWindow: BrowserWindow | null = null
let arclio: Arclio | null = null

function createWindow(): void {
	mainWindow = new BrowserWindow({width: 900, height: 760, minWidth: 720, minHeight: 680, webPreferences: {preload: new URL('../preload/index.cjs', import.meta.url).pathname, contextIsolation: true, nodeIntegration: false}})

	if (process.env.NODE_ENV === 'development') {
		void mainWindow.loadURL('http://localhost:5173')
	} else {
		void mainWindow.loadFile(new URL('../renderer/index.html', import.meta.url).pathname)
	}
}

function initArclio(): void {
	arclio = new Arclio({})

	arclio.events.on('download:completed', payload => {
		mainWindow?.webContents.send('arclio:download:completed', payload)
	})

	arclio.events.on('download:progress', payload => {
		mainWindow?.webContents.send('arclio:download:progress', payload)
	})

	arclio.system.ready()
}

void app.whenReady().then(() => {
	initArclio()
	createWindow()

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow()
		}
	})
})

app.on('window-all-closed', () => {
	arclio?.system.shutdown()
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

// IPC handlers — ultra-lightweight, delegate to Arclio Core
ipcMain.handle('arclio:downloads:start', (_event, input) => arclio?.downloads.start(input as {url: string; outputDir: string}))
ipcMain.handle('arclio:downloads:pause', (_event, id) => arclio?.downloads.pause(id as string))
ipcMain.handle('arclio:downloads:resume', (_event, id) => arclio?.downloads.resume(id as string))
ipcMain.handle('arclio:downloads:cancel', (_event, id) => arclio?.downloads.cancel(id as string))

ipcMain.handle('arclio:queue:add', (_event, item) => arclio?.queue.addItem(item as {id: string; url: string; status: string; priority: number}))
ipcMain.handle('arclio:queue:remove', (_event, id) => arclio?.queue.removeItem(id as string))
ipcMain.handle('arclio:queue:pauseAll', () => arclio?.queue.pauseAll())
ipcMain.handle('arclio:queue:resumeAll', () => arclio?.queue.resumeAll())
ipcMain.handle('arclio:queue:getItems', () => arclio?.queue.getItems())

ipcMain.handle('arclio:library:scan', (_event, path) => arclio?.library.scan(path as string))
ipcMain.handle('arclio:library:import', (_event, mediaId) => arclio?.library.importMedia(mediaId as string))

ipcMain.handle('arclio:viewer:open', (_event, mediaId) => arclio?.viewer.open(mediaId as string))

ipcMain.handle('arclio:converter:run', (_event, input) => arclio?.converter.run(input as {sourcePath: string; outputPath: string; format: string}))
ipcMain.handle('arclio:converter:runChain', (_event, chain, file) => arclio?.converter.runChain(chain, file as string))

ipcMain.handle('arclio:sources:scan', (_event, sourceId) => arclio?.sources.scan(sourceId as string))

ipcMain.handle('arclio:search:search', (_event, query) => arclio?.search.search(query as {text: string}))

ipcMain.handle('arclio:collections:create', (_event, input) => arclio?.collections.create(input as {name: string; description?: string; itemIds: string[]}))

ipcMain.handle('arclio:favorites:add', (_event, mediaId) => arclio?.favorites.add(mediaId as string))
ipcMain.handle('arclio:favorites:remove', (_event, mediaId) => arclio?.favorites.remove(mediaId as string))
ipcMain.handle('arclio:favorites:isFavorite', (_event, mediaId) => arclio?.favorites.isFavorite(mediaId as string))

ipcMain.handle('arclio:history:record', (_event, mediaId, action) => arclio?.history.record(mediaId as string, action as string))
ipcMain.handle('arclio:history:getRecent', (_event, limit) => arclio?.history.getRecent(limit as number | undefined))

ipcMain.handle('arclio:tags:create', (_event, name, color) => arclio?.tags.create(name as string, color as string | undefined))
ipcMain.handle('arclio:tags:tagItem', (_event, itemId, tagId) => arclio?.tags.tagItem(itemId as string, tagId as string))
ipcMain.handle('arclio:tags:untagItem', (_event, itemId, tagId) => arclio?.tags.untagItem(itemId as string, tagId as string))
