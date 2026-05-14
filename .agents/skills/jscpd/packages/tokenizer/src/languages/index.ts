// @ts-nocheck
// Auto-generated language registry — do not edit by hand.
// Sources: reprism (https://github.com/tannerlinsley/reprism) +
//          prismjs 1.30.0 (grammars not present in reprism)
/* eslint-disable */
import markup from './markup';
import clike from './clike';
import css from './css';
import c from './c';
import javascript from './javascript';
import java from './java';
import ruby from './ruby';
import php from './php';
import markup_templating from './markup-templating';
import css_extras from './css-extras';
import scss from './scss';
import sass from './sass';
import less from './less';
import cpp from './cpp';
import bison from './bison';
import objectivec from './objectivec';
import scala from './scala';
import csharp from './csharp';
import dart from './dart';
import d from './d';
import fsharp from './fsharp';
import glsl from './glsl';
import go from './go';
import groovy from './groovy';
import haxe from './haxe';
import jolie from './jolie';
import kotlin from './kotlin';
import reason from './reason';
import swift from './swift';
import crystal from './crystal';
import erb from './erb';
import actionscript from './actionscript';
import coffeescript from './coffeescript';
import flow from './flow';
import n4js from './n4js';
import typescript from './typescript';
import jsx from './jsx';
import tsx from './tsx';
import arduino from './arduino';
import django from './django';
import aspnet from './aspnet';
import velocity from './velocity';
import parser from './parser';
import php_extras from './php-extras';
import abap from './abap';
import ada from './ada';
import apacheconf from './apacheconf';
import apl from './apl';
import applescript from './applescript';
import arff from './arff';
import asciidoc from './asciidoc';
import asm6502 from './asm6502';
import autohotkey from './autohotkey';
import autoit from './autoit';
import bash from './bash';
import basic from './basic';
import batch from './batch';
import brainfuck from './brainfuck';
import bro from './bro';
import clojure from './clojure';
import csp from './csp';
import diff from './diff';
import docker from './docker';
import eiffel from './eiffel';
import elixir from './elixir';
import erlang from './erlang';
import fortran from './fortran';
import gedcom from './gedcom';
import gherkin from './gherkin';
import git from './git';
import graphql from './graphql';
import haml from './haml';
import handlebars from './handlebars';
import haskell from './haskell';
import hpkp from './hpkp';
import hsts from './hsts';
import http from './http';
import ichigojam from './ichigojam';
import icon from './icon';
import inform7 from './inform7';
import ini from './ini';
import io from './io';
import j from './j';
import json from './json';
import julia from './julia';
import keyman from './keyman';
import latex from './latex';
import liquid from './liquid';
import lisp from './lisp';
import livescript from './livescript';
import lolcode from './lolcode';
import lua from './lua';
import makefile from './makefile';
import markdown from './markdown-format';
import matlab from './matlab';
import mel from './mel';
import mizar from './mizar';
import monkey from './monkey';
import nasm from './nasm';
import nginx from './nginx';
import nim from './nim';
import nix from './nix';
import nsis from './nsis';
import ocaml from './ocaml';
import opencl from './opencl';
import oz from './oz';
import parigp from './parigp';
import pascal from './pascal';
import perl from './perl';
import plsql from './plsql';
import powershell from './powershell';
import processing from './processing';
import prolog from './prolog';
import properties from './properties';
import protobuf from './protobuf';
import pug from './pug';
import puppet from './puppet';
import pure from './pure';
import python from './python';
import q from './q';
import qore from './qore';
import r from './r';
import renpy from './renpy';
import rest from './rest';
import rip from './rip';
import roboconf from './roboconf';
import rust from './rust';
import sas from './sas';
import scheme from './scheme';
import smalltalk from './smalltalk';
import smarty from './smarty';
import soy from './soy';
import stylus from './stylus';
import tcl from './tcl';
import textile from './textile';
import twig from './twig';
import vbnet from './vbnet';
import verilog from './verilog';
import vhdl from './vhdl';
import vim from './vim';
import visual_basic from './visual-basic';
import wasm from './wasm';
import wiki from './wiki';
import xeora from './xeora';
import xojo from './xojo';
import yaml from './yaml';
// Additional grammars: custom sql + 39 prismjs-only languages
import sql from './sql';
import antlr4 from './antlr4';
import apex from './apex';
import awk from './awk';
import bicep from './bicep';
import cfscript from './cfscript';
import cmake from './cmake';
import csv from './csv';
import dot from './dot';
import elm from './elm';
import gdscript from './gdscript';
import gettext from './gettext';
import hcl from './hcl';
import idris from './idris';
import ignore from './ignore';
import json5 from './json5';
import lilypond from './lilypond';
import linker_script from './linker-script';
import llvm from './llvm';
import log from './log';
import openqasm from './openqasm';
import plant_uml from './plant-uml';
import powerquery from './powerquery';
import purescript from './purescript';
import qsharp from './qsharp';
import racket from './racket';
import regex from './regex';
import rescript from './rescript';
import robotframework from './robotframework';
import solidity from './solidity';
import sparql from './sparql';
import tap from './tap';
import toml from './toml';
import tt2 from './tt2';
import turtle from './turtle';
import unrealscript from './unrealscript';
import wgsl from './wgsl';
import wolfram from './wolfram';
import xquery from './xquery';
import zig from './zig';
import txt from './txt';

