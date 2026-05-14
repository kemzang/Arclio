import { describe, it, expect } from 'vitest';
import { FORMATS, getSupportedFormats, getFormatByFile } from '../src/formats';

describe('FORMATS', () => {
  it('contains expected language entries', () => {
    expect(FORMATS).toHaveProperty('javascript');
    expect(FORMATS).toHaveProperty('typescript');
    expect(FORMATS).toHaveProperty('python');
    expect(FORMATS).toHaveProperty('java');
    expect(FORMATS).toHaveProperty('go');
    expect(FORMATS).toHaveProperty('ruby');
    expect(FORMATS).toHaveProperty('rust');
    expect(FORMATS).toHaveProperty('astro');
    expect(FORMATS).toHaveProperty('svelte');
  });

  it('every entry has an exts array', () => {
    for (const [name, meta] of Object.entries(FORMATS)) {
      expect(Array.isArray(meta.exts), `${name}.exts should be an array`).toBe(true);
    }
  });

  it('c-header has parent c', () => {
    expect(FORMATS['c-header']?.parent).toBe('c');
  });

  it('cpp-header has parent cpp', () => {
    expect(FORMATS['cpp-header']?.parent).toBe('cpp');
  });

  it('formats without a parent have no parent field', () => {
    expect(FORMATS['javascript']?.parent).toBeUndefined();
    expect(FORMATS['typescript']?.parent).toBeUndefined();
  });

  it('txt format has txt extension', () => {
    expect(FORMATS['txt']).toBeDefined();
    expect(FORMATS['txt']?.exts).toContain('txt');
    expect(FORMATS['markdown']?.exts).not.toContain('txt');
  });
});

describe('getSupportedFormats', () => {
  it('returns an array', () => {
    expect(Array.isArray(getSupportedFormats())).toBe(true);
  });

  it('is not empty', () => {
    expect(getSupportedFormats().length).toBeGreaterThan(0);
  });

  it('excludes "url"', () => {
    expect(getSupportedFormats()).not.toContain('url');
  });

  it('excludes "important"', () => {
    expect(getSupportedFormats()).not.toContain('important');
  });

  it('includes common languages', () => {
    const formats = getSupportedFormats();
    ['javascript', 'typescript', 'python', 'java', 'go', 'ruby', 'rust', 'css', 'markup'].forEach((lang) => {
      expect(formats).toContain(lang);
    });
  });

  it('includes parent-aliased formats', () => {
    const formats = getSupportedFormats();
    expect(formats).toContain('c-header');
    expect(formats).toContain('cpp-header');
  });
});

describe('getFormatByFile', () => {
  it.each([
    ['file.js', 'javascript'],
    ['file.ts', 'typescript'],
    ['file.py', 'python'],
    ['file.java', 'java'],
    ['file.go', 'go'],
    ['file.rb', 'ruby'],
    ['file.rs', 'rust'],
    ['file.cs', 'csharp'],
    ['file.cpp', 'cpp'],
    ['file.c', 'c'],
    ['file.h', 'c-header'],
    ['file.hpp', 'cpp-header'],
    ['file.css', 'css'],
    ['file.scss', 'scss'],
    ['file.html', 'markup'],
    ['file.xml', 'markup'],
    ['file.json', 'json'],
    ['file.yaml', 'yaml'],
    ['file.yml', 'yaml'],
    ['file.sh', 'bash'],
    ['file.kt', 'kotlin'],
    ['file.swift', 'swift'],
    ['file.php', 'php'],
    ['file.scala', 'scala'],
    ['file.tsx', 'tsx'],
    ['file.jsx', 'jsx'],
    ['file.sql', 'sql'],
    ['file.lua', 'lua'],
    ['file.dart', 'dart'],
    ['file.md', 'markdown'],
    ['file.txt', 'txt'],
    ['file.vue', 'vue'],
    ['file.astro', 'astro'],
    ['file.svelte', 'svelte'],
  ])('returns %s for %s', (filename, expectedFormat) => {
    expect(getFormatByFile(filename)).toBe(expectedFormat);
  });

  it('handles full absolute paths', () => {
    expect(getFormatByFile('/home/user/project/src/index.ts')).toBe('typescript');
    expect(getFormatByFile('/var/app/main.go')).toBe('go');
  });

  it('handles relative paths with directories', () => {
    expect(getFormatByFile('src/components/Button.tsx')).toBe('tsx');
  });

  it('returns undefined for unknown extensions', () => {
    expect(getFormatByFile('file.unknownxyz')).toBeUndefined();
  });

  it('returns undefined for files with no extension', () => {
    expect(getFormatByFile('Makefile')).toBeUndefined();
  });

  it('uses custom formatsExts when provided and non-empty', () => {
    const customFormats = { myformat: ['xyz', 'abc'] };
    expect(getFormatByFile('file.xyz', customFormats)).toBe('myformat');
    expect(getFormatByFile('file.abc', customFormats)).toBe('myformat');
  });

  it('custom formatsExts takes precedence over FORMATS', () => {
    // override .js to a custom format
    const customFormats = { custom: ['js'] };
    expect(getFormatByFile('file.js', customFormats)).toBe('custom');
  });

  it('falls back to FORMATS when formatsExts is an empty object', () => {
    expect(getFormatByFile('file.js', {})).toBe('javascript');
  });

  it('returns undefined for custom formatsExts with no matching extension', () => {
    const customFormats = { myformat: ['xyz'] };
    expect(getFormatByFile('file.js', customFormats)).toBeUndefined();
  });

  describe('formatsNames parameter', () => {
    it('matches extensionless file by exact filename', () => {
      expect(getFormatByFile('Makefile', undefined, { makefile: ['Makefile'] })).toBe('makefile');
    });

    it('matches extensionless file by basename when full path given', () => {
      expect(getFormatByFile('/path/to/project/Makefile', undefined, { makefile: ['Makefile'] })).toBe('makefile');
    });

    it('matches multiple filenames for the same format', () => {
      const names = { makefile: ['Makefile', 'GNUmakefile'] };
      expect(getFormatByFile('GNUmakefile', undefined, names)).toBe('makefile');
    });

    it('does not interfere with extension-based detection', () => {
      // formatsNames provided but file has an extension — falls through to EXT_TO_FORMAT
      expect(getFormatByFile('index.js', undefined, { makefile: ['Makefile'] })).toBe('javascript');
    });

    it('does not interfere with formatsExts', () => {
      // Both options provided — formatsExts handles .es, formatsNames handles Makefile
      expect(getFormatByFile('index.es', { javascript: ['es'] }, { makefile: ['Makefile'] })).toBe('javascript');
      expect(getFormatByFile('Makefile', { javascript: ['es'] }, { makefile: ['Makefile'] })).toBe('makefile');
    });

    it('formatsNames takes precedence over EXT_TO_FORMAT for extensionless files', () => {
      // A file called "Dockerfile" has no extension — formatsNames wins
      expect(getFormatByFile('Dockerfile', undefined, { docker: ['Dockerfile'] })).toBe('docker');
    });
  });
});
