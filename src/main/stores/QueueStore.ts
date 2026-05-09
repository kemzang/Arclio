import Store from 'electron-store';
import type { QueueItem } from '@shared/types.js';
import { queueArraySchema, QUEUE_STATUS } from '@shared/schemas.js';
import { fail, ok, type Result } from '@shared/result.js';

interface QueueData {
  items: QueueItem[];
}

// Beta builds wrote `error: { key: YtdlpErrorKey | null; rawMessage?: string }`.
// New schema is `{ kind: YtDlpErrorKind; raw: string }`. Pre-process raw entries
// before safeParse so a beta user's queue survives the upgrade.
function migrateLegacyQueueItem(raw: unknown): unknown {
  if (typeof raw !== 'object' || raw === null) return raw;
  const item = raw as Record<string, unknown>;
  const error = item.error as { key?: unknown; rawMessage?: unknown; kind?: unknown; raw?: unknown } | null | undefined;
  if (!error || typeof error !== 'object') return item;
  // Already in new shape — leave it.
  if ('kind' in error && typeof error.kind === 'string') return item;
  // Old shape — translate.
  if ('key' in error || 'rawMessage' in error) {
    const kind = typeof error.key === 'string' ? error.key : 'unknown';
    const rawText = typeof error.rawMessage === 'string' ? error.rawMessage : '';
    return { ...item, error: { kind, raw: rawText } };
  }
  return item;
}

export class QueueStore {
  private readonly store: Store<QueueData>;

  constructor(userDataPath: string) {
    this.store = new Store<QueueData>({ name: 'queue', cwd: userDataPath, defaults: { items: [] }, clearInvalidConfig: true });
  }

  async save(items: QueueItem[]): Promise<void> {
    const toStore = items
      .filter((item) => item.status !== QUEUE_STATUS.cancelled)
      .map((item): QueueItem => {
        const wasDownloading = item.status === QUEUE_STATUS.downloading;
        const wasActive = wasDownloading || item.status === QUEUE_STATUS.paused;
        return {
          ...item,
          status: wasDownloading ? QUEUE_STATUS.pending : item.status,
          progressPercent: wasActive ? 0 : item.progressPercent,
          progressDetail: wasActive ? null : item.progressDetail,
          downloadJobId: null
        };
      });

    const result = queueArraySchema.safeParse(toStore);
    if (!result.success) {
      throw new Error(`QueueStore.save: invalid queue payload — ${result.error.issues[0]?.message ?? 'schema mismatch'}`);
    }

    this.store.set('items', result.data);
  }

  async load(): Promise<Result<QueueItem[]>> {
    const raw = this.store.get('items');
    // Migrate beta-shape entries before validation. Per-row migration so a
    // single malformed entry can be dropped by safeParse without losing the
    // rest of the queue (we currently fail-soft on the whole array; tighten
    // to per-row drop if a future migration grows in complexity).
    const migrated = Array.isArray(raw) ? raw.map(migrateLegacyQueueItem) : raw;
    const validated = queueArraySchema.safeParse(migrated);
    if (!validated.success) {
      const issue = validated.error.issues[0]?.message ?? 'schema mismatch';
      return fail({ code: 'validation', message: `Queue file is corrupted: ${issue}` });
    }

    return ok(validated.data.map((item) => ({ ...item, downloadJobId: null })));
  }
}
