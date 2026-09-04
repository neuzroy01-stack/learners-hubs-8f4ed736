import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { PolicyConsentModal } from './components/common/PolicyConsentModal';
import { PublicLanding } from './components/common/PublicLanding';
import { FeedbackProvider } from './components/common/Feedback';

import { SuperAdminDashboard } from './components/dashboards/SuperAdminDashboard';
import { AdminDashboard } from './components/dashboards/AdminDashboard';
import { TeacherDashboard } from './components/dashboards/TeacherDashboard';
import { StudentDashboard } from './components/dashboards/StudentDashboard';

import { StudentList } from './components/students/StudentList';
import { VideoPlayerView } from './components/courses/VideoPlayerView';
import { CourseContentManager } from './components/courses/CourseContentManager';
import { CourseManagementView } from './components/courses/CourseManagementView';
import { CloudCourseManager } from './components/courses/CloudCourseManager';
import { MyCloudCoursesView } from './components/courses/MyCloudCoursesView';
import { CourseAssignmentView } from './components/enrollments/CourseAssignmentView';
import { PaymentApprovalView } from './components/fees/PaymentApprovalView';
import { MyCloudFeesView } from './components/fees/MyCloudFeesView';
import { RecordedLecturesView } from './components/courses/RecordedLecturesView';
import { AssignmentsView } from './components/assignments/AssignmentsView';
import { ExamsView } from './components/exams/ExamsView';
import { AttendanceView } from './components/attendance/AttendanceView';
import { FreeDownloadsView } from './components/downloads/FreeDownloadsView';
import { HelpSupportView } from './components/support/HelpSupportView';
import { LiveClassesView } from './components/live/LiveClassesView';
import { BatchManagementView } from './components/batches/BatchManagementView';

import { FeeManagementView } from './components/fees/FeeManagementView';
import { AccountsManagementView } from './components/accounts/AccountsManagementView';

import { ReportsAnalyticsView } from './components/analytics/ReportsAnalyticsView';
import { SettingsView } from './components/settings/SettingsView';

import { Course, StudentProfile } from './types/lms';
import { db } from './services/db';

const MainAppContent: React.FC = () => {
  const { currentRole, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [selectedCourseForLearning, setSelectedCourseForLearning] = useState<Course | null>(null);

  const handleSelectStudentProfile = (student: StudentProfile) => {
    setActiveTab('fees');
  };

  const renderActiveView = () => {
    if (selectedCourseForLearning) {
      return (
        <VideoPlayerView
          course={selectedCourseForLearning}
          onBack={() => setSelectedCourseForLearning(null)}
        />
      );
    }

    switch (activeTab) {
      case 'public_landing':
      case 'home':
        return <PublicLanding onLoginClick={() => setActiveTab('dashboard')} />;

      case 'dashboard':
        if (currentRole === 'super_admin') return <SuperAdminDashboard />;
        if (currentRole === 'admin') return <AdminDashboard onNavigateTab={setActiveTab} />;
        if (currentRole === 'teacher') return <TeacherDashboard onNavigateTab={setActiveTab} />;
        return <StudentDashboard onSelectCourse={setSelectedCourseForLearning} onNavigateTab={setActiveTab} />;

      case 'course_content':
        return <CourseContentManager />;

      case 'admins_staff':
        return <AccountsManagementView />;

      case 'students':
        return <StudentList onSelectStudent={handleSelectStudentProfile} />;


      case 'my_courses':
        return <MyCloudCoursesView />;

      case 'courses':
        return <CloudCourseManager />;

      case 'course_syllabus':
        return <CourseManagementView />;

      case 'course_assignment':
        return <CourseAssignmentView />;

      case 'payment_verify':
        return <PaymentApprovalView />;

      case 'my_fees':
        return <MyCloudFeesView />;

      case 'recordings':
      case 'recorded_lectures':
        return <RecordedLecturesView />;

      case 'assignments':
      case 'assignments_quizzes':
      case 'academics':
        return <AssignmentsView />;

      case 'exams':
        return <ExamsView />;

      case 'attendance':
      case 'attendance_marker':
      case 'attendance_log':
        return <AttendanceView />;

      case 'downloads':
      case 'study_materials':
        return <FreeDownloadsView />;

      case 'help':
      case 'help_support':
        return <HelpSupportView />;

      case 'live_classes':
      case 'live_schedule':
        return <LiveClassesView />;

      case 'batches':
      case 'my_batches':
        return <BatchManagementView />;

      case 'fees':
      case 'financials':
      case 'salary':
      case 'my_salary':
        return <FeeManagementView />;

      case 'reports':
        return <ReportsAnalyticsView />;

      case 'settings':
      case 'policies':
      case 'audit_logs':
        return <SettingsView />;

      default:
        if (currentRole === 'super_admin') return <SuperAdminDashboard />;
        if (currentRole === 'admin') return <AdminDashboard onNavigateTab={setActiveTab} />;
        if (currentRole === 'teacher') return <TeacherDashboard onNavigateTab={setActiveTab} />;
        return <StudentDashboard onSelectCourse={setSelectedCourseForLearning} onNavigateTab={setActiveTab} />;
    }
  };

  if (activeTab === 'public_landing') {
    return <PublicLanding onLoginClick={() => setActiveTab('dashboard')} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors overflow-x-hidden">
      <Navbar onOpenMobileMenu={() => setMobileNavOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          mobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
          setActiveTab={(tab) => {
            setSelectedCourseForLearning(null);
            setActiveTab(tab);
          }}
        />

        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
          {renderActiveView()}
        </main>
      </div>

      {/* Mandatory First Login Consent Modal for Students */}
      <PolicyConsentModal />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <FeedbackProvider>
        <AuthProvider>
          <MainAppContent />
        </AuthProvider>
      </FeedbackProvider>
    </ThemeProvider>
  );
}
