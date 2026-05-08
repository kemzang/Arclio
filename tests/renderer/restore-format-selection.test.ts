// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { restoreFormatSelection } from '@renderer/store/wizardSlice.js';
import type { AppSettings, FormatOption, SinglePrefs } from '@shared/types.js';

const FORMATS: FormatOption[] = [
  { formatId: '137', label: '1080p mp4', ext: 'mp4', resolution: '1080p', fps: 30, filesize: 800_000_000, isVideoOnly: true, isAudioOnly: false },
  { formatId: '22', label: '720p mp4', ext: 'mp4', resolution: '720p', fps: 30, filesize: 400_000_000, isVideoOnly: false, isAudioOnly: false },
  { formatId: '140', label: 'm4a 128kbps', ext: 'm4a', resolution: 'audio only', abr: 128, isVideoOnly: false, isAudioOnly: true },
  { formatId: '251', label: 'opus 160kbps', ext: 'opus', resolution: 'audio only', abr: 160, isVideoOnly: false, isAudioOnly: true }
];

function settingsWith(single: SinglePrefs): AppSettings {
  return {
    common: {
      defaultOutputDir: '/tmp',
      rememberLastOutputDir: false,
      uiZoom: 1,
      uiTheme: 'system',
      language: 'en',
      commonPaths: { downloads: null, music: null, videos: null, desktop: null, documents: null, pictures: null, home: null },
      clipboardWatchEnabled: false
    },
    single,
    playlist: {}
  };
}

describe('restoreFormatSelection — audio persistence', () => {
  it('with no prefs, falls back to best-quality preset (m4a wins as bestAudio)', () => {
    const result = restoreFormatSelection(FORMATS, null);
    expect(result.preset).toBe('best-quality');
    expect(result.audioSelection).toEqual({ kind: 'native', formatId: '140' });
    expect(result.videoFormatId).toBe('137');
  });

  it('restores persisted convert-lossy(mp3, 192) verbatim', () => {
    const result = restoreFormatSelection(FORMATS, settingsWith({ lastVideoResolution: 'audio-only', lastAudioSelection: { kind: 'convert-lossy', target: 'mp3', bitrateKbps: 192 } }));
    expect(result.audioSelection).toEqual({ kind: 'convert-lossy', target: 'mp3', bitrateKbps: 192 });
    expect(result.videoFormatId).toBe('');
  });

  it('restores persisted convert-lossless(wav)', () => {
    const result = restoreFormatSelection(FORMATS, settingsWith({ lastPreset: 'audio-only', lastAudioSelection: { kind: 'convert-lossless', target: 'wav' } }));
    expect(result.audioSelection).toEqual({ kind: 'convert-lossless', target: 'wav' });
  });

  it('restores native audio when persisted formatId is present in current formats', () => {
    const result = restoreFormatSelection(FORMATS, settingsWith({ lastVideoResolution: '1080p', lastAudioSelection: { kind: 'native', formatId: '251' } }));
    expect(result.audioSelection).toEqual({ kind: 'native', formatId: '251' });
    expect(result.videoFormatId).toBe('137');
  });

  it('falls back to bestAudio when persisted native formatId is missing', () => {
    const result = restoreFormatSelection(FORMATS, settingsWith({ lastVideoResolution: '1080p', lastAudioSelection: { kind: 'native', formatId: '999' } }));
    expect(result.audioSelection).toEqual({ kind: 'native', formatId: '140' });
  });

  it("persisted convert audio overrides preset's default native audio", () => {
    const result = restoreFormatSelection(FORMATS, settingsWith({ lastPreset: 'audio-only', lastAudioSelection: { kind: 'convert-lossy', target: 'mp3', bitrateKbps: 256 } }));
    expect(result.preset).toBe('audio-only');
    expect(result.videoFormatId).toBe('');
    expect(result.audioSelection).toEqual({ kind: 'convert-lossy', target: 'mp3', bitrateKbps: 256 });
  });

  it("persisted 'none' restores as 'none' even with a video preset", () => {
    const result = restoreFormatSelection(FORMATS, settingsWith({ lastPreset: 'best-quality', lastAudioSelection: { kind: 'none' } }));
    expect(result.audioSelection).toEqual({ kind: 'none' });
    expect(result.videoFormatId).toBe('137');
  });
});
