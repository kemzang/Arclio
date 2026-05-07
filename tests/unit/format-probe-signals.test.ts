import { describe, expect, it } from 'vitest';
import { detectProbeDegradationSignals } from '@main/services/FormatProbeService';

describe('detectProbeDegradationSignals', () => {
  it('returns empty for clean stderr', () => {
    expect(detectProbeDegradationSignals('')).toEqual([]);
    expect(detectProbeDegradationSignals('[youtube] Downloading webpage\n[info] Done')).toEqual([]);
  });

  it('detects Sign-in challenge as bot category', () => {
    const stderr = "ERROR: [youtube] uz5hyXn9ICQ: Sign in to confirm you're not a bot. Use --cookies-from-browser …";
    const signals = detectProbeDegradationSignals(stderr);
    expect(signals).toContainEqual({ label: 'Sign in to confirm', category: 'bot' });
  });

  it('detects HTTP 429 as bot category', () => {
    const stderr = 'WARNING: [youtube] Unable to download webpage: HTTP Error 429: Too Many Requests';
    const signals = detectProbeDegradationSignals(stderr);
    expect(signals).toContainEqual({ label: 'HTTP 429', category: 'bot' });
    // The same line also matches the extractor pattern — both are reported.
    expect(signals).toContainEqual({ label: 'Unable to download webpage', category: 'extractor' });
  });

  it('detects both bot signals together', () => {
    const stderr = ['WARNING: [youtube] Unable to download webpage: HTTP Error 429: Too Many Requests', "ERROR: [youtube] x: Sign in to confirm you're not a bot."].join('\n');
    const signals = detectProbeDegradationSignals(stderr);
    const bot = signals.filter((s) => s.category === 'bot').map((s) => s.label);
    expect(bot).toContain('Sign in to confirm');
    expect(bot).toContain('HTTP 429');
  });

  it('does not flag 403 or visitor-data warnings as bot', () => {
    const stderr = 'WARNING: [youtube] HTTP Error 403: Forbidden\nWARNING: Missing required Visitor Data';
    const signals = detectProbeDegradationSignals(stderr);
    expect(signals.find((s) => s.category === 'bot')).toBeUndefined();
  });

  it('classifies extractor-only signals as extractor', () => {
    const stderr = 'WARNING: n challenge solving failed';
    const signals = detectProbeDegradationSignals(stderr);
    expect(signals).toEqual([{ label: 'n challenge solving failed', category: 'extractor' }]);
  });
});
