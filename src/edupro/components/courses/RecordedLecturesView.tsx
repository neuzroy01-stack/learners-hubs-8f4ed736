import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { enrollmentsApi, lecturesApi, type CloudLecture } from '../../services/cloudDb';
import { useCloudQuery } from '../../hooks/useCloudQuery';
import { Video, Play, FileText, Clock, ExternalLink, Search } from 'lucide-react';

export const RecordedLecturesView: React.FC = () => {
  const { currentUser, currentRole } = useAuth();
  const uid = currentUser?.id ?? '';
  const isStudent = currentRole === 'student';
  const isFacultyOrAdmin = currentRole === 'admin' || currentRole === 'super_admin' || currentRole === 'teacher';

  const [selectedVideo, setSelectedVideo] = useState<CloudLecture | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [search, setSearch] = useState('');

  const enrolled = useCloudQuery(async () => (uid ? enrollmentsApi.listByStudent(uid) : []), [uid]);
  const courseIds = useMemo(
    () => (enrolled.data ?? []).map((e) => e.course_id),
    [enrolled.data],
  );

  const lectures = useCloudQuery(async () => {
    if (isStudent) return courseIds.length ? lecturesApi.listForCourses(courseIds) : [];
    return lecturesApi.listForCourses(courseIds.length ? courseIds : []);
  }, [courseIds.join(',')]);

  const list = lectures.data ?? [];

  const weekGroups = useMemo(() => {
    const weeks = new Set<number>();
    list.forEach((r) => weeks.add(r.week_number ?? 1));
    return [...weeks].sort((a, b) => a - b);
  }, [list]);

  useEffect(() => {
    if (weekGroups.length && !weekGroups.includes(selectedWeek)) {
      setSelectedWeek(weekGroups[0]);
    }
  }, [weekGroups, selectedWeek]);

  useEffect(() => {
    const weekList = list.filter((r) => (r.week_number ?? 1) === selectedWeek);
    if (weekList.length > 0) {
      setSelectedVideo(weekList[0]);
    } else {
      setSelectedVideo(null);
    }
  }, [list, selectedWeek]);

  const handleWeekChange = (wk: number) => {
    setSelectedWeek(wk);
    const weekList = list.filter((r) => (r.week_number ?? 1) === wk);
    setSelectedVideo(weekList.length > 0 ? weekList[0] : null);
  };

  const filteredRecordings = list.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.description ?? '').toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const activeWeekRecordings = filteredRecordings.filter((r) => (r.week_number ?? 1) === selectedWeek);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <Video className="w-6 h-6 text-indigo-600" />
            <span>Recorded Lectures &amp; Week-Wise Archive</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Access high-definition recorded sessions, downloadable notes, and week-wise lecture logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search lectures…"
              className="w-full sm:w-64 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {enrolled.error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40">
          {enrolled.error}
        </div>
      )}

      {isStudent && courseIds.length === 0 && !enrolled.loading ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-16 text-center text-slate-500 dark:text-slate-400">
          <Video className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-bold">No course assigned yet</p>
          <p className="text-xs mt-1">Recorded lectures will become available once a course is assigned to your account.</p>
        </div>
      ) : lectures.loading ? (
        <div className="p-12 text-center text-sm text-slate-500">Loading recorded lectures…</div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-16 text-center text-slate-500 dark:text-slate-400">
          <Video className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-bold">No recorded lectures yet</p>
          <p className="text-xs mt-1">Lectures will appear here once they are added to your course.</p>
        </div>
      ) : (
        <>
          {/* Week Tabs Selector */}
          {weekGroups.length > 0 && (
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
          )}

          {/* Main Player + Playlist Split View */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Video Player (2 Cols) */}
            <div className="lg:col-span-2 space-y-4">
              {selectedVideo ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                  <div className="aspect-video bg-black relative">
                    {selectedVideo.video_url ? (
                      <iframe
                        src={selectedVideo.video_url}
                        title={selectedVideo.title}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
                        <Video className="w-12 h-12 opacity-50" />
                        <p className="text-xs">No video URL provided for this lecture.</p>
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                        Week {selectedVideo.week_number ?? 1} Lecture
                      </span>
                      <span className="text-xs text-slate-400 flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{selectedVideo.duration_minutes ?? '—'} Minutes</span>
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{selectedVideo.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{selectedVideo.description}</p>
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
                            <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{rec.description}</div>
                            <div className="text-[10px] text-slate-400 mt-1 flex items-center space-x-2">
                              <span>{rec.duration_minutes ?? '—'} min</span>
                              <span>•</span>
                              <span>{new Date(rec.created_at).toLocaleDateString('en-IN')}</span>
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
        </>
      )}
    </div>
  );
};
