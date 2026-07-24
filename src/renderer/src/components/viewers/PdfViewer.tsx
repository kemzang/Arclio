import {useState, useEffect, useCallback} from 'react'
import {Document, Page, pdfjs} from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import {ZoomIn, ZoomOut, ChevronLeft, ChevronRight} from 'lucide-react'
import {Button} from '@renderer/components/ui/button.js'

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PdfViewerProps {
	fileUrl: string
	title: string
}

export function PdfViewer({fileUrl, title}: PdfViewerProps): React.JSX.Element {
	const [numPages, setNumPages] = useState<number | null>(null)
	const [pageNumber, setPageNumber] = useState(1)
	const [scale, setScale] = useState(1.2)

	const onDocumentLoadSuccess = useCallback(({numPages: n}: {numPages: number}) => {
		setNumPages(n)
		setPageNumber(1)
	}, [])

	useEffect(() => {
		setPageNumber(1)
		setNumPages(null)
	}, [fileUrl])

	return (
		<div className="flex flex-col h-full">
			<div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
				<div className="flex items-center gap-2">
					<Button variant="ghost" size="sm" disabled={pageNumber <= 1} onClick={() => setPageNumber(p => p - 1)}>
						<ChevronLeft className="size-4" />
					</Button>
					<span className="text-sm">
						{pageNumber} / {numPages ?? '?'}
					</span>
					<Button variant="ghost" size="sm" disabled={!numPages || pageNumber >= numPages} onClick={() => setPageNumber(p => p + 1)}>
						<ChevronRight className="size-4" />
					</Button>
				</div>
				<h2 className="text-sm font-medium truncate max-w-md">{title}</h2>
				<div className="flex items-center gap-2">
					<Button variant="ghost" size="sm" disabled={scale <= 0.5} onClick={() => setScale(s => Math.max(0.5, s - 0.2))}>
						<ZoomOut className="size-4" />
					</Button>
					<span className="text-xs w-12 text-center">{Math.round(scale * 100)}%</span>
					<Button variant="ghost" size="sm" disabled={scale >= 3} onClick={() => setScale(s => Math.min(3, s + 0.2))}>
						<ZoomIn className="size-4" />
					</Button>
				</div>
			</div>
			<div className="flex-1 overflow-auto flex justify-center p-4 bg-[var(--bg-primary)]">
				<Document file={fileUrl} onLoadSuccess={onDocumentLoadSuccess} loading={<div className="text-[var(--text-subtle)]">Loading PDF...</div>} error={<div className="text-red-500">Failed to load PDF</div>}>
					<Page pageNumber={pageNumber} scale={scale} loading="" />
				</Document>
			</div>
		</div>
	)
}
