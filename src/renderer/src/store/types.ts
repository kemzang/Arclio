import type { StoreApi } from 'zustand';
import type { AppError, AppSettings, AudioBitrate, CookiesBrowser, CookiesMode, DependencyDiagnostic, DependencyId, FormatOption, GetFormatsOutput, PlaylistEntry, PlaylistPreset, Preset, QueueItem, SubtitleFormat, SubtitleMap, SubtitleMode, SponsorBlockMode, SponsorBlockCategory, SupportedLang, UiTheme } from '@shared/types.js';
import type { AudioSelection } from '@shared/schemas.js';
import type { IncompleteCookiesConfigIssue } from '@shared/cookiesConfig.js';
export type { AudioSelection };
export type WizardStep = 'url' | 'playlistItems' | 'playlistPresets' | 'formats' | 'subtitles' | 'sponsorblock' | 'output' | 'folder' | 'confirm' | 'error';

// Explicit mode tag so consumers don't re-derive intent from
// `playlistItems.length > 0`. `single` = format-probe flow; `playlist` =
// flat-probe + preset flow. Set on probe entry, cleared on reset.
export type WizardMode = 'single' | 'playlist';

export type SetState = StoreApi<AppState>['setState'];
export type GetState = StoreApi<AppState>['getState'];

export interface WizardSlice {
  wizardStep: WizardStep;
  wizardMode: WizardMode;
  formatsLoading: boolean;
  wizardUrl: string;
  wizardTitle: string;
  wizardThumbnail: string;
  wizardDuration?: number;
  wizardFormats: FormatOption[];
  wizardFormatsDegraded: NonNullable<GetFormatsOutput['degraded']> | null;
  // Transient flag set when the user navigates to the URL step from the
  // CookiesErrorAlert's "Open cookies settings" link. `StepUrlInput` reads
  // it on mount, expands the advanced section, scrolls the cookies block
  // into view, and clears the flag so it doesn't re-fire on re-render.
  advancedAutoOpen: boolean;
  selectedVideoFormatId: string;
  audioSelection: AudioSelection;
  // Preserves the user's bitrate choice when toggling between mp3/m4a/opus
  // rows or away to wav and back. Default 192 (industry standard MP3).
  lastConvertBitrate: AudioBitrate;
  // May be set IMPLICITLY when video='' (see setSelectedVideoFormatId).
  // Don't treat it as "the preset the user explicitly clicked."
  activePreset: Preset | null;
  wizardOutputDir: string;
  wizardError: AppError | null;
  wizardErrorOrigin: 'formats' | null;
  wizardSubtitles: SubtitleMap;
  wizardAutomaticCaptions: SubtitleMap;
  wizardSubtitleLanguages: string[];
  wizardSubtitleSkipped: boolean;
  wizardSubtitleMode: SubtitleMode;
  wizardSubtitleFormat: SubtitleFormat;
  wizardSubfolderEnabled: boolean;
  wizardSubfolderName: string;
  wizardSponsorBlockMode: SponsorBlockMode;
  wizardSponsorBlockCategories: SponsorBlockCategory[];
  wizardEmbedChapters: boolean;
  wizardEmbedMetadata: boolean;
  wizardEmbedThumbnail: boolean;
  wizardWriteDescription: boolean;
  wizardWriteThumbnail: boolean;
  // Playlist mode — populated when the URL probe routes through
  // getPlaylistItems instead of getFormats.
  playlistItems: PlaylistEntry[];
  selectedPlaylistItemIds: string[];
  playlistTitle: string;
  playlistId: string;
  playlistProbeLoading: boolean;
  mixedUrlPromptOpen: boolean;
  mixedUrlPending: string | null;
  cookiesConfigDialogIssue: IncompleteCookiesConfigIssue | null;
  selectedPlaylistPreset: PlaylistPreset | null;

