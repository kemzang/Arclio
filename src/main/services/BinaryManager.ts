import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs, { constants as fsConstants } from 'node:fs';
import fsPromises from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { app } from 'electron';
import extractZip from 'extract-zip';
import got, { type Method } from 'got';
import log from 'electron-log/main';

const execFileAsync = promisify(execFile);
import { trackMain } from '@main/services/analytics';
import { FAILURE_CODE, type BinaryOverrides, type DependencyAttempt, type DependencyDiagnostic, type DependencyFailure, type DependencyFailureKind, type DependencyId, type DependencySource, type StatusKey, type WarmupProgressEvent } from '@shared/types';

type StatusReporter = (statusKey: StatusKey, params?: Record<string, string | number>) => void;
type DownloadProgressCallback = (downloaded: number, total: number | undefined) => void;
type ProgressEmitter = (event: WarmupProgressEvent) => void;

type RemoteVersionLookup = { tag: string; reason: null } | { tag: null; reason: string };

type YtDlpVersionCheck = { state: 'up-to-date'; local: string } | { state: 'outdated'; local: string; remote: string } | { state: 'unknown'; local: string; reason: string } | { state: 'unusable' };

interface ResolveOptions {
  overrides?: BinaryOverrides;
  onStatus?: StatusReporter;
  onProgress?: ProgressEmitter;
  signal?: AbortSignal;
}

const PROBE_TIMEOUT_MS = 10_000;

function isAbortError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return err.name === 'AbortError' || (err as { code?: string }).code === 'ABORT_ERR';
}

// Cancellation errors must keep their AbortError marker so classifyDownloadError
// → 'timeout'. A plain `new Error('Cancelled')` reads as a generic download_failed.
function cancelError(message = 'Cancelled'): Error {
  const err = new Error(message);
  err.name = 'AbortError';
  return err;
}

function abortFailure(message: string): DependencyFailure {
  return { kind: 'timeout', message, osCode: 'CANCELLED' };
}

function probeArgs(id: DependencyId): string[] {
  if (id === 'ffmpeg' || id === 'ffprobe') return ['-version'];
  return ['--version'];
}

function classifyProbeError(err: NodeJS.ErrnoException, stderr?: string): DependencyFailure {
  const code = err.code;
  const msg = err.message ?? String(err);
  const errno = (err as { errno?: number }).errno;
  const killed = (err as { killed?: boolean }).killed;
  if (killed || code === 'ETIMEDOUT') return { kind: 'timeout', message: msg, osCode: code };
  if (code === 'ENOENT') return { kind: 'spawn_failed', message: msg, osCode: code };
  if (code === 'EACCES' || code === 'EPERM') return { kind: 'permission_denied', message: msg, osCode: code };
  const blob = `${msg} ${stderr ?? ''}`;
  if (process.platform === 'win32' && /SmartScreen|Defender|virus|threat|0x800704EC|0x80070424/i.test(blob)) {
    return { kind: 'blocked_or_quarantined', message: msg, osCode: code };
  }
  if (process.platform === 'win32' && (code === 'UNKNOWN' || errno === -4094)) {
    return { kind: 'blocked_or_quarantined', message: msg, osCode: code };
  }
  return { kind: 'bad_exit_code', message: msg, osCode: code };
}

async function probeBinary(filePath: string, args: string[], timeoutMs: number = PROBE_TIMEOUT_MS, signal?: AbortSignal): Promise<{ ok: true; output: string } | { ok: false; failure: DependencyFailure }> {
  if (signal?.aborted) return { ok: false, failure: abortFailure('Cancelled before probe') };
  // BtbN's Linux shared ffmpeg/ffprobe build expects libav*.so.* siblings in
  // the executable's own directory. Inject LD_LIBRARY_PATH so probing the
  // bundled binary works the same way spawnYtDlp/spawnFFmpeg do at runtime.
  const env = process.platform === 'linux' ? { ...process.env, LD_LIBRARY_PATH: path.dirname(filePath) + (process.env.LD_LIBRARY_PATH ? path.delimiter + process.env.LD_LIBRARY_PATH : '') } : undefined;
  return new Promise((resolve) => {
    let settled = false;
    const child = execFile(filePath, args, { timeout: timeoutMs, windowsHide: true, maxBuffer: 1024 * 1024, signal, env }, (err, stdout, stderr) => {
      if (settled) return;
      settled = true;
      if (err) {
        if (isAbortError(err)) {
          resolve({ ok: false, failure: abortFailure('Probe cancelled') });
          return;
        }
        resolve({ ok: false, failure: classifyProbeError(err as NodeJS.ErrnoException, stderr) });
        return;
      }
      const output = (stdout || stderr || '').trim();
      if (!output) {
        resolve({ ok: false, failure: { kind: 'bad_exit_code', message: 'Empty version output' } });
        return;
      }
      resolve({ ok: true, output });
    });
    child.once('error', (err) => {
      if (settled) return;
      settled = true;
      if (isAbortError(err)) {
        resolve({ ok: false, failure: abortFailure('Probe cancelled') });
        return;
      }
      resolve({ ok: false, failure: classifyProbeError(err) });
    });
  });
}

