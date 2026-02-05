'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslation, useLanguage } from '@/contexts/LanguageContext';
import { useImpersonation } from '@/contexts/ImpersonationContext';
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
  Users,
  UserCog,
  X,
  Search,
  Shield,
  Eye,
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

@keyframes impersonation-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.impersonation-indicator {
  animation: impersonation-pulse 2s ease-in-out infinite;
}
`;

interface HeaderProps {
  onMobileMenuClick: () => void;
}

// Interface for user list
interface UserOption {
  id: string;
  fullName: string;
  fullNameEn: string | null;
  email: string;
  role: string;
  department: {
    nameAr: string;
    nameEn: string;
  } | null;
}

export function Header({ onMobileMenuClick }: HeaderProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { t, isRTL } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { isImpersonating, impersonatedUser, originalAdmin, startImpersonation, stopImpersonation } = useImpersonation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [bellAnimating, setBellAnimating] = useState(false);
  const [previousUnreadCount, setPreviousUnreadCount] = useState(0);

  // Impersonation states
  const [showImpersonateModal, setShowImpersonateModal] = useState(false);
  const [usersList, setUsersList] = useState<UserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [impersonating, setImpersonating] = useState(false);

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

  // Fetch users for impersonation
  const fetchUsersForImpersonation = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const response = await fetch('/api/users');
      const result = await response.json();
      if (result.success || result.data) {
        // Filter out current admin
        const users = (result.data || []).filter(
          (u: UserOption) => u.id !== session?.user?.id
        );
        setUsersList(users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoadingUsers(false);
    }
  }, [session?.user?.id]);

  // Handle impersonation
  const handleStartImpersonation = async (userId: string) => {
    setImpersonating(true);
    const success = await startImpersonation(userId);
    setImpersonating(false);
    if (success) {
      setShowImpersonateModal(false);
      // Reload to apply new permissions
      window.location.reload();
    }
  };

  // Filter users based on search
  const filteredUsers = usersList.filter((user) => {
    const query = userSearchQuery.toLowerCase();
    return (
      user.fullName.toLowerCase().includes(query) ||
      (user.fullNameEn && user.fullNameEn.toLowerCase().includes(query)) ||
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
  });

  // Get role label for display
  const getRoleLabelForUser = (role: string) => {
    const roleNames: Record<string, { ar: string; en: string }> = {
      admin: { ar: 'مدير النظام', en: 'System Admin' },
      riskManager: { ar: 'مدير المخاطر', en: 'Risk Manager' },
      riskAnalyst: { ar: 'محلل المخاطر', en: 'Risk Analyst' },
      riskChampion: { ar: 'رائد المخاطر', en: 'Risk Champion' },
      executive: { ar: 'تنفيذي', en: 'Executive' },
      employee: { ar: 'موظف', en: 'Employee' },
    };
    const roleInfo = roleNames[role] || { ar: role, en: role };
    return language === 'ar' ? roleInfo.ar : roleInfo.en;
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
  // إذا كان في وضع الانتحال، استخدم بيانات المستخدم المنتحل
  const getUserName = () => {
    if (isImpersonating && impersonatedUser) {
      if (language === 'en' && impersonatedUser.nameEn) {
        return impersonatedUser.nameEn;
      }
      return impersonatedUser.name;
    }
    if (language === 'en' && session?.user?.nameEn) {
      return session.user.nameEn;
    }
    return session?.user?.name || (language === 'ar' ? 'مستخدم' : 'User');
  };

  const getRoleName = () => {
    const role = isImpersonating && impersonatedUser
      ? impersonatedUser.role
      : session?.user?.role;
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
    email: isImpersonating && impersonatedUser ? impersonatedUser.email : (session?.user?.email || ''),
    avatar: null,
  };

  // Check if current user is admin (original session, not impersonated)
  const isAdmin = session?.user?.role === 'admin';

  return (
    <>
      {/* Impersonation Banner */}
      {isImpersonating && impersonatedUser && (
        <div className="sticky top-0 z-50 flex items-center justify-between bg-amber-500 px-4 py-2 text-white shadow-md impersonation-indicator">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            <span className="text-sm font-medium">
              {language === 'ar' ? (
                <>
                  أنت تشاهد النظام كـ <strong>{impersonatedUser.name}</strong> ({getRoleLabelForUser(impersonatedUser.role)})
                </>
              ) : (
                <>
                  Viewing as <strong>{impersonatedUser.nameEn || impersonatedUser.name}</strong> ({getRoleLabelForUser(impersonatedUser.role)})
                </>
              )}
            </span>
          </div>
          <button
            onClick={stopImpersonation}
            className="flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-white/30"
          >
            <X className="h-4 w-4" />
            {language === 'ar' ? 'إنهاء المعاينة' : 'Exit View'}
          </button>
        </div>
      )}

      <header className={cn(
        "sticky z-30 flex h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--card)] px-4 lg:px-6 shadow-sm",
        isImpersonating ? "top-[44px]" : "top-0"
      )}>
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
        {/* Impersonate User Button - Only for Admin */}
        {isAdmin && !isImpersonating && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setShowImpersonateModal(true);
              fetchUsersForImpersonation();
            }}
            title={language === 'ar' ? 'عرض كمستخدم آخر' : 'View as another user'}
            className="rounded-xl text-[var(--foreground-secondary)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)]"
          >
            <UserCog className="h-5 w-5" />
          </Button>
        )}

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

      {/* Impersonation Modal */}
      {showImpersonateModal && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            onClick={() => setShowImpersonateModal(false)}
          />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-2xl bg-[var(--card)] shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                    <Eye className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--foreground)]">
                      {language === 'ar' ? 'عرض كمستخدم آخر' : 'View as Another User'}
                    </h2>
                    <p className="text-xs text-[var(--foreground-secondary)]">
                      {language === 'ar'
                        ? 'اختر مستخدماً لمعاينة صلاحياته'
                        : 'Select a user to view their permissions'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowImpersonateModal(false)}
                  className="rounded-lg p-2 text-[var(--foreground-secondary)] hover:bg-[var(--background-tertiary)] hover:text-[var(--foreground)]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Search */}
              <div className="border-b border-[var(--border)] p-4">
                <div className="relative">
                  <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
                  <input
                    type="text"
                    placeholder={language === 'ar' ? 'البحث عن مستخدم...' : 'Search users...'}
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] py-2.5 pe-4 ps-10 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                  />
                </div>
              </div>

              {/* Users List */}
              <div className="max-h-80 overflow-y-auto p-2">
                {loadingUsers ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--primary)]" />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-8 text-center">
                    <Users className="mx-auto h-10 w-10 text-[var(--foreground-muted)]" />
                    <p className="mt-2 text-sm text-[var(--foreground-secondary)]">
                      {language === 'ar' ? 'لا يوجد مستخدمين' : 'No users found'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredUsers.map((targetUser) => (
                      <button
                        key={targetUser.id}
                        onClick={() => handleStartImpersonation(targetUser.id)}
                        disabled={impersonating}
                        className="flex w-full items-center gap-3 rounded-xl p-3 text-start transition-colors hover:bg-[var(--background-tertiary)] disabled:opacity-50"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] text-sm font-semibold text-white">
                          {targetUser.fullName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--foreground)] truncate">
                            {language === 'ar'
                              ? targetUser.fullName
                              : (targetUser.fullNameEn || targetUser.fullName)}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-[var(--foreground-secondary)]">
                            <span className="flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              {getRoleLabelForUser(targetUser.role)}
                            </span>
                            {targetUser.department && (
                              <>
                                <span>•</span>
                                <span className="truncate">
                                  {language === 'ar'
                                    ? targetUser.department.nameAr
                                    : targetUser.department.nameEn}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <Eye className="h-4 w-4 text-[var(--foreground-muted)]" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-[var(--border)] p-4">
                <p className="text-xs text-[var(--foreground-muted)] text-center">
                  {language === 'ar'
                    ? 'ملاحظة: ستتمكن من رؤية النظام بصلاحيات المستخدم المختار دون التأثير على بياناته'
                    : 'Note: You will view the system with the selected user\'s permissions without affecting their data'}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
