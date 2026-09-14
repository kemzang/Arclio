import {EventEmitter} from 'node:events'
import fs from 'node:fs/promises'
import path from 'node:path'
import log from 'electron-log/main.js'
import {SyncAuthError, TranscriptionClient, TranscriptionPlanError} from '@arclio/cloud'
import type {QueueArtifactKind} from '@shared/schemas.js'
import type {QueueItem, TranscriptionErrorReason, TranscriptionPhase, TranscriptionProgress} from '@shared/types.js'
import {SITE_URL} from '@shared/constants.js'
import {nowIso} from '@main/utils/clock.js'
import {cleanupTempDirByPath} from './download/cleanup.js'
import {extractAndChunkAudio, probeDurationSeconds, type AudioChunk} from './TranscriptionAudioPrep.js'

const logger = log.scope('transcription')

// Whisper is fed ~30s at a time — see TranscriptionAudioPrep for why (both
// the mitigation for Workers AI's undocumented single-shot length limit, and
// the unit a Worker's per-request CPU budget can reliably chew through).
const CHUNK_SECONDS = 30

/** The slice of QueueService this orchestrator needs — narrowed so tests can pass a plain fake instead of a real QueueService. */
export interface TranscriptionQueue {
	snapshot(): QueueItem[]
	addArtifact(itemId: string, path: string, kind: QueueArtifactKind): boolean
}

/** The slice of AccountStore this orchestrator needs. */
export interface TranscriptionAccountStore {
	load(): {deviceToken: string} | null
	clear(): void
}

export interface TranscriptionBinaries {
	getFfmpegPath(): string
	getFfprobePath(): string
}

export interface TranscriptionServiceOptions {
	baseUrl?: string
	fetch?: typeof globalThis.fetch
}

class TranscriptionCancelledError extends Error {
	constructor() {
		super('Transcription cancelled')
		this.name = 'TranscriptionCancelledError'
	}
}

/**
 * Generates subtitles for an already-downloaded queue item via the hosted
 * Whisper transcription API.
 *
 * Not a download Phase: unlike SidecarSubsPhase, this runs after the fact on
 * an item that already finished (typically after a `subtitlesFailed` soft
 * fail), triggered directly by the user rather than by the download
 * pipeline. State machine per itemId: extracting -> uploading ->
 * transcribing -> done/failed, mirroring SyncService's "best-effort,
 * never throws" shape so a bad run reports itself instead of crashing main.
 */
export class TranscriptionService extends EventEmitter {
	private readonly baseUrl: string
	private readonly fetchImpl?: typeof globalThis.fetch
	private readonly running = new Set<string>()
	private readonly cancelledItems = new Set<string>()

	constructor(
		private readonly queue: TranscriptionQueue,
		private readonly account: TranscriptionAccountStore,
		private readonly binaries: TranscriptionBinaries,
		options: TranscriptionServiceOptions = {}
	) {
		super()
		this.baseUrl = options.baseUrl ?? SITE_URL
		this.fetchImpl = options.fetch
	}

	isRunning(itemId: string): boolean {
		return this.running.has(itemId)
	}

	/** Takes effect before the next chunk upload — see TranscriptionAudioPrep's doc comment for why chunk boundaries are the cancellation granularity. */
	cancel(itemId: string): void {
		if (this.running.has(itemId)) this.cancelledItems.add(itemId)
	}

	private emitProgress(itemId: string, phase: TranscriptionPhase, extra: Partial<Pick<TranscriptionProgress, 'chunkIndex' | 'chunkCount' | 'errorReason'>> = {}): void {
		this.emit('progress', {itemId, phase, at: nowIso(), ...extra} satisfies TranscriptionProgress)
	}

	private fail(itemId: string, reason: TranscriptionErrorReason): void {
		logger.info('Transcription failed', {itemId, reason})
		this.emitProgress(itemId, 'failed', {errorReason: reason})
	}

	async start(itemId: string): Promise<void> {
		if (this.running.has(itemId)) return

		const item = this.queue.snapshot().find(i => i.id === itemId)
		if (!item) return this.fail(itemId, 'item_not_found')

		const mediaArtifact = item.artifacts.find(a => a.kind === 'media')
		if (!mediaArtifact) return this.fail(itemId, 'no_media_file')

		const stored = this.account.load()
		if (!stored) return this.fail(itemId, 'not_connected')

		this.running.add(itemId)
		this.cancelledItems.delete(itemId)
		const tempDir = path.join(item.outputDir, '.arclio-temp', `transcribe-${itemId}`)

		try {
			const ffprobePath = this.binaries.getFfprobePath()
			const ffmpegPath = this.binaries.getFfmpegPath()

			this.emitProgress(itemId, 'extracting')
			const totalDurationSeconds = await probeDurationSeconds(ffprobePath, mediaArtifact.path)
			const chunks: AudioChunk[] = []
			for await (const chunk of extractAndChunkAudio(ffmpegPath, mediaArtifact.path, tempDir, CHUNK_SECONDS, totalDurationSeconds)) chunks.push(chunk)

			const client = new TranscriptionClient({baseUrl: this.baseUrl, deviceToken: stored.deviceToken, fetch: this.fetchImpl})

			this.emitProgress(itemId, 'uploading')
			const session = await client.createSession({estimatedDurationSeconds: Math.ceil(totalDurationSeconds)})

			for (const chunk of chunks) {
				if (this.cancelledItems.has(itemId)) throw new TranscriptionCancelledError()
				this.emitProgress(itemId, 'transcribing', {chunkIndex: chunk.sequence + 1, chunkCount: chunks.length})
				const audio = await fs.readFile(chunk.path)
				await client.uploadChunk(session.sessionId, {sequence: chunk.sequence, startOffsetSeconds: chunk.startOffsetSeconds, durationSeconds: chunk.durationSeconds}, audio)
			}
			if (this.cancelledItems.has(itemId)) throw new TranscriptionCancelledError()

			const result = await client.commit(session.sessionId)
			const srtPath = path.join(path.dirname(mediaArtifact.path), `${path.basename(mediaArtifact.path, path.extname(mediaArtifact.path))}.srt`)
			await fs.writeFile(srtPath, result.srt, 'utf8')
			this.queue.addArtifact(itemId, srtPath, 'subtitle')

			this.emitProgress(itemId, 'done')
		} catch (error) {
			if (error instanceof TranscriptionCancelledError) {
				this.fail(itemId, 'cancelled')
			} else if (error instanceof TranscriptionPlanError) {
				this.fail(itemId, error.reason === 'quota_exceeded' ? 'quota_exceeded' : 'tier_required')
			} else if (error instanceof SyncAuthError) {
				// Same reasoning as SyncService: a revoked device token means every
				// server-backed feature is dead until the user re-pairs, not just
				// this run, so drop the local credentials now rather than fail
				// silently again on the next attempt.
				logger.warn('Device is no longer authorised; disconnecting locally')
				this.account.clear()
				this.fail(itemId, 'unauthorized')
			} else {
				logger.warn('Transcription run failed', {itemId, error: error instanceof Error ? error.message : String(error)})
				this.fail(itemId, 'failed')
			}
		} finally {
			this.running.delete(itemId)
			this.cancelledItems.delete(itemId)
			await cleanupTempDirByPath(tempDir)
		}
	}
}
