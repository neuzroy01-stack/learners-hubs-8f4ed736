/*
# Add soft-delete + status support to profiles

1. Modified Tables
- `profiles`: add `deleted_at` (timestamptz, nullable). When set, the row is
  considered soft-deleted — the user can no longer sign in and is hidden from
  directory lists, but historical records (payments, attendance, certificates)
  remain intact for audit integrity.
2. Security
- No policy changes. Existing SELECT policy already gates on `is_staff_admin`
  for staff; the directory list helper now filters `deleted_at IS NULL`.
3. Important Notes
- This is a non-destructive, additive migration. No data is lost.
- A partial index on `deleted_at` keeps directory queries fast.
*/

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_profiles_active
  ON public.profiles (deleted_at)
  WHERE deleted_at IS NULL;
