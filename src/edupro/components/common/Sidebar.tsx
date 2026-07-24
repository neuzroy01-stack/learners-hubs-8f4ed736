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
  FileSpreadsheet
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { currentRole } = useAuth();

  const getMenuItems = () => {
    switch (currentRole) {
      case 'super_admin':
        return [
          { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
          { id: 'admins_staff', label: 'Admins & Staff', icon: Users },
          { id: 'students', label: 'Students Directory', icon: GraduationCap },
          { id: 'courses', label: 'Courses & Syllabus', icon: BookOpen },
          { id: 'financials', label: 'Fee Revenue', icon: CreditCard },
          { id: 'salary', label: 'Staff Salaries', icon: DollarSign },
          { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
          { id: 'policies', label: 'Policies & Consent', icon: FileText },
          { id: 'audit_logs', label: 'Audit Trail Logs', icon: Shield },
          { id: 'settings', label: 'System Settings', icon: Settings }
        ];

      case 'admin':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'students', label: 'Student Management', icon: GraduationCap },
          { id: 'courses', label: 'Courses & Roadmap', icon: BookOpen },
          { id: 'batches', label: 'Batches & Live Schedule', icon: Calendar },
          { id: 'fees', label: 'Fee Collection Ledger', icon: CreditCard },
          { id: 'payment_verify', label: 'Payment Verification', icon: FileCheck },
          { id: 'attendance', label: 'Attendance Matrix', icon: FileSpreadsheet },
          { id: 'academics', label: 'Assignments & Quizzes', icon: Award },
          { id: 'reports', label: 'Reports Generator', icon: BarChart3 },
          { id: 'settings', label: 'Institute Config', icon: Settings }
        ];

      case 'teacher':
        return [
          { id: 'dashboard', label: 'Teaching Overview', icon: LayoutDashboard },
          { id: 'my_batches', label: 'My Batches & Roadmap', icon: BookOpen },
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
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 min-h-[calc(100vh-57px)] transition-colors">
      <div className="p-4 flex-1 space-y-1">
        <div className="px-3 py-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          {currentRole.replace('_', ' ')} Navigation
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Footer Banner */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="font-bold text-slate-800 dark:text-slate-200 mb-0.5">Learner Hub v2.5 Enterprise</div>
          <div>Cloud DB & Security Active</div>
        </div>
      </div>
    </aside>
  );
};
