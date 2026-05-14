import { LOCALES } from './strings.ts';
import type { Locale } from './strings.ts';

const SITE_URL = 'https://arroxy.orionus.dev/';

export function localeUrl(loc: Locale): string {
  return loc.dir ? `${SITE_URL}${loc.dir}/` : SITE_URL;
}

export function buildHreflangLinks(): string {
  const lines = LOCALES.map(
    (l) => `<link rel="alternate" hreflang="${l.code}" href="${localeUrl(l)}" />`,
  );
  const en = LOCALES.find((l) => l.code === 'en')!;
  lines.push(`<link rel="alternate" hreflang="x-default" href="${localeUrl(en)}" />`);
  return lines.join('\n    ');
}

export function buildOgLocaleAlt(currentCode: string): string {
  return LOCALES.filter((l) => l.code !== currentCode)
    .map((l) => `<meta property="og:locale:alternate" content="${l.ogLocale}" />`)
    .join('\n    ');
}

export function buildLangDirsJson(): string {
  const langDirs = Object.fromEntries(
    LOCALES.filter((l) => l.dir).map((l) => [l.code, l.dir]),
  );
  return JSON.stringify(langDirs).replace(/<\/script/gi, '<\\/script');
}

export function buildLangPicker(currentCode: string): { href: string; code: string; name: string; isCurrent: boolean }[] {
  const fromRoot = LOCALES.find((l) => l.code === currentCode)?.dir === '';
  return LOCALES.map((l) => {
    const isCurrent = l.code === currentCode;
    let href: string;
    if (isCurrent) {
      href = '#';
    } else if (fromRoot) {
      href = l.dir ? `${l.dir}/` : './';
    } else {
      href = l.dir ? `../${l.dir}/` : '../';
    }
    return { href, code: l.code, name: l.name, isCurrent };
  });
}
