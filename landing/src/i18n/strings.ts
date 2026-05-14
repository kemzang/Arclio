import { LOCALES as _LOCALES } from '../../../landing-src/strings.mjs';

export type Locale = (typeof _LOCALES)[number];
export type LocaleStrings = Locale['strings'];

export const LOCALES = _LOCALES as Locale[];

export function getLocale(code: string): Locale {
  const loc = LOCALES.find((l) => l.code === code);
  if (!loc) throw new Error(`Unknown locale: ${code}`);
  return loc;
}

export function t(code: string, key: keyof LocaleStrings): string {
  const loc = getLocale(code);
  const v = (loc.strings as Record<string, string>)[key as string];
  if (v === undefined) throw new Error(`Missing string ${code}.${String(key)}`);
  return v;
}
