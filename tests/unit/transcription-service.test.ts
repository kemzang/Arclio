// @vitest-environment node

import {describe, expect, it, vi, beforeEach} from 'vitest'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import type {QueueItem} from '@shared/types.js'

vi.mock('@main/services/TranscriptionAudioPrep.js', () => ({probeDurationSeconds: vi.fn().mockResolvedValue(45), extractAndChunkAudio: vi.fn()}))

const {probeDurationSeconds, extractAndChunkAudio} = await import('@main/services/TranscriptionAudioPrep.js')
const {TranscriptionService} = await import('@main/services/TranscriptionService.js')

function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {status, headers: {'content-type': 'application/json'}})
}

function makeItem(overrides: Partial<QueueItem> = {}): QueueItem {
	return {
		id: 'item-1',
		url: 'https://youtube.com/watch?v=x',
		title: 'Test video',
		thumbnail: '',
		outputDir: '/downloads',
		formatLabel: '1080p',
		status: 'done',
		lane: 'normal',
		progressPercent: 100,
		progressDetail: null,
		lastStatus: {key: 'subtitlesFailed'},
		error: null,
		addedAt: '2026-09-10T09:00:00.000Z',
		finishedAt: '2026-09-10T09:05:00.000Z',
		writeM3u: true,
		artifacts: [{id: 'artifact:media', kind: 'media', path: '/downloads/video.mp4', fileName: 'video.mp4', discoveredAt: '2026-09-10T09:05:00.000Z'}],
		job: {
			kind: 'single-format',
			extractor: 'youtube',
			extractorKey: 'Youtube',
			formatId: 'bv+ba',
			preset: 'custom',
			sponsorBlock: {mode: 'off'},
			embed: {chapters: false, metadata: false, thumbnail: false, description: false, thumbnailSidecar: false},
			subtitles: {languages: ['en'], mode: 'sidecar', format: 'srt', writeAuto: false}
		},
		...overrides
	}
}

function fakeQueue(item: QueueItem | null) {
	return {snapshot: vi.fn().mockReturnValue(item ? [item] : []), addArtifact: vi.fn().mockReturnValue(true)}
}

function fakeAccount(deviceToken: string | null) {
	return {load: vi.fn().mockReturnValue(deviceToken ? {deviceToken} : null), clear: vi.fn()}
}

const BINARIES = {getFfmpegPath: () => '/fake/ffmpeg', getFfprobePath: () => '/fake/ffprobe'}

beforeEach(() => {
	vi.clearAllMocks()
})

describe('TranscriptionService — preconditions', () => {
	it('fails with item_not_found when the item no longer exists', async () => {
		const queue = fakeQueue(null)
		const service = new TranscriptionService(queue, fakeAccount('tok'), BINARIES, {baseUrl: 'https://example.test'})
		const events: unknown[] = []
		service.on('progress', e => events.push(e))

		await service.start('missing-item')

		expect(events).toEqual([{itemId: 'missing-item', phase: 'failed', errorReason: 'item_not_found', at: expect.any(String)}])
		expect(queue.addArtifact).not.toHaveBeenCalled()
	})

	it('fails with no_media_file when the item has no media artifact', async () => {
		const queue = fakeQueue(makeItem({artifacts: []}))
		const service = new TranscriptionService(queue, fakeAccount('tok'), BINARIES, {baseUrl: 'https://example.test'})
		const events: unknown[] = []
		service.on('progress', e => events.push(e))

		await service.start('item-1')

		expect(events).toEqual([{itemId: 'item-1', phase: 'failed', errorReason: 'no_media_file', at: expect.any(String)}])
	})

	it('fails with not_connected when there is no paired account', async () => {
		const queue = fakeQueue(makeItem())
		const service = new TranscriptionService(queue, fakeAccount(null), BINARIES, {baseUrl: 'https://example.test'})
		const events: unknown[] = []
		service.on('progress', e => events.push(e))

		await service.start('item-1')

		expect(events).toEqual([{itemId: 'item-1', phase: 'failed', errorReason: 'not_connected', at: expect.any(String)}])
	})
})

