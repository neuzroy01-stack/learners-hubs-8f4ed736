import { z } from "zod";

/** Strips everything except digits so phone numbers compare reliably. */
export const digits = (v: string) => v.replace(/[^0-9]/g, "");

/** Every account needs an email for auth; students often only have a phone. */
export const syntheticEmail = (phone: string) => `s${digits(phone)}@accounts.learnerhub.app`;

export const identifierSchema = z.string().trim().min(3).max(120);
export const passwordSchema = z.string().min(6).max(128);

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

export const signInSchema = z.object({
  identifier: identifierSchema,
  password: passwordSchema,
  staff: z.boolean().optional(),
});

export const createSchema = z.object({
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

export const updateSchema = z.object({
  userId: z.string().uuid(),
  fullName: z.string().trim().min(2).max(120),
  fatherName: z.string().trim().max(120).optional(),
  phone: z.string().trim().min(6).max(20),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  role: z.enum(["super_admin", "admin", "teacher", "student"]),
  batchId: z.string().trim().max(60).optional(),
  courseId: z.string().trim().max(60).optional(),
});

export const passwordChangeSchema = z.object({
  userId: z.string().uuid(),
  password: passwordSchema,
});

export const statusSchema = z.object({
  userId: z.string().uuid(),
  status: z.enum(["active", "inactive"]),
});
