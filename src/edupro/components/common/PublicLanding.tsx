import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { Course, HomeBanner } from '../../types/lms';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles,
  BookOpen,
  CheckCircle2,
  Clock,
  Video,
  Shield,
  GraduationCap,
  ChevronRight,
  ChevronLeft,
  X,
  PlayCircle,
  Award,
  Layers,
  ArrowRight,
  Search,
  UserCheck
} from 'lucide-react';

interface PublicLandingProps {
  onLoginClick: () => void;
}

export const PublicLanding: React.FC<PublicLandingProps> = ({ onLoginClick }) => {
  const { loginAsUser } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [banners, setBanners] = useState<HomeBanner[]>([]);
  const [currentBannerIdx, setCurrentBannerIdx] = useState(0);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [activeTabSyllabus, setActiveTabSyllabus] = useState<'weeks' | 'modules'>('modules');
  const [searchQuery, setSearchQuery] = useState('');

  const settings = db.getSettings();

  useEffect(() => {
    setCourses(db.getCourses().filter((c) => c.status === 'published'));
    setBanners(db.getHomeBanners().filter((b) => b.isActive));
  }, []);

  useEffect(() => {
    if (banners.length === 0) return;
    const interval = setInterval(() => {
      setCurrentBannerIdx((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners]);

  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeBanner = banners[currentBannerIdx] || {
    title: 'YouTube All Creator Master Program 2026',
    subtitle: '3 Months Live Training + 2 Months Growth Support | 121+ Live Sessions & 14 Modules',
    imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&q=80&w=1200',
    targetCourseId: 'course-yt-master-101',
    buttonText: 'View Syllabus & Enroll'
  };

  const allUsers = db.getUsers();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Banner Navigation Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-500/20">
            EP
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">{settings.name}</h1>
            <p className="text-[11px] text-slate-400 font-medium">Enterprise Learning Management Platform</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowLoginModal(true)}
            className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>Portal Login</span>
          </button>
        </div>
      </header>

      {/* Hero Section with Auto-Slider Banners */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 py-12 px-4 sm:px-8 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto">
          {banners.length > 0 && (
            <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl group bg-slate-900">
              <div className="relative h-[380px] sm:h-[450px] w-full">
                <img
                  src={activeBanner.imageUrl}
                  alt={activeBanner.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-35 transform transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent"></div>

                <div className="absolute inset-0 p-6 sm:p-12 flex flex-col justify-end max-w-3xl">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold rounded-full mb-4 w-fit">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Featured Flagship Mentorship 2026</span>
                  </div>

                  <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-3 leading-tight drop-shadow-md">
                    {activeBanner.title}
                  </h2>
                  <p className="text-slate-300 text-xs sm:text-sm mb-6 leading-relaxed line-clamp-3">
                    {activeBanner.subtitle}
                  </p>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => {
                        const target = courses.find((c) => c.id === activeBanner.targetCourseId) || courses[0];
                        if (target) setSelectedCourse(target);
                      }}
                      className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-500/30 transition-all cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>{activeBanner.buttonText || 'Explore Syllabus & Details'}</span>
                    </button>

                    <button
                      onClick={() => setShowLoginModal(true)}
                      className="flex items-center space-x-2 px-6 py-3 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs border border-slate-700 transition-all cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4 text-emerald-400" />
                      <span>Student Portal Access</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Slider Controls */}
              {banners.length > 1 && (
                <div className="absolute bottom-4 right-4 flex items-center space-x-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800">
                  <button
                    onClick={() => setCurrentBannerIdx((prev) => (prev - 1 + banners.length) % banners.length)}
                    className="p-1 hover:bg-slate-800 rounded-full text-slate-300"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] font-mono text-slate-400">
                    {currentBannerIdx + 1} / {banners.length}
                  </span>
                  <button
                    onClick={() => setCurrentBannerIdx((prev) => (prev + 1) % banners.length)}
                    className="p-1 hover:bg-slate-800 rounded-full text-slate-300"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Courses Showcase Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-12 flex-1">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">
              Active Enterprise Programs & Mentorship Tracks
            </h3>
            <p className="text-xs text-slate-400">
              Select any program to inspect full module details, week-wise curriculum, and enrollment requirements.
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {filteredCourses.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400 text-xs">
            No active courses found matching your query.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg hover:border-slate-700 hover:shadow-2xl transition-all flex flex-col group"
              >
                <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-blue-600/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {course.category}
                  </div>
                  <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-md text-slate-200 text-xs font-bold px-3 py-1 rounded-lg border border-slate-700">
                    {settings.currencySymbol}{course.feeAmount.toLocaleString()}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <div className="text-[11px] font-mono font-semibold text-blue-400 mb-1">{course.code}</div>
                  <h4 className="text-base font-bold text-white mb-2 leading-snug line-clamp-2">{course.title}</h4>
                  <p className="text-xs text-slate-400 mb-4 line-clamp-3 leading-relaxed flex-1">{course.description}</p>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 mb-4">
                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                      <span>{course.durationMonths} Months</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{course.modules?.length || 14} Modules</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                    <div className="text-[11px] text-slate-400">
                      Instructor: <span className="font-bold text-slate-200">{course.instructorName}</span>
                    </div>

                    <button
                      onClick={() => setSelectedCourse(course)}
                      className="flex items-center space-x-1 text-xs font-bold text-blue-400 hover:text-blue-300 cursor-pointer"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-8 px-4 sm:px-8 text-center text-xs text-slate-500">
        <p className="mb-2">{settings.footerText}</p>
        <p className="text-[11px] text-slate-600">Enterprise Edition v2.5 | 100% Cloud Persistence & Security</p>
      </footer>

      {/* Course Details Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative">
            {/* Modal Header */}
            <div className="relative h-48 sm:h-64 w-full bg-slate-950">
              <img src={selectedCourse.banner || selectedCourse.thumbnail} alt={selectedCourse.title} className="w-full h-full object-cover opacity-40" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>

              <button
                onClick={() => setSelectedCourse(null)}
                className="absolute top-4 right-4 p-2 bg-slate-950/80 hover:bg-slate-800 text-white rounded-full border border-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute bottom-4 left-6 right-6">
                <span className="bg-blue-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">
                  {selectedCourse.category}
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">{selectedCourse.title}</h3>
                <p className="text-xs text-slate-300 mt-1">Instructor: {selectedCourse.instructorName} | Code: {selectedCourse.code}</p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Program Overview */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Program Overview</h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                  {selectedCourse.description}
                </p>
              </div>

              {/* Key Features Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                  <div className="text-xs text-slate-400">Duration</div>
                  <div className="text-sm font-bold text-white mt-0.5">{selectedCourse.durationMonths} Months</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                  <div className="text-xs text-slate-400">Live Sessions</div>
                  <div className="text-sm font-bold text-blue-400 mt-0.5">121+ Live</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                  <div className="text-xs text-slate-400">Total Program Fee</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">{settings.currencySymbol}{selectedCourse.feeAmount.toLocaleString()}</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                  <div className="text-xs text-slate-400">Certificate</div>
                  <div className="text-sm font-bold text-amber-400 mt-0.5">QR Verified</div>
                </div>
              </div>

              {/* Syllabus Tabs */}
              <div>
                <div className="flex items-center space-x-2 border-b border-slate-800 mb-4">
                  <button
                    onClick={() => setActiveTabSyllabus('modules')}
                    className={`pb-2.5 text-xs font-bold cursor-pointer transition-colors border-b-2 ${
                      activeTabSyllabus === 'modules' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All {selectedCourse.modules.length} Modules Curriculum
                  </button>
                  <button
                    onClick={() => setActiveTabSyllabus('weeks')}
                    className={`pb-2.5 text-xs font-bold cursor-pointer transition-colors border-b-2 ${
                      activeTabSyllabus === 'weeks' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Month / Week Roadmap ({selectedCourse.weeks.length} Phases)
                  </button>
                </div>

                {activeTabSyllabus === 'modules' ? (
                  <div className="space-y-3">
                    {selectedCourse.modules.map((mod, idx) => (
                      <div key={mod.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">Module {idx + 1}</span>
                          <span className="text-[10px] text-slate-500">{mod.lessons.length} Recorded Lessons</span>
                        </div>
                        <h5 className="text-xs font-bold text-white mb-1">{mod.title}</h5>
                        <p className="text-[11px] text-slate-400 leading-snug">{mod.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedCourse.weeks.map((wk) => (
                      <div key={wk.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                        <h5 className="text-xs font-bold text-amber-400 mb-1">{wk.title}</h5>
                        <p className="text-[11px] text-slate-400 mb-2">{wk.description}</p>
                        <div className="space-y-1.5 pl-3 border-l border-slate-800">
                          {wk.topics.map((tp) => (
                            <div key={tp.id} className="text-[11px] text-slate-300 flex items-start space-x-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                              <span>{tp.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block">Course Fee</span>
                <span className="text-base font-extrabold text-white">{settings.currencySymbol}{selectedCourse.feeAmount.toLocaleString()}</span>
              </div>

              <button
                onClick={() => {
                  setSelectedCourse(null);
                  setShowLoginModal(true);
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
              >
                Login to Student Portal & Enroll
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Role Switcher Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-xl mx-auto mb-3 shadow-lg">
                EP
              </div>
              <h3 className="text-lg font-bold text-white">Select Access Role to Login</h3>
              <p className="text-xs text-slate-400 mt-1">One-click quick login presets for testing all LMS roles.</p>
            </div>

            <div className="space-y-3">
              {allUsers.map((usr) => (
                <button
                  key={usr.id}
                  onClick={() => {
                    loginAsUser(usr.id);
                    setShowLoginModal(false);
                  }}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-2xl transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center space-x-3">
                    <img src={usr.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'} alt={usr.name} className="w-10 h-10 rounded-xl object-cover" />
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">{usr.name}</div>
                      <div className="text-[10px] text-slate-400 capitalize">{usr.role.replace('_', ' ')}</div>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-blue-400 flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
                    <span>Login</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
