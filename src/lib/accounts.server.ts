import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Resolves the caller's administrative powers from the database.
 * Never trust a role sent by the browser.
 */
export const resolvePowers = async (supabase: SupabaseClient, userId: string) => {
  const [{ data: isAdmin }, { data: isSuper }] = await Promise.all([
    supabase.rpc("is_staff_admin", { _user_id: userId }),
    supabase.rpc("has_role", { _user_id: userId, _role: "super_admin" }),
  ]);
  return { isAdmin: Boolean(isAdmin), isSuper: Boolean(isSuper) };
};
