export class PdfViewer {
	open(_filePath: string): Promise<void> {
		// Stub — would use react-pdf
		return Promise.resolve()
	}

	getPageCount(_filePath: string): Promise<number> {
		// Stub
		return Promise.resolve(0)
	}

	getPage(_filePath: string, _pageNum: number): Promise<string> {
		// Stub — returns rendered page image
		return Promise.resolve('')
	}
}
