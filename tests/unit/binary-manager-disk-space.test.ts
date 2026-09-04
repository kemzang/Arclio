import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {afterEach, describe, expect, it, vi} from 'vitest'

vi.mock('@main/utils/diskSpace.js', () => ({checkDiskSpace: vi.fn()}))

import {checkDiskSpace} from '@main/utils/diskSpace.js'
import {BinaryManager, type RuntimeBinaryMaterializerPort} from '@main/services/BinaryManager.js'
import type {RuntimeBinaryIndexProvider} from '@main/services/binary/RuntimeBinaryIndexService.js'
import {runtimeBinaryArchFor, runtimeBinaryPlatformFor} from '@shared/runtimeBinaryManifest.js'
import type {DependencyDiagnostic, DependencyId, DependencySource, RuntimeBinaryManifestEntry} from '@shared/types.js'

function entry(): RuntimeBinaryManifestEntry {
	const platform = runtimeBinaryPlatformFor()
	const arch = runtimeBinaryArchFor()
	if (!platform || !arch) throw new Error('unsupported test platform')
	return {id: 'yt-dlp', channel: 'nightly', provider: 'github', version: '2026.06.12', platform, arch, url: 'https://example.invalid/yt-dlp', mirrors: [], size: 50 * 1024 * 1024, sha256: 'a'.repeat(64), format: 'raw', executablePath: 'yt-dlp'}
}

function indexProvider(entries: RuntimeBinaryManifestEntry[]): RuntimeBinaryIndexProvider {
	return {candidatesFor: vi.fn(async id => entries.filter(candidate => candidate.id === id))}
}

function materializer(run: (candidate: RuntimeBinaryManifestEntry) => Promise<string>): RuntimeBinaryMaterializerPort {
	return {materialize: vi.fn(async candidate => ({executablePath: await run(candidate), cacheKey: `${candidate.id}-${candidate.channel}-${candidate.provider}`, metadataPath: '/metadata.json', manifest: candidate}))}
}

function stubProbe(mgr: BinaryManager): void {
	vi.spyOn(mgr as unknown as {probeAndAccept: (id: DependencyId, source: DependencySource, p: string, attempts: unknown[]) => Promise<DependencyDiagnostic | null>}, 'probeAndAccept').mockImplementation(async (id, source, candidatePath, attempts) => {
		attempts.push({source})
		;(mgr as unknown as {resolved: Record<string, string>}).resolved[id] = candidatePath
		return {id, state: 'runnable', source, resolvedPath: candidatePath, attempts: attempts as never}
	})
}

async function tempDir(): Promise<string> {
	return fs.mkdtemp(path.join(os.tmpdir(), 'bm-disk-'))
}

afterEach(() => {
	vi.restoreAllMocks()
})

describe('BinaryManager — disk space preflight for managed binary downloads', () => {
	it('skips materialize() and records a DISK failure when there is not enough free space', async () => {
		vi.mocked(checkDiskSpace).mockResolvedValue({ok: false, freeBytes: 1024, requiredBytes: 50 * 1024 * 1024, error: undefined})
		const mat = materializer(async () => '/managed/yt-dlp')
		const mgr = new BinaryManager(await tempDir(), {runtimeBinaryIndex: indexProvider([entry()]), runtimeBinaryMaterializer: mat})
		stubProbe(mgr)

		const diag = await mgr.resolveYtDlp()

		expect(mat.materialize).not.toHaveBeenCalled()
		expect(diag.state).toBe('failed')
		expect(diag.failure?.kind).toBe('download_failed')
	})

	it('proceeds to materialize() when there is enough free space', async () => {
		vi.mocked(checkDiskSpace).mockResolvedValue({ok: true, freeBytes: 10 * 1024 * 1024 * 1024, requiredBytes: 50 * 1024 * 1024})
		const mat = materializer(async () => '/managed/yt-dlp')
		const mgr = new BinaryManager(await tempDir(), {runtimeBinaryIndex: indexProvider([entry()]), runtimeBinaryMaterializer: mat})
		stubProbe(mgr)

		const diag = await mgr.resolveYtDlp()

		expect(mat.materialize).toHaveBeenCalledOnce()
		expect(diag.state).toBe('runnable')
	})
})
