import React, { useEffect, useMemo, useState } from 'react';
import {
  Award, Plus, Pencil, Trash2, RefreshCw, X, Clock, ListChecks, CircleCheck as CheckCircle2, CircleAlert as AlertCircle,
} from 'lucide-react';
import {
  quizzesApi,
  type CloudQuiz,
  type CloudQuizAttempt,
  type CloudQuizQuestion,
  type QuizPaperQuestion,
} from '../../services/cloudDb';
import { useCloudQuery } from '../../hooks/useCloudQuery';
import { useCourseScope } from '../../hooks/useCourseScope';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../common/Feedback';
import { RichText } from '../common/RichText';
import { toAppInput, appInputToIso, formatAppDateTime } from '../../lib/datetime';

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800';

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="text-[11px] font-black uppercase text-slate-500">{label}</label>
    <div className="mt-1">{children}</div>
  </div>
);

type QuizForm = {
  id?: string;
  title: string;
  description: string;
  week_number: string;
  time_limit_minutes: string;
  total_marks: string;
  passing_marks: string;
  starts_at: string;
  ends_at: string;
  max_attempts: string;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  show_result_immediately: boolean;
  is_published: boolean;
};

const emptyQuiz = (): QuizForm => ({
  title: '',
  description: '',
  week_number: '',
  time_limit_minutes: '30',
  total_marks: '0',
  passing_marks: '0',
  starts_at: '',
  ends_at: '',
  max_attempts: '1',
  shuffle_questions: false,
  shuffle_options: false,
  show_result_immediately: true,
  is_published: false,
});

/**
 * Objective quiz / online exam module.
 * Everything that decides a score lives in the database: students never receive
 * the answer key, and the timer, attempt limit and evaluation run server-side.
 */
