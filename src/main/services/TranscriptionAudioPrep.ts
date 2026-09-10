import fs from 'node:fs/promises'
import path from 'node:path'
import log from 'electron-log/main.js'
import {spawnFFmpeg, spawnFFprobe} from '@main/utils/process.js'

const logger = log.scope('transcription-audio-prep')

const CHUNK_FILE_PATTERN = /^chunk_(\d{3})\.ogg$/

export function buildDurationProbeArgs(mediaPath: string): string[] {
	return ['-v', 'quiet', '-print_format', 'json', '-show_format', mediaPath]
}

interface FfprobeFormatOutput {
	format?: {duration?: string}
}

/** Reads container metadata only — no decode — so this is fast regardless of the file's length. */
export async function probeDurationSeconds(ffprobePath: string, mediaPath: string): Promise<number> {
	const proc = spawnFFprobe(ffprobePath, buildDurationProbeArgs(mediaPath))
	let stdout = ''
	proc.stdout.on('data', (chunk: Buffer) => {
		stdout += chunk.toString()
	})
	const exitCode = await new Promise<number>((resolve, reject) => {
		proc.on('error', reject)
		proc.on('close', code => resolve(code ?? 1))
	})
	if (exitCode !== 0) throw new Error(`ffprobe exited with code ${exitCode}`)

	const parsed = JSON.parse(stdout) as FfprobeFormatOutput
	const duration = Number(parsed.format?.duration)
	if (!Number.isFinite(duration) || duration <= 0) throw new Error('ffprobe returned no usable duration')
	return duration
}

/**
 * Mono 16kHz Opus — small enough per chunk to keep each upload/inference
 * request cheap, and the shape Whisper expects regardless of the source's
 * original codec or channel layout.
 *
 * `-f segment` does the actual splitting; `-reset_timestamps 1` makes every
 * chunk file start its own internal clock at 0, which is why callers track
 * each chunk's real position in the recording separately (see
 * chunkDurationSeconds) rather than reading it back out of the file.
 */
export function buildChunkFfmpegArgs(mediaPath: string, outputPattern: string, chunkSeconds: number): string[] {
	return ['-i', mediaPath, '-vn', '-ac', '1', '-ar', '16000', '-c:a', 'libopus', '-f', 'segment', '-segment_time', String(chunkSeconds), '-reset_timestamps', '1', '-y', outputPattern]
}

/** How long chunk `index` actually is, given the recording's real total duration — the last chunk is normally shorter than `chunkSeconds`. */
export function chunkDurationSeconds(startOffsetSeconds: number, chunkSeconds: number, totalDurationSeconds: number): number {
	return Math.max(0, Math.min(chunkSeconds, totalDurationSeconds - startOffsetSeconds))
}

export interface AudioChunk {
	sequence: number
	path: string
	startOffsetSeconds: number
	durationSeconds: number
}

/**
 * Extracts and splits a media file's audio into fixed-length chunks under
 * `outDir`, yielding each in order.
 *
 * `totalDurationSeconds` (from probeDurationSeconds, called once by the
 * caller before this) is what makes the last chunk's duration accurate
 * without re-probing every chunk file individually.
 */
export async function* extractAndChunkAudio(ffmpegPath: string, mediaPath: string, outDir: string, chunkSeconds: number, totalDurationSeconds: number): AsyncGenerator<AudioChunk> {
	await fs.mkdir(outDir, {recursive: true})
	const outputPattern = path.join(outDir, 'chunk_%03d.ogg')

	const proc = spawnFFmpeg(ffmpegPath, buildChunkFfmpegArgs(mediaPath, outputPattern, chunkSeconds))
	let stderr = ''
	proc.stderr.on('data', (chunk: Buffer) => {
		stderr += chunk.toString()
	})
	const exitCode = await new Promise<number>((resolve, reject) => {
		proc.on('error', reject)
		proc.on('close', code => resolve(code ?? 1))
	})
	if (exitCode !== 0) {
		logger.warn('ffmpeg chunking failed', {exitCode, stderr: stderr.slice(-2000)})
		throw new Error(`ffmpeg exited with code ${exitCode}`)
	}

	const entries = await fs.readdir(outDir)
	const sequences = entries
		.map(name => CHUNK_FILE_PATTERN.exec(name))
		.filter((match): match is RegExpExecArray => match !== null)
		.map(match => Number(match[1]))
		.sort((a, b) => a - b)

	for (const sequence of sequences) {
		const startOffsetSeconds = sequence * chunkSeconds
		yield {sequence, path: path.join(outDir, `chunk_${String(sequence).padStart(3, '0')}.ogg`), startOffsetSeconds, durationSeconds: chunkDurationSeconds(startOffsetSeconds, chunkSeconds, totalDurationSeconds)}
	}
}
