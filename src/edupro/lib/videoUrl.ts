/**
 * Single place that turns any lecture URL into something the in-app player can
 * actually render. Supports YouTube (watch / youtu.be / embed / live / shorts),
 * Google Drive hosted videos, and direct video files.
 */
export type VideoKind = 'youtube' | 'drive' | 'file' | 'embed';

export interface VideoSource {
  kind: VideoKind;
  /** URL to feed into the iframe (youtube/drive/embed) or <video> (file). */
  src: string;
  /** Human-facing link to open the original source in a new tab. */
  externalUrl: string;
}

export function getYouTubeId(rawUrl: string): string | null {
  if (!rawUrl) return null;
  try {
    const parsed = new URL(rawUrl.trim());
    const host = parsed.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') return parsed.pathname.slice(1).split('/')[0] || null;
    if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
      if (parsed.pathname === '/watch') return parsed.searchParams.get('v');
      if (/^\/(embed|live|shorts|v)\//.test(parsed.pathname)) return parsed.pathname.split('/')[2] || null;
    }
    return null;
  } catch {
    return null;
  }
}

/** Extracts the file id from any Google Drive share/preview/download link. */
export function getGoogleDriveId(rawUrl: string): string | null {
  if (!rawUrl) return null;
  try {
    const parsed = new URL(rawUrl.trim());
    const host = parsed.hostname.replace(/^www\./, '');
    if (!host.endsWith('drive.google.com') && !host.endsWith('docs.google.com')) return null;
    const byPath = parsed.pathname.match(/\/(?:file|d)\/d?\/?([a-zA-Z0-9_-]{10,})/);
    if (byPath?.[1]) return byPath[1];
    const alt = parsed.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]{10,})/);
    if (alt?.[1]) return alt[1];
    const byQuery = parsed.searchParams.get('id');
    if (byQuery) return byQuery;
    return null;
  } catch {
    return null;
  }
}

/** Resolves a stored URL into a playable source, or null when unusable. */
export function resolveVideoSource(rawUrl: string | null | undefined): VideoSource | null {
  const url = (rawUrl ?? '').trim();
  if (!url) return null;

  const ytId = getYouTubeId(url);
  if (ytId) {
    return {
      kind: 'youtube',
      src: `https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`,
      externalUrl: `https://www.youtube.com/watch?v=${ytId}`,
    };
  }

  const driveId = getGoogleDriveId(url);
  if (driveId) {
    return {
      kind: 'drive',
      // /preview renders Drive's own HTML5 player and is iframe-embeddable,
      // unlike /view which Drive refuses to frame.
      src: `https://drive.google.com/file/d/${driveId}/preview`,
      externalUrl: `https://drive.google.com/file/d/${driveId}/view`,
    };
  }

  if (/\.(mp4|webm|ogg|ogv|m4v|mov)(\?|#|$)/i.test(url)) {
    return { kind: 'file', src: url, externalUrl: url };
  }

  if (/^https?:\/\//i.test(url)) {
    return { kind: 'embed', src: url, externalUrl: url };
  }
  return null;
}

/** True when the URL is a link we can confidently play inside the site. */
export const isPlayableVideoUrl = (rawUrl: string) => {
  const s = resolveVideoSource(rawUrl);
  return !!s && s.kind !== 'embed';
};
