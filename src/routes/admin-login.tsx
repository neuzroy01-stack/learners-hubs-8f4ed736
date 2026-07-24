import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Lock, ShieldCheck, ArrowRight, User as UserIcon } from "lucide-react";
import { findAdminByIdentifier, validatePassword, persistSession } from "../edupro/services/authService";

export const Route = createFileRoute("/admin-login")({
  head: () => ({
    meta: [
      { title: "Admin & Teacher Login — Learner Hub" },
      { name: "description", content: "Secure sign-in for Super Admin, Admin and Teacher accounts on Learner Hub." },
      { property: "og:title", content: "Admin & Teacher Login — Learner Hub" },
      { property: "og:description", content: "Restricted portal for institute staff." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [hydrated, setHydrated] = useState(false);
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => setHydrated(true), []);
  if (!hydrated) return null;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!adminId.trim() || !password) {
      setError("Please enter your Admin ID and password.");
      return;
    }
    setSubmitting(true);
    const user = findAdminByIdentifier(adminId);
    if (!user || !validatePassword(user, password)) {
      setSubmitting(false);
      setError("Invalid credentials. Student accounts must use the Student Login page.");
      return;
    }
    persistSession(user.id);
    if (!remember) {
      try { sessionStorage.setItem("lh_uid_ephemeral", "1"); } catch {}
    }
    navigate({ to: "/app" });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-0 -left-24 w-[28rem] h-[28rem] rounded-full bg-purple-500/10 blur-3xl" />
        <Link to="/" className="relative inline-flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center font-extrabold tracking-wider">LH</div>
          <div>
            <div className="font-bold">Learner Hub · Staff Portal</div>
            <div className="text-[11px] opacity-80">Restricted access</div>
          </div>
        </Link>
        <div className="relative max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" /> Admin · Super Admin · Teacher
          </div>
          <h2 className="mt-4 text-3xl font-black leading-tight">Staff sign-in.</h2>
          <p className="mt-3 text-sm text-white/85 leading-relaxed">
            This portal is for institute staff only. All sign-in attempts are logged for audit and security review.
          </p>
        </div>
        <div className="relative text-[11px] text-white/70">© {new Date().getFullYear()} Learner Hub · Secure Portal</div>
      </div>

      <div className="flex flex-col justify-center p-6 sm:p-10">
        <div className="mx-auto w-full max-w-md">
          <Link to="/" className="lg:hidden mb-6 inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-extrabold text-sm">LH</div>
            <span className="font-bold">Learner Hub · Staff</span>
          </Link>

          <h1 className="text-2xl font-black tracking-tight">Admin / Teacher Sign In</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Enter your Admin ID (email or phone) and password. Students must use the Student Login.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Admin ID</label>
              <div className="mt-1 relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  autoComplete="username"
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  placeholder="admin@edupro.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Password</label>
              <div className="mt-1 relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="rounded border-slate-300"
              />
              Remember me on this device
            </label>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-900 px-3 py-2 text-xs text-rose-700 dark:text-rose-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 disabled:opacity-60 text-white dark:text-slate-900 text-sm font-bold shadow-sm transition-colors"
            >
              {submitting ? "Signing in..." : "Sign In"} <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-3 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
            <div><span className="font-bold text-slate-700 dark:text-slate-300">Super Admin · </span> <code>superadmin@edupro.com</code> / <code>super123</code></div>
            <div><span className="font-bold text-slate-700 dark:text-slate-300">Admin · </span> <code>admin@edupro.com</code> / <code>admin123</code></div>
            <div><span className="font-bold text-slate-700 dark:text-slate-300">Teacher · </span> <code>teacher.sharma@edupro.com</code> / <code>teacher123</code></div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Are you a Student?{" "}
            <Link to="/login" className="font-bold text-blue-600 hover:text-blue-500">Student Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
