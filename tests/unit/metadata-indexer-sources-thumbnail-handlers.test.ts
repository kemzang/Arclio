import {describe, expect, it, vi, beforeEach} from 'vitest'

const handleCalls: {channel: string; fn: (e: unknown, ...args: unknown[]) => unknown}[] = []
const removeHandlerCalls: string[] = []

vi.mock('electron', () => ({
	ipcMain: {
		handle: vi.fn().mockImplementation((channel: string, fn: (e: unknown, ...args: unknown[]) => unknown) => {
			handleCalls.push({channel, fn})
		}),
		removeHandler: vi.fn().mockImplementation((channel: string) => {
			removeHandlerCalls.push(channel)
		})
	}
}))

const {registerMetadataHandlers} = await import('@main/ipc/metadataHandlers.js')
const {registerIndexerHandlers} = await import('@main/ipc/indexerHandlers.js')
const {registerSourcesHandlers} = await import('@main/ipc/sourcesHandlers.js')
const {registerThumbnailHandlers} = await import('@main/ipc/thumbnailHandlers.js')

function findCall(channel: string) {
	const call = handleCalls.findLast(c => c.channel === channel)
	if (!call) throw new Error(`no handler registered for ${channel}`)
	return call.fn
}

async function invoke(channel: string, ...args: unknown[]) {
	return await findCall(channel)({}, ...args)
}

beforeEach(() => {
	handleCalls.length = 0
	removeHandlerCalls.length = 0
	vi.clearAllMocks()
})

describe('registerMetadataHandlers', () => {
	const metadataService = {extract: vi.fn(), extractAndSave: vi.fn(), extractBatch: vi.fn()}

	beforeEach(() => {
		vi.clearAllMocks()
		registerMetadataHandlers(metadataService as never)
	})

	it('re-registers idempotently', () => {
		registerMetadataHandlers(metadataService as never)
		expect(removeHandlerCalls.filter(c => c === 'metadata:extract').length).toBeGreaterThanOrEqual(2)
	})

	it('regression: rejects an invalid mediaType instead of forwarding it', async () => {
		await expect(invoke('metadata:extract', '/tmp/x.mp4', 'not-a-type')).rejects.toThrow()
		expect(metadataService.extract).not.toHaveBeenCalled()
	})

	it('forwards a valid call', async () => {
		await invoke('metadata:extract', '/tmp/x.mp4', 'video')
		expect(metadataService.extract).toHaveBeenCalledWith('/tmp/x.mp4', 'video')
	})

	it('regression: rejects an empty filePath', async () => {
		await expect(invoke('metadata:extract', '', undefined)).rejects.toThrow()
	})
})

describe('registerIndexerHandlers', () => {
	const indexerService = {indexFile: vi.fn(), indexFiles: vi.fn()}

	beforeEach(() => {
		vi.clearAllMocks()
		registerIndexerHandlers(indexerService as never)
	})

	it('re-registers idempotently', () => {
		registerIndexerHandlers(indexerService as never)
		expect(removeHandlerCalls.filter(c => c === 'indexer:indexFile').length).toBeGreaterThanOrEqual(2)
	})

	it('regression: rejects a non-string filePath', async () => {
		await expect(invoke('indexer:indexFile', 123, undefined)).rejects.toThrow()
		expect(indexerService.indexFile).not.toHaveBeenCalled()
	})

	it('forwards a valid batch', async () => {
		await invoke('indexer:indexFiles', ['/a', '/b'])
		expect(indexerService.indexFiles).toHaveBeenCalledWith(['/a', '/b'])
	})
})

describe('registerSourcesHandlers', () => {
	const sourcesService = {addSource: vi.fn(), removeSource: vi.fn(), getSources: vi.fn(), toggleWatch: vi.fn(), scanSource: vi.fn()}

	beforeEach(() => {
		vi.clearAllMocks()
		registerSourcesHandlers(sourcesService as never)
	})

	it('re-registers idempotently', () => {
		registerSourcesHandlers(sourcesService as never)
		expect(removeHandlerCalls.filter(c => c === 'sources:add').length).toBeGreaterThanOrEqual(2)
	})

	it('regression: rejects an empty path', async () => {
		await expect(invoke('sources:add', '', true)).rejects.toThrow()
		expect(sourcesService.addSource).not.toHaveBeenCalled()
	})

	it('forwards a valid toggleWatch call', async () => {
		await invoke('sources:toggleWatch', 'src-1', false)
		expect(sourcesService.toggleWatch).toHaveBeenCalledWith('src-1', false)
	})
})

describe('registerThumbnailHandlers', () => {
	const thumbnailService = {generate: vi.fn(), get: vi.fn(), regenerate: vi.fn(), delete: vi.fn(), getThumbnailUrl: vi.fn(), clearCache: vi.fn()}

	beforeEach(() => {
		vi.clearAllMocks()
		registerThumbnailHandlers(thumbnailService as never)
	})

	it('re-registers idempotently', () => {
		registerThumbnailHandlers(thumbnailService as never)
		expect(removeHandlerCalls.filter(c => c === 'thumbnail:generate').length).toBeGreaterThanOrEqual(2)
	})

	it('regression: rejects an invalid mediaType instead of forwarding it', async () => {
		await expect(invoke('thumbnail:generate', 'media-1', '/tmp/x.mp4', 'not-a-type')).rejects.toThrow()
		expect(thumbnailService.generate).not.toHaveBeenCalled()
	})

	it('forwards a valid call', async () => {
		await invoke('thumbnail:generate', 'media-1', '/tmp/x.mp4', 'video')
		expect(thumbnailService.generate).toHaveBeenCalledWith('media-1', '/tmp/x.mp4', 'video')
	})
})
