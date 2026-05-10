import { create } from 'zustand';
import { createProbeOrchestratorSlice } from './wizard/probeOrchestrator.js';
import { createFormatPickerSlice } from './wizard/formatPicker.js';
import { createOutputConfigSlice } from './wizard/outputConfig.js';
import { createWizardDialogsSlice } from './wizard/wizardDialogs.js';
import { createQueueSlice } from './queueSlice.js';
import { createUiSlice } from './uiSlice.js';
import { createSystemSlice } from './systemSlice.js';
import { createJobScheduler } from './jobScheduler.js';
import type { AppState } from './types.js';

export const useAppStore = create<AppState>()((set, get) => {
  const scheduler = createJobScheduler(set, get);
  return {
    ...createSystemSlice(set, get, scheduler),
    ...createUiSlice(set, get),
    ...createProbeOrchestratorSlice(set, get),
    ...createFormatPickerSlice(set, get),
    ...createOutputConfigSlice(set, get),
    ...createWizardDialogsSlice(set, get),
    ...createQueueSlice(set, get, scheduler)
  };
});

// Re-export pure helpers so existing import paths
// (`import { foo } from '../store/useAppStore.js'`) keep working without churn
// in component files.
export { presetLabel, presetOptions, groupVideoFormats, resolveAudioLabel, resolveVideoResolution, formatStatus, formatLocalizedError, formatError } from './helpers.js';
