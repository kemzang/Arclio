import '@testing-library/jest-dom/vitest'
import {configure} from '@testing-library/dom'
import {vi} from 'vitest'
import {initI18n} from '@shared/i18n/index.js'

// Testing Library's async utilities (findBy*, waitFor) keep their own 1s budget,
// independent of Vitest's testTimeout. `bun run check` runs the test lane next to
// typecheck/knip/madge/lint, and under that contention renderer specs blew the 1s
// budget and failed the mandated quality gate with errors that never reproduce in
// isolation. Vitest's per-test timeout is still the real upper bound.
configure({asyncUtilTimeout: 10_000})

initI18n('en')

if (typeof window !== 'undefined') {
	window.appVersion = '0.0.0-test'
}

// jsdom doesn't implement matchMedia — stub it globally for all tests that need it
if (typeof window !== 'undefined' && !window.matchMedia) {
	Object.defineProperty(window, 'matchMedia', {writable: true, value: vi.fn().mockImplementation((query: string) => ({matches: false, media: query, onchange: null, addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn()}))})
}
