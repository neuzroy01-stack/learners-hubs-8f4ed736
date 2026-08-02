import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { coursesApi, enrollmentsApi, type CloudCourse } from '../services/cloudDb';
import { useAuth } from '../context/AuthContext';

export type CourseScope = {
  /** Cloud user id of the signed-in account (null when not signed into the cloud). */
  userId: string | null;
  /** Courses the signed-in user is allowed to see. Students: enrolled only. */
  courses: CloudCourse[];
  courseIds: string[];
  isStaff: boolean;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

/**
 * Single source of truth for "which courses may this user see".
 * Students resolve to their enrolled courses only, staff to every course.
 * Nothing is cached between sessions — every mount re-reads the database.
 */
export function useCourseScope(): CourseScope {
  const { currentRole } = useAuth();
  const isStaff = currentRole === 'admin' || currentRole === 'super_admin' || currentRole === 'teacher';
  const [userId, setUserId] = useState<string | null>(null);
  const [courses, setCourses] = useState<CloudCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? null;
      if (!mounted.current) return;
      setUserId(uid);

      if (isStaff) {
        setCourses(await coursesApi.list());
      } else if (uid) {
        const rows = await enrollmentsApi.listByStudent(uid);
        setCourses(
          rows
            .filter((r) => r.status === 'active' && r.courses)
            .map((r) => r.courses as CloudCourse)
        );
      } else {
        setCourses([]);
      }
    } catch (e) {
      if (mounted.current) {
        setCourses([]);
        setError(e instanceof Error ? e.message : 'Could not load courses');
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [isStaff]);

  useEffect(() => {
    mounted.current = true;
    void reload();
    return () => {
      mounted.current = false;
    };
  }, [reload]);

  return {
    userId,
    courses,
    courseIds: courses.map((c) => c.id),
    isStaff,
    loading,
    error,
    reload,
  };
}
