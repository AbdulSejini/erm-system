'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
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

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedUser, setImpersonatedUser] = useState<ImpersonatedUser | null>(null);
  const [originalAdmin, setOriginalAdmin] = useState<OriginalAdmin | null>(null);

  // استعادة حالة الانتحال من localStorage عند التحميل
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const data = JSON.parse(stored);
          // التحقق من أن المستخدم الحالي هو نفس المدير الأصلي
          if (data.originalAdmin && session?.user?.id === data.originalAdmin.id) {
            setIsImpersonating(true);
            setImpersonatedUser(data.impersonatedUser);
            setOriginalAdmin(data.originalAdmin);
          } else {
            // إذا تغير المستخدم، مسح البيانات المخزنة
            localStorage.removeItem(STORAGE_KEY);
          }
        } catch (e) {
          console.error('Error parsing impersonation data:', e);
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    }
  }, [session?.user?.id]);

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
  }, [session?.user?.id, session?.user?.role]);

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
  }, [originalAdmin?.id]);

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
  }, [isImpersonating, impersonatedUser, session?.user]);

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
