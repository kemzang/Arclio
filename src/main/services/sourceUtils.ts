import {readdir, stat} from 'node:fs/promises'
import {join} from 'node:path'

export async function readdirRecursive(dir: string): Promise<string[]> {
	const results: string[] = []

	async function walk(currentDir: string): Promise<void> {
		const entries = await readdir(currentDir)
		for (const entry of entries) {
			const fullPath = join(currentDir, entry)
			const fileStat = await stat(fullPath)
			if (fileStat.isDirectory()) {
				await walk(fullPath)
			} else if (fileStat.isFile()) {
				results.push(fullPath)
			}
		}
	}

	try {
		await walk(dir)
	} catch (error) {
		// Directory doesn't exist or can't be read
	}

	return results
}
