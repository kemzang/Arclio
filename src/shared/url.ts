export function parseVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (host === 'youtu.be') {
      return parsed.pathname.slice(1).split('?')[0] || null;
    }

    if (host.endsWith('youtube.com')) {
      return parsed.searchParams.get('v');
    }

    return null;
  } catch {
    return null;
  }
}

const YOUTUBE_TRACKING_PARAMS = ['feature', 'gclid', 'kw', 'si', 'pp'];

const GLOBAL_TRACKING_PARAM_PATTERNS = [/^utm_/i, /^fbclid$/i, /^_ga$/i, /^_gl$/i, /^srsltid$/i, /^msclkid$/i, /^mkt_tok$/i, /^mc_(eid|cid|tc)$/i];

function isYoutubeHost(host: string): boolean {
  return host === 'youtu.be' || host === 'youtube.com' || host.endsWith('.youtube.com');
}

function shouldStrip(name: string): boolean {
  if (YOUTUBE_TRACKING_PARAMS.includes(name.toLowerCase())) return true;
  return GLOBAL_TRACKING_PARAM_PATTERNS.some((re) => re.test(name));
}

export function cleanYoutubeUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  const host = parsed.hostname.toLowerCase();
  if (!isYoutubeHost(host)) return url;

  if (host.endsWith('youtube.com') && parsed.pathname === '/redirect') {
    const target = parsed.searchParams.get('q');
    if (target) return cleanYoutubeUrl(target);
  }

  if (host.endsWith('youtube.com') && parsed.pathname === '/signin') return url;

  const keep: [string, string][] = [];
  for (const [name, value] of parsed.searchParams) {
    if (!shouldStrip(name)) keep.push([name, value]);
  }
  parsed.search = '';
  for (const [name, value] of keep) parsed.searchParams.append(name, value);

  return parsed.toString();
}

function tryParseYoutube(url: string): URL | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (!isYoutubeHost(parsed.hostname.toLowerCase())) return null;
  return parsed;
}

export function isPlaylistUrl(url: string): boolean {
  const parsed = tryParseYoutube(url);
  if (!parsed) return false;
  const list = parsed.searchParams.get('list');
  if (!list) return false;
  return !parsed.searchParams.get('v');
}

export function isMixedVideoPlaylistUrl(url: string): boolean {
  const parsed = tryParseYoutube(url);
  if (!parsed) return false;
  return Boolean(parsed.searchParams.get('v')) && Boolean(parsed.searchParams.get('list'));
}

export function extractPlaylistId(url: string): string | null {
  const parsed = tryParseYoutube(url);
  if (!parsed) return null;
  return parsed.searchParams.get('list');
}

function rebuildWithoutParam(url: string, param: 'v' | 'list'): string {
  const cleaned = cleanYoutubeUrl(url);
  let parsed: URL;
  try {
    parsed = new URL(cleaned);
  } catch {
    return cleaned;
  }
  if (!isYoutubeHost(parsed.hostname.toLowerCase())) return cleaned;
  if (!parsed.searchParams.has(param)) return cleaned;
  parsed.searchParams.delete(param);
  return parsed.toString();
}

export function forceVideoOnly(url: string): string {
  return rebuildWithoutParam(url, 'list');
}

export function forcePlaylistOnly(url: string): string {
  // Strip v= so /watch becomes /playlist semantically. yt-dlp accepts
  // /watch?list=X without v= as a playlist URL.
  const stripped = rebuildWithoutParam(url, 'v');
  let parsed: URL;
  try {
    parsed = new URL(stripped);
  } catch {
    return stripped;
  }
  if (!isYoutubeHost(parsed.hostname.toLowerCase())) return stripped;
  // Normalize to canonical /playlist?list=... so yt-dlp's flat-playlist probe
  // treats it unambiguously as a playlist resource, not a watch page.
  if (parsed.pathname === '/watch' && parsed.searchParams.get('list')) {
    parsed.pathname = '/playlist';
  }
  return parsed.toString();
}
