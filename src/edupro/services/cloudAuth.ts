import { supabase } from "@/integrations/supabase/client";
import { db } from "./db";
import type { User, UserRole } from "../types/lms";

export type CloudProfile = {
  id: string;
  full_name: string;
  father_name: string | null;
  phone: string | null;
  email: string | null;
  role: UserRole;
  status: string;
  photo_url: string | null;
  batch_id: string | null;
  course_id: string | null;
};

/**
 * Makes sure the signed-in cloud account also exists in the local app store so
 * every existing dashboard keeps working untouched. Records are keyed by the
 * cloud account id, so the same person resolves to the same record everywhere.
 */
export function ensureLocalAccount(profile: CloudProfile): User {
  const existing = db.getUsers().find((u) => u.id === profile.id);
  const user: User =
    existing || {
      id: profile.id,
      name: profile.full_name,
      email: profile.email || '',
      phone: profile.phone || '',
      role: profile.role,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      passwordHash: '',
    };
  user.name = profile.full_name;
  user.role = profile.role;
  user.phone = profile.phone || user.phone;
  user.email = profile.email || user.email;
  db.saveUser(user);

  if (profile.role === 'student' && !db.getStudentByUserId(profile.id)) {
    const batch = profile.batch_id ? db.getBatches().find((b) => b.id === profile.batch_id) : undefined;
    db.saveStudent({
      id: `stu-${profile.id.slice(0, 8)}`,
      userId: profile.id,
      studentCode: `STU-${profile.id.slice(0, 6).toUpperCase()}`,
      fullName: profile.full_name,
      fatherName: profile.father_name || '',
      motherName: '',
      phone: profile.phone || '',
      whatsappPhone: profile.phone || '',
      email: profile.email || '',
      dob: '',
      gender: 'Male',
      address: '',
      photoUrl: profile.photo_url || '',
      admissionDate: new Date().toISOString().split('T')[0],
      batchId: batch?.id || '',
      batchName: batch?.name || 'Unassigned',
      status: 'active',
    });
  }

  if (profile.role === 'teacher' && !db.getTeachers().some((t) => t.userId === profile.id)) {
    db.saveTeacher({
      id: `tch-${profile.id.slice(0, 8)}`,
      userId: profile.id,
      employeeCode: `TCH-${profile.id.slice(0, 6).toUpperCase()}`,
      fullName: profile.full_name,
      email: profile.email || '',
      phone: profile.phone || '',
      subjectSpecialization: 'General',
      designation: 'Instructor',
      joiningDate: new Date().toISOString().split('T')[0],
      monthlySalary: 0,
      status: 'active',
      assignedBatchIds: [],
      assignedCourseIds: profile.course_id ? [profile.course_id] : [],
    });
  }

  return user;
}

/** Stores the cloud session in the browser and mirrors the account locally. */
export async function completeCloudSignIn(session: unknown, profile: CloudProfile) {
  const s = session as { access_token: string; refresh_token: string };
  await supabase.auth.setSession({ access_token: s.access_token, refresh_token: s.refresh_token });
  const user = ensureLocalAccount(profile);
  try { window.localStorage.setItem('lh_uid', user.id); } catch { /* storage blocked */ }
  db.logActivity(user.id, user.name, user.role, 'LOGIN', 'Auth Portal', `Signed in securely as ${user.role}`);
  return user;
}

export async function cloudSignOut() {
  try { await supabase.auth.signOut(); } catch { /* already signed out */ }
  try { window.localStorage.removeItem('lh_uid'); } catch { /* storage blocked */ }
}
