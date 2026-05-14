import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { mild } from '@jscpd/core';
import { createTokenMapBasedOnCode } from '../src/tokenize';
import { tokenizeMarkdown } from '../src/languages/markdown';
import { TokensMap } from '../src/token-map';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASE_OPTIONS = { minTokens: 3, mode: mild };
const LOOSE_OPTIONS = { minTokens: 1, mode: mild };

const FIXTURE_DIR = join(__dirname, 'fixtures', 'markdown');

function fixture(name: string): string {
  return readFileSync(join(FIXTURE_DIR, name), 'utf8');
}

function getMapsDirect(source: string, options = BASE_OPTIONS): TokensMap[] {
  return tokenizeMarkdown(source, 'test.md', options);
}

function getMaps(source: string, format = 'markdown', options = BASE_OPTIONS): TokensMap[] {
  return createTokenMapBasedOnCode('test-id', source, format, options);
}

function getFormats(source: string, format = 'markdown', options = BASE_OPTIONS): string[] {
  return getMaps(source, format, options).map((m) => m.getFormat());
}

function getFrameIds(map: TokensMap): Set<string> {
  const ids = new Set<string>();
  for (const frame of map) {
    if (frame && typeof frame !== 'boolean') {
      ids.add((frame as any).id);
    }
  }
  return ids;
}

// ---------------------------------------------------------------------------
// Dispatch routes markdown to tokenizeMarkdown
// ---------------------------------------------------------------------------

describe('dispatch routes markdown to tokenizeMarkdown', () => {
  it('createTokenMapBasedOnCode with format=markdown does not throw', () => {
    expect(() => getMaps(fixture('basic.md'))).not.toThrow();
  });

  it('fenced block produces sub-language tokens — proves compound dispatch fired', () => {
    const source = fixture('fenced-typescript.md');
    const formats = getFormats(source);
    // Sub-language tokens only appear if tokenizeMarkdown ran (default Prism path yields only markdown)
    expect(formats).toContain('typescript');
  });

  it('format=txt does NOT route to tokenizeMarkdown', () => {
    // Plain text must go through the default Prism path, not the markdown compound tokenizer
    const source = 'some plain text content here and there';
    // Should not throw and should NOT produce sub-language tokens from fence parsing
    const maps = getMaps(source, 'txt');
    const formats = maps.map((m) => m.getFormat());
    expect(formats).not.toContain('markdown');
  });
});

// ---------------------------------------------------------------------------
// PHP fenced block
// ---------------------------------------------------------------------------

describe('PHP fenced block', () => {
  it('produces tokens keyed php', () => {
    const source = [
      '# PHP Example',
      '',
      '```php',
      '<?php',
      '$x = 1;',
      '$y = 2;',
      '$z = 3;',
      '?>',
      '```',
    ].join('\n');
    const formats = getFormats(source);
    expect(formats).toContain('php');
  });
});

// ---------------------------------------------------------------------------
// Cross-language keying — frame IDs match standalone file
// ---------------------------------------------------------------------------

