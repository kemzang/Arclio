import type { JSX } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { limitRateSchema } from '@shared/schemas.js';
import { useAppStore } from '../../store/useAppStore.js';
import { Input } from '../ui/input.js';
import { RadioOption } from '../ui/radio-option.js';
import { LIMIT_RATE_PRESETS, formatLimitRateLabel, isLimitRatePreset } from './limitRateFormat.js';

interface Props {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}

export function LimitRatePicker({ value, onChange }: Props): JSX.Element {
  const { t } = useTranslation();
  // Inline warning so users don't expect an in-flight change to throttle
  // already-spawned yt-dlp processes. Pause + Resume re-spawns with new args.
  const hasActiveDownloads = useAppStore((s) => s.queue.some((i) => i.status === 'running' || i.status === 'paused-active'));
  const valueIsPreset = value === undefined || isLimitRatePreset(value);

  // Manual "editing custom" toggle. The picker is in custom mode either when
  // the user opened it (editingCustom=true) or when the stored value isn't a
  // preset (so the user can see/edit their existing custom value).
  const [editingCustom, setEditingCustom] = useState(false);
  const [customDraft, setCustomDraft] = useState(valueIsPreset ? '' : (value ?? ''));

  // Adjust local draft when value changes from outside (e.g. other surface
  // picked a preset, or popover re-opened with a stored custom value).
  // Render-time state update — supported pattern, no effect needed.
  const [trackedValue, setTrackedValue] = useState(value);
  if (value !== trackedValue) {
    setTrackedValue(value);
    if (!valueIsPreset) {
      setCustomDraft(value ?? '');
    }
  }

  const customMode = editingCustom || !valueIsPreset;
  const trimmedDraft = customDraft.trim();
  const customError = customMode && trimmedDraft !== '' && !limitRateSchema.safeParse(trimmedDraft).success;

  const pickPreset = (preset: string | undefined): void => {
    setEditingCustom(false);
    setCustomDraft('');
    onChange(preset);
  };

  const handleCustomChange = (next: string): void => {
    setCustomDraft(next);
    const trimmed = next.trim();
    if (trimmed === '') {
      onChange(undefined);
      return;
    }
    if (limitRateSchema.safeParse(trimmed).success) {
      onChange(trimmed);
    }
  };

  return (
    <div className="flex flex-col gap-2" data-testid="limit-rate-picker">
      {hasActiveDownloads && (
        <p className="flex items-start gap-1.5 text-[11px] text-amber-500" data-testid="limit-rate-active-warning">
          <AlertTriangle size={12} className="mt-0.5 shrink-0" />
          <span>{t('wizard.url.limitRate.activeWarning')}</span>
        </p>
      )}
      <div className="grid grid-cols-2 gap-0.5" role="radiogroup" aria-label={t('wizard.url.limitRate.label')}>
        <RadioOption label={t('wizard.url.limitRate.off')} checked={!customMode && value === undefined} onClick={() => pickPreset(undefined)} />
        {LIMIT_RATE_PRESETS.map((preset) => (
          <RadioOption key={preset} label={formatLimitRateLabel(preset)} checked={!customMode && value === preset} onClick={() => pickPreset(preset)} />
        ))}
        <RadioOption label={t('wizard.url.limitRate.custom')} checked={customMode} onClick={() => setEditingCustom(true)} />
      </div>
      {customMode && (
        <div className="flex flex-col gap-1">
          <Input type="text" value={customDraft} onChange={(e) => handleCustomChange(e.target.value)} placeholder={t('wizard.url.limitRate.customPlaceholder')} className="h-8 text-[12px] font-mono" aria-invalid={customError} data-testid="limit-rate-custom-input" />
          {customError && (
            <p className="text-[11px] text-amber-500" data-testid="limit-rate-custom-error">
              {t('wizard.url.limitRate.invalid')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
