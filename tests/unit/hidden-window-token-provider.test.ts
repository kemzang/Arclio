import {EventEmitter} from 'node:events'
import {afterEach, describe, expect, it, vi} from 'vitest'

class FakeWebContents extends EventEmitter {
	executeJavaScript = vi.fn().mockResolvedValue(false)
}

class FakeBrowserWindow {
	webContents = new FakeWebContents()
	loadURL = vi.fn().mockResolvedValue(undefined)
	destroy = vi.fn()
	setSkipTaskbar = vi.fn()
	private destroyed = false
	private closedHandlers: Array<() => void> = []

	on(event: string, handler: () => void): this {
		if (event === 'closed') this.closedHandlers.push(handler)
		return this
	}

	isDestroyed(): boolean {
		return this.destroyed
	}

	triggerDestroy(): void {
		this.destroyed = true
		for (const handler of this.closedHandlers) handler()
	}
}

let lastWindow: FakeBrowserWindow | undefined

vi.mock('electron', () => {
	return {
		BrowserWindow: class {
			constructor() {
				lastWindow = new FakeBrowserWindow()
				return lastWindow as unknown as InstanceType<typeof FakeBrowserWindow>
			}
		},
		session: {fromPartition: vi.fn().mockReturnValue({})}
	}
})

const {HiddenWindowTokenProvider} = await import('@main/token/providers/HiddenWindowTokenProvider.js')

afterEach(() => {
	vi.restoreAllMocks()
	lastWindow = undefined
})

describe('HiddenWindowTokenProvider.ensureReady', () => {
	it('resolves once did-finish-load fires and the WebPoClient poll succeeds', async () => {
		const provider = new HiddenWindowTokenProvider()
		const readyPromise = provider.ensureReady()
		lastWindow!.webContents.executeJavaScript.mockResolvedValue(true)
		lastWindow!.webContents.emit('did-finish-load')

		await expect(readyPromise).resolves.toBeUndefined()
	})

	it('rejects when did-fail-load fires', async () => {
		const provider = new HiddenWindowTokenProvider()
		const readyPromise = provider.ensureReady()
		lastWindow!.webContents.emit('did-fail-load', {}, -105, 'NAME_NOT_RESOLVED')

		await expect(readyPromise).rejects.toThrow(/YouTube failed to load/)
	})

	it('regression: rejects instead of hanging forever when neither did-finish-load nor did-fail-load ever fires', async () => {
		vi.useFakeTimers()
		try {
			const provider = new HiddenWindowTokenProvider()
			const readyPromise = provider.ensureReady()
			// Neither event fires — simulates a dead DNS resolution / silently
			// dropped connection, which fires neither Electron event.
			const assertion = expect(readyPromise).rejects.toThrow(/did not finish loading/)
			await vi.advanceTimersByTimeAsync(30_000)
			await assertion
		} finally {
			vi.useRealTimers()
		}
	})

	it('regression: aborts immediately via signal instead of waiting for the timeout', async () => {
		const provider = new HiddenWindowTokenProvider()
		const controller = new AbortController()
		const readyPromise = provider.ensureReady(controller.signal)
		controller.abort()

		await expect(readyPromise).rejects.toThrow('Aborted')
	})

	it('an already-aborted signal rejects synchronously without touching the window', async () => {
		const provider = new HiddenWindowTokenProvider()
		const controller = new AbortController()
		controller.abort()

		await expect(provider.ensureReady(controller.signal)).rejects.toThrow('Aborted')
	})
})
