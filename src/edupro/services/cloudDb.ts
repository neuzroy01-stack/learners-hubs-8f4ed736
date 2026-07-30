import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Tables = Database['public']['Tables'];

export type CloudCourse = Tables['courses']['Row'];
export type CloudEnrollment = Tables['enrollments']['Row'];
export type CloudLiveClass = Tables['live_classes']['Row'];
export type CloudLecture = Tables['recorded_lectures']['Row'];
export type CloudMaterial = Tables['study_materials']['Row'];
export type CloudAssignment = Tables['assignments']['Row'];
export type CloudSubmission = Tables['assignment_submissions']['Row'];
export type CloudAttendance = Tables['attendance']['Row'];
export type CloudFee = Tables['fees']['Row'];
export type CloudPayment = Tables['payments']['Row'];
export type CloudNotification = Tables['notifications']['Row'];
export type CloudAuditLog = Tables['audit_logs']['Row'];

const unwrap = <T,>(res: { data: T | null; error: { message: string } | null }): T => {
  if (res.error) throw new Error(res.error.message);
  return (res.data ?? []) as T;
};

export const currentUserId = async (): Promise<string | null> => {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
};

/** Records an audit entry. Never throws — auditing must not block a write. */
export const logAudit = async (
  action: string,
  entityType: string,
  entityId?: string | null,
  oldValues?: unknown,
  newValues?: unknown,
  actorName?: string
) => {
  try {
    const uid = await currentUserId();
    if (!uid) return;
    await supabase.from('audit_logs').insert({
      actor_id: uid,
      actor_name: actorName ?? null,
      action,
      entity_type: entityType,
      entity_id: entityId ?? null,
      old_values: (oldValues ?? null) as never,
      new_values: (newValues ?? null) as never,
    });
  } catch {
    /* auditing is best-effort */
  }
};

/* ---------------- COURSES ---------------- */
export const coursesApi = {
  async list() {
    return unwrap(
      await supabase.from('courses').select('*').order('created_at', { ascending: false })
    ) as CloudCourse[];
  },
  async listPublished() {
    return unwrap(
      await supabase.from('courses').select('*').eq('is_published', true).order('title')
    ) as CloudCourse[];
  },
  async create(input: Tables['courses']['Insert']) {
    const row = unwrap(await supabase.from('courses').insert(input).select().single()) as CloudCourse;
    await logAudit('CREATE', 'course', row.id, null, row);
    return row;
  },
  async update(id: string, patch: Tables['courses']['Update']) {
    const row = unwrap(
      await supabase.from('courses').update(patch).eq('id', id).select().single()
    ) as CloudCourse;
    await logAudit('UPDATE', 'course', id, null, patch);
    return row;
  },
  async remove(id: string) {
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await logAudit('DELETE', 'course', id);
  },
  /** Counts linked records so the UI can warn before a destructive delete. */
  async dependencies(courseId: string) {
    const [enrollments, lectures, materials, assignments, live] = await Promise.all([
      supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('course_id', courseId),
      supabase.from('recorded_lectures').select('id', { count: 'exact', head: true }).eq('course_id', courseId),
      supabase.from('study_materials').select('id', { count: 'exact', head: true }).eq('course_id', courseId),
      supabase.from('assignments').select('id', { count: 'exact', head: true }).eq('course_id', courseId),
      supabase.from('live_classes').select('id', { count: 'exact', head: true }).eq('course_id', courseId),
    ]);
    return {
      enrollments: enrollments.count ?? 0,
      lectures: lectures.count ?? 0,
      materials: materials.count ?? 0,
      assignments: assignments.count ?? 0,
      liveClasses: live.count ?? 0,
    };
  },
};