// Discover binaries on PATH. On Windows uses `where.exe`; on POSIX uses `which`.
// Returns absolute paths in PATH order. Empty array on failure.
async function whereOnPath(name: string, signal?: AbortSignal): Promise<string[]> {
  try {
    const tool = process.platform === 'win32' ? 'where' : 'which';
    const args = process.platform === 'win32' ? [name] : ['-a', name];
    const { stdout } = await execFileAsync(tool, args, { windowsHide: true, signal });
    return stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  } catch {
    return [];
  }
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function makeAttempt(source: DependencySource, failure?: DependencyFailure): DependencyAttempt {
  return failure ? { source, failure } : { source };
}

function runnableDiagnostic(id: DependencyId, source: DependencySource, resolvedPath: string, attempts: DependencyAttempt[], versionOutput?: string): DependencyDiagnostic {
  return { id, state: 'runnable', source, resolvedPath, versionOutput, attempts };
}

function failedDiagnostic(id: DependencyId, attempts: DependencyAttempt[]): DependencyDiagnostic {
  const last = attempts.length > 0 ? attempts[attempts.length - 1] : undefined;
  return {
    id,
    state: 'failed',
    source: last?.source ?? null,
    resolvedPath: null,
    failure: last?.failure,
    attempts
  };
}

function classifyDownloadError(err: unknown): DependencyFailureKind {
  if (isAbortError(err)) return 'timeout';
  const msg = err instanceof Error ? err.message.toLowerCase() : '';
  if (msg.includes('checksum')) return 'hash_failed';
  if (msg.includes('archive') || msg.includes('did not contain') || msg.includes('extract')) return 'extract_failed';
  return 'download_failed';
}

function makeDownloadProgress(id: DependencyId, source: DependencySource, onProgress: ProgressEmitter | undefined): DownloadProgressCallback | undefined {
  if (!onProgress) return undefined;
  return (downloaded, total): void => {
    onProgress({ binary: id, phase: 'downloading', bytesDownloaded: downloaded, totalBytes: total, source });
  };
}

const logger = log.scope('binary');

type PartialResponseMode = 'fresh' | 'append' | 'discard-and-retry';

class RestartFreshDownloadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RestartFreshDownloadError';
  }
}

function wrapDownloadProgressEmitter(cb: DownloadProgressCallback | undefined): ProgressEmitter | undefined {
  if (!cb) return undefined;
  return (event): void => {
    if (event.phase === 'downloading' && typeof event.bytesDownloaded === 'number') {
      cb(event.bytesDownloaded, event.totalBytes);
    }
  };
}

function parseShaLine(content: string, fileName: string): string | null {
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Accept formats like: "<sha>  <filename>"
    const parts = trimmed.split(/\s+/);
    const shaCandidate = parts[0];
    const assetCandidate = parts[parts.length - 1];

    if (assetCandidate === fileName && /^[a-fA-F0-9]{64}$/.test(shaCandidate)) {
      return shaCandidate.toLowerCase();
    }
  }
  return null;
}

// Single-line plain-hex SHA used by deno's Linux/Mac sha256sum sibling.
// Falls back to any 64-hex token in the body (covers labelled forms).
function parseStandaloneSha256(content: string): string | null {
  const firstToken = content.trim().split(/\s+/)[0] ?? '';
  if (/^[a-fA-F0-9]{64}$/.test(firstToken)) return firstToken.toLowerCase();
  const labelled = /\b([a-fA-F0-9]{64})\b/.exec(content);
  return labelled ? labelled[1].toLowerCase() : null;
}

// Deno Windows .sha256sum uses multi-line "Hash : <64-hex>" PowerShell
// format. Linux/Mac use parseStandaloneSha256 instead.
function parsePowerShellFileHash(content: string): string | null {
  const match = /^\s*Hash\s*:\s*([a-fA-F0-9]{64})\s*$/m.exec(content);
  return match ? match[1].toLowerCase() : null;
}

// Network plumbing handled by `got`: per-phase timeouts (DNS/TCP/TLS/header/idle/total),
// jittered exponential backoff, automatic redirect handling with retry on transient
// HTTP errors (408/429/5xx) and network errors (ECONNRESET/ETIMEDOUT/EAI_AGAIN/...).
// Replaces the bespoke https.get plumbing which had a single 30s blunt-instrument
// inactivity timer and no internal retry — this fragility was the root cause of
// `binary_setup_failed` events on slow/lossy user connections (esp. ffprobe + deno).
const HTTP_HEADERS: Record<string, string> = { 'user-agent': 'arroxy/1.0' };
const HTTP_RETRY = {
  limit: 5,
  methods: ['GET'] as Method[],
  statusCodes: [408, 413, 429, 500, 502, 503, 504],
  errorCodes: ['ETIMEDOUT', 'ECONNRESET', 'EADDRINUSE', 'ECONNREFUSED', 'EPIPE', 'ENOTFOUND', 'ENETUNREACH', 'EAI_AGAIN'],
  calculateDelay: ({ computedValue }: { computedValue: number }): number => (computedValue === 0 ? 0 : Math.min(60_000, computedValue) + Math.floor(Math.random() * 500))
};
const HTTP_TIMEOUT = {
  lookup: 5_000,
  connect: 10_000,
  secureConnect: 10_000,
  socket: 60_000,
  response: 30_000,
  send: 60_000,
  request: 600_000
};

async function downloadText(url: string, signal?: AbortSignal): Promise<string> {
  const req = got(url, { headers: HTTP_HEADERS, retry: HTTP_RETRY, timeout: HTTP_TIMEOUT, followRedirect: true });
  if (signal) {
    if (signal.aborted) {
      req.cancel();
      throw cancelError();
    }
    const onAbort = (): void => req.cancel();
    signal.addEventListener('abort', onAbort, { once: true });
    try {
      const res = await req;
      return res.body;
    } finally {
      signal.removeEventListener('abort', onAbort);
    }
  }
  const res = await req;
  return res.body;
}

function stringifyHeader(header: string | string[] | undefined): string | null {
  if (!header) return null;
  return Array.isArray(header) ? (header[0] ?? null) : header;
}

