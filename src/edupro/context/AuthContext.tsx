import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, StudentProfile, TeacherProfile } from '../types/lms';
import { db } from '../services/db';

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  // Default logged in user is Super Admin for easy exploring, but quick switcher lets user toggle to Student, Teacher, Admin
  const [currentUserId, setCurrentUserId] = useState<string>('usr-superadmin');

  useEffect(() => {
    const syncUsers = () => {
      setUsers(db.getUsers());
    };
    syncUsers();
    const unsubscribe = db.subscribe(syncUsers);
    return () => unsubscribe();
  }, []);

  const currentUser = users.find((u) => u.id === currentUserId) || users[0] || null;
  const currentRole = currentUser?.role || 'student';

  const studentProfile = currentUser && currentUser.role === 'student'
    ? db.getStudentByUserId(currentUser.id) || null
    : null;

  const teacherProfile = currentUser && currentUser.role === 'teacher'
    ? db.getTeachers().find((t) => t.userId === currentUser.id) || null
    : null;

  const loginAsUser = (userId: string) => {
    setCurrentUserId(userId);
    const u = db.getUsers().find((usr) => usr.id === userId);
    if (u) {
      db.logActivity(u.id, u.name, u.role, 'LOGIN', 'System Portal', `Logged in as ${u.name} (${u.role})`);
    }
  };

  const logout = () => {
    if (currentUser) {
      db.logActivity(currentUser.id, currentUser.name, currentUser.role, 'LOGOUT', 'System Portal', 'User logged out');
    }
    // Default fallback to student or admin
    setCurrentUserId('usr-student-1');
  };

  const acceptPolicy = () => {
    if (!currentUser) return;
    const settings = db.getSettings();
    db.acceptPolicy(currentUser.id, settings.policy.version);
    setUsers(db.getUsers());
  };

  const refreshUserData = () => {
    setUsers(db.getUsers());
  };

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
        refreshUserData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
