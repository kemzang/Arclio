import { type JSX, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useAppStore } from '../../store/useAppStore.js';
import { Button } from '../ui/button.js';
import { Checkbox } from '../ui/checkbox.js';
import { Input } from '../ui/input.js';
import { Separator } from '../ui/separator.js';

function formatDuration(seconds: number | undefined, liveLabel: string): string {
  if (seconds === undefined || seconds === 0) return liveLabel;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function StepPlaylistItems(): JSX.Element {
  const { t } = useTranslation();
  const { playlistItems, selectedPlaylistItemIds, playlistTitle, playlistProbeLoading, setPlaylistItemSelected, selectAllPlaylistItems, selectNonePlaylistItems, selectPlaylistRange, confirmPlaylistSelection, back } = useAppStore();

  const [rangeFrom, setRangeFrom] = useState('');
  const [rangeTo, setRangeTo] = useState('');

  const parentRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: playlistItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 5
  });

  const selectedCount = selectedPlaylistItemIds.length;
  const canContinue = selectedCount > 0;

  function applyRange(): void {
    const from = parseInt(rangeFrom, 10);
    const to = parseInt(rangeTo, 10);
    if (!isNaN(from) && !isNaN(to)) selectPlaylistRange(from, to);
  }

  const liveLabel = t('wizard.playlist.durationUnknown');

  return (
    <div className="flex h-full flex-col gap-3 px-4 py-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold truncate">{playlistTitle || t('wizard.playlist.heading')}</h2>
        <span className="shrink-0 text-xs text-muted-foreground">{t('wizard.playlist.itemCount_other', { count: playlistItems.length })}</span>
      </div>

      {playlistProbeLoading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">{t('wizard.playlist.loadingItems')}</div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={selectAllPlaylistItems}>
              {t('wizard.playlist.selectAll')}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={selectNonePlaylistItems}>
              {t('wizard.playlist.selectNone')}
            </Button>
            <div className="ml-auto flex items-center gap-1">
              <span className="text-xs text-muted-foreground">{t('wizard.playlist.rangeFrom')}</span>
              <Input className="h-7 w-14 px-2 text-xs" value={rangeFrom} onChange={(e) => setRangeFrom(e.target.value)} placeholder="1" />
              <span className="text-xs text-muted-foreground">{t('wizard.playlist.rangeTo')}</span>
              <Input className="h-7 w-14 px-2 text-xs" value={rangeTo} onChange={(e) => setRangeTo(e.target.value)} placeholder="10" />
              <Button type="button" variant="outline" size="sm" onClick={applyRange}>
                {t('wizard.playlist.rangeApply')}
              </Button>
            </div>
          </div>

          <div ref={parentRef} className="h-[calc(100vh-280px)] min-h-[300px] overflow-y-auto rounded-md border border-border">
            <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const entry = playlistItems[virtualRow.index];
                const checked = selectedPlaylistItemIds.includes(entry.id);
                return (
                  <div
                    key={entry.id}
                    role="checkbox"
                    aria-checked={checked}
                    tabIndex={0}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    style={{ position: 'absolute', top: virtualRow.start, left: 0, right: 0 }}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 cursor-pointer"
                    onClick={() => setPlaylistItemSelected(entry.id, !checked)}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') setPlaylistItemSelected(entry.id, !checked);
                    }}
                  >
                    <Checkbox checked={checked} onCheckedChange={(v) => setPlaylistItemSelected(entry.id, !!v)} onClick={(e) => e.stopPropagation()} />
                    {entry.thumbnail ? <img src={entry.thumbnail} alt={t('wizard.playlist.thumbnailAlt')} className="h-8 w-[56px] shrink-0 rounded-sm object-cover" loading="lazy" /> : <div className="h-8 w-[56px] shrink-0 rounded-sm bg-muted" />}
                    <span className="flex-1 truncate text-sm">{entry.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatDuration(entry.duration, liveLabel)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedCount > 0 ? <p className="text-xs text-muted-foreground">{t('wizard.playlist.selectedCount_other', { count: selectedCount })}</p> : <p className="text-xs text-destructive">{t('wizard.playlist.noSelection')}</p>}
        </>
      )}

      <div className="sticky bottom-0 -mx-6 px-6 bg-background z-10">
        <Separator className="bg-border/50 -mx-6 w-auto my-1.5" />
        <div className="flex items-center justify-end py-3 -mx-6 px-6 gap-2">
          <Button variant="ghost" type="button" onClick={back} className="border-[1.5px] border-[var(--border-strong)] text-muted-foreground hover:text-foreground">
            {t('common.back')}
          </Button>
          <Button type="button" disabled={!canContinue} onClick={() => void confirmPlaylistSelection()} className="shadow-[0_4px_14px_var(--brand-glow)]">
            {t('common.continue')}
          </Button>
        </div>
      </div>
    </div>
  );
}
