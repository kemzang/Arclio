import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { expect, test, _electron as electron } from '@playwright/test';

// On CI this is set by the workflow; locally point at a built win-unpacked dir.
const WIN_UNPACKED_EXE = process.env.WIN_UNPACKED_EXE ?? path.join(process.cwd(), 'dist', 'win-unpacked', 'Arroxy.exe');

const WARMUP_TIMEOUT_MS = 12 * 60 * 1000; // yt-dlp + deno cold download

test('packaged exe: downloads binaries, completes warmup, shows wizard', async () => {
  // Override the timeout for this test only — warmup downloads yt-dlp (~80 MB)
  // and deno (~120 MB) from GitHub Releases on a cold runner.
  test.setTimeout(WARMUP_TIMEOUT_MS + 60_000);

  const tmpBase = process.env.ARROXY_COLD_TMPDIR ?? os.tmpdir();
  const userDataDir = fs.mkdtempSync(path.join(tmpBase, 'arroxy-cold-'));

  const baseEnv = Object.fromEntries(Object.entries(process.env).filter((e): e is [string, string] => typeof e[1] === 'string'));
  delete baseEnv.ELECTRON_RUN_AS_NODE;

  const app = await electron.launch({
    executablePath: WIN_UNPACKED_EXE,
    env: {
      ...baseEnv,
      ELECTRON_USER_DATA: userDataDir
      // Explicitly absent: MOCK_BACKEND — we want real warmup
    }
  });

  try {
    const page = await app.firstWindow();

    // Preload bridge check — fast, confirms packaging + contextBridge OK.
    const hasApi = await page.evaluate(() => typeof window.appApi === 'object' && window.appApi !== null);
    expect(hasApi).toBe(true);

    // Wait for splash to leave the DOM. SplashScreen returns null only after:
    //   (1) warmup IPC resolves with no blocking failures,
    //   (2) 3-second minimum display time passes,
    //   (3) CSS opacity transition completes.
    // This is the slow step on a cold runner (binary downloads).
    await expect(page.locator('[data-testid="splash-overlay"]')).not.toBeAttached({
      timeout: WARMUP_TIMEOUT_MS
    });

    // Wizard screen is now visible to the user.
    await expect(page.locator('[data-testid="url-input"]')).toBeVisible({ timeout: 5_000 });
  } finally {
    await app.close();
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }
});
