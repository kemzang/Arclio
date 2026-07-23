import path from 'node:path'

export class ArchiveExtractor {
	#supportedExtensions = new Set(['cbz', 'cbr', 'cb7', 'cbt', 'zip', 'rar', '7z'])

	isSupported(filePath: string): boolean {
		const ext = path.extname(filePath).replace('.', '').toLowerCase()
		return this.#supportedExtensions.has(ext)
	}

	extractPages(_archivePath: string, _outputDir: string): Promise<string[]> {
		// Stub — would use yauzl for CBZ/ZIP, unrar for CBR/RAR
		return Promise.resolve([])
	}

	getPageCount(_archivePath: string): Promise<number> {
		// Stub
		return Promise.resolve(0)
	}

	getPage(_archivePath: string, _pageIndex: number): Promise<string> {
		// Stub — returns path to extracted page image
		return Promise.resolve('')
	}
}
