'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface ImpersonatedUser {
  id: string;
  email: string;
  name: string;
  nameEn: string | null;
  role: string;
  departmentId: string | null;
  department: {
    nameAr: string;
    nameEn: string;
  } | null;
}

interface OriginalAdmin {
  id: string;
  name: string;
}

interface ImpersonationContextType {
  isImpersonating: boolean;
  impersonatedUser: ImpersonatedUser | null;
  originalAdmin: OriginalAdmin | null;
  startImpersonation: (targetUserId: string) => Promise<boolean>;
  stopImpersonation: () => void;
  // الدالة للحصول على المستخدم الفعلي (المنتحل أو الأصلي)
  getEffectiveUser: () => {
    id: string;
    role: string;
    name: string;
    email?: string;
  } | null;
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

const STORAGE_KEY = 'erm_impersonation';

interface PersistedImpersonation {
  originalAdmin: OriginalAdmin;
  impersonatedUser: ImpersonatedUser;
}

// Read persisted impersonation state once during SSR-safe initialization.
function readPersisted(): PersistedImpersonation | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as PersistedImpersonation;
  } catch {
    return null;
  }
}

function clearPersisted() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();

  // Load persisted state lazily (runs once).
  const [persisted] = useState<PersistedImpersonation | null>(readPersisted);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedUser, setImpersonatedUser] = useState<ImpersonatedUser | null>(null);
  const [originalAdmin, setOriginalAdmin] = useState<OriginalAdmin | null>(null);
  const [hasSynced, setHasSynced] = useState(false);

  // Sync persisted state to React once the session is resolved — runs during
  // render using a guarded one-shot pattern (avoids setState-in-effect lint).
  if (!hasSynced && session?.user?.id && persisted?.originalAdmin) {
    setHasSynced(true);
    if (session.user.id === persisted.originalAdmin.id) {
      setIsImpersonating(true);
      setImpersonatedUser(persisted.impersonatedUser);
      setOriginalAdmin(persisted.originalAdmin);
    } else {
      // Different user logged in — discard stale impersonation
      clearPersisted();
    }
  }

  // بدء انتحال صلاحيات مستخدم
  const startImpersonation = useCallback(async (targetUserId: string): Promise<boolean> => {
    if (!session?.user?.id || session.user.role !== 'admin') {
      console.error('Only admin can impersonate');
      return false;
    }

    try {
      const response = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId }),
      });

      const data = await response.json();

      if (data.success) {
        const impersonationData = {
          originalAdmin: data.data.originalAdmin,
          impersonatedUser: data.data.impersonatedUser,
        };

        // حفظ في الحالة
        setIsImpersonating(true);
        setOriginalAdmin(data.data.originalAdmin);
        setImpersonatedUser(data.data.impersonatedUser);

        // حفظ في localStorage للاستمرارية
        localStorage.setItem(STORAGE_KEY, JSON.stringify(impersonationData));

        return true;
      } else {
        console.error('Impersonation failed:', data.error);
        return false;
      }
    } catch (error) {
      console.error('Error starting impersonation:', error);
      return false;
    }
  }, [session]);

  // إنهاء انتحال الصلاحيات
  const stopImpersonation = useCallback(async () => {
    try {
      // إرسال طلب لتسجيل الإنهاء
      await fetch('/api/admin/impersonate', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalAdminId: originalAdmin?.id }),
      });
    } catch (error) {
      console.error('Error logging impersonation end:', error);
    }

    // مسح الحالة
    setIsImpersonating(false);
    setImpersonatedUser(null);
    setOriginalAdmin(null);

    // مسح من localStorage
    localStorage.removeItem(STORAGE_KEY);

    // إعادة تحميل الصفحة للتأكد من تطبيق الصلاحيات الصحيحة
    window.location.reload();
  }, [originalAdmin]);

  // الحصول على المستخدم الفعلي
  const getEffectiveUser = useCallback(() => {
    if (isImpersonating && impersonatedUser) {
      return {
        id: impersonatedUser.id,
        role: impersonatedUser.role,
        name: impersonatedUser.name,
        email: impersonatedUser.email,
      };
    }

    if (session?.user) {
      return {
        id: session.user.id,
        role: session.user.role,
        name: session.user.name || '',
        email: session.user.email || '',
      };
    }

    return null;
  }, [isImpersonating, impersonatedUser, session]);

  return (
    <ImpersonationContext.Provider
      value={{
        isImpersonating,
        impersonatedUser,
        originalAdmin,
        startImpersonation,
        stopImpersonation,
        getEffectiveUser,
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  const context = useContext(ImpersonationContext);
  if (context === undefined) {
    throw new Error('useImpersonation must be used within an ImpersonationProvider');
  }
  return context;
}
