export interface ViewerConfig {
	autoplay?: boolean
	loop?: boolean
	volume?: number
}

export interface PlaybackState {
	mediaId: string
	position: number
	duration: number
	progress: number
	isPlaying: boolean
}

export interface PlaylistItem {
	mediaId: string
	title: string
}

export type ReadingMode = 'page-by-page' | 'vertical-scroll' | 'double-page'
