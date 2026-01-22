'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Activity,
  Globe,
  FileText,
  LogIn,
  LogOut,
  Plus,
  Edit,
  Trash2,
  Eye,
  Upload,
} from 'lucide-react';

interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string | null;
  oldValues: string | null;
  newValues: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    fullNameEn: string | null;
    role: string;
  };
}

interface AuditLogResponse {
  data: AuditLogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const actionIcons: Record<string, React.ReactNode> = {
  create: <Plus className="h-4 w-4" />,
  update: <Edit className="h-4 w-4" />,
  delete: <Trash2 className="h-4 w-4" />,
  login: <LogIn className="h-4 w-4" />,
  logout: <LogOut className="h-4 w-4" />,
  export: <Download className="h-4 w-4" />,
  import: <Upload className="h-4 w-4" />,
  view: <Eye className="h-4 w-4" />,
};

const actionColors: Record<string, string> = {
  create: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  update: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  delete: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  login: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  logout: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  export: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  import: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  view: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
};

export default function AuditLogTab() {
  const { t, language } = useTranslation();
  const isAr = language === 'ar';

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
      });

      if (actionFilter) params.append('action', actionFilter);
      if (entityFilter) params.append('entity', entityFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/audit-logs?${params}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch audit logs');
      }

      const data: AuditLogResponse = await response.json();
      setLogs(data.data);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, entityFilter, searchQuery]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(isAr ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getActionLabel = (action: string) => {
    const key = `auditLog.actions.${action}` as const;
    return t(key) || action;
  };

  const getEntityLabel = (entity: string) => {
    const key = `auditLog.entities.${entity}` as const;
    return t(key) || entity;
  };

  const handleExport = () => {
    // Export as CSV
    const headers = ['Timestamp', 'User', 'Action', 'Entity', 'Entity ID', 'IP Address'];
    const rows = logs.map(log => [
      formatDate(log.createdAt),
      log.user.email,
      log.action,
      log.entity,
      log.entityId || '-',
      log.ipAddress || '-',
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const actionOptions = [
    { value: '', label: t('auditLog.allActions') },
    { value: 'create', label: t('auditLog.actions.create') },
    { value: 'update', label: t('auditLog.actions.update') },
    { value: 'delete', label: t('auditLog.actions.delete') },
    { value: 'login', label: t('auditLog.actions.login') },
    { value: 'logout', label: t('auditLog.actions.logout') },
    { value: 'export', label: t('auditLog.actions.export') },
    { value: 'import', label: t('auditLog.actions.import') },
  ];

  const entityOptions = [
    { value: '', label: t('auditLog.allEntities') },
    { value: 'risk', label: t('auditLog.entities.risk') },
    { value: 'treatment', label: t('auditLog.entities.treatment') },
    { value: 'incident', label: t('auditLog.entities.incident') },
    { value: 'user', label: t('auditLog.entities.user') },
    { value: 'department', label: t('auditLog.entities.department') },
    { value: 'category', label: t('auditLog.entities.category') },
    { value: 'session', label: t('auditLog.entities.session') },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--foreground)]">
            {t('auditLog.title')}
          </h2>
          <p className="text-sm text-[var(--foreground-secondary)]">
            {t('auditLog.description')}
          </p>
        </div>
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          {t('auditLog.exportLogs')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 sm:flex-row">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] py-2 pe-4 ps-10 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            />
          </div>
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={actionFilter}
            onChange={(value) => {
              setActionFilter(value);
              setPage(1);
            }}
            options={actionOptions}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={entityFilter}
            onChange={(value) => {
              setEntityFilter(value);
              setPage(1);
            }}
            options={entityOptions}
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)]">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent" />
          </div>
        ) : error ? (
          <div className="flex h-64 items-center justify-center text-[var(--status-error)]">
            {error}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 text-[var(--foreground-secondary)]">
            <Activity className="h-12 w-12 opacity-50" />
            <p>{t('auditLog.noLogs')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--background-secondary)]">
                  <th className="px-4 py-3 text-start text-xs font-medium uppercase text-[var(--foreground-secondary)]">
                    {t('auditLog.timestamp')}
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-medium uppercase text-[var(--foreground-secondary)]">
                    {t('auditLog.user')}
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-medium uppercase text-[var(--foreground-secondary)]">
                    {t('auditLog.action')}
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-medium uppercase text-[var(--foreground-secondary)]">
                    {t('auditLog.entity')}
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-medium uppercase text-[var(--foreground-secondary)]">
                    {t('auditLog.details')}
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-medium uppercase text-[var(--foreground-secondary)]">
                    {t('auditLog.ipAddress')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="transition-colors hover:bg-[var(--background-secondary)]"
                  >
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                        <Clock className="h-4 w-4 text-[var(--foreground-muted)]" />
                        {formatDate(log.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-medium text-white">
                          {(isAr ? log.user.fullName : log.user.fullNameEn || log.user.fullName).charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--foreground)]">
                            {isAr ? log.user.fullName : log.user.fullNameEn || log.user.fullName}
                          </p>
                          <p className="text-xs text-[var(--foreground-secondary)]">
                            {log.user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`gap-1 ${actionColors[log.action] || ''}`}>
                        {actionIcons[log.action]}
                        {getActionLabel(log.action)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                        <FileText className="h-4 w-4 text-[var(--foreground-muted)]" />
                        {getEntityLabel(log.entity)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-[var(--foreground-secondary)]">
                        {log.entityId || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-[var(--foreground-secondary)]">
                        <Globe className="h-4 w-4" />
                        {log.ipAddress || '-'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && logs.length > 0 && (
          <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-3">
            <p className="text-sm text-[var(--foreground-secondary)]">
              {isAr
                ? `إجمالي ${total} سجل`
                : `Total ${total} entries`}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                {isAr ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
              <span className="text-sm text-[var(--foreground)]">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                {isAr ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
