// @vitest-environment jsdom
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StepUrlInput } from '@renderer/components/wizard/StepUrlInput.js';
import { useAppStore } from '@renderer/store/useAppStore.js';
import { buildMockAppApi } from '../shared/mockAppApi.js';
import type { AppApi, SettingsPatch } from '@shared/api.js';
import type { AppSettings } from '@shared/types.js';
import { ok } from '../shared/fixtures.js';

const SINGLE_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
const PLAYLIST_URL = 'https://www.youtube.com/playlist?list=PLabc';
const MIXED_URL = 'https://www.youtube.com/watch?v=abc&list=PLabc';

let mockApi: AppApi;

function buildSettings(common: Partial<AppSettings['common']> = {}): AppSettings {
  return {
    common: {
      defaultOutputDir: '/tmp',
      rememberLastOutputDir: false,
      clipboardWatchEnabled: false,
      cookiesMode: 'off',
      cookiesPath: '',
      ...common
    },
    single: {},
    playlist: {}
  };
}

function resetStore(settings: AppSettings): void {
  useAppStore.setState({
    initialized: true,
    initializing: false,
    settings,
    wizardStep: 'url',
    wizardMode: 'single',
    formatsLoading: false,
    playlistProbeLoading: false,
    wizardUrl: '',
    wizardTitle: '',
    wizardThumbnail: '',
    wizardDuration: undefined,
    wizardFormats: [],
    wizardFormatsDegraded: null,
    advancedAutoOpen: false,
    selectedVideoFormatId: '',
    audioSelection: { kind: 'none' },
    lastConvertBitrate: 192,
    activePreset: null,
    wizardOutputDir: '',
    wizardError: null,
    wizardErrorOrigin: null,
    wizardSubtitles: {},
    wizardAutomaticCaptions: {},
    wizardSubtitleLanguages: [],
    wizardSubtitleSkipped: false,
    wizardSubtitleMode: 'sidecar',
    wizardSubtitleFormat: 'srt',
    wizardSubfolderEnabled: false,
    wizardSubfolderName: '',
    wizardSponsorBlockMode: 'off',
    wizardSponsorBlockCategories: ['sponsor', 'selfpromo'],
    wizardEmbedChapters: true,
    wizardEmbedMetadata: true,
    wizardEmbedThumbnail: false,
    wizardWriteDescription: false,
    wizardWriteThumbnail: false,
    playlistItems: [],
    selectedPlaylistItemIds: [],
    playlistTitle: '',
    playlistId: '',
    mixedUrlPromptOpen: false,
    mixedUrlPending: null,
    cookiesConfigDialogIssue: null,
    selectedPlaylistPreset: null,
    queue: [],
    drawerOpen: false
  });
}

beforeEach(() => {
  mockApi = buildMockAppApi();
  mockApi.settings.update = vi.fn(async (input: SettingsPatch) => {
    const current = useAppStore.getState().settings ?? buildSettings();
    const next: AppSettings = {
      common: { ...current.common, ...(input.common ?? {}) },
      single: { ...current.single, ...(input.single ?? {}) },
      playlist: { ...current.playlist, ...(input.playlist ?? {}) }
    };
    return ok(next);
  });
  mockApi.downloads.getPlaylistItems = vi.fn().mockResolvedValue(ok({ playlistId: 'PLabc', playlistTitle: 'Test Playlist', entries: [] }));
  window.appApi = mockApi;
  window.platform = 'linux';
  resetStore(buildSettings());
});

