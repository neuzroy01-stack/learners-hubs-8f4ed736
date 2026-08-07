import { formatAppDateTime, toAppInput, appInputToIso } from '../../lib/datetime';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Radio,
  Video,
  FileText,
  ClipboardList,
  Plus,
  Trash2,
  Pencil,
  Loader2,
  RefreshCw,
  X,
  Database
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../common/Feedback';
import {
  coursesApi,
  liveClassesApi,
  lecturesApi,
  materialsApi,
  assignmentsApi,
  type CloudCourse,
  type CloudLiveClass,
  type CloudLecture,
  type CloudMaterial,
  type CloudAssignment
} from '../../services/cloudDb';

type TabKey = 'live' | 'lectures' | 'materials' | 'assignments';

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'live', label: 'Live Classes', icon: Radio },
  { key: 'lectures', label: 'Recorded Lectures', icon: Video },
  { key: 'materials', label: 'Study Materials (PDF)', icon: FileText },
  { key: 'assignments', label: 'Assignments', icon: ClipboardList }
];

const inputCls =
  'w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500';
const labelCls = 'block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1';

const toLocalInput = (iso?: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16) : '');

export const CourseContentManager: React.FC = () => {
  const { currentRole } = useAuth();
  const { notify, confirm } = useFeedback();

  const canManage = currentRole === 'super_admin' || currentRole === 'admin' || currentRole === 'teacher';

  const [courses, setCourses] = useState<CloudCourse[]>([]);
  const [courseId, setCourseId] = useState<string>('');
  const [tab, setTab] = useState<TabKey>('live');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [live, setLive] = useState<CloudLiveClass[]>([]);
  const [lectures, setLectures] = useState<CloudLecture[]>([]);
  const [materials, setMaterials] = useState<CloudMaterial[]>([]);
  const [assignments, setAssignments] = useState<CloudAssignment[]>([]);

  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);

  const selectedCourse = useMemo(() => courses.find((c) => c.id === courseId) || null, [courses, courseId]);

  const loadCourses = useCallback(async () => {
    try {
      const rows = await coursesApi.list();
      setCourses(rows);
      setCourseId((prev) => prev || rows[0]?.id || '');
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadContent = useCallback(async (id: string) => {
    if (!id) {
      setLive([]); setLectures([]); setMaterials([]); setAssignments([]);
      return;
    }
    setBusy(true);
    try {
      const [l, r, m, a] = await Promise.all([
        liveClassesApi.listByCourse(id),
        lecturesApi.listByCourse(id),
        materialsApi.listByCourse(id),
        assignmentsApi.listByCourse(id)
      ]);
      setLive(l); setLectures(r); setMaterials(m); setAssignments(a);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load course content');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => { void loadCourses(); }, [loadCourses]);
  useEffect(() => { void loadContent(courseId); }, [courseId, loadContent]);

  const handleDelete = async (kind: TabKey, id: string, label: string) => {
    const res = await confirm({
      title: `Delete "${label}"?`,
      message: 'This permanently removes the record from the database for this course only.',
      confirmLabel: 'Delete',
      tone: 'danger'
    });
    if (!res.ok) return;
    try {
      if (kind === 'live') await liveClassesApi.remove(id);
      if (kind === 'lectures') await lecturesApi.remove(id);
      if (kind === 'materials') await materialsApi.remove(id);
      if (kind === 'assignments') await assignmentsApi.remove(id);
      notify('success', 'Deleted', `${label} was removed.`);
      await loadContent(courseId);
    } catch (e) {
      notify('error', 'Delete failed', e instanceof Error ? e.message : undefined);
    }
  };

  const handleSave = async (form: Record<string, unknown>) => {
    if (!courseId) return;
    const id = form.id as string | undefined;
    try {
      const payload = { ...form, course_id: courseId };
      delete (payload as Record<string, unknown>).id;

      if (tab === 'live') {
        id ? await liveClassesApi.update(id, payload as never) : await liveClassesApi.create(payload as never);
      } else if (tab === 'lectures') {
        id ? await lecturesApi.update(id, payload as never) : await lecturesApi.create(payload as never);
      } else if (tab === 'materials') {
        id ? await materialsApi.update(id, payload as never) : await materialsApi.create(payload as never);
      } else {
        id ? await assignmentsApi.update(id, payload as never) : await assignmentsApi.create(payload as never);
      }
      notify('success', id ? 'Changes saved' : 'Created', 'Stored permanently in the database.');
      setEditing(null);
      await loadContent(courseId);
    } catch (e) {
      notify('error', 'Save failed', e instanceof Error ? e.message : undefined);
    }
  };

  if (!canManage) {
    return (
      <div className="p-6 text-sm text-slate-500">You do not have permission to manage course content.</div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-600" />
            Course Content Manager
          </h1>
          <p className="text-sm text-slate-500">
            Every course keeps its own live classes, lectures, PDFs and assignments — stored in the database.
          </p>
        </div>
        <button
          onClick={() => { void loadCourses(); void loadContent(courseId); }}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </header>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-900 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <label className={labelCls}>Select Course</label>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading courses…</div>
        ) : courses.length === 0 ? (
          <p className="text-sm text-slate-500">
            No courses in the database yet. Create one in <strong>Courses &amp; Syllabus</strong> first.
          </p>
        ) : (
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className={inputCls}>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}{c.code ? ` (${c.code})` : ''}</option>
            ))}
          </select>
        )}
        {selectedCourse && (
          <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            Content below belongs only to <strong className="text-slate-700 dark:text-slate-200">{selectedCourse.title}</strong>.
          </p>
        )}
      </div>

      {courseId && (
        <>
          <div className="flex flex-wrap gap-2">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  tab === key
                    ? 'bg-blue-600 text-white'
                    : 'border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {TABS.find((t) => t.key === tab)?.label}
              </h2>
              <button
                onClick={() => setEditing({})}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>

            {busy ? (
              <div className="flex items-center gap-2 p-6 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {tab === 'live' && live.map((row) => (
                  <Row
                    key={row.id}
                    title={row.title}
                    subtitle={`${formatAppDateTime(row.starts_at)} · ${row.platform}`}
                    meta={row.meeting_url || undefined}
                    onEdit={() => setEditing(row as unknown as Record<string, unknown>)}
                    onDelete={() => handleDelete('live', row.id, row.title)}
                  />
                ))}
                {tab === 'lectures' && lectures.map((row) => (
                  <Row
                    key={row.id}
                    title={row.title}
                    subtitle={`${row.week_number ? `Week ${row.week_number} · ` : ''}${row.duration_minutes ?? 0} min · ${row.is_published ? 'Published' : 'Draft'}`}
                    meta={row.video_url}
                    onEdit={() => setEditing(row as unknown as Record<string, unknown>)}
                    onDelete={() => handleDelete('lectures', row.id, row.title)}
                  />
                ))}
                {tab === 'materials' && materials.map((row) => (
                  <Row
                    key={row.id}
                    title={row.title}
                    subtitle={`${row.file_type.toUpperCase()}${row.week_number ? ` · Week ${row.week_number}` : ''}`}
                    meta={row.file_url}
                    onEdit={() => setEditing(row as unknown as Record<string, unknown>)}
                    onDelete={() => handleDelete('materials', row.id, row.title)}
                  />
                ))}
                {tab === 'assignments' && assignments.map((row) => (
                  <Row
                    key={row.id}
                    title={row.title}
                    subtitle={`Max ${row.max_marks} marks${row.due_at ? ` · Due ${new Date(row.due_at).toLocaleDateString()}` : ''}`}
                    onEdit={() => setEditing(row as unknown as Record<string, unknown>)}
                    onDelete={() => handleDelete('assignments', row.id, row.title)}
                  />
                ))}
                {((tab === 'live' && live.length === 0) ||
                  (tab === 'lectures' && lectures.length === 0) ||
                  (tab === 'materials' && materials.length === 0) ||
                  (tab === 'assignments' && assignments.length === 0)) && (
                  <li className="p-6 text-sm text-slate-500">Nothing added for this course yet.</li>
                )}
              </ul>
            )}
          </div>
        </>
      )}

      {editing && (
        <EditorModal
          tab={tab}
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

const Row: React.FC<{
  title: string;
  subtitle: string;
  meta?: string;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ title, subtitle, meta, onEdit, onDelete }) => (
  <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</p>
      <p className="text-xs text-slate-500">{subtitle}</p>
      {meta && <p className="truncate text-xs text-blue-600">{meta}</p>}
    </div>
    <div className="flex shrink-0 gap-2">
      <button onClick={onEdit} className="rounded-lg border border-slate-300 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300" aria-label="Edit">
        <Pencil className="w-4 h-4" />
      </button>
      <button onClick={onDelete} className="rounded-lg border border-rose-200 dark:border-rose-900 p-2 text-rose-600" aria-label="Delete">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  </li>
);

const EditorModal: React.FC<{
  tab: TabKey;
  initial: Record<string, unknown>;
  onClose: () => void;
  onSave: (form: Record<string, unknown>) => void;
}> = ({ tab, initial, onClose, onSave }) => {
  const [form, setForm] = useState<Record<string, unknown>>(initial);
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));
  const str = (k: string) => (form[k] as string) ?? '';
  const num = (k: string) => (form[k] as number | null) ?? '';

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const out: Record<string, unknown> = { ...form };
    delete out.created_at;
    delete out.updated_at;
    delete out.course_id;
    onSave(out);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form onSubmit={submit} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white dark:bg-slate-900 p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {form.id ? 'Edit' : 'Add'} {TABS.find((t) => t.key === tab)?.label}
          </h3>
          <button type="button" onClick={onClose} aria-label="Close" className="text-slate-400"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className={labelCls}>Title</label>
            <input required className={inputCls} value={str('title')} onChange={(e) => set('title', e.target.value)} />
          </div>

          {tab === 'live' && (
            <>
              <div>
                <label className={labelCls}>Platform</label>
                <select className={inputCls} value={str('platform') || 'zoom'} onChange={(e) => set('platform', e.target.value)}>
                  <option value="zoom">Zoom</option>
                  <option value="google_meet">Google Meet</option>
                  <option value="youtube_live">YouTube Live</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Meeting URL</label>
                <input className={inputCls} value={str('meeting_url')} onChange={(e) => set('meeting_url', e.target.value)} />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Starts at</label>
                  <input required type="datetime-local" className={inputCls} step={60} value={toAppInput(str('starts_at'))} onChange={(e) => set('starts_at', appInputToIso(e.target.value))} />
                </div>
                <div>
                  <label className={labelCls}>Ends at</label>
                  <input type="datetime-local" className={inputCls} value={toLocalInput(str('ends_at'))} onChange={(e) => set('ends_at', e.target.value ? new Date(e.target.value).toISOString() : null)} />
                </div>
              </div>
            </>
          )}

          {tab === 'lectures' && (
            <>
              <div>
                <label className={labelCls}>Video URL (YouTube / recorded)</label>
                <input required className={inputCls} value={str('video_url')} onChange={(e) => set('video_url', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Thumbnail URL</label>
                <input className={inputCls} value={str('thumbnail_url')} onChange={(e) => set('thumbnail_url', e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Week</label>
                  <input type="number" className={inputCls} value={num('week_number')} onChange={(e) => set('week_number', e.target.value ? Number(e.target.value) : null)} />
                </div>
                <div>
                  <label className={labelCls}>Minutes</label>
                  <input type="number" className={inputCls} value={num('duration_minutes')} onChange={(e) => set('duration_minutes', e.target.value ? Number(e.target.value) : null)} />
                </div>
                <div>
                  <label className={labelCls}>Order</label>
                  <input type="number" className={inputCls} value={num('sort_order')} onChange={(e) => set('sort_order', Number(e.target.value || 0))} />
                </div>
              </div>
            </>
          )}

          {tab === 'materials' && (
            <>
              <div>
                <label className={labelCls}>File URL</label>
                <input required className={inputCls} value={str('file_url')} onChange={(e) => set('file_url', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>File type</label>
                  <select className={inputCls} value={str('file_type') || 'pdf'} onChange={(e) => set('file_type', e.target.value)}>
                    <option value="pdf">PDF</option>
                    <option value="zip">ZIP</option>
                    <option value="doc">DOC</option>
                    <option value="link">Link</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Week</label>
                  <input type="number" className={inputCls} value={num('week_number')} onChange={(e) => set('week_number', e.target.value ? Number(e.target.value) : null)} />
                </div>
              </div>
            </>
          )}

          {tab === 'assignments' && (
            <>
              <div>
                <label className={labelCls}>Instructions</label>
                <textarea rows={4} className={inputCls} value={str('instructions')} onChange={(e) => set('instructions', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Max marks</label>
                  <input type="number" className={inputCls} value={num('max_marks') || 100} onChange={(e) => set('max_marks', Number(e.target.value || 0))} />
                </div>
                <div>
                  <label className={labelCls}>Due date</label>
                  <input type="datetime-local" className={inputCls} value={toLocalInput(str('due_at'))} onChange={(e) => set('due_at', e.target.value ? new Date(e.target.value).toISOString() : null)} />
                </div>
              </div>
            </>
          )}

          {tab !== 'live' && (
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={form.is_published !== false}
                onChange={(e) => set('is_published', e.target.checked)}
              />
              Published (visible to enrolled students)
            </label>
          )}

          {tab !== 'assignments' && (
            <div>
              <label className={labelCls}>Description</label>
              <textarea rows={2} className={inputCls} value={str('description')} onChange={(e) => set('description', e.target.value)} />
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm">Cancel</button>
          <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">Save</button>
        </div>
      </form>
    </div>
  );
};

export default CourseContentManager;
