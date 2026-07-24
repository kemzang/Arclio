import {spawn} from 'node:child_process'
import {stat} from 'node:fs/promises'
import type {MediaMetadata} from './types.js'
import type {MediaType} from '@arclio/media'

export interface ExtractOptions {
	ffprobePath?: string
}

interface FFprobeStream {
	codec_name?: string
	codec_type?: string
	width?: number
	height?: number
	r_frame_rate?: string
	bit_rate?: string
	sample_rate?: string
	channels?: number
	tags?: Record<string, string>
	duration?: string
}

interface FFprobeFormat {
	duration?: string
	size?: string
	bit_rate?: string
	tags?: Record<string, string>
}

interface FFprobeOutput {
	streams?: FFprobeStream[]
	format?: FFprobeFormat
}

function parseFps(fps: string | undefined): number {
	if (!fps) return 0
	const match = /^(\d+)\s*\/\s*(\d+)$/.exec(fps)
	if (match) {
		const num = parseInt(match[1], 10)
		const den = parseInt(match[2], 10)
		return den > 0 ? Math.round((num / den) * 100) / 100 : 0
	}
	const val = parseFloat(fps)
	return isNaN(val) ? 0 : val
}

function parseDuration(val: string | undefined): number | undefined {
	if (!val) return undefined
	const num = parseFloat(val)
	return isNaN(num) ? undefined : num
}

function parseBitrate(val: string | undefined): number {
	if (!val) return 0
	const num = parseInt(val, 10)
	return isNaN(num) ? 0 : num
}

function parseSampleRate(val: string | undefined): number {
	if (!val) return 0
	const num = parseInt(val, 10)
	return isNaN(num) ? 0 : num
}

function runFFprobe(ffprobePath: string, filePath: string, signal?: AbortSignal): Promise<FFprobeOutput> {
	return new Promise((resolve, reject) => {
		const args = ['-v', 'quiet', '-print_format', 'json', '-show_format', '-show_streams', filePath]
		const proc = spawn(ffprobePath, args, {signal})
		let stdout = ''
		let stderr = ''
		proc.stdout.on('data', (chunk: Buffer) => {
			stdout += chunk.toString()
		})
		proc.stderr.on('data', (chunk: Buffer) => {
			stderr += chunk.toString()
		})
		proc.on('close', code => {
			if (code !== 0) {
				reject(new Error(`ffprobe exited with code ${code}: ${stderr}`))
				return
			}
			try {
				resolve(JSON.parse(stdout) as FFprobeOutput)
			} catch {
				reject(new Error(`Failed to parse ffprobe output: ${stderr}`))
			}
		})
		proc.on('error', reject)
	})
}

function getVideoStream(streams: FFprobeStream[]): FFprobeStream | undefined {
	return streams.find(s => s.codec_type === 'video')
}

function getAudioStream(streams: FFprobeStream[]): FFprobeStream | undefined {
	return streams.find(s => s.codec_type === 'audio')
}

export class MetadataExtractor {
	private readonly ffprobePath: string

	constructor(options?: ExtractOptions) {
		this.ffprobePath = options?.ffprobePath ?? 'ffprobe'
	}

	async extract(filePath: string, mediaType: MediaType, signal?: AbortSignal): Promise<MediaMetadata> {
		const fileStat = await stat(filePath)

		switch (mediaType) {
			case 'video':
				return this.extractVideo(filePath, fileStat, signal)
			case 'audio':
				return this.extractAudio(filePath, fileStat, signal)
			case 'image':
				return this.extractImage(filePath, fileStat, signal)
			case 'document':
				return this.extractDocument(filePath, fileStat, signal)
			case 'comic':
				return this.extractComic(filePath, fileStat, signal)
			default:
				throw new Error(`Unsupported media type: ${String(mediaType)}`)
		}
	}

