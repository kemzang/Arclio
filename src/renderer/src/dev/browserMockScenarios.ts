import { defaultAppSettings, DEFAULT_PLAYLIST_PROBE_LIMIT } from '@shared/constants.js';
import { QUEUE_STATUS, STATUS_KEY } from '@shared/schemas.js';
import type { AppSettings, DependencyDiagnostic, DependencyId, InstallChannel, PlaylistEntry, ProbeError, ProbeResult, QueueItem, UpdateAvailablePayload, WarmUpOutput } from '@shared/types.js';

export const BROWSER_MOCK_SCENARIO_IDS = ['default', 'playlist-under-limit', 'playlist-at-limit', 'playlist-over-limit', 'playlist-no-thumbnails', 'playlist-long-titles', 'probe-bot-block', 'probe-dpapi-error', 'probe-unavailable', 'update-direct', 'update-homebrew', 'update-scoop', 'update-portable', 'queue-empty', 'queue-running', 'queue-paused-active', 'queue-error', 'queue-completed', 'diagnostics-all-ok', 'diagnostics-ytdlp-missing', 'diagnostics-ffmpeg-broken'] as const;

export type BrowserMockScenarioId = (typeof BROWSER_MOCK_SCENARIO_IDS)[number];
export type BrowserMockScenarioGroup = 'General' | 'Playlist' | 'Probe Errors' | 'Updates' | 'Queue' | 'Diagnostics';
type ScenarioKind = 'default' | 'probe' | 'queue' | 'update' | 'diagnostics';

export interface BrowserMockScenario {
  id: BrowserMockScenarioId;
  group: BrowserMockScenarioGroup;
  title: string;
  description: string;
  kind: ScenarioKind;
}

export interface BrowserMockState {
  scenario: BrowserMockScenario;
  settings: AppSettings;
  probeResult: ProbeResult | null;
  probeError: ProbeError | null;
  queueItems: QueueItem[];
  update: UpdateAvailablePayload | null;
  warmUp: WarmUpOutput;
}

const COMMON_PATHS = {
  downloads: '/home/user/Downloads',
  videos: '/home/user/Videos',
  desktop: '/home/user/Desktop',
  music: '/home/user/Music',
  documents: '/home/user/Documents',
  pictures: '/home/user/Pictures',
  home: '/home/user'
} as const;

export const BROWSER_MOCK_SCENARIOS: readonly BrowserMockScenario[] = [
  { id: 'default', group: 'General', title: 'Default app', description: 'Standard mock video flow and clean queue.', kind: 'default' },
  { id: 'playlist-under-limit', group: 'Playlist', title: '99 items', description: 'Playlist just below the default probe limit.', kind: 'probe' },
  { id: 'playlist-at-limit', group: 'Playlist', title: '100 exact', description: 'Playlist exactly at the default probe limit; cap alert should stay hidden.', kind: 'probe' },
  { id: 'playlist-over-limit', group: 'Playlist', title: '101 capped', description: 'Playlist with a hidden sentinel item beyond the default probe limit; cap alert should show.', kind: 'probe' },
  { id: 'playlist-no-thumbnails', group: 'Playlist', title: 'No thumbnails', description: 'Playlist rows with no thumbnail column.', kind: 'probe' },
  { id: 'playlist-long-titles', group: 'Playlist', title: 'Long titles', description: 'Playlist rows with intentionally long titles.', kind: 'probe' },
  { id: 'probe-bot-block', group: 'Probe Errors', title: 'Bot block', description: 'Hard yt-dlp bot-wall probe failure.', kind: 'probe' },
  { id: 'probe-dpapi-error', group: 'Probe Errors', title: 'DPAPI cookies', description: 'Chrome app-bound cookie decryption failure.', kind: 'probe' },
  { id: 'probe-unavailable', group: 'Probe Errors', title: 'Unavailable', description: 'Video unavailable probe failure.', kind: 'probe' },
  { id: 'update-direct', group: 'Updates', title: 'Direct update', description: 'Install and restart action.', kind: 'update' },
  { id: 'update-homebrew', group: 'Updates', title: 'Homebrew update', description: 'Copy Homebrew upgrade command.', kind: 'update' },
  { id: 'update-scoop', group: 'Updates', title: 'Scoop update', description: 'Copy Scoop update command.', kind: 'update' },
  { id: 'update-portable', group: 'Updates', title: 'Portable update', description: 'Download link action.', kind: 'update' },
  { id: 'queue-empty', group: 'Queue', title: 'Empty queue', description: 'No queue items.', kind: 'queue' },
  { id: 'queue-running', group: 'Queue', title: 'Running item', description: 'Drawer with an active download.', kind: 'queue' },
  { id: 'queue-paused-active', group: 'Queue', title: 'Paused active', description: 'Drawer with a resumable active pause.', kind: 'queue' },
  { id: 'queue-error', group: 'Queue', title: 'Failed item', description: 'Drawer with a failed item and error detail.', kind: 'queue' },
  { id: 'queue-completed', group: 'Queue', title: 'Completed item', description: 'Drawer with completed download controls.', kind: 'queue' },
  { id: 'diagnostics-all-ok', group: 'Diagnostics', title: 'All OK', description: 'Runnable dependency diagnostics.', kind: 'diagnostics' },
  { id: 'diagnostics-ytdlp-missing', group: 'Diagnostics', title: 'yt-dlp missing', description: 'Blocking yt-dlp setup failure.', kind: 'diagnostics' },
  { id: 'diagnostics-ffmpeg-broken', group: 'Diagnostics', title: 'ffmpeg broken', description: 'Blocking ffmpeg setup failure.', kind: 'diagnostics' }
] as const;

