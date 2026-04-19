'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Search, Shield, Loader2, Check, X, RotateCcw, Lock,
  Building2, Mail, Info, AlertCircle, Save,
} from 'lucide-react';
import {
  MODULES, MODULE_LABELS, DEFAULT_ROLE_PERMISSIONS, RESTRICTED_MODULES,
  type Module,
} from '@/lib/permissions';

interface User {
  id: string;
  email: string;
  fullName: string;
  fullNameEn: string | null;
  role: string;
  status: string;
  department: { id: string; nameAr: string; nameEn: string } | null;
}

interface UserPermissions {
  user: User;
  permissions: Record<Module, { access: boolean; source: 'default' | 'custom' | 'restricted' }>;
  hasCustomOverrides: boolean;
}

const ROLE_LABELS: Record<string, { ar: string; en: string; color: string }> = {
  admin: { ar: 'مدير النظام', en: 'System Admin', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
  riskManager: { ar: 'مدير المخاطر', en: 'Risk Manager', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
  riskAnalyst: { ar: 'محلل المخاطر', en: 'Risk Analyst', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  riskChampion: { ar: 'رائد المخاطر', en: 'Risk Champion', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  executive: { ar: 'تنفيذي', en: 'Executive', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300' },
  employee: { ar: 'موظف', en: 'Employee', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300' },
};

export default function PermissionsTab() {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userPerms, setUserPerms] = useState<UserPermissions | null>(null);
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [saving, setSaving] = useState(false);
  const [showInfo, setShowInfo] = useState(true);

  // Local state for unsaved toggle changes
  const [draftPerms, setDraftPerms] = useState<Partial<Record<Module, boolean>>>({});
  const [hasChanges, setHasChanges] = useState(false);

  /* ===== FETCH USERS ===== */
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users?status=active');
      const data = await res.json();
      if (data.success) {
        setUsers(data.data || data.users || []);
      }
    } catch {
      /* */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  /* ===== FETCH USER PERMISSIONS ===== */
  const fetchUserPerms = useCallback(async (userId: string) => {
    try {
      setLoadingPerms(true);
      const res = await fetch(`/api/users/${userId}/permissions`);
      const data = await res.json();
      if (data.success) {
        setUserPerms(data.data);
        setDraftPerms({});
        setHasChanges(false);
      }
    } catch {
      /* */
    } finally {
      setLoadingPerms(false);
    }
  }, []);

  useEffect(() => {
    if (selectedUser) fetchUserPerms(selectedUser.id);
    else { setUserPerms(null); setDraftPerms({}); setHasChanges(false); }
  }, [selectedUser, fetchUserPerms]);

  /* ===== TOGGLE PERMISSION ===== */
  const togglePermission = (mod: Module) => {
    if (!userPerms) return;
    if (userPerms.permissions[mod].source === 'restricted') return;
    if (userPerms.user.role === 'admin') return;

    const current = draftPerms[mod] !== undefined ? draftPerms[mod] : userPerms.permissions[mod].access;
    const newVal = !current;
    const defaultVal = DEFAULT_ROLE_PERMISSIONS[userPerms.user.role]?.includes(mod) ?? false;

    const newDraft = { ...draftPerms };
    // If the new value equals the role default, remove the override (back to default)
    if (newVal === defaultVal) {
      delete newDraft[mod];
    } else {
      newDraft[mod] = newVal;
    }
    setDraftPerms(newDraft);
    setHasChanges(Object.keys(newDraft).length > 0 || userPerms.hasCustomOverrides);
  };

  /* ===== SAVE CHANGES ===== */
  const savePermissions = async () => {
    if (!selectedUser || !userPerms) return;
    setSaving(true);
    try {
      // Merge existing customs with draft changes
      const existing: Record<string, boolean> = {};
      for (const m of MODULES) {
        if (userPerms.permissions[m].source === 'custom') {
          existing[m] = userPerms.permissions[m].access;
        }
      }
      const merged = { ...existing, ...draftPerms };

      // Remove keys that match defaults
      for (const m of MODULES) {
        const defaultVal = DEFAULT_ROLE_PERMISSIONS[userPerms.user.role]?.includes(m) ?? false;
        if (merged[m] === defaultVal) {
          delete merged[m];
        }
      }

      const res = await fetch(`/api/users/${selectedUser.id}/permissions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customPermissions: merged }),
      });
      if ((await res.json()).success) {
        await fetchUserPerms(selectedUser.id);
      }
    } catch {
      /* */
    } finally {
      setSaving(false);
    }
  };

  /* ===== RESET TO DEFAULTS ===== */
  const resetToDefaults = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${selectedUser.id}/permissions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset: true }),
      });
      if ((await res.json()).success) {
        await fetchUserPerms(selectedUser.id);
      }
    } catch {
      /* */
    } finally {
      setSaving(false);
    }
  };

  /* ===== FILTERS ===== */
  const filteredUsers = users.filter(u => {
    const matchSearch = !search ||
      u.fullName.includes(search) ||
      (u.fullNameEn?.toLowerCase() || '').includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  /* ===== HELPERS ===== */
  const effectivePermission = (mod: Module): { access: boolean; source: 'default' | 'custom' | 'restricted' } => {
    if (!userPerms) return { access: false, source: 'default' };
    if (draftPerms[mod] !== undefined) {
      return { access: draftPerms[mod]!, source: 'custom' };
    }
    return userPerms.permissions[mod];
  };

  const roleLabel = (r: string) => ROLE_LABELS[r]?.[isAr ? 'ar' : 'en'] || r;
  const roleColor = (r: string) => ROLE_LABELS[r]?.color || 'bg-gray-100 text-gray-800';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#F39200]" />
          {isAr ? 'إدارة الصلاحيات' : 'Permission Management'}
        </h2>
        <p className="text-sm text-[var(--foreground-secondary)] mt-1">
          {isAr
            ? 'تحكم في صلاحيات كل مستخدم على مستوى الوحدات (الأقسام الرئيسية)'
            : 'Control per-user access to modules (top-level sections)'}
        </p>
      </div>

      {/* Info card — role defaults explanation */}
      {showInfo && (
        <Card className="p-4 bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-semibold mb-2">{isAr ? 'كيف تعمل الصلاحيات؟' : 'How permissions work'}</p>
              <ul className="space-y-1 text-[var(--foreground-secondary)]">
                <li>• {isAr ? 'كل دور (role) له صلاحيات افتراضية على الوحدات.' : 'Each role has default module access.'}</li>
                <li>• {isAr ? 'تقدر تضيف أو تسحب صلاحيات فردية لأي مستخدم.' : 'You can grant or revoke individual permissions per user.'}</li>
                <li>• {isAr ? 'الصلاحيات السياقية (المسؤول عن خطة، المكلف بمهمة) تعمل تلقائياً ولا تحتاج إعدادات.' : 'Contextual access (plan responsible, task assignee) is automatic and needs no setup.'}</li>
                <li>• {isAr ? 'مدير النظام (admin) له صلاحيات كاملة دائماً ولا يمكن تعديلها.' : 'System Admin has full access always and cannot be modified.'}</li>
              </ul>
            </div>
            <button onClick={() => setShowInfo(false)} className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)]">
              <X className="w-4 h-4" />
            </button>
          </div>
        </Card>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Users list */}
        <Card className="p-4 lg:col-span-1">
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-secondary)]" />
              <input
                type="text"
                placeholder={isAr ? 'بحث عن مستخدم...' : 'Search user...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full ps-10 pe-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
              />
            </div>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
            >
              <option value="all">{isAr ? 'جميع الأدوار' : 'All roles'}</option>
              {Object.entries(ROLE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v[isAr ? 'ar' : 'en']}</option>
              ))}
            </select>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#F39200]" />
              </div>
            ) : (
              <div className="space-y-1 max-h-[500px] overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <p className="text-sm text-[var(--foreground-secondary)] text-center py-4">
                    {isAr ? 'لا يوجد مستخدمون' : 'No users found'}
                  </p>
                ) : filteredUsers.map(u => (
                  <button
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className={`w-full text-start p-2.5 rounded-lg transition-colors ${
                      selectedUser?.id === u.id
                        ? 'bg-[#F39200]/10 border border-[#F39200]/30'
                        : 'hover:bg-[var(--background-secondary)] border border-transparent'
                    }`}
                  >
                    <p className="text-sm font-medium truncate">
                      {isAr ? u.fullName : u.fullNameEn || u.fullName}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${roleColor(u.role)}`}>
                        {roleLabel(u.role)}
                      </span>
                      {u.department && (
                        <span className="text-[10px] text-[var(--foreground-secondary)] flex items-center gap-0.5 truncate">
                          <Building2 className="w-2.5 h-2.5" />
                          {isAr ? u.department.nameAr : u.department.nameEn}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Right: Permissions matrix */}
        <div className="lg:col-span-2">
          {!selectedUser ? (
            <Card className="p-12 text-center">
              <Lock className="w-10 h-10 text-[var(--foreground-secondary)] mx-auto mb-3 opacity-30" />
              <p className="text-[var(--foreground-secondary)]">
                {isAr ? 'اختر مستخدماً من القائمة لعرض صلاحياته' : 'Select a user to view their permissions'}
              </p>
            </Card>
          ) : loadingPerms || !userPerms ? (
            <Card className="p-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#F39200]" />
            </Card>
          ) : (
            <Card className="p-5">
              {/* User summary */}
              <div className="flex items-start justify-between mb-5 pb-4 border-b border-[var(--border)]">
                <div>
                  <h3 className="font-semibold">
                    {isAr ? userPerms.user.fullName : userPerms.user.fullNameEn || userPerms.user.fullName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-[var(--foreground-secondary)]">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{userPerms.user.email}</span>
                    {userPerms.user.department && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {isAr ? userPerms.user.department.nameAr : userPerms.user.department.nameEn}
                      </span>
                    )}
                  </div>
                  <div className="mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${roleColor(userPerms.user.role)}`}>
                      {roleLabel(userPerms.user.role)}
                    </span>
                  </div>
                </div>
                {userPerms.user.role !== 'admin' && (userPerms.hasCustomOverrides || hasChanges) && (
                  <Button size="sm" variant="outline" onClick={resetToDefaults} disabled={saving}>
                    <RotateCcw className="w-3.5 h-3.5" />
                    {isAr ? 'إعادة للافتراضي' : 'Reset to default'}
                  </Button>
                )}
              </div>

              {/* Admin warning */}
              {userPerms.user.role === 'admin' && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 mb-4 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-900 dark:text-amber-100">
                    {isAr
                      ? 'مدير النظام له صلاحيات كاملة دائماً ولا يمكن تعديلها'
                      : 'System Admin has full permissions always and cannot be modified'}
                  </p>
                </div>
              )}

              {/* Modules grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold">{isAr ? 'الوحدات الرئيسية' : 'Modules'}</h4>
                  <div className="flex gap-2 text-[10px] text-[var(--foreground-secondary)]">
                    <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded-full bg-green-500" />{isAr ? 'افتراضي' : 'default'}</span>
                    <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded-full bg-orange-500" />{isAr ? 'مخصص' : 'custom'}</span>
                    <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded-full bg-red-500" />{isAr ? 'مقيد' : 'restricted'}</span>
                  </div>
                </div>

                {MODULES.map(mod => {
                  const eff = effectivePermission(mod);
                  const isRestricted = eff.source === 'restricted';
                  const isChanged = draftPerms[mod] !== undefined;
                  const label = MODULE_LABELS[mod][isAr ? 'ar' : 'en'];

                  return (
                    <div
                      key={mod}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        isRestricted
                          ? 'bg-red-50/30 dark:bg-red-900/10 border-red-200 dark:border-red-800 opacity-60'
                          : isChanged
                          ? 'bg-orange-50/50 dark:bg-orange-900/10 border-orange-300 dark:border-orange-700'
                          : eff.source === 'custom'
                          ? 'bg-orange-50/30 dark:bg-orange-900/5 border-orange-200 dark:border-orange-900'
                          : 'bg-[var(--background-secondary)]/30 border-[var(--border)]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${
                          isRestricted ? 'bg-red-500' :
                          eff.source === 'custom' ? 'bg-orange-500' :
                          'bg-green-500'
                        }`} />
                        <div>
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-[10px] text-[var(--foreground-secondary)]">
                            {isRestricted
                              ? (isAr ? 'مقتصر على مدير النظام ومدير المخاطر' : 'Restricted to admin/risk manager only')
                              : isChanged
                              ? (isAr ? 'تغيير غير محفوظ' : 'Unsaved change')
                              : eff.source === 'custom'
                              ? (isAr ? 'مخصص لهذا المستخدم' : 'Custom for this user')
                              : (isAr ? 'افتراضي حسب الدور' : 'Role default')}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => togglePermission(mod)}
                        disabled={isRestricted || userPerms.user.role === 'admin'}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
                          eff.access ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                        } ${isRestricted || userPerms.user.role === 'admin' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <span className={`inline-block w-4 h-4 rounded-full bg-white shadow transition-transform ${
                          eff.access ? (isAr ? '-translate-x-3' : 'translate-x-6') : (isAr ? '-translate-x-1' : 'translate-x-1')
                        }`} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Save bar */}
              {hasChanges && userPerms.user.role !== 'admin' && (
                <div className="mt-5 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    <span>{isAr ? 'لديك تعديلات غير محفوظة' : 'You have unsaved changes'}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setDraftPerms({}); setHasChanges(false); }}>
                      {isAr ? 'إلغاء' : 'Cancel'}
                    </Button>
                    <Button size="sm" onClick={savePermissions} disabled={saving}>
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      {isAr ? 'حفظ' : 'Save'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Contextual access note */}
              <div className="mt-5 p-3 rounded-lg bg-[var(--background-secondary)]/50 border border-[var(--border)] text-xs text-[var(--foreground-secondary)]">
                <p className="font-semibold mb-1 text-[var(--foreground)]">
                  {isAr ? 'صلاحيات تلقائية (تعمل دائماً):' : 'Automatic contextual access (always active):'}
                </p>
                <ul className="space-y-0.5">
                  <li>✓ {isAr ? 'المسؤول عن خطة معالجة يشوف الخطة + أعضاء نفس الإدارة' : 'Plan responsible sees the plan + same-department members'}</li>
                  <li>✓ {isAr ? 'المكلف بمهمة يشوف الخطة + بقية المكلفين والمتابعين' : 'Task assignee sees the plan + other assignees'}</li>
                  <li>✓ {isAr ? 'مالك الخطر يشوف خطره ومعالجاته' : 'Risk owner sees their risks and treatments'}</li>
                  <li>✓ {isAr ? 'رائد المخاطر يشوف مخاطر إدارته' : 'Risk champion sees their department\'s risks'}</li>
                </ul>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Role defaults reference */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">{isAr ? 'الصلاحيات الافتراضية حسب الدور' : 'Default permissions by role'}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-start p-2 font-semibold">{isAr ? 'الدور' : 'Role'}</th>
                {MODULES.map(m => (
                  <th key={m} className="p-1 font-medium text-[9px] text-center w-12">
                    {MODULE_LABELS[m][isAr ? 'ar' : 'en'].split(' ')[0]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.keys(DEFAULT_ROLE_PERMISSIONS).map(role => (
                <tr key={role} className="border-b border-[var(--border)]/50 hover:bg-[var(--background-secondary)]/30">
                  <td className="p-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded ${roleColor(role)}`}>
                      {roleLabel(role)}
                    </span>
                  </td>
                  {MODULES.map(m => {
                    const isRestricted = RESTRICTED_MODULES.includes(m) && role !== 'admin' && role !== 'riskManager';
                    const hasAccess = !isRestricted && DEFAULT_ROLE_PERMISSIONS[role]?.includes(m);
                    return (
                      <td key={m} className="p-1 text-center">
                        {isRestricted ? (
                          <Lock className="w-3 h-3 text-red-400 mx-auto" />
                        ) : hasAccess ? (
                          <Check className="w-3 h-3 text-green-500 mx-auto" />
                        ) : (
                          <X className="w-3 h-3 text-gray-300 mx-auto" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
