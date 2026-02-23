'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/contexts/LanguageContext';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import {
  LayoutDashboard,
  AlertTriangle,
  ClipboardCheck,
  Wrench,
  AlertCircle,
  FileBarChart,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  Users,
  X,
  MessageSquare,
  Target,
  Circle,
  Activity,
  CheckSquare,
  ShieldCheck,
  CalendarDays,
} from 'lucide-react';

interface OnlineUser {
  id: string;
  fullName: string;
  fullNameEn: string | null;
  email: string;
  role: string;
  lastLogin: string;
  department: {
    nameAr: string;
    nameEn: string;
  } | null;
}

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ElementType;
  badge?: number;
}

interface NavGroup {
  labelKey: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    labelKey: 'navigation.groupMain',
    items: [
      { href: '/dashboard', labelKey: 'navigation.dashboard', icon: LayoutDashboard },
    ],
  },
  {
    labelKey: 'navigation.groupRiskManagement',
    items: [
      { href: '/risks', labelKey: 'navigation.risks', icon: AlertTriangle },
      { href: '/risk-approvals', labelKey: 'navigation.riskApprovals', icon: CheckSquare },
      { href: '/assessment', labelKey: 'navigation.assessment', icon: ClipboardCheck },
      { href: '/tracking', labelKey: 'navigation.tracking', icon: Target },
    ],
  },
  {
    labelKey: 'navigation.groupTreatment',
    items: [
      { href: '/treatment', labelKey: 'navigation.treatment', icon: Wrench },
      { href: '/treatment-monitoring', labelKey: 'navigation.treatmentMonitoring', icon: Activity },
    ],
  },
  {
    labelKey: 'navigation.groupComplianceIncidents',
    items: [
      { href: '/compliance', labelKey: 'navigation.compliance', icon: ShieldCheck },
      { href: '/compliance/calendar', labelKey: 'navigation.complianceCalendar', icon: CalendarDays },
      { href: '/incidents', labelKey: 'navigation.incidents', icon: AlertCircle },
    ],
  },
  {
    labelKey: 'navigation.groupCollaboration',
    items: [
      { href: '/champions', labelKey: 'navigation.champions', icon: Users },
      { href: '/discussions', labelKey: 'navigation.discussions', icon: MessageSquare },
    ],
  },
  {
    labelKey: 'navigation.groupSystem',
    items: [
      { href: '/reports', labelKey: 'navigation.reports', icon: FileBarChart },
      { href: '/settings', labelKey: 'navigation.settings', icon: Settings },
    ],
  },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ isCollapsed, onToggle, isMobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { t, isRTL } = useTranslation();
  const { data: session } = useSession();
  const { isImpersonating, impersonatedUser } = useImpersonation();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [showOnlineUsers, setShowOnlineUsers] = useState(true);

  // Get effective user role (impersonated user's role if impersonating)
  const effectiveRole = (isImpersonating && impersonatedUser?.role)
    ? impersonatedUser.role
    : session?.user?.role;

  // Check if user has permission to see online users (based on effective role)
  const canSeeOnlineUsers = effectiveRole && ['admin', 'riskManager'].includes(effectiveRole);

  // Fetch online users (pauses when tab is hidden)
  useEffect(() => {
    if (!canSeeOnlineUsers) return;

    const fetchOnlineUsers = async () => {
      try {
        const response = await fetch('/api/users/online');
        if (response.ok) {
          const data = await response.json();
          setOnlineUsers(data.users || []);
        }
      } catch (error) {
        console.error('Error fetching online users:', error);
      }
    };

    fetchOnlineUsers();
    let interval = setInterval(fetchOnlineUsers, 60000);

    const handleVisibility = () => {
      if (document.hidden) {
        clearInterval(interval);
      } else {
        fetchOnlineUsers();
        interval = setInterval(fetchOnlineUsers, 60000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [canSeeOnlineUsers]);

  // Send heartbeat only when user is actively using the site
  useEffect(() => {
    if (!session?.user?.id) return;

    let isActive = false;

    const markActive = () => { isActive = true; };

    const sendHeartbeat = async () => {
      if (!isActive) return;
      isActive = false;
      try {
        await fetch('/api/users/online', { method: 'POST' });
      } catch (error) {
        console.error('Error sending heartbeat:', error);
      }
    };

    // Track actual user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => document.addEventListener(e, markActive));

    // Send initial heartbeat on load (user just opened the page = active)
    fetch('/api/users/online', { method: 'POST' }).catch(() => {});

    // Check every 5 min: only send if user was active
    const interval = setInterval(sendHeartbeat, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
      events.forEach(e => document.removeEventListener(e, markActive));
    };
  }, [session?.user?.id]);

  // Get role label
  const getRoleLabel = (role: string) => {
    const roles: Record<string, { ar: string; en: string }> = {
      admin: { ar: 'مدير النظام', en: 'Admin' },
      riskManager: { ar: 'مدير المخاطر', en: 'Risk Manager' },
      riskAnalyst: { ar: 'محلل المخاطر', en: 'Risk Analyst' },
      riskChampion: { ar: 'رائد المخاطر', en: 'Risk Champion' },
      riskOwner: { ar: 'مالك الخطر', en: 'Risk Owner' },
      viewer: { ar: 'مشاهد', en: 'Viewer' },
    };
    return roles[role] ? (isRTL ? roles[role].ar : roles[role].en) : role;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar - Clean Light Design */}
      <aside
        className={cn(
          'fixed top-0 z-50 flex h-full flex-col bg-[var(--sidebar-bg)] border-e border-[var(--border)] shadow-sm transition-all duration-300 lg:relative lg:z-auto',
          isCollapsed ? 'w-20' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          isRTL && isMobileOpen ? 'translate-x-0' : isRTL && 'translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo Section */}
        <div className={cn(
          'flex items-center h-16 px-4 border-b border-[var(--border)]',
          isCollapsed ? 'justify-center' : 'gap-3'
        )}>
          {/* Logo */}
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] shadow-md shrink-0">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="3" />
              <circle cx="12" cy="12" r="8" strokeDasharray="4 2" />
              <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
            </svg>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-[var(--foreground)] truncate">
                {t('common.companyName')}
              </span>
              <span className="text-xs text-[var(--primary)] font-semibold tracking-wide">
                ERM
              </span>
            </div>
          )}

          {/* Mobile Close Button */}
          {isMobileOpen && (
            <button
              onClick={onMobileClose}
              className="ms-auto lg:hidden p-1.5 rounded-lg text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-1">
            {navGroups.map((group, groupIndex) => (
              <div key={group.labelKey} className={groupIndex > 0 ? 'pt-4' : ''}>
                {/* Group Label */}
                {!isCollapsed ? (
                  <div className="px-3 pb-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--foreground-secondary)] opacity-60">
                      {t(group.labelKey)}
                    </span>
                  </div>
                ) : (
                  groupIndex > 0 && (
                    <div className="mx-2 mb-2 border-t border-[var(--border)] opacity-50" />
                  )
                )}

                {/* Group Items */}
                <ul className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    const Icon = item.icon;

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onMobileClose}
                          className={cn(
                            'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 relative',
                            isActive
                              ? 'bg-[var(--primary-light)] text-[var(--primary)]'
                              : 'text-[var(--foreground-secondary)] hover:bg-[var(--background-tertiary)] hover:text-[var(--foreground)]',
                            isCollapsed && 'justify-center px-2'
                          )}
                          title={isCollapsed ? t(item.labelKey) : undefined}
                        >
                          {/* Active Indicator */}
                          {isActive && (
                            <div className={cn(
                              'absolute top-1/2 -translate-y-1/2 w-1 h-6 bg-[var(--primary)] rounded-full',
                              isRTL ? '-end-0' : '-start-0'
                            )} />
                          )}

                          {/* Icon Container */}
                          <div className={cn(
                            'flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200 shrink-0',
                            isActive
                              ? 'bg-[var(--primary)] text-white shadow-sm'
                              : 'bg-[var(--background-tertiary)] text-[var(--foreground-secondary)] group-hover:bg-[var(--border)] group-hover:text-[var(--foreground)]'
                          )}>
                            <Icon className="h-[18px] w-[18px]" />
                          </div>

                          {!isCollapsed && (
                            <span className="truncate">{t(item.labelKey)}</span>
                          )}

                          {!isCollapsed && item.badge && (
                            <span className="ms-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--primary)] px-1.5 text-xs text-white font-bold">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        {/* Online Users Section - Only for admin and riskManager */}
        {canSeeOnlineUsers && onlineUsers.length > 0 && (
          <div className={cn(
            'border-t border-[var(--border)] transition-all duration-300',
            isCollapsed ? 'p-2' : 'p-3'
          )}>
            {/* Section Header */}
            <button
              onClick={() => setShowOnlineUsers(!showOnlineUsers)}
              className={cn(
                'w-full flex items-center gap-2 text-xs font-semibold text-[var(--foreground-secondary)] mb-2 hover:text-[var(--foreground)] transition-colors',
                isCollapsed && 'justify-center'
              )}
            >
              <div className="relative">
                <Circle className="h-2.5 w-2.5 fill-green-500 text-green-500" />
                <span className="absolute inset-0 animate-ping">
                  <Circle className="h-2.5 w-2.5 fill-green-500/50 text-green-500/50" />
                </span>
              </div>
              {!isCollapsed && (
                <>
                  <span>{isRTL ? 'المتصلون الآن' : 'Online Now'}</span>
                  <span className="ms-auto bg-green-500/20 text-green-600 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                    {onlineUsers.length}
                  </span>
                </>
              )}
            </button>

            {/* Online Users List */}
            {showOnlineUsers && !isCollapsed && (
              <div className="space-y-1 max-h-40 overflow-y-auto scrollbar-thin">
                {onlineUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--background-tertiary)] transition-colors group"
                    title={`${user.fullName} - ${user.email}`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] flex items-center justify-center text-white text-xs font-bold">
                        {(user.fullName || user.email).charAt(0).toUpperCase()}
                      </div>
                      {/* Online Indicator */}
                      <div className="absolute -bottom-0.5 -end-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-[var(--sidebar-bg)]" />
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[var(--foreground)] truncate">
                        {isRTL ? user.fullName : (user.fullNameEn || user.fullName)}
                      </p>
                      <p className="text-[10px] text-[var(--foreground-secondary)] truncate">
                        {getRoleLabel(user.role)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Collapsed State - Just show count */}
            {isCollapsed && (
              <div
                className="flex flex-col items-center gap-1 cursor-pointer"
                title={isRTL ? `${onlineUsers.length} متصل الآن` : `${onlineUsers.length} online`}
              >
                <div className="relative">
                  <Users className="h-5 w-5 text-[var(--foreground-secondary)]" />
                  <div className="absolute -top-1 -end-1 h-4 w-4 rounded-full bg-green-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {onlineUsers.length}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Collapse Toggle */}
        <div className="p-3 border-t border-[var(--border)]">
          <button
            onClick={onToggle}
            className={cn(
              'hidden w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm text-[var(--foreground-secondary)] transition-all duration-200 hover:bg-[var(--background-tertiary)] hover:text-[var(--foreground)] lg:flex',
              isCollapsed ? 'px-2' : 'px-3'
            )}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--background-tertiary)]">
              {isRTL ? (
                isCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
              ) : (
                isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />
              )}
            </div>
            {!isCollapsed && (
              <span>{isRTL ? 'طي القائمة' : 'Collapse'}</span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl p-2 text-[var(--foreground-secondary)] hover:bg-[var(--background-tertiary)] hover:text-[var(--foreground)] lg:hidden transition-colors"
    >
      <Menu className="h-6 w-6" />
    </button>
  );
}
