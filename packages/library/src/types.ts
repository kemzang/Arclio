export interface LibraryItem {
	id: string
	mediaId: string
	addedAt: Date
	lastAccessed?: Date
	playCount: number
	rating?: number
}

export interface Collection {
	id: string
	name: string
	description?: string
	itemIds: string[]
	createdAt: Date
	updatedAt: Date
}

export interface Tag {
	id: string
	name: string
	color?: string
}

export interface Favorite {
	id: string
	mediaId: string
	addedAt: Date
}

export interface HistoryEntry {
	id: string
	mediaId: string
	action: 'view' | 'download' | 'convert' | 'share'
	timestamp: Date
	details?: Record<string, unknown>
}