const SCENARIOS_BY_ID = new Map<string, BrowserMockScenario>(BROWSER_MOCK_SCENARIOS.map((scenario) => [scenario.id, scenario]));

function isBrowserMockScenarioId(value: string | null): value is BrowserMockScenarioId {
  return value != null && (BROWSER_MOCK_SCENARIO_IDS as readonly string[]).includes(value);
}

export function readScenarioIdFromUrl(location: Pick<Location, 'search'> | URL): BrowserMockScenarioId | null {
  const value = new URLSearchParams(location.search.startsWith('?') ? location.search.slice(1) : location.search).get('scenario');
  return isBrowserMockScenarioId(value) ? value : null;
}

export function getScenario(id: string | null | undefined): BrowserMockScenario {
  if (!id) return BROWSER_MOCK_SCENARIOS[0];
  return SCENARIOS_BY_ID.get(id) ?? BROWSER_MOCK_SCENARIOS[0];
}

export function buildScenarioAppApiState(scenario: BrowserMockScenario): BrowserMockState {
  const settings = buildSettings(scenario);
  return {
    scenario,
    settings,
    probeResult: buildProbeResult(scenario),
    probeError: buildProbeError(scenario),
    queueItems: buildQueueItems(scenario),
    update: buildUpdate(scenario),
    warmUp: buildWarmUp(scenario)
  };
}

function buildSettings(scenario: BrowserMockScenario): AppSettings {
  const base = defaultAppSettings('/home/user/Downloads');
  const queueOpen = scenario.group === 'Queue' && scenario.id !== 'queue-empty';
  return {
    ...base,
    common: {
      ...base.common,
      language: 'en',
      cookiesPath: undefined,
      cookiesMode: 'off',
      embedChapters: true,
      embedMetadata: true,
      embedThumbnail: false,
      playlistProbeLimit: DEFAULT_PLAYLIST_PROBE_LIMIT,
      drawerOpen: queueOpen,
      commonPaths: COMMON_PATHS
    }
  };
}

function buildProbeResult(scenario: BrowserMockScenario): ProbeResult | null {
  switch (scenario.id) {
    case 'playlist-under-limit':
      return playlistProbe(99);
    case 'playlist-at-limit':
      return playlistProbe(100);
    case 'playlist-over-limit':
      return playlistProbe(101);
    case 'playlist-no-thumbnails':
      return playlistProbe(100, { thumbnails: false });
    case 'playlist-long-titles':
      return playlistProbe(100, { longTitles: true });
    default:
      return null;
  }
}

function buildProbeError(scenario: BrowserMockScenario): ProbeError | null {
  switch (scenario.id) {
    case 'probe-bot-block':
      return { kind: 'ytdlp', error: { kind: 'botBlock', raw: "ERROR: [youtube] x: Sign in to confirm you're not a bot. Use --cookies-from-browser ..." } };
    case 'probe-dpapi-error':
      return { kind: 'ytdlp', error: { kind: 'unknown', raw: 'ERROR: Failed to decrypt with DPAPI. See https://github.com/yt-dlp/yt-dlp/issues/10927 for more info' } };
    case 'probe-unavailable':
      return { kind: 'ytdlp', error: { kind: 'unavailable', raw: 'ERROR: [youtube] dQw4w9WgXcQ: Video unavailable.' } };
    default:
      return null;
  }
}

function playlistProbe(count: number, options: { thumbnails?: boolean; longTitles?: boolean } = {}): ProbeResult {
  const entries: PlaylistEntry[] = Array.from({ length: count }, (_, i) => {
    const number = i + 1;
    const title = options.longTitles ? `Mock playlist item ${number} - an intentionally long title with extra metadata, brackets, episode numbers, and enough words to pressure every row layout` : `Mock playlist item ${number} - ${i % 3 === 0 ? 'a longer title that should ellipsize gracefully when the row is narrow' : 'short title'}`;
    return {
      id: `mock${number}`,
      url: `https://www.youtube.com/watch?v=mock${number}`,
      title,
      thumbnail: options.thumbnails === false ? '' : i % 5 === 0 ? '' : 'https://i.ytimg.com/vi/jfKfPfyJRdk/mqdefault.jpg',
      duration: 90 + i * 47,
      playlistIndex: number,
      videoId: `mockid${number}`
    };
  });

  return {
    kind: 'playlist',
    extractor: 'youtube:tab',
    extractorKey: 'YoutubeTab',
    webpageUrl: 'https://example.com/mock-playlist',
    isAudioOnlySource: false,
    isMultiVideo: false,
    playlistId: 'PLmock_browser',
    playlistTitle: 'Mock Browser Playlist',
    entries
  };
}

