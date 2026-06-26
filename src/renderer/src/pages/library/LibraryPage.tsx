import {useState, useEffect} from 'react'
import {useTranslation} from 'react-i18next'
import {Search, Grid3X3, List, Heart, Library} from 'lucide-react'
import {cn} from '@renderer/lib/utils.js'
import type {LibraryMediaWithAssets, LibraryMediaListFilters} from '@shared/api.js'
import {Button} from '@renderer/components/ui/button.js'
import {Input} from '@renderer/components/ui/input.js'

export function LibraryPage(): React.JSX.Element {
	const {t} = useTranslation()
	const [media, setMedia] = useState<LibraryMediaWithAssets[]>([])
	const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
	const [search, setSearch] = useState('')
	const [sortBy, setSortBy] = useState<LibraryMediaListFilters['sortBy']>('download_date')
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
	const [mediaTypeFilter, setMediaTypeFilter] = useState<'video' | 'audio' | undefined>()

	useEffect(() => {
		let cancelled = false
		const filters: LibraryMediaListFilters = {sortBy, sortOrder, mediaType: mediaTypeFilter, search: search || undefined}
		void window.appApi.library.media.list(filters).then(result => {
			if (!cancelled) setMedia(result)
		})
		return () => {
			cancelled = true
		}
	}, [sortBy, sortOrder, mediaTypeFilter, search])

	const toggleFavorite = async (id: string, current: boolean): Promise<void> => {
		await window.appApi.library.media.setFavorite(id, !current)
		const filters: LibraryMediaListFilters = {sortBy, sortOrder, mediaType: mediaTypeFilter, search: search || undefined}
		void window.appApi.library.media.list(filters).then(setMedia)
	}

	const formatDuration = (seconds: number | null): string => {
		if (!seconds) return ''
		const h = Math.floor(seconds / 3600)
		const m = Math.floor((seconds % 3600) / 60)
		const s = Math.floor(seconds % 60)
		if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
		return `${m}:${s.toString().padStart(2, '0')}`
	}

	const formatSize = (bytes: number | null): string => {
		if (!bytes) return ''
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
		if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
		return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
	}

	return (
		<div className="p-6 space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">{t('nav.library')}</h1>
				<div className="flex items-center gap-2">
					<span className="text-sm text-[var(--text-subtle)]">
						{media.length} {t('library.items')}
					</span>
				</div>
			</div>

			{/* Toolbar */}
			<div className="flex items-center gap-3">
				<div className="relative flex-1 max-w-md">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--text-subtle)]" />
					<Input placeholder={t('library.searchPlaceholder')} value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} className="pl-9" />
				</div>

				<div className="flex items-center gap-1 border border-[var(--border)] rounded-lg p-0.5">
					<Button variant={mediaTypeFilter === undefined ? 'secondary' : 'ghost'} size="sm" onClick={() => setMediaTypeFilter(undefined)}>
						{t('library.all')}
					</Button>
					<Button variant={mediaTypeFilter === 'video' ? 'secondary' : 'ghost'} size="sm" onClick={() => setMediaTypeFilter('video')}>
						{t('library.video')}
					</Button>
					<Button variant={mediaTypeFilter === 'audio' ? 'secondary' : 'ghost'} size="sm" onClick={() => setMediaTypeFilter('audio')}>
						{t('library.audio')}
					</Button>
				</div>

				<select
					value={`${sortBy}:${sortOrder}`}
					onChange={e => {
						const [by, order] = e.target.value.split(':')
						setSortBy(by as LibraryMediaListFilters['sortBy'])
						setSortOrder(order as 'asc' | 'desc')
					}}
					className="text-sm border border-[var(--border)] rounded-lg px-3 py-1.5 bg-transparent"
				>
					<option value="download_date:desc">{t('library.sortNewest')}</option>
					<option value="download_date:asc">{t('library.sortOldest')}</option>
					<option value="title:asc">{t('library.sortTitleAZ')}</option>
					<option value="title:desc">{t('library.sortTitleZA')}</option>
					<option value="duration:desc">{t('library.sortLongest')}</option>
					<option value="duration:asc">{t('library.sortShortest')}</option>
				</select>

				<div className="flex items-center border border-[var(--border)] rounded-lg p-0.5">
					<Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('grid')}>
						<Grid3X3 className="size-4" />
					</Button>
					<Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('list')}>
						<List className="size-4" />
					</Button>
				</div>
			</div>

			{/* Content */}
			{media.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-20 text-[var(--text-subtle)]">
					<Library className="size-12 mb-4 opacity-50" />
					<p className="text-lg font-medium">{t('library.empty')}</p>
					<p className="text-sm">{t('library.emptyHint')}</p>
				</div>
			) : viewMode === 'grid' ? (
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
					{media.map(item => (
						<div key={item.id} className="group relative rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--glass-tile)] hover:shadow-lg transition-shadow cursor-pointer">
							<div className="aspect-video bg-muted relative">
								{item.thumbnailUrl ? <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center text-[var(--text-subtle)]">{item.mediaType === 'video' ? '🎬' : '🎵'}</div>}
								{item.duration && <span className="absolute bottom-1 right-1 text-xs bg-black/70 text-white px-1.5 py-0.5 rounded">{formatDuration(item.duration)}</span>}
								{item.status === 'MISSING' && (
									<div className="absolute inset-0 bg-black/50 flex items-center justify-center">
										<span className="text-white text-sm font-medium">{t('library.missing')}</span>
									</div>
								)}
								<button
									onClick={e => {
										e.stopPropagation()
										void toggleFavorite(item.id, item.isFavorite === 1)
									}}
									className="absolute top-1 right-1 p-1 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
								>
									<Heart className={cn('size-4', item.isFavorite === 1 ? 'fill-red-500 text-red-500' : 'text-white')} />
								</button>
							</div>
							<div className="p-3">
								<p className="text-sm font-medium line-clamp-2">{item.title}</p>
								<p className="text-xs text-[var(--text-subtle)] mt-1">{item.author}</p>
								<div className="flex items-center justify-between mt-2">
									<span className="text-xs text-[var(--text-subtle)]">{item.sourceType !== 'UNKNOWN' && <span className="mr-2">{item.sourceType}</span>}</span>
									{item.totalSize && <span className="text-xs text-[var(--text-subtle)]">{formatSize(item.totalSize)}</span>}
								</div>
							</div>
						</div>
					))}
				</div>
			) : (
				<div className="space-y-1">
					{media.map(item => (
						<div key={item.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-[var(--glass-tile)] cursor-pointer transition-colors">
							<div className="w-24 aspect-video rounded-lg overflow-hidden bg-muted shrink-0">
								{item.thumbnailUrl ? <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center text-[var(--text-subtle)]">{item.mediaType === 'video' ? '🎬' : '🎵'}</div>}
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium truncate">{item.title}</p>
								<p className="text-xs text-[var(--text-subtle)]">{item.author}</p>
							</div>
							<span className="text-xs text-[var(--text-subtle)] shrink-0">{formatDuration(item.duration)}</span>
							<span className="text-xs text-[var(--text-subtle)] shrink-0">{formatSize(item.totalSize)}</span>
							<button onClick={() => void toggleFavorite(item.id, item.isFavorite === 1)} className="p-1 shrink-0">
								<Heart className={cn('size-4', item.isFavorite === 1 ? 'fill-red-500 text-red-500' : 'text-[var(--text-subtle)]')} />
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
