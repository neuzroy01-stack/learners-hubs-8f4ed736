import React, { useMemo, useState } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  KeyRound,
  Search,
  X,
  Pencil,
  Trash2,
  Power,
  RefreshCw,
} from 'lucide-react';
import {
  listAccounts,
  createAccount,
  updateAccount,
  setAccountPassword,
  setAccountStatus,
  deleteAccount,
  type CloudProfile,
} from '../../../lib/accounts.functions';
import { useCloudQuery } from '../../hooks/useCloudQuery';
import { useFeedback } from '../common/Feedback';
import { useAuth } from '../../context/AuthContext';

type FormRole = 'student' | 'teacher' | 'admin' | 'super_admin';

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800';

interface FormState {
  id?: string;
  fullName: string;
  fatherName: string;
  phone: string;
  email: string;
  password: string;
  role: FormRole;
  batchId: string;
  courseId: string;
}

const emptyForm = (): FormState => ({
  fullName: '',
  fatherName: '',
  phone: '',
  email: '',
  password: '',
  role: 'student',
  batchId: '',
  courseId: '',
});

/** Accounts directory — reads and writes go through the server, keyed by user UUID. */
export const AccountsManagementView: React.FC = () => {
  const { currentRole } = useAuth();
  const { notify, confirm } = useFeedback();
  const isSuper = currentRole === 'super_admin';

  const { data, loading, error, reload } = useCloudQuery(async () => listAccounts(), []);
  const accounts = useMemo(() => (data && 'accounts' in data ? (data.accounts as CloudProfile[]) : []), [data]);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | FormRole>('all');
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [pwUser, setPwUser] = useState<CloudProfile | null>(null);
  const [pwValue, setPwValue] = useState('');

  const filtered = useMemo(() => {
    let list = accounts;
    if (filter !== 'all') list = list.filter((u) => u.role === filter);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((u) => u.full_name.toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q) || (u.phone ?? '').includes(q));
    return list;
  }, [accounts, filter, search]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      const base = {
        fullName: form.fullName.trim(),
        fatherName: form.fatherName.trim() || undefined,
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        role: form.role,
        batchId: form.batchId.trim() || undefined,
        courseId: form.courseId.trim() || undefined,
      };
      const res = form.id
        ? await updateAccount({ data: { ...base, userId: form.id } })
        : await createAccount({ data: { ...base, password: form.password } });
      if ('error' in res && res.error) {
        notify('error', 'Could not save account', res.error);
        return;
      }
      notify('success', form.id ? 'Account updated' : 'Account created');
      setForm(null);
      await reload();
    } catch (err) {
      notify('error', 'Could not save account', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwUser) return;
    if (pwValue.length < 6) return notify('error', 'Password must be at least 6 characters');
    try {
      const res = await setAccountPassword({ data: { userId: pwUser.id, password: pwValue } });
      if ('error' in res && res.error) return notify('error', 'Could not change password', res.error);
      notify('success', `Password updated for ${pwUser.full_name}`);
      setPwUser(null);
      setPwValue('');
    } catch (err) {
      notify('error', 'Could not change password', (err as Error).message);
    }
  };

  const toggleStatus = async (u: CloudProfile) => {
    const next = u.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await setAccountStatus({ data: { userId: u.id, status: next } });
      if ('error' in res && res.error) return notify('error', 'Could not update status', res.error);
      notify('success', next === 'active' ? 'Account reactivated' : 'Account deactivated — sign-in blocked');
      await reload();
    } catch (err) {
      notify('error', 'Could not update status', (err as Error).message);
    }
  };

  const removeUser = async (u: CloudProfile) => {
    const res = await confirm({
      title: `Delete ${u.full_name}?`,
      message: 'This permanently removes the login and all linked records (fees, payments, attendance, submissions). This cannot be undone.',
      tone: 'danger',
      confirmLabel: 'Delete permanently',
    });
    if (!res.ok) return;
    try {
      const out = await deleteAccount({ data: { userId: u.id } });
      if ('error' in out && out.error) return notify('error', 'Could not delete', out.error);
      notify('success', `${u.full_name} deleted`);
      await reload();
    } catch (err) {
      notify('error', 'Could not delete', (err as Error).message);
    }
  };

  if (currentRole !== 'admin' && !isSuper) {
    return (
      <div className="p-8">
        <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <ShieldCheck className="mx-auto h-10 w-10 text-rose-500" />
          <h2 className="mt-3 text-lg font-black">Admins only</h2>
          <p className="mt-1 text-sm text-slate-500">Account management is restricted to Admin and Super Admin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-black">
            <Users className="h-6 w-6 text-indigo-600" /> Accounts & Staff Management
          </h1>
          <p className="mt-1 text-xs text-slate-500">Create, edit, deactivate or permanently delete any user. All records live in the database.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => void reload()} className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold dark:border-slate-700">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setForm(emptyForm())} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md">
            <UserPlus className="h-4 w-4" /> Create Account
          </button>
        </div>
      </header>

      {error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {data && 'error' in data && data.error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{data.error}</p>}

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email or phone…" className={`${inputCls} pl-9`} />
        </div>
        {(['all', 'super_admin', 'admin', 'teacher', 'student'] as const).map((r) => (
          <button
            key={r}
            onClick={() => setFilter(r)}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-bold ${filter === r ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-600 dark:bg-slate-800'}`}
          >
            {r.replace('_', ' ')}
          </button>
        ))}
      </div>

      <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 dark:bg-slate-800">
            <tr><th className="p-3">Name</th><th className="p-3">Phone</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="p-3 font-bold">{u.full_name}</td>
                <td className="p-3">{u.phone ?? '—'}</td>
                <td className="p-3">{u.email ?? '—'}</td>
                <td className="p-3 uppercase">{u.role.replace('_', ' ')}</td>
                <td className={`p-3 font-bold uppercase ${u.status === 'active' ? 'text-emerald-600' : 'text-rose-600'}`}>{u.status}</td>
                <td className="p-3">
                  <div className="flex flex-wrap justify-end gap-1.5">
                    <button
                      onClick={() =>
                        setForm({
                          id: u.id,
                          fullName: u.full_name,
                          fatherName: u.father_name ?? '',
                          phone: u.phone ?? '',
                          email: u.email ?? '',
                          password: '',
                          role: u.role as FormRole,
                          batchId: u.batch_id ?? '',
                          courseId: u.course_id ?? '',
                        })
                      }
                      className="rounded-lg border border-slate-300 p-1.5 dark:border-slate-700"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {isSuper && (
                      <button onClick={() => setPwUser(u)} className="rounded-lg border border-slate-300 p-1.5 dark:border-slate-700" title="Set password">
                        <KeyRound className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button onClick={() => void toggleStatus(u)} className="rounded-lg border border-amber-300 p-1.5 text-amber-600" title="Activate / deactivate">
                      <Power className="h-3.5 w-3.5" />
                    </button>
                    {isSuper && (
                      <button onClick={() => void removeUser(u)} className="rounded-lg border border-rose-300 p-1.5 text-rose-600" title="Delete permanently">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">No accounts found.</td></tr>}
          </tbody>
        </table>
      </section>

      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <form onSubmit={save} className="w-full max-w-lg space-y-3 rounded-2xl bg-white p-6 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black">{form.id ? 'Edit account' : 'Create account'}</h3>
              <button type="button" onClick={() => setForm(null)}><X className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Full name"><input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={inputCls} /></Field>
              <Field label="Father name"><input value={form.fatherName} onChange={(e) => setForm({ ...form, fatherName: e.target.value })} className={inputCls} /></Field>
              <Field label="Phone"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} /></Field>
              <Field label="Email (optional)"><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} /></Field>
              <Field label="Role">
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as FormRole })} className={inputCls} disabled={!isSuper}>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </Field>
              <Field label="Batch (optional)"><input value={form.batchId} onChange={(e) => setForm({ ...form, batchId: e.target.value })} className={inputCls} /></Field>
            </div>
            {!form.id && (
              <Field label="Password (set manually)">
                <input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputCls} />
              </Field>
            )}
            <button disabled={saving} className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white disabled:opacity-60">
              {saving ? 'Saving…' : 'Save account'}
            </button>
          </form>
        </div>
      )}

      {pwUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <form onSubmit={changePassword} className="w-full max-w-sm space-y-3 rounded-2xl bg-white p-6 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black">Set password — {pwUser.full_name}</h3>
              <button type="button" onClick={() => setPwUser(null)}><X className="h-4 w-4" /></button>
            </div>
            <input value={pwValue} onChange={(e) => setPwValue(e.target.value)} placeholder="New password" className={inputCls} />
            <button className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white dark:bg-white dark:text-slate-900">Update password</button>
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
