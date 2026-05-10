// QueueService — authoritative queue-of-record on main. Renderer is a
// read-only projection: it sends commands and receives snapshot + diff
// events. All mutations route through the pure transition() function from
// @shared/queueTransition.
//
// Cap = 1 (single in-flight job by default). 3-second inter-job sleep is
// preserved from the previous renderer-side jobScheduler — gives YouTube's
// rate-limit window a chance to roll over between back-to-back pulls.

import { EventEmitter } from 'node:events';
import log from 'electron-log/main.js';
import { fail, ok, type Result } from '@shared/result.js';
import { createAppError } from '@main/utils/errorFactory.js';
import { nowIso } from '@main/utils/clock.js';
import { QUEUE_STATUS } from '@shared/schemas.js';
import { transition, illegalTransition, type QueueEvent } from '@shared/queueTransition.js';
import { ProgressFormatter, nextMonotonicPercent } from '@shared/progressFormat.js';
import type { ProgressEvent, QueueItem, StatusEvent } from '@shared/types.js';
import type { QueueStore } from '@main/stores/QueueStore.js';
import type { DownloadService } from './DownloadService.js';

const logger = log.scope('queue');

const INTER_JOB_SLEEP_MS = 3000;

interface SchedulerState {
  kind: 'idle' | 'running';
  jobId?: string;
}

export class QueueService extends EventEmitter {
  private items: QueueItem[] = [];
  private scheduler: SchedulerState = { kind: 'idle' };
  private sleepTimer: NodeJS.Timeout | null = null;
  // One ProgressFormatter per running jobId — preserves throttle / spike-suppress
  // state across consecutive progress lines for that job.
  private readonly progressFormatters = new Map<string, ProgressFormatter>();

  constructor(
    private readonly queueStore: QueueStore,
    private readonly downloadService: DownloadService,
    private readonly cap = 1
  ) {
    super();
    // Hook DownloadService events into queue projection.
    this.downloadService.on('status', (event: StatusEvent) => this.consumeStatusEvent(event));
    this.downloadService.on('progress', (event: ProgressEvent) => this.consumeProgressEvent(event));
  }

  async init(): Promise<void> {
    const result = await this.queueStore.load();
    if (!result.ok) {
      logger.error('Queue load failed — starting empty', { error: result.error.message });
      this.items = [];
      return;
    }
    this.items = result.data;
    logger.info('Queue loaded', { count: this.items.length });
  }

  snapshot(): QueueItem[] {
    return [...this.items];
  }

  // commands ---------------------------------------------------------------

  add(toAdd: QueueItem[]): Result<{ ids: string[] }> {
    if (toAdd.length === 0) return ok({ ids: [] });
    const atIdx = this.items.length;
    this.items.push(...toAdd);
    this.persist();
    this.emit('added', { items: toAdd, atIdx });
    this.maybeStartNext();
    return ok({ ids: toAdd.map((i) => i.id) });
  }

  async start(itemId: string): Promise<Result<void>> {
    const item = this.findItem(itemId);
    if (!item) return fail(createAppError('validation', `queue item ${itemId} not found`));
    if (item.status !== QUEUE_STATUS.pending) {
      return fail(createAppError('validation', `cannot start item in status ${item.status}`));
    }
    const result = await this.downloadService.start({ url: item.url, outputDir: item.outputDir, job: item.job });
    if (!result.ok) {
      this.applyEvent(itemId, { kind: 'failed', error: { kind: 'unknown', raw: result.error.message } });
      return fail(result.error);
    }
    this.applyEvent(itemId, { kind: 'started', lastJobId: result.data.job.id });
    this.scheduler = { kind: 'running', jobId: result.data.job.id };
    return ok(undefined);
  }

  async pause(itemId: string): Promise<Result<void>> {
    const item = this.findItem(itemId);
    if (!item) return fail(createAppError('validation', `queue item ${itemId} not found`));

    // Held: pending → paused-held without IPC.
    if (item.status === QUEUE_STATUS.pending) {
      this.applyEvent(itemId, { kind: 'paused-held' });
      return ok(undefined);
    }

    if (item.status !== QUEUE_STATUS.running) {
      return fail(createAppError('validation', `cannot pause item in status ${item.status}`));
    }
    if (!item.lastJobId) return fail(createAppError('validation', 'item has no lastJobId'));

    const pauseResult = await this.downloadService.pause(item.lastJobId);
    if (!pauseResult.ok) return fail(pauseResult.error);
    if (!pauseResult.data.paused) return ok(undefined);

    this.applyEvent(itemId, { kind: 'paused-active', tempDir: pauseResult.data.tempDir });
    // Free scheduler slot — paused jobs don't count against cap.
    if (this.scheduler.kind === 'running' && this.scheduler.jobId === item.lastJobId) {
      this.scheduler = { kind: 'idle' };
      this.maybeStartNext();
    }
    return ok(undefined);
  }

