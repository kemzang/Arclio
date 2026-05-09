import { STATUS_KEY } from '@shared/schemas.js';
import type { Phase, PhaseContext } from './types.js';

export class PhaseExecutor {
  async run(ctx: PhaseContext, phases: Phase[]): Promise<void> {
    for (const phase of phases) {
      const out = await phase.run(ctx);
      switch (out.kind) {
        case 'continue':
          continue;
        case 'completed':
          await this.complete(ctx);
          return;
        case 'soft-failed':
          ctx.emitStatus('done', out.status);
          await ctx.finalize('completed');
          return;
        case 'hard-failed':
          // Symmetrical with 'cancelled': a failed download leaves orphan
          // .part / .ytdl / fragment files in outputDir. Without this, every
          // failed attempt accumulates partial files the user has to clean
          // up manually.
          await ctx.cleanupTempDir();
          await ctx.cleanupPartFiles(ctx.active.job.outputDir);
          await ctx.finalize('failed', out.error);
          return;
        case 'cancelled':
          await ctx.cleanupTempDir();
          await ctx.cleanupPartFiles(ctx.active.job.outputDir);
          ctx.emitStatus('error', STATUS_KEY.cancelled);
          await ctx.finalize('cancelled');
          return;
        case 'paused':
          // Cancel may have landed between phase setting `pauseRequested` and
          // returning the paused outcome. If so, treat as cancelled — finalize
          // and clean up rather than stranding the job in pausedJobs with
          // already-killed processes.
          if (ctx.active.cancelRequested) {
            await ctx.cleanupTempDir();
            await ctx.cleanupPartFiles(ctx.active.job.outputDir);
            ctx.emitStatus('error', STATUS_KEY.cancelled);
            await ctx.finalize('cancelled');
            return;
          }
          ctx.moveToPaused();
          return;
      }
    }
    await this.complete(ctx);
  }

  private async complete(ctx: PhaseContext): Promise<void> {
    await ctx.cleanupTempDir();
    if (ctx.active.usedExtractorFallback) {
      ctx.emitStatus('download', STATUS_KEY.usedExtractorFallback);
    }
    ctx.emitStatus('done', STATUS_KEY.complete);
    await ctx.finalize('completed');
  }
}