describe('TranscriptionService — happy path', () => {
	it('extracts, uploads chunks sequentially, commits, writes the srt next to the video, and attaches it as an artifact', async () => {
		const tmpVideoDir = await fs.mkdtemp(path.join(os.tmpdir(), 'arclio-transcribe-'))
		try {
			const mediaPath = path.join(tmpVideoDir, 'video.mp4')
			await fs.writeFile(mediaPath, 'fake video bytes')
			const item = makeItem({outputDir: tmpVideoDir, artifacts: [{id: 'artifact:media', kind: 'media', path: mediaPath, fileName: 'video.mp4', discoveredAt: '2026-09-10T09:05:00.000Z'}]})
			const queue = fakeQueue(item)

			vi.mocked(extractAndChunkAudio).mockImplementation(async function* () {
				yield {sequence: 0, path: '/tmp/chunk_000.ogg', startOffsetSeconds: 0, durationSeconds: 30}
				yield {sequence: 1, path: '/tmp/chunk_001.ogg', startOffsetSeconds: 30, durationSeconds: 15}
			})

			const fetchImpl = vi.fn(async (url: string) => {
				if (url.endsWith('/api/transcription/sessions')) return jsonResponse({sessionId: 'sess-1', quota: {secondsUsed: 45, secondsRemaining: 6555}})
				if (url.includes('/sessions/sess-1/chunks')) return jsonResponse({})
				if (url.endsWith('/sessions/sess-1/commit')) return jsonResponse({srt: '1\n00:00:00,000 --> 00:00:05,000\nHello world\n'})
				throw new Error(`Unexpected fetch: ${url}`)
			})

			const readOriginal = fs.readFile.bind(fs)
			const readSpy = vi.spyOn(fs, 'readFile').mockImplementation(async (p, ...rest) => {
				if (p === '/tmp/chunk_000.ogg' || p === '/tmp/chunk_001.ogg') return Buffer.from('opus-bytes')
				return readOriginal(p as never, ...(rest as []))
			})

			const service = new TranscriptionService(queue, fakeAccount('tok'), BINARIES, {baseUrl: 'https://example.test', fetch: fetchImpl as unknown as typeof fetch})
			const events: Array<{phase: string; chunkIndex?: number; chunkCount?: number}> = []
			service.on('progress', e => events.push(e as never))

			await service.start('item-1')

			expect(events.map(e => e.phase)).toEqual(['extracting', 'uploading', 'transcribing', 'transcribing', 'done'])
			expect(events[2]).toMatchObject({chunkIndex: 1, chunkCount: 2})
			expect(events[3]).toMatchObject({chunkIndex: 2, chunkCount: 2})

			const srtPath = path.join(tmpVideoDir, 'video.srt')
			expect(await fs.readFile(srtPath, 'utf8')).toBe('1\n00:00:00,000 --> 00:00:05,000\nHello world\n')
			expect(queue.addArtifact).toHaveBeenCalledWith('item-1', srtPath, 'subtitle')

			const chunkCalls = fetchImpl.mock.calls.filter(([url]) => url.includes('/chunks'))
			expect(chunkCalls).toHaveLength(2)

			readSpy.mockRestore()
			await fs.rm(srtPath, {force: true})
		} finally {
			await fs.rm(tmpVideoDir, {recursive: true, force: true})
		}
	})
})