function buildUpdate(scenario: BrowserMockScenario): UpdateAvailablePayload | null {
  const channelByScenario: Partial<Record<BrowserMockScenarioId, InstallChannel>> = {
    'update-direct': 'direct',
    'update-homebrew': 'homebrew',
    'update-scoop': 'scoop',
    'update-portable': 'portable'
  };
  const installChannel = channelByScenario[scenario.id];
  return installChannel ? { version: '1.2.0', currentVersion: '0.0.1', installChannel } : null;
}

function buildWarmUp(scenario: BrowserMockScenario): WarmUpOutput {
  const dependencies = allRunnableDependencies();
  if (scenario.id === 'diagnostics-ytdlp-missing') {
    dependencies['yt-dlp'] = failedDependency('yt-dlp', 'download_failed', 'yt-dlp download failed');
    return { completed: false, dependencies, blockingFailures: ['yt-dlp'], cancelled: false };
  }
  if (scenario.id === 'diagnostics-ffmpeg-broken') {
    dependencies.ffmpeg = failedDependency('ffmpeg', 'bad_exit_code', 'ffmpeg exited with code 1');
    return { completed: false, dependencies, blockingFailures: ['ffmpeg'], cancelled: false };
  }
  return { completed: true, dependencies, blockingFailures: [], cancelled: false };
}

function allRunnableDependencies(): Record<DependencyId, DependencyDiagnostic> {
  return {
    'yt-dlp': { id: 'yt-dlp', state: 'runnable', source: { kind: 'managed', channel: 'nightly', url: 'mock' }, resolvedPath: '/mock/yt-dlp', attempts: [] },
    ffmpeg: { id: 'ffmpeg', state: 'runnable', source: { kind: 'managed', channel: 'default', url: 'mock' }, resolvedPath: '/mock/ffmpeg', attempts: [] },
    ffprobe: { id: 'ffprobe', state: 'runnable', source: { kind: 'managed', channel: 'default', url: 'mock' }, resolvedPath: '/mock/ffprobe', attempts: [] },
    deno: { id: 'deno', state: 'runnable', source: { kind: 'managed', channel: 'default', url: 'mock' }, resolvedPath: '/mock/deno', attempts: [] }
  };
}

function failedDependency(id: DependencyId, kind: NonNullable<DependencyDiagnostic['failure']>['kind'], message: string): DependencyDiagnostic {
  return {
    id,
    state: 'failed',
    source: { kind: 'managed', channel: id === 'yt-dlp' ? 'nightly' : 'default', url: 'mock' },
    resolvedPath: null,
    failure: { kind, message },
    attempts: []
  };
}

function buildQueueItems(scenario: BrowserMockScenario): QueueItem[] {
  switch (scenario.id) {
    case 'queue-running':
      return [queueItem({ status: QUEUE_STATUS.running, progressPercent: 42, progressDetail: 'Downloading 42%' })];
    case 'queue-paused-active':
      return [queueItem({ status: QUEUE_STATUS.pausedActive, progressPercent: 38, progressDetail: 'Paused at 38%', tempDir: '/tmp/arroxy-mock', lastJobId: 'mock-job-1' })];
    case 'queue-error':
      return [queueItem({ status: QUEUE_STATUS.error, progressPercent: 17, progressDetail: null, error: { kind: 'botBlock', raw: "Sign in to confirm you're not a bot" }, finishedAt: '2026-05-31T12:00:00.000Z' })];
    case 'queue-completed':
      return [queueItem({ status: QUEUE_STATUS.done, progressPercent: 100, progressDetail: null, finishedAt: '2026-05-31T12:00:00.000Z' })];
    default:
      return [];
  }
}

function queueItem(overrides: Partial<QueueItem>): QueueItem {
  return {
    id: 'scenario-queue-item',
    url: 'https://www.youtube.com/watch?v=scenario',
    title: 'Scenario Queue Item - visual regression fixture',
    thumbnail: 'https://i.ytimg.com/vi/jfKfPfyJRdk/mqdefault.jpg',
    outputDir: '/home/user/Downloads',
    formatLabel: '1080p | mp4 | 30fps',
    status: QUEUE_STATUS.pending,
    lane: 'normal',
    progressPercent: 0,
    progressDetail: null,
    lastStatus: { key: STATUS_KEY.startingYtdlp },
    error: null,
    finishedAt: null,
    writeM3u: true,
    job: { kind: 'single-format', extractor: 'youtube', extractorKey: 'Youtube', formatId: '137+251', preset: 'custom', sponsorBlock: { mode: 'off' }, embed: { chapters: false, metadata: false, thumbnail: false, description: false, thumbnailSidecar: false } },
    ...overrides
  };
}
