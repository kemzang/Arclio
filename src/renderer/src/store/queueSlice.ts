import type { LocalizedError, PlaylistEntry, QueueItem, StartDownloadInput } from '@shared/types';
import { QUEUE_STATUS } from '@shared/schemas';
import { ProgressFormatter } from './progress';
import { buildAudioConvertPayload, buildFormatId, buildFormatLabel, generateId, resolveVideoResolution } from './helpers';
import { effectiveOutputDir } from '@renderer/lib/path';
import { joinSubfolder, safeFolderName } from '@shared/subfolder';
import { prepareJob } from '@shared/prepareJob';
import type { EmbedOptions, SubtitleOptions } from '@shared/preparedJob';
import { isHeld } from '@shared/queueItem';
import i18next from 'i18next';
import type { GetState, SetState, QueueSlice } from './types';
import type { JobScheduler } from './jobScheduler';

export const progressFormatters = new Map<string, ProgressFormatter>();

export function updateQueueItem(set: SetState, id: string, patch: Partial<QueueItem>): void {
  set((state) => ({
    queue: state.queue.map((item) => (item.id === id ? { ...item, ...patch } : item))
  }));
}

function maybeShowQueueTip(set: SetState): void {
  if (!localStorage.getItem('arroxy_seen_queue_tip')) {
    localStorage.setItem('arroxy_seen_queue_tip', '1');
    set({ drawerOpen: true, showQueueTip: true });
  }
}

export function saveQueue(get: GetState): void {
  void window.appApi.queue.save(get().queue).then(
    (result) => {
      if (!result.ok) console.error('[queue] save failed', result.error);
    },
    (err) => console.error('[queue] save threw', err)
  );
}

function buildQueueItem(get: GetState): QueueItem | null {
  const state = get();
  const { wizardUrl, wizardTitle, wizardThumbnail, wizardOutputDir } = state;
  const { wizardSubfolderEnabled, wizardSubfolderName } = state;
  const { selectedVideoFormatId, audioSelection, activePreset, wizardFormats } = state;
  const outputDir = effectiveOutputDir(wizardOutputDir, wizardSubfolderEnabled, wizardSubfolderName);

  const audioFormats = wizardFormats.filter((f) => f.isAudioOnly);
  const videoResolution = resolveVideoResolution(selectedVideoFormatId, wizardFormats, 'audio-only');

  const formatId = buildFormatId(selectedVideoFormatId, audioSelection);
  const audioConvert = buildAudioConvertPayload(audioSelection);
  const formatLabel = buildFormatLabel(selectedVideoFormatId, videoResolution, audioSelection, audioFormats, activePreset);

  const nativeAudioId = audioSelection.kind === 'native' ? audioSelection.formatId : null;
  const selectedIds = [selectedVideoFormatId, nativeAudioId].filter(Boolean) as string[];
  const selectedSizes = selectedIds.map((id) => wizardFormats.find((f) => f.formatId === id)?.filesize);
  const expectedBytes = !audioConvert && selectedIds.length > 0 && selectedSizes.every((s): s is number => s !== undefined) ? selectedSizes.reduce((a, b) => a + b, 0) : undefined;

  const subtitleLanguages = state.wizardSubtitleSkipped ? [] : state.wizardSubtitleLanguages;
  const writeAutoSubs = subtitleLanguages.some((l) => !!state.wizardAutomaticCaptions[l] && !state.wizardSubtitles[l]);
  const subtitles: SubtitleOptions | undefined = subtitleLanguages.length > 0 ? { languages: subtitleLanguages, mode: state.wizardSubtitleMode, format: state.wizardSubtitleFormat, writeAuto: writeAutoSubs } : undefined;
  const embed: EmbedOptions = {
    chapters: state.wizardEmbedChapters,
    metadata: state.wizardEmbedMetadata,
    thumbnail: state.wizardEmbedThumbnail,
    description: state.wizardWriteDescription,
    thumbnailSidecar: state.wizardWriteThumbnail
  };

  const job = prepareJob({
    mode: 'single',
    source: 'youtube',
    formatId,
    audioConvert,
    activePreset,
    expectedBytes,
    subtitles,
    sponsorBlockMode: state.wizardSponsorBlockMode,
    sponsorBlockCategories: state.wizardSponsorBlockCategories,
    embed
  });

  return {
    id: generateId(),
    url: wizardUrl,
    title: wizardTitle || wizardUrl,
    thumbnail: wizardThumbnail,
    outputDir,
    formatLabel,
    status: QUEUE_STATUS.pending,
    progressPercent: 0,
    progressDetail: null,
    lastStatus: null,
    error: null,
    finishedAt: null,
    downloadJobId: null,
    job
  };
}

