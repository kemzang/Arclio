import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const BASE_URL = process.env.SCENARIO_BASE_URL ?? '';

async function openScenario(page: Page, scenario: string): Promise<void> {
  await page.goto(`${BASE_URL}/?scenario=${scenario}`);
  await page.waitForSelector('[data-testid="app-root"]');
}

async function waitForSplashToLeave(page: Page): Promise<void> {
  await page.waitForSelector('[data-testid="splash-overlay"]', { state: 'detached', timeout: 6_000 }).catch(() => undefined);
}

async function waitForPlaylist(page: Page): Promise<void> {
  await page.waitForSelector('[data-testid="step-playlist-items"]', { timeout: 6_000 });
}

test('scenario gallery is available in browser-mock mode', async ({ page }) => {
  await openScenario(page, 'default');

  await expect(page.getByTestId('scenario-gallery')).toBeVisible();
  await page.getByTestId('scenario-gallery-toggle').click();
  await expect(page.getByTestId('scenario-button-playlist-at-limit')).toBeVisible();
});

test('playlist cap alert follows scenario item counts', async ({ page }) => {
  await openScenario(page, 'playlist-under-limit');
  await waitForPlaylist(page);
  await expect(page.getByTestId('playlist-probe-limit-alert')).not.toBeVisible();

  await openScenario(page, 'playlist-at-limit');
  await waitForPlaylist(page);
  await expect(page.getByTestId('playlist-probe-limit-alert')).toBeVisible();

  await openScenario(page, 'playlist-over-limit');
  await waitForPlaylist(page);
  await expect(page.getByTestId('playlist-probe-limit-alert')).not.toBeVisible();
});

test('update scenarios render channel-specific actions', async ({ page }) => {
  await openScenario(page, 'update-homebrew');
  await expect(page.getByTestId('update-command')).toHaveText('brew upgrade --cask arroxy');

  await openScenario(page, 'update-scoop');
  await expect(page.getByTestId('update-command')).toHaveText('scoop update arroxy');

  await openScenario(page, 'update-portable');
  await expect(page.getByTestId('update-banner').getByRole('link', { name: 'Download' })).toBeVisible();
});

test('queue scenarios hydrate drawer states', async ({ page }) => {
  for (const [scenario, status] of [
    ['queue-running', 'running'],
    ['queue-paused-active', 'paused-active'],
    ['queue-error', 'error'],
    ['queue-completed', 'done']
  ] as const) {
    await openScenario(page, scenario);
    await expect(page.getByTestId('drawer-body')).toBeVisible();
    await expect(page.getByTestId('queue-card-scenario-queue-item')).toHaveAttribute('data-status', status);
  }
});

test('screenshots - playlist cap alert across viewports', async ({ page }) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 900 },
    { width: 1200, height: 900 }
  ]) {
    await page.setViewportSize(viewport);
    await openScenario(page, 'playlist-at-limit');
    await waitForPlaylist(page);
    await waitForSplashToLeave(page);
    await page.screenshot({
      path: `tests/browser/screenshots/scenario-playlist-at-limit-${viewport.width}.png`,
      fullPage: false
    });
  }
});
