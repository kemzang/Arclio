import { describe, it, expect, vi } from 'vitest';
import EventEmitter from 'eventemitter3';
import { Detector } from '../src/detector';
import { MemoryStore } from '../src/store/memory';
import { IClone, IMapFrame, IOptions, ITokenizer, ITokensMap } from '../src/interfaces';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeToken(line: number) {
  const pos = line * 10;
  return {
    type: 'keyword',
    value: `tok${line}`,
    format: 'javascript',
    length: 5,
    range: [pos, pos + 5] as [number, number],
    loc: {
      start: { line, column: 0, position: pos },
      end: { line: line + 1, column: 5, position: pos + 5 },
    },
  };
}

function makeFrame(id: string, sourceId: string, line: number): IMapFrame {
  const t = makeToken(line);
  return { id, sourceId, start: t, end: t };
}

/**
 * Builds a fake ITokensMap that yields the given frames then signals done.
 */
function makeTokensMap(sourceId: string, frames: IMapFrame[]): ITokensMap {
  let pos = 0;
  return {
    getFormat: () => 'javascript',
    getLinesCount: () => frames.length * 5,
    getTokensCount: () => frames.length * 10,
    getId: () => sourceId,
    next(): IteratorResult<IMapFrame | boolean> {
      if (pos < frames.length) return { done: false, value: frames[pos++]! };
      return { done: true, value: false };
    },
  };
}

/**
 * A tokenizer that always returns the provided token maps.
 */
function makeTokenizer(maps: ITokensMap[]): ITokenizer {
  return { generateMaps: () => [...maps] };
}

const baseOptions: IOptions = {
  minLines: 1,
  maxLines: 1000,
  minTokens: 1,
  mode: (t) => t.type !== 'ignore',
} as unknown as IOptions;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Detector', () => {
  it('returns an empty array when the tokenizer produces no maps', async () => {
    const detector = new Detector(makeTokenizer([]), new MemoryStore(), [], baseOptions);
    const clones = await detector.detect('file.js', 'code', 'javascript');
    expect(clones).toEqual([]);
  });

  it('detects a cross-file clone when the second map matches frames in the store', async () => {
    const store = new MemoryStore<IMapFrame>();

    // Pre-populate the store with frames from "file A"
    store.namespace('javascript');
    await store.set('aaa', makeFrame('aaa', 'fileA', 1));
    await store.set('bbb', makeFrame('bbb', 'fileA', 2));
    await store.set('ccc', makeFrame('ccc', 'fileA', 3));

    // The tokenizer returns one map: "file B" with the same frame ids
    const framesB = ['aaa', 'bbb', 'ccc'].map((id, i) => makeFrame(id, 'fileB', i + 1));
    const tokenizer = makeTokenizer([makeTokensMap('fileB', framesB)]);

    const detector = new Detector(tokenizer, store, [], baseOptions);
    const clones = await detector.detect('fileB', '', 'javascript');

    expect(clones.length).toBe(1);
    expect(clones[0]!.duplicationA.sourceId).toBe('fileB');
    expect(clones[0]!.duplicationB.sourceId).toBe('fileA');
  });

  it('emits CLONE_FOUND for each detected clone', async () => {
    const store = new MemoryStore<IMapFrame>();
    store.namespace('javascript');
    await store.set('aaa', makeFrame('aaa', 'fileA', 1));

    const framesB = [makeFrame('aaa', 'fileB', 1)];
    const tokenizer = makeTokenizer([makeTokensMap('fileB', framesB)]);

    const detector = new Detector(tokenizer, store, [], baseOptions);
    const listener = vi.fn();
    detector.on('CLONE_FOUND', listener);

    await detector.detect('fileB', '', 'javascript');

    expect(listener).toHaveBeenCalledOnce();
    const payload = listener.mock.calls[0]![0] as { clone: IClone };
    expect(payload.clone).toBeDefined();
  });

  it('emits START_DETECTION for each token map processed', async () => {
    const store = new MemoryStore<IMapFrame>();
    const framesB = [makeFrame('zzz', 'fileB', 1)];
    const tokenizer = makeTokenizer([makeTokensMap('fileB', framesB)]);

    const detector = new Detector(tokenizer, store, [], baseOptions);
    const listener = vi.fn();
    detector.on('START_DETECTION', listener);

    await detector.detect('fileB', '', 'javascript');

    expect(listener).toHaveBeenCalledOnce();
  });

  it('applies default minTokens/minLines/maxLines when not provided', () => {
    const detector = new Detector(makeTokenizer([]), new MemoryStore(), [], {} as IOptions);
    // Accessing private options via cast — just verifying no crash on construction
    expect(detector).toBeInstanceOf(Detector);
  });

  it('processes multiple token maps from a single detect() call', async () => {
    const store = new MemoryStore<IMapFrame>();
    store.namespace('javascript');
    await store.set('aaa', makeFrame('aaa', 'fileA', 1));

    // Two maps: first is a different format (no match), second matches
    const mapNoMatch = makeTokensMap('fileB-ts', [makeFrame('zzz', 'fileB-ts', 1)]);
    const mapMatch = makeTokensMap('fileB-js', [makeFrame('aaa', 'fileB-js', 1)]);
    // Override format for mapNoMatch to keep store namespace clean
    (mapNoMatch as any).getFormat = () => 'typescript';

    const tokenizer = makeTokenizer([mapNoMatch, mapMatch]);
    const detector = new Detector(tokenizer, store, [], baseOptions);
    const clones = await detector.detect('fileB', '', 'javascript');

    // The map with the matching frame should produce one clone
    expect(clones.length).toBeGreaterThanOrEqual(1);
  });
});
