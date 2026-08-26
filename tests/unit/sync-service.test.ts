import {describe, expect, it, vi} from 'vitest'
import {SyncService} from '@main/services/SyncService.js'
import type {MediaRepo} from '@main/db/repositories/mediaRepository.js'
import type {AccountStore} from '@main/stores/AccountStore.js'

interface Row {
	id: string
	title: string
	url: string
	sourceKey: string | null
	mediaType: string
	duration: number | null
	isFavorite: number
	status: string
	createdBy?: string
	updatedAt: string
}

/** In-memory stand-in for the library, exposing only what SyncService touches. */
function fakeRepo(initial: Row[] = []) {
	const rows = new Map(initial.map(row => [row.id, row]))
	return {
		rows,
		repo: {
			list: () => [...rows.values()],
			getById: (id: string) => rows.get(id) ?? null,
			update: vi.fn((id: string, data: Partial<Row>) => {
				const existing = rows.get(id)
				if (existing) rows.set(id, {...existing, ...data})
				return null
			}),
			create: vi.fn((data: Omit<Row, 'id'>) => {
				const id = `new-${rows.size + 1}`
				rows.set(id, {...data, id} as Row)
				return null
			}),
			delete: vi.fn((id: string) => rows.delete(id))
		} as unknown as MediaRepo
	}
}

function fakeAccount(connected = true) {
	let cursor: string | null = null
	return {
		cleared: false,
		store: {
			load: () => (connected ? {deviceToken: 'tok', deviceId: 'dev'} : null),
			getSyncCursor: () => cursor,
			setSyncCursor: vi.fn((value: string) => {
				cursor = value
			}),
			clear: vi.fn()
		} as unknown as AccountStore
	}
}

function mockFetch(responses: Array<{status: number; body: unknown}>) {
	const queue = [...responses]
	// Params are declared so mock.calls stays typed and the push body can be
	// inspected without casting through `undefined`.
	return vi.fn(async (url: string, init: {body: string}) => {
		void url
		void init
		const next = queue.shift() ?? {status: 200, body: {}}
		return new Response(JSON.stringify(next.body), {status: next.status, headers: {'content-type': 'application/json'}})
	})
}

function record(overrides: Record<string, unknown> = {}) {
	return {id: 'm1', title: 'Clip', url: 'https://x.test/1', sourceKey: null, mediaType: 'video', duration: 60, isFavorite: false, updatedAt: '2026-01-01T00:00:00.000Z', deletedAt: null, ...overrides}
}

