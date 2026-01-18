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
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 z-50 flex h-full flex-col bg-gradient-to-b from-[#1a1a2e] to-[#16213e] transition-all duration-300 lg:relative lg:z-auto',
          isCollapsed ? 'w-20' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          isRTL && isMobileOpen ? 'translate-x-0' : isRTL && 'translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo Section */}
        <div className={cn(
          'flex items-center h-16 px-4',
          isCollapsed ? 'justify-center' : 'gap-3'
        )}>
          {/* Logo */}
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/30 shrink-0">
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <circle cx="12" cy="12" r="8" strokeDasharray="4 2" />
              <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
            </svg>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-white truncate">
                {t('common.companyName')}
              </span>
              <span className="text-xs text-orange-400 font-medium tracking-wide">
                ERM
              </span>
            </div>
          )}

          {/* Mobile Close Button */}
          {isMobileOpen && (
            <button
              onClick={onMobileClose}
              className="ms-auto lg:hidden p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3">
          <ul className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onMobileClose}
                    className={cn(
                      'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 relative',
                      isActive
                        ? 'bg-gradient-to-r from-orange-500/20 to-orange-600/10 text-white'
                        : 'text-gray-400 hover:bg-white/5 hover:text-gray-200',
                      isCollapsed && 'justify-center px-2'
                    )}
                    title={isCollapsed ? t(item.labelKey) : undefined}
                  >
                    {/* Active Indicator */}
                    {isActive && (
                      <div className={cn(
                        'absolute top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full',
                        isRTL ? '-end-0.5' : '-start-0.5'
                      )} />
                    )}

                    {/* Icon Container */}
                    <div className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200 shrink-0',
                      isActive
                        ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30'
                        : 'bg-white/5 text-gray-400 group-hover:bg-white/10 group-hover:text-gray-200'
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>

                    {!isCollapsed && (
                      <span className="truncate">{t(item.labelKey)}</span>
                    )}

                    {!isCollapsed && item.badge && (
                      <span className="ms-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1.5 text-xs text-white font-bold">
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
        <div className="p-3 mt-auto">
          <button
            onClick={onToggle}
            className={cn(
              'hidden w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm text-gray-400 transition-all duration-200 hover:bg-white/5 hover:text-gray-200 lg:flex',
              isCollapsed ? 'px-2' : 'px-3'
            )}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
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
      className="rounded-lg p-2 text-[var(--foreground)] hover:bg-[var(--background-secondary)] lg:hidden transition-colors"
    >
      <Menu className="h-6 w-6" />
    </button>
  );
}
