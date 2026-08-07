import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Users,
  Calendar,
  CreditCard,
  Video,
  FileCheck,
  Award,
  FolderDown,
  BarChart3,
  Settings,
  Shield,
  FileText,
  DollarSign,
  HelpCircle,
  Radio,
  FileSpreadsheet,
  UserCheck,
  X
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, mobileOpen = false, onCloseMobile }) => {
  const { currentRole } = useAuth();

  const getMenuItems = () => {
    switch (currentRole) {
      case 'super_admin':
        return [
          { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
          { id: 'admins_staff', label: 'Admins & Staff', icon: Users },
          { id: 'students', label: 'Students Directory', icon: GraduationCap },
          { id: 'courses', label: 'Courses (Database)', icon: BookOpen },
          { id: 'course_syllabus', label: 'Syllabus Builder', icon: FileText },
          { id: 'course_content', label: 'Course Content Manager', icon: FolderDown },
          { id: 'course_assignment', label: 'Course Assignment', icon: UserCheck },
          { id: 'financials', label: 'Fee Revenue', icon: CreditCard },
          { id: 'payment_verify', label: 'Payment Verification', icon: FileCheck },
          { id: 'salary', label: 'Staff Salaries', icon: DollarSign },
          { id: 'quizzes', label: 'Quizzes & Exams', icon: Award },
          { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
          { id: 'policies', label: 'Policies & Consent', icon: FileText },
          { id: 'audit_logs', label: 'Audit Trail Logs', icon: Shield },
          { id: 'settings', label: 'System Settings', icon: Settings }
        ];

      case 'admin':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'students', label: 'Student Management', icon: GraduationCap },
          { id: 'courses', label: 'Courses (Database)', icon: BookOpen },
          { id: 'course_syllabus', label: 'Syllabus Builder', icon: FileText },
          { id: 'course_content', label: 'Course Content Manager', icon: FolderDown },
          { id: 'course_assignment', label: 'Course Assignment', icon: UserCheck },
          { id: 'batches', label: 'Batches & Live Schedule', icon: Calendar },
          { id: 'fees', label: 'Fee Collection Ledger', icon: CreditCard },
          { id: 'payment_verify', label: 'Payment Verification', icon: FileCheck },
          { id: 'attendance', label: 'Attendance Matrix', icon: FileSpreadsheet },
          { id: 'academics', label: 'Assignments & Quizzes', icon: Award },
          { id: 'quizzes', label: 'Online Exams', icon: Award },
          { id: 'reports', label: 'Reports Generator', icon: BarChart3 },
          { id: 'settings', label: 'Institute Config', icon: Settings }
        ];

      case 'teacher':
        return [
          { id: 'dashboard', label: 'Teaching Overview', icon: LayoutDashboard },
          { id: 'my_batches', label: 'My Batches & Roadmap', icon: BookOpen },
          { id: 'course_content', label: 'Course Content Manager', icon: FolderDown },
          { id: 'live_schedule', label: 'Live Classes', icon: Radio },
          { id: 'attendance_marker', label: 'Mark Attendance', icon: FileSpreadsheet },
          { id: 'study_materials', label: 'Study Materials', icon: FolderDown },
          { id: 'assignments', label: 'Assignment Reviewer', icon: FileCheck },
          { id: 'my_salary', label: 'Salary Ledger', icon: DollarSign }
        ];

      case 'student':
        return [
          { id: 'dashboard', label: 'Student Dashboard', icon: LayoutDashboard },
          { id: 'my_courses', label: 'My Enrolled Courses', icon: BookOpen },
          { id: 'live_classes', label: 'Live Classes', icon: Radio },
          { id: 'recordings', label: 'Recorded Lectures', icon: Video },
          { id: 'assignments_quizzes', label: 'Assignments & Quizzes', icon: FileCheck },
          { id: 'attendance_log', label: 'My Attendance', icon: FileSpreadsheet },
          { id: 'downloads', label: 'Study Downloads', icon: FolderDown },
          { id: 'my_fees', label: 'Fee Ledger & Proof', icon: CreditCard },
          { id: 'certificates', label: 'My Certificates', icon: Award },
          { id: 'help', label: 'Help & Support', icon: HelpCircle }
        ];

      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 max-w-[82vw] shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white transition-transform duration-200 dark:border-slate-800 dark:bg-slate-900 lg:static lg:z-auto lg:min-h-[calc(100vh-57px)] lg:max-w-none lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 p-3 dark:border-slate-800 lg:hidden">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500">Menu</span>
          <button
            type="button"
            onClick={onCloseMobile}
            className="cursor-pointer rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-1 p-4">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {currentRole.replace('_', ' ')} Navigation
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onCloseMobile?.();
                }}
                className={`flex w-full items-center space-x-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                <span className="truncate text-left">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Footer Banner */}
        <div className="border-t border-slate-100 p-4 dark:border-slate-800">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
            <div className="mb-0.5 font-bold text-slate-800 dark:text-slate-200">Learner Hub v2.5 Enterprise</div>
            <div>Cloud DB &amp; Security Active</div>
          </div>
        </div>
      </aside>
    </>
  );
};