const RELEASE_TAG_LOCATION = /\/releases\/tag\/([^/?#]+)/;

function parseTagFromLocation(location: string | string[] | undefined): string | null {
  const value = stringifyHeader(location);
  if (!value) return null;
  const match = RELEASE_TAG_LOCATION.exec(value);
  return match ? decodeURIComponent(match[1]) : null;
}

function parseContentRangeStart(header: string | string[] | undefined): number | null {
  const value = Array.isArray(header) ? header[0] : header;
  if (!value) return null;
  const match = /^bytes\s+(\d+)-\d+\/(?:\d+|\*)$/i.exec(value.trim());
  return match ? Number(match[1]) : null;
}

function resolvePartialResponseMode(startByte: number, statusCode: number | undefined, contentRange: string | string[] | undefined): PartialResponseMode {
  if (startByte === 0) return 'fresh';
  if (statusCode === 416) return 'discard-and-retry';
  if (statusCode !== 206) return 'fresh';

  const resumedFrom = parseContentRangeStart(contentRange);
  if (resumedFrom !== null && resumedFrom !== startByte) {
    return 'discard-and-retry';
  }

  return 'append';
}

// Range-resume: if `${destination}.part` exists from a previous interrupted
// attempt, resume via `Range: bytes=<size>-`. If the server responds 200
// (no range support) instead of 206, truncate and start fresh.
async function downloadFile(url: string, destination: string, onProgress?: DownloadProgressCallback, allowPartialRetry = true, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) throw cancelError();
  await fsPromises.mkdir(path.dirname(destination), { recursive: true });

  const partPath = `${destination}.part`;
  let startByte = 0;
  try {
    const stat = await fsPromises.stat(partPath);
    if (stat.isFile() && stat.size > 0) startByte = stat.size;
  } catch {
    // no partial file
  }

  const headers: Record<string, string> = { ...HTTP_HEADERS };
  if (startByte > 0) headers.range = `bytes=${startByte}-`;

  const stream = got.stream(url, { headers, retry: HTTP_RETRY, timeout: HTTP_TIMEOUT, followRedirect: true });
  const onAbort = (): void => {
    stream.destroy(cancelError());
  };
  if (signal) {
    if (signal.aborted) onAbort();
    else signal.addEventListener('abort', onAbort, { once: true });
  }

  try {
    await new Promise<void>((resolve, reject) => {
      let out: fs.WriteStream | null = null;
      let settled = false;
      const finish = (err?: Error): void => {
        if (settled) return;
        settled = true;
        if (err) reject(err);
        else resolve();
      };

      stream.once('response', (res: { statusCode?: number; headers: Record<string, string | string[] | undefined> }) => {
        const mode = resolvePartialResponseMode(startByte, res.statusCode, res.headers['content-range']);
        if (mode === 'discard-and-retry') {
          stream.destroy(new RestartFreshDownloadError(`Discarding stale partial for ${path.basename(destination)}`));
          return;
        }

        out = fs.createWriteStream(partPath, { flags: mode === 'append' ? 'a' : 'w' });
        out.on('error', finish);
        stream.pipe(out);
        out.on('finish', () => finish());
      });
      stream.on('downloadProgress', ({ transferred, total }: { transferred: number; total: number }) => {
        onProgress?.(startByte + transferred, total > 0 ? startByte + total : undefined);
      });
      stream.once('error', (err: Error) => finish(err));
    });
  } catch (err) {
    if (allowPartialRetry && err instanceof RestartFreshDownloadError) {
      logger.warn('Stale partial detected, retrying binary download from byte 0', {
        destination,
        startByte
      });
      await fsPromises.rm(partPath, { force: true });
      if (signal) signal.removeEventListener('abort', onAbort);
      return downloadFile(url, destination, onProgress, false, signal);
    }
    throw err;
  } finally {
    if (signal) signal.removeEventListener('abort', onAbort);
  }

  await fsPromises.rename(partPath, destination);
}

async function sha256ForFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(hash.digest('hex').toLowerCase()));
  });
}

// Upstream sources still reached at runtime. ffmpeg + ffprobe are no longer
// here — they ship via electron-builder extraResources (see fetch-embedded.sh
// + bundledBinaryPath above). Only yt-dlp + deno remain runtime-fetched.
const BINARY_SOURCES = {
  ytDlpNightly: {
    download: 'https://github.com/yt-dlp/yt-dlp-nightly-builds/releases/latest/download',
    latest: 'https://github.com/yt-dlp/yt-dlp-nightly-builds/releases/latest'
  },
  ytDlpStable: {
    download: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download',
    latest: 'https://github.com/yt-dlp/yt-dlp/releases/latest'
  },
  deno: {
    download: 'https://github.com/denoland/deno/releases/latest/download'
  }
} as const;

type AssetPlatform = 'win32' | 'darwin' | 'linux';
type AssetArch = 'arm64' | 'x64';

// yt-dlp_macos is a Mach-O universal binary (x86_64 + arm64); yt-dlp_macos_legacy
// was discontinued upstream and now 404s on every release tag.
const YT_DLP_ASSETS: Record<AssetPlatform, Record<AssetArch, string>> = {
  win32: { x64: 'yt-dlp.exe', arm64: 'yt-dlp.exe' },
  darwin: { x64: 'yt-dlp_macos', arm64: 'yt-dlp_macos' },
  linux: { x64: 'yt-dlp_linux', arm64: 'yt-dlp_linux_aarch64' }
};

// Deno releases ship as ZIPs named deno-<rust-target>.zip on the GitHub release
// page. The archive contains a single binary (deno or deno.exe).
// Note: Windows ARM64 has no official deno build yet — null falls back to no JS runtime.
const DENO_ASSETS: Record<AssetPlatform, Record<AssetArch, string | null>> = {
  win32: { x64: 'x86_64-pc-windows-msvc', arm64: null },
  darwin: { x64: 'x86_64-apple-darwin', arm64: 'aarch64-apple-darwin' },
  linux: { x64: 'x86_64-unknown-linux-gnu', arm64: 'aarch64-unknown-linux-gnu' }
};

function currentAssetTarget(): { platform: AssetPlatform; arch: AssetArch } | null {
  const platform = process.platform;
  if (platform !== 'win32' && platform !== 'darwin' && platform !== 'linux') return null;
  const arch: AssetArch = process.arch === 'arm64' ? 'arm64' : 'x64';
  return { platform, arch };
}

