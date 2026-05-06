import { useState, useEffect, type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import mainImg from '../../assets/Main.png';
import type { WarmupProgressEvent } from '@shared/types';

interface Props {
  initialized: boolean;
  warmupFailures: string[];
  warmupProgress: Record<string, WarmupProgressEvent> | null;
}

const MIN_MS = 3000;

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SplashScreen({ initialized, warmupFailures, warmupProgress }: Props): JSX.Element | null {
  const { t } = useTranslation();
  const [minPassed, setMinPassed] = useState(false);
  const [gone, setGone] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMinPassed(true), MIN_MS);
    return () => clearTimeout(timer);
  }, []);

  if (gone) return null;

  const fading = initialized && minPassed;

  const entries = Object.values(warmupProgress ?? {});
  const activeEntry = entries.find((e) => e.phase === 'downloading') ?? entries.find((e) => e.phase === 'extracting');
  const totalDownloaded = entries.reduce((sum, e) => sum + e.bytesDownloaded, 0);
  const totalBytes = entries.reduce((sum, e) => sum + (e.totalBytes ?? 0), 0);
  const percent = totalBytes > 0 ? Math.min(100, (totalDownloaded / totalBytes) * 100) : null;

  const showProgress = activeEntry != null || (percent !== null && percent < 100);

  return (
    <div
      className="splash-overlay"
      style={{ opacity: fading ? 0 : 1 }}
      onTransitionEnd={() => {
        if (fading) setGone(true);
      }}
      aria-hidden
    >
      <img src={mainImg} alt="" className="splash-mascot" />
      <div className="splash-text">
        <p className="splash-greeting">{t('splash.greeting')}</p>
        {showProgress ? (
          <>
            <p className="splash-name">{activeEntry ? t('splash.downloading', { binary: activeEntry.binary }) : t('splash.warmup')}</p>
            {percent !== null && (
              <div className="splash-progress">
                <div className="splash-progress-bar" style={{ width: `${percent}%` }} />
              </div>
            )}
            {totalDownloaded > 0 && totalBytes > 0 && (
              <p className="splash-bytes">
                {formatBytes(totalDownloaded)} / {formatBytes(totalBytes)}
              </p>
            )}
          </>
        ) : (
          <p className="splash-name">{t('splash.warmup')}</p>
        )}
        {initialized && warmupFailures.length > 0 && <p className="splash-warning">{t('splash.warning')}</p>}
      </div>
    </div>
  );
}
