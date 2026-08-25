import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {AccountPanel} from '@renderer/components/system/AccountPanel.js'
import {buildMockAppApi} from '../shared/mockAppApi.js'

// The shared builder keeps untouched namespaces in sync with AppApi; the
// account namespace is redeclared here so the assertions can drive it.
const account = {status: vi.fn(), beginPairing: vi.fn(), awaitPairing: vi.fn(), cancelPairing: vi.fn().mockResolvedValue(undefined), disconnect: vi.fn()}
const api = {...buildMockAppApi(), account}

beforeEach(() => {
	vi.clearAllMocks()
	Object.defineProperty(window, 'appApi', {value: api, writable: true, configurable: true})
	account.status.mockResolvedValue({connected: false, canStoreCredentials: true})
	account.cancelPairing.mockResolvedValue(undefined)
})

describe('AccountPanel', () => {
	it('presents connecting as optional, since the app works without an account', async () => {
		render(<AccountPanel />)

		expect(await screen.findByText(/works fully offline/i)).toBeInTheDocument()
		expect(screen.getByRole('button', {name: /connect/i})).toBeEnabled()
	})

	it('shows the pairing code and keeps it on screen while waiting', async () => {
		account.beginPairing.mockResolvedValue({userCode: 'WXYZ-2346', verificationUrl: 'https://example.test/pair', expiresAt: Date.now() + 600_000})
		// Never settles: proves the code stays visible during the wait rather than
		// the UI blocking on the whole pairing.
		account.awaitPairing.mockReturnValue(new Promise(() => {}))
		render(<AccountPanel />)

		fireEvent.click(await screen.findByRole('button', {name: /connect/i}))

		expect(await screen.findByText('WXYZ-2346')).toBeInTheDocument()
		expect(screen.getByText(/waiting for you to approve/i)).toBeInTheDocument()
	})

	it('reports an expired pairing in plain language instead of a raw reason', async () => {
		account.beginPairing.mockResolvedValue({userCode: 'WXYZ-2346', verificationUrl: 'https://example.test/pair', expiresAt: Date.now()})
		account.awaitPairing.mockResolvedValue({ok: false, reason: 'expired'})
		render(<AccountPanel />)

		fireEvent.click(await screen.findByRole('button', {name: /connect/i}))

		expect(await screen.findByText(/expired before it was approved/i)).toBeInTheDocument()
		expect(screen.getByRole('button', {name: /try again/i})).toBeEnabled()
	})

	it('shows the connected account and offers to disconnect', async () => {
		account.status.mockResolvedValue({connected: true, accountEmail: 'a@b.test', deviceId: 'dev-1', canStoreCredentials: true})
		render(<AccountPanel />)

		expect(await screen.findByText(/this device is connected/i)).toBeInTheDocument()
		expect(screen.getByText('a@b.test')).toBeInTheDocument()

		account.disconnect.mockResolvedValue({connected: false, canStoreCredentials: true})
		fireEvent.click(screen.getByRole('button', {name: /disconnect/i}))

		await waitFor(() => expect(account.disconnect).toHaveBeenCalled())
	})

	it('disables connecting when the OS cannot protect a token', async () => {
		// Better to say so than to walk the user through a Google login whose
		// result we could not keep safely.
		account.status.mockResolvedValue({connected: false, canStoreCredentials: false})
		render(<AccountPanel />)

		expect(await screen.findByText(/account unavailable on this system/i)).toBeInTheDocument()
		expect(screen.queryByRole('button', {name: /connect/i})).not.toBeInTheDocument()
	})

	it('never renders a device token even if one leaks into the status', async () => {
		account.status.mockResolvedValue({connected: true, accountEmail: 'a@b.test', deviceId: 'dev-1', canStoreCredentials: true, deviceToken: 'super-secret'} as never)
		const {container} = render(<AccountPanel />)

		await screen.findByText(/this device is connected/i)
		expect(container.textContent).not.toContain('super-secret')
	})
})
