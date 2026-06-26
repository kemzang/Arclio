import {useState, useEffect} from 'react'
import {useTranslation} from 'react-i18next'
import {Star, Heart} from 'lucide-react'
import type {LibraryMediaWithAssets} from '@shared/api.js'

export function FavoritesPage(): React.JSX.Element {
	const {t} = useTranslation()
	const [media, setMedia] = useState<LibraryMediaWithAssets[]>([])

	useEffect(() => {
		let cancelled = false
		void window.appApi.library.media.list({isFavorite: true, sortBy: 'download_date', sortOrder: 'desc'}).then(result => {
			if (!cancelled) setMedia(result)
		})
		return () => {
			cancelled = true
		}
	}, [])

	const toggleFavorite = async (id: string): Promise<void> => {
		await window.appApi.library.media.setFavorite(id, false)
		void window.appApi.library.media.list({isFavorite: true, sortBy: 'download_date', sortOrder: 'desc'}).then(setMedia)
	}

	const formatDuration = (seconds: number | null): string => {
		if (!seconds) return ''
		const h = Math.floor(seconds / 3600)
		const m = Math.floor((seconds % 3600) / 60)
		const s = Math.floor(seconds % 60)
		if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
		return `${m}:${s.toString().padStart(2, '0')}`
	}

	return (
		<div className="p-6 space-y-4">
			<h1 className="text-2xl font-bold">{t('nav.favorites')}</h1>

			{media.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-20 text-[var(--text-subtle)]">
					<Star className="size-12 mb-4 opacity-50" />
					<p className="text-lg font-medium">{t('favorites.empty')}</p>
					<p className="text-sm">{t('favorites.emptyHint')}</p>
				</div>
			) : (
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
					{media.map(item => (
						<div key={item.id} className="group relative rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--glass-tile)] hover:shadow-lg transition-shadow cursor-pointer">
							<div className="aspect-video bg-muted relative">
								{item.thumbnailUrl ? <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center text-[var(--text-subtle)]">{item.mediaType === 'video' ? '🎬' : '🎵'}</div>}
								{item.duration && <span className="absolute bottom-1 right-1 text-xs bg-black/70 text-white px-1.5 py-0.5 rounded">{formatDuration(item.duration)}</span>}
								<button
									onClick={e => {
										e.stopPropagation()
										void toggleFavorite(item.id)
									}}
									className="absolute top-1 right-1 p-1 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
								>
									<Heart className="size-4 fill-red-500 text-red-500" />
								</button>
							</div>
							<div className="p-3">
								<p className="text-sm font-medium line-clamp-2">{item.title}</p>
								<p className="text-xs text-[var(--text-subtle)] mt-1">{item.author}</p>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
