import { DEFAULTS } from '@shared/constants';
import { DEFAULT_AUDIO_BITRATE } from '@shared/schemas';
import type { AppError, AppSettings, FormatOption, PlaylistEntry, PlaylistPreset, Preset, SubtitleMap, WizardTransition } from '@shared/types';
import { cleanYoutubeUrl, forcePlaylistOnly, forceVideoOnly, isMixedVideoPlaylistUrl, isPlaylistUrl, isSingleVideoUrl } from '@shared/url';
import type { AppState, AudioSelection, GetState, SetState, WizardMode, WizardSlice, WizardStep } from './types';
import { presetProducesMedia, presetProducesVideo } from '@shared/presetTraits';
import { STEPS, shouldSkip, type VisibleStep } from '../components/wizard/stepNavigation';

function pickWizardSnapshot(state: AppState): Record<string, unknown> {
  return {
    url: state.wizardUrl,
    title: state.wizardTitle,
    duration: state.wizardDuration,
    formatsCount: state.wizardFormats.length,
    selectedVideoFormatId: state.selectedVideoFormatId,
    audioSelection: state.audioSelection,
    activePreset: state.activePreset,
    subtitleLanguages: state.wizardSubtitleLanguages,
    subtitleMode: state.wizardSubtitleMode,
    subtitleFormat: state.wizardSubtitleFormat,
    subtitleSkipped: state.wizardSubtitleSkipped,
    sponsorBlockMode: state.wizardSponsorBlockMode,
    sponsorBlockCategories: state.wizardSponsorBlockCategories,
    embedChapters: state.wizardEmbedChapters,
    embedMetadata: state.wizardEmbedMetadata,
    embedThumbnail: state.wizardEmbedThumbnail,
    writeDescription: state.wizardWriteDescription,
    writeThumbnail: state.wizardWriteThumbnail,
    outputDir: state.wizardOutputDir,
    subfolderEnabled: state.wizardSubfolderEnabled,
    subfolderName: state.wizardSubfolderName
  };
}

function logStep(transition: WizardTransition, fromStep: WizardStep, toStep: WizardStep, snapshot: Record<string, unknown>): void {
  window.appApi.diagnostics.logWizardStep({ transition, fromStep, toStep, snapshot });
}

// Private helpers — only used inside this slice.

