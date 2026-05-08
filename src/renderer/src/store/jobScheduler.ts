import { QUEUE_STATUS } from '@shared/schemas.js';
import { isHeld } from '@shared/queueItem.js';
import type { GetState, SetState } from './types.js';

const NEXT_JOB_DELAY_MS = 3000;

type SchedulerState = { kind: 'idle' } | { kind: 'running'; jobId: string } | { kind: 'sleeping'; until: number; nextItemId: string };

export interface JobScheduler {
  notifyJobFinished(): void;
  notifyItemAdded(): Promise<void>;
  reset(): void;
}

function pickNextPending(get: GetState): string | null {
  const next = get().queue.find((i) => i.status === QUEUE_STATUS.pending && !isHeld(i));
  return next?.id ?? null;
}

export function createJobScheduler(set: SetState, get: GetState): JobScheduler {
  let state: SchedulerState = { kind: 'idle' };
  let timer: ReturnType<typeof setTimeout> | null = null;

  function transition(next: SchedulerState): void {
    state = next;
    set({ interJobSleepEndsAt: next.kind === 'sleeping' ? next.until : null });
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

  return {
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
    }
  };
}
