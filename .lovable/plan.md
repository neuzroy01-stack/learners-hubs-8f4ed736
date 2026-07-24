
This is a big scope. I'll ship it in three tight phases so each is testable. Nothing existing is deleted — only hardened / extended.

---

## Phase A — Remove demo credentials from public UI (quick win)

- `src/routes/login.tsx`, `src/routes/admin-login.tsx`: strip the demo-credential cards, hint text, and "Demo Student / Demo Admin" chips. Keep only Phone/ID + Password + Login button (student side) and Admin ID + Password + Login (staff side). Small link to "Admin / Teacher Login" stays on student page.
- `authService.ts`: `demoPasswordHintFor` stays exported (used by seeded accounts) but no longer imported by UI. Demo users remain in the mock DB so QA can still sign in with the known passwords — they just aren't shown.
- Grep the rest of the app for "Demo", "demo credentials", "student123" etc. and remove any user-facing surface (dashboards, settings, landing).

## Phase B — Password + Account Creation model

Introduce a real password field on `User` in the mock DB.

- `types/lms.ts`: add `passwordHash?: string` (plain in mock, but treated as opaque) and `mustChangePassword?: false` (unused for now — no self-reset).
- `services/db.ts`: 
  - `createUser({...profile, password})` — Super Admin only; stores password on the user record.
  - `setUserPassword(userId, newPassword, actorId)` — Super Admin only; logs to audit.
  - Seed migration: on first load, back-fill existing seeded users with their current demo passwords so nothing breaks.
- `authService.validatePassword`: check `user.passwordHash` first, fall back to the seeded demo map only for legacy users without a stored password. This preserves existing demo logins while making new accounts use real passwords.
- New Super Admin "Create Account" modal (used from Student list, Teacher list, and a new Admin list under Super Admin dashboard):
  - Fields: Full Name, Father Name (student only), Phone, Email, **Password (manual)**, Role, optional Batch, optional Course.
  - No auto-generate. No "email password to user". Password is set right there.
- Student list "Add Student": switch existing flow to call new `db.createStudent({...form, password})`. New students initialize with:
  attendance 0, classes attended 0, progress 0, assignments 0, quiz 0, certificates 0, feesPaid 0, remaining 0 (unless course assigned → equals course fee), empty payment history, empty notes. No copy from any template student.
- Teacher list "Add Teacher": same pattern, with Assigned Courses + Assigned Batches multi-select. Teacher then only sees their assigned data (already scoped in existing components).
- Remove self-service password reset UI from Student & Teacher settings pages (if present). Add "Change Password" panel in Super Admin dashboard → Accounts, that can target any user.

## Phase C — Course fee auto-reflect + Fee/Payment CRUD + Student Pay-Fee flow

### C1. Course fee auto-reflect
- `db.assignCourseToStudent(studentId, courseId, batchId?)`:
  - Creates/updates an `Enrollment` with `originalFee = course.feeAmount`, `discountAmount = 0`, `finalFee = course.feeAmount`.
  - Recomputes `FeeSummary`: totalPaid = sum(approved payments), remaining = finalFee − totalPaid.
- Changing course reassigns fee. Removing enrollment removes its fee line (payments stay under audit but excluded from active balance).

### C2. Super Admin fee controls (in existing Fee Management view)
- Editable per-enrollment: Total Fee, Discount, Scholarship, Extra Charge, Final Payable.
- Every change writes a `FeeAdjustment` row + audit log entry (actor, before, after, reason).
- Payment history table gains **Edit / Delete** with confirmation dialog. Delete triggers recompute of totalPaid & remaining and updates the financial report aggregates.
- Duplicate UTR guard on Add/Edit payment.

### C3. Course delete safety
- `db.deleteCourse(courseId)` first checks: enrolled students, live classes, assignments, payments. If any exist, returns a `blockers` object; UI shows a warning modal listing them and requires explicit "Force delete + cascade audit" confirmation (Super Admin only).

### C4. Payment settings (Super Admin only)
- Extend `InstituteSettings` with `payment: { upiId, accountHolder, description, isActive }`. Default UPI = `6353504505@slc`.
- New Super Admin **Payment Settings** panel (inside existing Settings view, gated to `super_admin`). Normal admins cannot see it.
- All payment pages read from this single config.

### C5. Student "Pay Fee" flow
- On Student Dashboard fees card + Student Fees page: prominent **Pay Fee** button, visible only when `remaining > 0`. Otherwise show "Fees Fully Paid" pill.
- New `/app` sub-view `StudentPayFeeView`:
  - Shows Total / Paid / Remaining.
  - Amount input defaulting to `remaining`, editable (validation: > 0, ≤ remaining).
  - Dynamic UPI QR generated client-side via `qrcode` npm package encoding `upi://pay?pa=<upiId>&pn=<holder>&am=<amount>&cu=INR&tn=<desc>-<studentCode>`. Regenerates on every amount change.
  - UPI ID display + Copy button.
  - Submit form: UTR (required), screenshot upload (data URL), remarks. Creates a `PaymentRecord` with `status: 'pending_verification'`. Not counted in paidFee until Admin/Super Admin approves it.
- Admin verification panel (existing Fee Management area) gets Approve / Reject buttons for `pending_verification` payments. Approve → status `approved` → recompute. Reject → status `rejected` + remark.

### C6. Integrity
- Central `db.recomputeStudentFinancials(studentId)` runs after any create/update/delete of enrollment, adjustment, or payment. All fee widgets read from that single source.

---

## Technical notes

- Mock DB stays localStorage. A one-time migration on load adds new fields (password, payment settings) without wiping existing data.
- New dependency: `qrcode` (for QR image generation).
- No existing route or file is deleted. Existing dashboards keep working; new capabilities are added inside them.
- Audit log entries added for: user create, password change, fee edit, adjustment, payment add/edit/delete, payment verify/reject, course delete, payment-settings change.

---

**Approve to start with Phase A (demo cleanup) + Phase B (account creation + passwords) in this turn.** Phase C ships next turn to keep the diff reviewable. Or tell me to do all three at once and I'll batch it.
