import {useCallback, useEffect, useRef, useState} from 'react'
import {useTranslation} from 'react-i18next'
import type {TFunction} from 'i18next'
import {Check, Copy, ExternalLink, Loader2, LogOut, ShieldAlert} from 'lucide-react'
import type {AccountStatus, PairingHandle} from '@shared/api.js'
import {Button} from '../ui/button.js'
import {Badge} from '../ui/badge.js'

type Phase = 'idle' | 'starting' | 'waiting' | 'failed'

/**
 * Pairing outcomes the user can act on, mapped to their explanation.
 *
 * `as const` keeps the values as literal keys: i18n keys are typed, so a typo
 * fails the build instead of rendering a raw key at runtime.
 */
const FAILURE_KEY = {expired: 'account.pairingExpired', denied: 'account.pairingDenied', cancelled: 'account.pairingCancelled', failed: 'account.pairingFailed'} as const

/** Which badge to show for a plan/tier combination — undefined plan means refreshPlan() hasn't resolved yet, so no badge is shown rather than guessing. */
function planBadgeLabel(status: AccountStatus, t: TFunction): string | null {
	if (status.plan === undefined) return null
	if (status.plan === 'free') return t('account.planFree')
	if (status.tier === 'sync_ai') return t('account.planSyncAi')
	if (status.tier === 'sync') return t('account.planSync')
	return t('account.planPro')
}

/**
 * Connects this machine to an Arclio account.
 *
 * The device token never reaches the renderer — this panel only shows the code
 * to type, opens the browser, and reflects the outcome the main process reports.
 */
