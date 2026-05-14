import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryStore } from '../src/store/memory';

describe('MemoryStore', () => {
  let store: MemoryStore<string>;

  beforeEach(() => {
    store = new MemoryStore();
    store.namespace('test');
  });

  it('set then get resolves with the stored value', async () => {
    await store.set('key1', 'value1');
    const result = await store.get('key1');
    expect(result).toBe('value1');
  });

  it('get rejects for a key that was never set', async () => {
    await expect(store.get('missing')).rejects.toThrow('not found');
  });

  it('set overwrites an existing value', async () => {
    await store.set('key1', 'first');
    await store.set('key1', 'second');
    const result = await store.get('key1');
    expect(result).toBe('second');
  });

  it('values are isolated between namespaces', async () => {
    await store.set('key1', 'ns1-value');

    store.namespace('other');
    await expect(store.get('key1')).rejects.toThrow();

    await store.set('key1', 'ns2-value');
    const result = await store.get('key1');
    expect(result).toBe('ns2-value');
  });

  it('switching namespace back retrieves original value', async () => {
    await store.set('key1', 'ns1-value');
    store.namespace('other');
    await store.set('key1', 'ns2-value');

    store.namespace('test');
    expect(await store.get('key1')).toBe('ns1-value');
  });

  it('close empties the store — all subsequent gets reject', async () => {
    await store.set('key1', 'value1');
    store.close();
    store.namespace('test');
    await expect(store.get('key1')).rejects.toThrow();
  });

  it('set resolves with the stored value', async () => {
    const result = await store.set('k', 'v');
    expect(result).toBe('v');
  });
});
