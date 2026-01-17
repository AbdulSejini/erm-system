'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    labelKey: 'navigation.dashboard',
    icon: <LayoutDashboard className="h-4 w-4 sm:h-5 sm:w-5" />,
  },
  {
    href: '/risks',
    labelKey: 'navigation.risks',
    icon: <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />,
  },
  {
    href: '/assessment',
    labelKey: 'navigation.assessment',
    icon: <ClipboardCheck className="h-4 w-4 sm:h-5 sm:w-5" />,
  },
  {
    href: '/treatment',
    labelKey: 'navigation.treatment',
    icon: <Wrench className="h-4 w-4 sm:h-5 sm:w-5" />,
  },
  {
    href: '/champions',
    labelKey: 'navigation.champions',
    icon: <Users className="h-4 w-4 sm:h-5 sm:w-5" />,
  },
  {
    href: '/incidents',
    labelKey: 'navigation.incidents',
    icon: <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />,
  },
  {
    href: '/reports',
    labelKey: 'navigation.reports',
    icon: <FileBarChart className="h-4 w-4 sm:h-5 sm:w-5" />,
  },
  {
    href: '/settings',
    labelKey: 'navigation.settings',
    icon: <Settings className="h-4 w-4 sm:h-5 sm:w-5" />,
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
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 z-50 flex h-full flex-col bg-[var(--sidebar-bg)] transition-all duration-300 lg:relative lg:z-auto',
          isCollapsed ? 'w-20' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          isRTL && isMobileOpen ? 'translate-x-0' : isRTL && '-translate-x-0 translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo Section */}
        <div className="flex h-14 sm:h-16 items-center justify-between border-b border-[var(--sidebar-hover)] px-3 sm:px-4">
          <div className={cn('flex items-center gap-2 sm:gap-3', isCollapsed && 'justify-center w-full')}>
            {/* Logo Icon */}
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-[var(--primary)] shrink-0">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5 sm:h-6 sm:w-6 text-white"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="8" r="2" fill="currentColor" />
                <circle cx="8" cy="12" r="2" fill="currentColor" />
                <circle cx="16" cy="12" r="2" fill="currentColor" />
                <circle cx="12" cy="16" r="2" fill="currentColor" />
                <circle cx="9" cy="10" r="1.5" fill="currentColor" />
                <circle cx="15" cy="10" r="1.5" fill="currentColor" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              </svg>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-bold text-white truncate">
                  {t('common.companyName')}
                </span>
                <span className="text-[10px] sm:text-xs text-[var(--sidebar-text)] opacity-70">
                  ERM
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onMobileClose}
                    className={cn(
                      'flex items-center gap-2 sm:gap-3 rounded-lg px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-[var(--primary)] text-white'
                        : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)]',
                      isCollapsed && 'justify-center px-0'
                    )}
                    title={isCollapsed ? t(item.labelKey) : undefined}
                  >
                    {item.icon}
                    {!isCollapsed && <span>{t(item.labelKey)}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Collapse Toggle */}
        <div className="border-t border-[var(--sidebar-hover)] p-2 sm:p-3">
          <button
            onClick={onToggle}
            className="hidden w-full items-center justify-center gap-2 rounded-lg py-1.5 sm:py-2 text-xs sm:text-sm text-[var(--sidebar-text)] transition-colors hover:bg-[var(--sidebar-hover)] lg:flex"
          >
            {isRTL ? (
              isCollapsed ? <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" /> : <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              isCollapsed ? <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" /> : <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
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
      className="rounded-lg p-2 text-[var(--foreground)] hover:bg-[var(--background-secondary)] lg:hidden"
    >
      <Menu className="h-6 w-6" />
    </button>
  );
}
