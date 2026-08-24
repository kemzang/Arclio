import {spawn} from 'node:child_process'
import {access, constants, mkdir} from 'node:fs/promises'
import {extname, join} from 'node:path'
import {app} from 'electron'
import electronLog from 'electron-log/main.js'

const logger = electronLog.scope('thumbnail')

const THUMBNAIL_WIDTH = 320
const THUMBNAIL_HEIGHT = 180
const THUMBNAIL_QUALITY = 80

export interface ThumbnailOptions {
	ffmpegPath?: string
	cacheDir?: string
}

export interface ThumbnailResult {
	success: boolean
	thumbnailPath?: string
	error?: string
}

function getThumbnailDir(cacheDir?: string): string {
	const base = cacheDir ?? join(app.getPath('userData'), 'thumbnails')
	return join(base, 'media')
}

function getThumbnailPath(mediaId: string, cacheDir?: string): string {
	const dir = getThumbnailDir(cacheDir)
	return join(dir, `${mediaId}.jpg`)
}

async function ensureThumbnailDir(cacheDir?: string): Promise<void> {
	const dir = getThumbnailDir(cacheDir)
	await mkdir(dir, {recursive: true})
}

function runFFmpeg(ffmpegPath: string, args: string[], signal?: AbortSignal): Promise<void> {
	return new Promise((resolve, reject) => {
		const proc = spawn(ffmpegPath, args, {signal})
		let stderr = ''
		proc.stderr.on('data', (chunk: Buffer) => {
			stderr += chunk.toString()
		})
		proc.on('close', code => {
			if (code !== 0) {
				reject(new Error(`ffmpeg exited with code ${code}: ${stderr}`))
				return
			}
			resolve()
		})
		proc.on('error', reject)
	})
}

async function generateVideoThumbnail(ffmpegPath: string, videoPath: string, outputPath: string, signal?: AbortSignal): Promise<void> {
	// Get duration first
	const duration = await getVideoDuration(ffmpegPath, videoPath, signal)

	// Extract frame at 10% of duration
	const timestamp = duration > 0 ? (duration * 0.1).toFixed(2) : '00:00:01'

	await runFFmpeg(ffmpegPath, ['-ss', timestamp, '-i', videoPath, '-vframes', '1', '-vf', `scale=${THUMBNAIL_WIDTH}:${THUMBNAIL_HEIGHT}:force_original_aspect_ratio=decrease,pad=${THUMBNAIL_WIDTH}:${THUMBNAIL_HEIGHT}:(ow-iw)/2:(oh-ih)/2:color=black`, '-q:v', THUMBNAIL_QUALITY.toString(), '-y', outputPath], signal)
}

async function getVideoDuration(ffmpegPath: string, videoPath: string, signal?: AbortSignal): Promise<number> {
	return new Promise((resolve, reject) => {
		const proc = spawn(ffmpegPath, ['-i', videoPath, '-f', 'null', '-'], {signal})
		let stderr = ''
		proc.stderr.on('data', (chunk: Buffer) => {
			stderr += chunk.toString()
		})
		proc.on('close', () => {
			// Parse duration from stderr
			const match = /time=(\d{2}):(\d{2}):(\d{2})\.(\d{2})/.exec(stderr)
			if (match) {
				const hours = parseInt(match[1], 10)
				const minutes = parseInt(match[2], 10)
				const seconds = parseInt(match[3], 10)
				const centiseconds = parseInt(match[4], 10)
				resolve(hours * 3600 + minutes * 60 + seconds + centiseconds / 100)
			} else {
				resolve(0)
			}
		})
		proc.on('error', reject)
	})
}

async function generateImageThumbnail(imagePath: string, outputPath: string): Promise<void> {
	const sharp = (await import('sharp')).default
	await sharp(imagePath)
		.resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, {fit: 'inside', background: {r: 0, g: 0, b: 0, alpha: 0}})
		.flatten({background: {r: 0, g: 0, b: 0}})
		.jpeg({quality: THUMBNAIL_QUALITY})
		.toFile(outputPath)
}

