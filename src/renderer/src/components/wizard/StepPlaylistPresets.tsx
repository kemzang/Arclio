import { type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import type { PlaylistPreset } from '@shared/schemas.js';
import { useAppStore } from '../../store/useAppStore.js';
import { Button } from '../ui/button.js';
import { Item, ItemContent, ItemDescription, ItemGroup, ItemSeparator, ItemTitle } from '../ui/item.js';
import { ScrollArea } from '../ui/scroll-area.js';
import { WizardFooter } from './WizardFooter.js';
import { cn } from '@renderer/lib/utils.js';

const VIDEO_PRESETS: PlaylistPreset[] = ['video-best', 'video-2160p', 'video-1440p', 'video-1080p', 'video-720p', 'video-480p', 'video-360p'];
const AUDIO_PRESETS: PlaylistPreset[] = ['audio-best', 'audio-mp3'];

export function StepPlaylistPresets(): JSX.Element {
  const { t } = useTranslation();
  const { selectedPlaylistPreset, setPlaylistPreset, advance, back, skipToConfirm, selectedPlaylistItemIds } = useAppStore();

  function renderItem(p: PlaylistPreset): JSX.Element {
    const selected = selectedPlaylistPreset === p;
    return (
      <Item
        key={p}
        variant="outline"
        role="button"
        tabIndex={0}
        aria-pressed={selected}
        onClick={() => setPlaylistPreset(p)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setPlaylistPreset(p);
          }
        }}
        className={cn('cursor-pointer hover:bg-muted/40', selected && 'border-primary bg-primary/5 ring-1 ring-primary')}
      >
        <ItemContent>
          <ItemTitle>{t(`playlistPresets.${p}.label` as const)}</ItemTitle>
          <ItemDescription>{t(`playlistPresets.${p}.desc` as const)}</ItemDescription>
        </ItemContent>
      </Item>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3 px-4 py-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">{t('wizard.playlistPresets.heading')}</h2>
        <span className="shrink-0 text-xs text-muted-foreground">{t('wizard.playlistPresets.itemCount_other', { count: selectedPlaylistItemIds.length })}</span>
      </div>
      <p className="text-xs text-muted-foreground">{t('wizard.playlistPresets.subhead')}</p>

      <ScrollArea className="h-[calc(100vh-280px)] min-h-[300px]">
        <div className="p-1">
          <ItemGroup className="grid grid-cols-2 gap-2 md:grid-cols-3">{VIDEO_PRESETS.map(renderItem)}</ItemGroup>
          <ItemSeparator />
          <ItemGroup className="grid grid-cols-2 gap-2 md:grid-cols-3">{AUDIO_PRESETS.map(renderItem)}</ItemGroup>
        </div>
      </ScrollArea>

      <WizardFooter>
        <Button variant="ghost" type="button" onClick={back} className="border-[1.5px] border-[var(--border-strong)] text-muted-foreground hover:text-foreground">
          {t('common.back')}
        </Button>
        <Button type="button" disabled={selectedPlaylistPreset === null} onClick={advance} className="shadow-[0_4px_14px_var(--brand-glow)]">
          {t('common.continue')}
        </Button>
        <Button type="button" disabled={selectedPlaylistPreset === null} onClick={skipToConfirm} title={t('wizard.formats.skipToConfirmTooltip')} className="shadow-[0_4px_14px_var(--brand-glow)]">
          {t('wizard.formats.skipToConfirm')}
        </Button>
      </WizardFooter>
    </div>
  );
}
