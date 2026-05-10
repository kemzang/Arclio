// @vitest-environment node

import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import { QueueService } from '@main/services/QueueService.js';
import { QueueStore } from '@main/stores/QueueStore.js';
import type { DownloadService } from '@main/services/DownloadService.js';
import type { StatusEvent, ProgressEvent } from '@shared/types.js';
import { ok, fail } from '@shared/result.js';
import { createAppError } from '@main/utils/errorFactory.js';
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

  it('cancel-all removes a running item from persisted restart state', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'queue-service-'));
    const store = new QueueStore(dir);
    const ds = new FakeDownloadService();
    ds.cancel.mockResolvedValue({ ok: true, data: { cancelled: true } });
    const qs = new QueueService(store, ds as unknown as DownloadService);

    qs.add([makeItem({ id: 'q-cancel', status: 'running', lastJobId: 'job-cancel' })]);

    const result = await qs.cancel(null);

    expect(result.ok).toBe(true);
    const reloaded = await store.load();
    expect(reloaded.ok).toBe(true);
    if (!reloaded.ok) return;
    expect(reloaded.data).toEqual([]);
  });
});

describe('pauseAll', () => {
  it('pauses all running items', async () => {
    const { qs, ds } = makeService();
    const a = makeItem({ id: 'a', status: 'running', lastJobId: 'job-a' });
    const b = makeItem({ id: 'b', status: 'running', lastJobId: 'job-b' });
    const c = makeItem({ id: 'c', status: 'pending' });
    // eslint-disable-next-line @typescript-eslint/dot-notation
    qs['items'] = [a, b, c];

    ds.pause.mockResolvedValue(ok({ paused: true, tempDir: '/tmp/x' }));
    await qs.pauseAll();

    expect(qs.snapshot().find((i) => i.id === 'a')?.status).toBe('paused-active');
    expect(qs.snapshot().find((i) => i.id === 'b')?.status).toBe('paused-active');
    expect(qs.snapshot().find((i) => i.id === 'c')?.status).toBe('pending'); // untouched
  });

  it('continues pausing remaining items when one fails', async () => {
    const { qs, ds } = makeService();
    const a = makeItem({ id: 'a', status: 'running', lastJobId: 'job-a' });
    const b = makeItem({ id: 'b', status: 'running', lastJobId: 'job-b' });
    // eslint-disable-next-line @typescript-eslint/dot-notation
    qs['items'] = [a, b];

    let callCount = 0;
    ds.pause = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve(fail(createAppError('unknown', 'pause failed')));
      return Promise.resolve(ok({ paused: true, tempDir: '/tmp/y' }));
    });

    await qs.pauseAll();

    expect(qs.snapshot().find((i) => i.id === 'a')?.status).toBe('running'); // failed, stays running
    expect(qs.snapshot().find((i) => i.id === 'b')?.status).toBe('paused-active');
  });

  it('continues pausing remaining items when one throws', async () => {
    const { qs, ds } = makeService();
    const a = makeItem({ id: 'a', status: 'running', lastJobId: 'job-a' });
    const b = makeItem({ id: 'b', status: 'running', lastJobId: 'job-b' });
    // eslint-disable-next-line @typescript-eslint/dot-notation
    qs['items'] = [a, b];

    let callCount = 0;
    ds.pause = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.reject(new Error('unexpected throw'));
      return Promise.resolve(ok({ paused: true, tempDir: '/tmp/z' }));
    });

    await qs.pauseAll();

    expect(qs.snapshot().find((i) => i.id === 'a')?.status).toBe('running');
    expect(qs.snapshot().find((i) => i.id === 'b')?.status).toBe('paused-active');
  });
});
