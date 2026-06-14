import type {ClassifiedError, ClassifierKind} from './kinds.js'
import {ERROR_PATTERNS, PATTERN_ENTRIES} from './patterns.js'

const CLASSIFIER_KINDS = new Set(PATTERN_ENTRIES.map(([kind]) => kind))

export interface ClassifyOpts {
	// Site-specific patterns to merge in *before* the built-in table, so apps
	// can layer in custom rules without forking. Keys must be one of the
	// existing ClassifierKind values — to add a brand-new error category, open
	// a PR upstream.
	extraPatterns?: Partial<Record<ClassifierKind, RegExp | RegExp[]>>
}

function buildEntries(extra?: ClassifyOpts['extraPatterns']): [ClassifierKind, RegExp][] {
	if (!extra) return PATTERN_ENTRIES
	const merged: [ClassifierKind, RegExp][] = []
	for (const [kind, regex] of Object.entries(extra)) {
		if (!isClassifierKind(kind)) throw new Error(`Unsupported extraPatterns kind: ${kind}`)
		const list = Array.isArray(regex) ? regex : [regex]
		for (const r of list) {
			if (!(r instanceof RegExp)) throw new Error(`Unsupported extraPatterns value for kind ${kind}: expected RegExp`)
			merged.push([kind, r])
		}
	}
	return [...merged, ...PATTERN_ENTRIES]
}

function isClassifierKind(kind: string): kind is ClassifierKind {
	return CLASSIFIER_KINDS.has(kind as ClassifierKind)
}

// Pure classifier. Given a yt-dlp stderr blob, return the matched kind plus
// the raw text the caller should surface verbatim when `kind === 'unknown'`.
export function classifyYtDlpStderr(stderr: string, opts: ClassifyOpts = {}): ClassifiedError {
	const entries = buildEntries(opts.extraPatterns)
	for (const [kind, pattern] of entries) {
		if (pattern.global || pattern.sticky) pattern.lastIndex = 0
		if (pattern.test(stderr)) return {kind, raw: stderr}
	}
	return {kind: 'unknown', raw: stderr}
}

// Walk the stderr line-by-line and classify each ERROR: line independently.
// Useful when running yt-dlp with `--ignore-errors` over a playlist — a
// single stderr blob can contain several distinct failures.
export function classifyAll(stderr: string, opts: ClassifyOpts = {}): ClassifiedError[] {
	const out: ClassifiedError[] = []
	for (const rawLine of stderr.split(/\r?\n/)) {
		if (!/^ERROR:/i.test(rawLine.trim())) continue
		out.push(classifyYtDlpStderr(rawLine, opts))
	}
	// If we found no ERROR: lines but the input is non-empty, fall back to a
	// single whole-blob classification so callers still see *something*.
	if (out.length === 0 && stderr.trim().length > 0) {
		out.push(classifyYtDlpStderr(stderr, opts))
	}
	return out
}

// Re-export so callers can inspect the regex table for debugging.
export {ERROR_PATTERNS}
