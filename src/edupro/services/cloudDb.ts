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

/* ---------------- FINANCE SUMMARY ---------------- */
export type StudentFinance = {
  total: number;
  paid: number;
  outstanding: number;
  status: 'PAID' | 'PARTIAL' | 'UNPAID';
  fees: CloudFee[];
  payments: CloudPayment[];
};

/**
 * Single source of truth for a student's money position.
 * Total = sum of fee rows (amount + tax - discount). Paid = verified payments only.
 */
export const studentFinance = async (studentId: string): Promise<StudentFinance> => {
  const [fees, payments] = await Promise.all([
    feesApi.listByStudent(studentId),
    paymentsApi.listByStudent(studentId),
  ]);
  const total = fees.reduce(
    (sum, f) => sum + Number(f.amount) + Number(f.tax_amount) - Number(f.discount),
    0
  );
  const paid = payments
    .filter((p) => p.status === 'verified')
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const outstanding = Math.max(0, total - paid);
  const status: StudentFinance['status'] =
    total > 0 && outstanding === 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'UNPAID';
  return { total, paid, outstanding, status, fees, payments };
};

/** All pending payments joined with the student name for the approval queue. */
export const pendingPaymentsWithNames = async () => {
  const rows = await paymentsApi.listPending();
  if (rows.length === 0) return [] as (CloudPayment & { student_name: string; course_title: string })[];
  const studentIds = [...new Set(rows.map((r) => r.student_id))];
  const courseIds = [...new Set(rows.map((r) => r.course_id).filter(Boolean))] as string[];
  const [{ data: profiles }, { data: courses }] = await Promise.all([
    supabase.from('profiles').select('id, full_name').in('id', studentIds),
    courseIds.length
      ? supabase.from('courses').select('id, title').in('id', courseIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);
  const nameOf = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
  const titleOf = new Map((courses ?? []).map((c) => [c.id, c.title]));
  return rows.map((r) => ({
    ...r,
    student_name: nameOf.get(r.student_id) ?? 'Unknown student',
    course_title: (r.course_id && titleOf.get(r.course_id)) || '—',
  }));
};

/* ---------------- ROSTER (course -> enrolled students) ---------------- */
export type RosterEntry = {
  enrollment_id: string;
  student_id: string;
  full_name: string;
  phone: string | null;
  batch_name: string | null;
  status: string;
};

/** Enrolled students of a single course, always keyed by student UUID. */
export const courseRoster = async (courseId: string): Promise<RosterEntry[]> => {
  const rows = await enrollmentsApi.listByCourse(courseId);
  if (rows.length === 0) return [];
  const ids = [...new Set(rows.map((r) => r.student_id))];
  const { data: profiles } = await supabase.from('profiles').select('id, full_name, phone').in('id', ids);
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  return rows.map((r) => ({
    enrollment_id: r.id,
    student_id: r.student_id,
    full_name: byId.get(r.student_id)?.full_name ?? 'Unknown student',
    phone: byId.get(r.student_id)?.phone ?? null,
    batch_name: r.batch_name,
    status: r.status,
  }));
};

/* ---------------- REVENUE (staff) ---------------- */
export type StudentLedgerRow = {
  student_id: string;
  full_name: string;
  phone: string | null;
  total: number;
  paid: number;
  outstanding: number;
  status: 'PAID' | 'PARTIAL' | 'UNPAID';
};

export type RevenueSummary = {
  totalBilled: number;
  totalCollected: number;
  totalPending: number;
  studentCount: number;
  perStudent: StudentLedgerRow[];
  perCourse: { course_id: string; title: string; billed: number; collected: number }[];
  monthly: { month: string; collected: number }[];
};

/**
 * Whole-institute money position, computed from fees + verified payments.
 * Every amount is attributed by student_id / course_id — never by name.
 */
export const revenueSummary = async (): Promise<RevenueSummary> => {
  const [feesRes, paymentsRes, profilesRes, coursesRes] = await Promise.all([
    supabase.from('fees').select('*'),
    supabase.from('payments').select('*'),
    supabase.from('profiles').select('id, full_name, phone').eq('role', 'student'),
    supabase.from('courses').select('id, title'),
  ]);
  const fees = (feesRes.data ?? []) as CloudFee[];
  const payments = ((paymentsRes.data ?? []) as CloudPayment[]).filter((p) => p.status === 'verified');
  const profiles = (profilesRes.data ?? []) as { id: string; full_name: string; phone: string | null }[];
  const courses = (coursesRes.data ?? []) as { id: string; title: string }[];

  const billedBy = new Map<string, number>();
  fees.forEach((f) => {
    const value = Number(f.amount) + Number(f.tax_amount) - Number(f.discount);
    billedBy.set(f.student_id, (billedBy.get(f.student_id) ?? 0) + value);
  });
  const paidBy = new Map<string, number>();
  payments.forEach((p) => paidBy.set(p.student_id, (paidBy.get(p.student_id) ?? 0) + Number(p.amount)));

  const perStudent: StudentLedgerRow[] = profiles
    .map((p) => {
      const total = billedBy.get(p.id) ?? 0;
      const paid = paidBy.get(p.id) ?? 0;
      const outstanding = Math.max(0, total - paid);
      const status: StudentLedgerRow['status'] =
        total > 0 && outstanding === 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'UNPAID';
      return { student_id: p.id, full_name: p.full_name, phone: p.phone, total, paid, outstanding, status };
    })
    .sort((a, b) => a.full_name.localeCompare(b.full_name));

  const titleOf = new Map(courses.map((c) => [c.id, c.title]));
  const courseAgg = new Map<string, { billed: number; collected: number }>();
  fees.forEach((f) => {
    if (!f.course_id) return;
    const cur = courseAgg.get(f.course_id) ?? { billed: 0, collected: 0 };
    cur.billed += Number(f.amount) + Number(f.tax_amount) - Number(f.discount);
    courseAgg.set(f.course_id, cur);
  });
  payments.forEach((p) => {
    if (!p.course_id) return;
    const cur = courseAgg.get(p.course_id) ?? { billed: 0, collected: 0 };
    cur.collected += Number(p.amount);
    courseAgg.set(p.course_id, cur);
  });

  const monthAgg = new Map<string, number>();
  payments.forEach((p) => {
    const key = new Date(p.paid_at).toISOString().slice(0, 7);
    monthAgg.set(key, (monthAgg.get(key) ?? 0) + Number(p.amount));
  });

  return {
    totalBilled: perStudent.reduce((s, r) => s + r.total, 0),
    totalCollected: perStudent.reduce((s, r) => s + r.paid, 0),
    totalPending: perStudent.reduce((s, r) => s + r.outstanding, 0),
    studentCount: profiles.length,
    perStudent,
    perCourse: [...courseAgg.entries()].map(([id, v]) => ({
      course_id: id,
      title: titleOf.get(id) ?? 'Unknown course',
      billed: v.billed,
      collected: v.collected,
    })),
    monthly: [...monthAgg.entries()].sort().map(([month, collected]) => ({ month, collected })),
  };
};

/** Enrollments of one student with course titles — used by the fee editor. */
export const studentEnrollments = async (studentId: string) => {
  const rows = await enrollmentsApi.listByStudent(studentId);
  return rows.map((r) => ({ id: r.id, course_id: r.course_id, title: r.courses?.title ?? 'Course' }));
};

/* ---------------- PAYMENT PROOFS (private storage) ---------------- */
export const paymentProofs = {
  /** Uploads a screenshot into the student's own folder and returns the storage path. */
  async upload(studentId: string, file: File) {
    const safe = file.name.replace(/[^\w.\-]/g, '_');
    const path = `${studentId}/${Date.now()}-${safe}`;
    const { error } = await supabase.storage.from('payment-proofs').upload(path, file, { upsert: false });
    if (error) throw new Error(error.message);
    return path;
  },
  /** Short-lived signed URL — the bucket is private. */
  async signedUrl(path: string) {
    const { data } = await supabase.storage.from('payment-proofs').createSignedUrl(path, 3600);
    return data?.signedUrl ?? null;
  },
};

/**
 * Student-initiated UPI payment request.
 * Always lands as `pending` — the outstanding balance is untouched until an
 * admin verifies it (paid totals only ever count `verified` payments).
 */
export const submitPaymentRequest = async (input: {
  studentId: string;
  enrollmentId?: string | null;
  courseId?: string | null;
  amount: number;
  utr: string;
  note?: string | null;
  proofPath?: string | null;
}) => {
  const row = unwrap(
    await supabase
      .from('payments')
      .insert({
        student_id: input.studentId,
        enrollment_id: input.enrollmentId ?? null,
        course_id: input.courseId ?? null,
        amount: input.amount,
        method: 'upi',
        reference_no: input.utr,
        receipt_url: input.proofPath ?? null,
        notes: input.note ?? null,
        status: 'pending',
        paid_at: new Date().toISOString(),
      })
      .select()
      .single()
  ) as CloudPayment;
  return row;
};

/** Approve / reject a payment request, with a reason the student can read back. */
export const reviewPayment = async (
  payment: CloudPayment,
  decision: 'verified' | 'rejected',
  reason?: string
) => {
  const uid = await currentUserId();
  const row = unwrap(
    await supabase
      .from('payments')
      .update({
        status: decision,
        notes: reason?.trim() ? reason.trim() : payment.notes,
        verified_by: uid,
        verified_at: new Date().toISOString(),
      })
      .eq('id', payment.id)
      .select()
      .single()
  ) as CloudPayment;
  if (row.enrollment_id) await recalcEnrollmentPaid(row.enrollment_id);
  await notificationsApi
    .send([
      {
        user_id: payment.student_id,
        course_id: payment.course_id,
        type: 'payment',
        title: decision === 'verified' ? 'Payment approved' : 'Payment rejected',
        body:
          decision === 'verified'
            ? `Your payment of ₹${Number(payment.amount).toLocaleString('en-IN')} has been verified and applied to your fees.`
            : `Your payment of ₹${Number(payment.amount).toLocaleString('en-IN')} was rejected. ${reason?.trim() || 'Please submit a new request.'}`,
      },
    ])
    .catch(() => undefined);
  await logAudit('REVIEW', 'payment', payment.id, { status: payment.status }, { status: decision, reason });
  return row;
};

/* ---------------- STUDENT OVERVIEW (dashboard) ---------------- */
export type CourseProgress = {
  course: CloudCourse;
  enrollment_id: string;
  completed: number;
  total: number;
  percent: number;
};

export type StudentOverview = {
  courses: CourseProgress[];
  overallProgress: number;
  attendance: { present: number; total: number; percent: number };
  finance: StudentFinance;
  upcomingLive: CloudLiveClass[];
};

/**
 * Everything the student dashboard shows, derived only from database rows.
 * Progress counts real completed activities (graded/submitted assignments and
 * attended sessions) against everything scheduled for that course.
 */
export const studentOverview = async (studentId: string): Promise<StudentOverview> => {
  const enrollments = await enrollmentsApi.listByStudent(studentId);
  const active = enrollments.filter((e) => e.status === 'active' && e.courses);
  const courseIds = active.map((e) => e.course_id);

  const [lectures, watched, attendance] = await Promise.all([
    courseIds.length
      ? (unwrap(
          await supabase
            .from('recorded_lectures')
            .select('id, course_id')
            .in('course_id', courseIds)
            .eq('is_published', true)
        ) as { id: string; course_id: string }[])
      : Promise.resolve([] as { id: string; course_id: string }[]),
    courseIds.length
      ? (unwrap(
          await supabase
            .from('lecture_progress')
            .select('lecture_id, course_id, completed')
            .eq('student_id', studentId)
            .in('course_id', courseIds)
        ) as { lecture_id: string; course_id: string; completed: boolean }[])
      : Promise.resolve([] as { lecture_id: string; course_id: string; completed: boolean }[]),
    attendanceApi.listByStudent(studentId),
  ]);

  const [finance, live] = await Promise.all([

    studentFinance(studentId),
    courseIds.length
      ? (unwrap(
          await supabase
            .from('live_classes')
            .select('*')
            .in('course_id', courseIds)
            .eq('is_published', true)
            .gte('starts_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
            .order('starts_at', { ascending: true })
            .limit(5)
        ) as CloudLiveClass[])
      : Promise.resolve([] as CloudLiveClass[]),
  ]);

  const submittedIds = new Set(submissions.map((s) => s.assignment_id));

  const courses: CourseProgress[] = active.map((e) => {
    const courseAssignments = assignments.filter((a) => a.course_id === e.course_id);
    const courseAttendance = attendance.filter((a) => a.course_id === e.course_id);
    const completed =
      courseAssignments.filter((a) => submittedIds.has(a.id)).length +
      courseAttendance.filter((a) => a.status === 'present').length;
    const total = courseAssignments.length + courseAttendance.length;
    return {
      course: e.courses as CloudCourse,
      enrollment_id: e.id,
      completed,
      total,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });

  const totalItems = courses.reduce((s, c) => s + c.total, 0);
  const doneItems = courses.reduce((s, c) => s + c.completed, 0);
  const present = attendance.filter((a) => a.status === 'present').length;

  return {
    courses,
    overallProgress: totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0,
    attendance: {
      present,
      total: attendance.length,
      percent: attendance.length > 0 ? Math.round((present / attendance.length) * 100) : 0,
    },
    finance,
    upcomingLive: live,
  };
};

/** Published catalogue for the public landing page (anon-readable). */
export const publicCourses = async () => {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as CloudCourse[];
};

/* ---------------- STAFF OVERVIEW (admin / teacher dashboards) ---------------- */
export type StaffOverview = {
  students: number;
  teachers: number;
  admins: number;
  courses: number;
  publishedCourses: number;
  activeEnrollments: number;
  revenue: RevenueSummary;
  pendingPayments: number;
  upcomingLive: CloudLiveClass[];
  pendingSubmissions: number;
};

const countOf = async (table: 'profiles' | 'enrollments' | 'courses' | 'payments', apply: (q: any) => any) => {
  const q = apply(supabase.from(table).select('id', { count: 'exact', head: true }));
  const { count, error } = await q;
  if (error) throw new Error(error.message);
  return count ?? 0;
};

/** Live institute metrics for staff dashboards — no cached or demo numbers. */
export const staffOverview = async (): Promise<StaffOverview> => {
  const [students, teachers, admins, courses, publishedCourses, activeEnrollments, revenue, pendingPayments] =
    await Promise.all([
      countOf('profiles', (q) => q.eq('role', 'student')),
      countOf('profiles', (q) => q.eq('role', 'teacher')),
      countOf('profiles', (q) => q.in('role', ['admin', 'super_admin'])),
      countOf('courses', (q) => q),
      countOf('courses', (q) => q.eq('is_published', true)),
      countOf('enrollments', (q) => q.eq('status', 'active')),
      revenueSummary(),
      countOf('payments', (q) => q.eq('status', 'pending')),
    ]);

  const upcomingLive = unwrap(
    await supabase
      .from('live_classes')
      .select('*')
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true })
      .limit(5)
  ) as CloudLiveClass[];

  const pendingSubmissions = unwrap(
    await supabase.from('assignment_submissions').select('id').eq('status', 'submitted')
  ) as { id: string }[];

  return {
    students,
    teachers,
    admins,
    courses,
    publishedCourses,
    activeEnrollments,
    revenue,
    pendingPayments,
    upcomingLive,
    pendingSubmissions: pendingSubmissions.length,
  };
};

/* ---------------- LECTURE PROGRESS ---------------- */
export type CloudLectureProgress = Tables['lecture_progress']['Row'];

export const lectureProgressApi = {
  /** All progress rows of one student inside one course. */
  async listForCourse(studentId: string, courseId: string) {
    return unwrap(
      await supabase
        .from('lecture_progress')
        .select('*')
        .eq('student_id', studentId)
        .eq('course_id', courseId)
    ) as CloudLectureProgress[];
  },

  /** Marks a lecture watched / unwatched for the signed-in student. */
  async setCompleted(courseId: string, lectureId: string, completed: boolean) {
    const uid = await currentUserId();
    if (!uid) throw new Error('Please sign in again.');
    const { error } = await supabase.from('lecture_progress').upsert(
      {
        student_id: uid,
        course_id: courseId,
        lecture_id: lectureId,
        completed,
        percent: completed ? 100 : 0,
      },
      { onConflict: 'student_id,lecture_id' }
    );
    if (error) throw new Error(error.message);
  },
};

export type CourseProgress = { total: number; completed: number; percent: number };

/**
 * Progress = completed recorded lectures / total published lectures.
 * Returns null when the course has no lectures, so the UI can hide the widget
 * instead of showing a meaningless 0%.
 */
export const courseProgress = async (
  studentId: string,
  courseId: string
): Promise<CourseProgress | null> => {
  const [lectures, progress] = await Promise.all([
    unwrap(
      await supabase
        .from('recorded_lectures')
        .select('id')
        .eq('course_id', courseId)
        .eq('is_published', true)
    ) as Promise<{ id: string }[]> | { id: string }[],
    lectureProgressApi.listForCourse(studentId, courseId),
  ]);
  const ids = new Set((lectures as { id: string }[]).map((l) => l.id));
  if (ids.size === 0) return null;
  const completed = progress.filter((p) => p.completed && ids.has(p.lecture_id)).length;
  return { total: ids.size, completed, percent: Math.round((completed / ids.size) * 100) };
};

/* ---------------- QUIZZES / ONLINE EXAMS ---------------- */
export type CloudQuiz = Tables['quizzes']['Row'];
export type CloudQuizQuestion = Tables['quiz_questions']['Row'];
export type CloudQuizAttempt = Tables['quiz_attempts']['Row'];
/** Question as delivered to a student — the answer key is never included. */
export type QuizPaperQuestion = {
  id: string;
  prompt: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  marks: number;
  sort_order: number;
};

export const quizzesApi = {
  async listByCourse(courseId: string) {
    return unwrap(
      await supabase
        .from('quizzes')
        .select('*')
        .eq('course_id', courseId)
        .order('week_number', { ascending: true })
        .order('created_at', { ascending: false })
    ) as CloudQuiz[];
  },

  async create(payload: Tables['quizzes']['Insert']) {
    const row = unwrap(await supabase.from('quizzes').insert(payload).select().single()) as CloudQuiz;
    await logAudit('quiz.create', 'quizzes', row.id, null, payload);
    return row;
  },

  async update(id: string, payload: Tables['quizzes']['Update']) {
    const row = unwrap(await supabase.from('quizzes').update(payload).eq('id', id).select().single()) as CloudQuiz;
    await logAudit('quiz.update', 'quizzes', id, null, payload);
    return row;
  },

  async remove(id: string) {
    const { error } = await supabase.from('quizzes').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await logAudit('quiz.delete', 'quizzes', id);
  },

  /* --- questions (staff only; RLS hides the answer key from students) --- */
  async questions(quizId: string) {
    return unwrap(
      await supabase.from('quiz_questions').select('*').eq('quiz_id', quizId).order('sort_order')
    ) as CloudQuizQuestion[];
  },

  async saveQuestion(payload: Tables['quiz_questions']['Insert'] & { id?: string }) {
    const { id, ...rest } = payload;
    if (id) {
      return unwrap(
        await supabase.from('quiz_questions').update(rest).eq('id', id).select().single()
      ) as CloudQuizQuestion;
    }
    return unwrap(
      await supabase.from('quiz_questions').insert(rest).select().single()
    ) as CloudQuizQuestion;
  },

  async removeQuestion(id: string) {
    const { error } = await supabase.from('quiz_questions').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  /* --- student attempt flow: every rule is enforced in the database --- */
  async paper(quizId: string) {
    const { data, error } = await supabase.rpc('quiz_paper', { _quiz_id: quizId });
    if (error) throw new Error(error.message);
    return (data ?? []) as QuizPaperQuestion[];
  },

  async startAttempt(quizId: string) {
    const { data, error } = await supabase.rpc('start_quiz_attempt', { _quiz_id: quizId });
    if (error) throw new Error(error.message);
    return data as unknown as CloudQuizAttempt;
  },

  async saveAnswers(attemptId: string, answers: Record<string, string>) {
    const { error } = await supabase.rpc('save_quiz_answers', {
      _attempt_id: attemptId,
      _answers: answers as never,
    });
    if (error) throw new Error(error.message);
  },

  async submitAttempt(attemptId: string, answers: Record<string, string>) {
    const { data, error } = await supabase.rpc('submit_quiz_attempt', {
      _attempt_id: attemptId,
      _answers: answers as never,
    });
    if (error) throw new Error(error.message);
    return data as unknown as CloudQuizAttempt;
  },

  async myAttempts(quizId: string, studentId: string) {
    return unwrap(
      await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('quiz_id', quizId)
        .eq('student_id', studentId)
        .order('attempt_no', { ascending: false })
    ) as CloudQuizAttempt[];
  },

  /** Staff view of everyone's attempts for one quiz. */
  async attemptsForQuiz(quizId: string) {
    return unwrap(
      await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('quiz_id', quizId)
        .order('submitted_at', { ascending: false })
    ) as CloudQuizAttempt[];
  },
};
