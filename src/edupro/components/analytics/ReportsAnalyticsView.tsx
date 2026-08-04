import React from 'react';
import { BarChart3, Download, TrendingUp, Users, IndianRupee, GraduationCap, RefreshCw } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { revenueSummary } from '../../services/cloudDb';
import { useCloudQuery } from '../../hooks/useCloudQuery';

const money = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

/** Reports & revenue analytics — every figure is computed from the database. */
export const ReportsAnalyticsView: React.FC = () => {
  const { data, loading, error, reload } = useCloudQuery(() => revenueSummary(), []);

  const exportCsv = () => {
    if (!data) return;
    const headers = ['StudentId', 'FullName', 'Phone', 'TotalFees', 'Paid', 'Pending', 'Status'];
    const rows = data.perStudent.map((s) => [s.student_id, s.full_name, s.phone ?? '', s.total, s.paid, s.outstanding, s.status]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(`data:text/csv;charset=utf-8,${csv}`);
    link.download = `learnerhub_fee_report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-extrabold text-slate-900 dark:text-white">
            <BarChart3 className="h-6 w-6 text-indigo-600" /> Reports & Revenue Analytics
          </h2>
          <p className="mt-1 text-xs text-slate-500">Live totals from fees and verified payments — no sample data.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => void reload()} className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold dark:border-slate-700">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={exportCsv} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md">
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </header>

      {error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Total Billed" value={money(data?.totalBilled ?? 0)} icon={<IndianRupee className="h-4 w-4" />} />
        <Stat label="Collected" value={money(data?.totalCollected ?? 0)} tone="text-emerald-600" icon={<TrendingUp className="h-4 w-4" />} />
        <Stat label="Pending" value={money(data?.totalPending ?? 0)} tone="text-rose-600" />
        <Stat label="Students" value={String(data?.studentCount ?? 0)} tone="text-blue-600" icon={<Users className="h-4 w-4" />} />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-xs font-black uppercase text-slate-500">Monthly collection</h3>
        <div className="mt-3 h-64">
          {(data?.monthly.length ?? 0) > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.monthly ?? []}>
                <XAxis dataKey="month" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip formatter={(v: number) => money(Number(v))} />
                <Area type="monotone" dataKey="collected" stroke="#059669" fill="#a7f3d0" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="flex h-full items-center justify-center text-sm text-slate-500">No payments recorded yet.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="flex items-center gap-2 text-xs font-black uppercase text-slate-500">
          <GraduationCap className="h-4 w-4" /> Course-wise revenue
        </h3>
        <div className="mt-3 h-64">
          {(data?.perCourse.length ?? 0) > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.perCourse ?? []}>
                <XAxis dataKey="title" fontSize={10} />
                <YAxis fontSize={11} />
                <Tooltip formatter={(v: number) => money(Number(v))} />
                <Bar dataKey="billed" fill="#c7d2fe" />
                <Bar dataKey="collected" fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="flex h-full items-center justify-center text-sm text-slate-500">No course revenue yet.</p>
          )}
        </div>
      </section>

      <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <h3 className="p-3 text-xs font-black uppercase text-slate-500">Student fee ledger</h3>
        <table className="w-full min-w-[620px] text-left text-xs">
          <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 dark:bg-slate-800">
            <tr><th className="p-3">Student</th><th className="p-3">Phone</th><th className="p-3">Total</th><th className="p-3">Paid</th><th className="p-3">Pending</th><th className="p-3">Status</th></tr>
          </thead>
          <tbody>
            {(data?.perStudent ?? []).map((s) => (
              <tr key={s.student_id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="p-3 font-bold">{s.full_name}</td>
                <td className="p-3">{s.phone ?? '—'}</td>
                <td className="p-3">{money(s.total)}</td>
                <td className="p-3 text-emerald-600">{money(s.paid)}</td>
                <td className="p-3 text-rose-600">{money(s.outstanding)}</td>
                <td className="p-3 font-bold">{s.status}</td>
              </tr>
            ))}
            {!loading && (data?.perStudent.length ?? 0) === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-slate-500">No students in the database yet.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string; tone?: string; icon?: React.ReactNode }> = ({ label, value, tone, icon }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
    <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-500">{icon}{label}</p>
    <p className={`text-lg font-black ${tone ?? 'text-slate-900 dark:text-white'}`}>{value}</p>
  </div>
);
