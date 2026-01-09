'use client';

import { memo, useCallback } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';

const roleLabels: Record<string, string> = {
  HR_ADMIN: 'Admin',
  RECRUITER: 'Recruiter',
  EMPLOYEE: 'Employee',
};

export const Header = memo(function Header() {
  const { user, signOut } = useAuth();

  const handleLogout = useCallback(() => {
    signOut();
  }, [signOut]);

  const displayName = user?.email?.split('@')[0] || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();
  const roleLabel = user?.role ? roleLabels[user.role] : 'User';

  return (
    <header className="h-14 border-b border-slate-200 bg-white">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-900">Hirely</span>
          <Badge variant="secondary" className="text-xs">Beta</Badge>
        </div>
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 transition-opacity hover:opacity-80" suppressHydrationWarning>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">{displayName}</p>
                  <p className="text-xs text-slate-500">{roleLabel}</p>
                </div>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-slate-900 text-xs text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-slate-900">
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
});
