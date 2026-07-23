import fs from 'node:fs/promises'
import path from 'node:path'
import type {SourceFile} from './types'

export class FolderSource {
	async scan(folderPath: string): Promise<SourceFile[]> {
		const files: SourceFile[] = []
		await this.#scanDir(folderPath, files)
		return files
	}

	async #scanDir(dir: string, files: SourceFile[]): Promise<void> {
		const entries = await fs.readdir(dir, {withFileTypes: true})
		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name)
			if (entry.isDirectory()) {
				await this.#scanDir(fullPath, files)
			} else {
				const stat = await fs.stat(fullPath)
				files.push({path: fullPath, name: entry.name, size: stat.size, extension: path.extname(entry.name).replace('.', '').toLowerCase(), modifiedAt: stat.mtime})
			}
		}
	}
}
