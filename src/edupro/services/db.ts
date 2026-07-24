import {
  User,
  StudentProfile,
  TeacherProfile,
  Course,
  Batch,
  Enrollment,
  FeeAdjustment,
  PaymentRecord,
  StaffSalaryRecord,
  LiveClass,
  RecordedClass,
  AttendanceRecord,
  Assignment,
  Submission,
  Quiz,
  QuizAttempt,
  StudyMaterial,
  Certificate,
  Announcement,
  NotificationItem,
  ActivityLog,
  InstituteSettings,
  FeeSummary,
  StudentVideoProgress,
  SupportTicket,
  HomeBanner
} from '../types/lms';

import {
  INITIAL_USERS,
  INITIAL_STUDENTS,
  INITIAL_TEACHERS,
  INITIAL_COURSES,
  INITIAL_BATCHES,
  INITIAL_ENROLLMENTS,
  INITIAL_FEE_ADJUSTMENTS,
  INITIAL_PAYMENTS,
  INITIAL_STAFF_SALARIES,
  INITIAL_LIVE_CLASSES,
  INITIAL_RECORDED_CLASSES,
  INITIAL_ATTENDANCE,
  INITIAL_ASSIGNMENTS,
  INITIAL_QUIZZES,
  INITIAL_QUIZ_ATTEMPTS,
  INITIAL_STUDY_MATERIALS,
  INITIAL_CERTIFICATES,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_SETTINGS,
  INITIAL_BANNERS,
  INITIAL_SUPPORT_TICKETS
} from './mockData';

const STORAGE_KEYS = {
  USERS: 'edupro_users_v2',
  STUDENTS: 'edupro_students_v2',
  TEACHERS: 'edupro_teachers_v2',
  COURSES: 'edupro_courses_v2',
  BATCHES: 'edupro_batches_v2',
  ENROLLMENTS: 'edupro_enrollments_v2',
  FEE_ADJUSTMENTS: 'edupro_fee_adjustments_v2',
  PAYMENTS: 'edupro_payments_v2',
  SALARIES: 'edupro_salaries_v2',
  LIVE_CLASSES: 'edupro_live_classes_v2',
  RECORDED_CLASSES: 'edupro_recorded_classes_v2',
  ATTENDANCE: 'edupro_attendance_v2',
  ASSIGNMENTS: 'edupro_assignments_v2',
  QUIZZES: 'edupro_quizzes_v2',
  QUIZ_ATTEMPTS: 'edupro_quiz_attempts_v2',
  STUDY_MATERIALS: 'edupro_study_materials_v2',
  CERTIFICATES: 'edupro_certificates_v2',
  ANNOUNCEMENTS: 'edupro_announcements_v2',
  NOTIFICATIONS: 'edupro_notifications_v2',
  ACTIVITY_LOGS: 'edupro_activity_logs_v2',
  SETTINGS: 'edupro_settings_v2',
  VIDEO_PROGRESS: 'edupro_video_progress_v2',
  BANNERS: 'edupro_banners_v2',
  SUPPORT_TICKETS: 'edupro_support_tickets_v2'
};

function getItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    listeners.forEach((listener) => listener());
  } catch (err) {
    console.error(`Error saving ${key} to storage:`, err);
  }
}

const listeners: Array<() => void> = [];

