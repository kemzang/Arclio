import {getOption, IOptions} from '@jscpd/core';
import {sync} from 'fast-glob';
import {getFormatByFile} from '@jscpd/tokenizer';
import { readFileSync, realpathSync } from 'fs-extra';
import {grey} from 'colors/safe';
import {EntryWithContent, IEntry} from './interfaces';
import {lstatSync, Stats} from "fs";
import bytes from "bytes";
import * as path from 'path';

const SHEBANG_TO_FORMAT: Record<string, string> = {
  bash: 'bash',
  sh: 'bash',
  zsh: 'bash',
  dash: 'bash',
  ksh: 'bash',
  python: 'python',
  ruby: 'ruby',
  perl: 'perl',
  php: 'php',
  node: 'javascript',
  nodejs: 'javascript',
  lua: 'lua',
  tclsh: 'tcl',
  wish: 'tcl',
  groovy: 'groovy',
  awk: 'awk',
  gawk: 'awk',
  nawk: 'awk',
  rscript: 'r',
};

function readShebangFormat(filePath: string): string | undefined {
  try {
    const buf = readFileSync(filePath, {encoding: null} as any) as unknown as Buffer;
    const head = buf.slice(0, 128).toString('utf8');
    const firstLine = head.split('\n')[0] ?? '';
    if (!firstLine.startsWith('#!')) {
      return undefined;
    }
    const line = firstLine.slice(2).trim();
    const tokens = line.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) {
      return undefined;
    }
    const firstToken = tokens[0] as string;
    let interpreterToken: string;
    if (path.basename(firstToken).startsWith('env')) {
      const secondToken = tokens[1];
      if (!secondToken || secondToken.startsWith('-')) {
        return undefined;
      }
      interpreterToken = secondToken;
    } else {
      interpreterToken = firstToken;
    }
    const rawName = path.basename(interpreterToken);
    if (/^\d/.test(rawName)) {
      return undefined;
    }
    const normalized = rawName.replace(/[0-9]+(\.[0-9]+)*$/, '').toLowerCase();
    if (normalized === '') {
      return undefined;
    }
    return SHEBANG_TO_FORMAT[normalized];
  } catch {
    return undefined;
  }
}


function isFile(path: string): boolean {
  try {
    const stat: Stats = lstatSync(path);
    return stat.isFile();
  } catch (e) {
    // lstatSync throws an error if path doesn't exist
    return false;
  }
}

function isSymlink(path: string): boolean {
  try {
    const stat: Stats = lstatSync(path);
    return stat.isSymbolicLink();
  } catch (e) {
    // lstatSync throws an error if path doesn't exist
    return false;
  }
}

function skipNotSupportedFormats(options: IOptions): (entry: IEntry) => boolean {
  return (entry: IEntry): boolean => {
    const {path} = entry;
    let format: string | undefined = getFormatByFile(path, options.formatsExts, options.formatsNames);

    if (format === undefined && entry.stats?.mode !== undefined && (entry.stats.mode & 0o111) !== 0) {
      if (!isSymlink(path)) {
        format = readShebangFormat(path);
        entry.detectedFormat = format;
      }
    }

    const shouldNotSkip = !!(format && options.format && options.format.includes(format));
    if ((options.debug || options.verbose) && !shouldNotSkip) {
      console.log(`File ${path} skipped! Format "${format}" does not included to supported formats.`);
    }
    return shouldNotSkip;
  }
}

function skipBigFiles(options: IOptions): (entry: IEntry) => boolean {
  return (entry: IEntry): boolean => {
    const {stats, path} = entry;
    if (!stats) {
      return true;
    }
    // @ts-expect-error - stats is checked above, but DTS build doesn't recognize control flow
    const shouldSkip = bytes.parse(stats.size) > bytes.parse(getOption('maxSize', options) || '0');
    if (options.debug && shouldSkip) {
      console.log(`File ${path} skipped! Size more then limit (${bytes(stats.size)} > ${getOption('maxSize', options)})`);
    }
    return !shouldSkip;
  };
}

function skipFilesIfLinesOfContentNotInLimits(options: IOptions): (entry: EntryWithContent) => boolean {
  return (entry: EntryWithContent): boolean => {
    const {path, content} = entry;
    const lines = content.split('\n').length;
    const minLines = getOption('minLines', options);
    const maxLines = getOption('maxLines', options);
    if (lines < minLines || lines > maxLines) {
      if ((options.debug || options.verbose)) {
        console.log(grey(`File ${path} skipped! Code lines=${lines} not in limits (${minLines}:${maxLines})`));
      }
      return false;
    }
    return true;
  }
}

function addContentToEntry(entry: IEntry): EntryWithContent {
  const {path} = entry;
  const content = readFileSync(path).toString();
  return {...entry, content}
}

export function getFilesToDetect(options: IOptions): EntryWithContent[] {
  const pattern = options.pattern || '**/*';
  let patterns = options.path;

  if (options.noSymlinks) {
    patterns = patterns!==undefined ? patterns.filter((path: string) => !isSymlink(path)) : [];
  }

  patterns = patterns!==undefined ? patterns.map((path: string) => {
    const currentPath = realpathSync(path);

    if (isFile(currentPath)) {
      return path;
    }

    return path.endsWith('/') ? `${path}${pattern}` : `${path}/${pattern}`;
  }): [];

  return (sync(
    patterns,
    {
      ignore: options.ignore,
      onlyFiles: true,
      dot: true,
      stats: true,
      absolute: options.absolute || false,
      followSymbolicLinks: !options.noSymlinks,
      cwd: process.cwd(),
    },
  ) as IEntry[])
    .filter(skipNotSupportedFormats(options))
    .filter(skipBigFiles(options))
    .map(addContentToEntry)
    .filter(skipFilesIfLinesOfContentNotInLimits(options));
}

