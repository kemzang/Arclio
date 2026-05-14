import { describe, it, expect } from 'vitest';
import { SkipLocalValidator } from '../src/validators/skip-local.validator';
import { buildClone } from './helpers/clone-builder';

describe('jscpd finder: validators', () => {
  describe('SkipLocalValidator', () => {
    const validator = new SkipLocalValidator();

    it('validate returns status true when files are in different dirs', () => {
      const clone = buildClone({
        duplicationA: { sourceId: '/project/dir1/a.js' } as any,
        duplicationB: { sourceId: '/project/dir2/b.js' } as any,
      });
      const result = validator.validate(clone, { path: ['/project/dir1'] } as any);
      expect(result.status).to.be.true;
    });

    it('validate returns status false and non-empty message when files are in same dir', () => {
      const clone = buildClone({
        duplicationA: { sourceId: '/project/dir1/a.js' } as any,
        duplicationB: { sourceId: '/project/dir1/b.js' } as any,
      });
      const result = validator.validate(clone, { path: ['/project/dir1'] } as any);
      expect(result.status).to.be.false;
      expect(result.message).to.be.an('array').with.length.greaterThan(0);
    });

    it('shouldSkipClone returns false when files are in different paths', () => {
      const clone = buildClone({
        duplicationA: { sourceId: '/project/dir1/a.js' } as any,
        duplicationB: { sourceId: '/project/dir2/b.js' } as any,
      });
      expect(validator.shouldSkipClone(clone, { path: ['/project/dir1'] } as any)).to.be.false;
    });

    it('shouldSkipClone returns true when both files are in same directory', () => {
      const clone = buildClone({
        duplicationA: { sourceId: '/project/dir1/a.js' } as any,
        duplicationB: { sourceId: '/project/dir1/b.js' } as any,
      });
      expect(validator.shouldSkipClone(clone, { path: ['/project/dir1'] } as any)).to.be.true;
    });
  });
});
