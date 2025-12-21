'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, getUser } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export type Role = 'HR_ADMIN' | 'RECRUITER' | 'EMPLOYEE';

export interface AuthUser {
  id: string;
  email: string | null;
  role: Role | null;
  organizationId?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  hasRole: (roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function extractRole(user: any): Role | null {
  const candidates: unknown[] = [
    user?.app_metadata?.role,
    user?.user_metadata?.role,
    user?.app_metadata?.claims?.role,
    user?.user_metadata?.claims?.role,
    user?.role,
  ];

  for (const raw of candidates) {
    if (typeof raw !== 'string') continue;
    const normalized = raw.trim().toUpperCase().replace(/[-\s]+/g, '_');
    if (normalized === 'HR_ADMIN' || normalized === 'RECRUITER' || normalized === 'EMPLOYEE') {
      return normalized as Role;
    }
  }

  return null;
}

import { api } from '@/lib/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      const { data } = await getUser();
      if (data?.user) {
        let organizationId: string | undefined;
        try {
          const orgData = await api.organizations.getMyOrg();
          organizationId = orgData.organization?.id;
        } catch {
          // Ignore
        }

        setUser({
          id: data.user.id,
          email: data.user.email ?? null,
          role: extractRole(data.user),
          organizationId,
        });
      }
      setLoading(false);
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data } = await getUser();
        if (data?.user) {
          let organizationId: string | undefined;
          try {
            const orgData = await api.organizations.getMyOrg();
            organizationId = orgData.organization?.id;
          } catch (e) {
            // Ignore
          }

          setUser({
            id: data.user.id,
            email: data.user.email ?? null,
            role: extractRole(data.user),
            organizationId,
          });
        }
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
  };

  const hasRole = (roles: Role[]) => {
    if (!user?.role) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut: handleSignOut, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
