import type { LocalizedError } from './i18n/types';
import type { PreparedJob } from './preparedJob';

export type { PreparedJob } from './preparedJob';

// Re-export the enum types whose canonical definition lives in `schemas.ts`
// (where they're z.enum schemas). Importing from `@shared/types` continues to
// work for callers that don't care about the schema vs type distinction.
export type { Preset, PlaylistPreset, SubtitleMode, SubtitleFormat, SponsorBlockMode, SponsorBlockCategory, SupportedLang, UiTheme, QueueItemStatus, AudioConvertTarget, AudioBitrate, AudioConvert } from './schemas';

export type { StatusKey } from './schemas';
export type { LocalizedError, YtdlpErrorKey } from './i18n/types';

import type { Preset, SubtitleMode, SubtitleFormat, SponsorBlockMode, SponsorBlockCategory, SupportedLang, UiTheme, StatusKey } from './schemas';

export type AppErrorCode = 'validation' | 'token' | 'binary' | 'download' | 'ipc' | 'unknown';

export interface AppError {
  code: AppErrorCode;
  message: string;
  details?: string;
  recoverable?: boolean;
  localizedKey?: import('./schemas').YtdlpErrorKey;
}

// Mode-independent prefs and infrastructure config. Anything that applies
// regardless of single-vs-playlist flow lives here.
export interface CommonSettings {
  defaultOutputDir: string;
  rememberLastOutputDir: boolean;
  uiZoom?: number;
  uiTheme?: UiTheme;
  language?: SupportedLang;
  commonPaths?: {
    downloads: string | null;
    videos: string | null;
    desktop: string | null;
    music: string | null;
    documents: string | null;
    pictures: string | null;
    home: string | null;
  };
  cookiesPath?: string;
  cookiesEnabled?: boolean;
  proxyUrl?: string;
  clipboardWatchEnabled: boolean;
  closeBehavior?: 'ask' | 'tray' | 'quit';
  embedChapters?: boolean;
  embedMetadata?: boolean;
  embedThumbnail?: boolean;
  writeDescription?: boolean;
  writeThumbnail?: boolean;
  lastSponsorBlockMode?: SponsorBlockMode;
  lastSponsorBlockCategories?: SponsorBlockCategory[];
  analyticsEnabled?: boolean;
  firstRunCompleted?: boolean;
  drawerOpen?: boolean;
}

// Single-video flow prefs. Restored when the user enters the format-probe path.
export interface SinglePrefs {
  lastPreset?: Preset | null;
  lastVideoResolution?: string;
  lastSubtitleLanguages?: string[];
  lastSubtitleMode?: SubtitleMode;
  lastSubtitleFormat?: SubtitleFormat;
  lastSubfolderEnabled?: boolean;
  lastSubfolder?: string;
}

// Playlist flow prefs. Kept separate so a playlist run doesn't clobber the
// single-mode preset/subfolder, and vice versa.
export interface PlaylistPrefs {
  lastPlaylistPreset?: import('./schemas').PlaylistPreset;
  lastPlaylistSubfolderEnabled?: boolean;
  lastPlaylistSubfolder?: string;
}

export interface AppSettings {
  common: CommonSettings;
  single: SinglePrefs;
  playlist: PlaylistPrefs;
}

export interface SubtitleTrack {
  ext: string;
  name?: string;
}

export type SubtitleMap = Record<string, SubtitleTrack[]>;

export interface FormatOption {
  formatId: string;
  label: string;
  ext: string;
  resolution: string;
  fps?: number;
  abr?: number;
  filesize?: number;
  isVideoOnly: boolean;
  isAudioOnly: boolean;
  dynamicRange?: string;
}

export type DownloadJobStatus = 'running' | 'completed' | 'failed' | 'cancelled';

export interface DownloadJob {
  id: string;
  url: string;
  outputDir: string;
  formatId?: string;
  expectedBytes?: number;
  status: DownloadJobStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RecentJob {
  id: string;
  url: string;
  outputDir: string;
  formatId?: string;
  status: Extract<DownloadJobStatus, 'completed' | 'failed' | 'cancelled'>;
  finishedAt: string;
  error?: LocalizedError;
}

export interface StatusSnapshot {
  key: StatusKey;
  params?: Record<string, string | number>;
}

export interface QueueItem {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  outputDir: string;
  formatLabel: string;
  status: import('./schemas').QueueItemStatus;
  progressPercent: number;
  progressDetail: string | null;
  lastStatus: StatusSnapshot | null;
  error: LocalizedError | null;
  finishedAt: string | null;
  downloadJobId: string | null;
  playlistGroupId?: string;
  job: PreparedJob;
}

export interface PlaylistEntry {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  duration?: number;
  playlistIndex: number;
}

export interface GetPlaylistItemsInput {
  url: string;
}

export interface GetPlaylistItemsOutput {
  playlistId: string;
  playlistTitle: string;
  entries: PlaylistEntry[];
}

export type DownloadStage = 'setup' | 'token' | 'download' | 'done' | 'error';

export interface StatusEvent {
  jobId: string;
  stage: DownloadStage;
  statusKey: StatusKey;
  params?: Record<string, string | number>;
  error?: LocalizedError;
  at: string;
}

export interface ProgressEvent {
  jobId: string;
  line: string;
  at: string;
  percent?: number;
}

export interface WarmUpOutput {
  completed: boolean;
  failures: string[];
}

export interface WarmupProgressEvent {
  binary: string;
  phase: 'downloading' | 'extracting' | 'done' | 'skipped';
  bytesDownloaded: number;
  totalBytes: number | undefined;
}

export interface CommonPaths {
  downloads: string | null;
  videos: string | null;
  music: string | null;
  desktop?: string | null;
  documents?: string | null;
  pictures?: string | null;
  home?: string | null;
}

export interface StartDownloadInput {
  url: string;
  outputDir?: string;
  cookiesEnabled?: boolean;
  job: PreparedJob;
}

export interface StartDownloadOutput {
  job: DownloadJob;
}

export interface GetFormatsInput {
  url: string;
}

export interface GetFormatsOutput {
  formats: FormatOption[];
  title: string;
  thumbnail: string;
  duration?: number;
  subtitles: SubtitleMap;
  automaticCaptions: SubtitleMap;
}

export interface CancelDownloadInput {
  jobId?: string;
}

export interface CancelDownloadOutput {
  cancelled: boolean;
}

export interface PauseDownloadInput {
  jobId?: string;
}

export interface PauseDownloadOutput {
  paused: boolean;
}

export type InstallChannel = 'direct' | 'winget' | 'scoop' | 'homebrew' | 'flatpak' | 'portable';

export const INSTALL_CHANNELS: readonly InstallChannel[] = ['direct', 'winget', 'scoop', 'homebrew', 'flatpak', 'portable'] as const;

export interface UpdateAvailablePayload {
  version: string;
  currentVersion: string;
  installChannel: InstallChannel;
}

export type UpdateInstallResult = { ok: true } | { ok: false; error: string };

export type WizardStepName = 'url' | 'playlistItems' | 'playlistPresets' | 'formats' | 'subtitles' | 'sponsorblock' | 'output' | 'folder' | 'confirm' | 'error';

export type WizardTransition = 'submitUrl' | 'advance' | 'back' | 'skipSubtitles' | 'retry' | 'reset';

export interface WizardStepSnapshot {
  transition: WizardTransition;
  fromStep: WizardStepName;
  toStep: WizardStepName;
  snapshot: Record<string, unknown>;
}
