import { db } from './db';
import type { User, UserRole } from '../types/lms';

// Demo password map: real password store not part of mock data.
// Each account uses a role-derived demo password so the login form actually validates.
// Documented on the login pages themselves.
const DEMO_PASSWORDS: Record<UserRole, string> = {
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
  return password === DEMO_PASSWORDS[user.role];
};

export const demoPasswordHintFor = (role: UserRole) => DEMO_PASSWORDS[role];

export const persistSession = (userId: string) => {
  try { window.localStorage.setItem('lh_uid', userId); } catch {}
  const u = db.getUsers().find((x) => x.id === userId);
  if (u) {
    db.logActivity(u.id, u.name, u.role, 'LOGIN', 'Auth Portal', `Signed in via login form as ${u.role}`);
  }
};
