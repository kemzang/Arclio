import type {Result} from './result.js'
import type {SupportedLang} from './i18n/types.js'
import type {
	AppSettings,
	CancelDownloadInput,
	CancelDownloadOutput,
	CommonSettings,
	DependencyId,
	DownloadJob,
	DownloadProfilesPrefs,
	FeedbackDiagnosticUpload,
	GraphicsPolicy,
	PauseDownloadInput,
	PauseDownloadOutput,
	PlaylistPrefs,
	ProbeError,
	ProbeInput,
	ProbeProgressEvent,
	ProbeResult,
	ProgressEvent,
	QueueSelectionAction,
	QueueSelectionCommandResult,
	QueueOutputTargetChangeResult,
	QueueItem,
	QueueLane,
	SinglePrefs,
	StartDownloadInput,
	StartDownloadOutput,
	StatusEvent,
	UpdateAvailablePayload,
	UpdateInstallResult,
	WarmUpOutput,
	WarmupProgressEvent,
	WizardStepSnapshot
} from './types.js'
import type {PlaylistManifest} from './playlistManifest.js'
import type {ConversionFormat} from './schemas.js'

export interface SettingsPatch {
	common?: Partial<CommonSettings>
	single?: Partial<SinglePrefs>
	playlist?: Partial<PlaylistPrefs>
	profiles?: Partial<DownloadProfilesPrefs>
}

export interface WindowApi {
	minimize(): Promise<void>
	maximize(): Promise<void>
	close(): Promise<void>
	isMaximized(): Promise<boolean>
	onMaximizedChange(listener: (isMaximized: boolean) => void): () => void
}

