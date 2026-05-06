import type { PlaylistPreset, Preset } from '@shared/types';
import { playlistPresetSpec } from '@shared/playlistPresets';
import { presetProducesMedia, presetProducesVideo } from '@shared/presetTraits';
import type { WizardMode, WizardStep } from '../../store/types';

export type VisibleStep = Exclude<WizardStep, 'error'>;

export interface StepContext {
  activePreset: Preset | null;
  wizardMode: WizardMode;
  selectedPlaylistPreset: PlaylistPreset | null;
}

// Per-step applicable predicates. Single source of truth — used by both the
// renderer (stepRegistry) and the navigation logic (wizardSlice advance/back).
// Pure module: imports nothing React-side, so wizardSlice can safely import
// it without pulling components into the store's import cycle.
export const STEP_APPLICABLE: Record<VisibleStep, (ctx: StepContext) => boolean> = {
  url: () => true,
  playlistItems: ({ wizardMode }) => wizardMode === 'playlist',
  playlistPresets: ({ wizardMode }) => wizardMode === 'playlist',
  formats: ({ wizardMode }) => wizardMode !== 'playlist',
  // Playlist-mode skips subtitles once a preset is locked in.
  subtitles: ({ wizardMode, selectedPlaylistPreset }) => !(wizardMode === 'playlist' && !!selectedPlaylistPreset),
  sponsorblock: ({ wizardMode, selectedPlaylistPreset, activePreset }) => {
    if (wizardMode === 'playlist' && selectedPlaylistPreset) return playlistPresetSpec(selectedPlaylistPreset).producesVideo;
    if (activePreset && !presetProducesVideo(activePreset)) return false;
    return true;
  },
  output: ({ wizardMode, selectedPlaylistPreset, activePreset }) => {
    if (wizardMode === 'playlist' && selectedPlaylistPreset) return true;
    if (activePreset && !presetProducesMedia(activePreset)) return false;
    return true;
  },
  folder: () => true,
  confirm: () => true
};

export const STEPS: VisibleStep[] = ['url', 'playlistItems', 'playlistPresets', 'formats', 'subtitles', 'sponsorblock', 'output', 'folder', 'confirm'];

export function shouldSkip(step: VisibleStep, ctx: StepContext): boolean {
  return !STEP_APPLICABLE[step](ctx);
}
