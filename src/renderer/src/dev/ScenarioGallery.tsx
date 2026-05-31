import { useEffect, useMemo, useRef, useState, type JSX } from 'react';
import { ChevronDown, RotateCcw, TestTube2 } from 'lucide-react';
import { BROWSER_MOCK_SCENARIOS, getScenario, readScenarioIdFromUrl, type BrowserMockScenario, type BrowserMockScenarioGroup } from './browserMockScenarios.js';
import { cn } from '../lib/utils.js';
import { useAppStore } from '../store/useAppStore.js';

const GROUPS: BrowserMockScenarioGroup[] = ['General', 'Playlist', 'Probe Errors', 'Updates', 'Queue', 'Diagnostics'];

function activeScenario(): BrowserMockScenario {
  try {
    return getScenario(readScenarioIdFromUrl(window.location));
  } catch {
    return getScenario(null);
  }
}

function scenarioUrl(id: BrowserMockScenario['id']): string {
  const url = new URL(window.location.href);
  if (id === 'default') url.searchParams.delete('scenario');
  else url.searchParams.set('scenario', id);
  return `${url.pathname}${url.search}${url.hash}`;
}

function applyScenario(id: BrowserMockScenario['id']): void {
  window.location.assign(scenarioUrl(id));
}

export function ScenarioGallery(): JSX.Element {
  const [open, setOpen] = useState(false);
  const scenario = activeScenario();
  const initialized = useAppStore((state) => state.initialized);
  const autoAppliedRef = useRef<string | null>(null);

  const grouped = useMemo(
    () =>
      GROUPS.map((group) => ({
        group,
        scenarios: BROWSER_MOCK_SCENARIOS.filter((candidate) => candidate.group === group)
      })).filter((entry) => entry.scenarios.length > 0),
    []
  );

  useEffect(() => {
    if (!initialized || scenario.kind !== 'probe' || autoAppliedRef.current === scenario.id) return;
    autoAppliedRef.current = scenario.id;
    const store = useAppStore.getState();
    store.reset();
    store.setWizardUrl(`https://example.com/${scenario.id}`);
    void store.submitUrl();
  }, [initialized, scenario.id, scenario.kind]);

  return (
    <aside className="fixed bottom-9 left-3 z-[1000] max-w-[calc(100vw-1.5rem)] text-xs" data-testid="scenario-gallery">
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex max-w-[calc(100vw-1.5rem)] items-center gap-2 rounded-md border border-[var(--border-strong)] bg-background/95 px-3 py-2 text-left shadow-lg backdrop-blur" data-testid="scenario-gallery-toggle" aria-expanded={open}>
        <TestTube2 size={14} className="shrink-0 text-sky-500" />
        <span className="min-w-0">
          <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-subtle)]">Scenario</span>
          <span className="block max-w-48 truncate font-semibold text-foreground">{scenario.title}</span>
        </span>
        <ChevronDown size={14} className={cn('shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="mt-2 w-[min(560px,calc(100vw-1.5rem))] overflow-hidden rounded-md border border-[var(--border-strong)] bg-background/98 shadow-xl backdrop-blur" data-testid="scenario-gallery-panel">
          <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-subtle)]">Browser Mock Gallery</p>
              <p className="truncate text-[11px] text-muted-foreground">{scenario.description}</p>
            </div>
            <button type="button" onClick={() => applyScenario('default')} className="inline-flex h-7 shrink-0 items-center gap-1 rounded border border-border px-2 font-medium text-muted-foreground hover:text-foreground" data-testid="scenario-reset">
              <RotateCcw size={12} />
              Reset
            </button>
          </div>

          <div className="max-h-[min(70vh,620px)] overflow-y-auto p-3">
            {grouped.map(({ group, scenarios }) => (
              <section key={group} className="mb-4 last:mb-0">
                <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-subtle)]">{group}</h3>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2">
                  {scenarios.map((candidate) => {
                    const active = candidate.id === scenario.id;
                    return (
                      <button key={candidate.id} type="button" onClick={() => applyScenario(candidate.id)} className={cn('min-h-16 rounded-md border p-2 text-left transition-colors', active ? 'border-[var(--brand)] bg-[var(--brand-dim)] text-foreground' : 'border-border bg-muted/20 text-muted-foreground hover:border-[var(--border-strong)] hover:text-foreground')} data-testid={`scenario-button-${candidate.id}`} aria-pressed={active}>
                        <span className="block truncate text-[12px] font-semibold">{candidate.title}</span>
                        <span className="mt-1 block line-clamp-2 text-[10px] leading-snug">{candidate.description}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
