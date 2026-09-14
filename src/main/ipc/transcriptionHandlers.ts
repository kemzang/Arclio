import {z} from 'zod'
import {IPC_CHANNELS} from '@shared/ipc.js'
import {ok} from '@shared/result.js'
import type {TranscriptionService} from '@main/services/TranscriptionService.js'
import {handle} from './utils.js'

const itemIdSchema = z.object({itemId: z.string()})

export function registerTranscriptionHandlers(transcriptionService: TranscriptionService): void {
	handle(IPC_CHANNELS.transcriptionStart, itemIdSchema, ({itemId}) => {
		// Fire-and-forget: TranscriptionService.start() never throws (it reports
		// its own failures via 'progress' events), and a run can take minutes —
		// the renderer follows along through onProgress rather than this promise.
		void transcriptionService.start(itemId)
		return Promise.resolve(ok(undefined))
	})

	handle(IPC_CHANNELS.transcriptionCancel, itemIdSchema, ({itemId}) => {
		transcriptionService.cancel(itemId)
		return Promise.resolve(ok(undefined))
	})
}
