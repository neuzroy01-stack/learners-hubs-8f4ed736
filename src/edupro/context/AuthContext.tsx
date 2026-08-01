import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { User, UserRole, StudentProfile, TeacherProfile } from '../types/lms';
import { db } from '../services/db';
import { cloudSignOut, ensureLocalAccount, type CloudProfile } from '../services/cloudAuth';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  currentUser: User | null;
  currentRole: UserRole;
  cloudProfile: CloudProfile | null;
  authLoading: boolean;
  studentProfile: StudentProfile | null;
  teacherProfile: TeacherProfile | null;
  loginAsUser: (userId: string) => void;
  logout: () => void;
  acceptPolicy: () => void;
  refreshUserData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication is database-only: the signed-in Supabase session decides who
 * the user is, and the profile row is always re-read from the database so the
 * app never trusts stale browser data.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<CloudProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [localTick, setLocalTick] = useState(0);

  const loadProfile = useCallback(async () => {
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (!uid) {
      setProfile(null);
      setAuthLoading(false);
      return;
    }
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
    if (data && (data as CloudProfile).status === 'active') {
      const p = data as CloudProfile;
      setProfile(p);
      ensureLocalAccount(p);
    } else {
      setProfile(null);
      await cloudSignOut();
    }
    setAuthLoading(false);
  }, []);

  useEffect(() => {
    void loadProfile();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        void loadProfile();
      }
    });
    const unsubscribe = db.subscribe(() => setLocalTick((t) => t + 1));
    return () => {
      sub.subscription.unsubscribe();
      unsubscribe();
    };
  }, [loadProfile]);

  const currentUser: User | null = profile
    ? db.getUsers().find((u) => u.id === profile.id) ?? {
        id: profile.id,
        name: profile.full_name,
        email: profile.email || '',
        phone: profile.phone || '',
        role: profile.role,
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0],
        passwordHash: '',
      }
    : null;

  const currentRole: UserRole = profile?.role || 'student';

  const studentProfile =
    currentUser && currentRole === 'student' ? db.getStudentByUserId(currentUser.id) || null : null;

  const teacherProfile =
    currentUser && currentRole === 'teacher'
      ? db.getTeachers().find((t) => t.userId === currentUser.id) || null
      : null;

  const loginAsUser = () => {
    // Sessions are issued by the database; there is no local impersonation.
    void loadProfile();
  };

  const logout = () => {
    setProfile(null);
    void cloudSignOut().finally(() => {
      if (typeof window !== 'undefined') window.location.href = '/login';
    });
  };

  const acceptPolicy = () => {
    if (!currentUser) return;
    const settings = db.getSettings();
    db.acceptPolicy(currentUser.id, settings.policy.version);
    setLocalTick((t) => t + 1);
  };

  const refreshUserData = () => {
    setLocalTick((t) => t + 1);
    void loadProfile();
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        cloudProfile: profile,
        authLoading,
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
