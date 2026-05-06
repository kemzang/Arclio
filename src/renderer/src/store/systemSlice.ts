import type { AppSettings, DependencyId, QueueItem, SubtitleFormat, SubtitleMode } from '@shared/types';
import { QUEUE_STATUS, STATUS_KEY } from '@shared/schemas';
import { DEFAULTS } from '@shared/constants';
import { i18next, pickLanguage, isRtl } from '@shared/i18n';
import { nextMonotonicPercent, ProgressFormatter } from './progress';
import { progressFormatters, saveQueue, updateQueueItem } from './queueSlice';
import type { JobScheduler } from './jobScheduler';
import type { GetState, SetState, SystemSlice } from './types';
import { notify } from '../lib/notify';

let unbindStatus: (() => void) | null = null;
let unbindProgress: (() => void) | null = null;
let unbindWarmupProgress: (() => void) | null = null;

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
    language: pickLanguage(navigator.language),
    commonPaths: undefined,

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
          updateQueueItem(set, item.id, {
            lastStatus: { key: event.statusKey, params: event.params },
            ...(isPhaseTransition ? { progressDetail: null } : {}),
            ...(isFileBoundary ? { progressPercent: 0 } : {})
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
      const current = get().settings;
      if (current) set({ settings: { ...current, common: { ...current.common, cookiesPath: path } } });
      const result = await window.appApi.settings.update({ common: { cookiesPath: path } });
      if (!result.ok) {
        notify.settingsSaveFailed('cookiesPath', result.error);
        return;
      }
      set({ settings: result.data });
    },

    setCookiesEnabled: async (enabled) => {
      const current = get().settings;
      if (current) set({ settings: { ...current, common: { ...current.common, cookiesEnabled: enabled } } });
      const result = await window.appApi.settings.update({ common: { cookiesEnabled: enabled } });
      if (!result.ok) {
        notify.settingsSaveFailed('cookiesEnabled', result.error);
        return;
      }
      set({ settings: result.data });
    },

    setProxyUrl: async (url) => {
      const current = get().settings;
      if (current) set({ settings: { ...current, common: { ...current.common, proxyUrl: url } } });
      const result = await window.appApi.settings.update({ common: { proxyUrl: url } });
      if (!result.ok) {
        notify.settingsSaveFailed('proxyUrl', result.error);
        return;
      }
      set({ settings: result.data });
    },

    setClipboardWatchEnabled: async (enabled) => {
      const current = get().settings;
      if (current) set({ settings: { ...current, common: { ...current.common, clipboardWatchEnabled: enabled } } });
      const result = await window.appApi.settings.update({ common: { clipboardWatchEnabled: enabled } });
      if (!result.ok) {
        notify.settingsSaveFailed('clipboardWatchEnabled', result.error);
        return;
      }
      set({ settings: result.data });
    },

    setCloseBehavior: async (value) => {
      const current = get().settings;
      if (current) set({ settings: { ...current, common: { ...current.common, closeBehavior: value } } });
      const result = await window.appApi.settings.update({ common: { closeBehavior: value } });
      if (!result.ok) {
        notify.settingsSaveFailed('closeBehavior', result.error);
        return;
      }
      set({ settings: result.data });
    },

    setAnalyticsEnabled: async (enabled) => {
      const current = get().settings;
      if (current) set({ settings: { ...current, common: { ...current.common, analyticsEnabled: enabled } } });
      const result = await window.appApi.settings.update({ common: { analyticsEnabled: enabled } });
      if (!result.ok) {
        notify.settingsSaveFailed('analyticsEnabled', result.error);
        return;
      }
      set({ settings: result.data });
    }
  };
}
