-- ============ 1. Lecture progress (course progress tracking) ============
CREATE TABLE public.lecture_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lecture_id uuid NOT NULL REFERENCES public.recorded_lectures(id) ON DELETE CASCADE,
  watched_seconds integer NOT NULL DEFAULT 0,
  duration_seconds integer,
  percent numeric NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, lecture_id)
);

GRANT SELECT, INSERT, UPDATE ON public.lecture_progress TO authenticated;
GRANT ALL ON public.lecture_progress TO service_role;
ALTER TABLE public.lecture_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own or staff lecture progress" ON public.lecture_progress
  FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE POLICY "Students track own lecture progress" ON public.lecture_progress
  FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students update own lecture progress" ON public.lecture_progress
  FOR UPDATE TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE TRIGGER trg_lecture_progress_updated BEFORE UPDATE ON public.lecture_progress
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ 2. Quizzes ============
CREATE TABLE public.quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  week_number integer,
  time_limit_minutes integer NOT NULL DEFAULT 30,
  total_marks integer NOT NULL DEFAULT 0,
  passing_marks integer NOT NULL DEFAULT 0,
  starts_at timestamptz,
  ends_at timestamptz,
  shuffle_questions boolean NOT NULL DEFAULT false,
  shuffle_options boolean NOT NULL DEFAULT false,
  max_attempts integer NOT NULL DEFAULT 1,
  show_result_immediately boolean NOT NULL DEFAULT true,
  is_published boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quizzes TO authenticated;
GRANT ALL ON public.quizzes TO service_role;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enrolled students view published quizzes" ON public.quizzes
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) OR (is_published AND public.is_enrolled(auth.uid(), course_id)));

CREATE POLICY "Staff create quizzes" ON public.quizzes
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff update quizzes" ON public.quizzes
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff delete quizzes" ON public.quizzes
  FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

CREATE TRIGGER trg_quizzes_updated BEFORE UPDATE ON public.quizzes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ 3. Quiz questions (answer key is staff-only) ============
CREATE TABLE public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_option text NOT NULL CHECK (correct_option IN ('a','b','c','d')),
  marks integer NOT NULL DEFAULT 1,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_questions TO authenticated;
GRANT ALL ON public.quiz_questions TO service_role;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

-- Students get NO direct read access: the answer key lives in this table.
CREATE POLICY "Staff read quiz questions" ON public.quiz_questions
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff write quiz questions" ON public.quiz_questions
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff update quiz questions" ON public.quiz_questions
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff delete quiz questions" ON public.quiz_questions
  FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

CREATE TRIGGER trg_quiz_questions_updated BEFORE UPDATE ON public.quiz_questions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ 4. Quiz attempts (students never write these directly) ============
CREATE TABLE public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  attempt_no integer NOT NULL DEFAULT 1,
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  submitted_at timestamptz,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  score numeric,
  correct_count integer,
  wrong_count integer,
  unanswered_count integer,
  percentage numeric,
  passed boolean,
  status text NOT NULL DEFAULT 'in_progress',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (quiz_id, student_id, attempt_no)
);

GRANT SELECT ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.quiz_attempts TO service_role;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own or staff quiz attempts" ON public.quiz_attempts
  FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE TRIGGER trg_quiz_attempts_updated BEFORE UPDATE ON public.quiz_attempts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ 5. Secure backend routines ============

