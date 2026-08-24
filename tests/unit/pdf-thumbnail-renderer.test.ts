import {readFile} from 'node:fs/promises'
import path from 'node:path'
import {describe, expect, it} from 'vitest'
import {renderPdfFirstPage} from '@main/services/PdfThumbnailRenderer.js'

const SAMPLE_PDF = path.resolve('tests/fixtures/documents/sample.pdf')

describe('renderPdfFirstPage', () => {
	it('renders the first page as a PNG buffer that fits the requested box', async () => {
		const png = await renderPdfFirstPage(SAMPLE_PDF, 320, 180)

		// PNG magic number — proves a real raster came back, not a stub.
		expect(png.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
		expect(png.byteLength).toBeGreaterThan(1_000)
	})

	it('scales to fit inside the box without upscaling past it', async () => {
		const png = await renderPdfFirstPage(SAMPLE_PDF, 320, 180)
		// PNG IHDR carries width/height as big-endian uint32 at offsets 16 and 20.
		const width = png.readUInt32BE(16)
		const height = png.readUInt32BE(20)

		expect(width).toBeLessThanOrEqual(320)
		expect(height).toBeLessThanOrEqual(180)
		// The sample page is portrait (612x792), so height is the limiting side.
		expect(height).toBe(180)
	})

	it('renders actual page content rather than a blank canvas', async () => {
		const sharp = (await import('sharp')).default
		const png = await renderPdfFirstPage(SAMPLE_PDF, 320, 180)
		const stats = await sharp(png).stats()

		// The sample page paints black text and a saturated blue rectangle on
		// white. A blank canvas would leave RGB pinned at 255, so a low minimum on
		// each colour channel is what proves real page content was rasterised.
		// Alpha is skipped: the canvas is fully opaque, so its min is always 255.
		for (const channel of stats.channels.slice(0, 3)) {
			expect(channel.min).toBeLessThan(64)
		}
		expect(stats.entropy).toBeGreaterThan(0)
	})

	it('is deterministic for the same input', async () => {
		const first = await renderPdfFirstPage(SAMPLE_PDF, 320, 180)
		const second = await renderPdfFirstPage(SAMPLE_PDF, 320, 180)

		expect(first.equals(second)).toBe(true)
	})

	it('rejects a file that is not a readable PDF', async () => {
		await expect(renderPdfFirstPage(path.resolve('tests/fixtures/documents/does-not-exist.pdf'), 320, 180)).rejects.toThrow()
	})

	it('rejects a file whose bytes are not a PDF', async () => {
		const notAPdf = path.resolve('package.json')
		await expect(renderPdfFirstPage(notAPdf, 320, 180)).rejects.toThrow()
		// sanity: the fixture really is readable, so the rejection is about content
		await expect(readFile(notAPdf)).resolves.toBeDefined()
	})
})
