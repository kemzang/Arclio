import { describe, expect, it } from 'vitest';

import { isExternalMainBuildImport, isExternalPreloadBuildImport } from '../../electron.vite.config.js';

describe('electron.vite.config', () => {
  it('bundles main-process npm dependencies while keeping electron and node builtins external', () => {
    expect(isExternalMainBuildImport('electron')).toBe(true);
    expect(isExternalMainBuildImport('electron/main')).toBe(true);
    expect(isExternalMainBuildImport('node:path')).toBe(true);
    expect(isExternalMainBuildImport('@main/services/QueueService')).toBe(false);
    expect(isExternalMainBuildImport('@shared/types')).toBe(false);
    expect(isExternalMainBuildImport('./relative-module')).toBe(false);
    expect(isExternalMainBuildImport('electron-log/main')).toBe(false);
    expect(isExternalMainBuildImport('got')).toBe(false);
  });

  it('still externalizes preload npm dependencies', () => {
    expect(isExternalPreloadBuildImport('electron')).toBe(true);
    expect(isExternalPreloadBuildImport('electron/main')).toBe(true);
    expect(isExternalPreloadBuildImport('node:fs')).toBe(true);
    expect(isExternalPreloadBuildImport('@preload/api')).toBe(false);
    expect(isExternalPreloadBuildImport('@shared/ipc')).toBe(false);
    expect(isExternalPreloadBuildImport('./relative-module')).toBe(false);
    expect(isExternalPreloadBuildImport('electron-log/main')).toBe(true);
  });
});