/* ---------------- ENROLLMENTS ---------------- */
export const enrollmentsApi = {
  async listByCourse(courseId: string) {
    return unwrap(
      await supabase.from('enrollments').select('*').eq('course_id', courseId)
    ) as CloudEnrollment[];
  },
  async listByStudent(studentId: string) {
    return unwrap(
      await supabase.from('enrollments').select('*, courses(*)').eq('student_id', studentId)
    ) as (CloudEnrollment & { courses: CloudCourse | null })[];
  },
  /** Enrolls a student and auto-applies the course's official fee structure. */
  async enroll(studentId: string, courseId: string, batchName?: string) {
    const course = unwrap(
      await supabase.from('courses').select('*').eq('id', courseId).single()
    ) as CloudCourse;
    const base = Number(course.official_fee) + Number(course.registration_fee);
    const tax = (base * Number(course.tax_percent)) / 100;
    const total = base + tax;

    const enrollment = unwrap(
      await supabase
        .from('enrollments')
        .insert({ student_id: studentId, course_id: courseId, batch_name: batchName ?? null, total_fee: total })
        .select()
        .single()
    ) as CloudEnrollment;

    await supabase.from('fees').insert([
      {
        enrollment_id: enrollment.id,
        student_id: studentId,
        course_id: courseId,
        fee_type: 'course',
        amount: Number(course.official_fee),
        tax_amount: tax,
      },
      ...(Number(course.registration_fee) > 0
        ? [
            {
              enrollment_id: enrollment.id,
              student_id: studentId,
              course_id: courseId,
              fee_type: 'registration',
              amount: Number(course.registration_fee),
            },
          ]
        : []),
    ]);
    await logAudit('ENROLL', 'enrollment', enrollment.id, null, enrollment);
    return enrollment;
  },
  async update(id: string, patch: Tables['enrollments']['Update']) {
    const row = unwrap(
      await supabase.from('enrollments').update(patch).eq('id', id).select().single()
    ) as CloudEnrollment;
    await logAudit('UPDATE', 'enrollment', id, null, patch);
    return row;
  },
  async remove(id: string) {
    const { error } = await supabase.from('enrollments').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await logAudit('DELETE', 'enrollment', id);
  },
};

/** Generic course-scoped CRUD factory — every content type is isolated per course. */
function courseScoped<K extends 'live_classes' | 'recorded_lectures' | 'study_materials' | 'assignments'>(
  table: K,
  orderBy: string,
  ascending = true
) {
  type Row = Tables[K]['Row'];
  // The generic table name defeats postgrest-js' literal-key inference, so we
  // query through a loosely typed handle and re-apply the concrete Row type.
  const from = () => (supabase as unknown as { from: (t: string) => any }).from(table);
  return {
    async listByCourse(courseId: string) {
      return unwrap(
        await from().select('*').eq('course_id', courseId).order(orderBy, { ascending })
      ) as Row[];
    },
    async listForCourses(courseIds: string[]) {
      if (courseIds.length === 0) return [] as Row[];
      return unwrap(
        await from().select('*').in('course_id', courseIds).order(orderBy, { ascending })
      ) as Row[];
    },
    async create(input: Tables[K]['Insert']) {
      const row = unwrap(await from().insert(input).select().single()) as Row;
      await logAudit('CREATE', table, (row as { id: string }).id, null, row);
      return row;
    },
    async update(id: string, patch: Tables[K]['Update']) {
      const row = unwrap(await from().update(patch).eq('id', id).select().single()) as Row;
      await logAudit('UPDATE', table, id, null, patch);
      return row;
    },
    async remove(id: string) {
      const { error } = await from().delete().eq('id', id);
      if (error) throw new Error(error.message);
      await logAudit('DELETE', table, id);
    },

  };
}

export const liveClassesApi = courseScoped('live_classes', 'starts_at', false);
export const lecturesApi = courseScoped('recorded_lectures', 'sort_order', true);
export const materialsApi = courseScoped('study_materials', 'created_at', false);
export const assignmentsApi = courseScoped('assignments', 'due_at', true);

/* ---------------- SUBMISSIONS ---------------- */
export const submissionsApi = {
  async listByAssignment(assignmentId: string) {
    return unwrap(
      await supabase.from('assignment_submissions').select('*').eq('assignment_id', assignmentId)
    ) as CloudSubmission[];
  },
  async listByStudent(studentId: string) {
    return unwrap(
      await supabase.from('assignment_submissions').select('*').eq('student_id', studentId)
    ) as CloudSubmission[];
  },
  async submit(input: Tables['assignment_submissions']['Insert']) {
    return unwrap(
      await supabase
        .from('assignment_submissions')
        .upsert(input, { onConflict: 'assignment_id,student_id' })
        .select()
        .single()
    ) as CloudSubmission;
  },
  async grade(id: string, marks: number, feedback?: string) {
    const row = unwrap(
      await supabase
        .from('assignment_submissions')
        .update({ marks_obtained: marks, feedback: feedback ?? null, status: 'graded' })
        .eq('id', id)
        .select()
        .single()
    ) as CloudSubmission;
    await logAudit('GRADE', 'assignment_submission', id, null, { marks, feedback });
    return row;
  },
};

