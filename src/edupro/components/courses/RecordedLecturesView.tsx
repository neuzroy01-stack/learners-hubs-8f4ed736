import React, { useEffect, useMemo, useState } from 'react';
import { Video, Plus, Pencil, Trash2, RefreshCw, X, ExternalLink, TriangleAlert as AlertTriangle } from 'lucide-react';
import { lecturesApi, type CloudLecture } from '../../services/cloudDb';
import { useCloudQuery } from '../../hooks/useCloudQuery';
import { useCourseScope } from '../../hooks/useCourseScope';
import { useFeedback } from '../common/Feedback';
import { resolveVideoSource, isPlayableVideoUrl } from '../../lib/videoUrl';

/** Kept for backwards compatibility with older imports. */
export function toYouTubeEmbedUrl(rawUrl: string): string | null {
  const s = resolveVideoSource(rawUrl);
  return s?.kind === 'youtube' ? s.src : null;
}

export function toYouTubeWatchUrl(rawUrl: string): string | null {
  const s = resolveVideoSource(rawUrl);
  return s?.kind === 'youtube' ? s.externalUrl : null;
}

interface FormState {
  id?: string;
  title: string;
  description: string;
  video_url: string;
  week_number: number;
  duration_minutes: string;
  is_published: boolean;
}

const emptyForm = (week: number): FormState => ({
  title: '',
  description: '',
  video_url: '',
  week_number: week,
  duration_minutes: '',
  is_published: true,
});

