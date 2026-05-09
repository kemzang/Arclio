import { DEFAULTS } from '@shared/constants.js';
import { DEFAULT_AUDIO_BITRATE } from '@shared/schemas.js';
import type { AppSettings, FormatOption, PlaylistEntry, PlaylistPreset, Preset, ProbePlaylistMode, ProbeResult, SubtitleMap, WizardTransition } from '@shared/types.js';
import { getIncompleteCookiesConfigIssue } from '@shared/cookiesConfig.js';
import { cleanUrl } from '@shared/cleanUrl.js';
import { isYouTubeExtractor } from '@shared/ytdlp/extractorPredicates.js';

// Detect YouTube URLs that carry both `v=` (single video) and `list=` (playlist).
// yt-dlp's default for these routes Radio/Mix lists to playlist enumeration;
// users typically want the single video they clicked, so we surface a prompt.
export function isMixedYouTubeUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const isYouTube = host === 'youtube.com' || host.endsWith('.youtube.com');
    if (!isYouTube) return false;
    return !!u.searchParams.get('v') && !!u.searchParams.get('list');
  } catch {
    return false;
  }
}

// YouTube channel-root URLs (`/@handle`, `/channel/UC…`, `/c/CustomName`,
// `/user/OldName`) hit the Featured tab in yt-dlp, which returns a meta
// playlist of nested playlists (Videos, Shorts, Streams) rather than actual
// videos. Users almost always want the Videos tab — append `/videos` so the
// probe returns a flat enumerable list. URLs that already have a tab path
// (`/videos`, `/shorts`, `/playlists`, `/about`, etc.) pass through.
const YT_CHANNEL_TAB_NAMES = new Set(['videos', 'shorts', 'streams', 'live', 'playlists', 'community', 'about', 'featured', 'channels', 'store', 'releases', 'podcasts']);

export function rewriteYouTubeChannelRoot(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const isYouTube = host === 'youtube.com' || host.endsWith('.youtube.com');
    if (!isYouTube) return url;
    const segments = u.pathname.split('/').filter(Boolean);
    if (segments.length === 0) return url;
    const isChannelRoot =
      (segments[0].startsWith('@') && segments.length === 1) ||
      ((segments[0] === 'channel' || segments[0] === 'c' || segments[0] === 'user') && segments.length === 2);
    if (!isChannelRoot) return url;
    // Don't rewrite if path already ends with an explicit tab name.
    const lastSegment = segments[segments.length - 1].toLowerCase();
    if (YT_CHANNEL_TAB_NAMES.has(lastSegment)) return url;
    u.pathname = `${u.pathname.replace(/\/$/, '')}/videos`;
    return u.toString();
  } catch {
    return url;
  }
}
import type { AppState, AudioSelection, GetState, SetState, WizardMode, WizardSlice, WizardStep } from './types.js';
import { presetProducesMedia, presetProducesVideo } from '@shared/presetTraits.js';
import { STEPS, shouldSkip, type VisibleStep } from '../components/wizard/stepNavigation.js';

