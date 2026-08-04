import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  createSchema,
  digits,
  passwordChangeSchema,
  signInSchema,
  statusSchema,
  syntheticEmail,
  updateSchema,
  type CloudProfile,
} from "./accounts.shared";
import type { z } from "zod";

export type { CloudProfile } from "./accounts.shared";
export { syntheticEmail } from "./accounts.shared";

/**
 * Sign in with a phone number, student id or email + password.
 * Runs server-side so the phone -> email mapping never leaks to the browser.
 */
export const signIn = createServerFn({ method: "POST" })
  .inputValidator((input: z.input<typeof signInSchema>) => signInSchema.parse(input))
  .handler(async ({ data }) => {
    const { createPublicServerClient } = await import("./supabase-public.server");
    const supabase = createPublicServerClient();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const raw = data.identifier.trim();
    const phone = digits(raw);
    const generic = { error: "Invalid credentials. Please check your details and try again." };

    let query = supabaseAdmin.from("profiles").select("*").limit(1);
    query = raw.includes("@") ? query.ilike("email", raw) : query.eq("phone", phone);
    const { data: rows } = await query;
    const profile = rows?.[0] as CloudProfile | undefined;
    if (!profile) return generic;

    if (data.staff && profile.role === "student") return generic;
    if (!data.staff && profile.role !== "student") return generic;
    if (profile.status !== "active") return { error: "This account is not active. Contact your administrator." };

    const loginEmail = profile.email?.includes("@") ? profile.email : syntheticEmail(profile.phone || phone);

    const { data: auth, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: data.password,
    });
    if (error || !auth.session) return generic;

    return { session: auth.session, profile };
  });

/** Super Admin / Admin creates a real cloud account that works on any device. */
export const createAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: z.input<typeof createSchema>) => createSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { resolvePowers } = await import("./accounts.server");
    const { isAdmin, isSuper } = await resolvePowers(context.supabase as never, context.userId);
    if (!isAdmin) return { error: "You are not allowed to create accounts." };
    if (data.role !== "student" && !isSuper) {
      return { error: "Only a Super Admin can create staff accounts." };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const phone = digits(data.phone);
    const loginEmail = data.email && data.email.includes("@") ? data.email : syntheticEmail(phone);

    const { data: existing } = await supabaseAdmin.from("profiles").select("id").eq("phone", phone).limit(1);
    if (existing?.length) return { error: "An account with this phone number already exists." };

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: loginEmail,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });
    if (createErr || !created.user) return { error: createErr?.message || "Could not create the account." };

    const userId = created.user.id;
    const { error: profileErr } = await supabaseAdmin.from("profiles").insert({
      id: userId,
      full_name: data.fullName,
      father_name: data.fatherName || null,
      phone,
      email: loginEmail,
      role: data.role,
      status: "active",
      batch_id: data.batchId || null,
      course_id: data.courseId || null,
      legacy_id: data.legacyId || null,
    });
    if (profileErr) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return { error: profileErr.message };
    }
    await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: data.role });

    return { userId, loginEmail };
  });

/** Only a Super Admin may change someone's password. */
export const setAccountPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: z.input<typeof passwordChangeSchema>) => passwordChangeSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { resolvePowers } = await import("./accounts.server");
    const { isSuper } = await resolvePowers(context.supabase as never, context.userId);
    if (!isSuper) return { error: "Only a Super Admin can change passwords." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.password,
    });
    return error ? { error: error.message } : { ok: true };
  });

/** Full account directory for admin screens (read through the server, never the browser). */
export const listAccounts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resolvePowers } = await import("./accounts.server");
    const { isAdmin } = await resolvePowers(context.supabase as never, context.userId);
    if (!isAdmin) return { error: "You are not allowed to view accounts.", accounts: [] as CloudProfile[] };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, father_name, phone, email, role, status, photo_url, batch_id, course_id")
      .order("full_name");
    if (error) return { error: error.message, accounts: [] as CloudProfile[] };
    return { accounts: (data ?? []) as CloudProfile[] };
  });

