import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';
import { stat } from 'node:fs/promises';
import { type ChildProcessWithoutNullStreams } from 'node:child_process';
import log from 'electron-log/main.js';
import { trackMain, downloadDurationBucket, sizeBucket } from '@main/services/analytics.js';
import { phasesFor, PhaseExecutor } from './phases/index.js';
import type { PhaseContext } from './phases/index.js';
import { nowIso } from '@main/utils/clock.js';
import { createAppError } from '@main/utils/errorFactory.js';
import { fail, ok, type Result } from '@shared/result.js';
import { STATUS_KEY } from '@shared/schemas.js';
import type { CancelDownloadOutput, DownloadJob, LocalizedError, PauseDownloadOutput, RecentJob, StartDownloadInput, StartDownloadOutput, StatusEvent, StatusKey } from '@shared/types.js';
import type { RecentJobsStore } from '@main/stores/RecentJobsStore.js';
import { YtDlp, type YtDlpResult } from './YtDlp.js';
import { isPostprocessFailure } from '@shared/ytdlp/errors.js';
import { checkDiskSpace } from '@main/utils/diskSpace.js';
import type { ActiveDownload, PausedDownload } from './phases/index.js';
import { killActiveProcesses } from './download/processControl.js';
import { cleanupPartFiles, cleanupTempDirByPath } from './download/cleanup.js';
import { ProgressParser } from './download/progressParser.js';

const logger = log.scope('downloads');

// Max concurrent downloads — defense-in-depth at the service boundary. The
// renderer's job scheduler already serializes one-at-a-time, but a buggy IPC
// burst or a future change to that policy could otherwise spawn N parallel
// yt-dlp + ffmpeg processes and thrash a 4-core machine. Tunable via the
// constructor for tests and (eventually) a settings override.
const DEFAULT_MAX_CONCURRENT_DOWNLOADS = 4;

export class DownloadService extends EventEmitter {
  private activeJobs = new Map<string, ActiveDownload>();
  private pausedJobs = new Map<string, PausedDownload>();
  private readonly maxConcurrent: number;
  private readonly progressParser: ProgressParser;

  constructor(
    private readonly ytDlp: YtDlp,
    private readonly recentJobsStore: RecentJobsStore,
    private readonly mockMode = false,
    maxConcurrent: number = DEFAULT_MAX_CONCURRENT_DOWNLOADS
  ) {
    super();
    this.maxConcurrent = Math.max(1, maxConcurrent);
    this.progressParser = new ProgressParser(
      (jobId, stage, statusKey, params, error) => this.emitStatus(jobId, stage, statusKey, params, error),
      (event) => this.emit('progress', event)
    );
  }

  get activeCount(): number {
    return this.activeJobs.size;
  }

  get runningJobCount(): number {
    let count = 0;
    for (const active of this.activeJobs.values()) {
      if (!active.cancelRequested && !active.pauseRequested) count++;
    }
    return count;
  }

  async start(input: StartDownloadInput): Promise<Result<StartDownloadOutput>> {
    if (!input.outputDir) {
      return fail(createAppError('validation', 'outputDir is required'));
    }
    // Boundary check — counts only jobs not yet in cancel/pause-requested
    // state. A paused job consumes no process slot, so resume() is unaffected.
    if (this.runningJobCount >= this.maxConcurrent) {
      return fail(createAppError('validation', `Maximum concurrent downloads (${this.maxConcurrent}) reached. Pause or cancel one before starting another.`));
    }
    const now = nowIso();
    const preparedJob = input.job;
    const expectedBytes = preparedJob.kind === 'single-format' ? preparedJob.expectedBytes : undefined;
    const job: DownloadJob = {
      id: randomUUID(),
      url: input.url,
      outputDir: input.outputDir,
      expectedBytes,
      status: 'running',
      createdAt: now,
      updatedAt: now
    };
    const active: ActiveDownload = {
      job,
      input,
      cancelRequested: false,
      pauseRequested: false,
      subtitlePaths: []
    };
    this.activeJobs.set(job.id, active);
    logger.info('Download job created', {
      jobId: job.id,
      url: job.url,
      outputDir: job.outputDir,
      kind: preparedJob.kind
    });
    const hasSubs = preparedJob.kind !== 'subtitle-only' ? Boolean(preparedJob.subtitles?.languages.length) : true;
    const hasSponsorBlock = preparedJob.kind !== 'subtitle-only' && preparedJob.sponsorBlock.mode !== 'off';
    const embedMetadata = preparedJob.kind !== 'subtitle-only' && preparedJob.embed.metadata;
    const embedThumbnail = preparedJob.kind !== 'subtitle-only' && preparedJob.embed.thumbnail;
    trackMain('download_started', {
      preset: preparedJob.kind,
      has_subtitles: hasSubs,
      has_sponsorblock: hasSponsorBlock,
      cookies_mode: input.cookiesMode ?? 'off',
      embed_metadata: embedMetadata,
      embed_thumbnail: embedThumbnail
    });
    return this.runJob(active);
  }

