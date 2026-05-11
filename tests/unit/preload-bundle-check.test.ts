import { describe, expect, it } from 'vitest';

import { findUnsafePreloadRequires } from '../../scripts/check-preload-bundle.js';

describe('preload bundle checker', () => {
  it('accepts intentional Electron and Node runtime imports', () => {
    expect(
      findUnsafePreloadRequires(`
        const electron = require("electron");
        const path = require("node:path");
      `)
    ).toEqual([]);
  });

  it('rejects machine-local and source imports that should have been bundled', () => {
    const findings = findUnsafePreloadRequires(`
      require("D:\\\\a\\\\Arroxy\\\\Arroxy\\\\src\\\\shared\\\\ipc.js");
      require("C:/Users/anton/projects/yt-download-ui/src/preload/createPreloadApi.js");
      require("/home/anton/projects/yt-download-ui/src/shared/ipc.js");
      require("@shared/ipc.js");
      require("@preload/createPreloadApi.js");
      require("./createPreloadApi.js");
    `);

    expect(findings.map((finding) => finding.specifier)).toEqual(['D:\\\\a\\\\Arroxy\\\\Arroxy\\\\src\\\\shared\\\\ipc.js', 'C:/Users/anton/projects/yt-download-ui/src/preload/createPreloadApi.js', '/home/anton/projects/yt-download-ui/src/shared/ipc.js', '@shared/ipc.js', '@preload/createPreloadApi.js', './createPreloadApi.js']);
  });
});
