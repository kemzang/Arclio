import {XMLParser} from 'fast-xml-parser'
import path from 'node:path'
import type {Entry} from 'yauzl'

// EPUBs are opened from arbitrary user-picked files (library import), so a
// malicious .epub is untrusted input, not just a malformed one. Without a
// cap, a single crafted entry (container.xml, the OPF, or the "cover") can
// decompress to an unbounded amount of memory before this code ever gets to
// look at its content. 100MB comfortably covers even a very large cover
// image; container.xml/OPF are always tiny in practice.
const MAX_ZIP_ENTRY_BYTES = 100 * 1024 * 1024

/**
 * Pulls the cover image out of an EPUB.
 *
 * An EPUB is a zip. Finding the cover means walking three hops:
 *   META-INF/container.xml  ->  the OPF package file
 *   the OPF manifest        ->  the cover item's href
 *   href (relative to OPF)  ->  the zip entry holding the image
 *
 * Real-world OPF files vary a lot — namespace prefixes, attribute order,
 * single vs double quotes, EPUB2 vs EPUB3 cover conventions — so the XML is
 * parsed properly rather than pattern-matched.
 */

// `isArray: false` is the default, so a manifest with one <item> parses to an
// object instead of an array. Every read below normalises for that.
const parser = new XMLParser({ignoreAttributes: false, attributeNamePrefix: '@_', removeNSPrefix: true})

function asArray<T>(value: T | T[] | undefined): T[] {
	if (value === undefined) return []
	return Array.isArray(value) ? value : [value]
}

interface ManifestItem {
	'@_id'?: string
	'@_href'?: string
	'@_media-type'?: string
	'@_properties'?: string
}

/** Path of the OPF package file, as declared by META-INF/container.xml. */
export function resolveOpfPath(containerXml: string): string | null {
	const parsed: unknown = parser.parse(containerXml)
	const rootfiles = (parsed as {container?: {rootfiles?: {rootfile?: unknown}}})?.container?.rootfiles
	const first = asArray(rootfiles?.rootfile)[0] as {'@_full-path'?: string} | undefined
	return first?.['@_full-path'] ?? null
}

/** Cover href from an OPF package document, relative to the OPF's own folder. */
export function resolveCoverHref(opfXml: string): string | null {
	const parsed: unknown = parser.parse(opfXml)
	const pkg = (parsed as {package?: {manifest?: {item?: unknown}; metadata?: {meta?: unknown}}})?.package
	const items = asArray(pkg?.manifest?.item) as ManifestItem[]

	// EPUB3: the manifest item declares properties="cover-image".
	const declared = items.find(item => item['@_properties']?.split(/\s+/).includes('cover-image'))
	if (declared?.['@_href']) return declared['@_href']

	// EPUB2: <meta name="cover" content="<manifest item id>"/>.
	const metas = asArray(pkg?.metadata?.meta) as Array<{'@_name'?: string; '@_content'?: string}>
	const coverId = metas.find(meta => meta['@_name']?.toLowerCase() === 'cover')?.['@_content']
	if (coverId) {
		const referenced = items.find(item => item['@_id'] === coverId)
		if (referenced?.['@_href']) return referenced['@_href']
	}

	// Neither convention used — the first image in the manifest is the best guess.
	const firstImage = items.find(item => item['@_media-type']?.startsWith('image/'))
	return firstImage?.['@_href'] ?? null
}

/**
 * Reads named entries out of a zip in a single pass.
 *
 * yauzl streams entries and cannot seek by name, and the OPF path is only known
 * after container.xml is read, so the archive is opened once per lookup rather
 * than held open across an async parse.
 */
async function readZipEntry(zipPath: string, entryName: string): Promise<Buffer> {
	const Yauzl = (await import('yauzl')).default

	return new Promise((resolve, reject) => {
		// validateEntrySizes: yauzl aborts the read stream with an error if the
		// decompressed byte count disagrees with the entry's declared
		// uncompressedSize — the classic zip-bomb trick of understating size
		// in the central directory.
		Yauzl.open(zipPath, {lazyEntries: true, validateEntrySizes: true}, (err, zipfile) => {
			if (err) return reject(err)
			if (!zipfile) return reject(new Error(`Cannot open ${path.basename(zipPath)}`))

			let found = false
			zipfile.readEntry()
			zipfile.on('entry', (entry: Entry) => {
				if (entry.fileName !== entryName) return zipfile.readEntry()

				found = true
				// Catches an *honestly* declared oversized entry — validateEntrySizes
				// only catches a mismatch between declared and actual size, not a
				// declared size that's simply too large to read into memory.
				if (entry.uncompressedSize > MAX_ZIP_ENTRY_BYTES) {
					zipfile.close()
					return reject(new Error(`${entryName} in ${path.basename(zipPath)} exceeds the ${MAX_ZIP_ENTRY_BYTES} byte limit (${entry.uncompressedSize} bytes declared)`))
				}
				zipfile.openReadStream(entry, (streamErr, readStream) => {
					if (streamErr || !readStream) {
						zipfile.close()
						return reject(streamErr ?? new Error(`Cannot read ${entryName}`))
					}
					const chunks: Buffer[] = []
					let total = 0
					readStream.on('data', (chunk: Buffer) => {
						total += chunk.length
						if (total > MAX_ZIP_ENTRY_BYTES) {
							readStream.destroy()
							zipfile.close()
							reject(new Error(`${entryName} in ${path.basename(zipPath)} exceeded the ${MAX_ZIP_ENTRY_BYTES} byte limit while reading`))
							return
						}
						chunks.push(chunk)
					})
					readStream.on('error', reject)
					readStream.on('end', () => {
						zipfile.close()
						resolve(Buffer.concat(chunks))
					})
				})
			})
			zipfile.on('end', () => {
				if (!found) reject(new Error(`${entryName} not found in ${path.basename(zipPath)}`))
			})
			zipfile.on('error', reject)
		})
	})
}

export async function extractEpubCover(epubPath: string): Promise<Buffer> {
	const container = await readZipEntry(epubPath, 'META-INF/container.xml')
	const opfPath = resolveOpfPath(container.toString('utf8'))
	if (!opfPath) throw new Error(`No OPF rootfile declared in ${path.basename(epubPath)}`)

	const opf = await readZipEntry(epubPath, opfPath)
	const coverHref = resolveCoverHref(opf.toString('utf8'))
	if (!coverHref) throw new Error(`No cover image declared in ${path.basename(epubPath)}`)

	// hrefs are relative to the OPF's folder, and zip entries always use "/".
	const opfDir = path.posix.dirname(opfPath)
	const entryName = opfDir === '.' ? coverHref : path.posix.join(opfDir, coverHref)
	return readZipEntry(epubPath, entryName)
}
