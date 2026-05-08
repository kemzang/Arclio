import { describe, expect, it } from 'vitest';
import { isYouTubeUrl, startDownloadSchema, ytDlpInfoSchema, queueArraySchema, audioConvertSchema, MAX_SUBTITLE_LANGUAGES } from '@shared/schemas.js';

describe('isYouTubeUrl', () => {
  it.each(['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://youtu.be/dQw4w9WgXcQ', 'https://m.youtube.com/watch?v=abc', 'https://music.youtube.com/watch?v=abc'])('accepts %s', (url) => {
    expect(isYouTubeUrl(url)).toBe(true);
  });

  it.each(['https://example.com/watch?v=dQw4w9WgXcQ', 'https://youtube.evil.com/watch?v=abc', 'not a url', ''])('rejects %s', (url) => {
    expect(isYouTubeUrl(url)).toBe(false);
  });
});

describe('startDownloadSchema — subtitle-only job', () => {
  const BASE_EMBED = { chapters: false, metadata: false, thumbnail: false, description: false, thumbnailSidecar: false };

  it('accepts subtitle-only job with languages', () => {
    const result = startDownloadSchema.safeParse({
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      job: { kind: 'subtitle-only', source: 'youtube', subtitles: { languages: ['en', 'en-US', 'pt-BR', 'en-orig'], mode: 'sidecar', format: 'srt', writeAuto: false } }
    });
    expect(result.success).toBe(true);
  });

  it('accepts single-format job', () => {
    const result = startDownloadSchema.safeParse({
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      job: { kind: 'single-format', source: 'youtube', formatId: '137+251', preset: 'custom', sponsorBlock: { mode: 'off' }, embed: BASE_EMBED }
    });
    expect(result.success).toBe(true);
  });

  it(`MAX_SUBTITLE_LANGUAGES (${MAX_SUBTITLE_LANGUAGES}) is exported and positive`, () => {
    expect(MAX_SUBTITLE_LANGUAGES).toBeGreaterThan(0);
  });
});

describe('ytDlpInfoSchema — null normalization', () => {
  it('treats null filesize/fps/duration as undefined (not validation errors)', () => {
    const raw = {
      title: 'x',
      thumbnail: null,
      duration: null,
      formats: [{ format_id: '22', filesize: null, fps: null, abr: null, ext: 'mp4' }],
      subtitles: null,
      automatic_captions: null
    };
    const result = ytDlpInfoSchema.safeParse(raw);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.duration).toBeUndefined();
      expect(result.data.thumbnail).toBeUndefined();
      expect(result.data.formats?.[0].filesize).toBeUndefined();
      expect(result.data.formats?.[0].fps).toBeUndefined();
      expect(result.data.subtitles).toBeUndefined();
    }
  });

  it('passes through unknown fields without rejecting', () => {
    const raw = {
      title: 'x',
      _unknown_field_yt_dlp_added_in_2030: 'whatever',
      formats: [{ format_id: '22', _new_codec_field: 'av2' }]
    };
    expect(ytDlpInfoSchema.safeParse(raw).success).toBe(true);
  });

  it('accepts a fully-populated info object', () => {
    const raw = {
      title: 'x',
      thumbnail: 't.jpg',
      duration: 120,
      formats: [
        {
          format_id: '22',
          filesize: 1024,
          fps: 30,
          ext: 'mp4',
          resolution: '720p',
          vcodec: 'avc1',
          acodec: 'mp4a'
        }
      ],
      subtitles: { en: [{ ext: 'vtt', name: 'English' }] },
      automatic_captions: { 'en-orig': [{ ext: 'vtt' }] }
    };
    const result = ytDlpInfoSchema.safeParse(raw);
    expect(result.success).toBe(true);
  });
});

describe('audioConvertSchema', () => {
  it.each([
    { target: 'mp3' as const, bitrateKbps: 128 as const },
    { target: 'mp3' as const, bitrateKbps: 192 as const },
    { target: 'mp3' as const, bitrateKbps: 256 as const },
    { target: 'mp3' as const, bitrateKbps: 320 as const },
    { target: 'm4a' as const, bitrateKbps: 192 as const },
    { target: 'opus' as const, bitrateKbps: 128 as const },
    { target: 'wav' as const },
    { target: 'wav' as const, bitrateKbps: 192 as const } // excess key permitted (non-strict object)
  ])('accepts %j', (value) => {
    expect(audioConvertSchema.safeParse(value).success).toBe(true);
  });

  it.each([
    { target: 'flac' }, // unknown target
    { target: 'mp3' }, // missing bitrate for lossy
    { target: 'mp3', bitrateKbps: 96 }, // unsupported bitrate
    { target: 'mp3', bitrateKbps: 256000 }, // bps not kbps
    {} // missing target
  ])('rejects %j', (value) => {
    expect(audioConvertSchema.safeParse(value).success).toBe(false);
  });

  it('threads audioConvert through startDownloadSchema via job', () => {
    const parsed = startDownloadSchema.safeParse({
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      job: { kind: 'audio-convert', source: 'youtube', audioConvert: { target: 'mp3', bitrateKbps: 192 }, preset: 'audio-only', sponsorBlock: { mode: 'off' }, embed: { chapters: false, metadata: false, thumbnail: false, description: false, thumbnailSidecar: false } }
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.job.kind).toBe('audio-convert');
      if (parsed.data.job.kind === 'audio-convert') {
        expect(parsed.data.job.audioConvert).toEqual({ target: 'mp3', bitrateKbps: 192 });
      }
    }
  });
});

describe('queueArraySchema', () => {
  const EMBED_OFF = { chapters: false, metadata: false, thumbnail: false, description: false, thumbnailSidecar: false };
  const valid = {
    id: 'a',
    url: 'u',
    title: 't',
    thumbnail: '',
    outputDir: '/tmp',
    formatLabel: 'Best',
    status: 'done',
    progressPercent: 100,
    progressDetail: null,
    lastStatus: null,
    error: null,
    finishedAt: null,
    downloadJobId: null,
    job: { kind: 'single-format', source: 'youtube', formatId: '137+251', preset: 'custom', sponsorBlock: { mode: 'off' }, embed: EMBED_OFF }
  };

  it('accepts an empty array', () => {
    expect(queueArraySchema.safeParse([]).success).toBe(true);
  });

  it('accepts a valid queue item', () => {
    expect(queueArraySchema.safeParse([valid]).success).toBe(true);
  });

  it('rejects a queue item with an unknown status', () => {
    expect(queueArraySchema.safeParse([{ ...valid, status: 'wat' }]).success).toBe(false);
  });

  it('rejects a queue item with an unknown job kind', () => {
    expect(queueArraySchema.safeParse([{ ...valid, job: { kind: 'magic-format' } }]).success).toBe(false);
  });

  it('rejects when error.key is not a known YtdlpErrorKey', () => {
    expect(
      queueArraySchema.safeParse([
        {
          ...valid,
          status: 'error',
          error: { key: 'totallyMadeUp', rawMessage: 'oops' }
        }
      ]).success
    ).toBe(false);
  });
});
