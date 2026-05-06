import type { AudioConvert, PlaylistPreset } from './schemas';

export interface PlaylistPresetSpec {
  formatSelector?: string;
  audioConvert?: AudioConvert;
  producesVideo: boolean;
}

// Each preset compiles to a yt-dlp -f selector expression resolved per-video.
// Heterogeneous playlists (mixed resolutions/codecs) survive because the
// expression caps or floors quality per item rather than pinning a literal id.
export function playlistPresetSpec(p: PlaylistPreset): PlaylistPresetSpec {
  switch (p) {
    case 'video-best':
      return { formatSelector: 'bestvideo*+bestaudio/best', producesVideo: true };
    case 'video-2160p':
      return { formatSelector: 'bestvideo[height<=2160]+bestaudio/best[height<=2160]', producesVideo: true };
    case 'video-1440p':
      return { formatSelector: 'bestvideo[height<=1440]+bestaudio/best[height<=1440]', producesVideo: true };
    case 'video-1080p':
      return { formatSelector: 'bestvideo[height<=1080]+bestaudio/best[height<=1080]', producesVideo: true };
    case 'video-720p':
      return { formatSelector: 'bestvideo[height<=720]+bestaudio/best[height<=720]', producesVideo: true };
    case 'video-480p':
      return { formatSelector: 'bestvideo[height<=480]+bestaudio/best[height<=480]', producesVideo: true };
    case 'video-360p':
      return { formatSelector: 'bestvideo[height<=360]+bestaudio/best[height<=360]', producesVideo: true };
    case 'audio-best':
      return { formatSelector: 'bestaudio/best', producesVideo: false };
    case 'audio-mp3':
      return { audioConvert: { target: 'mp3', bitrateKbps: 192 }, producesVideo: false };
  }
}
