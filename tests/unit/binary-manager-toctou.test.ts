import {createHash} from 'node:crypto'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {BinaryManager, type RuntimeBinaryMaterializerPort} from '@main/services/BinaryManager.js'
import type {RuntimeBinaryIndexProvider} from '@main/services/binary/RuntimeBinaryIndexService.js'
import {runtimeBinaryArchFor, runtimeBinaryPlatformFor} from '@shared/runtimeBinaryManifest.js'
import type {DependencyDiagnostic, DependencyId, DependencySource, RuntimeBinaryManifestEntry} from '@shared/types.js'

function sha256(body: Buffer): string {
	return createHash('sha256').update(body).digest('hex')
}

function entry(body: Buffer, patch: Partial<RuntimeBinaryManifestEntry> = {}): RuntimeBinaryManifestEntry {
	const platform = runtimeBinaryPlatformFor()
	const arch = runtimeBinaryArchFor()
	if (!platform || !arch) throw new Error('unsupported test platform')
	return {id: 'yt-dlp', channel: 'nightly', provider: 'github', version: '2026.06.12', platform, arch, url: 'https://example.invalid/yt-dlp', mirrors: [], size: body.length, sha256: sha256(body), format: 'raw', executablePath: 'yt-dlp', ...patch}
}

function indexProvider(entries: RuntimeBinaryManifestEntry[]): RuntimeBinaryIndexProvider {
	return {candidatesFor: vi.fn(async id => entries.filter(candidate => candidate.id === id))}
}

function materializer(run: (candidate: RuntimeBinaryManifestEntry) => Promise<string>): RuntimeBinaryMaterializerPort {
	return {materialize: vi.fn(async candidate => ({executablePath: await run(candidate), cacheKey: `${candidate.id}-${candidate.channel}-${candidate.provider}`, metadataPath: '/metadata.json', manifest: candidate}))}
}

// Bypasses actually spawning `--version` (the real probe) — mirrors the
// pattern in binary-manager-retry.test.ts. Accepts every candidate and
// records it on `resolved`, exactly like a real successful probe would.
function stubProbe(mgr: BinaryManager): void {
	vi.spyOn(mgr as unknown as {probeAndAccept: (id: DependencyId, source: DependencySource, p: string, attempts: unknown[]) => Promise<DependencyDiagnostic | null>}, 'probeAndAccept').mockImplementation(async (id, source, candidatePath, attempts) => {
		attempts.push({source})
		;(mgr as unknown as {resolved: Record<string, string>}).resolved[id] = candidatePath
		return {id, state: 'runnable', source, resolvedPath: candidatePath, attempts: attempts as never}
	})
}

async function tempDir(): Promise<string> {
	return fs.mkdtemp(path.join(os.tmpdir(), 'bm-toctou-'))
}

afterEach(() => {
	vi.restoreAllMocks()
})

describe('BinaryManager — ensureYtDlp TOCTOU re-verification', () => {
	it('reuses the cached path across calls when the file on disk is unchanged', async () => {
		const dir = await tempDir()
		const filePath = path.join(dir, 'yt-dlp')
		const body = Buffer.from('real yt-dlp binary bytes')
		await fs.writeFile(filePath, body)
		const managed = entry(body)
		const mat = materializer(async () => filePath)
		const mgr = new BinaryManager(await tempDir(), {runtimeBinaryIndex: indexProvider([managed]), runtimeBinaryMaterializer: mat})
		stubProbe(mgr)

		const first = await mgr.ensureYtDlp()
		const second = await mgr.ensureYtDlp()

		expect(first).toBe(filePath)
		expect(second).toBe(filePath)
		expect(mat.materialize).toHaveBeenCalledOnce()
	})

	it('regression: re-resolves instead of trusting a cached path whose file was replaced after first resolution', async () => {
		const dir = await tempDir()
		const filePath = path.join(dir, 'yt-dlp')
		const originalBody = Buffer.from('real yt-dlp binary bytes')
		await fs.writeFile(filePath, originalBody)
		const managed = entry(originalBody)
		const mat = materializer(async () => filePath)
		const mgr = new BinaryManager(await tempDir(), {runtimeBinaryIndex: indexProvider([managed]), runtimeBinaryMaterializer: mat})
		stubProbe(mgr)

		const first = await mgr.ensureYtDlp()
		expect(first).toBe(filePath)
		expect(mat.materialize).toHaveBeenCalledOnce()

		// Simulate the file being swapped out from under the app after the
		// first resolution (tampering, corruption, a second process racing
		// the cache) — same path, different bytes, no longer matching the
		// manifest's sha256.
		await fs.writeFile(filePath, Buffer.from('SWAPPED malicious payload!'))

		const second = await mgr.ensureYtDlp()

		// Without the fix, ensureYtDlp() short-circuits on `this.resolved`
		// and returns the (now tampered) path without ever re-hashing it —
		// materialize() would not be called a second time.
		expect(mat.materialize).toHaveBeenCalledTimes(2)
		expect(second).toBe(filePath)
	})

	it('does not re-verify a path resolved from a manual override (nothing to hash against)', async () => {
		const dir = await tempDir()
		const filePath = path.join(dir, 'yt-dlp')
		await fs.writeFile(filePath, 'anything')
		const mgr = new BinaryManager(await tempDir(), {runtimeBinaryIndex: indexProvider([]), overridesProvider: () => ({ytDlp: filePath})})
		stubProbe(mgr)

		await mgr.ensureYtDlp()
		await fs.writeFile(filePath, 'changed content — should not matter for an override')
		const second = await mgr.ensureYtDlp()

		expect(second).toBe(filePath)
	})
})
