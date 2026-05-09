import type { YtdlpErrorKey } from '@shared/i18n/types.js';

// Subset of YtdlpErrorKey that yt-dlp can emit on stderr. Client-side
// validation keys (e.g. `unsupportedUrl`, raised before yt-dlp ever runs)
// are excluded so this stays a closed record over real stderr signals.
export type StderrSignal = Exclude<YtdlpErrorKey, 'unsupportedUrl'>;

// Adding a stderr-emitting YtdlpErrorKey makes this Record fail to compile
// until the new key has a regex pattern — the link to the enum is enforced
// by the type system.
const ERROR_PATTERNS: Record<StderrSignal, RegExp> = {
  // yt-dlp's actual stderr uses U+2019 (right single quotation mark), not ASCII '.
  // Tolerate both so the regex matches real-world output.
  botBlock: /sign in to confirm you[’']re not a bot/i,
  ipBlock: /IP is likely being blocked/i,
  rateLimit: /HTTP Error 429|too many requests|this content isn't available.*try again later/i,
  ageRestricted: /this video is age.?restricted|sign in to confirm your age/i,
  unavailable: /private video|this video is unavailable|video has been removed/i,
  geoBlocked: /not available in your country|geo.?restricted/i,
  outOfDiskSpace: /no space left on device|there is not enough space on the disk|disk quota exceeded|not enough storage/i,
  // YouTube ranged-HTTP truncation: server closes connection mid-body,
  // yt-dlp retries up to N then gives up. The final ERROR: line is often
  // empty for this case — match the [download] line directly.
  chunkTransferFailure: /Giving up after \d+ retries|\d+ bytes read, \d+ more expected/i
};

// Iteration order is the declaration order of the keys above; in practice
// patterns don't overlap, but if they ever do, this order defines precedence.
const PATTERN_ENTRIES = Object.entries(ERROR_PATTERNS) as [StderrSignal, RegExp][];

export function extractLastError(stderr: string): string | null {
  const errorMatches = stderr.match(/ERROR:.*$/gm);
  const lastError = errorMatches ? errorMatches[errorMatches.length - 1].trim() : null;
  // yt-dlp sometimes emits a bare "ERROR:" with no message after the
  // downloader exhausts its retries. Fall back to the most recent
  // [download] line that actually describes the failure so the user
  // sees something better than "ERROR:".
  if (!lastError || /^ERROR:\s*$/.test(lastError)) {
    const downloadMatches = stderr.match(/\[download\] Got error:.*Giving up after \d+ retries.*$/gm) ?? stderr.match(/\[download\] Got error:.*$/gm);
    if (downloadMatches) return downloadMatches[downloadMatches.length - 1].trim();
  }
  return lastError;
}

export function classifyStderr(stderr: string): StderrSignal | null {
  for (const [key, pattern] of PATTERN_ENTRIES) {
    if (pattern.test(stderr)) return key;
  }
  return null;
}