function groupedNonAudioFormats(formats: FormatOption[]): { resolution: string; formatId: string }[] {
  const seen = new Set<string>();
  const out: { resolution: string; formatId: string }[] = [];
  for (const f of formats) {
    if (f.isAudioOnly) continue;
    const key = `${f.resolution}|${f.dynamicRange ?? ''}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push({ resolution: f.resolution, formatId: f.formatId });
    }
  }
  return out;
}

function nativeAudio(formatId: string | null): AudioSelection {
  return formatId === null ? { kind: 'none' } : { kind: 'native', formatId };
}

export function applyPreset(preset: Preset, formats: FormatOption[]): { videoFormatId: string; audioSelection: AudioSelection } {
  const grouped = groupedNonAudioFormats(formats);
  const audioFormats = formats.filter((f) => f.isAudioOnly);
  const bestAudio = audioFormats[0]?.formatId ?? null;
  const worstAudio = audioFormats[audioFormats.length - 1]?.formatId ?? bestAudio;

  if (preset === 'best-quality') return { videoFormatId: grouped[0]?.formatId ?? '', audioSelection: nativeAudio(bestAudio) };
  if (preset === 'audio-only') return { videoFormatId: '', audioSelection: nativeAudio(bestAudio) };
  if (preset === 'subtitle-only') return { videoFormatId: '', audioSelection: { kind: 'none' } };
  if (preset === 'balanced') {
    const target = grouped.find((g) => {
      const m = /(\d+)/.exec(g.resolution);
      return m ? Number(m[1]) <= 720 : false;
    });
    return {
      videoFormatId: target?.formatId ?? grouped[grouped.length - 1]?.formatId ?? '',
      audioSelection: nativeAudio(bestAudio)
    };
  }
  // small-file
  return { videoFormatId: grouped[grouped.length - 1]?.formatId ?? '', audioSelection: nativeAudio(worstAudio) };
}

// Persisted audio selection is stored verbatim. Convert/none kinds carry no
// per-video identifiers and revive directly. For native, the YouTube formatId
// can change between videos, so fall back: exact id → same ext → bestAudio.
// Returns null when nothing is persisted; caller uses its default in that case.
function reviveAudio(persisted: AudioSelection | undefined, formats: FormatOption[]): AudioSelection | null {
  if (!persisted) return null;
  if (persisted.kind !== 'native') return persisted;

  const audioFormats = formats.filter((f) => f.isAudioOnly);
  if (audioFormats.length === 0) return { kind: 'none' };
  if (audioFormats.some((f) => f.formatId === persisted.formatId)) return persisted;

  // The persisted formatId came from an earlier probe and isn't in this list.
  // Without that earlier probe we can't recover its ext, so just pick the best
  // native audio for the current video.
  return nativeAudio(audioFormats[0].formatId);
}

export function restoreFormatSelection(formats: FormatOption[], settings: AppSettings | null): { videoFormatId: string; audioSelection: AudioSelection; preset: Preset | null } {
  const grouped = groupedNonAudioFormats(formats);
  const audioFormats = formats.filter((f) => f.isAudioOnly);
  const bestAudio = audioFormats[0]?.formatId ?? null;
  const single = settings?.single;
  const revived = reviveAudio(single?.lastAudioSelection, formats);

  if (single?.lastPreset) {
    const base = applyPreset(single.lastPreset, formats);
    return { ...base, audioSelection: revived ?? base.audioSelection, preset: single.lastPreset };
  }
  if (single?.lastVideoResolution === 'audio-only') {
    return { videoFormatId: '', audioSelection: revived ?? nativeAudio(bestAudio), preset: 'audio-only' };
  }
  if (single?.lastVideoResolution) {
    const match = grouped.find((g) => g.resolution === single.lastVideoResolution);
    if (match) return { videoFormatId: match.formatId, audioSelection: revived ?? nativeAudio(bestAudio), preset: null };
  }
  const base = applyPreset('best-quality', formats);
  return { ...base, audioSelection: revived ?? base.audioSelection, preset: 'best-quality' };
}

function restoreSubtitleSelection(subtitles: SubtitleMap | undefined, automaticCaptions: SubtitleMap | undefined, settings: AppSettings | null): { languages: string[] } {
  const available = new Set([...Object.keys(subtitles ?? {}), ...Object.keys(automaticCaptions ?? {})]);
  const languages = (settings?.single?.lastSubtitleLanguages ?? []).filter((l) => available.has(l));
  return { languages };
}

function restoreCommonWizardPrefs(settings: AppSettings | null): Pick<AppState, 'wizardSponsorBlockMode' | 'wizardSponsorBlockCategories' | 'wizardEmbedChapters' | 'wizardEmbedMetadata' | 'wizardEmbedThumbnail' | 'wizardWriteDescription' | 'wizardWriteThumbnail'> {
  return {
    wizardSponsorBlockMode: settings?.common?.lastSponsorBlockMode ?? DEFAULTS.sponsorBlockMode,
    wizardSponsorBlockCategories: settings?.common?.lastSponsorBlockCategories ?? [...DEFAULTS.sponsorBlockCategories],
    wizardEmbedChapters: settings?.common?.embedChapters ?? DEFAULTS.embedChapters,
    wizardEmbedMetadata: settings?.common?.embedMetadata ?? DEFAULTS.embedMetadata,
    wizardEmbedThumbnail: settings?.common?.embedThumbnail ?? DEFAULTS.embedThumbnail,
    wizardWriteDescription: settings?.common?.writeDescription ?? DEFAULTS.writeDescription,
    wizardWriteThumbnail: settings?.common?.writeThumbnail ?? DEFAULTS.writeThumbnail
  };
}

const RESET_STATE = {
  wizardStep: 'url' as WizardStep,
  wizardMode: 'single' as WizardMode,
  wizardUrl: '',
  wizardTitle: '',
  wizardThumbnail: '',
  wizardDuration: undefined as number | undefined,
  wizardFormats: [] as FormatOption[],
  wizardFormatsDegraded: null,
  advancedAutoOpen: false,
  formatsLoading: false,
  wizardError: null,
  wizardErrorOrigin: null,
  wizardSubtitles: {} as SubtitleMap,
  wizardAutomaticCaptions: {} as SubtitleMap,
  wizardSubtitleLanguages: [] as string[],
  wizardSubtitleSkipped: false,
  wizardSubtitleMode: DEFAULTS.subtitleMode,
  wizardSubtitleFormat: DEFAULTS.subtitleFormat,
  wizardSponsorBlockMode: DEFAULTS.sponsorBlockMode,
  wizardSponsorBlockCategories: DEFAULTS.sponsorBlockCategories,
  wizardEmbedChapters: DEFAULTS.embedChapters,
  wizardEmbedMetadata: DEFAULTS.embedMetadata,
  wizardEmbedThumbnail: DEFAULTS.embedThumbnail,
  wizardWriteDescription: DEFAULTS.writeDescription,
  wizardWriteThumbnail: DEFAULTS.writeThumbnail,
  wizardSubfolderEnabled: false,
  wizardSubfolderName: '',
  playlistItems: [] as PlaylistEntry[],
  selectedPlaylistItemIds: [] as string[],
  playlistTitle: '',
  playlistId: '',
  playlistProbeLoading: false,
  mixedUrlPromptOpen: false,
  mixedUrlPending: null as string | null,
  selectedPlaylistPreset: null as PlaylistPreset | null
} as const;

async function runFormatProbe(url: string, set: SetState, get: GetState): Promise<void> {
  const result = await window.appApi.downloads.getFormats({ url });
  if (!result.ok) {
    set({ wizardStep: 'error', formatsLoading: false, wizardError: result.error, wizardErrorOrigin: 'formats', wizardFormatsDegraded: null });
    return;
  }
  const { formats, title, thumbnail, duration, subtitles = {}, automaticCaptions = {}, degraded } = result.data;
  const settings = get().settings;
  const { videoFormatId, audioSelection, preset } = restoreFormatSelection(formats, settings);
  const { languages: subtitleLanguages } = restoreSubtitleSelection(subtitles, automaticCaptions, settings);
  set({
    wizardFormats: formats,
    wizardFormatsDegraded: degraded ?? null,
    wizardTitle: title,
    wizardThumbnail: thumbnail,
    wizardDuration: duration,
    selectedVideoFormatId: videoFormatId,
    audioSelection,
    activePreset: preset,
    wizardSubtitles: subtitles,
    wizardAutomaticCaptions: automaticCaptions,
    wizardSubtitleLanguages: subtitleLanguages,
    wizardSubtitleSkipped: false,
    wizardSubtitleMode: settings?.single?.lastSubtitleMode ?? DEFAULTS.subtitleMode,
    wizardSubtitleFormat: settings?.single?.lastSubtitleFormat ?? DEFAULTS.subtitleFormat,
    ...restoreCommonWizardPrefs(settings),
    wizardSubfolderEnabled: settings?.single?.lastSubfolderEnabled ?? false,
    wizardSubfolderName: settings?.single?.lastSubfolder ?? '',
    formatsLoading: false
  });
}

async function runSingleVideoProbe(url: string, set: SetState, get: GetState): Promise<void> {
  const fromStep = get().wizardStep;
  set({
    wizardUrl: url,
    wizardStep: 'formats',
    wizardMode: 'single',
    formatsLoading: true,
    wizardError: null,
    playlistItems: [],
    selectedPlaylistItemIds: [],
    playlistTitle: '',
    playlistId: ''
  });
  logStep('submitUrl', fromStep, 'formats', pickWizardSnapshot(get()));
  await runFormatProbe(url, set, get);
}

async function runPlaylistProbe(url: string, set: SetState, get: GetState): Promise<void> {
  const fromStep = get().wizardStep;
  set({ wizardUrl: url, wizardStep: 'playlistItems', wizardMode: 'playlist', playlistProbeLoading: true, wizardError: null });
  logStep('submitUrl', fromStep, 'playlistItems', pickWizardSnapshot(get()));

  const result = await window.appApi.downloads.getPlaylistItems({ url });
  if (!result.ok) {
    set({ wizardStep: 'error', playlistProbeLoading: false, wizardError: result.error, wizardErrorOrigin: 'formats' });
    return;
  }
  const { entries, playlistTitle, playlistId } = result.data;
  const settings = get().settings;
  set({
    playlistItems: entries,
    selectedPlaylistItemIds: entries.map((e) => e.id),
    playlistTitle,
    playlistId,
    playlistProbeLoading: false,
    ...restoreCommonWizardPrefs(settings),
    // Restore mode-scoped prefs: playlist preset + playlist subfolder are
    // persisted under their own keys so they survive single-mode runs in between.
    selectedPlaylistPreset: settings?.playlist?.lastPlaylistPreset ?? null,
    wizardSubfolderEnabled: settings?.playlist?.lastPlaylistSubfolderEnabled ?? false,
    wizardSubfolderName: settings?.playlist?.lastPlaylistSubfolder ?? ''
  });
}

export function createWizardSlice(set: SetState, get: GetState): WizardSlice {
  return {
    ...RESET_STATE,
    selectedVideoFormatId: '',
    audioSelection: { kind: 'none' },
    lastConvertBitrate: DEFAULT_AUDIO_BITRATE,
    activePreset: null,
    wizardOutputDir: '',

    setWizardUrl: (url) => set({ wizardUrl: url }),

    submitUrl: async () => {
      const cleaned = cleanYoutubeUrl(get().wizardUrl.trim());
      if (!cleaned) return;

      if (isMixedVideoPlaylistUrl(cleaned)) {
        set({ wizardUrl: cleaned, mixedUrlPromptOpen: true, mixedUrlPending: cleaned, wizardError: null });
        return;
      }

      if (isPlaylistUrl(cleaned)) {
        await runPlaylistProbe(cleaned, set, get);
        return;
      }

      if (!isSingleVideoUrl(cleaned)) {
        const error: AppError = {
          code: 'validation',
          message: 'Unsupported URL',
          recoverable: false,
          localizedKey: 'unsupportedUrl'
        };
        const fromStep = get().wizardStep;
        set({
          wizardUrl: cleaned,
          wizardStep: 'error',
          formatsLoading: false,
          wizardError: error,
          wizardErrorOrigin: 'formats'
        });
        logStep('submitUrl', fromStep, 'error', pickWizardSnapshot(get()));
        return;
      }

      await runSingleVideoProbe(cleaned, set, get);
    },

    dismissMixedPrompt: async (choice) => {
      const pending = get().mixedUrlPending;
      set({ mixedUrlPromptOpen: false, mixedUrlPending: null });
      if (!pending) return;
      const url = choice === 'video' ? forceVideoOnly(pending) : forcePlaylistOnly(pending);
      set({ wizardUrl: url });
      if (choice === 'video') {
        await runSingleVideoProbe(url, set, get);
      } else {
        await runPlaylistProbe(url, set, get);
      }
    },

    setPlaylistItemSelected: (id, checked) =>
      set((state) => ({
        selectedPlaylistItemIds: checked ? (state.selectedPlaylistItemIds.includes(id) ? state.selectedPlaylistItemIds : [...state.selectedPlaylistItemIds, id]) : state.selectedPlaylistItemIds.filter((x) => x !== id)
      })),

    selectAllPlaylistItems: () => set((state) => ({ selectedPlaylistItemIds: state.playlistItems.map((e) => e.id) })),

    selectNonePlaylistItems: () => set({ selectedPlaylistItemIds: [] }),

    selectPlaylistRange: (from, to) =>
      set((state) => {
        const lo = Math.min(from, to);
        const hi = Math.max(from, to);
        const ids = state.playlistItems.filter((e) => e.playlistIndex >= lo && e.playlistIndex <= hi).map((e) => e.id);
        return { selectedPlaylistItemIds: ids };
      }),

    confirmPlaylistSelection: () => {
      const { selectedPlaylistItemIds, wizardStep } = get();
      if (selectedPlaylistItemIds.length === 0) return;
      set({ wizardStep: 'playlistPresets', wizardError: null });
      logStep('advance', wizardStep, 'playlistPresets', pickWizardSnapshot(get()));
    },

    setPlaylistPreset: (p) => set({ selectedPlaylistPreset: p, wizardSubtitleSkipped: false }),

    advance: () => {
      const { wizardStep, activePreset, wizardMode, selectedPlaylistPreset } = get();
      const i = STEPS.indexOf(wizardStep as VisibleStep);
      if (i < 0 || i >= STEPS.length - 1) return;
      let nextIdx = i + 1;
      while (nextIdx < STEPS.length - 1 && shouldSkip(STEPS[nextIdx], { activePreset, wizardMode, selectedPlaylistPreset })) {
        nextIdx++;
      }
      const target = STEPS[nextIdx] ?? STEPS[STEPS.length - 1];
      set({ wizardStep: target });
      logStep('advance', wizardStep, target, pickWizardSnapshot(get()));
    },

    back: () => {
      const { wizardStep, activePreset, wizardMode, selectedPlaylistPreset } = get();
      const i = STEPS.indexOf(wizardStep as VisibleStep);
      if (i <= 0) return;
      let prevIdx = i - 1;
      while (prevIdx > 0 && shouldSkip(STEPS[prevIdx], { activePreset, wizardMode, selectedPlaylistPreset })) {
        prevIdx--;
      }
      const target = STEPS[prevIdx] ?? STEPS[0];
      set({ wizardStep: target, ...(target === 'subtitles' && { wizardSubtitleSkipped: false }) });
      logStep('back', wizardStep, target, pickWizardSnapshot(get()));
    },

    reset: () => {
      const fromStep = get().wizardStep;
      set(RESET_STATE);
      logStep('reset', fromStep, 'url', pickWizardSnapshot(get()));
    },

    retry: async () => {
      const { wizardErrorOrigin, wizardStep } = get();
      if (wizardErrorOrigin === 'formats') {
        set({ wizardStep: 'formats', formatsLoading: true, wizardError: null });
        logStep('retry', wizardStep, 'formats', pickWizardSnapshot(get()));
        await get().submitUrl();
      }
    },

    // Re-run the format probe against the currently-active URL without
    // resetting the wizard. Used by `<BotWallNotice>` so a user who changed
    // network mid-session can re-spin without navigating back to the URL step.
    retryFormatProbe: async () => {
      const { wizardUrl } = get();
      if (!wizardUrl) return;
      set({ formatsLoading: true, wizardFormatsDegraded: null });
      await runFormatProbe(wizardUrl, set, get);
    },

    // Switch cookies mode to whichever is configured (file > browser),
    // persist via the system slice setter, then re-run the format probe.
    // No-op if neither path nor browser is configured — the banner doesn't
    // expose this action in that case.
    retryProbeWithCookies: async () => {
      const settings = get().settings;
      const path = settings?.common.cookiesPath?.trim();
      const browser = settings?.common.cookiesBrowser;
      const targetMode: 'file' | 'browser' | null = path ? 'file' : browser ? 'browser' : null;
      if (!targetMode) return;
      await get().setCookiesMode(targetMode);
      await get().retryFormatProbe();
    },

    // Used by `<CookiesErrorAlert>` on the wizard error step to send the
    // user back to the URL step's cookies block without losing the URL
    // they just submitted. `advancedAutoOpen` is consumed by `StepUrlInput`
    // on mount.
    openCookiesSettings: () => {
      set({ wizardStep: 'url', wizardError: null, wizardErrorOrigin: null, advancedAutoOpen: true });
    },

    setAdvancedAutoOpen: (open) => {
      set({ advancedAutoOpen: open });
    },

    setWizardOutputDir: async (dir, persist = true) => {
      set({ wizardOutputDir: dir });
      if (persist) await window.appApi.settings.update({ common: { defaultOutputDir: dir } });
    },

    // Invariant: (video !== '') && (audio.kind === 'convert-lossy' | 'convert-lossless') is invalid —
    // convert (-x) is mutually exclusive with video+audio merging.
    // Reconcile here instead of relying on the UI to prevent it.
    setSelectedVideoFormatId: (id) =>
      set((state) => {
        const reconcileAudio = id !== '' && (state.audioSelection.kind === 'convert-lossy' || state.audioSelection.kind === 'convert-lossless');
        if (!reconcileAudio) {
          return { selectedVideoFormatId: id, activePreset: id === '' ? 'audio-only' : null };
        }
        const bestAudio = state.wizardFormats.find((f) => f.isAudioOnly)?.formatId ?? null;
        return {
          selectedVideoFormatId: id,
          activePreset: null,
          audioSelection: nativeAudio(bestAudio)
        };
      }),
    setAudioSelection: (sel) =>
      set((state) => {
        // Symmetric guard: picking a convert target while a video is selected
        // clears the video to audio-only — the user's intent is "I want this
        // audio-converted file", and convert can't be merged with video.
        const clearVideo = (sel.kind === 'convert-lossy' || sel.kind === 'convert-lossless') && state.selectedVideoFormatId !== '';
        return {
          audioSelection: sel,
          selectedVideoFormatId: clearVideo ? '' : state.selectedVideoFormatId,
          activePreset: clearVideo || state.selectedVideoFormatId === '' ? 'audio-only' : null,
          // Keep the user's bitrate choice sticky across mp3/m4a/opus toggles.
          lastConvertBitrate: sel.kind === 'convert-lossy' ? sel.bitrateKbps : state.lastConvertBitrate
        };
      }),

    setPreset: (p) => {
      const { wizardFormats } = get();
      const { videoFormatId, audioSelection } = applyPreset(p, wizardFormats);
      set({
        activePreset: p,
        selectedVideoFormatId: videoFormatId,
        audioSelection
      });
    },

    toggleSubtitleLanguage: (lang) =>
      set((state) => ({
        wizardSubtitleLanguages: state.wizardSubtitleLanguages.includes(lang) ? state.wizardSubtitleLanguages.filter((l) => l !== lang) : [...state.wizardSubtitleLanguages, lang]
      })),

    setSubtitleMode: (mode) => set({ wizardSubtitleMode: mode }),
    setSubtitleFormat: (format) => set({ wizardSubtitleFormat: format }),

    chooseWizardFolder: async () => {
      const result = await window.appApi.dialog.chooseFolder();
      if (!result.ok || !result.data.path) return;
      set({ wizardOutputDir: result.data.path });
      await window.appApi.settings.update({ common: { defaultOutputDir: result.data.path } });
    },

    setWizardSubfolderEnabled: (enabled) => set({ wizardSubfolderEnabled: enabled }),
    setWizardSubfolderName: (name) => set({ wizardSubfolderName: name }),

    skipSubtitles: () => {
      const { wizardStep, activePreset } = get();
      const i = STEPS.indexOf(wizardStep as VisibleStep);
      if (i < STEPS.length - 1) {
        let nextIdx = i + 1;
        if (STEPS[nextIdx] === 'sponsorblock' && activePreset && !presetProducesVideo(activePreset)) nextIdx++;
        if (STEPS[nextIdx] === 'output' && activePreset && !presetProducesMedia(activePreset)) nextIdx++;
        const target = STEPS[nextIdx] ?? STEPS[STEPS.length - 1];
        set({ wizardSubtitleSkipped: true, wizardStep: target });
        logStep('skipSubtitles', wizardStep, target, pickWizardSnapshot(get()));
      }
    },

    setSponsorBlockMode: (mode) => set({ wizardSponsorBlockMode: mode }),

    toggleSponsorBlockCategory: (cat) =>
      set((state) => ({
        wizardSponsorBlockCategories: state.wizardSponsorBlockCategories.includes(cat) ? state.wizardSponsorBlockCategories.filter((c) => c !== cat) : [...state.wizardSponsorBlockCategories, cat]
      })),

    setEmbedChapters: (v) => set({ wizardEmbedChapters: v }),
    setEmbedMetadata: (v) => set({ wizardEmbedMetadata: v }),
    setEmbedThumbnail: (v) => set({ wizardEmbedThumbnail: v }),
    setWriteDescription: (v) => set({ wizardWriteDescription: v }),
    setWriteThumbnail: (v) => set({ wizardWriteThumbnail: v })
  };
}
