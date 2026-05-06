import type { BrowserWindow } from 'electron';
import log from 'electron-log/main';

const logger = log.scope('warmup');
import { ok, type Result } from '@shared/result';
import { IPC_CHANNELS } from '@shared/ipc';
import type { WarmUpOutput, WarmupProgressEvent } from '@shared/types';
import type { BinaryManager } from './BinaryManager';
import type { TokenService } from './TokenService';

interface WarmupServiceDeps {
  binaryManager: BinaryManager;
  tokenService: TokenService;
  window?: BrowserWindow;
}

export class WarmupService {
  private warmUpPromise: Promise<Result<WarmUpOutput>> | null = null;

  constructor(private readonly deps: WarmupServiceDeps) {}

  run(): Promise<Result<WarmUpOutput>> {
    const { binaryManager, tokenService, window } = this.deps;

    function emit(event: WarmupProgressEvent): void {
      if (!window || window.isDestroyed()) return;
      window.webContents.send(IPC_CHANNELS.warmupProgress, event);
    }

    function progressFor(binary: string) {
      return (downloaded: number, total: number | undefined): void => {
        emit({ binary, phase: 'downloading', bytesDownloaded: downloaded, totalBytes: total });
      };
    }

    this.warmUpPromise ??= (async (): Promise<Result<WarmUpOutput>> => {
      const fast = Promise.allSettled([binaryManager.ensureYtDlp(undefined, progressFor('yt-dlp')).finally(() => emit({ binary: 'yt-dlp', phase: 'done', bytesDownloaded: 0, totalBytes: undefined })), binaryManager.ensureFFmpeg(undefined, progressFor('ffmpeg')).finally(() => emit({ binary: 'ffmpeg', phase: 'done', bytesDownloaded: 0, totalBytes: undefined })), tokenService.warmUp()]);

      const zips = (async (): Promise<PromiseSettledResult<unknown>[]> => {
        const results: PromiseSettledResult<unknown>[] = [];
        for (const [binary, task] of [['ffprobe', () => binaryManager.ensureFFprobe(undefined, progressFor('ffprobe'))] as const, ['deno', () => binaryManager.ensureDeno(undefined, progressFor('deno'))] as const]) {
          try {
            results.push({ status: 'fulfilled', value: await task() });
            emit({ binary, phase: 'done', bytesDownloaded: 0, totalBytes: undefined });
          } catch (err) {
            results.push({ status: 'rejected', reason: err });
          }
        }
        return results;
      })();

      const [fastResults, zipResults] = await Promise.all([fast, zips]);
      const failures = [...fastResults, ...zipResults].flatMap((result) => {
        if (result.status === 'fulfilled') return [];
        return result.reason instanceof Error ? [result.reason.message] : [String(result.reason)];
      });

      if (failures.length > 0) {
        logger.warn('Warmup completed with failures', { failures });
      } else {
        logger.info('Warmup completed');
      }

      return ok({ completed: true, failures });
    })();

    return this.warmUpPromise;
  }
}