-- Paper for a student: questions WITHOUT the correct answer.
CREATE OR REPLACE FUNCTION public.quiz_paper(_quiz_id uuid)
RETURNS TABLE (
  id uuid, prompt text, option_a text, option_b text,
  option_c text, option_d text, marks integer, sort_order integer
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE q public.quizzes%ROWTYPE;
BEGIN
  SELECT * INTO q FROM public.quizzes WHERE quizzes.id = _quiz_id;
  IF q.id IS NULL THEN RAISE EXCEPTION 'Quiz not found'; END IF;
  IF NOT (public.is_staff(auth.uid())
          OR (q.is_published AND public.is_enrolled(auth.uid(), q.course_id))) THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;
  RETURN QUERY
    SELECT qq.id, qq.prompt, qq.option_a, qq.option_b, qq.option_c, qq.option_d, qq.marks, qq.sort_order
    FROM public.quiz_questions qq
    WHERE qq.quiz_id = _quiz_id
    ORDER BY CASE WHEN q.shuffle_questions THEN random() END, qq.sort_order, qq.created_at;
END; $$;

REVOKE ALL ON FUNCTION public.quiz_paper(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.quiz_paper(uuid) TO authenticated, service_role;

-- Start (or resume) an attempt. Server owns the clock and the attempt limit.
CREATE OR REPLACE FUNCTION public.start_quiz_attempt(_quiz_id uuid)
RETURNS public.quiz_attempts
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  q public.quizzes%ROWTYPE;
  a public.quiz_attempts%ROWTYPE;
  used integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO q FROM public.quizzes WHERE id = _quiz_id;
  IF q.id IS NULL OR NOT q.is_published THEN RAISE EXCEPTION 'Quiz not available'; END IF;
  IF NOT public.is_enrolled(auth.uid(), q.course_id) THEN RAISE EXCEPTION 'Not enrolled in this course'; END IF;
  IF q.starts_at IS NOT NULL AND now() < q.starts_at THEN RAISE EXCEPTION 'Quiz has not started yet'; END IF;
  IF q.ends_at IS NOT NULL AND now() > q.ends_at THEN RAISE EXCEPTION 'Quiz window has closed'; END IF;

  SELECT * INTO a FROM public.quiz_attempts
   WHERE quiz_id = _quiz_id AND student_id = auth.uid() AND status = 'in_progress'
   ORDER BY attempt_no DESC LIMIT 1;
  IF a.id IS NOT NULL THEN
    IF now() > a.expires_at THEN
      PERFORM public.submit_quiz_attempt(a.id, a.answers);
      SELECT * INTO a FROM public.quiz_attempts WHERE id = a.id;
      RAISE EXCEPTION 'Your previous attempt expired and was submitted automatically';
    END IF;
    RETURN a;
  END IF;

  SELECT count(*) INTO used FROM public.quiz_attempts
   WHERE quiz_id = _quiz_id AND student_id = auth.uid();
  IF used >= q.max_attempts THEN RAISE EXCEPTION 'No attempts left'; END IF;

  INSERT INTO public.quiz_attempts (quiz_id, student_id, attempt_no, expires_at)
  VALUES (_quiz_id, auth.uid(), used + 1, now() + make_interval(mins => q.time_limit_minutes))
  RETURNING * INTO a;
  RETURN a;
END; $$;

REVOKE ALL ON FUNCTION public.start_quiz_attempt(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_quiz_attempt(uuid) TO authenticated, service_role;

-- Autosave answers for an in-progress attempt owned by the caller.
CREATE OR REPLACE FUNCTION public.save_quiz_answers(_attempt_id uuid, _answers jsonb)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE a public.quiz_attempts%ROWTYPE;
BEGIN
  SELECT * INTO a FROM public.quiz_attempts WHERE id = _attempt_id;
  IF a.id IS NULL OR a.student_id <> auth.uid() THEN RAISE EXCEPTION 'Attempt not found'; END IF;
  IF a.status <> 'in_progress' THEN RAISE EXCEPTION 'Attempt already submitted'; END IF;
  IF now() > a.expires_at THEN RAISE EXCEPTION 'Time is over'; END IF;
  UPDATE public.quiz_attempts SET answers = coalesce(_answers, '{}'::jsonb) WHERE id = _attempt_id;
END; $$;

REVOKE ALL ON FUNCTION public.save_quiz_answers(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_quiz_answers(uuid, jsonb) TO authenticated, service_role;

-- Submit + auto-evaluate against the hidden answer key.
CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(_attempt_id uuid, _answers jsonb DEFAULT NULL)
RETURNS public.quiz_attempts
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  a public.quiz_attempts%ROWTYPE;
  q public.quizzes%ROWTYPE;
  ans jsonb;
  v_score numeric := 0;
  v_correct integer := 0;
  v_wrong integer := 0;
  v_blank integer := 0;
  v_max numeric := 0;
  rec record;
  given text;
BEGIN
  SELECT * INTO a FROM public.quiz_attempts WHERE id = _attempt_id;
  IF a.id IS NULL THEN RAISE EXCEPTION 'Attempt not found'; END IF;
  IF a.student_id <> auth.uid() AND NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF a.status <> 'in_progress' THEN RETURN a; END IF;

  SELECT * INTO q FROM public.quizzes WHERE id = a.quiz_id;
  ans := coalesce(_answers, a.answers, '{}'::jsonb);
  -- Answers sent after the deadline are ignored; only what was saved in time counts.
  IF now() > a.expires_at THEN ans := coalesce(a.answers, '{}'::jsonb); END IF;

  FOR rec IN SELECT id, correct_option, marks FROM public.quiz_questions WHERE quiz_id = a.quiz_id LOOP
    v_max := v_max + rec.marks;
    given := lower(coalesce(ans ->> rec.id::text, ''));
    IF given = '' THEN
      v_blank := v_blank + 1;
    ELSIF given = rec.correct_option THEN
      v_correct := v_correct + 1;
      v_score := v_score + rec.marks;
    ELSE
      v_wrong := v_wrong + 1;
    END IF;
  END LOOP;

  IF q.total_marks > 0 THEN v_max := q.total_marks; END IF;

  UPDATE public.quiz_attempts SET
    answers = ans,
    submitted_at = now(),
    status = 'submitted',
    score = v_score,
    correct_count = v_correct,
    wrong_count = v_wrong,
    unanswered_count = v_blank,
    percentage = CASE WHEN v_max > 0 THEN round((v_score / v_max) * 100, 2) ELSE 0 END,
    passed = (v_score >= coalesce(q.passing_marks, 0))
  WHERE id = _attempt_id
  RETURNING * INTO a;

  RETURN a;
END; $$;

REVOKE ALL ON FUNCTION public.submit_quiz_attempt(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_quiz_attempt(uuid, jsonb) TO authenticated, service_role;

-- ============ 6. Least-privilege review of existing routines ============
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_staff_admin(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_enrolled(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_enrolled(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated, service_role;

-- Students must not delete their own submissions (staff-only, already policy-enforced):
REVOKE DELETE ON public.assignment_submissions FROM authenticated;
GRANT DELETE ON public.assignment_submissions TO service_role;