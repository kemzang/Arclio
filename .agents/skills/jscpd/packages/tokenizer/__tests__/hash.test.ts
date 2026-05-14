import { describe, it, expect } from 'vitest';
import { hash } from '../src/hash';

describe('hash', () => {
  it('returns a string', () => {
    expect(typeof hash('hello')).toBe('string');
  });

  it('is deterministic for the same input', () => {
    expect(hash('hello')).toBe(hash('hello'));
  });

  it('produces different hashes for different inputs', () => {
    expect(hash('hello')).not.toBe(hash('world'));
  });

  it('handles empty string without throwing', () => {
    expect(() => hash('')).not.toThrow();
    expect(typeof hash('')).toBe('string');
  });

  it('produces consistent-length output regardless of input length', () => {
    const short = hash('x');
    const long = hash('a much longer string with lots of content inside it');
    expect(short.length).toBe(long.length);
  });

  it('is case-sensitive', () => {
    expect(hash('Hello')).not.toBe(hash('hello'));
  });
});
