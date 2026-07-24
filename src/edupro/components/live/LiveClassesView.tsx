import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { LiveClass } from '../../types/lms';
import { useAuth } from '../../context/AuthContext';
import {
  Radio,
  Video,
  Clock,
  Calendar,
  ExternalLink,
  Plus,
  Play,
  Users,
  X
} from 'lucide-react';

export const LiveClassesView: React.FC = () => {
  const { currentRole, currentUser } = useAuth();
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [batchId, setBatchId] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');

  const isFacultyOrAdmin = currentRole === 'admin' || currentRole === 'super_admin' || currentRole === 'teacher';
  const batches = db.getBatches();

  useEffect(() => {
    loadClasses();
    const unsub = db.subscribe(() => loadClasses());
    return unsub;
  }, []);

  const loadClasses = () => {
    setLiveClasses(db.getLiveClasses());
  };

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedBatch = batches.find((b) => b.id === batchId) || batches[0];
    const newLive: LiveClass = {
      id: `live-${Date.now()}`,
      title: title || 'Live Q&A & Strategy Session',
      topic: 'Live Q&A Strategy',
      courseId: selectedBatch?.courseId || 'course-yt-master-101',
      courseTitle: selectedBatch?.courseTitle || 'YouTube Master Program',
      batchId: selectedBatch?.id || 'batch-yt-1',
      batchName: selectedBatch?.name || 'Batch 1',
      teacherId: currentUser?.id || 'usr-teacher',
      teacherName: currentUser?.name || 'Faculty Lead',
      date: scheduledTime.split('T')[0] || new Date().toISOString().split('T')[0],
      startTime: '10:00 AM',
      endTime: '11:00 AM',
      meetingLink: meetingUrl || 'https://meet.google.com/abc-defg-hij',
      status: 'upcoming'
    };

    db.saveLiveClass(newLive);
    alert('Live Class scheduled successfully!');
    setShowScheduleModal(false);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <Radio className="w-6 h-6 text-rose-600 animate-pulse" />
            <span>Live Interactive Classes & Webinars</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Join live stream sessions, interact with faculty in real-time, and view upcoming class schedules.
          </p>
        </div>

        {isFacultyOrAdmin && (
          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Live Class</span>
          </button>
        )}
      </div>

      {/* Live Class Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {liveClasses.map((cls) => (
          <div
            key={cls.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-800 uppercase flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                  <span>{cls.status === 'live' ? 'Live Now' : cls.status}</span>
                </span>
                <span className="text-[11px] font-bold text-slate-400 font-mono">
                  {cls.batchName}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">{cls.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Instructor: <span className="font-bold text-slate-700 dark:text-slate-300">{cls.teacherName}</span></p>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{cls.date}</span>
                </div>
                <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  <span>{cls.startTime} - {cls.endTime}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              {cls.recordingLink && (
                <a
                  href={cls.recordingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-indigo-500 hover:underline flex items-center space-x-1"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Watch Recording</span>
                </a>
              )}

              <a
                href={cls.meetingLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-all shadow-md ml-auto"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Join Meeting</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Schedule Live Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setShowScheduleModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white">Schedule New Live Session</h3>

            <form onSubmit={handleSchedule} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Select Target Batch</label>
                <select
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-900 dark:text-white"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Session Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Live Q&A & Algorithm Review"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Scheduled Date & Time</label>
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Meeting Link (Zoom / Google Meet)</label>
                <input
                  type="url"
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Schedule Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