export const QuizzesView: React.FC = () => {
  const { notify, confirm } = useFeedback();
  const { currentUser } = useAuth();
  const { courses, canManage, loading: coursesLoading } = useCourseScope();

  const [courseId, setCourseId] = useState('');
  const activeCourseId = courseId || courses[0]?.id || '';

  const { data, loading, error, reload } = useCloudQuery(
    async () => (activeCourseId ? quizzesApi.listByCourse(activeCourseId) : []),
    [activeCourseId],
  );
  const quizzes = useMemo(() => (data ?? []) as CloudQuiz[], [data]);

  const [form, setForm] = useState<QuizForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [questionsFor, setQuestionsFor] = useState<CloudQuiz | null>(null);
  const [attemptQuiz, setAttemptQuiz] = useState<CloudQuiz | null>(null);

  const openEdit = (q: CloudQuiz) =>
    setForm({
      id: q.id,
      title: q.title,
      description: q.description ?? '',
      week_number: q.week_number ? String(q.week_number) : '',
      time_limit_minutes: String(q.time_limit_minutes),
      total_marks: String(q.total_marks),
      passing_marks: String(q.passing_marks),
      starts_at: toAppInput(q.starts_at),
      ends_at: toAppInput(q.ends_at),
      max_attempts: String(q.max_attempts),
      shuffle_questions: q.shuffle_questions,
      shuffle_options: q.shuffle_options,
      show_result_immediately: q.show_result_immediately,
      is_published: q.is_published,
    });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !activeCourseId) return;
    if (!form.title.trim()) return notify('error', 'Title is required');
    setSaving(true);
    try {
      const payload = {
        course_id: activeCourseId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        week_number: form.week_number ? Number(form.week_number) : null,
        time_limit_minutes: Math.max(1, Number(form.time_limit_minutes) || 30),
        total_marks: Math.max(0, Number(form.total_marks) || 0),
        passing_marks: Math.max(0, Number(form.passing_marks) || 0),
        starts_at: appInputToIso(form.starts_at),
        ends_at: appInputToIso(form.ends_at),
        max_attempts: Math.max(1, Number(form.max_attempts) || 1),
        shuffle_questions: form.shuffle_questions,
        shuffle_options: form.shuffle_options,
        show_result_immediately: form.show_result_immediately,
        is_published: form.is_published,
        created_by: currentUser?.id ?? null,
      };
      if (form.id) await quizzesApi.update(form.id, payload);
      else await quizzesApi.create(payload);
      notify('success', form.id ? 'Quiz updated' : 'Quiz created');
      setForm(null);
      await reload();
    } catch (err) {
      notify('error', 'Could not save quiz', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (q: CloudQuiz) => {
    const res = await confirm({
      title: 'Delete quiz?',
      message: `"${q.title}" and all its questions and attempts will be removed.`,
      tone: 'danger',
      confirmLabel: 'Delete',
    });
    if (!res.ok) return;
    try {
      await quizzesApi.remove(q.id);
      notify('success', 'Quiz deleted');
      await reload();
    } catch (err) {
      notify('error', 'Could not delete', (err as Error).message);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-extrabold text-slate-900 dark:text-white">
            <Award className="h-6 w-6 text-violet-600" /> Quizzes &amp; Online Exams
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Objective MCQ tests with a server-side timer and automatic evaluation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => void reload()} className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold dark:border-slate-700">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {canManage && activeCourseId && (
            <button onClick={() => setForm(emptyQuiz())} className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-violet-700">
              <Plus className="h-4 w-4" /> New Quiz
            </button>
          )}
        </div>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <label className="text-[11px] font-black uppercase text-slate-500">Course</label>
        <select value={activeCourseId} onChange={(e) => setCourseId(e.target.value)} className={`mt-1 ${inputCls}`}>
          {courses.length === 0 && <option value="">{coursesLoading ? 'Loading…' : 'No courses available'}</option>}
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      {error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {quizzes.map((q) => (
          <QuizCard
            key={q.id}
            quiz={q}
            canManage={canManage}
            onEdit={() => openEdit(q)}
            onDelete={() => void remove(q)}
            onQuestions={() => setQuestionsFor(q)}
            onAttempt={() => setAttemptQuiz(q)}
          />
        ))}
        {quizzes.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700 lg:col-span-2">
            {loading ? 'Loading quizzes…' : 'No quizzes for this course yet.'}
          </p>
        )}
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4">
          <form onSubmit={save} className="my-8 w-full max-w-xl space-y-3 rounded-2xl bg-white p-6 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black">{form.id ? 'Edit quiz' : 'New quiz'}</h3>
              <button type="button" onClick={() => setForm(null)}><X className="h-4 w-4" /></button>
            </div>
            <Field label="Title"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} /></Field>
            <Field label="Instructions"><textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Week (optional)"><input type="number" min={1} value={form.week_number} onChange={(e) => setForm({ ...form, week_number: e.target.value })} className={inputCls} /></Field>
              <Field label="Time limit (minutes)"><input type="number" min={1} value={form.time_limit_minutes} onChange={(e) => setForm({ ...form, time_limit_minutes: e.target.value })} className={inputCls} /></Field>
              <Field label="Total marks (0 = sum of questions)"><input type="number" min={0} value={form.total_marks} onChange={(e) => setForm({ ...form, total_marks: e.target.value })} className={inputCls} /></Field>
              <Field label="Passing marks"><input type="number" min={0} value={form.passing_marks} onChange={(e) => setForm({ ...form, passing_marks: e.target.value })} className={inputCls} /></Field>
              <Field label="Opens at"><input type="datetime-local" step={60} value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} className={inputCls} /></Field>
              <Field label="Closes at"><input type="datetime-local" step={60} value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} className={inputCls} /></Field>
              <Field label="Attempts allowed"><input type="number" min={1} value={form.max_attempts} onChange={(e) => setForm({ ...form, max_attempts: e.target.value })} className={inputCls} /></Field>
            </div>
            <div className="grid grid-cols-1 gap-2 text-xs font-bold sm:grid-cols-2">
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.shuffle_questions} onChange={(e) => setForm({ ...form, shuffle_questions: e.target.checked })} /> Shuffle questions</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.shuffle_options} onChange={(e) => setForm({ ...form, shuffle_options: e.target.checked })} /> Shuffle options</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.show_result_immediately} onChange={(e) => setForm({ ...form, show_result_immediately: e.target.checked })} /> Show result immediately</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} /> Publish to students</label>
            </div>
            <button disabled={saving} className="w-full rounded-xl bg-violet-600 py-2.5 text-xs font-bold text-white disabled:opacity-60">
              {saving ? 'Saving…' : 'Save quiz'}
            </button>
          </form>
        </div>
      )}

      {questionsFor && <QuestionsModal quiz={questionsFor} onClose={() => setQuestionsFor(null)} />}
      {attemptQuiz && (
        <AttemptModal
          quiz={attemptQuiz}
          studentId={currentUser?.id ?? ''}
          onClose={() => setAttemptQuiz(null)}
        />
      )}
    </div>
  );
};