export interface AppApi {
	app: {
		warmUp(input?: {force?: boolean}): Promise<Result<WarmUpOutput>>
		cancelWarmup(): Promise<void>
		getGraphicsPolicy(): Promise<Result<GraphicsPolicy>>
		installYtDlpWithHomebrew(): Promise<Result<{installedPath: string}>>
		installYtDlpWithWinget(): Promise<Result<{installedPath: string}>>
		setLanguage(language: SupportedLang): Promise<void>
	}
	window: WindowApi
	downloads: {
		probe(input: ProbeInput): Promise<Result<ProbeResult, ProbeError>>
		probeCancel(): Promise<void>
		start(input: StartDownloadInput): Promise<Result<StartDownloadOutput>>
		cancel(input?: CancelDownloadInput): Promise<Result<CancelDownloadOutput>>
		pause(input?: PauseDownloadInput): Promise<Result<PauseDownloadOutput>>
		resume(input: {jobId: string}): Promise<Result<{resumed: boolean; job?: DownloadJob}>>
	}
	settings: {get(): Promise<Result<AppSettings>>; update(input: SettingsPatch): Promise<Result<AppSettings>>; reset(): Promise<Result<AppSettings>>}
	shell: {openFolder(path?: string): Promise<Result<{opened: boolean}>>; openExternal(url: string): Promise<Result<{opened: boolean}>>; openBinariesDir(): Promise<Result<{opened: boolean}>>}
	logs: {openDir(): Promise<Result<{opened: boolean}>>; uploadFeedbackDiagnostic(input: {reportId: string}): Promise<Result<FeedbackDiagnosticUpload>>}
	dialog: {chooseFolder(defaultPath?: string): Promise<Result<{path: string | null}>>; chooseFile(): Promise<Result<{path: string | null}>>; chooseExecutable(binary: DependencyId): Promise<Result<{path: string | null}>>}
	events: {
		onStatus(listener: (event: StatusEvent) => void): () => void
		onProgress(listener: (event: ProgressEvent) => void): () => void
		onProbeProgress(listener: (event: ProbeProgressEvent) => void): () => void
		onClipboardUrl(listener: (url: string) => void): () => void
		onWarmupProgress(listener: (event: WarmupProgressEvent) => void): () => void
	}
	queue: {
		cmd: {
			add(items: QueueItem[]): Promise<Result<{ids: string[]}>>
			getSnapshot(): Promise<Result<QueueItem[]>>
			start(input: {itemId: string}): Promise<Result<void>>
			pause(input: {itemId: string}): Promise<Result<void>>
			resume(input: {itemId: string}): Promise<Result<void>>
			cancel(input: {itemId: string | null}): Promise<Result<void>>
			retry(input: {itemId: string}): Promise<Result<void>>
			clearCompleted(): Promise<Result<void>>
			remove(input: {itemId: string}): Promise<Result<void>>
			setLane(input: {itemId: string; lane: QueueLane}): Promise<Result<void>>
			applySelectionAction(input: {action: QueueSelectionAction; itemIds: string[]}): Promise<Result<QueueSelectionCommandResult>>
			changeOutputTarget(input: {itemIds: string[]; outputDir: string}): Promise<Result<QueueOutputTargetChangeResult>>
			pauseAll(): Promise<Result<void>>
			resumeAll(): Promise<Result<void>>
		}
		events: {onSnapshot(listener: (items: QueueItem[]) => void): () => void; onAdded(listener: (event: {items: QueueItem[]; atIdx: number}) => void): () => void; onUpdated(listener: (event: {item: QueueItem}) => void): () => void; onRemoved(listener: (event: {itemId: string}) => void): () => void}
	}
	updater: {onUpdateAvailable(listener: (info: UpdateAvailablePayload) => void): () => void; install(): Promise<UpdateInstallResult>}
	analytics: {track(name: string, props?: Record<string, string | number | boolean>): void}
	diagnostics: {logWizardStep(snapshot: WizardStepSnapshot): void}
	playlist: {scanFolder(input: {outputDir: string; videoIds: string[]}): Promise<Result<{matchedIds: string[]}>>; registerManifest(manifest: PlaylistManifest): Promise<Result<void>>}
	library: {
		media: {
			list(filters?: LibraryMediaListFilters): Promise<LibraryMediaWithAssets[]>
			get(id: string): Promise<LibraryMediaWithAssets | null>
			search(query: string, limit?: number): Promise<LibraryMedia[]>
			setFavorite(id: string, isFavorite: boolean): Promise<void>
			setStatus(id: string, status: LibraryMediaStatus): Promise<void>
			delete(id: string): Promise<boolean>
			count(): Promise<number>
			countByStatus(): Promise<Record<string, number>>
		}
		collection: {
			list(): Promise<LibraryCollectionWithCount[]>
			get(id: string): Promise<LibraryCollection | null>
			create(data: {name: string; description?: string; icon?: string; color?: string}): Promise<LibraryCollection>
			update(id: string, data: {name?: string; description?: string; icon?: string; color?: string}): Promise<LibraryCollection | null>
			delete(id: string): Promise<boolean>
			addMedia(collectionId: string, mediaId: string): Promise<void>
			removeMedia(collectionId: string, mediaId: string): Promise<void>
			getMediaIds(collectionId: string): Promise<string[]>
			getForMedia(mediaId: string): Promise<string[]>
		}
		tag: {
			list(): Promise<LibraryTagWithCount[]>
			create(data: {name: string; color?: string}): Promise<LibraryTag>
			update(id: string, data: {name?: string; color?: string}): Promise<LibraryTag | null>
			delete(id: string): Promise<boolean>
			addToMedia(tagId: string, mediaId: string): Promise<void>
			removeFromMedia(tagId: string, mediaId: string): Promise<void>
			getForMedia(mediaId: string): Promise<LibraryTag[]>
			getMediaIds(tagId: string): Promise<string[]>
		}
		playback: {updatePosition(mediaId: string, position: number, duration: number): Promise<void>; getByMedia(mediaId: string): Promise<LibraryPlaybackHistory | null>; listRecent(limit?: number): Promise<LibraryPlaybackHistory[]>}
		downloadHistory: {list(options?: {status?: string; limit?: number; offset?: number}): Promise<LibraryDownloadHistory[]>; count(): Promise<number>; countByStatus(): Promise<Record<string, number>>}
		events: {onMediaCreated(listener: (data: {id: string; title: string; mediaType: string}) => void): () => void}
	}
	metadata: {extract(filePath: string, mediaType?: string): Promise<MediaMetadataResult>; extractAndSave(filePath: string, mediaId: string, mediaType?: string): Promise<MetadataExtractResult>; extractBatch(filePaths: string[]): Promise<MetadataExtractResult[]>}
	thumbnail: {
		generate(mediaId: string, filePath: string, mediaType: string): Promise<ThumbnailResult>
		get(mediaId: string): Promise<string | null>
		regenerate(mediaId: string, filePath: string, mediaType: string): Promise<ThumbnailResult>
		delete(mediaId: string): Promise<boolean>
		getUrl(mediaId: string): Promise<string>
		clearCache(): Promise<{removed: number; freedBytes: number}>
	}
	indexer: {indexFile(filePath: string, options?: {title?: string; sourceKey?: string}): Promise<IndexerResult>; indexFiles(filePaths: string[]): Promise<IndexerResult[]>}
	archive: {listPages(archivePath: string): Promise<ArchivePageList>; readPage(archivePath: string, entryName: string): Promise<ArchivePageData>; close(): Promise<void>}
	// Account — device pairing. The device token deliberately never appears in
	// this surface: the renderer shows the code and reacts to the status.
	account: {status(): Promise<AccountStatus>; beginPairing(): Promise<PairingHandle>; awaitPairing(): Promise<AwaitPairingResult>; cancelPairing(): Promise<void>; disconnect(): Promise<AccountStatus>}
	sync: {now(): Promise<SyncOutcome>; state(): Promise<SyncState>}
	sources: {add(path: string, watchEnabled?: boolean): Promise<WatchedSource>; remove(id: string): Promise<void>; list(): Promise<WatchedSource[]>; toggleWatch(id: string, enabled: boolean): Promise<void>; scan(id: string): Promise<{indexed: number; errors: number}>}
	converter: {
		convert(inputPath: string, format: ConversionFormat, options?: Record<string, unknown>, outputDir?: string): Promise<ConversionResult>
		convertVideo(inputPath: string, options?: {format?: ConversionFormat; codec?: string; resolution?: string; crf?: number; trimStart?: string; trimEnd?: string}): Promise<ConversionResult>
		convertAudio(inputPath: string, options?: {format?: ConversionFormat; bitrate?: string; sampleRate?: number}): Promise<ConversionResult>
		convertImage(inputPath: string, options?: {format?: ConversionFormat; width?: number; height?: number; quality?: number}): Promise<ConversionResult>
		extractAudio(videoPath: string, format?: ConversionFormat): Promise<ConversionResult>
		createGif(videoPath: string, options?: {fps?: number; width?: number; duration?: number}): Promise<ConversionResult>
	}
}

