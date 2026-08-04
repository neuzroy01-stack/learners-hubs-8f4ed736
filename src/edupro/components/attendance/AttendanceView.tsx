import React, { useEffect, useMemo, useState } from 'react';
import { FileSpreadsheet, Save, RefreshCw, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { attendanceApi, courseRoster, type CloudAttendance } from '../../services/cloudDb';
import { useCloudQuery } from '../../hooks/useCloudQuery';
import { useCourseScope } from '../../hooks/useCourseScope';
import { useFeedback } from '../common/Feedback';
import { useAuth } from '../../context/AuthContext';

type Status = 'present' | 'absent' | 'leave';
const STATUSES: Status[] = ['present', 'absent', 'leave'];

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800';

const today = () => new Date().toISOString().split('T')[0];

/** Course-wise, date-wise attendance stored in the database. */
export const AttendanceView: React.FC = () => {
  const { currentUser } = useAuth();
  const { notify } = useFeedback();
  const { courses, canManage, loading: coursesLoading } = useCourseScope();

  const [courseId, setCourseId] = useState('');
  const activeCourseId = courseId || courses[0]?.id || '';
  const [date, setDate] = useState(today());
  const uid = currentUser?.id ?? '';

  const roster = useCloudQuery(
    async () => (canManage && activeCourseId ? courseRoster(activeCourseId) : []),
    [activeCourseId, canManage],
  );
  const dayRecords = useCloudQuery(
    async () => (canManage && activeCourseId ? attendanceApi.listByCourse(activeCourseId, date) : []),
    [activeCourseId, date, canManage],
  );
  const myRecords = useCloudQuery(
    async () => (!canManage && uid ? attendanceApi.listByStudent(uid) : []),
    [uid, canManage],
  );

  const [marks, setMarks] = useState<Record<string, Status>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const existing = new Map(((dayRecords.data ?? []) as CloudAttendance[]).map((r) => [r.student_id, r.status as Status]));
    const next: Record<string, Status> = {};
    (roster.data ?? []).forEach((s) => { next[s.student_id] = existing.get(s.student_id) ?? 'present'; });
    setMarks(next);
  }, [roster.data, dayRecords.data]);

  const saveAll = async () => {
    if (!activeCourseId) return;
    const rows = (roster.data ?? []).map((s) => ({
      course_id: activeCourseId,
      student_id: s.student_id,
      attendance_date: date,
      status: marks[s.student_id] ?? 'present',
      marked_by: uid || null,
    }));
    if (rows.length === 0) return notify('warning', 'No enrolled students in this course');
    setSaving(true);
    try {
      await attendanceApi.mark(rows);
      notify('success', `Attendance saved for ${rows.length} student(s)`);
      await dayRecords.reload();
    } catch (err) {
      notify('error', 'Could not save attendance', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const myStats = useMemo(() => {
    const rows = (myRecords.data ?? []) as CloudAttendance[];
    const scoped = activeCourseId ? rows.filter((r) => r.course_id === activeCourseId) : rows;
    const present = scoped.filter((r) => r.status === 'present').length;
    return { rows: scoped, present, total: scoped.length, pct: scoped.length ? Math.round((present / scoped.length) * 100) : 0 };
  }, [myRecords.data, activeCourseId]);

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-extrabold text-slate-900 dark:text-white">
            <FileSpreadsheet className="h-6 w-6 text-emerald-600" /> Attendance
          </h2>
          <p className="mt-1 text-xs text-slate-500">Course-wise and date-wise, saved directly to the database.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void (canManage ? Promise.all([roster.reload(), dayRecords.reload()]) : myRecords.reload())}
            className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold dark:border-slate-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${roster.loading || myRecords.loading ? 'animate-spin' : ''}`} />
          </button>
          {canManage && (
            <button onClick={() => void saveAll()} disabled={saving} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md disabled:opacity-60">
              <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save Attendance'}
            </button>
          )}
        </div>
      </header>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2">
        <div>
          <label className="text-[11px] font-black uppercase text-slate-500">Course</label>
          <select value={activeCourseId} onChange={(e) => setCourseId(e.target.value)} className={`${inputCls} mt-1`}>
            {courses.length === 0 && <option value="">{coursesLoading ? 'Loading…' : 'No courses available'}</option>}
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        {canManage && (
          <div>
            <label className="text-[11px] font-black uppercase text-slate-500">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${inputCls} mt-1`} />
          </div>
        )}
      </div>

      {canManage ? (
        <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full min-w-[520px] text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 dark:bg-slate-800">
              <tr><th className="p-3">Student</th><th className="p-3">Phone</th><th className="p-3">Batch</th><th className="p-3">Status</th></tr>
            </thead>
            <tbody>
              {(roster.data ?? []).map((s) => (
                <tr key={s.student_id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="p-3 font-bold">{s.full_name}</td>
                  <td className="p-3">{s.phone ?? '—'}</td>
                  <td className="p-3">{s.batch_name ?? '—'}</td>
                  <td className="p-3">
                    <div className="flex gap-1.5">
                      {STATUSES.map((st) => (
                        <button
                          key={st}
                          onClick={() => setMarks((m) => ({ ...m, [s.student_id]: st }))}
                          className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase ${
                            (marks[s.student_id] ?? 'present') === st
                              ? st === 'present' ? 'bg-emerald-600 text-white' : st === 'absent' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {!roster.loading && (roster.data ?? []).length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-slate-500">No students enrolled in this course yet.</td></tr>
              )}
            </tbody>
          </table>
        </section>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Classes" value={String(myStats.total)} icon={<Clock className="h-4 w-4" />} />
            <Stat label="Present" value={String(myStats.present)} tone="text-emerald-600" icon={<CheckCircle2 className="h-4 w-4" />} />
            <Stat label="Absent" value={String(myStats.total - myStats.present)} tone="text-rose-600" icon={<XCircle className="h-4 w-4" />} />
            <Stat label="Attendance %" value={`${myStats.pct}%`} tone="text-blue-600" />
          </div>
          <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full min-w-[420px] text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 dark:bg-slate-800">
                <tr><th className="p-3">Date</th><th className="p-3">Status</th><th className="p-3">Remarks</th></tr>
              </thead>
              <tbody>
                {myStats.rows.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="p-3">{new Date(r.attendance_date).toLocaleDateString('en-IN')}</td>
                    <td className="p-3 font-bold uppercase">{r.status}</td>
                    <td className="p-3">{r.remarks ?? '—'}</td>
                  </tr>
                ))}
                {myStats.rows.length === 0 && <tr><td colSpan={3} className="p-8 text-center text-slate-500">No attendance recorded for this course yet.</td></tr>}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string; tone?: string; icon?: React.ReactNode }> = ({ label, value, tone, icon }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
    <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-500">{icon}{label}</p>
    <p className={`text-lg font-black ${tone ?? 'text-slate-900 dark:text-white'}`}>{value}</p>
  </div>
);
