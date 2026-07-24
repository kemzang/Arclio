import {useParams, useNavigate} from 'react-router-dom'
import {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {ArrowLeft, AlertCircle} from 'lucide-react'
import type {LibraryMediaWithAssets} from '@shared/api.js'
import {Button} from '@renderer/components/ui/button.js'
import {PdfViewer} from '@renderer/components/viewers/PdfViewer.js'
import {ComicViewer} from '@renderer/components/viewers/ComicViewer.js'
import {ImageViewer} from '@renderer/components/viewers/ImageViewer.js'

export function UnifiedViewer(): React.JSX.Element {
	const {id} = useParams<{id: string}>()
	const navigate = useNavigate()
	const {t} = useTranslation()

	const [media, setMedia] = useState<LibraryMediaWithAssets | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (!id) {
			queueMicrotask(() => {
				setError(t('player.noMedia'))
				setLoading(false)
			})
			return
		}

		let cancelled = false

		window.appApi.library.media
			.get(id)
			.then(result => {
				if (cancelled) return
				if (!result) {
					setError(t('player.noMedia'))
				} else {
					setMedia(result)
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

	if (loading) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
			</div>
		)
	}

	if (error || !media) {
		return (
			<div className="flex flex-col items-center justify-center h-full gap-4 text-[var(--text-subtle)]">
				<AlertCircle className="size-12 opacity-50" />
				<p className="text-lg font-medium">{error ?? t('player.noMedia')}</p>
				<Button variant="outline" onClick={() => void navigate('/library')}>
					<ArrowLeft className="size-4 mr-2" />
					{t('player.back')}
				</Button>
			</div>
		)
	}

	const primaryAsset = media.assets.find(a => a.kind === 'media' || a.kind === 'video' || a.kind === 'audio')
	const assetPath = primaryAsset?.path
	const fileUrl = assetPath ? `file://${assetPath}` : ''

	const renderViewer = () => {
		if (!assetPath) {
			return (
				<div className="flex flex-col items-center justify-center h-full gap-4 text-[var(--text-subtle)]">
					<AlertCircle className="size-12 opacity-50" />
					<p className="text-lg font-medium">{t('player.noAsset')}</p>
				</div>
			)
		}

		switch (media.mediaType) {
			case 'document':
				return <PdfViewer fileUrl={fileUrl} title={media.title} />
			case 'comic':
				return <ComicViewer fileUrl={fileUrl} title={media.title} />
			case 'image':
				return <ImageViewer fileUrl={fileUrl} title={media.title} />
			default:
				return (
					<div className="flex flex-col items-center justify-center h-full gap-4 text-[var(--text-subtle)]">
						<AlertCircle className="size-12 opacity-50" />
						<p className="text-lg font-medium">Unsupported media type: {media.mediaType}</p>
						<Button variant="outline" onClick={() => void navigate('/library')}>
							<ArrowLeft className="size-4 mr-2" />
							{t('player.back')}
						</Button>
					</div>
				)
		}
	}

	return <div className="flex flex-col h-full">{renderViewer()}</div>
}