export function AccountPanel(): React.JSX.Element {
	const {t} = useTranslation()
	const [status, setStatus] = useState<AccountStatus | null>(null)
	const [phase, setPhase] = useState<Phase>('idle')
	const [pairing, setPairing] = useState<PairingHandle | null>(null)
	const [message, setMessage] = useState('')
	const [copied, setCopied] = useState(false)

	const mountedRef = useRef(true)

	useEffect(() => {
		// Re-arm on every effect run, not just the initial `useRef(true)`: React
		// StrictMode double-invokes this effect in dev (mount -> cleanup -> mount
		// again) on the same ref object, so without this line the cleanup's
		// `false` would stick permanently and every async continuation below
		// would silently no-op for the component's entire real lifetime.
		mountedRef.current = true
		let cancelled = false
		void (async () => {
			const current = await window.appApi.account.status()
			if (!cancelled) setStatus(current)
		})()
		return () => {
			cancelled = true
			mountedRef.current = false
		}
	}, [])

	const connect = useCallback(async () => {
		setPhase('starting')
		setMessage('')
		try {
			const handle = await window.appApi.account.beginPairing()
			if (!mountedRef.current) return
			setPairing(handle)
			setPhase('waiting')

			// Resolves only once the user decides in the browser, so it is awaited
			// separately from beginPairing — the code stays on screen meanwhile.
			// The panel can unmount long before that (navigating away from
			// Settings); guard every state update after this await.
			const result = await window.appApi.account.awaitPairing()
			if (!mountedRef.current) return
			if (result.ok) {
				setStatus(result.status)
				setPairing(null)
				setPhase('idle')
				return
			}
			setMessage(t(FAILURE_KEY[result.reason] ?? 'account.pairingFailed'))
			setPhase('failed')
		} catch {
			if (!mountedRef.current) return
			setMessage(t('account.startFailed'))
			setPhase('failed')
		}
	}, [t])

	const cancel = useCallback(async () => {
		await window.appApi.account.cancelPairing()
		setPairing(null)
		setPhase('idle')
	}, [])

	const disconnect = useCallback(async () => {
		setStatus(await window.appApi.account.disconnect())
	}, [])

	const copyCode = useCallback(async () => {
		if (!pairing) return
		await navigator.clipboard.writeText(pairing.userCode)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}, [pairing])

	if (!status) return <div className="p-4" />

	if (!status.canStoreCredentials) {
		return (
			<div className="flex items-start gap-3 p-4 rounded-lg border border-[var(--border)] bg-card">
				<ShieldAlert className="size-5 mt-0.5 text-[var(--status-error)] shrink-0" />
				<div className="min-w-0">
					<p className="text-sm font-medium">{t('account.unavailableTitle')}</p>
					<p className="text-xs text-[var(--text-subtle)]">{t('account.unavailableDescription')}</p>
				</div>
			</div>
		)
	}

	if (status.connected) {
		return (
			<div className="space-y-4">
				<div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-[var(--border)] bg-card">
					<div className="flex items-start gap-3 min-w-0">
						<Check className="size-5 mt-0.5 text-[var(--status-done)] shrink-0" />
						<div className="min-w-0">
							<div className="flex items-center gap-2">
								<p className="text-sm font-medium">{t('account.connectedTitle')}</p>
								{planBadgeLabel(status, t) && <Badge variant={status.plan === 'free' ? 'outline' : 'default'}>{planBadgeLabel(status, t)}</Badge>}
							</div>
							<p className="text-xs text-[var(--text-subtle)] truncate">{status.accountEmail ?? t('account.connectedDescription')}</p>
							{status.tier === 'sync_ai' && status.transcriptionQuota && <p className="text-xs text-[var(--text-subtle)]">{t('account.quotaRemaining', {minutes: Math.floor(status.transcriptionQuota.secondsRemaining / 60)})}</p>}
						</div>
					</div>
					<Button variant="outline" size="sm" className="shrink-0" onClick={() => void disconnect()}>
						<LogOut className="size-4 mr-1" />
						{t('account.disconnect')}
					</Button>
				</div>

				{/*
				 * Sync card hidden for now: the Sync/Sync+AI plans it applies to
				 * aren't actually purchasable while no payment provider is live
				 * (Paddle rejected the domain application) — a "Sync now" action
				 * for a paid feature nobody can currently buy just invites
				 * confusion. Account connection above stays available on its own.
				 * Restore this block once a provider works.
				 */}
			</div>
		)
	}

	if (phase === 'waiting' && pairing) {
		return (
			<div className="p-4 rounded-lg border border-[var(--border)] bg-card">
				<p className="text-sm font-medium">{t('account.browserTitle')}</p>
				<p className="text-xs text-[var(--text-subtle)]">{t('account.browserDescription')}</p>

				<div className="mt-4 flex items-center gap-2">
					<code className="flex-1 rounded-lg bg-muted px-4 py-3 text-center font-mono text-xl tracking-[0.2em]">{pairing.userCode}</code>
					<Button variant="outline" size="sm" onClick={() => void copyCode()} aria-label={t('account.copyCode')}>
						{copied ? <Check className="size-4" /> : <Copy className="size-4" />}
					</Button>
				</div>

				<div className="mt-4 flex items-center gap-2">
					<Loader2 className="size-4 animate-spin text-[var(--text-subtle)]" aria-hidden />
					<span className="text-xs text-[var(--text-subtle)]">{t('account.waiting')}</span>
					<div className="ml-auto flex gap-2">
						<Button variant="outline" size="sm" onClick={() => void window.appApi.shell.openExternal(pairing.verificationUrl)}>
							<ExternalLink className="size-4 mr-1" />
							{t('account.reopenPage')}
						</Button>
						<Button variant="ghost" size="sm" onClick={() => void cancel()}>
							{t('account.cancel')}
						</Button>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-[var(--border)] bg-card">
			<div className="flex items-start gap-3 min-w-0">
				<div className="min-w-0">
					<p className="text-sm font-medium">{t('account.connectTitle')}</p>
					<p className="text-xs text-[var(--text-subtle)]">{message || t('account.connectDescription')}</p>
				</div>
			</div>
			<Button size="sm" className="shrink-0" disabled={phase === 'starting'} onClick={() => void connect()}>
				{phase === 'starting' ? <Loader2 className="size-4 mr-1 animate-spin" /> : null}
				{phase === 'failed' ? t('account.tryAgain') : t('account.connect')}
			</Button>
		</div>
	)
}
