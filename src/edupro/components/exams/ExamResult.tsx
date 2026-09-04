import React from 'react';
import { Award, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import type { CloudQuiz, CloudQuizAttempt } from '../../services/cloudDb';

interface Props {
  quiz: CloudQuiz;
  attempt: CloudQuizAttempt;
  totalQuestions: number;
  onBack: () => void;
}

/** Read-only result page. No retake / restart controls by design. */
export const ExamResult: React.FC<Props> = ({ quiz, attempt, totalQuestions, onBack }) => {
  const correct = attempt.correct_count ?? 0;
  const wrong = attempt.wrong_count ?? 0;
  const blank = attempt.unanswered_count ?? 0;
  const attempted = correct + wrong;
  const total = totalQuestions || correct + wrong + blank;
  const passed = attempt.passed;

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 sm:p-6">
      <button onClick={onBack} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600">
        <ArrowLeft className="h-4 w-4" /> Back to exams
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Award className={`mx-auto h-12 w-12 ${passed ? 'text-emerald-500' : 'text-amber-500'}`} />
        <h1 className="mt-3 text-lg font-black text-slate-900 dark:text-white">{quiz.title}</h1>
        <p className="text-xs text-slate-500">
          Submitted on{' '}
          {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString('en-IN') : '—'}
        </p>
        <div className="mt-4 text-4xl font-black text-indigo-600">{Number(attempt.score ?? 0)}</div>
        <p className="text-xs font-bold text-slate-500">
          out of {quiz.total_marks || '—'} marks · {Number(attempt.percentage ?? 0)}%
        </p>
        {typeof passed === 'boolean' && (
          <span
            className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-black ${
              passed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}
          >
            {passed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
            {passed ? 'PASSED' : 'FAILED'}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total Questions" value={total} />
        <Stat label="Attempted" value={attempted} />
        <Stat label="Correct" value={correct} tone="text-emerald-600" />
        <Stat label="Wrong" value={wrong} tone="text-rose-600" />
      </div>

      <p className="rounded-xl bg-slate-100 p-3 text-center text-[11px] font-bold text-slate-500 dark:bg-slate-800">
        This result is saved permanently. The exam cannot be attempted again.
      </p>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: number; tone?: string }> = ({ label, value, tone }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-3 text-center dark:border-slate-800 dark:bg-slate-900">
    <p className="text-[10px] font-bold uppercase text-slate-500">{label}</p>
    <p className={`text-xl font-black ${tone ?? 'text-slate-900 dark:text-white'}`}>{value}</p>
  </div>
);
