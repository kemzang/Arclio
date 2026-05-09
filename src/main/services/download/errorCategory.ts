// Maps a yt-dlp / phase error message to an analytics category. Pure function,
// no I/O — exists in its own file because the regex set is the kind of thing
// that's better reviewed as a single artifact than buried in DownloadService.

export function categorizeDownloadError(msg: string): string {
  const m = msg.toLowerCase();
  if (/sign in to confirm|confirm you'?re not a bot|\bbot\b|http error 403|\b403\b/.test(m)) return 'bot_detected';
  if (/\benospc\b|no space left|disk (?:full|space)/.test(m)) return 'disk_full';
  if (/requested format (?:is )?(?:not available|unavailable)|no video formats|format not available/.test(m)) return 'format_unavailable';
  if (/ffmpeg (?:error|failed)|error (?:while )?(?:merging|muxing)|postprocessing/.test(m)) return 'merge_failed';
  if (/\b(?:timed? out|timeout|econn(?:reset|refused|aborted)|enotfound|getaddrinfo|network is unreachable)\b/.test(m)) return 'network';
  return 'unknown';
}
