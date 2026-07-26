export type UserRole = 'super_admin' | 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  status: 'active' | 'inactive' | 'blocked';
  createdAt: string;
  lastLogin?: string;
  policyAccepted?: boolean;
  policyAcceptedAt?: string;
  policyAcceptedVersion?: string;
  passwordHash?: string; // stored plain in mock db; treated as opaque credential
}


export interface StudentProfile {
  id: string;
  userId: string;
  studentCode: string; // e.g. STU-2026-001
  fullName: string;
  fatherName: string;
  motherName: string;
  phone: string;
  whatsappPhone: string;
  email: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  address: string;
  photoUrl: string;
  admissionDate: string;
  batchId: string;
  batchName: string;
  counselorName?: string;
  status: 'active' | 'inactive' | 'blocked' | 'graduated';
  remarks?: string;
}

export interface TeacherProfile {
  id: string;
  userId: string;
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string;
  photoUrl?: string;
  subjectSpecialization: string;
  designation: string;
  joiningDate: string;
  monthlySalary: number;
  status: 'active' | 'inactive';
  assignedBatchIds: string[];
  assignedCourseIds: string[];
}

export interface TrashRecord {
  id: string;
  entity: 'payment' | 'salary' | 'other';
  recordId: string;
  label: string;
  amount: number;
  snapshot: any;
  reason: string;
  deletedById: string;
  deletedByName: string;
  deletedByRole: UserRole;
  deletedAt: string;
}

export interface RoadmapTopic {
  id: string;
  title: string;
  description: string;
  dayNumber: number;
  isCompleted?: boolean;
}

export interface RoadmapWeek {
  id: string;
  weekNumber: number;
  title: string;
  description: string;
  topics: RoadmapTopic[];
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  durationMinutes: number;
  videoUrl: string;
  videoType: 'youtube' | 'mp4' | 'embed';
  attachmentUrl?: string;
  attachmentName?: string;
  order: number;
  isLocked?: boolean;
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  banner?: string;
  instructorId: string;
  instructorName: string;
  durationMonths: number;
  feeAmount: number;
  startDate: string;
  endDate: string;
  status: 'published' | 'draft' | 'archived';
  weeks: RoadmapWeek[];
  modules: CourseModule[];
  certificateEligiblePercentage: number;
}

export interface Batch {
  id: string;
  name: string; // e.g. Batch A 2026
  courseId: string;
  courseTitle: string;
  teacherId: string;
  teacherName: string;
  startDate: string;
  endDate: string;
  timing: string; // e.g., 10:00 AM - 12:00 PM
  status: 'upcoming' | 'ongoing' | 'completed';
  maxCapacity: number;
  currentEnrolledCount: number;
  code?: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseTitle: string;
  batchId: string;
  batchName: string;
  enrollmentDate: string;
  originalFee: number;
  discountAmount: number;
  finalFee: number;
  status: 'enrolled' | 'completed' | 'dropped';
  progressPercentage: number;
}

export interface FeeAdjustment {
  id: string;
  enrollmentId: string;
  studentId: string;
  type: 'extra_charge' | 'discount' | 'late_fee' | 'scholarship' | 'refund';
  amount: number; // positive for charge/fee, negative for discount/scholarship
  reason: string;
  date: string;
  createdBy: string;
}

export interface PaymentRecord {
  id: string;
  enrollmentId: string;
  studentId: string;
  studentName: string;
  courseTitle: string;
  receiptNumber: string; // e.g., RCP-2026-1002
  amount: number;
  paymentDate: string;
  paymentMode: 'Cash' | 'UPI' | 'Net Banking' | 'Credit Card' | 'Cheque';
  transactionId: string;
  screenshotUrl?: string;
  status: 'approved' | 'pending_verification' | 'rejected';
  remarks?: string;
  recordedBy: string;
  verifiedAt?: string;
}

export interface FeeSummary {
  studentId: string;
  enrollmentId: string;
  originalFee: number;
  discountAmount: number;
  totalAdjustments: number;
  finalFee: number;
  totalPaid: number;
  remainingAmount: number;
  dueDate: string;
  paymentStatus: 'paid' | 'partial' | 'overdue' | 'pending';
}