function ytDlpAssetName(): string {
  const target = currentAssetTarget();
  if (!target) return 'yt-dlp_linux';
  return YT_DLP_ASSETS[target.platform][target.arch];
}

function denoAssetTarget(): string | null {
  const target = currentAssetTarget();
  if (!target) return null;
  return DENO_ASSETS[target.platform][target.arch];
}

function denoAssetName(): string | null {
  const target = denoAssetTarget();
  return target ? `deno-${target}.zip` : null;
}

function denoExecutableName(): string {
  return process.platform === 'win32' ? 'deno.exe' : 'deno';
}

// Resolve absolute path to a build-time-embedded ffmpeg/ffprobe binary.
//
// Production: binaries ship via electron-builder `extraResources`, so they
// land in `process.resourcesPath` (Mac: Arroxy.app/Contents/Resources, Win:
// <install>/resources, Linux AppImage: /tmp/.mount_*/resources).
//
// Development: scripts/build/fetch-embedded.sh populates
// build/embedded/<platform>-<arch>/ once before `bun run dev`, so the
// dev branch reads from there to mirror the production layout.
function bundledBinaryPath(name: 'ffmpeg' | 'ffprobe'): string {
  const ext = process.platform === 'win32' ? '.exe' : '';
  const fileName = `${name}${ext}`;
  if (app.isPackaged) {
    return path.join(process.resourcesPath, fileName);
  }
  const arch = process.arch === 'arm64' ? 'arm64' : 'x64';
  // __dirname in dev points at the electron-vite-compiled main bundle
  // (out/main). Resolve up to repo root, then into build/embedded/.
  return path.join(__dirname, '..', '..', 'build', 'embedded', `${process.platform}-${arch}`, fileName);
}

// Directory containing the embedded ffmpeg/ffprobe pair. Used by
// spawnYtDlp + spawnFFmpeg to set LD_LIBRARY_PATH (Linux) so BtbN's
// shared libav*.so.* siblings resolve.
// Bound recursion so a malicious archive (deep tree or symlink cycle) cannot
// stall extraction. Used by deno's zip extractor.
const ARCHIVE_TREE_MAX_DEPTH = 8;

interface EnsureBinaryConfig {
  name: string;
  destinationPath: string;
  downloadUrl: string;
  expectedSha256?: () => Promise<string | null>;
  onStatus?: StatusReporter;
  onDownloadProgress?: DownloadProgressCallback;
  requiredChecksum?: boolean;
  isUpToDate?: () => Promise<boolean>;
  signal?: AbortSignal;
}

export class BinaryManager {
  private readonly cacheDir: string;

  private readonly retryDelays: [number, number];

  private readonly inProgress = new Map<string, Promise<void>>();

  private readonly overridesProvider: () => BinaryOverrides | undefined;

  private resolved: Partial<Record<DependencyId, string>> = {};

  private lastDiagnostics: Partial<Record<DependencyId, DependencyDiagnostic>> = {};

  constructor(userDataPath: string, options?: { retryDelays?: [number, number]; overridesProvider?: () => BinaryOverrides | undefined }) {
    this.cacheDir = path.join(userDataPath, 'runtime-cache', 'binaries');
    this.retryDelays = options?.retryDelays ?? [2000, 8000];
    this.overridesProvider = options?.overridesProvider ?? ((): BinaryOverrides | undefined => undefined);
  }

  getRuntimeCacheDir(): string {
    return this.cacheDir;
  }

  getResolvedPath(id: DependencyId): string | null {
    return this.resolved[id] ?? null;
  }

  getLastDiagnostic(id: DependencyId): DependencyDiagnostic | null {
    return this.lastDiagnostics[id] ?? null;
  }

  invalidateResolved(): void {
    this.resolved = {};
    this.lastDiagnostics = {};
  }

