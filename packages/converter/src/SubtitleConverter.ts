import type {ConversionResult} from './types'

export class SubtitleConverter {
	extract(_input: string, output: string, _lang: string): Promise<ConversionResult> {
		return Promise.resolve({outputPath: output, size: 0, duration: 0})
	}

	convert(_input: string, output: string, _format: 'srt' | 'vtt' | 'ass'): Promise<ConversionResult> {
		return Promise.resolve({outputPath: output, size: 0, duration: 0})
	}

	embed(_videoPath: string, _subtitlePath: string, output: string): Promise<ConversionResult> {
		return Promise.resolve({outputPath: output, size: 0, duration: 0})
	}

	adjustTiming(_input: string, output: string, _offsetMs: number): Promise<ConversionResult> {
		return Promise.resolve({outputPath: output, size: 0, duration: 0})
	}
}
