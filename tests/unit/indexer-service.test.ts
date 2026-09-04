import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {afterEach, describe, expect, it, vi} from 'vitest'

const mediaRepo = {list: vi.fn(), create: vi.fn(), update: vi.fn()}
const assetRepo = {create: vi.fn(), getByPath: vi.fn()}

vi.mock('@main/db/repositories/mediaRepository.js', () => ({createMediaRepository: () => mediaRepo}))
vi.mock('@main/db/repositories/assetRepository.js', () => ({createAssetRepository: () => assetRepo}))

const {IndexerService} = await import('@main/services/IndexerService.js')

function makeDb() {
	return {transaction: (fn: () => unknown) => fn()}
}

async function tempFile(ext = '.mp4'): Promise<string> {
	const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'indexer-svc-'))
	const filePath = path.join(dir, `video${ext}`)
	await fs.writeFile(filePath, 'fake video bytes')
	return filePath
}

afterEach(() => {
	vi.resetAllMocks()
})

describe('IndexerService.indexFile — dedup check', () => {
	it('regression: checks for an existing asset by exact path, not a media_fts search', async () => {
		const filePath = await tempFile()
		assetRepo.getByPath.mockReturnValue(null)
		mediaRepo.create.mockReturnValue({id: 'media-1', title: 'video.mp4', mediaType: 'video'})

		const svc = new IndexerService(makeDb() as never)
		await svc.indexFile(filePath)

		expect(assetRepo.getByPath).toHaveBeenCalledWith(filePath)
		expect(mediaRepo.list).not.toHaveBeenCalled()
	})

	it('regression: a path already indexed as an asset is reported without re-creating the media', async () => {
		const filePath = await tempFile()
		assetRepo.getByPath.mockReturnValue({id: 'asset-1', mediaId: 'existing-media', path: filePath})

		const svc = new IndexerService(makeDb() as never)
		const result = await svc.indexFile(filePath)

		expect(result).toEqual({success: true, mediaId: 'existing-media'})
		expect(mediaRepo.create).not.toHaveBeenCalled()
	})

	it('regression: a path containing FTS5 operator characters (colon, dash) never reaches a MATCH query', async () => {
		// Reproduces the FTS5 syntax-error risk the old media_fts-based check
		// had — `:` and `-` are FTS5 column-filter/exclusion operators.
		// getByPath() is a plain equality lookup, so a path built from these
		// characters is passed straight through as an opaque string instead
		// of ever being parsed as a search query.
		const filePath = await tempFile()
		const trickyPath = path.join(path.dirname(filePath), 'vid-C:special.mp4')
		await fs.rename(filePath, trickyPath)
		assetRepo.getByPath.mockReturnValue(null)
		mediaRepo.create.mockReturnValue({id: 'media-1', title: 'video.mp4', mediaType: 'video'})

		const svc = new IndexerService(makeDb() as never)
		await expect(svc.indexFile(trickyPath)).resolves.toMatchObject({success: true})
		expect(assetRepo.getByPath).toHaveBeenCalledWith(trickyPath)
	})
})

describe('IndexerService.indexFile — atomic media+asset creation', () => {
	it('regression: an asset creation failure is reported as a failed result, not a partially-created media row', async () => {
		const filePath = await tempFile()
		assetRepo.getByPath.mockReturnValue(null)
		mediaRepo.create.mockReturnValue({id: 'media-1', title: 'video.mp4', mediaType: 'video'})
		assetRepo.create.mockImplementation(() => {
			throw new Error('disk full')
		})

		const svc = new IndexerService(makeDb() as never)
		const result = await svc.indexFile(filePath)

		expect(result.success).toBe(false)
	})

	it('creates media and asset on the happy path', async () => {
		const filePath = await tempFile()
		assetRepo.getByPath.mockReturnValue(null)
		mediaRepo.create.mockReturnValue({id: 'media-1', title: 'video.mp4', mediaType: 'video'})

		const svc = new IndexerService(makeDb() as never)
		const result = await svc.indexFile(filePath)

		expect(result).toEqual({success: true, mediaId: 'media-1'})
		expect(assetRepo.create).toHaveBeenCalledWith(expect.objectContaining({mediaId: 'media-1', path: filePath}))
	})
})
