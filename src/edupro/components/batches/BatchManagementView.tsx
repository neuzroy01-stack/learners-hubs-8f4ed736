import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { Batch } from '../../types/lms';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar,
  Users,
  Plus,
  Edit2,
  Trash2,
  UserCheck,
  Search,
  CheckCircle,
  X
} from 'lucide-react';

export const BatchManagementView: React.FC = () => {
  const { currentUser } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);

  // Form
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [courseId, setCourseId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [capacity, setCapacity] = useState(50);
  const [teacherName, setTeacherName] = useState('');

  const courses = db.getCourses();
  const teachers = db.getTeachers();

  useEffect(() => {
    loadBatches();
    const unsub = db.subscribe(() => loadBatches());
    return unsub;
  }, []);

  const loadBatches = () => {
    setBatches(db.getBatches());
  };

  const handleSaveBatch = (e: React.FormEvent) => {
    e.preventDefault();

    const targetCourse = courses.find((c) => c.id === courseId) || courses[0];
    const targetTeacher = teachers.find((t) => t.fullName === teacherName) || teachers[0];

    const newBatch: Batch = {
      id: editingBatch ? editingBatch.id : `batch-${Date.now()}`,
      name: name || 'Spring 2026 Cohort Alpha',
      courseId: courseId || targetCourse?.id || 'course-yt-master-101',
      courseTitle: targetCourse?.title || 'YouTube All Creator Master Program 2026',
      teacherId: targetTeacher?.id || 'usr-teacher',
      teacherName: teacherName || targetTeacher?.fullName || 'Lead Instructor',
      startDate: startDate || '2026-08-01',
      endDate: '2026-11-01',
      timing: '10:00 AM - 12:00 PM',
      maxCapacity: capacity,
      currentEnrolledCount: editingBatch ? editingBatch.currentEnrolledCount : 1,
      status: 'ongoing'
    };

    db.saveBatch(newBatch);
    alert('Batch saved successfully!');
    setShowCreateModal(false);
    setEditingBatch(null);
    setName('');
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            <span>Batch & Cohort Management</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Organize student cohorts, set maximum batch capacity, and assign lead faculty.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingBatch(null);
            setShowCreateModal(true);
          }}
          className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Batch</span>
        </button>
      </div>

      {/* Batch Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {batches.map((b) => (
          <div
            key={b.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 px-2.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                  {b.id}
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded uppercase">
                  {b.status}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white">{b.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Assigned Faculty: <span className="font-bold text-slate-700 dark:text-slate-300">{b.teacherName}</span></p>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block">Start Date</span>
                  <span className="font-bold text-slate-900 dark:text-white">{b.startDate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Enrolled / Cap</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{b.currentEnrolledCount} / {b.maxCapacity}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-semibold">
                {Math.round((b.currentEnrolledCount / b.maxCapacity) * 100)}% Full
              </span>

              <button
                onClick={() => {
                  setEditingBatch(b);
                  setName(b.name);
                  setCode(b.code ?? '');
                  setCapacity(b.maxCapacity);
                  setTeacherName(b.teacherName);
                  setShowCreateModal(true);
                }}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 rounded-lg cursor-pointer"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Batch Form Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {editingBatch ? 'Edit Batch Cohort' : 'Create New Batch Cohort'}
            </h3>

            <form onSubmit={handleSaveBatch} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Batch Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. BTH-2026-YT1"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Batch Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Spring 2026 YouTube Creator Cohort"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Assigned Course</label>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-900 dark:text-white"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.title} ({c.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Max Capacity</label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Save Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
