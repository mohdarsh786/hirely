'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth, type Role } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  Users,
  Video,
  FileText,
  MessageSquare,
  Settings,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  allowedRoles?: Role[];
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/candidates', label: 'Candidates', icon: Users, allowedRoles: ['HR_ADMIN', 'RECRUITER'] },
  { href: '/interviews', label: 'Interviews', icon: Video, allowedRoles: ['HR_ADMIN', 'RECRUITER'] },
  { href: '/resumes', label: 'Resumes', icon: FileText, allowedRoles: ['HR_ADMIN', 'RECRUITER'] },
  { href: '/hr-assistant', label: 'HR Assistant', icon: MessageSquare },
];

const adminItems: NavItem[] = [
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, hasRole } = useAuth();

  const filterByRole = (items: NavItem[]) =>
    items.filter((item) => {
      if (!item.allowedRoles) return true;
      if (!user?.role) return false;
      return hasRole(item.allowedRoles);
    });

  const visibleNavItems = filterByRole(navItems);
  const visibleAdminItems = filterByRole(adminItems);

  return (
    <aside className="w-56 border-r border-slate-200 bg-white flex flex-col">
      <div className="flex h-14 items-center border-b border-slate-200 px-5">
        <span className="text-base font-semibold text-slate-900">Hirely</span>
      </div>
      <nav className="flex-1 flex flex-col gap-1 p-3">
        {visibleNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-slate-100 font-medium text-slate-900'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      {visibleAdminItems.length > 0 && (
        <div className="border-t border-slate-200 p-3">
          {visibleAdminItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-slate-100 font-medium text-slate-900'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </aside>
  );
}
