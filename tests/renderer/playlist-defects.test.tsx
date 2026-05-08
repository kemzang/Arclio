// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { useAppStore } from '@renderer/store/useAppStore.js';
import { StepConfirm } from '@renderer/components/wizard/StepConfirm.js';
import { SmartDrawer } from '@renderer/components/layout/SmartDrawer.js';
import { ok } from '../shared/fixtures.js';
import type { PlaylistEntry, StatusEvent } from '@shared/types.js';

const PLAYLIST_ENTRIES: PlaylistEntry[] = [
  { id: 'p1', url: 'https://youtube.com/watch?v=p1', title: 'Vid 1', thumbnail: '', playlistIndex: 1 },
  { id: 'p2', url: 'https://youtube.com/watch?v=p2', title: 'Vid 2', thumbnail: '', playlistIndex: 2 },
  { id: 'p3', url: 'https://youtube.com/watch?v=p3', title: 'Vid 3', thumbnail: '', playlistIndex: 3 }
];

function buildMockApi(settingsUpdateMock?: ReturnType<typeof vi.fn>) {
  return {
    app: {
      warmUp: vi.fn().mockResolvedValue(ok({ completed: true, failures: [] })),
      setLanguage: vi.fn().mockResolvedValue(undefined)
    },
    downloads: {
      start: vi.fn().mockResolvedValue(ok({ job: { id: 'job-1', url: '', outputDir: '/tmp', status: 'running', createdAt: '', updatedAt: '' } })),
      cancel: vi.fn().mockResolvedValue(ok({ cancelled: true })),
      getFormats: vi.fn(),
      pause: vi.fn().mockResolvedValue(ok({ paused: true })),
      resume: vi.fn().mockResolvedValue(ok({ resumed: true }))
    },
    settings: {
      get: vi.fn().mockResolvedValue(ok({ defaultOutputDir: '/tmp', rememberLastOutputDir: false })),
      update: settingsUpdateMock ?? vi.fn().mockResolvedValue(ok({ defaultOutputDir: '/tmp', rememberLastOutputDir: false }))
    },
    shell: { openFolder: vi.fn(), openExternal: vi.fn() },
    logs: { openDir: vi.fn() },
    dialog: { chooseFolder: vi.fn() },
    events: {
      onStatus: vi.fn().mockImplementation((_cb: (event: StatusEvent) => void) => () => undefined),
      onProgress: vi.fn().mockReturnValue(() => undefined),
      onClipboardUrl: vi.fn().mockReturnValue(() => undefined)
    },
    queue: {
      save: vi.fn().mockResolvedValue({ ok: true, data: { saved: true } }),
      load: vi.fn().mockResolvedValue({ ok: true, data: [] })
    },
    updater: {
      onUpdateAvailable: vi.fn().mockReturnValue(() => undefined),
      install: vi.fn()
    },
    analytics: { track: vi.fn() },
    diagnostics: { logWizardStep: vi.fn() }
  };
}

function resetStore() {
  useAppStore.setState({
    initialized: false,
    initializing: false,
    settings: { defaultOutputDir: '/tmp', rememberLastOutputDir: false },
    wizardStep: 'confirm',
    wizardMode: 'single',
    formatsLoading: false,
    wizardUrl: '',
    wizardTitle: '',
    wizardThumbnail: '',
    wizardDuration: 0,
    wizardFormats: [],
    selectedVideoFormatId: '',
    audioSelection: { kind: 'none' },
    activePreset: null,
    wizardOutputDir: '/tmp',
    wizardSubfolderEnabled: false,
    wizardSubfolderName: '',
    wizardError: null,
    wizardErrorOrigin: null,
    wizardSubtitles: {},
    wizardAutomaticCaptions: {},
    wizardSubtitleLanguages: [],
    wizardSubtitleSkipped: false,
    wizardSubtitleMode: 'sidecar',
    wizardSubtitleFormat: 'srt',
    wizardSponsorBlockMode: 'off',
    wizardSponsorBlockCategories: ['sponsor', 'selfpromo'],
    wizardEmbedChapters: false,
    wizardEmbedMetadata: false,
    wizardEmbedThumbnail: false,
    wizardWriteDescription: false,
    wizardWriteThumbnail: false,
    playlistItems: [],
    selectedPlaylistItemIds: [],
    selectedPlaylistPreset: null,
    playlistTitle: '',
    queue: [],
    drawerOpen: true,
    interJobSleepEndsAt: null
  } as never);
}

beforeEach(() => {
  resetStore();
  vi.clearAllMocks();
});

