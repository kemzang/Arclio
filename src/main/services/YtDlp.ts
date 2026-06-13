import type {ChildProcessWithoutNullStreams} from 'node:child_process'
import log from 'electron-log/main.js'
import {spawnYtDlp} from '@main/utils/process.js'
import {classifyYtDlpStderr, extractLastError} from 'ytdlp-errors'
import type {YtDlpErrorKind} from 'ytdlp-errors'
import {planWorkflow, type CallerMediaWorkflowInput, type CallerSubtitlesWorkflowInput, type ProbeWorkflowInput, type SubtitleFormat} from 'yt-dlp-bridge'
import {redactArgs} from 'yt-dlp-bridge/redaction'
import {resolveCookies, type ResolvedCookies} from './cookiesResolver.js'
import {nonEmpty} from '@shared/format.js'
import {siteForUrl} from '@shared/sites/index.js'
import type {StatusKey, DependencySource} from '@shared/types.js'
import {resolveNetworkPacing, resolvePlaylistProbeLimit} from '@shared/networkPacing.js'
import type {E2eHarnessMode} from '@main/e2eHarness.js'
import type {BinaryManager} from './BinaryManager.js'
import type {TokenService} from './TokenService.js'
import type {SettingsStore} from '@main/stores/SettingsStore.js'
import {applyJsRuntimeEnv, buildYtDlpJsRuntimeArgs, probeElectronNodeRuntime, summarizeYtDlpJsRuntimeForLog, type YtDlpJsRuntime} from './ytDlpJsRuntime.js'

type StatusReporter = (statusKey: StatusKey, params?: Record<string, string | number>) => void

const ytDlpLog = log.scope('yt-dlp')

function shouldAllowRemoteEjsComponents(source: DependencySource | null | undefined): boolean {
	return source !== null && source !== undefined && source.kind !== 'managed' && source.kind !== 'managedCache' && source.kind !== 'bundled'
}

function summarizeDependencySourceForLog(source: DependencySource | null | undefined): Record<string, string | null> {
	if (!source) return {ytDlpSource: null}
	if (source.kind === 'managed') return {ytDlpSource: source.kind, ytDlpProvider: source.provider, ytDlpChannel: source.channel}
	if (source.kind === 'managedCache') return {ytDlpSource: 'managed-cache', ytDlpProvider: source.provider, ytDlpChannel: source.channel}
	return {ytDlpSource: source.kind}
}

function redactProxy(url: string | undefined): string | null {
	if (!url) return null
	try {
		const u = new URL(url)
		if (u.username) u.username = '***'
		if (u.password) u.password = '***'
		return u.toString()
	} catch {
		return '<unparseable>'
	}
}

export type YtDlpRequest = ProbeWorkflowInput | CallerMediaWorkflowInput | CallerSubtitlesWorkflowInput
export type {ProbePlaylistMode} from 'yt-dlp-bridge'

export interface YtDlpSignal {
	onMinting?: (attempt: 0 | 1) => void
	onSpawn?: (proc: ChildProcessWithoutNullStreams) => void
	onStdout?: (chunk: string) => void
	onStderr?: (chunk: string) => void
	// Caller-driven cancellation. When aborted, in-flight yt-dlp processes are
	// SIGKILLed and the run resolves with an exit-error (rawError: 'Cancelled').
	abortSignal?: AbortSignal
}

export type YtDlpResult =
	| {kind: 'success'; stdout: string; stderr: string; usedExtractorFallback: boolean; effectiveSubtitleFormat?: SubtitleFormat}
	| {kind: 'spawn-error'; error: Error; stdout: string; stderr: string}
	| {
			kind: 'exit-error'
			exitCode: number
			// Closed taxonomy. Always populated — `'unknown'` covers the
			// unmatched-stderr fallback. `rawError` carries the verbatim message
			// the renderer should show when no i18n template applies.
			errorKind: YtDlpErrorKind
			rawError: string | null
			stdout: string
			stderr: string
	  }

// VidBee's strategy: skip the player clients that demand a PoT, so the
// non-PoT download path works without needing to mint anything.
const PLAYER_CLIENT_FALLBACK = 'youtube:player_client=default,-web,-web_safari'

function buildPotExtractorArgs(token: string, visitorData: string): string {
	const visitor = visitorData ? `;visitor_data=${visitorData}` : ''
	return `youtube:po_token=web.gvs+${token}${visitor}`
}

type RetryStrategy = {kind: 'pot'; reMint: boolean} | {kind: 'fallback'} | {kind: 'noExtractorArgs'}

