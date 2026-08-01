import React, { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  enrollmentsApi,
  liveClassesApi,
  lecturesApi,
  assignmentsApi,
  materialsApi,
  studentFinance,
  type CloudCourse,
} from '../../services/cloudDb';
import { useCloudQuery } from '../../hooks/useCloudQuery';
import {
  GraduationCap,
  PlayCircle,
  Radio,
  FileCheck,
  CreditCard,
  Clock,
  BookOpen,
  ArrowRight,
  Calendar,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface StudentDashboardProps {
  onNavigateTab: (tab: string) => void;
}

const money = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigateTab }) => {
  const { currentUser } = useAuth();
  const uid = currentUser?.id ?? '';

  const enrolled = useCloudQuery(async () => (uid ? enrollmentsApi.listByStudent(uid) : []), [uid]);
  const rows = useMemo(() => enrolled.data ?? [], [enrolled.data]);
  const courseIds = useMemo(() => rows.map((e) => e.course_id), [rows]);
  const key = courseIds.join(',');

  const finance = useCloudQuery(async () => (uid ? studentFinance(uid) : null), [uid]);
  const live = useCloudQuery(() => liveClassesApi.listForCourses(courseIds), [key]);
  const lectures = useCloudQuery(() => lecturesApi.listForCourses(courseIds), [key]);
  const assignments = useCloudQuery(() => assignmentsApi.listForCourses(courseIds), [key]);
  const materials = useCloudQuery(() => materialsApi.listForCourses(courseIds), [key]);

  const activeCourse = (rows[0]?.courses ?? null) as CloudCourse | null;
  const upcomingLive = (live.data ?? []).find((l) => new Date(l.starts_at).getTime() > Date.now() - 3600_000);
  const openAssignments = (assignments.data ?? []).filter((a) => a.is_published);
  const fin = finance.data;

  const reloadAll = () => {
    void enrolled.reload();
    void finance.reload();
  };

  if (!enrolled.loading && rows.length === 0) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-16 text-center">
          <BookOpen className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <h1 className="text-lg font-black text-slate-900 dark:text-white">
            Welcome, {currentUser?.name ?? 'Student'}
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            No course has been assigned to your account yet. Once an admin assigns a course, your lectures,
            live classes, assignments and fees will appear here.
          </p>
        </div>
      </div>
    );
  }

  const stat = (
    label: string,
    value: string,
    icon: React.ReactNode,
    tone: string,
    tab?: string,
  ) => (
    <button
      type="button"
      onClick={() => tab && onNavigateTab(tab)}
      className="text-left bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between text-slate-500 mb-2">
        <span className="text-xs font-semibold">{label}</span>
        <div className={`p-2 rounded-xl ${tone}`}>{icon}</div>
      </div>
      <div className="text-2xl font-black text-slate-900 dark:text-white">{value}</div>
    </button>
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-200 border border-blue-400/30 rounded-full text-xs font-bold">
              STUDENT
            </span>
            {rows[0]?.batch_name && (
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-bold">
                Batch: {rows[0].batch_name}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black tracking-tight mt-1">
            Welcome back, {currentUser?.name ?? 'Student'}!
          </h1>
          <p className="text-xs text-blue-200 mt-0.5">
            Course: <strong className="font-semibold text-white">{activeCourse?.title ?? '—'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={reloadAll}
            className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${enrolled.loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          {upcomingLive?.meeting_url && (
            <a
              href={upcomingLive.meeting_url}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg"
            >
              <Radio className="w-4 h-4 text-rose-300" />
              <span>Join Live Class</span>
            </a>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stat('Recorded Lectures', String((lectures.data ?? []).length), <PlayCircle className="w-4 h-4" />, 'bg-blue-100 dark:bg-blue-950/50 text-blue-600', 'recordings')}
        {stat('Live Classes', String((live.data ?? []).length), <Radio className="w-4 h-4" />, 'bg-purple-100 dark:bg-purple-950/50 text-purple-600', 'live_classes')}
        {stat('Assignments', String(openAssignments.length), <FileCheck className="w-4 h-4" />, 'bg-amber-100 dark:bg-amber-950/50 text-amber-600', 'assignments')}
        {stat('Study Materials', String((materials.data ?? []).length), <GraduationCap className="w-4 h-4" />, 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600', 'downloads')}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fees */}
        <section className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-600" /> Fee Summary
          </h2>
          {finance.loading && !fin ? (
            <p className="text-xs text-slate-500">Loading fees…</p>
          ) : (
            <>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Total fees</dt>
                  <dd className="font-bold text-slate-900 dark:text-white">{money(fin?.total ?? 0)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Paid</dt>
                  <dd className="font-bold text-emerald-600">{money(fin?.paid ?? 0)}</dd>
                </div>
                <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-2">
                  <dt className="text-slate-500">Outstanding</dt>
                  <dd className="font-black text-rose-600">{money(fin?.outstanding ?? 0)}</dd>
                </div>
              </dl>
              <button
                onClick={() => onNavigateTab('my_fees')}
                className="w-full mt-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 flex items-center justify-center gap-1.5"
              >
                Pay / view fee history <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </section>

        {/* Upcoming live */}
        <section className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-purple-600" /> Upcoming live classes
          </h2>
          {(live.data ?? []).length === 0 ? (
            <p className="text-xs text-slate-500">No live classes scheduled for your course yet.</p>
          ) : (
            <ul className="space-y-2">
              {(live.data ?? []).slice(0, 4).map((l) => (
                <li
                  key={l.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 dark:border-slate-800 p-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{l.title}</p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(l.starts_at).toLocaleString('en-IN')}
                    </p>
                  </div>
                  {l.meeting_url ? (
                    <a
                      href={l.meeting_url}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 rounded-lg bg-purple-600 px-3 py-1.5 text-[11px] font-bold text-white"
                    >
                      Join
                    </a>
                  ) : (
                    <span className="shrink-0 text-[11px] text-slate-400">Link soon</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Assignments */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 mb-3">
          <AlertCircle className="w-4 h-4 text-amber-500" /> Pending assignments
        </h2>
        {openAssignments.length === 0 ? (
          <p className="text-xs text-slate-500">Nothing due right now.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {openAssignments.slice(0, 6).map((a) => (
              <li key={a.id} className="rounded-xl border border-slate-100 dark:border-slate-800 p-3">
                <p className="text-xs font-bold text-slate-900 dark:text-white">{a.title}</p>
                <p className="text-[11px] text-slate-500">
                  Due {a.due_at ? new Date(a.due_at).toLocaleDateString('en-IN') : '—'} · {a.max_marks} marks
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
