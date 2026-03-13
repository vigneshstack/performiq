'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  FileText,
  Target,
  Building2,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  Bell,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useNotifications } from '@/hooks/useAssessments';
import { Avatar } from '@/components/ui/avatar';
import { createClient } from '@/lib/supabase/client';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/employees', label: 'Employees', icon: Users },
  { href: '/assessments', label: 'Assessments', icon: ClipboardCheck },
  { href: '/templates', label: 'Templates', icon: FileText },
  { href: '/goals', label: 'Goals & OKRs', icon: Target },
  { href: '/departments', label: 'Departments', icon: Building2 },
  { href: '/reports', label: 'Reports', icon: BarChart2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();
  const { profile } = useAuthStore();
  const { data: notifications } = useNotifications();
  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0;

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <aside
      className={cn(
        'relative flex flex-col bg-zinc-900 transition-all duration-300 ease-in-out h-screen sticky top-0',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-zinc-800', sidebarCollapsed && 'justify-center')}>
        <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-indigo-600 rounded-lg">
          <BarChart2 className="h-4 w-4 text-white" />
        </div>
        {!sidebarCollapsed && (
          <span className="text-white font-bold text-lg tracking-tight">PerformIQ</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800',
                sidebarCollapsed && 'justify-center px-2'
              )}
              title={sidebarCollapsed ? label : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Notifications bell */}
      <div className={cn('px-2 pb-2', sidebarCollapsed && 'flex justify-center')}>
        <Link
          href="/notifications"
          className={cn(
            'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors',
            sidebarCollapsed && 'justify-center px-2'
          )}
          title={sidebarCollapsed ? 'Notifications' : undefined}
        >
          <div className="relative">
            <Bell className="h-5 w-5 flex-shrink-0" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-4 h-4 text-xs font-bold bg-red-500 text-white rounded-full">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          {!sidebarCollapsed && (
            <span>
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </span>
          )}
        </Link>
      </div>

      {/* User section */}
      <div className="border-t border-zinc-800 p-3">
        {!sidebarCollapsed ? (
          <div className="flex items-center gap-3">
            <Avatar
              src={profile?.avatar_url}
              name={profile?.full_name}
              size="sm"
              className="flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {profile?.full_name ?? 'User'}
              </p>
              <p className="text-xs text-zinc-400 truncate capitalize">{profile?.role ?? 'employee'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebarCollapsed}
        className="absolute -right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 bg-zinc-800 border border-zinc-700 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors z-10"
        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {sidebarCollapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>
    </aside>
  );
}
