import * as yauzl from 'yauzl'
import type {ArchivePageData, ArchivePageList} from '@shared/api.js'

const IMAGE_ENTRY_PATTERN = /\.(jpe?g|png|gif|webp|bmp|avif)$/i

const MIME_BY_EXTENSION: Record<string, string> = {avif: 'image/avif', bmp: 'image/bmp', gif: 'image/gif', jpeg: 'image/jpeg', jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp'}

function mimeTypeFor(entryName: string): string {
	const extension = entryName.split('.').pop()?.toLowerCase() ?? ''
	return MIME_BY_EXTENSION[extension] ?? 'application/octet-stream'
}

function openArchive(archivePath: string): Promise<yauzl.ZipFile> {
	return new Promise((resolve, reject) => {
		yauzl.open(archivePath, {lazyEntries: true, validateEntrySizes: true, autoClose: false}, (err, zipFile) => {
			if (err) {
				reject(err)
				return
			}
			if (!zipFile) {
				reject(new Error(`Unable to open archive: ${archivePath}`))
				return
			}
			resolve(zipFile)
		})
	})
}

function collectImageEntries(zipFile: yauzl.ZipFile): Promise<yauzl.Entry[]> {
	return new Promise((resolve, reject) => {
		const entries: yauzl.Entry[] = []

		zipFile.on('entry', (entry: yauzl.Entry) => {
			if (!entry.fileName.endsWith('/') && IMAGE_ENTRY_PATTERN.test(entry.fileName)) {
				entries.push(entry)
			}
			zipFile.readEntry()
		})
		zipFile.on('end', () => {
			resolve(entries)
		})
		zipFile.on('error', reject)
		zipFile.readEntry()
	})
}

function readEntryBytes(zipFile: yauzl.ZipFile, entry: yauzl.Entry): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		zipFile.openReadStream(entry, (err, readStream) => {
			if (err) {
				reject(err)
				return
			}
			if (!readStream) {
				reject(new Error(`Unable to read archive entry: ${entry.fileName}`))
				return
			}

			const chunks: Buffer[] = []
			readStream.on('data', (chunk: Buffer) => {
				chunks.push(chunk)
			})
			readStream.on('end', () => {
				resolve(Buffer.concat(chunks))
			})
			readStream.on('error', reject)
		})
	})
}

interface OpenArchiveHandle {
	archivePath: string
	zipFile: yauzl.ZipFile
	entriesByName: Map<string, yauzl.Entry>
	sortedNames: string[]
}

/**
 * Reads comic-book archives (CBZ/ZIP) in the main process.
 *
 * The renderer must never import `yauzl` directly — it depends on Node's
 * `util`/`stream` builtins, which Vite externalizes for the browser and which
 * crash the renderer at module load.
 *
 * Keeps a single archive open between calls: the viewer reads one comic at a
 * time and pages through it, so re-scanning the central directory on every
 * page request would make paging O(entries) instead of O(1).
 */
export class ArchiveService {
	private handle: OpenArchiveHandle | null = null

	private async handleFor(archivePath: string): Promise<OpenArchiveHandle> {
		if (this.handle?.archivePath === archivePath) return this.handle

		this.close()

		const zipFile = await openArchive(archivePath)
		try {
			const entries = await collectImageEntries(zipFile)
			const entriesByName = new Map(entries.map(entry => [entry.fileName, entry]))
			const sortedNames = [...entriesByName.keys()].sort((a, b) => a.localeCompare(b, undefined, {numeric: true, sensitivity: 'base'}))
			this.handle = {archivePath, zipFile, entriesByName, sortedNames}
			return this.handle
		} catch (error) {
			zipFile.close()
			throw error
		}
	}

	/** Sorted list of image entry names inside the archive. */
	async listPages(archivePath: string): Promise<ArchivePageList> {
		try {
			const handle = await this.handleFor(archivePath)
			return {pages: handle.sortedNames}
		} catch (error) {
			return {pages: [], error: error instanceof Error ? error.message : String(error)}
		}
	}

	/** Raw bytes for a single archive entry, transferred to the renderer as a Uint8Array. */
	async readPage(archivePath: string, entryName: string): Promise<ArchivePageData> {
		try {
			const handle = await this.handleFor(archivePath)
			const entry = handle.entriesByName.get(entryName)
			if (!entry) {
				return {ok: false, error: `Entry not found in archive: ${entryName}`}
			}

			const bytes = await readEntryBytes(handle.zipFile, entry)
			return {ok: true, data: new Uint8Array(bytes), mimeType: mimeTypeFor(entryName)}
		} catch (error) {
			return {ok: false, error: error instanceof Error ? error.message : String(error)}
		}
	}

	/** Releases the cached archive handle. Called when the viewer closes. */
	close(): void {
		this.handle?.zipFile.close()
		this.handle = null
	}
}
