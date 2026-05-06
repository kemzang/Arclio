import { describe, expect, it } from 'vitest';
import { parseVideoId, cleanYoutubeUrl, isPlaylistUrl, isMixedVideoPlaylistUrl, extractPlaylistId, forceVideoOnly, forcePlaylistOnly } from '@shared/url';

describe('parseVideoId', () => {
  it('extracts ID from youtube.com URL', () => {
    expect(parseVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts ID from youtu.be URL', () => {
    expect(parseVideoId('https://youtu.be/dQw4w9WgXcQ?t=1')).toBe('dQw4w9WgXcQ');
  });

  it('returns null for invalid URLs', () => {
    expect(parseVideoId('notaurl')).toBeNull();
  });
});

describe('cleanYoutubeUrl', () => {
  it('strips share-tracking si param from youtu.be', () => {
    expect(cleanYoutubeUrl('https://youtu.be/dQw4w9WgXcQ?si=AbCdEf123-xyz')).toBe('https://youtu.be/dQw4w9WgXcQ');
  });

  it('strips si and pp from youtube.com/watch but keeps v and t', () => {
    expect(cleanYoutubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&si=AbCd123&pp=ygUEdGVzdA%3D%3D&t=42')).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42');
  });

  it('strips feature and gclid params', () => {
    expect(cleanYoutubeUrl('https://www.youtube.com/watch?v=abc&feature=share&gclid=xyz')).toBe('https://www.youtube.com/watch?v=abc');
  });

  it('strips global utm_* and fbclid params', () => {
    expect(cleanYoutubeUrl('https://www.youtube.com/watch?v=abc&utm_source=newsletter&utm_medium=email&fbclid=xyz')).toBe('https://www.youtube.com/watch?v=abc');
  });

  it('removes the trailing ? when all params get stripped', () => {
    expect(cleanYoutubeUrl('https://youtu.be/abc?si=xyz')).toBe('https://youtu.be/abc');
  });

  it('unwraps youtube.com/redirect to the q= destination', () => {
    expect(cleanYoutubeUrl('https://www.youtube.com/redirect?q=https%3A%2F%2Fexample.com%2Fpath&v=ignored')).toBe('https://example.com/path');
  });

  it('cleans the unwrapped redirect target if it is also a youtube URL', () => {
    expect(cleanYoutubeUrl('https://www.youtube.com/redirect?q=https%3A%2F%2Fyoutu.be%2Fabc%3Fsi%3Dxyz')).toBe('https://youtu.be/abc');
  });

  it('passes non-youtube URLs through unchanged', () => {
    expect(cleanYoutubeUrl('https://vimeo.com/12345?si=keepme')).toBe('https://vimeo.com/12345?si=keepme');
  });

  it('returns the input unchanged when it is not a parseable URL', () => {
    expect(cleanYoutubeUrl('not a url')).toBe('not a url');
    expect(cleanYoutubeUrl('')).toBe('');
  });

  it('preserves the fragment', () => {
    expect(cleanYoutubeUrl('https://youtu.be/abc?si=xyz#t=10')).toBe('https://youtu.be/abc#t=10');
  });

  it('skips cleaning the youtube.com/signin exception path', () => {
    const signin = 'https://accounts.youtube.com/signin?si=needed&service=youtube';
    expect(cleanYoutubeUrl(signin)).toBe(signin);
  });
});

describe('isPlaylistUrl', () => {
  it('returns true for pure playlist URLs', () => {
    expect(isPlaylistUrl('https://www.youtube.com/playlist?list=PLabc123')).toBe(true);
  });

  it('returns false when v= is also present', () => {
    expect(isPlaylistUrl('https://www.youtube.com/watch?v=abc&list=PLabc123')).toBe(false);
  });

  it('returns false for plain video URLs', () => {
    expect(isPlaylistUrl('https://www.youtube.com/watch?v=abc')).toBe(false);
    expect(isPlaylistUrl('https://youtu.be/abc')).toBe(false);
  });

  it('returns false for non-YouTube hosts', () => {
    expect(isPlaylistUrl('https://vimeo.com/playlist?list=xyz')).toBe(false);
  });

  it('returns false for unparseable input', () => {
    expect(isPlaylistUrl('not a url')).toBe(false);
  });
});

describe('isMixedVideoPlaylistUrl', () => {
  it('returns true when both v= and list= present', () => {
    expect(isMixedVideoPlaylistUrl('https://www.youtube.com/watch?v=abc&list=PLabc')).toBe(true);
  });

  it('returns false for pure playlist URLs', () => {
    expect(isMixedVideoPlaylistUrl('https://www.youtube.com/playlist?list=PLabc')).toBe(false);
  });

  it('returns false for plain video URLs', () => {
    expect(isMixedVideoPlaylistUrl('https://www.youtube.com/watch?v=abc')).toBe(false);
  });
});

describe('extractPlaylistId', () => {
  it('returns the list= value', () => {
    expect(extractPlaylistId('https://www.youtube.com/playlist?list=PLabc123')).toBe('PLabc123');
    expect(extractPlaylistId('https://www.youtube.com/watch?v=x&list=PLxyz')).toBe('PLxyz');
  });

  it('returns null when list= absent', () => {
    expect(extractPlaylistId('https://www.youtube.com/watch?v=abc')).toBeNull();
  });

  it('returns null for non-YouTube URLs', () => {
    expect(extractPlaylistId('https://vimeo.com/?list=foo')).toBeNull();
  });
});

describe('forceVideoOnly', () => {
  it('strips list= from a watch URL', () => {
    expect(forceVideoOnly('https://www.youtube.com/watch?v=abc&list=PLxyz')).toBe('https://www.youtube.com/watch?v=abc');
  });

  it('runs cleanYoutubeUrl first to strip tracking', () => {
    expect(forceVideoOnly('https://www.youtube.com/watch?v=abc&list=PLxyz&si=tracking')).toBe('https://www.youtube.com/watch?v=abc');
  });

  it('passes URLs without list= through unchanged', () => {
    expect(forceVideoOnly('https://www.youtube.com/watch?v=abc')).toBe('https://www.youtube.com/watch?v=abc');
  });
});

describe('forcePlaylistOnly', () => {
  it('strips v= and rewrites /watch to /playlist', () => {
    expect(forcePlaylistOnly('https://www.youtube.com/watch?v=abc&list=PLxyz')).toBe('https://www.youtube.com/playlist?list=PLxyz');
  });

  it('passes /playlist URLs through unchanged', () => {
    expect(forcePlaylistOnly('https://www.youtube.com/playlist?list=PLxyz')).toBe('https://www.youtube.com/playlist?list=PLxyz');
  });

  it('strips tracking via cleanYoutubeUrl', () => {
    expect(forcePlaylistOnly('https://www.youtube.com/watch?v=abc&list=PLxyz&si=track')).toBe('https://www.youtube.com/playlist?list=PLxyz');
  });
});
