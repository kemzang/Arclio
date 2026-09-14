import type {MouseEvent} from 'react'
import type {TFunction} from 'i18next'
import {Loader2, Sparkles, X} from 'lucide-react'
import type {QueueItem, TranscriptionErrorReason} from '@shared/types.js'
import {useTranscriptionStore} from '../../store/useTranscription.js'
import {Button} from '../ui/button.js'

const ERROR_KEY = {
	item_not_found: 'queue.item.transcription.errors.itemNotFound',
	no_media_file: 'queue.item.transcription.errors.noMediaFile',
	not_connected: 'queue.item.transcription.errors.notConnected',
	tier_required: 'queue.item.transcription.errors.tierRequired',
	quota_exceeded: 'queue.item.transcription.errors.quotaExceeded',
	unauthorized: 'queue.item.transcription.errors.unauthorized',
	cancelled: 'queue.item.transcription.errors.cancelled',
	failed: 'queue.item.transcription.errors.failed'
} as const satisfies Record<TranscriptionErrorReason, string>

function stop(event: MouseEvent): void {
	event.stopPropagation()
}

/**
 * Inline "Generate AI subtitles" affordance for any finished download that
 * doesn't already have subtitles. Placed right in the status cell rather
 * than the grouped selection toolbar — this is a single-item, quota-gated,
 * long-running action, not the kind of homogeneous bulk action that bar is
 * built for.
 *
 * Not restricted to the subtitlesFailed soft-fail: most downloads never ask
 * for subtitles at all, so gating on that alone would hide this (paid)
 * feature from nearly every completed item instead of just the ones that
 * tried and came up empty.
 */
export function TranscriptionAction({item, t}: {item: QueueItem; t: TFunction}): React.JSX.Element | null {
	const run = useTranscriptionStore(state => state.byItemId[item.id])
	const tier = useTranscriptionStore(state => state.tier)
	const start = useTranscriptionStore(state => state.start)
	const cancel = useTranscriptionStore(state => state.cancel)

	const eligible = item.status === 'done' && !item.artifacts.some(artifact => artifact.kind === 'subtitle')
	if (!eligible || tier !== 'sync_ai') return null

	if (!run || run.phase === 'done') {
		return (
			<Button
				type="button"
				variant="outline"
				size="xs"
				onClick={event => {
					stop(event)
					start(item.id)
				}}
			>
				<Sparkles aria-hidden />
				{t('queue.item.transcription.generate')}
			</Button>
		)
	}

	if (run.phase === 'failed') {
		return (
			<div className="flex items-center gap-1.5">
				<span className="text-[11px] text-[var(--color-status-error)]">{t(ERROR_KEY[run.errorReason ?? 'failed'])}</span>
				<Button
					type="button"
					variant="ghost"
					size="xs"
					onClick={event => {
						stop(event)
						start(item.id)
					}}
				>
					{t('common.retry')}
				</Button>
			</div>
		)
	}

	const label =
		run.phase === 'transcribing' && run.chunkIndex !== undefined && run.chunkCount !== undefined
			? t('queue.item.transcription.phaseTranscribing', {chunkIndex: run.chunkIndex, chunkCount: run.chunkCount})
			: t(run.phase === 'extracting' ? 'queue.item.transcription.phaseExtracting' : 'queue.item.transcription.phaseUploading')

	return (
		<div className="flex items-center gap-1.5">
			<Loader2 size={11} className="animate-spin text-[var(--text-subtle)]" aria-hidden />
			<span className="text-[11px] text-[var(--text-subtle)]">{label}</span>
			<Button
				type="button"
				variant="ghost"
				size="icon-xs"
				aria-label={t('common.cancel')}
				onClick={event => {
					stop(event)
					cancel(item.id)
				}}
			>
				<X aria-hidden />
			</Button>
		</div>
	)
}
