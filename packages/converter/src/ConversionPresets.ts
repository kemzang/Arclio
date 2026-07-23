import type {ConversionPreset} from './types'

const BUILTIN_PRESETS: ConversionPreset[] = [
	{id: 'web-720p', name: 'Web 720p', format: 'mp4', quality: 'medium', options: {v: 'libx264', s: '1280x720'}},
	{id: 'web-1080p', name: 'Web 1080p', format: 'mp4', quality: 'high', options: {v: 'libx264', s: '1920x1080'}},
	{id: 'audio-mp3', name: 'Audio MP3', format: 'mp3', quality: 'high', options: {b: '320k'}},
	{id: 'gif-low', name: 'GIF Low', format: 'gif', quality: 'low', options: {fps: '10'}}
]

export function getPresets(): ConversionPreset[] {
	return [...BUILTIN_PRESETS]
}

export function getPreset(id: string): ConversionPreset | undefined {
	return BUILTIN_PRESETS.find(p => p.id === id)
}