export interface StaffSalaryRecord {
  id: string;
  teacherId: string;
  teacherName: string;
  monthYear: string; // e.g., "July 2026"
  baseSalary: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  paidAmount: number;
  pendingSalary: number;
  paymentDate?: string;
  paymentMode?: string;
  transactionId?: string;
  status: 'paid' | 'partial' | 'pending';
  remarks?: string;
}

export interface LiveClass {
  id: string;
  title: string;
  topic: string;
  courseId: string;
  courseTitle: string;
  batchId: string;
  batchName: string;
  teacherId: string;
  teacherName: string;
  date: string;
  startTime: string;
  endTime: string;
  meetingLink: string;
  recordingLink?: string;
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
  notes?: string;
}

export interface RecordedClass {
  id: string;
  title: string;
  courseId: string;
  courseTitle: string;
  batchId: string;
  recordingDate: string;
  durationMinutes: number;
  videoUrl: string;
  notesUrl?: string;
  notesPdfUrl?: string;
  thumbnail?: string;
  weekNumber?: number;
  topic?: string;
  isLocked?: boolean;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  batchId: string;
  studentId: string;
  studentName: string;
  status: 'present' | 'absent' | 'late' | 'leave';
  markedBy: string;
  remarks?: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  content: string;
  fileUrl?: string;
  fileName?: string;
  marksObtained?: number;
  feedback?: string;
  status: 'submitted' | 'graded' | 'late';
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  courseId: string;
  courseTitle: string;
  batchId: string;
  batchName: string;
  teacherId: string;
  teacherName: string;
  dueDate: string;
  maxMarks: number;
  attachmentUrl?: string;
  attachmentName?: string;
  status: 'active' | 'closed';
  submissions: Submission[];
}

export interface QuizQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number; // 0..3
  marks: number;
  explanation?: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  courseId: string;
  courseTitle: string;
  batchId: string;
  durationMinutes: number;
  passingPercentage: number;
  totalMarks: number;
  questions: QuizQuestion[];
  status: 'active' | 'draft' | 'closed';
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  studentId: string;
  studentName: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  attemptedAt: string;
  userAnswers: Record<string, number>; // questionId -> optionIndex
}

export interface StudyMaterial {
  id: string;
  title: string;
  courseId: string;
  courseTitle: string;
  category: 'PDF Notes' | 'Lecture Slides' | 'Practice Sheet' | 'Video Resource' | 'External Link';
  fileUrl: string;
  fileName: string;
  fileSize?: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Certificate {
  id: string;
  certificateNumber: string; // e.g. CERT-2026-EDU-883
  studentId: string;
  studentName: string;
  courseId: string;
  courseTitle: string;
  issueDate: string;
  completionDate: string;
  grade: string;
  verifyUrl: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  targetRole: 'all' | 'students' | 'teachers';
  courseId?: string;
  batchId?: string;
  priority: 'high' | 'medium' | 'low';
  publishDate: string;
  createdBy: string;
  bannerUrl?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  targetEntity: string;
  details: string;
  ipAddress: string;
  timestamp: string;
  actorName?: string;
  target?: string;
  role?: UserRole;
}

export interface PolicyVersion {
  version: string;
  effectiveDate: string;
  termsContent: string;
  privacyContent: string;
  updatedBy: string;
}

export interface PaymentSettings {
  upiId: string;
  accountHolder: string;
  description: string;
  isActive: boolean;
}

export interface InstituteSettings {
  name: string;
  tagline: string;
  logoUrl: string;
  contactEmail: string;
  phone: string;
  whatsapp: string;
  address: string;
  primaryColor: string;
  currencySymbol: string;
  footerText: string;
  policy: PolicyVersion;
  payment?: PaymentSettings;
}


export interface SupportTicketReply {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  message: string;
  attachmentUrl?: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  studentId: string;
  studentName: string;
  subject: string;
  category: 'Billing & Fee' | 'Course Content' | 'Technical Issue' | 'Live Class' | 'Certificate' | 'General';
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  attachmentUrl?: string;
  replies: SupportTicketReply[];
  createdAt: string;
  updatedAt: string;
}

export interface HomeBanner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  targetCourseId?: string;
  buttonText: string;
  buttonLink?: string;
  isActive: boolean;
  order: number;
}

export interface StudentVideoProgress {
  studentId: string;
  lessonId: string;
  watchedSeconds: number;
  totalSeconds: number;
  completed: boolean;
  updatedAt: string;
}
