import { describe, expect, it } from 'vitest';

import { buildScenarioAppApiState, getScenario, readScenarioIdFromUrl } from '@renderer/dev/browserMockScenarios.js';

describe('browser mock scenarios', () => {
  it('reads known scenario ids from URLs', () => {
    expect(readScenarioIdFromUrl(new URL('http://localhost:5173/?scenario=playlist-at-limit'))).toBe('playlist-at-limit');
    expect(readScenarioIdFromUrl(new URL('http://localhost:5173/?scenario=nope'))).toBeNull();
    expect(readScenarioIdFromUrl(new URL('http://localhost:5173/'))).toBeNull();
  });

  it('falls back to the default scenario for unknown ids', () => {
    expect(getScenario('playlist-under-limit').id).toBe('playlist-under-limit');
    expect(getScenario('not-real').id).toBe('default');
  });

  it('builds playlist fixtures at the capped boundary', () => {
    const under = buildScenarioAppApiState(getScenario('playlist-under-limit'));
    const capped = buildScenarioAppApiState(getScenario('playlist-at-limit'));
    const over = buildScenarioAppApiState(getScenario('playlist-over-limit'));

    expect(under.probeResult?.kind).toBe('playlist');
    expect(capped.probeResult?.kind).toBe('playlist');
    expect(over.probeResult?.kind).toBe('playlist');
    if (under.probeResult?.kind !== 'playlist' || capped.probeResult?.kind !== 'playlist' || over.probeResult?.kind !== 'playlist') {
      throw new Error('expected playlist probe fixtures');
    }

    expect(under.settings.common.playlistProbeLimit).toBe(100);
    expect(capped.settings.common.playlistProbeLimit).toBe(100);
    expect(over.settings.common.playlistProbeLimit).toBe(100);
    expect(under.probeResult.entries).toHaveLength(99);
    expect(capped.probeResult.entries).toHaveLength(100);
    expect(over.probeResult.entries).toHaveLength(101);
  });

  it('builds no-thumbnail playlist fixtures', () => {
    const state = buildScenarioAppApiState(getScenario('playlist-no-thumbnails'));
    if (state.probeResult?.kind !== 'playlist') throw new Error('expected playlist probe fixture');

    expect(state.probeResult.entries).toHaveLength(100);
    expect(state.probeResult.entries.every((entry) => entry.thumbnail === '')).toBe(true);
  });

  it('builds update and diagnostics fixtures', () => {
    expect(buildScenarioAppApiState(getScenario('update-homebrew')).update?.installChannel).toBe('homebrew');

    const diagnostics = buildScenarioAppApiState(getScenario('diagnostics-ytdlp-missing')).warmUp;
    expect(diagnostics.completed).toBe(false);
    expect(diagnostics.blockingFailures).toEqual(['yt-dlp']);
    expect(diagnostics.dependencies['yt-dlp'].state).toBe('failed');
  });
});
