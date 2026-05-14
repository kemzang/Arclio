import { describe, it, expect } from 'vitest';
import { strict, mild, weak, getModeByName, getModeHandler } from '../src/mode';
import { IToken } from '../src/interfaces';

function token(type: string, format = 'javascript'): IToken {
  return {
    type,
    value: type,
    format,
    length: type.length,
    range: [0, type.length],
    loc: { start: { line: 1, column: 0, position: 0 }, end: { line: 1, column: type.length, position: type.length } },
  };
}

describe('strict', () => {
  it('returns false for "ignore" tokens', () => {
    expect(strict(token('ignore'))).toBe(false);
  });

  it('returns true for all other token types', () => {
    expect(strict(token('keyword'))).toBe(true);
    expect(strict(token('empty'))).toBe(true);
    expect(strict(token('new_line'))).toBe(true);
    expect(strict(token('comment'))).toBe(true);
  });
});

describe('mild', () => {
  it('returns false for "ignore" tokens', () => {
    expect(mild(token('ignore'))).toBe(false);
  });

  it('returns false for "empty" tokens', () => {
    expect(mild(token('empty'))).toBe(false);
  });

  it('returns false for "new_line" tokens', () => {
    expect(mild(token('new_line'))).toBe(false);
  });

  it('returns true for regular code tokens', () => {
    expect(mild(token('keyword'))).toBe(true);
    expect(mild(token('identifier'))).toBe(true);
  });
});

describe('weak', () => {
  it('returns false for "ignore" tokens', () => {
    expect(weak(token('ignore'))).toBe(false);
  });

  it('returns false for "empty" tokens', () => {
    expect(weak(token('empty'))).toBe(false);
  });

  it('returns false for "new_line" tokens', () => {
    expect(weak(token('new_line'))).toBe(false);
  });

  it('returns false for tokens with format "comment"', () => {
    expect(weak(token('keyword', 'comment'))).toBe(false);
  });

  it('returns false for tokens with type "comment"', () => {
    expect(weak(token('comment'))).toBe(false);
  });

  it('returns false for "block-comment" tokens', () => {
    expect(weak(token('block-comment'))).toBe(false);
  });

  it('returns true for regular code tokens', () => {
    expect(weak(token('keyword'))).toBe(true);
    expect(weak(token('identifier'))).toBe(true);
  });
});

describe('getModeByName', () => {
  it('returns the strict mode function', () => {
    expect(getModeByName('strict')).toBe(strict);
  });

  it('returns the mild mode function', () => {
    expect(getModeByName('mild')).toBe(mild);
  });

  it('returns the weak mode function', () => {
    expect(getModeByName('weak')).toBe(weak);
  });

  it('throws for an unknown mode name', () => {
    expect(() => getModeByName('unknown')).toThrow('Mode unknown does not supported yet.');
  });
});

describe('getModeHandler', () => {
  it('resolves a string name to the corresponding function', () => {
    expect(getModeHandler('mild')).toBe(mild);
    expect(getModeHandler('strict')).toBe(strict);
    expect(getModeHandler('weak')).toBe(weak);
  });

  it('returns the function as-is when given a function directly', () => {
    const custom = (t: IToken) => t.type !== 'ignore';
    expect(getModeHandler(custom)).toBe(custom);
  });
});
