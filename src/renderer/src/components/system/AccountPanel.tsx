import {useCallback, useEffect, useState} from 'react'
import {Check, Copy, ExternalLink, Loader2, LogOut, RefreshCw, ShieldAlert} from 'lucide-react'
import type {AccountStatus, PairingHandle, SyncOutcome} from '@shared/api.js'
import {Button} from '../ui/button.js'

type Phase = 'idle' | 'starting' | 'waiting' | 'failed'

const FAILURE_MESSAGE: Record<string, string> = {expired: 'The code expired before it was approved. Start again.', denied: 'That request was declined in the browser.', cancelled: 'Connection cancelled.', failed: 'Something went wrong while connecting. Please try again.'}

/** Turns a sync result into something worth reading, rather than a status code. */
function describeSync(outcome: SyncOutcome | null): string {
	if (!outcome) return 'Runs automatically in the background, and whenever you ask.'
	if (outcome.status === 'ok') {
		if (outcome.pulled === 0 && outcome.pushed === 0 && outcome.deleted === 0) return 'Already up to date.'
		const parts = [outcome.pulled > 0 ? `${outcome.pulled} received` : '', outcome.pushed > 0 ? `${outcome.pushed} sent` : '', outcome.deleted > 0 ? `${outcome.deleted} removed` : ''].filter(Boolean)
		return parts.join(' · ')
	}
	if (outcome.status === 'requires-plan') {
		return outcome.reason === 'device_limit' ? 'Free accounts sync one device. Upgrade to Pro to sync this one too.' : 'Your plan does not cover syncing this device.'
	}
	if (outcome.status === 'unauthorized') return 'This device was disconnected from your account. Connect it again.'
	if (outcome.status === 'failed') return 'Last sync failed. It will try again on its own.'
	return 'Connect an account to sync.'
}

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
	const [syncing, setSyncing] = useState(false)
	const [syncOutcome, setSyncOutcome] = useState<SyncOutcome | null>(null)

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

	const runSync = useCallback(async () => {
		setSyncing(true)
		try {
			setSyncOutcome(await window.appApi.sync.now())
		} finally {
			setSyncing(false)
		}
	}, [])

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
			<div className="space-y-4">
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

				<div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-[var(--border)] bg-card">
					<div className="flex items-start gap-3 min-w-0">
						<RefreshCw className="size-5 mt-0.5 text-[var(--text-subtle)] shrink-0" />
						<div className="min-w-0">
							<p className="text-sm font-medium">Library sync</p>
							<p className="text-xs text-[var(--text-subtle)]">{describeSync(syncOutcome)}</p>
						</div>
					</div>
					<Button variant="outline" size="sm" className="shrink-0" disabled={syncing} onClick={() => void runSync()}>
						{syncing ? <Loader2 className="size-4 mr-1 animate-spin" /> : <RefreshCw className="size-4 mr-1" />}
						Sync now
					</Button>
				</div>
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
