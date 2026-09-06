import type {QueueItem} from '@shared/types.js'

// Diagnostic helper — used for logging. Kept inline (not stripped under
// NODE_ENV) so post-mortem of a user log file is possible without a
// dedicated dev build.
export function computeStatusSummary(items: QueueItem[], spawningSize: number, schedulerPaused: boolean): Record<string, number> {
	const counts: Record<string, number> = {}
	for (const item of items) {
		const key = `${item.status}:${item.lane}`
		counts[key] = (counts[key] ?? 0) + 1
	}
	counts.spawning = spawningSize
	counts.paused = schedulerPaused ? 1 : 0
	return counts
}
