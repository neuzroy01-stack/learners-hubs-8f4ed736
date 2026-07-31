import React, { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { enrollmentsApi, materialsApi, type CloudMaterial } from '../../services/cloudDb';
import { useCloudQuery } from '../../hooks/useCloudQuery';
import {
  FolderDown,
  FileText,
  Download,
  Search,
  Trash2,
} from 'lucide-react';

export const FreeDownloadsView: React.FC = () => {
  const { currentUser, currentRole } = useAuth();
  const uid = currentUser?.id ?? '';
  const isStudent = currentRole === 'student';
  const isTeacherOrAdmin = currentRole === 'admin' || currentRole === 'super_admin' || currentRole === 'teacher';
  const [search, setSearch] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');

  const enrolled = useCloudQuery(async () => (uid ? enrollmentsApi.listByStudent(uid) : []), [uid]);
  const courseIds = useMemo(
    () => (enrolled.data ?? []).map((e) => e.course_id),
    [enrolled.data],
  );

  const materials = useCloudQuery(async () => {
    if (isStudent) return courseIds.length ? materialsApi.listForCourses(courseIds) : [];
    return materialsApi.listForCourses(courseIds.length ? courseIds : []);
  }, [courseIds.join(',')]);

  const list: CloudMaterial[] = materials.data ?? [];

  const filtered = list.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      (m.description ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'all' || (m.file_type ?? '').toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCat;
  });

  const categories = useMemo(() => {
    const cats = new Set<string>();
    list.forEach((m) => { if (m.file_type) cats.add(m.file_type); });
    return [...cats];
  }, [list]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <FolderDown className="w-6 h-6 text-blue-600" />
            <span>Study Downloads &amp; Free Resource Library</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Download lecture PDFs, source code zip files, cheatsheets, and reference templates.
          </p>
        </div>
      </div>

      {enrolled.error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40">
          {enrolled.error}
        </div>
      )}

      {isStudent && courseIds.length === 0 && !enrolled.loading ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-16 text-center text-slate-500 dark:text-slate-400">
          <FolderDown className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-bold">No course assigned yet</p>
          <p className="text-xs mt-1">Study materials will become available after a course is assigned.</p>
        </div>
      ) : materials.loading ? (
        <div className="p-12 text-center text-sm text-slate-500">Loading study materials…</div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-16 text-center text-slate-500 dark:text-slate-400">
          <FolderDown className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-bold">No study materials yet</p>
          <p className="text-xs mt-1">Materials will appear here once they are uploaded to your course.</p>
        </div>
      ) : (
        <>
          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3" />
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
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
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
                      {(mat.file_type ?? 'file').toUpperCase()}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">{mat.title}</h3>
                  {mat.description && <p className="text-xs text-slate-500 dark:text-slate-400">{mat.description}</p>}
                  {mat.week_number && (
                    <p className="text-[10px] text-slate-400">Week {mat.week_number}</p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400">{new Date(mat.created_at).toLocaleDateString('en-IN')}</span>

                  <div className="flex items-center space-x-2">
                    {isTeacherOrAdmin && (
                      <button
                        onClick={async () => {
                          if (confirm('Delete this study material?')) {
                            try {
                              await materialsApi.remove(mat.id);
                              await materials.reload();
                            } catch (err) {
                              alert((err as Error).message);
                            }
                          }
                        }}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    {mat.file_url && (
                      <a
                        href={mat.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400">No materials match your search.</div>
          )}
        </>
      )}
    </div>
  );
};
