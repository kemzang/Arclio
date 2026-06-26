import {IPC_CHANNELS} from '@shared/ipc.js'
import type {AppApi} from '@shared/api.js'
import type {ProbeProgressEvent, ProgressEvent, QueueItem, QueueLane, QueueSelectionAction, StatusEvent, UpdateAvailablePayload, WarmupProgressEvent} from '@shared/types.js'

// Minimal IpcRenderer shape — only what the api factory uses, no electron dep.
export interface PreloadIpcRenderer {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	invoke(channel: string, ...args: unknown[]): Promise<any>
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	on(channel: string, listener: (event: unknown, ...args: any[]) => void): void
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	removeListener(channel: string, listener: (event: unknown, ...args: any[]) => void): void
	send(channel: string, ...args: unknown[]): void
}

export function createPreloadApi(ipcRenderer: PreloadIpcRenderer): AppApi {
	return {
		app: {
			warmUp: input => ipcRenderer.invoke(IPC_CHANNELS.appWarmUp, input ?? {}),
			cancelWarmup: () => ipcRenderer.invoke(IPC_CHANNELS.appCancelWarmup),
			getGraphicsPolicy: () => ipcRenderer.invoke(IPC_CHANNELS.appGetGraphicsPolicy),
			installYtDlpWithHomebrew: () => ipcRenderer.invoke(IPC_CHANNELS.appInstallYtDlpHomebrew),
			installYtDlpWithWinget: () => ipcRenderer.invoke(IPC_CHANNELS.appInstallYtDlpWinget),
			setLanguage: language => ipcRenderer.invoke(IPC_CHANNELS.appSetLanguage, language)
		},
		window: {
			minimize: () => ipcRenderer.invoke(IPC_CHANNELS.windowMinimize),
			maximize: () => ipcRenderer.invoke(IPC_CHANNELS.windowMaximize),
			close: () => ipcRenderer.invoke(IPC_CHANNELS.windowClose),
			isMaximized: () => ipcRenderer.invoke(IPC_CHANNELS.windowIsMaximized),
			onMaximizedChange: listener => {
				const wrapped = (_: unknown, isMax: boolean): void => listener(isMax)
				ipcRenderer.on(IPC_CHANNELS.windowMaximizedChange, wrapped)
				return () => {
					ipcRenderer.removeListener(IPC_CHANNELS.windowMaximizedChange, wrapped)
				}
			}
		},
		downloads: {
			probe: input => ipcRenderer.invoke(IPC_CHANNELS.downloadsProbe, input),
			probeCancel: () => ipcRenderer.invoke(IPC_CHANNELS.downloadsProbeCancel),
			start: input => ipcRenderer.invoke(IPC_CHANNELS.downloadsStart, input),
			cancel: (input = {}) => ipcRenderer.invoke(IPC_CHANNELS.downloadsCancel, input),
			pause: (input = {}) => ipcRenderer.invoke(IPC_CHANNELS.downloadsPause, input),
			resume: input => ipcRenderer.invoke(IPC_CHANNELS.downloadsResume, input)
		},
		settings: {get: () => ipcRenderer.invoke(IPC_CHANNELS.settingsGet), update: input => ipcRenderer.invoke(IPC_CHANNELS.settingsUpdate, input)},
		shell: {openFolder: targetPath => ipcRenderer.invoke(IPC_CHANNELS.shellOpenFolder, targetPath), openExternal: url => ipcRenderer.invoke(IPC_CHANNELS.shellOpenExternal, url), openBinariesDir: () => ipcRenderer.invoke(IPC_CHANNELS.shellOpenBinariesDir)},
		logs: {openDir: () => ipcRenderer.invoke(IPC_CHANNELS.logsOpenDir), uploadFeedbackDiagnostic: input => ipcRenderer.invoke(IPC_CHANNELS.logsUploadFeedbackDiagnostic, input)},
		dialog: {chooseFolder: (defaultPath?: string) => ipcRenderer.invoke(IPC_CHANNELS.chooseFolder, defaultPath), chooseFile: () => ipcRenderer.invoke(IPC_CHANNELS.chooseFile), chooseExecutable: binary => ipcRenderer.invoke(IPC_CHANNELS.dialogChooseExecutable, binary)},
		events: {
			onStatus: listener => {
				const wrapped = (_: unknown, event: StatusEvent): void => listener(event)
				ipcRenderer.on(IPC_CHANNELS.eventsStatus, wrapped)
				return () => {
					ipcRenderer.removeListener(IPC_CHANNELS.eventsStatus, wrapped)
				}
			},
			onProgress: listener => {
				const wrapped = (_: unknown, event: ProgressEvent): void => listener(event)
				ipcRenderer.on(IPC_CHANNELS.eventsProgress, wrapped)
				return () => {
					ipcRenderer.removeListener(IPC_CHANNELS.eventsProgress, wrapped)
				}
			},
			onProbeProgress: listener => {
				const wrapped = (_: unknown, event: ProbeProgressEvent): void => listener(event)
				ipcRenderer.on(IPC_CHANNELS.downloadsProbeProgress, wrapped)
				return () => {
					ipcRenderer.removeListener(IPC_CHANNELS.downloadsProbeProgress, wrapped)
				}
			},
			onClipboardUrl: listener => {
				const wrapped = (_: unknown, url: string): void => listener(url)
				ipcRenderer.on(IPC_CHANNELS.eventsClipboardUrl, wrapped)
				return () => {
					ipcRenderer.removeListener(IPC_CHANNELS.eventsClipboardUrl, wrapped)
				}
			},
			onWarmupProgress: listener => {
				const wrapped = (_: unknown, event: WarmupProgressEvent): void => listener(event)
				ipcRenderer.on(IPC_CHANNELS.warmupProgress, wrapped)
				return () => {
					ipcRenderer.removeListener(IPC_CHANNELS.warmupProgress, wrapped)
				}
			}
		},
		queue: {
			cmd: {
				add: (items: QueueItem[]) => ipcRenderer.invoke(IPC_CHANNELS.queueCmdAdd, items),
				getSnapshot: () => ipcRenderer.invoke(IPC_CHANNELS.queueCmdGetSnapshot),
				start: (input: {itemId: string}) => ipcRenderer.invoke(IPC_CHANNELS.queueCmdStart, input),
				pause: (input: {itemId: string}) => ipcRenderer.invoke(IPC_CHANNELS.queueCmdPause, input),
				resume: (input: {itemId: string}) => ipcRenderer.invoke(IPC_CHANNELS.queueCmdResume, input),
				cancel: (input: {itemId: string | null}) => ipcRenderer.invoke(IPC_CHANNELS.queueCmdCancel, input),
				retry: (input: {itemId: string}) => ipcRenderer.invoke(IPC_CHANNELS.queueCmdRetry, input),
				clearCompleted: () => ipcRenderer.invoke(IPC_CHANNELS.queueCmdClearCompleted),
				remove: (input: {itemId: string}) => ipcRenderer.invoke(IPC_CHANNELS.queueCmdRemove, input),
				setLane: (input: {itemId: string; lane: QueueLane}) => ipcRenderer.invoke(IPC_CHANNELS.queueCmdSetLane, input),
				applySelectionAction: (input: {action: QueueSelectionAction; itemIds: string[]}) => ipcRenderer.invoke(IPC_CHANNELS.queueCmdApplySelectionAction, input),
				changeOutputTarget: (input: {itemIds: string[]; outputDir: string}) => ipcRenderer.invoke(IPC_CHANNELS.queueCmdChangeOutputTarget, input),
				pauseAll: () => ipcRenderer.invoke(IPC_CHANNELS.queueCmdPauseAll),
				resumeAll: () => ipcRenderer.invoke(IPC_CHANNELS.queueCmdResumeAll)
			},
			events: {
				onSnapshot: listener => {
					const wrapped = (_: unknown, items: QueueItem[]): void => listener(items)
					ipcRenderer.on(IPC_CHANNELS.queueEventSnapshot, wrapped)
					return () => {
						ipcRenderer.removeListener(IPC_CHANNELS.queueEventSnapshot, wrapped)
					}
				},
				onAdded: listener => {
					const wrapped = (_: unknown, event: {items: QueueItem[]; atIdx: number}): void => listener(event)
					ipcRenderer.on(IPC_CHANNELS.queueEventAdded, wrapped)
					return () => {
						ipcRenderer.removeListener(IPC_CHANNELS.queueEventAdded, wrapped)
					}
				},
				onUpdated: listener => {
					const wrapped = (_: unknown, event: {item: QueueItem}): void => listener(event)
					ipcRenderer.on(IPC_CHANNELS.queueEventUpdated, wrapped)
					return () => {
						ipcRenderer.removeListener(IPC_CHANNELS.queueEventUpdated, wrapped)
					}
				},
				onRemoved: listener => {
					const wrapped = (_: unknown, event: {itemId: string}): void => listener(event)
					ipcRenderer.on(IPC_CHANNELS.queueEventRemoved, wrapped)
					return () => {
						ipcRenderer.removeListener(IPC_CHANNELS.queueEventRemoved, wrapped)
					}
				}
			}
		},
		updater: {
			onUpdateAvailable: listener => {
				const wrapped = (_: unknown, payload: UpdateAvailablePayload): void => listener(payload)
				ipcRenderer.on(IPC_CHANNELS.updaterAvailable, wrapped)
				return () => ipcRenderer.removeListener(IPC_CHANNELS.updaterAvailable, wrapped)
			},
			install: () => ipcRenderer.invoke(IPC_CHANNELS.updaterInstall)
		},
		analytics: {track: (name, props) => ipcRenderer.send(IPC_CHANNELS.analyticsTrack, {name, props})},
		diagnostics: {logWizardStep: snapshot => ipcRenderer.send(IPC_CHANNELS.diagnosticsLogWizardStep, snapshot)},
		playlist: {scanFolder: input => ipcRenderer.invoke(IPC_CHANNELS.playlistScanFolder, input), registerManifest: manifest => ipcRenderer.invoke(IPC_CHANNELS.playlistRegisterManifest, manifest)},
		library: {
			media: {
				list: filters => ipcRenderer.invoke(IPC_CHANNELS.libraryMediaList, filters),
				get: id => ipcRenderer.invoke(IPC_CHANNELS.libraryMediaGet, id),
				search: (query, limit) => ipcRenderer.invoke(IPC_CHANNELS.libraryMediaSearch, query, limit),
				setFavorite: (id, isFavorite) => ipcRenderer.invoke(IPC_CHANNELS.libraryMediaSetFavorite, id, isFavorite),
				setStatus: (id, status) => ipcRenderer.invoke(IPC_CHANNELS.libraryMediaSetStatus, id, status),
				delete: id => ipcRenderer.invoke(IPC_CHANNELS.libraryMediaDelete, id),
				count: () => ipcRenderer.invoke(IPC_CHANNELS.libraryMediaCount),
				countByStatus: () => ipcRenderer.invoke(IPC_CHANNELS.libraryMediaCountByStatus)
			},
			collection: {
				list: () => ipcRenderer.invoke(IPC_CHANNELS.libraryCollectionList),
				get: id => ipcRenderer.invoke(IPC_CHANNELS.libraryCollectionGet, id),
				create: data => ipcRenderer.invoke(IPC_CHANNELS.libraryCollectionCreate, data),
				update: (id, data) => ipcRenderer.invoke(IPC_CHANNELS.libraryCollectionUpdate, id, data),
				delete: id => ipcRenderer.invoke(IPC_CHANNELS.libraryCollectionDelete, id),
				addMedia: (collectionId, mediaId) => ipcRenderer.invoke(IPC_CHANNELS.libraryCollectionAddMedia, collectionId, mediaId),
				removeMedia: (collectionId, mediaId) => ipcRenderer.invoke(IPC_CHANNELS.libraryCollectionRemoveMedia, collectionId, mediaId),
				getMediaIds: collectionId => ipcRenderer.invoke(IPC_CHANNELS.libraryCollectionGetMediaIds, collectionId),
				getForMedia: mediaId => ipcRenderer.invoke(IPC_CHANNELS.libraryCollectionGetForMedia, mediaId)
			},
			tag: {
				list: () => ipcRenderer.invoke(IPC_CHANNELS.libraryTagList),
				create: data => ipcRenderer.invoke(IPC_CHANNELS.libraryTagCreate, data),
				update: (id, data) => ipcRenderer.invoke(IPC_CHANNELS.libraryTagUpdate, id, data),
				delete: id => ipcRenderer.invoke(IPC_CHANNELS.libraryTagDelete, id),
				addToMedia: (tagId, mediaId) => ipcRenderer.invoke(IPC_CHANNELS.libraryTagAddToMedia, tagId, mediaId),
				removeFromMedia: (tagId, mediaId) => ipcRenderer.invoke(IPC_CHANNELS.libraryTagRemoveFromMedia, tagId, mediaId),
				getForMedia: mediaId => ipcRenderer.invoke(IPC_CHANNELS.libraryTagGetForMedia, mediaId),
				getMediaIds: tagId => ipcRenderer.invoke(IPC_CHANNELS.libraryTagGetMediaIds, tagId)
			},
			playback: {
				updatePosition: (mediaId, position, duration) => ipcRenderer.invoke(IPC_CHANNELS.libraryPlaybackUpdatePosition, mediaId, position, duration),
				getByMedia: mediaId => ipcRenderer.invoke(IPC_CHANNELS.libraryPlaybackGetByMedia, mediaId),
				listRecent: limit => ipcRenderer.invoke(IPC_CHANNELS.libraryPlaybackListRecent, limit)
			},
			downloadHistory: {list: options => ipcRenderer.invoke(IPC_CHANNELS.libraryDownloadHistoryList, options), count: () => ipcRenderer.invoke(IPC_CHANNELS.libraryDownloadHistoryCount), countByStatus: () => ipcRenderer.invoke(IPC_CHANNELS.libraryDownloadHistoryCountByStatus)}
		}
	}
}
