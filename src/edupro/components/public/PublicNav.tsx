import React from 'react';
import { Link } from '@tanstack/react-router';
import { LogIn } from 'lucide-react';

export const PublicNav: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-extrabold text-sm tracking-wider shadow-md shadow-blue-500/20">
            LH
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Learner Hub</h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Enterprise Learning Platform</p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
          <a href="#courses" className="hover:text-slate-900 dark:hover:text-white transition-colors">Courses</a>
          <a href="#featured" className="hover:text-slate-900 dark:hover:text-white transition-colors">Featured</a>
          <a href="#about" className="hover:text-slate-900 dark:hover:text-white transition-colors">About</a>
        </nav>

        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-sm font-semibold shadow-sm transition-colors"
        >
          <LogIn className="w-4 h-4" />
          Login
        </Link>
      </div>
    </header>
  );
};
