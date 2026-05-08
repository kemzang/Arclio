import { z } from 'zod';
import { isValidSubfolder, SUBFOLDER_NAME_MAX } from './subfolder.js';
import { AUDIO_CONVERT_TARGETS, type AudioConvertTarget } from './audioTargets.js';

export type { AudioConvertTarget };

// Enum schemas — single source of truth. Types below are inferred so adding
// or removing a value never requires hand-editing a parallel union.

export const presetSchema = z.enum(['best-quality', 'balanced', 'small-file', 'audio-only', 'subtitle-only']);
export type Preset = z.infer<typeof presetSchema>;
export const PRESETS = presetSchema.options;

export const playlistPresetSchema = z.enum(['video-best', 'video-2160p', 'video-1440p', 'video-1080p', 'video-720p', 'video-480p', 'video-360p', 'audio-best', 'audio-mp3']);
export type PlaylistPreset = z.infer<typeof playlistPresetSchema>;
export const PLAYLIST_PRESETS = playlistPresetSchema.options;

export const subtitleModeSchema = z.enum(['sidecar', 'embed', 'subfolder']);
export type SubtitleMode = z.infer<typeof subtitleModeSchema>;
export const SUBTITLE_MODES = subtitleModeSchema.options;

export const subtitleFormatSchema = z.enum(['srt', 'vtt', 'ass']);
export type SubtitleFormat = z.infer<typeof subtitleFormatSchema>;
export const SUBTITLE_FORMATS = subtitleFormatSchema.options;

export const sponsorBlockModeSchema = z.enum(['off', 'mark', 'remove']);
export type SponsorBlockMode = z.infer<typeof sponsorBlockModeSchema>;
export const SPONSORBLOCK_MODES = sponsorBlockModeSchema.options;

export const sponsorBlockCategorySchema = z.enum(['sponsor', 'intro', 'outro', 'selfpromo', 'music_offtopic', 'preview', 'filler']);
export type SponsorBlockCategory = z.infer<typeof sponsorBlockCategorySchema>;
export const SPONSORBLOCK_CATEGORIES = sponsorBlockCategorySchema.options;

// Audio-conversion targets surfaced in the wizard's audio column. yt-dlp will
// run --extract-audio + --audio-format <target> as a post-processor (requires
// ffmpeg). For lossy targets (mp3/m4a/opus) the bitrate is shared via the
// strip below the column; wav has no bitrate.
const LOSSY_TARGET_VALUES = AUDIO_CONVERT_TARGETS.filter((s) => s.lossy).map((s) => s.target) as ['mp3', 'm4a', 'opus'];

export const audioBitrateSchema = z.union([z.literal(128), z.literal(192), z.literal(256), z.literal(320)]);
export type AudioBitrate = z.infer<typeof audioBitrateSchema>;
export const AUDIO_BITRATES: readonly AudioBitrate[] = [128, 192, 256, 320];
export const DEFAULT_AUDIO_BITRATE: AudioBitrate = 192;

export const audioConvertSchema = z.discriminatedUnion('target', [z.object({ target: z.literal('wav') }), z.object({ target: z.enum(LOSSY_TARGET_VALUES), bitrateKbps: audioBitrateSchema })]);
export type AudioConvert = z.infer<typeof audioConvertSchema>;

// Renderer's audio-column selection. Three convert kinds + native + none.
// Defined here (not in renderer/store/types.ts) because it's persisted in
// `SinglePrefs.lastAudioSelection`, so the IPC patch schema needs to validate it.
export const audioSelectionSchema = z.discriminatedUnion('kind', [z.object({ kind: z.literal('none') }), z.object({ kind: z.literal('native'), formatId: z.string().min(1) }), z.object({ kind: z.literal('convert-lossless'), target: z.literal('wav') }), z.object({ kind: z.literal('convert-lossy'), target: z.enum(LOSSY_TARGET_VALUES), bitrateKbps: audioBitrateSchema })]);
export type AudioSelection = z.infer<typeof audioSelectionSchema>;

export const supportedLangSchema = z.enum(['om', 'de', 'en', 'es', 'fr', 'sw', 'uz', 'vi', 'am', 'ar', 'ur', 'ps', 'bn', 'hi', 'my', 'el', 'ru', 'sr', 'uk', 'zh', 'ja']);
export type SupportedLang = z.infer<typeof supportedLangSchema>;
export const SUPPORTED_LANGS = supportedLangSchema.options;

