// @vitest-environment node

import {chmod, mkdtemp, rm, writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {afterAll, describe, expect, it} from 'vitest'
import {MetadataExtractor} from '@arclio/metadata'

// A real (not mocked) fake ffprobe: a tiny shell script that ignores its
// real args and prints ffprobe-shaped JSON whose title tag is whatever
// LD_LIBRARY_PATH it actually sees in its own environment. Proves the env
// MetadataExtractor was constructed with genuinely reaches the child
// process, the way node:child_process mocking across a workspace package
// boundary could not reliably prove.
const FAKE_FFPROBE_SCRIPT = `#!/bin/sh
printf '{"format":{"tags":{"title":"%s"}},"streams":[{"codec_type":"video","codec_name":"h264","width":1280,"height":720,"r_frame_rate":"30/1"}]}' "$LD_LIBRARY_PATH"
`

describe('MetadataExtractor — env passthrough for ffprobe', () => {
	const tmpDirs: string[] = []
	afterAll(async () => {
		await Promise.all(tmpDirs.map(dir => rm(dir, {recursive: true, force: true})))
	})

	async function makeFakeFfprobe(): Promise<string> {
		const dir = await mkdtemp(join(tmpdir(), 'arclio-metadata-env-'))
		tmpDirs.push(dir)
		const scriptPath = join(dir, 'fake-ffprobe.sh')
		await writeFile(scriptPath, FAKE_FFPROBE_SCRIPT)
		await chmod(scriptPath, 0o755)
		return scriptPath
	}

	async function makeTempVideoFile(): Promise<string> {
		const dir = await mkdtemp(join(tmpdir(), 'arclio-metadata-env-video-'))
		tmpDirs.push(dir)
		const filePath = join(dir, 'video.mp4')
		await writeFile(filePath, 'fake')
		return filePath
	}

	it('reaches the spawned ffprobe process with the env passed to the constructor', async () => {
		const ffprobePath = await makeFakeFfprobe()
		const extractor = new MetadataExtractor({ffprobePath, env: {...process.env, LD_LIBRARY_PATH: '/opt/arclio/embedded'}})

		const metadata = await extractor.extract(await makeTempVideoFile(), 'video')

		expect(metadata.title).toBe('/opt/arclio/embedded')
	})

	it("falls back to inheriting this process's own env when no env is given", async () => {
		const ffprobePath = await makeFakeFfprobe()
		const extractor = new MetadataExtractor({ffprobePath})

		const metadata = await extractor.extract(await makeTempVideoFile(), 'video')

		expect(metadata.title).toBe(process.env.LD_LIBRARY_PATH ?? '')
	})
})
