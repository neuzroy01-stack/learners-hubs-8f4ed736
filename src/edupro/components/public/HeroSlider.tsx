import React, { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowRight, PlayCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import type { PublicCourseCard } from './publicCourseData';

interface Props {
  courses: PublicCourseCard[];
}

export const HeroSlider: React.FC<Props> = ({ courses }) => {
  const slides = courses.slice(0, Math.min(5, courses.length));
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [paused, slides.length]);

  if (slides.length === 0) return null;

  const active = slides[index];

  return (
    <section
      className="relative overflow-hidden bg-slate-950"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      <div className="relative h-[420px] sm:h-[480px] md:h-[560px]">
        {slides.map((s, i) => (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${
              i === index ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            aria-hidden={i !== index}
          >
            <img
              src={s.banner || s.thumbnail}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              loading={i === 0 ? 'eager' : 'lazy'}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-slate-950/20" />
          </div>
        ))}

        <div className="relative z-10 max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center">
          <div className="max-w-2xl text-white">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold uppercase tracking-wider backdrop-blur">
              Featured · {active.category}
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-black leading-tight tracking-tight">
              {active.title}
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-200/90 max-w-xl leading-relaxed line-clamp-3">
              {active.description}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-500/30 transition-colors"
              >
                Enroll Now <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href={`#course-${active.id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold backdrop-blur transition-colors"
              >
                <PlayCircle className="w-4 h-4" /> Learn More
              </a>
            </div>
          </div>
        </div>

        {slides.length > 1 && (
          <>
            <button
              onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}
              className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/25 border border-white/20 text-white backdrop-blur transition-colors"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIndex((i) => (i + 1) % slides.length)}
              className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/25 border border-white/20 text-white backdrop-blur transition-colors"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setIndex(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? 'w-8 bg-white' : 'w-3 bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};
