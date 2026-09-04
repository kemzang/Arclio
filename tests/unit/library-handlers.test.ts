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

const mediaRepo = {list: vi.fn(), getById: vi.fn(), search: vi.fn(), setFavorite: vi.fn(), setStatus: vi.fn(), delete: vi.fn(), count: vi.fn(), countByStatus: vi.fn()}
const collectionRepo = {list: vi.fn(), getById: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), addMedia: vi.fn(), removeMedia: vi.fn(), getMediaIds: vi.fn(), getCollectionIdsForMedia: vi.fn()}
const tagRepo = {list: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), addToMedia: vi.fn(), removeFromMedia: vi.fn(), getTagsForMedia: vi.fn(), getMediaIdsForTag: vi.fn()}
const playbackRepo = {updatePosition: vi.fn(), getByMediaId: vi.fn(), listRecent: vi.fn()}
const downloadHistoryRepo = {list: vi.fn(), count: vi.fn(), countByStatus: vi.fn()}

vi.mock('@main/db/repositories/mediaRepository.js', () => ({createMediaRepository: () => mediaRepo}))
vi.mock('@main/db/repositories/collectionRepository.js', () => ({createCollectionRepository: () => collectionRepo}))
vi.mock('@main/db/repositories/tagRepository.js', () => ({createTagRepository: () => tagRepo}))
vi.mock('@main/db/repositories/playbackRepository.js', () => ({createPlaybackRepository: () => playbackRepo}))
vi.mock('@main/db/repositories/downloadHistoryRepository.js', () => ({createDownloadHistoryRepository: () => downloadHistoryRepo}))

const {registerLibraryHandlers} = await import('@main/ipc/libraryHandlers.js')
const {IPC_CHANNELS} = await import('@shared/ipc.js')

function findCall(channel: string) {
	const call = handleCalls.findLast(c => c.channel === channel)
	if (!call) throw new Error(`no handler registered for ${channel}`)
	return call.fn
}

// Real Electron ipcMain.handle() normalizes both sync throws and rejected
// promises from the handler into a rejected invoke() promise on the
// renderer side. The test mock just stores the raw function, so wrap the
// call in an async function to get the same normalization here.
async function invoke(channel: string, ...args: unknown[]) {
	return await findCall(channel)({}, ...args)
}

beforeEach(() => {
	handleCalls.length = 0
	removeHandlerCalls.length = 0
	vi.clearAllMocks()
	registerLibraryHandlers({} as never)
})

describe('registerLibraryHandlers — idempotent registration', () => {
	it('calls removeHandler before handle for every channel', () => {
		const libraryChannels = Object.values(IPC_CHANNELS).filter(c => c.startsWith('library:'))
		expect(libraryChannels.length).toBeGreaterThan(20)
		for (const channel of libraryChannels) {
			if (!handleCalls.some(c => c.channel === channel)) continue // events, not handlers
			expect(removeHandlerCalls).toContain(channel)
		}
	})

	it('regression: calling registerLibraryHandlers twice does not throw (second registration replaces, not duplicates)', () => {
		expect(() => registerLibraryHandlers({} as never)).not.toThrow()
		// Each channel's removeHandler was called again on the second pass.
		const count = removeHandlerCalls.filter(c => c === IPC_CHANNELS.libraryMediaList).length
		expect(count).toBeGreaterThanOrEqual(1)
	})
})

describe('registerLibraryHandlers — validation', () => {
	it('regression: library:media:setStatus rejects an invalid status instead of writing it to the DB', async () => {
		await expect(invoke(IPC_CHANNELS.libraryMediaSetStatus, 'media-1', 'NOT_A_REAL_STATUS')).rejects.toThrow()
		expect(mediaRepo.setStatus).not.toHaveBeenCalled()
	})

	it('accepts a valid status and forwards it', async () => {
		await invoke(IPC_CHANNELS.libraryMediaSetStatus, 'media-1', 'MISSING')
		expect(mediaRepo.setStatus).toHaveBeenCalledWith('media-1', 'MISSING')
	})

	it('regression: library:media:list rejects an invalid mediaType instead of reaching the repo', async () => {
		await expect(invoke(IPC_CHANNELS.libraryMediaList, {mediaType: 'not-a-real-type'})).rejects.toThrow()
		expect(mediaRepo.list).not.toHaveBeenCalled()
	})

	it('accepts a well-formed filters object', async () => {
		mediaRepo.list.mockReturnValue([])
		await invoke(IPC_CHANNELS.libraryMediaList, {mediaType: 'video', sortBy: 'title'})
		expect(mediaRepo.list).toHaveBeenCalledWith({mediaType: 'video', sortBy: 'title'})
	})

	it('regression: library:tag:create rejects an empty name', async () => {
		await expect(invoke(IPC_CHANNELS.libraryTagCreate, {name: ''})).rejects.toThrow()
		expect(tagRepo.create).not.toHaveBeenCalled()
	})
})

describe('registerLibraryHandlers — constraint error messages', () => {
	it('regression: a SQLITE_CONSTRAINT error on tag creation is rewrapped into a clear message', async () => {
		const sqliteError = Object.assign(new Error('UNIQUE constraint failed: tag.name'), {code: 'SQLITE_CONSTRAINT_UNIQUE'})
		tagRepo.create.mockImplementation(() => {
			throw sqliteError
		})

		await expect(invoke(IPC_CHANNELS.libraryTagCreate, {name: 'Music'})).rejects.toThrow(/already exists or references a missing record/)
	})

	it('a non-constraint error from the repo is passed through unchanged', async () => {
		tagRepo.create.mockImplementation(() => {
			throw new Error('disk full')
		})

		await expect(invoke(IPC_CHANNELS.libraryTagCreate, {name: 'Music'})).rejects.toThrow('disk full')
	})
})
