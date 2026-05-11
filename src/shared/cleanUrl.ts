// URL cleanup — strips tracking + affiliate-redirect params from any URL.
//
// Backed by ClearURLs' bundled ruleset (~200 providers, see
// `./clearurls/applyRules.ts`). The ClearURLs ruleset already covers YouTube,
// Vimeo, Twitch, every major site we care about; we don't maintain a separate
// allowlist.

import { applyClearUrlsRules } from './clearurls/applyRules.js';

export function cleanUrl(url: string): string {
  return applyClearUrlsRules(url);
}
