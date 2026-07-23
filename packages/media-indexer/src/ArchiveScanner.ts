import path from 'node:path'

export class ArchiveScanner {
	#supportedExtensions = new Set(['cbz', 'cbr', 'cb7', 'cbt', 'zip', 'rar', '7z'])

	isArchive(filePath: string): boolean {
		const ext = path.extname(filePath).replace('.', '').toLowerCase()
		return this.#supportedExtensions.has(ext)
	}

	extractPages(_archivePath: string): Promise<string[]> {
		// Stub — would use yauzl/unrar in full implementation
		return Promise.resolve([])
	}
}