	private async extractVideo(filePath: string, fileStat: import('node:fs').Stats, signal?: AbortSignal): Promise<MediaMetadata> {
		const probe = await runFFprobe(this.ffprobePath, filePath, signal)
		const streams = probe.streams ?? []
		const videoStream = getVideoStream(streams)
		const audioStream = getAudioStream(streams)
		const format = probe.format
		const tags = {...(format?.tags ?? {}), ...(videoStream?.tags ?? {})}

		if (!videoStream) {
			throw new Error('No video stream found in file')
		}

		const resolution = videoStream.width && videoStream.height ? `${videoStream.width}x${videoStream.height}` : 'unknown'

		return {
			mediaType: 'video',
			title: tags.title ?? tags.title_eng ?? '',
			duration: parseDuration(videoStream.duration ?? format?.duration),
			fileSize: fileStat.size,
			createdAt: fileStat.birthtime,
			modifiedAt: fileStat.mtime,
			codec: videoStream.codec_name ?? 'unknown',
			resolution,
			fps: parseFps(videoStream.r_frame_rate),
			bitrate: parseBitrate(videoStream.bit_rate ?? format?.bit_rate),
			audioCodec: audioStream?.codec_name
		}
	}

	private async extractAudio(filePath: string, fileStat: import('node:fs').Stats, signal?: AbortSignal): Promise<MediaMetadata> {
		const probe = await runFFprobe(this.ffprobePath, filePath, signal)
		const streams = probe.streams ?? []
		const audioStream = getAudioStream(streams)
		const format = probe.format
		const tags = {...(format?.tags ?? {}), ...(audioStream?.tags ?? {})}

		if (!audioStream) {
			throw new Error('No audio stream found in file')
		}

		return {
			mediaType: 'audio',
			title: tags.title ?? tags.title_eng ?? '',
			duration: parseDuration(audioStream.duration ?? format?.duration),
			fileSize: fileStat.size,
			createdAt: fileStat.birthtime,
			modifiedAt: fileStat.mtime,
			codec: audioStream.codec_name ?? 'unknown',
			bitrate: parseBitrate(audioStream.bit_rate ?? format?.bit_rate),
			sampleRate: parseSampleRate(audioStream.sample_rate),
			channels: audioStream.channels ?? 0,
			artist: tags.artist ?? tags.artist_eng,
			album: tags.album ?? tags.album_eng,
			trackNumber: tags.track ? parseInt(tags.track, 10) : undefined
		}
	}

	private async extractImage(filePath: string, fileStat: import('node:fs').Stats, _signal?: AbortSignal): Promise<MediaMetadata> {
		// Lazy import sharp to avoid requiring it at build time for non-image paths
		const sharp = (await import('sharp')).default
		const image = sharp(filePath)
		const metadata = await image.metadata()

		let exif: Record<string, unknown> | undefined
		if (metadata.exif) {
			try {
				// EXIF data is returned as a Buffer, parse it
				const exifBuffer = metadata.exif
				if (exifBuffer && exifBuffer.length > 0) {
					exif = {bufferLength: exifBuffer.length}
				}
			} catch {
				// EXIF parsing failed
			}
		}

		return {mediaType: 'image', title: '', fileSize: fileStat.size, createdAt: fileStat.birthtime, modifiedAt: fileStat.mtime, width: metadata.width ?? 0, height: metadata.height ?? 0, format: metadata.format ?? 'unknown', colorSpace: metadata.space ?? undefined, exif}
	}

	private async extractDocument(filePath: string, fileStat: import('node:fs').Stats, _signal?: AbortSignal): Promise<MediaMetadata> {
		const ext = filePath.toLowerCase().split('.').pop()

		if (ext === 'pdf') {
			return this.extractPdf(filePath, fileStat)
		}

		// For other documents, return minimal metadata
		return {mediaType: 'document', title: '', fileSize: fileStat.size, createdAt: fileStat.birthtime, modifiedAt: fileStat.mtime, pageCount: 0}
	}

