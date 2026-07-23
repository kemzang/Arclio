export interface BaseMetadata {
	title: string
	duration?: number
	fileSize: number
	createdAt: Date
	modifiedAt: Date
}

export interface VideoMetadata extends BaseMetadata {
	mediaType: 'video'
	codec: string
	resolution: string
	fps: number
	bitrate: number
	audioCodec?: string
}

export interface AudioMetadata extends BaseMetadata {
	mediaType: 'audio'
	codec: string
	bitrate: number
	sampleRate: number
	channels: number
	artist?: string
	album?: string
	trackNumber?: number
}

export interface DocumentMetadata extends BaseMetadata {
	mediaType: 'document'
	pageCount: number
	author?: string
	language?: string
}

export interface ComicMetadata extends BaseMetadata {
	mediaType: 'comic'
	pageCount: number
	publisher?: string
	series?: string
	issueNumber?: number
}

export type MediaMetadata = VideoMetadata | AudioMetadata | DocumentMetadata | ComicMetadata
