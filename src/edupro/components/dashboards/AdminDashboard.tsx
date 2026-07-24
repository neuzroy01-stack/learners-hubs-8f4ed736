import React, { useState } from 'react';
import { db } from '../../services/db';
import { PaymentRecord, StudentProfile } from '../../types/lms';
import { ReceiptModal } from '../common/ReceiptModal';
import {
  GraduationCap,
  BookOpen,
  CreditCard,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  UserPlus,
  Radio,
  FileCheck,
  XCircle,
  Eye,
  AlertCircle
} from 'lucide-react';

export const AdminDashboard: React.FC<{
  onNavigateTab: (tab: string) => void;
}> = ({ onNavigateTab }) => {
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState<PaymentRecord | null>(null);
  const [selectedProof, setSelectedProof] = useState<PaymentRecord | null>(null);

  const students = db.getStudents();
  const courses = db.getCourses();
  const batches = db.getBatches();
  const payments = db.getPayments();
  const liveClasses = db.getLiveClasses();
  const settings = db.getSettings();

  const pendingPayments = payments.filter((p) => p.status === 'pending_verification');
  const approvedPayments = payments.filter((p) => p.status === 'approved');
  const totalCollected = approvedPayments.reduce((sum, p) => sum + p.amount, 0);

  const handleApprovePayment = (payment: PaymentRecord) => {
    payment.status = 'approved';
    payment.verifiedAt = new Date().toISOString();
    db.recordPayment(payment);
    db.logActivity('usr-admin', 'Marcus Sterling', 'admin', 'APPROVE_PAYMENT', payment.studentName, `Approved payment receipt #${payment.receiptNumber} of ${payment.amount}`);
    setSelectedProof(null);
  };

  const handleRejectPayment = (payment: PaymentRecord) => {
    payment.status = 'rejected';
    db.recordPayment(payment);
    setSelectedProof(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-blue-200 text-xs font-semibold uppercase tracking-wider">Academic Operations Hub</span>
          <h1 className="text-2xl font-black tracking-tight mt-0.5">Academic Administrator Dashboard</h1>
          <p className="text-xs text-blue-100 mt-1">
            Manage student admissions, course enrollments, fee verification, live class scheduling, and academic reports.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigateTab('students')}
            className="px-4 py-2 bg-white text-blue-900 hover:bg-blue-50 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Admissions & Enroll</span>
          </button>
          <button
            onClick={() => onNavigateTab('fees')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md transition-all cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>Fee Ledger</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Active Students</span>
            <div className="p-2 bg-blue-100 dark:bg-blue-950/50 text-blue-600 rounded-xl">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{students.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">{batches.length} Active Batches</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Fee Revenue</span>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 rounded-xl">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {settings.currencySymbol}{totalCollected.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">{approvedPayments.length} Approved Payments</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Payment Verification Queue</span>
            <div className="p-2 bg-amber-100 dark:bg-amber-950/50 text-amber-600 rounded-xl">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600">{pendingPayments.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Pending student UTR proofs</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Live Classes Scheduled</span>
            <div className="p-2 bg-purple-100 dark:bg-purple-950/50 text-purple-600 rounded-xl">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{liveClasses.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Google Meet / Zoom links</div>
        </div>
      </div>

      {/* Payment Proof Verification Banner */}
      {pendingPayments.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Action Needed: Student Fee Payment Proof Uploads ({pendingPayments.length})
              </h3>
            </div>
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Verify UTR & Approve</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingPayments.map((p) => (
              <div
                key={p.id}
                className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{p.studentName}</p>
                  <p className="text-[11px] text-slate-500">{p.courseTitle}</p>
                  <p className="text-xs font-black text-emerald-600 mt-1">
                    {settings.currencySymbol}{p.amount.toLocaleString()} ({p.paymentMode})
                  </p>
                  <p className="text-[10px] font-mono text-slate-400">UTR: {p.transactionId}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedProof(p)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Proof</span>
                  </button>
                  <button
                    onClick={() => handleApprovePayment(p)}
                    className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                    title="Approve Payment"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Admissions & Payments Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Admissions */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Student Admissions</h3>
            <button
              onClick={() => onNavigateTab('students')}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              View All Students →
            </button>
          </div>

          <div className="space-y-3">
            {students.slice(0, 4).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <img src={s.photoUrl} alt={s.fullName} className="w-9 h-9 rounded-xl object-cover" />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{s.fullName}</div>
                    <div className="text-[10px] text-slate-500">{s.studentCode} • {s.batchName}</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-full text-[10px] font-bold">
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Approved Receipts Ledger */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Approved Payment Receipts</h3>
            <button
              onClick={() => onNavigateTab('fees')}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Fee Ledger →
            </button>
          </div>

          <div className="space-y-3">
            {approvedPayments.slice(0, 4).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">{p.studentName}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{p.receiptNumber} • {p.paymentMode}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-emerald-600">{settings.currencySymbol}{p.amount.toLocaleString()}</div>
                  <button
                    onClick={() => setSelectedReceiptPayment(p)}
                    className="text-[10px] text-blue-600 font-semibold hover:underline"
                  >
                    Print Receipt
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Proof Modal Inspector */}
      {selectedProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Verify Payment Proof Screenshot</h3>
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl space-y-1 text-xs">
              <p>Student: <strong className="font-bold">{selectedProof.studentName}</strong></p>
              <p>Amount: <strong className="text-emerald-600 font-bold">{settings.currencySymbol}{selectedProof.amount.toLocaleString()}</strong></p>
              <p>UTR Transaction ID: <strong className="font-mono font-bold">{selectedProof.transactionId}</strong></p>
            </div>

            {selectedProof.screenshotUrl ? (
              <img
                src={selectedProof.screenshotUrl}
                alt="Payment Proof"
                className="w-full h-48 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div className="p-8 text-center bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-400">
                No screenshot attached. UTR verified electronically.
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => handleRejectPayment(selectedProof)}
                className="px-4 py-2 bg-rose-100 text-rose-800 hover:bg-rose-200 rounded-xl text-xs font-bold"
              >
                Reject
              </button>
              <button
                onClick={() => handleApprovePayment(selectedProof)}
                className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-bold"
              >
                Approve Payment & Issue Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      <ReceiptModal payment={selectedReceiptPayment} onClose={() => setSelectedReceiptPayment(null)} />
    </div>
  );
};