describe('D1/D3 — StepConfirm playlist-mode rendering', () => {
  function setPlaylistConfirmState() {
    useAppStore.setState({
      wizardMode: 'playlist',
      wizardStep: 'confirm',
      playlistTitle: 'My Playlist',
      playlistItems: PLAYLIST_ENTRIES,
      selectedPlaylistItemIds: ['p1', 'p2'],
      selectedPlaylistPreset: 'video-1080p',
      wizardOutputDir: '/tmp/playlists'
    } as never);
  }

  it('renders playlist + preset + items + saveTo rows; omits video/audio/subtitles/size rows', () => {
    window.appApi = buildMockApi() as never;
    setPlaylistConfirmState();
    render(<StepConfirm />);

    expect(screen.getByTestId('confirm-playlist')).toHaveTextContent('My Playlist');
    expect(screen.getByTestId('confirm-preset')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-items')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-saveTo')).toBeInTheDocument();

    expect(screen.queryByTestId('confirm-video')).not.toBeInTheDocument();
    expect(screen.queryByTestId('confirm-audio')).not.toBeInTheDocument();
    expect(screen.queryByTestId('confirm-subtitles')).not.toBeInTheDocument();
    expect(screen.queryByTestId('confirm-size')).not.toBeInTheDocument();
  });

  it('items row shows selected/total count', () => {
    window.appApi = buildMockApi() as never;
    setPlaylistConfirmState();
    render(<StepConfirm />);
    const cell = screen.getByTestId('confirm-items');
    expect(cell.textContent).toMatch(/2/);
    expect(cell.textContent).toMatch(/3/);
  });

  it('disables Pull/AddToQueue when no preset selected', () => {
    window.appApi = buildMockApi() as never;
    setPlaylistConfirmState();
    useAppStore.setState({ selectedPlaylistPreset: null } as never);
    render(<StepConfirm />);
    expect(screen.getByTestId('btn-download-now')).toBeDisabled();
    expect(screen.getByTestId('btn-add-to-queue')).toBeDisabled();
  });

  it('disables Pull/AddToQueue when no items selected', () => {
    window.appApi = buildMockApi() as never;
    setPlaylistConfirmState();
    useAppStore.setState({ selectedPlaylistItemIds: [] } as never);
    render(<StepConfirm />);
    expect(screen.getByTestId('btn-download-now')).toBeDisabled();
  });
});

describe('D2 — persistFormatPrefs mode-keyed', () => {
  it('playlist mode writes lastPlaylist* keys, NOT lastPreset/lastSubfolder', async () => {
    const update = vi.fn().mockResolvedValue(ok({ defaultOutputDir: '/tmp', rememberLastOutputDir: false }));
    window.appApi = buildMockApi(update) as never;

    useAppStore.setState({
      wizardMode: 'playlist',
      playlistTitle: 'PL',
      playlistItems: PLAYLIST_ENTRIES,
      selectedPlaylistItemIds: ['p1'],
      selectedPlaylistPreset: 'audio-mp3',
      wizardSubfolderEnabled: true,
      wizardSubfolderName: 'PlaylistFolder',
      wizardOutputDir: '/tmp'
    } as never);

    await useAppStore.getState().addToQueue();

    expect(update).toHaveBeenCalledOnce();
    const patch = update.mock.calls[0][0];
    expect(patch.playlist).toEqual({
      lastPlaylistPreset: 'audio-mp3',
      lastPlaylistSubfolderEnabled: true,
      lastPlaylistSubfolder: 'PlaylistFolder'
    });
    expect(patch).not.toHaveProperty('single');
  });

  it('single mode writes lastPreset/lastSubfolder, NOT lastPlaylist* keys', async () => {
    const update = vi.fn().mockResolvedValue(ok({ defaultOutputDir: '/tmp', rememberLastOutputDir: false }));
    window.appApi = buildMockApi(update) as never;

    useAppStore.setState({
      wizardMode: 'single',
      wizardUrl: 'https://youtube.com/watch?v=x',
      wizardTitle: 'X',
      wizardFormats: [{ formatId: '22', label: '720p', ext: 'mp4', resolution: '720p', isVideoOnly: false, isAudioOnly: false }],
      selectedVideoFormatId: '22',
      audioSelection: { kind: 'none' },
      activePreset: 'best-quality',
      wizardSubfolderEnabled: true,
      wizardSubfolderName: 'SingleFolder',
      wizardOutputDir: '/tmp'
    } as never);

    await useAppStore.getState().addToQueue();

    expect(update).toHaveBeenCalledOnce();
    const patch = update.mock.calls[0][0];
    expect(patch.single).toMatchObject({
      lastPreset: 'best-quality',
      lastSubfolder: 'SingleFolder',
      lastSubfolderEnabled: true
    });
    expect(patch).not.toHaveProperty('playlist');
  });
});

