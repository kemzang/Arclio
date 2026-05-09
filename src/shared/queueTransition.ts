// Pure transition function for queue items. Single source of truth for the
// queue state machine: every status change goes through `transition(item, evt)`
// instead of being assigned ad-hoc across queueSlice / systemSlice /
// jobScheduler. Closed `QueueEvent` union — the exhaustive switch becomes a
// compile error if a new event kind appears.
//
// Lives in `src/shared` (not `src/main`) so the renderer slice can call it
// directly today; future refactors that move queue authority to main can
// reuse the same function on the QueueService side without copy-paste.

import type { LocalizedError, QueueItem } from './types.js';
import { QUEUE_STATUS } from './schemas.js';

// Closed union of state-change signals. Mapped 1:1 from DownloadService /
// systemSlice events (which are themselves rendered from yt-dlp lifecycle).
export type QueueEvent =
  | { kind: 'started'; downloadJobId: string }
  | { kind: 'progress'; percent: number; detail?: string | null }
  | { kind: 'paused' }
  | { kind: 'resumed' }
  | { kind: 'failed'; error: LocalizedError; lastStatusKey?: import('./schemas.js').StatusKey; params?: Record<string, string | number> }
  | { kind: 'completed'; lastStatusKey?: import('./schemas.js').StatusKey; params?: Record<string, string | number>; finishedAt: string }
  | { kind: 'cancelled' }
  | { kind: 'retry-reset' };

// Pure (item, event) -> item. No I/O, no IPC, no logging. Caller produces a
// new item; existing references stay valid until they overwrite their slot.
export function transition(item: QueueItem, evt: QueueEvent): QueueItem {
  switch (evt.kind) {
    case 'started':
      return {
        ...item,
        status: QUEUE_STATUS.downloading,
        downloadJobId: evt.downloadJobId,
        error: null,
        progressPercent: 0,
        progressDetail: null
      };
    case 'progress':
      return {
        ...item,
        progressPercent: evt.percent,
        ...(evt.detail !== undefined ? { progressDetail: evt.detail } : {})
      };
    case 'paused':
      return { ...item, status: QUEUE_STATUS.paused, progressDetail: null };
    case 'resumed':
      return { ...item, status: QUEUE_STATUS.downloading, error: null };
    case 'failed':
      return {
        ...item,
        status: QUEUE_STATUS.error,
        error: evt.error,
        downloadJobId: null,
        ...(evt.lastStatusKey ? { lastStatus: { key: evt.lastStatusKey, params: evt.params } } : {})
      };
    case 'completed':
      return {
        ...item,
        status: QUEUE_STATUS.done,
        progressPercent: 100,
        finishedAt: evt.finishedAt,
        downloadJobId: null,
        ...(evt.lastStatusKey ? { lastStatus: { key: evt.lastStatusKey, params: evt.params } } : {})
      };
    case 'cancelled':
      return { ...item, status: QUEUE_STATUS.cancelled, downloadJobId: null };
    case 'retry-reset':
      return {
        ...item,
        status: QUEUE_STATUS.pending,
        error: null,
        progressPercent: 0,
        progressDetail: null,
        finishedAt: null,
        downloadJobId: null
      };
  }
}

// Predicate: is this event illegal in the current state? Returns null when
// the transition is allowed; otherwise returns a short reason string. Used by
// the renderer slice to log + ignore stale events (e.g. a status event that
// arrives after the user already cancelled).
export function illegalTransition(item: QueueItem, evt: QueueEvent): string | null {
  if (item.status === QUEUE_STATUS.cancelled) {
    if (evt.kind === 'progress' || evt.kind === 'completed' || evt.kind === 'failed') {
      return `event ${evt.kind} on cancelled item is a stale signal`;
    }
  }
  if (item.status === QUEUE_STATUS.done && evt.kind !== 'retry-reset') {
    return `event ${evt.kind} on done item is a stale signal`;
  }
  return null;
}
