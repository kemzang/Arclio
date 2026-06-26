import {useState, useEffect, useRef, useCallback} from 'react'
import {useNavigate} from 'react-router-dom'
import {useTranslation} from 'react-i18next'
import {Search, Library, FolderHeart, Tag as TagIcon, X} from 'lucide-react'
import {Input} from '@renderer/components/ui/input.js'
import type {LibraryMedia, LibraryCollectionWithCount, LibraryTagWithCount} from '@shared/api.js'

interface SearchResult {
	type: 'media' | 'collection' | 'tag'
	id: string
	title: string
	subtitle: string
}

export function GlobalSearch(): React.JSX.Element {
	const {t} = useTranslation()
	const [query, setQuery] = useState('')
	const [results, setResults] = useState<SearchResult[]>([])
	const [isOpen, setIsOpen] = useState(false)
	const [selectedIndex, setSelectedIndex] = useState(-1)
	const navigate = useNavigate()
	const containerRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!query.trim()) {
			queueMicrotask(() => setResults([]))
			return
		}
		const timer = setTimeout((): void => {
			void (async (): Promise<void> => {
				const [media, collections, tags] = await Promise.all([window.appApi.library.media.search(query, 5), window.appApi.library.collection.list(), window.appApi.library.tag.list()])

				const mediaResults: SearchResult[] = media.map((m: LibraryMedia) => ({type: 'media' as const, id: m.id, title: m.title, subtitle: m.author ?? ''}))

				const collectionResults: SearchResult[] = collections
					.filter((c: LibraryCollectionWithCount) => c.name.toLowerCase().includes(query.toLowerCase()))
					.slice(0, 3)
					.map((c: LibraryCollectionWithCount) => ({type: 'collection' as const, id: c.id, title: c.name, subtitle: `${c.mediaCount} ${t('search.items')}`}))

				const tagResults: SearchResult[] = tags
					.filter((t: LibraryTagWithCount) => t.name.toLowerCase().includes(query.toLowerCase()))
					.slice(0, 3)
					.map((tag: LibraryTagWithCount) => ({type: 'tag' as const, id: tag.id, title: tag.name, subtitle: `${tag.mediaCount} ${t('search.items')}`}))

				setResults([...mediaResults, ...collectionResults, ...tagResults])
				setSelectedIndex(-1)
			})()
		}, 200)
		return () => clearTimeout(timer)
	}, [query, t])

	const handleSelect = useCallback(
		(result: SearchResult): void => {
			setIsOpen(false)
			setQuery('')
			if (result.type === 'media') void navigate(`/library/${result.id}`)
			else if (result.type === 'collection') void navigate(`/collections/${result.id}`)
			else if (result.type === 'tag') void navigate('/tags')
		},
		[navigate]
	)

	useEffect(() => {
		const handleClick = (e: MouseEvent): void => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setIsOpen(false)
			}
		}
		document.addEventListener('mousedown', handleClick)
		return () => document.removeEventListener('mousedown', handleClick)
	}, [])

	const handleKeyDown = (e: React.KeyboardEvent): void => {
		if (e.key === 'Escape') {
			setIsOpen(false)
			return
		}
		if (e.key === 'ArrowDown') {
			e.preventDefault()
			setSelectedIndex(i => Math.min(i + 1, results.length - 1))
		}
		if (e.key === 'ArrowUp') {
			e.preventDefault()
			setSelectedIndex(i => Math.max(i - 1, -1))
		}
		if (e.key === 'Enter' && selectedIndex >= 0) {
			handleSelect(results[selectedIndex])
		}
	}

	const iconForType = (type: string): React.JSX.Element => {
		if (type === 'media') return <Library className="size-4" />
		if (type === 'collection') return <FolderHeart className="size-4" />
		return <TagIcon className="size-4" />
	}

	return (
		<div ref={containerRef} className="relative">
			<div className="relative">
				<Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-[var(--text-subtle)]" />
				<Input
					placeholder={t('search.placeholder')}
					value={query}
					onChange={e => {
						setQuery(e.target.value)
						setIsOpen(true)
					}}
					onFocus={() => setIsOpen(true)}
					onKeyDown={handleKeyDown}
					className="h-8 pl-8 pr-8 text-sm"
				/>
				{query && (
					<button
						onClick={() => {
							setQuery('')
							setResults([])
						}}
						className="absolute right-2 top-1/2 -translate-y-1/2"
					>
						<X className="size-4 text-[var(--text-subtle)]" />
					</button>
				)}
			</div>

			{isOpen && results.length > 0 && (
				<div className="absolute top-full left-0 right-0 mt-1 bg-[var(--glass-panel)] border border-[var(--border)] rounded-lg shadow-lg max-h-80 overflow-y-auto z-50">
					{results.map((result, i) => (
						<button key={`${result.type}-${result.id}`} onClick={() => handleSelect(result)} className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm hover:bg-[var(--glass-tile)] transition-colors ${i === selectedIndex ? 'bg-[var(--glass-tile)]' : ''}`}>
							{iconForType(result.type)}
							<div className="flex-1 min-w-0">
								<p className="truncate font-medium">{result.title}</p>
								{result.subtitle && <p className="truncate text-xs text-[var(--text-subtle)]">{result.subtitle}</p>}
							</div>
							<span className="text-xs text-[var(--text-subtle)] capitalize">{t(`search.${result.type}`)}</span>
						</button>
					))}
				</div>
			)}

			{isOpen && query && results.length === 0 && <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--glass-panel)] border border-[var(--border)] rounded-lg shadow-lg p-4 text-center text-sm text-[var(--text-subtle)] z-50">{t('search.noResults')}</div>}
		</div>
	)
}