describe('D4 — pause-from-pending lifecycle', () => {
  it('pauseItemDownload on pending item flips to paused without IPC', async () => {
    const api = buildMockApi();
    window.appApi = api as never;

    useAppStore.setState({
      queue: [
        {
          id: 'q1',
          url: 'https://youtube.com/watch?v=q1',
          title: 'q1',
          thumbnail: '',
          outputDir: '/tmp',
          formatId: '22',
          formatLabel: 'best',
          preset: 'custom',
          status: 'pending',
          progressPercent: 0,
          progressDetail: null,
          lastStatus: null,
          error: null,
          finishedAt: null,
          downloadJobId: null,
          subtitleLanguages: [],
          writeAutoSubs: false,
          subtitleMode: 'sidecar',
          subtitleFormat: 'srt',
          sponsorBlockMode: 'off',
          sponsorBlockCategories: [],
          embedChapters: false,
          embedMetadata: false,
          embedThumbnail: false,
          writeDescription: false,
          writeThumbnail: false
        }
      ]
    } as never);

    await useAppStore.getState().pauseItemDownload('q1');

    const item = useAppStore.getState().queue.find((i) => i.id === 'q1');
    expect(item?.status).toBe('paused');
    expect(item?.downloadJobId).toBeNull();
    expect(api.downloads.pause).not.toHaveBeenCalled();
  });

  it('resumeItemDownload on paused-without-jobId flips back to pending and triggers maybeStartNext', async () => {
    const api = buildMockApi();
    window.appApi = api as never;

    useAppStore.setState({
      queue: [
        {
          id: 'q1',
          url: 'https://youtube.com/watch?v=q1',
          title: 'q1',
          thumbnail: '',
          outputDir: '/tmp',
          formatId: '22',
          formatLabel: 'best',
          preset: 'custom',
          status: 'paused',
          progressPercent: 0,
          progressDetail: null,
          lastStatus: null,
          error: null,
          finishedAt: null,
          downloadJobId: null,
          subtitleLanguages: [],
          writeAutoSubs: false,
          subtitleMode: 'sidecar',
          subtitleFormat: 'srt',
          sponsorBlockMode: 'off',
          sponsorBlockCategories: [],
          embedChapters: false,
          embedMetadata: false,
          embedThumbnail: false,
          writeDescription: false,
          writeThumbnail: false
        }
      ]
    } as never);

    await useAppStore.getState().resumeItemDownload('q1');

    // No paused-job IPC since downloadJobId was null.
    expect(api.downloads.resume).not.toHaveBeenCalled();
    // Resumed pending item gets started by maybeStartNext.
    expect(api.downloads.start).toHaveBeenCalledOnce();
  });
});

describe('D4-followup — isHeld behaviour', () => {
  function makeHeldQueue() {
    return [
      {
        id: 'held1',
        url: 'https://youtube.com/watch?v=held1',
        title: 'held1',
        thumbnail: '',
        outputDir: '/tmp',
        formatId: '22',
        formatLabel: 'best',
        preset: 'custom',
        status: 'paused',
        progressPercent: 0,
        progressDetail: null,
        lastStatus: null,
        error: null,
        finishedAt: null,
        downloadJobId: null as string | null,
        subtitleLanguages: [],
        writeAutoSubs: false,
        subtitleMode: 'sidecar',
        subtitleFormat: 'srt',
        sponsorBlockMode: 'off',
        sponsorBlockCategories: [],
        embedChapters: false,
        embedMetadata: false,
        embedThumbnail: false,
        writeDescription: false,
        writeThumbnail: false
      }
    ];
  }

  it('removeQueueItem removes a held item (paused without jobId)', () => {
    window.appApi = buildMockApi() as never;
    useAppStore.setState({ queue: makeHeldQueue() } as never);
    useAppStore.getState().removeQueueItem('held1');
    expect(useAppStore.getState().queue.find((i) => i.id === 'held1')).toBeUndefined();
  });

  it('removeQueueItem still blocks a real paused job (paused WITH jobId)', () => {
    window.appApi = buildMockApi() as never;
    const queue = makeHeldQueue();
    queue[0].downloadJobId = 'job-1';
    useAppStore.setState({ queue } as never);
    useAppStore.getState().removeQueueItem('held1');
    expect(useAppStore.getState().queue.find((i) => i.id === 'held1')).toBeDefined();
  });

  it('cancelItemDownload on a held item skips the IPC and marks cancelled', async () => {
    const api = buildMockApi();
    window.appApi = api as never;
    useAppStore.setState({ queue: makeHeldQueue() } as never);
    await useAppStore.getState().cancelItemDownload('held1');
    expect(api.downloads.cancel).not.toHaveBeenCalled();
    expect(useAppStore.getState().queue.find((i) => i.id === 'held1')?.status).toBe('cancelled');
  });

  it('cancelItemDownload on a real paused job DOES call IPC', async () => {
    const api = buildMockApi();
    window.appApi = api as never;
    const queue = makeHeldQueue();
    queue[0].downloadJobId = 'job-1';
    useAppStore.setState({ queue } as never);
    await useAppStore.getState().cancelItemDownload('held1');
    expect(api.downloads.cancel).toHaveBeenCalledOnce();
  });
});

