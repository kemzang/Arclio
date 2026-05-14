import {describe, expect, vi, afterEach, it, beforeEach} from 'vitest'
import {jscpd} from '../src';
import {IClone} from '@jscpd/core';

const pathToFixtures = __dirname + '/../../../fixtures';

describe('jscpd formats', () => {

	let _log;

	beforeEach(() => {
		_log = console.log;
		console.log = vi.fn();
	})

	afterEach(() => {
		console.log = _log;
	})

	const formats: Record<string, { name: string; folder: string; clonesCount: number; descr?: string }[]> = {
		'C-like': [
			{
				name: 'java',
				clonesCount: 2,
				folder: pathToFixtures + '/clike',
			},
			{
				name: 'cpp',
				clonesCount: 2,
				folder: pathToFixtures + '/clike',
			},
			{
				name: 'c-header',
				clonesCount: 2,
				folder: pathToFixtures + '/clike',
			},
			{
				name: 'cpp-header',
				clonesCount: 2,
				folder: pathToFixtures + '/clike',
			},
			{
				name: 'java',
				clonesCount: 2,
				folder: pathToFixtures + '/clike',
			},
			{
				name: 'cpp',
				clonesCount: 2,
				folder: pathToFixtures + '/clike',
			},
			{
				name: 'objectivec',
				clonesCount: 1,
				folder: pathToFixtures + '/objective-c',
			},
			{
				name: 'c',
				clonesCount: 2,
				folder: pathToFixtures + '/clike',
			},
			{
				name: 'csharp',
				clonesCount: 2,
				folder: pathToFixtures + '/clike',
			},
			{
				name: 'scala',
				clonesCount: 1,
				folder: pathToFixtures + '/clike',
			},

		],
		'Scripts': [
			{
				name: 'javascript',
				clonesCount: 9,
				folder: pathToFixtures + '/javascript',
			},
			{
				name: 'typescript',
				clonesCount: 6,
				folder: pathToFixtures + '/javascript',
			},
			{
				name: 'json',
				clonesCount: 2,
				folder: pathToFixtures + '/javascript',
			},
			{
				name: 'dart',
				clonesCount: 2,
				folder: pathToFixtures + '/dart',
			},
			{
				name: 'coffeescript',
				clonesCount: 2,
				folder: pathToFixtures + '/coffeescript',
			},
			{
				name: 'groovy',
				clonesCount: 1,
				folder: pathToFixtures + '/groovy',
			},
			{
				name: 'kotlin',
				clonesCount: 2,
				folder: pathToFixtures + '/clike',
			},
			{
				name: 'lua',
				clonesCount: 1,
				folder: pathToFixtures + '/lua',
			},
			{
				name: 'livescript',
				clonesCount: 1,
				folder: pathToFixtures + '/livescript',
			},
			{
				name: 'powershell',
				clonesCount: 1,
				folder: pathToFixtures + '/powershell',
			},
			{
				name: 'tcl',
				clonesCount: 1,
				folder: pathToFixtures + '/tcl',
			},
			{
				name: 'actionscript',
				clonesCount: 1,
				folder: pathToFixtures + '/actionscript',
			},
			{
				name: 'apex',
				clonesCount: 1,
				folder: pathToFixtures + '/apex',
			},
			{
				name: 'gdscript',
				clonesCount: 1,
				folder: pathToFixtures + '/gdscript',
			},
			{
				name: 'qsharp',
				clonesCount: 1,
				folder: pathToFixtures + '/qsharp',
			},
			{
				name: 'rescript',
				clonesCount: 1,
				folder: pathToFixtures + '/rescript',
			},
			{
				name: 'solidity',
				clonesCount: 1,
				folder: pathToFixtures + '/solidity',
			},
		],
		'Markup': [
			{
				name: 'markup',
				descr: 'HTML',
				clonesCount: 2,
				folder: pathToFixtures + '/htmlmixed',
			},
			{
				name: 'vue',
				descr: 'Vue',
				clonesCount: 5,
				folder: pathToFixtures + '/vue',
			},
		{
			name: 'txt',
			descr: 'Text',
			clonesCount: 1,
			folder: pathToFixtures + '/text',
		},
			{
				name: 'jsx',
				clonesCount: 1,
				folder: pathToFixtures + '/jsx',
			},
			{
				name: 'markup',
				descr: 'XML',
				clonesCount: 3,
				folder: pathToFixtures + '/xml',
			},
			{
				name: 'twig',
				clonesCount: 2,
				folder: pathToFixtures + '/twig',
			},
			{
				name: 'tsx',
				clonesCount: 1,
				folder: pathToFixtures + '/jsx',
			},
	{
		name: 'markdown',
		clonesCount: 7,
		folder: pathToFixtures + '/markdown',
	},
			{
				name: 'pug',
				clonesCount: 1,
				folder: pathToFixtures + '/pug',
			},
			{
				name: 'yaml',
				clonesCount: 1,
				folder: pathToFixtures + '/yaml',
			},
			{
				name: 'haml',
				clonesCount: 1,
				folder: pathToFixtures + '/haml',
			},
			{
				name: 'handlebars',
				clonesCount: 1,
				folder: pathToFixtures + '/handlebars',
			},
			{
				name: 'aspnet',
				clonesCount: 4,
				folder: pathToFixtures + '/htmlembedded',
			},
			{
				name: 'plant-uml',
				clonesCount: 1,
				folder: pathToFixtures + '/plant-uml',
			},
			{
				name: 'smarty',
				clonesCount: 1,
				folder: pathToFixtures + '/smarty',
			},
			{
				name: 'soy',
				clonesCount: 1,
				folder: pathToFixtures + '/soy',
			},
			{
				name: 'tt2',
				clonesCount: 2,
				folder: pathToFixtures + '/tt2',
			},
			{
				name: 'textile',
				clonesCount: 1,
				folder: pathToFixtures + '/textile',
			},
		],
		'CSS': [
			{
				name: 'css',
				clonesCount: 2,
				folder: pathToFixtures + '/css',
			},
			{
				name: 'less',
				clonesCount: 2,
				folder: pathToFixtures + '/css',
			},
			{
				name: 'sass',
				clonesCount: 1,
				folder: pathToFixtures + '/sass',
			},
			{
				name: 'scss',
				clonesCount: 1,
				folder: pathToFixtures + '/css',
			},
			{
				name: 'stylus',
				clonesCount: 1,
				folder: pathToFixtures + '/stylus',
			},
		],
		'Data / Query': [
			{
				name: 'sql',
				clonesCount: 1,
				folder: pathToFixtures + '/sql',
			},
			{
				name: 'plsql',
				clonesCount: 2,
				folder: pathToFixtures + '/plsql',
			},
			{
				name: 'graphql',
				clonesCount: 1,
				folder: pathToFixtures + '/graphql',
			},
			{
				name: 'sparql',
				clonesCount: 1,
				folder: pathToFixtures + '/sparql',
			},
			{
				name: 'powerquery',
				clonesCount: 1,
				folder: pathToFixtures + '/powerquery',
			},
			{
				name: 'csv',
				clonesCount: 1,
				folder: pathToFixtures + '/csv',
			},
			{
				name: 'toml',
				clonesCount: 1,
				folder: pathToFixtures + '/toml',
			},
			{
				name: 'properties',
				clonesCount: 1,
				folder: pathToFixtures + '/properties',
			},
			{
				name: 'ini',
				clonesCount: 1,
				folder: pathToFixtures + '/properties',
			},
			{
				name: 'json5',
				clonesCount: 1,
				folder: pathToFixtures + '/json5',
			},
		],
		'Systems / Compiled': [
			{
				name: 'ada',
				clonesCount: 2,
				folder: pathToFixtures + '/ada',
			},
			{
				name: 'fortran',
				clonesCount: 1,
				folder: pathToFixtures + '/fortran',
			},
			{
				name: 'pascal',
				clonesCount: 1,
				folder: pathToFixtures + '/pascal',
			},
			{
				name: 'vbnet',
				clonesCount: 1,
				folder: pathToFixtures + '/vb',
			},
			{
				name: 'fsharp',
				clonesCount: 1,
				folder: pathToFixtures + '/mllike',
			},
			{
				name: 'ocaml',
				clonesCount: 3,
				folder: pathToFixtures + '/mllike',
			},
			{
				name: 'haskell',
				descr: 'Literate Haskell (.lhs)',
				clonesCount: 1,
				folder: pathToFixtures + '/haskell-literate',
			},
			{
				name: 'zig',
				clonesCount: 2,
				folder: pathToFixtures + '/zig',
			},
			{
				name: 'crystal',
				clonesCount: 1,
				folder: pathToFixtures + '/crystal',
			},
			{
				name: 'elm',
				clonesCount: 1,
				folder: pathToFixtures + '/elm',
			},
			{
				name: 'purescript',
				clonesCount: 1,
				folder: pathToFixtures + '/purescript',
			},
			{
				name: 'idris',
				clonesCount: 1,
				folder: pathToFixtures + '/idris',
			},
			{
				name: 'eiffel',
				clonesCount: 1,
				folder: pathToFixtures + '/eiffel',
			},
			{
				name: 'julia',
				clonesCount: 1,
				folder: pathToFixtures + '/julia',
			},
			{
				name: 'wgsl',
				clonesCount: 2,
				folder: pathToFixtures + '/wgsl',
			},
			{
				name: 'llvm',
				clonesCount: 1,
				folder: pathToFixtures + '/llvm',
			},
			{
				name: 'openqasm',
				clonesCount: 1,
				folder: pathToFixtures + '/openqasm',
			},
		],
		'Infrastructure / DevOps': [
			{
				name: 'bash',
				clonesCount: 1,
				folder: pathToFixtures + '/shell',
			},
			{
				name: 'cmake',
				clonesCount: 1,
				folder: pathToFixtures + '/cmake',
			},
			{
				name: 'hcl',
				clonesCount: 1,
				folder: pathToFixtures + '/hcl',
			},
			{
				name: 'ignore',
				clonesCount: 1,
				folder: pathToFixtures + '/gitignore',
			},
			{
				name: 'diff',
				clonesCount: 1,
				folder: pathToFixtures + '/diff',
			},
			{
				name: 'log',
				clonesCount: 1,
				folder: pathToFixtures + '/log',
			},
			{
				name: 'bicep',
				clonesCount: 1,
				folder: pathToFixtures + '/bicep',
			},
			{
				name: 'nsis',
				clonesCount: 1,
				folder: pathToFixtures + '/nsis',
			},
			{
				name: 'linker-script',
				clonesCount: 1,
				folder: pathToFixtures + '/linker-script',
			},
		],
		'Domain-Specific': [
			{
				name: 'antlr4',
				clonesCount: 1,
				folder: pathToFixtures + '/antlr4',
			},
			{
				name: 'gherkin',
				clonesCount: 1,
				folder: pathToFixtures + '/gherkin',
			},
			{
				name: 'robotframework',
				clonesCount: 2,
				folder: pathToFixtures + '/robotframework',
			},
			{
				name: 'protobuf',
				clonesCount: 1,
				folder: pathToFixtures + '/protobuf',
			},
			{
				name: 'tap',
				clonesCount: 1,
				folder: pathToFixtures + '/tap',
			},
			{
				name: 'gettext',
				clonesCount: 1,
				folder: pathToFixtures + '/gettext',
			},
			{
				name: 'latex',
				clonesCount: 1,
				folder: pathToFixtures + '/latex',
			},
			{
				name: 'wolfram',
				descr: 'Mathematica (.wl/.nb)',
				clonesCount: 1,
				folder: pathToFixtures + '/mathematica',
			},
			{
				name: 'sas',
				clonesCount: 1,
				folder: pathToFixtures + '/sas',
			},
			{
				name: 'q',
				clonesCount: 1,
				folder: pathToFixtures + '/q',
			},
			{
				name: 'dot',
				clonesCount: 1,
				folder: pathToFixtures + '/dot',
			},
			{
				name: 'turtle',
				clonesCount: 1,
				folder: pathToFixtures + '/turtle',
			},
			{
				name: 'verilog',
				clonesCount: 1,
				folder: pathToFixtures + '/verilog',
			},
			{
				name: 'vhdl',
				clonesCount: 1,
				folder: pathToFixtures + '/vhdl',
			},
			{
				name: 'velocity',
				clonesCount: 1,
				folder: pathToFixtures + '/velocity',
			},
			{
				name: 'awk',
				clonesCount: 1,
				folder: pathToFixtures + '/awk',
			},
			{
				name: 'basic',
				clonesCount: 1,
				folder: pathToFixtures + '/basic',
			},
			{
				name: 'clojure',
				clonesCount: 1,
				folder: pathToFixtures + '/clojure',
			},
			{
				name: 'scheme',
				clonesCount: 1,
				folder: pathToFixtures + '/scheme',
			},
			{
				name: 'racket',
				clonesCount: 1,
				folder: pathToFixtures + '/racket',
			},
			{
				name: 'oz',
				clonesCount: 1,
				folder: pathToFixtures + '/oz',
			},
			{
				name: 'smalltalk',
				clonesCount: 1,
				folder: pathToFixtures + '/smalltalk',
			},
			{
				name: 'prolog',
				clonesCount: 1,
				folder: pathToFixtures + '/idl',
			},
			{
				name: 'cfml',
				clonesCount: 1,
				folder: pathToFixtures + '/cfml',
			},
			{
				name: 'cfscript',
				clonesCount: 1,
				folder: pathToFixtures + '/cfscript',
			},
			{
				name: 'xquery',
				clonesCount: 1,
				folder: pathToFixtures + '/xquery',
			},
			{
				name: 'lilypond',
				clonesCount: 1,
				folder: pathToFixtures + '/lilypond',
			},
			{
				name: 'unrealscript',
				clonesCount: 1,
				folder: pathToFixtures + '/unrealscript',
			},
			{
				name: 'c',
				descr: 'z80 assembly',
				clonesCount: 1,
				folder: pathToFixtures + '/z80',
			},
		],
		'Common': [
			{
				name: 'brainfuck',
				clonesCount: 4,
				folder: pathToFixtures + '/brainfuck',
			},
			{
				name: 'php',
				clonesCount: 1,
				folder: pathToFixtures + '/php',
			},
		{
			name: 'rust',
			clonesCount: 6,
			folder: pathToFixtures + '/rust',
		},
			{
				name: 'r',
				clonesCount: 1,
				folder: pathToFixtures + '/r',
			},
			{
				name: 'haskell',
				clonesCount: 2,
				folder: pathToFixtures + '/haskell',
			},
			{
				name: 'd',
				clonesCount: 1,
				folder: pathToFixtures + '/d',
			},
			{
				name: 'erlang',
				clonesCount: 1,
				folder: pathToFixtures + '/erlang',
			},
			{
				name: 'go',
				clonesCount: 1,
				folder: pathToFixtures + '/go',
			},
			{
				name: 'haxe',
				clonesCount: 3,
				folder: pathToFixtures + '/haxe',
			},
			{
				name: 'apl',
				clonesCount: 1,
				folder: pathToFixtures + '/apl',
			},
			{
				name: 'puppet',
				clonesCount: 2,
				folder: pathToFixtures + '/puppet',
			},
			{
				name: 'python',
				clonesCount: 1,
				folder: pathToFixtures + '/python',
			},
			{
				name: 'ruby',
				clonesCount: 1,
				folder: pathToFixtures + '/ruby',
			},
			{
				name: 'perl',
				clonesCount: 2,
				folder: pathToFixtures + '/perl',
			},
			{
				name: 'swift',
				clonesCount: 1,
				folder: pathToFixtures + '/swift',
			},
		],
	}

	Object.keys(formats).forEach(group => {
		describe(group, () => {
			formats[group].forEach((format) => {
				describe(`${format.name} ${format.descr ? `(${format.descr})` : ''}`, () => {
					it('should detect clones in ' + format.name, async () => {
						const argv: string[] = [
							'',
							'',
							format.folder,
							'-f',
							format.name,
						]
						const clones: IClone[] = await jscpd(argv);
						expect(clones.length).toEqual(format.clonesCount);
					});
				});
			});
		});
	});
});
