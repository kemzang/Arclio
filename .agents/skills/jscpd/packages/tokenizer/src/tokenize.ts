import { Prism, ensureLanguageLoaded } from './grammar-loader';
import { FORMATS } from './formats';
import { createTokensMaps, TokensMap } from './token-map';
import { IOptions, IToken } from '@jscpd/core';
import { tokenizeVue } from './languages/vue';
import { tokenizeAstro } from './languages/astro';
import { tokenizeSvelte } from './languages/svelte';
import { tokenizeMarkdown } from './languages/markdown-tokenizer';

const punctuation = {
  // eslint-disable-next-line @typescript-eslint/camelcase
  new_line: /\n/,
  empty: /\s+/,
};

// Track which languages have been patched with the punctuation tokens so we
// only mutate the grammar object once per language per process.
const patchedLanguages = new Set<string>();

/**
 * Ensure a Prism grammar is loaded for `lang` and patched with the punctuation
 * tokens that jscpd needs.  Only the grammars actually requested are loaded,
 * avoiding the ~300-grammar startup cost of the old eager loadLanguages() call.
 */
function ensureGrammarReady(prismName: string): void {
  if (patchedLanguages.has(prismName)) return;

  ensureLanguageLoaded(prismName);

  const grammar = Prism.languages[prismName];
  if (typeof grammar === 'object' && grammar !== null) {
    Prism.languages[prismName] = { ...grammar, ...punctuation };
  }
  patchedLanguages.add(prismName);
}

/**
 * Scan the raw code string for jscpd:ignore-start / jscpd:ignore-end pairs and
 * return their character ranges.  Using indexOf() is O(n) and produces zero
 * regex-engine backtracking, making it safe to call on files of any size.
 *
 * The region spans from the beginning of the line that contains the start
 * marker to the end of the line that contains the end marker, so that the
 * surrounding comment delimiters (// … or /* … *​/) are included in the
 * ignored range regardless of comment style.
 */
function findIgnoreRegions(code: string): Array<[number, number]> {
  const regions: Array<[number, number]> = [];
  const startMarker = 'jscpd:ignore-start';
  const endMarker = 'jscpd:ignore-end';
  let searchFrom = 0;

  while (true) {
    const startIdx = code.indexOf(startMarker, searchFrom);
    if (startIdx === -1) break;

    // Extend to the beginning of the line that contains the start marker.
    const lineStart = code.lastIndexOf('\n', startIdx - 1) + 1; // 0 when not found

    const endIdx = code.indexOf(endMarker, startIdx + startMarker.length);
    if (endIdx === -1) break;

    // Extend to the end of the line that contains the end marker.
    const nlAfterEnd = code.indexOf('\n', endIdx + endMarker.length);
    const lineEnd = nlAfterEnd === -1 ? code.length : nlAfterEnd;

    regions.push([lineStart, lineEnd]);
    searchFrom = lineEnd;
  }

  return regions;
}

function getLanguagePrismName(lang: string): string {
  if (lang in FORMATS && FORMATS[lang]?.parent) {
    return FORMATS[lang]?.parent as string;
  }
  return lang;
}

