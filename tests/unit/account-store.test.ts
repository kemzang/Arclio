import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {afterEach, describe, expect, it} from 'vitest'
import {safeStorage} from 'electron'
import {AccountStore} from '@main/stores/AccountStore.js'

const fake = safeStorage as unknown as {available: boolean}

async function tempStore(): Promise<AccountStore> {
	return new AccountStore(await fs.mkdtemp(path.join(os.tmpdir(), 'account-store-')))
}

afterEach(() => {
	fake.available = true
})

describe('AccountStore', () => {
	it('round-trips the device credentials', async () => {
		const store = await tempStore()

		expect(store.save({deviceToken: 'tok-123', deviceId: 'dev-1', accountEmail: 'a@b.test'})).toBe(true)

		expect(store.load()).toMatchObject({deviceToken: 'tok-123', deviceId: 'dev-1', accountEmail: 'a@b.test'})
	})

	it('never writes the token in the clear', async () => {
		const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'account-store-'))
		const store = new AccountStore(dir)

		store.save({deviceToken: 'super-secret-token', deviceId: 'dev-1'})

		const onDisk = await fs.readFile(path.join(dir, 'account.json'), 'utf8')
		expect(onDisk).not.toContain('super-secret-token')
	})

	it('returns null before anything is paired', async () => {
		expect((await tempStore()).load()).toBeNull()
	})

	it('refuses to persist when the OS cannot encrypt', async () => {
		// A token in effectively-plaintext is worse than asking the user to pair
		// again — the app works fully without an account.
		const store = await tempStore()
		fake.available = false

		expect(store.save({deviceToken: 'tok', deviceId: 'dev'})).toBe(false)
		expect(store.load()).toBeNull()
	})

	it('does not surface a stored token when encryption became unavailable', async () => {
		const store = await tempStore()
		store.save({deviceToken: 'tok', deviceId: 'dev'})
		fake.available = false

		expect(store.load()).toBeNull()
	})

	it('discards an unreadable blob instead of failing forever', async () => {
		// Happens when the keychain entry is gone or the profile moved machines.
		const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'account-store-'))
		await fs.writeFile(path.join(dir, 'account.json'), JSON.stringify({encryptedDeviceToken: Buffer.from('garbage').toString('base64'), deviceId: 'dev-1'}))
		const store = new AccountStore(dir)

		expect(store.load()).toBeNull()
		// Cleared, so the next load is a clean "not paired" rather than a retry.
		expect(store.load()).toBeNull()
		expect(await fs.readFile(path.join(dir, 'account.json'), 'utf8')).not.toContain('garbage')
	})

	it('clears every field on sign-out', async () => {
		const store = await tempStore()
		store.save({deviceToken: 'tok', deviceId: 'dev', accountEmail: 'a@b.test'})

		store.clear()

		expect(store.load()).toBeNull()
	})
})
