import { db } from './db';
import type { User, UserRole } from '../types/lms';

// Legacy seeded accounts that don't have a stored passwordHash use this map.
// New accounts created via the Super Admin flow always store a passwordHash on the user record.
const LEGACY_SEED_PASSWORDS: Record<UserRole, string> = {
  super_admin: 'super123',
  admin: 'admin123',
  teacher: 'teacher123',
  student: 'student123',
};

const normalizePhone = (v: string) => v.replace(/[^0-9]/g, '');

export const findStudentByPhone = (phoneInput: string): User | null => {
  const target = normalizePhone(phoneInput);
  if (target.length < 6) return null;
  const users = db.getUsers();
  return (
    users.find(
      (u) => u.role === 'student' && normalizePhone(u.phone).endsWith(target),
    ) || null
  );
};

export const findAdminByIdentifier = (identifier: string): User | null => {
  const id = identifier.trim().toLowerCase();
  if (!id) return null;
  const target = normalizePhone(identifier);
  const users = db.getUsers();
  return (
    users.find((u) => {
      if (u.role === 'student') return false;
      const email = u.email.toLowerCase();
      const phone = normalizePhone(u.phone);
      return email === id || u.id.toLowerCase() === id || (target.length >= 6 && phone.endsWith(target));
    }) || null
  );
};

export const validatePassword = (user: User, password: string): boolean => {
  if (!password) return false;
  if (user.status === 'blocked' || user.status === 'inactive') return false;
  if (user.passwordHash && user.passwordHash.length > 0) {
    return password === user.passwordHash;
  }
  // Legacy seeded accounts without a stored password fall back to the role-derived seed.
  return password === LEGACY_SEED_PASSWORDS[user.role];
};

export const persistSession = (userId: string) => {
  try { window.localStorage.setItem('lh_uid', userId); } catch {}
  const u = db.getUsers().find((x) => x.id === userId);
  if (u) {
    db.logActivity(u.id, u.name, u.role, 'LOGIN', 'Auth Portal', `Signed in via login form as ${u.role}`);
  }
};
