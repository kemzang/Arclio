import { describe, it, expect } from 'vitest';
import { Statistic } from '../src/statistic';
import { IClone, ITokensMap } from '../src/interfaces';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeLocation(line: number, position = line * 10) {
  return { line, column: 0, position };
}

function makeClone(format: string, startLine: number, endLine: number): IClone {
  return {
    format,
    duplicationA: {
      sourceId: 'fileA',
      start: makeLocation(startLine),
      end: makeLocation(endLine),
      range: [startLine * 10, endLine * 10],
    },
    duplicationB: {
      sourceId: 'fileB',
      start: makeLocation(startLine),
      end: makeLocation(endLine),
      range: [startLine * 10, endLine * 10],
    },
  };
}

function makeSource(id: string, format: string, lines = 20, tokens = 100): ITokensMap {
  return {
    getId: () => id,
    getFormat: () => format,
    getLinesCount: () => lines,
    getTokensCount: () => tokens,
    next: () => ({ done: true, value: false }),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Statistic', () => {
  it('subscribe() returns handlers for CLONE_FOUND and START_DETECTION', () => {
    const stat = new Statistic();
    const handlers = stat.subscribe();
    expect(typeof handlers.CLONE_FOUND).toBe('function');
    expect(typeof handlers.START_DETECTION).toBe('function');
  });

  it('getStatistic() returns the initial zero-state', () => {
    const stat = new Statistic();
    const s = stat.getStatistic();
    expect(s.total.clones).toBe(0);
    expect(s.total.lines).toBe(0);
    expect(s.total.sources).toBe(0);
    expect(s.total.duplicatedLines).toBe(0);
    expect(s.formats).toEqual({});
  });

  describe('START_DETECTION', () => {
    it('increments total sources and lines/tokens on first detection', () => {
      const stat = new Statistic();
      const handlers = stat.subscribe();
      handlers.START_DETECTION!({ source: makeSource('fileA', 'javascript', 50, 200) });

      const s = stat.getStatistic();
      expect(s.total.sources).toBe(1);
      expect(s.total.lines).toBe(50);
      expect(s.total.tokens).toBe(200);
    });

    it('creates a format entry on first detection for that format', () => {
      const stat = new Statistic();
      const handlers = stat.subscribe();
      handlers.START_DETECTION!({ source: makeSource('fileA', 'typescript', 10, 50) });

      const s = stat.getStatistic();
      expect(s.formats['typescript']).toBeDefined();
      expect(s.formats['typescript']!.total.lines).toBe(10);
    });

    it('accumulates across multiple sources in the same format', () => {
      const stat = new Statistic();
      const handlers = stat.subscribe();
      handlers.START_DETECTION!({ source: makeSource('fileA', 'javascript', 30, 100) });
      handlers.START_DETECTION!({ source: makeSource('fileB', 'javascript', 20, 80) });

      const s = stat.getStatistic();
      expect(s.total.sources).toBe(2);
      expect(s.total.lines).toBe(50);
      expect(s.total.tokens).toBe(180);
      expect(s.formats['javascript']!.total.sources).toBe(2);
    });

    it('tracks each source individually inside the format', () => {
      const stat = new Statistic();
      const handlers = stat.subscribe();
      handlers.START_DETECTION!({ source: makeSource('fileA', 'javascript', 30, 100) });

      const s = stat.getStatistic();
      expect(s.formats['javascript']!.sources['fileA']).toBeDefined();
      expect(s.formats['javascript']!.sources['fileA']!.lines).toBe(30);
    });
  });

  describe('CLONE_FOUND', () => {
    function bootstrap(format = 'javascript') {
      const stat = new Statistic();
      const handlers = stat.subscribe();
      // Register both sources so the format/source entries exist
      handlers.START_DETECTION!({ source: makeSource('fileA', format, 100, 500) });
      handlers.START_DETECTION!({ source: makeSource('fileB', format, 100, 500) });
      return { stat, handlers };
    }

    it('increments total clone count', () => {
      const { stat, handlers } = bootstrap();
      handlers.CLONE_FOUND!({ clone: makeClone('javascript', 1, 11) });
      expect(stat.getStatistic().total.clones).toBe(1);
    });

    it('accumulates duplicated lines on total', () => {
      const { stat, handlers } = bootstrap();
      handlers.CLONE_FOUND!({ clone: makeClone('javascript', 1, 11) }); // 10 lines
      expect(stat.getStatistic().total.duplicatedLines).toBe(10);
    });

    it('increments format-level clone count', () => {
      const { stat, handlers } = bootstrap();
      handlers.CLONE_FOUND!({ clone: makeClone('javascript', 1, 6) });
      expect(stat.getStatistic().formats['javascript']!.total.clones).toBe(1);
    });

    it('increments per-source clone count for both duplication sides', () => {
      const { stat, handlers } = bootstrap();
      handlers.CLONE_FOUND!({ clone: makeClone('javascript', 1, 6) });
      const fmt = stat.getStatistic().formats['javascript']!;
      expect(fmt.sources['fileA']!.clones).toBe(1);
      expect(fmt.sources['fileB']!.clones).toBe(1);
    });

    it('calculates non-zero percentage after clone found', () => {
      const { stat, handlers } = bootstrap();
      handlers.CLONE_FOUND!({ clone: makeClone('javascript', 1, 51) }); // 50 of 100 lines
      const s = stat.getStatistic();
      expect(s.total.percentage).toBeGreaterThan(0);
    });

    it('percentage is 0 when no lines have been detected', () => {
      const stat = new Statistic();
      expect(stat.getStatistic().total.percentage).toBe(0);
    });
  });
});
