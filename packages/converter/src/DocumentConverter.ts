import type {ConversionResult} from './types'

export class DocumentConverter {
	pdfToImages(_input: string, _outputDir: string, _format: 'png' | 'jpeg'): Promise<string[]> {
		return Promise.resolve([])
	}

	imagesToPdf(_images: string[], output: string): Promise<ConversionResult> {
		return Promise.resolve({outputPath: output, size: 0, duration: 0})
	}

	epubToPdf(_input: string, output: string): Promise<ConversionResult> {
		return Promise.resolve({outputPath: output, size: 0, duration: 0})
	}

	cbzToPdf(_input: string, output: string): Promise<ConversionResult> {
		return Promise.resolve({outputPath: output, size: 0, duration: 0})
	}

	ocr(_input: string, output: string, _lang: string): Promise<ConversionResult> {
		return Promise.resolve({outputPath: output, size: 0, duration: 0})
	}
}
