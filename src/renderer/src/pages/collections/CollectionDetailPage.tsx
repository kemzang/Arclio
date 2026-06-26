import {useState, useEffect} from 'react'
import {useParams, useNavigate} from 'react-router-dom'
import {useTranslation} from 'react-i18next'
import {ArrowLeft, Heart, FolderHeart, Trash2, Grid3X3, List} from 'lucide-react'
import {cn} from '@renderer/lib/utils.js'
import type {LibraryCollection, LibraryMediaWithAssets} from '@shared/api.js'
import {Button} from '@renderer/components/ui/button.js'

export function CollectionDetailPage(): React.JSX.Element {
	const {id} = useParams<{id: string}>()
	const navigate = useNavigate()
	const {t} = useTranslation()

	const [collection, setCollection] = useState<LibraryCollection | null>(null)
	const [media, setMedia] = useState<LibraryMediaWithAssets[]>([])
	const [loading, setLoading] = useState(true)
	const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

	useEffect(() => {
		if (!id) {
			return
		}

		let cancelled = false

		void Promise.all([window.appApi.library.collection.get(id), window.appApi.library.media.list({collectionId: id})])
			.then(([col, items]) => {
				if (cancelled) return
				setCollection(col)
				setMedia(items)
			})
			.finally(() => {
				if (!cancelled) setLoading(false)
			})

		return () => {
			cancelled = true
		}
	}, [id])

	const handleRemove = async (mediaId: string): Promise<void> => {
		if (!id) return
		await window.appApi.library.collection.removeMedia(id, mediaId)
		setMedia(prev => prev.filter(m => m.id !== mediaId))
	}

	const toggleFavorite = async (mediaId: string, current: boolean): Promise<void> => {
		await window.appApi.library.media.setFavorite(mediaId, !current)
		setMedia(prev => prev.map(m => (m.id === mediaId ? {...m, isFavorite: current ? 0 : 1} : m)))
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

	if (loading) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
			</div>
		)
	}

	if (!collection) {
		return (
			<div className="flex flex-col items-center justify-center h-full gap-4 text-[var(--text-subtle)]">
				<FolderHeart className="size-12 opacity-50" />
				<p className="text-lg font-medium">{t('collections.empty')}</p>
				<Button variant="outline" onClick={() => void navigate('/collections')}>
					<ArrowLeft className="size-4 mr-2" />
					{t('collectionDetail.back')}
				</Button>
			</div>
		)
	}

	return (
		<div className="p-6 space-y-4">
			<div className="flex items-center gap-3">
				<Button variant="ghost" size="sm" onClick={() => void navigate('/collections')}>
					<ArrowLeft className="size-4 mr-1" />
					{t('collectionDetail.back')}
				</Button>
			</div>

			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					{collection.color && <div className="w-4 h-4 rounded-full shrink-0" style={{backgroundColor: collection.color}} />}
					<div>
						<h1 className="text-2xl font-bold">{collection.name}</h1>
						{collection.description && <p className="text-sm text-[var(--text-subtle)] mt-0.5">{collection.description}</p>}
					</div>
				</div>
				<div className="flex items-center gap-3">
					<span className="text-sm text-[var(--text-subtle)]">
						{media.length} {t('library.items')}
					</span>
					<div className="flex items-center border border-[var(--border)] rounded-lg p-0.5">
						<Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('grid')}>
							<Grid3X3 className="size-4" />
						</Button>
						<Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('list')}>
							<List className="size-4" />
						</Button>
					</div>
				</div>
			</div>

			{media.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-20 text-[var(--text-subtle)]">
					<FolderHeart className="size-12 mb-4 opacity-50" />
					<p className="text-lg font-medium">{t('collectionDetail.empty')}</p>
					<p className="text-sm">{t('collectionDetail.emptyHint')}</p>
				</div>
			) : viewMode === 'grid' ? (
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
					{media.map(item => (
						<div
							key={item.id}
							role="button"
							tabIndex={0}
							onClick={() => void navigate(`/library/${item.id}`)}
							onKeyDown={e => {
								if (e.key === 'Enter') void navigate(`/library/${item.id}`)
							}}
							className="group relative rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--glass-tile)] hover:shadow-lg transition-shadow cursor-pointer"
						>
							<div className="aspect-video bg-muted relative">
								{item.thumbnailUrl ? <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center text-[var(--text-subtle)]">{item.mediaType === 'video' ? '🎬' : '🎵'}</div>}
								{item.duration && <span className="absolute bottom-1 right-1 text-xs bg-black/70 text-white px-1.5 py-0.5 rounded">{formatDuration(item.duration)}</span>}
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
							<button
								onClick={e => {
									e.stopPropagation()
									void handleRemove(item.id)
								}}
								className="absolute top-1 left-1 p-1 rounded-full bg-black/30 hover:bg-black/50 transition-colors opacity-0 group-hover:opacity-100"
								title={t('collectionDetail.removeFromCollection')}
							>
								<Trash2 className="size-3.5 text-white" />
							</button>
						</div>
					))}
				</div>
			) : (
				<div className="space-y-1">
					{media.map(item => (
						<div
							key={item.id}
							role="button"
							tabIndex={0}
							onClick={() => void navigate(`/library/${item.id}`)}
							onKeyDown={e => {
								if (e.key === 'Enter') void navigate(`/library/${item.id}`)
							}}
							className="flex items-center gap-4 p-3 rounded-lg hover:bg-[var(--glass-tile)] cursor-pointer transition-colors group"
						>
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
							<button onClick={() => void handleRemove(item.id)} className="p-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" title={t('collectionDetail.removeFromCollection')}>
								<Trash2 className="size-4 text-[var(--text-subtle)] hover:text-destructive" />
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
