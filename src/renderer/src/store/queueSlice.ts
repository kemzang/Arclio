// Renderer-side queue slice — pure projection of QueueService (main).
// All mutations route through IPC commands; the queue array is hydrated
// from main's snapshot + diff events.
//
// Shims like addToQueue / addAndDownloadImmediately still build QueueItems
// from wizard state because the wizard data lives in the renderer; once
// built, the items are pushed to main via queue.cmd.add.

import type { PlaylistEntry, QueueItem } from '@shared/types.js';
import { QUEUE_STATUS } from '@shared/schemas.js';
import { buildAudioConvertPayload, buildFormatId, buildFormatLabel, generateId, resolveVideoResolution } from './helpers.js';
import { effectiveOutputDir } from '@renderer/lib/path.js';
import { joinSubfolder, safeFolderName } from '@shared/subfolder.js';
import { prepareJob } from '@shared/prepareJob.js';
import type { EmbedOptions, SubtitleOptions } from '@shared/preparedJob.js';
import { sanitizeJobOptions } from '@shared/sanitizeJobOptions.js';
import { resolveOutputContainer } from './wizard/resolveContainer.js';
import i18next from 'i18next';
import type { GetState, SetState, QueueSlice } from './types.js';
import { persistFormatPrefs } from './wizard/persistFormatPrefs.js';

function maybeShowQueueTip(set: SetState): void {
  if (!localStorage.getItem('arroxy_seen_queue_tip')) {
    localStorage.setItem('arroxy_seen_queue_tip', '1');
    set({ drawerOpen: true, showQueueTip: true });
  }
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
  const embed: EmbedOptions = {
    chapters: state.wizardEmbedChapters,
    metadata: state.wizardEmbedMetadata,
    thumbnail: state.wizardEmbedThumbnail,
    description: state.wizardWriteDescription,
    thumbnailSidecar: state.wizardWriteThumbnail
  };

  const resolvedContainer = resolveOutputContainer(selectedVideoFormatId, audioSelection, state.wizardSubtitleMode, wizardFormats, activePreset);
  const { overrides } = sanitizeJobOptions({
    isSubtitleOnly: activePreset === 'subtitle-only',
    hasVideoTrack: selectedVideoFormatId !== '',
    resolvedOutputContainer: resolvedContainer,
    subtitleMode: state.wizardSubtitleMode,
    subtitleLanguages,
    embed,
    sponsorBlockMode: state.wizardSponsorBlockMode
  });

  const subtitles: SubtitleOptions | undefined = subtitleLanguages.length > 0 ? { languages: subtitleLanguages, mode: overrides.subtitleMode, format: state.wizardSubtitleFormat, writeAuto: writeAutoSubs } : undefined;

  const job = prepareJob({
    mode: 'single',
    extractor: state.wizardExtractor,
    extractorKey: state.wizardExtractorKey,
    formatId,
    audioConvert,
    activePreset,
    expectedBytes,
    subtitles,
    sponsorBlockMode: overrides.sponsorBlockMode,
    sponsorBlockCategories: state.wizardSponsorBlockCategories,
    embed: overrides.embed
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
    extractor: state.wizardExtractor,
    extractorKey: state.wizardExtractorKey,
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
    playlistGroupId,
    job
  };
}

export function createQueueSlice(set: SetState, get: GetState): QueueSlice {
  return {
    queue: [],

    addToQueue: async () => {
      const { playlistItems, selectedPlaylistItemIds } = get();
      if (get().wizardMode === 'playlist') {
        const groupId = generateId();
        const selected = playlistItems.filter((e) => selectedPlaylistItemIds.includes(e.id));
        const items = selected.map((e) => buildPlaylistQueueItem(e, get, groupId));
        await window.appApi.queue.cmd.add(items);
        maybeShowQueueTip(set);
        await persistFormatPrefs(set, get);
        get().reset();
        return;
      }
      const item = buildQueueItem(get);
      if (!item) return;
      await window.appApi.queue.cmd.add([item]);
      maybeShowQueueTip(set);
      await persistFormatPrefs(set, get);
      get().reset();
    },

    addAndDownloadImmediately: async () => {
      const { playlistItems, selectedPlaylistItemIds } = get();
      if (get().wizardMode === 'playlist') {
        const groupId = generateId();
        const selected = playlistItems.filter((e) => selectedPlaylistItemIds.includes(e.id));
        const items = selected.map((e) => buildPlaylistQueueItem(e, get, groupId));
        await window.appApi.queue.cmd.add(items);
        maybeShowQueueTip(set);
        await persistFormatPrefs(set, get);
        get().reset();
        // QueueService auto-starts the head of the queue when cap allows;
        // explicit start here is redundant but harmless if cap is full.
        return;
      }
      const item = buildQueueItem(get);
      if (!item) return;
      await window.appApi.queue.cmd.add([item]);
      maybeShowQueueTip(set);
      await persistFormatPrefs(set, get);
      get().reset();
    },

    cancelItemDownload: async (itemId) => {
      await window.appApi.queue.cmd.cancel({ itemId });
    },

    pauseItemDownload: async (itemId) => {
      await window.appApi.queue.cmd.pause({ itemId });
    },

    resumeItemDownload: async (itemId) => {
      await window.appApi.queue.cmd.resume({ itemId });
    },

    removeQueueItem: async (itemId) => {
      await window.appApi.queue.cmd.remove({ itemId });
    },

    retryQueueItem: async (itemId) => {
      await window.appApi.queue.cmd.retry({ itemId });
    },

    clearCompleted: async () => {
      await window.appApi.queue.cmd.clearCompleted();
    },

    pauseAll: async () => {
      const downloading = get().queue.filter((i) => i.status === QUEUE_STATUS.running);
      for (const item of downloading) {
        await window.appApi.queue.cmd.pause({ itemId: item.id });
      }
    },

    resumeFirst: async () => {
      const first = get().queue.find((i) => i.status === QUEUE_STATUS.pausedActive || i.status === QUEUE_STATUS.pausedHeld);
      if (!first) return;
      await window.appApi.queue.cmd.resume({ itemId: first.id });
    },

    cancelAll: async () => {
      await window.appApi.queue.cmd.cancel({ itemId: null });
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
