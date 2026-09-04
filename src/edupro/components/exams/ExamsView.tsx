import React, { useMemo, useState } from 'react';
import { Award, Plus, Pencil, Trash2, RefreshCw, X, Clock, ListChecks, Lock } from 'lucide-react';
import {
  quizzesApi,
  type CloudQuiz,
  type CloudQuizAttempt,
  type CloudQuizQuestion,
} from '../../services/cloudDb';
import { useCloudQuery } from '../../hooks/useCloudQuery';
import { useCourseScope } from '../../hooks/useCourseScope';
import { useFeedback } from '../common/Feedback';
import { ExamRunner } from './ExamRunner';
import { ExamResult } from './ExamResult';

type QuizForm = {
  id?: string;
  title: string;
  description: string;
  time_limit_minutes: number;
  total_marks: number;
  passing_marks: number;
  max_attempts: number;
  is_published: boolean;
};

const emptyQuiz = (): QuizForm => ({
  title: '',
  description: '',
  time_limit_minutes: 30,
  total_marks: 0,
  passing_marks: 0,
  max_attempts: 1,
  is_published: false,
});

/** Exam hub: staff manage papers, students take them on a dedicated page. */
export const ExamsView: React.FC = () => {
  const { notify, confirm } = useFeedback();
  const { courses, canManage, uid, loading: coursesLoading } = useCourseScope();

  const [courseId, setCourseId] = useState('');
  const activeCourseId = courseId || courses[0]?.id || '';

  const { data, loading, error, reload } = useCloudQuery(async () => {
    if (!activeCourseId || !uid) return null;
    const quizzes = await quizzesApi.listByCourses([activeCourseId]);
    const attempts = await quizzesApi.attemptsByStudent(uid);
    return { quizzes, attempts };
  }, [activeCourseId, uid]);

  const quizzes = useMemo(() => data?.quizzes ?? [], [data]);
  const attempts = useMemo(() => data?.attempts ?? [], [data]);

  const [running, setRunning] = useState<{ quiz: CloudQuiz; attempt: CloudQuizAttempt } | null>(null);
  const [result, setResult] = useState<{ quiz: CloudQuiz; attempt: CloudQuizAttempt; total: number } | null>(null);
  const [starting, setStarting] = useState<string | null>(null);

  const [quizForm, setQuizForm] = useState<QuizForm | null>(null);
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [questionsFor, setQuestionsFor] = useState<CloudQuiz | null>(null);

  const attemptsFor = (quizId: string) => attempts.filter((a) => a.quiz_id === quizId);

  const startExam = async (quiz: CloudQuiz) => {
    setStarting(quiz.id);
    try {
      const attempt = await quizzesApi.start(quiz.id);
      if (attempt.status !== 'in_progress') {
        setResult({ quiz, attempt, total: 0 });
      } else {
        setRunning({ quiz, attempt });
      }
    } catch (e) {
      notify('error', 'Could not start exam', (e as Error).message);
      await reload();
    } finally {
      setStarting(null);
    }
  };

  const saveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizForm || !activeCourseId) return;
    if (!quizForm.title.trim()) return notify('error', 'Title is required');
    setSavingQuiz(true);
    try {
      const payload = {
        course_id: activeCourseId,
        title: quizForm.title.trim(),
        description: quizForm.description.trim() || null,
        time_limit_minutes: Math.max(1, quizForm.time_limit_minutes),
        total_marks: Math.max(0, quizForm.total_marks),
        passing_marks: Math.max(0, quizForm.passing_marks),
        max_attempts: Math.max(1, quizForm.max_attempts),
        is_published: quizForm.is_published,
      };
      if (quizForm.id) await quizzesApi.update(quizForm.id, payload);
      else await quizzesApi.create(payload);
      notify('success', quizForm.id ? 'Exam updated' : 'Exam created');
      setQuizForm(null);
      await reload();
    } catch (e2) {
      notify('error', 'Could not save exam', (e2 as Error).message);
    } finally {
      setSavingQuiz(false);
    }
  };

  const removeQuiz = async (quiz: CloudQuiz) => {
    const res = await confirm({ title: 'Delete exam?', message: `"${quiz.title}" and its questions will be removed.`, tone: 'danger', confirmLabel: 'Delete' });
    if (!res.ok) return;
    try {
      await quizzesApi.remove(quiz.id);
      notify('success', 'Exam deleted');
      await reload();
    } catch (e) {
      notify('error', 'Could not delete', (e as Error).message);
    }
  };

  if (running) {
    return (
      <ExamRunner
        quiz={running.quiz}
        attempt={running.attempt}
        onFinished={(res) => {
          setRunning(null);
          setResult({ quiz: running.quiz, attempt: res, total: 0 });
          void reload();
        }}
      />
    );
  }

  if (result) {
    return (
      <ExamResult
        quiz={result.quiz}
        attempt={result.attempt}
        totalQuestions={result.total}
        onBack={() => setResult(null)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-extrabold text-slate-900 dark:text-white">
            <Award className="h-6 w-6 text-indigo-600" /> Exams & Tests
          </h2>
          <p className="mt-1 text-xs text-slate-500">Timed online exams with automatic scoring and saved results.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => void reload()} className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold dark:border-slate-700">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {canManage && activeCourseId && (
            <button onClick={() => setQuizForm(emptyQuiz())} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700">
              <Plus className="h-4 w-4" /> New Exam
            </button>
          )}
        </div>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <label className="text-[11px] font-black uppercase text-slate-500">Course</label>
        <select
          value={activeCourseId}
          onChange={(e) => setCourseId(e.target.value)}
          className={`mt-1 w-full ${inputCls}`}
        >
          {courses.length === 0 && <option value="">{coursesLoading ? 'Loading…' : 'No courses available'}</option>}
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      {error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      <div className="space-y-3">
        {quizzes.map((quiz) => {
          const mine = attemptsFor(quiz.id);
          const submitted = mine.find((a) => a.status !== 'in_progress');
          const inProgress = mine.find((a) => a.status === 'in_progress');
          const exhausted = mine.length >= quiz.max_attempts;
          return (
            <article key={quiz.id} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">{quiz.title}</h3>
                  {quiz.description && <p className="mt-1 text-xs text-slate-500">{quiz.description}</p>}
                  <p className="mt-2 flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-500">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {quiz.time_limit_minutes} min</span>
                    <span>{quiz.total_marks} marks</span>
                    <span>Pass: {quiz.passing_marks}</span>
                    <span>Attempts: {quiz.max_attempts}</span>
                    {!quiz.is_published && <span className="text-amber-600">Draft</span>}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {canManage ? (
                    <>
                      <button onClick={() => setQuestionsFor(quiz)} className="flex items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-2 text-[11px] font-bold dark:border-slate-700">
                        <ListChecks className="h-3.5 w-3.5" /> Questions
                      </button>
                      <button
                        onClick={() =>
                          setQuizForm({
                            id: quiz.id,
                            title: quiz.title,
                            description: quiz.description ?? '',
                            time_limit_minutes: quiz.time_limit_minutes,
                            total_marks: quiz.total_marks,
                            passing_marks: quiz.passing_marks,
                            max_attempts: quiz.max_attempts,
                            is_published: quiz.is_published,
                          })
                        }
                        className="flex items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-2 text-[11px] font-bold dark:border-slate-700"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button onClick={() => void removeQuiz(quiz)} className="flex items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-2 text-[11px] font-bold text-rose-600 dark:border-rose-900">
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </>
                  ) : submitted && exhausted ? (
                    <button
                      onClick={() => setResult({ quiz, attempt: submitted, total: 0 })}
                      className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white dark:bg-slate-100 dark:text-slate-900"
                    >
                      View Result
                    </button>
                  ) : exhausted ? (
                    <span className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-[11px] font-bold text-slate-500 dark:bg-slate-800">
                      <Lock className="h-3.5 w-3.5" /> No attempts left
                    </span>
                  ) : (
                    <button
                      onClick={() => void startExam(quiz)}
                      disabled={starting === quiz.id}
                      className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                      {starting === quiz.id ? 'Opening…' : inProgress ? 'Resume Exam' : 'Start Exam'}
                    </button>
                  )}
                </div>
              </div>

              {!canManage && submitted && (
                <button
                  onClick={() => setResult({ quiz, attempt: submitted, total: 0 })}
                  className="mt-3 block text-[11px] font-bold text-indigo-600 hover:underline"
                >
                  Score {Number(submitted.score ?? 0)} / {quiz.total_marks} · {Number(submitted.percentage ?? 0)}% — view result →
                </button>
              )}
            </article>
          );
        })}

        {!loading && quizzes.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700">
            No exams for this course yet.
          </p>
        )}
      </div>

      {quizForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4">
          <form onSubmit={saveQuiz} className="w-full max-w-lg space-y-3 rounded-2xl bg-white p-6 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black">{quizForm.id ? 'Edit exam' : 'New exam'}</h3>
              <button type="button" onClick={() => setQuizForm(null)}><X className="h-4 w-4" /></button>
            </div>
            <Field label="Title"><input value={quizForm.title} onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })} className={inputCls} /></Field>
            <Field label="Description"><textarea rows={2} value={quizForm.description} onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })} className={inputCls} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Duration (minutes)"><input type="number" min={1} value={quizForm.time_limit_minutes} onChange={(e) => setQuizForm({ ...quizForm, time_limit_minutes: Number(e.target.value) || 1 })} className={inputCls} /></Field>
              <Field label="Total marks"><input type="number" min={0} value={quizForm.total_marks} onChange={(e) => setQuizForm({ ...quizForm, total_marks: Number(e.target.value) || 0 })} className={inputCls} /></Field>
              <Field label="Passing marks"><input type="number" min={0} value={quizForm.passing_marks} onChange={(e) => setQuizForm({ ...quizForm, passing_marks: Number(e.target.value) || 0 })} className={inputCls} /></Field>
              <Field label="Max attempts"><input type="number" min={1} value={quizForm.max_attempts} onChange={(e) => setQuizForm({ ...quizForm, max_attempts: Number(e.target.value) || 1 })} className={inputCls} /></Field>
            </div>
            <label className="flex items-center gap-2 text-xs font-bold">
              <input type="checkbox" checked={quizForm.is_published} onChange={(e) => setQuizForm({ ...quizForm, is_published: e.target.checked })} />
              Published (visible to enrolled students)
            </label>
            <button disabled={savingQuiz} className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white disabled:opacity-60">
              {savingQuiz ? 'Saving…' : 'Save exam'}
            </button>
          </form>
        </div>
      )}

      {questionsFor && (
        <QuestionManager quiz={questionsFor} onClose={() => setQuestionsFor(null)} />
      )}
    </div>
  );
};

