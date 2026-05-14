import { describe, it, expect, vi } from 'vitest';
import { getStore } from '../src/init/store';
import { MemoryStore } from '@jscpd/core';

describe('getStore', () => {
  it('should return MemoryStore when no store name provided', () => {
    const store = getStore(undefined);
    expect(store).toBeInstanceOf(MemoryStore);
  });

  it('should return MemoryStore as fallback for unknown store name', () => {
    const mockError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const store = getStore('nonexistent-store-xyz');
    expect(store).toBeInstanceOf(MemoryStore);
    mockError.mockRestore();
  });

  it('should log error message for unknown store name', () => {
    const mockError = vi.spyOn(console, 'error').mockImplementation(() => {});
    getStore('nonexistent-store-xyz');
    expect(mockError).toHaveBeenCalledWith(expect.stringContaining('nonexistent-store-xyz'));
    mockError.mockRestore();
  });
});
