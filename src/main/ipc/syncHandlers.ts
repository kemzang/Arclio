import {ipcMain} from 'electron'
import {IPC_CHANNELS} from '@shared/ipc.js'
import type {SyncScheduler} from '@main/services/SyncScheduler.js'

export function registerSyncHandlers(scheduler: SyncScheduler): void {
	ipcMain.removeHandler(IPC_CHANNELS.syncNow)
	ipcMain.handle(IPC_CHANNELS.syncNow, async () => scheduler.runNow())

	ipcMain.removeHandler(IPC_CHANNELS.syncState)
	ipcMain.handle(IPC_CHANNELS.syncState, () => scheduler.state())
}
