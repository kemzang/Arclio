import fs from 'node:fs/promises'
import path from 'node:path'

export class FolderScanner {
	#supportedExtensions = new Set(['mp4', 'webm', 'mkv', 'avi', 'mov', 'mp3', 'wav', 'flac', 'aac', 'ogg', 'pdf', 'epub', 'djvu', 'cbz', 'cbr', 'cb7', 'cbt', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'])

	async scan(folderPath: string): Promise<string[]> {
		const results: string[] = []
		await this.#scanDir(folderPath, results)
		return results
	}

	async #scanDir(dir: string, results: string[]): Promise<void> {
		const entries = await fs.readdir(dir, {withFileTypes: true})
		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name)
			if (entry.isDirectory()) {
				await this.#scanDir(fullPath, results)
			} else {
				const ext = path.extname(entry.name).replace('.', '').toLowerCase()
				if (this.#supportedExtensions.has(ext)) {
					results.push(fullPath)
				}
			}
		}
	}
}
