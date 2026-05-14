const SITE_URL = 'https://arroxy.orionus.dev/';

const AI_BOTS = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'ClaudeBot',
  'anthropic-ai',
  'Claude-Web',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'Bingbot',
  'CCBot',
];

export function GET() {
  const aiBlocks = AI_BOTS.map((bot) => `User-agent: ${bot}\nAllow: /\n`).join('\n');
  const body = `User-agent: *\nAllow: /\n\n${aiBlocks}\nSitemap: ${SITE_URL}sitemap.xml\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