  async resume(jobId: string): Promise<Result<{ resumed: boolean; job?: DownloadJob }>> {
    const paused = this.pausedJobs.get(jobId);
    if (!paused) {
      logger.info('resume() called but no paused job found', { jobId });
      return ok({ resumed: false });
    }

    this.pausedJobs.delete(jobId);
    const { job, input } = paused;
    job.status = 'running';
    job.updatedAt = nowIso();
    // Validate the preserved tempDir still exists. OS tmp cleaners, NFS
    // unmounts, and manual deletes can wipe it between pause and resume.
    // Setting tempDir to undefined makes VideoPhase's setupTempDir() recreate
    // it fresh — partial download is lost, but the job runs cleanly instead
    // of failing with an opaque ENOENT inside yt-dlp.
    let resumedTempDir = paused.tempDir;
    if (resumedTempDir) {
      try {
        const s = await stat(resumedTempDir);
        if (!s.isDirectory()) resumedTempDir = undefined;
      } catch {
        logger.info('Resume: preserved tempDir missing — restarting fresh', {
          jobId: job.id,
          tempDir: paused.tempDir
        });
        resumedTempDir = undefined;
      }
    }
    const active: ActiveDownload = {
      job,
      input,
      cancelRequested: false,
      pauseRequested: false,
      subtitlePaths: [],
      tempDir: resumedTempDir
    };
    this.activeJobs.set(job.id, active);
    logger.info('Resuming download', { jobId: job.id });

    const result = await this.runJob(active);
    if (!result.ok) {
      if (active.cancelRequested) return ok({ resumed: false });
      return fail(result.error);
    }
    return ok({ resumed: true, job: result.data.job });
  }

  private async runJob(active: ActiveDownload): Promise<Result<StartDownloadOutput>> {
    const { job } = active;
    try {
      this.emitStatus(job.id, 'setup', STATUS_KEY.preparingBinaries);
      await this.ytDlp.prepare((statusKey, params) => {
        this.emitStatus(job.id, 'setup', statusKey, params);
      });

      if (active.cancelRequested) {
        logger.info('Download cancelled before binary setup completed', {
          jobId: job.id
        });
        this.emitStatus(job.id, 'error', STATUS_KEY.cancelled);
        await this.finalize(job, 'cancelled');
        return fail(createAppError('download', 'Download cancelled before start'));
      }

      if (this.mockMode) {
        this.emitStatus(job.id, 'token', STATUS_KEY.mintingToken);
        this.emitStatus(job.id, 'download', STATUS_KEY.startingYtdlp);
        this.startMockDownload(job.id);
        return ok({ job });
      }

      void this.runPhases(active).catch(async (error) => {
        const message = error instanceof Error ? error.message : 'Unknown phase failure';
        logger.error('Download phase threw unexpectedly', { jobId: job.id, message });
        const payload: LocalizedError = { kind: 'unknown', raw: message };
        this.emitStatus(job.id, 'error', STATUS_KEY.unknownStartupFailure, undefined, payload);
        await this.finalize(job, 'failed', payload);
      });

      return ok({ job });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown download startup failure';
      const payload: LocalizedError = { kind: 'unknown', raw: message };
      this.emitStatus(job.id, 'error', STATUS_KEY.unknownStartupFailure, undefined, payload);
      await this.finalize(job, 'failed', payload);
      return fail(createAppError('download', message));
    }
  }

  private async runPhases(active: ActiveDownload): Promise<void> {
    const { job, input } = active;
    const ctx: PhaseContext = {
      active,
      ytDlp: this.ytDlp,
      emitStatus: (stage, statusKey, params?, error?) => this.emitStatus(job.id, stage, statusKey, params, error),
      emitYtdlpFailure: (result) => this.emitYtdlpFailure(job, result),
      attachYtDlpProcess: (proc, statusKey?) => this.attachYtDlpProcess(active, proc, statusKey),
      safeConsume: (text) => this.safeConsume(active, text),
      cleanupPartFiles: (dir) => this.cleanupPartFiles(dir),
      cleanupTempDir: () => this.cleanupTempDir(active),
      finalize: (status, err?) => this.finalize(job, status, err),
      moveToPaused: () => {
        // Cancel may have landed between pauseRequested and the phase reaching
        // this callback. Honor the more recent intent: don't park a job in
        // pausedJobs after cancel was requested — processes are already dead
        // and finalize() will run via the cancelled outcome.
        if (active.cancelRequested) {
          logger.info('moveToPaused skipped — cancel requested mid-pause', { jobId: job.id });
          return;
        }
        this.activeJobs.delete(job.id);
        this.pausedJobs.set(job.id, { job, input, tempDir: active.tempDir });
        logger.info('Download paused — temp dir preserved', {
          jobId: job.id,
          tempDir: active.tempDir
        });
      }
    };
    await new PhaseExecutor().run(ctx, phasesFor(input));
  }

