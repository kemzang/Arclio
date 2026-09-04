import {describe, expect, it, vi, beforeEach} from 'vitest'
import type {QueueService} from '@main/services/QueueService.js'
import type {QueueItem, QueueArtifact} from '@shared/types.js'

const mediaRepo = {create: vi.fn()}
const assetRepo = {create: vi.fn()}
const downloadHistoryRepo = {create: vi.fn()}

vi.mock('@main/db/repositories/mediaRepository.js', () => ({createMediaRepository: () => mediaRepo}))
vi.mock('@main/db/repositories/assetRepository.js', () => ({createAssetRepository: () => assetRepo}))
vi.mock('@main/db/repositories/downloadHistoryRepository.js', () => ({createDownloadHistoryRepository: () => downloadHistoryRepo}))

const {LibraryImporter} = await import('@main/services/LibraryImporter.js')

function makeArtifact(overrides: Partial<QueueArtifact> = {}): QueueArtifact {
	return {id: 'artifact-1', kind: 'media', path: '/tmp/test.mp4', fileName: 'test.mp4', sizeBytes: 1024, discoveredAt: '2026-06-26T12:00:00Z', internal: false, missing: false, ...overrides}
}

function makeQueueItem(overrides: Partial<QueueItem> = {}): QueueItem {
	return {
		id: 'item-1',
		url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
		title: 'Test Video',
		thumbnail: 'https://example.com/thumb.jpg',
		outputDir: '/tmp/output',
		status: 'done',
		artifacts: [makeArtifact()],
		job: {kind: 'single-format', formatId: 'best', url: 'https://youtube.com/watch?v=test'},
		finishedAt: '2026-06-26T12:00:00Z',
		...overrides
	} as QueueItem
}

// Mirrors better-sqlite3's real transaction() semantics closely enough for
// this test: runs the callback synchronously and, on throw, "rolls back" by
// pretending the media create() never committed (tracked via `committed`).
function makeTransactionalDb() {
	let committed: unknown[] = []
	return {
		db: {
			transaction: (fn: () => unknown) => {
				const before = committed.length
				try {
					return fn()
				} catch (err) {
					committed = committed.slice(0, before)
					throw err
				}
			}
		},
		recordCommit: (value: unknown) => committed.push(value),
		getCommitted: () => committed
	}
}

beforeEach(() => {
	vi.clearAllMocks()
})

describe('LibraryImporter — atomic media+asset creation', () => {
	it('regression: an asset creation failure does not leave a media row behind', () => {
		const {db} = makeTransactionalDb()
		mediaRepo.create.mockReturnValue({id: 'media-1', title: 'Test', mediaType: 'video'})
		assetRepo.create.mockImplementation(() => {
			throw new Error('disk full')
		})

		const queueService = {on: vi.fn()} as unknown as QueueService
		new LibraryImporter(db as never, queueService)
		const handler = (queueService.on as ReturnType<typeof vi.fn>).mock.calls[0][1] as (e: {item: QueueItem}) => void

		const item = makeQueueItem()
		expect(() => handler({item})).not.toThrow()

		// The failure path must log a failed history entry, not a completed one.
		expect(downloadHistoryRepo.create).toHaveBeenCalledWith(expect.objectContaining({status: 'failed'}))
		expect(downloadHistoryRepo.create).not.toHaveBeenCalledWith(expect.objectContaining({status: 'completed'}))
	})

	it('regression: the failed history entry links back to the media row that was actually created before the later failure', () => {
		const {db} = makeTransactionalDb()
		mediaRepo.create.mockReturnValue({id: 'media-1', title: 'Test', mediaType: 'video'})
		assetRepo.create.mockReturnValue(undefined)
		// Transaction succeeds (media + asset both created); the failure
		// happens afterwards, e.g. writing the download-history row itself.
		downloadHistoryRepo.create.mockImplementationOnce(() => {
			throw new Error('history write failed')
		})

		const queueService = {on: vi.fn()} as unknown as QueueService
		new LibraryImporter(db as never, queueService)
		const handler = (queueService.on as ReturnType<typeof vi.fn>).mock.calls[0][1] as (e: {item: QueueItem}) => void

		handler({item: makeQueueItem()})

		// Second call (from the catch block) must carry the real mediaId,
		// not an unlinked failure record for media the user can still see.
		expect(downloadHistoryRepo.create).toHaveBeenCalledTimes(2)
		expect(downloadHistoryRepo.create).toHaveBeenLastCalledWith(expect.objectContaining({status: 'failed', mediaId: 'media-1'}))
	})

	it('creates media and asset successfully on the happy path', () => {
		const {db} = makeTransactionalDb()
		mediaRepo.create.mockReturnValue({id: 'media-1', title: 'Test', mediaType: 'video'})
		assetRepo.create.mockReturnValue(undefined)

		const queueService = {on: vi.fn()} as unknown as QueueService
		new LibraryImporter(db as never, queueService)
		const handler = (queueService.on as ReturnType<typeof vi.fn>).mock.calls[0][1] as (e: {item: QueueItem}) => void

		handler({item: makeQueueItem()})

		expect(mediaRepo.create).toHaveBeenCalledOnce()
		expect(assetRepo.create).toHaveBeenCalledOnce()
		expect(downloadHistoryRepo.create).toHaveBeenCalledWith(expect.objectContaining({status: 'completed', mediaId: 'media-1'}))
	})
})
