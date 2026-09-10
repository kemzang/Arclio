import {describe, expect, it} from 'vitest'
import {buildChunkFfmpegArgs, buildDurationProbeArgs, chunkDurationSeconds} from '@main/services/TranscriptionAudioPrep.js'

function valueAfter(args: string[], flag: string): string | undefined {
	const index = args.indexOf(flag)
	return index === -1 ? undefined : args[index + 1]
}

describe('buildDurationProbeArgs', () => {
	it('asks ffprobe for JSON format info without decoding the media', () => {
		const args = buildDurationProbeArgs('/in.mp4')
		expect(args).toEqual(['-v', 'quiet', '-print_format', 'json', '-show_format', '/in.mp4'])
	})
})

describe('buildChunkFfmpegArgs', () => {
	it('extracts audio-only, mono, 16kHz — the shape Whisper expects', () => {
		const args = buildChunkFfmpegArgs('/in.mp4', '/out/chunk_%03d.ogg', 30)
		expect(args).toContain('-vn')
		expect(valueAfter(args, '-ac')).toBe('1')
		expect(valueAfter(args, '-ar')).toBe('16000')
		expect(valueAfter(args, '-c:a')).toBe('libopus')
	})

	it('segments into fixed-length chunks at the requested duration', () => {
		const args = buildChunkFfmpegArgs('/in.mp4', '/out/chunk_%03d.ogg', 45)
		expect(valueAfter(args, '-f')).toBe('segment')
		expect(valueAfter(args, '-segment_time')).toBe('45')
	})

	it('resets timestamps per segment so each chunk starts at 0 — offsets are tracked separately, not baked into the file', () => {
		expect(valueAfter(buildChunkFfmpegArgs('/in.mp4', '/out/chunk_%03d.ogg', 30), '-reset_timestamps')).toBe('1')
	})

	it('passes the input and output pattern around the options', () => {
		const args = buildChunkFfmpegArgs('/in.mp4', '/out/chunk_%03d.ogg', 30)
		expect(args.slice(0, 2)).toEqual(['-i', '/in.mp4'])
		expect(args.slice(-2)).toEqual(['-y', '/out/chunk_%03d.ogg'])
	})
})

describe('chunkDurationSeconds', () => {
	it('returns the full chunk length for a chunk well inside the recording', () => {
		expect(chunkDurationSeconds(0, 30, 125)).toBe(30)
	})

	it('shortens the last chunk to whatever remains of the recording', () => {
		expect(chunkDurationSeconds(120, 30, 125)).toBe(5)
	})

	it('never returns a negative duration for a chunk past the known end (rounding slack)', () => {
		expect(chunkDurationSeconds(130, 30, 125)).toBe(0)
	})
})
