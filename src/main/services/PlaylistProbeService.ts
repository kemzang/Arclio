import log from 'electron-log/main.js';
import { z } from 'zod';
import { createAppError } from '@main/utils/errorFactory.js';
import { splitStderrLines } from '@main/utils/process.js';
import { ok, fail, type Result } from '@shared/result.js';
import type { GetPlaylistItemsOutput, PlaylistEntry } from '@shared/types.js';
import { YtDlp } from './YtDlp.js';

const logger = log.scope('playlist-probe');

const nullToUndef = (v: unknown): unknown => (v === null ? undefined : v);
const optStr = z.preprocess(nullToUndef, z.string().optional());
const optNum = z.preprocess(nullToUndef, z.number().optional());

const thumbnailEntrySchema = z.object({ url: z.string() }).passthrough();

const flatEntrySchema = z
  .object({
    id: z.string(),
    title: optStr,
    thumbnail: optStr,
    thumbnails: z.preprocess(nullToUndef, z.array(thumbnailEntrySchema).optional()),
    duration: optNum,
    playlist_index: optNum,
    playlist_id: optStr,
    playlist_title: optStr,
    url: optStr,
    webpage_url: optStr,
    _type: optStr
  })
  .passthrough();

function pickThumbnail(entry: FlatEntry): string {
  if (entry.thumbnail) return entry.thumbnail;
  const list = entry.thumbnails;
  if (!list || list.length === 0) return '';
  return list[0].url;
}

type FlatEntry = z.infer<typeof flatEntrySchema>;

function buildEntryUrl(entry: FlatEntry): string {
  if (entry.webpage_url) return entry.webpage_url;
  if (entry.url?.startsWith('http') === true) return entry.url;
  return `https://www.youtube.com/watch?v=${entry.id}`;
}

function parseNdjson(stdout: string): unknown[] {
  return stdout
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line) as unknown);
}

const MOCK_ENTRIES: PlaylistEntry[] = [
  { id: 'mock1', url: 'https://www.youtube.com/watch?v=mock1', title: 'Mock playlist item 1', thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg', duration: 213, playlistIndex: 1 },
  { id: 'mock2', url: 'https://www.youtube.com/watch?v=mock2', title: 'Mock playlist item 2 — a longer title that should ellipsize gracefully in the picker UI', thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg', duration: 642, playlistIndex: 2 },
  { id: 'mock3', url: 'https://www.youtube.com/watch?v=mock3', title: 'Mock playlist item 3', thumbnail: '', duration: 95, playlistIndex: 3 },
  { id: 'mock4', url: 'https://www.youtube.com/watch?v=mock4', title: 'Mock playlist item 4', thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg', duration: 1837, playlistIndex: 4 },
  { id: 'mock5', url: 'https://www.youtube.com/watch?v=mock5', title: 'Mock playlist item 5', thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg', duration: 421, playlistIndex: 5 }
];

export function mapFlatEntries(raw: unknown[]): PlaylistEntry[] {
  const entries: PlaylistEntry[] = [];
  raw.forEach((row, idx) => {
    const parsed = flatEntrySchema.safeParse(row);
    if (!parsed.success) return;
    const entry = parsed.data;
    entries.push({
      id: entry.id,
      url: buildEntryUrl(entry),
      title: entry.title ?? '',
      thumbnail: pickThumbnail(entry),
      duration: typeof entry.duration === 'number' ? Math.round(entry.duration) : undefined,
      // yt-dlp's playlist_index is the canonical position; fall back to array
      // order only when the field is missing (rare but documented).
      playlistIndex: typeof entry.playlist_index === 'number' ? entry.playlist_index : idx + 1
    });
  });
  return entries;
}

function extractPlaylistMeta(raw: unknown[]): { id: string; title: string } {
  for (const row of raw) {
    const parsed = flatEntrySchema.safeParse(row);
    if (!parsed.success) continue;
    const id = parsed.data.playlist_id ?? '';
    const title = parsed.data.playlist_title ?? '';
    if (id || title) return { id, title };
  }
  return { id: '', title: '' };
}

export class PlaylistProbeService {
  constructor(
    private readonly ytDlp: YtDlp,
    private readonly mockMode = false
  ) {}

  async getPlaylistItems(url: string): Promise<Result<GetPlaylistItemsOutput>> {
    try {
      if (this.mockMode) {
        return ok({
          playlistId: 'PLmock123',
          playlistTitle: 'Mock Playlist',
          entries: MOCK_ENTRIES
        });
      }

      logger.info('Playlist probe started', { url });

      const result = await this.ytDlp.run(
        { kind: 'playlist-probe', url },
        {
          onStderr: (chunk) => {
            for (const line of splitStderrLines(chunk)) {
              logger.info(line, { source: 'yt-dlp-playlist-probe' });
            }
          }
        }
      );

      if (result.kind !== 'success') {
        const signal = result.kind === 'exit-error' ? result.signal : null;
        const rawError = result.kind === 'exit-error' ? result.rawError : result.error.message;
        logger.error('yt-dlp playlist probe failed', { url, signal });
        return fail(createAppError('download', rawError ?? 'Playlist probing failed', undefined, true, signal ?? undefined));
      }

      let rawRows: unknown[];
      try {
        rawRows = parseNdjson(result.stdout);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown JSON parse error';
        logger.error('Playlist probe NDJSON parse failed', { message, url });
        return fail(createAppError('download', 'Failed to parse playlist entries', message));
      }

      const entries = mapFlatEntries(rawRows);
      if (entries.length === 0) {
        return fail(createAppError('download', 'Playlist returned no entries'));
      }

      // Defensive: if the URL was actually a single video, --flat-playlist
      // still returns one entry without playlist metadata. Surface that as a
      // distinct error so the renderer can route the user back to the
      // single-video flow rather than showing a 1-item picker.
      const meta = extractPlaylistMeta(rawRows);
      if (entries.length === 1 && !meta.id && !meta.title) {
        return fail(createAppError('download', 'URL did not resolve to a playlist'));
      }

      logger.info('Playlist probe complete', {
        url,
        playlistId: meta.id,
        entryCount: entries.length
      });

      return ok({
        playlistId: meta.id,
        playlistTitle: meta.title,
        entries
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown playlist probing error';
      logger.error('Playlist probe failure', { message, url });
      return fail(createAppError('download', message));
    }
  }
}
