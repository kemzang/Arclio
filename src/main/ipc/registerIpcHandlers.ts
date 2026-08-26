import type {BrowserWindow} from 'electron'
import type {SupportedLang} from '@shared/i18n/types.js'
import type {GraphicsPolicy} from '@shared/types.js'
import type {DownloadService} from '@main/services/DownloadService.js'
import type {ProbeService} from '@main/services/ProbeService.js'
import type {BinaryManager} from '@main/services/BinaryManager.js'
import type {TokenService} from '@main/services/TokenService.js'
import type {SettingsStore} from '@main/stores/SettingsStore.js'
import type {QueueService} from '@main/services/QueueService.js'
import type {ClipboardWatcher} from '@main/services/ClipboardWatcher.js'
import type {PlaylistManifestStore} from '@main/stores/PlaylistManifestStore.js'
import type {DrizzleDatabase} from '@main/db/connection.js'
import {DownloadEventBridge} from '@main/services/DownloadEventBridge.js'
import {QueueEventBridge} from '@main/services/QueueEventBridge.js'
import {ProbeEventBridge} from '@main/services/ProbeEventBridge.js'
import {WarmupService} from '@main/services/WarmupService.js'
import {MetadataService} from '@main/services/MetadataService.js'
import {ThumbnailService} from '@main/services/ThumbnailService.js'
import {IndexerService} from '@main/services/IndexerService.js'
import {SourcesService} from '@main/services/SourcesService.js'
import {ConverterService} from '@main/services/ConverterService.js'
import {ArchiveService} from '@main/services/ArchiveService.js'
import {registerAppHandlers} from './appHandlers.js'
import {registerWindowHandlers} from './windowHandlers.js'
import {registerDownloadHandlers} from './downloadHandlers.js'
import {registerSettingsHandlers} from './settingsHandlers.js'
import {registerFileHandlers} from './fileHandlers.js'
import {registerQueueHandlers} from './queueHandlers.js'
import {registerAnalyticsHandlers} from './analyticsHandlers.js'
import {registerDiagnosticsHandlers} from './diagnosticsHandlers.js'
import {registerPlaylistHandlers} from './playlistHandlers.js'
import {registerLibraryHandlers} from './libraryHandlers.js'
import {registerMetadataHandlers} from './metadataHandlers.js'
import {registerThumbnailHandlers} from './thumbnailHandlers.js'
import {registerIndexerHandlers} from './indexerHandlers.js'
import {registerSourcesHandlers} from './sourcesHandlers.js'
import {registerConverterHandlers} from './converterHandlers.js'
import {registerArchiveHandlers} from './archiveHandlers.js'
import {registerAccountHandlers} from './accountHandlers.js'
import {registerSyncHandlers} from './syncHandlers.js'
import {SyncService} from '@main/services/SyncService.js'
import {SyncScheduler} from '@main/services/SyncScheduler.js'
import {createMediaRepository} from '@main/db/repositories/mediaRepository.js'
import {AccountStore} from '@main/stores/AccountStore.js'
import {AccountService} from '@main/services/AccountService.js'

export interface IpcDependencies {
	mainWindow: BrowserWindow
	downloadService: DownloadService
	probeService: ProbeService
	settingsStore: SettingsStore
	queueService: QueueService
	binaryManager: BinaryManager
	tokenService: TokenService
	languageRef: {current: SupportedLang}
	clipboardWatcher: ClipboardWatcher
	playlistManifestStore: PlaylistManifestStore
	graphicsPolicyProvider: () => Promise<GraphicsPolicy>
	libraryDb: DrizzleDatabase
}

let activeDownloadBridge: DownloadEventBridge | null = null
let activeQueueBridge: QueueEventBridge | null = null
let activeProbeBridge: ProbeEventBridge | null = null

export function registerIpcHandlers(deps: IpcDependencies): void {
	const {mainWindow, downloadService, probeService, settingsStore, queueService, binaryManager, tokenService, languageRef, clipboardWatcher, playlistManifestStore, graphicsPolicyProvider, libraryDb} = deps

	const warmupService = new WarmupService({binaryManager, tokenService, window: mainWindow})
	const metadataService = new MetadataService(libraryDb, binaryManager)
	const thumbnailService = new ThumbnailService({ffmpegPath: binaryManager.getFfmpegPath()})
	const indexerService = new IndexerService(libraryDb, {metadataService, thumbnailService})
	const sourcesService = new SourcesService(indexerService)
	const converterService = new ConverterService(binaryManager.getFfmpegPath())
	const archiveService = new ArchiveService()
	// One store shared by both services: the account owns the credentials and the
	// sync cursor, and both must be cleared together on disconnect.
	const accountStore = new AccountStore()
	const accountService = new AccountService({store: accountStore})
	const syncScheduler = new SyncScheduler(new SyncService(createMediaRepository(libraryDb), accountStore))
	// Started only once an account exists: an unpaired app must not wake up every
	// 15 minutes to discover it has nothing to do.
	if (accountService.status().connected) syncScheduler.start()
	registerAppHandlers({warmupService, binaryManager, languageRef, graphicsPolicyProvider})
	registerWindowHandlers(mainWindow)
	registerDownloadHandlers({downloadService, probeService, settingsStore})
	registerSettingsHandlers({settingsStore, clipboardWatcher})
	registerFileHandlers(mainWindow, binaryManager)
	registerQueueHandlers(queueService)
	registerAnalyticsHandlers()
	registerDiagnosticsHandlers()
	registerPlaylistHandlers(playlistManifestStore, settingsStore)
	registerLibraryHandlers(libraryDb)
	registerMetadataHandlers(metadataService)
	registerThumbnailHandlers(thumbnailService)
	registerIndexerHandlers(indexerService)
	registerSourcesHandlers(sourcesService)
	registerConverterHandlers(converterService)
	registerArchiveHandlers(archiveService)
	registerAccountHandlers(accountService, syncScheduler)
	registerSyncHandlers(syncScheduler)

	activeDownloadBridge?.detach()
	activeDownloadBridge = new DownloadEventBridge(downloadService, mainWindow)
	activeDownloadBridge.attach()

	activeProbeBridge?.detach()
	activeProbeBridge = new ProbeEventBridge(probeService, mainWindow)
	activeProbeBridge.attach()

	activeQueueBridge?.detach()
	activeQueueBridge = new QueueEventBridge(queueService, mainWindow)
	activeQueueBridge.attach()
}
