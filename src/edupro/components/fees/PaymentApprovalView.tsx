import React, { useState } from 'react';
import { CheckCircle2, XCircle, Trash2, RefreshCw, Pencil, ShieldCheck, ImageIcon } from 'lucide-react';
import { paymentsApi, pendingPaymentsWithNames, paymentProofs, reviewPayment } from '../../services/cloudDb';
import { useCloudQuery } from '../../hooks/useCloudQuery';
import { useFeedback } from '../common/Feedback';

/** Admin queue for verifying student payments. Every action writes to the database. */
export const PaymentApprovalView: React.FC = () => {
  const { notify, confirm } = useFeedback();
  const { data, loading, error, reload } = useCloudQuery(() => pendingPaymentsWithNames());
  const [editing, setEditing] = useState<{ id: string; amount: string; reference: string } | null>(null);
  const [proof, setProof] = useState<string | null>(null);

  type Row = NonNullable<typeof data>[number];

  const openProof = async (path: string) => {
    try {
      const url = await paymentProofs.signedUrl(path);
      if (url) setProof(url);
      else notify('warning', 'Screenshot unavailable');
    } catch (err) {
      notify('error', 'Could not open screenshot', err instanceof Error ? err.message : undefined);
    }
  };

  const approve = async (row: Row) => {
    try {
      await reviewPayment(row, 'verified');
      notify('success', 'Payment approved', 'Pending balance updated for this student.');
      await reload();
    } catch (err) {
      notify('error', 'Action failed', err instanceof Error ? err.message : undefined);
    }
  };

  const reject = async (row: Row) => {
    const res = await confirm({
      title: 'Reject payment?',
      message: 'The fee stays pending and the student can resubmit. Add a reason they will see.',
      confirmLabel: 'Reject',
      tone: 'danger',
      requireReason: true,
      reasonLabel: 'Reason shown to the student',
    });
    if (!res.ok) return;
    try {
      await reviewPayment(row, 'rejected', res.reason);
      notify('success', 'Payment rejected', 'The student has been notified with your reason.');
      await reload();
    } catch (err) {
      notify('error', 'Action failed', err instanceof Error ? err.message : undefined);
    }
  };

  const remove = async (id: string) => {
    const res = await confirm({ title: 'Delete payment?', message: 'This removes the record and recalculates the outstanding balance.', confirmLabel: 'Delete', tone: 'danger' });
    if (!res.ok) return;
    try {
      await paymentsApi.remove(id);
      notify('success', 'Payment deleted');
      await reload();
    } catch (err) {
      notify('error', 'Delete failed', err instanceof Error ? err.message : undefined);
    }
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const amount = Number(editing.amount);
    if (!Number.isFinite(amount) || amount <= 0) { notify('warning', 'Enter a valid amount'); return; }
    try {
      await paymentsApi.update(editing.id, { amount, reference_no: editing.reference.trim() || null });
      notify('success', 'Payment updated');
      setEditing(null);
      await reload();
    } catch (err) {
      notify('error', 'Update failed', err instanceof Error ? err.message : undefined);
    }
  };

  const rows = data ?? [];

  return (
    <div className="space-y-5 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-black text-slate-900 dark:text-white">
            <ShieldCheck className="h-5 w-5 text-emerald-600" /> Payment Verification
          </h1>
          <p className="text-xs text-slate-500">Approve, reject, edit or delete submitted payments.</p>
        </div>
        <button onClick={() => void reload()} className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold dark:border-slate-700">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </header>

      {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 dark:bg-slate-800">
            <tr>
              <th className="p-3">Student</th><th className="p-3">Course</th><th className="p-3">Amount</th>
              <th className="p-3">Method</th><th className="p-3">Reference / UTR</th><th className="p-3">Date</th><th className="p-3">Proof</th><th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="p-3 font-bold">{p.student_name}</td>
                <td className="p-3">{p.course_title}</td>
                <td className="p-3 font-bold">₹{Number(p.amount).toLocaleString('en-IN')}</td>
                <td className="p-3 uppercase">{p.method}</td>
                <td className="p-3">{p.reference_no || '—'}</td>
                <td className="p-3">{new Date(p.paid_at).toLocaleDateString('en-IN')}</td>
                <td className="p-3">
                  {p.receipt_url ? (
                    <button onClick={() => void openProof(p.receipt_url as string)} className="flex items-center gap-1 font-bold text-blue-600">
                      <ImageIcon className="h-3.5 w-3.5" /> View
                    </button>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex gap-1.5">
                    <button onClick={() => void approve(p)} className="rounded-lg bg-emerald-600 p-1.5 text-white" aria-label="Approve"><CheckCircle2 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => void reject(p)} className="rounded-lg bg-amber-500 p-1.5 text-white" aria-label="Reject"><XCircle className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setEditing({ id: p.id, amount: String(p.amount), reference: p.reference_no ?? '' })} className="rounded-lg border border-slate-300 p-1.5 dark:border-slate-700" aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => void remove(p.id)} className="rounded-lg border border-rose-300 p-1.5 text-rose-600 dark:border-rose-900" aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr><td colSpan={8} className="p-8 text-center text-slate-500">No payments awaiting verification.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {proof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4" onClick={() => setProof(null)}>
          <img src={proof} alt="Payment screenshot" className="max-h-[85vh] max-w-3xl rounded-2xl bg-white object-contain p-2" />
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <form onSubmit={saveEdit} className="w-full max-w-sm space-y-3 rounded-2xl bg-white p-5 dark:bg-slate-900">
            <h2 className="text-base font-black">Edit payment</h2>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500" htmlFor="p-amt">Amount (₹)</label>
              <input id="p-amt" type="number" min={1} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" value={editing.amount} onChange={(e) => setEditing({ ...editing, amount: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500" htmlFor="p-ref">Reference / UTR</label>
              <input id="p-ref" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" value={editing.reference} onChange={(e) => setEditing({ ...editing, reference: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold dark:border-slate-700">Cancel</button>
              <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
