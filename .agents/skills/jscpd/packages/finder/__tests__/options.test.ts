import { describe, it, expect } from 'vitest';
import { parseFormatsExtensions } from '../src/utils/options';

describe('jscpd finder: options', () => {
  describe('parseFormatsExtensions', () => {
    it('returns undefined for empty string', () => {
      expect(parseFormatsExtensions('')).to.be.undefined;
    });

    it('returns undefined for undefined', () => {
      expect(parseFormatsExtensions(undefined)).to.be.undefined;
    });

    it('parses single format with extensions', () => {
      expect(parseFormatsExtensions('c:c,h')).to.deep.eq({ c: ['c', 'h'] });
    });

    it('parses multiple formats separated by semicolon', () => {
      expect(parseFormatsExtensions('javascript:js,ts;python:py')).to.deep.eq({
        javascript: ['js', 'ts'],
        python: ['py'],
      });
    });
  });
});
