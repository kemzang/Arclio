// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppStore } from '@renderer/store/useAppStore.js';
import type { StatusEvent } from '@shared/types.js';
import { makeItem, makeJob, ok } from '../shared/fixtures.js';

describe('Queue parallel/sequential download behavior', () => {
  let startMock: ReturnType<typeof vi.fn>;
  let capturedOnStatus: ((event: StatusEvent) => void) | null = null;

  beforeEach(() => {
    capturedOnStatus = null;
    startMock = vi.fn();

    useAppStore.setState({
      initialized: false,
      initializing: false,
      settings: {
        common: { defaultOutputDir: '/tmp', rememberLastOutputDir: false, clipboardWatchEnabled: false },
        single: {},
        playlist: {}
      },
      wizardStep: 'url',
      formatsLoading: false,
      wizardUrl: '',
      wizardTitle: '',
      wizardThumbnail: '',
      wizardFormats: [],
      selectedVideoFormatId: '',
      audioSelection: { kind: 'none' },
      activePreset: null,
      wizardOutputDir: '/tmp',
      wizardError: null,
      wizardErrorOrigin: null,
      queue: []
    });

    window.appApi = {
      app: {
        warmUp: vi.fn().mockResolvedValue(ok({ completed: true, failures: [] })),
        setLanguage: vi.fn().mockResolvedValue(undefined)
      },
      downloads: {
        start: startMock,
        cancel: vi.fn().mockResolvedValue(ok({ cancelled: true })),
        probe: vi.fn()
      },
      settings: {
        get: vi.fn().mockResolvedValue(ok({ common: { defaultOutputDir: '/tmp', rememberLastOutputDir: false, clipboardWatchEnabled: false }, single: {}, playlist: {} })),
        update: vi.fn().mockResolvedValue(ok({}))
      },
      shell: { openFolder: vi.fn(), openExternal: vi.fn() },
      logs: { openDir: vi.fn() },
      dialog: { chooseFolder: vi.fn() },
      events: {
        onStatus: vi.fn().mockImplementation((cb: (event: StatusEvent) => void) => {
          capturedOnStatus = cb;
          return () => undefined;
        }),
        onProgress: vi.fn().mockReturnValue(() => undefined),
        onClipboardUrl: vi.fn().mockReturnValue(() => undefined),
        onWarmupProgress: vi.fn().mockReturnValue(() => undefined)
      },
      queue: {
        save: vi.fn().mockResolvedValue({ ok: true, data: { saved: true } }),
        load: vi.fn().mockResolvedValue({ ok: true, data: [] })
      },
      analytics: {
        track: vi.fn()
      },
      diagnostics: { logWizardStep: vi.fn() }
    } as never;
  });

  it('"Download" button on pending card starts immediately even while another is downloading', async () => {
    useAppStore.setState({
      queue: [
        makeItem({
          id: 'item-1',
          status: 'downloading',
          downloadJobId: 'job-1',
          progressPercent: 50
        }),
        makeItem({ id: 'item-2', status: 'pending' })
      ]
    });

    startMock.mockResolvedValue(ok({ job: makeJob('job-2') }));

    await useAppStore.getState().startItemDownload('item-2');

    expect(startMock).toHaveBeenCalledOnce();
    expect(startMock).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://youtube.com/watch?v=item-2' }));
    expect(useAppStore.getState().queue.find((i) => i.id === 'item-2')?.status).toBe('downloading');
  });

  it('"Add + Download Now" starts the new item immediately even while another is downloading', async () => {
    useAppStore.setState({
      queue: [
        makeItem({
          id: 'item-1',
          status: 'downloading',
          downloadJobId: 'job-1',
          progressPercent: 30
        })
      ],
      wizardUrl: 'https://youtube.com/watch?v=item-2',
      wizardTitle: 'Video 2',
      wizardFormats: [
        {
          formatId: '22',
          label: '720p',
          ext: 'mp4',
          resolution: '720p',
          isVideoOnly: false,
          isAudioOnly: false
        }
      ],
      selectedVideoFormatId: '22',
      audioSelection: { kind: 'none' },
      activePreset: null,
      wizardOutputDir: '/tmp',
      wizardStep: 'confirm',
      initialized: true
    });

    startMock.mockResolvedValue(ok({ job: makeJob('job-2') }));

    await useAppStore.getState().addAndDownloadImmediately();

    expect(startMock).toHaveBeenCalledOnce();
    expect(startMock).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://youtube.com/watch?v=item-2' }));
  });

  it('playlist "Add + Download Now" starts the first selected item immediately even while another is downloading', async () => {
    useAppStore.setState({
      queue: [
        makeItem({
          id: 'item-1',
          status: 'downloading',
          downloadJobId: 'job-1',
          progressPercent: 30
        })
      ],
      wizardMode: 'playlist',
      playlistItems: [
        { id: 'p1', url: 'https://youtube.com/watch?v=p1', title: 'P1', thumbnail: '', playlistIndex: 1 },
        { id: 'p2', url: 'https://youtube.com/watch?v=p2', title: 'P2', thumbnail: '', playlistIndex: 2 }
      ],
      selectedPlaylistItemIds: ['p1', 'p2'],
      selectedPlaylistPreset: 'video-1080p',
      playlistTitle: 'Playlist',
      wizardOutputDir: '/tmp',
      wizardStep: 'confirm',
      initialized: true
    });

    startMock.mockResolvedValue(ok({ job: makeJob('job-2') }));

    await useAppStore.getState().addAndDownloadImmediately();

    expect(startMock).toHaveBeenCalledOnce();
    expect(startMock).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://youtube.com/watch?v=p1' }));
    const queue = useAppStore.getState().queue;
    expect(queue.find((item) => item.url === 'https://youtube.com/watch?v=p1')?.status).toBe('downloading');
    expect(queue.find((item) => item.url === 'https://youtube.com/watch?v=p2')?.status).toBe('pending');
  });

  it('when a download completes, only ONE pending item starts (sequential queue)', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      await useAppStore.getState().initialize();

      useAppStore.setState({
        queue: [
          makeItem({
            id: 'item-1',
            status: 'downloading',
            downloadJobId: 'job-1',
            progressPercent: 100
          }),
          makeItem({ id: 'item-2', status: 'pending' }),
          makeItem({ id: 'item-3', status: 'pending' })
        ]
      });

      startMock.mockResolvedValue(ok({ job: makeJob('job-2') }));

      capturedOnStatus!({
        jobId: 'job-1',
        stage: 'done',
        statusKey: 'complete',
        at: new Date().toISOString()
      });

      // Inter-job sleep is 3000ms; advance past it so the JobScheduler timer fires.
      await vi.advanceTimersByTimeAsync(3100);

      // Sequential: only item-2 (the first pending) should start, not item-3
      expect(startMock).toHaveBeenCalledTimes(1);
      expect(startMock).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://youtube.com/watch?v=item-2' }));
    } finally {
      vi.useRealTimers();
    }
  });
});
