import { describe, expect, it, vi } from 'vitest';
import { FormatProbeService, detectProbeDegradationSignals } from '@main/services/FormatProbeService.js';
import type { YtDlpResult } from '@main/services/YtDlp.js';

const YOUTUBE_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

function makeProbeJson(formatCount: number): string {
  return JSON.stringify({
    title: `Test Video ${formatCount}`,
    thumbnail: 'https://example.com/thumb.jpg',
    formats: Array.from({ length: formatCount }, (_, idx) => ({
      format_id: String(idx + 1),
      ext: 'mp4',
      resolution: `${Math.max(144, 1080 - idx)}p`,
      vcodec: 'avc1',
      acodec: 'mp4a',
      fps: 30
    }))
  });
}

function makeSuccess(formatCount: number, stderr = ''): YtDlpResult {
  return {
    kind: 'success',
    stdout: makeProbeJson(formatCount),
    stderr,
    usedExtractorFallback: false
  };
}

function makeExitError(rawError = 'ERROR: probe failed'): YtDlpResult {
  return {
    kind: 'exit-error',
    exitCode: 1,
    signal: null,
    rawError,
    stdout: '',
    stderr: rawError
  };
}

function makeService(results: YtDlpResult[]) {
  const runMock = vi.fn<() => Promise<YtDlpResult>>();
  for (const result of results) {
    runMock.mockResolvedValueOnce(result);
  }
  const service = new FormatProbeService({ run: runMock } as never);
  return { service, runMock };
}

const DEGRADED_STDERR = ['WARNING: [youtube] Error solving n challenge request using "deno" provider', 'WARNING: [youtube] abc: n challenge solving failed: Some formats may be missing.', 'WARNING: [youtube] Failed to download m3u8 information: IncompleteRead'].join('\n');

describe('detectProbeDegradationSignals', () => {
  it('returns no signals for clean stderr', () => {
    expect(detectProbeDegradationSignals('')).toEqual([]);
    expect(detectProbeDegradationSignals('WARNING: unrelated transient message')).toEqual([]);
  });

  it('matches every degradation signal explicitly', () => {
    const stderr = ['n challenge solving failed', 'Some formats may be missing', 'Error solving n challenge request', 'Failed to download m3u8 information', 'Unable to download webpage', 'IncompleteRead'].join('\n');

    expect(detectProbeDegradationSignals(stderr)).toEqual([
      { label: 'n challenge solving failed', category: 'extractor' },
      { label: 'Some formats may be missing', category: 'extractor' },
      { label: 'Error solving n challenge request', category: 'extractor' },
      { label: 'Failed to download m3u8 information', category: 'extractor' },
      { label: 'Unable to download webpage', category: 'extractor' },
      { label: 'IncompleteRead', category: 'extractor' }
    ]);
  });
});

describe('FormatProbeService — degraded success retry', () => {
  it('clean success returns immediately without retry', async () => {
    const { service, runMock } = makeService([makeSuccess(3)]);

    const result = await service.getFormats(YOUTUBE_URL);

    expect(runMock).toHaveBeenCalledTimes(1);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.formats).toHaveLength(3);
    expect(result.data.title).toBe('Test Video 3');
  });

  it('degraded success retries once and returns a clean retry result', async () => {
    const { service, runMock } = makeService([makeSuccess(3, DEGRADED_STDERR), makeSuccess(7)]);

    const result = await service.getFormats(YOUTUBE_URL);

    expect(runMock).toHaveBeenCalledTimes(2);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.formats).toHaveLength(7);
    expect(result.data.title).toBe('Test Video 7');
  });

  it('both degraded successes choose the retry result when it has more formats', async () => {
    const { service, runMock } = makeService([makeSuccess(3, DEGRADED_STDERR), makeSuccess(5, DEGRADED_STDERR)]);

    const result = await service.getFormats(YOUTUBE_URL);

    expect(runMock).toHaveBeenCalledTimes(2);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.formats).toHaveLength(5);
    expect(result.data.title).toBe('Test Video 5');
  });

  it('both degraded successes keep the initial result when retry has fewer formats', async () => {
    const { service, runMock } = makeService([makeSuccess(5, DEGRADED_STDERR), makeSuccess(3, DEGRADED_STDERR)]);

    const result = await service.getFormats(YOUTUBE_URL);

    expect(runMock).toHaveBeenCalledTimes(2);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.formats).toHaveLength(5);
    expect(result.data.title).toBe('Test Video 5');
  });

  it('both degraded successes keep the initial result when format counts tie', async () => {
    const { service, runMock } = makeService([makeSuccess(4, DEGRADED_STDERR), makeSuccess(4, DEGRADED_STDERR)]);

    const result = await service.getFormats(YOUTUBE_URL);

    expect(runMock).toHaveBeenCalledTimes(2);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.formats).toHaveLength(4);
    expect(result.data.title).toBe('Test Video 4');
  });

  it('retry hard failure keeps the initial successful result', async () => {
    const { service, runMock } = makeService([makeSuccess(3, DEGRADED_STDERR), makeExitError()]);

    const result = await service.getFormats(YOUTUBE_URL);

    expect(runMock).toHaveBeenCalledTimes(2);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.formats).toHaveLength(3);
    expect(result.data.title).toBe('Test Video 3');
  });

  it('retry parse failure keeps the initial successful result', async () => {
    const retryParseFailure: YtDlpResult = {
      kind: 'success',
      stdout: '{',
      stderr: '',
      usedExtractorFallback: false
    };
    const { service, runMock } = makeService([makeSuccess(3, DEGRADED_STDERR), retryParseFailure]);

    const result = await service.getFormats(YOUTUBE_URL);

    expect(runMock).toHaveBeenCalledTimes(2);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.formats).toHaveLength(3);
    expect(result.data.title).toBe('Test Video 3');
  });

  it('first hard failure preserves existing failure behavior without retry', async () => {
    const { service, runMock } = makeService([makeExitError('ERROR: [youtube] abc: Private video')]);

    const result = await service.getFormats(YOUTUBE_URL);

    expect(runMock).toHaveBeenCalledTimes(1);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toBe('ERROR: [youtube] abc: Private video');
  });

  it('never exceeds two top-level probe executions for a degraded success path', async () => {
    const { service, runMock } = makeService([makeSuccess(2, DEGRADED_STDERR), makeSuccess(2, DEGRADED_STDERR)]);

    await service.getFormats(YOUTUBE_URL);

    expect(runMock).toHaveBeenCalledTimes(2);
  });
});
