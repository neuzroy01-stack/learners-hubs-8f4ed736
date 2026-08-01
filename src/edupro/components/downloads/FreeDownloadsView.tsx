import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { StudyMaterial } from '../../types/lms';
import { useAuth } from '../../context/AuthContext';
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

export const FreeDownloadsView: React.FC = () => {
  const { currentRole } = useAuth();
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const isTeacherOrAdmin = currentRole === 'admin' || currentRole === 'super_admin' || currentRole === 'teacher';

  useEffect(() => {
    loadMaterials();
    const unsub = db.subscribe(() => loadMaterials());
    return unsub;
  }, []);

  const loadMaterials = () => {
    setMaterials(db.getStudyMaterials());
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this study material?')) {
      db.deleteStudyMaterial(id);
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
            onClick={() => {
              const newMat: StudyMaterial = {
                id: `mat-${Date.now()}`,
                courseId: 'course-yt-master-101',
                courseTitle: 'YouTube All Creator Master Program 2026',
                title: 'YouTube Algorithm & SEO Cheat Sheet 2026',
                category: 'PDF Notes',
                fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                fileName: 'YouTube_SEO_CheatSheet_2026.pdf',
                uploadedBy: 'Faculty Master',
                uploadedAt: new Date().toISOString().split('T')[0]
              };
              db.saveStudyMaterial(newMat);
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
