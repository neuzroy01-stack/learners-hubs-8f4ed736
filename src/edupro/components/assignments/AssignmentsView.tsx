import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { Assignment, Submission } from '../../types/lms';
import { useAuth } from '../../context/AuthContext';
import { FileCheck, Plus, Calendar, Clock, Award, Upload, CircleCheck as CheckCircle2, CircleAlert as AlertCircle, FileText, ExternalLink, CreditCard as Edit2, Trash2, X, MessageSquare } from 'lucide-react';

export const AssignmentsView: React.FC = () => {
  const { currentUser, currentRole } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [gradingMarks, setGradingMarks] = useState<number>(0);
  const [gradingFeedback, setGradingFeedback] = useState('');
  const [selectedStudentSubmission, setSelectedStudentSubmission] = useState<Submission | null>(null);

  const isTeacherOrAdmin = currentRole === 'admin' || currentRole === 'super_admin' || currentRole === 'teacher';
  const isStudent = currentRole === 'student';
  const myEnrollments = isStudent ? db.getEnrollments().filter((e) => e.studentId === (db.getStudentByUserId(currentUser?.id || '')?.id || '')) : [];
  const myCourseIds = new Set(myEnrollments.map((e) => e.courseId));
  const hasAssignedCourse = !isStudent || myCourseIds.size > 0;

  useEffect(() => {
    loadAssignments();
    const unsub = db.subscribe(() => loadAssignments());
    return unsub;
  }, []);

  const loadAssignments = () => {
    setAssignments(db.getAssignments());
  };

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || !currentUser) return;

    const submission: Submission = {
      id: `sub-${Date.now()}`,
      assignmentId: selectedAssignment.id,
      studentId: currentUser.id,
      studentName: currentUser.name,
      submittedAt: new Date().toISOString().split('T')[0],
      content: submissionText,
      fileUrl: attachmentUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      status: 'submitted'
    };

    db.submitAssignment(selectedAssignment.id, submission);
    alert('Assignment submitted successfully!');
    setSubmissionText('');
    setAttachmentUrl('');
    setSelectedAssignment(null);
  };

  const handleGradeSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || !selectedStudentSubmission) return;

    const updatedSubmission: Submission = {
      ...selectedStudentSubmission,
      marksObtained: gradingMarks,
      feedback: gradingFeedback,
      status: 'graded'
    };

    db.submitAssignment(selectedAssignment.id, updatedSubmission);
    alert('Grade & Feedback saved!');
    setSelectedStudentSubmission(null);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <FileCheck className="w-6 h-6 text-emerald-600" />
            <span>Assignments & Academic Evaluation</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Submit coursework, track evaluation grades, and review faculty feedback.
          </p>
        </div>

        {isTeacherOrAdmin && (
          <button
            onClick={() => {
              const newAsg: Assignment = {
                id: `asg-${Date.now()}`,
                courseId: 'course-yt-master-101',
                courseTitle: 'YouTube All Creator Master Program 2026',
                batchId: 'batch-yt-1',
                batchName: 'Batch A 2026',
                teacherId: 'usr-teacher',
                teacherName: currentUser?.name || 'Faculty Lead',
                title: 'Live Case Study: 0-100K Subscriber Channel Growth Blueprint',
                description: 'Analyze audience retention graphs, CTR metrics, and create a 30-day content calendar with thumbnail drafts.',
                dueDate: '2026-08-10',
                maxMarks: 100,
                attachmentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                status: 'active',
                submissions: []
              };
              db.saveAssignment(newAsg);
            }}
            className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Assignment</span>
          </button>
        )}
      </div>

      {/* Assignment List */}
      {!hasAssignedCourse ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-16 text-center text-slate-500 dark:text-slate-400">
          <FileCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-bold">No course assigned yet</p>
          <p className="text-xs mt-1">Assignments will become available after a course is assigned.</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {assignments.map((asg) => {
          const mySubmission = isStudent && currentUser ? asg.submissions.find((s) => s.studentId === currentUser.id) : null;

          return (
            <div
              key={asg.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    Max Marks: {asg.maxMarks}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Due: {asg.dueDate}</span>
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">{asg.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{asg.description}</p>
              </div>

              {/* Status Section for Student */}
              {isStudent && (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Submission Status:</span>
                    {mySubmission ? (
                      <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                        mySubmission.status === 'graded'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      }`}>
                        {mySubmission.status}
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                        Pending
                      </span>
                    )}
                  </div>

                  {mySubmission?.status === 'graded' && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1">
                      <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                        <span>Score:</span>
                        <span className="text-emerald-500">{mySubmission.marksObtained} / {asg.maxMarks}</span>
                      </div>
                      {mySubmission.feedback && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                          "{mySubmission.feedback}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Status for Teacher/Admin */}
              {isTeacherOrAdmin && (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Total Submissions Received:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-lg">
                    {asg.submissions.length} Submissions
                  </span>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                {asg.attachmentUrl && (
                  <a
                    href={asg.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center space-x-1"
                  >
                    <FileText className="w-3.5 h-3.5 text-rose-500" />
                    <span>Download Prompt PDF</span>
                  </a>
                )}

                <button
                  onClick={() => setSelectedAssignment(asg)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ml-auto"
                >
                  {isStudent ? (mySubmission ? 'View / Update Submission' : 'Submit Assignment') : 'Review & Grade Submissions'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Submission Modal for Student or Grading Drawer for Admin */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative space-y-6">
            <button
              onClick={() => setSelectedAssignment(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedAssignment.title}</h3>
              <p className="text-xs text-slate-500">Max Marks: {selectedAssignment.maxMarks} | Due Date: {selectedAssignment.dueDate}</p>
            </div>

            {isStudent ? (
              <form onSubmit={handleStudentSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Text Solution / Explanation
                  </label>
                  <textarea
                    rows={4}
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    placeholder="Write your answer breakdown, repository links, or project insights here..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Attachment / Project File URL (PDF, GitHub, Drive Link)
                  </label>
                  <input
                    type="url"
                    value={attachmentUrl}
                    onChange={(e) => setAttachmentUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedAssignment(null)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                  >
                    Submit Assignment
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Submitted Student Works ({selectedAssignment.submissions.length})
                </h4>

                {selectedAssignment.submissions.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                    No submissions received for this assignment yet.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {selectedAssignment.submissions.map((sub) => (
                      <div key={sub.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-slate-900 dark:text-white">{sub.studentName}</span>
                          <span className="text-[10px] text-slate-400">{sub.submittedAt}</span>
                        </div>

                        <p className="text-slate-600 dark:text-slate-300 italic bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                          "{sub.content || 'No text remarks provided'}"
                        </p>

                        <div className="flex items-center justify-between pt-2">
                          <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="text-blue-500 font-bold hover:underline flex items-center space-x-1">
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>View Submitted PDF / Work</span>
                          </a>

                          <button
                            onClick={() => {
                              setSelectedStudentSubmission(sub);
                              setGradingMarks(sub.marksObtained || 0);
                              setGradingFeedback(sub.feedback || '');
                            }}
                            className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                          >
                            Grade Student
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Faculty Grading Modal */}
      {selectedStudentSubmission && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Grade Submission: {selectedStudentSubmission.studentName}
            </h3>

            <form onSubmit={handleGradeSubmission} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Marks Obtained (Max: {selectedAssignment?.maxMarks})
                </label>
                <input
                  type="number"
                  max={selectedAssignment?.maxMarks || 100}
                  value={gradingMarks}
                  onChange={(e) => setGradingMarks(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Faculty Feedback & Critique
                </label>
                <textarea
                  rows={3}
                  value={gradingFeedback}
                  onChange={(e) => setGradingFeedback(e.target.value)}
                  placeholder="Provide constructive feedback on technical accuracy and formatting..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedStudentSubmission(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Save Grade & Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
