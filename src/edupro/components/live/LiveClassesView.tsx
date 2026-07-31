import React, { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { enrollmentsApi, liveClassesApi, type CloudLiveClass } from '../../services/cloudDb';
import { useCloudQuery } from '../../hooks/useCloudQuery';
import { Radio, Clock, Calendar, ExternalLink, Video } from 'lucide-react';

export const LiveClassesView: React.FC = () => {
  const { currentUser, currentRole } = useAuth();
  const uid = currentUser?.id ?? '';
  const isStudent = currentRole === 'student';

  const enrolled = useCloudQuery(async () => (uid ? enrollmentsApi.listByStudent(uid) : []), [uid]);
  const courseIds = useMemo(
    () => (enrolled.data ?? []).map((e) => e.course_id),
    [enrolled.data],
  );

  const liveClasses = useCloudQuery(async () => {
    if (isStudent) return courseIds.length ? liveClassesApi.listForCourses(courseIds) : [];
    return liveClassesApi.listForCourses(courseIds.length ? courseIds : []);
  }, [courseIds.join(',')]);

  const list: CloudLiveClass[] = liveClasses.data ?? [];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <Radio className="w-6 h-6 text-rose-600 animate-pulse" />
            <span>Live Interactive Classes &amp; Webinars</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Join live stream sessions, interact with faculty in real-time, and view upcoming class schedules.
          </p>
        </div>
      </div>

      {enrolled.error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40">
          {enrolled.error}
        </div>
      )}

      {isStudent && courseIds.length === 0 && !enrolled.loading ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-16 text-center text-slate-500 dark:text-slate-400">
          <Radio className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-bold">No course assigned yet</p>
          <p className="text-xs mt-1">Live classes will appear here once a course is assigned to your account.</p>
        </div>
      ) : liveClasses.loading ? (
        <div className="p-12 text-center text-sm text-slate-500">Loading live classes…</div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-16 text-center text-slate-500 dark:text-slate-400">
          <Radio className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-bold">No live classes scheduled</p>
          <p className="text-xs mt-1">Live classes will appear here once they are added to your course.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map((cls) => {
            const start = new Date(cls.starts_at);
            const end = cls.ends_at ? new Date(cls.ends_at) : null;
            return (
              <div
                key={cls.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-800 uppercase flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                      <span>{cls.status}</span>
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 font-mono">
                      {cls.platform}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">{cls.title}</h3>
                  {cls.description && <p className="text-xs text-slate-500 dark:text-slate-400">{cls.description}</p>}

                  <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                    <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{start.toLocaleDateString('en-IN')}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      <span>{start.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}{end ? ` - ${end.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : ''}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  {cls.meeting_url ? (
                    <a
                      href={cls.meeting_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-all shadow-md ml-auto"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Join Meeting</span>
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 ml-auto">No meeting link provided</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
