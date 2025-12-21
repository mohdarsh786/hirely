'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, type Role } from '@/hooks/useAuth';

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
  redirectTo?: string;
}

export function RouteGuard({ children, allowedRoles, redirectTo = '/dashboard' }: RouteGuardProps) {
  const { user, loading, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (allowedRoles && !hasRole(allowedRoles)) {
      router.push('/403');
    }
  }, [user, loading, hasRole, allowedRoles, router]);

  // Show nothing while loading
  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    );
  }

  // If roles are specified and user doesn't have them, don't render children (redirect happening effect)
  if (allowedRoles && !hasRole(allowedRoles)) {
    return null;
  }

  return <>{children}</>;
}
