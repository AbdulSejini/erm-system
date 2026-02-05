import prisma from './prisma';

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'soft_delete'
  | 'login'
  | 'logout'
  | 'export'
  | 'import'
  | 'view'
  | 'impersonate_start'
  | 'impersonate_end';

export type AuditEntity =
  | 'risk'
  | 'treatment'
  | 'incident'
  | 'user'
  | 'department'
  | 'category'
  | 'settings'
  | 'session';

interface AuditLogData {
  userId: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId || null,
        oldValues: data.oldValues ? JSON.stringify(data.oldValues) : null,
        newValues: data.newValues ? JSON.stringify(data.newValues) : null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

// Helper to get client info from request headers
export function getClientInfo(request: Request): { ipAddress: string; userAgent: string } {
  const forwarded = request.headers.get('x-forwarded-for');
  const ipAddress = forwarded?.split(',')[0] || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  return { ipAddress, userAgent };
}

// Helper to get action name in Arabic/English
export function getActionLabel(action: string, language: 'ar' | 'en'): string {
  const labels: Record<string, { ar: string; en: string }> = {
    create: { ar: 'إنشاء', en: 'Create' },
    update: { ar: 'تحديث', en: 'Update' },
    delete: { ar: 'حذف', en: 'Delete' },
    login: { ar: 'تسجيل دخول', en: 'Login' },
    logout: { ar: 'تسجيل خروج', en: 'Logout' },
    export: { ar: 'تصدير', en: 'Export' },
    import: { ar: 'استيراد', en: 'Import' },
    view: { ar: 'عرض', en: 'View' },
  };

  return labels[action]?.[language] || action;
}

// Helper to get entity name in Arabic/English
export function getEntityLabel(entity: string, language: 'ar' | 'en'): string {
  const labels: Record<string, { ar: string; en: string }> = {
    risk: { ar: 'خطر', en: 'Risk' },
    treatment: { ar: 'معالجة', en: 'Treatment' },
    incident: { ar: 'حادثة', en: 'Incident' },
    user: { ar: 'مستخدم', en: 'User' },
    department: { ar: 'إدارة', en: 'Department' },
    category: { ar: 'فئة', en: 'Category' },
    settings: { ar: 'إعدادات', en: 'Settings' },
    session: { ar: 'جلسة', en: 'Session' },
  };

  return labels[entity]?.[language] || entity;
}
