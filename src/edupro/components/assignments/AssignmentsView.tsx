import React, { useMemo, useState } from 'react';
import { ClipboardList, Plus, Pencil, Trash2, RefreshCw, X, Upload, CheckCircle2 } from 'lucide-react';
import {
  assignmentsApi,
  submissionsApi,
  courseRoster,
  type CloudAssignment,
  type CloudSubmission,
} from '../../services/cloudDb';
import { useCloudQuery } from '../../hooks/useCloudQuery';
import { useCourseScope } from '../../hooks/useCourseScope';
import { useFeedback } from '../common/Feedback';
import { useAuth } from '../../context/AuthContext';

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800';

interface FormState {
  id?: string;
  title: string;
  instructions: string;
  attachment_url: string;
  max_marks: string;
  due_at: string;
  is_published: boolean;
}

const emptyForm = (): FormState => ({
  title: '',
  instructions: '',
  attachment_url: '',
  max_marks: '100',
  due_at: '',
  is_published: true,
});

/** Assignments — database only, isolated to the selected course. */
export const AssignmentsView: React.FC = () => {
  const { currentUser } = useAuth();
  const { notify, confirm } = useFeedback();
  const { courses, canManage, loading: coursesLoading } = useCourseScope();

  const [courseId, setCourseId] = useState('');
  const activeCourseId = courseId || courses[0]?.id || '';
  const uid = currentUser?.id ?? '';

  const { data, loading, error, reload } = useCloudQuery(
    async () => (activeCourseId ? (assignmentsApi.listByCourse(activeCourseId) as Promise<CloudAssignment[]>) : []),
    [activeCourseId],
  );
  const assignments = useMemo(() => (data ?? []) as CloudAssignment[], [data]);

  const mySubs = useCloudQuery(async () => (uid ? submissionsApi.listByStudent(uid) : []), [uid]);
  const subByAssignment = useMemo(() => {
    const map = new Map<string, CloudSubmission>();
    (mySubs.data ?? []).forEach((s) => map.set(s.assignment_id, s));
    return map;
  }, [mySubs.data]);

  const visible = canManage ? assignments : assignments.filter((a) => a.is_published);

  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [gradingFor, setGradingFor] = useState<CloudAssignment | null>(null);
  const [submitFor, setSubmitFor] = useState<CloudAssignment | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !activeCourseId) return;
    if (!form.title.trim()) return notify('error', 'Title is required');
    setSaving(true);
    try {
      const payload = {
        course_id: activeCourseId,
        title: form.title.trim(),
        instructions: form.instructions.trim() || null,
        attachment_url: form.attachment_url.trim() || null,
        max_marks: Number(form.max_marks) || 0,
        due_at: form.due_at ? new Date(form.due_at).toISOString() : null,
        is_published: form.is_published,
        created_by: uid || null,
      };
      if (form.id) await assignmentsApi.update(form.id, payload);
      else await assignmentsApi.create(payload);
      notify('success', form.id ? 'Assignment updated' : 'Assignment created');
      setForm(null);
      await reload();
    } catch (err) {
      notify('error', 'Could not save', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: CloudAssignment) => {
    const res = await confirm({ title: 'Delete assignment?', message: `"${row.title}" and its submissions will be removed.`, tone: 'danger', confirmLabel: 'Delete' });
    if (!res.ok) return;
    try {
      await assignmentsApi.remove(row.id);
      notify('success', 'Assignment deleted');
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
            <ClipboardList className="h-6 w-6 text-indigo-600" /> Assignments
          </h2>
          <p className="mt-1 text-xs text-slate-500">Only assignments created in this course appear here.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => void reload()} className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold dark:border-slate-700">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {canManage && activeCourseId && (
            <button onClick={() => setForm(emptyForm())} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700">
              <Plus className="h-4 w-4" /> New Assignment
            </button>
          )}
        </div>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <label className="text-[11px] font-black uppercase text-slate-500">Course</label>
        <select value={activeCourseId} onChange={(e) => setCourseId(e.target.value)} className={`${inputCls} mt-1`}>
          {courses.length === 0 && <option value="">{coursesLoading ? 'Loading…' : 'No courses available'}</option>}
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      {error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {visible.map((row) => {
          const sub = subByAssignment.get(row.id);
          return (
            <article key={row.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">{row.title}</h3>
                <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {row.max_marks} marks
                </span>
              </div>
              {row.instructions && <p className="mt-2 text-xs text-slate-500">{row.instructions}</p>}
              <p className="mt-2 text-[11px] text-slate-500">
                Due: {row.due_at ? new Date(row.due_at).toLocaleString('en-IN') : 'No deadline'}
              </p>
              {sub && (
                <p className="mt-1 flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {sub.status === 'graded' ? `Graded: ${sub.marks_obtained ?? 0}/${row.max_marks}` : 'Submitted'}
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {row.attachment_url && (
                  <a href={row.attachment_url} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-300 px-3 py-2 text-[11px] font-bold dark:border-slate-700">
                    Attachment
                  </a>
                )}
                {!canManage && (
                  <button onClick={() => setSubmitFor(row)} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-[11px] font-bold text-white">
                    <Upload className="h-3.5 w-3.5" /> {sub ? 'Update submission' : 'Submit'}
                  </button>
                )}
                {canManage && (
                  <>
                    <button onClick={() => setGradingFor(row)} className="rounded-xl border border-slate-300 px-3 py-2 text-[11px] font-bold dark:border-slate-700">Submissions</button>
                    <button
                      onClick={() =>
                        setForm({
                          id: row.id,
                          title: row.title,
                          instructions: row.instructions ?? '',
                          attachment_url: row.attachment_url ?? '',
                          max_marks: String(row.max_marks),
                          due_at: row.due_at ? new Date(row.due_at).toISOString().slice(0, 16) : '',
                          is_published: row.is_published,
                        })
                      }
                      className="flex items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-2 text-[11px] font-bold dark:border-slate-700"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button onClick={() => void remove(row)} className="flex items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-2 text-[11px] font-bold text-rose-600 dark:border-rose-900">
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </>
                )}
              </div>
            </article>
          );
        })}
        {!loading && visible.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 md:col-span-2">
            No assignments available for this course.
          </p>
        )}
      </div>

      {form && (
        <Modal title={form.id ? 'Edit assignment' : 'New assignment'} onClose={() => setForm(null)}>
          <form onSubmit={save} className="space-y-3">
            <Field label="Title"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} /></Field>
            <Field label="Instructions"><textarea rows={3} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} className={inputCls} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Max marks"><input value={form.max_marks} onChange={(e) => setForm({ ...form, max_marks: e.target.value })} className={inputCls} inputMode="numeric" /></Field>
              <Field label="Due date"><input type="datetime-local" value={form.due_at} onChange={(e) => setForm({ ...form, due_at: e.target.value })} className={inputCls} /></Field>
            </div>
            <Field label="Attachment URL"><input value={form.attachment_url} onChange={(e) => setForm({ ...form, attachment_url: e.target.value })} className={inputCls} /></Field>
            <label className="flex items-center gap-2 text-xs font-bold">
              <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
              Visible to enrolled students
            </label>
            <button disabled={saving} className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white disabled:opacity-60">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </form>
        </Modal>
      )}

      {submitFor && uid && (
        <SubmitDialog
          assignment={submitFor}
          studentId={uid}
          existing={subByAssignment.get(submitFor.id) ?? null}
          onClose={() => setSubmitFor(null)}
          onSaved={async () => { setSubmitFor(null); await mySubs.reload(); }}
        />
      )}

      {gradingFor && <GradingDialog assignment={gradingFor} onClose={() => setGradingFor(null)} />}
    </div>
  );
};

