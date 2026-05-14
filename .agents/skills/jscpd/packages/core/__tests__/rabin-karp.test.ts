import { describe, it, expect } from 'vitest';
import EventEmitter from 'eventemitter3';
import { RabinKarp } from '../src/rabin-karp';
import { MemoryStore } from '../src/store/memory';
import { IMapFrame, IToken, ITokensMap } from '../src/interfaces';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeToken(line: number, column = 0, position = line * 10): IToken {
  return {
    type: 'keyword',
    value: `tok${line}`,
    format: 'javascript',
    length: 5,
    range: [position, position + 5],
    loc: {
      start: { line, column, position },
      end: { line, column: column + 5, position: position + 5 },
    },
  };
}

function makeFrame(id: string, sourceId: string, line: number): IMapFrame {
  const token = makeToken(line);
  return { id, sourceId, start: token, end: token };
}

/**
 * Build a fake ITokensMap that yields `frames` one by one, then returns
 * { done: true, value: false }.
 */
function makeTokensMap(sourceId: string, frames: IMapFrame[]): ITokensMap {
  let pos = 0;
  return {
    getFormat: () => 'javascript',
    getLinesCount: () => frames.length,
    getTokensCount: () => frames.length,
    getId: () => sourceId,
    next(): IteratorResult<IMapFrame | boolean> {
      if (pos < frames.length) {
        return { done: false, value: frames[pos++] as IMapFrame };
      }
      return { done: true, value: false };
    },
  };
}

/**
 * A store where get(undefined) resolves (simulating a degenerate hash
 * collision that would have hidden the bug before the fix).
 */
class StoreWithUndefinedKey extends MemoryStore<IMapFrame> {
  get(key: string): Promise<IMapFrame> {
    if (key === undefined) {
      // Simulate a stored entry under the "undefined" key — this is the
      // edge case that exposed the missing flush in the else branch.
      return Promise.resolve(makeFrame('undefined', 'ghost', 0));
    }
    return super.get(key);
  }
}

function makeRabinKarp() {
  return new RabinKarp({} as any, new EventEmitter(), []);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RabinKarp', () => {
  describe('normal path — store miss on sentinel', () => {
    it('detects a clone when the second file is entirely a copy of the first', async () => {
      const rk = makeRabinKarp();
      const store = new MemoryStore<IMapFrame>();
      store.namespace('javascript');

      // Seed the store with frames from "file A"
      const frameIds = ['aaa', 'bbb', 'ccc'];
      for (let i = 0; i < frameIds.length; i++) {
        await store.set(frameIds[i]!, makeFrame(frameIds[i]!, 'fileA', i + 1));
      }

      // "file B" has the exact same frame ids — entire file is a copy
      const framesB = frameIds.map((id, i) => makeFrame(id, 'fileB', i + 1));
      const tokenMap = makeTokensMap('fileB', framesB);

      const clones = await rk.run(tokenMap, store);

      expect(clones.length).toBe(1);
      expect(clones[0]!.duplicationA.sourceId).toBe('fileB');
      expect(clones[0]!.duplicationB.sourceId).toBe('fileA');
    });

    it('detects multiple non-overlapping clones in a single pass', async () => {
      const rk = makeRabinKarp();
      const store = new MemoryStore<IMapFrame>();
      store.namespace('javascript');

      // Seed frames: aaa, bbb, ccc from file A; xxx is unique to file B
      await store.set('aaa', makeFrame('aaa', 'fileA', 1));
      await store.set('bbb', makeFrame('bbb', 'fileA', 2));
      await store.set('ccc', makeFrame('ccc', 'fileA', 3));

      // file B: [aaa, bbb] then a break [xxx] then [ccc]
      const framesB = [
        makeFrame('aaa', 'fileB', 1),
        makeFrame('bbb', 'fileB', 2),
        makeFrame('xxx', 'fileB', 3), // miss — flushes first clone
        makeFrame('ccc', 'fileB', 4), // hit — starts second clone
      ];
      const tokenMap = makeTokensMap('fileB', framesB);

      const clones = await rk.run(tokenMap, store);

      expect(clones.length).toBe(2);
    });

    it('returns no clones when there is no overlap with the store', async () => {
      const rk = makeRabinKarp();
      const store = new MemoryStore<IMapFrame>();
      store.namespace('javascript');

      await store.set('aaa', makeFrame('aaa', 'fileA', 1));

      const framesB = [makeFrame('zzz', 'fileB', 1)];
      const tokenMap = makeTokensMap('fileB', framesB);

      const clones = await rk.run(tokenMap, store);

      expect(clones.length).toBe(0);
    });
  });

  describe('edge case — store.get(undefined) resolves (regression for issue #728 fix)', () => {
    it('still flushes a pending clone when the sentinel lookup hits the store', async () => {
      const rk = makeRabinKarp();
      const store = new StoreWithUndefinedKey();
      store.namespace('javascript');

      // Seed two matching frames so a clone starts growing
      await store.set('aaa', makeFrame('aaa', 'fileA', 1));
      await store.set('bbb', makeFrame('bbb', 'fileA', 2));

      // file B: two hits → clone grows; then done=true sentinel arrives
      const framesB = [
        makeFrame('aaa', 'fileB', 1),
        makeFrame('bbb', 'fileB', 2),
      ];
      const tokenMap = makeTokensMap('fileB', framesB);

      const clones = await rk.run(tokenMap, store);

      // Before the fix this returned 0 clones — the open clone was silently dropped.
      expect(clones.length).toBe(1);
    });
  });
});
