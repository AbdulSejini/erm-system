'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import {
  ClipboardCheck,
  Plus,
  Search,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Building2,
  Calendar,
  Eye,
  Trash2,
  Filter,
  BarChart3,
  ChevronDown,
  ChevronUp,
  XCircle,
} from 'lucide-react';

interface AuditReport {
  id: string;
  reportNumber: string;
  titleAr: string;
  titleEn: string | null;
  departmentId: string | null;
  auditorName: string | null;
  auditDateFrom: string | null;
  auditDateTo: string | null;
  reportDate: string | null;
  summaryAr: string | null;
  summaryEn: string | null;
  status: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  createdAt: string;
  department: { id: string; nameAr: string; nameEn: string } | null;
  createdBy: { id: string; fullName: string; fullNameEn: string | null };
  findings: Array<{
    id: string;
    status: string;
    severity: string;
    actions: Array<{ id: string; status: string }>;
  }>;
}

interface Stats {
  totalReports: number;
  openReports: number;
  inProgressReports: number;
  closedReports: number;
  totalFindings: number;
  openFindings: number;
  criticalFindings: number;
  totalActions: number;
  completedActions: number;
}

interface Department {
  id: string;
  nameAr: string;
  nameEn: string;
}

export default function AuditPage() {
  const { t, language } = useTranslation();
  const isAr = language === 'ar';
  const { data: session } = useSession();
  const router = useRouter();

  const [reports, setReports] = useState<AuditReport[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState('all');

  // New report form
  const [newReport, setNewReport] = useState({
    titleAr: '',
    titleEn: '',
    departmentId: '',
    auditorName: '',
    auditDateFrom: '',
    auditDateTo: '',
    reportDate: '',
    summaryAr: '',
    summaryEn: '',
  });

  const userRole = (session?.user as any)?.role || '';
  const canAccess = userRole === 'admin' || userRole === 'riskManager';

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/audit-reports');
      const data = await res.json();
      if (data.success) {
        setReports(data.data);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching audit reports:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch('/api/departments');
      const data = await res.json();
      if (data.success) {
        setDepartments(data.data);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (canAccess) {
      fetchReports();
      fetchDepartments();
    }
  }, [canAccess, fetchReports, fetchDepartments]);

  const handleCreate = async () => {
    if (!newReport.titleAr.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/audit-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newReport,
          departmentId: newReport.departmentId || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setNewReport({
          titleAr: '',
          titleEn: '',
          departmentId: '',
          auditorName: '',
          auditDateFrom: '',
          auditDateTo: '',
          reportDate: '',
          summaryAr: '',
          summaryEn: '',
        });
        fetchReports();
      }
    } catch (error) {
      console.error('Error creating report:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/audit-reports/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setShowDeleteModal(null);
        fetchReports();
      }
    } catch (error) {
      console.error('Error deleting report:', error);
    } finally {
      setDeleting(false);
    }
  };

  // Filter reports
  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      !searchQuery ||
      r.titleAr.includes(searchQuery) ||
      r.titleEn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reportNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.auditorName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesDept = departmentFilter === 'all' || r.departmentId === departmentFilter;
    return matchesSearch && matchesStatus && matchesDept;
  });

  if (!canAccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 text-center max-w-md">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">
            {isAr ? 'غير مصرح بالوصول' : 'Access Denied'}
          </h2>
          <p className="text-[var(--foreground-secondary)]">
            {isAr
              ? 'هذا القسم متاح فقط لمدير النظام ومدير المخاطر'
              : 'This section is accessible only to System Admin and Risk Manager'}
          </p>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return (
          <Badge variant="warning">
            <Clock className="w-3 h-3" />
            {isAr ? 'مفتوح' : 'Open'}
          </Badge>
        );
      case 'inProgress':
        return (
          <Badge variant="info">
            <Loader2 className="w-3 h-3" />
            {isAr ? 'قيد المتابعة' : 'In Progress'}
          </Badge>
        );
      case 'closed':
        return (
          <Badge variant="success">
            <CheckCircle2 className="w-3 h-3" />
            {isAr ? 'مغلق' : 'Closed'}
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="w-7 h-7 text-[#F39200]" />
            {isAr ? 'متابعة المراجعة الداخلية' : 'Internal Audit Follow-up'}
          </h1>
          <p className="text-sm text-[var(--foreground-secondary)] mt-1">
            {isAr
              ? 'متابعة تقارير المراجعة الداخلية والملاحظات والإجراءات التصحيحية'
              : 'Track internal audit reports, findings, and corrective actions'}
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4" />
          {isAr ? 'تقرير جديد' : 'New Report'}
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalReports}</p>
                <p className="text-xs text-[var(--foreground-secondary)]">
                  {isAr ? 'إجمالي التقارير' : 'Total Reports'}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.openFindings}</p>
                <p className="text-xs text-[var(--foreground-secondary)]">
                  {isAr ? 'ملاحظات مفتوحة' : 'Open Findings'}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.criticalFindings}</p>
                <p className="text-xs text-[var(--foreground-secondary)]">
                  {isAr ? 'ملاحظات حرجة' : 'Critical Findings'}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                <BarChart3 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats.totalActions > 0
                    ? Math.round((stats.completedActions / stats.totalActions) * 100)
                    : 0}%
                </p>
                <p className="text-xs text-[var(--foreground-secondary)]">
                  {isAr ? 'نسبة إنجاز الإجراءات' : 'Actions Completion'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Search & Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-secondary)]" />
            <input
              type="text"
              placeholder={isAr ? 'بحث في التقارير...' : 'Search reports...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full ps-10 pe-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[#F39200]/50"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
            >
              <option value="all">{isAr ? 'جميع الحالات' : 'All Statuses'}</option>
              <option value="open">{isAr ? 'مفتوح' : 'Open'}</option>
              <option value="inProgress">{isAr ? 'قيد المتابعة' : 'In Progress'}</option>
              <option value="closed">{isAr ? 'مغلق' : 'Closed'}</option>
            </select>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-2 rounded-lg border border-[var(--border)] hover:bg-[var(--background-secondary)] transition-colors"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-[var(--border)]">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
            >
              <option value="all">{isAr ? 'جميع الإدارات' : 'All Departments'}</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {isAr ? d.nameAr : d.nameEn}
                </option>
              ))}
            </select>
          </div>
        )}
      </Card>

      {/* Reports List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#F39200]" />
        </div>
      ) : filteredReports.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 text-[var(--foreground-secondary)] mx-auto mb-3 opacity-40" />
          <p className="text-[var(--foreground-secondary)]">
            {isAr ? 'لا توجد تقارير مراجعة' : 'No audit reports found'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => {
            const openFindings = report.findings.filter((f) => f.status !== 'closed').length;
            const totalFindings = report.findings.length;
            const totalActions = report.findings.flatMap((f) => f.actions).length;
            const completedActions = report.findings
              .flatMap((f) => f.actions)
              .filter((a) => a.status === 'completed').length;

            return (
              <Card
                key={report.id}
                className="p-4 hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => router.push(`/audit/${report.id}`)}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-[#F39200] font-semibold">
                        {report.reportNumber}
                      </span>
                      {getStatusBadge(report.status)}
                    </div>
                    <h3 className="font-semibold text-[var(--foreground)] truncate">
                      {isAr ? report.titleAr : report.titleEn || report.titleAr}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[var(--foreground-secondary)]">
                      {report.department && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {isAr ? report.department.nameAr : report.department.nameEn}
                        </span>
                      )}
                      {report.auditorName && (
                        <span className="flex items-center gap-1">
                          <ClipboardCheck className="w-3 h-3" />
                          {report.auditorName}
                        </span>
                      )}
                      {report.reportDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(report.reportDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    {/* Finding counts */}
                    <div className="text-center">
                      <p className="text-lg font-bold">{totalFindings}</p>
                      <p className="text-[10px] text-[var(--foreground-secondary)]">
                        {isAr ? 'ملاحظات' : 'Findings'}
                      </p>
                    </div>
                    {openFindings > 0 && (
                      <div className="text-center">
                        <p className="text-lg font-bold text-amber-600">{openFindings}</p>
                        <p className="text-[10px] text-[var(--foreground-secondary)]">
                          {isAr ? 'مفتوحة' : 'Open'}
                        </p>
                      </div>
                    )}
                    {totalActions > 0 && (
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-600">
                          {completedActions}/{totalActions}
                        </p>
                        <p className="text-[10px] text-[var(--foreground-secondary)]">
                          {isAr ? 'إجراءات' : 'Actions'}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/audit/${report.id}`);
                        }}
                        className="p-2 rounded-lg hover:bg-[var(--background-secondary)] transition-colors"
                        title={isAr ? 'عرض' : 'View'}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteModal(report.id);
                        }}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                        title={isAr ? 'حذف' : 'Delete'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={isAr ? 'تقرير مراجعة جديد' : 'New Audit Report'}
        size="lg"
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
          <div>
            <label className="block text-sm font-medium mb-1">
              {isAr ? 'عنوان التقرير (عربي) *' : 'Report Title (Arabic) *'}
            </label>
            <input
              type="text"
              value={newReport.titleAr}
              onChange={(e) => setNewReport({ ...newReport, titleAr: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
              placeholder={isAr ? 'عنوان التقرير...' : 'Report title...'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {isAr ? 'عنوان التقرير (إنجليزي)' : 'Report Title (English)'}
            </label>
            <input
              type="text"
              value={newReport.titleEn}
              onChange={(e) => setNewReport({ ...newReport, titleEn: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
              dir="ltr"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {isAr ? 'الإدارة المُراجَعة' : 'Audited Department'}
              </label>
              <select
                value={newReport.departmentId}
                onChange={(e) => setNewReport({ ...newReport, departmentId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
              >
                <option value="">{isAr ? 'اختر الإدارة' : 'Select department'}</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {isAr ? d.nameAr : d.nameEn}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {isAr ? 'المراجع / جهة المراجعة' : 'Auditor'}
              </label>
              <input
                type="text"
                value={newReport.auditorName}
                onChange={(e) => setNewReport({ ...newReport, auditorName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {isAr ? 'بدء المراجعة' : 'Audit Start'}
              </label>
              <input
                type="date"
                value={newReport.auditDateFrom}
                onChange={(e) => setNewReport({ ...newReport, auditDateFrom: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {isAr ? 'نهاية المراجعة' : 'Audit End'}
              </label>
              <input
                type="date"
                value={newReport.auditDateTo}
                onChange={(e) => setNewReport({ ...newReport, auditDateTo: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {isAr ? 'تاريخ التقرير' : 'Report Date'}
              </label>
              <input
                type="date"
                value={newReport.reportDate}
                onChange={(e) => setNewReport({ ...newReport, reportDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {isAr ? 'ملخص التقرير (عربي)' : 'Report Summary (Arabic)'}
            </label>
            <textarea
              value={newReport.summaryAr}
              onChange={(e) => setNewReport({ ...newReport, summaryAr: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm resize-none"
            />
          </div>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowCreateModal(false)}>
            {isAr ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button onClick={handleCreate} disabled={creating || !newReport.titleAr.trim()}>
            {creating && <Loader2 className="w-4 h-4 animate-spin" />}
            {isAr ? 'إنشاء التقرير' : 'Create Report'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!showDeleteModal}
        onClose={() => setShowDeleteModal(null)}
        title={isAr ? 'حذف التقرير' : 'Delete Report'}
      >
        <p className="text-[var(--foreground-secondary)]">
          {isAr
            ? 'هل أنت متأكد من حذف هذا التقرير؟ سيتم حذف جميع الملاحظات والإجراءات المرتبطة به.'
            : 'Are you sure you want to delete this report? All related findings and actions will be deleted.'}
        </p>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowDeleteModal(null)}>
            {isAr ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button
            variant="danger"
            onClick={() => showDeleteModal && handleDelete(showDeleteModal)}
            disabled={deleting}
          >
            {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isAr ? 'حذف' : 'Delete'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
