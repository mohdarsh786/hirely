'use client';

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
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
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          setLoading(false);
          return;
        }

        // Fire these in parallel!
        const [orgData] = await Promise.all([
          api.organizations.getMyOrg().catch(() => null),
          // any other initial data
        ]);

        setUser({
          id: user.id,
          email: user.email ?? null,
          organizationId: orgData?.organization?.id,
          role: extractRole(user)
        });
      } catch (error) {
        // Silently handle auth errors for public pages
        console.debug('Auth initialization skipped:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      if (session?.user) {
        try {
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
        } catch (error) {
          // Silently handle auth errors
          console.debug('Auth state change error:', error);
          setUser(null);
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

  const handleSignOut = useCallback(async () => {
    // Immediately clear state for instant UI response
    setUser(null);
    storage.remove('org_id');
    router.push('/login');
    
    // Sign out in background
    supabase.auth.signOut().catch(console.error);
  }, [router]);

  const hasRole = useCallback((roles: Role[]) => {
    if (!user?.role) return false;
    return roles.includes(user.role);
  }, [user?.role]);

  const refreshUser = useCallback(async () => {
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
  }, []);

  const value = useMemo(
    () => ({ user, loading, signOut: handleSignOut, hasRole, refreshUser }),
    [user, loading, handleSignOut, hasRole, refreshUser]
  );

  return (
    <AuthContext.Provider value={value}>
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
