
-- ============ helper ============
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','super_admin','teacher'))
$$;

-- ============ COURSES ============
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE,
  title text NOT NULL,
  description text,
  thumbnail_url text,
  duration_months integer NOT NULL DEFAULT 0,
  official_fee numeric(12,2) NOT NULL DEFAULT 0,
  registration_fee numeric(12,2) NOT NULL DEFAULT 0,
  tax_percent numeric(5,2) NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.courses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published courses are public" ON public.courses FOR SELECT TO anon USING (is_published = true);
CREATE POLICY "Authenticated can view courses" ON public.courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert courses" ON public.courses FOR INSERT TO authenticated WITH CHECK (public.is_staff_admin(auth.uid()));
CREATE POLICY "Staff can update courses" ON public.courses FOR UPDATE TO authenticated USING (public.is_staff_admin(auth.uid())) WITH CHECK (public.is_staff_admin(auth.uid()));
CREATE POLICY "Super admins can delete courses" ON public.courses FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_courses_updated BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ ENROLLMENTS ============
CREATE TABLE public.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  batch_name text,
  status text NOT NULL DEFAULT 'active',
  total_fee numeric(12,2) NOT NULL DEFAULT 0,
  discount numeric(12,2) NOT NULL DEFAULT 0,
  paid_amount numeric(12,2) NOT NULL DEFAULT 0,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, course_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enrollments TO authenticated;
GRANT ALL ON public.enrollments TO service_role;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own or staff enrollments" ON public.enrollments FOR SELECT TO authenticated USING (student_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Admins manage enrollments" ON public.enrollments FOR INSERT TO authenticated WITH CHECK (public.is_staff_admin(auth.uid()));
CREATE POLICY "Admins update enrollments" ON public.enrollments FOR UPDATE TO authenticated USING (public.is_staff_admin(auth.uid())) WITH CHECK (public.is_staff_admin(auth.uid()));
CREATE POLICY "Admins delete enrollments" ON public.enrollments FOR DELETE TO authenticated USING (public.is_staff_admin(auth.uid()));
CREATE TRIGGER trg_enrollments_updated BEFORE UPDATE ON public.enrollments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- enrollment check helper
CREATE OR REPLACE FUNCTION public.is_enrolled(_user_id uuid, _course_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.enrollments WHERE student_id = _user_id AND course_id = _course_id AND status = 'active')
$$;

-- ============ LIVE CLASSES ============
CREATE TABLE public.live_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  platform text NOT NULL DEFAULT 'zoom',
  meeting_url text,
  teacher_id uuid,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  status text NOT NULL DEFAULT 'scheduled',
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.live_classes TO authenticated;
GRANT ALL ON public.live_classes TO service_role;
ALTER TABLE public.live_classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enrolled or staff view live classes" ON public.live_classes FOR SELECT TO authenticated USING (public.is_staff(auth.uid()) OR (is_published AND public.is_enrolled(auth.uid(), course_id)));
CREATE POLICY "Staff insert live classes" ON public.live_classes FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff update live classes" ON public.live_classes FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Admins delete live classes" ON public.live_classes FOR DELETE TO authenticated USING (public.is_staff_admin(auth.uid()));
CREATE TRIGGER trg_live_classes_updated BEFORE UPDATE ON public.live_classes FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ RECORDED LECTURES ============
CREATE TABLE public.recorded_lectures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  video_url text NOT NULL,
  thumbnail_url text,
  duration_minutes integer,
  week_number integer,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recorded_lectures TO authenticated;
GRANT ALL ON public.recorded_lectures TO service_role;
ALTER TABLE public.recorded_lectures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enrolled or staff view lectures" ON public.recorded_lectures FOR SELECT TO authenticated USING (public.is_staff(auth.uid()) OR (is_published AND public.is_enrolled(auth.uid(), course_id)));
CREATE POLICY "Staff insert lectures" ON public.recorded_lectures FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff update lectures" ON public.recorded_lectures FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Admins delete lectures" ON public.recorded_lectures FOR DELETE TO authenticated USING (public.is_staff_admin(auth.uid()));
CREATE TRIGGER trg_lectures_updated BEFORE UPDATE ON public.recorded_lectures FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ STUDY MATERIALS ============
CREATE TABLE public.study_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_type text NOT NULL DEFAULT 'pdf',
  file_size_kb integer,
  week_number integer,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_materials TO authenticated;
GRANT ALL ON public.study_materials TO service_role;
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enrolled or staff view materials" ON public.study_materials FOR SELECT TO authenticated USING (public.is_staff(auth.uid()) OR (is_published AND public.is_enrolled(auth.uid(), course_id)));
CREATE POLICY "Staff insert materials" ON public.study_materials FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff update materials" ON public.study_materials FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Admins delete materials" ON public.study_materials FOR DELETE TO authenticated USING (public.is_staff_admin(auth.uid()));
CREATE TRIGGER trg_materials_updated BEFORE UPDATE ON public.study_materials FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ ASSIGNMENTS ============
CREATE TABLE public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  instructions text,
  attachment_url text,
  max_marks integer NOT NULL DEFAULT 100,
  due_at timestamptz,
  is_published boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignments TO authenticated;
