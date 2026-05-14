import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import icon from 'astro-icon';
import react from '@astrojs/react';
import tailwind from '@tailwindcss/vite';
import { LOCALES } from '../landing-src/strings.mjs';

function assertParity(locales) {
  const en = locales.find((l) => l.code === 'en');
  if (!en) throw new Error('English locale missing from registry');
  const enKeys = Object.keys(en.strings).sort();
  for (const loc of locales) {
    const keys = Object.keys(loc.strings).sort();
    const missing = enKeys.filter((k) => !keys.includes(k));
    const extra = keys.filter((k) => !enKeys.includes(k));
    if (missing.length || extra.length) {
      const parts = [];
      if (missing.length) parts.push(`missing: ${missing.join(', ')}`);
      if (extra.length) parts.push(`extra: ${extra.join(', ')}`);
      throw new Error(`Locale "${loc.code}" key drift — ${parts.join('; ')}`);
    }
  }
}

assertParity(LOCALES);

export default defineConfig({
  site: 'https://arroxy.orionus.dev',
  outDir: '../docs',
  build: { format: 'directory' },
  trailingSlash: 'always',
  i18n: {
    locales: LOCALES.map((l) => l.code),
    defaultLocale: 'en',
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
  },
  integrations: [mdx(), icon(), react()],
  vite: {
    plugins: [tailwind()],
  },
});
