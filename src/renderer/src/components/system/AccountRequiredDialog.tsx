import {useCallback, useEffect, useRef, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Check, Copy, ExternalLink, Loader2, ShieldAlert} from 'lucide-react'
import type {PairingHandle} from '@shared/api.js'
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '../ui/dialog.js'
import {Button} from '../ui/button.js'
import {useAppStore} from '../../store/useAppStore.js'

type Phase = 'idle' | 'starting' | 'waiting' | 'failed' | 'unavailable'

const FAILURE_KEY = {expired: 'account.pairingExpired', denied: 'account.pairingDenied', cancelled: 'account.pairingCancelled', failed: 'account.pairingFailed'} as const

/**
 * Blocks a download attempt until the user has a connected Arclio account.
 * Opened by `ensureAccountConnected()` (store/wizard/accountGate.ts); resolves
 * that gate's promise via `resolveAccountGate` on success or dismissal.
 */
export function AccountRequiredDialog(): React.JSX.Element {
	const {t} = useTranslation()
	const open = useAppStore(s => s.accountGateOpen)
	const resolveAccountGate = useAppStore(s => s.resolveAccountGate)
	const [phase, setPhase] = useState<Phase>('idle')
	const [pairing, setPairing] = useState<PairingHandle | null>(null)
	const [message, setMessage] = useState('')
	const [copied, setCopied] = useState(false)
	const mountedRef = useRef(true)

	useEffect(() => {
		mountedRef.current = true
		return () => {
			mountedRef.current = false
		}
	}, [])

	// App.tsx only mounts this component while accountGateOpen is true, so a
	// fresh instance (and fresh useState initial values) is what gives each
	// gate its own clean idle/waiting/failed state — this effect just needs to
	// run once per mount to check whether the system can even store a token
	// before offering "Connect".
	useEffect(() => {
		void window.appApi.account.status().then(status => {
			if (mountedRef.current && !status.canStoreCredentials) setPhase('unavailable')
		})
	}, [])

	const connect = useCallback(async () => {
		setPhase('starting')
		setMessage('')
		try {
			const handle = await window.appApi.account.beginPairing()
			if (!mountedRef.current) return
			setPairing(handle)
			setPhase('waiting')
			const result = await window.appApi.account.awaitPairing()
			if (!mountedRef.current) return
			if (result.ok) {
				setPairing(null)
				resolveAccountGate(true)
				return
			}
			setMessage(t(FAILURE_KEY[result.reason] ?? 'account.pairingFailed'))
			setPhase('failed')
		} catch {
			if (!mountedRef.current) return
			setMessage(t('account.startFailed'))
			setPhase('failed')
		}
	}, [t, resolveAccountGate])

	const cancel = useCallback(async () => {
		await window.appApi.account.cancelPairing()
		if (mountedRef.current) {
			setPairing(null)
			setPhase('idle')
		}
	}, [])

	function handleOpenChange(next: boolean): void {
		if (next) return
		if (phase === 'waiting') void cancel()
		resolveAccountGate(false)
	}

	const copyCode = useCallback(async () => {
		if (!pairing) return
		await navigator.clipboard.writeText(pairing.userCode)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}, [pairing])

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent data-testid="account-gate-dialog" className="sm:max-w-md">
				{phase === 'waiting' && pairing ? (
					<>
						<DialogHeader>
							<DialogTitle>{t('account.browserTitle')}</DialogTitle>
							<DialogDescription>{t('account.browserDescription')}</DialogDescription>
						</DialogHeader>
						<div className="flex items-center gap-2">
							<code className="flex-1 rounded-lg bg-muted px-4 py-3 text-center font-mono text-xl tracking-[0.2em]">{pairing.userCode}</code>
							<Button variant="outline" size="sm" onClick={() => void copyCode()} aria-label={t('account.copyCode')}>
								{copied ? <Check className="size-4" /> : <Copy className="size-4" />}
							</Button>
						</div>
						<div className="flex items-center gap-2">
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
					</>
				) : phase === 'unavailable' ? (
					<>
						<DialogHeader>
							<div className="flex items-center gap-2">
								<ShieldAlert className="size-5 text-[var(--status-error)]" aria-hidden />
								<DialogTitle>{t('account.unavailableTitle')}</DialogTitle>
							</div>
							<DialogDescription>{t('account.unavailableDescription')}</DialogDescription>
						</DialogHeader>
						<div className="flex items-center justify-end">
							<Button variant="outline" size="sm" onClick={() => resolveAccountGate(false)}>
								{t('accountGate.close')}
							</Button>
						</div>
					</>
				) : (
					<>
						<DialogHeader>
							<DialogTitle>{t('accountGate.title')}</DialogTitle>
							<DialogDescription>{message || t('accountGate.description')}</DialogDescription>
						</DialogHeader>
						<div className="flex items-center justify-end gap-2">
							<Button variant="ghost" size="sm" onClick={() => resolveAccountGate(false)}>
								{t('accountGate.close')}
							</Button>
							<Button size="sm" disabled={phase === 'starting'} onClick={() => void connect()}>
								{phase === 'starting' ? <Loader2 className="size-4 mr-1 animate-spin" /> : null}
								{phase === 'failed' ? t('account.tryAgain') : t('accountGate.connect')}
							</Button>
						</div>
					</>
				)}
			</DialogContent>
		</Dialog>
	)
}
