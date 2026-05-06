// Type aliases live here. Runtime zod schemas live in `./schemas` so that
// `schemas.ts` (which depends on these types via `queueItemSchema` and
// `startDownloadSchema`) does not import a sibling that would re-import
// it — keeps module init free of circular hazards.
import type { AudioConvert, PlaylistPreset, Preset, SponsorBlockCategory, SubtitleFormat, SubtitleMode } from './schemas';

export type JobSource = 'youtube' | 'generic';

export interface SubtitleOptions {
  languages: string[];
  mode: SubtitleMode;
  format: SubtitleFormat;
  writeAuto: boolean;
}

export type SponsorBlockOptions = { mode: 'off' } | { mode: 'mark' | 'remove'; categories: SponsorBlockCategory[] };

export interface EmbedOptions {
  chapters: boolean;
  metadata: boolean;
  thumbnail: boolean;
  description: boolean;
  thumbnailSidecar: boolean;
}

export type PresetOrCustom = Preset | 'custom';

// Discriminated on `kind`. Adding a new mode = new arm + new switch arm in
// every consumer (compiler-enforced exhaustiveness).
export type PreparedJob =
  | {
      kind: 'single-format';
      source: JobSource;
      formatId: string;
      preset: PresetOrCustom;
      subtitles?: SubtitleOptions;
      sponsorBlock: SponsorBlockOptions;
      embed: EmbedOptions;
      expectedBytes?: number;
    }
  | {
      kind: 'audio-convert';
      source: JobSource;
      audioConvert: AudioConvert;
      preset: PresetOrCustom;
      subtitles?: SubtitleOptions;
      sponsorBlock: SponsorBlockOptions;
      embed: EmbedOptions;
    }
  | {
      kind: 'playlist-preset';
      source: JobSource;
      preset: PlaylistPreset;
      formatSelector?: string;
      audioConvert?: AudioConvert;
      outputTemplate: string;
      subtitles?: SubtitleOptions;
      sponsorBlock: SponsorBlockOptions;
      embed: EmbedOptions;
    }
  | {
      kind: 'subtitle-only';
      source: JobSource;
      subtitles: SubtitleOptions;
    };

// Schema re-exported here so `@shared/preparedJob` is the canonical path for
// both type and runtime validator.
export { preparedJobSchema } from './schemas';
