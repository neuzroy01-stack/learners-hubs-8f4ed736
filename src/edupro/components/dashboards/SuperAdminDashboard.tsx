import { formatAppDateTime } from '../../lib/datetime';
import React from 'react';
import {
  Users,
  BookOpen,
  Wallet,
  ShieldCheck,
  GraduationCap,
  RefreshCw,
  Radio,
  FileCheck,
} from 'lucide-react';
import { staffOverview } from '../../services/cloudDb';
import { useCloudQuery } from '../../hooks/useCloudQuery';

const money = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

/** Institute-wide control panel. All figures are read live from the database. */
export const SuperAdminDashboard: React.FC = () => {
  const { data, loading, error, reload } = useCloudQuery(() => staffOverview());

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 p-6 text-white shadow-xl">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight">
            <ShieldCheck className="h-6 w-6 text-emerald-400" /> Super Admin Control Center
          </h1>
          <p className="mt-1 text-xs text-slate-300">Full institute visibility — users, courses, revenue and approvals.</p>
        </div>
        <button onClick={() => void reload()} className="flex items-center gap-1.5 rounded-xl border border-white/20 px-3 py-2 text-xs font-bold">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </header>

      {error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric icon={<Users className="h-4 w-4" />} label="Students" value={String(data?.students ?? 0)} tone="text-blue-600" />
        <Metric icon={<GraduationCap className="h-4 w-4" />} label="Teachers" value={String(data?.teachers ?? 0)} tone="text-purple-600" />
        <Metric icon={<ShieldCheck className="h-4 w-4" />} label="Admins" value={String(data?.admins ?? 0)} tone="text-slate-900 dark:text-white" />
        <Metric icon={<BookOpen className="h-4 w-4" />} label="Courses" value={`${data?.publishedCourses ?? 0}/${data?.courses ?? 0}`} tone="text-emerald-600" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric icon={<Wallet className="h-4 w-4" />} label="Total Billed" value={money(data?.revenue.totalBilled ?? 0)} />
        <Metric icon={<Wallet className="h-4 w-4" />} label="Collected" value={money(data?.revenue.totalCollected ?? 0)} tone="text-emerald-600" />
        <Metric icon={<Wallet className="h-4 w-4" />} label="Pending Fees" value={money(data?.revenue.totalPending ?? 0)} tone="text-rose-600" />
        <Metric icon={<FileCheck className="h-4 w-4" />} label="Payments to verify" value={String(data?.pendingPayments ?? 0)} tone="text-amber-600" />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
          <Radio className="h-4 w-4 text-purple-600" /> Upcoming Live Classes
        </h2>
        <ul className="space-y-2 text-xs">
          {(data?.upcomingLive ?? []).map((l) => (
            <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
              <span className="font-bold text-slate-900 dark:text-white">{l.title}</span>
              <span className="text-slate-500">{formatAppDateTime(l.starts_at)}</span>
            </li>
          ))}
          {(data?.upcomingLive ?? []).length === 0 && !loading && (
            <li className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-700">
              No live classes scheduled.
            </li>
          )}
        </ul>
      </section>

      <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <h2 className="p-4 text-sm font-black text-slate-900 dark:text-white">Student fee ledger</h2>
        <table className="w-full min-w-[600px] text-left text-xs">
          <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 dark:bg-slate-800">
            <tr><th className="p-3">Student</th><th className="p-3">Billed</th><th className="p-3">Paid</th><th className="p-3">Pending</th><th className="p-3">Status</th></tr>
          </thead>
          <tbody>
            {(data?.revenue.perStudent ?? []).map((s) => (
              <tr key={s.student_id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="p-3 font-bold">{s.full_name}</td>
                <td className="p-3">{money(s.total)}</td>
                <td className="p-3 text-emerald-600">{money(s.paid)}</td>
                <td className="p-3 text-rose-600">{money(s.outstanding)}</td>
                <td className="p-3 uppercase">{s.status}</td>
              </tr>
            ))}
            {(data?.revenue.perStudent ?? []).length === 0 && !loading && (
              <tr><td colSpan={5} className="p-8 text-center text-slate-500">No students billed yet.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
};

const Metric: React.FC<{ icon: React.ReactNode; label: string; value: string; tone?: string }> = ({ icon, label, value, tone }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div className="mb-2 flex items-center justify-between text-slate-500">
      <span className="text-xs font-semibold">{label}</span>
      <div className="rounded-xl bg-slate-100 p-2 dark:bg-slate-800">{icon}</div>
    </div>
    <div className={`text-2xl font-black ${tone ?? 'text-slate-900 dark:text-white'}`}>{value}</div>
  </div>
);
