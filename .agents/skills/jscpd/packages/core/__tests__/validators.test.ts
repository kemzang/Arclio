import { describe, it, expect } from 'vitest';
import { LinesLengthCloneValidator } from '../src/validators/lines-length-clone.validator';
import { runCloneValidators } from '../src/validators/validator';
import { IClone, ICloneValidator, IOptions } from '../src/interfaces';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeLocation(line: number) {
  return { line, column: 0, position: line * 10 };
}

function makeClone(startLine: number, endLine: number): IClone {
  return {
    format: 'javascript',
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

const baseOptions: IOptions = { minLines: 5 } as IOptions;

// ---------------------------------------------------------------------------
// LinesLengthCloneValidator
// ---------------------------------------------------------------------------

describe('LinesLengthCloneValidator', () => {
  const validator = new LinesLengthCloneValidator();

  it('returns status:true when duplicated lines meet minLines', () => {
    const clone = makeClone(1, 10); // 9 lines
    const result = validator.validate(clone, { ...baseOptions, minLines: 5 } as IOptions);
    expect(result.status).toBe(true);
    expect(result.message).toEqual(['ok']);
  });

  it('returns status:true when duplicated lines exactly equal minLines', () => {
    const clone = makeClone(1, 6); // 5 lines
    const result = validator.validate(clone, { ...baseOptions, minLines: 5 } as IOptions);
    expect(result.status).toBe(true);
  });

  it('returns status:false when duplicated lines are below minLines', () => {
    const clone = makeClone(1, 3); // 2 lines
    const result = validator.validate(clone, { ...baseOptions, minLines: 5 } as IOptions);
    expect(result.status).toBe(false);
    expect(result.message![0]).toMatch(/less than limit/);
  });

  it('message includes the actual and minimum line counts on failure', () => {
    const clone = makeClone(1, 3); // 2 lines
    const result = validator.validate(clone, { ...baseOptions, minLines: 5 } as IOptions);
    expect(result.message![0]).toContain('2');
    expect(result.message![0]).toContain('5');
  });
});

// ---------------------------------------------------------------------------
// runCloneValidators
// ---------------------------------------------------------------------------

describe('runCloneValidators', () => {
  const clone = makeClone(1, 10);

  it('returns status:true when the validator list is empty', () => {
    const result = runCloneValidators(clone, baseOptions, []);
    expect(result.status).toBe(true);
  });

  it('returns status:true when all validators pass', () => {
    const pass: ICloneValidator = { validate: () => ({ status: true, message: ['ok'], clone }) };
    const result = runCloneValidators(clone, baseOptions, [pass, pass]);
    expect(result.status).toBe(true);
  });

  it('returns status:false when any validator fails', () => {
    const pass: ICloneValidator = { validate: () => ({ status: true, message: [], clone }) };
    const fail: ICloneValidator = { validate: () => ({ status: false, message: ['nope'], clone }) };
    const result = runCloneValidators(clone, baseOptions, [pass, fail]);
    expect(result.status).toBe(false);
  });

  it('collects messages from all validators', () => {
    const v1: ICloneValidator = { validate: () => ({ status: true, message: ['msg1'], clone }) };
    const v2: ICloneValidator = { validate: () => ({ status: true, message: ['msg2'], clone }) };
    const result = runCloneValidators(clone, baseOptions, [v1, v2]);
    expect(result.message).toContain('msg1');
    expect(result.message).toContain('msg2');
  });

  it('LinesLengthCloneValidator integrated — rejects a short clone', () => {
    const shortClone = makeClone(1, 2); // 1 line
    const result = runCloneValidators(shortClone, { ...baseOptions, minLines: 5 } as IOptions, [
      new LinesLengthCloneValidator(),
    ]);
    expect(result.status).toBe(false);
  });
});
