import { useSyncExternalStore } from 'react';
import { QUEUE_STATUS } from '@shared/schemas';
import { isHeld } from '@shared/queueItem';
import type { GetState } from './types';

const NEXT_JOB_DELAY_MS = 3000;

type SchedulerState = { kind: 'idle' } | { kind: 'running'; jobId: string } | { kind: 'sleeping'; until: number; nextItemId: string };

export interface JobScheduler {
  notifyJobFinished(): void;
  notifyItemAdded(): Promise<void>;
  reset(): void;
  getSleepEndsAt(): number | null;
  subscribe(cb: () => void): () => void;
}

let _scheduler: JobScheduler | null = null;
function getScheduler(): JobScheduler {
  if (!_scheduler) throw new Error('JobScheduler not initialized');
  return _scheduler;
}
export function useSchedulerSleepEndsAt(): number | null {
  return useSyncExternalStore(
    (cb) => getScheduler().subscribe(cb),
    () => getScheduler().getSleepEndsAt()
  );
}

function pickNextPending(get: GetState): string | null {
  const next = get().queue.find((i) => i.status === QUEUE_STATUS.pending && !isHeld(i));
  return next?.id ?? null;
}

export function createJobScheduler(get: GetState): JobScheduler {
  let state: SchedulerState = { kind: 'idle' };
  let timer: ReturnType<typeof setTimeout> | null = null;
  const listeners = new Set<() => void>();

  function transition(next: SchedulerState): void {
    state = next;
    listeners.forEach((cb) => cb());
  }

  function clearTimer(): void {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function scheduleAfterFinish(): void {
    clearTimer();
    const nextId = pickNextPending(get);
    if (!nextId) {
      transition({ kind: 'idle' });
      return;
    }
    const until = Date.now() + NEXT_JOB_DELAY_MS;
    transition({ kind: 'sleeping', until, nextItemId: nextId });
    timer = setTimeout(() => {
      timer = null;
      transition({ kind: 'idle' });
      void maybeStartNext();
    }, NEXT_JOB_DELAY_MS);
  }

  async function maybeStartNext(): Promise<void> {
    if (get().queue.some((i) => i.status === QUEUE_STATUS.downloading)) return;
    const itemId = pickNextPending(get);
    if (!itemId) {
      transition({ kind: 'idle' });
      return;
    }
    transition({ kind: 'running', jobId: itemId });
    await get().startItemDownload(itemId);
    const current = get().queue.find((i) => i.id === itemId);
    if (current?.status === QUEUE_STATUS.downloading) {
      transition({ kind: 'idle' });
      return;
    }

    if (get().queue.some((i) => i.status === QUEUE_STATUS.downloading)) {
      transition({ kind: 'idle' });
      return;
    }

    scheduleAfterFinish();
  }

  const scheduler: JobScheduler = {
    notifyJobFinished(): void {
      scheduleAfterFinish();
    },
    async notifyItemAdded(): Promise<void> {
      if (state.kind === 'running' || state.kind === 'sleeping') return;
      await maybeStartNext();
    },
    reset(): void {
      clearTimer();
      transition({ kind: 'idle' });
    },
    getSleepEndsAt(): number | null {
      return state.kind === 'sleeping' ? state.until : null;
    },
    subscribe(cb: () => void): () => void {
      listeners.add(cb);
      return () => listeners.delete(cb);
    }
  };
  _scheduler = scheduler;
  return scheduler;
}