/* ---------------- ATTENDANCE ---------------- */
export const attendanceApi = {
  async listByCourse(courseId: string, date?: string) {
    let q = supabase.from('attendance').select('*').eq('course_id', courseId);
    if (date) q = q.eq('attendance_date', date);
    return unwrap(await q) as CloudAttendance[];
  },
  async listByStudent(studentId: string) {
    return unwrap(
      await supabase.from('attendance').select('*').eq('student_id', studentId).order('attendance_date', { ascending: false })
    ) as CloudAttendance[];
  },
  async mark(rows: Tables['attendance']['Insert'][]) {
    return unwrap(
      await supabase.from('attendance').upsert(rows, { onConflict: 'course_id,student_id,attendance_date' }).select()
    ) as CloudAttendance[];
  },
  async remove(id: string) {
    const { error } = await supabase.from('attendance').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};

/* ---------------- FEES & PAYMENTS ---------------- */
export const feesApi = {
  async listByStudent(studentId: string) {
    return unwrap(await supabase.from('fees').select('*').eq('student_id', studentId)) as CloudFee[];
  },
  async listByCourse(courseId: string) {
    return unwrap(await supabase.from('fees').select('*').eq('course_id', courseId)) as CloudFee[];
  },
  async create(input: Tables['fees']['Insert']) {
    const row = unwrap(await supabase.from('fees').insert(input).select().single()) as CloudFee;
    await logAudit('CREATE', 'fee', row.id, null, row);
    return row;
  },
  async update(id: string, patch: Tables['fees']['Update']) {
    const row = unwrap(await supabase.from('fees').update(patch).eq('id', id).select().single()) as CloudFee;
    await logAudit('UPDATE', 'fee', id, null, patch);
    return row;
  },
  async remove(id: string) {
    const { error } = await supabase.from('fees').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await logAudit('DELETE', 'fee', id);
  },
};

/** Recomputes an enrollment's paid amount from its verified payments. */
export const recalcEnrollmentPaid = async (enrollmentId: string) => {
  const rows = unwrap(
    await supabase.from('payments').select('amount, status').eq('enrollment_id', enrollmentId)
  ) as { amount: number; status: string }[];
  const paid = rows
    .filter((r) => r.status === 'verified')
    .reduce((sum, r) => sum + Number(r.amount), 0);
  await supabase.from('enrollments').update({ paid_amount: paid }).eq('id', enrollmentId);
  return paid;
};

export const paymentsApi = {
  async listByStudent(studentId: string) {
    return unwrap(
      await supabase.from('payments').select('*').eq('student_id', studentId).order('paid_at', { ascending: false })
    ) as CloudPayment[];
  },
  async listPending() {
    return unwrap(
      await supabase.from('payments').select('*').eq('status', 'pending').order('paid_at', { ascending: false })
    ) as CloudPayment[];
  },
  async create(input: Tables['payments']['Insert']) {
    const row = unwrap(await supabase.from('payments').insert(input).select().single()) as CloudPayment;
    if (row.enrollment_id) await recalcEnrollmentPaid(row.enrollment_id);
    await logAudit('CREATE', 'payment', row.id, null, row);
    return row;
  },
  async setStatus(id: string, status: 'verified' | 'rejected' | 'pending') {
    const uid = await currentUserId();
    const row = unwrap(
      await supabase
        .from('payments')
        .update({
          status,
          verified_by: status === 'pending' ? null : uid,
          verified_at: status === 'pending' ? null : new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
    ) as CloudPayment;
    if (row.enrollment_id) await recalcEnrollmentPaid(row.enrollment_id);
    await logAudit('VERIFY', 'payment', id, null, { status });
    return row;
  },
  async update(id: string, patch: Tables['payments']['Update']) {
    const row = unwrap(await supabase.from('payments').update(patch).eq('id', id).select().single()) as CloudPayment;
    if (row.enrollment_id) await recalcEnrollmentPaid(row.enrollment_id);
    await logAudit('UPDATE', 'payment', id, null, patch);
    return row;
  },
  async remove(id: string) {
    const existing = unwrap(
      await supabase.from('payments').select('enrollment_id').eq('id', id).single()
    ) as { enrollment_id: string | null };
    const { error } = await supabase.from('payments').delete().eq('id', id);
    if (error) throw new Error(error.message);
    if (existing?.enrollment_id) await recalcEnrollmentPaid(existing.enrollment_id);
    await logAudit('DELETE', 'payment', id);
  },
};

/* ---------------- NOTIFICATIONS ---------------- */
export const notificationsApi = {
  async listForUser(userId: string) {
    return unwrap(
      await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(100)
    ) as CloudNotification[];
  },
  async send(rows: Tables['notifications']['Insert'][]) {
    return unwrap(await supabase.from('notifications').insert(rows).select()) as CloudNotification[];
  },
  async markRead(id: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  },
};

/* ---------------- AUDIT LOGS ---------------- */
export const auditApi = {
  async list(limit = 200) {
    return unwrap(
      await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(limit)
    ) as CloudAuditLog[];
  },
};
