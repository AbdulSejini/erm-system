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
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--background)] px-4 lg:px-6">
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
      <div className="flex items-center gap-2">
        {/* Language Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleLanguage}
          title={language === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
        >
          <Languages className="h-5 w-5" />
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          title={theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
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
            className="relative"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute end-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--status-error)]" />
          </Button>

          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />
              <div className={cn(
                'absolute top-full z-50 mt-2 w-80 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-lg',
                isRTL ? 'left-0' : 'right-0'
              )}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-[var(--foreground)]">
                    {t('notifications.title')}
                  </h3>
                  <button className="text-sm text-[var(--primary)] hover:underline">
                    {t('notifications.markAllRead')}
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="rounded-lg bg-[var(--background-secondary)] p-3">
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      {t('notifications.newRisk')}
                    </p>
                    <p className="mt-1 text-xs text-[var(--foreground-secondary)]">
                      {language === 'ar' ? 'منذ 5 دقائق' : '5 minutes ago'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[var(--background-secondary)] p-3">
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
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 rounded-lg p-2 transition-colors hover:bg-[var(--background-secondary)]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-medium text-white">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-full w-full rounded-full object-cover"
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
                'absolute top-full z-50 mt-2 w-56 rounded-xl border border-[var(--border)] bg-[var(--card)] py-2 shadow-lg',
                isRTL ? 'left-0' : 'right-0'
              )}>
                <div className="border-b border-[var(--border)] px-4 py-3">
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {user.name}
                  </p>
                  <p className="text-xs text-[var(--foreground-secondary)]">
                    {user.role}
                  </p>
                </div>
                <div className="py-1">
                  <button className="flex w-full items-center gap-3 px-4 py-2 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--background-secondary)]">
                    <User className="h-4 w-4" />
                    {t('navigation.profile')}
                  </button>
                  <button className="flex w-full items-center gap-3 px-4 py-2 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--background-secondary)]">
                    <Settings className="h-4 w-4" />
                    {t('navigation.settings')}
                  </button>
                </div>
                <div className="border-t border-[var(--border)] py-1">
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-[var(--status-error)] transition-colors hover:bg-[var(--background-secondary)]"
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
