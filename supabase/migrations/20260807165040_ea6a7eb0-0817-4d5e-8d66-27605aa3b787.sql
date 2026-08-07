REVOKE ALL ON FUNCTION public.guard_profile_privileges() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_submission_grading() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_payment_status() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_admins_new_payment() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guard_profile_privileges() TO service_role;
GRANT EXECUTE ON FUNCTION public.guard_submission_grading() TO service_role;
GRANT EXECUTE ON FUNCTION public.guard_payment_status() TO service_role;
GRANT EXECUTE ON FUNCTION public.notify_admins_new_payment() TO service_role;