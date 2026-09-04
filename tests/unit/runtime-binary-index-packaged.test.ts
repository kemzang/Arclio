import {generateKeyPairSync, sign} from 'node:crypto'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {app} from 'electron'
import {RuntimeBinaryIndexService} from '@main/services/binary/RuntimeBinaryIndexService.js'
import type {RuntimeBinaryIndex, RuntimeBinaryManifestEntry} from '@shared/types.js'

const entry: RuntimeBinaryManifestEntry = {
	id: 'yt-dlp',
	channel: 'nightly',
	provider: 'github',
	version: '2026.06.12',
	platform: 'linux',
	arch: 'x64',
	url: 'https://github.com/yt-dlp/yt-dlp-nightly-builds/releases/download/2026.06.12/yt-dlp_linux',
	mirrors: [],
	size: 10,
	sha256: 'a'.repeat(64),
	format: 'raw',
	executablePath: 'yt-dlp'
}

function keyPair(): {publicKeyPem: string; privateKeyPem: string} {
	const {publicKey, privateKey} = generateKeyPairSync('ed25519')
	return {publicKeyPem: publicKey.export({type: 'spki', format: 'pem'}).toString(), privateKeyPem: privateKey.export({type: 'pkcs8', format: 'pem'}).toString()}
}

function signed(index: RuntimeBinaryIndex, privateKeyPem: string): {raw: string; signature: string} {
	const raw = JSON.stringify(index)
	return {raw, signature: sign(null, Buffer.from(raw), privateKeyPem).toString('base64')}
}

async function tempDir(): Promise<string> {
	return fs.mkdtemp(path.join(os.tmpdir(), 'runtime-index-packaged-'))
}

afterEach(() => {
	;(app as {isPackaged: boolean}).isPackaged = false
	delete process.env.ARCLIO_RUNTIME_INDEX_URL
	delete process.env.ARCLIO_RUNTIME_INDEX_FILE
	delete process.env.ARCLIO_RUNTIME_INDEX_SIG_FILE
	vi.restoreAllMocks()
})

describe('RuntimeBinaryIndexService — packaged builds ignore override env vars', () => {
	it('regression: ARCLIO_RUNTIME_INDEX_URL is ignored once app.isPackaged is true', async () => {
		process.env.ARCLIO_RUNTIME_INDEX_URL = 'https://attacker.example/runtime-index-v1.json'
		;(app as {isPackaged: boolean}).isPackaged = true

		const keys = keyPair()
		const index: RuntimeBinaryIndex = {schemaVersion: 1, generatedAt: '2026-06-12T00:00:00.000Z', entries: [entry]}
		const payload = signed(index, keys.privateKeyPem)
		const fetchText = vi.fn(async (url: string) => {
			if (url.includes('attacker.example')) throw new Error('must never be reached in a packaged build')
			return url.endsWith('.sig') ? payload.signature : payload.raw
		})

		const svc = new RuntimeBinaryIndexService(await tempDir(), {publicKeyPem: keys.publicKeyPem, remoteSignatureUrl: 'https://updates.example/runtime-index-v1.sig', bundledIndex: {...index, entries: []}, fetchText})

		await expect(svc.candidatesFor('yt-dlp')).resolves.toEqual([entry])
		for (const [url] of fetchText.mock.calls) expect(String(url)).not.toContain('attacker.example')
	})

	it('regression: ARCLIO_RUNTIME_INDEX_FILE (local override) is ignored once app.isPackaged is true', async () => {
		const keys = keyPair()
		// A *validly signed* local override with different entries than the
		// remote index — if the local override were honored, it would verify
		// successfully and win (local takes priority over remote). Using
		// invalid content here would converge to the same result via the
		// remote fallback either way and not actually prove the env var was
		// ignored.
		const localIndex: RuntimeBinaryIndex = {schemaVersion: 1, generatedAt: '2026-06-01T00:00:00.000Z', entries: [{...entry, version: 'local-override', sha256: 'c'.repeat(64)}]}
		const localPayload = signed(localIndex, keys.privateKeyPem)
		const localDir = await tempDir()
		const manifestPath = path.join(localDir, 'runtime-index-v1.json')
		const sigPath = path.join(localDir, 'runtime-index-v1.sig')
		await Promise.all([fs.writeFile(manifestPath, localPayload.raw), fs.writeFile(sigPath, localPayload.signature)])
		// Both JSON and signature paths must be set for the local override to
		// even be attempted (readLocal() ignores JSON-only or sig-only env).
		process.env.ARCLIO_RUNTIME_INDEX_FILE = manifestPath
		process.env.ARCLIO_RUNTIME_INDEX_SIG_FILE = sigPath
		;(app as {isPackaged: boolean}).isPackaged = true

		const remoteIndex: RuntimeBinaryIndex = {schemaVersion: 1, generatedAt: '2026-06-12T00:00:00.000Z', entries: [entry]}
		const remotePayload = signed(remoteIndex, keys.privateKeyPem)
		const fetchText = vi.fn(async (url: string) => (url.endsWith('.sig') ? remotePayload.signature : remotePayload.raw))

		const svc = new RuntimeBinaryIndexService(await tempDir(), {publicKeyPem: keys.publicKeyPem, remoteIndexUrl: 'https://updates.example/runtime-index-v1.json', remoteSignatureUrl: 'https://updates.example/runtime-index-v1.sig', bundledIndex: {...remoteIndex, entries: []}, fetchText})

		// localIndexPath resolves to null (env ignored) — falls straight through
		// to the remote fetch instead of picking up the local override.
		const candidates = await svc.candidatesFor('yt-dlp')
		expect(candidates.some(c => c.version === 'local-override')).toBe(false)
		expect(candidates).toEqual([entry])
	})

	it('honors the same env vars in a dev (non-packaged) build', async () => {
		const localDir = await tempDir()
		const manifestPath = path.join(localDir, 'runtime-index-v1.json')
		const keys = keyPair()
		const index: RuntimeBinaryIndex = {schemaVersion: 1, generatedAt: '2026-06-12T00:00:00.000Z', entries: [entry]}
		const payload = signed(index, keys.privateKeyPem)
		const sigPath = path.join(localDir, 'runtime-index-v1.sig')
		const pubKeyPath = path.join(localDir, 'runtime-index.public.pem')
		await Promise.all([fs.writeFile(manifestPath, payload.raw), fs.writeFile(sigPath, payload.signature), fs.writeFile(pubKeyPath, keys.publicKeyPem)])
		process.env.ARCLIO_RUNTIME_INDEX_FILE = manifestPath

		const fetchText = vi.fn(async () => {
			throw new Error('remote should not be reached — local override should win in dev')
		})
		const svc = new RuntimeBinaryIndexService(await tempDir(), {localSignaturePath: sigPath, localPublicKeyPath: pubKeyPath, remoteIndexUrl: 'https://updates.example/runtime-index-v1.json', remoteSignatureUrl: 'https://updates.example/runtime-index-v1.sig', bundledIndex: {...index, entries: []}, fetchText})

		await expect(svc.candidatesFor('yt-dlp')).resolves.toEqual([entry])
		expect(fetchText).not.toHaveBeenCalled()
	})
})
