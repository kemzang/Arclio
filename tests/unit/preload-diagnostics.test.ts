import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';

import { registerPreloadDiagnostics } from '@main/preloadDiagnostics.js';

class FakeWebContents extends EventEmitter {
  executeJavaScript = vi.fn();
}

function makeLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  };
}

describe('preload diagnostics', () => {
  it('logs the resolved preload path and preload-error events', () => {
    const webContents = new FakeWebContents();
    const logger = makeLogger();
    const preloadPath = '/app/out/preload/index.cjs';
    const fileExists = vi.fn().mockReturnValue(true);

    registerPreloadDiagnostics({ webContents } as never, preloadPath, logger, { fileExists });
    const error = new Error('preload exploded');
    webContents.emit('preload-error', {}, preloadPath, error);

    expect(fileExists).toHaveBeenCalledWith(preloadPath);
    expect(logger.info).toHaveBeenCalledWith('Preload path resolved', { preloadPath, exists: true });
    expect(logger.error).toHaveBeenCalledWith('Preload script failed', { preloadPath, error });
  });

  it('logs when the renderer finishes loading without window.appApi', async () => {
    const webContents = new FakeWebContents();
    webContents.executeJavaScript.mockResolvedValue(false);
    const logger = makeLogger();
    const preloadPath = '/app/out/preload/index.cjs';

    registerPreloadDiagnostics({ webContents } as never, preloadPath, logger, { fileExists: () => true });
    webContents.emit('did-finish-load');
    await Promise.resolve();

    expect(webContents.executeJavaScript).toHaveBeenCalledWith('Boolean(window.appApi)');
    expect(logger.error).toHaveBeenCalledWith('Preload bridge missing after renderer load', { preloadPath });
  });
});
