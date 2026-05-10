import { contextBridge, ipcRenderer } from 'electron';

declare const __APP_VERSION__: string;
import { IPC_CHANNELS } from '@shared/ipc.js';
import type { AppApi } from '@shared/api.js';
import type { ProgressEvent, QueueItem, StatusEvent, UpdateAvailablePayload, WarmupProgressEvent } from '@shared/types.js';

const api: AppApi = {
  app: {
    warmUp: (input) => ipcRenderer.invoke(IPC_CHANNELS.appWarmUp, input ?? {}),
    cancelWarmup: () => ipcRenderer.invoke(IPC_CHANNELS.appCancelWarmup),
    setLanguage: (language) => ipcRenderer.invoke(IPC_CHANNELS.appSetLanguage, language)
  },
  window: {
    minimize: () => ipcRenderer.invoke(IPC_CHANNELS.windowMinimize),
    maximize: () => ipcRenderer.invoke(IPC_CHANNELS.windowMaximize),
    close: () => ipcRenderer.invoke(IPC_CHANNELS.windowClose),
    isMaximized: () => ipcRenderer.invoke(IPC_CHANNELS.windowIsMaximized),
    onMaximizedChange: (listener) => {
      const wrapped = (_: Electron.IpcRendererEvent, isMax: boolean): void => listener(isMax);
      ipcRenderer.on(IPC_CHANNELS.windowMaximizedChange, wrapped);
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.windowMaximizedChange, wrapped);
      };
    }
  },
  downloads: {
    probe: (input) => ipcRenderer.invoke(IPC_CHANNELS.downloadsProbe, input),
    probeCancel: () => ipcRenderer.invoke(IPC_CHANNELS.downloadsProbeCancel),
    start: (input) => ipcRenderer.invoke(IPC_CHANNELS.downloadsStart, input),
    cancel: (input = {}) => ipcRenderer.invoke(IPC_CHANNELS.downloadsCancel, input),
    pause: (input = {}) => ipcRenderer.invoke(IPC_CHANNELS.downloadsPause, input),
    resume: (input) => ipcRenderer.invoke(IPC_CHANNELS.downloadsResume, input)
  },
  settings: {
    get: () => ipcRenderer.invoke(IPC_CHANNELS.settingsGet),
    update: (input) => ipcRenderer.invoke(IPC_CHANNELS.settingsUpdate, input)
  },
  shell: {
    openFolder: (targetPath) => ipcRenderer.invoke(IPC_CHANNELS.shellOpenFolder, targetPath),
    openExternal: (url) => ipcRenderer.invoke(IPC_CHANNELS.shellOpenExternal, url),
    openBinariesDir: () => ipcRenderer.invoke(IPC_CHANNELS.shellOpenBinariesDir)
  },
  logs: {
    openDir: () => ipcRenderer.invoke(IPC_CHANNELS.logsOpenDir)
  },
  dialog: {
    chooseFolder: () => ipcRenderer.invoke(IPC_CHANNELS.chooseFolder),
    chooseFile: () => ipcRenderer.invoke(IPC_CHANNELS.chooseFile),
    chooseExecutable: (binary) => ipcRenderer.invoke(IPC_CHANNELS.dialogChooseExecutable, binary)
  },
  events: {
    onStatus: (listener) => {
      const wrapped = (_: Electron.IpcRendererEvent, event: StatusEvent): void => listener(event);
      ipcRenderer.on(IPC_CHANNELS.eventsStatus, wrapped);
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.eventsStatus, wrapped);
      };
    },
    onProgress: (listener) => {
      const wrapped = (_: Electron.IpcRendererEvent, event: ProgressEvent): void => listener(event);
      ipcRenderer.on(IPC_CHANNELS.eventsProgress, wrapped);
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.eventsProgress, wrapped);
      };
    },
    onClipboardUrl: (listener) => {
      const wrapped = (_: Electron.IpcRendererEvent, url: string): void => listener(url);
      ipcRenderer.on(IPC_CHANNELS.eventsClipboardUrl, wrapped);
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.eventsClipboardUrl, wrapped);
      };
    },
    onWarmupProgress: (listener) => {
      const wrapped = (_: Electron.IpcRendererEvent, event: WarmupProgressEvent): void => listener(event);
      ipcRenderer.on(IPC_CHANNELS.warmupProgress, wrapped);
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.warmupProgress, wrapped);
      };
    }
  },
  queue: {
    cmd: {
      add: (items: QueueItem[]) => ipcRenderer.invoke(IPC_CHANNELS.queueCmdAdd, items),
      getSnapshot: () => ipcRenderer.invoke(IPC_CHANNELS.queueCmdGetSnapshot),
      start: (input: { itemId: string }) => ipcRenderer.invoke(IPC_CHANNELS.queueCmdStart, input),
      pause: (input: { itemId: string }) => ipcRenderer.invoke(IPC_CHANNELS.queueCmdPause, input),
      resume: (input: { itemId: string }) => ipcRenderer.invoke(IPC_CHANNELS.queueCmdResume, input),
      cancel: (input: { itemId: string | null }) => ipcRenderer.invoke(IPC_CHANNELS.queueCmdCancel, input),
      retry: (input: { itemId: string }) => ipcRenderer.invoke(IPC_CHANNELS.queueCmdRetry, input),
      clearCompleted: () => ipcRenderer.invoke(IPC_CHANNELS.queueCmdClearCompleted),
      remove: (input: { itemId: string }) => ipcRenderer.invoke(IPC_CHANNELS.queueCmdRemove, input)
    },
    events: {
      onSnapshot: (listener) => {
        const wrapped = (_: Electron.IpcRendererEvent, items: QueueItem[]): void => listener(items);
        ipcRenderer.on(IPC_CHANNELS.queueEventSnapshot, wrapped);
        return () => {
          ipcRenderer.removeListener(IPC_CHANNELS.queueEventSnapshot, wrapped);
        };
      },
      onAdded: (listener) => {
        const wrapped = (_: Electron.IpcRendererEvent, event: { items: QueueItem[]; atIdx: number }): void => listener(event);
        ipcRenderer.on(IPC_CHANNELS.queueEventAdded, wrapped);
        return () => {
          ipcRenderer.removeListener(IPC_CHANNELS.queueEventAdded, wrapped);
        };
      },
      onUpdated: (listener) => {
        const wrapped = (_: Electron.IpcRendererEvent, event: { item: QueueItem }): void => listener(event);
        ipcRenderer.on(IPC_CHANNELS.queueEventUpdated, wrapped);
        return () => {
          ipcRenderer.removeListener(IPC_CHANNELS.queueEventUpdated, wrapped);
        };
      },
      onRemoved: (listener) => {
        const wrapped = (_: Electron.IpcRendererEvent, event: { itemId: string }): void => listener(event);
        ipcRenderer.on(IPC_CHANNELS.queueEventRemoved, wrapped);
        return () => {
          ipcRenderer.removeListener(IPC_CHANNELS.queueEventRemoved, wrapped);
        };
      }
    }
  },
  updater: {
    onUpdateAvailable: (listener) => {
      const wrapped = (_: Electron.IpcRendererEvent, payload: UpdateAvailablePayload): void => listener(payload);
      ipcRenderer.on(IPC_CHANNELS.updaterAvailable, wrapped);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.updaterAvailable, wrapped);
    },
    install: () => ipcRenderer.invoke(IPC_CHANNELS.updaterInstall)
  },
  analytics: {
    track: (name, props) => ipcRenderer.send(IPC_CHANNELS.analyticsTrack, { name, props })
  },
  diagnostics: {
    logWizardStep: (snapshot) => ipcRenderer.send(IPC_CHANNELS.diagnosticsLogWizardStep, snapshot)
  }
};

contextBridge.exposeInMainWorld('appApi', api);
contextBridge.exposeInMainWorld('platform', process.platform);
contextBridge.exposeInMainWorld('appVersion', __APP_VERSION__);