export const uiThemeSchema = z.enum(['light', 'dark', 'system']);
export type UiTheme = z.infer<typeof uiThemeSchema>;

export const cookiesModeSchema = z.enum(['off', 'file', 'browser']);
export type CookiesMode = z.infer<typeof cookiesModeSchema>;

export const cookiesBrowserSchema = z.enum(['firefox', 'chromium', 'chrome', 'brave', 'edge', 'safari', 'vivaldi']);
export type CookiesBrowser = z.infer<typeof cookiesBrowserSchema>;

export const queueItemStatusSchema = z.enum(['pending', 'downloading', 'paused', 'done', 'error', 'cancelled']);
export type QueueItemStatus = z.infer<typeof queueItemStatusSchema>;

export const ytdlpErrorKeySchema = z.enum(['botBlock', 'ipBlock', 'rateLimit', 'ageRestricted', 'unavailable', 'geoBlocked', 'outOfDiskSpace', 'unsupportedUrl']);
export type YtdlpErrorKey = z.infer<typeof ytdlpErrorKeySchema>;
export const YTDLP_ERROR_KEYS = ytdlpErrorKeySchema.options;

// Reified queue-status names for use in equality checks. Exact mirror of the schema.
export const QUEUE_STATUS = {
  pending: 'pending',
  downloading: 'downloading',
  paused: 'paused',
  done: 'done',
  error: 'error',
  cancelled: 'cancelled'
} as const satisfies Record<QueueItemStatus, QueueItemStatus>;

// Status keys emitted by DownloadService and consumed by the renderer for i18n.
// Defined as a const object so call-sites can reference STATUS_KEY.X — typos
// become compile errors and the runtime values match the i18n locale keys.
export const STATUS_KEY = {
  preparingBinaries: 'preparingBinaries',
  mintingToken: 'mintingToken',
  remintingToken: 'remintingToken',
  startingYtdlp: 'startingYtdlp',
  downloadingMedia: 'downloadingMedia',
  mergingFormats: 'mergingFormats',
  extractingAudio: 'extractingAudio',
  convertingVideo: 'convertingVideo',
  embeddingMetadata: 'embeddingMetadata',
  movingFiles: 'movingFiles',
  fetchingSubtitles: 'fetchingSubtitles',
  sleepingBetweenRequests: 'sleepingBetweenRequests',
  subtitlesFailed: 'subtitlesFailed',
  cancelled: 'cancelled',
  complete: 'complete',
  usedExtractorFallback: 'usedExtractorFallback',
  ytdlpProcessError: 'ytdlpProcessError',
  ytdlpExitCode: 'ytdlpExitCode',
  downloadingBinary: 'downloadingBinary',
  unknownStartupFailure: 'unknownStartupFailure'
} as const;
export type StatusKey = (typeof STATUS_KEY)[keyof typeof STATUS_KEY];

const statusKeySchema = z.enum(Object.values(STATUS_KEY) as [StatusKey, ...StatusKey[]]);

// Zoom bounds — kept here so the schema constraint and the renderer clamp share one source.
export const ZOOM_MIN = 0.7;
export const ZOOM_MAX = 1.5;
export const ZOOM_STEP = 0.05;

// Hard cap on subtitle languages per download — protects against argv length blow-up.
export const MAX_SUBTITLE_LANGUAGES = 50;

const youtubeHostRegex = /(^|\.)(youtube\.com|youtu\.be)$/i;

function isYouTubeHostname(hostname: string): boolean {
  return youtubeHostRegex.test(hostname);
}

export function isYouTubeUrl(input: string): boolean {
  try {
    return isYouTubeHostname(new URL(input).hostname);
  } catch {
    return false;
  }
}

const youtubeUrlSchema = z
  .string()
  .url('URL must be valid')
  .superRefine((value, ctx) => {
    try {
      const parsed = new URL(value);
      if (!isYouTubeHostname(parsed.hostname)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Only YouTube URLs are supported' });
      }
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'URL parsing failed' });
    }
  });

export const getFormatsSchema = z.object({
  url: youtubeUrlSchema
});

export const getPlaylistItemsSchema = z.object({
  url: youtubeUrlSchema
});

// PreparedJob discriminated-union schema. Type aliases live in
// `./preparedJob`; the runtime validator lives here so callers that already
// import from `@shared/schemas` get one source of truth and the import graph
// stays acyclic.
const jobSourceSchema = z.enum(['youtube', 'generic']);

