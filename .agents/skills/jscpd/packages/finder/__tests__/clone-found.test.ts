import { describe, it, expect, vi, afterEach } from 'vitest';
import { cloneFound } from '../src/utils/clone-found';
import { buildClone } from './helpers/clone-builder';

describe('jscpd finder: clone-found', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs format name without red asterisk when isNew is false', () => {
    const spy = vi.spyOn(console, 'log');
    const clone = buildClone({ isNew: false });
    cloneFound(clone, { absolute: true } as any);
    const firstCall = spy.mock.calls[0][0] as string;
    expect(firstCall).to.include('javascript');
    expect(firstCall).not.to.include('*');
  });

  it('logs red asterisk when isNew is true', () => {
    const spy = vi.spyOn(console, 'log');
    const clone = buildClone({ isNew: true });
    cloneFound(clone, { absolute: true } as any);
    const firstCall = spy.mock.calls[0][0] as string;
    expect(firstCall).to.include('*');
  });
});