  getYtDlpPath(): string {
    return this.resolved['yt-dlp'] ?? process.env.ARROXY_YT_DLP_PATH ?? path.join(this.cacheDir, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
  }

  getFfmpegPath(): string {
    return this.resolved.ffmpeg ?? process.env.ARROXY_FFMPEG_PATH ?? bundledBinaryPath('ffmpeg');
  }

  getDenoPath(): string {
    return this.resolved.deno ?? process.env.ARROXY_DENO_PATH ?? path.join(this.cacheDir, denoExecutableName());
  }

  getFfprobePath(): string {
    return this.resolved.ffprobe ?? process.env.ARROXY_FFPROBE_PATH ?? bundledBinaryPath('ffprobe');
  }

  // Probe-and-record helper used by every resolve chain. Runs the binary's
  // version probe; on success records the path in `resolved` and emits a
  // 'done' progress event. On failure records the failure on the last
  // attempt and emits a 'failed' progress event. The resolve chain decides
  // whether to fall through to the next attempt.
  private async probeAndAccept(id: DependencyId, source: DependencySource, candidatePath: string, attempts: DependencyAttempt[], onProgress?: ProgressEmitter, signal?: AbortSignal): Promise<DependencyDiagnostic | null> {
    onProgress?.({ binary: id, phase: 'probing', source });
    const probe = await probeBinary(candidatePath, probeArgs(id), PROBE_TIMEOUT_MS, signal);
    if (probe.ok) {
      attempts.push(makeAttempt(source));
      this.resolved[id] = candidatePath;
      onProgress?.({ binary: id, phase: 'done', source });
      const diag = runnableDiagnostic(id, source, candidatePath, attempts, probe.output);
      this.lastDiagnostics[id] = diag;
      logger.info(`${id} probe ok`, { source, path: candidatePath, version: probe.output.split('\n')[0] });
      return diag;
    }
    attempts.push(makeAttempt(source, probe.failure));
    onProgress?.({ binary: id, phase: 'failed', source, failureKind: probe.failure.kind });
    logger.warn(`${id} probe failed`, { source, path: candidatePath, failureKind: probe.failure.kind, message: probe.failure.message });
    return null;
  }

  async resolveYtDlp(opts: ResolveOptions = {}): Promise<DependencyDiagnostic> {
    const id: DependencyId = 'yt-dlp';
    const attempts: DependencyAttempt[] = [];
    const overrides = opts.overrides ?? this.overridesProvider();
    const onProgress = opts.onProgress;
    const signal = opts.signal;
    onProgress?.({ binary: id, phase: 'starting' });

    if (overrides?.ytDlp) {
      const source: DependencySource = { kind: 'manualOverride', path: overrides.ytDlp };
      const diag = await this.probeAndAccept(id, source, overrides.ytDlp, attempts, onProgress, signal);
      if (diag) return diag;
    }

    const envPath = process.env.ARROXY_YT_DLP_PATH;
    if (envPath) {
      const source: DependencySource = { kind: 'envOverride', path: envPath, envVar: 'ARROXY_YT_DLP_PATH' };
      const diag = await this.probeAndAccept(id, source, envPath, attempts, onProgress, signal);
      if (diag) return diag;
    }

    const assetName = ytDlpAssetName();

    // Managed nightly
    const nightlyPath = path.join(this.cacheDir, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
    const nightlyUrl = `${BINARY_SOURCES.ytDlpNightly.download}/${assetName}`;
    {
      const source: DependencySource = { kind: 'managed', channel: 'nightly', url: nightlyUrl };
      const downloadOk = await this.tryManagedDownload(id, attempts, source, onProgress, () =>
        this.ensureBinary({
          name: 'yt-dlp',
          destinationPath: nightlyPath,
          downloadUrl: nightlyUrl,
          expectedSha256: async () => parseShaLine(await downloadText(`${BINARY_SOURCES.ytDlpNightly.download}/SHA2-256SUMS`, signal), assetName),
          onStatus: opts.onStatus,
          onDownloadProgress: makeDownloadProgress(id, source, onProgress),
          requiredChecksum: true,
          isUpToDate: () => this.isYtDlpUpToDate(nightlyPath, BINARY_SOURCES.ytDlpNightly.latest, signal),
          signal
        })
      );
      if (downloadOk) {
        const diag = await this.probeAndAccept(id, source, nightlyPath, attempts, onProgress, signal);
        if (diag) return diag;
      }
    }

    // Managed stable
    onProgress?.({ binary: id, phase: 'fallback' });
    const stablePath = path.join(this.cacheDir, process.platform === 'win32' ? 'yt-dlp-stable.exe' : 'yt-dlp-stable');
    const stableUrl = `${BINARY_SOURCES.ytDlpStable.download}/${assetName}`;
    {
      const source: DependencySource = { kind: 'managed', channel: 'stable', url: stableUrl };
      const downloadOk = await this.tryManagedDownload(id, attempts, source, onProgress, () =>
        this.ensureBinary({
          name: 'yt-dlp',
          destinationPath: stablePath,
          downloadUrl: stableUrl,
          expectedSha256: async () => parseShaLine(await downloadText(`${BINARY_SOURCES.ytDlpStable.download}/SHA2-256SUMS`, signal), assetName),
          onStatus: opts.onStatus,
          onDownloadProgress: makeDownloadProgress(id, source, onProgress),
          requiredChecksum: true,
          isUpToDate: () => this.isYtDlpUpToDate(stablePath, BINARY_SOURCES.ytDlpStable.latest, signal),
          signal
        })
      );
      if (downloadOk) {
        const diag = await this.probeAndAccept(id, source, stablePath, attempts, onProgress, signal);
        if (diag) return diag;
      }
    }

    // System PATH — last resort. Picks up brew/pipx/distro-package installs
    // when managed download is unreachable (firewalled, rate-limited, etc.).
    onProgress?.({ binary: id, phase: 'fallback' });
    const pathBinaryName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
    const candidates = await whereOnPath(pathBinaryName, signal);
    for (const candidate of candidates) {
      const source: DependencySource = { kind: 'systemPath', path: candidate };
      const diag = await this.probeAndAccept(id, source, candidate, attempts, onProgress, signal);
      if (diag) return diag;
    }

    const diag = failedDiagnostic(id, attempts);
    this.lastDiagnostics[id] = diag;
    return diag;
  }

  // Wraps a managed-download attempt, recording download/extract/hash failures
  // as attempts on the chain. Returns true if the file is on disk after the
  // call (probe still has to run separately).
  private recordManagedFailure(id: DependencyId, attempts: DependencyAttempt[], source: DependencySource, onProgress: ProgressEmitter | undefined, err: unknown): void {
    const failure: DependencyFailure = { kind: classifyDownloadError(err), message: errorMessage(err) };
    attempts.push(makeAttempt(source, failure));
    onProgress?.({ binary: id, phase: 'failed', source, failureKind: failure.kind });
    const tracked = id === 'yt-dlp' ? 'ytdlp' : id;
    trackMain('binary_setup_failed', { binary: tracked, phase: failure.kind, code: FAILURE_CODE[failure.kind] });
    logger.warn(`${id} managed download failed`, { source, error: failure.message });
  }

  private async tryManagedDownload(id: DependencyId, attempts: DependencyAttempt[], source: DependencySource, onProgress: ProgressEmitter | undefined, run: () => Promise<void>): Promise<boolean> {
    onProgress?.({ binary: id, phase: 'downloading', source });
    try {
      await run();
      onProgress?.({ binary: id, phase: 'extracting', source });
      return true;
    } catch (err) {
      this.recordManagedFailure(id, attempts, source, onProgress, err);
      return false;
    }
  }

  async ensureYtDlp(onStatus?: StatusReporter, onDownloadProgress?: DownloadProgressCallback): Promise<string> {
    if (this.resolved['yt-dlp']) return this.resolved['yt-dlp'];
    const onProgress: ProgressEmitter | undefined = onDownloadProgress
      ? (event): void => {
          if (event.phase === 'downloading' && typeof event.bytesDownloaded === 'number') {
            onDownloadProgress(event.bytesDownloaded, event.totalBytes);
          }
        }
      : undefined;
    const diag = await this.resolveYtDlp({ onStatus, onProgress });
    if (diag.state !== 'runnable' || !diag.resolvedPath) {
      throw new Error(diag.failure?.message ?? 'yt-dlp could not be resolved');
    }
    return diag.resolvedPath;
  }

  // ffprobe is required by yt-dlp's post-processing (chapter modification,
  // SponsorBlock-remove, embed-thumbnail, --add-metadata) to read media
  // duration. Downloaded at runtime from the canonical FFmpeg distributions
  // (BtbN for Win/Linux, evermeet.cx for macOS) and cached under
  // runtime-cache/binaries/ so it lives next to ffmpeg — this way
  // spawnYtDlp's existing PATH injection finds both with one PATH entry.
  // Returns null if the platform/arch has no upstream build; the caller
  // tolerates this (ffprobe is only needed by certain post-processors).
  // ffmpeg + ffprobe ship via electron-builder extraResources at build time.
  // Resolve order per binary: manualOverride → envOverride → bundled probe.
  // No download/extract/checksum/retry — fetch-embedded.sh did all that during
  // CI build. Pair coherence solved by construction (one matched archive →
  // both binaries land together in process.resourcesPath).
  async resolveFFmpegPair(opts: ResolveOptions = {}): Promise<{ ffmpeg: DependencyDiagnostic; ffprobe: DependencyDiagnostic }> {
    const overrides = opts.overrides ?? this.overridesProvider();
    const onProgress = opts.onProgress;
    const signal = opts.signal;

    const resolveOne = async (id: 'ffmpeg' | 'ffprobe', overridePath: string | undefined, envVar: string): Promise<DependencyDiagnostic> => {
      const attempts: DependencyAttempt[] = [];
      onProgress?.({ binary: id, phase: 'starting' });

      if (overridePath) {
        const source: DependencySource = { kind: 'manualOverride', path: overridePath };
        const diag = await this.probeAndAccept(id, source, overridePath, attempts, onProgress, signal);
        if (diag) return diag;
      }

      const envPath = process.env[envVar];
      if (envPath) {
        const source: DependencySource = { kind: 'envOverride', path: envPath, envVar };
        const diag = await this.probeAndAccept(id, source, envPath, attempts, onProgress, signal);
        if (diag) return diag;
      }

      const bundled = bundledBinaryPath(id);
      const source: DependencySource = { kind: 'bundled', path: bundled };
      const diag = await this.probeAndAccept(id, source, bundled, attempts, onProgress, signal);
      if (diag) return diag;

      const failed = failedDiagnostic(id, attempts);
      this.lastDiagnostics[id] = failed;
      return failed;
    };

    const [ffmpeg, ffprobe] = await Promise.all([resolveOne('ffmpeg', overrides?.ffmpeg, 'ARROXY_FFMPEG_PATH'), resolveOne('ffprobe', overrides?.ffprobe, 'ARROXY_FFPROBE_PATH')]);
    return { ffmpeg, ffprobe };
  }

  // Single-binary resolve helper: manual override → env override → managed
  // download. Used by resolveDeno.
  private async resolveSingleBinary(id: DependencyId, manualPath: string | undefined, envPath: string | undefined, envVar: string, doManaged: (source: DependencySource, attempts: DependencyAttempt[]) => Promise<string | null>, managedSource: DependencySource, opts: ResolveOptions): Promise<DependencyDiagnostic> {
    const attempts: DependencyAttempt[] = [];
    const onProgress = opts.onProgress;
    const signal = opts.signal;
    onProgress?.({ binary: id, phase: 'starting' });

    if (manualPath) {
      const source: DependencySource = { kind: 'manualOverride', path: manualPath };
      const diag = await this.probeAndAccept(id, source, manualPath, attempts, onProgress, signal);
      if (diag) return diag;
    }

    if (envPath) {
      const source: DependencySource = { kind: 'envOverride', path: envPath, envVar };
      const diag = await this.probeAndAccept(id, source, envPath, attempts, onProgress, signal);
      if (diag) return diag;
    }

    const managedPath = await doManaged(managedSource, attempts);
    if (managedPath) {
      const diag = await this.probeAndAccept(id, managedSource, managedPath, attempts, onProgress, signal);
      if (diag) return diag;
    }

    const diag = failedDiagnostic(id, attempts);
    this.lastDiagnostics[id] = diag;
    return diag;
  }

  async ensureFFmpeg(onStatus?: StatusReporter, onDownloadProgress?: DownloadProgressCallback): Promise<string | null> {
    if (this.resolved.ffmpeg) return this.resolved.ffmpeg;
    const onProgress = wrapDownloadProgressEmitter(onDownloadProgress);
    const pair = await this.resolveFFmpegPair({ onStatus, onProgress });
    return pair.ffmpeg.resolvedPath;
  }

  async ensureFFprobe(onStatus?: StatusReporter, onDownloadProgress?: DownloadProgressCallback): Promise<string | null> {
    if (this.resolved.ffprobe) return this.resolved.ffprobe;
    const onProgress = wrapDownloadProgressEmitter(onDownloadProgress);
    const pair = await this.resolveFFmpegPair({ onStatus, onProgress });
    return pair.ffprobe.resolvedPath;
  }

  // Deno is the JS runtime yt-dlp uses for nsig/signature decoding on the web
  // client. Without it, yt-dlp silently drops every JS-needing client and
  // falls back to android_vr — which our PoT (bound to web.gvs) can't help.
  // Returns null when:
  //   - the platform/arch has no upstream deno build (Windows ARM64), or
  //   - download/extraction failed for any reason.
  // The caller (YtDlp) treats null as "skip --js-runtimes" rather than failing
  // the download. Bot-block fallbacks still cover us.
  async resolveDeno(opts: ResolveOptions = {}): Promise<DependencyDiagnostic> {
    const id: DependencyId = 'deno';
    const overrides = opts.overrides ?? this.overridesProvider();
    const onProgress = opts.onProgress;
    const signal = opts.signal;

    const assetName = denoAssetName();
    if (!assetName) {
      const diag: DependencyDiagnostic = { id, state: 'failed', source: null, resolvedPath: null, attempts: [], failure: { kind: 'spawn_failed', message: 'No deno build for this platform/arch' } };
      this.lastDiagnostics[id] = diag;
      onProgress?.({ binary: id, phase: 'skipped' });
      return diag;
    }

    return this.resolveSingleBinary(
      id,
      overrides?.deno,
      process.env.ARROXY_DENO_PATH,
      'ARROXY_DENO_PATH',
      async (source, attempts) => {
        const targetPath = path.join(this.cacheDir, denoExecutableName());
        if (await this.isUsableBinary(targetPath)) return targetPath;
        const downloadUrl = `${BINARY_SOURCES.deno.download}/${assetName}`;
        const checksumUrl = `${downloadUrl}.sha256sum`;
        const downloadOk = await this.tryManagedDownload(id, attempts, source, onProgress, () =>
          this.ensureZippedBinary({
            name: 'deno',
            downloadUrl,
            zipFileName: assetName,
            innerExecutableName: denoExecutableName(),
            destinationPath: targetPath,
            onDownloadProgress: makeDownloadProgress(id, source, onProgress),
            signal,
            expectedSha256: async () => {
              try {
                const checksumText = await downloadText(checksumUrl, signal);
                return parseShaLine(checksumText, assetName) ?? parseStandaloneSha256(checksumText) ?? parsePowerShellFileHash(checksumText);
              } catch {
                return null;
              }
            },
            onStatus: opts.onStatus
          })
        );
        return downloadOk ? targetPath : null;
      },
      { kind: 'managed', channel: 'default', url: `${BINARY_SOURCES.deno.download}/${assetName}` },
      opts
    );
  }

  async ensureDeno(onStatus?: StatusReporter, onDownloadProgress?: DownloadProgressCallback): Promise<string | null> {
    if (this.resolved.deno) return this.resolved.deno;
    const onProgress = wrapDownloadProgressEmitter(onDownloadProgress);
    const diag = await this.resolveDeno({ onStatus, onProgress });
    return diag.resolvedPath;
  }

  private async ensureZippedBinary(config: { name: string; downloadUrl: string; zipFileName: string; innerExecutableName: string; destinationPath: string; expectedSha256: () => Promise<string | null>; requiredChecksum?: boolean; onStatus?: StatusReporter; onDownloadProgress?: DownloadProgressCallback; signal?: AbortSignal }): Promise<void> {
    const { destinationPath, name, onStatus, onDownloadProgress, signal } = config;

    const existing = this.inProgress.get(destinationPath);
    if (existing) return existing;

    const promise = (async (): Promise<void> => {
      const tempDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), `arroxy-${name}-`));
      const zipPath = path.join(tempDir, config.zipFileName);

      try {
        onStatus?.('downloadingBinary', { name });
        logger.info(`Downloading ${name}`, {
          downloadUrl: config.downloadUrl,
          destinationPath
        });

        await downloadFile(config.downloadUrl, zipPath, onDownloadProgress, true, signal);

        const expected = await config.expectedSha256();
        if (expected) {
          const actual = await sha256ForFile(zipPath);
          if (actual !== expected) {
            throw new Error(`${name} checksum mismatch. Expected ${expected.slice(0, 8)}..., got ${actual.slice(0, 8)}...`);
          }
        } else if (config.requiredChecksum) {
          throw new Error(`Checksum source unavailable for ${name}. Refusing to use unverified archive.`);
        } else {
          logger.warn(`Checksum unavailable for ${name}, proceeding without verification`);
        }

        const extractDir = path.join(tempDir, 'unpacked');
        await fsPromises.mkdir(extractDir, { recursive: true });
        await extractZip(zipPath, { dir: extractDir });

        const innerPath = await this.findExecutableInTree(extractDir, config.innerExecutableName);
        if (!innerPath) {
          throw new Error(`${name} archive did not contain ${config.innerExecutableName}`);
        }

        await fsPromises.mkdir(path.dirname(destinationPath), { recursive: true });
        // copyFile (rather than rename) handles cross-device temp dirs.
        await fsPromises.copyFile(innerPath, destinationPath);
        if (process.platform !== 'win32') {
          await fsPromises.chmod(destinationPath, 0o755);
        }
      } finally {
        await fsPromises.rm(tempDir, { recursive: true, force: true });
      }
    })().finally(() => {
      this.inProgress.delete(destinationPath);
    });

