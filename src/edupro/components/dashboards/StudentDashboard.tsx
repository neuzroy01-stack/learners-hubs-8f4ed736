import { formatAppDateTime } from '../../lib/datetime';
import React, { useState } from 'react';
import {
  GraduationCap,
  Radio,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  Calendar,
  BookOpen,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { studentOverview } from '../../services/cloudDb';
import { useCloudQuery } from '../../hooks/useCloudQuery';
import { PayFeeModal } from '../fees/PayFeeModal';
import type { Course } from '../../types/lms';

interface StudentDashboardProps {
  onSelectCourse: (course: Course) => void;
  onNavigateTab: (tab: string) => void;
}

const money = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

const attendanceTone = (p: number) =>
  p >= 85 ? 'text-emerald-600' : p >= 60 ? 'text-amber-500' : 'text-rose-600';

/**
 * Student home. Every figure below is derived from database rows only —
 * progress, attendance and pending fees are computed, never hardcoded.
 */
export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigateTab }) => {
  const { currentUser } = useAuth();
  const uid = currentUser?.id ?? '';
  const [payOpen, setPayOpen] = useState(false);

  const { data, loading, error, reload } = useCloudQuery(
    async () => (uid ? studentOverview(uid) : null),
    [uid],
  );

  if (!uid) return <p className="p-6 text-sm text-slate-500">Please sign in to view your dashboard.</p>;

  const overview = data;
  const outstanding = overview?.finance.outstanding ?? 0;
  const pendingReview = (overview?.finance.payments ?? []).filter((p) => p.status === 'pending');
  const lastRejected = (overview?.finance.payments ?? []).find((p) => p.status === 'rejected');

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col justify-between gap-4 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 text-white shadow-xl md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight">
            Welcome back, {currentUser?.name ?? currentUser?.email ?? 'Student'}!
          </h1>
          <p className="mt-1 text-xs text-blue-200">
            {overview?.courses.length
              ? `${overview.courses.length} active course${overview.courses.length > 1 ? 's' : ''}`
              : 'No courses assigned yet — your admin will enrol you shortly.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => void reload()}
            className="flex items-center gap-1.5 rounded-xl border border-white/20 px-3 py-2 text-xs font-bold"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          {overview?.upcomingLive[0]?.meeting_url && (
            <a
              href={overview.upcomingLive[0].meeting_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-xs font-bold shadow-lg"
            >
              <Radio className="h-4 w-4 text-rose-300" /> Join Live Class
            </a>
          )}
        </div>
      </div>

      {error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Course Progress</span>
            <div className="rounded-xl bg-blue-100 p-2 text-blue-600 dark:bg-blue-950/50">
              <GraduationCap className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{overview?.overallProgress ?? 0}%</div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${overview?.overallProgress ?? 0}%` }} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Attendance</span>
            <div className="rounded-xl bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-950/50">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className={`text-2xl font-black ${attendanceTone(overview?.attendance.percent ?? 0)}`}>
            {overview?.attendance.percent ?? 0}%
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {overview?.attendance.present ?? 0} present of {overview?.attendance.total ?? 0} marked classes
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Pending Fee Balance</span>
            <div className="rounded-xl bg-rose-100 p-2 text-rose-600 dark:bg-rose-950/50">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className={`text-2xl font-black ${outstanding > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {money(outstanding)}
          </div>
          {outstanding > 0 ? (
            <button onClick={() => setPayOpen(true)} className="mt-1 block text-[11px] font-bold text-blue-600 hover:underline">
              Pay now with UPI →
            </button>
          ) : (
            <div className="mt-1 text-[11px] font-bold text-emerald-600">Fees fully settled</div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Fees Paid</span>
            <div className="rounded-xl bg-amber-100 p-2 text-amber-600 dark:bg-amber-950/50">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{money(overview?.finance.paid ?? 0)}</div>
          <div className="mt-1 text-[11px] text-slate-400">
            {pendingReview.length > 0 ? `${pendingReview.length} payment awaiting review` : 'All submissions reviewed'}
          </div>
        </div>
      </div>

      {lastRejected && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs dark:border-amber-900 dark:bg-amber-950/40">
          <p className="font-black text-amber-800 dark:text-amber-300">Last payment was rejected</p>
          <p className="mt-1 text-amber-700 dark:text-amber-200">{lastRejected.notes || 'Please submit a new request with a valid UTR.'}</p>
          <button onClick={() => setPayOpen(true)} className="mt-2 rounded-lg bg-amber-600 px-3 py-1.5 font-bold text-white">
            Resubmit payment
          </button>
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
            <BookOpen className="h-4 w-4 text-blue-600" /> My Courses
          </h2>
          <button onClick={() => onNavigateTab('my_courses')} className="flex items-center gap-1 text-[11px] font-bold text-blue-600">
            View all <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {(overview?.courses ?? []).map((c) => (
            <button
              key={c.enrollment_id}
              onClick={() => onNavigateTab('my_courses')}
              className="rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-400 dark:border-slate-800"
            >
              <p className="text-sm font-black text-slate-900 dark:text-white">{c.course.title}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">{c.course.instructor_name || 'Mentor-led'} · {c.course.level}</p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${c.percent}%` }} />
              </div>
              <p className="mt-1 text-[10px] font-bold text-slate-500">
                {c.percent}% complete · {c.completed}/{c.total} activities
              </p>
            </button>
          ))}
          {(overview?.courses ?? []).length === 0 && !loading && (
            <p className="col-span-full rounded-xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500 dark:border-slate-700">
              No courses assigned yet.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
          <Calendar className="h-4 w-4 text-purple-600" /> Upcoming Live Classes
        </h2>
        <ul className="space-y-2">
          {(overview?.upcomingLive ?? []).map((l) => (
            <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3 text-xs dark:border-slate-800">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{l.title}</p>
                <p className="text-[11px] text-slate-500">{formatAppDateTime(l.starts_at)}</p>
              </div>
              {l.meeting_url && (
                <a href={l.meeting_url} target="_blank" rel="noreferrer" className="rounded-lg bg-purple-600 px-3 py-1.5 font-bold text-white">
                  Join
                </a>
              )}
            </li>
          ))}
          {(overview?.upcomingLive ?? []).length === 0 && !loading && (
            <li className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500 dark:border-slate-700">
              No live classes scheduled.
            </li>
          )}
        </ul>
      </section>

      {payOpen && (
        <PayFeeModal
          outstanding={outstanding}
          onClose={() => setPayOpen(false)}
          onSubmitted={reload}
        />
      )}
    </div>
  );
};
