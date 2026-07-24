import React from 'react';
import { PaymentRecord } from '../../types/lms';
import { db } from '../../services/db';
import { Printer, X, Download, CheckCircle, ShieldCheck } from 'lucide-react';

interface ReceiptModalProps {
  payment: PaymentRecord | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ payment, onClose }) => {
  if (!payment) return null;

  const settings = db.getSettings();
  const student = db.getStudents().find((s) => s.id === payment.studentId);
  const feeSummary = db.getFeeSummaryForStudent(payment.studentId, payment.enrollmentId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        {/* Modal Controls */}
        <div className="bg-slate-100 dark:bg-slate-800 px-6 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Official Fee Payment Receipt</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <div id="printable-receipt" className="p-8 bg-white text-slate-900 font-sans">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6 mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-2xl shadow-md">
                LH
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                  {settings.name}
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{settings.tagline}</p>
                <p className="text-xs text-slate-500 mt-0.5">{settings.address}</p>
                <p className="text-xs text-slate-500">
                  Email: {settings.contactEmail} • Tel: {settings.phone}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full uppercase tracking-wider mb-2">
                PAID RECEIPT
              </span>
              <p className="text-xs text-slate-500 font-bold uppercase">Receipt No.</p>
              <p className="text-base font-black text-blue-600">{payment.receiptNumber}</p>
              <p className="text-xs text-slate-500 mt-1">Date: {payment.paymentDate}</p>
            </div>
          </div>

          {/* Student & Course Particulars */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 text-xs">
            <div>
              <p className="text-slate-400 font-semibold uppercase text-[10px]">Received From</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{payment.studentName}</p>
              <p className="text-slate-600">Student Code: <strong className="font-semibold">{student?.studentCode || 'N/A'}</strong></p>
              <p className="text-slate-600">Phone: {student?.phone || 'N/A'}</p>
              <p className="text-slate-600">Email: {student?.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold uppercase text-[10px]">Course & Batch Details</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{payment.courseTitle}</p>
              <p className="text-slate-600">Batch: {student?.batchName || 'Standard Batch'}</p>
              <p className="text-slate-600">Payment Mode: <strong className="font-semibold text-slate-800">{payment.paymentMode}</strong></p>
              <p className="text-slate-600">Transaction/UTR: <strong className="font-mono">{payment.transactionId}</strong></p>
            </div>
          </div>

          {/* Fee Table */}
          <table className="w-full text-xs text-left border-collapse mb-6">
            <thead>
              <tr className="bg-slate-900 text-white uppercase text-[10px] tracking-wider">
                <th className="p-2.5 rounded-l-lg">Description</th>
                <th className="p-2.5 text-right">Original Fee</th>
                <th className="p-2.5 text-right">Adjustments</th>
                <th className="p-2.5 text-right rounded-r-lg">Amount Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="p-3 font-medium text-slate-800">
                  Course Tuition Fee Installment Settlement
                  <br />
                  <span className="text-[11px] text-slate-500">{payment.remarks || 'Standard installment payment'}</span>
                </td>
                <td className="p-3 text-right font-mono">
                  {settings.currencySymbol}{feeSummary.originalFee.toLocaleString()}
                </td>
                <td className="p-3 text-right font-mono text-emerald-600 font-medium">
                  {settings.currencySymbol}{feeSummary.discountAmount.toLocaleString()}
                </td>
                <td className="p-3 text-right font-mono font-bold text-slate-900 text-sm">
                  {settings.currencySymbol}{payment.amount.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Fee Summary Ledger Footer */}
          <div className="grid grid-cols-2 gap-6 items-end border-t border-slate-200 pt-4 text-xs">
            <div className="space-y-1">
              <p className="text-slate-500">
                Total Course Fee (Net): <strong className="font-semibold">{settings.currencySymbol}{feeSummary.finalFee.toLocaleString()}</strong>
              </p>
              <p className="text-slate-500">
                Total Paid to Date: <strong className="font-semibold text-emerald-600">{settings.currencySymbol}{feeSummary.totalPaid.toLocaleString()}</strong>
              </p>
              <p className="text-slate-500">
                Remaining Balance Due: <strong className="font-semibold text-rose-600">{settings.currencySymbol}{feeSummary.remainingAmount.toLocaleString()}</strong>
              </p>
            </div>
            <div className="text-right flex flex-col items-end">
              <div className="w-32 h-12 border-b border-slate-400 mb-1 flex items-end justify-center text-[10px] text-slate-400 italic">
                Authorized Signatory
              </div>
              <p className="text-[11px] font-bold text-slate-800">{payment.recordedBy}</p>
              <p className="text-[10px] text-slate-500">Accounts & Finance Division</p>
            </div>
          </div>

          {/* Stamp & Footer */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>System Verified Computer Generated Receipt • No Signature Required</span>
            </div>
            <span>Generated on {new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
