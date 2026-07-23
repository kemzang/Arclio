export interface ThumbnailOptions {
	width: number
	height: number
	quality?: number
	format: 'jpeg' | 'webp' | 'png'
}

export interface ThumbnailResult {
	path: string
	width: number
	height: number
	size: number
}

export interface ThumbnailCacheEntry {
	key: string
	path: string
	createdAt: number
	accessedAt: number
	size: number
}
