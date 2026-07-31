import React, { useState, useMemo } from 'react';
import { db } from '../../services/db';
import { createAccount, setAccountPassword } from '../../../lib/accounts.functions';
import { useAuth } from '../../context/AuthContext';
import { User, UserRole } from '../../types/lms';
import { Users, UserPlus, ShieldCheck, KeyRound, GraduationCap, Briefcase, Search, X, Save, Eye, EyeOff, CircleCheck as CheckCircle2 } from 'lucide-react';

type FormRole = 'student' | 'teacher' | 'admin' | 'super_admin';

export const AccountsManagementView: React.FC = () => {
  const { currentUser, currentRole, refreshUserData } = useAuth();

  const [users, setUsers] = useState<User[]>(db.getUsers());
  const [showCreate, setShowCreate] = useState(false);
  const [pwUser, setPwUser] = useState<User | null>(null);
  const [pwValue, setPwValue] = useState('');
  const [pwShow, setPwShow] = useState(false);
  const [filter, setFilter] = useState<'all' | UserRole>('all');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const [role, setRole] = useState<FormRole>('student');
  const [fullName, setFullName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [courseId, setCourseId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [designation, setDesignation] = useState('Instructor');
  const [subject, setSubject] = useState('');
  const [monthlySalary, setMonthlySalary] = useState<number | ''>('');
  const [assignedCourseIds, setAssignedCourseIds] = useState<string[]>([]);

  const [errors, setErrors] = useState<string[]>([]);

  const courses = db.getCourses();
  const batches = db.getBatches();
  const isSuper = currentRole === 'super_admin';

  const filtered = useMemo(() => {
    let list = users;
    if (filter !== 'all') list = list.filter((u) => u.role === filter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.phone.toLowerCase().includes(q),
      );
    }
    return list;
  }, [users, filter, search]);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const resetForm = () => {
    setRole('student');
    setFullName('');
    setFatherName('');
    setPhone('');
    setEmail('');
    setPassword('');
    setCourseId('');
    setBatchId('');
    setDesignation('Instructor');
    setSubject('');
    setMonthlySalary('');
    setAssignedCourseIds([]);
    setErrors([]);
  };

  const openCreate = () => {
    resetForm();
    setShowCreate(true);
  };

  const validateForm = (): string[] => {
    const errs: string[] = [];
    if (!fullName.trim()) errs.push('Full Name is required.');
    if (!phone.trim() || phone.replace(/\D/g, '').length < 6) errs.push('Valid phone number is required.');
    if (!email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errs.push('Valid email address is required.');
    if (!password || password.length < 6) errs.push('Password must be at least 6 characters (Super Admin sets it manually).');
    if (role === 'student' && !fatherName.trim()) errs.push('Father Name is required for students.');
    // Duplicate check
    if (users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) errs.push('An account with this email already exists.');
    if (users.some((u) => u.phone.replace(/\D/g, '') === phone.replace(/\D/g, ''))) errs.push('An account with this phone already exists.');
    return errs;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateForm();
    if (errs.length) {
      setErrors(errs);
      return;
    }

    const actorId = currentUser?.id || 'usr-superadmin';
    const actorName = currentUser?.name || 'Super Admin';

    // Create the cloud account first so the person can sign in from any device.
    let cloudUserId: string | undefined;
    let cloudWarning = '';
    try {
      const res = await createAccount({
        data: {
          fullName,
          fatherName: role === 'student' ? fatherName : undefined,
          phone,
          email,
          password,
          role,
          batchId: batchId || undefined,
          courseId: courseId || undefined,
        },
      });
      if ('userId' in res && res.userId) cloudUserId = res.userId;
      else cloudWarning = ` (cloud sign-in not enabled: ${'error' in res ? res.error : 'unknown error'})`;
    } catch {
      cloudWarning = ' (cloud sign-in could not be set up — sign in as a cloud Super Admin and retry)';
    }

    try {
      if (role === 'student') {
        db.createStudentAccount(
          {
            fullName,
            fatherName,
            phone,
            email,
            password,
            courseId: courseId || undefined,
            batchId: batchId || undefined,
            userId: cloudUserId,
          },
          actorId,
          actorName,
        );
        flash(`Student ${fullName} created with fresh (zero) stats.${cloudWarning}`);
      } else if (role === 'teacher') {
        db.createTeacherAccount(
          {
            fullName,
            phone,
            email,
            password,
            designation,
            subjectSpecialization: subject || 'General',
            monthlySalary: typeof monthlySalary === 'number' ? monthlySalary : 0,
            assignedCourseIds,
            userId: cloudUserId,
          },
          actorId,
          actorName,
        );
        flash(`Teacher ${fullName} created and assigned to ${assignedCourseIds.length} course(s).${cloudWarning}`);
      } else {
        db.createAdminAccount(
          { fullName, phone, email, password, role, userId: cloudUserId },
          actorId,
          actorName,
        );
        flash(`${role === 'super_admin' ? 'Super Admin' : 'Admin'} ${fullName} created.${cloudWarning}`);
      }

      setUsers(db.getUsers());
      refreshUserData();
      setShowCreate(false);
      resetForm();
    } catch (err) {
      setErrors([(err as Error).message || 'Failed to create account.']);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwUser) return;
    if (!pwValue || pwValue.length < 6) {
      flash('Password must be at least 6 characters.');
      return;
    }
    let cloudNote = '';
    if (/^[0-9a-f-]{36}$/i.test(pwUser.id)) {
      try {
        const res = await setAccountPassword({ data: { userId: pwUser.id, password: pwValue } });
        if ('error' in res && res.error) cloudNote = ` (cloud password unchanged: ${res.error})`;
      } catch {
        cloudNote = ' (cloud password unchanged — please retry)';
      }
    }
    const ok = db.changeUserPassword(
      pwUser.id,
      pwValue,
      currentUser?.id || 'usr-superadmin',
      currentUser?.name || 'Super Admin',
    );
    if (ok) {
      flash(`Password updated for ${pwUser.name}.${cloudNote}`);
      setUsers(db.getUsers());
      setPwUser(null);
      setPwValue('');
      setPwShow(false);
    }
  };

  if (!isSuper) {
    return (
      <div className="p-8">
        <div className="max-w-lg mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
          <ShieldCheck className="w-10 h-10 mx-auto text-rose-500" />
          <h2 className="mt-3 font-black text-lg">Super Admin Only</h2>
          <p className="text-sm text-slate-500 mt-1">Account creation & password control is restricted to Super Admin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {toast}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            Accounts & Staff Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Only the Super Admin can create accounts and set/change passwords. Self-reset is disabled for students & teachers.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md"
        >
          <UserPlus className="w-4 h-4" /> Create New Account
        </button>
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
              filter === r ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {r === 'all' ? 'All' : r.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5">Name</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Email</th>
                <th className="p-3.5">Phone</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Created</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">No accounts match your filter.</td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">{u.name}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.role === 'super_admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' :
                        u.role === 'admin' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' :
                        u.role === 'teacher' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' :
                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}>{u.role.replace('_', ' ')}</span>
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300">{u.email}</td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300">{u.phone}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                      }`}>{u.status}</span>
                    </td>
                    <td className="p-3.5 text-slate-400">{u.createdAt}</td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => { setPwUser(u); setPwValue(''); setPwShow(false); }}
                        className="px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300 rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <KeyRound className="w-3.5 h-3.5" /> Change Password
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900">
              <h3 className="font-black text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" /> Create New Account
              </h3>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Role</label>
                <div className="mt-1.5 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['student', 'teacher', 'admin', 'super_admin'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`px-2 py-2 rounded-xl border text-[11px] font-bold ${
                        role === r ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {r === 'student' ? <GraduationCap className="w-4 h-4 mx-auto mb-1" /> : r === 'teacher' ? <Briefcase className="w-4 h-4 mx-auto mb-1" /> : <ShieldCheck className="w-4 h-4 mx-auto mb-1" />}
                      {r.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Full Name *</label>
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
                </div>
                {role === 'student' && (
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">Father Name *</label>
                    <input value={fatherName} onChange={(e) => setFatherName(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
                  </div>
                )}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Phone *</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 90000 00000" className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Email *</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Password * (Set manually — no auto-generation)</label>
                  <div className="mt-1 relative">
                    <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" className="w-full pl-3 pr-10 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
                    <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {role === 'student' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">Assign Course (Optional)</label>
                    <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <option value="">— None (assign later) —</option>
                      {courses.map((c) => <option key={c.id} value={c.id}>{c.title} · ₹{c.feeAmount.toLocaleString()}</option>)}
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1">Assigning a course auto-reflects its fee (Paid: 0, Remaining: Total).</p>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">Assign Batch (Optional)</label>
                    <select value={batchId} onChange={(e) => setBatchId(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <option value="">— Unassigned —</option>
                      {batches.filter((b) => !courseId || b.courseId === courseId).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {role === 'teacher' && (
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300">Designation</label>
                      <input value={designation} onChange={(e) => setDesignation(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300">Subject Specialization</label>
                      <input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300">Monthly Salary (₹)</label>
                      <input type="number" value={monthlySalary} onChange={(e) => setMonthlySalary(e.target.value === '' ? '' : Number(e.target.value))} className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
                    </div>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">Assigned Courses (Optional)</label>
                    <div className="mt-1.5 flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      {courses.map((c) => {
                        const on = assignedCourseIds.includes(c.id);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setAssignedCourseIds((prev) => on ? prev.filter((x) => x !== c.id) : [...prev, c.id])}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${on ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}
                          >
                            {c.title}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {errors.length > 0 && (
                <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 p-3 text-rose-700 dark:text-rose-300 text-[11px] space-y-0.5">
                  {errors.map((e, i) => <div key={i}>• {e}</div>)}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2">
                  <Save className="w-4 h-4" /> Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PASSWORD MODAL */}
      {pwUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-black text-base flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-500" /> Change Password
              </h3>
              <button onClick={() => setPwUser(null)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleChangePassword} className="p-5 space-y-4 text-xs">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
                <div className="font-bold">{pwUser.name}</div>
                <div className="text-slate-500">{pwUser.email} · {pwUser.role.replace('_', ' ')}</div>
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">New Password (min 6 chars)</label>
                <div className="mt-1 relative">
                  <input type={pwShow ? 'text' : 'password'} value={pwValue} onChange={(e) => setPwValue(e.target.value)} className="w-full pl-3 pr-10 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
                  <button type="button" onClick={() => setPwShow((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400">
                    {pwShow ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-slate-400">This action is logged in the Audit Trail. Communicate the new password to the user securely.</p>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setPwUser(null)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-2">
                  <Save className="w-4 h-4" /> Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
