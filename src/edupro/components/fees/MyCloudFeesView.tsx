import React, { useState } from 'react';
import { CreditCard, RefreshCw } from 'lucide-react';
import { studentFinance } from '../../services/cloudDb';
import { useCloudQuery } from '../../hooks/useCloudQuery';
import { useAuth } from '../../context/AuthContext';
import { PayFeeModal } from './PayFeeModal';

const money = (n: number) => `₹${n.toLocaleString('en-IN')}`;

/** Student's own fee ledger, computed live from the database. */
export const MyCloudFeesView: React.FC = () => {
  const { currentUser } = useAuth();
  const uid = currentUser?.id ?? '';
  const { data, loading, error, reload } = useCloudQuery(async () => (uid ? studentFinance(uid) : null), [uid]);
  const [payOpen, setPayOpen] = useState(false);

  if (!uid) return <p className="p-6 text-sm text-slate-500">Sign in to view your fees.</p>;

  return (
    <div className="space-y-5 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-xl font-black text-slate-900 dark:text-white">
          <CreditCard className="h-5 w-5 text-blue-600" /> My Fees
        </h1>
        <div className="flex items-center gap-2">
          {(data?.outstanding ?? 0) > 0 && (
            <button onClick={() => setPayOpen(true)} className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700">
              Pay Pending Fees {money(data!.outstanding)}
            </button>
          )}
          <button onClick={() => void reload()} className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold dark:border-slate-700">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </header>

      {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card label="Total Fees" value={money(data.total)} />
            <Card label="Paid" value={money(data.paid)} tone="text-emerald-600" />
            <Card label="Outstanding" value={money(data.outstanding)} tone="text-rose-600" />
            <Card label="Payment Status" value={data.status} tone="text-blue-600" />
          </div>

          <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <h2 className="p-3 text-xs font-black uppercase text-slate-500">Fee breakdown</h2>
            <table className="w-full min-w-[520px] text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 dark:bg-slate-800">
                <tr><th className="p-3">Type</th><th className="p-3">Amount</th><th className="p-3">Tax</th><th className="p-3">Discount</th><th className="p-3">Due date</th></tr>
              </thead>
              <tbody>
                {data.fees.map((f) => (
                  <tr key={f.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="p-3 capitalize">{f.fee_type}</td>
                    <td className="p-3 font-bold">{money(Number(f.amount))}</td>
                    <td className="p-3">{money(Number(f.tax_amount))}</td>
                    <td className="p-3">{money(Number(f.discount))}</td>
                    <td className="p-3">{f.due_date ? new Date(f.due_date).toLocaleDateString('en-IN') : '—'}</td>
                  </tr>
                ))}
                {data.fees.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-slate-500">No fees assigned yet.</td></tr>}
              </tbody>
            </table>
          </section>

          <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <h2 className="p-3 text-xs font-black uppercase text-slate-500">Payment history</h2>
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 dark:bg-slate-800">
                <tr><th className="p-3">Date</th><th className="p-3">Amount</th><th className="p-3">Method</th><th className="p-3">Reference</th><th className="p-3">Status</th></tr>
              </thead>
              <tbody>
                {data.payments.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="p-3">{new Date(p.paid_at).toLocaleDateString('en-IN')}</td>
                    <td className="p-3 font-bold">{money(Number(p.amount))}</td>
                    <td className="p-3 uppercase">{p.method}</td>
                    <td className="p-3">{p.reference_no || '—'}</td>
                    <td className="p-3 uppercase">{p.status}</td>
                  </tr>
                ))}
                {data.payments.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-slate-500">No payments recorded yet.</td></tr>}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
};

const Card: React.FC<{ label: string; value: string; tone?: string }> = ({ label, value, tone }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
    <p className="text-[10px] font-bold uppercase text-slate-500">{label}</p>
    <p className={`text-lg font-black ${tone ?? 'text-slate-900 dark:text-white'}`}>{value}</p>
  </div>
);
