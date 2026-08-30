import React from 'react';
import { Link } from '@tanstack/react-router';
import { Star, Clock, User, ArrowRight, BadgeCheck } from 'lucide-react';
import type { PublicCourseCard } from './publicCourseData';

interface Props {
  courses: PublicCourseCard[];
}

const formatINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export const CoursesGrid: React.FC<Props> = ({ courses }) => {
  return (
    <section id="courses" className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
      <div className="flex items-end justify-between gap-6 flex-wrap mb-8">
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-[11px] font-bold uppercase tracking-wider">
            <BadgeCheck className="w-3.5 h-3.5" /> Available Courses
          </span>
          <h2 className="mt-3 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Learn from industry mentors, build production-grade skills
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            Enrol into structured, mentor-led programs with live classes, recorded lectures, assignments and certificates.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {courses.map((c) => (
          <article
            key={c.id}
            id={`course-${c.id}`}
            className="group flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            <div className="relative aspect-[16/9] overflow-hidden bg-slate-100 dark:bg-slate-800">
              <img
                src={c.thumbnail}
                alt={c.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-900/80 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur">
                {c.level}
              </span>
              <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/95 dark:bg-slate-950/90 text-slate-900 dark:text-white text-[11px] font-bold flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {c.rating}
                <span className="text-slate-500 dark:text-slate-400 font-medium">({c.reviewsCount})</span>
              </span>
            </div>

            <div className="p-5 flex flex-col flex-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {c.category}
              </div>
              <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                {c.title}
              </h3>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                {c.description}
              </p>

              <div className="mt-4 flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                <span className="inline-flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {c.instructorName}</span>
                <span className="inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {c.durationMonths} months</span>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Program Fee</div>
                  <div className="text-lg font-black text-slate-900 dark:text-white">{formatINR(c.feeAmount)}</div>
                </div>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition-colors"
                >
                  Enroll <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