  async resume(itemId: string): Promise<Result<void>> {
    const item = this.findItem(itemId);
    if (!item) return fail(createAppError('validation', `queue item ${itemId} not found`));

    // Held → pending: scheduler picks it up.
    if (item.status === QUEUE_STATUS.pausedHeld) {
      this.applyEvent(itemId, { kind: 'retry-reset' });
      this.maybeStartNext();
      return ok(undefined);
    }

    if (item.status !== QUEUE_STATUS.pausedActive) {
      return fail(createAppError('validation', `cannot resume item in status ${item.status}`));
    }

    // Try in-session resume first; if main has no record (cross-restart),
    // fall back to a fresh start with --continue picking up the .part.
    if (item.lastJobId) {
      const resumeResult = await this.downloadService.resume(item.lastJobId);
      if (resumeResult.ok && resumeResult.data.resumed) {
        this.applyEvent(itemId, { kind: 'resumed' });
        this.scheduler = { kind: 'running', jobId: item.lastJobId };
        return ok(undefined);
      }
    }

    // Fresh start — tempDir is preserved on the QueueItem so DownloadService
    // can be plumbed to use it, but the start() path doesn't accept tempDir
    // today. yt-dlp's --continue will pick up the .part file in outputDir if
    // the user didn't move it.
    const startResult = await this.downloadService.start({ url: item.url, outputDir: item.outputDir, job: item.job });
    if (!startResult.ok) {
      this.applyEvent(itemId, { kind: 'failed', error: { kind: 'unknown', raw: startResult.error.message } });
      return fail(startResult.error);
    }
    this.applyEvent(itemId, { kind: 'started', lastJobId: startResult.data.job.id });
    this.scheduler = { kind: 'running', jobId: startResult.data.job.id };
    return ok(undefined);
  }

  async cancel(itemId: string | null): Promise<Result<void>> {
    if (itemId === null) {
      // Cancel-all: bulk IPC, then mark every running/paused/pending as cancelled.
      await this.downloadService.cancel();
      const ids = this.items.filter((i) => i.status === QUEUE_STATUS.running || i.status === QUEUE_STATUS.pausedActive || i.status === QUEUE_STATUS.pausedHeld || i.status === QUEUE_STATUS.pending).map((i) => i.id);
      for (const id of ids) {
        this.applyEvent(id, { kind: 'cancelled' });
      }
      this.scheduler = { kind: 'idle' };
      this.clearSleepTimer();
      return ok(undefined);
    }

    const item = this.findItem(itemId);
    if (!item) return ok(undefined);

    // Pre-spawn (held / pending): no IPC needed, just transition.
    if (item.status === QUEUE_STATUS.pending || item.status === QUEUE_STATUS.pausedHeld) {
      this.applyEvent(itemId, { kind: 'cancelled' });
      return ok(undefined);
    }

    if (item.lastJobId) {
      await this.downloadService.cancel(item.lastJobId);
    }
    this.applyEvent(itemId, { kind: 'cancelled' });
    if (this.scheduler.kind === 'running' && this.scheduler.jobId === item.lastJobId) {
      this.scheduler = { kind: 'idle' };
      this.maybeStartNext();
    }
    return ok(undefined);
  }

  // eslint-disable-next-line @typescript-eslint/require-await -- Result API is async
  async retry(itemId: string): Promise<Result<void>> {
    const item = this.findItem(itemId);
    if (!item) return fail(createAppError('validation', `queue item ${itemId} not found`));
    if (item.status !== QUEUE_STATUS.error && item.status !== QUEUE_STATUS.cancelled) {
      return fail(createAppError('validation', `cannot retry item in status ${item.status}`));
    }
    this.applyEvent(itemId, { kind: 'retry-reset' });
    this.maybeStartNext();
    return ok(undefined);
  }

  clearCompleted(): Result<void> {
    const idsToRemove = this.items.filter((i) => i.status === QUEUE_STATUS.done || i.status === QUEUE_STATUS.cancelled || i.status === QUEUE_STATUS.error).map((i) => i.id);
    for (const id of idsToRemove) {
      this.removeInternal(id);
    }
    return ok(undefined);
  }

  remove(itemId: string): Result<void> {
    const item = this.findItem(itemId);
    if (!item) return ok(undefined);
    // Active jobs can't be removed without cancelling first — the cancel cmd
    // is the right path for that. paused-held + paused-active can be
    // removed (paused-held has no job; paused-active resume path clears state).
    if (item.status === QUEUE_STATUS.running) {
      return fail(createAppError('validation', 'cannot remove a running item — cancel it first'));
    }
    this.removeInternal(itemId);
    return ok(undefined);
  }

  // event ingestion --------------------------------------------------------

