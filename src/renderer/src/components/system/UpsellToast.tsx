import {useEffect} from 'react'
import {useTranslation} from 'react-i18next'
import {Sparkles, X} from 'lucide-react'
import {SITE_URL} from '@shared/constants.js'
import {Button} from '../ui/button.js'
import {useAppStore} from '../../store/useAppStore.js'
import {track} from '../../lib/analytics.js'

const AUTO_DISMISS_MS = 12_000

/**
 * The Spotify-style "go Pro" nudge, shown once a queue finishes draining (see
 * queueDrainUpsell.ts for the gating rules). Mounted once in App.tsx, always
 * present in the tree so it can animate in/out — visibility is store-driven.
 */
export function UpsellToast(): React.JSX.Element | null {
	const {t} = useTranslation()
	const open = useAppStore(s => s.upsellToastOpen)
	const dismissUpsellToast = useAppStore(s => s.dismissUpsellToast)

	useEffect(() => {
		if (!open) return
		const timer = setTimeout(dismissUpsellToast, AUTO_DISMISS_MS)
		return () => clearTimeout(timer)
	}, [open, dismissUpsellToast])

	if (!open) return null

	function seePlans(): void {
		track('upsell_toast_clicked')
		void window.appApi.shell.openExternal(`${SITE_URL}/pricing`)
		dismissUpsellToast()
	}

	return (
		<div role="status" data-testid="upsell-toast" className="fixed bottom-4 end-4 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-[var(--border-strong)] bg-popover p-4 text-popover-foreground shadow-lg ring-1 ring-foreground/10">
			<div className="flex items-start gap-3">
				<Sparkles className="size-5 shrink-0 text-[var(--brand)]" aria-hidden />
				<div className="min-w-0 flex-1">
					<p className="text-sm font-semibold">{t('upsellToast.title')}</p>
					<p className="mt-1 text-xs text-[var(--text-subtle)]">{t('upsellToast.description')}</p>
					<div className="mt-3 flex items-center gap-2">
						<Button size="sm" onClick={seePlans}>
							{t('upsellToast.cta')}
						</Button>
						<Button variant="ghost" size="sm" onClick={dismissUpsellToast}>
							{t('upsellToast.dismiss')}
						</Button>
					</div>
				</div>
				<button type="button" onClick={dismissUpsellToast} aria-label={t('upsellToast.dismiss')} className="shrink-0 text-[var(--text-subtle)] hover:text-foreground">
					<X className="size-4" />
				</button>
			</div>
		</div>
	)
}
