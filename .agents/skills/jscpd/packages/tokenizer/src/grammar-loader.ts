import Prism from './engine/prism-core';
import { LANGUAGE_DEFINITIONS, LANGUAGE_NAMES } from './languages/index';

// ---------------------------------------------------------------------------
// Eagerly initialize all bundled language grammars in dependency order.
// They are pure in-memory operations (no disk I/O), so startup cost is
// negligible even with 146 languages.
// ---------------------------------------------------------------------------

let _initialized = false;

function initializeAll(): void {
  if (_initialized) return;
  _initialized = true;

  for (const def of LANGUAGE_DEFINITIONS) {
    try {
      def.init(Prism);
    } catch {
      // Skip silently — individual language init failures must not abort the
      // whole module (e.g., a language that depends on another that wasn't
      // yet loaded would normally throw; the dependency-ordered list above
      // prevents that, but guard defensively anyway).
    }
  }
}

// Initialize on first module load.
initializeAll();

// ---------------------------------------------------------------------------
// Punctuation tokens injected by jscpd into every grammar.
// ---------------------------------------------------------------------------

const punctuation = {
  new_line: /\n/,
  empty: /\s+/,
};

// Track which languages have already been patched so we never mutate the
// grammar object more than once per process.
const patchedLanguages = new Set<string>();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the list of language names provided by the bundled grammar engine.
 */
export function getAvailableGrammars(): string[] {
  return LANGUAGE_NAMES.slice();
}

/**
 * Ensure a language grammar is loaded and patched with jscpd punctuation
 * tokens.  With the bundled engine all languages are pre-loaded, so this
 * is effectively a patch-once guard.
 */
export function ensureLanguageLoaded(lang: string): void {
  if (patchedLanguages.has(lang)) return;

  // With the bundled engine all grammars were loaded eagerly — nothing to
  // fetch from disk.  We still respect the patchedLanguages guard so that
  // callers can rely on idempotent behaviour.
  const grammar = Prism.languages[lang];
  if (typeof grammar === 'object' && grammar !== null) {
    Prism.languages[lang] = { ...grammar, ...punctuation };
  }
  patchedLanguages.add(lang);
}

/**
 * @deprecated Load all languages eagerly.  Kept for backward compatibility;
 * with the bundled engine all languages are already loaded at module init.
 */
export function loadLanguages(): void {
  // no-op — all languages were loaded at module initialisation
}

export { Prism };
