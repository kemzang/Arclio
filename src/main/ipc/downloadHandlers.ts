import log from 'electron-log/main';
import { IPC_CHANNELS } from '@shared/ipc';
import { cancelDownloadSchema, getFormatsSchema, getPlaylistItemsSchema, pauseResumeSchema, resumeSchema, startDownloadSchema } from '@shared/schemas';
import type { DownloadService } from '@main/services/DownloadService';
import type { FormatProbeService } from '@main/services/FormatProbeService';
import type { PlaylistProbeService } from '@main/services/PlaylistProbeService';
import type { SettingsStore } from '@main/stores/SettingsStore';
import { handle } from './utils';

interface DownloadHandlerDeps {
  downloadService: DownloadService;
  formatProbeService: FormatProbeService;
  playlistProbeService: PlaylistProbeService;
  settingsStore: SettingsStore;
}

export function registerDownloadHandlers(deps: DownloadHandlerDeps): void {
  const { downloadService, formatProbeService, playlistProbeService, settingsStore } = deps;

  handle(IPC_CHANNELS.downloadsGetFormats, getFormatsSchema, ({ url }) => formatProbeService.getFormats(url));

  handle(IPC_CHANNELS.downloadsGetPlaylistItems, getPlaylistItemsSchema, ({ url }) => playlistProbeService.getPlaylistItems(url));

  handle(IPC_CHANNELS.downloadsStart, startDownloadSchema, async (data) => {
    const settings = await settingsStore.get();
    const outputDir = data.outputDir ?? settings.common.defaultOutputDir;
    return downloadService.start({
      ...data,
      outputDir,
      cookiesEnabled: settings.common.cookiesEnabled ?? false
    });
  });

  handle(IPC_CHANNELS.downloadsCancel, cancelDownloadSchema, ({ jobId }) => {
    log.info('[cancel IPC] received', { jobId: jobId ?? '(undefined)' });
    return downloadService.cancel(jobId);
  });

  handle(IPC_CHANNELS.downloadsPause, pauseResumeSchema, ({ jobId }) => downloadService.pause(jobId));

  handle(IPC_CHANNELS.downloadsResume, resumeSchema, ({ jobId }) => downloadService.resume(jobId));
}
