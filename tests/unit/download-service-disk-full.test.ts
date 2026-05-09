import { EventEmitter } from 'node:events';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { DownloadService } from '@main/services/DownloadService.js';
import { YtDlp } from '@main/services/YtDlp.js';
import type { PreparedJob, EmbedOptions, SponsorBlockOptions } from '@shared/preparedJob.js';

const EMBED_OFF: EmbedOptions = { chapters: false, metadata: false, thumbnail: false, description: false, thumbnailSidecar: false };
const SB_OFF: SponsorBlockOptions = { mode: 'off' };
const DEFAULT_JOB: PreparedJob = { kind: 'single-format', extractor: 'youtube', extractorKey: 'Youtube', formatId: '137+251', preset: 'custom', sponsorBlock: SB_OFF, embed: EMBED_OFF };

vi.mock('@main/utils/process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@main/utils/process.js')>();
  return { ...actual, spawnYtDlp: vi.fn() };
});

vi.mock('@main/utils/diskSpace', () => ({
  checkDiskSpace: vi.fn()
}));

import { spawnYtDlp } from '@main/utils/process.js';
import { checkDiskSpace } from '@main/utils/diskSpace.js';

beforeEach(() => {
  vi.resetAllMocks();
});

function makeFakeProcess(exitCode: number, stderr = '') {
  const proc = Object.assign(new EventEmitter(), {
    stdout: new EventEmitter(),
    stderr: new EventEmitter(),
    kill: vi.fn()
  });
  setTimeout(() => {
    if (stderr) proc.stderr.emit('data', Buffer.from(stderr));
    proc.emit('close', exitCode);
  }, 10);
  return proc;
}

function makeService() {
  const tokenService = {
    mintTokenForUrl: vi.fn().mockResolvedValue({ token: 'tok', visitorData: 'vd' }),
    invalidateCache: vi.fn()
  };
  const binaryManager = {
    ensureYtDlp: vi.fn().mockResolvedValue('/usr/bin/yt-dlp'),
    ensureFFmpeg: vi.fn().mockResolvedValue('/usr/bin/ffmpeg'),
    ensureDeno: vi.fn().mockResolvedValue(null),
    ensureFFprobe: vi.fn().mockResolvedValue(null)
  };
  const recentJobsStore = { push: vi.fn().mockResolvedValue(undefined) };
  const settingsStore = { get: vi.fn().mockResolvedValue({}) };

  const ytDlp = new YtDlp(binaryManager as never, tokenService as never, settingsStore as never);
  const service = new DownloadService(ytDlp, recentJobsStore as never);

  return { service, recentJobsStore };
}

const YOUTUBE_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

describe('DownloadService — postprocess ENOSPC reclassification', () => {
  it('upgrades unclassified "Postprocessing: Conversion failed!" to outOfDiskSpace when disk probe shows low free', async () => {
    // Preflight at job start: ample free. Post-failure probe: low free.
    vi.mocked(checkDiskSpace)
      .mockResolvedValueOnce({ ok: true, freeBytes: 50_000_000_000, requiredBytes: 200 * 1024 * 1024 })
      .mockResolvedValueOnce({ ok: false, freeBytes: 50_000_000, requiredBytes: 200 * 1024 * 1024 });

    vi.mocked(spawnYtDlp).mockReturnValue(makeFakeProcess(1, 'ERROR: Postprocessing: Conversion failed!') as never);

    const { service, recentJobsStore } = makeService();
    await service.start({ url: YOUTUBE_URL, outputDir: '/tmp', job: DEFAULT_JOB });
    await vi.waitFor(() => expect(recentJobsStore.push).toHaveBeenCalledOnce(), { timeout: 5000 });

    const finalized = recentJobsStore.push.mock.calls[0]?.[0];
    expect(finalized?.status).toBe('failed');
    expect(finalized?.error?.key).toBe('outOfDiskSpace');
    expect(finalized?.error?.rawMessage).toContain('Conversion failed');
  });

  it('keeps key=null when "Conversion failed" surfaces but disk has plenty of free space', async () => {
    vi.mocked(checkDiskSpace)
      .mockResolvedValueOnce({ ok: true, freeBytes: 50_000_000_000, requiredBytes: 200 * 1024 * 1024 })
      .mockResolvedValueOnce({ ok: true, freeBytes: 50_000_000_000, requiredBytes: 200 * 1024 * 1024 });

    vi.mocked(spawnYtDlp).mockReturnValue(makeFakeProcess(1, 'ERROR: Postprocessing: Conversion failed!') as never);

    const { service, recentJobsStore } = makeService();
    await service.start({ url: YOUTUBE_URL, outputDir: '/tmp', job: DEFAULT_JOB });
    await vi.waitFor(() => expect(recentJobsStore.push).toHaveBeenCalledOnce(), { timeout: 5000 });

    const finalized = recentJobsStore.push.mock.calls[0]?.[0];
    expect(finalized?.error?.key).toBeNull();
  });

  it('does not run the post-failure disk probe for unrelated errors', async () => {
    vi.mocked(checkDiskSpace).mockResolvedValueOnce({ ok: true, freeBytes: 50_000_000_000, requiredBytes: 200 * 1024 * 1024 });

    const ipBlockStderr = 'ERROR: [youtube] All player responses are invalid. Your IP is likely being blocked by Youtube';
    vi.mocked(spawnYtDlp).mockReturnValue(makeFakeProcess(1, ipBlockStderr) as never);

    const { service, recentJobsStore } = makeService();
    await service.start({ url: YOUTUBE_URL, outputDir: '/tmp', job: DEFAULT_JOB });
    await vi.waitFor(() => expect(recentJobsStore.push).toHaveBeenCalledOnce(), { timeout: 5000 });

    // Only the preflight call — no post-failure probe.
    expect(vi.mocked(checkDiskSpace)).toHaveBeenCalledTimes(1);
    const finalized = recentJobsStore.push.mock.calls[0]?.[0];
    expect(finalized?.error?.key).toBe('ipBlock');
  });
});