/** Week-wise recorded lecture archive, managed entirely from the database. */
export const RecordedLecturesView: React.FC = () => {
  const { notify, confirm } = useFeedback();
  const { courses, canManage, loading: coursesLoading } = useCourseScope();

  const [courseId, setCourseId] = useState('');
  const activeCourseId = courseId || courses[0]?.id || '';

  const { data, loading, error, reload } = useCloudQuery(
    async () => (activeCourseId ? lecturesApi.listByCourse(activeCourseId) : []),
    [activeCourseId],
  );
  const lectures = useMemo(() => (data ?? []) as CloudLecture[], [data]);

  const weeks = useMemo(() => {
    const set = new Set<number>(lectures.map((l) => l.week_number ?? 1));
    return [...set].sort((a, b) => a - b);
  }, [lectures]);

  const [week, setWeek] = useState(1);
  useEffect(() => {
    if (weeks.length && !weeks.includes(week)) setWeek(weeks[0]);
  }, [weeks, week]);

  const weekLectures = useMemo(
    () => lectures.filter((l) => (l.week_number ?? 1) === week),
    [lectures, week],
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = weekLectures.find((l) => l.id === selectedId) ?? weekLectures[0] ?? null;
  const embedUrl = selected ? toYouTubeEmbedUrl(selected.video_url) : null;
  const watchUrl = selected ? toYouTubeWatchUrl(selected.video_url) : null;

  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);

  const openEdit = (row: CloudLecture) =>
    setForm({
      id: row.id,
      title: row.title,
      description: row.description ?? '',
      video_url: row.video_url,
      week_number: row.week_number ?? 1,
      duration_minutes: row.duration_minutes ? String(row.duration_minutes) : '',
      is_published: row.is_published,
    });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !activeCourseId) return;
    if (!form.title.trim()) return notify('error', 'Title is required');
    if (!toYouTubeEmbedUrl(form.video_url)) {
      return notify('error', 'Enter a valid YouTube link', 'Watch, youtu.be, live and shorts links all work.');
    }
    setSaving(true);
    try {
      const payload = {
        course_id: activeCourseId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        video_url: form.video_url.trim(),
        week_number: form.week_number,
        duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
        is_published: form.is_published,
        sort_order: form.week_number * 100,
      };
      if (form.id) await lecturesApi.update(form.id, payload);
      else await lecturesApi.create(payload);
      notify('success', form.id ? 'Lecture updated' : 'Lecture added');
      setWeek(form.week_number);
      setForm(null);
      await reload();
    } catch (err) {
      notify('error', 'Could not save', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: CloudLecture) => {
    const res = await confirm({ title: 'Delete lecture?', message: `"${row.title}" will be removed.`, tone: 'danger', confirmLabel: 'Delete' });
    if (!res.ok) return;
    try {
      await lecturesApi.remove(row.id);
      notify('success', 'Lecture deleted');
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
            <Video className="h-6 w-6 text-indigo-600" /> Recorded Lectures
          </h2>
          <p className="mt-1 text-xs text-slate-500">Week-wise archive per course, saved in the database.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => void reload()} className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold dark:border-slate-700">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {canManage && activeCourseId && (
            <button onClick={() => setForm(emptyForm(week || 1))} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700">
              <Plus className="h-4 w-4" /> Add Lecture
            </button>
          )}
        </div>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <label className="text-[11px] font-black uppercase text-slate-500">Course</label>
        <select
          value={activeCourseId}
          onChange={(e) => { setCourseId(e.target.value); setSelectedId(null); }}
          className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
        >
          {courses.length === 0 && <option value="">{coursesLoading ? 'Loading…' : 'No courses available'}</option>}
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      {error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      {weeks.length > 0 && (
        <div className="scrollbar-none flex gap-2 overflow-x-auto pb-2">
          {weeks.map((wk) => (
            <button
              key={wk}
              onClick={() => { setWeek(wk); setSelectedId(null); }}
              className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold ${week === wk ? 'bg-indigo-600 text-white shadow-md' : 'border border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'}`}
            >
              Week {wk}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {selected ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="relative aspect-video bg-black">
                {embedUrl ? (
                  <iframe
                    key={embedUrl}
                    src={embedUrl}
                    title={selected.title}
                    className="h-full w-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white">
                    <AlertTriangle className="h-10 w-10 text-amber-500" />
                    <p className="text-xs text-slate-300">This video link could not be recognised as a YouTube URL.</p>
                    {watchUrl && (
                      <a href={watchUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold">
                        <Youtube className="h-4 w-4" /> Open on YouTube
                      </a>
                    )}
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="text-base font-black text-slate-900 dark:text-white">{selected.title}</h3>
                {selected.description && <p className="mt-1 text-xs text-slate-500">{selected.description}</p>}
                {canManage && (
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => openEdit(selected)} className="flex items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-2 text-[11px] font-bold dark:border-slate-700">
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button onClick={() => void remove(selected)} className="flex items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-2 text-[11px] font-bold text-rose-600 dark:border-rose-900">
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700">
              {loading ? 'Loading lectures…' : 'No recorded lectures for this course yet.'}
            </p>
          )}
        </div>

        <aside className="space-y-2">
          {weekLectures.map((l) => (
            <button
              key={l.id}
              onClick={() => setSelectedId(l.id)}
              className={`w-full rounded-xl border p-3 text-left text-xs font-bold ${selected?.id === l.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'}`}
            >
              {l.title}
              <span className="mt-1 block text-[10px] font-medium text-slate-500">
                Week {l.week_number ?? 1}
                {l.duration_minutes ? ` • ${l.duration_minutes} min` : ''}
                {!l.is_published ? ' • Draft' : ''}
              </span>
            </button>
          ))}
        </aside>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4">
          <form onSubmit={save} className="w-full max-w-lg space-y-3 rounded-2xl bg-white p-6 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black">{form.id ? 'Edit lecture' : 'Add lecture'}</h3>
              <button type="button" onClick={() => setForm(null)}><X className="h-4 w-4" /></button>
            </div>
            <Field label="Title"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} /></Field>
            <Field label="YouTube URL"><input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="https://www.youtube.com/watch?v=…" className={inputCls} /></Field>
            <Field label="Description"><textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Week"><input type="number" min={1} value={form.week_number} onChange={(e) => setForm({ ...form, week_number: Math.max(1, Number(e.target.value) || 1) })} className={inputCls} /></Field>
              <Field label="Duration (min)"><input type="number" min={0} value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} className={inputCls} /></Field>
            </div>
            <label className="flex items-center gap-2 text-xs font-bold">
              <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
              Visible to enrolled students
            </label>
            <button disabled={saving} className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white disabled:opacity-60">
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
