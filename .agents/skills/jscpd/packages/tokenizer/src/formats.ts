import {extname, basename} from "path";
import {IFormatMeta} from './interfaces';

export const FORMATS: {
	[key: string]: IFormatMeta;
} = {
	abap: {
		exts: [],
	},
	actionscript: {
		exts: ['as'],
	},
	ada: {
		exts: ['ada'],
	},
	apacheconf: {
		exts: [],
	},
	apl: {
		exts: ['apl'],
	},
	applescript: {
		exts: [],
	},
	arduino: {
		exts: [],
	},
	arff: {
		exts: [],
	},
	asciidoc: {
		exts: [],
	},
	asm6502: {
		exts: [],
	},
	aspnet: {
		exts: ['asp', 'aspx'],
	},
	autohotkey: {
		exts: [],
	},
	autoit: {
		exts: [],
	},
	bash: {
		exts: ['sh', 'ksh', 'bash'],
	},
	basic: {
		exts: ['bas'],
	},
	batch: {
		exts: [],
	},
	bison: {
		exts: [],
	},
	brainfuck: {
		exts: ['b', 'bf'],
	},
	bro: {
		exts: [],
	},
	c: {
		exts: ['c', 'z80'],
	},
	'c-header': {
		exts: ['h'],
		parent: 'c',
	},
	clike: {
		exts: [],
	},
	clojure: {
		exts: ['cljs', 'clj', 'cljc', 'cljx', 'edn'],
	},
	coffeescript: {
		exts: ['coffee'],
	},
	comments: {
		exts: []
	},
	cpp: {
		exts: ['cpp', 'c++', 'cc', 'cxx'],
	},
	'cpp-header': {
		exts: ['hpp', 'h++', 'hh', 'hxx'],
		parent: 'cpp',
	},
	crystal: {
		exts: ['cr'],
	},
	csharp: {
		exts: ['cs'],
	},
	csp: {
		exts: [],
	},
	'css-extras': {
		exts: [],
	},
	css: {
		exts: ['css', 'gss'],
	},
	d: {
		exts: ['d'],
	},
	dart: {
		exts: ['dart'],
	},
	diff: {
		exts: ['diff', 'patch'],
	},
	django: {
		exts: [],
	},
	docker: {
		exts: [],
	},
	eiffel: {
		exts: ['e'],
	},
	elixir: {
		exts: [],
	},
	elm: {
		exts: ['elm'],
	},
	erb: {
		exts: [],
	},
	erlang: {
		exts: ['erl', 'erlang'],
	},
	flow: {
		exts: [],
	},
	fortran: {
		exts: ['f', 'for', 'f77', 'f90'],
	},
	fsharp: {
		exts: ['fs'],
	},
	gdscript: {
		exts: ['gd'],
	},
	gedcom: {
		exts: [],
	},
	gherkin: {
		exts: ['feature'],
	},
	git: {
		exts: [],
	},
	glsl: {
		exts: [],
	},
	go: {
		exts: ['go'],
	},
	graphql: {
		exts: ['graphql'],
	},
	groovy: {
		exts: ['groovy', 'gradle'],
	},
	haml: {
		exts: ['haml'],
	},
	handlebars: {
		exts: ['hb', 'hbs', 'handlebars'],
	},
	haskell: {
		exts: ['hs', 'lhs'],
	},
	haxe: {
		exts: ['hx', 'hxml'],
	},
	hpkp: {
		exts: [],
	},
	hsts: {
		exts: [],
	},
	http: {
		exts: [],
	},
	ichigojam: {
		exts: [],
	},
	icon: {
		exts: [],
	},
	inform7: {
		exts: [],
	},
	ini: {
		exts: ['ini'],
	},
	io: {
		exts: [],
	},
	j: {
		exts: [],
	},
	java: {
		exts: ['java'],
	},
	javascript: {
		exts: ['js', 'es', 'es6', 'mjs', 'cjs'],
	},
	jolie: {
		exts: [],
	},
	json: {
		exts: ['json', 'map', 'jsonld'],
	},
	jsx: {
		exts: ['jsx'],
	},
	julia: {
		exts: ['jl'],
	},
	keymap: {
		exts: [],
	},
	kotlin: {
		exts: ['kt', 'kts'],
	},
	latex: {
		exts: ['tex'],
	},
	less: {
		exts: ['less'],
	},
	liquid: {
		exts: [],
	},
	lisp: {
		exts: ['cl', 'lisp', 'el'],
	},
	livescript: {
		exts: ['ls'],
	},
	lolcode: {
		exts: [],
	},
	lua: {
		exts: ['lua'],
	},
	makefile: {
		exts: [],
	},
	markdown: {
		exts: ['md', 'markdown', 'mkd'],
	},
	markup: {
		exts: ['html', 'htm', 'xml', 'xsl', 'xslt', 'svg', 'ejs', 'jsp'],
	},
	matlab: {
		exts: [],
	},
	mel: {
		exts: [],
	},
	mizar: {
		exts: [],
	},
	monkey: {
		exts: [],
	},
	n4js: {
		exts: [],
	},
	nasm: {
		exts: [],
	},
	nginx: {
		exts: [],
	},
	nim: {
		exts: [],
	},
	nix: {
		exts: [],
	},
	nsis: {
		exts: ['nsh', 'nsi'],
	},
	objectivec: {
		exts: ['m', 'mm'],
	},
	ocaml: {
		exts: ['ocaml', 'ml', 'mli', 'mll', 'mly'],
	},
	opencl: {
		exts: [],
	},
	oz: {
		exts: ['oz'],
	},
	parigp: {
		exts: [],
	},
	pascal: {
		exts: ['pas', 'p'],
	},
	perl: {
		exts: ['pl', 'pm'],
	},
	php: {
		exts: ['php', 'phtml'],
	},
	plsql: {
		exts: ['plsql'],
	},
	powershell: {
		exts: ['ps1', 'psd1', 'psm1'],
	},
	processing: {
		exts: [],
	},
	prolog: {
		exts: ['pro'],
	},
	properties: {
		exts: ['properties'],
	},
	protobuf: {
		exts: ['proto'],
	},
	pug: {
		exts: ['pug', 'jade'],
	},
	puppet: {
		exts: ['pp', 'puppet'],
	},
	pure: {
		exts: [],
	},
	python: {
		exts: ['py', 'pyx', 'pxd', 'pxi'],
	},
	q: {
		exts: ['q'],
	},
	qore: {
		exts: [],
	},
	r: {
		exts: ['r', 'R'],
	},
	reason: {
		exts: [],
	},
	renpy: {
		exts: [],
	},
	rest: {
		exts: [],
	},
	rip: {
		exts: [],
	},
	roboconf: {
		exts: [],
	},
	ruby: {
		exts: ['rb'],
	},
	rust: {
		exts: ['rs'],
	},
	sas: {
		exts: ['sas'],
	},
	sass: {
		exts: ['sass'],
	},
	scala: {
		exts: ['scala'],
	},
	scheme: {
		exts: ['scm', 'ss'],
	},
	scss: {
		exts: ['scss'],
	},
	svelte: {
		exts: ['svelte'],
	},
	smalltalk: {
		exts: ['st'],
	},
	smarty: {
		exts: ['smarty', 'tpl'],
	},
	soy: {
		exts: ['soy'],
	},
	sql: {
		exts: ['sql', 'cql'],
	},
	stylus: {
		exts: ['styl', 'stylus'],
	},
	swift: {
		exts: ['swift'],
	},
	tap: {
		exts: ['tap'],
	},
	tcl: {
		exts: ['tcl'],
	},
	textile: {
		exts: ['textile'],
	},
	tsx: {
		exts: ['tsx'],
	},
	tt2: {
		exts: ['tt2'],
	},
	twig: {
		exts: ['twig'],
	},
	typescript: {
		exts: ['ts', 'mts', 'cts'],
	},
	txt: {
		exts: ['txt'],
	},
	vbnet: {
		exts: ['vb'],
	},
	velocity: {
		exts: ['vtl'],
	},
	verilog: {
		exts: ['v'],
	},
	vhdl: {
		exts: ['vhd', 'vhdl'],
	},
	vim: {
		exts: [],
	},
	'visual-basic': {
		exts: ['vb'],
	},
	astro: {
		exts: ['astro'],
	},
	vue: {
		exts: ['vue'],
	},
	wasm: {
		exts: [],
	},
	url: {
		exts: [],
	},
	wiki: {
		exts: [],
	},
	xeora: {
		exts: [],
	},
	xojo: {
		exts: [],
	},
	xquery: {
		exts: ['xy', 'xquery'],
	},
	yaml: {
		exts: ['yaml', 'yml'],
	},
	// ---------------------------------------------------------------------------
	// Additional languages (not provided by the reprism engine)
	// These formats are available for file-extension detection but have no
	// bundled grammar, so tokenization returns an empty array for them.
	// ---------------------------------------------------------------------------
	abnf: {
		exts: [],
	},
	agda: {
		exts: [],
	},
	antlr4: {
		exts: ['g4'],
	},
	apex: {
		exts: ['cls', 'trigger', 'apex'],
	},
	aql: {
		exts: [],
	},
	armasm: {
		exts: [],
	},
	awk: {
		exts: ['awk'],
	},
	bicep: {
		exts: ['bicep'],
	},
	bnf: {
		exts: [],
	},
	cfscript: {
		exts: ['cfc'],
	},
	cfml: {
		exts: ['cfm'],
		parent: 'markup',
	},
	cmake: {
		exts: ['cmake'],
	},
	cobol: {
		exts: [],
	},
	csv: {
		exts: ['csv'],
	},
	cypher: {
		exts: [],
	},
	dhall: {
		exts: [],
	},
	'dns-zone-file': {
		exts: [],
	},
	dot: {
		exts: ['dot', 'gv'],
	},
	ebnf: {
		exts: [],
	},
	editorconfig: {
		exts: [],
	},
	'excel-formula': {
		exts: ['xlsx', 'xls'],
	},
	factor: {
		exts: [],
	},
	ftl: {
		exts: [],
	},
	gcode: {
		exts: [],
	},
	gettext: {
		exts: ['po'],
	},
	gml: {
		exts: [],
	},
	'go-module': {
		exts: [],
	},
	hcl: {
		exts: ['tf', 'hcl'],
	},
	hlsl: {
		exts: [],
	},
	idris: {
		exts: ['idr'],
	},
	ignore: {
		exts: ['gitignore'],
	},
	jq: {
		exts: [],
	},
	json5: {
		exts: ['json5'],
	},
	kusto: {
		exts: [],
	},
	lilypond: {
		exts: ['ly'],
	},
	'linker-script': {
		exts: ['ld'],
	},
	llvm: {
		exts: ['ll'],
	},
	log: {
		exts: ['log'],
	},
	mermaid: {
		exts: [],
	},
	mongodb: {
		exts: [],
	},
	n1ql: {
		exts: [],
	},
	odin: {
		exts: [],
	},
	openqasm: {
		exts: ['qasm'],
	},
	'plant-uml': {
		exts: ['puml', 'plantuml'],
	},
	powerquery: {
		exts: ['pq'],
	},
	promql: {
		exts: [],
	},
	purescript: {
		exts: ['purs'],
	},
	qsharp: {
		exts: ['qs'],
	},
	racket: {
		exts: ['rkt'],
	},
	regex: {
		exts: [],
	},
	rego: {
		exts: [],
	},
	rescript: {
		exts: ['res'],
	},
	robotframework: {
		exts: ['robot'],
	},
	'shell-session': {
		exts: [],
	},
	smali: {
		exts: [],
	},
	solidity: {
		exts: ['sol'],
	},
	sparql: {
		exts: ['rq'],
	},
	stata: {
		exts: [],
	},
	toml: {
		exts: ['toml'],
	},
	turtle: {
		exts: ['ttl'],
	},
	typoscript: {
		exts: [],
	},
	unrealscript: {
		exts: ['uc'],
	},
	uri: {
		exts: [],
	},
	vala: {
		exts: [],
	},
	wgsl: {
		exts: ['wgsl'],
	},
	wolfram: {
		exts: ['wl', 'nb'],
	},
	zig: {
		exts: ['zig'],
	},
};

