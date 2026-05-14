// Extracted from landing-src/build.mjs so both old and new builds share it.
export interface LocaleEntry {
  code: string;
  strings: Record<string, string>;
}

export function assertParity(locales: LocaleEntry[]): void {
  const en = locales.find((l) => l.code === 'en');
  if (!en) throw new Error('English locale missing from registry');
  const enKeys = Object.keys(en.strings).sort();
  for (const loc of locales) {
    const keys = Object.keys(loc.strings).sort();
    const missing = enKeys.filter((k) => !keys.includes(k));
    const extra = keys.filter((k) => !enKeys.includes(k));
    if (missing.length || extra.length) {
      const parts: string[] = [];
      if (missing.length) parts.push(`missing: ${missing.join(', ')}`);
      if (extra.length) parts.push(`extra: ${extra.join(', ')}`);
      throw new Error(`Locale "${loc.code}" key drift — ${parts.join('; ')}`);
    }
  }
}