// Probes (--dump-json) should never legitimately take this long. Without a
// timeout, a stalled yt-dlp run (e.g. extractor giving up but not exiting)
// would freeze the wizard's "Fetching format" spinner indefinitely.
const PROBE_TIMEOUT_MS = 60_000

interface InvokeOptions {
	url: string
	ytDlpPath: string
	ffmpegPath: string | null
	jsRuntime: YtDlpJsRuntime | null
	e2eMode?: E2eHarnessMode
	args: string[]
	tokenService: TokenService
	cookies?: ResolvedCookies | null
	proxyUrl?: string
	limitRate?: string
	timeoutMs?: number
	signal?: YtDlpSignal
	isProbe?: boolean
}

async function invokeOnce(opts: InvokeOptions, strategy: RetryStrategy): Promise<YtDlpResult> {
	const extractorArgsArr: string[] = []
	if (strategy.kind === 'pot') {
		if (strategy.reMint) opts.tokenService.invalidateCache()
		const {token, visitorData, fromCache} = await opts.tokenService.mintTokenForUrl(opts.url)
		if (!fromCache) opts.signal?.onMinting?.(strategy.reMint ? 1 : 0)
		extractorArgsArr.push('--extractor-args', buildPotExtractorArgs(token, visitorData))
	} else if (strategy.kind === 'fallback') {
		extractorArgsArr.push('--extractor-args', PLAYER_CLIENT_FALLBACK)
	}
	// 'noExtractorArgs' → no --extractor-args flag at all. yt-dlp runs vanilla
	// for non-YouTube extractors.

	const cookiesArgs = opts.cookies?.kind === 'file' ? ['--cookies', opts.cookies.path] : opts.cookies?.kind === 'browser' ? ['--cookies-from-browser', opts.cookies.browser] : []
	const proxyArgs = opts.proxyUrl ? ['--proxy', opts.proxyUrl] : []
	// Bandwidth cap (anti-bot lever): only applied to media downloads via the
	// caller — never on probes (we want format JSON instantly) or subtitle
	// sidecar pulls (tiny text, throttling adds zero anti-bot value).
	const limitRateArgs = opts.limitRate ? ['--limit-rate', opts.limitRate] : []
	// yt-dlp 2026+ requires a JS runtime for nsig/signature decoding on the web
	// client. We point yt-dlp at an explicit runtime so it doesn't silently fall
	// back to JS-free clients (where our web.gvs PoT is unused).
	const jsRuntimeArgs = buildYtDlpJsRuntimeArgs(opts.jsRuntime)
	// Pass ffmpeg's location to yt-dlp explicitly instead of relying on the PATH
	// injection in spawnYtDlp. That PATH approach is unreliable inside the packaged
	// Electron portable on Windows: `process.env` can expose the variable as `Path`,
	// so `{ ...process.env }` then `env.PATH = …` writes a *second* key `PATH`
	// holding only ffmpegDir. The child ends up with both `Path=` and `PATH=`, and
	// yt-dlp's frozen-Python `shutil.which('ffmpeg')` reads the original `Path`
	// (without ffmpegDir) → "Preprocessing/Postprocessing: ffmpeg not found".
	const ffmpegLocationArgs = opts.ffmpegPath ? ['--ffmpeg-location', opts.ffmpegPath] : []
	const e2eArgs = opts.e2eMode?.ytDlpArgs({isProbe: opts.isProbe === true}) ?? []
	const args = [...e2eArgs, ...ffmpegLocationArgs, ...extractorArgsArr, ...cookiesArgs, ...proxyArgs, ...limitRateArgs, ...jsRuntimeArgs, ...opts.args]

	ytDlpLog.info('spawn', {attempt: strategy.kind, reMint: strategy.kind === 'pot' ? strategy.reMint : undefined, binary: opts.ytDlpPath, ffmpeg: opts.ffmpegPath, ...summarizeYtDlpJsRuntimeForLog(opts.jsRuntime), cookies: opts.cookies?.kind ?? null, proxy: redactProxy(opts.proxyUrl), args: redactArgs(args)})

	const abortSignal = opts.signal?.abortSignal
	if (abortSignal?.aborted) {
		return Promise.resolve({kind: 'exit-error', exitCode: -1, errorKind: 'unknown', rawError: 'Cancelled', stdout: '', stderr: ''})
	}
	const runtime = opts.jsRuntime
	return new Promise<YtDlpResult>(resolve => {
		const proc = spawnYtDlp(opts.ytDlpPath, args, opts.ffmpegPath, opts.e2eMode, runtime ? env => applyJsRuntimeEnv(env, runtime) : undefined)
		let stdout = ''
		let stderr = ''
		let settled = false

		const finish = (result: YtDlpResult): void => {
			if (settled) return
			settled = true
			if (timer) clearTimeout(timer)
			if (abortSignal && onAbort) abortSignal.removeEventListener('abort', onAbort)
			resolve(result)
		}

		// Force-kill if the process exceeds opts.timeoutMs. SIGKILL on win32 is
		// implemented by node as TerminateProcess — the close event still fires,
		// which the `settled` guard absorbs as a no-op.
		const timer = opts.timeoutMs
			? setTimeout(() => {
					try {
						proc.kill('SIGKILL')
					} catch {
						/* already exited */
					}
					// Detach buffered listeners — the dead proc will eventually fire
					// 'close' (the settled guard absorbs it), but until GC the closure
					// captures stdout/stderr buffers we no longer need.
					proc.stdout.removeAllListeners('data')
					proc.stderr.removeAllListeners('data')
					finish({kind: 'exit-error', exitCode: -1, errorKind: 'unknown', rawError: 'Probe timed out', stdout, stderr})
				}, opts.timeoutMs)
			: null

		// Caller-driven cancel — kill the child and resolve with a Cancelled
		// exit-error so the wider probe pipeline can categorize and exit cleanly
		// rather than waiting for natural completion.
		const onAbort = abortSignal
			? (): void => {
					try {
						proc.kill('SIGKILL')
					} catch {
						/* already exited */
					}
					proc.stdout.removeAllListeners('data')
					proc.stderr.removeAllListeners('data')
					finish({kind: 'exit-error', exitCode: -1, errorKind: 'unknown', rawError: 'Cancelled', stdout, stderr})
				}
			: null
		if (abortSignal && onAbort) abortSignal.addEventListener('abort', onAbort, {once: true})

		opts.signal?.onSpawn?.(proc)

		proc.stdout.on('data', (chunk: Buffer) => {
			const text = chunk.toString()
			stdout += text
			opts.signal?.onStdout?.(text)
		})

		proc.stderr.on('data', (chunk: Buffer) => {
			const text = chunk.toString()
			stderr += text
			opts.signal?.onStderr?.(text)
		})

		proc.on('error', error => finish({kind: 'spawn-error', error, stdout, stderr}))

		proc.on('close', code => {
			if (code === 0) {
				finish({
					kind: 'success',
					stdout,
					stderr,
					// 'fallback' is the YouTube degraded-success path (no PoT). The non-YouTube
					// vanilla path ('noExtractorArgs') is not a fallback — the user sees nothing.
					usedExtractorFallback: strategy.kind === 'fallback'
				})
				return
			}
			finish({kind: 'exit-error', exitCode: code ?? -1, errorKind: classifyYtDlpStderr(stderr).kind, rawError: extractLastError(stderr), stdout, stderr})
		})
	})
}

