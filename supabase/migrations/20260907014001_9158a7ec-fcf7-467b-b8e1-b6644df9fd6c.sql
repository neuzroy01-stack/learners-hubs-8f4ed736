REVOKE EXECUTE ON FUNCTION public.notify_admins_new_payment() FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.guard_payment_status() FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.guard_profile_privileges() FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.guard_submission_grading() FROM authenticated, anon;