  private attachYtDlpProcess(active: ActiveDownload, proc: ChildProcessWithoutNullStreams, statusKey?: StatusKey): void {
    if (statusKey) this.emitStatus(active.job.id, 'download', statusKey);
    active.ytDlpProcess = proc;
    if (active.cancelRequested) proc.kill('SIGKILL');
  }

  private safeConsume(active: ActiveDownload, text: string): void {
    try {
      this.consumeProgress(active, text);
    } catch (err) {
      logger.warn('consumeProgress threw', {
        jobId: active.job.id,
        message: err instanceof Error ? err.message : String(err)
      });
    }
  }

  private async emitYtdlpFailure(job: DownloadJob, result: Exclude<YtDlpResult, { kind: 'success' }>): Promise<LocalizedError> {
    const jobId = job.id;
    if (result.kind === 'spawn-error') {
      const payload: LocalizedError = { kind: 'unknown', raw: result.error.message };
      this.emitStatus(jobId, 'error', STATUS_KEY.ytdlpProcessError, { error: result.error.message }, payload);
      return payload;
    }
    // yt-dlp masks ffmpeg's stderr in non-verbose mode, so an ENOSPC during
    // merge surfaces only as "Postprocessing: Conversion failed!". Probe the
    // output dir on a postprocess failure and upgrade the kind to
    // outOfDiskSpace if the probe confirms ENOSPC.
    let kind = result.errorKind;
    if (kind === 'postprocessFailure' && isPostprocessFailure(result.rawError)) {
      const probe = await checkDiskSpace(job.outputDir, undefined);
      if (!probe.ok && probe.error === undefined && probe.freeBytes !== undefined) {
        kind = 'outOfDiskSpace';
        logger.info('Reclassified postprocess failure as outOfDiskSpace', {
          jobId,
          outputDir: job.outputDir,
          freeBytes: probe.freeBytes
        });
      } else if (probe.error !== undefined) {
        logger.info('Postprocess failure: disk probe inconclusive', {
          jobId,
          outputDir: job.outputDir,
          probeError: probe.error
        });
      }
    }
    const payload: LocalizedError = {
      kind,
      raw: result.rawError ?? ''
    };
    if (kind === 'unknown' && result.rawError) {
      this.emitStatus(jobId, 'error', STATUS_KEY.ytdlpProcessError, { error: result.rawError }, payload);
    } else {
      this.emitStatus(jobId, 'error', STATUS_KEY.ytdlpExitCode, { code: result.exitCode }, payload);
    }
    return payload;
  }

  async cancel(jobId?: string): Promise<Result<CancelDownloadOutput>> {
    if (jobId) {
      const active = this.activeJobs.get(jobId);
      if (active) {
        logger.info('Cancelling active job', { jobId });
        return this.cancelOne(active);
      }

      const paused = this.pausedJobs.get(jobId);
      if (paused) {
        logger.info('Cancelling paused job — cleaning up temp dir and .part files', {
          jobId,
          outputDir: paused.job.outputDir
        });
        this.pausedJobs.delete(jobId);
        if (paused.tempDir) await this.cleanupTempDirByPath(paused.tempDir);
        await this.cleanupPartFiles(paused.job.outputDir);
        return ok({ cancelled: true });
      }

      logger.info('cancel() called but no job found', { jobId });
      return ok({ cancelled: false });
    }

    const hadJobs = this.activeJobs.size > 0 || this.pausedJobs.size > 0;
    logger.info('Cancelling all jobs', {
      activeCount: this.activeJobs.size,
      pausedCount: this.pausedJobs.size
    });
    await Promise.all([...this.activeJobs.values()].map((a) => this.cancelOne(a)));
    for (const paused of this.pausedJobs.values()) {
      if (paused.tempDir) await this.cleanupTempDirByPath(paused.tempDir);
      await this.cleanupPartFiles(paused.job.outputDir);
    }
    this.pausedJobs.clear();
    return ok({ cancelled: hadJobs });
  }

