import {describe, expect, it, vi, beforeEach} from 'vitest'
import type {QueueService} from '@main/services/QueueService.js'
import type {QueueItem, QueueArtifact} from '@shared/types.js'

vi.mock('@main/db/repositories/mediaRepository.js', () => ({createMediaRepository: () => ({create: vi.fn().mockReturnValue({id: 'media-1', title: 'Test', mediaType: 'video'})})}))

vi.mock('@main/db/repositories/assetRepository.js', () => ({createAssetRepository: () => ({create: vi.fn()})}))

vi.mock('@main/db/repositories/downloadHistoryRepository.js', () => ({createDownloadHistoryRepository: () => ({create: vi.fn()})}))

// Import after mocks
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

describe('LibraryImporter.extractSourceKey', () => {
	let importer: InstanceType<typeof LibraryImporter>

	beforeEach(() => {
		const mockDb = {} as any
		const mockQueueService = {on: vi.fn()} as unknown as QueueService
		importer = new LibraryImporter(mockDb, mockQueueService)
	})

	it('extracts YouTube video ID from youtube.com URL', () => {
		expect(importer.extractSourceKey('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('youtube:dQw4w9WgXcQ')
	})

	it('extracts YouTube video ID from youtu.be short URL', () => {
		expect(importer.extractSourceKey('https://youtu.be/dQw4w9WgXcQ')).toBe('youtube:dQw4w9WgXcQ')
	})

	it('extracts Vimeo video ID', () => {
		expect(importer.extractSourceKey('https://vimeo.com/123456789')).toBe('vimeo:123456789')
	})

	it('extracts Twitch video ID', () => {
		expect(importer.extractSourceKey('https://www.twitch.tv/videos/123456')).toBe('twitch:123456')
	})

	it('extracts TikTok video ID', () => {
		expect(importer.extractSourceKey('https://www.tiktok.com/@user/video/1234567890')).toBe('tiktok:1234567890')
	})

	it('extracts Instagram post ID', () => {
		expect(importer.extractSourceKey('https://www.instagram.com/p/ABC123/')).toBe('instagram:ABC123')
	})

	it('returns null for unknown sites', () => {
		expect(importer.extractSourceKey('https://example.com/video/123')).toBeNull()
	})

	it('returns null for malformed URLs', () => {
		expect(importer.extractSourceKey('not-a-url')).toBeNull()
	})
})

describe('LibraryImporter event notification', () => {
	it('notifies renderer when media is created', () => {
		const mockDb = {} as any
		const mockQueueService = {on: vi.fn()} as unknown as QueueService
		const importer = new LibraryImporter(mockDb, mockQueueService)

		const mockSend = vi.fn()
		const mockWindow = {isDestroyed: () => false, webContents: {send: mockSend}} as any

		importer.setMainWindow(mockWindow)

		const handler = (mockQueueService.on as any).mock.calls[0][1]
		const item = makeQueueItem({id: 'notify-test'})
		handler({item})

		expect(mockSend).toHaveBeenCalledWith('library:media:created', expect.objectContaining({id: 'media-1', mediaType: 'video'}))
	})

	it('does not notify when window is destroyed', () => {
		const mockDb = {} as any
		const mockQueueService = {on: vi.fn()} as unknown as QueueService
		const importer = new LibraryImporter(mockDb, mockQueueService)

		const mockSend = vi.fn()
		const mockWindow = {isDestroyed: () => true, webContents: {send: mockSend}} as any

		importer.setMainWindow(mockWindow)

		const handler = (mockQueueService.on as any).mock.calls[0][1]
		const item = makeQueueItem({id: 'destroyed-test'})
		handler({item})

		expect(mockSend).not.toHaveBeenCalled()
	})

	it('does not notify when no window is set', () => {
		const mockDb = {} as any
		const mockQueueService = {on: vi.fn()} as unknown as QueueService
		new LibraryImporter(mockDb, mockQueueService)

		const handler = (mockQueueService.on as any).mock.calls[0][1]
		const item = makeQueueItem({id: 'no-window-test'})

		expect(() => handler({item})).not.toThrow()
	})
})

describe('LibraryImporter deduplication', () => {
	it('processes item only once', () => {
		const mockDb = {} as any
		const mockQueueService = {on: vi.fn()} as unknown as QueueService
		const importer = new LibraryImporter(mockDb, mockQueueService)

		const mockSend = vi.fn()
		const mockWindow = {isDestroyed: () => false, webContents: {send: mockSend}} as any

		importer.setMainWindow(mockWindow)

		const handler = (mockQueueService.on as any).mock.calls[0][1]
		const item = makeQueueItem({id: 'dedup-test'})

		handler({item})
		handler({item})

		expect(mockSend).toHaveBeenCalledTimes(1)
	})
})
