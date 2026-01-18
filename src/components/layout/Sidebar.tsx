'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/contexts/LanguageContext';
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
} from 'lucide-react';

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ElementType;
  badge?: number;
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    labelKey: 'navigation.dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/risks',
    labelKey: 'navigation.risks',
    icon: AlertTriangle,
  },
  {
    href: '/assessment',
    labelKey: 'navigation.assessment',
    icon: ClipboardCheck,
  },
  {
    href: '/treatment',
    labelKey: 'navigation.treatment',
    icon: Wrench,
  },
  {
    href: '/champions',
    labelKey: 'navigation.champions',
    icon: Users,
  },
  {
    href: '/incidents',
    labelKey: 'navigation.incidents',
    icon: AlertCircle,
  },
  {
    href: '/reports',
    labelKey: 'navigation.reports',
    icon: FileBarChart,
  },
  {
    href: '/settings',
    labelKey: 'navigation.settings',
    icon: Settings,
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
          'fixed top-0 z-50 flex h-full flex-col bg-white border-e border-[var(--border)] shadow-sm transition-all duration-300 lg:relative lg:z-auto',
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
          <ul className="space-y-1">
            {navItems.map((item) => {
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
        </nav>

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
