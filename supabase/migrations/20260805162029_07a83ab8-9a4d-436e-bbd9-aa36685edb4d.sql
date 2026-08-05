-- 1) Payments: students may only create pending requests
DROP POLICY IF EXISTS "Students submit own payments" ON public.payments;
CREATE POLICY "Students submit own payments"
ON public.payments FOR INSERT TO authenticated
WITH CHECK (
  public.is_staff_admin(auth.uid())
  OR (student_id = auth.uid() AND status = 'pending' AND verified_by IS NULL AND verified_at IS NULL)
);

CREATE OR REPLACE FUNCTION public.guard_payment_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_staff_admin(auth.uid()) THEN
    IF NEW.status IS DISTINCT FROM OLD.status
       OR NEW.amount IS DISTINCT FROM OLD.amount
       OR NEW.verified_by IS DISTINCT FROM OLD.verified_by THEN
      RAISE EXCEPTION 'Only staff can verify or change payments';
    END IF;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_guard_payment_status ON public.payments;
CREATE TRIGGER trg_guard_payment_status BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.guard_payment_status();

-- 2) Notify admins when a student submits a payment request
CREATE OR REPLACE FUNCTION public.notify_admins_new_payment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE student_name text;
BEGIN
  IF NEW.status <> 'pending' THEN RETURN NEW; END IF;
  SELECT full_name INTO student_name FROM public.profiles WHERE id = NEW.student_id;
  INSERT INTO public.notifications (user_id, course_id, title, body, type, link)
  SELECT ur.user_id, NEW.course_id,
         'New payment request',
         coalesce(student_name, 'A student') || ' submitted ₹' || NEW.amount::text ||
         ' (UTR ' || coalesce(NEW.reference_no, '—') || ') for verification.',
         'payment', '/app'
  FROM public.user_roles ur
  WHERE ur.role IN ('admin','super_admin');
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_notify_admins_new_payment ON public.payments;
CREATE TRIGGER trg_notify_admins_new_payment AFTER INSERT ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.notify_admins_new_payment();

-- 3) Profiles: block self role/status escalation
CREATE OR REPLACE FUNCTION public.guard_profile_privileges()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_staff_admin(auth.uid()) THEN
    IF NEW.role IS DISTINCT FROM OLD.role OR NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Only administrators can change role or status';
    END IF;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_guard_profile_privileges ON public.profiles;
CREATE TRIGGER trg_guard_profile_privileges BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_privileges();

-- 4) Submissions: only staff may grade
CREATE OR REPLACE FUNCTION public.guard_submission_grading()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.marks_obtained IS NOT NULL OR NEW.feedback IS NOT NULL OR NEW.status = 'graded' THEN
        RAISE EXCEPTION 'Only teachers can grade submissions';
      END IF;
    ELSE
      IF NEW.marks_obtained IS DISTINCT FROM OLD.marks_obtained
         OR NEW.feedback IS DISTINCT FROM OLD.feedback
         OR (NEW.status = 'graded' AND OLD.status <> 'graded') THEN
        RAISE EXCEPTION 'Only teachers can grade submissions';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_guard_submission_grading ON public.assignment_submissions;
CREATE TRIGGER trg_guard_submission_grading BEFORE INSERT OR UPDATE ON public.assignment_submissions
FOR EACH ROW EXECUTE FUNCTION public.guard_submission_grading();