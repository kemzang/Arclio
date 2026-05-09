import log from 'electron-log/main.js';
import { trackMain, probeDurationBucket } from '@main/services/analytics.js';
import { createAppError } from '@main/utils/errorFactory.js';
import { splitStderrLines } from '@main/utils/process.js';
import { ok, fail, type Result } from '@shared/result.js';
import { sortFormatsByQuality } from '@shared/qualitySorter.js';
import { humanSize } from '@shared/format.js';
import type { FormatOption, PlaylistEntry, ProbePlaylistMode, ProbeResult, ProbeDegradationReason, SubtitleMap } from '@shared/types.js';
import { LIVE_CHAT_LANG } from '@shared/constants.js';
import { infoDictSchema, isPlaylistLike, isUrlRedirect, type InfoDict, type PlaylistInfo, type MultiVideoInfo, type VideoInfo, type YtDlpFormat, type YtDlpSubtitleTrack } from '@shared/ytdlp/infoDict.js';
import { isAudioOnlySource, isYouTubeExtractor } from '@shared/ytdlp/extractorPredicates.js';
import { YtDlp } from './YtDlp.js';

const logger = log.scope('probe');

type ProbeSignalCategory = 'extractor' | 'bot';

// Patterns sourced from yt-dlp's stderr emit sites — verified against
// yt-dlp/yt_dlp/extractor/youtube/_video.py and yt-dlp/yt_dlp/downloader/common.py
// (search the repo for each exact string). yt-dlp wording occasionally changes
// across releases; if a probe stops triggering the degradation retry path,
// re-grep yt-dlp main and update these patterns.
const PROBE_DEGRADATION_SIGNALS: readonly { label: string; pattern: RegExp; category: ProbeSignalCategory }[] = [
  { label: 'n challenge solving failed', pattern: /n challenge solving failed/i, category: 'extractor' },
  { label: 'Some formats may be missing', pattern: /some formats may be missing/i, category: 'extractor' },
  { label: 'Error solving n challenge request', pattern: /error solving n challenge request/i, category: 'extractor' },
  { label: 'Failed to download m3u8 information', pattern: /failed to download m3u8 information/i, category: 'extractor' },
  { label: 'Unable to download webpage', pattern: /unable to download webpage/i, category: 'extractor' },
  { label: 'IncompleteRead', pattern: /incompleteread/i, category: 'extractor' },
  { label: 'Sign in to confirm', pattern: /sign in to confirm you'?re not a bot/i, category: 'bot' },
  { label: 'HTTP 429', pattern: /HTTP Error 429\b|too many requests/i, category: 'bot' }
];

interface ProbeSignal {
  label: string;
  category: ProbeSignalCategory;
}

type ProbeAttemptName = 'initial' | 'retry';

interface ProbeAttemptSuccess {
  info: InfoDict;
  stderr: string;
  degradationSignals: ProbeSignal[];
}

type ProbeAttemptResult = { kind: 'success'; data: ProbeAttemptSuccess } | { kind: 'failure'; error: ReturnType<typeof createAppError>; errorCategory: string };

function sanitizeSubtitleMap(raw: Record<string, YtDlpSubtitleTrack[]> | undefined, opts: { isAutomaticCaptions: boolean; isYouTube: boolean }): SubtitleMap {
  if (!raw) return {};
  const result: SubtitleMap = {};
  for (const [lang, tracks] of Object.entries(raw)) {
    if (lang === LIVE_CHAT_LANG) continue;
    // YouTube bundles real auto-captions and on-demand translation options into
    // the same map. Only keys ending in `-orig` are real generated tracks —
    // everything else is a translation request that YouTube generates live and
    // rate-limits aggressively. Other extractors (Vimeo, etc.) emit auto-captions
    // under bare lang codes with no -orig suffix, so the filter would discard
    // every track.
    if (opts.isAutomaticCaptions && opts.isYouTube && !lang.endsWith('-orig')) continue;
    const valid = tracks
      .filter((t): t is YtDlpSubtitleTrack & { ext: string } => typeof t.ext === 'string' && t.ext.length > 0)
      .map((t) => ({
        ext: t.ext,
        ...(t.name ? { name: t.name } : {})
      }));
    if (valid.length > 0) result[lang] = valid;
  }
  return result;
}

function friendlyCodec(acodec: string): string {
  if (acodec === 'opus') return 'Opus';
  if (acodec.startsWith('mp4a')) return 'AAC';
  return acodec;
}

export function mapFormats(formats: readonly YtDlpFormat[]): FormatOption[] {
  const mapped = formats
    .filter((item) => item.format_id && item.ext !== 'mhtml')
    .filter((item) => item.vcodec !== 'none' || (item.acodec && item.acodec !== 'none'))
    .map((item) => {
      const isAudioOnly = item.vcodec === 'none';
      const ext = item.ext ?? 'unknown';
      const filesize = item.filesize ?? item.filesize_approx;
      const formatId = item.format_id ?? '';

      if (isAudioOnly) {
        const abr = item.abr;
        const codec = friendlyCodec(item.acodec ?? '');
        const details = [ext, codec, abr ? `${Math.round(abr)} kbps` : null, filesize ? humanSize(filesize) : null].filter(Boolean).join(' · ');
        return {
          formatId,
          label: details,
          ext,
          resolution: 'audio only',
          abr,
          filesize,
          isVideoOnly: false,
          isAudioOnly: true,
          dynamicRange: undefined
        } satisfies FormatOption;
      }

      const resolution = item.resolution ?? item.format_note ?? 'unknown';
      const fps = item.fps;
      const isVideoOnly = item.acodec === 'none';
      const dynamicRange = item.dynamic_range && item.dynamic_range !== 'SDR' ? item.dynamic_range : undefined;
      const details = [resolution, ext, fps ? `${fps}fps` : null, dynamicRange ?? null, filesize ? humanSize(filesize) : null].filter(Boolean).join(' | ');

      return {
        formatId,
        label: details,
        ext,
        resolution,
        fps,
        filesize,
        isVideoOnly,
        isAudioOnly: false,
        dynamicRange
      } satisfies FormatOption;
    });

  return sortFormatsByQuality(mapped);
}

function categorizeProbeError(msg: string): string {
  const m = msg.toLowerCase();
  if (/sign in to confirm|confirm you'?re not a bot|\bbot\b|http error 403|\b403\b/.test(m)) return 'bot_detected';
  if (/unsupported url|is not a supported (?:site|url)|no extractor matches/.test(m)) return 'unsupported_site';
  if (/json (?:parse|decode)|unexpected token|schema validation|invalid json/.test(m)) return 'parse';
  if (/\b(?:timed? out|timeout|econn(?:reset|refused|aborted)|enotfound|getaddrinfo|network is unreachable)\b/.test(m)) return 'network';
  return 'unknown';
}

function detectProbeDegradationSignals(stderr: string): ProbeSignal[] {
  return PROBE_DEGRADATION_SIGNALS.filter(({ pattern }) => pattern.test(stderr)).map(({ label, category }) => ({ label, category }));
}

function deriveDegraded(signals: ProbeSignal[]): { reasons: ProbeDegradationReason[] } | undefined {
  if (signals.length === 0) return undefined;
  const reasons = Array.from(new Set(signals.map((s) => (s.category === 'bot' ? 'botWall' : 'extractor')))) as ProbeDegradationReason[];
  return { reasons };
}

function pickEntryThumbnail(entry: InfoDict): string {
  const v = entry as VideoInfo;
  if (typeof v.thumbnail === 'string' && v.thumbnail.length > 0) return v.thumbnail;
  const list = v.thumbnails;
  if (!list || list.length === 0) return '';
  // Some extractors (NicoVideo) emit thumbnail entries with `url: null` as
  // placeholders — find the first entry with a usable URL.
  for (const t of list) {
    if (typeof t.url === 'string' && t.url.length > 0) return t.url;
  }
  return '';
}

function untitledLabel(playlistIndex: number): string {
  return `Untitled · #${playlistIndex}`;
}

// YouTube browse-id prefixes carry semantic info that the flat-playlist enum
// loses by emitting empty titles. When title is missing for an entry, derive
// a category hint from the id prefix so the row says e.g. "Channel · UCxxx"
// instead of just the raw id. Doesn't replace a real title — only used as
// fallback for entries yt-dlp couldn't title.
function youtubeIdHint(id: string): string | null {
  if (id.startsWith('UC') && id.length === 24) return `Channel · ${id}`;
  if (id.startsWith('VLPL') || id.startsWith('VLOLAK')) return `Playlist · ${id.slice(2)}`;
  if (id.startsWith('VLRD')) return `Mix · ${id.slice(2)}`;
  if (id.startsWith('VL')) return `Playlist · ${id.slice(2)}`;
  if (id.startsWith('MPRE')) return `Album · ${id}`;
  if (id.startsWith('MPSPPL')) return `Search playlist · ${id}`;
  if (id.startsWith('MPLAUC') || id.startsWith('MPSP')) return `Section · ${id}`;
  return null;
}

// Heterogeneous YouTube search / music-search results mix actual videos with
// nested containers (channels, playlists, albums, mixes). The wizard's "pick
// videos from a list" model breaks for nested entries — selecting a Channel
// row would silently download hundreds of videos. We classify each entry by
// its YouTube browse-id prefix and drop containers when at least one real
// video is present in the same result set. If results are entirely nested
// (no videos at all), we keep them so the picker isn't empty.
function isYouTubeNestedContainer(id: string): boolean {
  if (id.startsWith('UC') && id.length === 24) return true; // channel
  if (id.startsWith('VL')) return true; // playlist / mix / radio
  if (id.startsWith('MPRE')) return true; // album / release
  if (id.startsWith('MPSPPL') || id.startsWith('MPSP') || id.startsWith('MPLAUC')) return true; // sections
  return false;
}

function buildEntryUrl(entry: InfoDict): string | null {
  // _type='url' / 'url_transparent' / 'video': webpage_url is canonical when present.
  // Flat-playlist entries often only have `url` (the watch URL) — accept either.
  const v = entry as VideoInfo & { url?: string };
  if (typeof v.webpage_url === 'string' && v.webpage_url.length > 0) return v.webpage_url;
  if (typeof v.url === 'string' && v.url.startsWith('http')) return v.url;
  return null;
}

function mapPlaylistEntries(entries: readonly InfoDict[], jobUrl: string): PlaylistEntry[] {
  // First pass: detect whether the result set contains any real video entry
  // (id without a known container prefix). If yes, the heterogeneous-result
  // case applies and we'll filter containers out below. If no (all nested),
  // we keep them — better than an empty picker.
  let hasVideoEntries = false;
  for (const entry of entries) {
    const id = typeof (entry as VideoInfo).id === 'string' ? (entry as VideoInfo).id! : '';
    if (id && !isYouTubeNestedContainer(id)) {
      hasVideoEntries = true;
      break;
    }
  }

  const out: PlaylistEntry[] = [];
  let fallbackIndex = 1;
  let droppedContainerCount = 0;
  for (const entry of entries) {
    const url = buildEntryUrl(entry);
    if (!url) {
      logger.warn('Playlist entry skipped — no resolvable URL', {
        jobUrl,
        entryId: typeof (entry as VideoInfo).id === 'string' ? (entry as VideoInfo).id : '(none)'
      });
      fallbackIndex++;
      continue;
    }
    const v = entry as VideoInfo & { playlist_index?: number };
    const playlistIndex = typeof v.playlist_index === 'number' ? v.playlist_index : fallbackIndex;
    const idStr = typeof v.id === 'string' ? v.id : '';
    // Heterogeneous-result filter: when the set contains any actual video,
    // drop nested containers (channel/playlist/album/mix). Selecting them
    // would silently download their entire contents, which doesn't fit the
    // wizard's "pick videos" model. If the set is entirely nested (no
    // videos at all — pure music-category search), we keep everything so
    // the picker isn't empty.
    if (hasVideoEntries && idStr && isYouTubeNestedContainer(idStr)) {
      droppedContainerCount++;
      fallbackIndex++;
      continue;
    }
    // Fallback chain: explicit title → YT id-prefix hint → raw id → URL tail.
    // Some extractors (youtube:music:search_url, generic search results) emit
    // empty titles for entries that are themselves nested playlists/channels.
    // An empty row tells the user nothing — derive a category hint from
    // YouTube's browse-id prefix so each row is at least distinguishable.
    const rawTitle = typeof v.title === 'string' ? v.title.trim() : '';
    // Title fallback chain:
    //   1. real title (from yt-dlp's flat enum)
    //   2. YouTube browse-id semantic hint ("Channel · UCxxx", "Album · MPRE…")
    //   3. neutral placeholder ("Untitled · #N") — preferred over raw IDs
    //      or URL fragments, which are noisy and unhelpful when many entries
    //      lack titles (Last.fm playlists, generic search, etc).
    const idHint = idStr ? youtubeIdHint(idStr) : null;
    const title = rawTitle.length > 0 ? rawTitle : (idHint ?? untitledLabel(playlistIndex));
    out.push({
      id: typeof v.id === 'string' && v.id.length > 0 ? v.id : url,
      url,
      title,
      thumbnail: pickEntryThumbnail(entry),
      duration: typeof v.duration === 'number' ? Math.round(v.duration) : undefined,
      playlistIndex
    });
    fallbackIndex++;
  }
  if (droppedContainerCount > 0) {
    logger.info('Playlist entries filtered: dropped nested containers', {
      jobUrl,
      droppedContainerCount,
      keptCount: out.length
    });
  }
  return out;
}

function buildVideoProbeResult(info: VideoInfo, jobUrl: string, degraded: { reasons: ProbeDegradationReason[] } | undefined): ProbeResult {
  const extractor = info.extractor ?? '';
  const isYouTube = isYouTubeExtractor(extractor);
  return {
    kind: 'video',
    extractor,
    extractorKey: info.extractor_key ?? '',
    webpageUrl: info.webpage_url ?? jobUrl,
    isAudioOnlySource: isAudioOnlySource(extractor),
    formats: mapFormats(info.formats ?? []),
    title: info.title ?? '',
    thumbnail: info.thumbnail ?? '',
    duration: typeof info.duration === 'number' ? Math.round(info.duration) : undefined,
    subtitles: sanitizeSubtitleMap(info.subtitles, { isAutomaticCaptions: false, isYouTube }),
    automaticCaptions: sanitizeSubtitleMap(info.automatic_captions, { isAutomaticCaptions: true, isYouTube }),
    isLive: info.is_live === true || info.live_status === 'is_live' || info.live_status === 'is_upcoming',
    hasDrm: info.has_drm === true,
    availability: typeof info.availability === 'string' ? info.availability : undefined,
    ageLimit: typeof info.age_limit === 'number' && info.age_limit > 0 ? info.age_limit : undefined,
    ...(degraded ? { degraded } : {})
  };
}

function buildPlaylistProbeResult(info: PlaylistInfo | MultiVideoInfo, jobUrl: string): ProbeResult {
  const extractor = info.extractor ?? '';
  return {
    kind: 'playlist',
    extractor,
    extractorKey: info.extractor_key ?? '',
    webpageUrl: info.webpage_url ?? jobUrl,
    isAudioOnlySource: isAudioOnlySource(extractor),
    isMultiVideo: info._type === 'multi_video',
    playlistId: info.playlist_id ?? info.id ?? '',
    playlistTitle: info.playlist_title ?? info.title ?? '',
    entries: mapPlaylistEntries(info.entries, jobUrl)
  };
}

export class ProbeService {
  constructor(
    private readonly ytDlp: YtDlp,
    private readonly mockMode = false
  ) {}

  async probe(url: string, cookiesMode: 'off' | 'file' | 'browser' = 'off', playlistMode: ProbePlaylistMode = 'auto'): Promise<Result<ProbeResult>> {
    const startMs = Date.now();
    const emitSuccess = (result: ProbeResult): void => {
      trackMain('format_probed', {
        duration_bucket: probeDurationBucket(Date.now() - startMs),
        bot_wall: result.kind === 'video' && result.degraded?.reasons.includes('botWall') === true,
        cookies_mode: cookiesMode,
        result_kind: result.kind
      });
    };
    const emitFailure = (errorCategory: string): void => {
      trackMain('probe_failed', {
        duration_bucket: probeDurationBucket(Date.now() - startMs),
        error_category: errorCategory,
        cookies_mode: cookiesMode
      });
    };

    try {
      if (this.mockMode) return ok(buildMockProbeResult(url));

      logger.info('Probe started', { url });

      const probeResult = await this.probeWithRedirectFollow(url, playlistMode);
      if (probeResult.kind === 'failure') {
        emitFailure(probeResult.errorCategory);
        return fail(probeResult.error);
      }

      const final = probeResult.data;
      const info = final.info;
      let mapped: ProbeResult;

      if (isPlaylistLike(info)) {
        mapped = buildPlaylistProbeResult(info, url);
        if (mapped.kind === 'playlist' && mapped.entries.length === 0) {
          // Empty playlist isn't a JSON parse failure — extractor produced a
          // valid container with no entries (private playlist, members-only,
          // geo-blocked, exhausted page). Categorize accordingly so analytics
          // and any user-facing copy can distinguish the cause.
          emitFailure('content_unavailable');
          return fail(createAppError('download', 'Playlist returned no entries'));
        }
      } else if (isUrlRedirect(info)) {
        // Hit redirect-depth cap. Surface the URL error rather than guess.
        emitFailure('redirect_loop');
        return fail(createAppError('download', 'Probe redirected too many times'));
      } else {
        const video = info;
        const degraded = deriveDegraded(final.degradationSignals);
        mapped = buildVideoProbeResult(video, url, degraded);
        if (mapped.kind === 'video' && mapped.formats.length === 0 && mapped.subtitles && Object.keys(mapped.subtitles).length === 0 && Object.keys(mapped.automaticCaptions).length === 0) {
          // Valid extractor response with zero formats + zero subs + zero
          // auto-captions — geo-block, age-gate, members-only, or live-not-yet.
          // Not a parse failure; the JSON shape was fine.
          emitFailure('content_unavailable');
          return fail(createAppError('download', 'Probe returned no formats'));
        }
      }

      emitSuccess(mapped);
      logger.info('Probe result', summarizeProbeResult(mapped));
      return ok(mapped);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown probing error';
      logger.error('Probe failure', { message, url });
      emitFailure(categorizeProbeError(message));
      return fail(createAppError('download', message));
    }
  }

  // Loop over `_type: 'url' / 'url_transparent'` redirects up to depth 1 to
  // follow extractor redirects (e.g. Bandcamp track → resolved video). Anything
  // deeper is a misbehaving extractor — bail rather than loop.
  private async probeWithRedirectFollow(url: string, playlistMode: ProbePlaylistMode): Promise<ProbeAttemptResult> {
    let currentUrl = url;
    for (let depth = 0; depth <= 1; depth++) {
      const attempt = await this.runProbeWithDegradationRetry(currentUrl, playlistMode);
      if (attempt.kind === 'failure') return attempt;
      const info = attempt.data.info;
      if (!isUrlRedirect(info)) return attempt;
      const next = info.url;
      if (!next || next === currentUrl) return attempt;
      logger.info('Probe redirect', { from: currentUrl, to: next, depth });
      currentUrl = next;
    }
    // Fell through both attempts; return whatever we got — caller surfaces as
    // 'redirected too many times' if still a url_redirect.
    return this.runProbeWithDegradationRetry(currentUrl, playlistMode);
  }

  private async runProbeWithDegradationRetry(url: string, playlistMode: ProbePlaylistMode): Promise<ProbeAttemptResult> {
    const initial = await this.runProbeAttempt(url, 'initial', playlistMode);
    if (initial.kind === 'failure') return initial;
    if (initial.data.degradationSignals.length === 0) return initial;

    logger.info('Probe degraded-success — retrying', {
      url,
      degradationSignals: initial.data.degradationSignals
    });

    const retry = await this.runProbeAttempt(url, 'retry', playlistMode);
    if (retry.kind === 'failure') {
      logger.info('Probe retry failed; using initial degraded result', { url });
      return initial;
    }
    if (retry.data.degradationSignals.length === 0) return retry;

    // Both degraded — pick the one with more formats (only meaningful for video info).
    const initialFormatCount = formatCount(initial.data.info);
    const retryFormatCount = formatCount(retry.data.info);
    return retryFormatCount > initialFormatCount ? retry : initial;
  }

  private async runProbeAttempt(url: string, attempt: ProbeAttemptName, playlistMode: ProbePlaylistMode): Promise<ProbeAttemptResult> {
    const source = attempt === 'retry' ? 'yt-dlp-probe-retry' : 'yt-dlp-probe';
    const result = await this.ytDlp.run(
      { kind: 'probe', url, playlistMode },
      {
        onStderr: (chunk) => {
          for (const line of splitStderrLines(chunk)) {
            logger.info(line, { source });
          }
        }
      }
    );

    if (result.kind !== 'success') {
      const code = result.kind === 'exit-error' ? result.exitCode : null;
      const signal = result.kind === 'exit-error' ? result.signal : null;
      const rawError = result.kind === 'exit-error' ? result.rawError : result.error.message;
      logger.error('yt-dlp probe failed', { attempt, code, url, signal });
      return {
        kind: 'failure',
        error: createAppError('download', rawError ?? 'Probing failed', undefined, true, signal ?? undefined),
        errorCategory: categorizeProbeError(rawError ?? '')
      };
    }

    let raw: unknown;
    try {
      raw = JSON.parse(result.stdout);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown JSON parse error';
      logger.error('Probe JSON parse failed', { attempt, message, url });
      return {
        kind: 'failure',
        error: createAppError('download', 'Failed to parse probe output', message),
        errorCategory: 'parse'
      };
    }

    const parseResult = infoDictSchema.safeParse(raw);
    if (!parseResult.success) {
      const message = parseResult.error.issues[0]?.message ?? 'yt-dlp output failed schema validation';
      logger.error('Probe schema validation failed', { attempt, message, url });
      return {
        kind: 'failure',
        error: createAppError('download', 'Unexpected yt-dlp output shape', message),
        errorCategory: 'parse'
      };
    }

    const info = parseResult.data;
    const degradationSignals = detectProbeDegradationSignals(result.stderr);
    logger.info('Probe complete', {
      attempt,
      url,
      type: info._type ?? 'video',
      title: (info as VideoInfo).title,
      extractor: (info as VideoInfo).extractor,
      degradationSignals: degradationSignals.length > 0 ? degradationSignals.map((s) => s.label) : undefined
    });
    return {
      kind: 'success',
      data: { info, stderr: result.stderr, degradationSignals }
    };
  }
}

function formatCount(info: InfoDict): number {
  if (isPlaylistLike(info)) return info.entries.length;
  const v = info as VideoInfo;
  return v.formats?.length ?? 0;
}

// Compact, log-friendly summary of a ProbeResult. Intentionally drops large
// fields (full formats array, full subtitle map) and keeps the shapes a human
// scanning logs would care about: kind, extractor, counts, degradation flags.
function summarizeProbeResult(r: ProbeResult): Record<string, unknown> {
  if (r.kind === 'video') {
    return {
      kind: r.kind,
      extractor: r.extractor,
      extractorKey: r.extractorKey,
      webpageUrl: r.webpageUrl,
      isAudioOnlySource: r.isAudioOnlySource,
      title: r.title,
      duration: r.duration,
      formatCount: r.formats.length,
      formatIds: r.formats.map((f) => f.formatId),
      subtitleLangs: Object.keys(r.subtitles ?? {}),
      autoCaptionLangs: Object.keys(r.automaticCaptions ?? {}),
      isLive: r.isLive,
      hasDrm: r.hasDrm,
      availability: r.availability,
      ageLimit: r.ageLimit,
      degraded: r.degraded?.reasons ?? null,
      thumbnail: r.thumbnail || null
    };
  }
  return {
    kind: r.kind,
    extractor: r.extractor,
    extractorKey: r.extractorKey,
    webpageUrl: r.webpageUrl,
    isAudioOnlySource: r.isAudioOnlySource,
    isMultiVideo: r.isMultiVideo,
    playlistId: r.playlistId,
    playlistTitle: r.playlistTitle,
    entryCount: r.entries.length,
    firstEntryUrl: r.entries[0]?.url ?? null
  };
}

function buildMockProbeResult(url: string): ProbeResult {
  return {
    kind: 'video',
    extractor: 'youtube',
    extractorKey: 'Youtube',
    webpageUrl: url,
    isAudioOnlySource: false,
    formats: [
      { formatId: '137', label: '1080p | mp4 | 30fps', ext: 'mp4', resolution: '1080p', fps: 30, filesize: 800_000_000, isVideoOnly: true, isAudioOnly: false },
      { formatId: '22', label: '720p | mp4 | 30fps', ext: 'mp4', resolution: '720p', fps: 30, filesize: 400_000_000, isVideoOnly: false, isAudioOnly: false },
      { formatId: '18', label: '360p | mp4 | 30fps', ext: 'mp4', resolution: '360p', fps: 30, filesize: 150_000_000, isVideoOnly: false, isAudioOnly: false }
    ],
    title: 'Mock Video Title',
    thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    duration: 212,
    subtitles: { en: [{ ext: 'vtt', name: 'English' }], es: [{ ext: 'vtt' }] },
    automaticCaptions: { de: [{ ext: 'vtt' }], ja: [{ ext: 'vtt', name: '日本語' }] },
    isLive: false,
    hasDrm: false
  };
}
