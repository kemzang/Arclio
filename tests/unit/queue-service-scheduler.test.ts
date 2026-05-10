// @vitest-environment node

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'node:events';
import { QueueService } from '@main/services/QueueService.js';
import type { DownloadService } from '@main/services/DownloadService.js';
import type { QueueStore } from '@main/stores/QueueStore.js';
import { ok } from '@shared/result.js';
import { makeItem } from '../shared/fixtures.js';

class FakeDownloadService extends EventEmitter {
  start = vi.fn();
  cancel = vi.fn();
  pause = vi.fn();
  resume = vi.fn();
}

function fakeStore(): QueueStore {
  return {
    load: vi.fn().mockResolvedValue(ok([])),
    save: vi.fn().mockResolvedValue(ok(undefined))
  } as unknown as QueueStore;
}

function makeService() {
  const ds = new FakeDownloadService();
  const qs = new QueueService(fakeStore(), ds as unknown as DownloadService);
  return { qs, ds };
}

function jobResult(jobId = 'job-1') {
  return ok({ job: { id: jobId, url: '', outputDir: '/tmp', status: 'running', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } });
}

function doneEvent(jobId: string) {
  return { jobId, stage: 'done' as const, statusKey: 'complete' as const, at: new Date().toISOString() };
}

// Flush pending promise continuations (does not advance fake timers).
// Needed because maybeStartNext() uses `void this.start()` which is async.
async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe('QueueService — auto-start on add', () => {
  it('adds a pending item → auto-starts it', async () => {
    const { qs, ds } = makeService();
    ds.start.mockResolvedValue(jobResult());

    qs.add([makeItem({ id: 'a', status: 'pending' })]);

    await vi.waitFor(() => expect(ds.start).toHaveBeenCalledOnce());
    expect(qs.snapshot()[0].status).toBe('running');
  });

  it('does not start when cap=1 already running', async () => {
    const { qs, ds } = makeService();

    qs.add([makeItem({ id: 'a', status: 'running', lastJobId: 'job-0' })]);
    qs.add([makeItem({ id: 'b', status: 'pending' })]);

    await flushMicrotasks();
    expect(ds.start).not.toHaveBeenCalled();
  });

  it('does not start more than cap=1 items simultaneously', async () => {
    const { qs, ds } = makeService();

    // Make the first start hang so the second add races against it.
    let resolveFirst: (() => void) | null = null;
    ds.start.mockImplementationOnce(
      () =>
        new Promise<ReturnType<typeof jobResult>>((res) => {
          resolveFirst = () => res(jobResult('job-1'));
        })
    );
    ds.start.mockResolvedValue(jobResult('job-2'));

    qs.add([makeItem({ id: 'a', status: 'pending' }), makeItem({ id: 'b', status: 'pending' })]);

    await flushMicrotasks();

    // First item has claimed the scheduler slot even before start resolves
    // (scheduler is set synchronously at the top of start()).
    expect(ds.start).toHaveBeenCalledOnce();

    resolveFirst!();
    await flushMicrotasks();
    // b starts after a's start resolves and the scheduler is updated
  });
});

describe('QueueService — inter-job sleep', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('does not start next item immediately on done — waits for sleep timer', async () => {
    const { qs, ds } = makeService();

    ds.start.mockResolvedValueOnce(jobResult('job-1')).mockResolvedValue(jobResult('job-2'));

    qs.add([makeItem({ id: 'a', status: 'pending' }), makeItem({ id: 'b', status: 'pending' })]);

    // Flush the auto-start of item a (void this.start() is async).
    await flushMicrotasks();
    expect(ds.start).toHaveBeenCalledOnce();

    // Emit done for job-1 → scheduleNext() fires, sets sleep timer.
    ds.emit('status', doneEvent('job-1'));

    // b still pending — timer not yet fired.
    expect(ds.start).toHaveBeenCalledOnce();
    expect(qs.snapshot().find((i) => i.id === 'b')?.status).toBe('pending');

    // Advance past the 3000ms inter-job sleep.
    await vi.advanceTimersByTimeAsync(3100);
    await flushMicrotasks();

    expect(ds.start).toHaveBeenCalledTimes(2);
    expect(qs.snapshot().find((i) => i.id === 'b')?.status).toBe('running');
  });

  it('cancel-all clears the sleep timer so no job starts after cancel', async () => {
    const { qs, ds } = makeService();

    ds.cancel.mockResolvedValue(ok({ cancelled: true }));
    ds.start.mockResolvedValueOnce(jobResult('job-1')).mockResolvedValue(jobResult('job-2'));

    qs.add([makeItem({ id: 'a', status: 'pending' }), makeItem({ id: 'b', status: 'pending' })]);

    await flushMicrotasks();
    expect(ds.start).toHaveBeenCalledOnce();

    // Emit done → sleep timer starts.
    ds.emit('status', doneEvent('job-1'));

    // Cancel all before timer fires.
    await qs.cancel(null);

    // Advance well past sleep.
    await vi.advanceTimersByTimeAsync(5000);
    await flushMicrotasks();

    // No second start — cancel cleared the timer and item b is cancelled.
    expect(ds.start).toHaveBeenCalledOnce();
    expect(qs.snapshot().find((i) => i.id === 'b')?.status).toBe('cancelled');
  });
});