export const db = {
  subscribe(listener: () => void) {
    listeners.push(listener);
    return () => {
      const idx = listeners.indexOf(listener);
      if (idx > -1) listeners.splice(idx, 1);
    };
  },

  resetToDefaults() {
    setItem(STORAGE_KEYS.USERS, INITIAL_USERS);
    setItem(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    setItem(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);
    setItem(STORAGE_KEYS.COURSES, INITIAL_COURSES);
    setItem(STORAGE_KEYS.BATCHES, INITIAL_BATCHES);
    setItem(STORAGE_KEYS.ENROLLMENTS, INITIAL_ENROLLMENTS);
    setItem(STORAGE_KEYS.FEE_ADJUSTMENTS, INITIAL_FEE_ADJUSTMENTS);
    setItem(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
    setItem(STORAGE_KEYS.SALARIES, INITIAL_STAFF_SALARIES);
    setItem(STORAGE_KEYS.LIVE_CLASSES, INITIAL_LIVE_CLASSES);
    setItem(STORAGE_KEYS.RECORDED_CLASSES, INITIAL_RECORDED_CLASSES);
    setItem(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
    setItem(STORAGE_KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS);
    setItem(STORAGE_KEYS.QUIZZES, INITIAL_QUIZZES);
    setItem(STORAGE_KEYS.QUIZ_ATTEMPTS, INITIAL_QUIZ_ATTEMPTS);
    setItem(STORAGE_KEYS.STUDY_MATERIALS, INITIAL_STUDY_MATERIALS);
    setItem(STORAGE_KEYS.CERTIFICATES, INITIAL_CERTIFICATES);
    setItem(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
    setItem(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    setItem(STORAGE_KEYS.ACTIVITY_LOGS, INITIAL_ACTIVITY_LOGS);
    setItem(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    setItem(STORAGE_KEYS.VIDEO_PROGRESS, []);
    setItem(STORAGE_KEYS.BANNERS, INITIAL_BANNERS);
    setItem(STORAGE_KEYS.SUPPORT_TICKETS, INITIAL_SUPPORT_TICKETS);
  },

  // USERS & AUTH
  getUsers(): User[] {
    return getItem(STORAGE_KEYS.USERS, INITIAL_USERS);
  },
  saveUser(user: User): User {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx > -1) {
      users[idx] = { ...users[idx], ...user };
    } else {
      users.push(user);
    }
    setItem(STORAGE_KEYS.USERS, users);
    return user;
  },
  acceptPolicy(userId: string, policyVersion: string): User | undefined {
    const users = this.getUsers();
    const user = users.find((u) => u.id === userId);
    if (user) {
      user.policyAccepted = true;
      user.policyAcceptedAt = new Date().toISOString();
      user.policyAcceptedVersion = policyVersion;
      setItem(STORAGE_KEYS.USERS, users);
      this.logActivity(user.id, user.name, user.role, 'POLICY_CONSENT_ACCEPTED', 'First Login Consent', `Accepted policy ${policyVersion}`);
      return user;
    }
    return undefined;
  },

  // STUDENTS
  getStudents(): StudentProfile[] {
    return getItem(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
  },
  getStudentByUserId(userId: string): StudentProfile | undefined {
    return this.getStudents().find((s) => s.userId === userId);
  },
  saveStudent(student: StudentProfile): StudentProfile {
    const students = this.getStudents();
    const idx = students.findIndex((s) => s.id === student.id);
    if (idx > -1) {
      students[idx] = { ...students[idx], ...student };
    } else {
      students.push(student);
    }
    setItem(STORAGE_KEYS.STUDENTS, students);

    // Also sync user record name/phone/status
    const users = this.getUsers();
    const uIdx = users.findIndex((u) => u.id === student.userId);
    if (uIdx > -1) {
      users[uIdx].name = student.fullName;
      users[uIdx].phone = student.phone;
      users[uIdx].email = student.email;
      users[uIdx].status = student.status === 'blocked' ? 'blocked' : 'active';
      setItem(STORAGE_KEYS.USERS, users);
    }
    return student;
  },

  // TEACHERS
  getTeachers(): TeacherProfile[] {
    return getItem(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);
  },
  saveTeacher(teacher: TeacherProfile): TeacherProfile {
    const teachers = this.getTeachers();
    const idx = teachers.findIndex((t) => t.id === teacher.id);
    if (idx > -1) {
      teachers[idx] = { ...teachers[idx], ...teacher };
    } else {
      teachers.push(teacher);
    }
    setItem(STORAGE_KEYS.TEACHERS, teachers);
    return teacher;
  },

  // COURSES
  getCourses(): Course[] {
    return getItem(STORAGE_KEYS.COURSES, INITIAL_COURSES);
  },
  getCourseById(courseId: string): Course | undefined {
    return this.getCourses().find((c) => c.id === courseId);
  },
  saveCourse(course: Course): Course {
    const courses = this.getCourses();
    const idx = courses.findIndex((c) => c.id === course.id);
    if (idx > -1) {
      courses[idx] = { ...courses[idx], ...course };
    } else {
      courses.push(course);
    }
    setItem(STORAGE_KEYS.COURSES, courses);
    return course;
  },

  // BATCHES
  getBatches(): Batch[] {
    return getItem(STORAGE_KEYS.BATCHES, INITIAL_BATCHES);
  },
  saveBatch(batch: Batch): Batch {
    const batches = this.getBatches();
    const idx = batches.findIndex((b) => b.id === batch.id);
    if (idx > -1) {
      batches[idx] = { ...batches[idx], ...batch };
    } else {
      batches.push(batch);
    }
    setItem(STORAGE_KEYS.BATCHES, batches);
    return batch;
  },

  // ENROLLMENTS & AUTOMATIC FEE CALCULATION
  getEnrollments(): Enrollment[] {
    return getItem(STORAGE_KEYS.ENROLLMENTS, INITIAL_ENROLLMENTS);
  },
  enrollStudentInCourse(
    studentId: string,
    studentName: string,
    courseId: string,
    batchId: string,
    discount: number = 0,
    actorName: string
  ): { enrollment: Enrollment; feeSummary: FeeSummary } {
    const course = this.getCourseById(courseId);
    const batch = this.getBatches().find((b) => b.id === batchId);
    if (!course || !batch) throw new Error('Course or Batch not found');

    const originalFee = course.feeAmount;
    const finalFee = Math.max(0, originalFee - discount);

    const enrollment: Enrollment = {
      id: `enr-${Date.now()}`,
      studentId,
      studentName,
      courseId,
      courseTitle: course.title,
      batchId,
      batchName: batch.name,
      enrollmentDate: new Date().toISOString().split('T')[0],
      originalFee,
      discountAmount: discount,
      finalFee,
      status: 'enrolled',
      progressPercentage: 0
    };

    const enrollments = this.getEnrollments();
    enrollments.push(enrollment);
    setItem(STORAGE_KEYS.ENROLLMENTS, enrollments);

    // If discount exists, record as fee adjustment
    if (discount > 0) {
      this.addFeeAdjustment({
        id: `adj-${Date.now()}`,
        enrollmentId: enrollment.id,
        studentId,
        type: 'discount',
        amount: -discount,
        reason: 'Initial Course Enrollment Discount',
        date: new Date().toISOString().split('T')[0],
        createdBy: actorName
      });
    }

    // Increment batch enrolled count
    batch.currentEnrolledCount += 1;
    this.saveBatch(batch);

    this.logActivity(studentId, actorName, 'admin', 'ENROLL_STUDENT', course.title, `Enrolled ${studentName} with fee ${finalFee}`);

    return { enrollment, feeSummary: this.getFeeSummaryForStudent(studentId, enrollment.id) };
  },

  // FEE ADJUSTMENTS
  getFeeAdjustments(): FeeAdjustment[] {
    return getItem(STORAGE_KEYS.FEE_ADJUSTMENTS, INITIAL_FEE_ADJUSTMENTS);
  },
  addFeeAdjustment(adjustment: FeeAdjustment): FeeAdjustment {
    const list = this.getFeeAdjustments();
    list.push(adjustment);
    setItem(STORAGE_KEYS.FEE_ADJUSTMENTS, list);
    return adjustment;
  },

  // PAYMENTS & RECEIPT GENERATION
  getPayments(): PaymentRecord[] {
    return getItem(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
  },
  getApprovedPayments(): PaymentRecord[] {
    return this.getPayments().filter((p) => p.status === 'approved');
  },
  recordPayment(payment: PaymentRecord): PaymentRecord {
    const list = this.getPayments();
    const idx = list.findIndex((p) => p.id === payment.id);
    if (idx > -1) {
      list[idx] = { ...list[idx], ...payment };
    } else {
      list.push(payment);
    }
    setItem(STORAGE_KEYS.PAYMENTS, list);

    if (payment.status === 'approved') {
      this.addNotification({
        id: `notif-${Date.now()}`,
        userId: payment.studentId,
        title: '💳 Payment Received & Approved',
        message: `Your payment of ${this.getSettings().currencySymbol}${payment.amount.toLocaleString()} (Receipt: ${payment.receiptNumber}) was verified successfully.`,
        type: 'success',
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }

    return payment;
  },
  verifyPayment(
    paymentId: string,
    status: 'approved' | 'rejected' | 'pending_verification',
    remarks: string,
    verifierName: string
  ): PaymentRecord | undefined {
    const list = this.getPayments();
    const payment = list.find((p) => p.id === paymentId);
    if (payment) {
      payment.status = status;
      if (remarks) payment.remarks = remarks;
      payment.verifiedAt = new Date().toISOString();
      setItem(STORAGE_KEYS.PAYMENTS, list);

      this.logActivity(
        'usr-admin',
        verifierName,
        'admin',
        `VERIFY_PAYMENT_${status.toUpperCase()}`,
        payment.studentName,
        `Payment ${payment.receiptNumber} status updated to ${status}. Remarks: ${remarks || 'N/A'}`
      );

      this.addNotification({
        id: `notif-${Date.now()}`,
        userId: payment.studentId,
        title: status === 'approved' ? '✅ Payment Receipt Approved' : status === 'rejected' ? '❌ Payment Verification Declined' : '⚠️ Payment Action Needed',
        message: status === 'approved'
          ? `Your payment of ${this.getSettings().currencySymbol}${payment.amount.toLocaleString()} (${payment.receiptNumber}) was verified and approved.`
          : `Payment record (${payment.receiptNumber}) notice: ${remarks || 'Please re-upload payment proof or contact finance desk.'}`,
        type: status === 'approved' ? 'success' : 'warning',
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }
    return payment;
  },

  // FINANCIAL FEE SUMMARY COMPUTATION
  getFeeSummaryForStudent(studentId: string, enrollmentId?: string): FeeSummary {
    const enrollments = this.getEnrollments().filter((e) => e.studentId === studentId);
    const targetEnrollment = enrollmentId
      ? enrollments.find((e) => e.id === enrollmentId) || enrollments[0]
      : enrollments[0];

    if (!targetEnrollment) {
      return {
        studentId,
        enrollmentId: '',
        originalFee: 0,
        discountAmount: 0,
        totalAdjustments: 0,
        finalFee: 0,
        totalPaid: 0,
        remainingAmount: 0,
        dueDate: 'N/A',
        paymentStatus: 'paid'
      };
    }

    const adjustments = this.getFeeAdjustments().filter((a) => a.enrollmentId === targetEnrollment.id);
    const extraCharges = adjustments
      .filter((a) => a.type === 'extra_charge' || a.type === 'late_fee')
      .reduce((sum, a) => sum + Math.abs(a.amount), 0);
    const additionalDiscounts = adjustments
      .filter((a) => a.type === 'discount' || a.type === 'scholarship' || a.type === 'refund')
      .reduce((sum, a) => sum + Math.abs(a.amount), 0);

    const netAdjustments = extraCharges - additionalDiscounts;
    const finalCalculatedFee = Math.max(0, targetEnrollment.originalFee - targetEnrollment.discountAmount + netAdjustments);

    const approvedPayments = this.getPayments().filter(
      (p) => p.enrollmentId === targetEnrollment.id && p.status === 'approved'
    );
    const totalPaid = approvedPayments.reduce((sum, p) => sum + p.amount, 0);
    const remainingAmount = Math.max(0, finalCalculatedFee - totalPaid);

    let paymentStatus: 'paid' | 'partial' | 'overdue' | 'pending' = 'pending';
    if (remainingAmount <= 0 && totalPaid > 0) {
      paymentStatus = 'paid';
    } else if (totalPaid > 0) {
      paymentStatus = 'partial';
    } else {
      paymentStatus = 'pending';
    }

    return {
      studentId,
      enrollmentId: targetEnrollment.id,
      originalFee: targetEnrollment.originalFee,
      discountAmount: targetEnrollment.discountAmount,
      totalAdjustments: netAdjustments,
      finalFee: finalCalculatedFee,
      totalPaid,
      remainingAmount,
      dueDate: '2026-08-15',
      paymentStatus
    };
  },

  // SALARIES
  getStaffSalaries(): StaffSalaryRecord[] {
    return getItem(STORAGE_KEYS.SALARIES, INITIAL_STAFF_SALARIES);
  },
  saveStaffSalary(record: StaffSalaryRecord): StaffSalaryRecord {
    const list = this.getStaffSalaries();
    const idx = list.findIndex((s) => s.id === record.id);
    if (idx > -1) {
      list[idx] = { ...list[idx], ...record };
    } else {
      list.push(record);
    }
    setItem(STORAGE_KEYS.SALARIES, list);
    return record;
  },

  // LIVE & RECORDED CLASSES
  getLiveClasses(): LiveClass[] {
    return getItem(STORAGE_KEYS.LIVE_CLASSES, INITIAL_LIVE_CLASSES);
  },
  saveLiveClass(liveClass: LiveClass): LiveClass {
    const list = this.getLiveClasses();
    const idx = list.findIndex((l) => l.id === liveClass.id);
    if (idx > -1) {
      list[idx] = { ...list[idx], ...liveClass };
    } else {
      list.push(liveClass);
    }
    setItem(STORAGE_KEYS.LIVE_CLASSES, list);
    return liveClass;
  },
  getRecordedClasses(): RecordedClass[] {
    return getItem(STORAGE_KEYS.RECORDED_CLASSES, INITIAL_RECORDED_CLASSES);
  },

  // ATTENDANCE
  getAttendance(): AttendanceRecord[] {
    return getItem(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
  },
  markBatchAttendance(date: string, batchId: string, records: Array<{ studentId: string; studentName: string; status: 'present' | 'absent' | 'late' | 'leave'; remarks?: string }>, actorName: string) {
    const list = this.getAttendance();
    const updatedList = list.filter((a) => !(a.date === date && a.batchId === batchId));

    records.forEach((r) => {
      updatedList.push({
        id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        date,
        batchId,
        studentId: r.studentId,
        studentName: r.studentName,
        status: r.status,
        markedBy: actorName,
        remarks: r.remarks
      });
    });

    setItem(STORAGE_KEYS.ATTENDANCE, updatedList);
    this.logActivity('usr-actor', actorName, 'teacher', 'MARK_ATTENDANCE', `Batch: ${batchId}`, `Marked attendance for ${records.length} students on ${date}`);
  },

  // ASSIGNMENTS & SUBMISSIONS
  getAssignments(): Assignment[] {
    return getItem(STORAGE_KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS);
  },
  saveAssignment(assignment: Assignment): Assignment {
    const list = this.getAssignments();
    const idx = list.findIndex((a) => a.id === assignment.id);
    if (idx > -1) {
      list[idx] = { ...list[idx], ...assignment };
    } else {
      list.push(assignment);
    }
    setItem(STORAGE_KEYS.ASSIGNMENTS, list);
    return assignment;
  },
  submitAssignment(assignmentId: string, submission: Submission): Submission {
    const list = this.getAssignments();
    const asg = list.find((a) => a.id === assignmentId);
    if (asg) {
      const idx = asg.submissions.findIndex((s) => s.studentId === submission.studentId);
      if (idx > -1) {
        asg.submissions[idx] = { ...asg.submissions[idx], ...submission };
      } else {
        asg.submissions.push(submission);
      }
      setItem(STORAGE_KEYS.ASSIGNMENTS, list);
    }
    return submission;
  },

  // QUIZZES & ATTEMPTS
  getQuizzes(): Quiz[] {
    return getItem(STORAGE_KEYS.QUIZZES, INITIAL_QUIZZES);
  },
  getQuizAttempts(): QuizAttempt[] {
    return getItem(STORAGE_KEYS.QUIZ_ATTEMPTS, INITIAL_QUIZ_ATTEMPTS);
  },
  recordQuizAttempt(attempt: QuizAttempt): QuizAttempt {
    const list = this.getQuizAttempts();
    list.push(attempt);
    setItem(STORAGE_KEYS.QUIZ_ATTEMPTS, list);
    return attempt;
  },

  // STUDY MATERIALS
  getStudyMaterials(): StudyMaterial[] {
    return getItem(STORAGE_KEYS.STUDY_MATERIALS, INITIAL_STUDY_MATERIALS);
  },
  saveStudyMaterial(material: StudyMaterial): StudyMaterial {
    const list = this.getStudyMaterials();
    list.push(material);
    setItem(STORAGE_KEYS.STUDY_MATERIALS, list);
    return material;
  },

  // CERTIFICATES
  getCertificates(): Certificate[] {
    return getItem(STORAGE_KEYS.CERTIFICATES, INITIAL_CERTIFICATES);
  },
  issueCertificate(cert: Certificate): Certificate {
    const list = this.getCertificates();
    list.push(cert);
    setItem(STORAGE_KEYS.CERTIFICATES, list);
    return cert;
  },

  // ANNOUNCEMENTS
  getAnnouncements(): Announcement[] {
    return getItem(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
  },
  saveAnnouncement(announcement: Announcement): Announcement {
    const list = this.getAnnouncements();
    list.unshift(announcement);
    setItem(STORAGE_KEYS.ANNOUNCEMENTS, list);
    return announcement;
  },

  // NOTIFICATIONS
  getNotifications(userId: string): NotificationItem[] {
    return getItem(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS).filter((n) => n.userId === userId || n.userId === 'all');
  },
  addNotification(notif: NotificationItem): NotificationItem {
    const list = getItem(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    list.unshift(notif);
    setItem(STORAGE_KEYS.NOTIFICATIONS, list);
    return notif;
  },
  markNotificationRead(notifId: string) {
    const list = getItem(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const item = list.find((n) => n.id === notifId);
    if (item) {
      item.isRead = true;
      setItem(STORAGE_KEYS.NOTIFICATIONS, list);
    }
  },

  // ACTIVITY LOGS
  getActivityLogs(): ActivityLog[] {
    return getItem(STORAGE_KEYS.ACTIVITY_LOGS, INITIAL_ACTIVITY_LOGS);
  },
  logActivity(userId: string, userName: string, userRole: any, action: string, targetEntity: string, details: string) {
    const logs = this.getActivityLogs();
    logs.unshift({
      id: `log-${Date.now()}`,
      userId,
      userName,
      userRole,
      action,
      targetEntity,
      details,
      ipAddress: '127.0.0.1 (Local Session)',
      timestamp: new Date().toISOString()
    });
    setItem(STORAGE_KEYS.ACTIVITY_LOGS, logs);
  },

  // SETTINGS & POLICIES
  getSettings(): InstituteSettings {
    return getItem(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  },
  saveSettings(settings: InstituteSettings): InstituteSettings {
    setItem(STORAGE_KEYS.SETTINGS, settings);
    return settings;
  },

  // VIDEO PROGRESS TRACKING
  getVideoProgressList(): StudentVideoProgress[] {
    return getItem(STORAGE_KEYS.VIDEO_PROGRESS, []);
  },
  saveVideoProgress(progress: StudentVideoProgress) {
    const list = this.getVideoProgressList();
    const idx = list.findIndex((p) => p.studentId === progress.studentId && p.lessonId === progress.lessonId);
    if (idx > -1) {
      list[idx] = progress;
    } else {
      list.push(progress);
    }
    setItem(STORAGE_KEYS.VIDEO_PROGRESS, list);
  },

  // HOME BANNERS MANAGEMENT
  getHomeBanners(): HomeBanner[] {
    return getItem(STORAGE_KEYS.BANNERS, INITIAL_BANNERS);
  },
  saveHomeBanner(banner: HomeBanner): HomeBanner {
    const list = this.getHomeBanners();
    const idx = list.findIndex((b) => b.id === banner.id);
    if (idx > -1) {
      list[idx] = { ...list[idx], ...banner };
    } else {
      list.push(banner);
    }
    setItem(STORAGE_KEYS.BANNERS, list);
    return banner;
  },
  deleteHomeBanner(bannerId: string) {
    const list = this.getHomeBanners().filter((b) => b.id !== bannerId);
    setItem(STORAGE_KEYS.BANNERS, list);
  },

  // SUPPORT TICKETS
  getSupportTickets(): SupportTicket[] {
    return getItem(STORAGE_KEYS.SUPPORT_TICKETS, INITIAL_SUPPORT_TICKETS);
  },
  saveSupportTicket(ticket: SupportTicket): SupportTicket {
    const list = this.getSupportTickets();
    const idx = list.findIndex((t) => t.id === ticket.id);
    if (idx > -1) {
      list[idx] = { ...list[idx], ...ticket };
    } else {
      list.unshift(ticket);
    }
    setItem(STORAGE_KEYS.SUPPORT_TICKETS, list);
    return ticket;
  },
  replySupportTicket(ticketId: string, senderId: string, senderName: string, senderRole: any, message: string, attachmentUrl?: string): SupportTicket | undefined {
    const list = this.getSupportTickets();
    const ticket = list.find((t) => t.id === ticketId);
    if (ticket) {
      ticket.replies.push({
        id: `rep-${Date.now()}`,
        senderId,
        senderName,
        senderRole,
        message,
        attachmentUrl,
        createdAt: new Date().toISOString()
      });
      ticket.updatedAt = new Date().toISOString();
      if (senderRole === 'admin' || senderRole === 'super_admin') {
        ticket.status = 'in_progress';
      }
      setItem(STORAGE_KEYS.SUPPORT_TICKETS, list);
      return ticket;
    }
    return undefined;
  },
  updateSupportTicketStatus(ticketId: string, status: 'open' | 'in_progress' | 'resolved' | 'closed') {
    const list = this.getSupportTickets();
    const ticket = list.find((t) => t.id === ticketId);
    if (ticket) {
      ticket.status = status;
      ticket.updatedAt = new Date().toISOString();
      setItem(STORAGE_KEYS.SUPPORT_TICKETS, list);
    }
  },

  // DELETION & DUPLICATION HELPERS
  deleteCourse(courseId: string) {
    const courses = this.getCourses().filter((c) => c.id !== courseId);
    setItem(STORAGE_KEYS.COURSES, courses);
  },
  duplicateCourse(courseId: string, actorName: string): Course | undefined {
    const original = this.getCourseById(courseId);
    if (!original) return undefined;
    const duplicated: Course = {
      ...original,
      id: `course-dup-${Date.now()}`,
      code: `${original.code}-COPY`,
      title: `${original.title} (Copy)`,
      status: 'draft',
      weeks: JSON.parse(JSON.stringify(original.weeks)),
      modules: JSON.parse(JSON.stringify(original.modules))
    };
    this.saveCourse(duplicated);
    this.logActivity('usr-actor', actorName, 'admin', 'DUPLICATE_COURSE', duplicated.title, `Duplicated course from ${original.title}`);
    return duplicated;
  },
  deleteStudent(studentId: string) {
    const students = this.getStudents().filter((s) => s.id !== studentId);
    setItem(STORAGE_KEYS.STUDENTS, students);
  },
  deleteStudyMaterial(materialId: string) {
    const materials = this.getStudyMaterials().filter((m) => m.id !== materialId);
    setItem(STORAGE_KEYS.STUDY_MATERIALS, materials);
  },
  deleteAssignment(assignmentId: string) {
    const assignments = this.getAssignments().filter((a) => a.id !== assignmentId);
    setItem(STORAGE_KEYS.ASSIGNMENTS, assignments);
  },

  // MANDATORY DEFAULT ZERO STUDENT CREATION RULE (Section 10 Requirement)
  createDefaultStudent(studentData: Partial<StudentProfile>, courseId: string, batchId: string, actorName: string) {
    const count = this.getStudents().length + 1;
    const studentCode = `STU-2026-${String(count).padStart(3, '0')}`;
    const userId = `usr-stu-${Date.now()}`;
    const studentId = `stu-${Date.now()}`;

    // 1. Create User
    const newUser: User = {
      id: userId,
      name: studentData.fullName || 'New Student',
      email: studentData.email || `student${count}@edupro.com`,
      phone: studentData.phone || '+91 90000 00000',
      role: 'student',
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0]
    };
    this.saveUser(newUser);

    // 2. Create Student Profile
    const batch = this.getBatches().find((b) => b.id === batchId);
    const newStudent: StudentProfile = {
      id: studentId,
      userId,
      studentCode,
      fullName: studentData.fullName || 'New Student',
      fatherName: studentData.fatherName || '',
      motherName: studentData.motherName || '',
      phone: studentData.phone || '',
      whatsappPhone: studentData.whatsappPhone || studentData.phone || '',
      email: studentData.email || '',
      dob: studentData.dob || '',
      gender: studentData.gender || 'Male',
      address: studentData.address || '',
      photoUrl: studentData.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      admissionDate: new Date().toISOString().split('T')[0],
      batchId: batchId || '',
      batchName: batch ? batch.name : 'Unassigned Batch',
      status: 'active'
    };
    this.saveStudent(newStudent);

    // 3. Enroll in Course with zero paid default
    const enrollmentResult = this.enrollStudentInCourse(studentId, newStudent.fullName, courseId, batchId, 0, actorName);

    this.logActivity(userId, actorName, 'super_admin', 'CREATE_STUDENT_DEFAULT', studentCode, `Created student ${newStudent.fullName} with default 0 stats & assigned course.`);

    return { student: newStudent, user: newUser, enrollment: enrollmentResult.enrollment };
  }
};
