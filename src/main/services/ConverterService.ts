import {EventEmitter} from 'node:events'
import {spawn} from 'node:child_process'
import {access, constants, stat} from 'node:fs/promises'
import {extname, basename, join, dirname} from 'node:path'
import {randomUUID} from 'node:crypto'
import electronLog from 'electron-log/main.js'

const logger = electronLog.scope('converter')

export type ConversionFormat = 'mp4' | 'mkv' | 'webm' | 'avi' | 'mp3' | 'aac' | 'flac' | 'ogg' | 'wav' | 'opus' | 'jpg' | 'png' | 'webp' | 'avif' | 'gif'

export interface ConversionTask {
	id: string
	inputPath: string
	outputPath: string
	format: ConversionFormat
	options?: ConversionOptions
	status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
	progress: number
	error?: string
	createdAt: string
	startedAt?: string
	finishedAt?: string
}

export interface ConversionOptions {
	// Video options
	videoCodec?: string
	audioCodec?: string
	resolution?: string
	bitrate?: string
	fps?: number
	crf?: number
	trimStart?: string
	trimEnd?: string

	// Audio options
	audioBitrate?: string
	sampleRate?: number
	channels?: number
	volume?: number

	// Image options
	quality?: number
	width?: number
	height?: number
	fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'

	// General
	preset?: 'ultrafast' | 'fast' | 'medium' | 'slow' | 'veryslow'
}

export interface ConversionResult {
	success: boolean
	outputPath?: string
	error?: string
}

export interface ConverterEvents {
	taskAdded: (task: ConversionTask) => void
	taskStarted: (task: ConversionTask) => void
	taskProgress: (task: ConversionTask) => void
	taskCompleted: (task: ConversionTask) => void
	taskFailed: (task: ConversionTask) => void
	taskCancelled: (task: ConversionTask) => void
}

function buildFFmpegArgs(inputPath: string, outputPath: string, format: ConversionFormat, options?: ConversionOptions): string[] {
	const args: string[] = ['-i', inputPath]

	// Video codec
	if (options?.videoCodec) {
		args.push('-c:v', options.videoCodec)
	}

	// Audio codec
	if (options?.audioCodec) {
		args.push('-c:a', options.audioCodec)
	} else if (format === 'mp3') {
		args.push('-c:a', 'libmp3lame')
	} else if (format === 'aac') {
		args.push('-c:a', 'aac')
	} else if (format === 'flac') {
		args.push('-c:a', 'flac')
	} else if (format === 'opus') {
		args.push('-c:a', 'libopus')
	}

	// Resolution
	if (options?.resolution) {
		args.push('-vf', `scale=${options.resolution}`)
	}

	// FPS
	if (options?.fps) {
		args.push('-r', String(options.fps))
	}

	// CRF (quality)
	if (options?.crf !== undefined) {
		args.push('-crf', String(options.crf))
	}

	// Bitrate
	if (options?.bitrate) {
		args.push('-b:v', options.bitrate)
	}

	// Audio bitrate
	if (options?.audioBitrate) {
		args.push('-b:a', options.audioBitrate)
	}

	// Sample rate
	if (options?.sampleRate) {
		args.push('-ar', String(options.sampleRate))
	}

	// Channels
	if (options?.channels) {
		args.push('-ac', String(options.channels))
	}

	// Volume
	if (options?.volume !== undefined) {
		args.push('-af', `volume=${options.volume}`)
	}

	// Trim
	if (options?.trimStart) {
		args.push('-ss', options.trimStart)
	}
	if (options?.trimEnd) {
		args.push('-to', options.trimEnd)
	}

	// Preset
	if (options?.preset) {
		args.push('-preset', options.preset)
	}

	// GIF specific
	if (format === 'gif') {
		args.push('-vf', 'fps=10,scale=320:-1:flags=lanczos', '-loop', '0')
	}

	// Output
	args.push('-y', outputPath)

	return args
}

export class ConverterService extends EventEmitter {
	private readonly ffmpegPath: string
	private readonly tasks = new Map<string, ConversionTask>()
	private readonly runningProcesses = new Map<string, ReturnType<typeof spawn>>()

	constructor(ffmpegPath: string) {
		super()
		this.ffmpegPath = ffmpegPath
	}

