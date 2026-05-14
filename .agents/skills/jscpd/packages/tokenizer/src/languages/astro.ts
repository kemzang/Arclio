import { IOptions, IToken } from '@jscpd/core';
import { tokenize } from '../tokenize';
import { createTokensMaps, TokensMap } from '../token-map';

const MAX_SOURCE_LENGTH = 5_000_000;

function extractLang(attrs: string): string {
  const m = /\blang\s*=\s*["']([^"']+)["']/.exec(attrs);
  return m ? (m[1] ?? '').toLowerCase() : '';
}

function countNewlines(s: string): number {
  let count = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '\n') count++;
  }
  return count;
}

function resolveScriptFormat(lang: string): string {
  return lang === 'ts' || lang === 'typescript' ? 'typescript' : 'javascript';
}

function resolveStyleFormat(lang: string): string {
  if (lang === 'scss') return 'scss';
  if (lang === 'less') return 'less';
  return 'css';
}

export function tokenizeAstro(source: string, id: string, options: Partial<IOptions>): TokensMap[] {
  if (source.length > MAX_SOURCE_LENGTH) {
    throw new Error(
      `Astro source exceeds the maximum tokenizable length of ${MAX_SOURCE_LENGTH.toLocaleString()} characters ` +
      `(got ${source.length.toLocaleString()}). Refusing to process to prevent potential regex ` +
      `performance issues on malformed input.`,
    );
  }

  const normalized = source.replace(/\r\n/g, '\n');
  const { ignoreCase } = options;
  const allTokens: IToken[] = [];

  // Track what will become the template source (frontmatter blanked, script/style inner contents blanked)
  let templateSource = normalized;

  // -------------------------------------------------------------------------
  // Frontmatter extraction — TypeScript
  // Matches: ---\n<content>\n--- or ---\n--- (empty frontmatter, \n? handles both)
  // -------------------------------------------------------------------------
  const frontmatterRegex = /^---\n([\s\S]*?)\n?---(?:\n|$)/;
  const frontmatterMatch = frontmatterRegex.exec(normalized);

  if (frontmatterMatch) {
    const innerContent = frontmatterMatch[1] ?? '';

    if (innerContent.trim().length > 0) {
      // Frontmatter content starts at line 2 (after the opening --- fence)
      const lineOffset = countNewlines(normalized.substring(0, frontmatterMatch.index + '---\n'.length));
      const blockTokens = tokenize(innerContent, 'typescript');

      for (const token of blockTokens) {
        if (token.loc) {
          token.loc.start.line += lineOffset;
          token.loc.end.line += lineOffset;
        }
        allTokens.push(token);
      }
    }

    // Replace entire frontmatter block (including fences) with equal newline count
    // so that all subsequent template line numbers remain accurate
    const frontmatterFull = frontmatterMatch[0];
    const frontmatterNewlines = countNewlines(frontmatterFull);
    templateSource = '\n'.repeat(frontmatterNewlines) + normalized.slice(frontmatterFull.length);
  }

  // -------------------------------------------------------------------------
  // Script and Style block extraction — always run against normalized source
  // -------------------------------------------------------------------------
  const blockRegex = /<(script|style)(\s[^>]*)?>[\s\S]*?<\/\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(normalized)) !== null) {
    const [fullMatch, tagName, attrsRaw] = match;
    if (!tagName) continue;

    const attrs = attrsRaw ?? '';
    const lang = extractLang(attrs);
    const tag = tagName.toLowerCase();
    const resolvedFormat = tag === 'script' ? resolveScriptFormat(lang) : resolveStyleFormat(lang);

    // Extract inner content by stripping opening and closing tags
    const openTagEnd = fullMatch.indexOf('>') + 1;
    const closeTagStart = fullMatch.lastIndexOf('</');
    if (closeTagStart <= openTagEnd) continue;

    const innerContent = fullMatch.substring(openTagEnd, closeTagStart);

    // Line offset: count newlines in normalized source before this block's opening tag
    const lineOffset = countNewlines(normalized.substring(0, match.index));

    // Column offset: only applied to tokens on the first line of the block
    // (those sharing a line with the opening tag in the original source)
    const contentAbsStart = match.index + openTagEnd;
    const lastNlBeforeContent = normalized.lastIndexOf('\n', contentAbsStart - 1);
    const colOffset = contentAbsStart - lastNlBeforeContent - 1;

    const blockTokens = tokenize(innerContent, resolvedFormat);

    for (const token of blockTokens) {
      if (token.loc) {
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
  }

  // -------------------------------------------------------------------------
  // Template extraction — markup
  // Blank the inner contents of script/style blocks in templateSource
  // (opening and closing tags are preserved; only the content between them is blanked)
  // -------------------------------------------------------------------------
  const templateSanitized = templateSource.replace(
    /<(script|style)(\s[^>]*)?>[\s\S]*?<\/\1>/gi,
    (fullMatch) => {
      const openTagEnd = fullMatch.indexOf('>') + 1;
      const closeTagStart = fullMatch.lastIndexOf('</');
      if (closeTagStart <= openTagEnd) return fullMatch;
      const innerContent = fullMatch.substring(openTagEnd, closeTagStart);
      const openTag = fullMatch.substring(0, openTagEnd);
      const closeTag = fullMatch.substring(closeTagStart);
      // Preserve line count by substituting inner content with equal newlines
      return openTag + '\n'.repeat(countNewlines(innerContent)) + closeTag;
    },
  );

  // Template tokens carry correct absolute line numbers because we preserved
  // newline counts throughout the source transformations above.
  // Filter to markup-format, non-zero-length tokens only:
  // - format === 'markup': prevents Prism's embedded-language grammar from
  //   bleeding javascript/css-aliased tokens produced by <script>/<style> tags
  //   that remain in the template string (per the tag-preservation requirement).
  // - length > 0: prevents a spurious zero-length token emitted by the Prism
  //   tokenizer when the template string is empty (e.g. no-content input).
  const templateTokens = tokenize(templateSanitized, 'markup')
    .filter((token) => token.format === 'markup' && token.length > 0);
  for (const token of templateTokens) {
    allTokens.push(token);
  }

  // -------------------------------------------------------------------------
  // Mode filter and case normalization
  // -------------------------------------------------------------------------
  let processedTokens = options.mode
    ? allTokens.filter((token) => options.mode!(token, options))
    : allTokens;

  if (ignoreCase) {
    processedTokens = processedTokens.map((token) => {
      token.value = token.value.toLocaleLowerCase();
      return token;
    });
  }

  return createTokensMaps(id, normalized, processedTokens, options);
}
