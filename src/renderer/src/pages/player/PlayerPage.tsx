import {useState, useEffect, useRef, useCallback, useMemo} from 'react'
import {useParams, useNavigate} from 'react-router-dom'
import {useTranslation} from 'react-i18next'
import {ArrowLeft, Film, Music, AlertCircle} from 'lucide-react'
import Plyr from 'plyr'
import 'plyr/dist/plyr.css'
import type {LibraryMediaWithAssets, LibraryPlaybackHistory} from '@shared/api.js'
import {Button} from '@renderer/components/ui/button.js'

interface PlyrInstance {
	destroy: () => void
}

const PlyrConstructor = Plyr as unknown as new (element: HTMLVideoElement, options?: Record<string, unknown>) => PlyrInstance

function extractLangFromFileName(fileName: string): string {
	const match = /\.([a-z]{2,3})(?:[-_][A-Z]{2})?\.vtt$|\.([a-z]{2,3})(?:[-_][A-Z]{2})?\.srt$/.exec(fileName)
	return match?.[1] ?? match?.[2] ?? 'en'
}

export function PlayerPage(): React.JSX.Element {
	const {id} = useParams<{id: string}>()
	const navigate = useNavigate()
	const {t} = useTranslation()

	const [media, setMedia] = useState<LibraryMediaWithAssets | null>(null)
	const [playback, setPlayback] = useState<LibraryPlaybackHistory | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const videoRef = useRef<HTMLVideoElement>(null)
	const playerRef = useRef<PlyrInstance | null>(null)
	const saveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

	useEffect(() => {
		if (!id) {
			queueMicrotask(() => {
				setError(t('player.noMedia'))
				setLoading(false)
			})
			return
		}

		let cancelled = false

		Promise.all([window.appApi.library.media.get(id), window.appApi.library.playback.getByMedia(id)])
			.then(([mediaResult, playbackResult]) => {
				if (cancelled) return
				if (!mediaResult) {
					setError(t('player.noMedia'))
				} else {
					setMedia(mediaResult)
					setPlayback(playbackResult)
				}
			})
			.catch(() => {
				if (!cancelled) setError(t('player.noMedia'))
			})
			.finally(() => {
				if (!cancelled) setLoading(false)
			})

		return () => {
			cancelled = true
		}
	}, [id, t])

	const primaryAsset = media?.assets.find(a => a.kind === 'video' || a.kind === 'audio')
	const subtitleAssets = useMemo(() => media?.assets.filter(a => a.kind === 'subtitle') ?? [], [media?.assets])
	const isAudio = primaryAsset?.kind === 'audio'
	const assetPath = primaryAsset?.path

	const savePosition = useCallback(() => {
		if (!id || !videoRef.current || videoRef.current.paused) return
		const {currentTime, duration} = videoRef.current
		if (currentTime > 0 && duration > 0) {
			void window.appApi.library.playback.updatePosition(id, currentTime, duration)
		}
	}, [id])

	useEffect(() => {
		if (!videoRef.current || !assetPath) return

		const video = videoRef.current
		const fileUrl = `file://${assetPath}`

		video.src = fileUrl

		if (subtitleAssets.length > 0) {
			while (video.firstChild) {
				video.removeChild(video.firstChild)
			}
			for (const asset of subtitleAssets) {
				const track = document.createElement('track')
				track.kind = 'subtitles'
				track.src = `file://${asset.path}`
				track.label = asset.fileName
				track.srclang = extractLangFromFileName(asset.fileName)
				video.appendChild(track)
			}
		}

		const player = new PlyrConstructor(video, {controls: ['play', 'progress', 'current-time', 'duration', 'mute', 'volume', 'settings', 'fullscreen', 'pip'], settings: ['speed'], speed: {selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2]}})
		playerRef.current = player

		const lastPosition = playback?.lastPosition ?? 0
		if (lastPosition > 0) {
			video.addEventListener(
				'loadedmetadata',
				() => {
					video.currentTime = lastPosition
				},
				{once: true}
			)
		}

		const handlePause = (): void => savePosition()
		video.addEventListener('pause', handlePause)

		saveIntervalRef.current = setInterval(savePosition, 5000)

		return () => {
			video.removeEventListener('pause', handlePause)
			if (saveIntervalRef.current) {
				clearInterval(saveIntervalRef.current)
			}
			player.destroy()
			playerRef.current = null
		}
	}, [assetPath, playback?.lastPosition, savePosition, subtitleAssets])

	useEffect(() => {
		return () => {
			savePosition()
		}
	}, [savePosition])

	if (loading) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
			</div>
		)
	}

	if (error || !media || !primaryAsset) {
		return (
			<div className="flex flex-col items-center justify-center h-full gap-4 text-[var(--text-subtle)]">
				<AlertCircle className="size-12 opacity-50" />
				<p className="text-lg font-medium">{error ?? t('player.noAsset')}</p>
				<Button
					variant="outline"
					onClick={(): void => {
						void navigate('/library')
					}}
				>
					<ArrowLeft className="size-4 mr-2" />
					{t('player.back')}
				</Button>
			</div>
		)
	}

	return (
		<div className="flex flex-col h-full">
			<div className="flex items-center gap-3 px-6 py-3 border-b border-[var(--border)]">
				<Button
					variant="ghost"
					size="sm"
					onClick={(): void => {
						void navigate('/library')
					}}
				>
					<ArrowLeft className="size-4 mr-1" />
					{t('player.back')}
				</Button>
				<h1 className="text-lg font-semibold truncate">{media.title}</h1>
			</div>

			<div className="flex-1 overflow-y-auto">
				<div className="max-w-5xl mx-auto p-6 space-y-6">
					<div className="rounded-xl overflow-hidden bg-black">
						{isAudio ? (
							<audio ref={videoRef} className="w-full">
								<track kind="captions" />
								{subtitleAssets.map(asset => (
									<track key={asset.id} kind="subtitles" src={`file://${asset.path}`} label={asset.fileName} srcLang={extractLangFromFileName(asset.fileName)} />
								))}
							</audio>
						) : (
							<video ref={videoRef} className="w-full" crossOrigin="anonymous">
								<track kind="captions" />
								{subtitleAssets.map(asset => (
									<track key={asset.id} kind="subtitles" src={`file://${asset.path}`} label={asset.fileName} srcLang={extractLangFromFileName(asset.fileName)} />
								))}
							</video>
						)}
					</div>

					<div className="space-y-4">
						<div>
							<h2 className="text-xl font-bold">{media.title}</h2>
							{media.author && <p className="text-sm text-[var(--text-subtle)] mt-1">{media.author}</p>}
						</div>

						{media.description && (
							<div className="rounded-lg border border-[var(--border)] p-4">
								<p className="text-sm text-[var(--text-subtle)] whitespace-pre-wrap">{media.description}</p>
							</div>
						)}

						<div className="flex items-center gap-4 text-xs text-[var(--text-subtle)]">
							<span className="flex items-center gap-1">
								{isAudio ? <Music className="size-3" /> : <Film className="size-3" />}
								{media.mediaType}
							</span>
							{media.sourceType !== 'UNKNOWN' && <span>{media.sourceType}</span>}
						</div>

						{subtitleAssets.length > 0 && (
							<div className="rounded-lg border border-[var(--border)] p-4">
								<h3 className="text-sm font-medium mb-2">{t('player.subtitles')}</h3>
								<div className="flex flex-wrap gap-2">
									{subtitleAssets.map(asset => (
										<span key={asset.id} className="text-xs px-2 py-1 rounded bg-muted">
											{asset.fileName}
										</span>
									))}
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
