import { INITIAL_COURSES } from '../../services/mockData';
import type { Course } from '../../types/lms';

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

const LEVELS: PublicCourseCard['level'][] = ['Beginner', 'Intermediate', 'Advanced'];

const deriveMeta = (c: Course, index: number) => {
  // deterministic mock enrichments so the landing feels populated
  const level = LEVELS[index % LEVELS.length];
  const rating = 4.4 + ((index * 13) % 6) / 10; // 4.4 - 4.9
  const reviewsCount = 120 + ((index * 47) % 900);
  return { level, rating: Number(rating.toFixed(1)), reviewsCount };
};

export const getPublicCourses = (): PublicCourseCard[] =>
  INITIAL_COURSES
    .filter((c) => c.status === 'published')
    .map((c, i) => ({
      id: c.id,
      code: c.code,
      title: c.title,
      category: c.category,
      description: c.description,
      thumbnail: c.thumbnail,
      banner: c.banner,
      instructorName: c.instructorName,
      durationMonths: c.durationMonths,
      feeAmount: c.feeAmount,
      ...deriveMeta(c, i),
    }));