const QuizCard: React.FC<{
  quiz: CloudQuiz;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onQuestions: () => void;
  onAttempt: () => void;
}> = ({ quiz, canManage, onEdit, onDelete, onQuestions, onAttempt }) => (
  <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="text-sm font-black text-slate-900 dark:text-white">{quiz.title}</h3>
        <p className="mt-0.5 text-[11px] text-slate-500">
          {quiz.week_number ? `Week ${quiz.week_number} • ` : ''}
          {quiz.time_limit_minutes} min • {quiz.max_attempts} attempt{quiz.max_attempts > 1 ? 's' : ''}
          {!quiz.is_published ? ' • Draft' : ''}
        </p>
      </div>
      <span className="rounded-lg bg-violet-50 px-2 py-1 text-[10px] font-black uppercase text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
        MCQ
      </span>
    </div>

    {quiz.description && <div className="mt-3 text-xs text-slate-600 dark:text-slate-300"><RichText text={quiz.description} /></div>}

    <p className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-500">
      {quiz.starts_at && <span><Clock className="mr-1 inline h-3 w-3" />Opens {formatAppDateTime(quiz.starts_at)}</span>}
      {quiz.ends_at && <span><Clock className="mr-1 inline h-3 w-3" />Closes {formatAppDateTime(quiz.ends_at)}</span>}
      <span>Pass marks: {quiz.passing_marks}</span>
    </p>

    <div className="mt-4 flex flex-wrap gap-2">
      {canManage ? (
        <>
          <button onClick={onQuestions} className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-[11px] font-bold text-white">
            <ListChecks className="h-3.5 w-3.5" /> Questions
          </button>
          <button onClick={onEdit} className="flex items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-2 text-[11px] font-bold dark:border-slate-700">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
          <button onClick={onDelete} className="flex items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-2 text-[11px] font-bold text-rose-600 dark:border-rose-900">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </>
      ) : (
        <button onClick={onAttempt} className="rounded-xl bg-violet-600 px-4 py-2 text-[11px] font-bold text-white">
          Start / view quiz
        </button>
      )}
    </div>
  </article>
);

/* ---------------- Staff: question bank ---------------- */

type QForm = {
  id?: string;
  prompt: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  marks: string;
  sort_order: string;
};

const emptyQ = (order: number): QForm => ({
  prompt: '', option_a: '', option_b: '', option_c: '', option_d: '',
  correct_option: 'a', marks: '1', sort_order: String(order),
});