describe('SyncService', () => {
	it('does nothing when no account is connected', async () => {
		const {repo} = fakeRepo()
		const account = fakeAccount(false)

		await expect(new SyncService(repo, account.store).sync()).resolves.toEqual({status: 'skipped', reason: 'not-connected'})
	})

	it('creates an arriving record as MISSING, since the file is on another device', async () => {
		const {repo, rows} = fakeRepo()
		const account = fakeAccount()
		vi.stubGlobal(
			'fetch',
			mockFetch([
				{status: 200, body: {cursor: '5', records: [record()]}},
				{status: 200, body: {cursor: '5'}}
			])
		)

		const result = await new SyncService(repo, account.store, 'https://example.test').sync()

		expect(result).toMatchObject({status: 'ok', pulled: 1})
		const created = [...rows.values()].find(row => row.title === 'Clip')
		expect(created).toMatchObject({status: 'MISSING', createdBy: 'SYNC'})
		vi.unstubAllGlobals()
	})

	it('applies a newer remote change over the local copy', async () => {
		const {repo, rows} = fakeRepo([{id: 'm1', title: 'Old', url: 'https://x.test/1', sourceKey: null, mediaType: 'video', duration: 60, isFavorite: 0, status: 'AVAILABLE', updatedAt: '2026-01-01T00:00:00.000Z'}])
		const account = fakeAccount()
		vi.stubGlobal(
			'fetch',
			mockFetch([
				{status: 200, body: {cursor: '6', records: [record({title: 'Renamed', updatedAt: '2026-06-01T00:00:00.000Z'})]}},
				{status: 200, body: {cursor: '6'}}
			])
		)

		await new SyncService(repo, account.store, 'https://example.test').sync()

		expect(rows.get('m1')?.title).toBe('Renamed')
		vi.unstubAllGlobals()
	})

	it('removes a record the account says was deleted elsewhere', async () => {
		const {repo, rows} = fakeRepo([{id: 'm1', title: 'Clip', url: 'https://x.test/1', sourceKey: null, mediaType: 'video', duration: 60, isFavorite: 0, status: 'AVAILABLE', updatedAt: '2026-01-01T00:00:00.000Z'}])
		const account = fakeAccount()
		vi.stubGlobal(
			'fetch',
			mockFetch([
				{status: 200, body: {cursor: '7', records: [record({deletedAt: '2026-06-01T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z'})]}},
				{status: 200, body: {cursor: '7'}}
			])
		)

		const result = await new SyncService(repo, account.store, 'https://example.test').sync()

		expect(result).toMatchObject({deleted: 1})
		expect(rows.has('m1')).toBe(false)
		vi.unstubAllGlobals()
	})

	it('disconnects locally when the device was revoked', async () => {
		// Retrying cannot help; leaving the credential in place would fail every
		// future round in silence.
		const {repo} = fakeRepo()
		const account = fakeAccount()
		vi.stubGlobal('fetch', mockFetch([{status: 401, body: {}}]))

		await expect(new SyncService(repo, account.store, 'https://example.test').sync()).resolves.toEqual({status: 'unauthorized'})
		expect(account.store.clear).toHaveBeenCalled()
		vi.unstubAllGlobals()
	})

	it('does not advance the cursor when the round fails', async () => {
		// A cursor saved after a failure would mark remote changes as seen that
		// were never merged.
		const {repo} = fakeRepo()
		const account = fakeAccount()
		vi.stubGlobal('fetch', mockFetch([{status: 500, body: {}}]))

		await expect(new SyncService(repo, account.store, 'https://example.test').sync()).resolves.toMatchObject({status: 'failed'})
		expect(account.store.setSyncCursor).not.toHaveBeenCalled()
		vi.unstubAllGlobals()
	})

	it('never sends a local path to the server', async () => {
		const {repo} = fakeRepo([{id: 'm1', title: 'Clip', url: 'https://x.test/1', sourceKey: null, mediaType: 'video', duration: 60, isFavorite: 0, status: 'AVAILABLE', updatedAt: '2026-09-01T00:00:00.000Z', thumbnailPath: '/home/bryan/thumb.jpg'} as Row & {thumbnailPath: string}])
		const account = fakeAccount()
		const fetchImpl = mockFetch([
			{status: 200, body: {cursor: '1', records: []}},
			{status: 200, body: {cursor: '2'}}
		])
		vi.stubGlobal('fetch', fetchImpl)

		await new SyncService(repo, account.store, 'https://example.test').sync()

		const pushCall = fetchImpl.mock.calls.find(call => call[0].includes('/push'))
		expect(pushCall?.[1].body ?? '').not.toContain('/home/bryan')
		vi.unstubAllGlobals()
	})
})

describe('SyncService plan gate', () => {
	it('reports a plan refusal without dropping the credentials', async () => {
		// A 402 means upgrade, not re-pair: clearing the account here would make the
		// user redo a pairing that was never the problem.
		const {repo} = fakeRepo()
		const account = fakeAccount()
		vi.stubGlobal('fetch', mockFetch([{status: 402, body: {error: 'plan_required', reason: 'device_limit'}}]))

		await expect(new SyncService(repo, account.store, 'https://example.test').sync()).resolves.toEqual({status: 'requires-plan', reason: 'device_limit'})
		expect(account.store.clear).not.toHaveBeenCalled()
		expect(account.store.setSyncCursor).not.toHaveBeenCalled()
		vi.unstubAllGlobals()
	})
})
