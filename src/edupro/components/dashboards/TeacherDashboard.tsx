import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { Assignment, Submission, LiveClass } from '../../types/lms';
import {
  BookOpen,
  Users,
  Radio,
  FileCheck,
  FolderDown,
  Clock,
  CheckCircle2,
  Calendar,
  DollarSign,
  Plus,
  Upload,
  Award
} from 'lucide-react';

export const TeacherDashboard: React.FC<{
  onNavigateTab: (tab: string) => void;
}> = ({ onNavigateTab }) => {
  const { teacherProfile, currentUser } = useAuth();
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(90);
  const [gradeFeedback, setGradeFeedback] = useState<string>('Great effort! Clean code structure.');

  const courses = db.getCourses();
  const batches = db.getBatches();
  const liveClasses = db.getLiveClasses();
  const assignments = db.getAssignments();
  const studyMaterials = db.getStudyMaterials();
  const salaries = db.getStaffSalaries();
  const settings = db.getSettings();

  const teacherBatches = batches.filter((b) => b.teacherId === teacherProfile?.id || b.teacherName.includes(teacherProfile?.fullName || 'Sharma'));
  const myLiveClasses = liveClasses.filter((l) => l.teacherId === teacherProfile?.id || l.teacherName.includes(teacherProfile?.fullName || 'Sharma'));
  const myAssignments = assignments.filter((a) => a.teacherId === teacherProfile?.id || a.teacherName.includes(teacherProfile?.fullName || 'Sharma'));
  const mySalaryRecords = salaries.filter((s) => s.teacherId === teacherProfile?.id || s.teacherName.includes(teacherProfile?.fullName || 'Sharma'));

  const pendingSubmissions = myAssignments.flatMap((a) =>
    a.submissions.filter((s) => s.status === 'submitted').map((sub) => ({ assignment: a, submission: sub }))
  );

  const handleGradeSubmission = (asgId: string, subStudentId: string) => {
    const asg = assignments.find((a) => a.id === asgId);
    if (!asg) return;

    const submission: Submission = {
      id: `sub-${Date.now()}`,
      assignmentId: asgId,
      studentId: subStudentId,
      studentName: 'Rahul Verma',
      submittedAt: new Date().toISOString(),
      content: 'Submitted student project code',
      marksObtained: gradeScore,
      feedback: gradeFeedback,
      status: 'graded'
    };

    db.submitAssignment(asgId, submission);
    db.logActivity(currentUser?.id || 'tch-1', teacherProfile?.fullName || 'Teacher', 'teacher', 'GRADE_ASSIGNMENT', asg.title, `Graded submission with ${gradeScore} marks`);
    setSelectedAssignment(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Faculty Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-emerald-300 text-xs font-semibold uppercase tracking-wider">Faculty Portal</span>
          <h1 className="text-2xl font-black tracking-tight mt-0.5">Welcome, {teacherProfile?.fullName || 'Dr. Rajesh Sharma'}</h1>
          <p className="text-xs text-emerald-100 mt-1">
            {teacherProfile?.designation || 'Senior Lead Instructor'} • Specialization: {teacherProfile?.subjectSpecialization || 'Full Stack Web Development'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigateTab('attendance_marker')}
            className="px-4 py-2 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md transition-all cursor-pointer"
          >
            <Users className="w-4 h-4" />
            <span>Mark Batch Attendance</span>
          </button>
          <button
            onClick={() => onNavigateTab('study_materials')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md transition-all cursor-pointer"
          >
            <FolderDown className="w-4 h-4" />
            <span>Upload Materials</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Assigned Batches</span>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 rounded-xl">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{teacherBatches.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Active Teaching Batches</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Live Classes Today</span>
            <div className="p-2 bg-purple-100 dark:bg-purple-950/50 text-purple-600 rounded-xl">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{myLiveClasses.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Scheduled Live Workshops</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Pending Assignment Reviews</span>
            <div className="p-2 bg-amber-100 dark:bg-amber-950/50 text-amber-600 rounded-xl">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600">{pendingSubmissions.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Student submissions to grade</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Monthly Salary Base</span>
            <div className="p-2 bg-blue-100 dark:bg-blue-950/50 text-blue-600 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {settings.currencySymbol}{(teacherProfile?.monthlySalary || 85000).toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">Disbursed on 1st of month</div>
        </div>
      </div>

      {/* Teaching Roadmap & Scheduled Live Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Teaching Roadmap */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Today's & Tomorrow's Teaching Roadmap</h3>
            </div>
            <span className="text-xs text-slate-400 font-semibold">Week 2 Syllabus</span>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl">
              <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-md uppercase tracking-wider">
                TODAY'S LECTURE TOPIC
              </span>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1.5">
                Async/Await, Axios HTTP Client & Node.js Event Loop Microtasks
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                Batch: Full Stack MERN Alpha • Timing: 10:00 AM - 12:00 PM IST
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl">
              <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold rounded-md uppercase tracking-wider">
                TOMORROW'S TOPIC
              </span>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1.5">
                Express Routing Architecture, Controllers & JWT Auth Middleware
              </h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Batch: Full Stack MERN Alpha • Timing: 10:00 AM - 12:00 PM IST
              </p>
            </div>
          </div>
        </div>

        {/* Live Classes Join & Launch */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Radio className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Scheduled Live Classes</h3>
            </div>
            <span className="text-xs text-purple-600 font-bold">{myLiveClasses.length} Scheduled</span>
          </div>

          <div className="space-y-3">
            {myLiveClasses.map((lc) => (
              <div
                key={lc.id}
                className="p-3.5 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 rounded-xl flex items-center justify-between"
              >
                <div>
                  <span className="px-2 py-0.5 bg-purple-600 text-white text-[10px] font-bold rounded-full uppercase">
                    {lc.status}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">{lc.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{lc.batchName} • {lc.date} @ {lc.startTime}</p>
                </div>

                <a
                  href={lc.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm shrink-0 ml-2"
                >
                  Join Meeting
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pending Student Assignment Reviews Queue */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <FileCheck className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Pending Student Submissions to Review</h3>
          </div>
          <span className="text-xs text-amber-600 font-semibold">{pendingSubmissions.length} Submissions Pending</span>
        </div>

        {pendingSubmissions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">All student submissions graded!</div>
        ) : (
          <div className="space-y-3">
            {pendingSubmissions.map(({ assignment, submission }) => (
              <div
                key={submission.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{assignment.title}</h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                    Student: <strong className="font-bold">{submission.studentName}</strong> • Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-slate-500 italic mt-1 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                    "{submission.content}"
                  </p>
                </div>

                <button
                  onClick={() => setSelectedAssignment(assignment)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0"
                >
                  Grade Submission
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grade Submission Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Grade Student Submission</h3>
            <p className="text-xs text-slate-500">{selectedAssignment.title}</p>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Marks Obtained (Max: {selectedAssignment.maxMarks})
              </label>
              <input
                type="number"
                value={gradeScore}
                onChange={(e) => setGradeScore(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Instructor Remarks & Feedback
              </label>
              <textarea
                value={gradeFeedback}
                onChange={(e) => setGradeFeedback(e.target.value)}
                rows={3}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setSelectedAssignment(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleGradeSubmission(selectedAssignment.id, 'stu-1')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
              >
                Submit Grade & Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
