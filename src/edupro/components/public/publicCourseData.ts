import { publicCourses } from '../../services/cloudDb';

export interface PublicCourseCard {
  id: string;
  code: string;
  title: string;
  category: string;
  description: string;
  thumbnail: string;
  banner?: string;
  instructorName: string;
  durationMonths: number;
  feeAmount: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  rating: number;
  reviewsCount: number;
}

const FALLBACK_THUMB =
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=1200';

const normaliseLevel = (level: string | null): PublicCourseCard['level'] => {
  const v = (level ?? '').toLowerCase();
  if (v.startsWith('adv')) return 'Advanced';
  if (v.startsWith('inter')) return 'Intermediate';
  return 'Beginner';
};

/** Published catalogue straight from the database — no demo courses. */
export const getPublicCourses = async (): Promise<PublicCourseCard[]> => {
  const rows = await publicCourses();
  return rows.map((c) => ({
    id: c.id,
    code: c.code ?? '',
    title: c.title,
    category: c.category ?? 'Program',
    description: c.description ?? '',
    thumbnail: c.thumbnail_url || FALLBACK_THUMB,
    banner: c.thumbnail_url || undefined,
    instructorName: c.instructor_name ?? 'Learner Hub Faculty',
    durationMonths: c.duration_months ?? 0,
    feeAmount: Number(c.official_fee ?? 0),
    level: normaliseLevel(c.level),
    rating: 0,
    reviewsCount: 0,
  }));
};
