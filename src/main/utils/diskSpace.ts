import { statfs } from 'node:fs/promises';

export interface DiskSpaceResult {
  ok: boolean;
  freeBytes: number | undefined;
  requiredBytes: number | undefined;
  // Distinguishes "checked and passed/failed" from "couldn't check" (statfs
  // threw — bad path, NFS unmount, EACCES). Callers that treat absence of
  // `error` as truth get a real verdict; callers that need to be lenient
  // (post-hoc disk probe in DownloadService) can still inspect `error` and
  // decide what to do.
  error?: string;
}

const DEFAULT_MIN_FREE_BYTES = 200 * 1024 * 1024;

export async function checkDiskSpace(dir: string, expectedBytes: number | undefined, marginFactor = 1.5, minFreeBytes = DEFAULT_MIN_FREE_BYTES): Promise<DiskSpaceResult> {
  const requiredBytes = expectedBytes !== undefined ? Math.max(expectedBytes * marginFactor, minFreeBytes) : minFreeBytes;

  try {
    const stats = await statfs(dir);
    const freeBytes = stats.bavail * stats.bsize;
    return { ok: freeBytes >= requiredBytes, freeBytes, requiredBytes };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return { ok: false, freeBytes: undefined, requiredBytes, error };
  }
}
