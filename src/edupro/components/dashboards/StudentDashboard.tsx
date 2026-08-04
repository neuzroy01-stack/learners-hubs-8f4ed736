import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { Course, LiveClass, Assignment, Quiz } from '../../types/lms';
import { ReceiptModal } from '../common/ReceiptModal';
import { CertificateModal } from '../common/CertificateModal';
import {
  GraduationCap,
  PlayCircle,
  Radio,
  FileCheck,
  Award,
  CreditCard,
  Clock,
  CheckCircle2,
  Lock,
  ArrowRight,
  Upload,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface StudentDashboardProps {
  onSelectCourse: (course: Course) => void;
  onNavigateTab: (tab: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onSelectCourse, onNavigateTab }) => {
  const { currentUser, studentProfile } = useAuth();
  const [showPaymentProofModal, setShowPaymentProofModal] = useState(false);
  const [uploadAmount, setUploadAmount] = useState('8000');
  const [uploadUtr, setUploadUtr] = useState('UPI/9839100122/PAY');
  const [selectedCertificate, setSelectedCertificate] = useState<any | null>(null);

  const student = studentProfile || db.getStudents()[0];
  const enrollments = db.getEnrollments().filter((e) => e.studentId === student.id);
  const feeSummary = db.getFeeSummaryForStudent(student.id);

  const courses = db.getCourses();
  const enrolledCourses = courses.filter((c) => enrollments.some((e) => e.courseId === c.id));
  const activeCourse = enrolledCourses[0] || courses[0];

  const liveClasses = db.getLiveClasses();
  const myLiveClass = liveClasses.find((l) => l.batchName === student.batchName) || liveClasses[0];

  const assignments = db.getAssignments();
  const quizzes = db.getQuizzes();
  const certificates = db.getCertificates().filter((c) => c.studentId === student.id);
  const settings = db.getSettings();

  const handleUploadPaymentProof = (e: React.FormEvent) => {
    e.preventDefault();
    const enrollment = enrollments[0];
    if (!enrollment) return;

    db.recordPayment({
      id: `pay-${Date.now()}`,
      enrollmentId: enrollment.id,
      studentId: student.id,
      studentName: student.fullName,
      courseTitle: enrollment.courseTitle,
      receiptNumber: `RCP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      amount: Number(uploadAmount),
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMode: 'UPI',
      transactionId: uploadUtr,
      screenshotUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600',
      status: 'pending_verification',
      remarks: 'Student uploaded transaction receipt proof',
      recordedBy: `${student.fullName} (Student)`
    });

    db.logActivity(currentUser?.id || student.userId, student.fullName, 'student', 'UPLOAD_PAYMENT_PROOF', 'Fee Ledger', `Uploaded payment proof of ${uploadAmount}`);
    setShowPaymentProofModal(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Student Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <img
            /* src={student.photoUrl} */
            alt={student.fullName}
            className="w-16 h-16 rounded-2xl object-cover ring-4 ring-blue-500/30 shadow-lg"
          />
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-200 border border-blue-400/30 rounded-full text-xs font-bold">
                {student.studentCode}
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-bold">
                Batch: {student.batchName}
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight mt-1">Welcome back, {student.fullName}!</h1>
            <p className="text-xs text-blue-200 mt-0.5">
              Course: <strong className="font-semibold text-white">{enrollments[0]?.courseTitle || activeCourse?.title}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          {myLiveClass && (
            <a
              href={myLiveClass.meetingLink}
              target="_blank"
              rel="noreferrer"
              className="w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg transition-all animate-pulse"
            >
              <Radio className="w-4 h-4 text-rose-300" />
              <span>Join Live Class Now</span>
            </a>
          )}
        </div>
      </div>

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Course Progress</span>
            <div className="p-2 bg-blue-100 dark:bg-blue-950/50 text-blue-600 rounded-xl">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {enrollments[0]?.progressPercentage || 68}%
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${enrollments[0]?.progressPercentage || 68}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Attendance Log</span>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">88.5%</div>
          <div className="text-[11px] text-slate-400 mt-1">Eligible for Certificate (&gt;85%)</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Pending Fee Balance</span>
            <div className="p-2 bg-rose-100 dark:bg-rose-950/50 text-rose-600 rounded-xl">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-black ${feeSummary.remainingAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {settings.currencySymbol}{feeSummary.remainingAmount.toLocaleString()}
          </div>
          {feeSummary.remainingAmount > 0 ? (
            <button
              onClick={() => setShowPaymentProofModal(true)}
              className="text-[11px] font-bold text-blue-600 hover:underline mt-1 block"
            >
              Upload Payment Receipt Proof →
            </button>
          ) : (
            <div className="text-[11px] text-emerald-600 font-bold mt-1">Fees Fully Settled</div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Certificates Earned</span>
            <div className="p-2 bg-amber-100 dark:bg-amber-950/50 text-amber-600 rounded-xl">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{certificates.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Verified Digital Certificate</div>
        </div>
      </div>

      {/* Enrolled Course & Syllabus Roadmap View */}
      {activeCourse && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 rounded-full text-xs font-bold">
                Active Enrolled Course
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">{activeCourse.title}</h2>
              <p className="text-xs text-slate-500">{activeCourse.description}</p>
            </div>

             <button
              /* onClick={() => onSelectCourse(activeCourse)} */
              /* className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md transition-all cursor-pointer shrink-0" */
            > 
              <PlayCircle className="w-4 h-4" />
             /* <span> Continue Learning </span> */
            </button>
          </div>

          {/* Week-wise & Day-wise Syllabus Roadmap */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Course Roadmap & Syllabus Schedule</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {activeCourse.weeks.map((week) => (
                <div
                  key={week.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-600">Week {week.weekNumber}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{week.topics.length} Daily Topics</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{week.title}</h4>

                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    {week.topics.map((tp) => (
                      <div key={tp.id} className="flex items-start space-x-2 text-xs">
                        <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${tp.isCompleted ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`} />
                        <div>
                          <p className={`font-medium ${tp.isCompleted ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                            Day {tp.dayNumber}: {tp.title}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Upload Payment Proof Modal */}
      {showPaymentProofModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Upload Fee Payment Proof</h3>
            <p className="text-xs text-slate-500">
              Upload UTR transaction reference number and screenshot proof for Academic Admin verification.
            </p>

            <form onSubmit={handleUploadPaymentProof} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Amount Paid ({settings.currencySymbol})</label>
                <input
                  type="number"
                  value={uploadAmount}
                  onChange={(e) => setUploadAmount(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">UTR / Bank Transaction Reference</label>
                <input
                  type="text"
                  value={uploadUtr}
                  onChange={(e) => setUploadUtr(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Upload Payment Screenshot / Receipt</label>
                <input
                  type="file"
                  className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPaymentProofModal(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
                >
                  Submit Payment Proof
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Certificate Modal */}
      <CertificateModal certificate={selectedCertificate} onClose={() => setSelectedCertificate(null)} />
    </div>
  );
};
