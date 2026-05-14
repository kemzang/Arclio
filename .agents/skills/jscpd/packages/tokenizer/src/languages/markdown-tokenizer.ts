// @ts-nocheck
// NOTE: This file deliberately does NOT import from '../tokenize' or
// '../grammar-loader' to avoid a circular dependency:
//   markdown.ts → markdown-tokenizer.ts → tokenize.ts
//                → grammar-loader.ts → languages/index.ts → markdown.ts
//
// Instead we import Prism directly from the engine (no grammar registration
// side-effects) and call Prism.tokenize() directly.  By the time
// tokenizeMarkdown() is *called* (not imported), grammar-loader will have
// already registered all language grammars.

import { IOptions, IToken } from '@jscpd/core';
import { Prism, ensureLanguageLoaded } from '../grammar-loader';
import { createTokensMaps, TokensMap } from '../token-map';
import { EXT_TO_FORMAT, FORMATS } from '../formats';

// ---------------------------------------------------------------------------
// Minimal inline tokenize — mirrors tokenize.ts but without the full
// ignore-region scan or lazy-loading (grammars are pre-loaded by
// grammar-loader at startup).
// ---------------------------------------------------------------------------
function tokenizeWithPrism(code: string, language: string): IToken[] {
  const prismLang = (language in FORMATS && FORMATS[language]?.parent)
    ? FORMATS[language]?.parent as string
    : language;

  ensureLanguageLoaded(prismLang);
  const grammar = Prism.languages[prismLang];
  if (!grammar || typeof grammar !== 'object') {
    return [];
  }

  let length = 0;
  let line = 1;
  let column = 1;

  function createTokenFromString(token: string, lang: string): IToken[] {
    return [{ format: lang, type: 'default', value: token, length: token.length } as IToken];
  }

  function createTokenFromFlatToken(token: any, lang: string): IToken[] {
    return [{ format: lang, type: token.type, value: token.content, length: token.length } as IToken];
  }

  function createTokens(token: any, lang: string): IToken[] {
    if (typeof token === 'string') return createTokenFromString(token, lang);
    if (token.content && typeof token.content === 'string') return createTokenFromFlatToken(token, lang);
    if (token.content && Array.isArray(token.content)) {
      const res: IToken[] = [];
      const rawAlias = token.alias ? token.alias.replace('language-', '') : null;
      const childLang = (rawAlias && rawAlias in FORMATS) ? rawAlias : lang;
      for (const t of token.content) for (const s of createTokens(t, childLang)) res.push(s);
      return res;
    }
    return [];
  }

  function calcLoc(token: IToken): IToken {
    const val = token.value;
    let newLines = 0;
    let lastLineLen = 0;
    if (typeof val === 'string') {
      for (let i = 0; i < val.length; i++) {
        if (val[i] === '\n') { newLines++; lastLineLen = 0; } else { lastLineLen++; }
      }
    }
    const start = { line, column, position: length };
    column = newLines > 0 ? lastLineLen + 1 : column + (typeof val === 'string' ? val.length : 0);
    token.loc = { start, end: { line: line + newLines, column, position: length } };
    token.range = [length, length + token.length];
    length += token.length;
    line += newLines;
    return token;
  }

  const tokens: IToken[] = [];
  for (const t of Prism.tokenize(code, grammar)) {
    for (const s of createTokens(t, language)) tokens.push(s);
  }

  return tokens
    .filter((t: IToken) => t.format in FORMATS)
    .map((token, index) => calcLoc(token));
}

// ---------------------------------------------------------------------------
// Synonym map: common aliases not registered as bare extensions in EXT_TO_FORMAT
// ---------------------------------------------------------------------------
const SYNONYM_MAP = new Map<string, string>([
  ['node', 'javascript'],
  ['shell', 'bash'],
  ['zsh', 'bash'],
  ['golang', 'go'],
]);

function resolveFormat(lang: string): string | null {
  const normalized = lang.toLowerCase();
  const tier1 = EXT_TO_FORMAT.get(normalized);
  if (tier1) return tier1;
  const synonym = SYNONYM_MAP.get(normalized);
  if (synonym) return synonym;
  // Check if the tag is itself a valid format name (e.g. 'javascript', 'python')
  if (normalized in FORMATS) return normalized;
  return null;
}

interface Range {
  start: number;
  end: number;
}

