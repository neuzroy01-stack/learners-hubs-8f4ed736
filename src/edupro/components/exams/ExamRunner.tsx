import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Clock, ChevronLeft, ChevronRight, Send, TriangleAlert as AlertTriangle } from 'lucide-react';
import { quizzesApi, type CloudQuiz, type CloudQuizAttempt, type ExamPaperQuestion } from '../../services/cloudDb';

interface Props {
  quiz: CloudQuiz;
  attempt: CloudQuizAttempt;
  onFinished: (result: CloudQuizAttempt) => void;
}

const OPTIONS: { key: 'a' | 'b' | 'c' | 'd'; field: keyof ExamPaperQuestion }[] = [
  { key: 'a', field: 'option_a' },
  { key: 'b', field: 'option_b' },
  { key: 'c', field: 'option_c' },
  { key: 'd', field: 'option_d' },
];

const fmt = (secs: number) => {
  const s = Math.max(0, secs);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

/** Dedicated full-screen exam page: paper, timer, navigation and auto-submit. */
export const ExamRunner: React.FC<Props> = ({ quiz, attempt, onFinished }) => {
  const [paper, setPaper] = useState<ExamPaperQuestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>(
    (attempt.answers as Record<string, string>) ?? {},
  );
  const [index, setIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const expiresAt = useMemo(() => new Date(attempt.expires_at).getTime(), [attempt.expires_at]);
  const [remaining, setRemaining] = useState(() => Math.round((expiresAt - Date.now()) / 1000));

  useEffect(() => {
    let alive = true;
    quizzesApi
      .paper(quiz.id)
      .then((rows) => alive && setPaper(rows))
      .catch((e) => alive && setError((e as Error).message));
    return () => { alive = false; };
  }, [quiz.id]);

  const finish = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const result = await quizzesApi.submit(attempt.id, answersRef.current);
      onFinished(result);
    } catch (e) {
      submittedRef.current = false;
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }, [attempt.id, onFinished]);

  // Timer driven by the server-issued expiry, so refreshing cannot extend it.
  useEffect(() => {
    const t = window.setInterval(() => {
      const left = Math.round((expiresAt - Date.now()) / 1000);
      setRemaining(left);
      if (left <= 0) void finish();
    }, 1000);
    return () => window.clearInterval(t);
  }, [expiresAt, finish]);

  // Persist answers periodically so a crash/expiry keeps what was answered.
  useEffect(() => {
    const t = window.setInterval(() => {
      if (!submittedRef.current) void quizzesApi.saveAnswers(attempt.id, answersRef.current).catch(() => undefined);
    }, 15000);
    return () => window.clearInterval(t);
  }, [attempt.id]);

  const locked = remaining <= 0 || submitting;
  const q = paper?.[index];
  const answeredCount = paper ? paper.filter((row) => answers[row.id]).length : 0;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
        <div>
          <h1 className="text-sm font-black text-slate-900 dark:text-white sm:text-base">{quiz.title}</h1>
          <p className="text-[11px] text-slate-500">
            {paper ? `${paper.length} questions` : 'Loading paper…'} · {quiz.total_marks || 0} marks · Attempt #{attempt.attempt_no}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 rounded-xl px-3 py-2 font-mono text-sm font-black ${remaining <= 60 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'}`}>
            <Clock className="h-4 w-4" /> {fmt(remaining)}
          </div>
          <button
            onClick={() => void finish()}
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            <Send className="h-3.5 w-3.5" /> {submitting ? 'Submitting…' : 'Submit Exam'}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-4 p-4 sm:p-6">
        {error && (
          <p className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700">
            <AlertTriangle className="h-4 w-4" /> {error}
          </p>
        )}

        {paper && paper.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
            This exam has no questions yet.
          </p>
        )}

        {q && (
          <>
            <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
              {paper!.map((row, i) => (
                <button
                  key={row.id}
                  onClick={() => setIndex(i)}
                  className={`h-8 w-8 shrink-0 rounded-lg text-[11px] font-black ${
                    i === index
                      ? 'bg-indigo-600 text-white'
                      : answers[row.id]
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'border border-slate-200 bg-white text-slate-500 dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-[11px] font-black uppercase text-slate-400">
                Question {index + 1} of {paper!.length} · {q.marks} mark{q.marks === 1 ? '' : 's'}
              </p>
              <h2 className="mt-2 text-sm font-bold leading-relaxed text-slate-900 dark:text-white">{q.prompt}</h2>
              <div className="mt-4 space-y-2">
                {OPTIONS.map((opt) => {
                  const text = String(q[opt.field] ?? '');
                  const active = answers[q.id] === opt.key;
                  return (
                    <button
                      key={opt.key}
                      disabled={locked}
                      onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt.key }))}
                      className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left text-xs disabled:opacity-60 ${
                        active
                          ? 'border-indigo-500 bg-indigo-50 font-bold dark:bg-indigo-950/40'
                          : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                      }`}
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-[10px] font-black uppercase">
                        {opt.key}
                      </span>
                      <span>{text}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 flex items-center justify-between gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  onClick={() => setIndex((i) => Math.max(0, i - 1))}
                  disabled={index === 0}
                  className="flex items-center gap-1 rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold disabled:opacity-40 dark:border-slate-700"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </button>
                <span className="text-[11px] font-bold text-slate-500">{answeredCount}/{paper!.length} answered</span>
                {index < paper!.length - 1 ? (
                  <button
                    onClick={() => setIndex((i) => Math.min(paper!.length - 1, i + 1))}
                    className="flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white"
                  >
                    Next <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => void finish()}
                    disabled={submitting}
                    className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
                  >
                    {submitting ? 'Submitting…' : 'Finish & Submit'}
                  </button>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};