	private async extractPdf(filePath: string, fileStat: import('node:fs').Stats): Promise<MediaMetadata> {
		// Lazy import pdf-lib
		const {PDFDocument} = await import('pdf-lib')
		const fileBytes = await import('node:fs/promises').then(fs => fs.readFile(filePath))
		const pdfDoc = await PDFDocument.load(fileBytes, {ignoreEncryption: true})

		const title = pdfDoc.getTitle() ?? ''
		const author = pdfDoc.getAuthor() ?? ''
		const pageCount = pdfDoc.getPageCount()

		return {mediaType: 'document', title, fileSize: fileStat.size, createdAt: fileStat.birthtime, modifiedAt: fileStat.mtime, pageCount, author: author || undefined, language: undefined}
	}

	private async extractComic(filePath: string, fileStat: import('node:fs').Stats, _signal?: AbortSignal): Promise<MediaMetadata> {
		const ext = filePath.toLowerCase().split('.').pop()

		if (ext === 'cbz' || ext === 'zip') {
			return this.extractCbz(filePath, fileStat)
		}

		// For other comic formats, return minimal metadata
		return {mediaType: 'comic', title: '', fileSize: fileStat.size, createdAt: fileStat.birthtime, modifiedAt: fileStat.mtime, pageCount: 0}
	}

	private async extractCbz(filePath: string, fileStat: import('node:fs').Stats): Promise<MediaMetadata> {
		const Yauzl = (await import('yauzl')).default

		return new Promise((resolve, reject) => {
			Yauzl.open(filePath, {lazyEntries: true}, (err, zipfile) => {
				if (err) {
					reject(err)
					return
				}
				if (!zipfile) {
					reject(new Error('Failed to open CBZ file'))
					return
				}

				let pageCount = 0
				let title = ''
				let series: string | undefined
				let issueNumber: number | undefined
				let publisher: string | undefined

				zipfile.readEntry()
				zipfile.on('entry', (entry: {fileName: string}) => {
					if (entry.fileName.endsWith('/')) {
						zipfile.readEntry()
						return
					}

					// Check for ComicInfo.xml
					if (entry.fileName.toLowerCase() === 'comicinfo.xml') {
						zipfile.openReadStream(entry as import('yauzl').Entry, (openErr, readStream) => {
							if (openErr) {
								zipfile.readEntry()
								return
							}
							if (!readStream) {
								zipfile.readEntry()
								return
							}
							let xmlData = ''
							readStream.on('data', (chunk: Buffer) => {
								xmlData += chunk.toString()
							})
							readStream.on('end', () => {
								try {
									const parsed = this.parseComicInfoXml(xmlData)
									if (parsed.title) title = parsed.title
									if (parsed.series) series = parsed.series
									if (parsed.issueNumber) issueNumber = parsed.issueNumber
									if (parsed.publisher) publisher = parsed.publisher
								} catch {
									// XML parsing failed, continue
								}
								zipfile.readEntry()
							})
						})
					} else if (/\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(entry.fileName)) {
						pageCount++
						zipfile.readEntry()
					} else {
						zipfile.readEntry()
					}
				})

				zipfile.on('end', () => {
					zipfile.close()
					resolve({mediaType: 'comic', title, fileSize: fileStat.size, createdAt: fileStat.birthtime, modifiedAt: fileStat.mtime, pageCount, publisher, series, issueNumber})
				})

				zipfile.on('error', reject)
			})
		})
	}

	private parseComicInfoXml(xml: string): {title?: string; series?: string; issueNumber?: number; publisher?: string} {
		const result: {title?: string; series?: string; issueNumber?: number; publisher?: string} = {}

		const extract = (tag: string): string | undefined => {
			const regex = new RegExp(`<${tag}>([^<]*)</${tag}>`)
			const match = xml.match(regex)
			return match?.[1]?.trim() ?? undefined
		}

		result.title = extract('Title')
		result.series = extract('Series')
		result.publisher = extract('Publisher')

		const issueStr = extract('Number')
		if (issueStr) {
			const num = parseFloat(issueStr)
			if (!isNaN(num)) {
				result.issueNumber = num
			}
		}

		return result
	}
}
