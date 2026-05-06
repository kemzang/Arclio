import { useEffect, useMemo, useRef, useState, type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/useAppStore';
import { STEP_REGISTRY } from '../wizard/stepRegistry';
import { STEPS, shouldSkip } from '../wizard/stepNavigation';
import { StepError } from '../wizard/StepError';
import { MixedUrlPromptDialog } from '../wizard/MixedUrlPromptDialog';
import { cn } from '@renderer/lib/utils';

export function WizardPanel(): JSX.Element {
  const { t } = useTranslation();
  const wizardStep = useAppStore((s) => s.wizardStep);
  const activePreset = useAppStore((s) => s.activePreset);
  const wizardMode = useAppStore((s) => s.wizardMode);
  const selectedPlaylistPreset = useAppStore((s) => s.selectedPlaylistPreset);

  const visibleSteps = useMemo(() => STEPS.filter((step) => !shouldSkip(step, { activePreset, wizardMode, selectedPlaylistPreset })), [activePreset, wizardMode, selectedPlaylistPreset]);

  const activeIndex = visibleSteps.indexOf(wizardStep as (typeof STEPS)[number]);
  const activeDescriptor = STEP_REGISTRY.find((d) => d.id === wizardStep);

  const prevIndexRef = useRef(activeIndex);
  const [isBackward, setIsBackward] = useState(false);

  useEffect(() => {
    setIsBackward(activeIndex >= 0 && prevIndexRef.current >= 0 && activeIndex < prevIndexRef.current);
    prevIndexRef.current = activeIndex;
  }, [activeIndex]);

  return (
    <section className={cn('px-6 py-3', isBackward ? 'wizard-backward' : 'wizard-forward')} data-testid="wizard-panel">
      {wizardStep !== 'error' && (
        <div className="flex items-center mb-4" aria-hidden data-testid="step-indicator">
          {visibleSteps.map((stepKey, i) => {
            const isDone = i < activeIndex;
            const isActive = i === activeIndex;
            return (
              <div key={stepKey} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold border transition-all duration-300', isActive && 'border-[var(--brand)] bg-[var(--brand-dim)] text-[var(--brand)]', isDone && 'border-transparent bg-[var(--brand)] text-white', !isActive && !isDone && 'border-[var(--border-strong)] bg-transparent text-[var(--text-subtle)]')} style={isActive ? { boxShadow: '0 0 0 3px var(--brand-dim), 0 0 12px var(--brand-glow)' } : isDone ? { boxShadow: '0 0 6px var(--brand-glow)' } : undefined}>
                    {isDone ? '✓' : i + 1}
                  </div>
                  <span className={cn('text-[11px] font-semibold uppercase tracking-[0.07em]', isActive && 'text-[var(--brand)]', (isDone || (!isActive && !isDone)) && 'text-[var(--text-subtle)]')}>{t(`wizard.steps.${stepKey}` as const)}</span>
                </div>
                {i < visibleSteps.length - 1 && <div className={cn('h-[2px] flex-1 mb-4 mx-1 transition-all duration-500 rounded-full', isDone ? 'bg-[var(--brand)]' : 'bg-accent')} style={isDone ? { boxShadow: '0 0 4px var(--brand-glow)' } : undefined} />}
              </div>
            );
          })}
        </div>
      )}

      {wizardStep === 'error' ? <StepError /> : activeDescriptor?.render()}
      <MixedUrlPromptDialog />
    </section>
  );
}
