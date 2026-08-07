import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Phone, Lock, ShieldCheck, ArrowRight } from "lucide-react";
import { findStudentByPhone, validatePassword, persistSession } from "../edupro/services/authService";
import { signIn } from "../lib/accounts.functions";
import { completeCloudSignIn } from "../edupro/services/cloudAuth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Student Login — Learner Hub" },
      { name: "description", content: "Secure student sign-in to access your enrolled courses, live classes and certificates on Learner Hub." },
      { property: "og:title", content: "Student Login — Learner Hub" },
      { property: "og:description", content: "Sign in with your student phone number and password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StudentLoginPage,
});

function StudentLoginPage() {
  const navigate = useNavigate();
  const [hydrated, setHydrated] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => setHydrated(true), []);
  if (!hydrated) return null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!phone.trim() || !password) {
      setError("Please enter your phone number and password.");
      return;
    }
    setSubmitting(true);
    try {
      // Cloud account first — works from any device.
      const res = await signIn({ data: { identifier: phone.trim(), password, staff: false } });
      if ("session" in res && res.session) {
        await completeCloudSignIn(res.session, res.profile as never);
        if (!remember) {
          try { sessionStorage.setItem("lh_uid_ephemeral", "1"); } catch { /* blocked */ }
        }
        navigate({ to: "/app" });
        return;
      }
      // No local/offline fallback: every sign-in must be authenticated by the backend.
      setSubmitting(false);
      setError(("error" in res && res.error) || "Invalid phone number or password.");
      return;
    } catch {
      setSubmitting(false);
      setError("We could not reach the sign-in service. Please try again.");
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 text-white relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 -left-24 w-[28rem] h-[28rem] rounded-full bg-white/5 blur-3xl" />
        <Link to="/" className="relative inline-flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur border border-white/25 flex items-center justify-center font-extrabold tracking-wider">LH</div>
          <div>
            <div className="font-bold">Learner Hub</div>
            <div className="text-[11px] opacity-80">Enterprise Learning Platform</div>
          </div>
        </Link>
        <div className="relative max-w-md">
          <h2 className="text-3xl font-black leading-tight">Welcome back, learner.</h2>
          <p className="mt-3 text-sm text-white/85 leading-relaxed">
            Sign in to continue your courses, join live classes and download certificates. Your progress is saved securely.
          </p>
        </div>
        <div className="relative text-[11px] text-white/70">© {new Date().getFullYear()} Learner Hub · Secure Portal</div>
      </div>

      {/* Right form */}
      <div className="flex flex-col justify-center p-6 sm:p-10">
        <div className="mx-auto w-full max-w-md">
          <Link to="/" className="lg:hidden mb-6 inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-extrabold text-sm">LH</div>
            <span className="font-bold">Learner Hub</span>
          </Link>

          <h1 className="text-2xl font-black tracking-tight">Student Sign In</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Use the phone number and password issued by your institute admin.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Phone Number</label>
              <div className="mt-1 relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 98765 11111"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-bold shadow-sm transition-colors"
            >
              {submitting ? "Signing in..." : "Sign In"} <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-3 text-[11px] text-slate-500 dark:text-slate-400">
            Trouble signing in? Contact your institute admin to reset your credentials.
          </div>


          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Are you Admin or Teacher?{" "}
            <Link to="/admin-login" className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-500">
              <ShieldCheck className="w-3.5 h-3.5" /> Admin Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
