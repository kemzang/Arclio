import type {Result} from '@shared/result.js'

interface ShutdownQueueService {
	cancel: (itemId: string | null) => Promise<Result<unknown>>
}

interface ShutdownTokenService {
	dispose: () => void
}

export interface FinishShutdownDeps {
	tokenService: ShutdownTokenService
	logInfo: (message: string, meta?: Record<string, unknown>) => void
	exit: (code: number) => void
}

export interface CancelQueueBeforeExitDeps extends FinishShutdownDeps {
	queueService: ShutdownQueueService
}

function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error)
}

// Common tail of every shutdown path: dispose shared resources, then exit.
// Shared by cancelQueueBeforeExit below and by the "let in-flight
// pause/cancel settle on their own" path in index.ts's before-quit handler
// (which awaits DownloadService.waitUntilIdle() first, then calls this).
export function finishShutdown({tokenService, logInfo, exit}: FinishShutdownDeps): void {
	tokenService.dispose()
	logInfo('App shutting down')
	exit(0)
}

export async function cancelQueueBeforeExit({queueService, tokenService, logInfo, exit}: CancelQueueBeforeExitDeps): Promise<void> {
	try {
		const result = await queueService.cancel(null)
		if (!result.ok) {
			logInfo('Queue cancellation before shutdown failed', {error: result.error.message})
		}
	} catch (error) {
		logInfo('Queue cancellation before shutdown failed', {error: errorMessage(error)})
	}
	finishShutdown({tokenService, logInfo, exit})
}
