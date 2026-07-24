import {useState, useEffect, useCallback} from 'react'
import {useNavigate} from 'react-router-dom'
import {useTranslation} from 'react-i18next'
import {Search, Filter, X, Grid3X3, List} from 'lucide-react'
import type {LibraryMediaWithAssets, LibraryMediaListFilters} from '@shared/api.js'
import {Button} from '@renderer/components/ui/button.js'
import {Input} from '@renderer/components/ui/input.js'
import {cn} from '@renderer/lib/utils.js'

const MEDIA_TYPES = [
	{value: 'video', label: 'Video', emoji: '🎬'},
	{value: 'audio', label: 'Audio', emoji: '🎵'},
	{value: 'document', label: 'Document', emoji: '📄'},
	{value: 'comic', label: 'Comic', emoji: '📚'},
	{value: 'image', label: 'Image', emoji: '🖼️'}
] as const

const SORT_OPTIONS = [
	{value: 'download_date', label: 'Date added'},
	{value: 'title', label: 'Title'},
	{value: 'created_at', label: 'Created'},
	{value: 'duration', label: 'Duration'}
] as const

export function SearchPage(): React.JSX.Element {
	const {t} = useTranslation()
	const navigate = useNavigate()
	const [query, setQuery] = useState('')
	const [results, setResults] = useState<LibraryMediaWithAssets[]>([])
	const [loading, setLoading] = useState(false)
	const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
	const [showFilters, setShowFilters] = useState(false)

	const [filters, setFilters] = useState<LibraryMediaListFilters>({mediaType: undefined, sortBy: 'download_date', sortOrder: 'desc', isFavorite: undefined})

	const performSearch = useCallback(async (searchQuery: string, searchFilters: LibraryMediaListFilters) => {
		setLoading(true)
		try {
			const allFilters: LibraryMediaListFilters = {...searchFilters, search: searchQuery || undefined}
			const result = await window.appApi.library.media.list(allFilters)
			setResults(result)
		} catch {
			setResults([])
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		const timeout = setTimeout(() => {
			void performSearch(query, filters)
		}, 300)
		return () => clearTimeout(timeout)
	}, [query, filters, performSearch])

	const handleMediaTypeToggle = (type: string) => {
		setFilters(f => ({...f, mediaType: f.mediaType === type ? undefined : (type as LibraryMediaListFilters['mediaType'])}))
	}

	const clearFilters = () => {
		setFilters({mediaType: undefined, sortBy: 'download_date', sortOrder: 'desc', isFavorite: undefined})
		setQuery('')
	}

	const formatDuration = (seconds: number | null): string => {
		if (!seconds) return ''
		const h = Math.floor(seconds / 3600)
		const m = Math.floor((seconds % 3600) / 60)
		const s = Math.floor(seconds % 60)
		return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m}:${s.toString().padStart(2, '0')}`
	}

	const formatSize = (bytes: number | null): string => {
		if (!bytes) return ''
		const mb = bytes / (1024 * 1024)
		return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(0)} MB`
	}

	const handleItemClick = (item: LibraryMediaWithAssets) => {
		void navigate(item.mediaType === 'video' || item.mediaType === 'audio' ? `/library/${item.id}` : `/viewer/${item.id}`)
	}

	const hasActiveFilters = filters.mediaType || filters.isFavorite !== undefined || query

	return (
		<div className="flex flex-col h-full">
			<div className="px-6 py-4 border-b border-[var(--border)] space-y-4">
				<div className="flex items-center gap-3">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--text-subtle)]" />
						<Input value={query} onChange={e => setQuery(e.target.value)} placeholder={t('search.placeholder', 'Search media, collections, tags...')} className="pl-9" />
						{query && (
							<button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)] hover:text-foreground">
								<X className="size-4" />
							</button>
						)}
					</div>
					<Button variant={showFilters ? 'default' : 'outline'} size="sm" onClick={() => setShowFilters(f => !f)}>
						<Filter className="size-4 mr-1" />
						Filters
					</Button>
					<div className="flex items-center gap-1 border border-[var(--border)] rounded-md p-0.5">
						<Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" className="size-7 p-0" onClick={() => setViewMode('grid')}>
							<Grid3X3 className="size-3.5" />
						</Button>
						<Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" className="size-7 p-0" onClick={() => setViewMode('list')}>
							<List className="size-3.5" />
						</Button>
					</div>
				</div>

				{showFilters && (
					<div className="space-y-3 pt-2 border-t border-[var(--border)]">
						<div className="flex items-center gap-2 flex-wrap">
							<span className="text-xs font-medium text-[var(--text-subtle)]">Type:</span>
							{MEDIA_TYPES.map(type => (
								<Button key={type.value} variant={filters.mediaType === type.value ? 'default' : 'outline'} size="sm" onClick={() => handleMediaTypeToggle(type.value)}>
									{type.emoji} {type.label}
								</Button>
							))}
						</div>
						<div className="flex items-center gap-2">
							<span className="text-xs font-medium text-[var(--text-subtle)]">Sort:</span>
							<select value={filters.sortBy} onChange={e => setFilters(f => ({...f, sortBy: e.target.value as LibraryMediaListFilters['sortBy']}))} className="text-xs px-2 py-1 rounded border border-[var(--border)] bg-transparent">
								{SORT_OPTIONS.map(opt => (
									<option key={opt.value} value={opt.value}>
										{opt.label}
									</option>
								))}
							</select>
							<Button variant="ghost" size="sm" onClick={() => setFilters(f => ({...f, sortOrder: f.sortOrder === 'asc' ? 'desc' : 'asc'}))}>
								{filters.sortOrder === 'asc' ? '↑' : '↓'}
							</Button>
							<Button variant={filters.isFavorite ? 'default' : 'outline'} size="sm" onClick={() => setFilters(f => ({...f, isFavorite: f.isFavorite ? undefined : true}))}>
								♥ Favorites
							</Button>
						</div>
						{hasActiveFilters && (
							<Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
								<X className="size-3 mr-1" />
								Clear all filters
							</Button>
						)}
					</div>
				)}

				{loading && (
					<div className="flex items-center justify-center py-4">
						<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
					</div>
				)}
			</div>

			<div className="flex-1 overflow-y-auto p-6">
				{results.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-20 text-[var(--text-subtle)]">
						<Search className="size-12 mb-4 opacity-50" />
						<p className="text-lg font-medium">{query ? 'No results found' : 'Start typing to search'}</p>
						<p className="text-sm">{query ? 'Try different keywords or adjust filters' : 'Search across your entire library'}</p>
					</div>
				) : (
					<>
						<p className="text-xs text-[var(--text-subtle)] mb-4">
							{results.length} result{results.length !== 1 ? 's' : ''}
						</p>
						{viewMode === 'grid' ? (
							<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
								{results.map(item => (
									<div
										key={item.id}
										role="button"
										tabIndex={0}
										onClick={() => handleItemClick(item)}
										onKeyDown={e => {
											if (e.key === 'Enter') handleItemClick(item)
										}}
										className="group relative rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--glass-tile)] hover:shadow-lg transition-shadow cursor-pointer"
									>
										<div className="aspect-video bg-muted relative">
											{item.thumbnailPath ? (
												<img src={`file://${item.thumbnailPath}`} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
											) : (
												<div className="w-full h-full flex items-center justify-center text-[var(--text-subtle)] text-2xl">{MEDIA_TYPES.find(t => t.value === item.mediaType)?.emoji ?? '📁'}</div>
											)}
											{item.duration && <span className="absolute bottom-1 right-1 text-xs bg-black/70 text-white px-1.5 py-0.5 rounded">{formatDuration(item.duration)}</span>}
										</div>
										<div className="p-3">
											<p className="text-sm font-medium line-clamp-2">{item.title}</p>
											<p className="text-xs text-[var(--text-subtle)] mt-1">{item.author}</p>
											<div className="flex items-center justify-between mt-2">
												<span className="text-xs text-[var(--text-subtle)]">{item.mediaType}</span>
												{item.totalSize && <span className="text-xs text-[var(--text-subtle)]">{formatSize(item.totalSize)}</span>}
											</div>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="space-y-1">
								{results.map(item => (
									<div
										key={item.id}
										role="button"
										tabIndex={0}
										onClick={() => handleItemClick(item)}
										onKeyDown={e => {
											if (e.key === 'Enter') handleItemClick(item)
										}}
										className="flex items-center gap-4 p-3 rounded-lg hover:bg-[var(--glass-tile)] cursor-pointer transition-colors"
									>
										<div className="w-24 aspect-video rounded-lg overflow-hidden bg-muted shrink-0">
											{item.thumbnailPath ? (
												<img src={`file://${item.thumbnailPath}`} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
											) : (
												<div className="w-full h-full flex items-center justify-center text-[var(--text-subtle)] text-xl">{MEDIA_TYPES.find(t => t.value === item.mediaType)?.emoji ?? '📁'}</div>
											)}
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-sm font-medium truncate">{item.title}</p>
											<p className="text-xs text-[var(--text-subtle)]">{item.author}</p>
										</div>
										<span className="text-xs text-[var(--text-subtle)] shrink-0">{formatDuration(item.duration)}</span>
										<span className="text-xs text-[var(--text-subtle)] shrink-0">{formatSize(item.totalSize)}</span>
										<span className="text-xs text-[var(--text-subtle)] shrink-0 w-16">{item.mediaType}</span>
									</div>
								))}
							</div>
						)}
					</>
				)}
			</div>
		</div>
	)
}
