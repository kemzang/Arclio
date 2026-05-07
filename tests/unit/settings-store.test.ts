import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { RecentJobsStore } from '@main/stores/RecentJobsStore';
import { SettingsStore } from '@main/stores/SettingsStore';

describe('settings and recent stores', () => {
  const baseDefaults = {
    common: { defaultOutputDir: '/tmp', rememberLastOutputDir: true, clipboardWatchEnabled: false },
    single: {},
    playlist: {}
  };

  it('persists settings updates', async () => {
    const userData = await fs.mkdtemp(path.join(os.tmpdir(), 'settings-store-'));
    const store = new SettingsStore(userData, baseDefaults);

    const updated = await store.update({ common: { defaultOutputDir: '/home/test/downloads' } });
    expect(updated.common.defaultOutputDir).toBe('/home/test/downloads');

    const readBack = await store.get();
    expect(readBack.common.defaultOutputDir).toBe('/home/test/downloads');
  });

  it('persists subtitle language preferences', async () => {
    const userData = await fs.mkdtemp(path.join(os.tmpdir(), 'settings-store-subs-'));
    const store = new SettingsStore(userData, baseDefaults);

    const updated = await store.update({ single: { lastSubtitleLanguages: ['en', 'es'] } });
    expect(updated.single.lastSubtitleLanguages).toEqual(['en', 'es']);

    const readBack = await store.get();
    expect(readBack.single.lastSubtitleLanguages).toEqual(['en', 'es']);
  });

  it('keeps recent jobs bounded and sorted', async () => {
    const userData = await fs.mkdtemp(path.join(os.tmpdir(), 'recent-jobs-'));
    const store = new RecentJobsStore(userData);

    await store.push({
      id: '1',
      url: 'https://youtu.be/a',
      outputDir: '/tmp',
      status: 'completed',
      finishedAt: '2024-01-01T00:00:00.000Z'
    });

    await store.push({
      id: '2',
      url: 'https://youtu.be/b',
      outputDir: '/tmp',
      status: 'failed',
      finishedAt: '2024-01-02T00:00:00.000Z',
      error: { key: null, rawMessage: 'boom' }
    });

    const list = await store.list();
    expect(list[0].id).toBe('2');
    expect(list[1].id).toBe('1');
  });

  it('handles concurrent push() calls — push is synchronous so both jobs land without interleaving', async () => {
    const userData = await fs.mkdtemp(path.join(os.tmpdir(), 'recent-jobs-concurrent-'));
    const store = new RecentJobsStore(userData);

    await Promise.all([
      store.push({
        id: 'job-a',
        url: 'https://youtu.be/a',
        outputDir: '/tmp',
        status: 'completed',
        finishedAt: '2024-01-01T00:00:00.000Z'
      }),
      store.push({
        id: 'job-b',
        url: 'https://youtu.be/b',
        outputDir: '/tmp',
        status: 'completed',
        finishedAt: '2024-01-02T00:00:00.000Z'
      })
    ]);

    const list = await store.list();
    expect(list).toHaveLength(2);
    expect(list.map((j) => j.id)).toContain('job-a');
    expect(list.map((j) => j.id)).toContain('job-b');
  });

  it('returns defaults when settings.json is corrupted', async () => {
    const userData = await fs.mkdtemp(path.join(os.tmpdir(), 'settings-store-corrupt-'));
    await fs.writeFile(path.join(userData, 'settings.json'), 'not valid json', 'utf-8');
    const store = new SettingsStore(userData, baseDefaults);

    const settings = await store.get();
    expect(settings.common.defaultOutputDir).toBe('/tmp');
  });

  it('migrates legacy flat shape to nested on first read', async () => {
    const userData = await fs.mkdtemp(path.join(os.tmpdir(), 'settings-store-migrate-'));
    // Pre-seed disk with the legacy flat shape (versions <= 0.0.x).
    await fs.writeFile(
      path.join(userData, 'settings.json'),
      JSON.stringify({
        defaultOutputDir: '/legacy/dir',
        rememberLastOutputDir: false,
        clipboardWatchEnabled: true,
        lastPreset: 'best-quality',
        lastSubfolder: 'old-subfolder',
        lastPlaylistPreset: 'video-1080p',
        lastPlaylistSubfolderEnabled: true,
        cookiesEnabled: true,
        cookiesPath: '/legacy/cookies.txt'
      }),
      'utf-8'
    );

    const store = new SettingsStore(userData, baseDefaults);
    const settings = await store.get();

    expect(settings.common.defaultOutputDir).toBe('/legacy/dir');
    // Legacy `cookiesEnabled: true` + non-empty path migrates to `cookiesMode: 'file'`.
    expect(settings.common.cookiesMode).toBe('file');
    expect((settings.common as unknown as { cookiesEnabled?: boolean }).cookiesEnabled).toBeUndefined();
    expect(settings.single.lastPreset).toBe('best-quality');
    expect(settings.single.lastSubfolder).toBe('old-subfolder');
    expect(settings.playlist.lastPlaylistPreset).toBe('video-1080p');
    expect(settings.playlist.lastPlaylistSubfolderEnabled).toBe(true);

    // After migration the file holds only the nested shape — flat keys gone.
    const persisted = JSON.parse(await fs.readFile(path.join(userData, 'settings.json'), 'utf-8'));
    expect(persisted).not.toHaveProperty('lastPreset');
    expect(persisted).not.toHaveProperty('defaultOutputDir');
    expect(persisted.common).toBeDefined();
    expect(persisted.single).toBeDefined();
    expect(persisted.playlist).toBeDefined();
  });

  it('merges binaryOverrides patches by key — partial patch leaves siblings intact', async () => {
    const userData = await fs.mkdtemp(path.join(os.tmpdir(), 'settings-binary-overrides-'));
    const store = new SettingsStore(userData, baseDefaults);

    await store.update({ common: { binaryOverrides: { ytDlp: '/usr/local/bin/yt-dlp', ffmpeg: '/usr/local/bin/ffmpeg' } } });
    let read = await store.get();
    expect(read.common.binaryOverrides).toEqual({ ytDlp: '/usr/local/bin/yt-dlp', ffmpeg: '/usr/local/bin/ffmpeg' });

    // Patching only ffprobe must not wipe ytDlp + ffmpeg.
    await store.update({ common: { binaryOverrides: { ffprobe: '/usr/local/bin/ffprobe' } } });
    read = await store.get();
    expect(read.common.binaryOverrides).toEqual({
      ytDlp: '/usr/local/bin/yt-dlp',
      ffmpeg: '/usr/local/bin/ffmpeg',
      ffprobe: '/usr/local/bin/ffprobe'
    });

    // Setting one to undefined clears it but leaves others intact.
    await store.update({ common: { binaryOverrides: { ytDlp: undefined } } });
    read = await store.get();
    expect(read.common.binaryOverrides?.ytDlp).toBeUndefined();
    expect(read.common.binaryOverrides?.ffmpeg).toBe('/usr/local/bin/ffmpeg');
    expect(read.common.binaryOverrides?.ffprobe).toBe('/usr/local/bin/ffprobe');
  });

  it('returns empty list when recent-jobs.json is corrupted', async () => {
    const userData = await fs.mkdtemp(path.join(os.tmpdir(), 'recent-jobs-corrupt-'));
    await fs.writeFile(path.join(userData, 'recent-jobs.json'), 'not valid json', 'utf-8');
    const store = new RecentJobsStore(userData);

    expect(await store.list()).toEqual([]);
  });
});
