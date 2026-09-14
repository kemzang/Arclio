// @vitest-environment node

import {describe, expect, it, vi} from 'vitest'
import {envWithFfmpegPaths} from '@main/utils/process.js'

describe('envWithFfmpegPaths', () => {
	it('returns process.env unchanged when no ffmpeg path is given', () => {
		const env = envWithFfmpegPaths(null)
		expect(env).toEqual(process.env)
	})

	it('prepends the ffmpeg binary directory to PATH', () => {
		const env = envWithFfmpegPaths('/opt/arclio/embedded/ffmpeg')
		expect(env.PATH?.startsWith('/opt/arclio/embedded')).toBe(true)
	})

	it('injects LD_LIBRARY_PATH on Linux so a bundled ffprobe/ffmpeg finds its sibling libav*.so.* files', () => {
		const spy = vi.spyOn(process, 'platform', 'get').mockReturnValue('linux')
		try {
			const env = envWithFfmpegPaths('/opt/arclio/embedded/ffprobe')
			expect(env.LD_LIBRARY_PATH?.startsWith('/opt/arclio/embedded')).toBe(true)
		} finally {
			spy.mockRestore()
		}
	})

	it('does not touch LD_LIBRARY_PATH on non-Linux platforms', () => {
		const spy = vi.spyOn(process, 'platform', 'get').mockReturnValue('darwin')
		try {
			const env = envWithFfmpegPaths('/opt/arclio/embedded/ffprobe')
			expect(env.LD_LIBRARY_PATH).toBe(process.env.LD_LIBRARY_PATH)
		} finally {
			spy.mockRestore()
		}
	})
})
