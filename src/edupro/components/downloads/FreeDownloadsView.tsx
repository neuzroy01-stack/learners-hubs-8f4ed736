import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCourseScope } from '../../hooks/useCourseScope';
import { materialsApi, type CloudMaterial } from '../../services/cloudDb';
import {
  FolderDown,
  FileText,
  Download,
  Plus,
  Search,
  ExternalLink,
  Trash2,
  FileCode,
  FileArchive,
  BookOpen
} from 'lucide-react';

type MaterialCard = {
  id: string;
  title: string;
  category: string;
  fileName: string;
  fileUrl: string;
  uploadedBy: string;
};

export const FreeDownloadsView: React.FC = () => {
  const { currentRole } = useAuth();
  const { courses, courseIds, isStaff, loading: scopeLoading } = useCourseScope();
  const [materials, setMaterials] = useState<MaterialCard[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const isTeacherOrAdmin = isStaff;

  const loadMaterials = useCallback(async () => {
    if (courseIds.length === 0) {
      setMaterials([]);
      return;
    }
    const rows = (await materialsApi.listForCourses(courseIds)) as CloudMaterial[];
    const visible = isStaff ? rows : rows.filter((r) => r.is_published);
    const titleOf = new Map(courses.map((c) => [c.id, c.title]));
    setMaterials(
      visible.map((r) => ({
        id: r.id,
        title: r.title,
        category: r.file_type,
        fileName: r.description || r.file_url.split('/').pop() || r.title,
        fileUrl: r.file_url,
        uploadedBy: titleOf.get(r.course_id) ?? 'Course',
      }))
    );
  }, [courseIds.join(','), isStaff, courses]);

  useEffect(() => {
    if (!scopeLoading) void loadMaterials();
  }, [scopeLoading, loadMaterials]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this study material?')) {
      await materialsApi.remove(id);
      await loadMaterials();
    }
  };

  const filtered = materials.filter((m) => {
    const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase()) || m.fileName.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'all' || m.category === selectedCategory;
    return matchesSearch && matchesCat;
  });


  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <FolderDown className="w-6 h-6 text-blue-600" />
            <span>Study Downloads & Free Resource Library</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Download lecture PDFs, source code zip files, cheatsheets, and reference templates.
          </p>
        </div>

        {isTeacherOrAdmin && (
          <button
            onClick={async () => {
              const course = courses[0];
              if (!course) {
                alert('Create a course first.');
                return;
              }
              const title = prompt('Resource title');
              if (!title) return;
              const fileUrl = prompt('File URL (PDF / ZIP / link)');
              if (!fileUrl) return;
              const category = prompt('Category (PDF Notes, Lecture Slides, Practice Sheet, Video Resource, External Link)', 'PDF Notes') || 'PDF Notes';
              await materialsApi.create({
                course_id: course.id,
                title,
                file_url: fileUrl,
                file_type: category,
                is_published: true,
              });
              await loadMaterials();
            }}
            className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Resource</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search downloads by title or keyword..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
        >
          <option value="all">All Categories</option>
          <option value="PDF Notes">PDF Notes</option>
          <option value="Lecture Slides">Lecture Slides</option>
          <option value="Practice Sheet">Practice Sheet</option>
          <option value="Video Resource">Video Resource</option>
          <option value="External Link">External Link</option>
        </select>
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((mat) => (
          <div
            key={mat.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-xl border border-blue-200 dark:border-blue-800">
                  <FileText className="w-5 h-5 text-rose-500" />
                </span>
                <span className="text-[10px] font-bold text-slate-400 font-mono uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  {mat.category}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">{mat.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{mat.fileName}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[10px] text-slate-400">By {mat.uploadedBy}</span>

              <div className="flex items-center space-x-2">
                {isTeacherOrAdmin && (
                  <button
                    onClick={() => handleDelete(mat.id)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <a
                  href={mat.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
