import path from 'node:path'
import {describe, expect, it} from 'vitest'
import {extractEpubCover, resolveCoverHref, resolveOpfPath} from '@main/services/EpubCoverExtractor.js'

const SAMPLE_EPUB = path.resolve('tests/fixtures/documents/sample.epub')

describe('resolveOpfPath', () => {
	it('reads the rootfile path out of container.xml', () => {
		const xml = `<?xml version="1.0"?>
			<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
				<rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
			</container>`

		expect(resolveOpfPath(xml)).toBe('OEBPS/content.opf')
	})

	it('returns null when there is no rootfile', () => {
		expect(resolveOpfPath('<container><rootfiles/></container>')).toBeNull()
	})
})

describe('resolveCoverHref', () => {
	it('prefers the EPUB3 cover-image property', () => {
		const opf = `<package xmlns="http://www.idpf.org/2007/opf">
			<manifest>
				<item id="a" href="pic.jpg" media-type="image/jpeg"/>
				<item id="c" href="real-cover.jpg" media-type="image/jpeg" properties="cover-image"/>
			</manifest>
		</package>`

		expect(resolveCoverHref(opf)).toBe('real-cover.jpg')
	})

	it('falls back to the EPUB2 <meta name="cover"> id reference', () => {
		const opf = `<package xmlns="http://www.idpf.org/2007/opf">
			<metadata><meta name="cover" content="cover-id"/></metadata>
			<manifest>
				<item id="other" href="chap1.xhtml" media-type="application/xhtml+xml"/>
				<item id="cover-id" href="images/front.png" media-type="image/png"/>
			</manifest>
		</package>`

		expect(resolveCoverHref(opf)).toBe('images/front.png')
	})

	it('falls back to the first manifest image when nothing declares a cover', () => {
		const opf = `<package xmlns="http://www.idpf.org/2007/opf">
			<manifest>
				<item id="t" href="chap1.xhtml" media-type="application/xhtml+xml"/>
				<item id="i" href="art/first.jpeg" media-type="image/jpeg"/>
				<item id="j" href="art/second.jpeg" media-type="image/jpeg"/>
			</manifest>
		</package>`

		expect(resolveCoverHref(opf)).toBe('art/first.jpeg')
	})

	it('returns null when the manifest holds no image at all', () => {
		const opf = `<package xmlns="http://www.idpf.org/2007/opf">
			<manifest><item id="t" href="chap1.xhtml" media-type="application/xhtml+xml"/></manifest>
		</package>`

		expect(resolveCoverHref(opf)).toBeNull()
	})

	it('handles a single-item manifest, which the XML parser does not give as an array', () => {
		const opf = `<package xmlns="http://www.idpf.org/2007/opf">
			<manifest><item id="c" href="only.jpg" media-type="image/jpeg" properties="cover-image"/></manifest>
		</package>`

		expect(resolveCoverHref(opf)).toBe('only.jpg')
	})
})

describe('extractEpubCover', () => {
	it('pulls the real cover image out of an epub container', async () => {
		const cover = await extractEpubCover(SAMPLE_EPUB)

		// JPEG SOI marker — a real image came back, not a stub.
		expect(cover.subarray(0, 2)).toEqual(Buffer.from([0xff, 0xd8]))
		expect(cover.byteLength).toBeGreaterThan(100)
	})

	it('resolves the cover href relative to the OPF directory', async () => {
		// The fixture declares href="cover.jpg" inside OEBPS/content.opf, so the
		// entry actually lives at OEBPS/cover.jpg. A naive lookup on the bare href
		// would miss it.
		const sharp = (await import('sharp')).default
		const metadata = await sharp(await extractEpubCover(SAMPLE_EPUB)).metadata()

		expect(metadata.width).toBe(120)
		expect(metadata.height).toBe(180)
	})

	it('rejects a file that is not a readable epub', async () => {
		await expect(extractEpubCover(path.resolve('tests/fixtures/documents/sample.pdf'))).rejects.toThrow()
	})
})
