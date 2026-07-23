import type {ConversionOptions, ConversionResult} from './types'

export class VideoConverter {
	transcode(_input: string, output: string, _options: ConversionOptions): Promise<ConversionResult> {
		return Promise.resolve({outputPath: output, size: 0, duration: 0})
	}

	resize(_input: string, output: string, _width: number, _height: number): Promise<ConversionResult> {
		return Promise.resolve({outputPath: output, size: 0, duration: 0})
	}

	crop(_input: string, output: string, _x: number, _y: number, _w: number, _h: number): Promise<ConversionResult> {
		return Promise.resolve({outputPath: output, size: 0, duration: 0})
	}

	rotate(_input: string, output: string, _degrees: number): Promise<ConversionResult> {
		return Promise.resolve({outputPath: output, size: 0, duration: 0})
	}

	trim(_input: string, output: string, _start: number, _end: number): Promise<ConversionResult> {
		return Promise.resolve({outputPath: output, size: 0, duration: 0})
	}

	merge(_inputs: string[], output: string): Promise<ConversionResult> {
		return Promise.resolve({outputPath: output, size: 0, duration: 0})
	}

	split(_input: string, _outputDir: string, _segmentDuration: number): Promise<string[]> {
		return Promise.resolve([])
	}

	watermark(_input: string, output: string, _watermarkPath: string, _position: string): Promise<ConversionResult> {
		return Promise.resolve({outputPath: output, size: 0, duration: 0})
	}

	toGif(_input: string, output: string, _fps = 10): Promise<ConversionResult> {
		return Promise.resolve({outputPath: output, size: 0, duration: 0})
	}
}
