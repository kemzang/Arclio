import { STATUS_KEY } from '@shared/schemas';
import { DEFAULTS } from '@shared/constants';
import { dedupeSubtitleFiles, logger } from '../subtitlePostProcess';
import type { Phase, PhaseContext, PhaseOutcome } from './types';

export const SubtitleOnlyPhase: Phase = {
  kind: 'subtitle-only',
  async run(ctx: PhaseContext): Promise<PhaseOutcome> {
    const { active, ytDlp } = ctx;
    const { job, input } = active;
    const preparedJob = input.job;

    if (preparedJob.kind !== 'subtitle-only') {
      throw new Error('invariant: SubtitleOnlyPhase reached with non-subtitle-only job');
    }

    const { subtitles } = preparedJob;

    const result = await ytDlp.run(
      {
        kind: 'subtitle',
        url: input.url,
        outputDir: input.outputDir!,
        subtitleLanguages: subtitles.languages,
        subtitleMode: subtitles.mode,
        subtitleFormat: subtitles.format ?? DEFAULTS.subtitleFormat,
        writeAutoSubs: subtitles.writeAuto
      },
      {
        onAttempt: (attempt) => {
          if (attempt === 2) return;
          ctx.emitStatus('token', attempt === 0 ? STATUS_KEY.mintingToken : STATUS_KEY.remintingToken);
        },
        onSpawn: (proc) => ctx.attachYtDlpProcess(proc, STATUS_KEY.fetchingSubtitles),
        onStdout: (text) => ctx.safeConsume(text),
        onStderr: (text) => ctx.safeConsume(text)
      }
    );

    if (active.cancelRequested) return { kind: 'cancelled' };

    if (result.kind !== 'success') {
      logger.warn('subtitle-only fetch failed', { jobId: job.id, kind: result.kind });
      return { kind: 'hard-failed', error: ctx.emitYtdlpFailure(result) };
    }

    if (result.usedExtractorFallback) active.usedExtractorFallback = true;

    if (subtitles.writeAuto) {
      await dedupeSubtitleFiles(active.subtitlePaths, job.id, () => active.cancelRequested);
    }

    return { kind: 'completed' };
  }
};