// ── Library types ────────────────────────────────────────────────────────────

export type LibraryMediaStatus = 'AVAILABLE' | 'MISSING' | 'CORRUPTED' | 'DELETED'

export interface LibraryMedia {
	id: string
	title: string
	description: string | null
	author: string | null
	url: string
	sourceKey: string | null
	sourceType: string
	duration: number | null
	mediaType: string
	thumbnailUrl: string | null
	thumbnailPath: string | null
	metadata: Record<string, unknown> | null
	status: LibraryMediaStatus
	isFavorite: number
	createdBy: string
	downloadDate: string
	createdAt: string
	updatedAt: string
}

export interface LibraryAsset {
	id: string
	mediaId: string
	kind: string
	path: string
	fileName: string
	sizeBytes: number | null
	mimeType: string | null
	status: string
	createdAt: string
}

export interface LibraryMediaWithAssets extends LibraryMedia {
	assets: LibraryAsset[]
	totalSize: number | null
}

export interface LibraryMediaListFilters {
	search?: string
	mediaType?: 'video' | 'audio' | 'document' | 'comic' | 'image'
	status?: string
	isFavorite?: boolean
	sourceType?: string
	collectionId?: string
	tagId?: string
	sortBy?: 'title' | 'download_date' | 'created_at' | 'duration'
	sortOrder?: 'asc' | 'desc'
	limit?: number
	offset?: number
}

