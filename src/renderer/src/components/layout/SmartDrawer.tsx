import type { JSX } from 'react';
import { useEffect, useMemo, useRef } from 'react';
import { ChevronDown, Gauge, Inbox, Pause, Play, Share2, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { isHighValueDownload } from '@shared/queueItem.js';
import { useAppStore, formatStatus } from '../../store/useAppStore.js';
import { QueueItemCard } from '../queue/QueueItemCard.js';
import { QueueTipNudge } from '../queue/QueueTipNudge.js';
import { Badge } from '../ui/badge.js';
import { ScrollArea } from '../ui/scroll-area.js';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover.js';
import { LimitRatePicker } from '../shared/LimitRatePicker.js';
import { formatLimitRateLabel } from '../shared/limitRateFormat.js';
import { track } from '../../lib/analytics.js';

export function SmartDrawer(): JSX.Element {
  const { t } = useTranslation();
  const queue = useAppStore((s) => s.queue);
  const drawerOpen = useAppStore((s) => s.drawerOpen);
  const setDrawerOpen = useAppStore((s) => s.setDrawerOpen);
  const showQueueTip = useAppStore((s) => s.showQueueTip);
  const dismissQueueTip = useAppStore((s) => s.dismissQueueTip);
  const clearCompleted = useAppStore((s) => s.clearCompleted);
  const pauseAll = useAppStore((s) => s.pauseAll);
  const resumeFirst = useAppStore((s) => s.resumeFirst);
  const cancelAll = useAppStore((s) => s.cancelAll);
  const shareHighValueBannerDismissed = useAppStore((s) => s.settings?.common?.shareHighValueBannerDismissed ?? false);
  const openShareDialog = useAppStore((s) => s.openShareDialog);
  const setShareHighValueBannerDismissed = useAppStore((s) => s.setShareHighValueBannerDismissed);
  const limitRateRaw = useAppStore((s) => s.settings?.common?.limitRate);
  const limitRate = limitRateRaw && limitRateRaw.trim() !== '' ? limitRateRaw : undefined;
  const setLimitRate = useAppStore((s) => s.setLimitRate);

  const orderedQueue = useMemo(() => {
    const finished = (s: string): boolean => s === 'done' || s === 'cancelled';
    const active = queue.filter((i) => !finished(i.status));
    const done = queue.filter((i) => finished(i.status));
    return [...active, ...done];
  }, [queue]);
  const activeItems = useMemo(() => queue.filter((i) => i.status === 'running'), [queue]);
  const activeCount = activeItems.length;
  const totalCount = queue.length;
  const hasCompleted = useMemo(() => queue.some((i) => i.status === 'done' || i.status === 'cancelled' || i.status === 'error'), [queue]);
  const hasDownloading = activeCount > 0;
  const hasPaused = useMemo(() => queue.some((i) => i.status === 'paused-active' || i.status === 'paused-held'), [queue]);
  const hasInFlight = useMemo(() => queue.some((i) => i.status === 'running' || i.status === 'paused-active' || i.status === 'paused-held' || i.status === 'pending'), [queue]);

  const aggregatePercent = useMemo(() => (activeItems.length === 0 ? 0 : activeItems.reduce((sum, i) => sum + i.progressPercent, 0) / activeItems.length), [activeItems]);
  const headerProgress = activeCount === 1 ? activeItems[0].progressPercent : aggregatePercent;

  const hasHighValueCompletion = useMemo(() => queue.some(isHighValueDownload), [queue]);
  const showShareBanner = hasHighValueCompletion && !shareHighValueBannerDismissed;
  const bannerImpressionFiredRef = useRef(false);
  useEffect(() => {
    if (showShareBanner && !bannerImpressionFiredRef.current) {
      bannerImpressionFiredRef.current = true;
      track('share_prompt_impression', { via: 'high-value-inline' });
    }
  }, [showShareBanner]);

  let headerSummary: string | null = null;
  if (activeCount === 1) {
    const item = activeItems[0];
    const detail = item.progressDetail ?? formatStatus(item.lastStatus);
    headerSummary = `${item.progressPercent.toFixed(0)}%${detail ? ` · ${detail}` : ''}`;
  } else if (activeCount >= 2) {
    headerSummary = t('queue.activeCount', {
      count: activeCount,
      percent: aggregatePercent.toFixed(0)
    });
  } else if (totalCount === 0) {
    headerSummary = t('queue.noDownloads');
  }

  return (
    <section className="relative shrink-0 border-t border-border bg-background" data-testid="smart-drawer">
      <QueueTipNudge visible={showQueueTip} onDismiss={dismissQueueTip} />
      <button type="button" onClick={() => setDrawerOpen(!drawerOpen)} className="relative overflow-hidden w-full flex items-center justify-between px-4 h-9 hover:bg-accent transition-colors" data-testid="drawer-toggle" title={t('queue.toggleTitle')}>
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground">
            {t('queue.header')}
            {totalCount > 0 && (
              <Badge variant="secondary" className="ms-1 text-[9px] font-mono h-4 px-1">
                {totalCount}
              </Badge>
            )}
          </span>
          {headerSummary && (
            <span className={`text-[12px] font-mono ${activeCount > 0 ? 'text-[var(--brand)]' : 'text-muted-foreground'}`} data-testid="drawer-header-summary">
              {headerSummary}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {hasDownloading && (
            <button
              type="button"
              data-testid="btn-pause-all"
              onClick={(e) => {
                e.stopPropagation();
                void pauseAll();
              }}
              className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-accent"
              title={t('queue.pauseAllTitle')}
            >
              <Pause size={10} />
              {t('queue.pauseAll')}
            </button>
          )}
          {hasPaused && (
            <button
              type="button"
              data-testid="btn-resume-first"
              onClick={(e) => {
                e.stopPropagation();
                void resumeFirst();
              }}
              className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-accent"
              title={t('queue.resumeFirstTitle')}
            >
              <Play size={10} />
              {t('queue.resumeFirst')}
            </button>
          )}
          {hasInFlight && (
            <button
              type="button"
              data-testid="btn-cancel-all"
              onClick={(e) => {
                e.stopPropagation();
                void cancelAll();
              }}
              className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-accent"
              title={t('queue.cancelAllTitle')}
            >
              <X size={10} />
              {t('queue.cancelAll')}
            </button>
          )}
          {hasCompleted && (
            <button
              type="button"
              data-testid="btn-clear-completed"
              onClick={(e) => {
                e.stopPropagation();
                void clearCompleted();
              }}
              className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-accent"
              title={t('queue.clearTitle')}
            >
              <Trash2 size={10} />
              {t('queue.clear')}
            </button>
          )}
          <Popover>
            <PopoverTrigger type="button" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-accent" title={t('queue.limitRateTitle')} data-testid="btn-limit-rate">
              <Gauge size={10} />
              {limitRate ? t('queue.limitRate', { value: formatLimitRateLabel(limitRate) }) : t('queue.limitRateOff')}
            </PopoverTrigger>
            <PopoverContent align="end" side="top" sideOffset={8} onClick={(e) => e.stopPropagation()} className="w-64">
              <div className="flex flex-col gap-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t('wizard.url.limitRate.label')}</p>
                <p className="text-[11px] text-[var(--text-subtle)]">{t('wizard.url.limitRate.description')}</p>
              </div>
              <LimitRatePicker value={limitRate} onChange={(v) => void setLimitRate(v)} />
            </PopoverContent>
          </Popover>
          {totalCount > 0 && !drawerOpen && <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand)] animate-pulse" aria-hidden />}
          <span className={activeCount > 0 ? 'text-[var(--brand)]' : 'text-muted-foreground'}>
            <ChevronDown size={activeCount > 0 ? 14 : 12} strokeWidth={activeCount > 0 ? 2.5 : 2} className={`transition-all duration-300 ${drawerOpen ? '' : 'rotate-180'}`} />
          </span>
        </div>
        {activeCount > 0 && (
          <div
            aria-hidden
            data-testid="drawer-header-progress"
            className="absolute bottom-0 start-0 h-[2px] transition-[width] duration-500"
            style={{
              width: `${headerProgress}%`,
              background: 'linear-gradient(90deg, var(--brand), var(--brand-hover))',
              boxShadow: '0 0 8px var(--brand-glow)'
            }}
          />
        )}
      </button>

      <div className="drawer-body" style={{ maxHeight: drawerOpen ? '16rem' : '0px' }} data-testid="drawer-body">
        {showShareBanner && (
          <div className="bg-muted/40 border-b border-border flex items-stretch" data-testid="share-high-value-banner">
            <button type="button" onClick={() => openShareDialog('high-value-inline')} className="flex-1 flex items-center gap-2 px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors text-left cursor-pointer" data-testid="share-high-value-banner-action">
              <Share2 size={11} className="shrink-0 text-[var(--brand)]" />
              <span className="flex-1 truncate">{t('share.highValueBanner.body')}</span>
            </button>
            <button type="button" aria-label={t('share.highValueBanner.dismiss')} className="text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors w-7 inline-flex items-center justify-center cursor-pointer" onClick={() => void setShareHighValueBannerDismissed()} data-testid="share-high-value-banner-dismiss">
              <X size={11} />
            </button>
          </div>
        )}
        <ScrollArea className="h-64">
          <ul className="px-3 pt-2 pb-3 flex flex-col gap-1.5">
            {queue.length === 0 ? (
              <li className="flex items-center gap-2 text-xs text-muted-foreground py-3">
                <Inbox size={16} className="shrink-0" />
                <span>{t('queue.empty')}</span>
              </li>
            ) : (
              orderedQueue.map((item) => <QueueItemCard key={item.id} item={item} />)
            )}
          </ul>
        </ScrollArea>
      </div>
    </section>
  );
}
