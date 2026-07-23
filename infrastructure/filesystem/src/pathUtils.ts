import path from 'node:path'

export function normalizePath(p: string): string {
	return path.normalize(p)
}

export function getExtension(p: string): string {
	return path.extname(p).replace('.', '').toLowerCase()
}

export function getBasename(p: string): string {
	return path.basename(p, path.extname(p))
}

export function getDirectory(p: string): string {
	return path.dirname(p)
}

export function joinPaths(...parts: string[]): string {
	return path.join(...parts)
}

export function isAbsolute(p: string): boolean {
	return path.isAbsolute(p)
}
