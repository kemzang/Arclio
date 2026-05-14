import { localeUrl } from './urls.ts';
import { LOCALES } from './strings.ts';
import type { Locale } from './strings.ts';

const SITE_URL = 'https://arroxy.orionus.dev/';
const OG_IMAGE = `${SITE_URL}assets/icon.png`;
const REPO_URL = 'https://github.com/antonio-orionus/Arroxy';
const RELEASES_URL = `${REPO_URL}/releases/latest`;

function safeJson(data: unknown): string {
  return JSON.stringify(data).replace(/<\/script/gi, '<\\/script');
}

export function buildJsonLd(loc: Locale): string {
  const softwareApp = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Arroxy',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Windows, macOS, Linux',
    description: (loc.strings as Record<string, string>).description,
    inLanguage: loc.code,
    url: localeUrl(loc),
    image: OG_IMAGE,
    license: 'https://opensource.org/licenses/MIT',
    downloadUrl: RELEASES_URL,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    author: {
      '@type': 'Person',
      '@id': 'https://x.com/OrionusAI',
      name: 'Antonio Orionus',
      url: 'https://x.com/OrionusAI',
    },
  };
  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': 'https://x.com/OrionusAI',
    name: 'Antonio Orionus',
    url: 'https://x.com/OrionusAI',
    sameAs: ['https://x.com/OrionusAI', 'https://github.com/antonio-orionus'],
  };
  return safeJson([softwareApp, person]);
}

export function buildFaqJsonLd(loc: Locale): string {
  const strings = loc.strings as Record<string, string>;
  const mainEntity = [];
  for (let i = 1; i <= 9; i++) {
    const q = strings[`faq_q${i}`];
    const a = strings[`faq_a${i}`];
    if (!q || !a) continue;
    mainEntity.push({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } });
  }
  return safeJson({ '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: loc.code, mainEntity });
}

interface PostJsonLdParams {
  title: string;
  description: string;
  author: string;
  datePublished: string;
  dateModified: string;
  url: string;
  ogImage: string;
}

export function buildPostJsonLd(p: PostJsonLdParams): string {
  return safeJson({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: p.title,
    description: p.description,
    datePublished: p.datePublished,
    dateModified: p.dateModified,
    url: p.url,
    image: p.ogImage,
    inLanguage: 'en',
    author: {
      '@type': 'Person',
      '@id': 'https://x.com/OrionusAI',
      name: p.author,
      url: 'https://x.com/OrionusAI',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Arroxy',
      url: SITE_URL,
    },
  });
}

export { LOCALES, localeUrl, OG_IMAGE, REPO_URL, RELEASES_URL };