// 3-attempt ladder (YouTube only):
//   0. PoT token  → if botBlock, retry
//   1. Re-mint PoT → if still botBlock, fall back
//   2. No PoT, player_client=default,-web,-web_safari  (final attempt)
//
// If the *first* PoT mint throws (provider unavailable, scrape broke), we
// skip the PoT path entirely and go straight to step 2.
//
// Non-YouTube URLs run a single attempt with no --extractor-args. Skipping the
// PoT mint avoids gratuitous HiddenWindow scrapes for sites where the token
// would be ignored.
//
// Probe requests (--dump-single-json) also bypass the PoT path. The
// `visitor_data` arg that travels alongside the PoT silently caps YouTube tab
// pagination at 100 entries (single innertube page) regardless of
// --playlist-end, so a 290-video playlist comes back with `entries.length=100`
// and `playlist_count=290` — visible in user reports as "can't fetch more than
// 100 videos". Probes don't fetch streaming URLs, so PoT validation isn't
// needed; non-web clients (android/ios) provide the format JSON.
async function invokeWithRetry(opts: InvokeOptions): Promise<YtDlpResult> {
	// Site adapter resolves PoT applicability from the URL hostname. The unified
	// probe pipeline runs before extractor identity is known, so URL-based
	// routing stays the conservative pre-probe signal.
	if (opts.isProbe || !siteForUrl(opts.url).needsPotToken) {
		return invokeOnce(opts, {kind: 'noExtractorArgs'})
	}

	let result: YtDlpResult
	try {
		result = await invokeOnce(opts, {kind: 'pot', reMint: false})
	} catch {
		return invokeOnce(opts, {kind: 'fallback'})
	}

	if (result.kind !== 'exit-error' || result.errorKind !== 'botBlock') return result

	try {
		result = await invokeOnce(opts, {kind: 'pot', reMint: true})
	} catch {
		return invokeOnce(opts, {kind: 'fallback'})
	}

	if (result.kind !== 'exit-error' || result.errorKind !== 'botBlock') return result

	return invokeOnce(opts, {kind: 'fallback'})
}

