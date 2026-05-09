import type { AppSettings, DependencyId, QueueItem, SubtitleFormat, SubtitleMode } from '@shared/types.js';
import { QUEUE_STATUS, STATUS_KEY } from '@shared/schemas.js';
import { DEFAULTS } from '@shared/constants.js';
import { i18next, pickLanguage, isRtl } from '@shared/i18n/index.js';
import { nextMonotonicPercent, ProgressFormatter } from './progress.js';
import { progressFormatters, saveQueue, updateQueueItem } from './queueSlice.js';
import type { JobScheduler } from './jobScheduler.js';
import type { GetState, SetState, ShareTrigger, SystemSlice } from './types.js';
import { notify } from '../lib/notify.js';
import { track } from '../lib/analytics.js';

let unbindStatus: (() => void) | null = null;
let unbindProgress: (() => void) | null = null;
let unbindWarmupProgress: (() => void) | null = null;

const SHARE_MILESTONES: readonly number[] = [3, 25, 100];

function commonPatch(get: GetState, set: SetState, patch: Partial<AppSettings['common']>): void {
  const previous = get().settings;
  if (previous) {
    set({ settings: { ...previous, common: { ...previous.common, ...patch } } });
  }
  void window.appApi.settings.update({ common: patch }).then((result) => {
    if (!result.ok) {
      // Revert optimistic update — UI was showing patched value, but the
      // canonical state on disk never changed. Without rollback, renderer
      // and main process diverge until next initialize().
      if (previous) set({ settings: previous });
      notify.settingsSaveFailed('share', result.error);
      return;
    }
    set({ settings: result.data });
  });
}

// Shared pattern for setCookiesPath/setProxyUrl/...: optimistic update, IPC
// patch, on failure revert to the value captured before the patch.
async function applyCommonPatchAsync(get: GetState, set: SetState, label: string, patch: Partial<AppSettings['common']>): Promise<void> {
  const previous = get().settings;
  if (previous) set({ settings: { ...previous, common: { ...previous.common, ...patch } } });
  const result = await window.appApi.settings.update({ common: patch });
  if (!result.ok) {
    if (previous) set({ settings: previous });
    notify.settingsSaveFailed(label, result.error);
    return;
  }
  set({ settings: result.data });
}

function openShareDialogInternal(set: SetState, trigger: ShareTrigger): void {
  set({ shareDialogOpen: true, shareDialogTrigger: trigger });
  track('share_dialog_opened', { via: trigger });
}

const OVERRIDE_KEY: Record<DependencyId, 'ytDlp' | 'ffmpeg' | 'ffprobe' | 'deno'> = {
  'yt-dlp': 'ytDlp',
  ffmpeg: 'ffmpeg',
  ffprobe: 'ffprobe',
  deno: 'deno'
};

function makeBinaryOverridePatch(id: DependencyId, path: string | undefined): { common: { binaryOverrides: Record<string, string | undefined> } } {
  return { common: { binaryOverrides: { [OVERRIDE_KEY[id]]: path } } };
}

