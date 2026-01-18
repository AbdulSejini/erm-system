'use client';

import React, { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslation, useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import {
  Sun,
  Moon,
  Bell,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Languages,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MobileMenuButton } from './Sidebar';

interface HeaderProps {
  onMobileMenuClick: () => void;
}

export function Header({ onMobileMenuClick }: HeaderProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { t, isRTL } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  // User data from session
  const user = {
    name: session?.user?.name || (language === 'ar' ? 'مستخدم' : 'User'),
    role: session?.user?.role === 'admin'
      ? (language === 'ar' ? 'مدير النظام' : 'Administrator')
      : (language === 'ar' ? 'مستخدم' : 'User'),
    email: session?.user?.email || '',
    avatar: null,
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--border)] bg-white px-4 lg:px-6 shadow-sm">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <MobileMenuButton onClick={onMobileMenuClick} />
        <div className="hidden lg:block">
          <h1 className="text-lg font-semibold text-[var(--foreground)]">
            {t('common.appName')}
          </h1>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-1.5">
        {/* Language Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleLanguage}
          title={language === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
          className="rounded-xl text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)]"
        >
          <Languages className="h-5 w-5" />
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          title={theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
          className="rounded-xl text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)]"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>

        {/* Notifications */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-xl text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)]"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute end-2 top-2 h-2 w-2 rounded-full bg-[var(--status-error)] ring-2 ring-white" />
          </Button>

          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />
              <div className={cn(
                'absolute top-full z-50 mt-2 w-80 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-xl',
                isRTL ? 'left-0' : 'right-0'
              )}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-[var(--foreground)]">
                    {t('notifications.title')}
                  </h3>
                  <button className="text-sm text-[var(--primary)] hover:underline font-medium">
                    {t('notifications.markAllRead')}
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="rounded-xl bg-[var(--background-tertiary)] p-3 hover:bg-[var(--border)] transition-colors cursor-pointer">
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      {t('notifications.newRisk')}
                    </p>
                    <p className="mt-1 text-xs text-[var(--foreground-secondary)]">
                      {language === 'ar' ? 'منذ 5 دقائق' : '5 minutes ago'}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[var(--background-tertiary)] p-3 hover:bg-[var(--border)] transition-colors cursor-pointer">
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      {t('notifications.treatmentDue')}
                    </p>
                    <p className="mt-1 text-xs text-[var(--foreground-secondary)]">
                      {language === 'ar' ? 'منذ ساعة' : '1 hour ago'}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Menu */}
        <div className="relative ms-2">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 rounded-xl p-2 transition-colors hover:bg-[var(--background-tertiary)]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] text-sm font-semibold text-white shadow-sm">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-full w-full rounded-xl object-cover"
                />
              ) : (
                user.name.charAt(0)
              )}
            </div>
            <div className="hidden text-start md:block">
              <p className="text-sm font-medium text-[var(--foreground)]">
                {user.name}
              </p>
              <p className="text-xs text-[var(--foreground-secondary)]">
                {user.role}
              </p>
            </div>
            <ChevronDown className="hidden h-4 w-4 text-[var(--foreground-muted)] md:block" />
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div className={cn(
                'absolute top-full z-50 mt-2 w-56 rounded-2xl border border-[var(--border)] bg-white py-2 shadow-xl',
                isRTL ? 'left-0' : 'right-0'
              )}>
                <div className="border-b border-[var(--border)] px-4 py-3">
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {user.name}
                  </p>
                  <p className="text-xs text-[var(--foreground-secondary)]">
                    {user.role}
                  </p>
                </div>
                <div className="py-1">
                  <button className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--background-tertiary)]">
                    <User className="h-4 w-4 text-[var(--foreground-secondary)]" />
                    {t('navigation.profile')}
                  </button>
                  <button className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--background-tertiary)]">
                    <Settings className="h-4 w-4 text-[var(--foreground-secondary)]" />
                    {t('navigation.settings')}
                  </button>
                </div>
                <div className="border-t border-[var(--border)] py-1">
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[var(--status-error)] transition-colors hover:bg-[var(--status-error-bg)]"
                  >
                    <LogOut className="h-4 w-4" />
                    {t('auth.logout')}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