    this.inProgress.set(destinationPath, promise);
    return promise;
  }

  private async findExecutableInTree(root: string, name: string, depth = 0): Promise<string | null> {
    if (depth > ARCHIVE_TREE_MAX_DEPTH) return null;
    const entries = await fsPromises.readdir(root, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue;
      const full = path.join(root, entry.name);
      if (entry.isDirectory()) {
        const nested = await this.findExecutableInTree(full, name, depth + 1);
        if (nested) return nested;
      } else if (entry.isFile() && entry.name === name) {
        return full;
      }
    }
    return null;
  }

  private async ensureBinary(config: EnsureBinaryConfig): Promise<void> {
    const { destinationPath, name } = config;

    if (await this.isUsableBinary(destinationPath)) {
      const upToDate = !config.isUpToDate || (await config.isUpToDate());
      if (upToDate) {
        logger.info(`${name} binary already exists`, { destinationPath });
        return;
      }
      logger.info(`${name} binary is outdated, re-downloading`);
    }

    const existing = this.inProgress.get(destinationPath);
    if (existing) return existing;

    const promise = this.downloadBinary(config).finally(() => {
      this.inProgress.delete(destinationPath);
    });
    this.inProgress.set(destinationPath, promise);
    return promise;
  }

  private async downloadBinary(config: EnsureBinaryConfig): Promise<void> {
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (config.signal?.aborted) throw cancelError();
      try {
        await this.attemptDownload(config);
        return;
      } catch (err) {
        if (config.signal?.aborted) throw err;
        const isChecksumError = err instanceof Error && err.message.toLowerCase().includes('checksum');
        if (isChecksumError || attempt === maxAttempts) throw err;
        const delay = attempt === 1 ? this.retryDelays[0] : this.retryDelays[1];
        logger.warn(`${config.name} download failed, retrying in ${delay}ms`, {
          attempt,
          error: err instanceof Error ? err.message : String(err)
        });
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  private async attemptDownload(config: EnsureBinaryConfig): Promise<void> {
    const { destinationPath, name, downloadUrl, expectedSha256, onStatus, onDownloadProgress, requiredChecksum = false, signal } = config;

    const tempPath = `${destinationPath}.tmp`;
    onStatus?.('downloadingBinary', { name });
    logger.info(`Downloading ${name}`, { downloadUrl, destinationPath });

    await downloadFile(downloadUrl, tempPath, onDownloadProgress, true, signal);

    if (expectedSha256) {
      const expected = await expectedSha256();
      if (!expected && requiredChecksum) {
        await fsPromises.rm(tempPath, { force: true });
        throw new Error(`Checksum source unavailable for ${name}. Refusing to use unverified binary.`);
      }

      if (expected) {
        const actual = await sha256ForFile(tempPath);
        if (actual !== expected) {
          await fsPromises.rm(tempPath, { force: true });
          throw new Error(`${name} checksum mismatch. Expected ${expected.slice(0, 8)}..., got ${actual.slice(0, 8)}...`);
        }
      } else {
        logger.warn(`Checksum unavailable for ${name}, proceeding without verification`);
      }
    }

    await fsPromises.mkdir(path.dirname(destinationPath), { recursive: true });
    await fsPromises.rename(tempPath, destinationPath);

    if (process.platform !== 'win32') {
      await fsPromises.chmod(destinationPath, 0o755);
    }
  }

  private async isYtDlpUpToDate(binaryPath: string, releaseLatestUrl: string, signal?: AbortSignal): Promise<boolean> {
    const result = await this.checkYtDlpVersion(binaryPath, releaseLatestUrl, signal);
    switch (result.state) {
      case 'up-to-date':
        logger.info('yt-dlp is up to date', { version: result.local });
        return true;
      case 'outdated':
        logger.info('yt-dlp update available', { local: result.local, remote: result.remote });
        return false;
      case 'unknown':
        logger.warn('yt-dlp version check unknown, keeping existing binary', { reason: result.reason });
        return true;
      case 'unusable':
        logger.warn('yt-dlp local binary unusable, will re-download');
        return false;
    }
  }

  private async checkYtDlpVersion(binaryPath: string, releaseLatestUrl: string, signal?: AbortSignal): Promise<YtDlpVersionCheck> {
    const [local, remote] = await Promise.all([this.getLocalYtDlpVersion(binaryPath, signal), this.getRemoteYtDlpVersion(releaseLatestUrl, signal)]);
    if (!local) return { state: 'unusable' };
    if (remote.tag === null) return { state: 'unknown', local, reason: remote.reason };
    if (local !== remote.tag) return { state: 'outdated', local, remote: remote.tag };
    return { state: 'up-to-date', local };
  }

  private async getLocalYtDlpVersion(binaryPath: string, signal?: AbortSignal): Promise<string | null> {
    try {
      const { stdout } = await execFileAsync(binaryPath, ['--version'], { signal });
      return stdout.trim();
    } catch {
      return null;
    }
  }

  private async getRemoteYtDlpVersion(releaseLatestUrl: string, signal?: AbortSignal): Promise<RemoteVersionLookup> {
    const req = got(releaseLatestUrl, {
      method: 'GET',
      headers: HTTP_HEADERS,
      retry: HTTP_RETRY,
      timeout: HTTP_TIMEOUT,
      followRedirect: false,
      throwHttpErrors: false
    });

    const onAbort = signal ? (): void => req.cancel() : null;
    if (signal) {
      if (signal.aborted) {
        req.cancel();
        return { tag: null, reason: 'cancelled' };
      }
      signal.addEventListener('abort', onAbort!, { once: true });
    }

    try {
      const res = await req;
      const tag = parseTagFromLocation(res.headers.location);
      if (tag) return { tag, reason: null };
      const reason = `no tag in redirect (status=${res.statusCode}, location=${stringifyHeader(res.headers.location) ?? 'none'})`;
      logger.warn('yt-dlp remote version fetch returned no tag', { url: releaseLatestUrl, statusCode: res.statusCode });
      return { tag: null, reason };
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      logger.warn('yt-dlp remote version fetch failed', { url: releaseLatestUrl, err: reason });
      return { tag: null, reason };
    } finally {
      if (signal && onAbort) signal.removeEventListener('abort', onAbort);
    }
  }

  private async isUsableBinary(binaryPath: string): Promise<boolean> {
    try {
      const mode = process.platform === 'win32' ? fsConstants.F_OK : fsConstants.X_OK;
      await fsPromises.access(binaryPath, mode);
      return true;
    } catch {
      return false;
    }
  }
}

export const binaryInternals = {
  parseShaLine,
  parseStandaloneSha256,
  parsePowerShellFileHash,
  parseContentRangeStart,
  resolvePartialResponseMode,
  ytDlpAssetName,
  denoAssetName,
  denoAssetTarget,
  denoExecutableName,
  sha256ForFile,
  classifyProbeError,
  classifyDownloadError,
  whereOnPath,
  bundledBinaryPath
};