export class YtDlp {
	private _ytDlpPath: string | null = null
	private _ffmpegPath: string | null = null
	private _jsRuntime: YtDlpJsRuntime | null = null

	constructor(
		private readonly binaryManager: BinaryManager,
		private readonly tokenService: TokenService,
		private readonly settingsStore: SettingsStore,
		private readonly opts: {e2eMode?: E2eHarnessMode} = {}
	) {}

	// Call once at job start to emit binary-setup status events.
	// run() calls this lazily if not yet done; explicit call lets callers
	// emit status events during the download/install progress.
	async prepare(onStatus?: StatusReporter): Promise<void> {
		this._ytDlpPath = await this.binaryManager.ensureYtDlp(onStatus)
		this._ffmpegPath = await this.binaryManager.ensureFFmpeg(onStatus)
		// ffprobe must live in the same dir as ffmpeg so spawnYtDlp's PATH
		// injection picks up both. We don't need to track the path separately —
		// yt-dlp's post-processors discover it via PATH.
		await this.binaryManager.ensureFFprobe(onStatus)
		const electronNode = await probeElectronNodeRuntime()
		if (electronNode.ok) {
			const ytDlpSource = this.binaryManager.getLastDiagnostic?.('yt-dlp')?.source
			this._jsRuntime = {...electronNode.runtime, allowRemoteComponents: shouldAllowRemoteEjsComponents(ytDlpSource)}
			ytDlpLog.info('JS runtime selected', {...summarizeYtDlpJsRuntimeForLog(this._jsRuntime), ...summarizeDependencySourceForLog(ytDlpSource), env: 'ELECTRON_RUN_AS_NODE child-process only'})
			return
		}
		this._jsRuntime = null
		ytDlpLog.error('Electron Node runtime unavailable', {reason: electronNode.reason})
		throw new Error(`Electron Node runtime unavailable: ${electronNode.reason}`)
	}

	get ffmpegPath(): string | null {
		return this._ffmpegPath
	}

	async run(req: YtDlpRequest, signal?: YtDlpSignal): Promise<YtDlpResult> {
		if (!this._ytDlpPath) await this.prepare()
		const settings = await this.settingsStore.get()
		const cookies = resolveCookies(settings)
		const proxyUrl = nonEmpty(settings.common?.proxyUrl?.trim())
		const pacing = resolveNetworkPacing(settings.common)
		const playlistProbeLimit = resolvePlaylistProbeLimit(settings.common)
		const plan = planWorkflow(req, {pacing, playlistProbeLimit, downloadRetryPolicy: this.opts.e2eMode?.downloadRetryPolicy})
		const isProbe = req.kind === 'probe'
		if (isProbe) {
			ytDlpLog.info('probe request', {url: req.url, playlistMode: req.selection?.playlistMode ?? 'auto', playlistScope: plan.facts.playlistScope ?? null})
		}
		// Bandwidth cap applies to media downloads only — probes need raw speed
		// for snappy "Fetch formats" UX, sidecar subs are tiny so throttling
		// wouldn't change YouTube's anti-bot signal.
		const limitRate = plan.facts.isMediaDownload ? nonEmpty(settings.common?.limitRate?.trim()) : undefined
		const result = await invokeWithRetry({url: req.url, ytDlpPath: this._ytDlpPath!, ffmpegPath: this._ffmpegPath, jsRuntime: this._jsRuntime, e2eMode: this.opts.e2eMode, args: plan.args, tokenService: this.tokenService, cookies, proxyUrl, limitRate, timeoutMs: isProbe ? PROBE_TIMEOUT_MS : undefined, isProbe, signal})
		if (result.kind === 'success' && plan.facts.effectiveSubtitleFormat) {
			return {...result, effectiveSubtitleFormat: plan.facts.effectiveSubtitleFormat}
		}
		return result
	}
}
