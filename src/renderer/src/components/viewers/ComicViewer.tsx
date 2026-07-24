import {useState, useEffect, useCallback, useRef} from 'react'
import {ChevronLeft, ChevronRight, Maximize2} from 'lucide-react'
import {Button} from '@renderer/components/ui/button.js'
import * as Yauzl from 'yauzl'

interface ComicViewerProps {
	fileUrl: string
	title: string
}

interface ComicPage {
	index: number
	url: string
}

export function ComicViewer({fileUrl, title}: ComicViewer): React.JSX.Element {
	const [pages, setPages] = useState<ComicPage[]>([])
	const [currentPage, setCurrentPage] = useState(0)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [readingMode, setReadingMode] = useState<'ltr' | 'rtl' | 'vertical'>('rtl')
	const containerRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		let cancelled = false
		setLoading(true)
		setPages([])
		setCurrentPage(0)

		// Convert file:// URL to path
		const filePath = fileUrl.replace('file://', '')

		Yauzl.open(filePath, {lazyEntries: false}, (err, zipfile) => {
			if (err) {
				if (!cancelled) {
					setError(err.message)
					setLoading(false)
				}
				return
			}
			if (!zipfile) {
				if (!cancelled) {
					setError('Failed to open comic file')
					setLoading(false)
				}
				return
			}

			const imageEntries: {fileName: string; index: number}[] = []
			let idx = 0

			zipfile.on('entry', entry => {
				if (entry.fileName.endsWith('/')) {
					zipfile.readEntry()
					return
				}

				if (/\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(entry.fileName)) {
					imageEntries.push({fileName: entry.fileName, index: idx++})
				}
				zipfile.readEntry()
			})

			zipfile.on('end', () => {
				if (cancelled) return

				// Sort entries by filename for correct page order
				imageEntries.sort((a, b) => a.fileName.localeCompare(b.fileName, undefined, {numeric: true}))

				const loadedPages: ComicPage[] = []
				let loaded = 0

				for (const entry of imageEntries) {
					zipfile.openReadStream(entry.fileName, (openErr, readStream) => {
						if (openErr || !readStream) {
							loaded++
							if (loaded === imageEntries.length) {
								if (!cancelled) {
									setPages(loadedPages)
									setLoading(false)
								}
								zipfile.close()
							}
							return
						}

						const chunks: Buffer[] = []
						readStream.on('data', (chunk: Buffer) => chunks.push(chunk))
						readStream.on('end', () => {
							const blob = new Blob([Buffer.concat(chunks)])
							const url = URL.createObjectURL(blob)
							loadedPages.push({index: entry.index, url})
							loaded++

							if (loaded === imageEntries.length) {
								if (!cancelled) {
									setPages(loadedPages)
									setLoading(false)
								}
								zipfile.close()
							}
						})
					})
				}

				if (imageEntries.length === 0) {
					if (!cancelled) {
						setError('No images found in comic file')
						setLoading(false)
					}
					zipfile.close()
				}
			})

			zipfile.on('error', e => {
				if (!cancelled) {
					setError(e.message)
					setLoading(false)
				}
			})

			zipfile.readEntry()
		})

		return () => {
			cancelled = true
		}
	}, [fileUrl])

	const goToPage = useCallback(
		(page: number) => {
			setCurrentPage(p => Math.max(0, Math.min(pages.length - 1, page)))
		},
		[pages.length]
	)

	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (readingMode === 'rtl') {
				if (e.key === 'ArrowLeft') goToPage(currentPage + 1)
				if (e.key === 'ArrowRight') goToPage(currentPage - 1)
			} else {
				if (e.key === 'ArrowRight') goToPage(currentPage + 1)
				if (e.key === 'ArrowLeft') goToPage(currentPage - 1)
			}
		},
		[currentPage, goToPage, readingMode]
	)

	useEffect(() => {
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [handleKeyDown])

	// Cleanup blob URLs
	useEffect(() => {
		return () => {
			for (const page of pages) {
				URL.revokeObjectURL(page.url)
			}
		}
	}, [pages])

	if (loading) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
			</div>
		)
	}

	if (error || pages.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center h-full gap-4 text-[var(--text-subtle)]">
				<p className="text-lg font-medium">{error ?? 'No pages found'}</p>
			</div>
		)
	}

	const currentPageData = pages[currentPage]

	return (
		<div className="flex flex-col h-full" ref={containerRef}>
			<div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
				<div className="flex items-center gap-2">
					<Button variant="ghost" size="sm" disabled={currentPage <= 0} onClick={() => goToPage(currentPage - 1)}>
						<ChevronLeft className="size-4" />
					</Button>
					<span className="text-sm">
						{currentPage + 1} / {pages.length}
					</span>
					<Button variant="ghost" size="sm" disabled={currentPage >= pages.length - 1} onClick={() => goToPage(currentPage + 1)}>
						<ChevronRight className="size-4" />
					</Button>
				</div>
				<h2 className="text-sm font-medium truncate max-w-md">{title}</h2>
				<div className="flex items-center gap-2">
					<Button variant="ghost" size="sm" onClick={() => setReadingMode(m => (m === 'rtl' ? 'ltr' : m === 'ltr' ? 'vertical' : 'rtl'))}>
						{readingMode === 'rtl' ? 'RTL' : readingMode === 'ltr' ? 'LTR' : 'V'}
					</Button>
					<Button variant="ghost" size="sm">
						<Maximize2 className="size-4" />
					</Button>
				</div>
			</div>
			<div className="flex-1 overflow-auto flex items-center justify-center bg-black">
				<img src={currentPageData.url} alt={`Page ${currentPage + 1}`} className="max-h-full max-w-full object-contain" />
			</div>
		</div>
	)
}