/**
 * Label drawn on a document placeholder thumbnail.
 *
 * The `document` media type covers every DOCUMENT_EXTS entry (.pdf, .epub,
 * .doc, .docx, .txt, .rtf, .odt), so the label is derived from the file itself
 * rather than hardcoded — a .docx used to be shown as "PDF".
 */
export function documentPlaceholderLabel(documentPath: string): string {
	const ext = extname(documentPath).replace('.', '')
	return ext ? ext.toUpperCase() : 'Document'
}

async function generateDocumentThumbnail(documentPath: string, outputPath: string): Promise<void> {
	// PDFs get a real first-page render. Every other document format in
	// DOCUMENT_EXTS (.epub, .doc, .docx, .txt, .rtf, .odt) has no rasteriser
	// here, so it falls back to a placeholder labelled with its own format.
	if (extname(documentPath).toLowerCase() === '.pdf') {
		try {
			const {renderPdfFirstPage} = await import('@main/services/PdfThumbnailRenderer.js')
			const png = await renderPdfFirstPage(documentPath, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT)
			const sharp = (await import('sharp')).default
			await sharp(png)
				.flatten({background: {r: 255, g: 255, b: 255}})
				.jpeg({quality: THUMBNAIL_QUALITY})
				.toFile(outputPath)
			return
		} catch (error) {
			// A corrupt, encrypted or password-protected PDF must not fail the
			// whole indexing pass — fall through to the placeholder.
			logger.warn('PDF thumbnail render failed, using placeholder', {documentPath, error: error instanceof Error ? error.message : String(error)})
		}
	}

	await createPlaceholderThumbnail(outputPath, documentPlaceholderLabel(documentPath))
}

async function generateComicThumbnail(comicPath: string, outputPath: string): Promise<void> {
	const Yauzl = (await import('yauzl')).default

	return new Promise((resolve, reject) => {
		Yauzl.open(comicPath, {lazyEntries: true}, (err, zipfile) => {
			if (err) {
				reject(err)
				return
			}
			if (!zipfile) {
				reject(new Error('Failed to open comic file'))
				return
			}

			zipfile.readEntry()
			zipfile.on('entry', (entry: {fileName: string}) => {
				if (entry.fileName.endsWith('/')) {
					zipfile.readEntry()
					return
				}

				if (/\.(jpg|jpeg|png|gif|webp)$/i.test(entry.fileName)) {
					zipfile.openReadStream(entry as import('yauzl').Entry, (openErr, readStream) => {
						if (openErr || !readStream) {
							zipfile.readEntry()
							return
						}

						const chunks: Buffer[] = []
						readStream.on('data', (chunk: Buffer) => {
							chunks.push(chunk)
						})
						readStream.on('end', () => {
							void (async () => {
								try {
									const sharp = (await import('sharp')).default
									await sharp(Buffer.concat(chunks))
										.resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, {fit: 'inside', background: {r: 0, g: 0, b: 0, alpha: 0}})
										.flatten({background: {r: 0, g: 0, b: 0}})
										.jpeg({quality: THUMBNAIL_QUALITY})
										.toFile(outputPath)
									zipfile.close()
									resolve()
								} catch {
									zipfile.readEntry()
								}
							})()
						})
					})
				} else {
					zipfile.readEntry()
				}
			})

			zipfile.on('end', () => {
				void (async () => {
					zipfile.close()
					await createPlaceholderThumbnail(outputPath, 'Comic')
					resolve()
				})()
			})

			zipfile.on('error', reject)
		})
	})
}

async function createPlaceholderThumbnail(outputPath: string, label: string): Promise<void> {
	const sharp = (await import('sharp')).default
	const svg = `
		<svg width="${THUMBNAIL_WIDTH}" height="${THUMBNAIL_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
			<rect width="100%" height="100%" fill="#1a1a2e"/>
			<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#e0e0e0" font-family="sans-serif" font-size="24">${label}</text>
		</svg>
	`
	await sharp(Buffer.from(svg)).resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT).jpeg({quality: THUMBNAIL_QUALITY}).toFile(outputPath)
}

