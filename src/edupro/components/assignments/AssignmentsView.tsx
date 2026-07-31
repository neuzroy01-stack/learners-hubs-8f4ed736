import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  enrollmentsApi,
  assignmentsApi,
  submissionsApi,
  type CloudAssignment,
  type CloudSubmission,
} from '../../services/cloudDb';
import { useCloudQuery } from '../../hooks/useCloudQuery';
import { FileCheck, Calendar, FileText, ExternalLink, X, MessageSquare, Award, Upload } from 'lucide-react';

export const AssignmentsView: React.FC = () => {
  const { currentUser, currentRole } = useAuth();
  const uid = currentUser?.id ?? '';
  const isStudent = currentRole === 'student';
  const isTeacherOrAdmin = currentRole === 'admin' || currentRole === 'super_admin' || currentRole === 'teacher';

  const [selectedAssignment, setSelectedAssignment] = useState<CloudAssignment | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [gradingMarks, setGradingMarks] = useState<number>(0);
  const [gradingFeedback, setGradingFeedback] = useState('');
  const [selectedStudentSubmission, setSelectedStudentSubmission] = useState<CloudSubmission | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const enrolled = useCloudQuery(async () => (uid ? enrollmentsApi.listByStudent(uid) : []), [uid]);
  const courseIds = useMemo(
    () => (enrolled.data ?? []).map((e) => e.course_id),
    [enrolled.data],
  );

  const assignments = useCloudQuery(async () => {
    if (isStudent) return courseIds.length ? assignmentsApi.listForCourses(courseIds) : [];
    return assignmentsApi.listForCourses(courseIds.length ? courseIds : []);
  }, [courseIds.join(',')]);

  const submissions = useCloudQuery(async () => {
    if (!uid) return [];
    return submissionsApi.listByStudent(uid);
  }, [uid]);

  const list = assignments.data ?? [];
  const mySubs = submissions.data ?? [];

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || !currentUser) return;
    setSubmitting(true);
    try {
      await submissionsApi.submit({
        assignment_id: selectedAssignment.id,
        student_id: currentUser.id,
        submission_text: submissionText || null,
        file_url: attachmentUrl || null,
        status: 'submitted',
      });
      await submissions.reload();
      setSubmissionText('');
      setAttachmentUrl('');
      setSelectedAssignment(null);
    } catch (err) {
      alert((err as Error).message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentSubmission) return;
    try {
      await submissionsApi.grade(selectedStudentSubmission.id, gradingMarks, gradingFeedback);
      await submissions.reload();
      setSelectedStudentSubmission(null);
    } catch (err) {
      alert((err as Error).message || 'Grading failed');
    }
  };

  const formatDate = (d: string | null) => (d ? new Date(d).toLocaleDateString('en-IN') : 'No due date');

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <FileCheck className="w-6 h-6 text-emerald-600" />
            <span>Assignments &amp; Academic Evaluation</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Submit coursework, track evaluation grades, and review faculty feedback.
          </p>
        </div>
      </div>

      {enrolled.error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40">
          {enrolled.error}
        </div>
      )}

      {isStudent && courseIds.length === 0 && !enrolled.loading ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-16 text-center text-slate-500 dark:text-slate-400">
          <FileCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-bold">No course assigned yet</p>
          <p className="text-xs mt-1">Assignments will become available after a course is assigned.</p>
        </div>
      ) : assignments.loading ? (
        <div className="p-12 text-center text-sm text-slate-500">Loading assignments…</div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-16 text-center text-slate-500 dark:text-slate-400">
          <FileCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-bold">No assignments yet</p>
          <p className="text-xs mt-1">Assignments will appear here once they are added to your course.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {list.map((asg) => {
            const mySub = mySubs.find((s) => s.assignment_id === asg.id);

            return (
              <div
                key={asg.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      Max Marks: {asg.max_marks}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Due: {formatDate(asg.due_at)}</span>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">{asg.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{asg.instructions}</p>
                </div>

                {isStudent && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Submission Status:</span>
                      {mySub ? (
                        <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                          mySub.status === 'graded'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}>
                          {mySub.status}
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                          Pending
                        </span>
                      )}
                    </div>

                    {mySub?.status === 'graded' && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1">
                        <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                          <span>Score:</span>
                          <span className="text-emerald-500">{mySub.marks_obtained} / {asg.max_marks}</span>
                        </div>
                        {mySub.feedback && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 italic">"{mySub.feedback}"</div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {isTeacherOrAdmin && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Submissions:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-lg">
                      {mySubs.filter((s) => s.assignment_id === asg.id).length} Submissions
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  {asg.attachment_url && (
                    <a href={asg.attachment_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center space-x-1">
                      <FileText className="w-3.5 h-3.5 text-rose-500" />
                      <span>Download Prompt PDF</span>
                    </a>
                  )}

                  <button
                    onClick={() => setSelectedAssignment(asg)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ml-auto"
                  >
                    {isStudent ? (mySub ? 'View / Update Submission' : 'Submit Assignment') : 'Review Submissions'}
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
              <p className="text-xs text-slate-500">Max Marks: {selectedAssignment.max_marks} | Due Date: {formatDate(selectedAssignment.due_at)}</p>
            </div>

            {isStudent ? (
              <form onSubmit={handleStudentSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Text Solution / Explanation</label>
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
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Attachment / Project File URL (PDF, GitHub, Drive Link)</label>
                  <input
                    type="url"
                    value={attachmentUrl}
                    onChange={(e) => setAttachmentUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button type="button" onClick={() => setSelectedAssignment(null)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer disabled:opacity-60">
                    {submitting ? 'Submitting…' : 'Submit Assignment'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Submitted Student Works ({mySubs.filter((s) => s.assignment_id === selectedAssignment.id).length})
                </h4>

                {mySubs.filter((s) => s.assignment_id === selectedAssignment.id).length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                    No submissions received for this assignment yet.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {mySubs.filter((s) => s.assignment_id === selectedAssignment.id).map((sub) => (
                      <div key={sub.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-slate-900 dark:text-white">{sub.student_id}</span>
                          <span className="text-[10px] text-slate-400">{new Date(sub.submitted_at).toLocaleDateString('en-IN')}</span>
                        </div>

                        <p className="text-slate-600 dark:text-slate-300 italic bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                          "{sub.submission_text || 'No text remarks provided'}"
                        </p>

                        <div className="flex items-center justify-between pt-2">
                          {sub.file_url && (
                            <a href={sub.file_url} target="_blank" rel="noreferrer" className="text-blue-500 font-bold hover:underline flex items-center space-x-1">
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>View Submitted Work</span>
                            </a>
                          )}

                          <button
                            onClick={() => {
                              setSelectedStudentSubmission(sub);
                              setGradingMarks(Number(sub.marks_obtained) || 0);
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
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Grade Submission</h3>

            <form onSubmit={handleGradeSubmission} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Marks Obtained (Max: {selectedAssignment?.max_marks})
                </label>
                <input
                  type="number"
                  max={selectedAssignment?.max_marks || 100}
                  value={gradingMarks}
                  onChange={(e) => setGradingMarks(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Faculty Feedback &amp; Critique</label>
                <textarea
                  rows={3}
                  value={gradingFeedback}
                  onChange={(e) => setGradingFeedback(e.target.value)}
                  placeholder="Provide constructive feedback on technical accuracy and formatting..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setSelectedStudentSubmission(null)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer">Save Grade &amp; Feedback</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