describe('D5 — drawer countdown banner', () => {
  it('renders banner with remaining seconds when interJobSleepEndsAt is in the future', () => {
    window.appApi = buildMockApi() as never;
    useAppStore.setState({
      interJobSleepEndsAt: Date.now() + 2500,
      drawerOpen: true,
      queue: []
    } as never);
    render(<SmartDrawer />);
    const banner = screen.getByTestId('inter-job-sleep-banner');
    expect(banner.textContent).toMatch(/\d/);
  });

  it('omits banner when interJobSleepEndsAt is null', () => {
    window.appApi = buildMockApi() as never;
    useAppStore.setState({ interJobSleepEndsAt: null, drawerOpen: true, queue: [] } as never);
    render(<SmartDrawer />);
    expect(screen.queryByTestId('inter-job-sleep-banner')).not.toBeInTheDocument();
  });

  it('renders per-item countdown hint on the next-pending card', () => {
    window.appApi = buildMockApi() as never;
    useAppStore.setState({
      interJobSleepEndsAt: Date.now() + 2500,
      drawerOpen: true,
      queue: [
        {
          id: 'done1',
          url: '',
          title: 'done',
          thumbnail: '',
          outputDir: '/tmp',
          formatId: '22',
          formatLabel: 'best',
          preset: 'custom',
          status: 'done',
          progressPercent: 100,
          progressDetail: null,
          lastStatus: null,
          error: null,
          finishedAt: '2026-01-01',
          downloadJobId: null,
          subtitleLanguages: [],
          writeAutoSubs: false,
          subtitleMode: 'sidecar',
          subtitleFormat: 'srt',
          sponsorBlockMode: 'off',
          sponsorBlockCategories: [],
          embedChapters: false,
          embedMetadata: false,
          embedThumbnail: false,
          writeDescription: false,
          writeThumbnail: false
        },
        {
          id: 'next1',
          url: '',
          title: 'next',
          thumbnail: '',
          outputDir: '/tmp',
          formatId: '22',
          formatLabel: 'best',
          preset: 'custom',
          status: 'pending',
          progressPercent: 0,
          progressDetail: null,
          lastStatus: null,
          error: null,
          finishedAt: null,
          downloadJobId: null,
          subtitleLanguages: [],
          writeAutoSubs: false,
          subtitleMode: 'sidecar',
          subtitleFormat: 'srt',
          sponsorBlockMode: 'off',
          sponsorBlockCategories: [],
          embedChapters: false,
          embedMetadata: false,
          embedThumbnail: false,
          writeDescription: false,
          writeThumbnail: false
        },
        {
          id: 'next2',
          url: '',
          title: 'second-next',
          thumbnail: '',
          outputDir: '/tmp',
          formatId: '22',
          formatLabel: 'best',
          preset: 'custom',
          status: 'pending',
          progressPercent: 0,
          progressDetail: null,
          lastStatus: null,
          error: null,
          finishedAt: null,
          downloadJobId: null,
          subtitleLanguages: [],
          writeAutoSubs: false,
          subtitleMode: 'sidecar',
          subtitleFormat: 'srt',
          sponsorBlockMode: 'off',
          sponsorBlockCategories: [],
          embedChapters: false,
          embedMetadata: false,
          embedThumbnail: false,
          writeDescription: false,
          writeThumbnail: false
        }
      ]
    } as never);
    render(<SmartDrawer />);
    const hints = screen.queryAllByTestId('queue-item-sleep-hint');
    // Only the FIRST pending card gets the hint.
    expect(hints.length).toBe(1);
  });

  it('omits banner when remaining seconds <= 0', () => {
    window.appApi = buildMockApi() as never;
    useAppStore.setState({
      interJobSleepEndsAt: Date.now() - 1000,
      drawerOpen: true,
      queue: []
    } as never);
    act(() => {
      render(<SmartDrawer />);
    });
    expect(screen.queryByTestId('inter-job-sleep-banner')).not.toBeInTheDocument();
  });
});