export interface LanguageDefinition {
  language: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  init: (Prism: any) => void;
}

/** All bundled language definitions in correct dependency order. */
export const LANGUAGE_DEFINITIONS: LanguageDefinition[] = [
  markup,
  clike,
  css,
  c,
  javascript,
  java,
  ruby,
  php,
  markup_templating,
  css_extras,
  scss,
  sass,
  less,
  cpp,
  bison,
  objectivec,
  scala,
  csharp,
  dart,
  d,
  fsharp,
  glsl,
  go,
  groovy,
  haxe,
  jolie,
  kotlin,
  reason,
  swift,
  crystal,
  erb,
  actionscript,
  coffeescript,
  flow,
  n4js,
  typescript,
  jsx,
  tsx,
  arduino,
  django,
  aspnet,
  velocity,
  parser,
  php_extras,
  abap,
  ada,
  apacheconf,
  apl,
  applescript,
  arff,
  asciidoc,
  asm6502,
  autohotkey,
  autoit,
  bash,
  basic,
  batch,
  brainfuck,
  bro,
  clojure,
  csp,
  diff,
  docker,
  eiffel,
  elixir,
  erlang,
  fortran,
  gedcom,
  gherkin,
  git,
  graphql,
  haml,
  handlebars,
  haskell,
  hpkp,
  hsts,
  http,
  ichigojam,
  icon,
  inform7,
  ini,
  io,
  j,
  json,
  julia,
  keyman,
  latex,
  liquid,
  lisp,
  livescript,
  lolcode,
  lua,
  makefile,
  markdown,
  matlab,
  mel,
  mizar,
  monkey,
  nasm,
  nginx,
  nim,
  nix,
  nsis,
  ocaml,
  opencl,
  oz,
  parigp,
  pascal,
  perl,
  sql,    // must precede plsql (plsql extends sql)
  plsql,
  powershell,
  processing,
  prolog,
  properties,
  protobuf,
  pug,
  puppet,
  pure,
  python,
  q,
  qore,
  r,
  renpy,
  rest,
  rip,
  roboconf,
  rust,
  sas,
  scheme,
  smalltalk,
  smarty,
  soy,
  stylus,
  tcl,
  textile,
  twig,
  vbnet,
  verilog,
  vhdl,
  vim,
  visual_basic,
  wasm,
  wiki,
  xeora,
  xojo,
  yaml,
  // Group A: standalone prismjs-only grammars (no external dependencies)
  antlr4,
  apex,
  awk,
  bicep,
  cmake,
  csv,
  dot,
  elm,
  gdscript,
  gettext,
  hcl,
  ignore,
  lilypond,
  linker_script,
  llvm,
  log,
  openqasm,
  plant_uml,
  powerquery,
  regex,
  robotframework,
  tap,
  toml,
  turtle,        // must come before sparql
  unrealscript,
  wgsl,
  wolfram,
  zig,
  // Group B: prismjs-only grammars that depend on existing (already loaded) grammars
  cfscript,      // extends clike
  idris,         // extends haskell
  json5,         // extends json
  purescript,    // extends haskell
  qsharp,        // extends clike
  racket,        // extends scheme
  rescript,      // self-contained
  solidity,      // extends clike
  tt2,           // extends clike
  xquery,        // extends markup
  // Group C: prismjs-only grammars that depend on other new grammars
  sparql,        // extends turtle
  // Self-contained plain-text grammar
  txt,           // self-contained
];

export const LANGUAGE_NAMES: string[] = LANGUAGE_DEFINITIONS.map((d) => d.language);
