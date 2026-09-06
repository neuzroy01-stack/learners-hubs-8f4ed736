import React, { useMemo, useState } from 'react';
import { Bell, Plus, Search, Power, Trash2, Pencil, X } from 'lucide-react';
import { notificationsApi, coursesApi, type CloudNotification } from '../../services/cloudDb';
import { profilesApi, type CloudProfileRow } from '../../services/cloudProfiles';
import { useCloudQuery } from '../../hooks/useCloudQuery';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../common/Feedback';

type TargetType = 'student' | 'course';

const TYPES = ['general', 'announcement', 'assignment', 'live_class', 'payment', 'exam', 'important'];

const emptyForm = {
  title: '',
  body: '',
  type: 'general',
  target_type: 'course' as TargetType,
  course_id: '',
  student_id: '',
  start_at: '',
  expires_at: '',
  is_active: true,
};

export const NotificationManagerView: React.FC = () => {
  const { currentUser, currentRole } = useAuth();
  const feedback = useFeedback();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CloudNotification | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'course' | 'student'>('all');

  const { data: notifications, loading, reload } = useCloudQuery(() => notificationsApi.listAll(), []);
  const { data: courses } = useCloudQuery(() => coursesApi.list(), []);
  const { data: students } = useCloudQuery(() => profilesApi.list('student'), []);

  const rows = useMemo(() => {
    let list = notifications ?? [];
    if (filter === 'active') list = list.filter((n) => n.is_active);
    if (filter === 'inactive') list = list.filter((n) => !n.is_active);
    if (filter === 'course') list = list.filter((n) => n.target_type === 'course');
    if (filter === 'student') list = list.filter((n) => n.target_type === 'student');
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((n) => n.title.toLowerCase().includes(q) || (n.body ?? '').toLowerCase().includes(q));
    return list;
  }, [notifications, filter, search]);

  const courseName = (id: string | null) => (courses ?? []).find((c) => c.id === id)?.title ?? '—';
  const studentName = (id: string | null) =>
    (students as CloudProfileRow[] | null)?.find((s) => s.id === id)?.full_name ?? '—';

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setFormError(null);
    setShowForm(true);
  };

  const openEdit = (n: CloudNotification) => {
    setEditing(n);
    setFormError(null);
    setForm({
      title: n.title,
      body: n.body ?? '',
      type: n.type ?? 'general',
      target_type: (n.target_type === 'course' ? 'course' : 'student') as TargetType,
      course_id: n.course_id ?? '',
      student_id: n.student_id ?? '',
      start_at: n.start_at ? new Date(n.start_at).toISOString().slice(0, 16) : '',
      expires_at: n.expires_at ? new Date(n.expires_at).toISOString().slice(0, 16) : '',
      is_active: n.is_active,
    });
    setShowForm(true);
  };

  const submit = async () => {
    setFormError(null);
    if (!form.title.trim()) return setFormError('Title is required.');
    if (!form.body.trim()) return setFormError('Message is required.');
    if (form.target_type === 'course' && !form.course_id) return setFormError('Please select a course.');
    if (form.target_type === 'student' && !form.student_id) return setFormError('Please select a student.');
    const startAt = form.start_at ? new Date(form.start_at) : new Date();
    if (form.expires_at && new Date(form.expires_at) <= startAt) {
      return setFormError('Expiry must be after the start date.');
    }

    const payload = {
      title: form.title.trim(),
      body: form.body,
      type: form.type,
      target_type: form.target_type,
      course_id: form.target_type === 'course' ? form.course_id : null,
      student_id: form.target_type === 'student' ? form.student_id : null,
      user_id: form.target_type === 'student' ? form.student_id : null,
      start_at: startAt.toISOString(),
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      is_active: form.is_active,
      created_by: currentUser?.id ?? null,
      created_by_role: currentRole,
    };

    setBusy(true);
    try {
      if (editing) {
        await notificationsApi.update(editing.id, payload);
        feedback.success('Notification updated successfully.');
      } else {
        await notificationsApi.create(payload);
        feedback.success('Notification created successfully.');
      }
      setShowForm(false);
      await reload();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Notification could not be saved. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (n: CloudNotification) => {
    try {
      await notificationsApi.setActive(n.id, !n.is_active);
      feedback.success(n.is_active ? 'Notification deactivated.' : 'Notification activated.');
      await reload();
    } catch (e) {
      feedback.error(e instanceof Error ? e.message : 'Could not update notification.');
    }
  };

  const remove = async (n: CloudNotification) => {
    if (!window.confirm(`Delete notification "${n.title}"? Students will stop seeing it.`)) return;
    try {
      await notificationsApi.softDelete(n.id);
      feedback.success('Notification deleted.');
      await reload();
    } catch (e) {
      feedback.error(e instanceof Error ? e.message : 'Could not delete notification.');
    }
  };

  const field = 'w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500';
  const label = 'text-[11px] font-bold text-slate-500 uppercase tracking-wide';

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" /> Notifications
          </h1>
          <p className="text-xs text-slate-500">Send announcements to a whole course or a single student.</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create Notification
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notification..."
            className="bg-transparent text-xs focus:outline-none text-slate-700 dark:text-slate-200"
          />
        </div>
        {(['all', 'active', 'inactive', 'course', 'student'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize border ${
              filter === f
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
        <table className="w-full min-w-[720px] text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500">
            <tr>
              <th className="text-left p-3 font-bold">Title</th>
              <th className="text-left p-3 font-bold">Target</th>
              <th className="text-left p-3 font-bold">Status</th>
              <th className="text-left p-3 font-bold">Expiry</th>
              <th className="text-left p-3 font-bold">Created</th>
              <th className="text-right p-3 font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-slate-400">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-slate-400">No notifications yet.</td></tr>
            ) : (
              rows.map((n) => (
                <tr key={n.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                  <td className="p-3">
                    <div className="font-bold text-slate-900 dark:text-white">{n.title}</div>
                    <div className="text-[11px] text-slate-500 line-clamp-2 whitespace-pre-wrap">{n.body}</div>
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">
                    {n.target_type === 'course' ? `Course: ${courseName(n.course_id)}` : studentName(n.student_id)}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      n.is_active
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                    }`}>
                      {n.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500">
                    {n.expires_at ? new Date(n.expires_at).toLocaleString() : 'No expiry'}
                  </td>
                  <td className="p-3 text-slate-500">{new Date(n.created_at).toLocaleDateString()}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(n)} title="Edit" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => void toggle(n)} title={n.is_active ? 'Deactivate' : 'Activate'} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-amber-600">
                        <Power className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => void remove(n)} title="Delete" className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg my-8 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                {editing ? 'Edit Notification' : 'Create Notification'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className={label}>Notification Title</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={field} placeholder="Live Class Reminder" />
              </div>
              <div>
                <label className={label}>Notification Message</label>
                <textarea rows={5} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className={field} placeholder="Write the full message…" />
              </div>

              <div>
                <label className={label}>Target Audience</label>
                <div className="flex gap-2 mt-1">
                  {(['course', 'student'] as TargetType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setForm({ ...form, target_type: t })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                        form.target_type === t
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {t === 'course' ? 'Course' : 'Specific Student'}
                    </button>
                  ))}
                </div>
              </div>

              {form.target_type === 'course' ? (
                <div>
                  <label className={label}>Course</label>
                  <select value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })} className={field}>
                    <option value="">Select Course</option>
                    {(courses ?? []).map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className={label}>Student</label>
                  <select value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} className={field}>
                    <option value="">Select Student</option>
                    {((students as CloudProfileRow[] | null) ?? []).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name}{s.phone ? ` · ${s.phone}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={label}>Notification Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={field}>
                    {TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className={label}>Status</label>
                  <select value={form.is_active ? 'active' : 'inactive'} onChange={(e) => setForm({ ...form, is_active: e.target.value === 'active' })} className={field}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className={label}>Start Date</label>
                  <input type="datetime-local" value={form.start_at} onChange={(e) => setForm({ ...form, start_at: e.target.value })} className={field} />
                </div>
                <div>
                  <label className={label}>Expiry (optional)</label>
                  <input type="datetime-local" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className={field} />
                </div>
              </div>

              {formError && <p className="text-xs font-semibold text-rose-600">{formError}</p>}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                Cancel
              </button>
              <button disabled={busy} onClick={() => void submit()} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold">
                {busy ? 'Saving…' : editing ? 'Save Changes' : 'Create Notification'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
