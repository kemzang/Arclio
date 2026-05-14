/**
 * Prism-compatible tokenizer engine.
 *
 * Adapted from reprism (https://github.com/tannerlinsley/reprism) which is
 * itself a fork of Prism.js.  Vendored here so that @jscpd/tokenizer has no
 * runtime dependency on the `prismjs` npm package.
 *
 * Public API is intentionally identical to the subset of Prism used by
 * tokenize.ts:
 *   Prism.languages[name]              – grammar registry
 *   Prism.tokenize(text, grammar)      – returns (string | Token)[]
 *   Prism.languages.extend(id, redef)  – clone + override a grammar
 *   Prism.languages.insertBefore(...)  – insert tokens before an existing key
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>;

let uniqueID = 0;

export class Token {
  type: string;
  content: string | Token | (string | Token)[];
  alias: string | string[] | undefined;
  length: number;
  greedy: boolean;

  constructor(
    type: string,
    content: string | Token | (string | Token)[],
    alias: string | string[] | undefined,
    matchedStr: string,
    greedy: boolean,
  ) {
    this.type = type;
    this.content = content;
    this.alias = alias;
    this.length = (matchedStr || '').length | 0;
    this.greedy = !!greedy;
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function getType(o: unknown): string {
  return Object.prototype.toString.call(o).match(/\[object (\w+)\]/)![1]!;
}

function objId(obj: AnyObj): number {
  if (!('__id' in obj)) {
    uniqueID += 1;
    Object.defineProperty(obj, '__id', { value: uniqueID });
  }
  return (obj as AnyObj & { __id: number }).__id;
}

function clone(o: unknown, visited: Record<number, unknown> = {}): unknown {
  if (getType(o) === 'Array') {
    const arr = o as unknown[];
    const id = objId(arr as AnyObj);
    if (visited[id]) return visited[id];
    const c: unknown[] = [];
    visited[id] = c;
    arr.forEach((v, i) => { c[i] = clone(v, visited); });
    return c;
  }
  if (getType(o) === 'Object') {
    const obj = o as AnyObj;
    const id = objId(obj);
    if (visited[id]) return visited[id];
    const c: AnyObj = {};
    visited[id] = c;
    Object.keys(obj).forEach((key) => { c[key] = clone(obj[key], visited); });
    return c;
  }
  return o;
}

function extend(id: string, redef: AnyObj): AnyObj {
  const lang = clone(languages[id]) as AnyObj;
  Object.keys(redef).forEach((key) => { lang[key] = redef[key]; });
  return lang;
}

function DFS(
  o: AnyObj,
  callback: (this: AnyObj, key: string, value: unknown, type: string) => void,
  type?: string,
  visited: Record<number, boolean> = {},
): void {
  Object.keys(o).forEach((i) => {
    callback.call(o, i, o[i], type || i);
    if (getType(o[i]) === 'Object' && !visited[objId(o[i] as AnyObj)]) {
      visited[objId(o[i] as AnyObj)] = true;
      DFS(o[i] as AnyObj, callback, i, visited);
    } else if (getType(o[i]) === 'Array' && !visited[objId(o[i] as AnyObj)]) {
      visited[objId(o[i] as AnyObj)] = true;
      DFS(o[i] as AnyObj, callback, undefined, visited);
    }
  });
}

function insertBefore(
  inside: string,
  before: string | AnyObj,
  insert?: AnyObj,
  base: AnyObj = languages,
): AnyObj {
  const grammar = base[inside];

  if (arguments.length === 2) {
    const resolvedInsert = before as AnyObj;
    Object.keys(resolvedInsert).forEach((key) => {
      grammar[key] = resolvedInsert[key];
    });
    return grammar;
  }

  const ret: AnyObj = {};
  Object.keys(grammar).forEach((key) => {
    if (key === before) {
      Object.keys(insert!).forEach((newKey) => {
        ret[newKey] = insert![newKey];
      });
    }
    ret[key] = grammar[key];
  });

  DFS(languages, function callback(this: AnyObj, key, value) {
    if (value === base[inside] && key !== inside) {
      this[key] = ret;
    }
  });

  base[inside] = ret;
  return base[inside];
}

// ---------------------------------------------------------------------------
// Grammar registry
// ---------------------------------------------------------------------------

export const languages: AnyObj & {
  extend: typeof extend;
  insertBefore: typeof insertBefore;
  DFS: typeof DFS;
} = {
  extend,
  insertBefore,
  DFS,
};

// ---------------------------------------------------------------------------
// Hooks (no-op stubs kept for compatibility with language init functions)
// ---------------------------------------------------------------------------

export const hooks = {
  all: {} as Record<string, Array<(env: AnyObj) => void>>,
  add(name: string, callback: (env: AnyObj) => void): void {
    this.all[name] = this.all[name] || [];
    this.all[name]!.push(callback);
  },
  run(name: string, env: AnyObj): void {
    const callbacks = this.all[name];
    if (!callbacks || !callbacks.length) return;
    callbacks.forEach((cb) => cb(env));
  },
};

// ---------------------------------------------------------------------------
// Core tokenizer
// ---------------------------------------------------------------------------

function matchGrammar(
  text: string,
  strarr: (string | Token)[],
  grammar: AnyObj,
  index: number,
  startPos: number,
  oneshot: boolean,
  target?: string,
): void {
  Object.keys(grammar).forEach((token) => {
    if (!grammar[token]) return;
    if (token === target) return;

    let patterns = grammar[token];
    patterns = Array.isArray(patterns) ? patterns : [patterns];

    (patterns as AnyObj[]).forEach((pattern: AnyObj) => {
      if (pattern == null) return; // skip null/undefined entries (e.g. from grammars that reference missing parent props)
      const inside = pattern.inside;
      const lookbehind = !!pattern.lookbehind;
      const greedy = !!pattern.greedy;
      let lookbehindLength = 0;
      const alias = pattern.alias;

      if (greedy && pattern.pattern && !pattern.pattern.global) {
        const flags = pattern.pattern.toString().match(/[imuy]*$/)![0];
        pattern.pattern = RegExp(pattern.pattern.source, `${flags}g`);
      }

      const pat: RegExp = pattern.pattern || pattern;

      for (let i = index, pos = startPos; i < strarr.length; pos += (strarr[i] as string).length, i++) {
        let str = strarr[i];

        if (strarr.length > text.length) return;
        if (str instanceof Token) continue;

        let delNum = 0;
        let match: RegExpExecArray | null;

        if (greedy && i !== strarr.length - 1) {
          pat.lastIndex = pos;
          match = pat.exec(text);
          if (!match) break;

          const from = match.index + (lookbehind ? (match[1] ? match[1].length : 0) : 0);
          const to = match.index + match[0].length;
          let k = i;
          let p = pos;

          for (
            let len = strarr.length;
            k < len && (p < to || (!(strarr[k] as Token).type && !(strarr[k - 1] as Token)?.greedy));
            ++k
          ) {
            p += (strarr[k] as string).length;
            if (from >= p) { i++; pos = p; }
          }

          if (strarr[i] instanceof Token) continue;

          delNum = k - i;
          str = text.slice(pos, p);
          match.index -= pos;
        } else {
          pat.lastIndex = 0;
          match = pat.exec(str as string);
          delNum = 1;
        }

        if (!match) {
          if (oneshot) break;
          continue;
        }

        if (lookbehind) {
          lookbehindLength = match[1] ? match[1].length : 0;
        }

        const matchFrom = match.index + lookbehindLength;
        const matchStr = match[0].slice(lookbehindLength);
        const matchTo = matchFrom + matchStr.length;
        const before = (str as string).slice(0, matchFrom);
        const after = (str as string).slice(matchTo);

        const args: (number | string | Token)[] = [i, delNum];

        if (before) { i++; pos += before.length; args.push(before); }

        const wrapped = new Token(
          token,
          inside ? tokenize(matchStr, inside) : matchStr,
          alias,
          matchStr,
          greedy,
        );

        args.push(wrapped);
        if (after) args.push(after);

        Array.prototype.splice.apply(strarr, args as [number, number, ...(string | Token)[]]);

        if (delNum !== 1) matchGrammar(text, strarr, grammar, i, pos, true, token);
        if (oneshot) break;
      }
    });
  });
}

export function tokenize(text: string, grammar: AnyObj): (string | Token)[] {
  const strarr: (string | Token)[] = [text];

  const rest = grammar.rest;
  if (rest) {
    Object.keys(rest).forEach((token) => { grammar[token] = rest[token]; });
    delete grammar.rest;
  }

  matchGrammar(text, strarr, grammar, 0, 0, false);
  return strarr;
}

// ---------------------------------------------------------------------------
// Prism-compatible export object
// ---------------------------------------------------------------------------

const Prism = {
  languages,
  tokenize,
  hooks,
  util: { type: getType, objId, clone },
  Token,
};

export default Prism;
