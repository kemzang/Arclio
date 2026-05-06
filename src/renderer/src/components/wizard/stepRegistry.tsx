import type { JSX } from 'react';
import { STEP_APPLICABLE, STEPS, type StepContext, type VisibleStep } from './stepNavigation';
import { StepUrlInput } from './StepUrlInput';
import { StepPlaylistItems } from './StepPlaylistItems';
import { StepPlaylistPresets } from './StepPlaylistPresets';
import { StepFormatSelect } from './StepFormatSelect';
import { StepSubtitles } from './StepSubtitles';
import { StepSponsorBlock } from './StepSponsorBlock';
import { StepOutput } from './StepOutput';
import { StepFolderConfirm } from './StepFolderConfirm';
import { StepConfirm } from './StepConfirm';

export interface StepDescriptor {
  id: VisibleStep;
  render(): JSX.Element;
  applicable(ctx: StepContext): boolean;
}

const RENDER_BY_STEP: Record<VisibleStep, () => JSX.Element> = {
  url: () => <StepUrlInput />,
  playlistItems: () => <StepPlaylistItems />,
  playlistPresets: () => <StepPlaylistPresets />,
  formats: () => <StepFormatSelect />,
  subtitles: () => <StepSubtitles />,
  sponsorblock: () => <StepSponsorBlock />,
  output: () => <StepOutput />,
  folder: () => <StepFolderConfirm />,
  confirm: () => <StepConfirm />
};

export const STEP_REGISTRY: StepDescriptor[] = STEPS.map((id) => ({
  id,
  render: RENDER_BY_STEP[id],
  applicable: STEP_APPLICABLE[id]
}));
