import log from 'electron-log/main.js'
import type {SyncOutcome, SyncState} from '@shared/api.js'
import type {SyncService} from '@main/services/SyncService.js'

const logger = log.scope('sync')

/** Quiet enough to be invisible, frequent enough that a second device feels live. */
const SYNC_INTERVAL_MS = 15 * 60 * 1000

/**
 * Decides when a sync round runs.
 *
 * Kept apart from SyncService so the protocol stays testable without timers,
 * and so the "never two rounds at once" rule lives in one place: overlapping
 * rounds would race on the cursor and could push the same records twice.
 */
export class SyncScheduler {
	private timer: NodeJS.Timeout | null = null
	private running = false
	private lastRunAt: number | null = null
	private lastOutcome: SyncOutcome | null = null

	constructor(
		private readonly service: SyncService,
		private readonly intervalMs: number = SYNC_INTERVAL_MS
	) {}

	state(): SyncState {
		return {running: this.running, lastRunAt: this.lastRunAt, lastOutcome: this.lastOutcome}
	}

	/**
	 * Runs one round. A request arriving while one is in flight is refused rather
	 * than queued: the caller is a button or a timer, and both are better served
	 * by "already running" than by a backlog.
	 */
	async runNow(): Promise<SyncOutcome> {
		// Report the concurrent call honestly instead of falling back to the
		// previous round's outcome (stale) or a fabricated "not-connected"
		// (wrong — a device that isn't connected can't have a round in flight).
		if (this.running) return {status: 'skipped', reason: 'already-running'}

		this.running = true
		try {
			const outcome = await this.service.sync()
			this.lastRunAt = Date.now()
			this.lastOutcome = outcome
			// A revoked device will fail every future round the same way, so stop the
			// timer instead of retrying on a dead credential every 15 minutes.
			if (outcome.status === 'unauthorized') this.stop()
			return outcome
		} finally {
			this.running = false
		}
	}

	start(): void {
		if (this.timer) return
		this.timer = setInterval(() => void this.runNow(), this.intervalMs)
		// Do not hold the process open for a background sync at quit time.
		this.timer.unref?.()
		logger.info('Sync scheduler started', {intervalMinutes: this.intervalMs / 60_000})
	}

	stop(): void {
		if (!this.timer) return
		clearInterval(this.timer)
		this.timer = null
		logger.info('Sync scheduler stopped')
	}
}