const subtitleOptionsSchema = z.object({
  languages: z.array(z.string()),
  mode: subtitleModeSchema,
  format: subtitleFormatSchema,
  writeAuto: z.boolean()
});

const sponsorBlockOptionsSchema = z.discriminatedUnion('mode', [z.object({ mode: z.literal('off') }), z.object({ mode: z.enum(['mark', 'remove']), categories: z.array(sponsorBlockCategorySchema) })]);

const embedOptionsSchema = z.object({
  chapters: z.boolean(),
  metadata: z.boolean(),
  thumbnail: z.boolean(),
  description: z.boolean(),
  thumbnailSidecar: z.boolean()
});

const presetOrCustomSchema = z.union([presetSchema, z.literal('custom')]);

export const preparedJobSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('single-format'),
    source: jobSourceSchema,
    formatId: z.string().min(1),
    preset: presetOrCustomSchema,
    subtitles: subtitleOptionsSchema.optional(),
    sponsorBlock: sponsorBlockOptionsSchema,
    embed: embedOptionsSchema,
    expectedBytes: z.number().positive().optional()
  }),
  z.object({
    kind: z.literal('audio-convert'),
    source: jobSourceSchema,
    audioConvert: audioConvertSchema,
    preset: presetOrCustomSchema,
    subtitles: subtitleOptionsSchema.optional(),
    sponsorBlock: sponsorBlockOptionsSchema,
    embed: embedOptionsSchema
  }),
  z.object({
    kind: z.literal('playlist-preset'),
    source: jobSourceSchema,
    preset: playlistPresetSchema,
    formatSelector: z.string().min(1).optional(),
    audioConvert: audioConvertSchema.optional(),
    outputTemplate: z.string().min(1),
    subtitles: subtitleOptionsSchema.optional(),
    sponsorBlock: sponsorBlockOptionsSchema,
    embed: embedOptionsSchema
  }),
  z.object({
    kind: z.literal('subtitle-only'),
    source: jobSourceSchema,
    subtitles: subtitleOptionsSchema
  })
]);

export const startDownloadSchema = z.object({
  url: youtubeUrlSchema,
  outputDir: z.string().min(1).optional(),
  cookiesMode: cookiesModeSchema.optional(),
  job: preparedJobSchema
});

export const cancelDownloadSchema = z.object({
  jobId: z.string().optional()
});

export const pauseResumeSchema = z.object({
  jobId: z.string().optional()
});

export const resumeSchema = z.object({
  jobId: z.string().min(1)
});

export const analyticsTrackSchema = z.object({
  name: z.string().min(1).max(64),
  props: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional()
});

const subfolderNameSchema = z
  .string()
  .max(SUBFOLDER_NAME_MAX)
  .refine((s) => s === '' || isValidSubfolder(s), { message: 'Invalid subfolder name' });

const commonSettingsPatchSchema = z.object({
  defaultOutputDir: z.string().min(1).optional(),
  rememberLastOutputDir: z.boolean().optional(),
  uiZoom: z.number().min(ZOOM_MIN).max(ZOOM_MAX).optional(),
  uiTheme: uiThemeSchema.optional(),
  language: supportedLangSchema.optional(),
  cookiesPath: z.string().optional(),
  cookiesMode: cookiesModeSchema.optional(),
  cookiesBrowser: cookiesBrowserSchema.optional(),
  proxyUrl: z.string().optional(),
  clipboardWatchEnabled: z.boolean().optional(),
  closeBehavior: z.enum(['ask', 'tray', 'quit']).optional(),
  embedChapters: z.boolean().optional(),
  embedMetadata: z.boolean().optional(),
  embedThumbnail: z.boolean().optional(),
  writeDescription: z.boolean().optional(),
  writeThumbnail: z.boolean().optional(),
  lastSponsorBlockMode: sponsorBlockModeSchema.optional(),
  lastSponsorBlockCategories: z.array(sponsorBlockCategorySchema).optional(),
  analyticsEnabled: z.boolean().optional(),
  firstRunCompleted: z.boolean().optional(),
  drawerOpen: z.boolean().optional(),
  successfulDownloadCount: z.number().int().nonnegative().optional(),
  shareInlineCardDismissed: z.boolean().optional(),
  shareHighValueBannerDismissed: z.boolean().optional(),
  binaryOverrides: z
    .object({
      ytDlp: z.string().min(1).optional(),
      ffmpeg: z.string().min(1).optional(),
      ffprobe: z.string().min(1).optional(),
      deno: z.string().min(1).optional()
    })
    .partial()
    .optional()
});

