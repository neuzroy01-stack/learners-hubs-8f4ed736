import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { Course, RecordedClass } from '../../types/lms';
import { useAuth } from '../../context/AuthContext';
import {
  Video,
  Play,
  Lock,
  Unlock,
  CheckCircle,
  FileText,
  Clock,
  ChevronDown,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Search
} from 'lucide-react';

export const RecordedLecturesView: React.FC = () => {
  const { currentUser, currentRole } = useAuth();
  const [recordedClasses, setRecordedClasses] = useState<RecordedClass[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<RecordedClass | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [search, setSearch] = useState('');

  const courses = db.getCourses();
  const isFacultyOrAdmin = currentRole === 'admin' || currentRole === 'super_admin' || currentRole === 'teacher';

  useEffect(() => {
    loadRecordings();
    const unsub = db.subscribe(() => loadRecordings());
    return unsub;
  }, []);

  const loadRecordings = () => {
    const list = db.getRecordedClasses();
    setRecordedClasses(list);
    const weekList = list.filter((r) => (r.weekNumber || 1) === selectedWeek);
    if (weekList.length > 0) {
      setSelectedVideo(weekList[0]);
    } else if (list.length > 0 && !selectedVideo) {
      setSelectedVideo(list[0]);
    }
  };

  const handleWeekChange = (wk: number) => {
    setSelectedWeek(wk);
    const weekList = recordedClasses.filter((r) => (r.weekNumber || 1) === wk);
    if (weekList.length > 0) {
      setSelectedVideo(weekList[0]);
    }
  };

  const filteredRecordings = recordedClasses.filter((r) => {
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) || (r.topic && r.topic.toLowerCase().includes(search.toLowerCase()));
    return matchesSearch;
  });

  const activeWeekRecordings = filteredRecordings.filter((r) => (r.weekNumber || 1) === selectedWeek);

  const weekGroups = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <Video className="w-6 h-6 text-indigo-600" />
            <span>Recorded Lectures & Week-Wise Archive</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Access high-definition recorded sessions, downloadable notes, and week-wise lecture logs.
          </p>
        </div>

        {isFacultyOrAdmin && (
          <button
            onClick={() => {
              const newRec: RecordedClass = {
                id: `rec-${Date.now()}`,
                courseId: courses[0]?.id || 'course-yt-master-101',
                courseTitle: courses[0]?.title || 'YouTube Master Program',
                batchId: 'batch-yt-1',
                title: 'Week 1: Algorithmic Video Creation & YouTube SEO',
                videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                durationMinutes: 50,
                recordingDate: new Date().toISOString().split('T')[0],
                notesUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
              };
              db.getRecordedClasses().push(newRec);
              loadRecordings();
            }}
            className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Lecture Recording</span>
          </button>
        )}
      </div>

      {/* Week Tabs Selector */}
      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {weekGroups.map((wk) => (
          <button
            key={wk}
            onClick={() => handleWeekChange(wk)}
            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 cursor-pointer transition-all ${
              selectedWeek === wk
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            Week {wk}
          </button>
        ))}
      </div>

      {/* Main Player + Playlist Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Video Player (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          {selectedVideo ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="aspect-video bg-black relative">
                {selectedVideo.isLocked && !isFacultyOrAdmin ? (
                  <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center text-center p-6 text-white space-y-3">
                    <Lock className="w-12 h-12 text-amber-500 animate-bounce" />
                    <h3 className="text-base font-bold">Week {selectedVideo.weekNumber} Lecture Locked</h3>
                    <p className="text-xs text-slate-400 max-w-md">
                      This lecture recording is locked. Complete previous assignments or verify fee receipts to unlock.
                    </p>
                  </div>
                ) : (
                  <iframe
                    src={selectedVideo.videoUrl}
                    title={selectedVideo.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                )}
              </div>

              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                    Week {selectedVideo.weekNumber} Lecture
                  </span>
                  <span className="text-xs text-slate-400 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{selectedVideo.durationMinutes} Minutes</span>
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{selectedVideo.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{selectedVideo.topic}</p>

                {selectedVideo.notesPdfUrl && (
                  <a
                    href={selectedVideo.notesPdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-rose-500" />
                    <span>Download Lecture PDF Notes & Slides</span>
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
              No lecture selected. Choose a lecture from the playlist.
            </div>
          )}
        </div>

        {/* Right Playlist List (1 Col) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Week {selectedWeek} Playlist</h3>
            <span className="text-[10px] text-slate-400 font-mono">
              {activeWeekRecordings.length} Sessions
            </span>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {activeWeekRecordings.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                <Video className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No Recorded Lectures for Week {selectedWeek}</p>
                <p className="text-[11px] text-slate-400 mt-1">Sessions for this week will be published following the live class schedule.</p>
              </div>
            ) : (
              activeWeekRecordings.map((rec) => {
                const isSelected = selectedVideo?.id === rec.id;
                return (
                  <div
                    key={rec.id}
                    onClick={() => setSelectedVideo(rec)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start justify-between ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 shadow-sm'
                        : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>
                        <Play className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white line-clamp-1">{rec.title}</div>
                        <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{rec.topic}</div>
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center space-x-2">
                          <span>{rec.durationMinutes} min</span>
                          <span>•</span>
                          <span>{rec.recordingDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
