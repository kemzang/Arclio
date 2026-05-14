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
  return readFileSync(join(__dirname, 'fixtures/astro', name), 'utf8');
}

function getFormats(source: string): string[] {
  return createTokenMapBasedOnCode('test-id', source, 'astro', BASE_OPTIONS).map((m) => m.getFormat());
}

// ---------------------------------------------------------------------------
// Astro tokenization via createTokenMapBasedOnCode
// ---------------------------------------------------------------------------

describe('Astro tokenization via createTokenMapBasedOnCode', () => {

  // -------------------------------------------------------------------------
  // basic.astro — frontmatter + template + <script> + <style>
  // -------------------------------------------------------------------------

  describe('basic.astro', () => {
    const source = fixture('basic.astro');

    it('produces a typescript TokensMap from the frontmatter', () => {
      expect(getFormats(source)).toContain('typescript');
    });

    it('produces a javascript TokensMap from the <script> block', () => {
      expect(getFormats(source)).toContain('javascript');
    });

    it('produces a css TokensMap from the <style> block', () => {
      expect(getFormats(source)).toContain('css');
    });

    it('produces a markup TokensMap from the template', () => {
      expect(getFormats(source)).toContain('markup');
    });

    it('does not emit a top-level astro-format TokensMap', () => {
      expect(getFormats(source)).not.toContain('astro');
    });

    // AC-013: line offset correctness assertions
    it('frontmatter typescript tokens start at line 2', () => {
      const maps = createTokenMapBasedOnCode('basic', source, 'astro', BASE_OPTIONS);
      const tsMap = maps.find((m) => m.getFormat() === 'typescript');
      expect(tsMap).toBeDefined();
      const firstFrame = tsMap![Symbol.iterator]().next();
      expect(firstFrame.done).toBe(false);
      if (!firstFrame.done && typeof firstFrame.value !== 'boolean') {
        // Line 1 is the opening --- fence; content begins on line 2
        expect(firstFrame.value.start.loc.start.line).toBe(2);
      }
    });

    it('<script> block content starts on the line immediately following its opening tag', () => {
      const maps = createTokenMapBasedOnCode('basic', source, 'astro', BASE_OPTIONS);
      const jsMap = maps.find((m) => m.getFormat() === 'javascript');
      expect(jsMap).toBeDefined();
      const firstFrame = jsMap![Symbol.iterator]().next();
      expect(firstFrame.done).toBe(false);
      if (!firstFrame.done && typeof firstFrame.value !== 'boolean') {
        // <script> is on line 13; first content line is 14
        expect(firstFrame.value.start.loc.start.line).toBe(14);
      }
    });

    it('markup template tokens start after the last frontmatter line', () => {
      const maps = createTokenMapBasedOnCode('basic', source, 'astro', BASE_OPTIONS);
      const markupMap = maps.find((m) => m.getFormat() === 'markup');
      expect(markupMap).toBeDefined();
      const firstFrame = markupMap![Symbol.iterator]().next();
      expect(firstFrame.done).toBe(false);
      if (!firstFrame.done && typeof firstFrame.value !== 'boolean') {
        // Frontmatter spans lines 1–5; template content begins on line 6
        expect(firstFrame.value.start.loc.start.line).toBeGreaterThan(5);
      }
    });
  });

  // -------------------------------------------------------------------------
  // no-frontmatter.astro — no --- fences
  // -------------------------------------------------------------------------

  describe('no-frontmatter.astro', () => {
    const source = fixture('no-frontmatter.astro');

    it('does not emit a frontmatter-derived typescript TokensMap', () => {
      // No <script lang="ts"> in this fixture, so no typescript at all
      expect(getFormats(source)).not.toContain('typescript');
    });

    it('produces a javascript TokensMap from the <script> block', () => {
      expect(getFormats(source)).toContain('javascript');
    });

    it('produces a markup TokensMap from the template', () => {
      expect(getFormats(source)).toContain('markup');
    });
  });

  // -------------------------------------------------------------------------
  // crlf.astro — CRLF line endings (identical structure to basic.astro)
  // -------------------------------------------------------------------------

  describe('crlf.astro', () => {
    const basicSource = fixture('basic.astro');
    const crlfSource = fixture('crlf.astro');

    it('crlf.astro actually contains CRLF sequences', () => {
      expect(crlfSource).toContain('\r\n');
    });

    it('basic.astro does not contain CRLF sequences', () => {
      expect(basicSource).not.toContain('\r\n');
    });

    it('produces the same set of token formats as the LF equivalent', () => {
      const basicFormats = getFormats(basicSource).sort();
      const crlfFormats = getFormats(crlfSource).sort();
      expect(crlfFormats).toEqual(basicFormats);
    });

    it('produces the same token counts per format as the LF equivalent', () => {
      const basicMaps = createTokenMapBasedOnCode('basic', basicSource, 'astro', BASE_OPTIONS);
      const crlfMaps = createTokenMapBasedOnCode('crlf', crlfSource, 'astro', BASE_OPTIONS);
      const basicFormats = basicMaps.map((m) => m.getFormat()).sort();
      for (const fmt of basicFormats) {
        const bMap = basicMaps.find((m) => m.getFormat() === fmt)!;
        const cMap = crlfMaps.find((m) => m.getFormat() === fmt);
        expect(cMap).toBeDefined();
        expect(cMap!.getTokensCount()).toBe(bMap.getTokensCount());
      }
    });
  });

  // -------------------------------------------------------------------------
  // Source length guard (ReDoS prevention)
  // -------------------------------------------------------------------------

  describe('source length guard', () => {
    it('throws a descriptive error when source exceeds 5,000,000 characters', () => {
      const oversized = 'x'.repeat(5_000_001);
      expect(() =>
        createTokenMapBasedOnCode('big', oversized, 'astro', BASE_OPTIONS),
      ).toThrow(/5,000,000/);
    });

    it('does not throw for source exactly at the limit (5,000,000 chars)', () => {
      // Source at exactly the limit — no regex, but also unlikely to produce
      // any meaningful tokens; we just verify it does not throw
      const atLimit = 'x'.repeat(5_000_000);
      expect(() =>
        createTokenMapBasedOnCode('limit', atLimit, 'astro', BASE_OPTIONS),
      ).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // Empty frontmatter
  // -------------------------------------------------------------------------

  describe('empty frontmatter', () => {
    it('does not throw for ---\\n--- with no content between fences', () => {
      const source = '---\n---\n<html><body><p>Hello World</p><p>Foo Bar</p></body></html>\n';
      const maps = createTokenMapBasedOnCode('empty-fm', source, 'astro', BASE_OPTIONS);
      expect(Array.isArray(maps)).toBe(true);
    });

    it('emits no typescript TokensMap when frontmatter is empty', () => {
      const source = '---\n---\n<html><body><p>Hello World</p><p>Foo Bar</p></body></html>\n';
      const formats = getFormats(source);
      expect(formats).not.toContain('typescript');
    });

    it('still produces markup tokens when frontmatter is empty', () => {
      const source = '---\n---\n<html><body><p>Hello World</p><p>Foo Bar</p></body></html>\n';
      const formats = getFormats(source);
      expect(formats).toContain('markup');
    });
  });

  // -------------------------------------------------------------------------
  // multi-script-lang.astro — two <script> blocks with different lang values
  // -------------------------------------------------------------------------

  describe('multi-script-lang.astro', () => {
    const source = fixture('multi-script-lang.astro');

    it('produces a typescript TokensMap (from <script lang="ts">)', () => {
      expect(getFormats(source)).toContain('typescript');
    });

    it('produces a javascript TokensMap (from <script> with no lang)', () => {
      expect(getFormats(source)).toContain('javascript');
    });

    it('both script blocks are independently extracted', () => {
      const maps = createTokenMapBasedOnCode('multi', source, 'astro', BASE_OPTIONS);
      // typescript map: tokens from frontmatter + <script lang="ts">
      // javascript map: tokens from <script> (no lang)
      const tsMap = maps.find((m) => m.getFormat() === 'typescript');
      const jsMap = maps.find((m) => m.getFormat() === 'javascript');
      expect(tsMap).toBeDefined();
      expect(jsMap).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // styles-langs.astro — scss, less, css
  // -------------------------------------------------------------------------

  describe('styles-langs.astro', () => {
    const source = fixture('styles-langs.astro');

    it('produces a scss TokensMap from <style lang="scss">', () => {
      expect(getFormats(source)).toContain('scss');
    });

    it('produces a less TokensMap from <style lang="less">', () => {
      expect(getFormats(source)).toContain('less');
    });

    it('produces a css TokensMap from <style> with no lang', () => {
      expect(getFormats(source)).toContain('css');
    });
  });

  // -------------------------------------------------------------------------
  // template-only.astro — no frontmatter, no script, no style
  // -------------------------------------------------------------------------

  describe('template-only.astro', () => {
    const source = fixture('template-only.astro');

    it('produces only a markup TokensMap', () => {
      const formats = getFormats(source);
      expect(formats).toContain('markup');
      expect(formats).not.toContain('typescript');
      expect(formats).not.toContain('javascript');
      expect(formats).not.toContain('css');
    });
  });

  // -------------------------------------------------------------------------
  // lang="ts" and lang="typescript" both resolve to typescript
  // -------------------------------------------------------------------------

  describe('script lang variants', () => {
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
      expect(getFormats(source)).not.toContain('javascript');
    });

    it('<script> with no lang produces javascript tokens', () => {
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
  });

  // -------------------------------------------------------------------------
  // Empty Astro file
  // -------------------------------------------------------------------------

  describe('edge cases', () => {
    it('empty string returns empty array without throwing', () => {
      const maps = createTokenMapBasedOnCode('empty', '', 'astro', BASE_OPTIONS);
      expect(Array.isArray(maps)).toBe(true);
      expect(maps.length).toBe(0);
    });
  });
});