/** Edits an existing account. Role and staff edits are Super Admin only. */
export const updateAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: z.input<typeof updateSchema>) => updateSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { resolvePowers } = await import("./accounts.server");
    const { isAdmin, isSuper } = await resolvePowers(context.supabase as never, context.userId);
    if (!isAdmin) return { error: "You are not allowed to edit accounts." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existingRows } = await supabaseAdmin
      .from("profiles")
      .select("id, role, phone, email")
      .eq("id", data.userId)
      .limit(1);
    const existing = existingRows?.[0];
    if (!existing) return { error: "Account not found." };
    if (existing.role !== data.role && !isSuper) return { error: "Only a Super Admin can change a user's role." };
    if (existing.role !== "student" && !isSuper) return { error: "Only a Super Admin can edit staff accounts." };

    const phone = digits(data.phone);
    const { data: clash } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("phone", phone)
      .neq("id", data.userId)
      .limit(1);
    if (clash?.length) return { error: "Another account already uses this phone number." };

    const loginEmail = data.email && data.email.includes("@") ? data.email : syntheticEmail(phone);

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: data.fullName,
        father_name: data.fatherName || null,
        phone,
        email: loginEmail,
        role: data.role,
        batch_id: data.batchId || null,
        course_id: data.courseId || null,
      })
      .eq("id", data.userId);
    if (error) return { error: error.message };

    // Keep the auth login e-mail in sync so sign-in never drifts from the profile.
    if (loginEmail !== existing.email) {
      await supabaseAdmin.auth.admin.updateUserById(data.userId, { email: loginEmail, email_confirm: true });
    }
    if (existing.role !== data.role) {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
      await supabaseAdmin.from("user_roles").insert({ user_id: data.userId, role: data.role });
    }
    return { ok: true };
  });

/**
 * Soft delete: deactivating blocks sign-in but keeps fees, attendance and
 * results intact. Reactivating restores access.
 */
export const setAccountStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: z.input<typeof statusSchema>) => statusSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { resolvePowers } = await import("./accounts.server");
    const { isAdmin, isSuper } = await resolvePowers(context.supabase as never, context.userId);
    if (!isAdmin) return { error: "You are not allowed to change account status." };
    if (data.userId === context.userId) return { error: "You cannot deactivate your own account." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin.from("profiles").select("role").eq("id", data.userId).limit(1);
    const target = rows?.[0];
    if (!target) return { error: "Account not found." };
    if (target.role !== "student" && !isSuper) return { error: "Only a Super Admin can deactivate staff accounts." };

    const { error } = await supabaseAdmin.from("profiles").update({ status: data.status }).eq("id", data.userId);
    return error ? { error: error.message } : { ok: true };
  });

/** One-time bootstrap: creates the first Super Admin when none exists yet. */
export const bootstrapSuperAdmin = createServerFn({ method: "POST" })
  .inputValidator((input: z.input<typeof createSchema>) => createSchema.parse({ ...input, role: "super_admin" }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .in("role", ["super_admin", "admin"]);
    if ((count ?? 0) > 0) return { error: "Setup already completed. Please sign in." };

    const phone = digits(data.phone);
    const loginEmail = data.email && data.email.includes("@") ? data.email : syntheticEmail(phone);
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: loginEmail,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });
    if (error || !created.user) return { error: error?.message || "Could not create the account." };

    await supabaseAdmin.from("profiles").insert({
      id: created.user.id,
      full_name: data.fullName,
      phone,
      email: loginEmail,
      role: "super_admin",
      status: "active",
    });
    await supabaseAdmin.from("user_roles").insert({ user_id: created.user.id, role: "super_admin" });
    return { ok: true, loginEmail };
  });

/** True when the institute still needs its first Super Admin. */
export const needsBootstrap = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .in("role", ["super_admin", "admin"]);
  return { needsBootstrap: (count ?? 0) === 0 };
});

/**
 * Permanent delete (Super Admin only). Removes the login, the profile and the
 * user's dependent records so no foreign-key orphan is left behind.
 */
export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => ({ userId: String(input.userId) }))
  .handler(async ({ data, context }) => {
    const { resolvePowers } = await import("./accounts.server");
    const { isSuper } = await resolvePowers(context.supabase as never, context.userId);
    if (!isSuper) return { error: "Only a Super Admin can delete accounts." };
    if (data.userId === context.userId) return { error: "You cannot delete your own account." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin.from("profiles").select("id").eq("id", data.userId).limit(1);
    if (!rows?.length) return { error: "Account not found." };

    // Children first, then the profile, then the auth login.
    await supabaseAdmin.from("assignment_submissions").delete().eq("student_id", data.userId);
    await supabaseAdmin.from("attendance").delete().eq("student_id", data.userId);
    await supabaseAdmin.from("payments").delete().eq("student_id", data.userId);
    await supabaseAdmin.from("fees").delete().eq("student_id", data.userId);
    await supabaseAdmin.from("enrollments").delete().eq("student_id", data.userId);
    await supabaseAdmin.from("notifications").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);

    const { error: profileErr } = await supabaseAdmin.from("profiles").delete().eq("id", data.userId);
    if (profileErr) return { error: profileErr.message };

    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    return error ? { error: error.message } : { ok: true };
  });
