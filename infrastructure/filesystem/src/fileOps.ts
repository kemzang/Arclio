import fs from 'node:fs/promises'
import path from 'node:path'

export async function ensureDirectory(dir: string): Promise<void> {
	await fs.mkdir(dir, {recursive: true})
}

export async function moveFile(from: string, to: string): Promise<void> {
	await ensureDirectory(path.dirname(to))
	await fs.rename(from, to)
}

export async function copyFile(from: string, to: string): Promise<void> {
	await ensureDirectory(path.dirname(to))
	await fs.copyFile(from, to)
}

export async function deleteFile(p: string): Promise<void> {
	await fs.unlink(p)
}

export async function fileExists(p: string): Promise<boolean> {
	try {
		await fs.access(p)
		return true
	} catch {
		return false
	}
}

export async function getFileSize(p: string): Promise<number> {
	const stat = await fs.stat(p)
	return stat.size
}