export function tokenize(code: string, language: string): IToken[] {
  let length = 0;
  let line = 1;
  let column = 1;

  // Pre-scan for ignore regions using fast indexOf (no regex backtracking).
  const ignoreRegions = findIgnoreRegions(code);

  function sanitizeLangName(name: string): string {
    return name && name.replace ? name.replace('language-', '') : 'unknown';
  }

  function createTokenFromString(token: string, lang: string): IToken[] {
    return [
      {
        format: lang,
        type: 'default',
        value: token,
        length: token.length,
      } as IToken,
    ];
  }

  function calculateLocation(token: IToken, position: number): IToken {
    const result: IToken = token;
    const val = result.value;
    // Count newlines and track last-line length without allocating an array.
    let newLines = 0;
    let lastLineLen = 0;
    if (typeof val === 'string') {
      for (let i = 0; i < val.length; i++) {
        if (val[i] === '\n') {
          newLines++;
          lastLineLen = 0;
        } else {
          lastLineLen++;
        }
      }
    }
    const start = {
      line,
      column,
      position
    };
    column = newLines > 0 ? lastLineLen + 1 : column + (typeof val === 'string' ? val.length : 0);
    const end = {
      line: line + newLines,
      column,
      position
    };
    result.loc = {start, end};
    result.range = [length, length + result.length];
    // Mark any token that overlaps an ignore region as type 'ignore'.
    if (ignoreRegions.length > 0) {
      const tokenStart = result.range[0];
      const tokenEnd = result.range[1];
      for (const [rs, re] of ignoreRegions) {
        if (tokenStart < re && tokenEnd > rs) {
          result.type = 'ignore';
          break;
        }
      }
    }
    length += result.length;
    line += newLines;
    return result;
  }


  function createTokenFromFlatToken(token: any, lang: string): IToken[] {
    return [
      {
        format: lang,
        type: token.type,
        value: token.content,
        length: token.length,
      } as IToken,
    ];
  }

  function createTokens(token: any, lang: string): IToken[] {
    if (typeof token === 'string') {
      return createTokenFromString(token, lang);
    }

    if (token.content && typeof token.content === 'string') {
      return createTokenFromFlatToken(token, lang);
    }

    if (token.content && Array.isArray(token.content)) {
      const res: IToken[] = [];
      const rawAlias = token.alias ? sanitizeLangName(token.alias as string) : null;
      const childLang = (rawAlias && rawAlias in FORMATS) ? rawAlias : lang;
      for (const t of token.content) {
        const sub = createTokens(t, childLang);
        for (const s of sub) res.push(s);
      }
      return res;
    }

    // Prism Token with empty/falsy content — skip to avoid object-valued tokens
    return [];
  }


  const tokens: IToken[] = [];
  const prismName = getLanguagePrismName(language);

  // Load and patch the grammar lazily — only when first needed.
  ensureGrammarReady(prismName);

  const grammar = Prism.languages[prismName];
  if (!grammar || typeof grammar !== 'object') {
    console.warn('Warn: jscpd has issue with support of "' + prismName + '"');
    return [];
  }
  for (const t of Prism.tokenize(code, grammar)) {
    const sub = createTokens(t, language);
    for (const s of sub) tokens.push(s);
  }
  return tokens
    .filter((t: IToken) => t.format in FORMATS)
    .map(
      (token, index) => calculateLocation(token, index)
    );
}

function setupIgnorePatterns(format: string, ignorePattern: string[]): void {
  const language = getLanguagePrismName(format);
  const extraTokens: Record<string, { pattern: RegExp; greedy: boolean }> = {};
  ignorePattern.forEach((pattern, i) => {
    extraTokens[`ignore_pattern_${i}`] = { pattern: new RegExp(pattern), greedy: false };
  });

  Prism.languages[language] = {
    ...extraTokens,
    ...Prism.languages[language],
  };
}

export function createTokenMapBasedOnCode(id: string, data: string, format: string, options: Partial<IOptions> = {}): TokensMap[] {
  if (format === 'vue') {
    return tokenizeVue(data, id, options);
  }
  if (format === 'astro') {
    return tokenizeAstro(data, id, options);
  }
  if (format === 'svelte') {
    return tokenizeSvelte(data, id, options);
  }
  if (format === 'markdown') {
    return tokenizeMarkdown(data, id, options);
  }

  const { mode, ignoreCase, ignorePattern } = options;

  const tokens: IToken[] = tokenize(data, format)
    .filter((token) => mode(token, options));

  if (ignorePattern) setupIgnorePatterns(format, options.ignorePattern || []);

  if (ignoreCase) {
    return createTokensMaps(id, data, tokens.map(
      (token: IToken): IToken => {
        token.value = token.value.toLocaleLowerCase();
        return token;
      },
    ), options);
  }

  return createTokensMaps(id, data, tokens, options);
}
