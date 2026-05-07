import type { JSX } from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@renderer/store/useAppStore';
import { Button } from '@renderer/components/ui/button';

export function CookiesErrorAlert(): JSX.Element | null {
  const { t } = useTranslation();
  const { settings, openCookiesSettings } = useAppStore();
  const cookiesMode = settings?.common?.cookiesMode ?? 'off';
  if (cookiesMode === 'off') return null;

  const modeLabel = cookiesMode === 'file' ? t('wizard.formats.cookiesError.currentModeFile') : t('wizard.formats.cookiesError.currentModeBrowser');
  const explanation = cookiesMode === 'file' ? t('wizard.formats.cookiesError.explanationFile') : t('wizard.formats.cookiesError.explanationBrowser');

  return (
    <div role="status" data-testid="cookies-error-alert" data-mode={cookiesMode} className="flex flex-col gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-900 dark:text-amber-100">
      <div className="flex items-start gap-2">
        <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-500" />
        <div className="flex flex-col gap-1">
          <span className="font-semibold">{t('wizard.formats.cookiesError.heading')}</span>
          <span className="text-[11px] text-amber-800/80 dark:text-amber-200/80">
            {t('wizard.formats.cookiesError.currentModeLabel')}: <span className="font-medium">{modeLabel}</span>
          </span>
          <span className="leading-snug">{explanation}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 pl-6">
        <Button type="button" size="sm" variant="outline" onClick={() => openCookiesSettings()} className="gap-1.5" data-testid="cookies-error-open-settings-cta">
          <ExternalLink size={12} />
          {t('wizard.formats.cookiesError.openSettingsCta')}
        </Button>
      </div>
    </div>
  );
}