  consumeStatusEvent(event: StatusEvent): void {
    const item = this.findByJobId(event.jobId);
    if (!item) return;
    if (event.stage === 'done') {
      this.progressFormatters.delete(event.jobId);
      this.applyEvent(item.id, {
        kind: 'completed',
        finishedAt: nowIso(),
        lastStatusKey: event.statusKey,
        params: event.params
      });
      if (this.scheduler.kind === 'running' && this.scheduler.jobId === event.jobId) {
        this.scheduler = { kind: 'idle' };
        this.scheduleNext();
      }
      return;
    }
    if (event.stage === 'error') {
      // Cancellation arrives as STATUS_KEY.cancelled — already projected via
      // the cancel command path. Skip a redundant transition.
      this.progressFormatters.delete(event.jobId);
      if (event.statusKey === 'cancelled') return;
      this.applyEvent(item.id, {
        kind: 'failed',
        error: event.error ?? { kind: 'unknown', raw: '' },
        lastStatusKey: event.statusKey,
        params: event.params
      });
      if (this.scheduler.kind === 'running' && this.scheduler.jobId === event.jobId) {
        this.scheduler = { kind: 'idle' };
        this.scheduleNext();
      }
      return;
    }
    // Phase transition — surface as a non-status update so the UI can show
    // "Merging…", "Embedding metadata…", etc. We don't transition status here;
    // we just update lastStatus + progressDetail.
    this.updateItem(item.id, (prev) => ({
      ...prev,
      lastStatus: { key: event.statusKey, params: event.params },
      progressDetail: null
    }));
  }

  consumeProgressEvent(event: ProgressEvent): void {
    const item = this.findByJobId(event.jobId);
    if (!item) return;
    let formatter = this.progressFormatters.get(event.jobId);
    if (!formatter) {
      formatter = new ProgressFormatter();
      this.progressFormatters.set(event.jobId, formatter);
    }
    const detail = formatter.update(event.line);
    this.applyEvent(item.id, {
      kind: 'progress',
      percent: nextMonotonicPercent(item.progressPercent, event.percent),
      ...(detail !== null ? { detail } : {})
    });
  }

  // internals --------------------------------------------------------------

  private applyEvent(itemId: string, evt: QueueEvent): void {
    const idx = this.items.findIndex((i) => i.id === itemId);
    if (idx < 0) return;
    const prev = this.items[idx];
    const illegal = illegalTransition(prev, evt);
    if (illegal) {
      logger.debug('Skipping illegal transition', { itemId, evt: evt.kind, reason: illegal });
      return;
    }
    const next = transition(prev, evt);
    this.items[idx] = next;
    this.persist();
    this.emit('updated', { item: next });
  }

  private updateItem(itemId: string, updater: (item: QueueItem) => QueueItem): void {
    const idx = this.items.findIndex((i) => i.id === itemId);
    if (idx < 0) return;
    this.items[idx] = updater(this.items[idx]);
    this.persist();
    this.emit('updated', { item: this.items[idx] });
  }

  private removeInternal(itemId: string): void {
    const idx = this.items.findIndex((i) => i.id === itemId);
    if (idx < 0) return;
    this.items.splice(idx, 1);
    this.persist();
    this.emit('removed', { itemId });
  }

  private findItem(itemId: string): QueueItem | undefined {
    return this.items.find((i) => i.id === itemId);
  }

  private findByJobId(jobId: string): QueueItem | undefined {
    return this.items.find((i) => i.lastJobId === jobId);
  }

  private persist(): void {
    void this.queueStore.save(this.items).catch((err) => {
      logger.error('Queue persist failed', { error: err instanceof Error ? err.message : String(err) });
    });
  }

  private maybeStartNext(): void {
    if (this.scheduler.kind === 'running') return;
    if (this.runningCount() >= this.cap) return;
    if (this.sleepTimer) return; // already in inter-job sleep
    const next = this.items.find((i) => i.status === QUEUE_STATUS.pending);
    if (!next) return;
    void this.start(next.id).catch((err) => {
      logger.error('Auto-start failed', { itemId: next.id, error: err instanceof Error ? err.message : String(err) });
    });
  }

  private scheduleNext(): void {
    this.clearSleepTimer();
    const hasPending = this.items.some((i) => i.status === QUEUE_STATUS.pending);
    if (!hasPending) return;
    this.sleepTimer = setTimeout(() => {
      this.sleepTimer = null;
      this.maybeStartNext();
    }, INTER_JOB_SLEEP_MS);
  }

  private clearSleepTimer(): void {
    if (this.sleepTimer) {
      clearTimeout(this.sleepTimer);
      this.sleepTimer = null;
    }
  }

  private runningCount(): number {
    return this.items.filter((i) => i.status === QUEUE_STATUS.running).length;
  }
}
