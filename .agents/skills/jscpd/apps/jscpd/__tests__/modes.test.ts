import {describe, beforeAll, afterAll, beforeEach, afterEach, expect, it} from "vitest";
import {IClone} from '@jscpd/core';
import {jscpd} from '../src';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

// Shared JS content:
//   Lines 1–5:  identical comments  (strict keeps them, weak strips them)
//   Lines 6–11: unique const declarations (no window matches within a single file
//               so self-clone detection cannot fire; only cross-file clones occur)
const JS_SHARED = `// identical comment 1
// identical comment 2
// identical comment 3
// identical comment 4
// identical comment 5
const ALPHA_VAR = "unique_value_alpha_001";
const BRAVO_VAR = "unique_value_bravo_002";
const CHARLIE_VAR = "unique_value_charlie_003";
const DELTA_VAR = "unique_value_delta_004";
const ECHO_VAR = "unique_value_echo_005";
const FOXTROT_VAR = "unique_value_foxtrot_006";
`;

// Vue SFC with 6 identical HTML comments inside <template> followed by a
// file-specific <div>.  mild mode keeps comment tokens; weak mode strips them,
// leaving only the unique <div> so no cross-file clone is found.
function makeVue(divClass: string): string {
	return `<template>
<!-- identical comment 1 -->
<!-- identical comment 2 -->
<!-- identical comment 3 -->
<!-- identical comment 4 -->
<!-- identical comment 5 -->
<!-- identical comment 6 -->
<div class="${divClass}"></div>
</template>`;
}

describe('jscpd modes', () => {

	let _log: typeof console.log;
	let tmpDir: string;
	let vueDir: string;

	beforeAll(() => {
		tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jscpd-modes-'));
		vueDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jscpd-modes-vue-'));

		fs.writeFileSync(path.join(tmpDir, 'file-a.js'), JS_SHARED);
		fs.writeFileSync(path.join(tmpDir, 'file-b.js'), JS_SHARED);

		fs.writeFileSync(path.join(vueDir, 'file1.vue'), makeVue('foo'));
		fs.writeFileSync(path.join(vueDir, 'file2.vue'), makeVue('bar'));
	});

	afterAll(() => {
		fs.rmSync(tmpDir, { recursive: true, force: true });
		fs.rmSync(vueDir, { recursive: true, force: true });
	});

	beforeEach(() => {
		_log = console.log;
		console.log = () => {};
	});

	afterEach(() => {
		console.log = _log;
	});

	describe('strict mode', () => {
		it('should detect clones with strict mode, including comment tokens', async () => {
			const clones: IClone[] = await jscpd([
				'', '', tmpDir,
				'-m', 'strict',
				'--min-tokens', '5',
				'--min-lines', '1',
			]);
			expect(clones.length).to.equal(1);
			// comments are kept in strict mode → clone spans from line 1 (first comment)
			expect(clones[0].duplicationA.start.line).to.equal(1);
		});
	});

	describe('weak mode', () => {
		it('should detect clones with weak mode, ignoring comments', async () => {
			const clones: IClone[] = await jscpd([
				'', '', tmpDir,
				'-m', 'weak',
				'--min-tokens', '5',
				'--min-lines', '1',
			]);
			expect(clones.length).to.equal(1);
			// comments stripped → first shared token is `const` on line 6
			expect(clones[0].duplicationA.start.line).to.equal(6);
		});
	});

	describe('weak mode (Vue files - issue #788)', () => {
		it('should suppress comment-only clones in Vue SFCs with weak mode', async () => {
			const clones: IClone[] = await jscpd([
				'', '',
				vueDir,
				'-m', 'weak',
				'--min-tokens', '5',
				'--min-lines', '1',
			]);
			expect(clones.length).to.equal(0);
		});

		it('should detect comment clones in Vue SFCs with mild mode', async () => {
			const clones: IClone[] = await jscpd([
				'', '',
				vueDir,
				'-m', 'mild',
				'--min-tokens', '5',
				'--min-lines', '1',
			]);
			expect(clones.length).to.equal(1);
			// <template> is on line 1; first HTML comment is inside it on line 2
			expect(clones[0].duplicationA.start.line).to.equal(2);
		});
	});

	describe('not exist mode', () => {
		it('should not run ', async () => {
			try {
				await jscpd(['', '', tmpDir, '-m', 'zzz']);
			} catch (e) {
				expect(e.message).to.equal(`Mode zzz does not supported yet.`);
			}
		});
	});

	describe('--skipComments flag (alias for --mode weak)', () => {
		it('should strip comments and detect only non-comment clones, like --mode weak', async () => {
			const clones: IClone[] = await jscpd([
				'', '', tmpDir,
				'--skipComments',
				'--min-tokens', '5',
				'--min-lines', '1',
			]);
			expect(clones.length).to.equal(1);
			// comments stripped → first shared token is `const` on line 6
			expect(clones[0].duplicationA.start.line).to.equal(6);
		});

		it('should suppress comment-only clones in Vue SFCs, like --mode weak', async () => {
			const clones: IClone[] = await jscpd([
				'', '',
				vueDir,
				'--skipComments',
				'--min-tokens', '5',
				'--min-lines', '1',
			]);
			expect(clones.length).to.equal(0);
		});

		it('should let explicit --mode override --skipComments', async () => {
			const clones: IClone[] = await jscpd([
				'', '', tmpDir,
				'--skipComments',
				'--mode', 'strict',
				'--min-tokens', '5',
				'--min-lines', '1',
			]);
			expect(clones.length).to.equal(1);
			// strict mode keeps comments → clone starts at line 1
			expect(clones[0].duplicationA.start.line).to.equal(1);
		});
	});
});