function padPlaylistIndex(index: number, maxIndex: number): string {
  const width = Math.max(2, String(maxIndex).length);
  return String(index).padStart(width, '0');
}

function buildPlaylistQueueItem(entry: PlaylistEntry, get: GetState, playlistGroupId: string): QueueItem {
  const state = get();
  const { wizardOutputDir, wizardSubfolderEnabled, wizardSubfolderName, selectedPlaylistPreset } = state;
  if (!selectedPlaylistPreset) throw new Error('playlist preset missing');

  const baseDir = wizardSubfolderEnabled && wizardSubfolderName ? joinSubfolder(wizardOutputDir, wizardSubfolderName) : joinSubfolder(wizardOutputDir, safeFolderName(state.playlistTitle || 'Playlist'));

  const formatLabel = i18next.t(`playlistPresets.${selectedPlaylistPreset}.label` as const);
  const maxPlaylistIndex = state.playlistItems.reduce((max, item) => Math.max(max, item.playlistIndex), 0);
  const outputTemplate = `${padPlaylistIndex(entry.playlistIndex, maxPlaylistIndex)} - %(title)s.%(ext)s`;

  const embed: EmbedOptions = {
    chapters: state.wizardEmbedChapters,
    metadata: state.wizardEmbedMetadata,
    thumbnail: state.wizardEmbedThumbnail,
    description: state.wizardWriteDescription,
    thumbnailSidecar: state.wizardWriteThumbnail
  };

  const job = prepareJob({
    mode: 'playlist',
    source: 'youtube',
    playlistPreset: selectedPlaylistPreset,
    outputTemplate,
    sponsorBlockMode: state.wizardSponsorBlockMode,
    sponsorBlockCategories: state.wizardSponsorBlockCategories,
    embed
  });

  return {
    id: generateId(),
    url: entry.url,
    title: entry.title || entry.url,
    thumbnail: entry.thumbnail,
    outputDir: baseDir,
    formatLabel,
    status: QUEUE_STATUS.pending,
    progressPercent: 0,
    progressDetail: null,
    lastStatus: null,
    error: null,
    finishedAt: null,
    downloadJobId: null,
    playlistGroupId,
    job
  };
}

function buildStartInput(item: QueueItem): StartDownloadInput {
  return {
    url: item.url,
    outputDir: item.outputDir,
    job: item.job
  };
}

async function persistFormatPrefs(set: SetState, get: GetState): Promise<void> {
  const { selectedVideoFormatId, activePreset, audioSelection, wizardFormats, wizardSubtitleLanguages, settings, wizardMode, selectedPlaylistPreset } = get();
  if (!settings) return;
  const inPlaylist = wizardMode === 'playlist';

  const common = {
    lastSponsorBlockMode: get().wizardSponsorBlockMode,
    lastSponsorBlockCategories: get().wizardSponsorBlockCategories,
    embedChapters: get().wizardEmbedChapters,
    embedMetadata: get().wizardEmbedMetadata,
    embedThumbnail: get().wizardEmbedThumbnail,
    writeDescription: get().wizardWriteDescription,
    writeThumbnail: get().wizardWriteThumbnail
  };

  // Mode-scoped persistence: playlist settings live under their own slot so a
  // playlist run doesn't clobber single-mode preset/subfolder, and vice versa.
  if (inPlaylist) {
    const playlist = {
      ...(selectedPlaylistPreset ? { lastPlaylistPreset: selectedPlaylistPreset } : {}),
      lastPlaylistSubfolderEnabled: get().wizardSubfolderEnabled,
      lastPlaylistSubfolder: get().wizardSubfolderName.trim()
    };
    const result = await window.appApi.settings.update({ common, playlist });
    if (result.ok) set({ settings: result.data });
    return;
  }

  const videoResolution = resolveVideoResolution(selectedVideoFormatId, wizardFormats, 'audio-only');

  // Only persist subtitle prefs when the user actually picked languages this run —
  // otherwise an empty selection (or a Skip Subs click) would wipe the saved list.
  const single = {
    lastVideoResolution: videoResolution,
    lastPreset: activePreset,
    lastAudioSelection: audioSelection,
    ...(wizardSubtitleLanguages.length > 0
      ? {
          lastSubtitleLanguages: wizardSubtitleLanguages,
          lastSubtitleMode: get().wizardSubtitleMode,
          lastSubtitleFormat: get().wizardSubtitleFormat
        }
      : {}),
    lastSubfolderEnabled: get().wizardSubfolderEnabled,
    lastSubfolder: get().wizardSubfolderName.trim()
  };
  const result = await window.appApi.settings.update({ common, single });
  if (result.ok) {
    set({ settings: result.data });
  }
}

