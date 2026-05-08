import { describe, expect, it } from 'vitest';
import { mapFlatEntries } from '@main/services/PlaylistProbeService.js';

describe('mapFlatEntries', () => {
  it('parses well-formed flat-playlist entries', () => {
    const rows = [
      { id: 'aaa', title: 'A', thumbnail: 'https://t/a.jpg', duration: 120, playlist_index: 1 },
      { id: 'bbb', title: 'B', thumbnail: null, duration: null, playlist_index: 2 }
    ];
    const out = mapFlatEntries(rows);
    expect(out).toEqual([
      { id: 'aaa', url: 'https://www.youtube.com/watch?v=aaa', title: 'A', thumbnail: 'https://t/a.jpg', duration: 120, playlistIndex: 1 },
      { id: 'bbb', url: 'https://www.youtube.com/watch?v=bbb', title: 'B', thumbnail: '', duration: undefined, playlistIndex: 2 }
    ]);
  });

  it('falls back to array index when playlist_index missing', () => {
    const rows = [
      { id: 'x', title: 'X' },
      { id: 'y', title: 'Y' }
    ];
    const out = mapFlatEntries(rows);
    expect(out[0].playlistIndex).toBe(1);
    expect(out[1].playlistIndex).toBe(2);
  });

  it('prefers webpage_url when present over reconstruction', () => {
    const rows = [{ id: 'x', title: 'X', webpage_url: 'https://youtu.be/x?si=track' }];
    const out = mapFlatEntries(rows);
    expect(out[0].url).toBe('https://youtu.be/x?si=track');
  });

  it('skips rows missing required id', () => {
    const rows = [{ title: 'no id' }, { id: 'ok', title: 'OK' }];
    const out = mapFlatEntries(rows);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('ok');
  });

  it('rounds fractional duration', () => {
    const rows = [{ id: 'x', title: 'X', duration: 213.7 }];
    expect(mapFlatEntries(rows)[0].duration).toBe(214);
  });
});
