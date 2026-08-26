import {describe, expect, it} from 'vitest'
import {mergeRecord, reconcile, toSyncRecord, type SyncRecord} from '@arclio/cloud'

function record(overrides: Partial<SyncRecord> = {}): SyncRecord {
	return {id: 'm1', title: 'Clip', url: 'https://example.test/v', sourceKey: 'youtube:abc', mediaType: 'video', duration: 120, isFavorite: false, updatedAt: '2026-01-01T00:00:00.000Z', deletedAt: null, ...overrides}
}

describe('toSyncRecord', () => {
	it('never sends anything device-local', () => {
		// The explicit projection is the privacy boundary: media files are not
		// uploaded and local paths must never leave the machine.
		const wire = toSyncRecord({id: 'm1', title: 'Clip', url: 'https://example.test/v', sourceKey: 'youtube:abc', mediaType: 'video', duration: 120, isFavorite: 1, updatedAt: '2026-01-01T00:00:00.000Z', thumbnailPath: '/home/bryan/.cache/arclio/thumb.jpg', metadata: '{"local":"secret"}'})

		expect(JSON.stringify(wire)).not.toContain('/home/bryan')
		expect(JSON.stringify(wire)).not.toContain('secret')
		expect(Object.keys(wire).sort()).toEqual(['deletedAt', 'duration', 'id', 'isFavorite', 'mediaType', 'sourceKey', 'title', 'updatedAt', 'url'])
	})

	it('normalises the SQLite integer favourite flag to a boolean', () => {
		expect(toSyncRecord({id: 'm1', title: 't', url: 'u', sourceKey: null, mediaType: 'video', duration: null, isFavorite: 1, updatedAt: 'x'}).isFavorite).toBe(true)
		expect(toSyncRecord({id: 'm1', title: 't', url: 'u', sourceKey: null, mediaType: 'video', duration: null, isFavorite: 0, updatedAt: 'x'}).isFavorite).toBe(false)
	})
})

describe('mergeRecord', () => {
	it('takes a remote record this device has never seen', () => {
		expect(mergeRecord(undefined, record())).toEqual({action: 'take-remote', record: record()})
	})

	it('does not resurrect something already deleted elsewhere', () => {
		expect(mergeRecord(undefined, record({deletedAt: '2026-01-02T00:00:00.000Z'}))).toEqual({action: 'keep-local'})
	})

	it('takes the newer remote change', () => {
		const local = record({title: 'Old'})
		const remote = record({title: 'New', updatedAt: '2026-02-01T00:00:00.000Z'})

		expect(mergeRecord(local, remote)).toEqual({action: 'take-remote', record: remote})
	})

	it('keeps a local change that is newer than the server copy', () => {
		const local = record({title: 'Newer', updatedAt: '2026-03-01T00:00:00.000Z'})

		expect(mergeRecord(local, record({title: 'Older'}))).toEqual({action: 'keep-local'})
	})

	it('keeps local on an exact timestamp tie rather than churning', () => {
		// Two devices editing within the same millisecond are indistinguishable;
		// refusing to flip-flop is the calmer behaviour.
		expect(mergeRecord(record({title: 'Mine'}), record({title: 'Theirs'}))).toEqual({action: 'keep-local'})
	})

	it('propagates a newer deletion', () => {
		expect(mergeRecord(record(), record({deletedAt: '2026-02-01T00:00:00.000Z', updatedAt: '2026-02-01T00:00:00.000Z'}))).toEqual({action: 'delete-local'})
	})

	it('ignores a deletion older than a local edit', () => {
		const local = record({title: 'Renamed', updatedAt: '2026-05-01T00:00:00.000Z'})

		expect(mergeRecord(local, record({deletedAt: '2026-02-01T00:00:00.000Z', updatedAt: '2026-02-01T00:00:00.000Z'}))).toEqual({action: 'keep-local'})
	})
})

describe('reconcile', () => {
	it('splits a round into upserts, deletions and pushes', () => {
		const local = [record({id: 'a', updatedAt: '2026-01-01T00:00:00.000Z'}), record({id: 'b', updatedAt: '2026-05-01T00:00:00.000Z'}), record({id: 'c', updatedAt: '2026-01-01T00:00:00.000Z'})]
		const remote = [record({id: 'a', title: 'From server', updatedAt: '2026-02-01T00:00:00.000Z'}), record({id: 'b', title: 'Stale', updatedAt: '2026-01-01T00:00:00.000Z'}), record({id: 'd', updatedAt: '2026-02-01T00:00:00.000Z'})]

		const result = reconcile(local, remote)

		expect(result.upserts.map(r => r.id).sort()).toEqual(['a', 'd'])
		expect(result.deletions).toEqual([])
		// b is newer here, c is unknown to the server.
		expect(result.toPush.map(r => r.id).sort()).toEqual(['b', 'c'])
	})

	it('never both takes a record and pushes it back in the same round', () => {
		const local = [record({id: 'a', updatedAt: '2026-01-01T00:00:00.000Z'})]
		const remote = [record({id: 'a', updatedAt: '2026-02-01T00:00:00.000Z'})]

		const result = reconcile(local, remote)

		expect(result.upserts.map(r => r.id)).toEqual(['a'])
		expect(result.toPush).toEqual([])
	})

	it('pushes everything on a first sync against an empty server', () => {
		const local = [record({id: 'a'}), record({id: 'b'})]

		expect(
			reconcile(local, [])
				.toPush.map(r => r.id)
				.sort()
		).toEqual(['a', 'b'])
	})

	it('takes everything on a first sync of a fresh device', () => {
		const remote = [record({id: 'a'}), record({id: 'b'})]

		const result = reconcile([], remote)

		expect(result.upserts.map(r => r.id).sort()).toEqual(['a', 'b'])
		expect(result.toPush).toEqual([])
	})
})
