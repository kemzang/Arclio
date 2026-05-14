import {expect, describe, it, vi} from 'vitest'
import * as path from 'path';
import {Tokenizer} from "@jscpd/tokenizer";
import {MemoryStore, Statistic, getDefaultOptions} from "@jscpd/core";
import {InFilesDetector} from "../src";
import {getFilesToDetect} from '../src/files';

describe('jscpd finder: in-files-detector', () => {
  it('should not detect for empty files list', async () => {
    const detector = new InFilesDetector(new Tokenizer(), new MemoryStore(), new Statistic(), {});
    const detected = await detector.detect([]);
    expect(detected).to.deep.equal([]);
  });
})

const fixtures = path.join(__dirname, '../../../fixtures');

function makeDetector() {
  const options: any = {
    ...getDefaultOptions(),
    path: [fixtures + '/clike/file2.c'],
    format: ['c'],
    minLines: 5,
    minTokens: 50,
  };
  const store = new MemoryStore();
  const statistic = new Statistic();
  const tokenizer = new Tokenizer();
  const detector = new InFilesDetector(tokenizer, store, statistic, options);
  const files = getFilesToDetect(options);
  return { detector, files };
}

describe('InFilesDetector integration', () => {
  it('should return at least 1 clone from clike file2.c', async () => {
    const { detector, files } = makeDetector();
    const clones = await detector.detect(files);
    expect(clones.length).toBeGreaterThanOrEqual(1);
  });

  it('registered reporter report() is called after detection', async () => {
    const { detector, files } = makeDetector();
    const reporter = { report: vi.fn() };
    detector.registerReporter(reporter);
    await detector.detect(files);
    expect(reporter.report).toHaveBeenCalled();
  });

  it('registered hook process() is called after detection', async () => {
    const { detector, files } = makeDetector();
    const hook = { process: vi.fn().mockImplementation((clones: any) => Promise.resolve(clones)) };
    detector.registerHook(hook);
    await detector.detect(files);
    expect(hook.process).toHaveBeenCalled();
  });
});
