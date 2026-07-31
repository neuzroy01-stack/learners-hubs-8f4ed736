import React, { useMemo, useState } from 'react';
import { UserPlus, Trash2, RefreshCw, Search, GraduationCap } from 'lucide-react';
import { coursesApi, enrollmentsApi, studentFinance, type CloudCourse } from '../../services/cloudDb';
import { profilesApi } from '../../services/cloudProfiles';
import { useCloudQuery } from '../../hooks/useCloudQuery';
import { useFeedback } from '../common/Feedback';

const field = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900';

export const CourseAssignmentView: React.FC = () => {
  const { notify, confirm } = useFeedback();
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [courseId, setCourseId] = useState('');
  const [batchName, setBatchName] = useState('');
  const [busy, setBusy] = useState(false);

  const base = useCloudQuery(async () => {
    const [students, courses] = await Promise.all([profilesApi.list('student'), coursesApi.list()]);
    return { students, courses: courses as CloudCourse[] };
  });

  const detail = useCloudQuery(async () => {
    if (!selectedStudent) return null;
    const [enrollments, finance] = await Promise.all([
      enrollmentsApi.listByStudent(selectedStudent),
      studentFinance(selectedStudent),
    ]);
    return { enrollments, finance };
  }, [selectedStudent]);

  const students = base.data?.students ?? [];
  const courses = base.data?.courses ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => s.full_name.toLowerCase().includes(q) || (s.phone ?? '').includes(q));
  }, [students, search]);

  const assign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !courseId) { notify('warning', 'Pick a student and a course'); return; }
    setBusy(true);
    try {
      await enrollmentsApi.enroll(selectedStudent, courseId, batchName.trim() || undefined);
      notify('success', 'Course assigned', 'Fee records were generated automatically.');
      setCourseId(''); setBatchName('');
      await detail.reload();
    } catch (err) {
      notify('error', 'Assignment failed', err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  const unassign = async (id: string, title: string) => {
    const res = await confirm({
      title: `Remove "${title}"?`,
      message: 'The student loses access to this course content. Fee and payment history stays for audit.',
      confirmLabel: 'Remove course',
      tone: 'danger',
    });
    if (!res.ok) return;
    try {
      await enrollmentsApi.remove(id);
      notify('success', 'Course removed');
      await detail.reload();
    } catch (err) {
      notify('error', 'Remove failed', err instanceof Error ? err.message : undefined);
    }
  };

  const fin = detail.data?.finance;

  return (
    <div className="space-y-5 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-black text-slate-900 dark:text-white">
            <GraduationCap className="h-5 w-5 text-blue-600" /> Course Assignment
          </h1>
          <p className="text-xs text-slate-500">Assign courses to students. Fees populate automatically from the course price.</p>
        </div>
        <button onClick={() => { void base.reload(); void detail.reload(); }} className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold dark:border-slate-700">
          <RefreshCw className={`h-3.5 w-3.5 ${base.loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </header>

      {base.error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{base.error}</p>}

      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input aria-label="Search students" className={`${field} pl-8`} placeholder="Search students" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <ul className="max-h-[420px] space-y-1 overflow-y-auto">
            {filtered.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => setSelectedStudent(s.id)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-xs ${selectedStudent === s.id ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <span className="block font-bold">{s.full_name}</span>
                  <span className={selectedStudent === s.id ? 'text-blue-100' : 'text-slate-500'}>{s.phone || s.email || '—'}</span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && <li className="p-4 text-center text-xs text-slate-500">No students found.</li>}
          </ul>
        </section>

        <section className="space-y-4">
          {!selectedStudent ? (
            <p className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700">
              Select a student to manage their course assignments.
            </p>
          ) : (
            <>
              <form onSubmit={assign} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-[2fr_1fr_auto]">
                <select aria-label="Course" className={field} value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                  <option value="">Select a course…</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.title} — ₹{Number(c.official_fee).toLocaleString('en-IN')}</option>
                  ))}
                </select>
                <input aria-label="Batch name" className={field} placeholder="Batch (optional)" value={batchName} onChange={(e) => setBatchName(e.target.value)} />
                <button type="submit" disabled={busy} className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-60">
                  <UserPlus className="h-3.5 w-3.5" /> Assign
                </button>
              </form>

              {fin && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { l: 'Total Fees', v: fin.total, c: 'text-slate-900 dark:text-white' },
                    { l: 'Paid', v: fin.paid, c: 'text-emerald-600' },
                    { l: 'Outstanding', v: fin.outstanding, c: 'text-rose-600' },
                  ].map((k) => (
                    <div key={k.l} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                      <p className="text-[10px] font-bold uppercase text-slate-500">{k.l}</p>
                      <p className={`text-lg font-black ${k.c}`}>₹{k.v.toLocaleString('en-IN')}</p>
                    </div>
                  ))}
                  <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-[10px] font-bold uppercase text-slate-500">Status</p>
                    <p className="text-lg font-black text-blue-600">{fin.status}</p>
                  </div>
                </div>
              )}

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 dark:bg-slate-800">
                    <tr><th className="p-3">Course</th><th className="p-3">Batch</th><th className="p-3">Total fee</th><th className="p-3">Status</th><th className="p-3" /></tr>
                  </thead>
                  <tbody>
                    {(detail.data?.enrollments ?? []).map((e) => (
                      <tr key={e.id} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="p-3 font-bold">{e.courses?.title ?? 'Course'}</td>
                        <td className="p-3">{e.batch_name || '—'}</td>
                        <td className="p-3">₹{Number(e.total_fee).toLocaleString('en-IN')}</td>
                        <td className="p-3 uppercase">{e.status}</td>
                        <td className="p-3 text-right">
                          <button onClick={() => void unassign(e.id, e.courses?.title ?? 'course')} className="rounded-lg border border-rose-300 p-1.5 text-rose-600 dark:border-rose-900" aria-label="Remove course">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(detail.data?.enrollments ?? []).length === 0 && (
                      <tr><td colSpan={5} className="p-6 text-center text-slate-500">No courses assigned yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};
