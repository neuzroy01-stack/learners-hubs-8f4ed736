/**
 * Production seed: the application is database-only.
 *
 * Every business entity (users, courses, classes, lectures, materials,
 * assignments, fees, payments, salaries, attendance…) now lives in the cloud
 * database. The legacy browser store is therefore seeded EMPTY so no demo or
 * dummy record can ever surface in the UI. Only non-business UI defaults
 * (institute settings, homepage banners) are still seeded locally.
 */
import type {
  User, StudentProfile, TeacherProfile, Course, Batch, Enrollment, FeeAdjustment,
  PaymentRecord, StaffSalaryRecord, LiveClass, RecordedClass, AttendanceRecord,
  Assignment, Quiz, QuizAttempt, StudyMaterial, Certificate, Announcement,
  NotificationItem, ActivityLog, SupportTicket,
} from '../types/lms';

export { INITIAL_SETTINGS, INITIAL_BANNERS } from './mockSeed';

export const INITIAL_USERS: User[] = [];
export const INITIAL_STUDENTS: StudentProfile[] = [];
export const INITIAL_TEACHERS: TeacherProfile[] = [];
export const INITIAL_COURSES: Course[] = [];
export const INITIAL_BATCHES: Batch[] = [];
export const INITIAL_ENROLLMENTS: Enrollment[] = [];
export const INITIAL_FEE_ADJUSTMENTS: FeeAdjustment[] = [];
export const INITIAL_PAYMENTS: PaymentRecord[] = [];
export const INITIAL_STAFF_SALARIES: StaffSalaryRecord[] = [];
export const INITIAL_LIVE_CLASSES: LiveClass[] = [];
export const INITIAL_RECORDED_CLASSES: RecordedClass[] = [];
export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];
export const INITIAL_ASSIGNMENTS: Assignment[] = [];
export const INITIAL_QUIZZES: Quiz[] = [];
export const INITIAL_QUIZ_ATTEMPTS: QuizAttempt[] = [];
export const INITIAL_STUDY_MATERIALS: StudyMaterial[] = [];
export const INITIAL_CERTIFICATES: Certificate[] = [];
export const INITIAL_ANNOUNCEMENTS: Announcement[] = [];
export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];
export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [];
export const INITIAL_SUPPORT_TICKETS: SupportTicket[] = [];
