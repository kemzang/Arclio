import { create } from 'zustand';
import { createWizardSlice } from './wizardSlice';
import { createQueueSlice } from './queueSlice';
import { createUiSlice } from './uiSlice';
import { createSystemSlice } from './systemSlice';
import { createJobScheduler } from './jobScheduler';
import type { AppState } from './types';

export const useAppStore = create<AppState>()((set, get) => {
  const scheduler = createJobScheduler(set, get);
  return {
    ...createSystemSlice(set, get, scheduler),
    ...createUiSlice(set, get),
    ...createWizardSlice(set, get),
    ...createQueueSlice(set, get, scheduler)
  };
});

// Re-export pure helpers so existing import paths
// (`import { foo } from '../store/useAppStore'`) keep working without churn
// in component files.
export { presetLabel, presetOptions, groupVideoFormats, resolveAudioLabel, resolveVideoResolution, formatStatus, formatLocalizedError, formatError } from './helpers';
