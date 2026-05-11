// Closed taxonomy of yt-dlp failure kinds. Single source of truth for the
// app: probe + download + UI all key i18n strings, analytics labels, and CTAs
// off of `YtDlpErrorKind`. Add a new kind here, the `ERROR_PATTERNS` Record
// below fails to compile until you supply a regex (or mark it as
// classifier-internal w/ a `null` explanation).
//
// Pure module: only string/regex APIs. Renderer-importable (no electron-log,
// no node:fs). The IPC `LocalizedError` payload is `{ kind, raw }` — the raw
// stderr is always passed through verbatim so the UI can render it for the
// `'unknown'` fallback.

export const YT_DLP_ERROR_KINDS = [
  // yt-dlp stderr patterns — one regex each
  'botBlock',
  'ipBlock',
  'rateLimit',
  'ageRestricted',
  'unavailable',
  'geoBlocked',
  'outOfDiskSpace',
  'chunkTransferFailure',
  'postprocessFailure',
  'parse',
  'network',
  // Set explicitly by the renderer / probe path (not by the stderr classifier).
  // Kept in the closed enum so i18n + UI can switch on it exhaustively.
  'unsupportedUrl',
  // Fallback when no pattern matches. `raw` carries the verbatim stderr line.
  'unknown'
] as const;

export type YtDlpErrorKind = (typeof YT_DLP_ERROR_KINDS)[number];

// Kinds the stderr classifier can produce. `unsupportedUrl` is set by the
// caller (renderer URL validation, probe `Unsupported URL`) — it is not a
// stderr signal yt-dlp emits at exit time.
type ClassifierKind = Exclude<YtDlpErrorKind, 'unsupportedUrl' | 'unknown'>;

// Order = declaration order = match precedence. In practice patterns don't
// overlap, but if they ever do, earlier entries win.
const ERROR_PATTERNS: Record<ClassifierKind, RegExp> = {
  // yt-dlp's actual stderr uses U+2019 (right single quotation mark), not ASCII '.
  // Tolerate both so the regex matches real-world output.
  botBlock: /sign in to confirm you[’']re not a bot/i,
  ipBlock: /IP is likely being blocked/i,
  rateLimit: /HTTP Error 429|too many requests|this content isn't available.*try again later/i,
  ageRestricted: /this video is age.?restricted|sign in to confirm your age/i,
  unavailable: /private video|this video is unavailable|video has been removed/i,
  geoBlocked: /not available in your country|geo.?restricted/i,
  outOfDiskSpace: /no space left on device|there is not enough space on the disk|disk quota exceeded|not enough storage/i,
  // YouTube ranged-HTTP truncation: server closes connection mid-body, yt-dlp
  // retries up to N then gives up. The final ERROR: line is often empty for
  // this case — match the [download] line directly.
  chunkTransferFailure: /Giving up after \d+ retries|\d+ bytes read, \d+ more expected/i,
  // Anchored on `ERROR:` to avoid matching titles or filenames that happen to
  // contain "Conversion failed" (e.g. a tutorial video about failed conversions
  // would otherwise trigger a false-positive postprocess kind). The actual
  // cause (commonly ENOSPC) is not reachable from stderr — DownloadService
  // re-classifies as `outOfDiskSpace` after a disk-space probe.
  postprocessFailure: /ERROR:\s*(?:Postprocessing:|Conversion failed|Error (?:writing|muxing|merging)|ffmpeg (?:exited|failed))/i,
  // JSON parse / schema validation failures — produced by ProbeService when
  // yt-dlp's `--dump-single-json` output is malformed or shape-mismatched.
  parse: /failed to parse (?:json|probe output)|unexpected token|schema validation|invalid json|json (?:parse|decode)/i,
  // Transport-level failures. Not perfectly disjoint from `chunkTransferFailure`
  // — that one fires on retry-exhaustion specifically; this one on bare
  // ECONN/ETIMEOUT/getaddrinfo. Order matters: chunkTransferFailure is checked
  // first so a "Giving up after N retries" line classifies correctly even if
  // it also contains ECONNRESET.
  network: /\b(?:timed? out|timeout|econn(?:reset|refused|aborted)|enotfound|getaddrinfo|network is unreachable)\b/i
};

const PATTERN_ENTRIES = Object.entries(ERROR_PATTERNS) as [ClassifierKind, RegExp][];

export interface ClassifiedError {
  kind: YtDlpErrorKind;
  raw: string;
}

// Pure classifier. Given a yt-dlp stderr blob, return the matched kind plus
// the raw text the caller should surface verbatim when `kind === 'unknown'`.
export function classifyYtDlpStderr(stderr: string): ClassifiedError {
  for (const [kind, pattern] of PATTERN_ENTRIES) {
    if (pattern.test(stderr)) return { kind, raw: stderr };
  }
  return { kind: 'unknown', raw: stderr };
}

// Pull the most useful single-line error description out of a yt-dlp stderr
// blob. Used both for log lines and for the renderer's verbatim "unknown"
// fallback. yt-dlp sometimes emits a bare "ERROR:" with no message after the
// downloader exhausts its retries — fall back to the most recent [download]
// line, then the last non-empty line.
export function extractLastError(stderr: string): string | null {
  const errorMatches = stderr.match(/ERROR:.*$/gm);
  const lastError = errorMatches ? errorMatches[errorMatches.length - 1].trim() : null;
  if (!lastError || /^ERROR:\s*$/.test(lastError)) {
    const downloadMatches = stderr.match(/\[download\] Got error:.*Giving up after \d+ retries.*$/gm) ?? stderr.match(/\[download\] Got error:.*$/gm);
    if (downloadMatches) return downloadMatches[downloadMatches.length - 1].trim();
    const lines = stderr.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length > 0) return lines[lines.length - 1].trim();
  }
  return lastError;
}

// True when the raw error string looks like a yt-dlp postprocessor failure.
// Used by DownloadService.runJob when stderr classification didn't return a
// kind — a postprocess failure is a hint to do a post-hoc disk-space probe
// against the output dir, since ENOSPC during merge masquerades as "Conversion
// failed!" with no underlying ffmpeg detail. Kept as a separate predicate
// (rather than always returning `postprocessFailure` from the classifier) so
// the disk-space upgrade path can short-circuit when the probe confirms it.
export function isPostprocessFailure(rawError: string | null): boolean {
  return rawError !== null && ERROR_PATTERNS.postprocessFailure.test(rawError);
}
