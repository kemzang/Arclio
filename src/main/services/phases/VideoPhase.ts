import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { STATUS_KEY } from '@shared/schemas';
import type { YtDlpRequest } from '../YtDlp';
import type { Phase, PhaseContext, PhaseOutcome } from './types';

async function setupTempDir(outputDir: string, jobId: string): Promise<string | undefined> {
  const tempDir = join(outputDir, '.arroxy-temp', jobId.slice(0, 8));
  try {
    await rm(tempDir, { recursive: true, force: true });
    await mkdir(tempDir, { recursive: true });
    return tempDir;
  } catch {
    return undefined;
  }
}

export function VideoPhase(embed: boolean): Phase {
  return {
    kind: embed ? 'video+embed' : 'video',
    async run(ctx: PhaseContext): Promise<PhaseOutcome> {
      const { active, ytDlp } = ctx;
      const { input, job } = active;
      const preparedJob = input.job;

      if (preparedJob.kind === 'subtitle-only') {
        throw new Error('invariant: VideoPhase reached with subtitle-only job');
      }

      const tempDir = await setupTempDir(job.outputDir, job.id);
      if (tempDir) active.tempDir = tempDir;

      const sbConfig = preparedJob.sponsorBlock.mode !== 'off' ? { mode: preparedJob.sponsorBlock.mode, categories: preparedJob.sponsorBlock.categories } : undefined;

      const formatId = preparedJob.kind === 'single-format' ? preparedJob.formatId : undefined;
      const formatSelector = preparedJob.kind === 'playlist-preset' ? preparedJob.formatSelector : undefined;
      const audioConvert = preparedJob.kind === 'audio-convert' ? preparedJob.audioConvert : preparedJob.kind === 'playlist-preset' ? preparedJob.audioConvert : undefined;
      const outputTemplate = preparedJob.kind === 'playlist-preset' ? preparedJob.outputTemplate : undefined;
      const { embed: embedOpts } = preparedJob;

      const req: YtDlpRequest =
        embed && (preparedJob.subtitles?.languages.length ?? 0) > 0
          ? {
              kind: 'video+embed',
              url: input.url,
              outputDir: job.outputDir,
              tempDir,
              formatId,
              formatSelector,
              audioConvert,
              subtitleLanguages: preparedJob.subtitles!.languages,
              writeAutoSubs: preparedJob.subtitles!.writeAuto,
              sponsorBlock: sbConfig,
              embedChapters: embedOpts.chapters,
              embedMetadata: embedOpts.metadata,
              embedThumbnail: embedOpts.thumbnail,
              writeDescription: embedOpts.description,
              writeThumbnail: embedOpts.thumbnailSidecar,
              outputTemplate
            }
          : {
              kind: 'video',
              url: input.url,
              outputDir: job.outputDir,
              tempDir,
              formatId,
              formatSelector,
              audioConvert,
              sponsorBlock: sbConfig,
              embedChapters: embedOpts.chapters,
              embedMetadata: embedOpts.metadata,
              embedThumbnail: embedOpts.thumbnail,
              writeDescription: embedOpts.description,
              writeThumbnail: embedOpts.thumbnailSidecar,
              outputTemplate
            };

      const result = await ytDlp.run(req, {
        onAttempt: (attempt) => {
          if (attempt === 2) return;
          ctx.emitStatus('token', attempt === 0 ? STATUS_KEY.mintingToken : STATUS_KEY.remintingToken);
        },
        onSpawn: (proc) => ctx.attachYtDlpProcess(proc, STATUS_KEY.downloadingMedia),
        onStdout: (text) => ctx.safeConsume(text),
        onStderr: (text) => ctx.safeConsume(text)
      });

      if (active.pauseRequested) return { kind: 'paused' };
      if (active.cancelRequested) return { kind: 'cancelled' };

      if (result.kind !== 'success') {
        return { kind: 'hard-failed', error: ctx.emitYtdlpFailure(result) };
      }

      if (result.usedExtractorFallback) active.usedExtractorFallback = true;
      return { kind: 'continue' };
    }
  };
}
