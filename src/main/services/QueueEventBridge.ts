// QueueEventBridge — wires QueueService events to the renderer window.
// Sends an initial snapshot on attach (hydration), then streams added /
// updated / removed events as QueueService mutates the queue.

import type { BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '@shared/ipc.js';
import type { QueueItem } from '@shared/types.js';
import type { QueueService } from './QueueService.js';

export class QueueEventBridge {
  constructor(
    private readonly queueService: QueueService,
    private readonly window: BrowserWindow
  ) {}

  attach(): void {
    this.queueService.removeAllListeners('added');
    this.queueService.removeAllListeners('updated');
    this.queueService.removeAllListeners('removed');

    // Initial snapshot — hydrates the renderer projection on window create.
    this.send(IPC_CHANNELS.queueEventSnapshot, this.queueService.snapshot());

    this.queueService.on('added', (event: { items: QueueItem[]; atIdx: number }) => {
      this.send(IPC_CHANNELS.queueEventAdded, event);
    });

    this.queueService.on('updated', (event: { item: QueueItem }) => {
      this.send(IPC_CHANNELS.queueEventUpdated, event);
    });

    this.queueService.on('removed', (event: { itemId: string }) => {
      this.send(IPC_CHANNELS.queueEventRemoved, event);
    });
  }

  private send(channel: string, payload: unknown): void {
    if (this.window.isDestroyed()) return;
    this.window.webContents.send(channel, payload);
  }
}
