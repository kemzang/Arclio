// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { classifyYtDlpFailure } from '@main/services/download/errorClassification.js';
import type { DiskProbe } from '@main/services/download/errorClassification.js';
import { STATUS_KEY } from '@shared/schemas.js';

const POSTPROCESS_STDERR = 'ERROR: Postprocessing: Conversion failed!';
const OUTPUT_DIR = '/tmp/output';
const JOB_ID = 'job-1';

function exitError(errorKind: string, rawError = 'some error', exitCode = 1) {
  return { kind: 'exit-error' as const, exitCode, errorKind: errorKind as never, rawError, stdout: '', stderr: rawError };
}

const noProbe: DiskProbe = vi.fn().mockResolvedValue({ ok: true, freeBytes: 1_000_000_000, requiredBytes: undefined });

describe('classifyYtDlpFailure', () => {
  it('classifies spawn-error', async () => {
    const result = await classifyYtDlpFailure({ kind: 'spawn-error', error: new Error('ENOENT'), stdout: '', stderr: '' }, OUTPUT_DIR, JOB_ID, noProbe);
    expect(result.payload).toEqual({ kind: 'unknown', raw: 'ENOENT' });
    expect(result.statusKey).toBe(STATUS_KEY.ytdlpProcessError);
    expect(noProbe).not.toHaveBeenCalled();
  });

  it('upgrades postprocess failure to outOfDiskSpace when disk probe reports low space', async () => {
    const diskProbe: DiskProbe = vi.fn().mockResolvedValue({ ok: false, freeBytes: 100, requiredBytes: 500_000_000 });
    const result = await classifyYtDlpFailure(exitError('postprocessFailure', POSTPROCESS_STDERR), OUTPUT_DIR, JOB_ID, diskProbe);
    expect(diskProbe).toHaveBeenCalledWith(OUTPUT_DIR);
    expect(result.payload.kind).toBe('outOfDiskSpace');
  });

  it('keeps postprocessFailure when disk probe confirms space available', async () => {
    const diskProbe: DiskProbe = vi.fn().mockResolvedValue({ ok: true, freeBytes: 10_000_000_000, requiredBytes: undefined });
    const result = await classifyYtDlpFailure(exitError('postprocessFailure', POSTPROCESS_STDERR), OUTPUT_DIR, JOB_ID, diskProbe);
    expect(result.payload.kind).toBe('postprocessFailure');
  });

  it('keeps postprocessFailure when disk probe errors (inconclusive)', async () => {
    const diskProbe: DiskProbe = vi.fn().mockResolvedValue({ ok: false, freeBytes: undefined, requiredBytes: undefined, error: 'statfs failed' });
    const result = await classifyYtDlpFailure(exitError('postprocessFailure', POSTPROCESS_STDERR), OUTPUT_DIR, JOB_ID, diskProbe);
    expect(result.payload.kind).toBe('postprocessFailure');
  });

  it('skips disk probe for non-postprocess failures', async () => {
    const diskProbe: DiskProbe = vi.fn();
    await classifyYtDlpFailure(exitError('network', 'network error'), OUTPUT_DIR, JOB_ID, diskProbe);
    expect(diskProbe).not.toHaveBeenCalled();
  });
});
