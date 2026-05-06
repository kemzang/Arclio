import { describe, it, expect, vi } from 'vitest';
import { WarmupService } from '@main/services/WarmupService';
import type { BinaryManager } from '@main/services/BinaryManager';
import type { TokenService } from '@main/services/TokenService';
import type { DependencyDiagnostic, DependencyId } from '@shared/types';

function diag(id: DependencyId, state: DependencyDiagnostic['state']): DependencyDiagnostic {
  return {
    id,
    state,
    source: { kind: 'managed', channel: 'default', url: 'mock' },
    resolvedPath: state === 'runnable' ? `/mock/${id}` : null,
    failure: state === 'failed' ? { kind: 'spawn_failed', message: 'mock' } : undefined,
    attempts: []
  };
}

function fakeBinaryManager(opts: { ytDlp: 'runnable' | 'failed'; ffmpeg: 'runnable' | 'failed'; ffprobe: 'runnable' | 'failed'; deno: 'runnable' | 'failed' }): BinaryManager {
  return {
    invalidateResolved: vi.fn(),
    resolveYtDlp: vi.fn().mockResolvedValue(diag('yt-dlp', opts.ytDlp)),
    resolveFFmpegPair: vi.fn().mockResolvedValue({
      ffmpeg: diag('ffmpeg', opts.ffmpeg),
      ffprobe: diag('ffprobe', opts.ffprobe)
    }),
    resolveDeno: vi.fn().mockResolvedValue(diag('deno', opts.deno))
  } as unknown as BinaryManager;
}

const noopToken = { warmUp: vi.fn().mockResolvedValue(undefined) } as unknown as TokenService;

describe('WarmupService', () => {
  it('returns blockingFailures excluding deno', async () => {
    const bm = fakeBinaryManager({ ytDlp: 'runnable', ffmpeg: 'runnable', ffprobe: 'runnable', deno: 'failed' });
    const svc = new WarmupService({ binaryManager: bm, tokenService: noopToken });
    const result = await svc.run();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.completed).toBe(true);
    expect(result.data.blockingFailures).toEqual([]);
    expect(result.data.dependencies.deno.state).toBe('failed');
  });

  it('flags blocking failures for yt-dlp/ffmpeg/ffprobe', async () => {
    const bm = fakeBinaryManager({ ytDlp: 'failed', ffmpeg: 'runnable', ffprobe: 'runnable', deno: 'runnable' });
    const svc = new WarmupService({ binaryManager: bm, tokenService: noopToken });
    const result = await svc.run();
    if (!result.ok) throw new Error('expected ok');
    expect(result.data.completed).toBe(false);
    expect(result.data.blockingFailures).toEqual(['yt-dlp']);
  });

  it('force-rerun invalidates cached binaries and returns fresh result', async () => {
    const bm = fakeBinaryManager({ ytDlp: 'failed', ffmpeg: 'runnable', ffprobe: 'runnable', deno: 'runnable' });
    const svc = new WarmupService({ binaryManager: bm, tokenService: noopToken });
    await svc.run();
    // After first run: rebind so the second pass returns runnable yt-dlp.
    (bm.resolveYtDlp as ReturnType<typeof vi.fn>).mockResolvedValueOnce(diag('yt-dlp', 'runnable'));
    const second = await svc.run({ force: true });
    expect(bm.invalidateResolved).toHaveBeenCalled();
    if (!second.ok) throw new Error('expected ok');
    expect(second.data.completed).toBe(true);
    expect(second.data.blockingFailures).toEqual([]);
  });

  it('memoizes in-flight runs without force', async () => {
    let resolveYt!: (d: DependencyDiagnostic) => void;
    const ytPromise = new Promise<DependencyDiagnostic>((r) => {
      resolveYt = r;
    });
    const bm = {
      invalidateResolved: vi.fn(),
      resolveYtDlp: vi.fn().mockReturnValue(ytPromise),
      resolveFFmpegPair: vi.fn().mockResolvedValue({ ffmpeg: diag('ffmpeg', 'runnable'), ffprobe: diag('ffprobe', 'runnable') }),
      resolveDeno: vi.fn().mockResolvedValue(diag('deno', 'runnable'))
    } as unknown as BinaryManager;
    const svc = new WarmupService({ binaryManager: bm, tokenService: noopToken });
    const a = svc.run();
    const b = svc.run();
    expect(a).toBe(b);
    resolveYt(diag('yt-dlp', 'runnable'));
    await a;
    expect((bm.resolveYtDlp as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1);
  });
});
