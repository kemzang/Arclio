import type { QueueItem } from './types';

// "Held" = an item the user paused while it was still pending. It never had
// a downloadJobId because no main-process job was ever spawned for it. UI
// treats it as queue-only (removable, no progress bar, no cancel-IPC).
export function isHeld(item: QueueItem): boolean {
  return item.status === 'paused' && !item.downloadJobId;
}
