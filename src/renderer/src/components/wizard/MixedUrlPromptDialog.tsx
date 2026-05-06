import { type JSX, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { useAppStore } from '../../store/useAppStore';

export function MixedUrlPromptDialog(): JSX.Element {
  const { t } = useTranslation();
  const { mixedUrlPromptOpen, dismissMixedPrompt } = useAppStore();
  const playlistButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <Dialog open={mixedUrlPromptOpen} onOpenChange={() => undefined}>
      <DialogContent showCloseButton={false} initialFocus={() => playlistButtonRef.current}>
        <DialogHeader>
          <DialogTitle>{t('wizard.mixedPrompt.title')}</DialogTitle>
          <DialogDescription>{t('wizard.mixedPrompt.body')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => void dismissMixedPrompt('video')}>
            {t('wizard.mixedPrompt.singleVideo')}
          </Button>
          <Button ref={playlistButtonRef} type="button" variant="outline" onClick={() => void dismissMixedPrompt('playlist')}>
            {t('wizard.mixedPrompt.wholePlaylist')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
