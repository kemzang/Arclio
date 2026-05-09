import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { STATUS_KEY } from '@shared/schemas.js';
import { siteForExtractor } from '@shared/sites/index.js';
import type { YtDlpRequest } from '../YtDlp.js';
import type { Phase, PhaseContext, PhaseOutcome } from './types.js';

async function setupTempDir(outputDir: string, jobId: string, preserve: boolean): Promise<string | undefined> {
  const tempDir = join(outputDir, '.arroxy-temp', jobId.slice(0, 8));
  try {
    if (!preserve) await rm(tempDir, { recursive: true, force: true });
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

      const tempDir = await setupTempDir(job.outputDir, job.id, active.tempDir != null);
      if (tempDir) active.tempDir = tempDir;

      // SponsorBlock applicability is owned by the Site adapter — currently
      // YouTube-only. Passing the flag for non-YouTube extractors is harmless
      // but wasted; the wizard hides the SponsorBlock step on non-supporting
      // sites and this is the defense-in-depth gate.
      const site = siteForExtractor(preparedJob.extractor);
      const sbConfig = site.supportsSponsorBlock && preparedJob.sponsorBlock.mode !== 'off' ? { mode: preparedJob.sponsorBlock.mode, categories: preparedJob.sponsorBlock.categories } : undefined;

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
        // Don't preemptively emit downloadingMedia on spawn — yt-dlp spends
        // a few seconds on extractor work and thumbnail conversion first.
        // The first `[download] Destination:` line in consumeProgress emits
        // the accurate status when the actual data download begins.
        onSpawn: (proc) => ctx.attachYtDlpProcess(proc),
        onStdout: (text) => ctx.safeConsume(text),
        onStderr: (text) => ctx.safeConsume(text)
      });

      if (active.pauseRequested) return { kind: 'paused' };
      if (active.cancelRequested) return { kind: 'cancelled' };

      if (result.kind !== 'success') {
        return { kind: 'hard-failed', error: await ctx.emitYtdlpFailure(result) };
      }

      if (result.usedExtractorFallback) active.usedExtractorFallback = true;
      return { kind: 'continue' };
    }
  };
}
