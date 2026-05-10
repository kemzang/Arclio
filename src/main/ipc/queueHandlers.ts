import { z } from 'zod';
import { IPC_CHANNELS } from '@shared/ipc.js';
import { queueArraySchema } from '@shared/schemas.js';
import { ok } from '@shared/result.js';
import type { QueueService } from '@main/services/QueueService.js';
import { handle, handleRaw, toUnknownFailure } from './utils.js';

const itemIdSchema = z.object({ itemId: z.string() });
const cancelInputSchema = z.object({ itemId: z.string().nullable() });

export function registerQueueHandlers(queueService: QueueService): void {
  handle(IPC_CHANNELS.queueCmdAdd, queueArraySchema, (items) => {
    try {
      return Promise.resolve(queueService.add(items));
    } catch (err) {
      return Promise.resolve(toUnknownFailure(err));
    }
  });

  handle(IPC_CHANNELS.queueCmdStart, itemIdSchema, async ({ itemId }) => {
    try {
      const result = await queueService.start(itemId);
      return result.ok ? ok(undefined) : result;
    } catch (err) {
      return toUnknownFailure(err);
    }
  });

  handle(IPC_CHANNELS.queueCmdPause, itemIdSchema, async ({ itemId }) => {
    try {
      const result = await queueService.pause(itemId);
      return result.ok ? ok(undefined) : result;
    } catch (err) {
      return toUnknownFailure(err);
    }
  });

  handle(IPC_CHANNELS.queueCmdResume, itemIdSchema, async ({ itemId }) => {
    try {
      const result = await queueService.resume(itemId);
      return result.ok ? ok(undefined) : result;
    } catch (err) {
      return toUnknownFailure(err);
    }
  });

  handle(IPC_CHANNELS.queueCmdCancel, cancelInputSchema, async ({ itemId }) => {
    try {
      const result = await queueService.cancel(itemId);
      return result.ok ? ok(undefined) : result;
    } catch (err) {
      return toUnknownFailure(err);
    }
  });

  handle(IPC_CHANNELS.queueCmdRetry, itemIdSchema, async ({ itemId }) => {
    try {
      const result = await queueService.retry(itemId);
      return result.ok ? ok(undefined) : result;
    } catch (err) {
      return toUnknownFailure(err);
    }
  });

  handleRaw(IPC_CHANNELS.queueCmdClearCompleted, () => {
    try {
      const result = queueService.clearCompleted();
      return Promise.resolve(result.ok ? ok(undefined) : result);
    } catch (err) {
      return Promise.resolve(toUnknownFailure(err));
    }
  });

  handle(IPC_CHANNELS.queueCmdRemove, itemIdSchema, ({ itemId }) => {
    try {
      const result = queueService.remove(itemId);
      return Promise.resolve(result.ok ? ok(undefined) : result);
    } catch (err) {
      return Promise.resolve(toUnknownFailure(err));
    }
  });
}