/* --------------------------- staff question editor --------------------------- */

const emptyQuestion = () => ({
  id: undefined as string | undefined,
  prompt: '',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_option: 'a',
  marks: 1,
});

const QuestionManager: React.FC<{ quiz: CloudQuiz; onClose: () => void }> = ({ quiz, onClose }) => {
  const { notify, confirm } = useFeedback();
  const { data, loading, reload } = useCloudQuery(async () => quizzesApi.questions(quiz.id), [quiz.id]);
  const questions = (data ?? []) as CloudQuizQuestion[];
  const [form, setForm] = useState(emptyQuestion());
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.prompt.trim()) return notify('error', 'Question text is required');
    setSaving(true);
    try {
      await quizzesApi.saveQuestion({
        id: form.id,
        quiz_id: quiz.id,
        prompt: form.prompt.trim(),
        option_a: form.option_a,
        option_b: form.option_b,
        option_c: form.option_c,
        option_d: form.option_d,
        correct_option: form.correct_option,
        marks: Math.max(1, form.marks),
        sort_order: form.id ? undefined as unknown as number : questions.length + 1,
      });
      setForm(emptyQuestion());
      notify('success', 'Question saved');
      await reload();
    } catch (e2) {
      notify('error', 'Could not save question', (e2 as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (q: CloudQuizQuestion) => {
    const res = await confirm({ title: 'Delete question?', message: q.prompt, tone: 'danger', confirmLabel: 'Delete' });
    if (!res.ok) return;
    await quizzesApi.removeQuestion(q.id);
    await reload();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 p-4">
      <div className="mx-auto w-full max-w-3xl space-y-4 rounded-2xl bg-white p-6 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black">Questions · {quiz.title}</h3>
          <button onClick={onClose}><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-2">
          {loading && <p className="text-xs text-slate-500">Loading…</p>}
          {questions.map((q, i) => (
            <div key={q.id} className="rounded-xl border border-slate-200 p-3 text-xs dark:border-slate-800">
              <div className="flex items-start justify-between gap-3">
                <p className="font-bold">{i + 1}. {q.prompt}</p>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() =>
                      setForm({
                        id: q.id,
                        prompt: q.prompt,
                        option_a: q.option_a,
                        option_b: q.option_b,
                        option_c: q.option_c,
                        option_d: q.option_d,
                        correct_option: q.correct_option,
                        marks: q.marks,
                      })
                    }
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => void remove(q)}><Trash2 className="h-3.5 w-3.5 text-rose-600" /></button>
                </div>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                a) {q.option_a} · b) {q.option_b} · c) {q.option_c} · d) {q.option_d} — correct: {q.correct_option.toUpperCase()} · {q.marks} mark(s)
              </p>
            </div>
          ))}
          {!loading && questions.length === 0 && <p className="text-xs text-slate-500">No questions yet.</p>}
        </div>

        <form onSubmit={save} className="space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <Field label={form.id ? 'Edit question' : 'New question'}>
            <textarea rows={2} value={form.prompt} onChange={(e) => setForm({ ...form, prompt: e.target.value })} className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Option A"><input value={form.option_a} onChange={(e) => setForm({ ...form, option_a: e.target.value })} className={inputCls} /></Field>
            <Field label="Option B"><input value={form.option_b} onChange={(e) => setForm({ ...form, option_b: e.target.value })} className={inputCls} /></Field>
            <Field label="Option C"><input value={form.option_c} onChange={(e) => setForm({ ...form, option_c: e.target.value })} className={inputCls} /></Field>
            <Field label="Option D"><input value={form.option_d} onChange={(e) => setForm({ ...form, option_d: e.target.value })} className={inputCls} /></Field>
            <Field label="Correct option">
              <select value={form.correct_option} onChange={(e) => setForm({ ...form, correct_option: e.target.value })} className={inputCls}>
                <option value="a">A</option><option value="b">B</option><option value="c">C</option><option value="d">D</option>
              </select>
            </Field>
            <Field label="Marks"><input type="number" min={1} value={form.marks} onChange={(e) => setForm({ ...form, marks: Number(e.target.value) || 1 })} className={inputCls} /></Field>
          </div>
          <div className="flex gap-2">
            <button disabled={saving} className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-60">
              {saving ? 'Saving…' : form.id ? 'Update question' : 'Add question'}
            </button>
            {form.id && (
              <button type="button" onClick={() => setForm(emptyQuestion())} className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold dark:border-slate-700">
                Cancel edit
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800';

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="text-[11px] font-black uppercase text-slate-500">{label}</label>
    <div className="mt-1">{children}</div>
  </div>
);
