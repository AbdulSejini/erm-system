'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Check,
  Loader2,
  Key,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MobileMenuButton } from './Sidebar';

interface Notification {
  id: string;
  type: string;
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

// CSS keyframes for bell animation - injected via style tag
const bellAnimationStyles = `
@keyframes bell-ring {
  0% { transform: rotate(0); }
  5% { transform: rotate(15deg); }
  10% { transform: rotate(-15deg); }
  15% { transform: rotate(15deg); }
  20% { transform: rotate(-15deg); }
  25% { transform: rotate(10deg); }
  30% { transform: rotate(-10deg); }
  35% { transform: rotate(5deg); }
  40% { transform: rotate(-5deg); }
  45% { transform: rotate(0); }
  100% { transform: rotate(0); }
}

@keyframes badge-pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes badge-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

@keyframes notification-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
  50% { box-shadow: 0 0 8px 4px rgba(239, 68, 68, 0.3); }
}

.bell-animate {
  animation: bell-ring 2s ease-in-out;
}

.badge-pulse {
  animation: badge-pulse 1.5s ease-in-out infinite;
}

.badge-bounce {
  animation: badge-bounce 0.6s ease-in-out infinite;
}

.notification-glow {
  animation: notification-glow 2s ease-in-out infinite;
}
`;

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [bellAnimating, setBellAnimating] = useState(false);
  const [previousUnreadCount, setPreviousUnreadCount] = useState(0);

  // Inject animation styles
  useEffect(() => {
    const styleId = 'bell-animation-styles';
    if (!document.getElementById(styleId)) {
      const styleTag = document.createElement('style');
      styleTag.id = styleId;
      styleTag.textContent = bellAnimationStyles;
      document.head.appendChild(styleTag);
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoadingNotifications(true);
      const response = await fetch('/api/notifications?limit=10');
      const result = await response.json();
      if (result.success) {
        setNotifications(result.data.notifications);
        const newUnreadCount = result.data.unreadCount;

        // Trigger animation if new notifications arrived
        if (newUnreadCount > previousUnreadCount && previousUnreadCount >= 0) {
          setBellAnimating(true);
          setTimeout(() => setBellAnimating(false), 2000);
        }

        setPreviousUnreadCount(unreadCount);
        setUnreadCount(newUnreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  }, [previousUnreadCount, unreadCount]);

  // Fetch notifications on mount and every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      setMarkingAllRead(true);
      const response = await fetch('/api/notifications', {
        method: 'PATCH'
      });
      const result = await response.json();
      if (result.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    } finally {
      setMarkingAllRead(false);
    }
  };

  // Mark single notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH'
      });
      const result = await response.json();
      if (result.success) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Format time ago
  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return language === 'ar' ? 'الآن' : 'Just now';
    if (diffMins < 60) return language === 'ar' ? `منذ ${diffMins} دقيقة` : `${diffMins} min ago`;
    if (diffHours < 24) return language === 'ar' ? `منذ ${diffHours} ساعة` : `${diffHours} hours ago`;
    return language === 'ar' ? `منذ ${diffDays} يوم` : `${diffDays} days ago`;
  };

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

  // User data from session - استخدام الاسم حسب اللغة
  const getUserName = () => {
    if (language === 'en' && session?.user?.nameEn) {
      return session.user.nameEn;
    }
    return session?.user?.name || (language === 'ar' ? 'مستخدم' : 'User');
  };

  const getRoleName = () => {
    const role = session?.user?.role;
    const roleNames: Record<string, { ar: string; en: string }> = {
      admin: { ar: 'مدير النظام', en: 'System Admin' },
      riskManager: { ar: 'مدير المخاطر', en: 'Risk Manager' },
      riskAnalyst: { ar: 'محلل المخاطر', en: 'Risk Analyst' },
      riskChampion: { ar: 'رائد المخاطر', en: 'Risk Champion' },
      executive: { ar: 'تنفيذي', en: 'Executive' },
      employee: { ar: 'موظف', en: 'Employee' },
    };
    const roleInfo = roleNames[role || ''] || { ar: 'مستخدم', en: 'User' };
    return language === 'ar' ? roleInfo.ar : roleInfo.en;
  };

  const user = {
    name: getUserName(),
    role: getRoleName(),
    email: session?.user?.email || '',
    avatar: null,
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--card)] px-4 lg:px-6 shadow-sm">
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
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications) fetchNotifications();
            }}
            className={cn(
              "relative rounded-xl text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)]",
              unreadCount > 0 && "notification-glow"
            )}
          >
            <Bell className={cn(
              "h-5 w-5 transition-all",
              bellAnimating && "bell-animate"
            )} />
            {unreadCount > 0 && (
              <span className={cn(
                "absolute end-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--status-error)] text-[10px] font-bold text-white ring-2 ring-white",
                bellAnimating ? "badge-bounce" : "badge-pulse"
              )}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>

          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />
              <div className={cn(
                'absolute top-full z-50 mt-2 w-80 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-xl',
                isRTL ? 'left-0' : 'right-0'
              )}>
                <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
                  <h3 className="font-semibold text-[var(--foreground)]">
                    {t('notifications.title')}
                    {unreadCount > 0 && (
                      <span className="ms-2 text-xs font-normal text-[var(--foreground-secondary)]">
                        ({unreadCount} {language === 'ar' ? 'غير مقروءة' : 'unread'})
                      </span>
                    )}
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      disabled={markingAllRead}
                      className="flex items-center gap-1 text-sm text-[var(--primary)] hover:underline font-medium disabled:opacity-50"
                    >
                      {markingAllRead ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                      {t('notifications.markAllRead')}
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {loadingNotifications ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin text-[var(--primary)]" />
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="mx-auto h-10 w-10 text-[var(--foreground-muted)]" />
                      <p className="mt-2 text-sm text-[var(--foreground-secondary)]">
                        {language === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[var(--border)]">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => {
                            if (!notification.isRead) {
                              handleMarkAsRead(notification.id);
                            }
                            if (notification.link) {
                              router.push(notification.link);
                              setShowNotifications(false);
                            }
                          }}
                          className={cn(
                            'p-3 hover:bg-[var(--background-tertiary)] transition-colors cursor-pointer',
                            !notification.isRead && 'bg-[var(--primary-bg)]'
                          )}
                        >
                          <div className="flex items-start gap-2">
                            {!notification.isRead && (
                              <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-[var(--primary)]" />
                            )}
                            <div className={cn(!notification.isRead ? '' : 'ps-4')}>
                              <p className="text-sm font-medium text-[var(--foreground)]">
                                {language === 'ar' ? notification.titleAr : notification.titleEn}
                              </p>
                              {(notification.messageAr || notification.messageEn) && (
                                <p className="mt-0.5 text-xs text-[var(--foreground-secondary)] line-clamp-2">
                                  {language === 'ar' ? notification.messageAr : notification.messageEn}
                                </p>
                              )}
                              <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                                {formatTimeAgo(notification.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                'absolute top-full z-50 mt-2 w-56 rounded-2xl border border-[var(--border)] bg-[var(--card)] py-2 shadow-xl',
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
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      router.push('/settings?tab=profile');
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--background-tertiary)]"
                  >
                    <User className="h-4 w-4 text-[var(--foreground-secondary)]" />
                    {t('navigation.profile')}
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      router.push('/settings?tab=changePassword');
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--background-tertiary)]"
                  >
                    <Key className="h-4 w-4 text-[var(--foreground-secondary)]" />
                    {language === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      router.push('/settings');
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--background-tertiary)]"
                  >
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
