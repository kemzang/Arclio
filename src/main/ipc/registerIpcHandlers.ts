import type { BrowserWindow } from 'electron';
import type { SupportedLang } from '@shared/i18n/types';
import type { DownloadService } from '@main/services/DownloadService';
import type { FormatProbeService } from '@main/services/FormatProbeService';
import type { PlaylistProbeService } from '@main/services/PlaylistProbeService';
import type { BinaryManager } from '@main/services/BinaryManager';
import type { TokenService } from '@main/services/TokenService';
import type { SettingsStore } from '@main/stores/SettingsStore';
import type { QueueStore } from '@main/stores/QueueStore';
import type { ClipboardWatcher } from '@main/services/ClipboardWatcher';
import { DownloadEventBridge } from '@main/services/DownloadEventBridge';
import { WarmupService } from '@main/services/WarmupService';
import { registerAppHandlers } from './appHandlers';
import { registerWindowHandlers } from './windowHandlers';
import { registerDownloadHandlers } from './downloadHandlers';
import { registerSettingsHandlers } from './settingsHandlers';
import { registerFileHandlers } from './fileHandlers';
import { registerQueueHandlers } from './queueHandlers';
import { registerAnalyticsHandlers } from './analyticsHandlers';
import { registerDiagnosticsHandlers } from './diagnosticsHandlers';

export interface IpcDependencies {
  mainWindow: BrowserWindow;
  downloadService: DownloadService;
  formatProbeService: FormatProbeService;
  playlistProbeService: PlaylistProbeService;
  settingsStore: SettingsStore;
  queueStore: QueueStore;
  binaryManager: BinaryManager;
  tokenService: TokenService;
  languageRef: { current: SupportedLang };
  clipboardWatcher: ClipboardWatcher;
}

export function registerIpcHandlers(deps: IpcDependencies): void {
  const { mainWindow, downloadService, formatProbeService, playlistProbeService, settingsStore, queueStore, binaryManager, tokenService, languageRef, clipboardWatcher } = deps;

  const warmupService = new WarmupService({ binaryManager, tokenService, window: mainWindow });
  registerAppHandlers({ warmupService, languageRef });
  registerWindowHandlers(mainWindow);
  registerDownloadHandlers({ downloadService, formatProbeService, playlistProbeService, settingsStore });
  registerSettingsHandlers({ settingsStore, clipboardWatcher });
  registerFileHandlers(mainWindow);
  registerQueueHandlers(queueStore);
  registerAnalyticsHandlers();
  registerDiagnosticsHandlers();

  new DownloadEventBridge(downloadService, mainWindow).attach();
}