export function createSystemSlice(set: SetState, get: GetState, scheduler: JobScheduler): SystemSlice {
  return {
    initialized: false,
    initializing: false,
    warmupDiagnostics: null,
    warmupBlocking: [],
    warmupRunning: false,
    warmupProgress: null,
    settings: null,
    // Guard `navigator` so vitest's node-env tests (e.g. format-selection-view)
    // can construct the store at module-load time without DOM globals.
    // initialize() reassigns from settingsResult.common.language anyway.
    language: typeof navigator !== 'undefined' ? pickLanguage(navigator.language) : pickLanguage('en'),
    commonPaths: undefined,
    shareDialogOpen: false,
    shareDialogTrigger: null,

    initialize: async () => {
      if (get().initialized || get().initializing) return;
      set({ initializing: true });

      // Detach any prior bindings (defense for a future re-init flow).
      unbindStatus?.();
      unbindProgress?.();
      scheduler.reset();

      unbindStatus = window.appApi.events.onStatus((event) => {
        const item = get().queue.find((i) => i.downloadJobId === event.jobId);
        if (!item) return;

        if (event.stage === 'done') {
          progressFormatters.delete(event.jobId);
          updateQueueItem(set, item.id, {
            status: QUEUE_STATUS.done,
            progressPercent: 100,
            finishedAt: new Date().toISOString(),
            downloadJobId: null,
            lastStatus: { key: event.statusKey, params: event.params }
          });
          saveQueue(get);
          const prevCount = get().settings?.common?.successfulDownloadCount ?? 0;
          const nextCount = prevCount + 1;
          commonPatch(get, set, { successfulDownloadCount: nextCount });
          if (SHARE_MILESTONES.includes(nextCount)) {
            openShareDialogInternal(set, 'milestone');
          }
          scheduler.notifyJobFinished();
        } else if (event.stage === 'error') {
          progressFormatters.delete(event.jobId);
          updateQueueItem(set, item.id, {
            status: QUEUE_STATUS.error,
            error: event.error ?? { key: null },
            lastStatus: { key: event.statusKey, params: event.params },
            downloadJobId: null
          });
          saveQueue(get);
          scheduler.notifyJobFinished();
        } else {
          // Phase transitions (merge, fetch subs, sleep) supersede stale download-speed
          // progress detail — clear it so the phase status text becomes visible.
          const isPhaseTransition = event.statusKey === STATUS_KEY.mergingFormats || event.statusKey === STATUS_KEY.fetchingSubtitles || event.statusKey === STATUS_KEY.sleepingBetweenRequests || event.statusKey === STATUS_KEY.extractingAudio || event.statusKey === STATUS_KEY.convertingVideo || event.statusKey === STATUS_KEY.embeddingMetadata || event.statusKey === STATUS_KEY.movingFiles;
          // yt-dlp emits per-file percent (0→100% for each sub, then video, then audio).
          // Reset the bar when a new file becomes the active download target so the
          // first sub's instant 100% doesn't peg it for the rest of the job.
          const isFileBoundary = event.statusKey === STATUS_KEY.downloadingMedia || event.statusKey === STATUS_KEY.fetchingSubtitles;
          // Postprocess phases (audio extract, video convert, embed metadata, move
          // files) emit no `[download] N%` lines, so the progress throttle in
          // DownloadEventBridge frequently drops the final 100% event and leaves
          // the bar at 99.x. Snap to 100 once postprocess starts — the data
          // download is finished by definition.
          const isPostProcessPhase = event.statusKey === STATUS_KEY.extractingAudio || event.statusKey === STATUS_KEY.convertingVideo || event.statusKey === STATUS_KEY.embeddingMetadata || event.statusKey === STATUS_KEY.movingFiles;
          updateQueueItem(set, item.id, {
            lastStatus: { key: event.statusKey, params: event.params },
            ...(isPhaseTransition ? { progressDetail: null } : {}),
            ...(isFileBoundary ? { progressPercent: 0 } : {}),
            ...(isPostProcessPhase ? { progressPercent: 100 } : {})
          });
        }
      });

      unbindProgress = window.appApi.events.onProgress((event) => {
        const item = get().queue.find((i) => i.downloadJobId === event.jobId);
        if (!item) return;

        let formatter = progressFormatters.get(event.jobId);
        if (!formatter) {
          formatter = new ProgressFormatter();
          progressFormatters.set(event.jobId, formatter);
        }
        const detail = formatter.update(event.line);
        updateQueueItem(set, item.id, {
          progressPercent: nextMonotonicPercent(item.progressPercent, event.percent),
          ...(detail !== null ? { progressDetail: detail } : {})
        });
      });

      // The warmup-progress listener stays bound for the lifetime of the
      // process — repair flows trigger another warmup run without re-entering
      // initialize, so we can't unbind it here like the original did.
      unbindWarmupProgress?.();
      unbindWarmupProgress = window.appApi.events.onWarmupProgress((event) => {
        set((state) => ({
          warmupProgress: { ...(state.warmupProgress ?? {}), [event.binary]: event }
        }));
      });

      set({ warmupRunning: true });
      const settingsPromise = window.appApi.settings.get();
      const warmUpPromise = window.appApi.app.warmUp();
      const queuePromise = window.appApi.queue.load();

      const [settingsResult, warmUpResult, queueResult] = await Promise.all([settingsPromise, warmUpPromise, queuePromise]);

      const savedQueue = queueResult.ok ? queueResult.data : [];
      if (!queueResult.ok) {
        console.error('[queue] load failed — starting with empty queue', queueResult.error);
      }

      if (settingsResult.ok) {
        const common = settingsResult.data.common ?? ({} as AppSettings['common']);
        const zoom = common.uiZoom ?? DEFAULTS.uiZoom;
        const theme = common.uiTheme ?? DEFAULTS.uiTheme;
        const persistedLang = common.language;
        const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        document.documentElement.classList.toggle('dark', isDark);
        const nextLanguage = persistedLang ?? get().language;
        if (nextLanguage !== i18next.language) {
          void i18next.changeLanguage(nextLanguage);
        }
        void window.appApi.app.setLanguage(nextLanguage);
        set({
          settings: settingsResult.data,
          wizardOutputDir: common.defaultOutputDir,
          commonPaths: common.commonPaths,
          uiZoom: zoom,
          uiTheme: theme,
          language: nextLanguage
        });
      }

      const warmupDiagnostics = warmUpResult.ok ? warmUpResult.data.dependencies : null;
      const warmupBlocking = warmUpResult.ok ? warmUpResult.data.blockingFailures : [];

      if (savedQueue.length > 0) {
        type StoredItem = (typeof savedQueue)[number] & {
          subtitleLanguages?: string[];
          writeAutoSubs?: boolean;
          subtitleMode?: SubtitleMode;
          subtitleFormat?: SubtitleFormat;
        };
        const migratedQueue: QueueItem[] = (savedQueue as StoredItem[]).map((item) => ({
          ...item,
          subtitleLanguages: item.subtitleLanguages ?? [],
          writeAutoSubs: item.writeAutoSubs ?? false,
          subtitleMode: item.subtitleMode ?? DEFAULTS.subtitleMode,
          subtitleFormat: item.subtitleFormat ?? DEFAULTS.subtitleFormat
        }));
        const restoredDrawerOpen = settingsResult.ok ? (settingsResult.data.common?.drawerOpen ?? false) : false;
        set({ queue: migratedQueue, drawerOpen: restoredDrawerOpen });
        await scheduler.notifyItemAdded();
      }

      set({ initialized: true, initializing: false, warmupRunning: false, warmupDiagnostics, warmupBlocking });
    },

    cancelWarmup: async () => {
      try {
        await window.appApi.app.cancelWarmup();
      } catch (err) {
        notify.warmupFailed('cancel threw', err);
      }
    },

    repairWarmup: async () => {
      if (get().warmupRunning) return;
      set({ warmupRunning: true });
      try {
        const result = await window.appApi.app.warmUp({ force: true });
        if (result.ok) {
          set({ warmupDiagnostics: result.data.dependencies, warmupBlocking: result.data.blockingFailures });
        } else {
          notify.warmupFailed('repair failed', result.error);
        }
      } catch (err) {
        notify.warmupFailed('repair threw', err);
      } finally {
        set({ warmupRunning: false });
      }
    },

    setBinaryOverride: async (id, path) => {
      const patch = makeBinaryOverridePatch(id, path);
      const result = await window.appApi.settings.update(patch);
      if (!result.ok) {
        notify.settingsSaveFailed('binaryOverrides', result.error);
        return;
      }
      set({ settings: result.data });
      try {
        await get().repairWarmup();
      } catch (err) {
        notify.warmupFailed('post-override repair threw', err);
      }
    },

    clearBinaryOverride: async (id) => {
      const patch = makeBinaryOverridePatch(id, undefined);
      const result = await window.appApi.settings.update(patch);
      if (!result.ok) {
        notify.settingsSaveFailed('binaryOverrides clear', result.error);
        return;
      }
      set({ settings: result.data });
      try {
        await get().repairWarmup();
      } catch (err) {
        notify.warmupFailed('post-clear repair threw', err);
      }
    },

    openBinariesDir: async () => {
      await window.appApi.shell.openBinariesDir();
    },

    openLogs: async () => {
      await window.appApi.logs.openDir();
    },

    setLanguage: (lang) => {
      set({ language: lang });
      document.documentElement.lang = lang;
      document.documentElement.dir = isRtl(lang) ? 'rtl' : 'ltr';
      void i18next.changeLanguage(lang);
      void window.appApi.settings.update({ common: { language: lang } }).then((result) => {
        if (!result.ok) notify.settingsSaveFailed('language', result.error);
      });
      void window.appApi.app.setLanguage(lang);
    },

    setCookiesPath: async (path) => {
      await applyCommonPatchAsync(get, set, 'cookiesPath', { cookiesPath: path });
    },

    setCookiesMode: async (mode) => {
      await applyCommonPatchAsync(get, set, 'cookiesMode', { cookiesMode: mode });
    },

    setCookiesBrowser: async (browser) => {
      await applyCommonPatchAsync(get, set, 'cookiesBrowser', { cookiesBrowser: browser });
    },

    setProxyUrl: async (url) => {
      await applyCommonPatchAsync(get, set, 'proxyUrl', { proxyUrl: url });
    },

    setClipboardWatchEnabled: async (enabled) => {
      await applyCommonPatchAsync(get, set, 'clipboardWatchEnabled', { clipboardWatchEnabled: enabled });
    },

    setCloseBehavior: async (value) => {
      await applyCommonPatchAsync(get, set, 'closeBehavior', { closeBehavior: value });
    },

    setAnalyticsEnabled: async (enabled) => {
      await applyCommonPatchAsync(get, set, 'analyticsEnabled', { analyticsEnabled: enabled });
    },

    openShareDialog: (trigger) => {
      openShareDialogInternal(set, trigger);
    },

    closeShareDialog: () => {
      set({ shareDialogOpen: false, shareDialogTrigger: null });
    },

    setShareInlineCardDismissed: async () => {
      track('share_inline_card_dismissed');
      await applyCommonPatchAsync(get, set, 'shareInlineCardDismissed', { shareInlineCardDismissed: true });
    },

    setShareHighValueBannerDismissed: async () => {
      track('share_prompt_dismissed', { via: 'high-value-inline' });
      await applyCommonPatchAsync(get, set, 'shareHighValueBannerDismissed', { shareHighValueBannerDismissed: true });
    }
  };
}
