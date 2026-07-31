import React, { useState } from 'react';
import { BookOpen, Plus, Pencil, Trash2, RefreshCw, AlertTriangle, X } from 'lucide-react';
import { coursesApi, type CloudCourse } from '../../services/cloudDb';
import { useCloudQuery } from '../../hooks/useCloudQuery';
import { useFeedback } from '../common/Feedback';
import { useAuth } from '../../context/AuthContext';

const empty = {
  code: '',
  title: '',
  description: '',
  thumbnail_url: '',
  instructor_name: '',
  category: '',
  language: 'Hindi',
  level: 'Beginner',
  duration_months: 6,
  official_fee: 0,
  registration_fee: 0,
  tax_percent: 0,
  is_published: false,
};

type Draft = typeof empty;

const toDraft = (c: CloudCourse): Draft => ({
  code: c.code ?? '',
  title: c.title,
  description: c.description ?? '',
  thumbnail_url: c.thumbnail_url ?? '',
  instructor_name: (c as unknown as { instructor_name: string | null }).instructor_name ?? '',
  category: (c as unknown as { category: string | null }).category ?? '',
  language: (c as unknown as { language: string }).language ?? 'Hindi',
  level: (c as unknown as { level: string }).level ?? 'Beginner',
  duration_months: c.duration_months,
  official_fee: Number(c.official_fee),
  registration_fee: Number(c.registration_fee),
  tax_percent: Number(c.tax_percent),
  is_published: c.is_published,
});

const field = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900';
const label = 'mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500';