const singlePrefsPatchSchema = z.object({
  lastPreset: presetSchema.nullable().optional(),
  lastVideoResolution: z.string().optional(),
  lastAudioSelection: audioSelectionSchema.optional(),
  lastSubtitleLanguages: z.array(z.string()).optional(),
  lastSubtitleMode: subtitleModeSchema.optional(),
  lastSubtitleFormat: subtitleFormatSchema.optional(),
  lastSubfolderEnabled: z.boolean().optional(),
  lastSubfolder: subfolderNameSchema.optional()
});

const playlistPrefsPatchSchema = z.object({
  lastPlaylistPreset: playlistPresetSchema.optional(),
  lastPlaylistSubfolderEnabled: z.boolean().optional(),
  lastPlaylistSubfolder: subfolderNameSchema.optional()
});

export const updateSettingsSchema = z.object({
  common: commonSettingsPatchSchema.optional(),
  single: singlePrefsPatchSchema.optional(),
  playlist: playlistPrefsPatchSchema.optional()
});

// Queue item schema — used by both queueSave IPC handler and queueStore.load
// to reject corrupted persistence (manual edits, partial writes).
const localizedErrorSchema = z.object({
  key: ytdlpErrorKeySchema.nullable(),
  rawMessage: z.string().optional()
});

const statusSnapshotSchema = z.object({
  key: statusKeySchema,
  params: z.record(z.string(), z.union([z.string(), z.number()])).optional()
});

export const queueItemSchema = z.object({
  id: z.string(),
  url: z.string(),
  title: z.string(),
  thumbnail: z.string(),
  outputDir: z.string(),
  formatLabel: z.string(),
  status: queueItemStatusSchema,
  progressPercent: z.number(),
  progressDetail: z.string().nullable(),
  lastStatus: statusSnapshotSchema.nullable(),
  error: localizedErrorSchema.nullable(),
  finishedAt: z.string().nullable(),
  downloadJobId: z.string().nullable(),
  playlistGroupId: z.string().min(1).optional(),
  job: preparedJobSchema
});

export const queueArraySchema = z.array(queueItemSchema);

// Loose schema for yt-dlp `--dump-json` output. Only fields the app actually
// reads are validated; unknown fields pass through unchecked because yt-dlp's
// schema is huge and we don't own it.
//
// yt-dlp emits explicit `null` (not just absence) for unknown values —
// `filesize` when the size header was missing, `fps`/`abr` for the wrong
// stream type, `duration` on live streams, etc. We normalize `null` →
// `undefined` at this boundary via `preprocess` so consumers see one
// absent-value sentinel and the inferred properties stay genuinely
// optional (a `.transform()` would mark them required-but-undefinable).
const nullToUndef = (v: unknown): unknown => (v === null ? undefined : v);
const optStr = z.preprocess(nullToUndef, z.string().optional());
const optNum = z.preprocess(nullToUndef, z.number().optional());

const ytDlpFormatSchema = z
  .object({
    format_id: optStr,
    ext: optStr,
    resolution: optStr,
    format_note: optStr,
    fps: optNum,
    abr: optNum,
    filesize: optNum,
    vcodec: optStr,
    acodec: optStr,
    dynamic_range: optStr
  })
  .passthrough();

const ytDlpSubtitleTrackSchema = z
  .object({
    ext: optStr,
    name: optStr
  })
  .passthrough();

export const ytDlpInfoSchema = z
  .object({
    formats: z.preprocess(nullToUndef, z.array(ytDlpFormatSchema).optional()),
    title: optStr,
    thumbnail: optStr,
    duration: optNum,
    subtitles: z.preprocess(nullToUndef, z.record(z.string(), z.array(ytDlpSubtitleTrackSchema)).optional()),
    automatic_captions: z.preprocess(nullToUndef, z.record(z.string(), z.array(ytDlpSubtitleTrackSchema)).optional())
  })
  .passthrough();

export type YtDlpInfo = z.infer<typeof ytDlpInfoSchema>;
export type YtDlpSubtitleTrack = z.infer<typeof ytDlpSubtitleTrackSchema>;
