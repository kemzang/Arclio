// WizardDialogs slice — transient UI flags that gate the wizard's modal
// interruptions (mixed-URL prompt, advanced auto-open, cookies-config dialog).
// All of these are session-only (not persisted) and reset to defaults when
// the wizard reset fires.

import type { GetState, SetState, WizardDialogsSlice } from '../types.js';

export function createWizardDialogsSlice(set: SetState, _get: GetState): WizardDialogsSlice {
  return {
    mixedUrlPromptOpen: false,
    mixedUrlPending: null,
    advancedAutoOpen: false,
    cookiesConfigDialogIssue: null,

    setAdvancedAutoOpen: (open) => set({ advancedAutoOpen: open }),

    dismissCookiesConfigDialog: () => {
      set({ cookiesConfigDialogIssue: null });
    }
  };
}
