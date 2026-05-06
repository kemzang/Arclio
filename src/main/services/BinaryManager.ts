import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs, { constants as fsConstants } from 'node:fs';
import fsPromises from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import extractZip from 'extract-zip';
import got, { type Method } from 'got';
import log from 'electron-log/main';

const execFileAsync = promisify(execFile);
import { trackMain } from '@main/services/analytics';
import type { BinaryOverrides, DependencyAttempt, DependencyDiagnostic, DependencyFailure, DependencyFailureKind, DependencyId, DependencySource, StatusKey, WarmupProgressEvent } from '@shared/types';

type StatusReporter = (statusKey: StatusKey, params?: Record<string, string | number>) => void;
type DownloadProgressCallback = (downloaded: number, total: number | undefined) => void;
type ProgressEmitter = (event: WarmupProgressEvent) => void;

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
  return new Promise((resolve) => {
    let settled = false;
    const child = execFile(filePath, args, { timeout: timeoutMs, windowsHide: true, maxBuffer: 1024 * 1024, signal }, (err, stdout, stderr) => {
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
      throw new Error('Cancelled');
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
  if (signal?.aborted) throw new Error('Cancelled');
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
    stream.destroy(new Error('Cancelled'));
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

// One place for every upstream URL/host the bootstrap touches. Keep this
// block as the single grep target — every code path that downloads a binary
// or hits a release index reads from here.
const BINARY_SOURCES = {
  ytDlpNightly: {
    download: 'https://github.com/yt-dlp/yt-dlp-nightly-builds/releases/latest/download',
    api: 'https://api.github.com/repos/yt-dlp/yt-dlp-nightly-builds/releases/latest'
  },
  ytDlpStable: {
    download: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download',
    api: 'https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest'
  },
  deno: {
    download: 'https://github.com/denoland/deno/releases/latest/download'
  },
  ffmpegStatic: {
    // eugeneware/ffmpeg-static, pinned to b6.0 (last tag with full platform
    // matrix). Used on Linux/macOS as the single ffmpeg binary.
    download: 'https://github.com/eugeneware/ffmpeg-static/releases/download/b6.0'
  },
  ffmpegBtbn: {
    // BtbN — Linux ffprobe (tar.xz, contains bin/ffprobe).
    download: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest'
  },
  ffmpegGyan: {
    // gyan.dev — Win ffmpeg + ffprobe pair (essentials ZIP, ~30 MB).
    download: 'https://www.gyan.dev/ffmpeg/builds',
    essentialsArchive: 'ffmpeg-release-essentials.zip'
  },
  ffmpegEvermeet: {
    // evermeet.cx — macOS ffprobe (.zip, redirects to latest).
    ffprobeZip: 'https://evermeet.cx/ffmpeg/getrelease/ffprobe/zip'
  }
} as const;

type AssetPlatform = 'win32' | 'darwin' | 'linux';
type AssetArch = 'arm64' | 'x64';

const YT_DLP_ASSETS: Record<AssetPlatform, Record<AssetArch, string>> = {
  win32: { x64: 'yt-dlp.exe', arm64: 'yt-dlp.exe' },
  darwin: { x64: 'yt-dlp_macos_legacy', arm64: 'yt-dlp_macos' },
  linux: { x64: 'yt-dlp_linux', arm64: 'yt-dlp_linux_aarch64' }
};

const FFMPEG_ASSETS: Record<AssetPlatform, Record<AssetArch, string>> = {
  win32: { x64: 'ffmpeg-win32-x64', arm64: 'ffmpeg-win32-arm64' },
  darwin: { x64: 'ffmpeg-darwin-x64', arm64: 'ffmpeg-darwin-arm64' },
  linux: { x64: 'ffmpeg-linux-x64', arm64: 'ffmpeg-linux-arm64' }
};

// Deno releases ship as ZIPs named deno-<rust-target>.zip on the GitHub release
// page. The archive contains a single binary (deno or deno.exe).
// Note: Windows ARM64 has no official deno build yet — null falls back to no JS runtime.
const DENO_ASSETS: Record<AssetPlatform, Record<AssetArch, string | null>> = {
  win32: { x64: 'x86_64-pc-windows-msvc', arm64: null },
  darwin: { x64: 'x86_64-apple-darwin', arm64: 'aarch64-apple-darwin' },
  linux: { x64: 'x86_64-unknown-linux-gnu', arm64: 'aarch64-unknown-linux-gnu' }
};

// ffprobe is shipped alongside ffmpeg in the canonical FFmpeg distributions.
// We pull it at runtime instead of bundling via @ffprobe-installer/* npm
// optional deps, which were unreliable on cross-platform CI: bun's frozen
// lockfile sometimes skips the host-platform optional, and electron-builder
// can't unpack what was never installed.
//
// - Win/Linux: BtbN/FFmpeg-Builds — single `latest` rolling tag, archives
//   contain bin/ffprobe(.exe). Linux is .tar.xz (extracted via system tar).
// - macOS: evermeet.cx — ships ffprobe as a standalone .zip; the
//   /getrelease/ffprobe/zip endpoint redirects to the latest version.
type FfprobeArchive = { source: 'btbn'; archive: string; format: 'zip' | 'tar.xz' } | { source: 'gyan'; archive: string; format: 'zip' } | { source: 'evermeet'; format: 'zip' };

const FFPROBE_ASSETS: Record<AssetPlatform, Record<AssetArch, FfprobeArchive | null>> = {
  win32: {
    // gyan.dev "essentials" build: ~30 MB ffprobe.exe vs ~197 MB for BtbN GPL
    // (which statically links every codec/filter we don't use). Smaller transfer
    // = lower stall risk during warmup, less disk usage per user.
    x64: { source: 'gyan', archive: 'ffmpeg-release-essentials.zip', format: 'zip' },
    arm64: null
  },
  linux: {
    x64: { source: 'btbn', archive: 'ffmpeg-master-latest-linux64-gpl.tar.xz', format: 'tar.xz' },
    arm64: { source: 'btbn', archive: 'ffmpeg-master-latest-linuxarm64-gpl.tar.xz', format: 'tar.xz' }
  },
  darwin: {
    x64: { source: 'evermeet', format: 'zip' },
    arm64: { source: 'evermeet', format: 'zip' }
  }
};

function ffprobeAsset(): FfprobeArchive | null {
  const target = currentAssetTarget();
  if (!target) return null;
  return FFPROBE_ASSETS[target.platform][target.arch];
}

function ffprobeDownloadUrl(asset: FfprobeArchive): string {
  if (asset.source === 'btbn') return `${BINARY_SOURCES.ffmpegBtbn.download}/${asset.archive}`;
  if (asset.source === 'gyan') return `${BINARY_SOURCES.ffmpegGyan.download}/${asset.archive}`;
  return BINARY_SOURCES.ffmpegEvermeet.ffprobeZip;
}

function ffprobeExecutableName(): string {
  return process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe';
}

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

function ffmpegAssetName(): string | null {
  const target = currentAssetTarget();
  if (!target) return null;
  return FFMPEG_ASSETS[target.platform][target.arch];
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
    return this.resolved.ffmpeg ?? process.env.ARROXY_FFMPEG_PATH ?? path.join(this.cacheDir, process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
  }

  getDenoPath(): string {
    return this.resolved.deno ?? process.env.ARROXY_DENO_PATH ?? path.join(this.cacheDir, denoExecutableName());
  }

  getFfprobePath(): string {
    return this.resolved.ffprobe ?? process.env.ARROXY_FFPROBE_PATH ?? path.join(this.cacheDir, process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe');
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
          isUpToDate: () => this.isYtDlpUpToDate(nightlyPath, BINARY_SOURCES.ytDlpNightly.api, signal),
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
          isUpToDate: () => this.isYtDlpUpToDate(stablePath, BINARY_SOURCES.ytDlpStable.api, signal),
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
  private async tryManagedDownload(id: DependencyId, attempts: DependencyAttempt[], source: DependencySource, onProgress: ProgressEmitter | undefined, run: () => Promise<void>): Promise<boolean> {
    onProgress?.({ binary: id, phase: 'downloading', source });
    try {
      await run();
      onProgress?.({ binary: id, phase: 'extracting', source });
      return true;
    } catch (err) {
      const failure: DependencyFailure = { kind: classifyDownloadError(err), message: errorMessage(err) };
      attempts.push(makeAttempt(source, failure));
      onProgress?.({ binary: id, phase: 'failed', source, failureKind: failure.kind });
      const tracked = id === 'yt-dlp' ? 'ytdlp' : id;
      trackMain('binary_setup_failed', { binary: tracked, phase: failure.kind });
      logger.warn(`${id} managed download failed`, { source, error: failure.message });
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
  // FFmpeg and ffprobe must be a matched pair: yt-dlp post-processors expect
  // both side-by-side on PATH, and version skew between them tends to break
  // codec/container handling. On Windows we pull a single Gyan archive that
  // bundles both; on Linux/macOS we resolve each from its current upstream.
  async resolveFFmpegPair(opts: ResolveOptions = {}): Promise<{ ffmpeg: DependencyDiagnostic; ffprobe: DependencyDiagnostic }> {
    return process.platform === 'win32' ? this.resolveFFmpegPairWin(opts) : this.resolveFFmpegPairUnix(opts);
  }

  private async resolveFFmpegPairWin(opts: ResolveOptions): Promise<{ ffmpeg: DependencyDiagnostic; ffprobe: DependencyDiagnostic }> {
    const overrides = opts.overrides ?? this.overridesProvider();
    const onProgress = opts.onProgress;
    const signal = opts.signal;
    const ffmpegAttempts: DependencyAttempt[] = [];
    const ffprobeAttempts: DependencyAttempt[] = [];
    onProgress?.({ binary: 'ffmpeg', phase: 'starting' });
    onProgress?.({ binary: 'ffprobe', phase: 'starting' });

    // Manual overrides — pair only succeeds if both probe-pass.
    const manualPair = await this.tryPairOverride(overrides?.ffmpeg, overrides?.ffprobe, 'manualOverride', undefined, ffmpegAttempts, ffprobeAttempts, onProgress, signal);
    if (manualPair) return manualPair;

    const envFfmpeg = process.env.ARROXY_FFMPEG_PATH;
    const envFfprobe = process.env.ARROXY_FFPROBE_PATH;
    const envPair = await this.tryPairOverride(envFfmpeg, envFfprobe, 'envOverride', { ffmpeg: 'ARROXY_FFMPEG_PATH', ffprobe: 'ARROXY_FFPROBE_PATH' }, ffmpegAttempts, ffprobeAttempts, onProgress, signal);
    if (envPair) return envPair;

    // Managed Gyan essentials ZIP — contains bin/ffmpeg.exe + bin/ffprobe.exe.
    const pairDir = path.join(this.cacheDir, 'ffmpeg-pair');
    const ffmpegPath = path.join(pairDir, 'ffmpeg.exe');
    const ffprobePath = path.join(pairDir, 'ffprobe.exe');
    const archiveUrl = `${BINARY_SOURCES.ffmpegGyan.download}/${BINARY_SOURCES.ffmpegGyan.essentialsArchive}`;
    const managedSource: DependencySource = { kind: 'managed', channel: 'default', url: archiveUrl };

    const pairAlreadyExists = (await this.isUsableBinary(ffmpegPath)) && (await this.isUsableBinary(ffprobePath));
    const downloadOk = pairAlreadyExists
      ? true
      : await this.tryManagedDownload('ffmpeg', ffmpegAttempts, managedSource, onProgress, () =>
          this.ensureZippedBinaryMulti({
            name: 'ffmpeg-pair',
            downloadUrl: archiveUrl,
            zipFileName: 'ffmpeg-release-essentials.zip',
            members: [
              { innerName: 'ffmpeg.exe', destinationPath: ffmpegPath },
              { innerName: 'ffprobe.exe', destinationPath: ffprobePath }
            ],
            expectedSha256: () => Promise.resolve(null),
            onStatus: opts.onStatus,
            onDownloadProgress: makeDownloadProgress('ffmpeg', managedSource, onProgress),
            signal
          })
        );

    if (downloadOk) {
      const ffmpegDiag = await this.probeAndAccept('ffmpeg', managedSource, ffmpegPath, ffmpegAttempts, onProgress, signal);
      const ffprobeDiag = await this.probeAndAccept('ffprobe', managedSource, ffprobePath, ffprobeAttempts, onProgress, signal);
      if (ffmpegDiag && ffprobeDiag) return { ffmpeg: ffmpegDiag, ffprobe: ffprobeDiag };
    } else {
      // Mirror the failure on ffprobe so the diagnostic surfaces it too.
      const last = ffmpegAttempts[ffmpegAttempts.length - 1];
      if (last?.failure) ffprobeAttempts.push(makeAttempt(managedSource, last.failure));
    }

    // System PATH pair: both binaries must come from the same directory.
    onProgress?.({ binary: 'ffmpeg', phase: 'fallback' });
    onProgress?.({ binary: 'ffprobe', phase: 'fallback' });
    const ffmpegCandidates = await whereOnPath('ffmpeg.exe', signal);
    const probeCandidates = new Set((await whereOnPath('ffprobe.exe', signal)).map((p) => path.dirname(p).toLowerCase()));
    for (const ffmpegCandidate of ffmpegCandidates) {
      const dir = path.dirname(ffmpegCandidate);
      if (!probeCandidates.has(dir.toLowerCase())) continue;
      const probeCandidate = path.join(dir, 'ffprobe.exe');
      const ffmpegSource: DependencySource = { kind: 'systemPath', path: ffmpegCandidate };
      const probeSource: DependencySource = { kind: 'systemPath', path: probeCandidate };
      const ffmpegDiag = await this.probeAndAccept('ffmpeg', ffmpegSource, ffmpegCandidate, ffmpegAttempts, onProgress, signal);
      if (!ffmpegDiag) continue;
      const ffprobeDiag = await this.probeAndAccept('ffprobe', probeSource, probeCandidate, ffprobeAttempts, onProgress, signal);
      if (ffprobeDiag) return { ffmpeg: ffmpegDiag, ffprobe: ffprobeDiag };
      // ffmpeg succeeded but ffprobe didn't — the pair is incomplete; drop ffmpeg too.
      delete this.resolved.ffmpeg;
    }

    const ffmpegDiag = failedDiagnostic('ffmpeg', ffmpegAttempts);
    const ffprobeDiag = failedDiagnostic('ffprobe', ffprobeAttempts);
    this.lastDiagnostics.ffmpeg = ffmpegDiag;
    this.lastDiagnostics.ffprobe = ffprobeDiag;
    return { ffmpeg: ffmpegDiag, ffprobe: ffprobeDiag };
  }

  // Pair-override helper for manual + env paths. Both halves must be set and
  // both must probe. Half-set is treated as an explicit pair_incomplete failure
  // on whichever side is missing, then the chain advances.
  private async tryPairOverride(ffmpegPath: string | undefined, ffprobePath: string | undefined, kind: 'manualOverride' | 'envOverride', envVars: { ffmpeg: string; ffprobe: string } | undefined, ffmpegAttempts: DependencyAttempt[], ffprobeAttempts: DependencyAttempt[], onProgress: ProgressEmitter | undefined, signal?: AbortSignal): Promise<{ ffmpeg: DependencyDiagnostic; ffprobe: DependencyDiagnostic } | null> {
    if (!ffmpegPath && !ffprobePath) return null;
    const buildSource = (which: 'ffmpeg' | 'ffprobe', filePath: string): DependencySource => {
      if (kind === 'envOverride' && envVars) return { kind: 'envOverride', path: filePath, envVar: envVars[which] };
      return { kind: 'manualOverride', path: filePath };
    };

    if (!ffmpegPath || !ffprobePath) {
      const missing: DependencyFailure = { kind: 'pair_incomplete', message: 'ffmpeg and ffprobe overrides must both be set' };
      if (ffmpegPath) {
        const source = buildSource('ffmpeg', ffmpegPath);
        ffmpegAttempts.push(makeAttempt(source, missing));
        onProgress?.({ binary: 'ffmpeg', phase: 'failed', source, failureKind: missing.kind });
      }
      if (ffprobePath) {
        const source = buildSource('ffprobe', ffprobePath);
        ffprobeAttempts.push(makeAttempt(source, missing));
        onProgress?.({ binary: 'ffprobe', phase: 'failed', source, failureKind: missing.kind });
      }
      return null;
    }

    const ffmpegSource = buildSource('ffmpeg', ffmpegPath);
    const ffprobeSource = buildSource('ffprobe', ffprobePath);
    const ffmpegDiag = await this.probeAndAccept('ffmpeg', ffmpegSource, ffmpegPath, ffmpegAttempts, onProgress, signal);
    const ffprobeDiag = await this.probeAndAccept('ffprobe', ffprobeSource, ffprobePath, ffprobeAttempts, onProgress, signal);
    if (ffmpegDiag && ffprobeDiag) return { ffmpeg: ffmpegDiag, ffprobe: ffprobeDiag };
    if (ffmpegDiag && !ffprobeDiag) delete this.resolved.ffmpeg;
    if (!ffmpegDiag && ffprobeDiag) delete this.resolved.ffprobe;
    return null;
  }

  // Non-Windows: keep the existing per-binary upstreams (eugeneware ffmpeg,
  // BtbN/evermeet/Gyan ffprobe) but gate each on a runnable probe.
  private async resolveFFmpegPairUnix(opts: ResolveOptions): Promise<{ ffmpeg: DependencyDiagnostic; ffprobe: DependencyDiagnostic }> {
    const onProgress = opts.onProgress;
    const overrides = opts.overrides ?? this.overridesProvider();
    const signal = opts.signal;

    const ffmpegDiag = await this.resolveSingleBinary(
      'ffmpeg',
      overrides?.ffmpeg,
      process.env.ARROXY_FFMPEG_PATH,
      'ARROXY_FFMPEG_PATH',
      async (source, attempts) => {
        const assetName = ffmpegAssetName();
        if (!assetName) return null;
        const targetPath = path.join(this.cacheDir, 'ffmpeg');
        const url = `${BINARY_SOURCES.ffmpegStatic.download}/${assetName}`;
        const checksumUrl = `${url}.sha256`;
        const downloadOk = await this.tryManagedDownload('ffmpeg', attempts, source, onProgress, () =>
          this.ensureBinary({
            name: 'ffmpeg',
            destinationPath: targetPath,
            downloadUrl: url,
            expectedSha256: async () => {
              try {
                const checksumText = await downloadText(checksumUrl, signal);
                const firstToken = checksumText.trim().split(/\s+/)[0];
                return /^[a-fA-F0-9]{64}$/.test(firstToken) ? firstToken.toLowerCase() : null;
              } catch {
                return null;
              }
            },
            onStatus: opts.onStatus,
            onDownloadProgress: makeDownloadProgress('ffmpeg', source, onProgress),
            requiredChecksum: false,
            signal
          })
        );
        return downloadOk ? targetPath : null;
      },
      { kind: 'managed', channel: 'default', url: BINARY_SOURCES.ffmpegStatic.download },
      opts
    );

    const ffprobeDiag = await this.resolveSingleBinary(
      'ffprobe',
      overrides?.ffprobe,
      process.env.ARROXY_FFPROBE_PATH,
      'ARROXY_FFPROBE_PATH',
      async (source, attempts) => {
        const asset = ffprobeAsset();
        if (!asset) return null;
        const targetPath = path.join(this.cacheDir, ffprobeExecutableName());
        // Skip the network round-trip if the file already exists. ensureBinary
        // does this for the simple-download path; ensureZippedBinary/TarXzBinary
        // do not, so we mirror it here.
        if (await this.isUsableBinary(targetPath)) return targetPath;
        const url = ffprobeDownloadUrl(asset);
        const downloadOk = await this.tryManagedDownload('ffprobe', attempts, source, onProgress, () => {
          if (asset.format === 'zip') {
            return this.ensureZippedBinary({
              name: 'ffprobe',
              downloadUrl: url,
              zipFileName: asset.source === 'evermeet' ? 'ffprobe.zip' : asset.archive,
              innerExecutableName: ffprobeExecutableName(),
              destinationPath: targetPath,
              expectedSha256: () => Promise.resolve(null),
              onStatus: opts.onStatus,
              onDownloadProgress: makeDownloadProgress('ffprobe', source, onProgress),
              signal
            });
          }
          return this.ensureTarXzBinary({
            name: 'ffprobe',
            downloadUrl: url,
            archiveFileName: asset.archive,
            innerExecutableName: ffprobeExecutableName(),
            destinationPath: targetPath,
            onStatus: opts.onStatus,
            onDownloadProgress: makeDownloadProgress('ffprobe', source, onProgress),
            signal
          });
        });
        return downloadOk ? targetPath : null;
      },
      { kind: 'managed', channel: 'default', url: 'ffprobe-managed' },
      opts
    );

    return { ffmpeg: ffmpegDiag, ffprobe: ffprobeDiag };
  }

  // Single-binary resolve helper: manual override → env override → managed
  // download. Used by resolveDeno and the non-Windows ffmpeg/ffprobe paths.
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

  // Linux BtbN ffmpeg builds ship as .tar.xz, which Node has no built-in
  // extractor for. We shell out to system `tar` (always present on Linux/
  // macOS, ships with Win10 1803+ but we use zip on Windows). xz support
  // in `tar` is provided by xz-utils, also ubiquitous on modern distros.
  private async ensureTarXzBinary(config: { name: string; downloadUrl: string; archiveFileName: string; innerExecutableName: string; destinationPath: string; onStatus?: StatusReporter; onDownloadProgress?: DownloadProgressCallback; signal?: AbortSignal }): Promise<void> {
    const { destinationPath, name, onStatus, onDownloadProgress, signal } = config;

    const existing = this.inProgress.get(destinationPath);
    if (existing) return existing;

    const promise = (async (): Promise<void> => {
      const tempDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), `arroxy-${name}-`));
      const archivePath = path.join(tempDir, config.archiveFileName);

      try {
        onStatus?.('downloadingBinary', { name });
        logger.info(`Downloading ${name}`, {
          downloadUrl: config.downloadUrl,
          destinationPath
        });

        await downloadFile(config.downloadUrl, archivePath, onDownloadProgress, true, signal);

        const extractDir = path.join(tempDir, 'unpacked');
        await fsPromises.mkdir(extractDir, { recursive: true });
        await execFileAsync('tar', ['-xJf', archivePath, '-C', extractDir], { signal });

        const innerPath = await this.findExecutableInTree(extractDir, config.innerExecutableName);
        if (!innerPath) {
          throw new Error(`${name} archive did not contain ${config.innerExecutableName}`);
        }

        await fsPromises.mkdir(path.dirname(destinationPath), { recursive: true });
        await fsPromises.copyFile(innerPath, destinationPath);
        await fsPromises.chmod(destinationPath, 0o755);
      } finally {
        await fsPromises.rm(tempDir, { recursive: true, force: true });
      }
    })().finally(() => {
      this.inProgress.delete(destinationPath);
    });

    this.inProgress.set(destinationPath, promise);
    return promise;
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
                return (
                  parseShaLine(checksumText, assetName) ??
                  (() => {
                    const firstToken = checksumText.trim().split(/\s+/)[0];
                    return /^[a-fA-F0-9]{64}$/.test(firstToken) ? firstToken.toLowerCase() : null;
                  })()
                );
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

  private async ensureZippedBinary(config: { name: string; downloadUrl: string; zipFileName: string; innerExecutableName: string; destinationPath: string; expectedSha256: () => Promise<string | null>; onStatus?: StatusReporter; onDownloadProgress?: DownloadProgressCallback; signal?: AbortSignal }): Promise<void> {
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

  // Variant of ensureZippedBinary that extracts multiple members from a single
  // archive into distinct destinations. Used for the Windows ffmpeg+ffprobe
  // pair so both binaries come from the exact same Gyan build.
  private async ensureZippedBinaryMulti(config: { name: string; downloadUrl: string; zipFileName: string; members: { innerName: string; destinationPath: string }[]; expectedSha256: () => Promise<string | null>; onStatus?: StatusReporter; onDownloadProgress?: DownloadProgressCallback; signal?: AbortSignal }): Promise<void> {
    const { name, members, onStatus, onDownloadProgress, signal } = config;
    const lockKey = members[0]?.destinationPath ?? name;

    const existing = this.inProgress.get(lockKey);
    if (existing) return existing;

    const promise = (async (): Promise<void> => {
      const tempDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), `arroxy-${name}-`));
      const zipPath = path.join(tempDir, config.zipFileName);

      try {
        onStatus?.('downloadingBinary', { name });
        logger.info(`Downloading ${name}`, { downloadUrl: config.downloadUrl });

        await downloadFile(config.downloadUrl, zipPath, onDownloadProgress, true, signal);

        const expected = await config.expectedSha256();
        if (expected) {
          const actual = await sha256ForFile(zipPath);
          if (actual !== expected) {
            throw new Error(`${name} checksum mismatch. Expected ${expected.slice(0, 8)}..., got ${actual.slice(0, 8)}...`);
          }
        }

        const extractDir = path.join(tempDir, 'unpacked');
        await fsPromises.mkdir(extractDir, { recursive: true });
        await extractZip(zipPath, { dir: extractDir });

        for (const member of members) {
          const innerPath = await this.findExecutableInTree(extractDir, member.innerName);
          if (!innerPath) {
            throw new Error(`${name} archive did not contain ${member.innerName}`);
          }
          await fsPromises.mkdir(path.dirname(member.destinationPath), { recursive: true });
          await fsPromises.copyFile(innerPath, member.destinationPath);
          if (process.platform !== 'win32') {
            await fsPromises.chmod(member.destinationPath, 0o755);
          }
        }
      } finally {
        await fsPromises.rm(tempDir, { recursive: true, force: true });
      }
    })().finally(() => {
      this.inProgress.delete(lockKey);
    });

    this.inProgress.set(lockKey, promise);
    return promise;
  }

  private async findExecutableInTree(root: string, name: string): Promise<string | null> {
    const entries = await fsPromises.readdir(root, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(root, entry.name);
      if (entry.isDirectory()) {
        const nested = await this.findExecutableInTree(full, name);
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
      if (config.signal?.aborted) throw new Error('Cancelled');
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

  private async isYtDlpUpToDate(binaryPath: string, releaseApiUrl: string, signal?: AbortSignal): Promise<boolean> {
    const [local, remote] = await Promise.all([this.getLocalYtDlpVersion(binaryPath, signal), this.getRemoteYtDlpVersion(releaseApiUrl, signal)]);
    if (!local) return false;
    if (!remote) {
      logger.warn('Could not fetch yt-dlp remote version, skipping update check');
      return true;
    }
    if (local !== remote) {
      logger.info('yt-dlp update available', { local, remote });
      return false;
    }
    logger.info('yt-dlp is up to date', { version: local });
    return true;
  }

  private async getLocalYtDlpVersion(binaryPath: string, signal?: AbortSignal): Promise<string | null> {
    try {
      const { stdout } = await execFileAsync(binaryPath, ['--version'], { signal });
      return stdout.trim();
    } catch {
      return null;
    }
  }

  private async getRemoteYtDlpVersion(releaseApiUrl: string, signal?: AbortSignal): Promise<string | null> {
    try {
      const json = await downloadText(releaseApiUrl, signal);
      const parsed = JSON.parse(json) as { tag_name?: string };
      return parsed.tag_name ?? null;
    } catch {
      return null;
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
  parseContentRangeStart,
  resolvePartialResponseMode,
  ytDlpAssetName,
  ffmpegAssetName,
  denoAssetName,
  denoAssetTarget,
  denoExecutableName,
  sha256ForFile,
  classifyProbeError,
  whereOnPath
};
