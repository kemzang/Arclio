import {SyncAuthError} from './SyncClient.js'
import type {CommitTranscriptionResponse, CreateTranscriptionSessionInput, CreateTranscriptionSessionResponse, TranscriptionChunkMeta} from './types.js'

/**
 * HTTP client for AI transcription sessions.
 *
 * A sibling to SyncClient, not a subclass: SyncClient.request() is POST+JSON
 * only, while uploadChunk() here sends a binary body — different enough that
 * inheriting would mean overriding most of the parent anyway. Reuses
 * SyncAuthError as-is (a revoked device token means the same thing on either
 * endpoint) but not SyncPlanError, whose message is sync-specific.
 */

export interface TranscriptionClientOptions {
	baseUrl: string
	/** Bearer credential obtained by pairing. */
	deviceToken: string
	fetch?: typeof globalThis.fetch
	requestTimeoutMs?: number
}

const DEFAULT_REQUEST_TIMEOUT_MS = 30_000

/** Thrown on a 402: either the account isn't on the Sync+IA tier, or this month's quota is used up. Retrying cannot help either case. */
export class TranscriptionPlanError extends Error {
	constructor(readonly reason: string) {
		super(`Transcription not allowed: ${reason}`)
		this.name = 'TranscriptionPlanError'
	}
}

export class TranscriptionClient {
	private readonly baseUrl: string
	private readonly deviceToken: string
	private readonly fetchImpl: typeof globalThis.fetch
	private readonly requestTimeoutMs: number

	constructor(options: TranscriptionClientOptions) {
		this.baseUrl = options.baseUrl.replace(/\/+$/, '')
		this.deviceToken = options.deviceToken
		this.fetchImpl = options.fetch ?? globalThis.fetch
		this.requestTimeoutMs = options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS
	}

	private async handle(response: Response): Promise<Response> {
		if (response.status === 401) throw new SyncAuthError()
		if (response.status === 402) {
			const body = (await response.json().catch(() => ({}))) as {error?: string}
			throw new TranscriptionPlanError(body.error ?? 'not_allowed')
		}
		if (!response.ok) throw new Error(`Transcription request failed: HTTP ${response.status}`)
		return response
	}

	/** Reserves this session's whole quota cost up front — see the route's own doc comment for why that happens once here rather than per chunk. */
	async createSession(input: CreateTranscriptionSessionInput): Promise<CreateTranscriptionSessionResponse> {
		const response = await this.handle(await this.fetchImpl(`${this.baseUrl}/api/transcription/sessions`, {method: 'POST', headers: {'content-type': 'application/json', authorization: `Bearer ${this.deviceToken}`}, body: JSON.stringify(input), signal: AbortSignal.timeout(this.requestTimeoutMs)}))
		return (await response.json()) as CreateTranscriptionSessionResponse
	}

	/** Uploads one audio chunk; the server transcribes it immediately and never persists the audio. */
	async uploadChunk(sessionId: string, meta: TranscriptionChunkMeta, audio: Uint8Array): Promise<void> {
		// A plain ArrayBuffer rather than the Uint8Array itself: with the
		// Cloudflare Workers types in scope for this workspace, generic
		// TypedArray's structural shape doesn't line up with the BodyInit
		// overloads fetch() resolves to here, even though both work identically
		// at runtime.
		const body = audio.buffer.slice(audio.byteOffset, audio.byteOffset + audio.byteLength) as ArrayBuffer
		await this.handle(
			await this.fetchImpl(`${this.baseUrl}/api/transcription/sessions/${sessionId}/chunks`, {
				method: 'POST',
				headers: {authorization: `Bearer ${this.deviceToken}`, 'x-arclio-sequence': String(meta.sequence), 'x-arclio-start-offset-seconds': String(meta.startOffsetSeconds), 'x-arclio-duration-seconds': String(meta.durationSeconds)},
				body,
				signal: AbortSignal.timeout(this.requestTimeoutMs)
			})
		)
	}

	/** Stitches every uploaded chunk into one SRT. */
	async commit(sessionId: string): Promise<CommitTranscriptionResponse> {
		const response = await this.handle(await this.fetchImpl(`${this.baseUrl}/api/transcription/sessions/${sessionId}/commit`, {method: 'POST', headers: {authorization: `Bearer ${this.deviceToken}`}, signal: AbortSignal.timeout(this.requestTimeoutMs)}))
		return (await response.json()) as CommitTranscriptionResponse
	}
}
