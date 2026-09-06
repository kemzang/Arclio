import {describe, expect, it} from 'vitest'
import {syncSubtitleTracks} from '@renderer/pages/player/subtitleTracks.js'

describe('syncSubtitleTracks', () => {
	it('regression: clears existing <track> elements even when the new media has no subtitles', () => {
		// Previously the purge only ran when the *new* media had subtitles, so
		// navigating from a subtitled video to one without any left the old
		// <track> elements attached — still pointing at the previous file's
		// subtitle paths.
		const video = document.createElement('video')
		const stale = document.createElement('track')
		stale.src = 'file:///old/movie.en.vtt'
		video.appendChild(stale)

		syncSubtitleTracks(video, [])

		expect(video.querySelectorAll('track')).toHaveLength(0)
	})

	it('replaces existing tracks with one per subtitle asset', () => {
		const video = document.createElement('video')
		const stale = document.createElement('track')
		stale.src = 'file:///old/movie.en.vtt'
		video.appendChild(stale)

		syncSubtitleTracks(video, [
			{path: '/new/movie.fr.vtt', fileName: 'movie.fr.vtt'},
			{path: '/new/movie.en.srt', fileName: 'movie.en.srt'}
		])

		const tracks = [...video.querySelectorAll('track')]
		expect(tracks).toHaveLength(2)
		expect(tracks.map(track => track.src)).toEqual(['file:///new/movie.fr.vtt', 'file:///new/movie.en.srt'])
		expect(tracks.map(track => track.srclang)).toEqual(['fr', 'en'])
		expect(tracks.every(track => track.kind === 'subtitles')).toBe(true)
	})

	it('does nothing destructive when there was nothing to clear and nothing to add', () => {
		const video = document.createElement('video')
		syncSubtitleTracks(video, [])
		expect(video.querySelectorAll('track')).toHaveLength(0)
	})
})