const SubmitDialog: React.FC<{
  assignment: CloudAssignment;
  studentId: string;
  existing: CloudSubmission | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}> = ({ assignment, studentId, existing, onClose, onSaved }) => {
  const { notify } = useFeedback();
  const [text, setText] = useState(existing?.submission_text ?? '');
  const [fileUrl, setFileUrl] = useState(existing?.file_url ?? '');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await submissionsApi.submit({
        assignment_id: assignment.id,
        student_id: studentId,
        submission_text: text.trim() || null,
        file_url: fileUrl.trim() || null,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      });
      notify('success', 'Submission saved');
      await onSaved();
    } catch (err) {
      notify('error', 'Could not submit', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={assignment.title} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Your answer"><textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} className={inputCls} /></Field>
        <Field label="File / link"><input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} className={inputCls} /></Field>
        <button disabled={saving} className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white disabled:opacity-60">
          {saving ? 'Saving…' : 'Submit'}
        </button>
      </form>
    </Modal>
  );
};

const GradingDialog: React.FC<{ assignment: CloudAssignment; onClose: () => void }> = ({ assignment, onClose }) => {
  const { notify } = useFeedback();
  const { data, loading, reload } = useCloudQuery(async () => {
    const [subs, roster] = await Promise.all([
      submissionsApi.listByAssignment(assignment.id),
      courseRoster(assignment.course_id),
    ]);
    const nameOf = new Map(roster.map((r) => [r.student_id, r.full_name]));
    return subs.map((s) => ({ ...s, student_name: nameOf.get(s.student_id) ?? s.student_id }));
  }, [assignment.id]);

  const grade = async (id: string, value: string) => {
    const marks = Number(value);
    if (!Number.isFinite(marks)) return;
    try {
      await submissionsApi.grade(id, marks);
      notify('success', 'Marks saved');
      await reload();
    } catch (err) {
      notify('error', 'Could not grade', (err as Error).message);
    }
  };

  return (
    <Modal title={`Submissions — ${assignment.title}`} onClose={onClose}>
      {loading && <p className="text-xs text-slate-500">Loading…</p>}
      <ul className="max-h-80 space-y-2 overflow-y-auto">
        {(data ?? []).map((s) => (
          <li key={s.id} className="rounded-xl border border-slate-200 p-3 text-xs dark:border-slate-800">
            <p className="font-bold">{s.student_name}</p>
            {s.submission_text && <p className="mt-1 text-slate-500">{s.submission_text}</p>}
            {s.file_url && <a href={s.file_url} target="_blank" rel="noreferrer" className="text-indigo-600">Open file</a>}
            <div className="mt-2 flex items-center gap-2">
              <input
                defaultValue={s.marks_obtained ?? ''}
                onBlur={(e) => void grade(s.id, e.target.value)}
                placeholder={`/ ${assignment.max_marks}`}
                className="w-24 rounded-lg border border-slate-200 px-2 py-1 dark:border-slate-700 dark:bg-slate-800"
              />
              <span className="uppercase text-slate-400">{s.status}</span>
            </div>
          </li>
        ))}
        {!loading && (data ?? []).length === 0 && <li className="p-6 text-center text-xs text-slate-500">No submissions yet.</li>}
      </ul>
    </Modal>
  );
};

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
    <div className="w-full max-w-lg rounded-2xl bg-white p-6 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-black">{title}</h3>
        <button onClick={onClose}><X className="h-4 w-4" /></button>
      </div>
      {children}
    </div>
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="text-[11px] font-black uppercase text-slate-500">{label}</label>
    <div className="mt-1">{children}</div>
  </div>
);
