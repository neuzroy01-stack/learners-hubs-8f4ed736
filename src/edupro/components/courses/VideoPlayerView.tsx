export interface VideoSourceResult {
  type: 'google-drive' | 'youtube' | 'direct' | 'unknown';
  url: string;
}

export const getVideoSource = (url: string): VideoSourceResult => {
  if (!url || typeof url !== 'string') {
    return { type: 'unknown', url: '' };
  }

  const cleanUrl = url.trim();

  // 1. Google Drive (Handles /file/d/ID/view, open?id=ID, etc.)
  if (cleanUrl.includes('drive.google.com')) {
    const driveMatch =
      cleanUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
      cleanUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);

    if (driveMatch?.[1]) {
      return {
        type: 'google-drive',
        url: `https://drive.google.com/file/d/${driveMatch[1]}/preview`,
      };
    }
  }

  // 2. YouTube (Handles watch?v=, youtu.be/, shorts/, embed/)
  if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
    const youtubeMatch = cleanUrl.match(
      /(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );

    if (youtubeMatch?.[1]) {
      return {
        type: 'youtube',
        url: `https://www.youtube.com/embed/${youtubeMatch[1]}?rel=0&modestbranding=1`,
      };
    }
  }

  // 3. Direct video link (.mp4, .webm, etc.)
  return {
    type: 'direct',
    url: cleanUrl,
  };
};