function pickWizardSnapshot(state: AppState): Record<string, unknown> {
  return {
    url: state.wizardUrl,
    extractor: state.wizardExtractor,
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

// When a video format is itself muxed (audio embedded — e.g. Twitch HLS,
// PornHub progressive, Reddit DASH muxed), pairing it with a separate native
// audio stream double-tracks the audio (yt-dlp downloads both then ffmpeg
// merges, ending with dual audio or worse). The right default is `none` =
// Keep as-is — the muxed stream already has audio.
function audioForVideoPick(videoFormatId: string, formats: FormatOption[], fallbackAudioId: string | null): AudioSelection {
  const f = formats.find((x) => x.formatId === videoFormatId);
  const isMuxed = !!f && !f.isVideoOnly && !f.isAudioOnly;
  if (isMuxed) return { kind: 'none' };
  return nativeAudio(fallbackAudioId);
}

export function applyPreset(preset: Preset, formats: FormatOption[]): { videoFormatId: string; audioSelection: AudioSelection } {
  const grouped = groupedNonAudioFormats(formats);
  const audioFormats = formats.filter((f) => f.isAudioOnly);
  const bestAudio = audioFormats[0]?.formatId ?? null;
  const worstAudio = audioFormats[audioFormats.length - 1]?.formatId ?? bestAudio;

  if (preset === 'best-quality') {
    const videoFormatId = grouped[0]?.formatId ?? '';
    return { videoFormatId, audioSelection: audioForVideoPick(videoFormatId, formats, bestAudio) };
  }
  if (preset === 'audio-only') return { videoFormatId: '', audioSelection: nativeAudio(bestAudio) };
  if (preset === 'subtitle-only') return { videoFormatId: '', audioSelection: { kind: 'none' } };
  if (preset === 'balanced') {
    const target = grouped.find((g) => {
      const m = /(\d+)/.exec(g.resolution);
      return m ? Number(m[1]) <= 720 : false;
    });
    const videoFormatId = target?.formatId ?? grouped[grouped.length - 1]?.formatId ?? '';
    return { videoFormatId, audioSelection: audioForVideoPick(videoFormatId, formats, bestAudio) };
  }
  // small-file
  const videoFormatId = grouped[grouped.length - 1]?.formatId ?? '';
  return { videoFormatId, audioSelection: audioForVideoPick(videoFormatId, formats, worstAudio) };
}

// Persisted audio selection is stored verbatim. Convert/none kinds carry no
// per-video identifiers and revive directly — except `none` (muxed keep-as-is)
// only makes sense when the new source is also muxed-only. If the new source
// has separable audio streams, `none` would silently drop the audio track,
// which is rarely what the user meant ("keep as-is" on a separable source =
// video-only download). Auto-upgrade to the best native audio in that case.
//
// For native, the formatId can change between videos, so fall back:
// exact id → same ext → bestAudio.
// Returns null when nothing is persisted; caller uses its default in that case.
function reviveAudio(persisted: AudioSelection | undefined, formats: FormatOption[]): AudioSelection | null {
  if (!persisted) return null;
  const audioFormats = formats.filter((f) => f.isAudioOnly);

  if (persisted.kind === 'none') {
    // Carry the kind only when the new source has no separable audio (muxed-only).
    // Separable-audio sources reinterpret `none` as "video-only" — auto-pick best
    // audio so the user doesn't get a silent file by accident.
    if (audioFormats.length === 0) return persisted;
    return nativeAudio(audioFormats[0].formatId);
  }

  if (persisted.kind !== 'native') return persisted;

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
  wizardExtractor: '',
  wizardExtractorKey: '',
  wizardWebpageUrl: '',
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
  playlistIsMultiVideo: false,
  playlistProbeLoading: false,
  mixedUrlPromptOpen: false,
  mixedUrlPending: null as string | null,
  cookiesConfigDialogIssue: null,
  selectedPlaylistPreset: null as PlaylistPreset | null
} as const;

function maybeBlockIncompleteCookiesConfig(url: string, set: SetState, get: GetState): boolean {
  const issue = getIncompleteCookiesConfigIssue(get().settings?.common);
  if (!issue) return false;
  set({
    wizardUrl: url,
    wizardStep: 'url',
    formatsLoading: false,
    playlistProbeLoading: false,
    wizardError: null,
    wizardErrorOrigin: null,
    cookiesConfigDialogIssue: issue
  });
  return true;
}

function applyVideoProbeResult(probe: Extract<ProbeResult, { kind: 'video' }>, set: SetState, get: GetState): void {
  const settings = get().settings;
  const { formats, title, thumbnail, duration, subtitles, automaticCaptions, degraded } = probe;
  // Single-mode persisted prefs (`lastPreset`, `lastVideoResolution`,
  // `lastAudioSelection`, `lastSubtitleLanguages`, `lastSubtitleMode/Format`,
  // `lastSubfolder*`) are scoped to YouTube. Non-YT extractors get fresh
  // defaults so a YT formatId / 1080p resolution / "YouTube Music" subfolder
  // doesn't leak into a Vimeo/PornHub/etc. probe. Common prefs (embed flags,
  // sponsorblock mode, output dir) stay global since they're pure intent.
  const persistApplies = isYouTubeExtractor(probe.extractor);
  const scopedSettings = persistApplies ? settings : null;
  let { videoFormatId, audioSelection, preset } = restoreFormatSelection(formats, scopedSettings);
  const { languages: subtitleLanguages } = restoreSubtitleSelection(subtitles, automaticCaptions, scopedSettings);
  // Audio-only sources (Bandcamp, SoundCloud, QQMusic, etc.) — force the
  // audio-only preset on first paint so the wizard doesn't mislead users
  // with a video column for content that has no video. Non-music sources
  // unaffected; YT's persisted preset still wins for YT.
  if (probe.isAudioOnlySource) {
    const audioOnlyPick = applyPreset('audio-only', formats);
    videoFormatId = audioOnlyPick.videoFormatId;
    audioSelection = audioOnlyPick.audioSelection;
    preset = 'audio-only';
  }
  set({
    wizardStep: 'formats',
    wizardMode: 'single',
    wizardFormats: formats,
    wizardFormatsDegraded: degraded ?? null,
    wizardExtractor: probe.extractor,
    wizardExtractorKey: probe.extractorKey,
    wizardWebpageUrl: probe.webpageUrl,
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
    wizardSubtitleMode: scopedSettings?.single?.lastSubtitleMode ?? DEFAULTS.subtitleMode,
    wizardSubtitleFormat: scopedSettings?.single?.lastSubtitleFormat ?? DEFAULTS.subtitleFormat,
    ...restoreCommonWizardPrefs(settings),
    wizardSubfolderEnabled: scopedSettings?.single?.lastSubfolderEnabled ?? false,
    wizardSubfolderName: scopedSettings?.single?.lastSubfolder ?? '',
    formatsLoading: false,
    playlistProbeLoading: false,
    playlistItems: [],
    selectedPlaylistItemIds: [],
    playlistTitle: '',
    playlistId: '',
    playlistIsMultiVideo: false
  });
}

function applyPlaylistProbeResult(probe: Extract<ProbeResult, { kind: 'playlist' }>, set: SetState, get: GetState): void {
  const settings = get().settings;
  // Audio-only sources skip the persisted video preset and default straight
  // to `audio-best` — the user came to a music host, video presets would be
  // wrong (and yt-dlp would reject a video preset for audio-only entries).
  const persistedPreset = settings?.playlist?.lastPlaylistPreset ?? null;
  const selectedPlaylistPreset: PlaylistPreset | null = probe.isAudioOnlySource ? 'audio-best' : persistedPreset;
  set({
    wizardStep: 'playlistItems',
    wizardMode: 'playlist',
    wizardExtractor: probe.extractor,
    wizardExtractorKey: probe.extractorKey,
    wizardWebpageUrl: probe.webpageUrl,
    playlistItems: probe.entries,
    selectedPlaylistItemIds: probe.entries.map((e) => e.id),
    playlistTitle: probe.playlistTitle,
    playlistId: probe.playlistId,
    playlistIsMultiVideo: probe.isMultiVideo,
    playlistProbeLoading: false,
    formatsLoading: false,
    wizardFormats: [],
    wizardFormatsDegraded: null,
    ...restoreCommonWizardPrefs(settings),
    // Mode-scoped prefs: playlist preset + playlist subfolder are persisted
    // under their own keys so they survive single-mode runs in between.
    selectedPlaylistPreset,
    wizardSubfolderEnabled: settings?.playlist?.lastPlaylistSubfolderEnabled ?? false,
    wizardSubfolderName: settings?.playlist?.lastPlaylistSubfolder ?? ''
  });
}

async function runProbe(url: string, playlistMode: ProbePlaylistMode, set: SetState, get: GetState): Promise<void> {
  const fromStep = get().wizardStep;
  // Step into 'formats' immediately so StepFormatSelect renders its
  // formatsLoading spinner UX. Probe result will route to 'playlistItems' or
  // stay on 'formats' once it lands; until then the spinner is the user's
  // feedback that the probe is in flight.
  const initialStep: WizardStep = playlistMode === 'playlist' ? 'playlistItems' : 'formats';
  set({
    wizardUrl: url,
    wizardStep: initialStep,
    wizardMode: playlistMode === 'playlist' ? 'playlist' : 'single',
    formatsLoading: playlistMode !== 'playlist',
    playlistProbeLoading: playlistMode !== 'video',
    wizardError: null,
    cookiesConfigDialogIssue: null,
    wizardFormats: [],
    wizardFormatsDegraded: null,
    // Clear subtitle pools so stale tracks from a previous probe don't keep
    // the Subtitles step visible during the next probe's loading window. The
    // step's gating predicate reads `wizardSubtitles` / `wizardAutomaticCaptions`
    // — if they still reflect the prior video, the indicator misleadingly
    // shows Subtitles before the new probe has decided.
    wizardSubtitles: {},
    wizardAutomaticCaptions: {},
    wizardSubtitleLanguages: [],
    playlistItems: [],
    selectedPlaylistItemIds: [],
    playlistTitle: '',
    playlistId: '',
    playlistIsMultiVideo: false,
    wizardExtractor: '',
    wizardExtractorKey: '',
    wizardWebpageUrl: ''
  });
  logStep('submitUrl', fromStep, initialStep, pickWizardSnapshot(get()));

  const result = await window.appApi.downloads.probe({ url, playlistMode });
  if (!result.ok) {
    set({
      wizardStep: 'error',
      formatsLoading: false,
      playlistProbeLoading: false,
      wizardError: result.error,
      wizardErrorOrigin: 'formats',
      wizardFormatsDegraded: null
    });
    return;
  }

  if (result.data.kind === 'playlist') {
    applyPlaylistProbeResult(result.data, set, get);
  } else {
    applyVideoProbeResult(result.data, set, get);
  }
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
      const cleaned = rewriteYouTubeChannelRoot(cleanUrl(get().wizardUrl.trim()));
      if (!cleaned) return;
      // Mixed YouTube URLs (?v=X&list=Y) — disambiguate before probing so the
      // user picks intent rather than yt-dlp defaulting to playlist.
      if (isMixedYouTubeUrl(cleaned)) {
        set({ wizardUrl: cleaned, mixedUrlPromptOpen: true, mixedUrlPending: cleaned, wizardError: null, cookiesConfigDialogIssue: null });
        return;
      }
      if (maybeBlockIncompleteCookiesConfig(cleaned, set, get)) return;
      await runProbe(cleaned, 'auto', set, get);
    },

    dismissMixedPrompt: async (choice) => {
      const pending = get().mixedUrlPending;
      set({ mixedUrlPromptOpen: false, mixedUrlPending: null });
      if (!pending) return;
      // 'video' uses the original URL with --no-playlist; 'playlist' uses
      // --yes-playlist. Either way the URL stays as the user pasted it —
      // yt-dlp interprets the ambiguity via the flag, so we don't need to
      // strip v= or list= ourselves.
      if (choice === 'video') {
        if (maybeBlockIncompleteCookiesConfig(pending, set, get)) return;
        await runProbe(pending, 'video', set, get);
      } else {
        await runProbe(pending, 'playlist', set, get);
      }
    },

    dismissCookiesConfigDialog: () => {
      set({ cookiesConfigDialogIssue: null });
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
      const state = get();
      const { wizardStep, activePreset, wizardMode, selectedPlaylistPreset, wizardExtractor, wizardSubtitles, wizardAutomaticCaptions } = state;
      const hasSubtitles = Object.keys(wizardSubtitles).length > 0 || Object.keys(wizardAutomaticCaptions).length > 0;
      const i = STEPS.indexOf(wizardStep as VisibleStep);
      if (i < 0 || i >= STEPS.length - 1) return;
      let nextIdx = i + 1;
      while (nextIdx < STEPS.length - 1 && shouldSkip(STEPS[nextIdx], { activePreset, wizardMode, selectedPlaylistPreset, wizardExtractor, hasSubtitles })) {
        nextIdx++;
      }
      const target = STEPS[nextIdx] ?? STEPS[STEPS.length - 1];
      set({ wizardStep: target });
      logStep('advance', wizardStep, target, pickWizardSnapshot(get()));
    },

    back: () => {
      const state = get();
      const { wizardStep, activePreset, wizardMode, selectedPlaylistPreset, wizardExtractor, wizardSubtitles, wizardAutomaticCaptions } = state;
      const hasSubtitles = Object.keys(wizardSubtitles).length > 0 || Object.keys(wizardAutomaticCaptions).length > 0;
      const i = STEPS.indexOf(wizardStep as VisibleStep);
      if (i <= 0) return;
      let prevIdx = i - 1;
      while (prevIdx > 0 && shouldSkip(STEPS[prevIdx], { activePreset, wizardMode, selectedPlaylistPreset, wizardExtractor, hasSubtitles })) {
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
      // Retry preserves the wizard's current mode rather than re-prompting:
      // user has already disambiguated once.
      const playlistMode: ProbePlaylistMode = get().wizardMode === 'playlist' ? 'playlist' : 'auto';
      await runProbe(wizardUrl, playlistMode, set, get);
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
      set({ wizardStep: 'url', wizardError: null, wizardErrorOrigin: null, advancedAutoOpen: true, cookiesConfigDialogIssue: null });
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
