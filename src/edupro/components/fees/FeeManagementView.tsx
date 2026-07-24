import React, { useState } from 'react';
import { db } from '../../services/db';
import { PaymentRecord, StaffSalaryRecord } from '../../types/lms';
import { useAuth } from '../../context/AuthContext';
import { ReceiptModal } from '../common/ReceiptModal';
import { PayFeeModal } from './PayFeeModal';

import {
  CreditCard,
  Plus,
  Search,
  Printer,
  DollarSign,
  TrendingUp,
  AlertCircle,
  FileText,
  CheckCircle2,
  Check,
  X,
  Users,
  ShieldCheck,
  CheckCircle,
  Clock,
  Building,
  Calendar,
  Eye,
  RotateCcw
} from 'lucide-react';

export const FeeManagementView: React.FC = () => {
  const { currentUser, currentRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'ledger' | 'verification' | 'salaries'>('ledger');
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentRecord | null>(null);
  const [selectedPayslip, setSelectedPayslip] = useState<StaffSalaryRecord | null>(null);
  const [showPayFeeModal, setShowPayFeeModal] = useState(false);


  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [verificationModalPayment, setVerificationModalPayment] = useState<PaymentRecord | null>(null);
  const [verifyRemarks, setVerifyRemarks] = useState('');

  // Record Payment Form (Clean defaults per requirement 2)
  const [payStudentId, setPayStudentId] = useState('');
  const [payAmount, setPayAmount] = useState<number | ''>(0);
  const [payMode, setPayMode] = useState<'Cash' | 'UPI' | 'Net Banking' | 'Credit Card' | 'Cheque'>('UPI');
  const [payUtr, setPayUtr] = useState('');
  const [payRemarks, setPayRemarks] = useState('');

  // Adjustment Form (Clean defaults per requirement 3)
  const [adjStudentId, setAdjStudentId] = useState('');
  const [adjType, setAdjType] = useState<'extra_charge' | 'discount' | 'late_fee' | 'scholarship'>('discount');
  const [adjAmount, setAdjAmount] = useState<number | ''>(0);
  const [adjReason, setAdjReason] = useState('');

  // Salary Form
  const [salTeacherId, setSalTeacherId] = useState('');
  const [salMonth, setSalMonth] = useState('July 2026');
  const [salBase, setSalBase] = useState(85000);
  const [salBonus, setSalBonus] = useState(0);
  const [salDeductions, setSalDeductions] = useState(0);
  const [salMode, setSalMode] = useState('Bank Transfer (NEFT)');
  const [salUtr, setSalUtr] = useState('');
  const [salRemarks, setSalRemarks] = useState('');

  const students = db.getStudents();
  const teachers = db.getTeachers();
  const enrollments = db.getEnrollments();
  const payments = db.getPayments();
  const settings = db.getSettings();
  const salaries = db.getStaffSalaries();

  const isStudent = currentRole === 'student';
  const isAdmin = currentRole === 'admin' || currentRole === 'super_admin';

  // Security RLS filter for student
  const studentProfile = isStudent ? students.find((s) => s.userId === currentUser?.id) : null;
  const filteredPayments = isStudent
    ? payments.filter((p) => p.studentId === studentProfile?.id)
    : payments;

  const pendingPayments = payments.filter((p) => p.status === 'pending_verification');
  const approvedPayments = filteredPayments.filter((p) => p.status === 'approved');
  const totalRevenue = approvedPayments.reduce((sum, p) => sum + p.amount, 0);

  // Initialize student IDs on load
  React.useEffect(() => {
    if (isStudent && studentProfile) {
      setPayStudentId(studentProfile.id);
      setAdjStudentId(studentProfile.id);
    } else if (students.length > 0) {
      setPayStudentId(students[0].id);
      setAdjStudentId(students[0].id);
    }
    if (teachers.length > 0) {
      setSalTeacherId(teachers[0].id);
    }
  }, [isStudent, studentProfile, students, teachers]);

  const openRecordPaymentModal = () => {
    if (isStudent) {
      setShowPayFeeModal(true);
      return;
    }
    setPayAmount(0);
    setPayUtr('');
    setPayRemarks('');
    if (students.length > 0 && !payStudentId) {
      setPayStudentId(students[0].id);
    }
    setShowRecordPaymentModal(true);
  };


  const openAdjustmentModal = () => {
    setAdjAmount(0);
    setAdjReason('');
    if (isStudent && studentProfile) {
      setAdjStudentId(studentProfile.id);
    } else if (students.length > 0 && !adjStudentId) {
      setAdjStudentId(students[0].id);
    }
    setShowAdjustmentModal(true);
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const student = isStudent ? studentProfile : (students.find((s) => s.id === payStudentId) || students[0]);
    if (!student) return;

    const enrollment = enrollments.find((e) => e.studentId === student.id) || enrollments[0];
    const receiptNumber = `RCP-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      enrollmentId: enrollment?.id || 'enr-default',
      studentId: student.id,
      studentName: student.fullName,
      courseTitle: enrollment?.courseTitle || 'Full-Stack MERN Enterprise Engineering',
      receiptNumber,
      amount: Number(payAmount) || 0,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMode: payMode,
      transactionId: payUtr || 'N/A',
      status: isStudent ? 'pending_verification' : 'approved',
      remarks: payRemarks || 'Fee Payment',
      recordedBy: currentUser?.name || 'Academic Admin',
      verifiedAt: isStudent ? undefined : new Date().toISOString()
    };

    db.recordPayment(newPayment);
    db.logActivity(
      currentUser?.id || 'usr-admin',
      currentUser?.name || 'Admin',
      currentRole,
      'RECORD_PAYMENT',
      student.fullName,
      `Recorded payment of ${settings.currencySymbol}${payAmount} (${receiptNumber})`
    );

    setShowRecordPaymentModal(false);
    setSelectedReceipt(newPayment);
  };

  const handleAddAdjustmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const student = isStudent ? studentProfile : (students.find((s) => s.id === adjStudentId) || students[0]);
    if (!student) return;

    const enrollment = enrollments.find((e) => e.studentId === student.id) || enrollments[0];
    const isDiscount = adjType === 'discount' || adjType === 'scholarship';
    const numAmount = Number(adjAmount) || 0;
    const finalAmount = isDiscount ? -Math.abs(numAmount) : Math.abs(numAmount);

    db.addFeeAdjustment({
      id: `adj-${Date.now()}`,
      enrollmentId: enrollment?.id || 'enr-default',
      studentId: student.id,
      type: adjType,
      amount: finalAmount,
      reason: adjReason || 'Fee Adjustment',
      date: new Date().toISOString().split('T')[0],
      createdBy: currentUser?.name || 'Academic Admin'
    });

    db.logActivity(
      currentUser?.id || 'usr-admin',
      currentUser?.name || 'Admin',
      currentRole,
      'FEE_ADJUSTMENT',
      student.fullName,
      `Applied ${adjType} of ${settings.currencySymbol}${adjAmount}`
    );

    setShowAdjustmentModal(false);
  };

  const handleVerifyPayment = (status: 'approved' | 'rejected' | 'pending_verification') => {
    if (!verificationModalPayment) return;
    db.verifyPayment(
      verificationModalPayment.id,
      status,
      verifyRemarks,
      currentUser?.name || 'Super Admin'
    );
    setVerificationModalPayment(null);
    setVerifyRemarks('');
  };

  const handleRecordSalarySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const teacher = teachers.find((t) => t.id === salTeacherId) || teachers[0];
    if (!teacher) return;

    const net = (Number(salBase) || 0) + (Number(salBonus) || 0) - (Number(salDeductions) || 0);

    const salaryRec: StaffSalaryRecord = {
      id: `sal-${Date.now()}`,
      teacherId: teacher.id,
      teacherName: teacher.fullName,
      monthYear: salMonth,
      baseSalary: Number(salBase) || 0,
      bonus: Number(salBonus) || 0,
      deductions: Number(salDeductions) || 0,
      netSalary: net,
      paidAmount: net,
      pendingSalary: 0,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMode: salMode,
      transactionId: salUtr || `NEFT-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'paid',
      remarks: salRemarks || 'Monthly Payroll Cleared'
    };

    db.saveStaffSalary(salaryRec);
    db.logActivity(
      currentUser?.id || 'usr-admin',
      currentUser?.name || 'Admin',
      currentRole,
      'RECORD_SALARY',
      teacher.fullName,
      `Disbursed salary payout of ${settings.currencySymbol}${net} for ${salMonth}`
    );

    setShowSalaryModal(false);
    setSelectedPayslip(salaryRec);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Controls */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center space-x-2">
            <CreditCard className="w-6 h-6 text-emerald-600" />
            <span>Fee Ledger, Payments & Staff Payroll</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isStudent
              ? 'View your payment receipts, fee ledger statement, and submit installment payments.'
              : 'Record student fee receipts, verify online payment submissions, and manage staff salary disbursement.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isStudent && (
            <button
              onClick={openAdjustmentModal}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-purple-600" />
              <span>Apply Discount / Adjustment</span>
            </button>
          )}

          <button
            onClick={openRecordPaymentModal}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isStudent ? 'Pay Fee Installment' : 'Record Fee Payment'}</span>
          </button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'ledger'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Payment Ledger ({filteredPayments.length})</span>
        </button>

        {isAdmin && (
          <>
            <button
              onClick={() => setActiveTab('verification')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer relative ${
                activeTab === 'verification'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Fee Verification Queue</span>
              {pendingPayments.length > 0 && (
                <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-black rounded-full animate-pulse">
                  {pendingPayments.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('salaries')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                activeTab === 'salaries'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Staff Salary & Payroll</span>
            </button>
          </>
        )}
      </div>

      {/* Financial Summary Stat Cards */}
      {activeTab !== 'salaries' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold text-slate-500">Total Settled Collections</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {settings.currencySymbol}{totalRevenue.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">{approvedPayments.length} Approved Receipts</div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold text-slate-500">Enrolled Course Total Value</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {settings.currencySymbol}
              {(isStudent && studentProfile
                ? enrollments.filter((e) => e.studentId === studentProfile.id)
                : enrollments
              ).reduce((sum, e) => sum + e.finalFee, 0).toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {isStudent ? 'Your Course Enrollment' : `${enrollments.length} Active Student Enrollments`}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold text-slate-500">Outstanding Balance Due</span>
            <div className="text-2xl font-black text-rose-600 mt-1">
              {settings.currencySymbol}
              {Math.max(
                0,
                (isStudent && studentProfile
                  ? enrollments.filter((e) => e.studentId === studentProfile.id)
                  : enrollments
                ).reduce((sum, e) => sum + e.finalFee, 0) - totalRevenue
              ).toLocaleString()}
            </div>
            <div className="text-[11px] text-rose-500 font-bold mt-1">Pending Clearance</div>
          </div>
        </div>
      )}

      {/* TAB 1: Payment History Ledger */}
      {activeTab === 'ledger' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Payment Receipts & Transaction Ledger</h3>
            <span className="text-xs text-slate-400 font-semibold">{filteredPayments.length} Records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">Receipt No.</th>
                  {!isStudent && <th className="p-3.5">Student Name</th>}
                  <th className="p-3.5">Course Title</th>
                  <th className="p-3.5">Amount Paid</th>
                  <th className="p-3.5">Mode / UTR</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No payment transaction records found.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-blue-600 dark:text-blue-400">{p.receiptNumber}</td>
                      {!isStudent && <td className="p-3.5 font-bold text-slate-900 dark:text-white">{p.studentName}</td>}
                      <td className="p-3.5 text-slate-600 dark:text-slate-300">{p.courseTitle}</td>
                      <td className="p-3.5 font-mono font-bold text-emerald-600">
                        {settings.currencySymbol}{p.amount.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-slate-500 dark:text-slate-400">
                        <div className="font-semibold">{p.paymentMode}</div>
                        <div className="text-[10px] font-mono">{p.transactionId}</div>
                      </td>
                      <td className="p-3.5 text-slate-400">{p.paymentDate}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            p.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : p.status === 'pending_verification'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {p.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setSelectedReceipt(p)}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 rounded-lg text-xs font-semibold flex items-center space-x-1 ml-auto cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Receipt</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Fee Verification Queue (Admin Only) */}
      {activeTab === 'verification' && isAdmin && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-amber-500" />
                <span>Pending Payment Verification Queue</span>
              </h3>
              <p className="text-xs text-slate-500">Verify online UPI/NEFT transaction proofs uploaded by students.</p>
            </div>
            <span className="px-3 py-1 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-xs font-extrabold rounded-full">
              {pendingPayments.length} Pending Approvals
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingPayments.length === 0 ? (
              <div className="col-span-2 p-12 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">All Pending Receipts Verified!</p>
                <p className="text-xs text-slate-400 mt-1">There are no pending student fee submissions waiting for verification.</p>
              </div>
            ) : (
              pendingPayments.map((p) => (
                <div key={p.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-blue-600">{p.receiptNumber}</span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{p.studentName}</h4>
                      <p className="text-xs text-slate-500">{p.courseTitle}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-emerald-600">{settings.currencySymbol}{p.amount.toLocaleString()}</span>
                      <div className="text-[10px] text-slate-400">{p.paymentDate}</div>
                    </div>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Payment Mode:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{p.paymentMode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">UTR / Transaction ID:</span>
                      <span className="font-mono font-bold text-blue-600">{p.transactionId}</span>
                    </div>
                    {p.remarks && (
                      <div className="flex justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-slate-400 font-semibold">Remarks:</span>
                        <span className="text-slate-600 dark:text-slate-300">{p.remarks}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <button
                      onClick={() => {
                        setVerificationModalPayment(p);
                        setVerifyRemarks('Approved after verifying UTR bank statement');
                      }}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                    >
                      Approve Payment
                    </button>
                    <button
                      onClick={() => {
                        setVerificationModalPayment(p);
                        setVerifyRemarks('Invalid UTR / Transaction ID missing from bank records');
                      }}
                      className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                    >
                      Reject Submission
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Staff Salary Module (Requirement 8) */}
      {activeTab === 'salaries' && isAdmin && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>Faculty & Staff Salary Payroll Desk</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Process monthly faculty salaries, record bonuses, track pending disbursements, and print payslips.
              </p>
            </div>

            <button
              onClick={() => {
                setSalBase(85000);
                setSalBonus(0);
                setSalDeductions(0);
                setSalUtr('');
                setSalRemarks('');
                setShowSalaryModal(true);
              }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record Salary Disbursal</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Monthly Payroll Records</h4>
              <span className="text-xs text-slate-400 font-mono">{salaries.length} Salary Vouchers</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">Faculty / Staff Name</th>
                    <th className="p-3.5">Month & Year</th>
                    <th className="p-3.5">Base Salary</th>
                    <th className="p-3.5">Bonus / Incentives</th>
                    <th className="p-3.5">Net Disbursed</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {salaries.map((sal) => (
                    <tr key={sal.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">{sal.teacherName}</td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-300 font-semibold">{sal.monthYear}</td>
                      <td className="p-3.5 font-mono text-slate-600">{settings.currencySymbol}{sal.baseSalary.toLocaleString()}</td>
                      <td className="p-3.5 font-mono text-emerald-600 font-bold">+{settings.currencySymbol}{sal.bonus.toLocaleString()}</td>
                      <td className="p-3.5 font-mono font-black text-indigo-600">{settings.currencySymbol}{sal.netSalary.toLocaleString()}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            sal.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {sal.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setSelectedPayslip(sal)}
                          className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300 rounded-lg text-xs font-semibold flex items-center space-x-1 ml-auto cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Payslip</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showRecordPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isStudent ? 'Pay Fee Installment' : 'Record Fee Payment'}
              </h3>
              <button onClick={() => setShowRecordPaymentModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-3 text-xs">
              {/* REQUIREMENT 1 & 2: Remove Select Student for Student Role */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Student</label>
                {isStudent ? (
                  <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700">
                    {studentProfile?.fullName} ({studentProfile?.studentCode})
                  </div>
                ) : (
                  <select
                    value={payStudentId}
                    onChange={(e) => setPayStudentId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    required
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>{s.fullName} ({s.studentCode})</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Amount ({settings.currencySymbol})
                </label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Payment Mode</label>
                  <select
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    <option value="UPI">UPI / PhonePe / GPay</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">UTR / Transaction ID</label>
                  <input
                    type="text"
                    value={payUtr}
                    onChange={(e) => setPayUtr(e.target.value)}
                    placeholder="Enter UPI / NEFT Ref No."
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Remarks</label>
                <input
                  type="text"
                  value={payRemarks}
                  onChange={(e) => setPayRemarks(e.target.value)}
                  placeholder="Optional remarks or installment details"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRecordPaymentModal(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Submit Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fee Adjustment Modal */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Apply Fee Adjustment / Discount</h3>
              <button onClick={() => setShowAdjustmentModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAdjustmentSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Student</label>
                {isStudent ? (
                  <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700">
                    {studentProfile?.fullName} ({studentProfile?.studentCode})
                  </div>
                ) : (
                  <select
                    value={adjStudentId}
                    onChange={(e) => setAdjStudentId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    required
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>{s.fullName} ({s.studentCode})</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Adjustment Type</label>
                  <select
                    value={adjType}
                    onChange={(e) => setAdjType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    <option value="discount">Discount Coupon</option>
                    <option value="scholarship">Scholarship Award</option>
                    <option value="extra_charge">Extra Course Charge</option>
                    <option value="late_fee">Late Fee Penalty</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Amount ({settings.currencySymbol})</label>
                  <input
                    type="number"
                    value={adjAmount}
                    onChange={(e) => setAdjAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Reason / Note</label>
                <input
                  type="text"
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  placeholder="Reason for discount or adjustment"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAdjustmentModal(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Apply Fee Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Salary Modal */}
      {showSalaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Record Faculty Salary Disbursal</h3>
              <button onClick={() => setShowSalaryModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordSalarySubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Faculty / Staff Member</label>
                <select
                  value={salTeacherId}
                  onChange={(e) => setSalTeacherId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  required
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.fullName} ({t.designation})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Month & Year</label>
                  <input
                    type="text"
                    value={salMonth}
                    onChange={(e) => setSalMonth(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Base Salary ({settings.currencySymbol})</label>
                  <input
                    type="number"
                    value={salBase}
                    onChange={(e) => setSalBase(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Bonus / Allowances ({settings.currencySymbol})</label>
                  <input
                    type="number"
                    value={salBonus}
                    onChange={(e) => setSalBonus(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-emerald-600 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Deductions ({settings.currencySymbol})</label>
                  <input
                    type="number"
                    value={salDeductions}
                    onChange={(e) => setSalDeductions(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-rose-600 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Payment Mode</label>
                  <select
                    value={salMode}
                    onChange={(e) => setSalMode(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    <option value="Bank Transfer (NEFT)">Bank Transfer (NEFT)</option>
                    <option value="UPI">UPI</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">NEFT / Ref UTR</label>
                  <input
                    type="text"
                    value={salUtr}
                    onChange={(e) => setSalUtr(e.target.value)}
                    placeholder="Bank Ref No."
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Remarks</label>
                <input
                  type="text"
                  value={salRemarks}
                  onChange={(e) => setSalRemarks(e.target.value)}
                  placeholder="Monthly payroll note"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSalaryModal(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Disburse & Generate Payslip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verification Action Modal */}
      {verificationModalPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Verify Payment Submission</h3>
            <p className="text-xs text-slate-500">
              Receipt No: <span className="font-mono font-bold text-blue-600">{verificationModalPayment.receiptNumber}</span> for student <strong className="text-slate-800 dark:text-slate-200">{verificationModalPayment.studentName}</strong>.
            </p>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 text-xs mb-1">Verification Remarks / Admin Notes</label>
              <textarea
                value={verifyRemarks}
                onChange={(e) => setVerifyRemarks(e.target.value)}
                rows={3}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setVerificationModalPayment(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleVerifyPayment('rejected')}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Reject Receipt
              </button>
              <button
                onClick={() => handleVerifyPayment('approved')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Approve Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payslip Print Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-white text-slate-900 rounded-2xl p-8 shadow-2xl space-y-6">
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900">{settings.name}</h2>
                <p className="text-xs text-slate-500">Faculty Salary Payment Advice & Payslip</p>
              </div>
              <button onClick={() => setSelectedPayslip(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px]">Employee Name</p>
                <p className="font-extrabold text-slate-900 text-sm mt-0.5">{selectedPayslip.teacherName}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px]">Payroll Period</p>
                <p className="font-extrabold text-slate-900 text-sm mt-0.5">{selectedPayslip.monthYear}</p>
              </div>
            </div>

            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[10px] uppercase tracking-wider">
                  <th className="p-2.5 rounded-l-lg">Component</th>
                  <th className="p-2.5 text-right rounded-r-lg">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-2.5 font-semibold">Basic Salary</td>
                  <td className="p-2.5 text-right font-mono">{settings.currencySymbol}{selectedPayslip.baseSalary.toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-emerald-600">Performance Bonus & Allowances</td>
                  <td className="p-2.5 text-right font-mono text-emerald-600">+{settings.currencySymbol}{selectedPayslip.bonus.toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-rose-600">Deductions (TDS / Leave)</td>
                  <td className="p-2.5 text-right font-mono text-rose-600">-{settings.currencySymbol}{selectedPayslip.deductions.toLocaleString()}</td>
                </tr>
                <tr className="bg-slate-100 font-bold text-sm">
                  <td className="p-3 text-slate-900">Net Salary Disbursed</td>
                  <td className="p-3 text-right font-mono text-indigo-600">{settings.currencySymbol}{selectedPayslip.netSalary.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs">
              <div>
                <p className="text-slate-400 text-[10px]">Payment Mode: {selectedPayslip.paymentMode}</p>
                <p className="text-slate-400 text-[10px] font-mono">Ref: {selectedPayslip.transactionId}</p>
              </div>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center space-x-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Payslip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      <ReceiptModal payment={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
      {showPayFeeModal && <PayFeeModal onClose={() => setShowPayFeeModal(false)} />}

    </div>
  );
};
