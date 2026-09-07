import {ipcMain} from 'electron'
import {IPC_CHANNELS} from '@shared/ipc.js'
import type {SyncScheduler} from '@main/services/SyncScheduler.js'
import type {AccountService} from '@main/services/AccountService.js'

export function registerSyncHandlers(scheduler: SyncScheduler, accountService: AccountService): void {
	ipcMain.removeHandler(IPC_CHANNELS.syncNow)
	ipcMain.handle(IPC_CHANNELS.syncNow, async () => {
		const outcome = await scheduler.runNow()
		// Best-effort: the plan can change server-side (upgrade/downgrade)
		// independently of sync itself, so piggyback the refresh on the same
		// round-trip cadence rather than adding a separate poll.
		void accountService.refreshPlan()
		return outcome
	})

	ipcMain.removeHandler(IPC_CHANNELS.syncState)
	ipcMain.handle(IPC_CHANNELS.syncState, () => scheduler.state())
}
