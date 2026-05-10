// WizardCommands — orchestrator helpers that span multiple wizard slices.
// Currently houses `resetAll`, applied via the `reset` action on the probe
// orchestrator slice. New cross-slice commands (e.g. snapshot replay, deep
// links) land here so individual slice files stay focused on their domain.

import type { SetState } from '../types.js';
import { RESET_WIZARD_STATE } from './probeOrchestrator.js';

export const WizardCommands = {
  resetAll(set: SetState): void {
    set(RESET_WIZARD_STATE);
  }
};
