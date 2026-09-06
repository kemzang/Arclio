// Pure option-list builders and small formatting helpers for
// DownloadProfileEditor. Extracted out of the component file so the dense
// profile form itself stays under the repo's LOC cap. Each builder takes `t`
// as a parameter (rather than calling the hook directly) because these live
// outside the component; each is rebuilt once per render from the component
// body, which is negligible for lists this small.
import type {TFunction} from 'i18next'
import {Archive, BookOpen, Captions, Clapperboard, Download, FileAudio, Film, Headphones, Music, Scissors, SlidersHorizontal, type LucideIcon} from 'lucide-react'
import type {CommonSettings, DownloadProfileAudioFormat, DownloadProfileIcon, DownloadProfileSubtitleSource, PlaylistVideoCodec, PlaylistVideoTier, SponsorBlockMode, SubtitleFormat, SubtitleMode} from '@shared/types.js'
import {formatHomeRelativePath} from '@renderer/lib/utils.js'
import type {DownloadProfileAudioQuality, DownloadProfileMediaMode} from '../../store/wizard/downloadProfileDraft.js'

export interface SelectOption<T extends string> {
	value: T
	label: string
}

export function createProfileId(): string {
	if (typeof crypto !== 'undefined') {
		if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
		if (typeof crypto.getRandomValues === 'function') {
			const bytes = crypto.getRandomValues(new Uint8Array(16))
			bytes[6] = (bytes[6] & 0x0f) | 0x40
			bytes[8] = (bytes[8] & 0x3f) | 0x80
			const hex = [...bytes].map(byte => byte.toString(16).padStart(2, '0'))
			return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`
		}
	}
	return `profile-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function mediaModes(t: TFunction): {value: DownloadProfileMediaMode; label: string; description: string; icon: LucideIcon}[] {
	return [
		{value: 'video-audio', label: t('wizard.profileEditor.mediaMode.videoAudio.label'), description: t('wizard.profileEditor.mediaMode.videoAudio.description'), icon: Film},
		{value: 'video-only', label: t('wizard.profileEditor.mediaMode.videoOnly.label'), description: t('wizard.profileEditor.mediaMode.videoOnly.description'), icon: Scissors},
		{value: 'audio-only', label: t('wizard.profileEditor.mediaMode.audioOnly.label'), description: t('wizard.profileEditor.mediaMode.audioOnly.description'), icon: FileAudio},
		{value: 'subtitles-only', label: t('wizard.profileEditor.mediaMode.subtitlesOnly.label'), description: t('wizard.profileEditor.mediaMode.subtitlesOnly.description'), icon: Captions}
	]
}

export function profileIconMeta(t: TFunction): Record<DownloadProfileIcon, {label: string; icon: LucideIcon}> {
	return {
		controls: {label: t('wizard.profileEditor.icon.controls'), icon: SlidersHorizontal},
		download: {label: t('wizard.profileEditor.icon.download'), icon: Download},
		video: {label: t('wizard.profileEditor.icon.video'), icon: Clapperboard},
		captions: {label: t('wizard.profileEditor.icon.captions'), icon: Captions},
		audio: {label: t('wizard.profileEditor.icon.audio'), icon: FileAudio},
		music: {label: t('wizard.profileEditor.icon.music'), icon: Music},
		podcast: {label: t('wizard.profileEditor.icon.podcast'), icon: Headphones},
		classes: {label: t('wizard.profileEditor.icon.classes'), icon: BookOpen},
		clip: {label: t('wizard.profileEditor.icon.clip'), icon: Scissors},
		archive: {label: t('wizard.profileEditor.icon.archive'), icon: Archive}
	}
}

export function videoCompatibilityOptions(t: TFunction): SelectOption<PlaylistVideoCodec>[] {
	return [
		{value: 'best', label: t('wizard.profileEditor.video.compat.best')},
		{value: 'mp4', label: t('wizard.profileEditor.video.compat.mp4')}
	]
}

export function resolutionOptions(t: TFunction): SelectOption<PlaylistVideoTier>[] {
	return [
		{value: 'best', label: t('wizard.profileEditor.resolution.best')},
		{value: '2160', label: t('wizard.profileEditor.resolution.2160')},
		{value: '1440', label: t('wizard.profileEditor.resolution.1440')},
		{value: '1080', label: t('wizard.profileEditor.resolution.1080')},
		{value: '720', label: t('wizard.profileEditor.resolution.720')},
		{value: '480', label: t('wizard.profileEditor.resolution.480')},
		{value: '360', label: t('wizard.profileEditor.resolution.360')}
	]
}

export const SMART_TV_MP4_BLOCKED_RESOLUTIONS = new Set<PlaylistVideoTier>(['best', '2160', '1440'])

export function audioFormatOptions(t: TFunction): SelectOption<DownloadProfileAudioFormat>[] {
	return [
		{value: 'best', label: t('wizard.profileEditor.audioFormat.best')},
		{value: 'mp3', label: t('wizard.profileEditor.audioFormat.mp3')},
		{value: 'm4a', label: t('wizard.profileEditor.audioFormat.m4a')},
		{value: 'opus', label: t('wizard.profileEditor.audioFormat.opus')},
		{value: 'wav', label: t('wizard.profileEditor.audioFormat.wav')}
	]
}

export function videoAudioFormatOptions(t: TFunction): SelectOption<Extract<DownloadProfileAudioFormat, 'best' | 'm4a'>>[] {
	return [
		{value: 'best', label: t('wizard.profileEditor.videoAudioFormat.best')},
		{value: 'm4a', label: t('wizard.profileEditor.videoAudioFormat.m4a')}
	]
}

export function audioQualityOptions(t: TFunction): SelectOption<DownloadProfileAudioQuality>[] {
	return [
		{value: 'best', label: t('wizard.profileEditor.audioQuality.best')},
		{value: '320', label: t('wizard.profileEditor.audioQuality.320')},
		{value: '192', label: t('wizard.profileEditor.audioQuality.192')},
		{value: '128', label: t('wizard.profileEditor.audioQuality.128')}
	]
}

export function subtitleDeliveryOptions(t: TFunction): {value: SubtitleMode; label: string}[] {
	return [
		{value: 'sidecar', label: t('wizard.profileEditor.subtitleDelivery.sidecar')},
		{value: 'embed', label: t('wizard.profileEditor.subtitleDelivery.embed')},
		{value: 'subfolder', label: t('wizard.profileEditor.subtitleDelivery.subfolder')}
	]
}

export function subtitleFormatOptions(t: TFunction): {value: SubtitleFormat; label: string}[] {
	return [
		{value: 'srt', label: t('wizard.profileEditor.subtitleFormat.srt')},
		{value: 'vtt', label: t('wizard.profileEditor.subtitleFormat.vtt')},
		{value: 'ass', label: t('wizard.profileEditor.subtitleFormat.ass')}
	]
}

export function subtitleSourceOptions(t: TFunction): SelectOption<DownloadProfileSubtitleSource>[] {
	return [
		{value: 'manual-first', label: t('wizard.profileEditor.subtitleSource.manualFirst')},
		{value: 'manual-only', label: t('wizard.profileEditor.subtitleSource.manualOnly')},
		{value: 'auto-only', label: t('wizard.profileEditor.subtitleSource.autoOnly')}
	]
}

export function outputOptionDescriptions(t: TFunction): {chapters: string; metadata: string; description: string; thumbnail: string} {
	return {chapters: t('wizard.output.embedChapters.description'), metadata: t('wizard.output.embedMetadata.description'), description: t('wizard.output.writeDescription.description'), thumbnail: t('wizard.output.writeThumbnail.description')}
}

export function sponsorBlockOptions(t: TFunction): {value: SponsorBlockMode; label: string}[] {
	return [
		{value: 'off', label: t('wizard.profileEditor.sponsorBlock.mode.off')},
		{value: 'mark', label: t('wizard.profileEditor.sponsorBlock.mode.mark')},
		{value: 'remove', label: t('wizard.profileEditor.sponsorBlock.mode.remove')}
	]
}

export function sponsorBlockHints(t: TFunction): Record<SponsorBlockMode, string> {
	return {off: t('wizard.sponsorblock.modeHint.off'), mark: t('wizard.sponsorblock.modeHint.mark'), remove: t('wizard.sponsorblock.modeHint.remove')}
}

export const SELECTABLE_TOGGLE_CLASS = 'flex-1 data-[state=on]:border-[var(--brand)] data-[state=on]:bg-[var(--brand-dim)] data-[state=on]:text-[var(--brand)] aria-pressed:border-[var(--brand)] aria-pressed:bg-[var(--brand-dim)] aria-pressed:text-[var(--brand)]'
export const OUTPUT_MODE_CARD_CLASS =
	'h-auto min-h-[4.35rem] flex-col gap-1.5 whitespace-normal rounded-lg border border-[var(--border-strong)] px-2 py-2.5 text-center data-[state=on]:border-[var(--brand)] data-[state=on]:bg-[var(--brand-dim)] data-[state=on]:text-[var(--brand)] aria-pressed:border-[var(--brand)] aria-pressed:bg-[var(--brand-dim)] aria-pressed:text-[var(--brand)]'

export function optionLabel<T extends string>(options: readonly SelectOption<T>[], value: unknown): string {
	const selected = options.find(option => option.value === value)
	if (selected) return selected.label
	return typeof value === 'string' ? value : ''
}

export function readablePath(path: string, commonPaths: CommonSettings['commonPaths'], t: TFunction): string {
	const trimmed = path.trim()
	if (!trimmed) return t('wizard.profileEditor.defaultDownloadsFolder')
	return commonPaths ? formatHomeRelativePath(trimmed, commonPaths) : trimmed
}

export function fallbackFinalPath(subfolderName: string, t: TFunction): string {
	const trimmed = subfolderName.trim()
	const base = t('wizard.profileEditor.defaultDownloadsFolder')
	return trimmed ? `${base} / ${trimmed}` : base
}
