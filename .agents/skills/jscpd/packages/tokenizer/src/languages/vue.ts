import { IOptions, IToken } from '@jscpd/core';
import { tokenize } from '../tokenize';
import { createTokensMaps, TokensMap } from '../token-map';
import { FORMATS } from '../formats';

function extractLang(attrs: string): string {
  const m = /\blang\s*=\s*["']([^"']+)["']/.exec(attrs);
  return m ? (m[1] ?? '').toLowerCase() : '';
}

function resolveBlockFormat(tagName: string, lang: string): string {
  switch (tagName) {
    case 'template':
      // Use the specified lang if it maps to a registered format; otherwise fall back to markup.
      return (lang && lang in FORMATS) ? lang : 'markup';
    case 'script':
      return lang === 'ts' || lang === 'typescript' ? 'typescript' : 'javascript';
    case 'style':
      if (lang === 'scss') return 'scss';
      if (lang === 'less') return 'less';
      return 'css';
    default:
      return 'markup';
  }
}

function countNewlines(s: string): number {
  let count = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '\n') count++;
  }
  return count;
}

export function tokenizeVue(source: string, id: string, options: Partial<IOptions>): TokensMap[] {
  const { ignoreCase } = options;
  const allTokens: IToken[] = [];

  const blockRegex = /<(template|script|style)(\s[^>]*)?>[\s\S]*?<\/\1>/gi;

  let match: RegExpExecArray | null;
  while ((match = blockRegex.exec(source)) !== null) {
    try {
      const [fullMatch, tagName, attrsRaw] = match;
      if (!tagName) continue;
      // Strip 'setup' attribute before lang extraction (handles <script setup lang="ts">)
      const attrs = attrsRaw ? attrsRaw.replace(/\bsetup\b/g, '') : '';
      const lang = extractLang(attrs);
      const resolvedFormat = resolveBlockFormat(tagName.toLowerCase(), lang);

      // Extract inner content by stripping opening and closing tags
      const openTagEnd = fullMatch.indexOf('>') + 1;
      const closeTagStart = fullMatch.lastIndexOf('</');
      if (closeTagStart <= openTagEnd) continue;

      const innerContent = fullMatch.substring(openTagEnd, closeTagStart);

      // Line offset: count newlines in source before this block's opening tag
      const lineOffset = countNewlines(source.substring(0, match.index));

      // Column offset: number of characters between the last newline before the
      // inner content start and that start position.  Applied only to tokens on
      // the first block-relative line (those whose opening tag and content share
      // the same source line).
      const contentAbsStart = match.index + openTagEnd;
      const lastNlBeforeContent = source.lastIndexOf('\n', contentAbsStart - 1);
      const colOffset = contentAbsStart - lastNlBeforeContent - 1;

      // Tokenize block content with the resolved format
      const blockTokens = tokenize(innerContent, resolvedFormat);

      // Apply line and column offset corrections, then collect
      for (const token of blockTokens) {
        if (token.loc) {
          // Column offset applies only to tokens whose block-relative line is 1
          if (token.loc.start.line === 1) {
            token.loc.start.column = (token.loc.start.column ?? 1) + colOffset;
          }
          if (token.loc.end.line === 1) {
            token.loc.end.column = (token.loc.end.column ?? 1) + colOffset;
          }
          token.loc.start.line += lineOffset;
          token.loc.end.line += lineOffset;
        }
        allTokens.push(token);
      }
    } catch (_e) {
      // Malformed block — skip silently
    }
  }

  let processedTokens = options.mode
    ? allTokens.filter((token) => options.mode!(token, options))
    : allTokens;

  if (ignoreCase) {
    processedTokens = processedTokens.map((token) => {
      token.value = token.value.toLocaleLowerCase();
      return token;
    });
  }

  return createTokensMaps(id, source, processedTokens, options);
}
