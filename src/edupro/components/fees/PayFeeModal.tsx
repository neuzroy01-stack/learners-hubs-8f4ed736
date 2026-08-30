import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { X, Copy, CheckCircle2, Upload, QrCode, CreditCard } from 'lucide-react';
import { paymentProofs, studentEnrollments, submitPaymentRequest } from '../../services/cloudDb';
import { useCloudQuery } from '../../hooks/useCloudQuery';
import { useAuth } from '../../context/AuthContext';

const UPI_ID = '6353504505@slc';
const PAYEE = 'Learner Hub';

interface Props {
  outstanding: number;
  onClose: () => void;
  onSubmitted?: () => void | Promise<void>;
}

/**
 * Student UPI payment request. Nothing is deducted here — the row is created
 * with status `pending` and only an admin verification applies it to the ledger.
 */
export const PayFeeModal: React.FC<Props> = ({ outstanding, onClose, onSubmitted }) => {
  const { currentUser } = useAuth();
  const uid = currentUser?.id ?? '';
  const enrollments = useCloudQuery(async () => (uid ? studentEnrollments(uid) : []), [uid]);

  const [enrollmentId, setEnrollmentId] = useState('');
  const [amount, setAmount] = useState<number>(outstanding);
  const [utr, setUtr] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [note, setNote] = useState('');
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);

  const upiUri = useMemo(() => {
    const params = new URLSearchParams({
      pa: UPI_ID,
      pn: PAYEE,
      am: String(amount > 0 ? amount : outstanding),
      cu: 'INR',
      tn: 'Course fee payment',
    });
    return `upi://pay?${params.toString()}`;
  }, [amount, outstanding]);

  useEffect(() => {
    QRCode.toDataURL(upiUri, { width: 240, margin: 1 }).then(setQr).catch(() => setQr(''));
  }, [upiUri]);

  const copyUpi = async () => {
    try {
      await navigator.clipboard.writeText(UPI_ID);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const pickFile = (f?: File) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!uid) return setErr('Please sign in again.');
    if (!Number.isFinite(amount) || amount <= 0 || amount > outstanding) {
      return setErr(`Amount must be between ₹1 and ₹${outstanding.toLocaleString('en-IN')}.`);
    }
    if (utr.trim().length < 6) return setErr('Enter a valid UTR / transaction reference (min 6 characters).');

    setBusy(true);
    try {
      let proofPath: string | null = null;
      if (file) proofPath = await paymentProofs.upload(uid, file);
      const enrollment = (enrollments.data ?? []).find((en) => en.id === enrollmentId);
      await submitPaymentRequest({
        studentId: uid,
        enrollmentId: enrollment?.id ?? null,
        courseId: enrollment?.course_id ?? null,
        amount,
        utr: utr.trim(),
        note: note.trim() || null,
        proofPath,
      });
      setOk(true);
      await onSubmitted?.();
      setTimeout(onClose, 1600);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Could not submit the payment request.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="flex items-center gap-2 text-base font-black">
            <CreditCard className="h-5 w-5 text-emerald-600" /> Pay Course Fee
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        {ok ? (
          <div className="p-10 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
            <p className="mt-3 font-black">Payment submitted — pending review.</p>
            <p className="mt-1 text-xs text-slate-500">
              Your balance will update as soon as the Super Admin verifies the UTR.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="space-y-4 border-b border-slate-200 p-5 dark:border-slate-800 md:border-b-0 md:border-r">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
                <div className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300">Pending amount</div>
                <div className="text-3xl font-black text-emerald-700 dark:text-emerald-300">
                  ₹{outstanding.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase text-slate-500">
                  <QrCode className="h-3 w-3" /> Scan to pay ₹{(amount || outstanding).toLocaleString('en-IN')}
                </div>
                <div className="mt-2 inline-block rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                  {qr ? (
                    <img src={qr} alt="UPI payment QR code" className="h-52 w-52" />
                  ) : (
                    <div className="flex h-52 w-52 items-center justify-center text-xs text-slate-400">Generating…</div>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs dark:bg-slate-800">
                  <span className="font-mono font-bold">{UPI_ID}</span>
                  <button
                    type="button"
                    onClick={copyUpi}
                    className="rounded-md border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900"
                    aria-label="Copy UPI ID"
                  >
                    {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <p className="mt-2 text-[10px] text-slate-400">Paid to: {PAYEE}</p>
              </div>
            </div>

            <form onSubmit={submit} className="space-y-3 p-5 text-xs">
              {(enrollments.data ?? []).length > 0 && (
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300" htmlFor="pf-course">Course</label>
                  <select
                    id="pf-course"
                    value={enrollmentId}
                    onChange={(e) => setEnrollmentId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="">General fee</option>
                    {(enrollments.data ?? []).map((en) => (
                      <option key={en.id} value={en.id}>{en.title}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300" htmlFor="pf-amt">Amount paid (₹)</label>
                <input
                  id="pf-amt"
                  type="number"
                  min={1}
                  max={outstanding}
                  value={amount}
                  onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono font-bold dark:border-slate-700 dark:bg-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setAmount(outstanding)}
                  className="mt-1 rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold dark:bg-slate-800"
                >
                  Full ₹{outstanding.toLocaleString('en-IN')}
                </button>
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300" htmlFor="pf-utr">UTR / Transaction ID *</label>
                <input
                  id="pf-utr"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  placeholder="e.g. 412345678901"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300" htmlFor="pf-file">
                  <Upload className="h-3.5 w-3.5" /> Payment screenshot (recommended)
                </label>
                <input
                  id="pf-file"
                  type="file"
                  accept="image/*"
                  onChange={(e) => pickFile(e.target.files?.[0])}
                  className="mt-1 w-full text-[11px]"
                />
                {preview && <img src={preview} alt="Payment proof preview" className="mt-2 max-h-32 w-full rounded-xl border border-slate-200 object-contain dark:border-slate-700" />}
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300" htmlFor="pf-note">Remarks (optional)</label>
                <textarea
                  id="pf-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              {err && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-[11px] text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                  {err}
                </div>
              )}
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-2 dark:border-slate-800">
                <button type="button" onClick={onClose} className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold dark:bg-slate-800">Cancel</button>
                <button
                  type="submit"
                  disabled={busy || outstanding <= 0}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  {busy ? 'Submitting…' : 'Submit payment'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
