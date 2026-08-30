import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PublicNav } from "../edupro/components/public/PublicNav";
import { HeroSlider } from "../edupro/components/public/HeroSlider";
import { CoursesGrid } from "../edupro/components/public/CoursesGrid";
import { getPublicCourses, type PublicCourseCard } from "../edupro/components/public/publicCourseData";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Learner Hub — Mentor-Led Courses, Live Classes & Certificates" },
      {
        name: "description",
        content:
          "Learner Hub: enrol into mentor-led programs with live classes, recorded lectures, assignments, quizzes and industry-recognised certificates.",
      },
      { property: "og:title", content: "Learner Hub — Mentor-Led Courses, Live Classes & Certificates" },
      {
        property: "og:description",
        content:
          "Learner Hub: enrol into mentor-led programs with live classes, recorded lectures, assignments, quizzes and industry-recognised certificates.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const [hydrated, setHydrated] = useState(false);
  const [courses, setCourses] = useState<PublicCourseCard[]>([]);

  useEffect(() => {
    setHydrated(true);
    getPublicCourses()
      .then(setCourses)
      .catch(() => setCourses([]));
  }, []);

  if (!hydrated) return null;


  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <PublicNav />
      <main className="flex-1">
        <section id="featured">
          <HeroSlider courses={courses} />
        </section>
        <CoursesGrid courses={courses} />
        <section
          id="about"
          className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24 text-center"
        >
          <p className="text-xs uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold">
            Trusted by learners across India
          </p>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Learner Hub combines a modern LMS, live classroom, assignments, quizzes and certification
            in one secure platform used by institutes, coaches and academies.
          </p>
        </section>
      </main>
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        © {new Date().getFullYear()} Learner Hub · Enterprise LMS
      </footer>
    </div>
  );
}
