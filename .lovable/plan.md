
# Learner Hub — Production Upgrade Plan

The spec is huge (Parts 1–4). I'll deliver it in phases so nothing existing breaks. **No existing page will be deleted or replaced** — each phase only *adds* new routes or *hardens* an existing screen in place.

---

## Phase 1 — Public Landing + Auth Split (this turn)

**New route `/` (public landing, replaces the auto-login demo home)**
- Auto-scroll hero banner slider (one slide per featured course: banner, name, short desc, Enroll, Learn More)
- "Available Courses" responsive card grid (thumbnail, name, mentor, duration, level, rating, short desc, Enroll)
- Top-right **Login** button
- Only public info — no student/admin data, no role switcher

**New route `/login` — Student Login**
- Fields: Phone Number, Password, Show/Hide, Remember Me
- No "Forgot password" / "Reset" links (per spec)
- Small link at bottom: *"Are you Admin or Teacher? → Admin Login"*

**New route `/admin-login` — Admin / Super Admin / Teacher Login**
- Fields: Admin ID, Password, Show/Hide, Remember Me
- Students blocked from this form

**Redirects after login (into EXISTING dashboards, unchanged):**
- `student` → existing Student Dashboard
- `teacher` → existing Teacher Dashboard
- `admin` → existing Admin Dashboard
- `super_admin` → existing Super Admin Dashboard

**Existing app preserved**
- Current `src/edupro/App.tsx` (with all four role dashboards, courses, live classes, fees, settings, etc.) is moved behind `/app` and rendered exactly as today.
- The in-app role-switcher UI in `Navbar` is hidden for non–super-admin sessions (super admin keeps it for QA convenience unless you want it fully removed — say the word and it goes).
- Auth still uses the existing mock `AuthContext` / `db` layer; login form calls `loginAsUser` after matching phone/adminId + password against the mock users.

**Files added**
- `src/routes/landing.tsx` claims `/`
- `src/routes/login.tsx`, `src/routes/admin-login.tsx`
- `src/routes/app.tsx` wraps existing `edupro/App.tsx`
- `src/edupro/components/public/{HeroSlider,CoursesGrid,PublicNav}.tsx`
- Old `src/routes/index.tsx` becomes a redirect to `/` landing (kept, not deleted)

---

## Phase 2 — RBAC Hardening (next turn)

- Remove role-switcher for non-super-admin everywhere
- Route guards: `/app/admin/*`, `/app/teacher/*`, `/app/student/*` gated by `currentRole`
- All list queries (`db.get*`) wrapped in scope filters so a student can only read their own records, teacher only their assigned batches, etc. — enforced in `db` service, not in components
- URL-param access checks (e.g. `/students/:id`) reject cross-user reads

## Phase 3 — Admin Course Content Manager

Non-destructive additions to existing Course Management view: week CRUD + drag-reorder, per-week PDF/Video/Assignment/Quiz/Live-Class CRUD, drag-drop upload with progress, replace/version history, dependency check before delete.

## Phase 4 — Salary ↔ Fees Separation

- New tables (mock db): `salary_records`, `salary_payments`, `salary_history`, `salary_adjustments`, `salary_slips`
- Financial reports split: Student Income / Salary Expense / Other Expense / Net P&L
- Existing Fee module untouched except to stop accepting salary writes

## Phase 5 — Registration + Payment Verification Workflow

Public `/register`, payment submission with UTR + screenshot, Admin verification panel, status lifecycle, immutable receipts.

## Phase 6 — Notifications, Certificates, Analytics, Reports

Central notification engine (in-app now, provider-ready), certificate issue/revoke/reissue with QR, analytics widgets + charts, exportable reports (PDF/Excel/CSV).

## Phase 7 — Security, Audit, Performance, Production Checklist

Audit log on every sensitive action, secure headers/CSP scaffolding, pagination + lazy loading + code-splitting sweep, full regression pass.

---

## Technical notes

- Stack stays TanStack Start + Tailwind v4 + existing mock `db` (localStorage). When you're ready to move off mock data, enable Lovable Cloud and I'll migrate table-by-table without breaking UI.
- Every existing route/file under `src/edupro/**` is kept. New code lives alongside.
- Head metadata (title/description/og) set per new route.

---

**Approve to start Phase 1**, or tell me what to adjust (e.g. "remove role-switcher for super-admin too", "landing should also show testimonials", "skip `/app` prefix and keep dashboards at their current paths").
