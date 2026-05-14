import { IOptions, IToken } from '@jscpd/core';
import { tokenize } from '../tokenize';
import { createTokensMaps, TokensMap } from '../token-map';

const MAX_SOURCE_LENGTH = 5_000_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function countNewlines(s: string): number {
  let count = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '\n') count++;
  }
  return count;
}

function extractLang(attrs: string): string {
  const m = /\blang\s*=\s*["']([^"']+)["']/.exec(attrs);
  return m ? (m[1] ?? '').toLowerCase() : '';
}

function extractContext(attrs: string): string {
  const m = /\bcontext\s*=\s*["']([^"']+)["']/.exec(attrs);
  return m ? (m[1] ?? '').toLowerCase() : '';
}

function resolveBlockFormat(tagType: 'script' | 'style', lang: string): string {
  if (tagType === 'script') {
    if (lang === 'ts' || lang === 'typescript') return 'typescript';
    if (lang === 'js' || lang === 'javascript') return 'javascript';
    if (lang === '') return 'javascript';
    // unrecognized lang falls back to markup (consistent with Vue)
    return 'markup';
  }
  // style block
  if (lang === 'scss' || lang === 'sass') return 'scss';
  if (lang === 'less') return 'less';
  if (lang === 'css' || lang === 'postcss' || lang === 'stylus') return 'css';
  if (lang === '') return 'css';
  // unrecognized lang falls back to markup
  return 'markup';
}

// ---------------------------------------------------------------------------
// Block record produced by the single-pass extraction stage
// ---------------------------------------------------------------------------

interface BlockRecord {
  tagType: 'script' | 'style';
  lang: string;
  context: string;
  contentStart: number;
  contentEnd: number;
  blockContent: string;
}

// ---------------------------------------------------------------------------
// Main tokenizer
// ---------------------------------------------------------------------------

export function tokenizeSvelte(source: string, id: string, options: Partial<IOptions>): TokensMap[] {
  // Source length guard
  if (source.length > MAX_SOURCE_LENGTH) {
    return [];
  }

  // CRLF normalization
  const normalized = source.replace(/\r\n/g, '\n');

  // Empty source guard
  if (normalized.length === 0) {
    return [];
  }

  const { ignoreCase } = options;
  const allTokens: IToken[] = [];

  // -------------------------------------------------------------------------
  // Stage 1: Single-pass block extraction
  // -------------------------------------------------------------------------
  //
  // Regex matches <script ...> ... </script> and <style ...> ... </style>.
  // tagEnd is the index of the first '>' in the opening tag (known limitation:
  // '>' inside quoted attribute values breaks this — accepted trade-off).
  // contentStart = tagEnd + 1; contentEnd = start of closing tag.
  // Classification of script vs. module is done post-scan via 'context' attr.

  const blockRegex = /<(script|style)(\s[^>]*)?>[\s\S]*?<\/\1>/gi;
  const blocks: BlockRecord[] = [];

  // We need block positions in normalized to compute offsets and sanitize.
  // blockRegex.exec gives match.index (start of full match in normalized).
  let match: RegExpExecArray | null;
  const blockPositions: Array<{ start: number; end: number; record: BlockRecord }> = [];

  while ((match = blockRegex.exec(normalized)) !== null) {
    const [fullMatch, tagName, attrsRaw] = match;
    if (!tagName) continue;

    const tag = tagName.toLowerCase() as 'script' | 'style';
    const attrs = attrsRaw ?? '';
    const lang = extractLang(attrs);
    const context = extractContext(attrs);

    // tagEnd: index of '>' closing the opening tag within fullMatch
    const tagEndInFull = fullMatch.indexOf('>');
    const closeTagStartInFull = fullMatch.lastIndexOf('</');
    if (closeTagStartInFull <= tagEndInFull + 1) continue;

    const contentStartInFull = tagEndInFull + 1;
    const blockContent = fullMatch.substring(contentStartInFull, closeTagStartInFull);

    // Absolute positions in normalized source
    const contentStart = match.index + contentStartInFull;
    const contentEnd = match.index + closeTagStartInFull;

    const record: BlockRecord = {
      tagType: tag,
      lang,
      context,
      contentStart,
      contentEnd,
      blockContent,
    };

    blocks.push(record);
    blockPositions.push({
      start: match.index,
      end: match.index + fullMatch.length,
      record,
    });
  }

  // -------------------------------------------------------------------------
  // Stage 2: Source sanitization for template tokenization
  //
  // Replace the inner content of every block with whitespace-preserving chars:
  // non-'\n' → ' ', '\n' → '\n'. This gives a sanitizedSource of identical
  // length and identical newline positions, which means template tokens already
  // carry correct absolute line numbers with no further correction needed.
  // -------------------------------------------------------------------------

  let sanitizedSource = normalized;
  // Process replacements from right to left to keep indices stable
  for (let i = blockPositions.length - 1; i >= 0; i--) {
    const bp = blockPositions[i]!;
    const inner = normalized.slice(bp.record.contentStart, bp.record.contentEnd);
    const blanked = inner.replace(/[^\n]/g, ' ');
    sanitizedSource =
      sanitizedSource.slice(0, bp.record.contentStart) +
      blanked +
      sanitizedSource.slice(bp.record.contentEnd);
  }

  // -------------------------------------------------------------------------
  // Stage 3: Tokenization and merging
  // -------------------------------------------------------------------------

  // 3a. Template tokens — from sanitizedSource, no offset correction needed
  const templateTokens = tokenize(sanitizedSource, 'markup')
    .filter((token) => token.format === 'markup' && token.length > 0);
  for (const token of templateTokens) {
    allTokens.push(token);
  }

  // 3b. Script and style block tokens — with line + column offset correction
  for (const block of blocks) {
    const resolvedFormat = resolveBlockFormat(block.tagType, block.lang);

    // Line offset: number of newlines before contentStart in normalized source
    const blockStartLine = countNewlines(normalized.slice(0, block.contentStart)) + 1;
    const lineOffset = blockStartLine - 1;

    // Column offset for tokens on the first line of block content
    const lastNlBefore = normalized.lastIndexOf('\n', block.contentStart - 1);
    const colOffset = block.contentStart - (lastNlBefore + 1);

    const blockTokens = tokenize(block.blockContent, resolvedFormat)
      .filter((token) => token.length > 0);

    for (const token of blockTokens) {
      if (token.loc) {
        // Column correction (first line of block content only)
        if (token.loc.start.line === 1) {
          token.loc.start.column = (token.loc.start.column ?? 1) + colOffset;
        }
        if (token.loc.end.line === 1) {
          token.loc.end.column = (token.loc.end.column ?? 1) + colOffset;
        }
        // Line offset correction
        token.loc.start.line += lineOffset;
        token.loc.end.line += lineOffset;
      }
      allTokens.push(token);
    }
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
