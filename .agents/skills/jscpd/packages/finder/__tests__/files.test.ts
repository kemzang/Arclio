import { describe, it, expect, vi, afterEach } from 'vitest';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { getFilesToDetect } from '../src/files';

const fixtures = path.join(__dirname, '../../../fixtures');

const baseOptions: any = {
  path: [fixtures + '/clike/file1.c'],
  format: ['c'],
  pattern: '**/*',
  minLines: 1,
  maxLines: 10000,
  maxSize: '100mb',
  ignore: [],
  noSymlinks: false,
  absolute: false,
};

describe('getFilesToDetect', () => {
  it('single file path returns array with exactly 1 entry with content', () => {
    const files = getFilesToDetect({ ...baseOptions, path: [fixtures + '/clike/file1.c'] });
    expect(files).toHaveLength(1);
    expect(typeof files[0].content).toBe('string');
    expect(files[0].content.length).toBeGreaterThan(0);
  });

  it('directory path returns at least 2 entries', () => {
    const files = getFilesToDetect({ ...baseOptions, path: [fixtures + '/clike'] });
    expect(files.length).toBeGreaterThanOrEqual(2);
  });

  it('maxSize 1b filter returns empty array', () => {
    const files = getFilesToDetect({ ...baseOptions, maxSize: '1b' });
    expect(files).toHaveLength(0);
  });

  it('minLines 99999 filter returns empty array', () => {
    const files = getFilesToDetect({ ...baseOptions, minLines: 99999, path: [fixtures + '/clike'] });
    expect(files).toHaveLength(0);
  });

  it('debug: true with non-c format logs skip message', () => {
    const mockLog = vi.spyOn(console, 'log').mockImplementation(() => {});
    getFilesToDetect({
      ...baseOptions,
      path: [fixtures + '/clike/file1.c'],
      format: ['javascript'],
      debug: true,
    });
    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('skipped'));
    mockLog.mockRestore();
  });
});

describe('getFilesToDetect — shebang detection', () => {
  const tmpFiles: string[] = [];

  function makeTempFile(name: string, content: string, mode: number): string {
    const filePath = path.join(os.tmpdir(), name);
    fs.writeFileSync(filePath, content, { mode });
    tmpFiles.push(filePath);
    return filePath;
  }

  afterEach(() => {
    for (const f of tmpFiles) {
      try { fs.unlinkSync(f); } catch { /* ignore */ }
    }
    tmpFiles.length = 0;
  });

  const shebangsBaseOptions: any = {
    pattern: '**/*',
    minLines: 1,
    maxLines: 10000,
    maxSize: '100mb',
    ignore: [],
    noSymlinks: false,
    absolute: true,
  };

  it('executable file with known shebang (bash) is included', () => {
    const filePath = makeTempFile('jscpd-test-shebang-exec-bash', '#!/bin/bash\necho hello\necho world\n', 0o755);
    const files = getFilesToDetect({ ...shebangsBaseOptions, path: [filePath], format: ['bash'] });
    expect(files.map(f => f.path)).toContain(filePath);
  });

  it('non-executable file with known shebang is excluded', () => {
    const filePath = makeTempFile('jscpd-test-shebang-noexec', '#!/bin/bash\necho hello\necho world\n', 0o644);
    const files = getFilesToDetect({ ...shebangsBaseOptions, path: [filePath], format: ['bash'] });
    expect(files.map(f => f.path)).not.toContain(filePath);
  });

  it('executable file with unknown shebang is excluded', () => {
    const filePath = makeTempFile('jscpd-test-shebang-unknown', '#!/usr/bin/myapp\ndo stuff\n', 0o755);
    const files = getFilesToDetect({ ...shebangsBaseOptions, path: [filePath], format: ['bash', 'python', 'javascript'] });
    expect(files.map(f => f.path)).not.toContain(filePath);
  });

  it('file with recognized extension is included via extension path regardless of exec bit', () => {
    const filePath = makeTempFile('jscpd-test-ext.py', 'x = 1\ny = 2\n', 0o644);
    const files = getFilesToDetect({ ...shebangsBaseOptions, path: [filePath], format: ['python'] });
    expect(files.map(f => f.path)).toContain(filePath);
  });

  it('version-suffixed shebang is normalized correctly (python3.11 → python)', () => {
    const filePath = makeTempFile('jscpd-test-shebang-pyver', '#!/usr/bin/python3.11\nx = 1\ny = 2\n', 0o755);
    const files = getFilesToDetect({ ...shebangsBaseOptions, path: [filePath], format: ['python'] });
    expect(files.map(f => f.path)).toContain(filePath);
  });

  it('env-mediated shebang with version suffix is normalized correctly (ruby3.2.1 → ruby)', () => {
    const filePath = makeTempFile('jscpd-test-shebang-rubyenv', '#!/usr/bin/env ruby3.2.1\nputs 1\nputs 2\n', 0o755);
    const files = getFilesToDetect({ ...shebangsBaseOptions, path: [filePath], format: ['ruby'] });
    expect(files.map(f => f.path)).toContain(filePath);
  });

  it('executable file with known shebang but wrong format filter is excluded', () => {
    const filePath = makeTempFile('jscpd-test-shebang-wrongfmt', '#!/bin/bash\necho hello\necho world\n', 0o755);
    const files = getFilesToDetect({ ...shebangsBaseOptions, path: [filePath], format: ['python'] });
    expect(files.map(f => f.path)).not.toContain(filePath);
  });

  it('symlink to executable file with known shebang is excluded', () => {
    const targetPath = makeTempFile('jscpd-test-shebang-symlink-target', '#!/bin/bash\necho hello\necho world\n', 0o755);
    const linkPath = path.join(os.tmpdir(), 'jscpd-test-shebang-symlink-link');
    try { fs.unlinkSync(linkPath); } catch { /* ignore */ }
    fs.symlinkSync(targetPath, linkPath);
    tmpFiles.push(linkPath);
    const files = getFilesToDetect({ ...shebangsBaseOptions, path: [linkPath], format: ['bash'] });
    expect(files.map(f => f.path)).not.toContain(linkPath);
  });
});

