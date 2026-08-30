import React, { useState } from 'react';
import { db } from '../../services/db';
import {
  Shield,
  DollarSign,
  Users,
  BookOpen,
  TrendingUp,
  FileText,
  Clock,
  Download,
  Plus,
  CheckCircle,
  Database,
  ArrowUpRight,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export const SuperAdminDashboard: React.FC = () => {
  const users = db.getUsers();
  const students = db.getStudents();
  const courses = db.getCourses();
  const approvedPayments = db.getApprovedPayments();
  const salaries = db.getStaffSalaries();
  const auditLogs = db.getActivityLogs();
  const settings = db.getSettings();

  const totalRevenue = approvedPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalSalaryExpense = salaries.reduce((sum, s) => sum + s.paidAmount, 0);
  const netMargin = totalRevenue - totalSalaryExpense;

  // Monthly Revenue Chart Data
  const chartData = [
    { month: 'Jan', revenue: 120000, salary: 170000 },
    { month: 'Feb', revenue: 240000, salary: 177000 },
    { month: 'Mar', revenue: 310000, salary: 177000 },
    { month: 'Apr', revenue: 280000, salary: 180000 },
    { month: 'May', revenue: 420000, salary: 185000 },
    { month: 'Jun', revenue: 510000, salary: 185000 },
    { month: 'Jul', revenue: totalRevenue, salary: totalSalaryExpense }
  ];

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6'];

  const courseDistribution = courses.map((c) => ({
    name: c.title.split(' ')[0],
    value: students.filter((s) => s.batchName.includes(c.title.split(' ')[0])).length || 3
  }));

  const handleExportBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      users,
      students,
      courses,
      payments: approvedPayments,
      salaries,
      settings
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edupro_full_db_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4 text-purple-400" />
            <span>Super Admin Executive Control Center</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Enterprise Overview & System Health</h1>
          <p className="text-xs text-purple-200 mt-1">
            Global governance, system audit logs, full financial control & DB management.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportBackup}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg transition-all cursor-pointer"
          >
            <Database className="w-4 h-4" />
            <span>Export Full DB JSON</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Revenue Collected</span>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {settings.currencySymbol}{totalRevenue.toLocaleString()}
          </div>
          <div className="flex items-center space-x-1 text-[11px] text-emerald-600 font-semibold mt-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+24.5% vs last quarter</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Staff Salary Disbursed</span>
            <div className="p-2 bg-purple-100 dark:bg-purple-950/50 text-purple-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {settings.currencySymbol}{totalSalaryExpense.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {salaries.length} Staff records
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Net Operating Margin</span>
            <div className="p-2 bg-blue-100 dark:bg-blue-950/50 text-blue-600 rounded-xl">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-black ${netMargin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {settings.currencySymbol}{netMargin.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Revenue minus Expenses</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Active System Users</span>
            <div className="p-2 bg-amber-100 dark:bg-amber-950/50 text-amber-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {users.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {students.length} Students • {users.filter(u => u.role === 'admin' || u.role === 'super_admin').length} Admins
          </div>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Financial Growth & Payroll Trends</h3>
            <span className="text-xs text-slate-400 font-semibold">2026 YTD</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" fillOpacity={1} fill="url(#colorRev)" name="Revenue" />
                <Area type="monotone" dataKey="salary" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorSal)" name="Salary Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Student Course Distribution</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={courseDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {courseDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 text-xs">
            {courses.map((c, idx) => (
              <div key={c.id} className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="truncate max-w-[150px]">{c.title}</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">{c.feeAmount.toLocaleString()} {settings.currencySymbol}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent System Audit Logs</h3>
          </div>
          <span className="text-xs text-slate-400 font-semibold">{auditLogs.length} Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Actor / User</th>
                <th className="p-3">Role</th>
                <th className="p-3">Action</th>
                <th className="p-3">Target Record</th>
                <th className="p-3">Details</th>
                <th className="p-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {auditLogs.slice(0, 5).map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="p-3 font-semibold text-slate-900 dark:text-white">{log.userName}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 capitalize">
                      {log.userRole.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{log.action}</td>
                  <td className="p-3 text-slate-700 dark:text-slate-300">{log.targetEntity}</td>
                  <td className="p-3 text-slate-500 dark:text-slate-400">{log.details}</td>
                  <td className="p-3 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
