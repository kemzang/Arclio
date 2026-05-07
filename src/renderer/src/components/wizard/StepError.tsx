import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { formatError, useAppStore } from '../../store/useAppStore';
import { Button } from '../ui/button';
import { BotWallNotice } from './format/BotWallNotice';
import { CookiesErrorAlert } from './format/CookiesErrorAlert';

// Mirrors the bot-category patterns in `FormatProbeService` so a hard-fail
// probe surfaces the same cookies CTA users see for a degraded probe.
function isBotWallError(message: string): boolean {
  return /sign in to confirm you'?re not a bot/i.test(message) || /HTTP Error 429\b|too many requests/i.test(message);
}

export function StepError(): JSX.Element {
  const { t } = useTranslation();
  const { wizardError, settings, retry, reset } = useAppStore();
  const message = formatError(wizardError);
  const showBotWallNotice = wizardError ? isBotWallError(wizardError.message) || (wizardError.details ? isBotWallError(wizardError.details) : false) : false;
  const showCookiesAlert = (settings?.common?.cookiesMode ?? 'off') !== 'off';

  return (
    <div className="wizard-step flex flex-col items-center gap-4 py-4 text-center" data-testid="step-error">
      <div className="w-10 h-10 rounded-full bg-[var(--color-status-error)]/10 text-[var(--color-status-error)] flex items-center justify-center text-base font-bold error-icon-pulse" aria-hidden data-testid="error-icon">
        ✕
      </div>
      <p className="text-sm text-foreground/80 max-w-sm" data-testid="error-message">
        {message}
      </p>
      {showBotWallNotice || showCookiesAlert ? (
        <div className="w-full max-w-md text-start flex flex-col gap-2">
          {showBotWallNotice ? <BotWallNotice forceShow /> : null}
          {showCookiesAlert ? <CookiesErrorAlert /> : null}
        </div>
      ) : null}
      <div className="flex gap-2">
        <Button variant="ghost" type="button" onClick={reset} data-testid="btn-start-over">
          {t('common.startOver')}
        </Button>
        <Button type="button" onClick={() => void retry()} data-testid="btn-retry">
          {t('common.retry')}
        </Button>
      </div>
    </div>
  );
}
