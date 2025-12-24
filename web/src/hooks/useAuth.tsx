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
  refreshUser: () => Promise<void>;
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

const storage = {
  get: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(key, value);
    } catch {}
  },
  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.removeItem(key);
    } catch {}
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    
    const initAuth = async () => {
      try {
        const { data } = await getUser();
        if (!mounted) return;
        
        if (data?.user) {
          let organizationId: string | undefined;
          
          const cachedOrgId = storage.get('org_id');
          if (cachedOrgId) {
            organizationId = cachedOrgId;
          } else {
            try {
              const orgData = await api.organizations.getMyOrg();
              organizationId = orgData.organization?.id;
              if (organizationId) {
                storage.set('org_id', organizationId);
              }
            } catch {}
          }

          if (mounted) {
            setUser({
              id: data.user.id,
              email: data.user.email ?? null,
              role: extractRole(data.user),
              organizationId,
            });
          }
        }
      } catch (error) {
        console.error('Auth init error:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      if (session?.user) {
        const { data } = await getUser();
        if (data?.user && mounted) {
          let organizationId: string | undefined;
          
          const cachedOrgId = storage.get('org_id');
          if (cachedOrgId) {
            organizationId = cachedOrgId;
          } else {
            try {
              const orgData = await api.organizations.getMyOrg();
              organizationId = orgData.organization?.id;
              if (organizationId) {
                storage.set('org_id', organizationId);
              }
            } catch (e) {}
          }

          if (mounted) {
            setUser({
              id: data.user.id,
              email: data.user.email ?? null,
              role: extractRole(data.user),
              organizationId,
            });
          }
        }
      } else {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    storage.remove('org_id');
    setUser(null);
    router.push('/login');
  };

  const hasRole = (roles: Role[]) => {
    if (!user?.role) return false;
    return roles.includes(user.role);
  };

  const refreshUser = async () => {
    const { data } = await getUser();
    if (data?.user) {
      let organizationId: string | undefined;
      
      try {
        const orgData = await api.organizations.getMyOrg();
        organizationId = orgData.organization?.id;
        if (organizationId) {
          storage.set('org_id', organizationId);
        }
      } catch {}


      setUser({
        id: data.user.id,
        email: data.user.email ?? null,
        role: extractRole(data.user),
        organizationId,
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut: handleSignOut, hasRole, refreshUser }}>
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
