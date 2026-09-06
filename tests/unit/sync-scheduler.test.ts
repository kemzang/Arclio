import {describe, expect, it, vi} from 'vitest'
import {SyncScheduler} from '@main/services/SyncScheduler.js'
import type {SyncService} from '@main/services/SyncService.js'
import type {SyncOutcome} from '@shared/api.js'

function service(outcomes: SyncOutcome[]) {
	const queue = [...outcomes]
	const sync = vi.fn(async () => queue.shift() ?? {status: 'ok' as const, pulled: 0, pushed: 0, deleted: 0})
	return {sync: sync as unknown as SyncService['sync'], spy: sync}
}

const okOutcome: SyncOutcome = {status: 'ok', pulled: 1, pushed: 2, deleted: 0}

describe('SyncScheduler', () => {
	it('reports an idle state before anything ran', () => {
		const {sync} = service([])
		expect(new SyncScheduler({sync} as SyncService).state()).toEqual({running: false, lastRunAt: null, lastOutcome: null})
	})

	it('records the outcome of a completed round', async () => {
		const {sync} = service([okOutcome])
		const scheduler = new SyncScheduler({sync} as SyncService)

		await scheduler.runNow()

		expect(scheduler.state()).toMatchObject({running: false, lastOutcome: okOutcome})
		expect(scheduler.state().lastRunAt).toBeTypeOf('number')
	})

	it('refuses a second round while one is in flight', async () => {
		// Overlapping rounds would race on the cursor and could push the same
		// records twice.
		let release: (() => void) | undefined
		const sync = vi.fn(async () => {
			await new Promise<void>(resolve => {
				release = resolve
			})
			return okOutcome
		})
		const scheduler = new SyncScheduler({sync} as unknown as SyncService)

		const first = scheduler.runNow()
		const second = scheduler.runNow()
		release?.()
		const [, secondOutcome] = await Promise.all([first, second])

		expect(sync).toHaveBeenCalledTimes(1)
		// Regression: the concurrent call used to return the *previous* round's
		// stale outcome, or a fabricated "not-connected" when there was none yet
		// — both misleading for a device that is, in fact, connected and mid-sync.
		expect(secondOutcome).toEqual({status: 'skipped', reason: 'already-running'})
	})

	it('regression: a concurrent call does not fabricate "not-connected" when no round has completed yet', async () => {
		let release: (() => void) | undefined
		const sync = vi.fn(async () => {
			await new Promise<void>(resolve => {
				release = resolve
			})
			return okOutcome
		})
		const scheduler = new SyncScheduler({sync} as unknown as SyncService)

		const first = scheduler.runNow()
		const second = scheduler.runNow()
		release?.()
		const [, secondOutcome] = await Promise.all([first, second])

		expect(secondOutcome).not.toEqual({status: 'skipped', reason: 'not-connected'})
	})

	it('stops the timer when the device was revoked', async () => {
		// Retrying every 15 minutes on a dead credential helps nobody.
		const {sync} = service([{status: 'unauthorized'}])
		const scheduler = new SyncScheduler({sync} as SyncService, 10)
		scheduler.start()

		await scheduler.runNow()
		const callsAfterStop = (sync as unknown as {mock: {calls: unknown[]}}).mock.calls.length
		await new Promise(resolve => setTimeout(resolve, 40))

		expect((sync as unknown as {mock: {calls: unknown[]}}).mock.calls.length).toBe(callsAfterStop)
	})

	it('runs on its interval once started', async () => {
		const {sync, spy} = service([])
		const scheduler = new SyncScheduler({sync} as SyncService, 10)

		scheduler.start()
		await new Promise(resolve => setTimeout(resolve, 45))
		scheduler.stop()
		const runs = spy.mock.calls.length

		expect(runs).toBeGreaterThan(1)
		await new Promise(resolve => setTimeout(resolve, 30))
		// Stopped means stopped.
		expect(spy.mock.calls.length).toBe(runs)
	})

	it('is safe to start twice', () => {
		const {sync} = service([])
		const scheduler = new SyncScheduler({sync} as SyncService, 10)

		scheduler.start()
		scheduler.start()
		scheduler.stop()

		expect(scheduler.state().running).toBe(false)
	})
})
