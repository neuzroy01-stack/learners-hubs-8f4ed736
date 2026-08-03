import React, { useMemo, useState } from 'react';
import { Radio, Plus, ExternalLink, Pencil, Trash2, RefreshCw, X, Calendar } from 'lucide-react';
import { liveClassesApi, type CloudLiveClass } from '../../services/cloudDb';
import { useCloudQuery } from '../../hooks/useCloudQuery';
import { useCourseScope } from '../../hooks/useCourseScope';
import { useFeedback } from '../common/Feedback';
import { useAuth } from '../../context/AuthContext';

const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

interface FormState {
  id?: string;
  title: string;
  description: string;
  platform: string;
  meeting_url: string;
  starts_at: string;
  ends_at: string;
  is_published: boolean;
}

const emptyForm = (): FormState => ({
  title: '',
  description: '',
  platform: 'zoom',
  meeting_url: '',
  starts_at: toLocalInput(new Date().toISOString()),
  ends_at: '',
  is_published: true,
});

/** Live classes, fully database driven and isolated per course. */
export const LiveClassesView: React.FC = () => {
  const { currentUser } = useAuth();
  const { notify, confirm } = useFeedback();
  const { courses, courseIds, canManage, loading: coursesLoading } = useCourseScope();

  const [courseId, setCourseId] = useState<string>('');
  const activeCourseId = courseId || courses[0]?.id || '';

  const { data, loading, error, reload } = useCloudQuery(
    async () => (activeCourseId ? liveClassesApi.listByCourse(activeCourseId) : []),
    [activeCourseId, courseIds.join(',')],
  );
  const classes = useMemo(() => (data ?? []) as CloudLiveClass[], [data]);

  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);

  const openCreate = () => setForm(emptyForm());
  const openEdit = (row: CloudLiveClass) =>
    setForm({
      id: row.id,
      title: row.title,
      description: row.description ?? '',
      platform: row.platform,
      meeting_url: row.meeting_url ?? '',
      starts_at: toLocalInput(row.starts_at),
      ends_at: row.ends_at ? toLocalInput(row.ends_at) : '',
      is_published: row.is_published,
    });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !activeCourseId) return;
    if (!form.title.trim()) return notify('error', 'Title is required');
    setSaving(true);
    try {
      const payload = {
        course_id: activeCourseId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        platform: form.platform,
        meeting_url: form.meeting_url.trim() || null,
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
        is_published: form.is_published,
        teacher_id: currentUser?.id ?? null,
      };
      if (form.id) await liveClassesApi.update(form.id, payload);
      else await liveClassesApi.create(payload);
      notify('success', form.id ? 'Live class updated' : 'Live class scheduled');
      setForm(null);
      await reload();
    } catch (err) {
      notify('error', 'Could not save', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: CloudLiveClass) => {
    const res = await confirm({
      title: 'Delete live class?',
      message: `"${row.title}" will be removed for every student in this course.`,
      tone: 'danger',
      confirmLabel: 'Delete',
    });
    if (!res.ok) return;
    try {
      await liveClassesApi.remove(row.id);
      notify('success', 'Live class deleted');
      await reload();
    } catch (err) {
      notify('error', 'Could not delete', (err as Error).message);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-extrabold text-slate-900 dark:text-white">
            <Radio className="h-6 w-6 animate-pulse text-rose-600" /> Live Classes
          </h2>
          <p className="mt-1 text-xs text-slate-500">Schedules come straight from the database — every course has its own sessions.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => void reload()} className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold dark:border-slate-700">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {canManage && activeCourseId && (
            <button onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-rose-700">
              <Plus className="h-4 w-4" /> Schedule Class
            </button>
          )}
        </div>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <label className="text-[11px] font-black uppercase text-slate-500">Course</label>
        <select
          value={activeCourseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
        >
          {courses.length === 0 && <option value="">{coursesLoading ? 'Loading…' : 'No courses available'}</option>}
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      {error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {classes.map((row) => (
          <article key={row.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">{row.title}</h3>
                <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(row.starts_at).toLocaleString('en-IN')}
                </p>
              </div>
              <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {row.platform}
              </span>
            </div>
            {row.description && <p className="mt-2 text-xs text-slate-500">{row.description}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {row.meeting_url && (
                <a href={row.meeting_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-[11px] font-bold text-white hover:bg-rose-700">
                  <ExternalLink className="h-3.5 w-3.5" /> Join
                </a>
              )}
              {canManage && (
                <>
                  <button onClick={() => openEdit(row)} className="flex items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-2 text-[11px] font-bold dark:border-slate-700">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button onClick={() => void remove(row)} className="flex items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-2 text-[11px] font-bold text-rose-600 dark:border-rose-900">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </>
              )}
            </div>
          </article>
        ))}
        {!loading && classes.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 md:col-span-2">
            No live classes scheduled for this course yet.
          </p>
        )}
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <form onSubmit={save} className="w-full max-w-lg space-y-3 rounded-2xl bg-white p-6 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black">{form.id ? 'Edit live class' : 'Schedule live class'}</h3>
              <button type="button" onClick={() => setForm(null)}><X className="h-4 w-4" /></button>
            </div>
            <Field label="Title"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} /></Field>
            <Field label="Description"><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className={inputCls} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Platform">
                <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} className={inputCls}>
                  <option value="zoom">Zoom</option>
                  <option value="google_meet">Google Meet</option>
                  <option value="youtube">YouTube Live</option>
                  <option value="other">Other</option>
                </select>
              </Field>
              <Field label="Meeting URL"><input value={form.meeting_url} onChange={(e) => setForm({ ...form, meeting_url: e.target.value })} className={inputCls} /></Field>
              <Field label="Starts at"><input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} className={inputCls} /></Field>
              <Field label="Ends at"><input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} className={inputCls} /></Field>
            </div>
            <label className="flex items-center gap-2 text-xs font-bold">
              <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
              Visible to enrolled students
            </label>
            <button disabled={saving} className="w-full rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white disabled:opacity-60">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800';

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="text-[11px] font-black uppercase text-slate-500">{label}</label>
    <div className="mt-1">{children}</div>
  </div>
);