export class ThumbnailService {
	private readonly ffmpegPath: string
	private readonly cacheDir: string

	constructor(options?: ThumbnailOptions) {
		this.ffmpegPath = options?.ffmpegPath ?? 'ffmpeg'
		this.cacheDir = options?.cacheDir ?? join(app.getPath('userData'), 'thumbnails')
	}

	async generate(mediaId: string, filePath: string, mediaType: string, signal?: AbortSignal): Promise<ThumbnailResult> {
		try {
			await access(filePath, constants.R_OK)
			await ensureThumbnailDir(this.cacheDir)

			const outputPath = getThumbnailPath(mediaId, this.cacheDir)

			// Check if thumbnail already exists
			try {
				await access(outputPath, constants.R_OK)
				return {success: true, thumbnailPath: outputPath}
			} catch {
				// Thumbnail doesn't exist, generate it
			}

			switch (mediaType) {
				case 'video':
					await generateVideoThumbnail(this.ffmpegPath, filePath, outputPath, signal)
					break
				case 'audio':
					await createPlaceholderThumbnail(outputPath, 'Audio')
					break
				case 'image':
					await generateImageThumbnail(filePath, outputPath)
					break
				case 'document':
					await generateDocumentThumbnail(filePath, outputPath)
					break
				case 'comic':
					await generateComicThumbnail(filePath, outputPath)
					break
				default:
					await createPlaceholderThumbnail(outputPath, 'Media')
			}

			logger.info(`Thumbnail generated for ${mediaId}: ${outputPath}`)
			return {success: true, thumbnailPath: outputPath}
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error)
			logger.error(`Thumbnail generation failed for ${mediaId}: ${message}`)
			return {success: false, error: message}
		}
	}

	async get(mediaId: string): Promise<string | null> {
		const thumbnailPath = getThumbnailPath(mediaId, this.cacheDir)
		try {
			await access(thumbnailPath, constants.R_OK)
			return thumbnailPath
		} catch {
			return null
		}
	}

	async regenerate(mediaId: string, filePath: string, mediaType: string, signal?: AbortSignal): Promise<ThumbnailResult> {
		// Delete existing thumbnail first
		const existingPath = getThumbnailPath(mediaId, this.cacheDir)
		try {
			await access(existingPath, constants.R_OK)
			const {unlink} = await import('node:fs/promises')
			await unlink(existingPath)
		} catch {
			// File doesn't exist, continue
		}

		return this.generate(mediaId, filePath, mediaType, signal)
	}

	async delete(mediaId: string): Promise<boolean> {
		const thumbnailPath = getThumbnailPath(mediaId, this.cacheDir)
		try {
			const {unlink} = await import('node:fs/promises')
			await unlink(thumbnailPath)
			return true
		} catch {
			return false
		}
	}

	getThumbnailUrl(mediaId: string): string {
		const thumbnailPath = getThumbnailPath(mediaId, this.cacheDir)
		return `file://${thumbnailPath}`
	}

	/**
	 * Deletes every generated thumbnail. Thumbnails are a derived cache, so this
	 * is non-destructive: anything cleared is regenerated on next access.
	 */
	async clearCache(): Promise<{removed: number; freedBytes: number}> {
		const {readdir, stat, unlink} = await import('node:fs/promises')
		let removed = 0
		let freedBytes = 0

		let entries: string[]
		try {
			entries = await readdir(this.cacheDir)
		} catch {
			return {removed: 0, freedBytes: 0}
		}

		for (const entry of entries) {
			if (!entry.endsWith('.jpg')) continue
			const target = join(this.cacheDir, entry)
			try {
				const info = await stat(target)
				await unlink(target)
				removed++
				freedBytes += info.size
			} catch {
				// Already gone or locked — nothing to reclaim for this entry.
			}
		}

		logger.info(`Cleared thumbnail cache: ${removed} files, ${freedBytes} bytes`)
		return {removed, freedBytes}
	}
}
