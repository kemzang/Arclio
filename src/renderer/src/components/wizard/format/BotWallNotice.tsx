import type { JSX } from 'react';
import { AlertTriangle, RefreshCw, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@renderer/store/useAppStore';
import { Button } from '@renderer/components/ui/button';

interface Props {
  // When set, the component renders even if `wizardFormatsDegraded` is null.
  // Use case: surfacing the same notice on `StepError` when the probe hard-
  // failed with a bot-detected category — there's no degraded payload in
  // that path, but the cookies CTA still applies.
  forceShow?: boolean;
}

export function BotWallNotice({ forceShow = false }: Props): JSX.Element | null {
  const { t } = useTranslation();
  const { wizardFormatsDegraded, settings, retryFormatProbe, retryProbeWithCookies } = useAppStore();

  const isBotWall = forceShow || (wizardFormatsDegraded?.reasons.includes('botWall') ?? false);
  if (!isBotWall) return null;

  const cookiesMode = settings?.common?.cookiesMode ?? 'off';
  const hasCookiesPath = Boolean(settings?.common?.cookiesPath?.trim());
  const hasCookiesBrowser = Boolean(settings?.common?.cookiesBrowser);
  const cookiesConfigured = hasCookiesPath || hasCookiesBrowser;

  const variant: 'unconfigured' | 'disabled' | 'enabled' = cookiesMode !== 'off' ? 'enabled' : cookiesConfigured ? 'disabled' : 'unconfigured';

  const body = variant === 'unconfigured' ? t('wizard.formats.botWall.bodyUnconfigured') : variant === 'disabled' ? t('wizard.formats.botWall.bodyDisabled') : t('wizard.formats.botWall.bodyEnabled');

  return (
    <div role="status" data-testid="bot-wall-notice" data-variant={variant} className="flex flex-col gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-900 dark:text-amber-100">
      <div className="flex items-start gap-2">
        <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-500" />
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold">{t('wizard.formats.botWall.heading')}</span>
          <span className="leading-snug">{body}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 pl-6">
        {variant === 'disabled' ? (
          <Button type="button" size="sm" variant="default" onClick={() => void retryProbeWithCookies()} className="gap-1.5" data-testid="bot-wall-enable-cta">
            <ShieldCheck size={12} />
            {t('wizard.formats.botWall.enableRetryCta')}
          </Button>
        ) : null}
        <Button type="button" size="sm" variant="outline" onClick={() => void retryFormatProbe()} className="gap-1.5" data-testid="bot-wall-retry-cta">
          <RefreshCw size={12} />
          {t('wizard.formats.botWall.retryCta')}
        </Button>
      </div>
    </div>
  );
}
