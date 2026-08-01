import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createAccount,
  setAccountPassword,
  deleteAccount,
  listAccounts,
} from '../../../lib/accounts.functions';
import { coursesApi, type CloudCourse } from '../../services/cloudDb';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../common/Feedback';
import {
  Users, UserPlus, ShieldCheck, KeyRound, Search, X, Eye, EyeOff, Trash2, RefreshCw,
} from 'lucide-react';

type Role = 'student' | 'teacher' | 'admin' | 'super_admin';

type Account = {
  id: string;
  full_name: string;
  father_name: string | null;
  phone: string | null;
  email: string | null;
  role: Role;
  status: string;
  course_id: string | null;
};

const roleLabel: Record<Role, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  teacher: 'Teacher',
  student: 'Student',
};

const roleChip: Record<Role, string> = {
  super_admin: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  admin: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  teacher: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  student: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
};

const inputCls =
  'w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm';
const labelCls = 'text-[11px] font-bold uppercase tracking-wide text-slate-500';

export const AccountsManagementView: React.FC = () => {
  const { currentRole, refreshUserData } = useAuth();
  const { notify, confirm } = useFeedback();
  const isSuper = currentRole === 'super_admin';

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [courses, setCourses] = useState<CloudCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | Role>('all');
  const [search, setSearch] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pwUser, setPwUser] = useState<Account | null>(null);
  const [pwValue, setPwValue] = useState('');
  const [pwShow, setPwShow] = useState(false);

  const [role, setRole] = useState<Role>('student');
  const [fullName, setFullName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [courseId, setCourseId] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [res, cs] = await Promise.all([listAccounts(), coursesApi.list()]);
      if ('error' in res && res.error) notify('error', 'Could not load accounts', res.error);
      setAccounts(((res.accounts ?? []) as Account[]));
      setCourses(cs);
    } catch (err) {
      notify('error', 'Could not load accounts', err instanceof Error ? err.message : undefined);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    let list = accounts;
    if (filter !== 'all') list = list.filter((u) => u.role === filter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (u) =>
          u.full_name.toLowerCase().includes(q) ||
          (u.email ?? '').toLowerCase().includes(q) ||
          (u.phone ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [accounts, filter, search]);

  const resetForm = () => {
    setRole('student');
    setFullName('');
    setFatherName('');
    setPhone('');
    setEmail('');
    setPassword('');
    setCourseId('');
    setErrors([]);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: string[] = [];
    if (!fullName.trim()) errs.push('Full Name is required.');
    if (phone.replace(/\D/g, '').length < 6) errs.push('Valid phone number is required.');
    if (email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errs.push('Email address is not valid.');
    if (password.length < 6) errs.push('Password must be at least 6 characters.');
    if (errs.length) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    try {
      const res = await createAccount({
        data: {
          fullName: fullName.trim(),
          fatherName: role === 'student' ? fatherName.trim() || undefined : undefined,
          phone: phone.trim(),
          email: email.trim() || undefined,
          password,
          role,
          courseId: courseId || undefined,
        },
      });
      if ('error' in res && res.error) {
        setErrors([res.error]);
        return;
      }
      notify('success', `${roleLabel[role]} created`, `${fullName} can now sign in from any device.`);
      setShowCreate(false);
      resetForm();
      await load();
      refreshUserData();
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Could not create the account.']);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwUser) return;
    if (pwValue.length < 6) {
      notify('warning', 'Password must be at least 6 characters.');
      return;
    }
    try {
      const res = await setAccountPassword({ data: { userId: pwUser.id, password: pwValue } });
      if ('error' in res && res.error) {
        notify('error', 'Password not changed', res.error);
        return;
      }
      notify('success', `Password updated for ${pwUser.full_name}.`);
      setPwUser(null);
      setPwValue('');
      setPwShow(false);
    } catch (err) {
      notify('error', 'Password not changed', err instanceof Error ? err.message : undefined);
    }
  };

  const handleDelete = async (acc: Account) => {
    const res = await confirm({
      title: `Permanently delete ${acc.full_name}?`,
      message: `This removes the ${roleLabel[acc.role]} account and every linked record (enrollments, fees, payments, attendance and submissions) from the database. This cannot be undone.`,
      confirmLabel: 'Delete permanently',
      tone: 'danger',
    });
    if (!res.ok) return;
    try {
      const out = await deleteAccount({ data: { userId: acc.id } });
      if ('error' in out && out.error) {
        notify('error', 'Delete failed', out.error);
        return;
      }
      setAccounts((list) => list.filter((u) => u.id !== acc.id));
      notify('success', `${acc.full_name} deleted permanently.`);
      await load();
    } catch (err) {
      notify('error', 'Delete failed', err instanceof Error ? err.message : undefined);
    }
  };

  if (!isSuper) {
    return (
      <div className="p-8">
        <div className="max-w-lg mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
          <ShieldCheck className="w-10 h-10 mx-auto text-rose-500" />
          <h2 className="mt-3 font-black text-lg">Super Admin Only</h2>
          <p className="text-sm text-slate-500 mt-1">
            Account creation, password control and permanent deletion are restricted to the Super Admin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" /> Accounts &amp; Staff Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Every account below lives in the database. Create, reset passwords or delete permanently.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void load()}
            className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowCreate(true);
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md"
          >
            <UserPlus className="w-4 h-4" /> Create New Account
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or phone…"
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
          />
        </div>
        {(['all', 'super_admin', 'admin', 'teacher', 'student'] as const).map((r) => (
          <button
            key={r}
            onClick={() => setFilter(r)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold ${
              filter === r
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {r === 'all' ? 'All' : roleLabel[r]}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Role</th>
              <th className="text-left px-4 py-3">Phone</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && accounts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500 text-xs">
                  Loading accounts from the database…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500 text-xs">
                  No accounts match this filter.
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 font-bold">{u.full_name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${roleChip[u.role]}`}>
                      {roleLabel[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{u.phone || '—'}</td>
                  <td className="px-4 py-3 text-slate-500 truncate max-w-[220px]">{u.email || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setPwUser(u);
                          setPwValue('');
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-bold flex items-center gap-1"
                      >
                        <KeyRound className="w-3.5 h-3.5" /> Password
                      </button>
                      <button
                        onClick={() => void handleDelete(u)}
                        className="px-2.5 py-1.5 rounded-lg border border-rose-300 dark:border-rose-900 text-rose-600 text-[11px] font-bold flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleCreate}
            className="my-8 w-full max-w-xl space-y-4 rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black">Create new account</h2>
              <button type="button" onClick={() => setShowCreate(false)} aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>

            {errors.length > 0 && (
              <ul className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-900 px-3 py-2 text-xs text-rose-700 dark:text-rose-300 space-y-1">
                {errors.map((er) => (
                  <li key={er}>{er}</li>
                ))}
              </ul>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCls} htmlFor="a-role">Role</label>
                <select id="a-role" className={inputCls} value={role} onChange={(e) => setRole(e.target.value as Role)}>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div>
                <label className={labelCls} htmlFor="a-name">Full name</label>
                <input id="a-name" className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              {role === 'student' && (
                <div>
                  <label className={labelCls} htmlFor="a-father">Father name</label>
                  <input id="a-father" className={inputCls} value={fatherName} onChange={(e) => setFatherName(e.target.value)} />
                </div>
              )}
              <div>
                <label className={labelCls} htmlFor="a-phone">Phone (login id)</label>
                <input id="a-phone" className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
              <div>
                <label className={labelCls} htmlFor="a-email">Email (optional)</label>
                <input id="a-email" type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label className={labelCls} htmlFor="a-pw">Password (set by Super Admin)</label>
                <div className="relative">
                  <input
                    id="a-pw"
                    type={showPw ? 'text' : 'password'}
                    className={inputCls}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400"
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {role === 'student' && (
                <div className="sm:col-span-2">
                  <label className={labelCls} htmlFor="a-course">Primary course (optional)</label>
                  <select id="a-course" className={inputCls} value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                    <option value="">Not assigned yet</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
              >
                {saving ? 'Creating…' : 'Create account'}
              </button>
            </div>
          </form>
        </div>
      )}

      {pwUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <form onSubmit={handleChangePassword} className="w-full max-w-md space-y-4 rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black">Set password · {pwUser.full_name}</h2>
              <button type="button" onClick={() => setPwUser(null)} aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative">
              <input
                type={pwShow ? 'text' : 'password'}
                className={inputCls}
                value={pwValue}
                onChange={(e) => setPwValue(e.target.value)}
                placeholder="New password (min 6 characters)"
                required
              />
              <button
                type="button"
                onClick={() => setPwShow((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400"
                aria-label={pwShow ? 'Hide password' : 'Show password'}
              >
                {pwShow ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setPwUser(null)} className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-bold">
                Cancel
              </button>
              <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white">
                Update password
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