describe('TranscriptionService — errors and cancellation', () => {
	it('surfaces tier_required distinctly from quota_exceeded', async () => {
		const queue = fakeQueue(makeItem())
		vi.mocked(extractAndChunkAudio).mockImplementation(async function* () {
			// no chunks needed for this test
		})
		const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({error: 'tier_required'}, 402))
		const service = new TranscriptionService(queue, fakeAccount('tok'), BINARIES, {baseUrl: 'https://example.test', fetch: fetchImpl as unknown as typeof fetch})
		const events: unknown[] = []
		service.on('progress', e => events.push(e))

		await service.start('item-1')

		expect(events.at(-1)).toMatchObject({phase: 'failed', errorReason: 'tier_required'})
	})

	it('disconnects and reports unauthorized when the device token was revoked', async () => {
		const queue = fakeQueue(makeItem())
		vi.mocked(extractAndChunkAudio).mockImplementation(async function* () {
			// no chunks needed for this test
		})
		const fetchImpl = vi.fn().mockResolvedValue(new Response(null, {status: 401}))
		const service = new TranscriptionService(queue, fakeAccount('tok'), BINARIES, {baseUrl: 'https://example.test', fetch: fetchImpl as unknown as typeof fetch})
		const events: unknown[] = []
		service.on('progress', e => events.push(e))

		await service.start('item-1')

		expect(events.at(-1)).toMatchObject({phase: 'failed', errorReason: 'unauthorized'})
	})

	it('stops after the in-flight chunk when cancelled mid-run, without committing', async () => {
		const queue = fakeQueue(makeItem())
		vi.mocked(extractAndChunkAudio).mockImplementation(async function* () {
			yield {sequence: 0, path: '/tmp/chunk_000.ogg', startOffsetSeconds: 0, durationSeconds: 30}
			yield {sequence: 1, path: '/tmp/chunk_001.ogg', startOffsetSeconds: 30, durationSeconds: 15}
		})
		vi.spyOn(fs, 'readFile').mockResolvedValue(Buffer.from('opus-bytes'))

		let service!: InstanceType<typeof TranscriptionService>
		const fetchImpl = vi.fn(async (url: string) => {
			if (url.endsWith('/api/transcription/sessions')) return jsonResponse({sessionId: 'sess-1', quota: {secondsUsed: 45, secondsRemaining: 6555}})
			if (url.includes('/chunks')) {
				service.cancel('item-1')
				return jsonResponse({})
			}
			throw new Error(`Unexpected fetch: ${url}`)
		})

		service = new TranscriptionService(queue, fakeAccount('tok'), BINARIES, {baseUrl: 'https://example.test', fetch: fetchImpl as unknown as typeof fetch})
		const events: Array<{phase: string}> = []
		service.on('progress', e => events.push(e as never))

		await service.start('item-1')

		const chunkCalls = fetchImpl.mock.calls.filter(([url]) => url.includes('/chunks'))
		expect(chunkCalls).toHaveLength(1)
		expect(fetchImpl.mock.calls.some(([url]) => url.endsWith('/commit'))).toBe(false)
		expect(events.at(-1)).toMatchObject({phase: 'failed', errorReason: 'cancelled'})
		expect(queue.addArtifact).not.toHaveBeenCalled()

		vi.mocked(fs.readFile).mockRestore()
	})

	it('ignores a second start() call for an item that is already running', async () => {
		const queue = fakeQueue(makeItem())
		vi.mocked(extractAndChunkAudio).mockImplementation(async function* () {
			// no chunks needed for this test
		})
		let resolveSession!: (r: Response) => void
		const fetchImpl = vi.fn().mockReturnValue(new Promise<Response>(resolve => (resolveSession = resolve)))
		const service = new TranscriptionService(queue, fakeAccount('tok'), BINARIES, {baseUrl: 'https://example.test', fetch: fetchImpl as unknown as typeof fetch})

		const first = service.start('item-1')
		const second = service.start('item-1')
		await second
		expect(probeDurationSeconds).toHaveBeenCalledTimes(1)

		resolveSession(jsonResponse({sessionId: 'sess-1', quota: {secondsUsed: 0, secondsRemaining: 7200}}))
		await first
	})
})
