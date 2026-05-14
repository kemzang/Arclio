import { LOCALES } from '../i18n/strings.ts';
import { localeUrl } from '../i18n/urls.ts';
import { getCollection } from 'astro:content';

const SITE_URL = 'https://arroxy.orionus.dev/';

export async function GET() {
  const allPosts = await getCollection('posts');
  const englishPosts = allPosts;

  const today = new Date().toISOString().slice(0, 10);

  const xhtmlLinks = LOCALES.map(
    (l) => `    <xhtml:link rel="alternate" hreflang="${l.code}" href="${localeUrl(l)}" />`,
  ).join('\n');
  const xDefault = `    <xhtml:link rel="alternate" hreflang="x-default" href="${localeUrl(LOCALES.find((l) => l.code === 'en')!)}" />`;

  const localeUrls = LOCALES.map(
    (l) => `  <url>
    <loc>${localeUrl(l)}</loc>
    <lastmod>${today}</lastmod>
${xhtmlLinks}
${xDefault}
  </url>`,
  ).join('\n');

  const blogIndexUrl = `  <url>
    <loc>${SITE_URL}blog/</loc>
    <lastmod>${today}</lastmod>
  </url>`;

  const blogPostUrls = englishPosts
    .map((p) => {
      const slug = p.id;
      const dateModified =
        p.data.dateModified?.toISOString().slice(0, 10) ??
        p.data.datePublished.toISOString().slice(0, 10);
      return `  <url>
    <loc>${SITE_URL}blog/${slug}/</loc>
    <lastmod>${dateModified}</lastmod>
  </url>`;
    })
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${localeUrls}
${blogIndexUrl}
${blogPostUrls}
</urlset>
`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
