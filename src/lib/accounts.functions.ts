import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const digits = (v: string) => v.replace(/[^0-9]/g, "");

/** Every account needs an email for auth; students often only have a phone. */
export const syntheticEmail = (phone: string) => `s${digits(phone)}@accounts.learnerhub.app`;

const identifierSchema = z.string().trim().min(3).max(120);
const passwordSchema = z.string().min(6).max(128);

export type CloudProfile = {
  id: string;
  full_name: string;
  father_name: string | null;
  phone: string | null;
  email: string | null;
  role: "super_admin" | "admin" | "teacher" | "student";
  status: string;
  photo_url: string | null;
  batch_id: string | null;
  course_id: string | null;
};

/**
 * Sign in with a phone number, student id or email + password.
 * Runs server-side so the phone -> email mapping never leaks to the browser.
 */
export const signIn = createServerFn({ method: "POST" })
  .inputValidator((input: { identifier: string; password: string; staff?: boolean }) =>
    z
      .object({ identifier: identifierSchema, password: passwordSchema, staff: z.boolean().optional() })
      .parse(input),
  )
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

    const loginEmail = profile.email?.includes("@")
      ? profile.email
      : syntheticEmail(profile.phone || phone);

    const { data: auth, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: data.password,
    });
    if (error || !auth.session) return generic;

    return { session: auth.session, profile };
  });

const createSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  fatherName: z.string().trim().max(120).optional(),
  phone: z.string().trim().min(6).max(20),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  password: passwordSchema,
  role: z.enum(["super_admin", "admin", "teacher", "student"]),
  batchId: z.string().trim().max(60).optional(),
  courseId: z.string().trim().max(60).optional(),
  legacyId: z.string().trim().max(60).optional(),
});

/** Super Admin / Admin creates a real cloud account that works on any device. */
export const createAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: z.input<typeof createSchema>) => createSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: isSuper } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "super_admin",
    });
    const { data: isAdmin } = await context.supabase.rpc("is_staff_admin", { _user_id: context.userId });
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
  .inputValidator((input: { userId: string; password: string }) =>
    z.object({ userId: z.string().uuid(), password: passwordSchema }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: isSuper } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "super_admin",
    });
    if (!isSuper) return { error: "Only a Super Admin can change passwords." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.password,
    });
    return error ? { error: error.message } : { ok: true };
  });

/** One-time bootstrap: creates the first Super Admin when none exists yet. */
export const bootstrapSuperAdmin = createServerFn({ method: "POST" })
  .inputValidator((input: z.input<typeof createSchema>) =>
    createSchema.parse({ ...input, role: "super_admin" }),
  )
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

/** Super Admin only: permanently deletes an account (auth user + profile + role). */
export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) =>
    z.object({ userId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: isSuper } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "super_admin",
    });
    if (!isSuper) return { error: "Only a Super Admin can delete accounts." };
    if (data.userId === context.userId) return { error: "You cannot delete your own account." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: victim } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", data.userId)
      .maybeSingle();
    if (!victim) return { error: "Account not found." };

    // Remove dependent rows first so nothing orphans.
    await supabaseAdmin.from("assignment_submissions").delete().eq("student_id", data.userId);
    await supabaseAdmin.from("attendance").delete().eq("student_id", data.userId);
    await supabaseAdmin.from("payments").delete().eq("student_id", data.userId);
    await supabaseAdmin.from("fees").delete().eq("student_id", data.userId);
    await supabaseAdmin.from("enrollments").delete().eq("student_id", data.userId);
    await supabaseAdmin.from("notifications").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("profiles").delete().eq("id", data.userId);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error && !/not found/i.test(error.message)) return { error: error.message };

    await supabaseAdmin.from("audit_logs").insert({
      actor_id: context.userId,
      action: "DELETE",
      entity_type: "account",
      entity_id: data.userId,
      old_values: victim as never,
    });

    return { ok: true };
  });

/** Staff-only directory read straight from the database. */
export const listAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) return { error: "Not allowed." as const, accounts: [] as CloudProfile[] };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("profiles").select("*").order("full_name");
    return { accounts: (data ?? []) as CloudProfile[] };
  });