export function createQueueSlice(set: SetState, get: GetState, scheduler: JobScheduler): QueueSlice {
  return {
    queue: [],

    addToQueue: async () => {
      const { playlistItems, selectedPlaylistItemIds } = get();
      if (get().wizardMode === 'playlist') {
        const groupId = generateId();
        const selected = playlistItems.filter((e) => selectedPlaylistItemIds.includes(e.id));
        const items = selected.map((e) => buildPlaylistQueueItem(e, get, groupId));
        set((state) => ({ queue: [...state.queue, ...items] }));
        maybeShowQueueTip(set);
        saveQueue(get);
        await persistFormatPrefs(set, get);
        get().reset();
        await scheduler.notifyItemAdded();
        return;
      }
      const item = buildQueueItem(get);
      if (!item) return;
      set((state) => ({ queue: [...state.queue, item] }));
      maybeShowQueueTip(set);
      saveQueue(get);
      await persistFormatPrefs(set, get);
      get().reset();
      await scheduler.notifyItemAdded();
    },

    addAndDownloadImmediately: async () => {
      const { playlistItems, selectedPlaylistItemIds } = get();
      if (get().wizardMode === 'playlist') {
        const groupId = generateId();
        const selected = playlistItems.filter((e) => selectedPlaylistItemIds.includes(e.id));
        const items = selected.map((e) => buildPlaylistQueueItem(e, get, groupId));
        set((state) => ({ queue: [...state.queue, ...items] }));
        maybeShowQueueTip(set);
        saveQueue(get);
        await persistFormatPrefs(set, get);
        get().reset();
        const firstItem = items[0];
        if (!firstItem) return;
        await get().startItemDownload(firstItem.id);
        const startedItem = get().queue.find((item) => item.id === firstItem.id);
        if (startedItem?.status !== QUEUE_STATUS.downloading) {
          await scheduler.notifyItemAdded();
        }
        return;
      }
      const item = buildQueueItem(get);
      if (!item) return;
      set((state) => ({ queue: [...state.queue, item] }));
      maybeShowQueueTip(set);
      saveQueue(get);
      await persistFormatPrefs(set, get);
      get().reset();
      await get().startItemDownload(item.id);
    },

    startItemDownload: async (itemId) => {
      const item = get().queue.find((i) => i.id === itemId);
      if (!item) return;

      updateQueueItem(set, itemId, {
        status: QUEUE_STATUS.downloading,
        progressPercent: 0,
        progressDetail: null,
        lastStatus: null,
        error: null
      });

      const result = await window.appApi.downloads.start(buildStartInput(item));

      if (!result.ok) {
        const errorPayload: LocalizedError = { key: null, rawMessage: result.error.message };
        updateQueueItem(set, itemId, { status: QUEUE_STATUS.error, error: errorPayload });
        saveQueue(get);
        return;
      }

      updateQueueItem(set, itemId, { downloadJobId: result.data.job.id });
    },

    cancelItemDownload: async (itemId) => {
      const item = get().queue.find((i) => i.id === itemId);
      if (!item || (item.status !== QUEUE_STATUS.downloading && item.status !== QUEUE_STATUS.paused)) return;
      if (item.status === QUEUE_STATUS.downloading && !item.downloadJobId) return;

      // Held items never spawned a main-process job — skip the IPC.
      if (!isHeld(item)) {
        await window.appApi.downloads.cancel({ jobId: item.downloadJobId ?? undefined });
      }
      updateQueueItem(set, itemId, { status: QUEUE_STATUS.cancelled, downloadJobId: null });
      saveQueue(get);
      scheduler.notifyJobFinished();
    },

    pauseItemDownload: async (itemId) => {
      const item = get().queue.find((i) => i.id === itemId);
      if (!item) return;

      // Hold: pending → paused without IPC. Lets users keep an item in the
      // queue but skip it until they resume — paused items aren't picked by
      // maybeStartNext (which only finds `pending`).
      if (item.status === QUEUE_STATUS.pending) {
        updateQueueItem(set, itemId, { status: QUEUE_STATUS.paused });
        saveQueue(get);
        return;
      }

      if (item.status !== QUEUE_STATUS.downloading) return;
      if (!item.downloadJobId) return;

      const result = await window.appApi.downloads.pause({
        jobId: item.downloadJobId ?? undefined
      });
      if (result.ok && result.data.paused) {
        updateQueueItem(set, itemId, { status: QUEUE_STATUS.paused, progressDetail: null });
        saveQueue(get);
      }
    },

    resumeItemDownload: async (itemId) => {
      const item = get().queue.find((i) => i.id === itemId);
      if (item?.status !== QUEUE_STATUS.paused) return;

      // Held (paused without jobId): just put it back in the queue and let
      // the scheduler pick it. No fresh spawn from here — it's not the active
      // job.
      if (!item.downloadJobId) {
        updateQueueItem(set, itemId, { status: QUEUE_STATUS.pending, error: null });
        saveQueue(get);
        await scheduler.notifyItemAdded();
        return;
      }

      updateQueueItem(set, itemId, { status: QUEUE_STATUS.downloading, error: null });
      saveQueue(get);

      // Within-session pause: the main process still owns the paused job;
      // resume re-spawns under the same jobId so status events stay coherent.
      if (item.downloadJobId) {
        const resumeResult = await window.appApi.downloads.resume({ jobId: item.downloadJobId });
        if (resumeResult.ok && resumeResult.data.resumed) {
          saveQueue(get);
          return;
        }
        if (!resumeResult.ok) {
          console.warn('[resume] resume() failed, falling back to start()', resumeResult.error);
        }
      }

      // If a cancel landed during the resume await, the item is no longer
      // `downloading` — bail before starting a fresh job that would race the
      // cancel that just finalized things.
      const current = get().queue.find((i) => i.id === itemId);
      if (current?.status !== QUEUE_STATUS.downloading) return;

      // Fallback: across app restart the main process has no record of the
      // paused job. Start a fresh job — yt-dlp's --continue picks up the
      // .part file on disk.
      const result = await window.appApi.downloads.start(buildStartInput(item));

      if (!result.ok) {
        const errorPayload: LocalizedError = { key: null, rawMessage: result.error.message };
        updateQueueItem(set, itemId, { status: QUEUE_STATUS.error, error: errorPayload });
        saveQueue(get);
        return;
      }

      updateQueueItem(set, itemId, { downloadJobId: result.data.job.id });
      saveQueue(get);
    },

    removeQueueItem: (itemId) => {
      const item = get().queue.find((i) => i.id === itemId);
      // Held items have no in-flight job — let users remove them like any
      // other queue-only entry. Real paused jobs (with downloadJobId) need a
      // cancel first, so block their removal here.
      if (!item) return;
      if (item.status === QUEUE_STATUS.downloading) return;
      if (item.status === QUEUE_STATUS.paused && !isHeld(item)) return;
      set((state) => ({ queue: state.queue.filter((i) => i.id !== itemId) }));
      saveQueue(get);
    },

    retryQueueItem: async (itemId) => {
      updateQueueItem(set, itemId, {
        status: QUEUE_STATUS.pending,
        progressPercent: 0,
        progressDetail: null,
        lastStatus: null,
        error: null,
        finishedAt: null,
        downloadJobId: null
      });
      saveQueue(get);
      await scheduler.notifyItemAdded();
    },

    clearCompleted: () => {
      set((state) => ({
        queue: state.queue.filter((i) => i.status !== QUEUE_STATUS.done && i.status !== QUEUE_STATUS.cancelled)
      }));
      saveQueue(get);
    },

    pauseAll: async () => {
      const downloading = get().queue.filter((i) => i.status === QUEUE_STATUS.downloading);
      for (const item of downloading) {
        await get().pauseItemDownload(item.id);
      }
    },

    cancelAll: async () => {
      // Single bulk IPC for active/paused jobs in main; renderer marks state.
      await window.appApi.downloads.cancel({});
      set((state) => ({
        queue: state.queue.map((i) => (i.status === QUEUE_STATUS.downloading || i.status === QUEUE_STATUS.paused || i.status === QUEUE_STATUS.pending ? { ...i, status: QUEUE_STATUS.cancelled, downloadJobId: null } : i))
      }));
      saveQueue(get);
      // Wipe any pending sleep — nothing left to schedule.
      scheduler.reset();
    },

    openItemFolder: async (itemId) => {
      const item = get().queue.find((i) => i.id === itemId);
      if (!item) return;
      await window.appApi.shell.openFolder(item.outputDir);
    },

    openItemUrl: (itemId) => {
      const item = get().queue.find((i) => i.id === itemId);
      if (!item) return;
      void window.appApi.shell.openExternal(item.url);
    }
  };
}
