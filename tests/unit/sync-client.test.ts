import {describe, expect, it, vi} from 'vitest'
import {SyncClient, type SyncRecord} from '@arclio/cloud'
import {SyncAuthError} from '../../packages/cloud/src/SyncClient.js'

function jsonResponse(status: number, body: unknown): Response {
	return new Response(JSON.stringify(body), {status, headers: {'content-type': 'application/json'}})
}

function client(responses: Response[]) {
	const queue = [...responses]
	const fetchImpl = vi.fn(async () => queue.shift() ?? jsonResponse(200, {}))
	return {client: new SyncClient({baseUrl: 'https://example.test/', deviceToken: 'tok-123', fetch: fetchImpl as unknown as typeof fetch}), fetchImpl}
}

const record: SyncRecord = {id: 'm1', title: 'Clip', url: 'https://example.test/v', sourceKey: null, mediaType: 'video', duration: null, isFavorite: false, tags: [], collections: [], updatedAt: '2026-01-01T00:00:00.000Z', deletedAt: null}

describe('SyncClient', () => {
	it('sends the device token as a bearer credential', async () => {
		const {client: c, fetchImpl} = client([jsonResponse(200, {cursor: 'c1', records: []})])

		await c.pull(null)

		const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, {headers: Record<string, string>}]
		expect(url).toBe('https://example.test/api/sync/pull')
		expect(init.headers.authorization).toBe('Bearer tok-123')
	})

	it('surfaces a revoked device as a distinct error the caller can act on', async () => {
		// 401 means re-pair, not retry — conflating it with a network blip would
		// leave the app looping forever against a dead credential.
		const {client: c} = client([jsonResponse(401, {})])

		await expect(c.pull(null)).rejects.toBeInstanceOf(SyncAuthError)
	})

	it('treats other failures as retryable errors, not auth failures', async () => {
		const {client: c} = client([jsonResponse(500, {})])

		await expect(c.pull(null)).rejects.toSatisfy(error => error instanceof Error && !(error instanceof SyncAuthError) && error.message.includes('HTTP 500'))
	})

	it('skips the round-trip when there is nothing to push', async () => {
		const {client: c, fetchImpl} = client([])

		await expect(c.push({cursor: 'c1', records: []})).resolves.toEqual({cursor: 'c1'})
		expect(fetchImpl).not.toHaveBeenCalled()
	})

	it('posts the batch and returns the next cursor', async () => {
		const {client: c, fetchImpl} = client([jsonResponse(200, {cursor: 'c2'})])

		await expect(c.push({cursor: 'c1', records: [record]})).resolves.toEqual({cursor: 'c2'})

		const [, init] = fetchImpl.mock.calls[0] as unknown as [string, {body: string}]
		expect(JSON.parse(init.body)).toMatchObject({cursor: 'c1', records: [{id: 'm1'}]})
	})
})
