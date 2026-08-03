import { useMemo } from 'react';
import { coursesApi, enrollmentsApi, type CloudCourse } from '../services/cloudDb';
import { useCloudQuery } from './useCloudQuery';
import { useAuth } from '../context/AuthContext';

/**
 * Single source of truth for "which courses may I see right now".
 * Staff read the whole catalogue; a student only ever sees the courses they
 * are actually enrolled in, so every content screen stays course-isolated.
 */
export function useCourseScope() {
  const { currentUser, currentRole } = useAuth();
  const uid = currentUser?.id ?? '';
  const isStaff = currentRole === 'admin' || currentRole === 'super_admin' || currentRole === 'teacher';
  const canManage = currentRole === 'admin' || currentRole === 'super_admin' || currentRole === 'teacher';

  const { data, loading, error, reload } = useCloudQuery(async () => {
    if (!uid) return [] as CloudCourse[];
    if (isStaff) return coursesApi.list();
    const rows = await enrollmentsApi.listByStudent(uid);
    return rows
      .filter((r) => r.status === 'active' && r.courses)
      .map((r) => r.courses as CloudCourse);
  }, [uid, isStaff]);

  const courses = useMemo(() => data ?? [], [data]);
  const courseIds = useMemo(() => courses.map((c) => c.id), [courses]);

  return { courses, courseIds, loading, error, reload, isStaff, canManage, uid };
}