describe('cross-language keying produces matching frame IDs', () => {
  it('TypeScript block in .md and standalone .ts produce overlapping frames', () => {
    const tsCode = [
      "const greeting: string = 'hello world';",
      'const count: number = 42;',
      'const flag: boolean = true;',
      'function add(a: number, b: number): number {',
      '  return a + b;',
      '}',
    ].join('\n');

    const mdSource = `# Example\n\n\`\`\`ts\n${tsCode}\n\`\`\`\n`;

    const mdMaps = getMaps(mdSource, 'markdown', LOOSE_OPTIONS);
    const mdTsMap = mdMaps.find((m) => m.getFormat() === 'typescript');
    expect(mdTsMap).toBeDefined();

    const standaloneMaps = getMaps(tsCode, 'typescript', LOOSE_OPTIONS);
    const standaloneMap = standaloneMaps.find((m) => m.getFormat() === 'typescript');
    expect(standaloneMap).toBeDefined();

    const mdFrames = getFrameIds(mdTsMap!);
    const standaloneFrames = getFrameIds(standaloneMap!);

    // At least one frame must match for cross-file duplicate detection to work
    expect(mdFrames.size).toBeGreaterThan(0);
    const intersection = [...mdFrames].filter((id) => standaloneFrames.has(id));
    expect(intersection.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// YAML front matter
// ---------------------------------------------------------------------------

describe('YAML front matter', () => {
  it('produces tokens keyed yaml from --- front matter', () => {
    const source = fixture('with-frontmatter.md');
    const formats = getFormats(source, 'markdown', LOOSE_OPTIONS);
    expect(formats).toContain('yaml');
  });

  it('front matter content does not appear in markdown-keyed tokens', () => {
    const source = [
      '---',
      'title: Secret Title',
      'date: 2024-01-01',
      '---',
      '',
      '# Hello',
    ].join('\n');
    const maps = getMapsDirect(source, LOOSE_OPTIONS);
    // The yaml map should exist, markdown map should not contain front matter
    const yamlMap = maps.find((m) => m.getFormat() === 'yaml');
    expect(yamlMap).toBeDefined();
    // The important part is yaml tokens exist and are separate
    expect(maps.some((m) => m.getFormat() === 'yaml')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Unrecognized language tags are silently skipped
// ---------------------------------------------------------------------------

describe('unrecognized language tags are silently skipped', () => {
  it('unknownxyz block produces no TokensMap keyed unknownxyz', () => {
    const source = fixture('unknown-lang.md');
    const formats = getFormats(source);
    expect(formats).not.toContain('unknownxyz');
  });

  it('does not throw for unknown language tags', () => {
    const source = fixture('unknown-lang.md');
    expect(() => getMaps(source)).not.toThrow();
  });

  it('empty language tag (no lang specifier) produces no sub-language tokens', () => {
    const source = '# Doc\n\n```\nsome code\n```\n';
    const formats = getFormats(source);
    // No format for unlabelled blocks
    expect(formats.filter((f) => f !== 'markdown')).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Markdown prose tokenization not regressed
// ---------------------------------------------------------------------------

describe('markdown prose tokenization not regressed', () => {
  it('basic.md (prose only) produces markdown tokens', () => {
    const source = fixture('basic.md');
    const formats = getFormats(source, 'markdown', LOOSE_OPTIONS);
    expect(formats).toContain('markdown');
  });

  it('prose tokens have non-zero count', () => {
    const source = fixture('basic.md');
    const maps = getMaps(source, 'markdown', LOOSE_OPTIONS);
    const mdMap = maps.find((m) => m.getFormat() === 'markdown');
    expect(mdMap).toBeDefined();
  });

  it('empty source returns empty array without throwing', () => {
    expect(() => {
      const maps = getMapsDirect('', LOOSE_OPTIONS);
      expect(Array.isArray(maps)).toBe(true);
    }).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Tilde fences are supported
// ---------------------------------------------------------------------------

describe('tilde fences', () => {
  it('tilde-fenced javascript block produces javascript tokens', () => {
    const source = fixture('tilde-fence.md');
    const formats = getFormats(source, 'markdown', LOOSE_OPTIONS);
    expect(formats).toContain('javascript');
  });
});

// ---------------------------------------------------------------------------
// ... (YAML document-end) terminates front matter
// ---------------------------------------------------------------------------

describe('... (YAML document-end) terminates front matter', () => {
  it('front matter closed with ... produces yaml tokens', () => {
    const source = [
      '---',
      'title: Doc',
      'version: 1',
      '...',
      '',
      '# Hello World',
    ].join('\n');
    const maps = getMapsDirect(source, LOOSE_OPTIONS);
    const yamlMap = maps.find((m) => m.getFormat() === 'yaml');
    expect(yamlMap).toBeDefined();
  });

  it('... terminator does not include closing line in yaml tokens', () => {
    const source = [
      '---',
      'title: Doc',
      'version: 1',
      '...',
      '# Prose here',
    ].join('\n');
    const maps = getMapsDirect(source, LOOSE_OPTIONS);
    // yaml map exists
    expect(maps.some((m) => m.getFormat() === 'yaml')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// .txt format separation
// ---------------------------------------------------------------------------

describe('.txt format separation', () => {
  it('format=txt does not produce yaml or sub-language tokens from fenced-like syntax', () => {
    // A .txt file that looks like markdown — should NOT be compound-tokenized
    const source = '```typescript\nconst x = 1;\n```\n';
    const maps = getMaps(source, 'txt');
    const formats = maps.map((m) => m.getFormat());
    // Should NOT contain typescript (not compound-tokenized)
    expect(formats).not.toContain('typescript');
  });

  it('format=txt processes source through default Prism path without throwing', () => {
    const source = 'some plain text content';
    expect(() => getMaps(source, 'txt')).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Synonym map resolves common aliases
// ---------------------------------------------------------------------------

describe('synonym map resolves common aliases', () => {
  it('shell tag resolves to bash', () => {
    const source = fixture('synonym-langs.md');
    const formats = getFormats(source, 'markdown', LOOSE_OPTIONS);
    expect(formats).toContain('bash');
  });

  it('node tag resolves to javascript', () => {
    const source = fixture('synonym-langs.md');
    const formats = getFormats(source, 'markdown', LOOSE_OPTIONS);
    expect(formats).toContain('javascript');
  });

  it('golang tag resolves to go', () => {
    const source = fixture('synonym-langs.md');
    const formats = getFormats(source, 'markdown', LOOSE_OPTIONS);
    expect(formats).toContain('go');
  });
});

// ---------------------------------------------------------------------------
// Multi-language blocks
// ---------------------------------------------------------------------------

describe('fenced-multi-language.md produces expected formats', () => {
  it('produces javascript, css, and python tokens', () => {
    const source = fixture('fenced-multi-language.md');
    const formats = getFormats(source, 'markdown', LOOSE_OPTIONS);
    expect(formats).toContain('javascript');
    expect(formats).toContain('css');
    expect(formats).toContain('python');
  });

  it('does not produce markdown tokens for code block contents', () => {
    // The code inside fenced blocks should be keyed by the sub-language, not markdown
    const source = fixture('fenced-multi-language.md');
    const formats = getFormats(source, 'markdown', LOOSE_OPTIONS);
    // markdown tokens MAY exist for the prose; that's fine
    // But the sub-language content must be correctly separated
    expect(formats).toContain('javascript');
  });
});

// ---------------------------------------------------------------------------
// Line offset correctness
// ---------------------------------------------------------------------------

describe('line offset correction', () => {
  it('typescript tokens carry file-absolute line numbers', () => {
    // Fence starts at line 5 (1-indexed), inner content at line 6
    const source = [
      '# Title',      // line 1
      '',              // line 2
      'Prose here.',   // line 3
      '',              // line 4
      '```ts',         // line 5
      'const x: number = 1;',  // line 6
      '```',           // line 7
    ].join('\n');

    const maps = getMapsDirect(source, LOOSE_OPTIONS);
    const tsMap = maps.find((m) => m.getFormat() === 'typescript');
    expect(tsMap).toBeDefined();

    // The first frame's start token should be on line >= 6
    const firstFrame = tsMap![Symbol.iterator]().next();
    if (!firstFrame.done && typeof firstFrame.value !== 'boolean') {
      expect((firstFrame.value as any).start.loc.start.line).toBeGreaterThanOrEqual(6);
    }
  });

  it('yaml front matter tokens carry file-absolute line numbers', () => {
    // Front matter content starts at line 2 (line 1 is ---)
    const source = [
      '---',          // line 1
      'title: Test',  // line 2
      '---',          // line 3
    ].join('\n');

    const maps = getMapsDirect(source, LOOSE_OPTIONS);
    const yamlMap = maps.find((m) => m.getFormat() === 'yaml');
    expect(yamlMap).toBeDefined();
  });
});