  setWizardUrl: (url: string) => void;
  submitUrl: () => Promise<void>;
  dismissMixedPrompt: (choice: 'video' | 'playlist') => Promise<void>;
  dismissCookiesConfigDialog: () => void;
  setPlaylistItemSelected: (id: string, checked: boolean) => void;
  selectAllPlaylistItems: () => void;
  selectNonePlaylistItems: () => void;
  selectPlaylistRange: (from: number, to: number) => void;
  confirmPlaylistSelection: () => void;
  setPlaylistPreset: (p: PlaylistPreset) => void;
  advance: () => void;
  back: () => void;
  reset: () => void;
  retry: () => Promise<void>;
  retryFormatProbe: () => Promise<void>;
  retryProbeWithCookies: () => Promise<void>;
  openCookiesSettings: () => void;
  setAdvancedAutoOpen: (open: boolean) => void;
  setWizardOutputDir: (dir: string, persist?: boolean) => Promise<void>;
  setSelectedVideoFormatId: (id: string) => void;
  setAudioSelection: (sel: AudioSelection) => void;
  setPreset: (p: Preset) => void;
  toggleSubtitleLanguage: (lang: string) => void;
  setSubtitleMode: (mode: SubtitleMode) => void;
  setSubtitleFormat: (format: SubtitleFormat) => void;
  chooseWizardFolder: () => Promise<void>;
  setWizardSubfolderEnabled: (enabled: boolean) => void;
  setWizardSubfolderName: (name: string) => void;
  skipSubtitles: () => void;
  setSponsorBlockMode: (mode: SponsorBlockMode) => void;
  toggleSponsorBlockCategory: (cat: SponsorBlockCategory) => void;
  setEmbedChapters: (v: boolean) => void;
  setEmbedMetadata: (v: boolean) => void;
  setEmbedThumbnail: (v: boolean) => void;
  setWriteDescription: (v: boolean) => void;
  setWriteThumbnail: (v: boolean) => void;
}

export interface QueueSlice {
  queue: QueueItem[];

  addToQueue: () => Promise<void>;
  addAndDownloadImmediately: () => Promise<void>;
  startItemDownload: (itemId: string) => Promise<void>;
  cancelItemDownload: (itemId: string) => Promise<void>;
  pauseItemDownload: (itemId: string) => Promise<void>;
  resumeItemDownload: (itemId: string) => Promise<void>;
  removeQueueItem: (itemId: string) => void;
  retryQueueItem: (itemId: string) => Promise<void>;
  clearCompleted: () => void;
  pauseAll: () => Promise<void>;
  cancelAll: () => Promise<void>;
  openItemFolder: (itemId: string) => Promise<void>;
  openItemUrl: (itemId: string) => void;
}

export interface UiSlice {
  uiZoom: number;
  uiTheme: UiTheme;
  drawerOpen: boolean;
  showQueueTip: boolean;
  interJobSleepEndsAt: number | null;
  aboutDialogOpen: boolean;

  setDrawerOpen: (open: boolean) => void;
  dismissQueueTip: () => void;
  setUiZoom: (zoom: number) => void;
  setUiTheme: (theme: UiTheme) => void;
  setAboutDialogOpen: (open: boolean) => void;
}

export type ShareTrigger = 'footer' | 'titlebar' | 'about' | 'wizard-card' | 'milestone' | 'high-value-inline';

export interface SystemSlice {
  initialized: boolean;
  initializing: boolean;
  warmupDiagnostics: Record<DependencyId, DependencyDiagnostic> | null;
  warmupBlocking: DependencyId[];
  warmupRunning: boolean;
  warmupProgress: Partial<Record<DependencyId, import('@shared/types.js').WarmupProgressEvent>> | null;
  settings: AppSettings | null;
  language: SupportedLang;
  commonPaths: AppSettings['common']['commonPaths'];
  shareDialogOpen: boolean;
  shareDialogTrigger: ShareTrigger | null;
  initialize: () => Promise<void>;
  repairWarmup: () => Promise<void>;
  cancelWarmup: () => Promise<void>;
  setBinaryOverride: (id: DependencyId, path: string) => Promise<void>;
  clearBinaryOverride: (id: DependencyId) => Promise<void>;
  openBinariesDir: () => Promise<void>;
  openLogs: () => Promise<void>;
  setLanguage: (lang: SupportedLang) => void;
  setCookiesPath: (path: string) => Promise<void>;
  setCookiesMode: (mode: CookiesMode) => Promise<void>;
  setCookiesBrowser: (browser: CookiesBrowser) => Promise<void>;
  setProxyUrl: (url: string) => Promise<void>;
  setClipboardWatchEnabled: (enabled: boolean) => Promise<void>;
  setCloseBehavior: (value: 'tray' | 'quit') => Promise<void>;
  setAnalyticsEnabled: (enabled: boolean) => Promise<void>;
  openShareDialog: (trigger: ShareTrigger) => void;
  closeShareDialog: () => void;
  setShareInlineCardDismissed: () => Promise<void>;
  setShareHighValueBannerDismissed: () => Promise<void>;
}

export type AppState = WizardSlice & QueueSlice & UiSlice & SystemSlice;
