import React, { useMemo, useState } from 'react';
import {
  Wallet,
  RefreshCw,
  Search,
  Plus,
  Trash2,
  IndianRupee,
  ReceiptText,
  X,
} from 'lucide-react';
import {
  revenueSummary,
  studentFinance,
  studentEnrollments,
  feesApi,
  paymentsApi,
  type StudentLedgerRow,
} from '../../services/cloudDb';
import { useCloudQuery } from '../../hooks/useCloudQuery';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../common/Feedback';
import { MyCloudFeesView } from './MyCloudFeesView';

const money = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800';

/**
 * Staff fee & ledger console.
 * Every read and write is addressed by the student's database UUID, so a fee
 * can never land on another student's record.
 */
export const FeeManagementView: React.FC = () => {
  const { currentRole } = useAuth();
  const isStaff = currentRole === 'admin' || currentRole === 'super_admin' || currentRole === 'teacher';

  if (!isStaff) return <MyCloudFeesView />;
  return <StaffFeeConsole />;
};

const StaffFeeConsole: React.FC = () => {
  const { notify, confirm } = useFeedback();
  const [search, setSearch] = useState('');
  const [studentId, setStudentId] = useState('');
  const [showFee, setShowFee] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const summary = useCloudQuery(() => revenueSummary(), []);
  const ledger = useCloudQuery(async () => (studentId ? studentFinance(studentId) : null), [studentId]);
  const enrollments = useCloudQuery(async () => (studentId ? studentEnrollments(studentId) : []), [studentId]);

  const students = useMemo(() => summary.data?.perStudent ?? [], [summary.data]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) => s.full_name.toLowerCase().includes(q) || (s.phone ?? '').includes(q),
    );
  }, [students, search]);

  const selected: StudentLedgerRow | undefined = students.find((s) => s.student_id === studentId);

  const refreshAll = async () => {
    await Promise.all([summary.reload(), ledger.reload()]);
  };

  const removeFee = async (id: string) => {
    const res = await confirm({ title: 'Delete fee line?', message: 'This removes the billed amount from this student only.', tone: 'danger', confirmLabel: 'Delete' });
    if (!res.ok) return;
    try {
      await feesApi.remove(id);
      notify('success', 'Fee line removed');
      await refreshAll();
    } catch (e) {
      notify('error', 'Could not delete', (e as Error).message);
    }
  };

  const removePayment = async (id: string) => {
    const res = await confirm({ title: 'Delete payment?', message: 'The paid amount will be reversed for this student.', tone: 'danger', confirmLabel: 'Delete' });
    if (!res.ok) return;
    try {
      await paymentsApi.remove(id);
      notify('success', 'Payment removed');
      await refreshAll();
    } catch (e) {
      notify('error', 'Could not delete', (e as Error).message);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-black text-slate-900 dark:text-white">
            <Wallet className="h-6 w-6 text-emerald-600" /> Fees, Payments & Ledger
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Live from the database. Pick a student, then bill or collect — records are matched by student ID, never by name.
          </p>
        </div>
        <button onClick={() => void refreshAll()} className="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold dark:border-slate-700">
          <RefreshCw className={`h-3.5 w-3.5 ${summary.loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </header>

      {summary.error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{summary.error}</p>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Total Billed" value={money(summary.data?.totalBilled ?? 0)} />
        <Stat label="Collected" value={money(summary.data?.totalCollected ?? 0)} tone="text-emerald-600" />
        <Stat label="Pending" value={money(summary.data?.totalPending ?? 0)} tone="text-rose-600" />
        <Stat label="Students" value={String(summary.data?.studentCount ?? 0)} tone="text-blue-600" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student by name or phone…"
              className={`${inputCls} pl-9`}
            />
          </div>
          <ul className="mt-3 max-h-[520px] space-y-1 overflow-y-auto">
            {filtered.map((s) => (
              <li key={s.student_id}>
                <button
                  onClick={() => setStudentId(s.student_id)}
                  className={`w-full rounded-xl px-3 py-2 text-left text-xs ${
                    s.student_id === studentId ? 'bg-emerald-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="block font-bold">{s.full_name}</span>
                  <span className={`block text-[10px] ${s.student_id === studentId ? 'text-emerald-100' : 'text-slate-500'}`}>
                    {s.phone ?? '—'} · Pending {money(s.outstanding)}
                  </span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && <li className="p-6 text-center text-xs text-slate-500">No students found.</li>}
          </ul>
        </aside>

        <section className="space-y-4">
          {!studentId && (
            <p className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700">
              Select a student to open their ledger.
            </p>
          )}

          {studentId && ledger.data && (
            <>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-black text-slate-900 dark:text-white">{selected?.full_name ?? 'Student'}</h2>
                    <p className="font-mono text-[10px] text-slate-400">ID: {studentId}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowFee(true)} className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-[11px] font-bold text-white dark:bg-white dark:text-slate-900">
                      <Plus className="h-3.5 w-3.5" /> Add fee
                    </button>
                    <button onClick={() => setShowPayment(true)} className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-[11px] font-bold text-white">
                      <IndianRupee className="h-3.5 w-3.5" /> Record payment
                    </button>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Stat label="Total Fees" value={money(ledger.data.total)} />
                  <Stat label="Paid" value={money(ledger.data.paid)} tone="text-emerald-600" />
                  <Stat label="Pending" value={money(ledger.data.outstanding)} tone="text-rose-600" />
                  <Stat label="Status" value={ledger.data.status} tone="text-blue-600" />
                </div>
              </div>

              <Panel title="Fee lines">
                <table className="w-full min-w-[560px] text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 dark:bg-slate-800">
                    <tr><th className="p-3">Type</th><th className="p-3">Amount</th><th className="p-3">Tax</th><th className="p-3">Discount</th><th className="p-3">Due</th><th className="p-3" /></tr>
                  </thead>
                  <tbody>
                    {ledger.data.fees.map((f) => (
                      <tr key={f.id} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="p-3 capitalize">{f.fee_type}</td>
                        <td className="p-3 font-bold">{money(Number(f.amount))}</td>
                        <td className="p-3">{money(Number(f.tax_amount))}</td>
                        <td className="p-3">{money(Number(f.discount))}</td>
                        <td className="p-3">{f.due_date ? new Date(f.due_date).toLocaleDateString('en-IN') : '—'}</td>
                        <td className="p-3 text-right">
                          <button onClick={() => void removeFee(f.id)} className="text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>
                        </td>
                      </tr>
                    ))}
                    {ledger.data.fees.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-slate-500">No fees billed to this student yet.</td></tr>}
                  </tbody>
                </table>
              </Panel>

              <Panel title="Payment history">
                <table className="w-full min-w-[560px] text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 dark:bg-slate-800">
                    <tr><th className="p-3">Date</th><th className="p-3">Amount</th><th className="p-3">Method</th><th className="p-3">Reference</th><th className="p-3">Status</th><th className="p-3" /></tr>
                  </thead>
                  <tbody>
                    {ledger.data.payments.map((p) => (
                      <tr key={p.id} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="p-3">{new Date(p.paid_at).toLocaleDateString('en-IN')}</td>
                        <td className="p-3 font-bold">{money(Number(p.amount))}</td>
                        <td className="p-3 uppercase">{p.method}</td>
                        <td className="p-3">{p.reference_no || '—'}</td>
                        <td className="p-3 uppercase">{p.status}</td>
                        <td className="p-3 text-right">
                          <button onClick={() => void removePayment(p.id)} className="text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>
                        </td>
                      </tr>
                    ))}
                    {ledger.data.payments.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-slate-500">No payments recorded yet.</td></tr>}
                  </tbody>
                </table>
              </Panel>
            </>
          )}

          {ledger.error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{ledger.error}</p>}
        </section>
      </div>

      {showFee && studentId && (
        <FeeDialog
          studentId={studentId}
          enrollments={enrollments.data ?? []}
          onClose={() => setShowFee(false)}
          onSaved={async () => { setShowFee(false); await refreshAll(); }}
        />
      )}
      {showPayment && studentId && (
        <PaymentDialog
          studentId={studentId}
          enrollments={enrollments.data ?? []}
          onClose={() => setShowPayment(false)}
          onSaved={async () => { setShowPayment(false); await refreshAll(); }}
        />
      )}
    </div>
  );
};

type EnrollmentOption = { id: string; course_id: string; title: string };

const FeeDialog: React.FC<{
  studentId: string;
  enrollments: EnrollmentOption[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}> = ({ studentId, enrollments, onClose, onSaved }) => {
  const { notify } = useFeedback();
  const [enrollmentId, setEnrollmentId] = useState(enrollments[0]?.id ?? '');
  const [feeType, setFeeType] = useState('course');
  const [amount, setAmount] = useState('');
  const [tax, setTax] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return notify('error', 'Enter a valid amount');
    setSaving(true);
    try {
      const enrollment = enrollments.find((en) => en.id === enrollmentId);
      await feesApi.create({
        student_id: studentId,
        enrollment_id: enrollment?.id ?? null,
        course_id: enrollment?.course_id ?? null,
        fee_type: feeType,
        amount: value,
        tax_amount: Number(tax) || 0,
        discount: Number(discount) || 0,
        due_date: dueDate || null,
      });
      notify('success', 'Fee added to this student');
      await onSaved();
    } catch (err) {
      notify('error', 'Could not add fee', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Add fee" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Course / enrollment">
          <select value={enrollmentId} onChange={(e) => setEnrollmentId(e.target.value)} className={inputCls}>
            <option value="">No course (general fee)</option>
            {enrollments.map((en) => <option key={en.id} value={en.id}>{en.title}</option>)}
          </select>
        </Field>
        <Field label="Fee type">
          <select value={feeType} onChange={(e) => setFeeType(e.target.value)} className={inputCls}>
            <option value="course">Course fee</option>
            <option value="registration">Registration</option>
            <option value="exam">Exam</option>
            <option value="material">Material</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Amount"><input value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} inputMode="decimal" /></Field>
          <Field label="Tax"><input value={tax} onChange={(e) => setTax(e.target.value)} className={inputCls} inputMode="decimal" /></Field>
          <Field label="Discount"><input value={discount} onChange={(e) => setDiscount(e.target.value)} className={inputCls} inputMode="decimal" /></Field>
        </div>
        <Field label="Due date"><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} /></Field>
        <button disabled={saving} className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white disabled:opacity-60 dark:bg-white dark:text-slate-900">
          {saving ? 'Saving…' : 'Add fee'}
        </button>
      </form>
    </Modal>
  );
};

const PaymentDialog: React.FC<{
  studentId: string;
  enrollments: EnrollmentOption[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}> = ({ studentId, enrollments, onClose, onSaved }) => {
  const { notify } = useFeedback();
  const [enrollmentId, setEnrollmentId] = useState(enrollments[0]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [reference, setReference] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return notify('error', 'Enter a valid amount');
    setSaving(true);
    try {
      const enrollment = enrollments.find((en) => en.id === enrollmentId);
      await paymentsApi.create({
        student_id: studentId,
        enrollment_id: enrollment?.id ?? null,
        course_id: enrollment?.course_id ?? null,
        amount: value,
        method,
        reference_no: reference.trim() || null,
        status: 'verified',
        paid_at: new Date().toISOString(),
      });
      notify('success', 'Payment recorded — pending balance updated');
      await onSaved();
    } catch (err) {
      notify('error', 'Could not record payment', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Record payment" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Course / enrollment">
          <select value={enrollmentId} onChange={(e) => setEnrollmentId(e.target.value)} className={inputCls}>
            <option value="">No course (general)</option>
            {enrollments.map((en) => <option key={en.id} value={en.id}>{en.title}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount"><input value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} inputMode="decimal" /></Field>
          <Field label="Method">
            <select value={method} onChange={(e) => setMethod(e.target.value)} className={inputCls}>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="bank">Bank transfer</option>
              <option value="card">Card</option>
            </select>
          </Field>
        </div>
        <Field label="Reference no."><input value={reference} onChange={(e) => setReference(e.target.value)} className={inputCls} /></Field>
        <button disabled={saving} className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white disabled:opacity-60">
          {saving ? 'Saving…' : 'Record payment'}
        </button>
      </form>
    </Modal>
  );
};

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
    <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-black"><ReceiptText className="h-4 w-4" /> {title}</h3>
        <button onClick={onClose}><X className="h-4 w-4" /></button>
      </div>
      {children}
    </div>
  </div>
);

const Panel: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
    <h3 className="p-3 text-xs font-black uppercase text-slate-500">{title}</h3>
    {children}
  </section>
);

const Stat: React.FC<{ label: string; value: string; tone?: string }> = ({ label, value, tone }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
    <p className="text-[10px] font-bold uppercase text-slate-500">{label}</p>
    <p className={`text-lg font-black ${tone ?? 'text-slate-900 dark:text-white'}`}>{value}</p>
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="text-[11px] font-black uppercase text-slate-500">{label}</label>
    <div className="mt-1">{children}</div>
  </div>
);
