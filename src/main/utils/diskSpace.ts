import { statfs } from 'node:fs/promises';

export interface DiskSpaceResult {
  ok: boolean;
  freeBytes: number | undefined;
  requiredBytes: number | undefined;
}

const DEFAULT_MIN_FREE_BYTES = 200 * 1024 * 1024;

export async function checkDiskSpace(dir: string, expectedBytes: number | undefined, marginFactor = 1.5, minFreeBytes = DEFAULT_MIN_FREE_BYTES): Promise<DiskSpaceResult> {
  const requiredBytes = expectedBytes !== undefined ? Math.max(expectedBytes * marginFactor, minFreeBytes) : minFreeBytes;

  try {
    const stats = await statfs(dir);
    const freeBytes = stats.bavail * stats.bsize;
    return { ok: freeBytes >= requiredBytes, freeBytes, requiredBytes };
  } catch {
    return { ok: true, freeBytes: undefined, requiredBytes };
  }
}
