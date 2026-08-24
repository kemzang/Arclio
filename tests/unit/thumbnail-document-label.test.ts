import {describe, expect, it} from 'vitest'
import {documentPlaceholderLabel} from '@main/services/ThumbnailService.js'

describe('documentPlaceholderLabel', () => {
	it('labels a PDF by its own format', () => {
		expect(documentPlaceholderLabel('/library/manual.pdf')).toBe('PDF')
	})

	it('labels non-PDF documents by their own format instead of claiming PDF', () => {
		// The `document` media type covers every DOCUMENT_EXTS entry, not just PDF.
		expect(documentPlaceholderLabel('/library/notes.docx')).toBe('DOCX')
		expect(documentPlaceholderLabel('/library/book.epub')).toBe('EPUB')
		expect(documentPlaceholderLabel('/library/readme.txt')).toBe('TXT')
		expect(documentPlaceholderLabel('/library/report.odt')).toBe('ODT')
	})

	it('is case insensitive about the extension', () => {
		expect(documentPlaceholderLabel('/library/SCAN.PDF')).toBe('PDF')
	})

	it('falls back to a generic label when there is no usable extension', () => {
		expect(documentPlaceholderLabel('/library/no-extension')).toBe('Document')
		expect(documentPlaceholderLabel('/library/.hiddenfile')).toBe('Document')
	})
})
