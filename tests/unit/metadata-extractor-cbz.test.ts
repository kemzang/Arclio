import {mkdtemp, rm, writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {crc32} from 'node:zlib'
import {afterAll, describe, expect, it} from 'vitest'
import {MetadataExtractor} from '@arclio/metadata'

// Same hand-rolled STORED-entry ZIP writer as archive-service.test.ts (no zip
// writer in the dependency tree — yauzl is a reader only). `declaredSize`
// lets a test claim an uncompressedSize that disagrees with the real body,
// to exercise yauzl's validateEntrySizes mismatch detection specifically.
function buildZip(entries: {name: string; body: Buffer; declaredSize?: number}[]): Buffer {
	const locals: Buffer[] = []
	const centrals: Buffer[] = []
	let offset = 0

	for (const entry of entries) {
		const name = Buffer.from(entry.name, 'utf8')
		const sum = crc32(entry.body)
		const declared = entry.declaredSize ?? entry.body.length

		const local = Buffer.alloc(30)
		local.writeUInt32LE(0x04034b50, 0)
		local.writeUInt16LE(20, 4)
		local.writeUInt16LE(0, 6)
		local.writeUInt16LE(0, 8)
		local.writeUInt32LE(0, 10)
		local.writeUInt32LE(sum, 14)
		local.writeUInt32LE(entry.body.length, 18) // compressed size (real, so the reader can read the bytes)
		local.writeUInt32LE(declared, 22) // uncompressed size (possibly a lie)
		local.writeUInt16LE(name.length, 26)
		local.writeUInt16LE(0, 28)
		locals.push(local, name, entry.body)

		const central = Buffer.alloc(46)
		central.writeUInt32LE(0x02014b50, 0)
		central.writeUInt16LE(20, 4)
		central.writeUInt16LE(20, 6)
		central.writeUInt16LE(0, 8)
		central.writeUInt16LE(0, 10)
		central.writeUInt32LE(0, 12)
		central.writeUInt32LE(sum, 16)
		central.writeUInt32LE(entry.body.length, 20)
		central.writeUInt32LE(declared, 24)
		central.writeUInt16LE(name.length, 28)
		central.writeUInt16LE(0, 30)
		central.writeUInt16LE(0, 32)
		central.writeUInt16LE(0, 34)
		central.writeUInt16LE(0, 36)
		central.writeUInt32LE(0, 38)
		central.writeUInt32LE(offset, 42)
		centrals.push(central, name)

		offset += local.length + name.length + entry.body.length
	}

	const centralBlock = Buffer.concat(centrals)
	const end = Buffer.alloc(22)
	end.writeUInt32LE(0x06054b50, 0)
	end.writeUInt16LE(0, 4)
	end.writeUInt16LE(0, 6)
	end.writeUInt16LE(entries.length, 8)
	end.writeUInt16LE(entries.length, 10)
	end.writeUInt32LE(centralBlock.length, 12)
	end.writeUInt32LE(offset, 16)
	end.writeUInt16LE(0, 20)

	return Buffer.concat([...locals, centralBlock, end])
}

let workDir: string

afterAll(async () => {
	if (workDir) await rm(workDir, {recursive: true, force: true})
})

async function writeCbz(name: string, entries: {name: string; body: Buffer; declaredSize?: number}[]): Promise<string> {
	workDir ??= await mkdtemp(join(tmpdir(), 'arclio-cbz-'))
	const target = join(workDir, name)
	await writeFile(target, buildZip(entries))
	return target
}

describe('MetadataExtractor.extract — CBZ zip-bomb hardening', () => {
	it('extracts normal ComicInfo.xml metadata and counts pages', async () => {
		const xml = '<ComicInfo><Title>Test Comic</Title><Series>Test Series</Series></ComicInfo>'
		const cbzPath = await writeCbz('normal.cbz', [
			{name: 'ComicInfo.xml', body: Buffer.from(xml, 'utf8')},
			{name: 'page01.jpg', body: Buffer.from('fake jpg bytes')}
		])
		const extractor = new MetadataExtractor()

		const result = await extractor.extract(cbzPath, 'comic')

		expect(result.title).toBe('Test Comic')
		if (result.mediaType === 'comic') expect(result.pageCount).toBe(1)
		else expect.unreachable('expected comic metadata')
	})

	it('regression: an honestly-declared oversized ComicInfo.xml is truncated instead of buffered in full', async () => {
		// 6MB of 'a' repeated inside a <Title> tag — exceeds the 5MB cap this
		// fix added. A real attack would use this to force multi-GB memory
		// use per comic scanned during library indexing.
		const oversized = `<ComicInfo><Title>${'a'.repeat(6 * 1024 * 1024)}</Title></ComicInfo>`
		const cbzPath = await writeCbz('oversized.cbz', [{name: 'ComicInfo.xml', body: Buffer.from(oversized, 'utf8')}])
		const extractor = new MetadataExtractor()

		const result = await extractor.extract(cbzPath, 'comic')

		// The extractor must still resolve (not hang, not OOM) — just without
		// the metadata from the abandoned oversized entry.
		expect(result.mediaType).toBe('comic')
		expect(result.title).toBe('')
	})

	it('regression: a lied (understated) uncompressed size is rejected instead of silently truncating the read', async () => {
		const body = Buffer.from('<ComicInfo><Title>Real</Title></ComicInfo>', 'utf8')
		// Claim the entry decompresses to 1 byte when it's actually much
		// larger — the classic zip-bomb metadata mismatch. validateEntrySizes
		// must catch this and error the stream rather than trust the lie.
		const cbzPath = await writeCbz('lied-size.cbz', [{name: 'ComicInfo.xml', body, declaredSize: 1}])
		const extractor = new MetadataExtractor()

		// Either the whole extract rejects, or it resolves without the lied
		// entry's data ever being trusted — what must never happen is the
		// mismatch being silently accepted and "Real" ending up as the title.
		const result = await extractor.extract(cbzPath, 'comic').catch(() => null)
		if (result) expect(result.title).not.toBe('Real')
	})
})
