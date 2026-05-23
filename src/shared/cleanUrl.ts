// URL cleanup — strips tracking + affiliate-redirect params from any URL.
//
// Backed by ClearURLs' bundled ruleset (~200 providers, see
// `./clearurls/applyRules.ts`). The ClearURLs ruleset already covers YouTube,
// Vimeo, Twitch, every major site we care about; we don't maintain a separate
// allowlist.

import { applyClearUrlsRules } from './clearurls/applyRules.js';

// Strips any embedded whitespace (newlines, tabs, spaces) before ClearURLs
// runs. URLs copied from word-wrapped terminals or chat bubbles often arrive
// with a line break mid-path or mid-querystring; the input field then encodes
// the literal space as `%20`, which mangles IDs and makes downstream parsers
// (e.g. yt-dlp's youtube:tab extractor) fall back to wrong handlers. Note: an
// already-encoded `%20` is the three characters `%`, `2`, `0` — not
// whitespace — so this strip only removes whitespace the user actually pasted.
const WHITESPACE_RE = /\s+/g;

export function cleanUrl(url: string): string {
  return applyClearUrlsRules(url.replace(WHITESPACE_RE, ''));
}
