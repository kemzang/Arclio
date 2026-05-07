import type { AppSettings, CookiesBrowser } from '@shared/types';
import { nonEmpty } from '@shared/format';

export type ResolvedCookies = { kind: 'file'; path: string } | { kind: 'browser'; browser: CookiesBrowser };

export function resolveCookies(settings: AppSettings): ResolvedCookies | null {
  const mode = settings.common?.cookiesMode ?? 'off';
  if (mode === 'off') return null;
  if (mode === 'file') {
    const path = nonEmpty(settings.common?.cookiesPath?.trim());
    return path ? { kind: 'file', path } : null;
  }
  const browser = settings.common?.cookiesBrowser;
  return browser ? { kind: 'browser', browser } : null;
}