	async convert(inputPath: string, format: ConversionFormat, options?: ConversionOptions, outputDir?: string): Promise<ConversionResult> {
		try {
			await access(inputPath, constants.R_OK)

			const ext = extname(inputPath).toLowerCase()
			const baseName = basename(inputPath, ext)
			const outDir = outputDir ?? dirname(inputPath)
			const outputPath = join(outDir, `${baseName}_converted.${format}`)

			const args = buildFFmpegArgs(inputPath, outputPath, format, options)

			logger.info(`Starting conversion: ${inputPath} -> ${outputPath}`)
			logger.debug(`FFmpeg args: ${args.join(' ')}`)

			const result = await this.runFFmpeg(args)

			if (result.success) {
				logger.info(`Conversion completed: ${outputPath}`)
			} else {
				logger.error(`Conversion failed: ${result.error}`)
			}

			return result
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error)
			logger.error(`Conversion error: ${message}`)
			return {success: false, error: message}
		}
	}

	async convertVideo(inputPath: string, options: {format?: ConversionFormat; codec?: string; resolution?: string; crf?: number; trimStart?: string; trimEnd?: string} = {}): Promise<ConversionResult> {
		const format = options.format ?? 'mp4'
		return this.convert(inputPath, format, {videoCodec: options.codec, resolution: options.resolution, crf: options.crf, trimStart: options.trimStart, trimEnd: options.trimEnd})
	}

	async convertAudio(inputPath: string, options: {format?: ConversionFormat; bitrate?: string; sampleRate?: number} = {}): Promise<ConversionResult> {
		const format = options.format ?? 'mp3'
		return this.convert(inputPath, format, {audioBitrate: options.bitrate, sampleRate: options.sampleRate})
	}

	async convertImage(inputPath: string, options: {format?: ConversionFormat; width?: number; height?: number; quality?: number} = {}): Promise<ConversionResult> {
		const format = options.format ?? 'jpg'

		// For images, use sharp instead of ffmpeg
		if (['jpg', 'png', 'webp', 'avif'].includes(format)) {
			return this.convertImageWithSharp(inputPath, format, options)
		}

		return this.convert(inputPath, format, {width: options.width, height: options.height, quality: options.quality})
	}

	async extractAudio(videoPath: string, format: ConversionFormat = 'mp3'): Promise<ConversionResult> {
		const ext = extname(videoPath)
		const baseName = basename(videoPath, ext)
		const outputPath = join(dirname(videoPath), `${baseName}.${format}`)

		return this.convert(videoPath, format, {videoCodec: 'none', audioCodec: format === 'mp3' ? 'libmp3lame' : format === 'flac' ? 'flac' : 'aac'}, dirname(videoPath))
	}

	async createGif(videoPath: string, options: {fps?: number; width?: number; duration?: number} = {}): Promise<ConversionResult> {
		const ext = extname(videoPath)
		const baseName = basename(videoPath, ext)
		const outputPath = join(dirname(videoPath), `${baseName}.gif`)

		return this.convert(videoPath, 'gif', {fps: options.fps ?? 10, resolution: options.width ? `${options.width}:-1` : undefined, trimEnd: options.duration ? `00:00:${options.duration}` : undefined})
	}

	private async convertImageWithSharp(inputPath: string, format: string, options: {width?: number; height?: number; quality?: number}): Promise<ConversionResult> {
		try {
			const sharp = (await import('sharp')).default
			const ext = extname(inputPath)
			const baseName = basename(inputPath, ext)
			const outputPath = join(dirname(inputPath), `${baseName}.${format}`)

			let image = sharp(inputPath)

			if (options.width || options.height) {
				image = image.resize(options.width, options.height, {fit: 'inside', withoutEnlargement: true})
			}

			switch (format) {
				case 'jpg':
					await image.jpeg({quality: options.quality ?? 85}).toFile(outputPath)
					break
				case 'png':
					await image.png().toFile(outputPath)
					break
				case 'webp':
					await image.webp({quality: options.quality ?? 85}).toFile(outputPath)
					break
				case 'avif':
					await image.avif({quality: options.quality ?? 50}).toFile(outputPath)
					break
				default:
					return {success: false, error: `Unsupported image format: ${format}`}
			}

			return {success: true, outputPath}
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error)
			return {success: false, error: message}
		}
	}

	private runFFmpeg(args: string[]): Promise<ConversionResult> {
		return new Promise(resolve => {
			const proc = spawn(this.ffmpegPath, args)
			let stderr = ''

			proc.stderr.on('data', (chunk: Buffer) => {
				stderr += chunk.toString()
			})

			proc.on('close', code => {
				if (code === 0) {
					// Extract output path from args
					const outputIdx = args.lastIndexOf('-y')
					const outputPath = outputIdx >= 0 ? args[outputIdx + 1] : undefined
					resolve({success: true, outputPath})
				} else {
					resolve({success: false, error: `FFmpeg exited with code ${code}: ${stderr}`})
				}
			})

			proc.on('error', error => {
				resolve({success: false, error: error.message})
			})
		})
	}
}
