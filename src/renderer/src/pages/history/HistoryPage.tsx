import {useState, useEffect} from 'react'
import {useTranslation} from 'react-i18next'
import {Clock, Download, Play} from 'lucide-react'
import type {LibraryDownloadHistory, LibraryPlaybackHistory} from '@shared/api.js'
import {Button} from '@renderer/components/ui/button.js'

type HistoryTab = 'downloads' | 'playback'

export function HistoryPage(): React.JSX.Element {
	const {t} = useTranslation()
	const [activeTab, setActiveTab] = useState<HistoryTab>('downloads')
	const [downloads, setDownloads] = useState<LibraryDownloadHistory[]>([])
	const [playback, setPlayback] = useState<LibraryPlaybackHistory[]>([])

	useEffect(() => {
		let cancelled = false
		void window.appApi.library.downloadHistory.list({limit: 100}).then(result => {
			if (!cancelled) setDownloads(result)
		})
		void window.appApi.library.playback.listRecent(100).then(result => {
			if (!cancelled) setPlayback(result)
		})
		return () => {
			cancelled = true
		}
	}, [])

	const formatDate = (iso: string): string => {
		const date = new Date(iso)
		const now = new Date()
		const diff = now.getTime() - date.getTime()
		const days = Math.floor(diff / (1000 * 60 * 60 * 24))

		if (days === 0) return t('history.today')
		if (days === 1) return t('history.yesterday')
		if (days < 7) return t('history.thisWeek')
		if (days < 30) return t('history.thisMonth')
		return date.toLocaleDateString()
	}

	const formatDuration = (ms: number | null): string => {
		if (!ms) return ''
		const seconds = Math.floor(ms / 1000)
		const m = Math.floor(seconds / 60)
		const s = seconds % 60
		return `${m}m ${s}s`
	}

	const groupedDownloads = downloads.reduce<Record<string, LibraryDownloadHistory[]>>((acc, item) => {
		const group = formatDate(item.finishedAt)
		if (!acc[group]) acc[group] = []
		acc[group].push(item)
		return acc
	}, {})

	return (
		<div className="p-6 space-y-4">
			<h1 className="text-2xl font-bold">{t('nav.history')}</h1>

			<div className="flex items-center gap-1 border border-[var(--border)] rounded-lg p-0.5 w-fit">
				<Button variant={activeTab === 'downloads' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveTab('downloads')}>
					<Download className="size-4 mr-2" />
					{t('history.downloads')}
				</Button>
				<Button variant={activeTab === 'playback' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveTab('playback')}>
					<Play className="size-4 mr-2" />
					{t('history.playback')}
				</Button>
			</div>

			{activeTab === 'downloads' ? (
				Object.entries(groupedDownloads).length === 0 ? (
					<div className="flex flex-col items-center justify-center py-20 text-[var(--text-subtle)]">
						<Clock className="size-12 mb-4 opacity-50" />
						<p className="text-lg font-medium">{t('history.empty')}</p>
					</div>
				) : (
					<div className="space-y-6">
						{Object.entries(groupedDownloads).map(([group, items]) => (
							<div key={group}>
								<h3 className="text-sm font-semibold text-[var(--text-subtle)] mb-2">{group}</h3>
								<div className="space-y-1">
									{items.map(item => (
										<div key={item.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--glass-tile)] transition-colors">
											<div className={`w-2 h-2 rounded-full shrink-0 ${item.status === 'completed' ? 'bg-green-500' : item.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'}`} />
											<div className="flex-1 min-w-0">
												<p className="text-sm truncate">{item.url}</p>
												<p className="text-xs text-[var(--text-subtle)]">
													{item.status} {item.formatId && `· ${item.formatId}`}
													{item.durationMs && ` · ${formatDuration(item.durationMs)}`}
												</p>
											</div>
											<span className="text-xs text-[var(--text-subtle)] shrink-0">{new Date(item.finishedAt).toLocaleTimeString()}</span>
										</div>
									))}
								</div>
							</div>
						))}
					</div>
				)
			) : playback.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-20 text-[var(--text-subtle)]">
					<Play className="size-12 mb-4 opacity-50" />
					<p className="text-lg font-medium">{t('history.emptyPlayback')}</p>
				</div>
			) : (
				<div className="space-y-1">
					{playback.map(item => (
						<div key={item.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--glass-tile)] transition-colors">
							<Play className="size-4 text-[var(--text-subtle)] shrink-0" />
							<div className="flex-1 min-w-0">
								<p className="text-sm truncate">{item.mediaId}</p>
								<p className="text-xs text-[var(--text-subtle)]">
									{t('history.playCount', {count: item.playCount})}
									{item.completed ? ` · ${t('history.completed')}` : ''}
								</p>
							</div>
							<span className="text-xs text-[var(--text-subtle)] shrink-0">{new Date(item.lastOpenedAt).toLocaleDateString()}</span>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
