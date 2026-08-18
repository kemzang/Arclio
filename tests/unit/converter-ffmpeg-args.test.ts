import {describe, expect, it} from 'vitest'
import {buildFFmpegArgs} from '@main/services/ConverterService.js'

/** Occurrences of a flag — ffmpeg keeps only the last `-vf`, so duplicates lose data. */
function countFlag(args: string[], flag: string): number {
	return args.filter(arg => arg === flag).length
}

function valueAfter(args: string[], flag: string): string | undefined {
	const index = args.indexOf(flag)
	return index === -1 ? undefined : args[index + 1]
}

describe('buildFFmpegArgs', () => {
	it('passes the input and output paths around the options', () => {
		const args = buildFFmpegArgs('/in.mp4', '/out.mp4', 'mp4')
		expect(args.slice(0, 2)).toEqual(['-i', '/in.mp4'])
		expect(args.slice(-2)).toEqual(['-y', '/out.mp4'])
	})

	it('emits a single -vf chain when a GIF also requests a resolution', () => {
		// Regression: resolution and the GIF filter were pushed as two separate
		// -vf flags, so the requested width was silently replaced by scale=320.
		const args = buildFFmpegArgs('/in.mp4', '/out.gif', 'gif', {resolution: '480:-1', fps: 15})

		expect(countFlag(args, '-vf')).toBe(1)
		expect(valueAfter(args, '-vf')).toBe('fps=15,scale=480:-1:flags=lanczos')
	})

	it('falls back to 320 wide at 10fps for a GIF with no options', () => {
		const args = buildFFmpegArgs('/in.mp4', '/out.gif', 'gif')
		expect(valueAfter(args, '-vf')).toBe('fps=10,scale=320:-1:flags=lanczos')
	})

	it('loops GIFs forever', () => {
		expect(buildFFmpegArgs('/in.mp4', '/out.gif', 'gif')).toContain('-loop')
		expect(valueAfter(buildFFmpegArgs('/in.mp4', '/out.gif', 'gif'), '-loop')).toBe('0')
	})

	it('uses -r for frame rate on non-GIF output', () => {
		const args = buildFFmpegArgs('/in.mp4', '/out.mp4', 'mp4', {fps: 24})
		expect(valueAfter(args, '-r')).toBe('24')
		expect(countFlag(args, '-vf')).toBe(0)
	})

	it('scales non-GIF output through a single -vf', () => {
		const args = buildFFmpegArgs('/in.mp4', '/out.mp4', 'mp4', {resolution: '1280:-2'})
		expect(countFlag(args, '-vf')).toBe(1)
		expect(valueAfter(args, '-vf')).toBe('scale=1280:-2')
	})

	it('picks a default audio codec per container', () => {
		expect(valueAfter(buildFFmpegArgs('/in.mp4', '/out.mp3', 'mp3'), '-c:a')).toBe('libmp3lame')
		expect(valueAfter(buildFFmpegArgs('/in.mp4', '/out.opus', 'opus'), '-c:a')).toBe('libopus')
		expect(valueAfter(buildFFmpegArgs('/in.mp4', '/out.flac', 'flac'), '-c:a')).toBe('flac')
	})

	it('lets an explicit audio codec win over the container default', () => {
		const args = buildFFmpegArgs('/in.mp4', '/out.mp3', 'mp3', {audioCodec: 'none'})
		expect(valueAfter(args, '-c:a')).toBe('none')
		expect(countFlag(args, '-c:a')).toBe(1)
	})

	it('carries trim boundaries through', () => {
		const args = buildFFmpegArgs('/in.mp4', '/out.mp4', 'mp4', {trimStart: '00:00:05', trimEnd: '00:00:10'})
		expect(valueAfter(args, '-ss')).toBe('00:00:05')
		expect(valueAfter(args, '-to')).toBe('00:00:10')
	})

	it('keeps a CRF of 0 rather than treating it as unset', () => {
		expect(valueAfter(buildFFmpegArgs('/in.mp4', '/out.mp4', 'mp4', {crf: 0}), '-crf')).toBe('0')
	})
})
