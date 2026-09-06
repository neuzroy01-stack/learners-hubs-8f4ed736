-- 1. Extend the existing notifications table
ALTER TABLE public.notifications ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS target_type text NOT NULL DEFAULT 'student';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS student_id uuid;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS created_by_role text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS start_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

UPDATE public.notifications SET student_id = user_id WHERE student_id IS NULL;

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_target_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_target_type_check
  CHECK (target_type IN ('student','course','all'));

CREATE INDEX IF NOT EXISTS idx_notifications_student ON public.notifications(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_course ON public.notifications(course_id);
CREATE INDEX IF NOT EXISTS idx_notifications_active ON public.notifications(is_active);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- 2. Read tracking table
CREATE TABLE IF NOT EXISTS public.notification_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  read_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (notification_id, student_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_reads TO authenticated;
GRANT ALL ON public.notification_reads TO service_role;
ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_notification_reads_notification ON public.notification_reads(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_reads_student ON public.notification_reads(student_id);

DROP POLICY IF EXISTS "Own read receipts" ON public.notification_reads;
CREATE POLICY "Own read receipts" ON public.notification_reads
  FOR ALL TO authenticated
  USING (student_id = auth.uid() OR public.is_staff(auth.uid()))
  WITH CHECK (student_id = auth.uid());

-- 3. Replace notification access policies
DROP POLICY IF EXISTS "View own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Staff create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Owner or admin update notifications" ON public.notifications;
DROP POLICY IF EXISTS "Owner or admin delete notifications" ON public.notifications;

CREATE POLICY "Read relevant notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (
    public.is_staff(auth.uid())
    OR (
      deleted_at IS NULL
      AND is_active
      AND start_at <= now()
      AND (expires_at IS NULL OR expires_at > now())
      AND (
        student_id = auth.uid()
        OR user_id = auth.uid()
        OR (target_type = 'course' AND course_id IS NOT NULL AND public.is_enrolled(auth.uid(), course_id))
      )
    )
  );

CREATE POLICY "Staff create notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff update notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()) OR user_id = auth.uid() OR student_id = auth.uid())
  WITH CHECK (public.is_staff(auth.uid()) OR user_id = auth.uid() OR student_id = auth.uid());

CREATE POLICY "Admins delete notifications" ON public.notifications
  FOR DELETE TO authenticated
  USING (public.is_staff_admin(auth.uid()));

-- 4. Keep the payment alert trigger consistent with the new columns
CREATE OR REPLACE FUNCTION public.notify_admins_new_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE student_name text;
BEGIN
  IF NEW.status <> 'pending' THEN RETURN NEW; END IF;
  SELECT full_name INTO student_name FROM public.profiles WHERE id = NEW.student_id;
  INSERT INTO public.notifications (user_id, student_id, target_type, course_id, title, body, type, link)
  SELECT ur.user_id, ur.user_id, 'student', NEW.course_id,
         'New payment request',
         coalesce(student_name, 'A student') || ' submitted ₹' || NEW.amount::text ||
         ' (UTR ' || coalesce(NEW.reference_no, '—') || ') for verification.',
         'payment', '/app'
  FROM public.user_roles ur
  WHERE ur.role IN ('admin','super_admin');
  RETURN NEW;
END; $function$;