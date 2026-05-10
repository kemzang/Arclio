// @vitest-environment node

import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import { QueueService } from '@main/services/QueueService.js';
import type { QueueStore } from '@main/stores/QueueStore.js';
import type { DownloadService } from '@main/services/DownloadService.js';
import type { StatusEvent, ProgressEvent } from '@shared/types.js';
import { makeItem } from '../shared/fixtures.js';

class FakeDownloadService extends EventEmitter {
  start = vi.fn();
  cancel = vi.fn();
  pause = vi.fn();
  resume = vi.fn();
}

function fakeStore(): QueueStore {
  return {
    load: vi.fn().mockResolvedValue({ ok: true, data: [] }),
    save: vi.fn().mockResolvedValue({ ok: true, data: undefined })
  } as unknown as QueueStore;
}

function makeService() {
  const ds = new FakeDownloadService();
  const qs = new QueueService(fakeStore(), ds as unknown as DownloadService);
  return { qs, ds };
}

function doneStatus(jobId: string): StatusEvent {
  return { jobId, stage: 'done', statusKey: 'complete', at: new Date().toISOString() };
}

function errorStatus(jobId: string): StatusEvent {
  return {
    jobId,
    stage: 'error',
    statusKey: 'ytdlpProcessError',
    at: new Date().toISOString(),
    error: { kind: 'unknown', raw: 'yt-dlp exited 1' }
  };
}

function progressEvent(jobId: string, percent: number): ProgressEvent {
  return { jobId, percent, line: `${percent}%`, at: new Date().toISOString() };
}

describe('QueueService — downloadService listener path', () => {
  it('downloadService emitting status done → item status=done, progressPercent=100', () => {
    const { qs, ds } = makeService();
    qs.add([makeItem({ id: 'q-1', status: 'running', lastJobId: 'job-1' })]);

    ds.emit('status', doneStatus('job-1'));

    const [item] = qs.snapshot();
    expect(item.status).toBe('done');
    expect(item.progressPercent).toBe(100);
  });

  it('downloadService emitting status error → item status=error', () => {
    const { qs, ds } = makeService();
    qs.add([makeItem({ id: 'q-2', status: 'running', lastJobId: 'job-2' })]);

    ds.emit('status', errorStatus('job-2'));

    const [item] = qs.snapshot();
    expect(item.status).toBe('error');
    expect(item.error).not.toBeNull();
  });

  it('downloadService emitting progress → item progressPercent updated', () => {
    const { qs, ds } = makeService();
    qs.add([makeItem({ id: 'q-3', status: 'running', lastJobId: 'job-3' })]);

    ds.emit('progress', progressEvent('job-3', 67));

    const [item] = qs.snapshot();
    expect(item.progressPercent).toBe(67);
  });
});
