DROP POLICY IF EXISTS "Authenticated write audit logs" ON public.audit_logs;

CREATE POLICY "Staff write own audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (actor_id = auth.uid() AND public.is_staff(auth.uid()));