// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { create } from 'zustand';
import { createJobScheduler } from '@renderer/store/jobScheduler.js';
import type { AppState } from '@renderer/store/types.js';
import { makeItem } from '../shared/fixtures.js';

function makeTestStore(startSpy: ReturnType<typeof vi.fn>) {
  const useStore = create<AppState>()(
    () =>
      ({
        queue: [],
        startItemDownload: startSpy
      }) as unknown as AppState
  );
  return useStore;
}

describe('JobScheduler', () => {
  let startSpy: ReturnType<typeof vi.fn>;
  let store: ReturnType<typeof makeTestStore>;
  let scheduler: ReturnType<typeof createJobScheduler>;

  beforeEach(() => {
    vi.useFakeTimers();
    startSpy = vi.fn();
    store = makeTestStore(startSpy);
    startSpy.mockImplementation(async (itemId: string) => {
      store.setState({
        queue: store.getState().queue.map((item) => (item.id === itemId ? makeItem({ ...item, status: 'downloading', downloadJobId: `job-${itemId}` }) : item))
      } as never);
    });
    scheduler = createJobScheduler(store.setState, store.getState);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('idle → running on notifyItemAdded when nothing is downloading', async () => {
    store.setState({ queue: [makeItem({ id: 'a', status: 'pending' })] } as never);
    await scheduler.notifyItemAdded();
    expect(startSpy).toHaveBeenCalledWith('a');
    expect(store.getState().interJobSleepEndsAt).toBeNull();
  });

  it('notifyItemAdded is a no-op while another item is already downloading', async () => {
    store.setState({
      queue: [makeItem({ id: 'a', status: 'downloading', downloadJobId: 'job-a' }), makeItem({ id: 'b', status: 'pending' })]
    } as never);
    await scheduler.notifyItemAdded();
    expect(startSpy).not.toHaveBeenCalled();
  });

  it('notifyJobFinished sets sleep deadline then starts next pending after 3s', async () => {
    store.setState({
      queue: [makeItem({ id: 'b', status: 'pending' })]
    } as never);
    scheduler.notifyJobFinished();
    expect(store.getState().interJobSleepEndsAt).toBeGreaterThan(Date.now());
    expect(startSpy).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(3100);
    expect(startSpy).toHaveBeenCalledWith('b');
    expect(store.getState().interJobSleepEndsAt).toBeNull();
  });

  it('notifyJobFinished with no pending → idle, no sleep window', () => {
    store.setState({ queue: [makeItem({ id: 'a', status: 'done' })] } as never);
    scheduler.notifyJobFinished();
    expect(store.getState().interJobSleepEndsAt).toBeNull();
  });

  it('scheduled start failure enters the sleep window and retries the next pending item', async () => {
    startSpy.mockImplementation(async (itemId: string) => {
      if (itemId === 'a') {
        store.setState({
          queue: [makeItem({ id: 'a', status: 'error' }), makeItem({ id: 'b', status: 'pending' })]
        } as never);
        return;
      }

      store.setState({
        queue: [makeItem({ id: 'a', status: 'error' }), makeItem({ id: 'b', status: 'downloading', downloadJobId: 'job-b' })]
      } as never);
    });

    store.setState({
      queue: [makeItem({ id: 'a', status: 'pending' }), makeItem({ id: 'b', status: 'pending' })]
    } as never);

    await scheduler.notifyItemAdded();

    expect(startSpy).toHaveBeenCalledWith('a');
    expect(store.getState().interJobSleepEndsAt).toBeGreaterThan(Date.now());

    await vi.advanceTimersByTimeAsync(3100);

    expect(startSpy).toHaveBeenNthCalledWith(2, 'b');
  });

  it('skips held items (paused without downloadJobId) when picking next', async () => {
    store.setState({
      queue: [makeItem({ id: 'h', status: 'paused', downloadJobId: null }), makeItem({ id: 'p', status: 'pending' })]
    } as never);
    await scheduler.notifyItemAdded();
    expect(startSpy).toHaveBeenCalledWith('p');
  });

  it('reset() clears the sleep timer mid-window', async () => {
    store.setState({ queue: [makeItem({ id: 'b', status: 'pending' })] } as never);
    scheduler.notifyJobFinished();
    expect(store.getState().interJobSleepEndsAt).not.toBeNull();

    scheduler.reset();
    expect(store.getState().interJobSleepEndsAt).toBeNull();

    await vi.advanceTimersByTimeAsync(3100);
    expect(startSpy).not.toHaveBeenCalled();
  });

  it('notifyItemAdded during sleep window does NOT race the scheduled start', async () => {
    store.setState({ queue: [makeItem({ id: 'b', status: 'pending' })] } as never);
    scheduler.notifyJobFinished();
    await scheduler.notifyItemAdded();
    expect(startSpy).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(3100);
    expect(startSpy).toHaveBeenCalledTimes(1);
  });
});
