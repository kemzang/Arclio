import {z} from 'zod'
import type {MediaType} from './MediaTypes.js'

export const readerTypeSchema = z.enum(['plyr-video', 'plyr-audio', 'pdf', 'comic-archive', 'image-viewer'])
export type ReaderType = z.infer<typeof readerTypeSchema>
export const READER_TYPES = readerTypeSchema.options

const EXTENSION_MAP: Record<string, ReaderType> = {
	mp4: 'plyr-video',
	webm: 'plyr-video',
	mkv: 'plyr-video',
	avi: 'plyr-video',
	mov: 'plyr-video',
	mp3: 'plyr-audio',
	wav: 'plyr-audio',
	flac: 'plyr-audio',
	aac: 'plyr-audio',
	ogg: 'plyr-audio',
	pdf: 'pdf',
	epub: 'pdf',
	djvu: 'pdf',
	cbz: 'comic-archive',
	cbr: 'comic-archive',
	cb7: 'comic-archive',
	cbt: 'comic-archive',
	jpg: 'image-viewer',
	jpeg: 'image-viewer',
	png: 'image-viewer',
	gif: 'image-viewer',
	webp: 'image-viewer',
	bmp: 'image-viewer'
}

export function resolveReaderType(extension: string): ReaderType {
	return EXTENSION_MAP[extension.toLowerCase()] ?? 'image-viewer'
}

export function resolveMediaType(extension: string): MediaType {
	const reader = resolveReaderType(extension)
	if (reader === 'plyr-video') return 'video'
	if (reader === 'plyr-audio') return 'audio'
	if (reader === 'pdf') return 'document'
	if (reader === 'comic-archive') return 'comic'
	return 'image'
}
