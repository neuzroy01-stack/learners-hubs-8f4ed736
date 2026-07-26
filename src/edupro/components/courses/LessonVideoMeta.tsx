import React, { useState } from 'react';
import { Youtube, Eye, EyeOff, CheckCircle2, AlertTriangle, PlayCircle } from 'lucide-react';
import type { Lesson } from '../../types/lms';

export function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/live\/)([\w-]{11})/
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export function isValidVideoUrl(url: string, type: Lesson['videoType']): boolean {
  if (!url) return false;
  if (type === 'youtube') return !!getYouTubeId(url);
  try {
    const parsed = new URL(url);
    if (type === 'mp4') return /\.(mp4|webm|ogg|m3u8)(\?.*)?$/i.test(parsed.pathname);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

interface Props {
  lesson: Lesson;
  onChange: (patch: Partial<Lesson>) => void;
}

export const LessonVideoMeta: React.FC<Props> = ({ lesson, onChange }) => {
  const [showPlayer, setShowPlayer] = useState(false);
  const ytId = getYouTubeId(lesson.videoUrl);
  const valid = isValidVideoUrl(lesson.videoUrl, lesson.videoType);
  const published = lesson.isPublished !== false;

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 dark:border-slate-800 dark:bg-slate-800/40">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
        <input
          type="number"
          min={1}
          value={lesson.weekNumber ?? ''}
          onChange={(e) => onChange({ weekNumber: e.target.value ? Number(e.target.value) : undefined })}
          placeholder="Week #"
          className="rounded-md border border-slate-200 bg-white p-1.5 text-[11px] font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 sm:col-span-3"
        />
        <input
          type="text"
          value={lesson.chapterName || ''}
          onChange={(e) => onChange({ chapterName: e.target.value })}
          placeholder="Chapter name (e.g. Chapter 2 — Loops)"
          className="rounded-md border border-slate-200 bg-white p-1.5 text-[11px] text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 sm:col-span-9"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
            valid
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
          }`}
        >
          {valid ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
          {valid ? 'Valid URL' : 'Invalid / empty URL'}
        </span>

        <button
          type="button"
          onClick={() => onChange({ isPublished: !published })}
          className={`flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
            published
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
              : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
          }`}
        >
          {published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          {published ? 'Published' : 'Unpublished'}
        </button>

        {valid && (
          <button
            type="button"
            onClick={() => setShowPlayer((s) => !s)}
            className="flex cursor-pointer items-center gap-1 rounded-full bg-slate-900 px-2.5 py-0.5 text-[10px] font-bold text-white dark:bg-slate-700"
          >
            <PlayCircle className="h-3 w-3" />
            {showPlayer ? 'Hide preview' : 'Preview player'}
          </button>
        )}
      </div>

      {ytId && !showPlayer && (
        <div className="flex items-center gap-2">
          <img
            src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
            alt="Video thumbnail"
            className="h-14 w-24 shrink-0 rounded-lg object-cover"
          />
          <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
            <Youtube className="h-3.5 w-3.5 text-rose-500" /> YouTube ID: {ytId}
          </span>
        </div>
      )}

      {showPlayer && valid && (
        <div className="aspect-video w-full max-w-md overflow-hidden rounded-xl bg-black">
          {ytId ? (
            <iframe
              src={`https://www.youtube.com/embed/${ytId}`}
              title={lesson.title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : lesson.videoType === 'mp4' ? (
            <video src={lesson.videoUrl} controls className="h-full w-full" />
          ) : (
            <iframe src={lesson.videoUrl} title={lesson.title} className="h-full w-full" allowFullScreen />
          )}
        </div>
      )}
    </div>
  );
};
