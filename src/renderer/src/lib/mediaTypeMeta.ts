import {MEDIA_TYPES, type MediaType} from '@shared/schemas.js'

/**
 * Presentation for each media type. Keyed by `MediaType`, so adding a value to
 * `mediaTypeSchema` fails the build here until its label and icon are supplied
 * — the Library and Search filters both read this list.
 *
 * `labelKey` points at the i18n catalog; `fallbackLabel` is the English used
 * until a catalog entry exists for that key.
 */
const MEDIA_TYPE_META: Record<MediaType, {labelKey: string; fallbackLabel: string; emoji: string}> = {
	video: {labelKey: 'library.video', fallbackLabel: 'Video', emoji: '🎬'},
	audio: {labelKey: 'library.audio', fallbackLabel: 'Audio', emoji: '🎵'},
	document: {labelKey: 'library.document', fallbackLabel: 'Document', emoji: '📄'},
	comic: {labelKey: 'library.comic', fallbackLabel: 'Comic', emoji: '📚'},
	image: {labelKey: 'library.image', fallbackLabel: 'Image', emoji: '🖼️'}
}

export interface MediaTypeOption {
	value: MediaType
	labelKey: string
	fallbackLabel: string
	emoji: string
}

export const MEDIA_TYPE_OPTIONS: readonly MediaTypeOption[] = MEDIA_TYPES.map(value => ({value, ...MEDIA_TYPE_META[value]}))

export function mediaTypeEmoji(mediaType: string): string {
	return (MEDIA_TYPE_META as Record<string, {emoji: string} | undefined>)[mediaType]?.emoji ?? '🗂️'
}

/** Video and audio open in the playback page; everything else in the viewer. */
export function mediaRouteFor(id: string, mediaType: string): string {
	return mediaType === 'video' || mediaType === 'audio' ? `/library/${id}` : `/viewer/${id}`
}
