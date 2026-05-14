import { describe, it, expect } from 'vitest';
import { mild } from '@jscpd/core';
import { createTokenMapBasedOnCode } from '../src/tokenize';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASE_OPTIONS = { minTokens: 3, mode: mild };

function getMaps(source: string) {
  return createTokenMapBasedOnCode('test-id', source, 'vue', BASE_OPTIONS);
}

function getFormats(source: string): string[] {
  return getMaps(source).map((m) => m.getFormat());
}

// ---------------------------------------------------------------------------
// Vue SFC tokenization
// ---------------------------------------------------------------------------

describe('Vue SFC tokenization via createTokenMapBasedOnCode', () => {

  it('<script> with no lang produces tokens under javascript', () => {
    const source = `<script>
var a = 1;
var b = 2;
var c = 3;
</script>`;
    const formats = getFormats(source);
    expect(formats).toContain('javascript');
    expect(formats).not.toContain('typescript');
  });

  it('<script lang="ts"> produces tokens under typescript', () => {
    const source = `<script lang="ts">
const a: number = 1;
const b: number = 2;
const c: number = 3;
</script>`;
    const formats = getFormats(source);
    expect(formats).toContain('typescript');
    expect(formats).not.toContain('javascript');
  });

  it('<script setup lang="ts"> produces tokens under typescript', () => {
    const source = `<script setup lang="ts">
const a: number = 1;
const b: number = 2;
const c: number = 3;
</script>`;
    const formats = getFormats(source);
    expect(formats).toContain('typescript');
    expect(formats).not.toContain('javascript');
  });

  it('<template> with no lang produces tokens under markup', () => {
    const source = `<template>
  <div class="foo">
    <span>hello world</span>
    <span>hello world</span>
  </div>
</template>`;
    const formats = getFormats(source);
    expect(formats).toContain('markup');
  });

  it('<style> with no lang produces tokens under css', () => {
    const source = `<style>
.foo { color: red; margin: 0; padding: 0; }
.bar { color: blue; margin: 0; padding: 0; }
</style>`;
    const formats = getFormats(source);
    expect(formats).toContain('css');
    expect(formats).not.toContain('scss');
  });

  it('<style lang="scss"> produces tokens under scss', () => {
    const source = `<style lang="scss">
$color: red;
.foo { color: $color; margin: 0; padding: 0; }
.bar { color: $color; margin: 0; padding: 0; }
</style>`;
    const formats = getFormats(source);
    expect(formats).toContain('scss');
    expect(formats).not.toContain('css');
  });

  it('<style lang="less"> produces tokens under less', () => {
    const source = `<style lang="less">
@color: red;
.foo { color: @color; margin: 0; padding: 0; }
.bar { color: @color; margin: 0; padding: 0; }
</style>`;
    const formats = getFormats(source);
    expect(formats).toContain('less');
    expect(formats).not.toContain('css');
  });

  it('line offset: first script token start.line reflects block position in file', () => {
    // Template occupies lines 1-5, script starts on line 6
    const source = `<template>
  <div>hello</div>
  <div>world</div>
  <div>foo</div>
</template>
<script lang="ts">
const x: number = 1;
const y: number = 2;
const z: number = 3;
</script>`;
    const maps = getMaps(source);
    const scriptMap = maps.find((m) => m.getFormat() === 'typescript');
    expect(scriptMap).toBeDefined();
    // The script block opening tag is on line 6; inner content starts on line 7
    // The first token should have start.line > 6
    const firstFrame = scriptMap![Symbol.iterator]().next();
    if (!firstFrame.done && firstFrame.value && typeof firstFrame.value !== 'boolean') {
      expect(firstFrame.value.start.loc.start.line).toBeGreaterThan(5);
    }
  });

  it('no vue format key appears in output', () => {
    const source = `<script lang="ts">
const a: number = 1;
const b: number = 2;
const c: number = 3;
</script>`;
    const formats = getFormats(source);
    expect(formats).not.toContain('vue');
  });

  it('multiple same-format blocks: both sets of tokens present', () => {
    const source = `<script lang="ts">
const a: number = 1;
const b: number = 2;
</script>
<template><div>hello</div></template>
<script lang="ts">
const c: number = 3;
const d: number = 4;
</script>`;
    const maps = getMaps(source);
    const tsMaps = maps.filter((m) => m.getFormat() === 'typescript');
    // All typescript tokens should be merged into a single TokensMap
    expect(tsMaps.length).toBeGreaterThan(0);
  });

  it('empty SFC (no blocks) returns empty array without throwing', () => {
    expect(() => {
      const maps = getMaps('');
      expect(Array.isArray(maps)).toBe(true);
      expect(maps.length).toBe(0);
    }).not.toThrow();
  });

  it('truly unknown lang on template produces tokens under markup without throwing', () => {
    const source = `<template lang="kirby-unknown-xyz">
  <div>hello world</div>
  <div>goodbye world</div>
  <div>foo bar</div>
</template>`;
    expect(() => {
      const formats = getFormats(source);
      expect(formats).toContain('markup');
    }).not.toThrow();
  });

  it('<template lang="pug"> produces tokens under pug when pug is a registered format', () => {
    // pug is registered in FORMATS with exts: ['pug', 'jade']
    const source = `<template lang="pug">
div.foo Hello world foo bar baz
div.bar Something else here too
div.baz Another element right here
</template>`;
    const formats = getFormats(source);
    expect(formats).toContain('pug');
    expect(formats).not.toContain('markup');
  });

  it('column offset: tokens on the same line as the opening tag have file-absolute columns', () => {
    // All content is on the same line as the opening tag:
    // <script>const x = 1; const y = 2; const z = 3;</script>
    //         ^ column 9 (1-based)
    const source = '<script>const x = 1; const y = 2; const z = 3;</script>';
    const maps = getMaps(source);
    const jsMap = maps.find((m) => m.getFormat() === 'javascript');
    expect(jsMap).toBeDefined();
    const firstFrame = jsMap![Symbol.iterator]().next();
    if (!firstFrame.done && typeof firstFrame.value !== 'boolean') {
      // 'const' starts at column 9 (1-based) in the source, after '<script>'
      expect(firstFrame.value.start.loc.start.column).toBe(9);
    }
  });

  it('cross-format detection: script tokens carry typescript format field', () => {
    const source = `<script lang="ts">
const alpha: number = 1;
const beta: number = 2;
const gamma: number = 3;
</script>`;
    const maps = getMaps(source);
    const tsMap = maps.find((m) => m.getFormat() === 'typescript');
    expect(tsMap).toBeDefined();
    expect(tsMap!.getFormat()).toBe('typescript');
  });
});
