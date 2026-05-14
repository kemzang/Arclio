import { describe, it, expect } from 'vitest';
import { getAvailableGrammars, ensureLanguageLoaded, Prism } from '../src/grammar-loader';

// ---------------------------------------------------------------------------
// getAvailableGrammars()
// ---------------------------------------------------------------------------

describe('getAvailableGrammars', () => {
  it('returns an array', () => {
    expect(Array.isArray(getAvailableGrammars())).toBe(true);
  });

  it('contains at least 100 bundled languages', () => {
    expect(getAvailableGrammars().length).toBeGreaterThanOrEqual(100);
  });

  it('includes common reprism languages', () => {
    const langs = getAvailableGrammars();
    for (const lang of [
      'javascript', 'typescript', 'python', 'java', 'go', 'rust',
      'css', 'markup', 'bash', 'ruby', 'kotlin', 'swift', 'cpp',
      'csharp', 'php', 'scala', 'haskell', 'lua', 'perl',
    ]) {
      expect(langs, `expected '${lang}' in available grammars`).toContain(lang);
    }
  });

  it('includes all entries as strings', () => {
    const langs = getAvailableGrammars();
    expect(langs.every((l) => typeof l === 'string')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// ensureLanguageLoaded + Prism integration
// ---------------------------------------------------------------------------

describe('ensureLanguageLoaded with bundled engine', () => {
  it('loads javascript grammar', () => {
    ensureLanguageLoaded('javascript');
    expect(Prism.languages['javascript']).toBeDefined();
  });

  it('loads python grammar', () => {
    ensureLanguageLoaded('python');
    expect(Prism.languages['python']).toBeDefined();
  });

  it('loads typescript grammar (depends on javascript)', () => {
    ensureLanguageLoaded('typescript');
    expect(Prism.languages['typescript']).toBeDefined();
  });

  it('loads go grammar (extends clike)', () => {
    ensureLanguageLoaded('go');
    expect(Prism.languages['go']).toBeDefined();
  });

  it('loads rust grammar', () => {
    ensureLanguageLoaded('rust');
    expect(Prism.languages['rust']).toBeDefined();
  });

  it('calling ensureLanguageLoaded twice is idempotent', () => {
    ensureLanguageLoaded('python');
    ensureLanguageLoaded('python');
    expect(Prism.languages['python']).toBeDefined();
  });

  it('does not throw for an unknown language', () => {
    expect(() => ensureLanguageLoaded('this-lang-does-not-exist')).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Prism engine tokenize (internal API sanity check)
// ---------------------------------------------------------------------------

describe('Prism engine tokenize', () => {
  it('tokenizes javascript with the bundled engine', () => {
    ensureLanguageLoaded('javascript');
    const grammar = Prism.languages['javascript'];
    expect(grammar).toBeDefined();
    const tokens = Prism.tokenize('const x = 1;', grammar);
    expect(Array.isArray(tokens)).toBe(true);
    expect(tokens.length).toBeGreaterThan(0);
  });

  it('tokenizes python with the bundled engine', () => {
    ensureLanguageLoaded('python');
    const grammar = Prism.languages['python'];
    const tokens = Prism.tokenize('def hello(): pass', grammar);
    expect(Array.isArray(tokens)).toBe(true);
    expect(tokens.length).toBeGreaterThan(0);
  });
});
