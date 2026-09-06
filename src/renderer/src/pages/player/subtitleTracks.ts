export function extractLangFromFileName(fileName: string): string {
	const match = /\.([a-z]{2,3})(?:[-_][A-Z]{2})?\.vtt$|\.([a-z]{2,3})(?:[-_][A-Z]{2})?\.srt$/.exec(fileName)
	return match?.[1] ?? match?.[2] ?? 'en'
}

/**
 * Replaces every `<track>` on `video` with one per subtitle asset.
 *
 * The purge always runs, even when `subtitleAssets` is empty: without it,
 * navigating from a subtitled video to one with no subtitles left the
 * previous file's `<track>` elements attached, still pointing at its
 * subtitle paths.
 */
export function syncSubtitleTracks(video: HTMLVideoElement, subtitleAssets: {path: string; fileName: string}[]): void {
	while (video.firstChild) {
		video.removeChild(video.firstChild)
	}
	for (const asset of subtitleAssets) {
		const track = document.createElement('track')
		track.kind = 'subtitles'
		track.src = `file://${asset.path}`
		track.label = asset.fileName
		track.srclang = extractLangFromFileName(asset.fileName)
		video.appendChild(track)
	}
}
