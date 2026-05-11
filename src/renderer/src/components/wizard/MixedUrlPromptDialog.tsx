import { useEffect, useRef, type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog.js';
import { Button } from '../ui/button.js';
import { useAppStore } from '../../store/useAppStore.js';

// Mixed YouTube URLs (?v=X&list=Y) are ambiguous: yt-dlp's default routes
// Radio/Mix lists to playlist enumeration, which rarely matches user intent
// (they clicked a specific video). The wizardSlice opens this dialog before
// probing whenever it detects the mixed pattern; the user's choice flows
// through to the probe IPC as `playlistMode: 'video' | 'playlist'`.
export function MixedUrlPromptDialog(): JSX.Element {
  const { t } = useTranslation();
  const { mixedUrlPromptOpen, dismissMixedPrompt } = useAppStore();
  const playlistButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (mixedUrlPromptOpen) playlistButtonRef.current?.focus();
  }, [mixedUrlPromptOpen]);

  return (
    <Dialog open={mixedUrlPromptOpen} onOpenChange={() => undefined}>
      <DialogContent>
        <DialogTitle>{t('wizard.mixedPrompt.title')}</DialogTitle>
        <DialogDescription>{t('wizard.mixedPrompt.body')}</DialogDescription>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => void dismissMixedPrompt('video')}>
            {t('wizard.mixedPrompt.singleVideo')}
          </Button>
          <Button ref={playlistButtonRef} type="button" variant="outline" onClick={() => void dismissMixedPrompt('playlist')}>
            {t('wizard.mixedPrompt.pickFromPlaylist')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
