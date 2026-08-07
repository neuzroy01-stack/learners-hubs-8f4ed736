import React, { useMemo, useState } from 'react';
import { FolderDown, FileText, Download, Eye, Plus, Search, Trash2, Pencil, RefreshCw, X } from 'lucide-react';
import { materialsApi, type CloudMaterial } from '../../services/cloudDb';
import { useCloudQuery } from '../../hooks/useCloudQuery';
import { useCourseScope } from '../../hooks/useCourseScope';
import { useFeedback } from '../common/Feedback';
import { RichText } from '../common/RichText';
import { MaterialViewerModal } from '../common/MaterialViewerModal';

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800';

interface FormState {
  id?: string;
  title: string;
  description: string;
  file_url: string;
  file_type: string;
  week_number: string;
  is_published: boolean;
}

const emptyForm = (): FormState => ({
  title: '',
  description: '',
  file_url: '',
  file_type: 'pdf',
  week_number: '',
  is_published: true,
});

/** Study materials / downloads — database only, isolated per course. */
export const FreeDownloadsView: React.FC = () => {
  const { notify, confirm } = useFeedback();
  const { courses, canManage, loading: coursesLoading } = useCourseScope();

  const [courseId, setCourseId] = useState('');
  const activeCourseId = courseId || courses[0]?.id || '';
  const [search, setSearch] = useState('');

  const { data, loading, error, reload } = useCloudQuery(
    async () => (activeCourseId ? (materialsApi.listByCourse(activeCourseId) as Promise<CloudMaterial[]>) : []),
    [activeCourseId],
  );

  const materials = useMemo(() => {
    const rows = ((data ?? []) as CloudMaterial[]).filter((m) => canManage || m.is_published);
    const q = search.trim().toLowerCase();
    return q ? rows.filter((m) => m.title.toLowerCase().includes(q)) : rows;
  }, [data, search, canManage]);

  const [viewing, setViewing] = useState<CloudMaterial | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !activeCourseId) return;
    if (!form.title.trim()) return notify('error', 'Title is required');
    if (!form.file_url.trim()) return notify('error', 'File URL is required');
    setSaving(true);
    try {
      const payload = {
        course_id: activeCourseId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        file_url: form.file_url.trim(),
        file_type: form.file_type,
        week_number: form.week_number ? Number(form.week_number) : null,
        is_published: form.is_published,
      };
      if (form.id) await materialsApi.update(form.id, payload);
      else await materialsApi.create(payload);
      notify('success', form.id ? 'Material updated' : 'Material uploaded');
      setForm(null);
      await reload();
    } catch (err) {
      notify('error', 'Could not save', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: CloudMaterial) => {
    const res = await confirm({ title: 'Delete material?', message: `"${row.title}" will be removed for this course.`, tone: 'danger', confirmLabel: 'Delete' });
    if (!res.ok) return;
    try {
      await materialsApi.remove(row.id);
      notify('success', 'Material deleted');
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
            <FolderDown className="h-6 w-6 text-blue-600" /> Study Materials & Downloads
          </h2>
          <p className="mt-1 text-xs text-slate-500">Only files uploaded for this course are shown.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => void reload()} className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold dark:border-slate-700">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {canManage && activeCourseId && (
            <button onClick={() => setForm(emptyForm())} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700">
              <Plus className="h-4 w-4" /> Upload Resource
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row">
        <div className="flex-1">
          <label className="text-[11px] font-black uppercase text-slate-500">Course</label>
          <select value={activeCourseId} onChange={(e) => setCourseId(e.target.value)} className={`${inputCls} mt-1`}>
            {courses.length === 0 && <option value="">{coursesLoading ? 'Loading…' : 'No courses available'}</option>}
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-[11px] font-black uppercase text-slate-500">Search</label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title…" className={`${inputCls} pl-9`} />
          </div>
        </div>
      </div>

      {error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {materials.map((mat) => (
          <div key={mat.id} className="flex flex-col justify-between space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="rounded-xl border border-blue-200 bg-blue-50 p-2 text-blue-600 dark:border-blue-800 dark:bg-blue-950/50">
                  <FileText className="h-5 w-5 text-rose-500" />
                </span>
                <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-slate-400 dark:bg-slate-800">
                  {mat.file_type}{mat.week_number ? ` · Week ${mat.week_number}` : ''}
                </span>
              </div>
              <h3 className="text-sm font-bold leading-snug text-slate-900 dark:text-white">{mat.title}</h3>
              <RichText text={mat.description} />
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
              <span className="text-[10px] text-slate-400">{new Date(mat.created_at).toLocaleDateString('en-IN')}</span>
              <div className="flex items-center gap-2">
                {canManage && (
                  <>
                    <button
                      onClick={() =>
                        setForm({
                          id: mat.id,
                          title: mat.title,
                          description: mat.description ?? '',
                          file_url: mat.file_url,
                          file_type: mat.file_type,
                          week_number: mat.week_number ? String(mat.week_number) : '',
                          is_published: mat.is_published,
                        })
                      }
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => void remove(mat)} className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setViewing(mat)}
                  className="flex items-center gap-1.5 rounded-xl border border-blue-200 px-3 py-1.5 font-bold text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950/40"
                >
                  <Eye className="h-3.5 w-3.5" /> View
                </button>
                <a href={mat.file_url} target="_blank" rel="noreferrer" download className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 font-bold text-white shadow-sm hover:bg-blue-700">
                  <Download className="h-3.5 w-3.5" /> Download
                </a>
              </div>
            </div>
          </div>
        ))}
        {!loading && materials.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 md:col-span-2 lg:col-span-3">
            No study materials available for this course.
          </p>
        )}
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <form onSubmit={save} className="w-full max-w-lg space-y-3 rounded-2xl bg-white p-6 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black">{form.id ? 'Edit material' : 'Upload material'}</h3>
              <button type="button" onClick={() => setForm(null)}><X className="h-4 w-4" /></button>
            </div>
            <Field label="Title"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} /></Field>
            <Field label="Description"><textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} /></Field>
            <Field label="File URL"><input value={form.file_url} onChange={(e) => setForm({ ...form, file_url: e.target.value })} className={inputCls} placeholder="https://…" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="File type">
                <select value={form.file_type} onChange={(e) => setForm({ ...form, file_type: e.target.value })} className={inputCls}>
                  <option value="pdf">PDF</option>
                  <option value="doc">Document</option>
                  <option value="zip">Zip / Code</option>
                  <option value="slides">Slides</option>
                  <option value="link">External link</option>
                </select>
              </Field>
              <Field label="Week number"><input value={form.week_number} onChange={(e) => setForm({ ...form, week_number: e.target.value })} className={inputCls} inputMode="numeric" /></Field>
            </div>
            <label className="flex items-center gap-2 text-xs font-bold">
              <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
              Visible to enrolled students
            </label>
            <button disabled={saving} className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white disabled:opacity-60">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="text-[11px] font-black uppercase text-slate-500">{label}</label>
    <div className="mt-1">{children}</div>
  </div>
);
