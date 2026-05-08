import type { JSX } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Hourglass, Inbox, Pause, Share2, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { isHighValueDownload } from '@shared/queueItem.js';
import { useAppStore, formatStatus } from '../../store/useAppStore.js';
import { QueueItemCard } from '../queue/QueueItemCard.js';
import { QueueTipNudge } from '../queue/QueueTipNudge.js';
import { Badge } from '../ui/badge.js';
import { ScrollArea } from '../ui/scroll-area.js';
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
  const cancelAll = useAppStore((s) => s.cancelAll);
  const interJobSleepEndsAt = useAppStore((s) => s.interJobSleepEndsAt);
  const shareHighValueBannerDismissed = useAppStore((s) => s.settings?.common.shareHighValueBannerDismissed ?? false);
  const openShareDialog = useAppStore((s) => s.openShareDialog);
  const setShareHighValueBannerDismissed = useAppStore((s) => s.setShareHighValueBannerDismissed);

  // Tick every 250ms while sleep window active so the countdown ticks down
  // without re-rendering the whole drawer at 60fps.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!interJobSleepEndsAt) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [interJobSleepEndsAt]);
  const sleepRemainingSec = interJobSleepEndsAt ? Math.max(0, Math.ceil((interJobSleepEndsAt - now) / 1000)) : 0;
  const showSleepBanner = !!interJobSleepEndsAt && sleepRemainingSec > 0;

  const orderedQueue = useMemo(() => {
    const finished = (s: string): boolean => s === 'done' || s === 'cancelled';
    const active = queue.filter((i) => !finished(i.status));
    const done = queue.filter((i) => finished(i.status));
    return [...active, ...done];
  }, [queue]);
  // First pending item: the one the scheduler will pick when the inter-job
  // sleep window elapses. Surface the countdown on its card.
  const nextPendingId = useMemo(() => orderedQueue.find((i) => i.status === 'pending')?.id ?? null, [orderedQueue]);
  const activeItems = useMemo(() => queue.filter((i) => i.status === 'downloading'), [queue]);
  const activeCount = activeItems.length;
  const totalCount = queue.length;
  const hasCompleted = useMemo(() => queue.some((i) => i.status === 'done' || i.status === 'cancelled'), [queue]);
  const hasDownloading = activeCount > 0;
  const hasInFlight = useMemo(() => queue.some((i) => i.status === 'downloading' || i.status === 'paused' || i.status === 'pending'), [queue]);

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
                clearCompleted();
              }}
              className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-accent"
              title={t('queue.clearTitle')}
            >
              <Trash2 size={10} />
              {t('queue.clear')}
            </button>
          )}
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
        {showSleepBanner && (
          <div className="px-4 py-1.5 text-[11px] font-mono text-[var(--color-status-paused)] bg-[var(--color-status-paused-glow)]/10 border-b border-border flex items-center gap-1.5" data-testid="inter-job-sleep-banner">
            <Hourglass size={11} className="animate-pulse shrink-0" />
            <span>{t('queue.interJobSleep', { count: sleepRemainingSec })}</span>
          </div>
        )}
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
              orderedQueue.map((item) => <QueueItemCard key={item.id} item={item} sleepRemainingSec={item.id === nextPendingId && showSleepBanner ? sleepRemainingSec : undefined} />)
            )}
          </ul>
        </ScrollArea>
      </div>
    </section>
  );
}
