import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCourseScope } from '../../hooks/useCourseScope';
import { attendanceApi, enrollmentsApi, type CloudAttendance } from '../../services/cloudDb';
import { profilesApi, type CloudProfileRow } from '../../services/cloudProfiles';
import {
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  UserCheck,
  Save,
  Search,
  Check,
  X
} from 'lucide-react';

type AttStatus = 'present' | 'absent' | 'late' | 'leave';

export const AttendanceView: React.FC = () => {
  const { currentUser, currentRole } = useAuth();
  const { courses, isStaff, userId, loading: scopeLoading } = useCourseScope();
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [studentsInBatch, setStudentsInBatch] = useState<CloudProfileRow[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttStatus>>({});
  const [myRecords, setMyRecords] = useState<CloudAttendance[]>([]);
  const [saving, setSaving] = useState(false);

  const isFacultyOrAdmin = isStaff;
  const isStudent = currentRole === 'student';

  useEffect(() => {
    if (!selectedCourseId && courses.length > 0) setSelectedCourseId(courses[0].id);
    if (courses.length === 0) setSelectedCourseId('');
  }, [courses, selectedCourseId]);

  /** Staff: roster + that day's marks. Student: own history. */
  const load = useCallback(async () => {
    if (isStudent) {
      setMyRecords(userId ? await attendanceApi.listByStudent(userId) : []);
      return;
    }
    if (!selectedCourseId) {
      setStudentsInBatch([]);
      setAttendanceMap({});
      return;
    }
    const enrollments = await enrollmentsApi.listByCourse(selectedCourseId);
    const active = enrollments.filter((e) => e.status === 'active');
    const profiles = (
      await Promise.all(active.map((e) => profilesApi.get(e.student_id).catch(() => null)))
    ).filter(Boolean) as CloudProfileRow[];
    setStudentsInBatch(profiles);

    const existing = await attendanceApi.listByCourse(selectedCourseId, selectedDate);
    const map: Record<string, AttStatus> = {};
    profiles.forEach((p) => {
      const rec = existing.find((r) => r.student_id === p.id);
      map[p.id] = ((rec?.status as AttStatus) ?? 'present');
    });
    setAttendanceMap(map);
  }, [isStudent, userId, selectedCourseId, selectedDate]);

  useEffect(() => {
    if (!scopeLoading) void load();
  }, [scopeLoading, load]);

  const handleSaveAttendance = async () => {
    if (!selectedCourseId || studentsInBatch.length === 0) return;
    setSaving(true);
    try {
      await attendanceApi.mark(
        studentsInBatch.map((stu) => ({
          course_id: selectedCourseId,
          student_id: stu.id,
          attendance_date: selectedDate,
          status: attendanceMap[stu.id] || 'present',
          marked_by: userId,
        }))
      );
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Could not save attendance');
    } finally {
      setSaving(false);
    }
  };

  // Student attendance analytics — straight from the database.
  const myAttendanceRecords = myRecords;
  const presentCount = myAttendanceRecords.filter((a) => a.status === 'present').length;
  const totalClasses = myAttendanceRecords.length;
  const attendancePercentage = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;


  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
            <span>Attendance Matrix & Analytics</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track student attendance, mark batch daily logs, and evaluate attendance percentages.
          </p>
        </div>

        {isFacultyOrAdmin && (
          <button
            onClick={handleSaveAttendance}
            className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Attendance Matrix</span>
          </button>
        )}
      </div>

      {isFacultyOrAdmin ? (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Select Course</label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-bold"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Attendance Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-bold"
              />
            </div>
          </div>

          {/* Student Matrix Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">Batch Students ({studentsInBatch.length})</span>
              <span className="text-[11px] text-slate-500 font-mono">Date: {selectedDate}</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {studentsInBatch.map((stu) => {
                const status = attendanceMap[stu.id] || 'present';
                return (
                  <div key={stu.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-center space-x-3">
                      <img
                        src={stu.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(stu.full_name)}`}
                        alt={stu.full_name}
                        className="w-9 h-9 rounded-xl object-cover"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">{stu.full_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{stu.phone || stu.email || ''}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {(['present', 'absent', 'late', 'leave'] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => setAttendanceMap({ ...attendanceMap, [stu.id]: st })}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold capitalize transition-all cursor-pointer ${
                            status === st
                              ? st === 'present'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : st === 'absent'
                                ? 'bg-rose-600 text-white shadow-sm'
                                : st === 'late'
                                ? 'bg-amber-600 text-white shadow-sm'
                                : 'bg-blue-600 text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Student Attendance Summary & History */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
              <div className="text-xs text-slate-400">Total Classes Conducted</div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{totalClasses}</div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
              <div className="text-xs text-slate-400">Present Classes</div>
              <div className="text-2xl font-extrabold text-emerald-500 mt-1">{presentCount}</div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
              <div className="text-xs text-slate-400">Attendance Percentage</div>
              <div className="text-2xl font-extrabold text-blue-500 mt-1">{attendancePercentage}%</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">My Historical Attendance Log</h3>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {myAttendanceRecords.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">No attendance logs found yet.</div>
              ) : (
                myAttendanceRecords.map((r) => (
                  <div key={r.id} className="py-3 flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-600 dark:text-slate-300">{r.attendance_date}</span>
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${
                      r.status === 'present' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {r.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
