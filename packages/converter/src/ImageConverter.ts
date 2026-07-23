import type {ConversionResult} from './types'

export class ImageConverter {
	convert(_input: string, output: string, _format: string): Promise<ConversionResult> {
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

	watermark(_input: string, output: string, _watermarkPath: string, _position: string): Promise<ConversionResult> {
		return Promise.resolve({outputPath: output, size: 0, duration: 0})
	}

	batch(inputs: string[], outputDir: string, format: string): Promise<ConversionResult[]> {
		return Promise.resolve(
			inputs.map(input => ({
				outputPath: `${outputDir}/${input
					.split('/')
					.pop()!
					.replace(/\.\w+$/, `.${format}`)}`,
				size: 0,
				duration: 0
			}))
		)
	}
}