describe('incomplete cookies config guard', () => {
  it('blocks fetch and opens a modal when file mode has no path', async () => {
    resetStore(buildSettings({ cookiesMode: 'file', cookiesPath: '   ' }));
    render(<StepUrlInput />);

    fireEvent.change(screen.getByTestId('url-input'), { target: { value: SINGLE_URL } });
    fireEvent.click(screen.getByTestId('btn-find-formats'));

    expect(await screen.findByTestId('cookies-config-dialog')).toBeInTheDocument();
    expect(mockApi.downloads.getFormats).not.toHaveBeenCalled();
    expect(useAppStore.getState().wizardStep).toBe('url');
    expect(useAppStore.getState().cookiesConfigDialogIssue).toBe('file-missing-path');
  });

  it('blocks fetch and opens a modal when browser mode has no browser', async () => {
    resetStore(buildSettings({ cookiesMode: 'browser' }));
    render(<StepUrlInput />);

    fireEvent.change(screen.getByTestId('url-input'), { target: { value: SINGLE_URL } });
    fireEvent.click(screen.getByTestId('btn-find-formats'));

    expect(await screen.findByTestId('cookies-config-dialog')).toBeInTheDocument();
    expect(mockApi.downloads.getFormats).not.toHaveBeenCalled();
    expect(useAppStore.getState().cookiesConfigDialogIssue).toBe('browser-missing-selection');
  });

  it('opens the Advanced cookies section from the modal primary action', async () => {
    resetStore(buildSettings({ cookiesMode: 'file', cookiesPath: '' }));
    render(<StepUrlInput />);

    fireEvent.change(screen.getByTestId('url-input'), { target: { value: SINGLE_URL } });
    fireEvent.click(screen.getByTestId('btn-find-formats'));

    const advanced = screen.getByTestId('advanced-section');
    if (!(advanced instanceof HTMLDetailsElement)) {
      throw new Error('advanced section should render as <details>');
    }
    expect(advanced.open).toBe(false);

    fireEvent.click(await screen.findByTestId('cookies-config-dialog-open-settings'));

    await waitFor(() => {
      expect(advanced.open).toBe(true);
    });
    expect(screen.queryByTestId('cookies-config-dialog')).not.toBeInTheDocument();
  });

  it('clears the dialog issue when dismissed via Cancel and re-blocks submit until config is fixed', async () => {
    resetStore(buildSettings({ cookiesMode: 'file', cookiesPath: '' }));
    render(<StepUrlInput />);

    fireEvent.change(screen.getByTestId('url-input'), { target: { value: SINGLE_URL } });
    fireEvent.click(screen.getByTestId('btn-find-formats'));

    expect(await screen.findByTestId('cookies-config-dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('cookies-config-dialog-cancel'));

    await waitFor(() => {
      expect(screen.queryByTestId('cookies-config-dialog')).not.toBeInTheDocument();
    });
    expect(useAppStore.getState().cookiesConfigDialogIssue).toBeNull();
    expect(mockApi.downloads.getFormats).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('btn-find-formats'));

    expect(await screen.findByTestId('cookies-config-dialog')).toBeInTheDocument();
    expect(useAppStore.getState().cookiesConfigDialogIssue).toBe('file-missing-path');
    expect(useAppStore.getState().wizardStep).toBe('url');
    expect(mockApi.downloads.getFormats).not.toHaveBeenCalled();
  });

  it('clears the dialog issue when dismissed via ESC and keeps submit blocked', async () => {
    resetStore(buildSettings({ cookiesMode: 'browser' }));
    render(<StepUrlInput />);

    fireEvent.change(screen.getByTestId('url-input'), { target: { value: SINGLE_URL } });
    fireEvent.click(screen.getByTestId('btn-find-formats'));

    const dialog = await screen.findByTestId('cookies-config-dialog');
    fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByTestId('cookies-config-dialog')).not.toBeInTheDocument();
    });
    expect(useAppStore.getState().cookiesConfigDialogIssue).toBeNull();
    expect(useAppStore.getState().wizardStep).toBe('url');
    expect(mockApi.downloads.getFormats).not.toHaveBeenCalled();
  });

  it('does not block playlist URLs with incomplete cookies config', async () => {
    resetStore(buildSettings({ cookiesMode: 'file', cookiesPath: '' }));

    useAppStore.getState().setWizardUrl(PLAYLIST_URL);
    await useAppStore.getState().submitUrl();

    expect(mockApi.downloads.getPlaylistItems).toHaveBeenCalledWith({ url: PLAYLIST_URL });
    expect(useAppStore.getState().cookiesConfigDialogIssue).toBeNull();
    expect(useAppStore.getState().wizardStep).toBe('playlistItems');
  });

  it('blocks the mixed-url single-video branch before probing', async () => {
    resetStore(buildSettings({ cookiesMode: 'browser' }));

    useAppStore.getState().setWizardUrl(MIXED_URL);
    await useAppStore.getState().submitUrl();
    expect(useAppStore.getState().mixedUrlPromptOpen).toBe(true);

    await act(async () => {
      await useAppStore.getState().dismissMixedPrompt('video');
    });

    expect(useAppStore.getState().mixedUrlPromptOpen).toBe(false);
    expect(useAppStore.getState().cookiesConfigDialogIssue).toBe('browser-missing-selection');
    expect(mockApi.downloads.getFormats).not.toHaveBeenCalled();
  });
});
