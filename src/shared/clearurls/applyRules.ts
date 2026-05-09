// ClearURLs ruleset applier.
//
// Ports the algorithm from https://github.com/ClearURLs/Addon (LGPL-3.0) —
// runtime applies the bundled `data.minify.json` rules to a URL.
//
// Spec: https://docs.clearurls.xyz/latest/specs/rules/
//
// Implemented:
//   - urlPattern (provider gate)
//   - exceptions (skip provider for matching URLs)
//   - rawRules (regex replace on full URL)
//   - redirections (unwrap to first capture group)
//   - rules (strip query + fragment params whose name matches pattern)
//   - referralMarketing (gated; default off — we don't strip affiliate params
//     by default since some users intentionally keep them)
//
// Skipped:
//   - completeProvider (we never fully block URLs — yt-dlp's job to decide
//     supportability; ClearURLs would refuse to load the URL entirely)
//   - forceRedirection (browser-extension semantics; doesn't apply to us)

import rawData from './data.json' with { type: 'json' };

interface ClearUrlsProvider {
  urlPattern: string;
  completeProvider?: boolean;
  forceRedirection?: boolean;
  rules?: string[];
  rawRules?: string[];
  referralMarketing?: string[];
  redirections?: string[];
  exceptions?: string[];
}

interface ClearUrlsData {
  providers: Record<string, ClearUrlsProvider>;
}

interface CompiledProvider {
  name: string;
  urlPattern: RegExp;
  rules: RegExp[];
  rawRules: RegExp[];
  referralMarketing: RegExp[];
  redirections: RegExp[];
  exceptions: RegExp[];
}

function safeRegex(pattern: string, flags = ''): RegExp | null {
  // ClearURLs ruleset is a fixed JSON file shipped in the repo, not user-
  // supplied input. The patterns are vetted by ClearURLs upstream and bundled
  // at build time. ReDoS surface here is the same as ClearURLs' own.
  try {
    // eslint-disable-next-line security/detect-non-literal-regexp
    return new RegExp(pattern, flags);
  } catch {
    // ClearURLs occasionally ships a regex syntax that JS doesn't grok (named
    // groups, etc.). Skip silently — coverage gap, not a crash.
    return null;
  }
}

function compileList(patterns: string[] | undefined, flags: string): RegExp[] {
  if (!patterns) return [];
  const out: RegExp[] = [];
  for (const p of patterns) {
    const re = safeRegex(p, flags);
    if (re) out.push(re);
  }
  return out;
}

let cached: CompiledProvider[] | null = null;

function compileProviders(): CompiledProvider[] {
  if (cached) return cached;
  const data = rawData as ClearUrlsData;
  const out: CompiledProvider[] = [];
  for (const [name, p] of Object.entries(data.providers)) {
    if (p.completeProvider) continue;
    const urlPattern = safeRegex(p.urlPattern, 'i');
    if (!urlPattern) continue;
    out.push({
      name,
      urlPattern,
      // Param-name patterns are case-insensitive per spec.
      rules: compileList(p.rules, 'i'),
      rawRules: compileList(p.rawRules, 'g'),
      referralMarketing: compileList(p.referralMarketing, 'i'),
      redirections: compileList(p.redirections, ''),
      exceptions: compileList(p.exceptions, '')
    });
  }
  cached = out;
  return out;
}

function stripParams(searchOrHash: string, rules: RegExp[]): string {
  if (!searchOrHash || rules.length === 0) return searchOrHash;
  const prefix = searchOrHash.charAt(0);
  const body = prefix === '?' || prefix === '#' ? searchOrHash.slice(1) : searchOrHash;
  if (!body) return searchOrHash;
  const original = body.split('&').filter(Boolean);
  const kept: string[] = [];
  for (const pair of original) {
    const eqIdx = pair.indexOf('=');
    const name = eqIdx === -1 ? pair : pair.slice(0, eqIdx);
    if (rules.some((re) => fullMatch(re, name))) continue;
    kept.push(pair);
  }
  if (kept.length === original.length) return searchOrHash;
  if (kept.length === 0) return '';
  return prefix + kept.join('&');
}

function fullMatch(re: RegExp, value: string): boolean {
  const result = re.exec(value);
  return result !== null && result[0] === value;
}

function findFirstCapture(re: RegExp, value: string): string | null {
  const result = re.exec(value);
  if (result && typeof result[1] === 'string') return result[1];
  return null;
}

interface ApplyOptions {
  // ClearURLs separates referralMarketing rules from regular rules so users
  // can opt out of stripping affiliate params (Amazon `tag`, eBay `mkrid`,
  // etc.). Default off — most consumers won't care, and stripping affiliate
  // params has social/etiquette implications.
  stripReferralMarketing?: boolean;
}

export function applyClearUrlsRules(input: string, opts: ApplyOptions = {}): string {
  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    return input;
  }

  const providers = compileProviders();
  let url = parsed.toString();

  for (const p of providers) {
    if (!p.urlPattern.test(url)) continue;
    if (p.exceptions.some((re) => re.test(url))) continue;

    for (const re of p.rawRules) {
      url = url.replace(re, '');
    }

    for (const re of p.redirections) {
      const cap = findFirstCapture(re, url);
      if (cap !== null) {
        try {
          url = decodeURIComponent(cap);
          break;
        } catch {
          // Keep the original URL when the redirect target isn't valid
          // percent-encoded.
        }
      }
    }

    try {
      parsed = new URL(url);
    } catch {
      return url;
    }

    const allParamRules = opts.stripReferralMarketing ? [...p.rules, ...p.referralMarketing] : p.rules;
    parsed.search = stripParams(parsed.search, allParamRules);
    parsed.hash = stripParams(parsed.hash, allParamRules);
    url = parsed.toString();
  }

  return url;
}