function blankRanges(source: string, ranges: Range[]): string {
  if (ranges.length === 0) return source;
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]!;
    const curr = sorted[i]!;
    if (curr.start < prev.end) {
      throw new Error(
        `jscpd markdown tokenizer: overlapping ranges [${prev.start},${prev.end}] and [${curr.start},${curr.end}]`,
      );
    }
  }
  let result = source;
  for (let i = sorted.length - 1; i >= 0; i--) {
    const { start, end } = sorted[i]!;
    const segment = source.slice(start, end);
    result = result.slice(0, start) + segment.replace(/[^\n\r]/g, ' ') + result.slice(end);
  }
  return result;
}

function countNewlines(s: string): number {
  let count = 0;
  for (let i = 0; i < s.length; i++) if (s[i] === '\n') count++;
  return count;
}

export function tokenizeMarkdown(source: string, id: string, options: Partial<IOptions>): TokensMap[] {
  const normalized = source.replace(/\r\n/g, '\n');
  const { ignoreCase } = options;
  const allTokens: IToken[] = [];
  const ranges: Range[] = [];

  // -------------------------------------------------------------------------
  // Front matter extraction — YAML
  // -------------------------------------------------------------------------
  const frontMatterRegex = /^---[ \t]*\n([\s\S]*?)\n(---|\.\.\.)[ \t]*(?:\n|$)/;
  const frontMatterMatch = frontMatterRegex.exec(normalized);
  if (frontMatterMatch) {
    const innerContent = frontMatterMatch[1] ?? '';
    if (innerContent.trim().length > 0) {
      const lineOffset = countNewlines(normalized.substring(0, frontMatterMatch.index + '---\n'.length));
      for (const token of tokenizeWithPrism(innerContent, 'yaml')) {
        if (token.length > 0) {
          if (token.loc) { token.loc.start.line += lineOffset; token.loc.end.line += lineOffset; }
          allTokens.push(token);
        }
      }
    }
    ranges.push({ start: frontMatterMatch.index, end: frontMatterMatch.index + frontMatterMatch[0].length });
  }

  // -------------------------------------------------------------------------
  // Fenced code block extraction
  // -------------------------------------------------------------------------
  const lines = normalized.split('\n');
  const lineStartPositions: number[] = [];
  let pos = 0;
  for (const line of lines) { lineStartPositions.push(pos); pos += line.length + 1; }

  const openingFenceRegex = /^(`{3,}|~{3,})(.*)$/;
  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!;
    const fenceMatch = openingFenceRegex.exec(line);
    if (!fenceMatch) { i++; continue; }

    const openFenceStr = fenceMatch[1]!;
    const openFenceChar = openFenceStr[0]!;
    const openFenceLen = openFenceStr.length;
    const infoString = (fenceMatch[2] ?? '').trim();
    const langTag = infoString.split(/\s+/)[0] ?? '';

    const closingFenceRegex = new RegExp(`^${openFenceChar === '`' ? '`' : '~'}{${openFenceLen},}[ \\t]*$`);
    let closeLineIndex = -1;
    for (let j = i + 1; j < lines.length; j++) {
      if (closingFenceRegex.test(lines[j]!)) { closeLineIndex = j; break; }
    }
    if (closeLineIndex === -1) { i++; continue; }

    const resolvedFmt = langTag ? resolveFormat(langTag) : null;
    if (resolvedFmt) {
      const innerContent = lines.slice(i + 1, closeLineIndex).join('\n');
      const lineOffset = i + 1;
      for (const token of tokenizeWithPrism(innerContent, resolvedFmt)) {
        if (token.length > 0) {
          if (token.loc) { token.loc.start.line += lineOffset; token.loc.end.line += lineOffset; }
          allTokens.push(token);
        }
      }
    }

    const rangeStart = lineStartPositions[i]!;
    const closingLineEnd = lineStartPositions[closeLineIndex]! + lines[closeLineIndex]!.length + 1;
    ranges.push({ start: rangeStart, end: Math.min(closingLineEnd, normalized.length) });
    i = closeLineIndex + 1;
  }

  // -------------------------------------------------------------------------
  // Sanitized prose pass
  // -------------------------------------------------------------------------
  const sanitized = blankRanges(normalized, ranges);
  for (const token of tokenizeWithPrism(sanitized, 'markdown')) {
    if (token.format === 'markdown' && token.length > 0) allTokens.push(token);
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
