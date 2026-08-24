import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import {expect, test, _electron as electron, type ElectronApplication} from '@playwright/test'
import {resolveElectronCliArgs} from '../../scripts/dev-env.js'
import {ensureYtDlpPath} from './fixtureHarness.js'

function buildEnv(userDataDir: string): Record<string, string> {
	const env: Record<string, string> = Object.fromEntries(Object.entries(process.env).filter((entry): entry is [string, string] => typeof entry[1] === 'string'))
	env.MOCK_BACKEND = '1'
	env.ELECTRON_USER_DATA = userDataDir
	delete env.ELECTRON_RUN_AS_NODE
	return env
}

async function launchApp(userDataDir: string): Promise<ElectronApplication> {
	const env = buildEnv(userDataDir)
	// MOCK_BACKEND mocks the token/probe/download services but NOT warmup, which
	// still resolves yt-dlp for real. Each test uses a fresh ELECTRON_USER_DATA,
	// so without this the runtime cache is empty and every run re-downloads
	// ~30MB from GitHub — slow, network-dependent, and long enough that the
	// warmup splash keeps covering the shell. Point warmup at a binary the
	// harness already resolved (shared cache) instead.
	env.ARCLIO_YT_DLP_PATH = await ensureYtDlpPath()
	return electron.launch({args: [path.join(process.cwd(), 'out/main/index.js'), ...resolveElectronCliArgs(process.env)], env})
}

test('corrupted settings.json → app still reaches shell', async () => {
	const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arclio-e2e-corrupt-settings-'))
	fs.writeFileSync(path.join(userDataDir, 'settings.json'), 'not valid json', 'utf-8')

	const app = await launchApp(userDataDir)
	const page = await app.firstWindow()

	// App must reach the shell despite corrupt settings — falls back to defaults.
	await expect(page.locator('[data-testid="app-root"]')).toBeVisible({timeout: 15_000})
	await expect(page.locator('[data-testid="profiles-main-input"]')).toBeVisible()

	await app.close()
})

test('corrupted queue.json → app still reaches shell', async () => {
	const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arclio-e2e-corrupt-queue-'))
	fs.writeFileSync(path.join(userDataDir, 'queue.json'), '{ broken', 'utf-8')

	const app = await launchApp(userDataDir)
	const page = await app.firstWindow()

	await expect(page.locator('[data-testid="app-root"]')).toBeVisible({timeout: 15_000})
	await expect(page.locator('[data-testid="profiles-main-input"]')).toBeVisible()

	await app.close()
})

test('seeded pending queue → Queue Manager hydrates from persisted store', async () => {
	const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arclio-e2e-seeded-queue-'))

	// Write a queue.json that has one pending item — simulates an unfinished
	// download from a previous session. The app should re-hydrate it in Queue
	// Manager.
	//
	// The scheduler is seeded paused on purpose. It auto-starts persisted pending
	// work on launch (correct behaviour: resume after a restart), and under
	// MOCK_BACKEND the mocked DownloadService finishes instantly — so an unpaused
	// seed races straight through pending → running → done and this test can
	// never observe the hydrated state it exists to check.
	const outputDir = os.tmpdir()
	const queueData = {
		schedulerPaused: true,
		items: [
			{
				id: 'test-item-1',
				url: 'https://www.youtube.com/watch?v=seeded',
				title: 'Seeded pending item',
				thumbnail: '',
				outputDir,
				formatLabel: '720p · mp4',
				status: 'pending',
				lane: 'normal',
				progressPercent: 0,
				progressDetail: null,
				lastStatus: null,
				error: null,
				finishedAt: null,
				writeM3u: true,
				job: {kind: 'single-format', extractor: 'youtube', extractorKey: 'Youtube', formatId: '22', preset: 'custom', sponsorBlock: {mode: 'off'}, embed: {chapters: false, metadata: false, thumbnail: false, description: false, thumbnailSidecar: false}}
			}
		]
	}
	fs.writeFileSync(path.join(userDataDir, 'queue.json'), JSON.stringify(queueData), 'utf-8')

	const app = await launchApp(userDataDir)
	const page = await app.firstWindow()

	await expect(page.locator('[data-testid="app-root"]')).toBeVisible({timeout: 15_000})
	// WarmupSplash covers the shell until warmup settles and swallows pointer
	// events, so clicking straight after app-root appears races it and fails with
	// "splash-overlay intercepts pointer events". Once it reaches `fading` it sets
	// pointer-events: none, so waiting for the blocking states to clear is the
	// real milestone — waiting for it to unmount is stricter than necessary.
	await expect(page.locator('[data-testid="splash-overlay"]:not([data-state="fading"])')).toHaveCount(0, {timeout: 30_000})

	// Selected by test id, not by accessible name: the tab is labelled from
	// `queue.tabLabel`, which is translated ("Downloads" / "Téléchargements"),
	// so a name matcher depends on the host locale the app boots in.
	await page.locator('[data-testid="profiles-tab-queue"]').click()
	await expect(page.locator('[data-testid="queue-manager-tab"]')).toBeVisible()
	await expect(page.locator('[data-testid="queue-manager-row-test-item-1"]')).toHaveAttribute('data-status', 'pending')
	await expect(page.locator('[data-testid="queue-manager-row-test-item-1"] [data-testid="queue-title"]')).toContainText('Seeded pending item')

	await app.close()
})
