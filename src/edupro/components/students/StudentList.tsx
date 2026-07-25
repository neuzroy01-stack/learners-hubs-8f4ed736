import React, { useState } from 'react';
import { db } from '../../services/db';
import { StudentProfile } from '../../types/lms';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  UserPlus,
  X,
  Eye,
  EyeOff,
  CheckCircle2
} from 'lucide-react';

export const StudentList: React.FC<{
  onSelectStudent: (student: StudentProfile) => void;
}> = ({ onSelectStudent }) => {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdSummary, setCreatedSummary] = useState<{ code: string; phone: string; password: string } | null>(null);

  // New Student Form State
  const [newFullName, setNewFullName] = useState('');
  const [newFatherName, setNewFatherName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newGender, setNewGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [newCourseId, setNewCourseId] = useState('');
  const [newBatchId, setNewBatchId] = useState('');

  const students = db.getStudents();
  const courses = db.getCourses();
  const batches = db.getBatches();
  const settings = db.getSettings();

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone.includes(searchTerm) ||
      s.batchName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const resetForm = () => {
    setNewFullName(''); setNewFatherName(''); setNewPhone(''); setNewEmail('');
    setNewPassword(''); setNewCourseId(''); setNewBatchId(''); setFormError(null);
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const phoneDigits = newPhone.replace(/[^0-9]/g, '');
    if (phoneDigits.length < 6) { setFormError('Enter a valid phone number (min 6 digits).'); return; }
    if (!newPassword || newPassword.length < 4) { setFormError('Password must be at least 4 characters.'); return; }

    // Prevent duplicate phone (users are looked up by phone at login)
    const existing = db.getUsers().find((u) => u.phone.replace(/[^0-9]/g, '') === phoneDigits);
    if (existing) { setFormError(`Phone already used by ${existing.name}. Choose a different number.`); return; }

    try {
      const { student } = db.createStudentAccount(
        {
          fullName: newFullName.trim(),
          fatherName: newFatherName.trim(),
          phone: newPhone.trim(),
          email: newEmail.trim(),
          password: newPassword,
          gender: newGender,
          courseId: newCourseId || undefined,
          batchId: newBatchId || undefined,
        },
        currentUser?.id || 'usr-superadmin',
        currentUser?.name || 'Super Admin',
      );

      setCreatedSummary({ code: student.studentCode, phone: student.phone, password: newPassword });
      setShowAddModal(false);
      resetForm();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to create student account.');
    }
  };

  const handleToggleBlock = (s: StudentProfile) => {
    s.status = s.status === 'blocked' ? 'active' : 'blocked';
    db.saveStudent(s);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Student Management Directory</h1>
          <p className="text-xs text-slate-500">View enrolled students, create admissions, and manage fee ledgers.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>New Student Admission</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700 w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search student code, name, phone, batch..."
            className="bg-transparent text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none w-full"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5">Student Info</th>
                <th className="p-3.5">Student Code</th>
                <th className="p-3.5">Batch / Course</th>
                <th className="p-3.5">Contact Details</th>
                <th className="p-3.5">Admission Date</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="p-3.5">
                    <div className="flex items-center space-x-3">
                      <img src={s.photoUrl} alt={s.fullName} className="w-9 h-9 rounded-xl object-cover ring-2 ring-slate-200 dark:ring-slate-700" />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{s.fullName}</div>
                        <div className="text-[10px] text-slate-400">Father: {s.fatherName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono font-bold text-blue-600 dark:text-blue-400">{s.studentCode}</td>
                  <td className="p-3.5 text-slate-700 dark:text-slate-300">{s.batchName}</td>
                  <td className="p-3.5 text-slate-500 dark:text-slate-400 space-y-0.5">
                    <div>{s.phone}</div>
                    <div className="text-[10px]">{s.email}</div>
                  </td>
                  <td className="p-3.5 text-slate-400">{s.admissionDate}</td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      s.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right space-x-2">
                    <button
                      onClick={() => onSelectStudent(s)}
                      className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold"
                    >
                      Profile & Ledger
                    </button>
                    <button
                      onClick={() => handleToggleBlock(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        s.status === 'blocked'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                      }`}
                    >
                      {s.status === 'blocked' ? 'Unblock' : 'Block'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Student Admission Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">New Student Admission & Enrollment</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Student Full Name</label>
                  <input
                    type="text"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="e.g. Ankit Verma"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Father's Name</label>
                  <input
                    type="text"
                    value={newFatherName}
                    onChange={(e) => setNewFatherName(e.target.value)}
                    placeholder="e.g. Ramesh Verma"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="ankit@example.com"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Assign Course</label>
                  <select
                    value={newCourseId}
                    onChange={(e) => setNewCourseId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.title} ({settings.currencySymbol}{c.feeAmount.toLocaleString()})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Assign Batch</label>
                  <select
                    value={newBatchId}
                    onChange={(e) => setNewBatchId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
                >
                  Admit Student & Assign Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
