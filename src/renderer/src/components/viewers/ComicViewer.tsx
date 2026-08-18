import {useState, useEffect, useCallback, useRef} from 'react'
import {ChevronLeft, ChevronRight, Maximize2} from 'lucide-react'
import {Button} from '@renderer/components/ui/button.js'

interface ComicViewerProps {
	filePath: string
	title: string
}

type ReadingDirection = 'ltr' | 'rtl' | 'vertical'

/** Pages kept as blob URLs around the current position; older ones are revoked. */
const PAGE_CACHE_LIMIT = 12

export function ComicViewer({filePath, title}: ComicViewerProps): React.JSX.Element {
	const [pageNames, setPageNames] = useState<string[]>([])
	const [currentPage, setCurrentPage] = useState(0)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [readingMode, setReadingMode] = useState<ReadingDirection>('rtl')
	const [pageUrls, setPageUrls] = useState<Record<string, string>>({})
	const containerRef = useRef<HTMLDivElement>(null)
	const urlCacheRef = useRef<Map<string, string>>(new Map())

	// Load the archive's page list. Bytes are fetched lazily per page below.
	// The component is mounted with `key={filePath}`, so a different comic gets a
	// fresh instance and this effect never has to reset state for a new file.
	useEffect(() => {
		let cancelled = false

		window.appApi.archive
			.listPages(filePath)
			.then(result => {
				if (cancelled) return
				if (result.error) {
					setError(result.error)
				} else if (result.pages.length === 0) {
					setError('No images found in comic file')
				} else {
					setPageNames(result.pages)
				}
			})
			.catch((e: unknown) => {
				if (!cancelled) setError(e instanceof Error ? e.message : String(e))
			})
			.finally(() => {
				if (!cancelled) setLoading(false)
			})

		return () => {
			cancelled = true
		}
	}, [filePath])

	// Release the main-process archive handle and every blob URL on unmount.
	useEffect(() => {
		const cache = urlCacheRef.current
		return () => {
			for (const url of cache.values()) URL.revokeObjectURL(url)
			cache.clear()
			void window.appApi.archive.close()
		}
	}, [])

	// Fetch the current page plus its immediate neighbours so paging feels instant.
	useEffect(() => {
		if (pageNames.length === 0) return
		let cancelled = false

		const wanted = [currentPage, currentPage + 1, currentPage - 1].filter(index => index >= 0 && index < pageNames.length).map(index => pageNames[index])

		void (async () => {
			for (const name of wanted) {
				if (cancelled) return
				if (urlCacheRef.current.has(name)) continue

				const page = await window.appApi.archive.readPage(filePath, name)
				if (cancelled) return
				if (!page.ok) {
					if (name === pageNames[currentPage]) setError(page.error)
					continue
				}

				const url = URL.createObjectURL(new Blob([page.data], {type: page.mimeType}))
				urlCacheRef.current.set(name, url)
				setPageUrls(previous => ({...previous, [name]: url}))
			}

			// Trim the cache, keeping the pages nearest the current position.
			if (urlCacheRef.current.size > PAGE_CACHE_LIMIT) {
				const keep = new Set(pageNames.slice(Math.max(0, currentPage - PAGE_CACHE_LIMIT / 2), currentPage + PAGE_CACHE_LIMIT / 2))
				for (const [name, url] of urlCacheRef.current) {
					if (keep.has(name)) continue
					URL.revokeObjectURL(url)
					urlCacheRef.current.delete(name)
					setPageUrls(previous => {
						const next = {...previous}
						delete next[name]
						return next
					})
				}
			}
		})()

		return () => {
			cancelled = true
		}
	}, [currentPage, filePath, pageNames])

	const goToPage = useCallback(
		(page: number) => {
			setCurrentPage(Math.max(0, Math.min(pageNames.length - 1, page)))
		},
		[pageNames.length]
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

	if (loading) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
			</div>
		)
	}

	if (error || pageNames.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center h-full gap-4 text-[var(--text-subtle)]">
				<p className="text-lg font-medium">{error ?? 'No pages found'}</p>
			</div>
		)
	}

	const currentName = pageNames[currentPage]
	const currentUrl = pageUrls[currentName]

	return (
		<div className="flex flex-col h-full" ref={containerRef}>
			<div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
				<div className="flex items-center gap-2">
					<Button variant="ghost" size="sm" disabled={currentPage <= 0} onClick={() => goToPage(currentPage - 1)}>
						<ChevronLeft className="size-4" />
					</Button>
					<span className="text-sm">
						{currentPage + 1} / {pageNames.length}
					</span>
					<Button variant="ghost" size="sm" disabled={currentPage >= pageNames.length - 1} onClick={() => goToPage(currentPage + 1)}>
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
			<div className="flex-1 overflow-auto flex items-center justify-center bg-black">{currentUrl ? <img src={currentUrl} alt={`Page ${currentPage + 1}`} className="max-h-full max-w-full object-contain" /> : <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />}</div>
		</div>
	)
}