export const CloudCourseManager: React.FC = () => {
  const { currentRole } = useAuth();
  const { notify, confirm } = useFeedback();
  const canWrite = currentRole === 'super_admin' || currentRole === 'admin';
  const { data, loading, error, reload } = useCloudQuery(() => coursesApi.list());

  const [editing, setEditing] = useState<CloudCourse | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const openNew = () => { setEditing(null); setDraft({ ...empty }); };
  const openEdit = (c: CloudCourse) => { setEditing(c); setDraft(toDraft(c)); };
  const close = () => { setEditing(null); setDraft(null); };

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    if (!draft.title.trim()) { notify('warning', 'Title required'); return; }
    setSaving(true);
    try {
      const payload = { ...draft, code: draft.code.trim() || null, description: draft.description || null };
      if (editing) {
        await coursesApi.update(editing.id, payload as never);
        notify('success', 'Course updated', 'Changes are live in the database.');
      } else {
        await coursesApi.create(payload as never);
        notify('success', 'Course created');
      }
      close();
      await reload();
    } catch (err) {
      notify('error', 'Save failed', err instanceof Error ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: CloudCourse) => {
    try {
      const dep = await coursesApi.dependencies(c.id);
      const linked = dep.enrollments + dep.lectures + dep.materials + dep.assignments + dep.liveClasses;
      const res = await confirm({
        title: `Delete "${c.title}"?`,
        message: linked
          ? `This course has ${dep.enrollments} enrolled students, ${dep.lectures} lectures, ${dep.materials} materials, ${dep.assignments} assignments and ${dep.liveClasses} live classes. Deleting removes it permanently from the database.`
          : 'This permanently removes the course from the database.',
        confirmLabel: 'Delete course',
        tone: 'danger',
      });
      if (!res.ok) return;
      await coursesApi.remove(c.id);
      notify('success', 'Course deleted');
      await reload();
    } catch (err) {
      notify('error', 'Delete failed', err instanceof Error ? err.message : undefined);
    }
  };

  const courses = data ?? [];

  return (
    <div className="space-y-5 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-black text-slate-900 dark:text-white">
            <BookOpen className="h-5 w-5 text-blue-600" /> Courses (Database)
          </h1>
          <p className="text-xs text-slate-500">Every field below is stored in and read from the database.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => void reload()} className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold dark:border-slate-700">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          {canWrite && (
            <button onClick={openNew} className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white">
              <Plus className="h-3.5 w-3.5" /> New Course
            </button>
          )}
        </div>
      </header>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {loading && !data ? (
        <p className="text-sm text-slate-500">Loading courses…</p>
      ) : courses.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
          No courses yet. Create the first one — it saves straight to the database.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((c) => (
            <article key={c.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              {c.thumbnail_url ? (
                <img src={c.thumbnail_url} alt={`${c.title} thumbnail`} className="h-32 w-full object-cover" loading="lazy" />
              ) : (
                <div className="flex h-32 w-full items-center justify-center bg-slate-100 text-slate-400 dark:bg-slate-800">
                  <BookOpen className="h-7 w-7" />
                </div>
              )}
              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">{c.title}</h2>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${c.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                    {c.is_published ? 'PUBLISHED' : 'DRAFT'}
                  </span>
                </div>
                <p className="line-clamp-2 text-xs text-slate-500">{c.description || 'No description yet.'}</p>
                <dl className="grid grid-cols-2 gap-1 text-[11px] text-slate-500">
                  <div>Fee: <span className="font-bold text-slate-800 dark:text-slate-200">₹{Number(c.official_fee).toLocaleString('en-IN')}</span></div>
                  <div>Duration: {c.duration_months} mo</div>
                  <div className="truncate">Instructor: {(c as unknown as { instructor_name?: string }).instructor_name || '—'}</div>
                  <div className="truncate">Category: {(c as unknown as { category?: string }).category || '—'}</div>
                </dl>
                {canWrite && (
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => openEdit(c)} className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-300 py-1.5 text-[11px] font-bold dark:border-slate-700">
                      <Pencil className="h-3 w-3" /> Edit
                    </button>
                    <button onClick={() => void remove(c)} className="flex items-center justify-center gap-1 rounded-lg border border-rose-300 px-3 py-1.5 text-[11px] font-bold text-rose-600 dark:border-rose-900">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {draft && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm">
          <form onSubmit={save} className="my-8 w-full max-w-2xl space-y-4 rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black">{editing ? 'Edit course' : 'New course'}</h2>
              <button type="button" onClick={close} aria-label="Close"><X className="h-4 w-4" /></button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={label} htmlFor="c-title">Title</label>
                <input id="c-title" className={field} value={draft.title} onChange={(e) => set('title', e.target.value)} maxLength={160} required />
              </div>
              <div className="sm:col-span-2">
                <label className={label} htmlFor="c-desc">Description</label>
                <textarea id="c-desc" className={field} rows={3} value={draft.description} onChange={(e) => set('description', e.target.value)} maxLength={2000} />
              </div>
              <div className="sm:col-span-2">
                <label className={label} htmlFor="c-thumb">Thumbnail URL</label>
                <input id="c-thumb" className={field} value={draft.thumbnail_url} onChange={(e) => set('thumbnail_url', e.target.value)} placeholder="https://…" />
              </div>
              <div><label className={label} htmlFor="c-code">Course code</label><input id="c-code" className={field} value={draft.code} onChange={(e) => set('code', e.target.value)} /></div>
              <div><label className={label} htmlFor="c-inst">Instructor</label><input id="c-inst" className={field} value={draft.instructor_name} onChange={(e) => set('instructor_name', e.target.value)} /></div>
              <div><label className={label} htmlFor="c-cat">Category</label><input id="c-cat" className={field} value={draft.category} onChange={(e) => set('category', e.target.value)} /></div>
              <div><label className={label} htmlFor="c-lang">Language</label><input id="c-lang" className={field} value={draft.language} onChange={(e) => set('language', e.target.value)} /></div>
              <div>
                <label className={label} htmlFor="c-level">Level</label>
                <select id="c-level" className={field} value={draft.level} onChange={(e) => set('level', e.target.value)}>
                  <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                </select>
              </div>
              <div><label className={label} htmlFor="c-dur">Duration (months)</label><input id="c-dur" type="number" min={0} className={field} value={draft.duration_months} onChange={(e) => set('duration_months', Number(e.target.value))} /></div>
              <div><label className={label} htmlFor="c-fee">Course fee (₹)</label><input id="c-fee" type="number" min={0} className={field} value={draft.official_fee} onChange={(e) => set('official_fee', Number(e.target.value))} /></div>
              <div><label className={label} htmlFor="c-reg">Registration fee (₹)</label><input id="c-reg" type="number" min={0} className={field} value={draft.registration_fee} onChange={(e) => set('registration_fee', Number(e.target.value))} /></div>
              <div><label className={label} htmlFor="c-tax">Tax (%)</label><input id="c-tax" type="number" min={0} max={100} className={field} value={draft.tax_percent} onChange={(e) => set('tax_percent', Number(e.target.value))} /></div>
              <label className="flex items-center gap-2 self-end text-xs font-bold">
                <input type="checkbox" checked={draft.is_published} onChange={(e) => set('is_published', e.target.checked)} /> Published
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={close} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold dark:border-slate-700">Cancel</button>
              <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-60">
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Create course'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
