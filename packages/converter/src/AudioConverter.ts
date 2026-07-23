import type {ConversionOptions, ConversionResult} from './types'

export class AudioConverter {
	extract(_input: string, output: string, _options: ConversionOptions): Promise<ConversionResult> {
		return Promise.resolve({outputPath: output, size: 0, duration: 0})
	}

	transcode(_input: string, output: string, _options: ConversionOptions): Promise<ConversionResult> {
		return Promise.resolve({outputPath: output, size: 0, duration: 0})
	}

	normalize(_input: string, output: string): Promise<ConversionResult> {
		return Promise.resolve({outputPath: output, size: 0, duration: 0})
	}

	noiseReduction(_input: string, output: string): Promise<ConversionResult> {
		return Promise.resolve({outputPath: output, size: 0, duration: 0})
	}

	volumeBoost(_input: string, output: string, _gain: number): Promise<ConversionResult> {
		return Promise.resolve({outputPath: output, size: 0, duration: 0})
	}

	trim(_input: string, output: string, _start: number, _end: number): Promise<ConversionResult> {
		return Promise.resolve({outputPath: output, size: 0, duration: 0})
	}

	merge(_inputs: string[], output: string): Promise<ConversionResult> {
		return Promise.resolve({outputPath: output, size: 0, duration: 0})
	}
}
