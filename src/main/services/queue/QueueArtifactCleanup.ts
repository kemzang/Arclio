import log from 'electron-log/main.js'
import type {QueueItem} from '@shared/types.js'
import {QueueResumeLifecycle} from '../download/QueueResumeLifecycle.js'
import type {ProbeInfoJsonCache} from '../ProbeInfoJsonCache.js'

const logger = log.scope('queue')

// Best-effort cleanup of on-disk artifacts (resume context, cached probe
// info-json) tied to a queue item leaving the queue (cancel/remove/clear).
// Failures are logged, never surfaced — the item is going away regardless.
export class QueueArtifactCleanup {
	constructor(private readonly probeInfoJsonCache?: ProbeInfoJsonCache) {}

	async cleanupResumeContext(item: QueueItem): Promise<void> {
		try {
			await QueueResumeLifecycle.cleanupResumeContext(item)
		} catch (err) {
			logger.warn('resume-context cleanup failed', {itemId: item.id, error: err instanceof Error ? err.message : String(err)})
		}
	}

	async cleanupProbeInfoJson(item: QueueItem): Promise<void> {
		if (!item.probeInfoJsonRef) return
		try {
			await this.probeInfoJsonCache?.delete(item.probeInfoJsonRef)
		} catch (err) {
			logger.warn('probe info-json cleanup failed', {itemId: item.id, error: err instanceof Error ? err.message : String(err)})
		}
	}

	async cleanupAll(item: QueueItem): Promise<void> {
		await this.cleanupResumeContext(item)
		await this.cleanupProbeInfoJson(item)
	}
}
