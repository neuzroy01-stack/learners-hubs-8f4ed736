REVOKE EXECUTE ON FUNCTION public.guard_payment_status() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_admins_new_payment() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_profile_privileges() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_submission_grading() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM anon, authenticated;

CREATE POLICY "Students upload own payment proofs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'payment-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Owner or staff read payment proofs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'payment-proofs' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_staff(auth.uid())));

CREATE POLICY "Staff manage payment proofs"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'payment-proofs' AND public.is_staff_admin(auth.uid()));