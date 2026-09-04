import {mkdtemp, rm, writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {crc32} from 'node:zlib'
import {afterAll, beforeAll, describe, expect, it} from 'vitest'
import {ArchiveService} from '@main/services/ArchiveService.js'

let workDir: string
let comicPath: string
let emptyPath: string

/**
 * Builds a ZIP with stored (uncompressed) entries.
 *
 * Written by hand rather than pulled from a package: the repo ships a ZIP
 * *reader* (yauzl) but no writer, and a real archive on disk is what makes this
 * an honest test of `ArchiveService`.
 */
function buildZip(entries: {name: string; body: Buffer}[]): Buffer {
	const locals: Buffer[] = []
	const centrals: Buffer[] = []
	let offset = 0

	for (const entry of entries) {
		const name = Buffer.from(entry.name, 'utf8')
		const sum = crc32(entry.body)

		const local = Buffer.alloc(30)
		local.writeUInt32LE(0x04034b50, 0) // local file header signature
		local.writeUInt16LE(20, 4) // version needed
		local.writeUInt16LE(0, 6) // flags
		local.writeUInt16LE(0, 8) // compression: stored
		local.writeUInt32LE(0, 10) // mod time + date
		local.writeUInt32LE(sum, 14)
		local.writeUInt32LE(entry.body.length, 18) // compressed size
		local.writeUInt32LE(entry.body.length, 22) // uncompressed size
		local.writeUInt16LE(name.length, 26)
		local.writeUInt16LE(0, 28) // extra length
		locals.push(local, name, entry.body)

		const central = Buffer.alloc(46)
		central.writeUInt32LE(0x02014b50, 0) // central directory signature
		central.writeUInt16LE(20, 4) // version made by
		central.writeUInt16LE(20, 6) // version needed
		central.writeUInt16LE(0, 8)
		central.writeUInt16LE(0, 10)
		central.writeUInt32LE(0, 12)
		central.writeUInt32LE(sum, 16)
		central.writeUInt32LE(entry.body.length, 20)
		central.writeUInt32LE(entry.body.length, 24)
		central.writeUInt16LE(name.length, 28)
		central.writeUInt16LE(0, 30) // extra
		central.writeUInt16LE(0, 32) // comment
		central.writeUInt16LE(0, 34) // disk number
		central.writeUInt16LE(0, 36) // internal attrs
		central.writeUInt32LE(0, 38) // external attrs
		central.writeUInt32LE(offset, 42) // local header offset
		centrals.push(central, name)

		offset += local.length + name.length + entry.body.length
	}

	const centralBlock = Buffer.concat(centrals)
	const end = Buffer.alloc(22)
	end.writeUInt32LE(0x06054b50, 0) // end of central directory signature
	end.writeUInt16LE(0, 4)
	end.writeUInt16LE(0, 6)
	end.writeUInt16LE(entries.length, 8)
	end.writeUInt16LE(entries.length, 10)
	end.writeUInt32LE(centralBlock.length, 12)
	end.writeUInt32LE(offset, 16)
	end.writeUInt16LE(0, 20) // comment length

	return Buffer.concat([...locals, centralBlock, end])
}

async function writeZip(target: string, entries: {name: string; body: Buffer}[]): Promise<void> {
	await writeFile(target, buildZip(entries))
}

// 1x1 PNG — enough that the bytes round-trip through the archive verifiably.
const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c6360000002000100ffff03000006000557bfabd40000000049454e44ae426082', 'hex')

beforeAll(async () => {
	workDir = await mkdtemp(join(tmpdir(), 'arclio-archive-'))
	comicPath = join(workDir, 'book.cbz')
	emptyPath = join(workDir, 'empty.cbz')

	await writeZip(comicPath, [
		{name: 'page10.png', body: PNG},
		{name: 'page2.png', body: PNG},
		{name: 'page1.png', body: PNG},
		{name: 'notes.txt', body: Buffer.from('not an image')}
	])
	await writeZip(emptyPath, [{name: 'readme.txt', body: Buffer.from('no images here')}])
})

afterAll(async () => {
	await rm(workDir, {recursive: true, force: true})
})

describe('ArchiveService', () => {
	it('lists only image entries, in natural page order', async () => {
		const service = new ArchiveService()
		const {pages, error} = await service.listPages(comicPath)

		expect(error).toBeUndefined()
		// Natural sort: page2 before page10, and the .txt entry is excluded.
		expect(pages).toEqual(['page1.png', 'page2.png', 'page10.png'])
		await service.close()
	})

	it('reads an entry back as bytes with its mime type', async () => {
		const service = new ArchiveService()
		const page = await service.readPage(comicPath, 'page1.png')

		expect(page.ok).toBe(true)
		if (!page.ok) return
		expect(page.mimeType).toBe('image/png')
		expect(Buffer.from(page.data)).toEqual(PNG)
		await service.close()
	})

	it('serves repeated reads from one open handle', async () => {
		const service = new ArchiveService()
		const first = await service.readPage(comicPath, 'page1.png')
		const second = await service.readPage(comicPath, 'page2.png')

		expect(first.ok).toBe(true)
		expect(second.ok).toBe(true)
		await service.close()
	})

	it('reports an archive with no images as empty rather than failing', async () => {
		const service = new ArchiveService()
		const {pages, error} = await service.listPages(emptyPath)

		expect(pages).toEqual([])
		expect(error).toBeUndefined()
		await service.close()
	})

	it('returns an error for a missing archive instead of throwing', async () => {
		const service = new ArchiveService()
		const {pages, error} = await service.listPages(join(workDir, 'nope.cbz'))

		expect(pages).toEqual([])
		expect(error).toBeTruthy()
		await service.close()
	})

	it('returns an error for an entry that is not in the archive', async () => {
		const service = new ArchiveService()
		const page = await service.readPage(comicPath, 'missing.png')

		expect(page.ok).toBe(false)
		if (page.ok) return
		expect(page.error).toContain('missing.png')
		await service.close()
	})

	it('switches cleanly between archives', async () => {
		const service = new ArchiveService()
		expect((await service.listPages(comicPath)).pages).toHaveLength(3)
		expect((await service.listPages(emptyPath)).pages).toHaveLength(0)
		expect((await service.listPages(comicPath)).pages).toHaveLength(3)
		await service.close()
	})

	it('regression: switching to a different archive mid-read does not close the handle a read is still streaming from', async () => {
		// Precise reproduction: comicPath is already cached (its zipFile open),
		// then a read from that cached handle is started (real async I/O, so
		// it yields past its first await) *before* a call for a different
		// archive arrives. Before serializing handleFor()/close(), the second
		// call's handleFor() saw a cache miss and called close() synchronously
		// — closing the very zipFile the first call's readEntryBytes() was
		// still mid-stream on.
		const comicPath2 = join(workDir, 'book2.cbz')
		await writeZip(comicPath2, [{name: 'onlypage.png', body: PNG}])
		const service = new ArchiveService()

		// Prime the cache for comicPath.
		await service.listPages(comicPath)

		const [fromComic1, fromComic2] = await Promise.all([service.readPage(comicPath, 'page1.png'), service.readPage(comicPath2, 'onlypage.png')])

		expect(fromComic1.ok).toBe(true)
		if (fromComic1.ok) expect(Buffer.from(fromComic1.data)).toEqual(PNG)
		expect(fromComic2.ok).toBe(true)
		if (fromComic2.ok) expect(Buffer.from(fromComic2.data)).toEqual(PNG)

		await service.close()
	})
})
