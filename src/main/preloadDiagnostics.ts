import fs from 'node:fs';
import path from 'node:path';
import type { BrowserWindow } from 'electron';
import log from 'electron-log/main.js';

interface Logger {
  info(message: string, meta?: unknown): void;
  warn(message: string, meta?: unknown): void;
  error(message: string, meta?: unknown): void;
}

interface Options {
  fileExists?: (filePath: string) => boolean;
}

export function resolveMainWindowPreloadPath(mainDir: string): string {
  return path.join(mainDir, '../preload/index.cjs');
}

export function registerPreloadDiagnostics(window: BrowserWindow, preloadPath: string, logger: Logger = log, options: Options = {}): void {
  const fileExists = options.fileExists ?? fs.existsSync;
  const exists = fileExists(preloadPath);
  logger.info('Preload path resolved', { preloadPath, exists });
  if (!exists) {
    logger.error('Preload script is missing', { preloadPath });
  }

  window.webContents.on('preload-error', (_event, failedPath: string, error: Error) => {
    logger.error('Preload script failed', { preloadPath: failedPath, error });
  });

  window.webContents.once('did-finish-load', () => {
    void verifyPreloadBridge(window, preloadPath, logger);
  });
}

async function verifyPreloadBridge(window: BrowserWindow, preloadPath: string, logger: Logger = log): Promise<boolean> {
  try {
    const hasBridge = (await window.webContents.executeJavaScript('Boolean(window.appApi)')) as unknown;
    if (hasBridge !== true) {
      logger.error('Preload bridge missing after renderer load', { preloadPath });
      return false;
    }
    return true;
  } catch (error) {
    logger.error('Preload bridge verification failed', { preloadPath, error });
    return false;
  }
}
