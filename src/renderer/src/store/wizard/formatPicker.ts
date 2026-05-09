// Pure helpers for the wizard's format/audio/subtitle picker. Extracted from
// `wizardSlice.ts` so the post-probe selection logic — preset application,
// audio revival, subtitle restoration — has its own testable seam without
// the rest of the slice's coupling.
//
// No I/O, no IPC, no logging. Inputs are FormatOption[] + AppSettings;
// outputs are plain selection objects the caller drops onto the slice via
// `set()`. Existing callers in `wizardSlice.ts` re-export from this module so
// imports like `import { applyPreset } from './wizardSlice.js'` keep working
// for tests and components that haven't migrated yet.

import type { AppSettings, AudioSelection, FormatOption, Preset, SubtitleMap } from '@shared/types.js';

function groupedNonAudioFormats(formats: FormatOption[]): { resolution: string; formatId: string }[] {
  const seen = new Set<string>();
  const out: { resolution: string; formatId: string }[] = [];
  for (const f of formats) {
    if (f.isAudioOnly) continue;
    const key = `${f.resolution}|${f.dynamicRange ?? ''}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push({ resolution: f.resolution, formatId: f.formatId });
    }
  }
  return out;
}

function nativeAudio(formatId: string | null): AudioSelection {
  return formatId === null ? { kind: 'none' } : { kind: 'native', formatId };
}

// When a video format is itself muxed (audio embedded — e.g. Twitch HLS,
// PornHub progressive, Reddit DASH muxed), pairing it with a separate native
// audio stream double-tracks the audio (yt-dlp downloads both then ffmpeg
// merges, ending with dual audio or worse). The right default is `none` =
// keep as-is — the muxed stream already has audio.
function audioForVideoPick(videoFormatId: string, formats: FormatOption[], fallbackAudioId: string | null): AudioSelection {
  const f = formats.find((x) => x.formatId === videoFormatId);
  const isMuxed = !!f && !f.isVideoOnly && !f.isAudioOnly;
  if (isMuxed) return { kind: 'none' };
  return nativeAudio(fallbackAudioId);
}

const RESOLUTION_NUMBER_PATTERN = /(\d+)/;

export function applyPreset(preset: Preset, formats: FormatOption[]): { videoFormatId: string; audioSelection: AudioSelection } {
  const grouped = groupedNonAudioFormats(formats);
  const audioFormats = formats.filter((f) => f.isAudioOnly);
  const bestAudio = audioFormats[0]?.formatId ?? null;
  const worstAudio = audioFormats[audioFormats.length - 1]?.formatId ?? bestAudio;

  if (preset === 'best-quality') {
    const videoFormatId = grouped[0]?.formatId ?? '';
    return { videoFormatId, audioSelection: audioForVideoPick(videoFormatId, formats, bestAudio) };
  }
  if (preset === 'audio-only') return { videoFormatId: '', audioSelection: nativeAudio(bestAudio) };
  if (preset === 'subtitle-only') return { videoFormatId: '', audioSelection: { kind: 'none' } };
  if (preset === 'balanced') {
    const target = grouped.find((g) => {
      const m = RESOLUTION_NUMBER_PATTERN.exec(g.resolution);
      return m ? Number(m[1]) <= 720 : false;
    });
    const videoFormatId = target?.formatId ?? grouped[grouped.length - 1]?.formatId ?? '';
    return { videoFormatId, audioSelection: audioForVideoPick(videoFormatId, formats, bestAudio) };
  }
  // small-file
  const videoFormatId = grouped[grouped.length - 1]?.formatId ?? '';
  return { videoFormatId, audioSelection: audioForVideoPick(videoFormatId, formats, worstAudio) };
}

// Persisted audio selection is stored verbatim. Convert/none kinds carry no
// per-video identifiers and revive directly — except `none` (muxed keep-as-is)
// only makes sense when the new source is also muxed-only. If the new source
// has separable audio streams, `none` would silently drop the audio track,
// which is rarely what the user meant ("keep as-is" on a separable source =
// video-only download). Auto-upgrade to the best native audio in that case.
//
// For native, the formatId can change between videos, so fall back:
// exact id → same ext → bestAudio.
// Returns null when nothing is persisted; caller uses its default in that case.
function reviveAudio(persisted: AudioSelection | undefined, formats: FormatOption[]): AudioSelection | null {
  if (!persisted) return null;
  const audioFormats = formats.filter((f) => f.isAudioOnly);

  if (persisted.kind === 'none') {
    if (audioFormats.length === 0) return persisted;
    return nativeAudio(audioFormats[0].formatId);
  }

  if (persisted.kind !== 'native') return persisted;

  if (audioFormats.length === 0) return { kind: 'none' };
  if (audioFormats.some((f) => f.formatId === persisted.formatId)) return persisted;

  // The persisted formatId came from an earlier probe and isn't in this list.
  // Without that earlier probe we can't recover its ext, so just pick the best
  // native audio for the current video.
  return nativeAudio(audioFormats[0].formatId);
}

export function restoreFormatSelection(formats: FormatOption[], settings: AppSettings | null): { videoFormatId: string; audioSelection: AudioSelection; preset: Preset | null } {
  const grouped = groupedNonAudioFormats(formats);
  const audioFormats = formats.filter((f) => f.isAudioOnly);
  const bestAudio = audioFormats[0]?.formatId ?? null;
  const single = settings?.single;
  const revived = reviveAudio(single?.lastAudioSelection, formats);

  if (single?.lastPreset) {
    const base = applyPreset(single.lastPreset, formats);
    return { ...base, audioSelection: revived ?? base.audioSelection, preset: single.lastPreset };
  }
  if (single?.lastVideoResolution === 'audio-only') {
    return { videoFormatId: '', audioSelection: revived ?? nativeAudio(bestAudio), preset: 'audio-only' };
  }
  if (single?.lastVideoResolution) {
    const match = grouped.find((g) => g.resolution === single.lastVideoResolution);
    if (match) return { videoFormatId: match.formatId, audioSelection: revived ?? nativeAudio(bestAudio), preset: null };
  }
  const base = applyPreset('best-quality', formats);
  return { ...base, audioSelection: revived ?? base.audioSelection, preset: 'best-quality' };
}

export function restoreSubtitleSelection(subtitles: SubtitleMap | undefined, automaticCaptions: SubtitleMap | undefined, settings: AppSettings | null): { languages: string[] } {
  const available = new Set([...Object.keys(subtitles ?? {}), ...Object.keys(automaticCaptions ?? {})]);
  const languages = (settings?.single?.lastSubtitleLanguages ?? []).filter((l) => available.has(l));
  return { languages };
}