export function getSupportedFormats(): string[] {
	return Object.keys(FORMATS).filter((name) => name !== 'important' && name !== 'url');
}

// Pre-built reverse map: file extension → format name.  Built once at module
// load time from the FORMATS constant so that getFormatByFile() is O(1) per
// call instead of O(#formats × avg_exts).
export const EXT_TO_FORMAT = new Map<string, string>();
for (const [fmt, meta] of Object.entries(FORMATS)) {
	for (const ext of meta.exts) {
		// First writer wins — preserves the same behaviour as the original
		// Object.keys(FORMATS).find() which returns the first match.
		if (!EXT_TO_FORMAT.has(ext)) {
			EXT_TO_FORMAT.set(ext, fmt);
		}
	}
}

export function getFormatByFile(
	path: string,
	formatsExts?: { [key: string]: string[] },
	formatsNames?: { [key: string]: string[] },
): string | undefined {
	const ext: string = extname(path).slice(1);
	const name: string = basename(path);

	if (formatsNames && Object.keys(formatsNames).length) {
		const byName = Object.keys(formatsNames).find((format) => formatsNames[format]?.includes(name));
		if (byName) return byName;
	}

	if (formatsExts && Object.keys(formatsExts).length) {
		return Object.keys(formatsExts).find((format) => formatsExts[format]?.includes(ext));
	}
	return EXT_TO_FORMAT.get(ext);
}
