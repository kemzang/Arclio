import log from 'electron-log/main.js';
import { IPC_CHANNELS } from '@shared/ipc.js';
import { queueArraySchema } from '@shared/schemas.js';
import { ok } from '@shared/result.js';
import { unknownToMessage } from '@main/utils/errorFactory.js';
import type { QueueStore } from '@main/stores/QueueStore.js';
import { handle, handleRaw, toUnknownFailure } from './utils.js';

export function registerQueueHandlers(queueStore: QueueStore): void {
  handleRaw(IPC_CHANNELS.queueLoad, async () => {
    try {
      const result = await queueStore.load();
      if (!result.ok) {
        log.error('queue:load failed', { error: result.error.message });
      }
      return result;
    } catch (error) {
      return toUnknownFailure(error);
    }
  });

  handle(IPC_CHANNELS.queueSave, queueArraySchema, async (items) => {
    try {
      await queueStore.save(items);
      return ok({ saved: true });
    } catch (error) {
      log.error('queue:save failed', { error: unknownToMessage(error) });
      return toUnknownFailure(error);
    }
  });
}
