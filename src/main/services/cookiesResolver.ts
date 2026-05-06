import type { AppSettings } from '@shared/types';
import { nonEmpty } from '@shared/format';

export function resolveCookiesPath(settings: AppSettings): string | undefined {
  if (!settings.common?.cookiesEnabled) return undefined;
  return nonEmpty(settings.common?.cookiesPath?.trim());
}
