import type {BrowserWindow} from 'electron'
import {IPC_CHANNELS} from '@shared/ipc.js'
import type {TranscriptionProgress} from '@shared/types.js'
import type {TranscriptionService} from './TranscriptionService.js'

export class TranscriptionEventBridge {
	private onProgress?: (event: TranscriptionProgress) => void

	constructor(
		private readonly transcriptionService: TranscriptionService,
		private readonly window: BrowserWindow
	) {}

	attach(): void {
		if (this.onProgress) this.transcriptionService.off('progress', this.onProgress)

		this.onProgress = event => {
			if (this.window.isDestroyed()) return
			this.window.webContents.send(IPC_CHANNELS.transcriptionProgress, event)
		}

		this.transcriptionService.on('progress', this.onProgress)
	}

	detach(): void {
		if (this.onProgress) this.transcriptionService.off('progress', this.onProgress)
		this.onProgress = undefined
	}
}
