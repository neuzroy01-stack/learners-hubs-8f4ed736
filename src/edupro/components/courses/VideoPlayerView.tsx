import React from 'react';

// 1. Helper function: Database से आने वाले URL को प्रोसेस करता है
export const getVideoSource = (rawUrl: string | null | undefined) => {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { type: 'unknown', url: '' };
  }

  const cleanUrl = rawUrl.trim();

  // A. Google Drive Links (Handles /file/d/ID/view, open?id=ID, etc.)
  if (cleanUrl.includes('drive.google.com') || cleanUrl.includes('docs.google.com')) {
    const driveMatch =
      cleanUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
      cleanUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
      cleanUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);

    if (driveMatch?.[1]) {
      const fileId = driveMatch[1];
      return {
        type: 'google-drive',
        url: `https://drive.google.com/file/d/${fileId}/preview`,
      };
    }
  }

  // B. YouTube Links (Handles watch?v=, youtu.be/, shorts/, embed/)
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

  // C. Direct Video Link (.mp4, .webm, etc.)
  return {
    type: 'direct',
    url: cleanUrl,
  };
};

// 2. Main Video Player Component
interface VideoPlayerProps {
  url: string; // Database से आने वाला वीडियो URL
  className?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, className = '' }) => {
  const video = getVideoSource(url);

  // अगर डेटाबेस से URL नहीं आया या गलत है
  if (!url || video.type === 'unknown' || !video.url) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#888', background: '#f0f0f0', borderRadius: '8px' }}>
        वीडियो लोड करने में असमर्थ (Invalid or Missing URL)
      </div>
    );
  }

  // Direct MP4 / Video Links
  if (video.type === 'direct') {
    return (
      <div style={{ width: '100%', position: 'relative' }} className={className}>
        <video
          controls
          controlsList="nodownload"
          style={{ width: '100%', height: 'auto', borderRadius: '8px', backgroundColor: '#000' }}
        >
          <source src={video.url} />
          आपका ब्राउज़र वीडियो प्ले नहीं कर सकता।
        </video>
      </div>
    );
  }

  // YouTube & Google Drive Embed Player
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        paddingTop: '56.25%', // 16:9 Aspect Ratio
        backgroundColor: '#000',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      <iframe
        src={video.url}
        title="Video Player"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          border: 'none',
        }}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />

      {/* Google Drive Protect Overlay:
          यह पारदर्शी बॉक्स ऊपर दाहिने कोने वाले 'Pop-out' (Drive पर जाने वाले) बटन को ब्लॉक करता है */}
      {video.type === 'google-drive' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '75px',
            height: '60px',
            zIndex: 10,
            backgroundColor: 'transparent',
            cursor: 'default',
          }}
        />
      )}
    </div>
  );
};

export default VideoPlayer;
