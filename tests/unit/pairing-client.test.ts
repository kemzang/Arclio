import {describe, expect, it, vi} from 'vitest'
import {PairingClient, PairingError, type PairingStart} from '@arclio/auth'

function jsonResponse(status: number, body: unknown): Response {
	return new Response(JSON.stringify(body), {status, headers: {'content-type': 'application/json'}})
}

const started: PairingStart = {userCode: 'WXYZ-2346', deviceCode: 'secret', expiresAt: 10_000, pollIntervalSeconds: 5, verificationUrl: 'https://example.test/pair'}

function client(responses: Response[], overrides: {now?: () => number} = {}) {
	const queue = [...responses]
	const fetchImpl = vi.fn(async () => queue.shift() ?? jsonResponse(202, {status: 'pending'}))
	const sleep = vi.fn(async () => {})
	return {client: new PairingClient({baseUrl: 'https://example.test/', fetch: fetchImpl as unknown as typeof fetch, sleep, now: overrides.now ?? (() => 0)}), fetchImpl, sleep}
}

describe('PairingClient.start', () => {
	it('posts the device identity and returns the pairing', async () => {
		const {client: c, fetchImpl} = client([jsonResponse(200, started)])

		await expect(c.start({deviceName: 'Laptop', devicePlatform: 'linux'})).resolves.toEqual(started)

		// Body is typed BodyInit but we always send a JSON string here.
		const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, {body: string}]
		// Trailing slash on baseUrl must not produce a double slash.
		expect(url).toBe('https://example.test/api/pair/start')
		expect(JSON.parse(init.body)).toEqual({deviceName: 'Laptop', devicePlatform: 'linux'})
	})

	it('throws on a server error rather than returning a broken pairing', async () => {
		const {client: c} = client([jsonResponse(500, {})])
		await expect(c.start({deviceName: 'Laptop', devicePlatform: 'linux'})).rejects.toThrow('HTTP 500')
	})
})

describe('PairingClient.waitForApproval', () => {
	it('returns credentials once the user approves', async () => {
		const {client: c, sleep} = client([jsonResponse(202, {status: 'pending'}), jsonResponse(202, {status: 'pending'}), jsonResponse(200, {status: 'approved', deviceToken: 'tok', deviceId: 'dev'})])

		await expect(c.waitForApproval(started)).resolves.toEqual({deviceToken: 'tok', deviceId: 'dev'})
		// Waits between polls, never hammers the server.
		expect(sleep).toHaveBeenCalledWith(5000)
		expect(sleep).toHaveBeenCalledTimes(2)
	})

	it('reports each poll so the UI can show progress', async () => {
		const {client: c} = client([jsonResponse(202, {status: 'pending'}), jsonResponse(200, {status: 'approved', deviceToken: 'tok', deviceId: 'dev'})])
		const onPoll = vi.fn()

		await c.waitForApproval(started, {onPoll})

		expect(onPoll.mock.calls).toEqual([[1], [2]])
	})

	it('stops when the server says the pairing expired', async () => {
		const {client: c} = client([jsonResponse(410, {status: 'expired'})])
		await expect(c.waitForApproval(started)).rejects.toThrow(PairingError)
	})

	it('stops when the user denied it', async () => {
		const {client: c} = client([jsonResponse(410, {status: 'denied'})])
		await expect(c.waitForApproval(started)).rejects.toMatchObject({reason: 'denied'})
	})

	it('gives up on its own deadline even if the server keeps saying pending', async () => {
		// A server that never answers "expired" must not keep the app polling
		// forever, so the deadline is enforced client-side too.
		let clock = 0
		const {client: c, fetchImpl} = client([], {now: () => (clock += 6000)})

		await expect(c.waitForApproval(started)).rejects.toMatchObject({reason: 'expired'})
		expect(fetchImpl.mock.calls.length).toBeLessThan(3)
	})

	it('cancels without polling when the signal is already aborted', async () => {
		const {client: c, fetchImpl} = client([])
		const controller = new AbortController()
		controller.abort()

		await expect(c.waitForApproval(started, {signal: controller.signal})).rejects.toMatchObject({reason: 'cancelled'})
		expect(fetchImpl).not.toHaveBeenCalled()
	})

	it('treats an unexpected status as a fault, not as "keep waiting"', async () => {
		const {client: c} = client([jsonResponse(503, {})])
		await expect(c.waitForApproval(started)).rejects.toThrow('HTTP 503')
	})
})

describe('PairingClient network resilience', () => {
	/** A fetch that hangs forever unless its request's AbortSignal fires. */
	function hangingFetch() {
		return vi.fn((_url: string, init: {signal?: AbortSignal}) => {
			return new Promise<Response>((_resolve, reject) => {
				init.signal?.addEventListener('abort', () => reject(new DOMException('The operation was aborted', 'AbortError')))
			})
		})
	}

	it('regression: gives up on a start() request that never resolves, instead of hanging forever', async () => {
		// Neither start() nor poll() used to pass a signal to fetch at all, so a
		// connection that never answers (dead server, dropped wifi) left pairing
		// stuck with no way to time out.
		const fetchImpl = hangingFetch()
		const c = new PairingClient({baseUrl: 'https://example.test', fetch: fetchImpl as unknown as typeof fetch, requestTimeoutMs: 20})

		await expect(c.start({deviceName: 'Laptop', devicePlatform: 'linux'})).rejects.toThrow()
		expect(fetchImpl.mock.calls[0]?.[1]).toMatchObject({signal: expect.any(AbortSignal)})
	})

	it('regression: cancelling waitForApproval aborts the in-flight poll instead of waiting for it to finish', async () => {
		const fetchImpl = hangingFetch()
		const c = new PairingClient({baseUrl: 'https://example.test', fetch: fetchImpl as unknown as typeof fetch, now: () => 0})
		const controller = new AbortController()

		const wait = c.waitForApproval(started, {signal: controller.signal})
		await vi.waitFor(() => expect(fetchImpl).toHaveBeenCalled())
		controller.abort()

		await expect(wait).rejects.toMatchObject({reason: 'cancelled'})
	})
})
