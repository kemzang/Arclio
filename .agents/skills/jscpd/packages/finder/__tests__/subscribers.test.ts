import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ProgressSubscriber } from '../src/subscribers/progress';
import { VerboseSubscriber } from '../src/subscribers/verbose';
import { buildClone } from './helpers/clone-builder';

describe('jscpd finder: subscribers', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ProgressSubscriber', () => {
    it('subscribe returns object with CLONE_FOUND key', () => {
      const sub = new ProgressSubscriber({ absolute: true } as any);
      const handlers = sub.subscribe();
      expect(handlers).to.have.property('CLONE_FOUND');
    });

    it('CLONE_FOUND handler triggers console.log', () => {
      const sub = new ProgressSubscriber({ absolute: true } as any);
      const handlers = sub.subscribe();
      handlers.CLONE_FOUND!({ clone: buildClone() } as any);
      expect(logSpy).toHaveBeenCalled();
    });
  });

  describe('VerboseSubscriber', () => {
    it('subscribe returns object with CLONE_FOUND, CLONE_SKIPPED, START_DETECTION keys', () => {
      const sub = new VerboseSubscriber({ absolute: true } as any);
      const handlers = sub.subscribe();
      expect(handlers).to.have.property('CLONE_FOUND');
      expect(handlers).to.have.property('CLONE_SKIPPED');
      expect(handlers).to.have.property('START_DETECTION');
    });

    it('CLONE_FOUND handler logs CLONE_FOUND', () => {
      const sub = new VerboseSubscriber({ absolute: true } as any);
      const handlers = sub.subscribe();
      handlers.CLONE_FOUND!({ clone: buildClone() } as any);
      const logged = logSpy.mock.calls.flat().join(' ');
      expect(logged).to.include('CLONE_FOUND');
    });

    it('CLONE_SKIPPED handler logs CLONE_SKIPPED', () => {
      const sub = new VerboseSubscriber({ absolute: true } as any);
      const handlers = sub.subscribe();
      handlers.CLONE_SKIPPED!({ validation: { message: ['skipped reason'] } } as any);
      const logged = logSpy.mock.calls.flat().join(' ');
      expect(logged).to.include('CLONE_SKIPPED');
    });

    it('START_DETECTION handler logs START_DETECTION', () => {
      const sub = new VerboseSubscriber({ absolute: true } as any);
      const handlers = sub.subscribe();
      handlers.START_DETECTION!({ source: { getId: () => 'src1', getFormat: () => 'js' } } as any);
      const logged = logSpy.mock.calls.flat().join(' ');
      expect(logged).to.include('START_DETECTION');
    });
  });
});