GRANT ALL ON public.assignments TO service_role;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enrolled or staff view assignments" ON public.assignments FOR SELECT TO authenticated USING (public.is_staff(auth.uid()) OR (is_published AND public.is_enrolled(auth.uid(), course_id)));
CREATE POLICY "Staff insert assignments" ON public.assignments FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff update assignments" ON public.assignments FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Admins delete assignments" ON public.assignments FOR DELETE TO authenticated USING (public.is_staff_admin(auth.uid()));
CREATE TRIGGER trg_assignments_updated BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ ASSIGNMENT SUBMISSIONS ============
CREATE TABLE public.assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  submission_text text,
  file_url text,
  marks_obtained numeric(6,2),
  feedback text,
  status text NOT NULL DEFAULT 'submitted',
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, student_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignment_submissions TO authenticated;
GRANT ALL ON public.assignment_submissions TO service_role;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own or staff submissions" ON public.assignment_submissions FOR SELECT TO authenticated USING (student_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Students create own submissions" ON public.assignment_submissions FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Owner or staff update submissions" ON public.assignment_submissions FOR UPDATE TO authenticated USING (student_id = auth.uid() OR public.is_staff(auth.uid())) WITH CHECK (student_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Admins delete submissions" ON public.assignment_submissions FOR DELETE TO authenticated USING (public.is_staff_admin(auth.uid()));
CREATE TRIGGER trg_submissions_updated BEFORE UPDATE ON public.assignment_submissions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ ATTENDANCE ============
CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  live_class_id uuid REFERENCES public.live_classes(id) ON DELETE SET NULL,
  attendance_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'present',
  remarks text,
  marked_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, student_id, attendance_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own or staff attendance" ON public.attendance FOR SELECT TO authenticated USING (student_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Staff insert attendance" ON public.attendance FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff update attendance" ON public.attendance FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Admins delete attendance" ON public.attendance FOR DELETE TO authenticated USING (public.is_staff_admin(auth.uid()));
CREATE TRIGGER trg_attendance_updated BEFORE UPDATE ON public.attendance FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ FEES ============
CREATE TABLE public.fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid REFERENCES public.enrollments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  fee_type text NOT NULL DEFAULT 'course',
  amount numeric(12,2) NOT NULL DEFAULT 0,
  discount numeric(12,2) NOT NULL DEFAULT 0,
  tax_amount numeric(12,2) NOT NULL DEFAULT 0,
  due_date date,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fees TO authenticated;
GRANT ALL ON public.fees TO service_role;
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own or staff fees" ON public.fees FOR SELECT TO authenticated USING (student_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Admins insert fees" ON public.fees FOR INSERT TO authenticated WITH CHECK (public.is_staff_admin(auth.uid()));
CREATE POLICY "Admins update fees" ON public.fees FOR UPDATE TO authenticated USING (public.is_staff_admin(auth.uid())) WITH CHECK (public.is_staff_admin(auth.uid()));
CREATE POLICY "Super admins delete fees" ON public.fees FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_fees_updated BEFORE UPDATE ON public.fees FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ PAYMENTS ============
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_id uuid REFERENCES public.fees(id) ON DELETE SET NULL,
  enrollment_id uuid REFERENCES public.enrollments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  method text NOT NULL DEFAULT 'upi',
  reference_no text,
  paid_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending',
  verified_by uuid,
  verified_at timestamptz,
  receipt_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own or staff payments" ON public.payments FOR SELECT TO authenticated USING (student_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Students submit own payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid() OR public.is_staff_admin(auth.uid()));
CREATE POLICY "Admins update payments" ON public.payments FOR UPDATE TO authenticated USING (public.is_staff_admin(auth.uid())) WITH CHECK (public.is_staff_admin(auth.uid()));
CREATE POLICY "Super admins delete payments" ON public.payments FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  type text NOT NULL DEFAULT 'info',
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff_admin(auth.uid()));
CREATE POLICY "Staff create notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Owner or admin update notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_staff_admin(auth.uid())) WITH CHECK (user_id = auth.uid() OR public.is_staff_admin(auth.uid()));
CREATE POLICY "Owner or admin delete notifications" ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_staff_admin(auth.uid()));
CREATE TRIGGER trg_notifications_updated BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ AUDIT LOGS ============
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_name text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_staff_admin(auth.uid()));
CREATE POLICY "Authenticated write audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid());

-- ============ indexes ============
CREATE INDEX idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX idx_enrollments_course ON public.enrollments(course_id);
CREATE INDEX idx_live_classes_course ON public.live_classes(course_id);
CREATE INDEX idx_lectures_course ON public.recorded_lectures(course_id);
CREATE INDEX idx_materials_course ON public.study_materials(course_id);
CREATE INDEX idx_assignments_course ON public.assignments(course_id);
CREATE INDEX idx_submissions_student ON public.assignment_submissions(student_id);
CREATE INDEX idx_attendance_course_student ON public.attendance(course_id, student_id);
CREATE INDEX idx_fees_student ON public.fees(student_id);
CREATE INDEX idx_payments_student ON public.payments(student_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX idx_audit_entity ON public.audit_logs(entity_type, entity_id);
