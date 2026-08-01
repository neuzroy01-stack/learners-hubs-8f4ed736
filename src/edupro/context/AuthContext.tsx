import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserRole, StudentProfile, TeacherProfile } from '../types/lms';
import { db } from '../services/db';
import { cloudSignOut } from '../services/cloudAuth';

const STORAGE_KEY = 'lh_uid';

interface AuthContextType {
  currentUser: User | null;
  currentRole: UserRole;
  studentProfile: StudentProfile | null;
  teacherProfile: TeacherProfile | null;
  loginAsUser: (userId: string) => void;
  logout: () => void;
  acceptPolicy: () => void;
  refreshUserData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const readStoredUid = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const syncUsers = () => setUsers(db.getUsers());
    syncUsers();
    const unsubscribe = db.subscribe(syncUsers);
    // hydrate session id from storage (client only)
    setCurrentUserId(readStoredUid());
    return () => unsubscribe();
  }, []);

  const currentUser = (currentUserId && users.find((u) => u.id === currentUserId)) || null;
  const currentRole: UserRole = currentUser?.role || 'student';

  const studentProfile = currentUser && currentUser.role === 'student'
    ? db.getStudentByUserId(currentUser.id) || null
    : null;

  const teacherProfile = currentUser && currentUser.role === 'teacher'
    ? db.getTeachers().find((t) => t.userId === currentUser.id) || null
    : null;

  const loginAsUser = (userId: string) => {
    setCurrentUserId(userId);
    try { window.localStorage.setItem(STORAGE_KEY, userId); } catch {}
    const u = db.getUsers().find((usr) => usr.id === userId);
    if (u) {
      db.logActivity(u.id, u.name, u.role, 'LOGIN', 'System Portal', `Logged in as ${u.name} (${u.role})`);
    }
  };

  const logout = () => {
    if (currentUser) {
      db.logActivity(currentUser.id, currentUser.name, currentUser.role, 'LOGOUT', 'System Portal', 'User logged out');
    }
    setCurrentUserId(null);
    void cloudSignOut().finally(() => {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    });
  };

  const acceptPolicy = () => {
    if (!currentUser) return;
    const settings = db.getSettings();
    db.acceptPolicy(currentUser.id, settings.policy.version);
    setUsers(db.getUsers());
  };

  const refreshUserData = () => setUsers(db.getUsers());

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        studentProfile,
        teacherProfile,
        loginAsUser,
        logout,
        acceptPolicy,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