describe('QueueService — pause frees scheduler slot', () => {
  it('pausing a running item starts the next pending immediately', async () => {
    const { qs, ds } = makeService();

    ds.start.mockResolvedValueOnce(jobResult('job-1')).mockResolvedValue(jobResult('job-2'));
    ds.pause.mockResolvedValue(ok({ paused: true, tempDir: '/tmp/x' }));

    // Let 'a' go through the natural start cycle so scheduler state is set.
    qs.add([makeItem({ id: 'a', status: 'pending' })]);
    await vi.waitFor(() => expect(qs.snapshot().find((i) => i.id === 'a')?.status).toBe('running'));

    // Add 'b' — scheduler occupied, stays pending.
    qs.add([makeItem({ id: 'b', status: 'pending' })]);
    await flushMicrotasks();
    expect(ds.start).toHaveBeenCalledOnce();

    // Pause 'a' — frees the scheduler slot, triggers maybeStartNext → starts 'b'.
    await qs.pause('a');

    await vi.waitFor(() => expect(ds.start).toHaveBeenCalledTimes(2));
    expect(qs.snapshot().find((i) => i.id === 'b')?.status).toBe('running');
  });
});

describe('QueueService — state invariants', () => {
  it('snapshot never has more than one running item (cap=1)', async () => {
    const { qs, ds } = makeService();
    ds.start.mockResolvedValue(jobResult());

    qs.add([makeItem({ id: 'a', status: 'pending' }), makeItem({ id: 'b', status: 'pending' }), makeItem({ id: 'c', status: 'pending' })]);

    await vi.waitFor(() => expect(ds.start).toHaveBeenCalledOnce());

    const running = qs.snapshot().filter((i) => i.status === 'running');
    expect(running.length).toBeLessThanOrEqual(1);
  });

  it('cancel(null) transitions all non-terminal items to cancelled', async () => {
    const { qs, ds } = makeService();
    ds.cancel.mockResolvedValue(ok({ cancelled: true }));

    qs.add([makeItem({ id: 'a', status: 'running', lastJobId: 'job-a' }), makeItem({ id: 'b', status: 'pending' }), makeItem({ id: 'c', status: 'paused-held' }), makeItem({ id: 'd', status: 'done', progressPercent: 100 })]);

    await qs.cancel(null);

    const snap = qs.snapshot();
    expect(snap.find((i) => i.id === 'a')?.status).toBe('cancelled');
    expect(snap.find((i) => i.id === 'b')?.status).toBe('cancelled');
    expect(snap.find((i) => i.id === 'c')?.status).toBe('cancelled');
    expect(snap.find((i) => i.id === 'd')?.status).toBe('done');
  });

  it('cancel pending item by id — no IPC call needed', async () => {
    const { qs, ds } = makeService();

    qs.add([makeItem({ id: 'a', status: 'pending' })]);
    await qs.cancel('a');

    expect(ds.cancel).not.toHaveBeenCalled();
    expect(qs.snapshot()[0].status).toBe('cancelled');
  });

  it('paused-held resume → pending → auto-starts', async () => {
    const { qs, ds } = makeService();
    ds.start.mockResolvedValue(jobResult());

    qs.add([makeItem({ id: 'a', status: 'paused-held' })]);
    await qs.resume('a');

    await vi.waitFor(() => expect(ds.start).toHaveBeenCalledOnce());
    expect(qs.snapshot()[0].status).toBe('running');
  });
});