  // eslint-disable-next-line @typescript-eslint/require-await -- IPC handler signature requires Promise
  async pause(jobId?: string): Promise<Result<PauseDownloadOutput>> {
    const active = jobId ? this.activeJobs.get(jobId) : [...this.activeJobs.values()][0];
    if (!active) {
      logger.info('pause() called but no active job found', { jobId });
      return ok({ paused: false });
    }

    logger.info('Pausing download', { jobId: active.job.id });

    if (active.mockTimer) {
      clearInterval(active.mockTimer);
      active.mockTimer = undefined;
      this.activeJobs.delete(active.job.id);
      this.pausedJobs.set(active.job.id, { job: active.job, input: active.input });
      logger.info('Mock download paused', { jobId: active.job.id });
      return ok({ paused: true });
    }

    if (!active.ytDlpProcess && !active.ffmpegProcess) {
      logger.info('pause() called but job has no process yet', {
        jobId: active.job.id
      });
      return ok({ paused: false });
    }

    active.pauseRequested = true;
    // killActiveProcesses tree-kills both yt-dlp and ffmpeg (when present)
    // via process-group on Unix and taskkill /T on Windows. Pause may land
    // mid-mux (SidecarSubsPhase.runEmbedMux); without killing ffmpeg too, the
    // mux completes after the user thinks they paused.
    killActiveProcesses(active, 'SIGTERM');
    logger.info('SIGTERM sent to active processes', { jobId: active.job.id });
    return ok({ paused: true });
  }

  private async cancelOne(active: ActiveDownload): Promise<Result<CancelDownloadOutput>> {
    active.cancelRequested = true;

    if (active.ytDlpProcess || active.ffmpegProcess) {
      logger.info('Sending SIGKILL to active processes', { jobId: active.job.id });
      killActiveProcesses(active, 'SIGKILL');
      return ok({ cancelled: true });
    }

    if (active.mockTimer) {
      const { job } = active;
      logger.info('Clearing mock download timer', { jobId: job.id });
      clearInterval(active.mockTimer);
      active.mockTimer = undefined;
      await this.cleanupPartFiles(job.outputDir);
      await this.finalize(job, 'cancelled');
      this.emitStatus(job.id, 'error', STATUS_KEY.cancelled);
      return ok({ cancelled: true });
    }

    logger.info('cancelOne() — job had no process or timer (pre-spawn cancel)', {
      jobId: active.job.id
    });
    return ok({ cancelled: true });
  }

  async cleanupPartFiles(outputDir: string): Promise<void> {
    await cleanupPartFiles(outputDir);
  }

  private async cleanupTempDir(active: ActiveDownload): Promise<void> {
    if (active.tempDir) await cleanupTempDirByPath(active.tempDir);
  }

  private async cleanupTempDirByPath(tempDir: string): Promise<void> {
    await cleanupTempDirByPath(tempDir);
  }

  private consumeProgress(active: ActiveDownload, text: string): void {
    this.progressParser.consume(active, text);
  }

  private emitStatus(jobId: string, stage: StatusEvent['stage'], statusKey: StatusKey, params?: Record<string, string | number>, error?: LocalizedError): void {
    const event: StatusEvent = {
      jobId,
      stage,
      statusKey,
      params,
      error,
      at: nowIso()
    };
    this.emit('status', event);
    if (stage === 'error') logger.error(statusKey, { jobId, stage, params });
    else logger.info(statusKey, { jobId, stage, params });
  }

  private async finalize(job: DownloadJob, status: RecentJob['status'], error?: LocalizedError): Promise<void> {
    logger.info('Job finalized', { jobId: job.id, status, ...(error && { error }) });
    this.activeJobs.delete(job.id);

    job.status = status;
    job.updatedAt = nowIso();

    const durationMs = new Date(job.updatedAt).getTime() - new Date(job.createdAt).getTime();
    if (status === 'completed') {
      trackMain('download_finished', {
        duration_bucket: downloadDurationBucket(durationMs),
        ...(job.expectedBytes != null ? { size_bucket: sizeBucket(job.expectedBytes) } : {})
      });
    } else if (status === 'cancelled') {
      trackMain('download_cancelled', {
        duration_bucket: downloadDurationBucket(durationMs)
      });
    } else {
      trackMain('download_failed', {
        duration_bucket: downloadDurationBucket(durationMs),
        error_category: error?.kind ?? 'unknown',
        ...(job.expectedBytes != null ? { size_bucket: sizeBucket(job.expectedBytes) } : {})
      });
    }

    const recent: RecentJob = {
      id: job.id,
      url: job.url,
      outputDir: job.outputDir,
      formatId: job.formatId,
      status,
      finishedAt: job.updatedAt,
      error
    };

    await this.recentJobsStore.push(recent);
  }

  private startMockDownload(jobId: string): void {
    const active = this.activeJobs.get(jobId);
    if (!active) return;
    let percent = 0;

    const timer = setInterval(() => {
      percent += 10;

      const line = `[download] ${percent.toFixed(1)}% of ~10MiB at 1.2MiB/s ETA 00:0${Math.max(0, 10 - percent / 10)}`;
      this.consumeProgress(active, line);

      if (percent >= 100) {
        clearInterval(timer);
        this.emitStatus(jobId, 'done', STATUS_KEY.complete);
        void this.finalize(active.job, 'completed');
      }
    }, 250);

    active.mockTimer = timer;
  }
}