const QuestionsModal: React.FC<{ quiz: CloudQuiz; onClose: () => void }> = ({ quiz, onClose }) => {
  const { notify, confirm } = useFeedback();
  const { data, loading, reload } = useCloudQuery(async () => quizzesApi.questions(quiz.id), [quiz.id]);
  const questions = useMemo(() => (data ?? []) as CloudQuizQuestion[], [data]);
  const [form, setForm] = useState<QForm | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (!form.prompt.trim()) return notify('error', 'Question text is required');
    if (![form.option_a, form.option_b, form.option_c, form.option_d].every((o) => o.trim())) {
      return notify('error', 'All four options are required');
    }
    setSaving(true);
    try {
      await quizzesApi.saveQuestion({
        id: form.id,
        quiz_id: quiz.id,
        prompt: form.prompt.trim(),
        option_a: form.option_a.trim(),
        option_b: form.option_b.trim(),
        option_c: form.option_c.trim(),
        option_d: form.option_d.trim(),
        correct_option: form.correct_option,
        marks: Math.max(1, Number(form.marks) || 1),
        sort_order: Number(form.sort_order) || 0,
      });
      notify('success', form.id ? 'Question updated' : 'Question added');
      setForm(null);
      await reload();
    } catch (err) {
      notify('error', 'Could not save question', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (q: CloudQuizQuestion) => {
    const res = await confirm({ title: 'Delete question?', message: q.prompt, tone: 'danger', confirmLabel: 'Delete' });
    if (!res.ok) return;
    try {
      await quizzesApi.removeQuestion(q.id);
      await reload();
      notify('success', 'Question deleted');
    } catch (err) {
      notify('error', 'Could not delete', (err as Error).message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4">
      <div className="my-8 w-full max-w-2xl space-y-4 rounded-2xl bg-white p-6 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black">{quiz.title} — questions</h3>
            <p className="text-[11px] text-slate-500">Correct answers stay on the server; students never receive them.</p>
          </div>
          <button onClick={onClose}><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-2">
          {questions.map((q, i) => (
            <div key={q.id} className="rounded-xl border border-slate-200 p-3 text-xs dark:border-slate-800">
              <div className="flex items-start justify-between gap-3">
                <p className="font-bold">{i + 1}. {q.prompt}</p>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => setForm({
                      id: q.id, prompt: q.prompt, option_a: q.option_a, option_b: q.option_b,
                      option_c: q.option_c, option_d: q.option_d, correct_option: q.correct_option,
                      marks: String(q.marks), sort_order: String(q.sort_order),
                    })}
                    className="rounded-lg border border-slate-300 p-1.5 dark:border-slate-700"
                  ><Pencil className="h-3 w-3" /></button>
                  <button onClick={() => void remove(q)} className="rounded-lg border border-rose-200 p-1.5 text-rose-600 dark:border-rose-900">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <ul className="mt-1 grid grid-cols-1 gap-0.5 text-[11px] text-slate-500 sm:grid-cols-2">
                {(['a', 'b', 'c', 'd'] as const).map((k) => (
                  <li key={k} className={q.correct_option === k ? 'font-bold text-emerald-600' : ''}>
                    {k.toUpperCase()}. {q[`option_${k}` as const]}
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-[10px] text-slate-400">{q.marks} mark{q.marks > 1 ? 's' : ''}</p>
            </div>
          ))}
          {questions.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500 dark:border-slate-700">
              {loading ? 'Loading…' : 'No questions yet.'}
            </p>
          )}
        </div>

        {form ? (
          <form onSubmit={save} className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <Field label="Question"><textarea rows={2} value={form.prompt} onChange={(e) => setForm({ ...form, prompt: e.target.value })} className={inputCls} /></Field>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Field label="Option A"><input value={form.option_a} onChange={(e) => setForm({ ...form, option_a: e.target.value })} className={inputCls} /></Field>
              <Field label="Option B"><input value={form.option_b} onChange={(e) => setForm({ ...form, option_b: e.target.value })} className={inputCls} /></Field>
              <Field label="Option C"><input value={form.option_c} onChange={(e) => setForm({ ...form, option_c: e.target.value })} className={inputCls} /></Field>
              <Field label="Option D"><input value={form.option_d} onChange={(e) => setForm({ ...form, option_d: e.target.value })} className={inputCls} /></Field>
              <Field label="Correct option">
                <select value={form.correct_option} onChange={(e) => setForm({ ...form, correct_option: e.target.value })} className={inputCls}>
                  <option value="a">A</option><option value="b">B</option><option value="c">C</option><option value="d">D</option>
                </select>
              </Field>
              <Field label="Marks"><input type="number" min={1} value={form.marks} onChange={(e) => setForm({ ...form, marks: e.target.value })} className={inputCls} /></Field>
            </div>
            <div className="flex gap-2">
              <button disabled={saving} className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-60">
                {saving ? 'Saving…' : 'Save question'}
              </button>
              <button type="button" onClick={() => setForm(null)} className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold dark:bg-slate-800">Cancel</button>
            </div>
          </form>
        ) : (
          <button onClick={() => setForm(emptyQ(questions.length + 1))} className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white">
            <Plus className="h-4 w-4" /> Add question
          </button>
        )}
      </div>
    </div>
  );
};

/* ---------------- Student: attempt an exam ---------------- */

const AttemptModal: React.FC<{ quiz: CloudQuiz; studentId: string; onClose: () => void }> = ({ quiz, studentId, onClose }) => {
  const { notify } = useFeedback();
  const [attempt, setAttempt] = useState<CloudQuizAttempt | null>(null);
  const [paper, setPaper] = useState<QuizPaperQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<CloudQuizAttempt[]>([]);
  const [remaining, setRemaining] = useState(0);
  const [busy, setBusy] = useState(false);
  const [starting, setStarting] = useState(false);
  const [result, setResult] = useState<CloudQuizAttempt | null>(null);

  useEffect(() => {
    if (!studentId) return;
    quizzesApi.myAttempts(quiz.id, studentId).then(setHistory).catch(() => setHistory([]));
  }, [quiz.id, studentId]);

  const submit = React.useCallback(async (auto = false) => {
    if (!attempt) return;
    setBusy(true);
    try {
      const done = await quizzesApi.submitAttempt(attempt.id, answers);
      setResult(done);
      setAttempt(null);
      setHistory(await quizzesApi.myAttempts(quiz.id, studentId));
      if (auto) notify('info', 'Time over — your answers were submitted automatically');
    } catch (err) {
      notify('error', 'Could not submit', (err as Error).message);
    } finally {
      setBusy(false);
    }
  }, [attempt, answers, quiz.id, studentId, notify]);

  // Countdown driven by the server-issued deadline, not by the browser clock start.
  useEffect(() => {
    if (!attempt) return;
    const tick = () => {
      const left = Math.max(0, Math.floor((new Date(attempt.expires_at).getTime() - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) void submit(true);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [attempt, submit]);

  const start = async () => {
    setStarting(true);
    try {
      const a = await quizzesApi.startAttempt(quiz.id);
      const p = await quizzesApi.paper(quiz.id);
      setAttempt(a);
      setPaper(p);
      setAnswers((a.answers as Record<string, string>) ?? {});
    } catch (err) {
      notify('error', 'Cannot start quiz', (err as Error).message);
    } finally {
      setStarting(false);
    }
  };

  const pick = async (questionId: string, option: string) => {
    const next = { ...answers, [questionId]: option };
    setAnswers(next);
    if (attempt) await quizzesApi.saveAnswers(attempt.id, next).catch(() => undefined);
  };

  const mmss = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
  const attemptsLeft = Math.max(0, quiz.max_attempts - history.length);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4">
      <div className="my-8 w-full max-w-2xl space-y-4 rounded-2xl bg-white p-6 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black">{quiz.title}</h3>
            <p className="text-[11px] text-slate-500">
              {quiz.time_limit_minutes} min • {attemptsLeft} of {quiz.max_attempts} attempt{quiz.max_attempts > 1 ? 's' : ''} left
            </p>
          </div>
          <div className="flex items-center gap-3">
            {attempt && (
              <span className={`rounded-lg px-3 py-1.5 font-mono text-sm font-black ${remaining < 60 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>
                {mmss}
              </span>
            )}
            {!attempt && <button onClick={onClose}><X className="h-4 w-4" /></button>}
          </div>
        </div>

        {result && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs dark:border-emerald-900 dark:bg-emerald-950/40">
            <p className="flex items-center gap-2 font-black text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" /> Submitted
            </p>
            {quiz.show_result_immediately ? (
              <p className="mt-1 text-emerald-800 dark:text-emerald-200">
                Score {result.score} • {result.percentage}% • {result.correct_count} correct, {result.wrong_count} wrong,
                {' '}{result.unanswered_count} unanswered • {result.passed ? 'Passed' : 'Not passed'}
              </p>
            ) : (
              <p className="mt-1 text-emerald-800 dark:text-emerald-200">Your result will be published by your teacher.</p>
            )}
          </div>
        )}

        {!attempt && !result && (
          <>
            {quiz.description && <div className="text-xs text-slate-600 dark:text-slate-300"><RichText text={quiz.description} /></div>}
            {history.length > 0 && (
              <div className="space-y-1 text-[11px]">
                <p className="font-black uppercase text-slate-500">Previous attempts</p>
                {history.map((a) => (
                  <p key={a.id} className="text-slate-600 dark:text-slate-300">
                    Attempt {a.attempt_no} — {a.status === 'submitted'
                      ? (quiz.show_result_immediately ? `${a.score} marks (${a.percentage}%) • ${a.passed ? 'Passed' : 'Not passed'}` : 'Submitted')
                      : 'In progress'}
                  </p>
                ))}
              </div>
            )}
            {attemptsLeft === 0 ? (
              <p className="flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                <AlertCircle className="h-4 w-4" /> You have used all your attempts.
              </p>
            ) : (
              <button onClick={() => void start()} disabled={starting} className="w-full rounded-xl bg-violet-600 py-2.5 text-xs font-bold text-white disabled:opacity-60">
                {starting ? 'Starting…' : 'Start quiz'}
              </button>
            )}
          </>
        )}

        {attempt && (
          <>
            <div className="space-y-3">
              {paper.map((q, i) => (
                <div key={q.id} className="rounded-xl border border-slate-200 p-3 text-xs dark:border-slate-800">
                  <p className="font-bold">{i + 1}. {q.prompt} <span className="text-[10px] font-medium text-slate-400">({q.marks} mark{q.marks > 1 ? 's' : ''})</span></p>
                  <div className="mt-2 space-y-1">
                    {(['a', 'b', 'c', 'd'] as const).map((k) => (
                      <label key={k} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 ${answers[q.id] === k ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40' : 'border-slate-200 dark:border-slate-800'}`}>
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          checked={answers[q.id] === k}
                          onChange={() => void pick(q.id, k)}
                        />
                        <span>{k.toUpperCase()}. {q[`option_${k}` as const]}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => void submit()} disabled={busy} className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white disabled:opacity-60">
              {busy ? 'Submitting…' : 'Submit quiz'}
            </button>
          </>
        )}

        {(result || !attempt) && (
          <button onClick={onClose} className="w-full rounded-xl bg-slate-100 py-2.5 text-xs font-bold dark:bg-slate-800">Close</button>
        )}
      </div>
    </div>
  );
};
