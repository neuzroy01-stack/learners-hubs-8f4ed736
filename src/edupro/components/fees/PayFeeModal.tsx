import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { db } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { PaymentRecord } from '../../types/lms';
import { X, Copy, CheckCircle2, Upload, QrCode, CreditCard } from 'lucide-react';

interface Props { onClose: () => void; onSubmitted?: (p: PaymentRecord) => void; }

export const PayFeeModal: React.FC<Props> = ({ onClose, onSubmitted }) => {
  const { currentUser } = useAuth();
  const settings = db.getSettings();
  const upiId = settings.payment?.upiId || '6353504505@slc';
  const holder = settings.payment?.accountHolder || 'Learner Hub';

  const students = db.getStudents();
  const studentProfile = students.find((s) => s.userId === currentUser?.id) || null;
  const enrollments = db.getEnrollments().filter((e) => e.studentId === studentProfile?.id);
  const enrollment = enrollments[0];

  const payments = db.getPayments().filter((p) => p.studentId === studentProfile?.id && p.status !== 'rejected');
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(0, (enrollment?.finalFee || 0) - totalPaid);

  const [amount, setAmount] = useState<number>(remaining || 0);
  const [utr, setUtr] = useState('');
  const [screenshot, setScreenshot] = useState('');
  const [remarks, setRemarks] = useState('');
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const upiUri = useMemo(() => {
    const amt = amount > 0 ? amount : remaining;
    const params = new URLSearchParams({
      pa: upiId,
      pn: holder,
      am: String(amt),
      cu: 'INR',
      tn: `Fee ${studentProfile?.studentCode || ''}`.trim(),
    });
    return `upi://pay?${params.toString()}`;
  }, [upiId, holder, amount, remaining, studentProfile]);

  useEffect(() => {
    QRCode.toDataURL(upiUri, { width: 240, margin: 1 }).then(setQr).catch(() => setQr(''));
  }, [upiUri]);

  const copyUpi = async () => {
    try { await navigator.clipboard.writeText(upiId); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };

  const handleFile = (f?: File) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setScreenshot(String(reader.result || ''));
    reader.readAsDataURL(f);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!studentProfile || !enrollment) { setErr('No active enrollment found.'); return; }
    if (amount <= 0 || amount > remaining) { setErr(`Amount must be between ₹1 and ₹${remaining}.`); return; }
    if (!utr.trim() || utr.trim().length < 6) { setErr('Enter a valid UTR / Transaction Reference (min 6 chars).'); return; }
    const dup = db.checkDuplicateUtr(utr.trim());
    if (dup) { setErr(`This UTR is already used on receipt ${dup.receiptNumber}.`); return; }

    const rec: PaymentRecord = {
      id: `pay-${Date.now()}`,
      enrollmentId: enrollment.id,
      studentId: studentProfile.id,
      studentName: studentProfile.fullName,
      courseTitle: enrollment.courseTitle,
      receiptNumber: `RCP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      amount,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMode: 'UPI',
      transactionId: utr.trim(),
      screenshotUrl: screenshot || undefined,
      status: 'pending_verification',
      remarks: remarks || 'UPI fee installment (pending verification)',
      recordedBy: studentProfile.fullName,
    };
    db.recordPayment(rec);
    db.logActivity(currentUser?.id || 'usr-student', currentUser?.name || 'Student', 'student', 'SUBMIT_PAYMENT', studentProfile.fullName, `Submitted UPI payment ₹${amount} UTR ${utr} (pending verification)`);
    setOk(true);
    onSubmitted?.(rec);
    setTimeout(onClose, 1400);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900">
          <h3 className="font-black text-base flex items-center gap-2"><CreditCard className="w-5 h-5 text-emerald-600" /> Pay Course Fee</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-4 h-4" /></button>
        </div>

        {ok ? (
          <div className="p-10 text-center">
            <CheckCircle2 className="w-14 h-14 mx-auto text-emerald-500" />
            <p className="mt-3 font-black">Payment submitted for verification.</p>
            <p className="text-xs text-slate-500 mt-1">Super Admin will verify your UTR and confirm the receipt shortly.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            <div className="p-5 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 space-y-4">
              <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 p-4 border border-emerald-100 dark:border-emerald-900">
                <div className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300">Remaining Due</div>
                <div className="text-3xl font-black text-emerald-700 dark:text-emerald-300">₹{remaining.toLocaleString()}</div>
                <div className="text-[11px] text-slate-500 mt-1">Total Fee ₹{enrollment?.finalFee.toLocaleString() || 0} · Paid ₹{totalPaid.toLocaleString()}</div>
              </div>

              <div className="text-center">
                <div className="text-[10px] font-bold uppercase text-slate-500 flex items-center justify-center gap-1"><QrCode className="w-3 h-3" /> Scan UPI QR to pay ₹{(amount || remaining).toLocaleString()}</div>
                <div className="mt-2 inline-block p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  {qr ? <img src={qr} alt="UPI QR" className="w-52 h-52" /> : <div className="w-52 h-52 flex items-center justify-center text-slate-400 text-xs">Generating…</div>}
                </div>
                <div className="mt-3 flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-xs">
                  <span className="font-mono font-bold">{upiId}</span>
                  <button type="button" onClick={copyUpi} className="p-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50">
                    {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">Paid to: {holder}</p>
              </div>
            </div>

            <form onSubmit={submit} className="p-5 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Amount to Pay (₹)</label>
                <input type="number" min={1} max={remaining} value={amount} onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))} className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold" />
                <div className="mt-1 flex gap-2">
                  <button type="button" onClick={() => setAmount(remaining)} className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">Full ₹{remaining.toLocaleString()}</button>
                  <button type="button" onClick={() => setAmount(Math.round(remaining / 2))} className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">Half</button>
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">UTR / Transaction Ref *</label>
                <input value={utr} onChange={(e) => setUtr(e.target.value)} placeholder="e.g. 412345678901" className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono" />
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1"><Upload className="w-3.5 h-3.5" /> Payment Screenshot (Optional)</label>
                <input type="file" accept="image/*" onChange={(e) => handleFile(e.target.files?.[0])} className="mt-1 w-full text-[11px]" />
                {screenshot && <img src={screenshot} alt="Proof" className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 max-h-32 object-contain bg-slate-50" />}
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Remarks (Optional)</label>
                <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
              </div>
              {err && <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 p-2.5 text-rose-700 dark:text-rose-300 text-[11px]">{err}</div>}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">Cancel</button>
                <button type="submit" disabled={remaining <= 0} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold">Submit for Verification</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