export interface LibraryCollection {
	id: string
	name: string
	description: string | null
	icon: string | null
	color: string | null
	sortOrder: number
	createdAt: string
	updatedAt: string
}

export interface LibraryCollectionWithCount extends LibraryCollection {
	mediaCount: number
	coverThumbnailUrl: string | null
}

export interface LibraryTag {
	id: string
	name: string
	color: string | null
	createdAt: string
}

export interface LibraryTagWithCount extends LibraryTag {
	mediaCount: number
}

export interface LibraryPlaybackHistory {
	id: string
	mediaId: string
	lastPosition: number
	duration: number | null
	playCount: number
	completed: number
	lastOpenedAt: string
	createdAt: string
}

export interface LibraryDownloadHistory {
	id: string
	url: string
	outputDir: string | null
	mediaId: string | null
	status: string
	errorKind: string | null
	errorRaw: string | null
	formatId: string | null
	durationMs: number | null
	finishedAt: string
	createdAt: string
}

// ── Metadata types ───────────────────────────────────────────────────────────

export interface MediaMetadataResult {
	mediaType: string
	title: string
	duration?: number
	fileSize: number
	createdAt: string
	modifiedAt: string
	codec?: string
	resolution?: string
	fps?: number
	bitrate?: number
	audioCodec?: string
	sampleRate?: number
	channels?: number
	artist?: string
	album?: string
	trackNumber?: number
	pageCount?: number
	author?: string
	language?: string
	width?: number
	height?: number
	format?: string
	colorSpace?: string
	exif?: Record<string, unknown>
	publisher?: string
	series?: string
	issueNumber?: number
}

export interface MetadataExtractResult {
	success: boolean
	mediaId?: string
	metadata?: MediaMetadataResult
	error?: string
}

export interface ThumbnailResult {
	success: boolean
	thumbnailPath?: string
	error?: string
}

export interface IndexerResult {
	success: boolean
	mediaId?: string
	error?: string
}

/** Image entry names inside a comic archive, in reading order. */
export interface ArchivePageList {
	pages: string[]
	error?: string
}

export type ArchivePageData = {ok: true; data: Uint8Array<ArrayBuffer>; mimeType: string} | {ok: false; error: string}

export interface WatchedSource {
	id: string
	path: string
	watchEnabled: boolean
	createdAt: string
}

export interface ConversionResult {
	success: boolean
	outputPath?: string
	error?: string
}

export interface AccountStatus {
	connected: boolean
	accountEmail?: string
	deviceId?: string
	/** False when the OS cannot protect a token at rest; connecting is refused. */
	canStoreCredentials: boolean
}

export interface PairingHandle {
	userCode: string
	verificationUrl: string
	expiresAt: number
}

export type AwaitPairingResult = {ok: true; status: AccountStatus} | {ok: false; reason: 'expired' | 'denied' | 'cancelled' | 'failed'}

export type SyncOutcome = {status: 'skipped'; reason: 'not-connected'} | {status: 'ok'; pulled: number; pushed: number; deleted: number} | {status: 'unauthorized'} | {status: 'failed'; error: string}

export interface SyncState {
	/** True while a round is running; a second request is refused rather than queued. */
	running: boolean
	lastRunAt: number | null
	lastOutcome: SyncOutcome | null
}
