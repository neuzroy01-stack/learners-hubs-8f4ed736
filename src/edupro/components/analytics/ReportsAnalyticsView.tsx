import React from 'react';
import { db } from '../../services/db';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  TrendingUp,
  Users,
  DollarSign,
  GraduationCap
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export const ReportsAnalyticsView: React.FC = () => {
  const students = db.getStudents();
  const payments = db.getApprovedPayments();
  const salaries = db.getStaffSalaries();
  const courses = db.getCourses();
  const settings = db.getSettings();

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalSalaries = salaries.reduce((sum, s) => sum + s.paidAmount, 0);

  const revenueData = [
    { month: 'Jan', revenue: 120000, salary: 170000 },
    { month: 'Feb', revenue: 240000, salary: 177000 },
    { month: 'Mar', revenue: 310000, salary: 177000 },
    { month: 'Apr', revenue: 280000, salary: 180000 },
    { month: 'May', revenue: 420000, salary: 185000 },
    { month: 'Jun', revenue: 510000, salary: 185000 },
    { month: 'Jul', revenue: totalRevenue, salary: totalSalaries }
  ];

  const attendanceData = [
    { batch: 'MERN Alpha', rate: 92 },
    { batch: 'Data Science 1', rate: 85 },
    { batch: 'AI Advanced', rate: 89 }
  ];

  const exportStudentsCSV = () => {
    const headers = ['StudentCode', 'FullName', 'FatherName', 'Phone', 'Email', 'Batch', 'Status'];
    const rows = students.map((s) => [s.studentCode, s.fullName, s.fatherName, s.phone, s.email, s.batchName, s.status]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `learnerhub_students_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPaymentsCSV = () => {
    const headers = ['ReceiptNo', 'StudentName', 'CourseTitle', 'Amount', 'Mode', 'TransactionID', 'Date'];
    const rows = payments.map((p) => [p.receiptNumber, p.studentName, p.courseTitle, p.amount, p.paymentMode, p.transactionId, p.paymentDate]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `learnerhub_fee_payments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Institutional Reports & Analytics</h1>
          <p className="text-xs text-slate-500">
            Real-time financial growth graphs, student performance metrics, and CSV export tools.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={exportStudentsCSV}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Students CSV</span>
          </button>
          <button
            onClick={exportPaymentsCSV}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Fee Revenue CSV</span>
          </button>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expense Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Revenue vs Staff Salary Expenses</h3>
            <span className="text-xs text-slate-400 font-semibold">2026 Trend</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Bar dataKey="revenue" fill="#2563eb" name="Revenue" radius={[4, 4, 0, 0]} />
                <Bar dataKey="salary" fill="#8b5cf6" name="Payroll" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Batch Attendance Comparison */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Batch Attendance Percentage</h3>
            <span className="text-xs text-emerald-600 font-bold">Average: 88.6%</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData} layout="vertical">
                <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                <YAxis dataKey="batch" type="category" stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Bar dataKey="rate" fill="#10b981" name="Attendance %" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
