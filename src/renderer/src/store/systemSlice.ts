import type { AppSettings, DependencyId } from '@shared/types.js';
import { QUEUE_STATUS } from '@shared/schemas.js';
import { DEFAULTS } from '@shared/constants.js';
import { i18next, pickLanguage, isRtl } from '@shared/i18n/index.js';
import type { GetState, SetState, ShareTrigger, SystemSlice } from './types.js';
import { notify } from '../lib/notify.js';
import { track } from '../lib/analytics.js';

let unbindWarmupProgress: (() => void) | null = null;
let unbindQueueSnapshot: (() => void) | null = null;
let unbindQueueAdded: (() => void) | null = null;
let unbindQueueUpdated: (() => void) | null = null;
let unbindQueueRemoved: (() => void) | null = null;

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

export function createSystemSlice(set: SetState, get: GetState): SystemSlice {
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

      // Detach prior queue projection bindings (defense for a future re-init flow).
      unbindQueueSnapshot?.();
      unbindQueueAdded?.();
      unbindQueueUpdated?.();
      unbindQueueRemoved?.();

      // Queue projection: hydrate from initial snapshot, then apply diffs.
      // QueueService on main is the queue-of-record; this slice is a read-only
      // mirror of `service.snapshot()` + the four diff event streams.
      unbindQueueSnapshot = window.appApi.queue.events.onSnapshot((items) => {
        set({ queue: items });
      });
      unbindQueueAdded = window.appApi.queue.events.onAdded(({ items, atIdx }) => {
        set((state) => {
          const next = [...state.queue];
          next.splice(atIdx, 0, ...items);
          return { queue: next };
        });
      });
      unbindQueueUpdated = window.appApi.queue.events.onUpdated(({ item }) => {
        const prev = get().queue.find((i) => i.id === item.id);
        set((state) => ({
          queue: state.queue.map((i) => (i.id === item.id ? item : i))
        }));
        // Milestone tracking — fires when a queue item transitions to `done`.
        if (prev && prev.status !== QUEUE_STATUS.done && item.status === QUEUE_STATUS.done) {
          const prevCount = get().settings?.common?.successfulDownloadCount ?? 0;
          const nextCount = prevCount + 1;
          commonPatch(get, set, { successfulDownloadCount: nextCount });
          if (SHARE_MILESTONES.includes(nextCount)) {
            openShareDialogInternal(set, 'milestone');
          }
        }
      });
      unbindQueueRemoved = window.appApi.queue.events.onRemoved(({ itemId }) => {
        set((state) => ({ queue: state.queue.filter((i) => i.id !== itemId) }));
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
      const snapshotPromise = window.appApi.queue.cmd.getSnapshot();
      const [settingsResult, warmUpResult, snapshotResult] = await Promise.all([settingsPromise, warmUpPromise, snapshotPromise]);
      if (snapshotResult.ok) set({ queue: snapshotResult.data });

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
          language: nextLanguage,
          drawerOpen: settingsResult.data.common?.drawerOpen ?? false
        });
      }

      const warmupDiagnostics = warmUpResult.ok ? warmUpResult.data.dependencies : null;
      const warmupBlocking = warmUpResult.ok ? warmUpResult.data.blockingFailures : [];

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
      try {
        const result = await window.appApi.shell.openBinariesDir();
        if (!result.ok) notify.shellActionFailed('shell.openBinariesDir', result.error);
      } catch (err) {
        notify.shellActionFailed('shell.openBinariesDir', err);
      }
    },

    openLogs: async () => {
      try {
        const result = await window.appApi.logs.openDir();
        if (!result.ok) notify.shellActionFailed('logs.openDir', result.error);
      } catch (err) {
        notify.shellActionFailed('logs.openDir', err);
      }
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
