import log from 'electron-log/main.js';
import { createAppError } from '@main/utils/errorFactory.js';
import { cookiesConfigIssueMessage, getIncompleteCookiesConfigIssue } from '@shared/cookiesConfig.js';
import { IPC_CHANNELS } from '@shared/ipc.js';
import { fail, type Result } from '@shared/result.js';
import { cancelDownloadSchema, getFormatsSchema, getPlaylistItemsSchema, pauseResumeSchema, resumeSchema, startDownloadSchema } from '@shared/schemas.js';
import type { DownloadService } from '@main/services/DownloadService.js';
import type { FormatProbeService } from '@main/services/FormatProbeService.js';
import type { PlaylistProbeService } from '@main/services/PlaylistProbeService.js';
import type { SettingsStore } from '@main/stores/SettingsStore.js';
import { handle } from './utils.js';

interface DownloadHandlerDeps {
  downloadService: DownloadService;
  formatProbeService: FormatProbeService;
  playlistProbeService: PlaylistProbeService;
  settingsStore: SettingsStore;
}

function getCookiesValidationFailure(settings: Awaited<ReturnType<SettingsStore['get']>>): Result<never> | null {
  const issue = getIncompleteCookiesConfigIssue(settings.common);
  return issue ? fail(createAppError('validation', cookiesConfigIssueMessage(issue))) : null;
}

export function registerDownloadHandlers(deps: DownloadHandlerDeps): void {
  const { downloadService, formatProbeService, playlistProbeService, settingsStore } = deps;

  handle(IPC_CHANNELS.downloadsGetFormats, getFormatsSchema, async ({ url }) => {
    const settings = await settingsStore.get();
    const validationFailure = getCookiesValidationFailure(settings);
    if (validationFailure) return validationFailure;
    return formatProbeService.getFormats(url, settings.common.cookiesMode ?? 'off');
  });

  handle(IPC_CHANNELS.downloadsGetPlaylistItems, getPlaylistItemsSchema, ({ url }) => playlistProbeService.getPlaylistItems(url));

  handle(IPC_CHANNELS.downloadsStart, startDownloadSchema, async (data) => {
    const settings = await settingsStore.get();
    const validationFailure = getCookiesValidationFailure(settings);
    if (validationFailure) return validationFailure;
    const outputDir = data.outputDir ?? settings.common.defaultOutputDir;
    return downloadService.start({
      ...data,
      outputDir,
      cookiesMode: settings.common.cookiesMode ?? 'off'
    });
  });

  handle(IPC_CHANNELS.downloadsCancel, cancelDownloadSchema, ({ jobId }) => {
    log.info('[cancel IPC] received', { jobId: jobId ?? '(undefined)' });
    return downloadService.cancel(jobId);
  });

  handle(IPC_CHANNELS.downloadsPause, pauseResumeSchema, ({ jobId }) => downloadService.pause(jobId));

  handle(IPC_CHANNELS.downloadsResume, resumeSchema, ({ jobId }) => downloadService.resume(jobId));
}
