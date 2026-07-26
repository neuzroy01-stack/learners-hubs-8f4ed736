import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { Course, CourseModule, Lesson, RoadmapWeek, RoadmapTopic } from '../../types/lms';
import { useAuth } from '../../context/AuthContext';
import { ImageUploader } from '../common/ImageUploader';
import { LessonVideoMeta } from './LessonVideoMeta';
import { useFeedback } from '../common/Feedback';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Layers,
  Clock,
  CheckCircle,
  Video,
  FileText,
  X,
  Save,
  Search,
  Sparkles,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

export const CourseManagementView: React.FC = () => {
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState('');
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'modules' | 'weeks'>('details');

  const settings = db.getSettings();

  useEffect(() => {
    loadCourses();
    const unsub = db.subscribe(() => loadCourses());
    return unsub;
  }, []);

  const loadCourses = () => {
    setCourses(db.getCourses());
  };

  const handleToggleStatus = (course: Course) => {
    const updatedStatus = course.status === 'published' ? 'draft' : 'published';
    db.saveCourse({ ...course, status: updatedStatus });
  };

  const handleDelete = async (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    const first = await confirm({
      title: 'Delete course?',
      message: `"${course?.title || 'This course'}" and its full syllabus will be removed.`,
      confirmLabel: 'Delete course'
    });
    if (!first.ok) return;

    let result = db.deleteCourseSafely(courseId, currentUser?.name || 'Admin');
    if (!result.ok && result.blockers) {
      const b = result.blockers;
      const forced = await confirm({
        title: 'Linked records found',
        message: `This course has ${b.enrolledStudents} enrolled students, ${b.liveClasses} live classes, ${b.assignments} assignments and ${b.payments} payments linked. Deleting anyway may affect reports.`,
        confirmLabel: 'Delete anyway',
        requireReason: true
      });
      if (!forced.ok) return;
      result = db.deleteCourseSafely(courseId, currentUser?.name || 'Admin', true);
    }
    if (result.ok) notify('success', 'Course deleted', 'The course and its syllabus were removed.');
  };

  const handleDuplicate = (courseId: string) => {
    db.duplicateCourse(courseId, currentUser?.name || 'Admin');
    notify('success', 'Course duplicated', 'A draft copy has been created.');
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;
    db.saveCourse(editingCourse);
    setEditingCourse(null);
    setIsCreating(false);
    notify('success', 'Course saved', 'All content changes are live.');
  };

  const startCreateNewCourse = () => {
    const newCourse: Course = {
      id: `course-${Date.now()}`,
      code: `CRS-2026-${Math.floor(100 + Math.random() * 900)}`,
      title: 'New Master Program 2026',
      description: 'Comprehensive enterprise-level training curriculum with live mentorship and real-world projects.',
      category: 'Software Engineering',
      feeAmount: 25000,
      durationMonths: 4,
      instructorId: currentUser?.id || 'usr-teacher',
      instructorName: currentUser?.name || 'Lead Instructor',
      startDate: '2026-08-01',
      endDate: '2026-11-30',
      certificateEligiblePercentage: 80,
      thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800',
      banner: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=1200',
      status: 'published',
      modules: [
        {
          id: `mod-${Date.now()}-1`,
          courseId: `course-${Date.now()}`,
          title: 'Module 1: Foundations & Core Concepts',
          description: 'Introduction to foundational principles, environment setup, and architecture.',
          order: 1,
          lessons: [
            {
              id: `les-${Date.now()}-1`,
              moduleId: `mod-${Date.now()}-1`,
              title: 'Lesson 1.1: Environment Setup & High-Level Architecture',
              description: 'Setting up developer tools and framework setup',
              videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
              videoType: 'youtube',
              durationMinutes: 45,
              order: 1
            }
          ]
        }
      ],
      weeks: [
        {
          id: `wk-${Date.now()}-1`,
          weekNumber: 1,
          title: 'Week 1: Fundamentals & Tooling',
          description: 'Master essential CLI tools, repository workflows, and execution environments.',
          topics: [
            { id: `tp-1`, title: 'Environment configuration and initial setup', description: 'Setup steps', dayNumber: 1, isCompleted: true },
            { id: `tp-2`, title: 'Understanding modular program architecture', description: 'Architecture steps', dayNumber: 2, isCompleted: false }
          ]
        }
      ]
    };
    setEditingCourse(newCourse);
    setIsCreating(true);
  };

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <span>Course & Syllabus Management</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create, update, organize modules, upload video lectures, and set pricing.
          </p>
        </div>

        <button
          onClick={startCreateNewCourse}
          className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Course</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center space-x-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by course title or course code..."
          className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
        />
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((course) => (
          <div
            key={course.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
          >
            <div className="relative h-44 w-full bg-slate-950">
              <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
              <div className="absolute top-3 left-3 bg-slate-900/90 text-white text-[10px] font-mono px-2.5 py-1 rounded-md border border-slate-700">
                {course.code}
              </div>
              <div
                className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  course.status === 'published'
                    ? 'bg-emerald-500/90 text-white'
                    : 'bg-amber-500/90 text-white'
                }`}
              >
                {course.status}
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 line-clamp-2">
                {course.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 leading-relaxed flex-1">
                {course.description}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl mb-4 border border-slate-200/60 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block">Fee Amount</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {settings.currencySymbol}{course.feeAmount.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Modules</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {course.modules?.length || 0} Modules
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <button
                  onClick={() => handleToggleStatus(course)}
                  className="flex items-center space-x-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                  title="Toggle Visibility Status"
                >
                  {course.status === 'published' ? <Eye className="w-4 h-4 text-emerald-500" /> : <EyeOff className="w-4 h-4 text-amber-500" />}
                  <span className="text-[11px] font-semibold">{course.status === 'published' ? 'Visible' : 'Draft'}</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDuplicate(course.id)}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 cursor-pointer"
                    title="Duplicate Course"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      setEditingCourse(course);
                      setIsCreating(false);
                    }}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-blue-600 cursor-pointer"
                    title="Edit Course Syllabus"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(course.id)}
                    className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-rose-500 cursor-pointer"
                    title="Delete Course"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Create Course Modal */}
      {editingCourse && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {isCreating ? 'Create New Program' : `Editing Course: ${editingCourse.title}`}
                </h3>
                <p className="text-xs text-slate-500">Configure program metadata, fee amount, and module syllabus.</p>
              </div>

              <button
                onClick={() => setEditingCourse(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Tabs */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                {([
                  ['details', 'General & Media'],
                  ['modules', `Modules & Lessons (${editingCourse.modules.length})`],
                  ['weeks', `Weekly Roadmap (${editingCourse.weeks?.length || 0})`],
                ] as const).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                      activeTab === key ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {activeTab === 'details' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Course Code</label>
                    <input
                      type="text"
                      value={editingCourse.code}
                      onChange={(e) => setEditingCourse({ ...editingCourse, code: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Course Title</label>
                    <input
                      type="text"
                      value={editingCourse.title}
                      onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Fee Amount ({settings.currencySymbol})</label>
                    <input
                      type="number"
                      value={editingCourse.feeAmount}
                      onChange={(e) => setEditingCourse({ ...editingCourse, feeAmount: Number(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Duration (Months)</label>
                    <input
                      type="number"
                      value={editingCourse.durationMonths}
                      onChange={(e) => setEditingCourse({ ...editingCourse, durationMonths: Number(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Category</label>
                    <input
                      type="text"
                      value={editingCourse.category}
                      onChange={(e) => setEditingCourse({ ...editingCourse, category: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Instructor Name</label>
                    <input
                      type="text"
                      value={editingCourse.instructorName}
                      onChange={(e) => setEditingCourse({ ...editingCourse, instructorName: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-2 rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
                    <ImageUploader
                      label="Course Thumbnail"
                      shape="wide"
                      hint="JPG, PNG or WEBP · max 2 MB · auto-optimised"
                      value={editingCourse.thumbnail}
                      onChange={(dataUrl) => setEditingCourse({ ...editingCourse, thumbnail: dataUrl })}
                      onRemove={() => setEditingCourse({ ...editingCourse, thumbnail: '' })}
                    />
                    <label className="mt-1 block text-[11px] font-bold text-slate-600 dark:text-slate-400">…or paste a thumbnail URL</label>
                    <input
                      type="url"
                      value={editingCourse.thumbnail?.startsWith('data:') ? '' : editingCourse.thumbnail}
                      placeholder="https://..."
                      onChange={(e) => setEditingCourse({ ...editingCourse, thumbnail: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Banner URL</label>
                    <input
                      type="url"
                      value={editingCourse.banner || ''}
                      onChange={(e) => setEditingCourse({ ...editingCourse, banner: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={editingCourse.description}
                      onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'modules' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Modules & Lessons</h4>
                    <button
                      type="button"
                      onClick={() => {
                        const newMod: CourseModule = {
                          id: `mod-${Date.now()}`,
                          courseId: editingCourse.id,
                          title: `Module ${editingCourse.modules.length + 1}: New Topic`,
                          description: 'Module description',
                          order: editingCourse.modules.length + 1,
                          lessons: []
                        };
                        setEditingCourse({ ...editingCourse, modules: [...editingCourse.modules, newMod] });
                      }}
                      className="text-xs font-bold text-blue-600 hover:underline flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" /><span>Add Module</span>
                    </button>
                  </div>

                  {editingCourse.modules.map((mod, mIdx) => (
                    <div key={mod.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={mod.title}
                          onChange={(e) => {
                            const updated = [...editingCourse.modules];
                            updated[mIdx] = { ...updated[mIdx], title: e.target.value };
                            setEditingCourse({ ...editingCourse, modules: updated });
                          }}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs font-bold text-slate-900 dark:text-white flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!confirm(`Delete module "${mod.title}" and all its lessons?`)) return;
                            setEditingCourse({ ...editingCourse, modules: editingCourse.modules.filter((_, idx) => idx !== mIdx) });
                          }}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg"
                          title="Delete module"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <textarea
                        rows={2}
                        value={mod.description}
                        onChange={(e) => {
                          const updated = [...editingCourse.modules];
                          updated[mIdx] = { ...updated[mIdx], description: e.target.value };
                          setEditingCourse({ ...editingCourse, modules: updated });
                        }}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-[11px] text-slate-700 dark:text-slate-300"
                        placeholder="Module description..."
                      />

                      <div className="space-y-2 pl-2 border-l-2 border-blue-500">
                        {mod.lessons.map((les, lIdx) => (
                          <div key={les.id} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <input
                                type="text"
                                value={les.title}
                                onChange={(e) => {
                                  const updated = [...editingCourse.modules];
                                  updated[mIdx].lessons[lIdx] = { ...les, title: e.target.value };
                                  setEditingCourse({ ...editingCourse, modules: updated });
                                }}
                                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md p-1.5 text-xs font-bold text-slate-900 dark:text-white flex-1"
                                placeholder="Lesson title"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...editingCourse.modules];
                                  updated[mIdx].lessons = updated[mIdx].lessons.filter((_, i) => i !== lIdx);
                                  setEditingCourse({ ...editingCourse, modules: updated });
                                }}
                                className="p-1 text-rose-500 hover:bg-rose-50 rounded-md"
                                title="Delete lesson"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="grid grid-cols-12 gap-2">
                              <input
                                type="url"
                                value={les.videoUrl}
                                onChange={(e) => {
                                  const updated = [...editingCourse.modules];
                                  updated[mIdx].lessons[lIdx] = { ...les, videoUrl: e.target.value };
                                  setEditingCourse({ ...editingCourse, modules: updated });
                                }}
                                placeholder="Video URL (YouTube / MP4 / Embed / Live)"
                                className="col-span-7 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md p-1.5 text-[11px] font-mono text-slate-800 dark:text-slate-200"
                              />
                              <select
                                value={les.videoType}
                                onChange={(e) => {
                                  const updated = [...editingCourse.modules];
                                  updated[mIdx].lessons[lIdx] = { ...les, videoType: e.target.value as Lesson['videoType'] };
                                  setEditingCourse({ ...editingCourse, modules: updated });
                                }}
                                className="col-span-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md p-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-200"
                              >
                                <option value="youtube">YouTube</option>
                                <option value="mp4">MP4</option>
                                <option value="embed">Embed / Live</option>
                              </select>
                              <input
                                type="number"
                                value={les.durationMinutes}
                                onChange={(e) => {
                                  const updated = [...editingCourse.modules];
                                  updated[mIdx].lessons[lIdx] = { ...les, durationMinutes: Number(e.target.value) };
                                  setEditingCourse({ ...editingCourse, modules: updated });
                                }}
                                placeholder="Min"
                                className="col-span-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md p-1.5 text-[11px] font-bold text-center text-slate-800 dark:text-slate-200"
                              />
                            </div>

                            <div className="grid grid-cols-12 gap-2">
                              <input
                                type="url"
                                value={les.attachmentUrl || ''}
                                onChange={(e) => {
                                  const updated = [...editingCourse.modules];
                                  updated[mIdx].lessons[lIdx] = { ...les, attachmentUrl: e.target.value };
                                  setEditingCourse({ ...editingCourse, modules: updated });
                                }}
                                placeholder="Attachment / PDF URL (optional)"
                                className="col-span-8 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md p-1.5 text-[11px] font-mono text-slate-800 dark:text-slate-200"
                              />
                              <input
                                type="text"
                                value={les.attachmentName || ''}
                                onChange={(e) => {
                                  const updated = [...editingCourse.modules];
                                  updated[mIdx].lessons[lIdx] = { ...les, attachmentName: e.target.value };
                                  setEditingCourse({ ...editingCourse, modules: updated });
                                }}
                                placeholder="Attachment label"
                                className="col-span-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md p-1.5 text-[11px] text-slate-800 dark:text-slate-200"
                              />
                            </div>

                            <textarea
                              rows={2}
                              value={les.description}
                              onChange={(e) => {
                                const updated = [...editingCourse.modules];
                                updated[mIdx].lessons[lIdx] = { ...les, description: e.target.value };
                                setEditingCourse({ ...editingCourse, modules: updated });
                              }}
                              placeholder="Lesson description / notes"
                              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md p-1.5 text-[11px] text-slate-700 dark:text-slate-300"
                            />

                            <LessonVideoMeta
                              lesson={les}
                              onChange={(patch) => {
                                const updated = [...editingCourse.modules];
                                updated[mIdx].lessons[lIdx] = { ...les, ...patch };
                                setEditingCourse({ ...editingCourse, modules: updated });
                              }}
                            />
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => {
                            const newLesson: Lesson = {
                              id: `les-${Date.now()}`,
                              moduleId: mod.id,
                              title: `Lesson ${mod.lessons.length + 1}`,
                              description: '',
                              videoUrl: '',
                              videoType: 'youtube',
                              durationMinutes: 30,
                              order: mod.lessons.length + 1
                            };
                            const updated = [...editingCourse.modules];
                            updated[mIdx] = { ...mod, lessons: [...mod.lessons, newLesson] };
                            setEditingCourse({ ...editingCourse, modules: updated });
                          }}
                          className="text-[11px] font-bold text-indigo-500 hover:underline flex items-center space-x-1 pt-1"
                        >
                          <Plus className="w-3 h-3" /><span>Add Lesson</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'weeks' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Weekly Roadmap</h4>
                    <button
                      type="button"
                      onClick={() => {
                        const weeks = editingCourse.weeks || [];
                        const newWeek: RoadmapWeek = {
                          id: `wk-${Date.now()}`,
                          weekNumber: weeks.length + 1,
                          title: `Week ${weeks.length + 1}`,
                          description: '',
                          topics: []
                        };
                        setEditingCourse({ ...editingCourse, weeks: [...weeks, newWeek] });
                      }}
                      className="text-xs font-bold text-blue-600 hover:underline flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" /><span>Add Week</span>
                    </button>
                  </div>

                  {(editingCourse.weeks || []).map((wk, wIdx) => (
                    <div key={wk.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 grid grid-cols-6 gap-2">
                          <input
                            type="number"
                            value={wk.weekNumber}
                            onChange={(e) => {
                              const updated = [...(editingCourse.weeks || [])];
                              updated[wIdx] = { ...wk, weekNumber: Number(e.target.value) };
                              setEditingCourse({ ...editingCourse, weeks: updated });
                            }}
                            className="col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs font-bold text-center"
                          />
                          <input
                            type="text"
                            value={wk.title}
                            onChange={(e) => {
                              const updated = [...(editingCourse.weeks || [])];
                              updated[wIdx] = { ...wk, title: e.target.value };
                              setEditingCourse({ ...editingCourse, weeks: updated });
                            }}
                            className="col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs font-bold text-slate-900 dark:text-white"
                            placeholder="Week title"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (!confirm(`Delete Week ${wk.weekNumber}?`)) return;
                            setEditingCourse({ ...editingCourse, weeks: (editingCourse.weeks || []).filter((_, i) => i !== wIdx) });
                          }}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <textarea
                        rows={2}
                        value={wk.description}
                        onChange={(e) => {
                          const updated = [...(editingCourse.weeks || [])];
                          updated[wIdx] = { ...wk, description: e.target.value };
                          setEditingCourse({ ...editingCourse, weeks: updated });
                        }}
                        placeholder="Week summary / learning objectives"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-[11px]"
                      />

                      <div className="space-y-2 pl-2 border-l-2 border-emerald-500">
                        {wk.topics.map((tp, tIdx) => (
                          <div key={tp.id} className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 grid grid-cols-12 gap-2 items-center">
                            <input
                              type="number"
                              value={tp.dayNumber}
                              onChange={(e) => {
                                const updated = [...(editingCourse.weeks || [])];
                                updated[wIdx].topics[tIdx] = { ...tp, dayNumber: Number(e.target.value) };
                                setEditingCourse({ ...editingCourse, weeks: updated });
                              }}
                              className="col-span-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md p-1 text-[11px] font-bold text-center"
                            />
                            <input
                              type="text"
                              value={tp.title}
                              onChange={(e) => {
                                const updated = [...(editingCourse.weeks || [])];
                                updated[wIdx].topics[tIdx] = { ...tp, title: e.target.value };
                                setEditingCourse({ ...editingCourse, weeks: updated });
                              }}
                              className="col-span-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md p-1 text-[11px] font-bold"
                              placeholder="Topic title"
                            />
                            <input
                              type="text"
                              value={tp.description}
                              onChange={(e) => {
                                const updated = [...(editingCourse.weeks || [])];
                                updated[wIdx].topics[tIdx] = { ...tp, description: e.target.value };
                                setEditingCourse({ ...editingCourse, weeks: updated });
                              }}
                              className="col-span-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md p-1 text-[11px]"
                              placeholder="Description"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...(editingCourse.weeks || [])];
                                updated[wIdx].topics = updated[wIdx].topics.filter((_, i) => i !== tIdx);
                                setEditingCourse({ ...editingCourse, weeks: updated });
                              }}
                              className="col-span-1 p-1 text-rose-500 hover:bg-rose-50 rounded-md justify-self-end"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...(editingCourse.weeks || [])];
                            const newTopic: RoadmapTopic = {
                              id: `tp-${Date.now()}`,
                              title: 'New topic',
                              description: '',
                              dayNumber: wk.topics.length + 1,
                            };
                            updated[wIdx] = { ...wk, topics: [...wk.topics, newTopic] };
                            setEditingCourse({ ...editingCourse, weeks: updated });
                          }}
                          className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center space-x-1 pt-1"
                        >
                          <Plus className="w-3 h-3" /><span>Add Topic / Day</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setEditingCourse(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveCourse}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center space-x-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Save Course Syllabus</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
