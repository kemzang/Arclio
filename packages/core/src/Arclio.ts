import type {EventBus} from '@arclio/events'
import {EventBus as EventBusImpl} from '@arclio/events'

export interface ArclioConfig {
	database?: unknown
	ytDlp?: unknown
	ffmpeg?: unknown
	filesystem?: unknown
}

export interface DownloadsAPI {
	start: (input: {url: string; outputDir: string}) => Promise<void>
	pause: (id: string) => Promise<void>
	resume: (id: string) => Promise<void>
	cancel: (id: string) => Promise<void>
}

export interface QueueAPI {
	addItem: (item: {id: string; url: string; status: string; priority: number}) => void
	removeItem: (id: string) => void
	pauseAll: () => void
	resumeAll: () => void
	clear: () => void
	getItems: () => Array<{id: string; url: string; status: string; priority: number}>
}

export interface LibraryAPI {
	scan: (folderPath: string) => Promise<void>
	importMedia: (mediaId: string) => Promise<void>
}

export interface ViewerAPI {
	open: (mediaId: string) => void
}

export interface ConverterAPI {
	run: (input: {sourcePath: string; outputPath: string; format: string}) => Promise<void>
	runChain: (chain: unknown, sourceFile: string) => Promise<void>
}

export interface SourcesAPI {
	scan: (sourceId: string) => Promise<void>
}

export interface SearchAPI {
	search: (query: {text: string}) => Promise<Array<{id: string; mediaId: string; title: string; score: number}>>
}

export interface CollectionsAPI {
	create: (input: {name: string; description?: string; itemIds: string[]}) => Promise<{id: string}>
}

export interface FavoritesAPI {
	add: (mediaId: string) => void
	remove: (mediaId: string) => void
	isFavorite: (mediaId: string) => boolean
}

export interface HistoryAPI {
	record: (mediaId: string, action: string) => void
	getRecent: (limit?: number) => Array<{id: string; mediaId: string; action: string; timestamp: Date}>
}

export interface TagsAPI {
	create: (name: string, color?: string) => void
	tagItem: (itemId: string, tagId: string) => void
	untagItem: (itemId: string, tagId: string) => void
}

export interface SystemAPI {
	ready: () => void
	shutdown: () => void
}

export class Arclio {
	public downloads: DownloadsAPI
	public queue: QueueAPI
	public library: LibraryAPI
	public viewer: ViewerAPI
	public converter: ConverterAPI
	public sources: SourcesAPI
	public search: SearchAPI
	public collections: CollectionsAPI
	public favorites: FavoritesAPI
	public history: HistoryAPI
	public tags: TagsAPI
	public system: SystemAPI
	public events: EventBus

	constructor(_config: ArclioConfig) {
		this.events = new EventBusImpl()

		this.downloads = {start: async _input => {}, pause: async () => {}, resume: async () => {}, cancel: async () => {}}

		this.queue = {addItem: () => {}, removeItem: () => {}, pauseAll: () => {}, resumeAll: () => {}, clear: () => {}, getItems: () => []}

		this.library = {scan: async () => {}, importMedia: async () => {}}

		this.viewer = {open: () => {}}

		this.converter = {run: async () => {}, runChain: async () => {}}

		this.sources = {scan: async () => {}}

		this.search = {search: () => Promise.resolve([])}

		this.collections = {create: () => Promise.resolve({id: ''})}

		this.favorites = {add: () => {}, remove: () => {}, isFavorite: () => false}

		this.history = {record: () => {}, getRecent: () => []}

		this.tags = {create: () => {}, tagItem: () => {}, untagItem: () => {}}

		this.system = {ready: () => {}, shutdown: () => {}}
	}
}
