import { describe, expect, it } from 'vitest';

interface BeforeBuildModule {
  resolveBuilderArch: (contextArch: unknown, hostArch: NodeJS.Architecture) => 'x64' | 'arm64' | 'ia32' | 'armv7l';
}

async function loadBeforeBuild(): Promise<BeforeBuildModule> {
  return (await import(new URL('../../build/beforeBuild.mjs', import.meta.url).href)) as BeforeBuildModule;
}

describe('beforeBuild arch resolution', () => {
  it('uses string context.arch values from electron-builder instead of falling back to host arch', async () => {
    const { resolveBuilderArch } = await loadBeforeBuild();

    expect(resolveBuilderArch('x64', 'arm64')).toBe('x64');
    expect(resolveBuilderArch('arm64', 'x64')).toBe('arm64');
  });

  it('keeps compatibility with numeric electron-builder arch enum values', async () => {
    const { resolveBuilderArch } = await loadBeforeBuild();

    expect(resolveBuilderArch(1, 'arm64')).toBe('x64');
    expect(resolveBuilderArch(3, 'x64')).toBe('arm64');
  });
});
