import React, { useState, useEffect } from 'react';
import { Course, Lesson } from '../../types/lms';
import { db } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  PlayCircle,
  CheckCircle2,
  
  Lock,
  FileText,
  Download,
  Clock,
  Sparkles,
  ChevronRight,
  BookOpen
} from 'lucide-react';

interface VideoPlayerViewProps {
  course: Course;
  onBack: () => void;
}

export const VideoPlayerView: React.FC<VideoPlayerViewProps> = ({ course, onBack }) => {
  const { currentUser, studentProfile } = useAuth();
  const allLessons = course.modules.flatMap((m) => m.lessons);
  const [activeLesson, setActiveLesson] = useState<Lesson>(allLessons[0] || course.modules[0]?.lessons[0]);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(['les-1']);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [studentNotes, setStudentNotes] = useState<string>('Personal Study Note: Remember to practice Express middleware chains and JWT token verification algorithms.');

  const studentId = studentProfile?.id || 'stu-1';

  const handleMarkCompleted = (lessonId: string) => {
    if (!completedLessonIds.includes(lessonId)) {
      const updated = [...completedLessonIds, lessonId];
      setCompletedLessonIds(updated);

      db.saveVideoProgress({
        studentId,
        lessonId,
        watchedSeconds: activeLesson.durationMinutes * 60,
        totalSeconds: activeLesson.durationMinutes * 60,
        completed: true,
        updatedAt: new Date().toISOString()
      });

      // Update enrollment progress percentage
      const enrollments = db.getEnrollments();
      const studentEnrollment = enrollments.find((e) => e.studentId === studentId && e.courseId === course.id);
      if (studentEnrollment) {
        studentEnrollment.progressPercentage = Math.min(100, Math.round((updated.length / allLessons.length) * 100));
        localStorage.setItem('edupro_enrollments_v2', JSON.stringify(enrollments));
      }
    }
  };

  const getVideoSource = (url: string) => {
  if (!url) return { type: 'unknown', url: '' };

  // YouTube: watch?v=...
  const youtubeWatchMatch = url.match(
    /(?:youtube\.com\/watch\?v=)([^&\s]+)/
  );

  // YouTube: youtu.be/...
  const youtubeShortMatch = url.match(
    /(?:youtu\.be\/)([^?\s]+)/
  );

  // YouTube: embed/...
  const youtubeEmbedMatch = url.match(
    /(?:youtube\.com\/embed\/)([^?\s]+)/
  );

  // YouTube: shorts/...
  const youtubeShortsMatch = url.match(
    /(?:youtube\.com\/shorts\/)([^?\s]+)/
  );

  const youtubeId =
    youtubeWatchMatch?.[1] ||
    youtubeShortMatch?.[1] ||
    youtubeEmbedMatch?.[1] ||
    youtubeShortsMatch?.[1];

  if (youtubeId) {
    return {
      type: 'youtube',
      url: `https://www.youtube.com/embed/${youtubeId}?autoplay=0&rel=0`,
    };
  }

  // Google Drive: /file/d/FILE_ID/view...
  const driveMatch = url.match(
    /drive\.google\.com\/file\/d\/([^/]+)/
  );

  if (driveMatch?.[1]) {
    return {
      type: 'google-drive',
      url: `https://drive.google.com/file/d/${driveMatch[1]}/preview`,
    };
  }

  // Already a Google Drive preview URL
  if (url.includes('drive.google.com') && url.includes('/preview')) {
    return {
      type: 'google-drive',
      url,
    };
  }

  // Normal direct video URL
  return {
    type: 'direct',
    url,
  };
};

  return (
    <div className="p-6 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Course Catalog</span>
        </button>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 rounded-full text-xs font-bold">
            {course.code}
          </span>
          <span className="text-xs font-bold text-slate-900 dark:text-white">{course.title}</span>
        </div>
      </div>

      {/* Main Grid: Player + Lesson Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Video Screen & Lesson Controls */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 aspect-video relative flex items-center justify-center">
           {(() => {
  const videoSource = getVideoSource(activeLesson?.videoUrl || '');

  if (videoSource.type === 'youtube') {
    return (
      <iframe
        src={videoSource.url}
        title={activeLesson?.title || 'YouTube Video'}
        className="w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    );
  }

  if (videoSource.type === 'google-drive') {
    return (
      <iframe
        src={videoSource.url}
        title={activeLesson?.title || 'Google Drive Video'}
        className="w-full h-full border-0"
        allow="autoplay; fullscreen"
        allowFullScreen
      />
    );
  }

  return (
    <video
      controls
      src={videoSource.url}
      className="w-full h-full object-cover"
      playsInline
    />
  );
})()}
          </div>

          {/* Lesson Metadata Bar */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{activeLesson?.title}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{activeLesson?.description}</p>
              </div>

              <button
                onClick={() => handleMarkCompleted(activeLesson.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
                  completedLessonIds.includes(activeLesson.id)
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{completedLessonIds.includes(activeLesson.id) ? 'Completed' : 'Mark as Completed'}</span>
              </button>
            </div>

            {/* Resource Downloads & Attachments */}
            {activeLesson?.attachmentUrl && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Lecture Attachment: {activeLesson.attachmentName || 'Resource_Notes.pdf'}</span>
                </div>
                <a
                  href={activeLesson.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </a>
              </div>
            )}
          </div>

          {/* Personal Student Study Notes Box */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Personal Study Notes & Highlights</span>
            </h3>
            <textarea
              value={studentNotes}
              onChange={(e) => setStudentNotes(e.target.value)}
              rows={3}
              placeholder="Take notes while watching video lectures..."
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Right Column: Course Curriculum Playlist */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Course Curriculum</h3>
              <p className="text-[10px] text-slate-400">{completedLessonIds.length} of {allLessons.length} Completed</p>
            </div>
            <span className="text-xs font-bold text-blue-600">
              {Math.round((completedLessonIds.length / allLessons.length) * 100)}%
            </span>
          </div>

          <div className="space-y-4">
            {course.modules.map((mod) => (
              <div key={mod.id} className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {mod.title}
                </h4>

                <div className="space-y-1.5">
                  {mod.lessons.map((les) => {
                    const isCurrent = activeLesson?.id === les.id;
                    const isDone = completedLessonIds.includes(les.id);

                    return (
                      <div
                        key={les.id}
                        onClick={() => !les.isLocked && setActiveLesson(les)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isCurrent
                            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 shadow-sm'
                            : les.isLocked
                            ? 'border-slate-200 dark:border-slate-800 opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : les.isLocked ? (
                            <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                          ) : (
                            <PlayCircle className={`w-4 h-4 shrink-0 ${isCurrent ? 'text-blue-600' : 'text-slate-400'}`} />
                          )}
                          <div>
                            <p className={`text-xs font-bold ${isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>
                              {les.title}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{les.durationMinutes} mins</p>
                          </div>
                        </div>

                        {isCurrent && <ChevronRight className="w-4 h-4 text-blue-600" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
