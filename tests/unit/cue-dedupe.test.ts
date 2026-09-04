import {describe, expect, it} from 'vitest'
import {dedupeCues, type Cue} from '@main/services/cueDedupe.js'

function collect(input: Cue[]): Cue[] {
	return [...dedupeCues(input)]
}

describe('dedupeCues — purity', () => {
	it('does not mutate input cues', () => {
		const input: Cue[] = [
			{start: 0, end: 1000, text: 'hello'},
			{start: 500, end: 1500, text: 'hello world'}
		]
		const snapshot = JSON.parse(JSON.stringify(input))

		collect(input)

		expect(input).toEqual(snapshot)
	})
})

describe('dedupeCues — algorithm branches', () => {
	it('drops empty cues', () => {
		// Use long text on the third cue so it isn't folded by the short-tail branch.
		const out = collect([
			{start: 0, end: 1000, text: 'first independent line'},
			{start: 1100, end: 2000, text: ''},
			{start: 2100, end: 3000, text: 'second independent line distinct text'}
		])
		expect(out).toHaveLength(2)
		expect(out[0].text).toBe('first independent line')
		expect(out[1].text).toBe('second independent line distinct text')
	})

	it('extends prev.end when cue text is a substring of prev (instant cue)', () => {
		// Second cue's own duration (end - start = 20ms) is < NEAR_ZERO_DURATION_MS,
		// and its text appears in prev. Prev should swallow it and extend.
		const out = collect([
			{start: 0, end: 5000, text: 'hello there friend'},
			{start: 5050, end: 5070, text: 'there'}
		])
		expect(out).toHaveLength(1)
		expect(out[0].text).toBe('hello there friend')
		expect(out[0].end).toBeGreaterThanOrEqual(5070)
	})

	it('regression: does not merge a substring-matching cue with a substantial duration of its own', () => {
		// cue.end - cue.start = 3000ms — a real, deliberately-timed caption, not
		// an instant rolling-caption artifact — even though its text happens to
		// be a substring of prev's. Three words keeps it out of the unrelated
		// short-tail-fold branch (<=2 words) so this isolates only the
		// near-zero-duration check. The buggy version of that check compared
		// `cue.start - cue.end < 150` (always true for any valid start < end
		// cue, since the result is negative), which merged *every*
		// substring-matching cue regardless of its actual duration — silently
		// swallowing this whole cue and stretching prev.end over it.
		const out = collect([
			{start: 0, end: 5000, text: 'hello there my dear friend'},
			{start: 6000, end: 9000, text: 'there my dear'}
		])
		expect(out).toHaveLength(2)
		expect(out[0]).toMatchObject({start: 0, end: 5000, text: 'hello there my dear friend'})
		expect(out[1]).toMatchObject({start: 6000, end: 9000, text: 'there my dear'})
	})

	it('rolling pattern: drops first line of cue when it equals last line of prev', () => {
		// Classic YouTube rolling: cue N+1 = cue N + new tail.
		const out = collect([
			{start: 0, end: 1000, text: 'just released a video'},
			{start: 1100, end: 2000, text: 'just released a video\non how AI is broken'}
		])
		expect(out).toHaveLength(2)
		expect(out[1].text).toBe('on how AI is broken')
	})

	it('singleWord branch: prev is a lone meaningful word — concatenate next cue', () => {
		// prev.text = single word, length > 2 (the SOLO_WORD_MIN_LENGTH threshold).
		// The current cue's first line equals that word → it carries forward
		// with that word concatenated as a sentence fragment.
		const out = collect([
			{start: 0, end: 500, text: 'hello'},
			{start: 600, end: 1500, text: 'hello\nfriend'}
		])
		// First yielded is the carried-forward cue from the singleWord branch.
		expect(out.length).toBeGreaterThanOrEqual(1)
		const carried = out[0]
		expect(carried.text).toContain('hello')
		expect(carried.text).toContain('friend')
	})

	it('short-tail branch: ≤2 words & no line match → fold into prev with space', () => {
		const out = collect([
			{start: 0, end: 1000, text: 'a long sentence here'},
			{start: 1100, end: 2000, text: 'and more'} // 2 words, no overlap → fold
		])
		expect(out).toHaveLength(1)
		expect(out[0].text).toBe('a long sentence here and more')
		expect(out[0].end).toBe(2000)
	})

	it('strict ordering: extended prev cannot overlap successor', () => {
		// Set up a chain where prev gets extended by the short-tail branch,
		// pushing it past the next cue's start. enforceStrictOrder should bump
		// the next cue's start.
		const out = collect([
			{start: 0, end: 1000, text: 'first sentence'},
			{start: 500, end: 2000, text: 'tail'}, // extends prev.end → 2000
			{start: 1500, end: 3000, text: 'a fully distinct third cue with more words'}
		])
		// Verify no overlap.
		for (let i = 1; i < out.length; i++) {
			expect(out[i].start).toBeGreaterThan(out[i - 1].end)
		}
	})

	it('handles empty input', () => {
		expect(collect([])).toEqual([])
	})

	it('handles single cue input', () => {
		const out = collect([{start: 0, end: 1000, text: 'only'}])
		expect(out).toEqual([{start: 0, end: 1000, text: 'only'}])
	})
})
