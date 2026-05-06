import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { binaryInternals } from '@main/services/BinaryManager';

describe('binaryInternals', () => {
  it('parses SHA lines', () => {
    const sha = binaryInternals.parseShaLine('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa  yt-dlp.exe', 'yt-dlp.exe');

    expect(sha).toBe('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  });

  it('parses the resumed offset from Content-Range', () => {
    expect(binaryInternals.parseContentRangeStart('bytes 1024-2047/4096')).toBe(1024);
    expect(binaryInternals.parseContentRangeStart('bytes */4096')).toBeNull();
  });

  it('discards stale partials on 416 and range mismatches', () => {
    expect(binaryInternals.resolvePartialResponseMode(2048, 416, 'bytes */1024')).toBe('discard-and-retry');
    expect(binaryInternals.resolvePartialResponseMode(2048, 206, 'bytes 0-1023/1024')).toBe('discard-and-retry');
  });

  it('appends only when the resumed range matches the partial size', () => {
    expect(binaryInternals.resolvePartialResponseMode(2048, 206, 'bytes 2048-4095/8192')).toBe('append');
    expect(binaryInternals.resolvePartialResponseMode(2048, 200, undefined)).toBe('fresh');
  });

  it('computes file sha256', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sha-test-'));
    const filePath = path.join(tempDir, 'test.bin');
    await fs.writeFile(filePath, 'hello world', 'utf-8');

    const digest = await binaryInternals.sha256ForFile(filePath);
    expect(digest).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
  });
});
