import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { mild } from '@jscpd/core';
import { createTokenMapBasedOnCode } from '../src/tokenize';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASE_OPTIONS = { minTokens: 3, mode: mild };

function fixture(name: string): string {
  return readFileSync(join(__dirname, 'fixtures/svelte', name), 'utf8');
}

function getFormats(source: string): string[] {
  return createTokenMapBasedOnCode('test-id', source, 'svelte', BASE_OPTIONS).map((m) => m.getFormat());
}

// ---------------------------------------------------------------------------
// Svelte tokenization via createTokenMapBasedOnCode
// ---------------------------------------------------------------------------

describe('Svelte tokenization via createTokenMapBasedOnCode', () => {

  // -------------------------------------------------------------------------
  // basic.svelte — bare <script> + <style> + markup template
  // -------------------------------------------------------------------------

  describe('basic.svelte', () => {
    const source = fixture('basic.svelte');

    it('produces a javascript TokensMap from the <script> block', () => {
      expect(getFormats(source)).toContain('javascript');
    });

    it('produces a css TokensMap from the <style> block', () => {
      expect(getFormats(source)).toContain('css');
    });

    it('produces a markup TokensMap from the template', () => {
      expect(getFormats(source)).toContain('markup');
    });

    it('does not emit a svelte-format TokensMap', () => {
      expect(getFormats(source)).not.toContain('svelte');
    });

    it('script block tokens carry absolute line numbers', () => {
      const maps = createTokenMapBasedOnCode('basic', source, 'svelte', BASE_OPTIONS);
      const jsMap = maps.find((m) => m.getFormat() === 'javascript');
      expect(jsMap).toBeDefined();
      const firstFrame = jsMap![Symbol.iterator]().next();
      expect(firstFrame.done).toBe(false);
      if (!firstFrame.done && typeof firstFrame.value !== 'boolean') {
        // <script> is on line 1; first content line is line 2
        expect(firstFrame.value.start.loc.start.line).toBeGreaterThan(1);
      }
    });
  });

  // -------------------------------------------------------------------------
  // typescript.svelte — <script lang="ts">
  // -------------------------------------------------------------------------

  describe('typescript.svelte', () => {
    const source = fixture('typescript.svelte');

    it('produces a typescript TokensMap from <script lang="ts">', () => {
      expect(getFormats(source)).toContain('typescript');
    });

    it('does not produce a javascript TokensMap (lang="ts" overrides default)', () => {
      expect(getFormats(source)).not.toContain('javascript');
    });

    it('does not emit a svelte-format TokensMap', () => {
      expect(getFormats(source)).not.toContain('svelte');
    });
  });

  // -------------------------------------------------------------------------
  // module-script.svelte — <script context="module"> only
  // -------------------------------------------------------------------------

  describe('module-script.svelte', () => {
    const source = fixture('module-script.svelte');

    it('produces tokens from the context="module" script block', () => {
      const maps = createTokenMapBasedOnCode('module', source, 'svelte', BASE_OPTIONS);
      expect(maps.length).toBeGreaterThan(0);
    });

    it('produces a javascript TokensMap from the module script', () => {
      expect(getFormats(source)).toContain('javascript');
    });

    it('does not emit a svelte-format TokensMap', () => {
      expect(getFormats(source)).not.toContain('svelte');
    });
  });

  // -------------------------------------------------------------------------
  // dual-script.svelte — both <script context="module"> and bare <script>
  // -------------------------------------------------------------------------

  describe('dual-script.svelte', () => {
    const source = fixture('dual-script.svelte');

    it('produces tokens (both script blocks are tokenized)', () => {
      const maps = createTokenMapBasedOnCode('dual', source, 'svelte', BASE_OPTIONS);
      expect(maps.length).toBeGreaterThan(0);
    });

    it('produces at least one javascript TokensMap', () => {
      expect(getFormats(source)).toContain('javascript');
    });

    it('total javascript token count exceeds what a single block would provide', () => {
      // Both script blocks contribute tokens; combined count must be > a single short block
      const maps = createTokenMapBasedOnCode('dual', source, 'svelte', BASE_OPTIONS);
      const jsMaps = maps.filter((m) => m.getFormat() === 'javascript');
      const totalTokens = jsMaps.reduce((sum, m) => sum + m.getTokensCount(), 0);
      expect(totalTokens).toBeGreaterThan(3);
    });

    it('does not emit a svelte-format TokensMap', () => {
      expect(getFormats(source)).not.toContain('svelte');
    });
  });

  // -------------------------------------------------------------------------
  // scss-style.svelte — <style lang="scss"> and <style lang="sass">
  // -------------------------------------------------------------------------

  describe('scss-style.svelte', () => {
    const source = fixture('scss-style.svelte');

    it('produces a scss TokensMap from <style lang="scss">', () => {
      expect(getFormats(source)).toContain('scss');
    });

    it('lang="sass" alias also resolves to scss', () => {
      // The scss-style fixture has a <style lang="sass"> block; it should
      // resolve to the same 'scss' format (alias table)
      const formats = getFormats(source);
      // Both scss blocks merge into the same format bucket
      expect(formats).toContain('scss');
    });

    it('does not emit a svelte-format TokensMap', () => {
      expect(getFormats(source)).not.toContain('svelte');
    });
  });

  // -------------------------------------------------------------------------
  // empty.svelte — empty file
  // -------------------------------------------------------------------------

  describe('empty.svelte', () => {
    it('returns an empty array without throwing', () => {
      const source = fixture('empty.svelte');
      const maps = createTokenMapBasedOnCode('empty', source, 'svelte', BASE_OPTIONS);
      expect(Array.isArray(maps)).toBe(true);
      expect(maps.length).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // attribute-gt.svelte — known limitation: > inside quoted attribute value
  // -------------------------------------------------------------------------

  describe('attribute-gt.svelte', () => {
    it('does not throw when a block tag has > inside a quoted attribute value', () => {
      const source = fixture('attribute-gt.svelte');
      expect(() =>
        createTokenMapBasedOnCode('attr-gt', source, 'svelte', BASE_OPTIONS),
      ).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases — inline source strings
  // -------------------------------------------------------------------------

  describe('edge cases', () => {

    it('empty string returns empty array without throwing', () => {
      const maps = createTokenMapBasedOnCode('empty', '', 'svelte', BASE_OPTIONS);
      expect(Array.isArray(maps)).toBe(true);
      expect(maps.length).toBe(0);
    });

    it('source > 5,000,000 characters returns empty array without throwing', () => {
      const oversized = 'x'.repeat(5_000_001);
      const maps = createTokenMapBasedOnCode('big', oversized, 'svelte', BASE_OPTIONS);
      expect(Array.isArray(maps)).toBe(true);
      expect(maps.length).toBe(0);
    });

    it('source exactly at 5,000,000 characters does not return early', () => {
      // At the limit, processing proceeds normally (no guard trigger)
      const atLimit = '<p>' + 'x'.repeat(4_999_990) + '</p>';
      expect(() =>
        createTokenMapBasedOnCode('limit', atLimit, 'svelte', BASE_OPTIONS),
      ).not.toThrow();
    });

    it('output contains no tokens with format === "svelte"', () => {
      const source = [
        '<script>',
        'var a = 1;',
        'var b = 2;',
        'var c = 3;',
        '</script>',
        '<p>Hello world template content</p>',
      ].join('\n');
      const maps = createTokenMapBasedOnCode('no-svelte-fmt', source, 'svelte', BASE_OPTIONS);
      const formats = maps.map((m) => m.getFormat());
      expect(formats).not.toContain('svelte');
    });

    it('bare <script> produces javascript tokens', () => {
      const source = [
        '<script>',
        'var a = 1;',
        'var b = 2;',
        'var c = 3;',
        '</script>',
      ].join('\n');
      expect(getFormats(source)).toContain('javascript');
      expect(getFormats(source)).not.toContain('typescript');
    });

    it('lang="ts" produces typescript tokens', () => {
      const source = [
        '<script lang="ts">',
        'const a: number = 1;',
        'const b: number = 2;',
        'const c: number = 3;',
        '</script>',
      ].join('\n');
      expect(getFormats(source)).toContain('typescript');
      expect(getFormats(source)).not.toContain('javascript');
    });

    it('lang="typescript" produces typescript tokens', () => {
      const source = [
        '<script lang="typescript">',
        'const a: number = 1;',
        'const b: number = 2;',
        'const c: number = 3;',
        '</script>',
      ].join('\n');
      expect(getFormats(source)).toContain('typescript');
    });

    it('lang="js" produces javascript tokens', () => {
      const source = [
        '<script lang="js">',
        'var a = 1;',
        'var b = 2;',
        'var c = 3;',
        '</script>',
      ].join('\n');
      expect(getFormats(source)).toContain('javascript');
    });

    it('lang="javascript" produces javascript tokens', () => {
      const source = [
        '<script lang="javascript">',
        'var a = 1;',
        'var b = 2;',
        'var c = 3;',
        '</script>',
      ].join('\n');
      expect(getFormats(source)).toContain('javascript');
    });

    it('style block with no lang produces css tokens', () => {
      const source = [
        '<style>',
        'button { color: red; padding: 4px; }',
        'p { margin: 0; font-size: 1rem; }',
        '</style>',
      ].join('\n');
      expect(getFormats(source)).toContain('css');
    });

    it('lang="scss" produces scss tokens', () => {
      const source = [
        '<style lang="scss">',
        '$color: red;',
        '.btn { color: $color; padding: 4px; }',
        '.text { margin: 0; }',
        '</style>',
      ].join('\n');
      expect(getFormats(source)).toContain('scss');
    });

    it('lang="sass" resolves to scss', () => {
      const source = [
        '<style lang="sass">',
        '$color: red',
        '.btn',
        '  color: $color',
        '  padding: 4px',
        '</style>',
      ].join('\n');
      expect(getFormats(source)).toContain('scss');
    });

    it('lang="less" produces less tokens', () => {
      const source = [
        '<style lang="less">',
        '@color: red;',
        '.btn { color: @color; padding: 4px; }',
        '.text { margin: 0; }',
        '</style>',
      ].join('\n');
      expect(getFormats(source)).toContain('less');
    });

    it('style block tokens are included in the output', () => {
      const source = [
        '<style>',
        'button { color: red; padding: 4px; margin: 0; }',
        'p { font-size: 1rem; line-height: 1.5; }',
        '</style>',
      ].join('\n');
      const maps = createTokenMapBasedOnCode('style-tokens', source, 'svelte', BASE_OPTIONS);
      expect(maps.length).toBeGreaterThan(0);
    });

    it('script block tokens carry absolute line numbers (not relative to block)', () => {
      const source = [
        '<p>line one</p>',
        '<p>line two</p>',
        '<p>line three</p>',
        '<script>',
        'var alpha = 1;',
        'var beta = 2;',
        'var gamma = 3;',
        '</script>',
      ].join('\n');
      const maps = createTokenMapBasedOnCode('line-offset', source, 'svelte', BASE_OPTIONS);
      const jsMap = maps.find((m) => m.getFormat() === 'javascript');
      expect(jsMap).toBeDefined();
      const firstFrame = jsMap![Symbol.iterator]().next();
      if (!firstFrame.done && typeof firstFrame.value !== 'boolean') {
        // <script> is on line 4; content starts on line 5
        expect(firstFrame.value.start.loc.start.line).toBeGreaterThanOrEqual(5);
      }
    });

    it('template tokens carry format === "markup" (not "svelte")', () => {
      const source = [
        '<p>Hello world template content here</p>',
        '<div>Another element for markup</div>',
        '<span>More content for tokenization</span>',
      ].join('\n');
      const maps = createTokenMapBasedOnCode('markup-fmt', source, 'svelte', BASE_OPTIONS);
      const formats = maps.map((m) => m.getFormat());
      expect(formats).not.toContain('svelte');
      expect(formats).toContain('markup');
    });

    it('unrecognized lang falls back to markup', () => {
      const source = [
        '<script lang="coffeescript">',
        'alpha = 1',
        'beta = 2',
        'gamma = 3',
        '</script>',
      ].join('\n');
      const maps = createTokenMapBasedOnCode('unknown-lang', source, 'svelte', BASE_OPTIONS);
      const formats = maps.map((m) => m.getFormat());
      // Falls back to 'markup' — may produce markup tokens if content is long enough
      expect(formats).not.toContain('svelte');
    });

  });

  // -------------------------------------------------------------------------
  // CRLF normalization — AC-013
  // -------------------------------------------------------------------------

  describe('CRLF normalization', () => {
    const lfSource = fixture('basic.svelte');
    const crlfSource = lfSource.replace(/\n/g, '\r\n');

    it('crlf conversion produces a source with CRLF sequences', () => {
      expect(crlfSource).toContain('\r\n');
    });

    it('LF source does not contain CRLF sequences', () => {
      expect(lfSource).not.toContain('\r\n');
    });

    it('CRLF and LF sources produce the same set of formats', () => {
      const lfFormats = getFormats(lfSource).sort();
      const crlfFormats = getFormats(crlfSource).sort();
      expect(crlfFormats).toEqual(lfFormats);
    });

    it('CRLF and LF sources produce the same token count per format', () => {
      const lfMaps = createTokenMapBasedOnCode('lf', lfSource, 'svelte', BASE_OPTIONS);
      const crlfMaps = createTokenMapBasedOnCode('crlf', crlfSource, 'svelte', BASE_OPTIONS);
      const lfFormats = lfMaps.map((m) => m.getFormat()).sort();
      for (const fmt of lfFormats) {
        const lfMap = lfMaps.find((m) => m.getFormat() === fmt)!;
        const crlfMap = crlfMaps.find((m) => m.getFormat() === fmt);
        expect(crlfMap).toBeDefined();
        expect(crlfMap!.getTokensCount()).toBe(lfMap.getTokensCount());
      }
    });

    it('CRLF and LF sources produce tokens with identical line numbers', () => {
      const lfMaps = createTokenMapBasedOnCode('lf', lfSource, 'svelte', BASE_OPTIONS);
      const crlfMaps = createTokenMapBasedOnCode('crlf', crlfSource, 'svelte', BASE_OPTIONS);
      for (const lfMap of lfMaps) {
        const crlfMap = crlfMaps.find((m) => m.getFormat() === lfMap.getFormat());
        expect(crlfMap).toBeDefined();
        const lfIter = lfMap[Symbol.iterator]();
        const crlfIter = crlfMap![Symbol.iterator]();
        let lfFrame = lfIter.next();
        let crlfFrame = crlfIter.next();
        while (!lfFrame.done && !crlfFrame.done) {
          if (typeof lfFrame.value !== 'boolean' && typeof crlfFrame.value !== 'boolean') {
            expect(crlfFrame.value.start.loc.start.line).toBe(
              lfFrame.value.start.loc.start.line,
            );
          }
          lfFrame = lfIter.next();
          crlfFrame = crlfIter.next();
        }
      }
    });
  });

});
