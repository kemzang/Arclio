import type { BrowserWindow } from 'electron';
import log from 'electron-log/main';

import { ok, type Result } from '@shared/result';
import { IPC_CHANNELS } from '@shared/ipc';
import { BLOCKING_DEPENDENCY_IDS, DEPENDENCY_IDS, type DependencyDiagnostic, type DependencyId, type WarmUpOutput, type WarmupProgressEvent } from '@shared/types';
import type { BinaryManager } from './BinaryManager';
import type { TokenService } from './TokenService';

const logger = log.scope('warmup');

// Cap any single binary resolve at this. Unbounded `got` retries on a slow
// CDN can otherwise hang the splash for ~30 minutes — the user has no out
// without a Cancel button. With Cancel + this cap, worst-case wait is ~90s
// per binary before the failure surfaces and the repair UI takes over.
const PER_BINARY_BUDGET_MS = 90_000;

interface WarmupServiceDeps {
  binaryManager: BinaryManager;
  tokenService: TokenService;
  window?: BrowserWindow;
  onResolved?: () => void;
}

export class WarmupService {
  private currentRun: Promise<Result<WarmUpOutput>> | null = null;
  private lastResult: Result<WarmUpOutput> | null = null;
  private currentController: AbortController | null = null;

  constructor(private readonly deps: WarmupServiceDeps) {}

  getLastResult(): Result<WarmUpOutput> | null {
    return this.lastResult;
  }

  cancel(): void {
    this.currentController?.abort();
  }

  run(opts?: { force?: boolean }): Promise<Result<WarmUpOutput>> {
    if (this.currentRun && !opts?.force) return this.currentRun;
    if (opts?.force) {
      this.deps.binaryManager.invalidateResolved();
      // A force-run while another is in flight cancels the in-flight one so
      // its diagnostics aren't overwritten mid-completion by the new run.
      this.currentController?.abort();
    }
    const controller = new AbortController();
    this.currentController = controller;
    const promise = this.executeRun(controller.signal);
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
        if (this.currentController === controller) this.currentController = null;
      });
    return promise;
  }

  private async executeRun(userSignal: AbortSignal): Promise<Result<WarmUpOutput>> {
    const { binaryManager, tokenService, window, onResolved } = this.deps;

    const emit = (event: WarmupProgressEvent): void => {
      if (!window || window.isDestroyed()) return;
      window.webContents.send(IPC_CHANNELS.warmupProgress, event);
    };

    // Per-binary budget combined with user-initiated cancel. AbortSignal.any
    // resolves with whichever fires first.
    const budgetSignal = (): AbortSignal => AbortSignal.any([userSignal, AbortSignal.timeout(PER_BINARY_BUDGET_MS)]);

    const [ytDlpDiag, ffmpegPair, denoDiag] = await Promise.all([
      binaryManager.resolveYtDlp({ onProgress: emit, signal: budgetSignal() }),
      binaryManager.resolveFFmpegPair({ onProgress: emit, signal: budgetSignal() }),
      binaryManager.resolveDeno({ onProgress: emit, signal: budgetSignal() }),
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
    const cancelled = userSignal.aborted;

    if (cancelled) {
      logger.info('Warmup cancelled', { blockingFailures });
    } else if (blockingFailures.length > 0) {
      logger.warn('Warmup completed with blocking failures', { blockingFailures });
    } else {
      logger.info('Warmup completed');
    }

    onResolved?.();

    // Acknowledge full DEPENDENCY_IDS list to keep linter / future maintainers
    // honest if a new dep id is added without updating the result map.
    const completed = !cancelled && blockingFailures.length === 0;
    const result: WarmUpOutput = { completed, dependencies, blockingFailures: [...blockingFailures], cancelled };
    void DEPENDENCY_IDS;
    return ok(result);
  }
}
