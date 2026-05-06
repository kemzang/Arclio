import type { BrowserWindow } from 'electron';
import log from 'electron-log/main';

import { ok, type Result } from '@shared/result';
import { IPC_CHANNELS } from '@shared/ipc';
import { BLOCKING_DEPENDENCY_IDS, DEPENDENCY_IDS, type DependencyDiagnostic, type DependencyId, type WarmUpOutput, type WarmupProgressEvent } from '@shared/types';
import type { BinaryManager } from './BinaryManager';
import type { TokenService } from './TokenService';

const logger = log.scope('warmup');

interface WarmupServiceDeps {
  binaryManager: BinaryManager;
  tokenService: TokenService;
  window?: BrowserWindow;
  onResolved?: () => void;
}

export class WarmupService {
  private currentRun: Promise<Result<WarmUpOutput>> | null = null;
  private lastResult: Result<WarmUpOutput> | null = null;

  constructor(private readonly deps: WarmupServiceDeps) {}

  getLastResult(): Result<WarmUpOutput> | null {
    return this.lastResult;
  }

  run(opts?: { force?: boolean }): Promise<Result<WarmUpOutput>> {
    if (this.currentRun && !opts?.force) return this.currentRun;
    if (opts?.force) {
      this.deps.binaryManager.invalidateResolved();
    }
    const promise = this.executeRun();
    this.currentRun = promise;
    promise
      .then((result) => {
        this.lastResult = result;
      })
      .catch(() => {
        /* lastResult stays as previous; currentRun cleared below */
      })
      .finally(() => {
        if (this.currentRun === promise) this.currentRun = null;
      });
    return promise;
  }

  private async executeRun(): Promise<Result<WarmUpOutput>> {
    const { binaryManager, tokenService, window, onResolved } = this.deps;

    const emit = (event: WarmupProgressEvent): void => {
      if (!window || window.isDestroyed()) return;
      window.webContents.send(IPC_CHANNELS.warmupProgress, event);
    };

    const resolveOptions = { onProgress: emit };

    const [ytDlpDiag, ffmpegPair, denoDiag] = await Promise.all([
      binaryManager.resolveYtDlp(resolveOptions),
      binaryManager.resolveFFmpegPair(resolveOptions),
      binaryManager.resolveDeno(resolveOptions),
      tokenService.warmUp().catch((err) => {
        logger.warn('Token warmup failed', { error: err instanceof Error ? err.message : String(err) });
      })
    ]);

    const dependencies: Record<DependencyId, DependencyDiagnostic> = {
      'yt-dlp': ytDlpDiag,
      ffmpeg: ffmpegPair.ffmpeg,
      ffprobe: ffmpegPair.ffprobe,
      deno: denoDiag
    };

    const blockingFailures = BLOCKING_DEPENDENCY_IDS.filter((id) => dependencies[id].state !== 'runnable');

    if (blockingFailures.length > 0) {
      logger.warn('Warmup completed with blocking failures', { blockingFailures });
    } else {
      logger.info('Warmup completed');
    }

    onResolved?.();

    // Acknowledge full DEPENDENCY_IDS list to keep linter / future maintainers
    // honest if a new dep id is added without updating the result map.
    const completed = blockingFailures.length === 0;
    const result: WarmUpOutput = { completed, dependencies, blockingFailures: [...blockingFailures] };
    void DEPENDENCY_IDS;
    return ok(result);
  }
}
