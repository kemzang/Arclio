import { describe, expect, it } from 'vitest';
import { playlistPresetSpec } from '@shared/playlistPresets.js';
import { PLAYLIST_PRESETS } from '@shared/schemas.js';

describe('playlistPresetSpec', () => {
  it('every preset returns a spec', () => {
    for (const p of PLAYLIST_PRESETS) {
      const spec = playlistPresetSpec(p);
      expect(spec).toBeDefined();
    }
  });

  it('video tiers cap height correctly', () => {
    expect(playlistPresetSpec('video-1080p').formatSelector).toContain('height<=1080');
    expect(playlistPresetSpec('video-720p').formatSelector).toContain('height<=720');
    expect(playlistPresetSpec('video-480p').formatSelector).toContain('height<=480');
    expect(playlistPresetSpec('video-360p').formatSelector).toContain('height<=360');
  });

  it('video-best has uncapped selector', () => {
    const spec = playlistPresetSpec('video-best');
    expect(spec.formatSelector).toBe('bestvideo*+bestaudio/best');
    expect(spec.producesVideo).toBe(true);
  });

  it('audio-best uses bestaudio with no convert', () => {
    const spec = playlistPresetSpec('audio-best');
    expect(spec.formatSelector).toBe('bestaudio/best');
    expect(spec.audioConvert).toBeUndefined();
    expect(spec.producesVideo).toBe(false);
  });

  it('audio-mp3 uses audioConvert mp3 192K and no formatSelector', () => {
    const spec = playlistPresetSpec('audio-mp3');
    expect(spec.audioConvert).toEqual({ target: 'mp3', bitrateKbps: 192 });
    expect(spec.formatSelector).toBeUndefined();
  });
});
