import {useCallback, useEffect, useState} from 'react'
import {Check, Copy, ExternalLink, Loader2, LogOut, ShieldAlert} from 'lucide-react'
import type {AccountStatus, PairingHandle} from '@shared/api.js'
import {Button} from '../ui/button.js'

type Phase = 'idle' | 'starting' | 'waiting' | 'failed'

const FAILURE_MESSAGE: Record<string, string> = {expired: 'The code expired before it was approved. Start again.', denied: 'That request was declined in the browser.', cancelled: 'Connection cancelled.', failed: 'Something went wrong while connecting. Please try again.'}

/**
 * Connects this machine to an Arclio account.
 *
 * The device token never reaches the renderer — this panel only shows the code
 * to type, opens the browser, and reflects the outcome the main process reports.
 */
export function AccountPanel(): React.JSX.Element {
	const [status, setStatus] = useState<AccountStatus | null>(null)
	const [phase, setPhase] = useState<Phase>('idle')
	const [pairing, setPairing] = useState<PairingHandle | null>(null)
	const [message, setMessage] = useState('')
	const [copied, setCopied] = useState(false)

	useEffect(() => {
		let cancelled = false
		void (async () => {
			const current = await window.appApi.account.status()
			if (!cancelled) setStatus(current)
		})()
		return () => {
			cancelled = true
		}
	}, [])

	const connect = useCallback(async () => {
		setPhase('starting')
		setMessage('')
		try {
			const handle = await window.appApi.account.beginPairing()
			setPairing(handle)
			setPhase('waiting')

			// Resolves only once the user decides in the browser, so it is awaited
			// separately from beginPairing — the code stays on screen meanwhile.
			const result = await window.appApi.account.awaitPairing()
			if (result.ok) {
				setStatus(result.status)
				setPairing(null)
				setPhase('idle')
				return
			}
			setMessage(FAILURE_MESSAGE[result.reason] ?? FAILURE_MESSAGE.failed ?? '')
			setPhase('failed')
		} catch {
			setMessage('Could not start the connection. Check your internet connection.')
			setPhase('failed')
		}
	}, [])

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
					<p className="text-sm font-medium">Account unavailable on this system</p>
					<p className="text-xs text-[var(--text-subtle)]">Arclio could not reach a system keyring to protect an account token, so connecting is disabled. Everything else works — an account only adds library sync.</p>
				</div>
			</div>
		)
	}

	if (status.connected) {
		return (
			<div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-[var(--border)] bg-card">
				<div className="flex items-start gap-3 min-w-0">
					<Check className="size-5 mt-0.5 text-[var(--status-done)] shrink-0" />
					<div className="min-w-0">
						<p className="text-sm font-medium">This device is connected</p>
						<p className="text-xs text-[var(--text-subtle)] truncate">{status.accountEmail ?? 'Your library syncs across your devices.'}</p>
					</div>
				</div>
				<Button variant="outline" size="sm" className="shrink-0" onClick={() => void disconnect()}>
					<LogOut className="size-4 mr-1" />
					Disconnect
				</Button>
			</div>
		)
	}

	if (phase === 'waiting' && pairing) {
		return (
			<div className="p-4 rounded-lg border border-[var(--border)] bg-card">
				<p className="text-sm font-medium">Finish in your browser</p>
				<p className="text-xs text-[var(--text-subtle)]">We opened a page for you. Confirm this code there:</p>

				<div className="mt-4 flex items-center gap-2">
					<code className="flex-1 rounded-lg bg-muted px-4 py-3 text-center font-mono text-xl tracking-[0.2em]">{pairing.userCode}</code>
					<Button variant="outline" size="sm" onClick={() => void copyCode()} aria-label="Copy code">
						{copied ? <Check className="size-4" /> : <Copy className="size-4" />}
					</Button>
				</div>

				<div className="mt-4 flex items-center gap-2">
					<Loader2 className="size-4 animate-spin text-[var(--text-subtle)]" aria-hidden />
					<span className="text-xs text-[var(--text-subtle)]">Waiting for you to approve…</span>
					<div className="ml-auto flex gap-2">
						<Button variant="outline" size="sm" onClick={() => void window.appApi.shell.openExternal(pairing.verificationUrl)}>
							<ExternalLink className="size-4 mr-1" />
							Reopen page
						</Button>
						<Button variant="ghost" size="sm" onClick={() => void cancel()}>
							Cancel
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
					<p className="text-sm font-medium">Connect an account</p>
					<p className="text-xs text-[var(--text-subtle)]">{message || 'Optional. Arclio works fully offline — an account only adds library sync across your devices.'}</p>
				</div>
			</div>
			<Button size="sm" className="shrink-0" disabled={phase === 'starting'} onClick={() => void connect()}>
				{phase === 'starting' ? <Loader2 className="size-4 mr-1 animate-spin" /> : null}
				{phase === 'failed' ? 'Try again' : 'Connect'}
			</Button>
		</div>
	)
}
