import React, { useState } from 'react';
import { BookOpen, Radio, Video, FileText, ClipboardList, RefreshCw, ExternalLink } from 'lucide-react';
import {
  enrollmentsApi,
  liveClassesApi,
  lecturesApi,
  materialsApi,
  assignmentsApi,
} from '../../services/cloudDb';
import { useCloudQuery } from '../../hooks/useCloudQuery';
import { useAuth } from '../../context/AuthContext';

type TabKey = 'live' | 'recorded' | 'materials' | 'assignments';

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'live', label: 'Live Classes', icon: Radio },
  { key: 'recorded', label: 'Recorded', icon: Video },
  { key: 'materials', label: 'Notes & PDFs', icon: FileText },
  { key: 'assignments', label: 'Assignments', icon: ClipboardList },
];

/**
 * A student's own courses, straight from the database.
 * RLS guarantees only enrolled-course content is returned.
 */
export const MyCloudCoursesView: React.FC = () => {
  const { currentUser } = useAuth();
  const uid = currentUser?.id ?? '';
  const [courseId, setCourseId] = useState('');
  const [tab, setTab] = useState<TabKey>('live');

  const enrolled = useCloudQuery(async () => (uid ? enrollmentsApi.listByStudent(uid) : []), [uid]);
  const activeCourseId = courseId || enrolled.data?.[0]?.course_id || '';

  const content = useCloudQuery(async () => {
    if (!activeCourseId) return null;
    const [live, recorded, materials, assignments] = await Promise.all([
      liveClassesApi.listByCourse(activeCourseId),
      lecturesApi.listByCourse(activeCourseId),
      materialsApi.listByCourse(activeCourseId),
      assignmentsApi.listByCourse(activeCourseId),
    ]);
    return { live, recorded, materials, assignments };
  }, [activeCourseId]);

  if (!uid) return <p className="p-6 text-sm text-slate-500">Sign in to view your courses.</p>;

  const courses = enrolled.data ?? [];

  return (
    <div className="space-y-5 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-xl font-black text-slate-900 dark:text-white">
          <BookOpen className="h-5 w-5 text-blue-600" /> My Courses
        </h1>
        <button onClick={() => { void enrolled.reload(); void content.reload(); }} className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold dark:border-slate-700">
          <RefreshCw className={`h-3.5 w-3.5 ${enrolled.loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </header>

      {enrolled.error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{enrolled.error}</p>}

      {courses.length === 0 && !enrolled.loading ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700">
          No course has been assigned to you yet. Please contact the administration.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {courses.map((e) => (
              <button
                key={e.id}
                onClick={() => setCourseId(e.course_id)}
                className={`rounded-lg px-3 py-2 text-xs font-bold ${activeCourseId === e.course_id ? 'bg-blue-600 text-white' : 'border border-slate-300 dark:border-slate-700'}`}
              >
                {e.courses?.title ?? 'Course'}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold ${tab === t.key ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}>
                  <Icon className="h-3.5 w-3.5" /> {t.label}
                </button>
              );
            })}
          </div>

          {content.loading && <p className="text-sm text-slate-500">Loading…</p>}

          <div className="grid gap-3 sm:grid-cols-2">
            {tab === 'live' && (content.data?.live ?? []).map((c) => (
              <Item key={c.id} title={c.title} subtitle={`${new Date(c.starts_at).toLocaleString('en-IN')} · ${c.platform}`} body={c.description} href={c.meeting_url} action="Join class" />
            ))}
            {tab === 'recorded' && (content.data?.recorded ?? []).map((l) => (
              <Item key={l.id} title={l.title} subtitle={l.duration_minutes ? `${l.duration_minutes} min` : undefined} body={l.description} href={l.video_url} action="Watch" />
            ))}
            {tab === 'materials' && (content.data?.materials ?? []).map((m) => (
              <Item key={m.id} title={m.title} subtitle={m.file_type?.toUpperCase()} body={m.description} href={m.file_url} action="Download" />
            ))}
            {tab === 'assignments' && (content.data?.assignments ?? []).map((a) => (
              <Item key={a.id} title={a.title} subtitle={a.due_at ? `Due ${new Date(a.due_at).toLocaleDateString('en-IN')} · ${a.max_marks} marks` : `${a.max_marks} marks`} body={a.instructions} href={a.attachment_url} action="Open attachment" />
            ))}
          </div>

          {content.data && (content.data[tab === 'live' ? 'live' : tab === 'recorded' ? 'recorded' : tab === 'materials' ? 'materials' : 'assignments'] as unknown[]).length === 0 && !content.loading && (
            <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">Nothing here yet for this course.</p>
          )}
        </>
      )}
    </div>
  );
};

const Item: React.FC<{ title: string; subtitle?: string | null; body?: string | null; href?: string | null; action: string }> = ({ title, subtitle, body, href, action }) => (
  <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
    {subtitle && <p className="text-[11px] font-semibold text-slate-500">{subtitle}</p>}
    {body && <p className="mt-1 line-clamp-3 text-xs text-slate-500">{body}</p>}
    {href && (
      <a href={href} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-blue-600">
        {action} <ExternalLink className="h-3 w-3" />
      </a>
    )}
  </article>
);
