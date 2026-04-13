'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import {
  ArrowLeft,
  ArrowRight,
  ClipboardCheck,
  Plus,
  Edit3,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Building2,
  Calendar,
  User,
  FileText,
  Link2,
  ChevronDown,
  ChevronUp,
  Save,
  XCircle,
  CircleDot,
  ListChecks,
} from 'lucide-react';

interface AuditAction {
  id: string;
  titleAr: string;
  titleEn: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  assigneeId: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  completedAt: string | null;
  attachmentUrl: string | null;
  attachmentName: string | null;
  notesAr: string | null;
  notesEn: string | null;
  createdAt: string;
  assignee: { id: string; fullName: string; fullNameEn: string | null; email: string } | null;
  completedBy: { id: string; fullName: string; fullNameEn: string | null } | null;
  createdBy: { id: string; fullName: string; fullNameEn: string | null };
}

interface AuditFinding {
  id: string;
  findingNumber: string;
  titleAr: string;
  titleEn: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  type: string;
  severity: string;
  departmentId: string | null;
  assigneeId: string | null;
  riskId: string | null;
  status: string;
  dueDate: string | null;
  closedAt: string | null;
  createdAt: string;
  department: { id: string; nameAr: string; nameEn: string } | null;
  assignee: { id: string; fullName: string; fullNameEn: string | null; email: string } | null;
  risk: { id: string; riskNumber: string; titleAr: string; titleEn: string } | null;
  createdBy: { id: string; fullName: string; fullNameEn: string | null };
  actions: AuditAction[];
}

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
  findings: AuditFinding[];
}

interface Department {
  id: string;
  nameAr: string;
  nameEn: string;
}

interface UserOption {
  id: string;
  fullName: string;
  fullNameEn: string | null;
  email: string;
}

interface RiskOption {
  id: string;
  riskNumber: string;
  titleAr: string;
  titleEn: string;
}

export default function AuditDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [report, setReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [risks, setRisks] = useState<RiskOption[]>([]);

  // Edit report state
  const [editingReport, setEditingReport] = useState(false);
  const [editReportData, setEditReportData] = useState<any>({});
  const [savingReport, setSavingReport] = useState(false);

  // Finding modals
  const [showFindingModal, setShowFindingModal] = useState(false);
  const [editingFinding, setEditingFinding] = useState<AuditFinding | null>(null);
  const [savingFinding, setSavingFinding] = useState(false);
  const [findingForm, setFindingForm] = useState({
    titleAr: '',
    titleEn: '',
    descriptionAr: '',
    descriptionEn: '',
    type: 'observation',
    severity: 'medium',
    departmentId: '',
    assigneeId: '',
    riskId: '',
    dueDate: '',
  });

  // Action modals
  const [showActionModal, setShowActionModal] = useState<string | null>(null); // findingId
  const [editingAction, setEditingAction] = useState<AuditAction | null>(null);
  const [savingAction, setSavingAction] = useState(false);
  const [actionForm, setActionForm] = useState({
    titleAr: '',
    titleEn: '',
    descriptionAr: '',
    assigneeId: '',
    priority: 'medium',
    dueDate: '',
    notesAr: '',
  });

  // Expanded findings
  const [expandedFindings, setExpandedFindings] = useState<Set<string>>(new Set());

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; findingId?: string } | null>(null);
  const [deletingItem, setDeletingItem] = useState(false);

  const userRole = (session?.user as any)?.role || '';
  const canAccess = userRole === 'admin' || userRole === 'riskManager';

  const fetchReport = useCallback(async () => {
    try {
      const res = await fetch(`/api/audit-reports/${id}`);
      const data = await res.json();
      if (data.success) {
        setReport(data.data);
        // Auto-expand all findings
        setExpandedFindings(new Set(data.data.findings.map((f: any) => f.id)));
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchReferenceData = useCallback(async () => {
    try {
      const [deptRes, userRes, riskRes] = await Promise.all([
        fetch('/api/departments'),
        fetch('/api/users?status=active'),
        fetch('/api/risks?limit=0'),
      ]);
      const [deptData, userData, riskData] = await Promise.all([
        deptRes.json(),
        userRes.json(),
        riskRes.json(),
      ]);
      if (deptData.success) setDepartments(deptData.data);
      if (userData.success) setUsers(userData.data || userData.users || []);
      if (riskData.success) setRisks(riskData.data || []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (canAccess) {
      fetchReport();
      fetchReferenceData();
    }
  }, [canAccess, fetchReport, fetchReferenceData]);

  // ---- Report Edit ----
  const startEditReport = () => {
    if (!report) return;
    setEditReportData({
      titleAr: report.titleAr,
      titleEn: report.titleEn || '',
      departmentId: report.departmentId || '',
      auditorName: report.auditorName || '',
      auditDateFrom: report.auditDateFrom?.split('T')[0] || '',
      auditDateTo: report.auditDateTo?.split('T')[0] || '',
      reportDate: report.reportDate?.split('T')[0] || '',
      summaryAr: report.summaryAr || '',
      status: report.status,
    });
    setEditingReport(true);
  };

  const saveReport = async () => {
    setSavingReport(true);
    try {
      const res = await fetch(`/api/audit-reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editReportData),
      });
      const data = await res.json();
      if (data.success) {
        setEditingReport(false);
        fetchReport();
      }
    } catch (error) {
      console.error('Error saving report:', error);
    } finally {
      setSavingReport(false);
    }
  };

  // ---- Findings ----
  const openFindingModal = (finding?: AuditFinding) => {
    if (finding) {
      setEditingFinding(finding);
      setFindingForm({
        titleAr: finding.titleAr,
        titleEn: finding.titleEn || '',
        descriptionAr: finding.descriptionAr || '',
        descriptionEn: finding.descriptionEn || '',
        type: finding.type,
        severity: finding.severity,
        departmentId: finding.departmentId || '',
        assigneeId: finding.assigneeId || '',
        riskId: finding.riskId || '',
        dueDate: finding.dueDate?.split('T')[0] || '',
      });
    } else {
      setEditingFinding(null);
      setFindingForm({
        titleAr: '',
        titleEn: '',
        descriptionAr: '',
        descriptionEn: '',
        type: 'observation',
        severity: 'medium',
        departmentId: '',
        assigneeId: '',
        riskId: '',
        dueDate: '',
      });
    }
    setShowFindingModal(true);
  };

  const saveFinding = async () => {
    setSavingFinding(true);
    try {
      const url = editingFinding
        ? `/api/audit-reports/${id}/findings/${editingFinding.id}`
        : `/api/audit-reports/${id}/findings`;
      const method = editingFinding ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(findingForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowFindingModal(false);
        fetchReport();
      }
    } catch (error) {
      console.error('Error saving finding:', error);
    } finally {
      setSavingFinding(false);
    }
  };

  const updateFindingStatus = async (findingId: string, status: string) => {
    try {
      await fetch(`/api/audit-reports/${id}/findings/${findingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchReport();
    } catch (error) {
      console.error('Error updating finding status:', error);
    }
  };

  // ---- Actions ----
  const openActionModal = (findingId: string, action?: AuditAction) => {
    if (action) {
      setEditingAction(action);
      setActionForm({
        titleAr: action.titleAr,
        titleEn: action.titleEn || '',
        descriptionAr: action.descriptionAr || '',
        assigneeId: action.assigneeId || '',
        priority: action.priority,
        dueDate: action.dueDate?.split('T')[0] || '',
        notesAr: action.notesAr || '',
      });
    } else {
      setEditingAction(null);
      setActionForm({
        titleAr: '',
        titleEn: '',
        descriptionAr: '',
        assigneeId: '',
        priority: 'medium',
        dueDate: '',
        notesAr: '',
      });
    }
    setShowActionModal(findingId);
  };

  const saveAction = async () => {
    if (!showActionModal) return;
    setSavingAction(true);
    try {
      const url = editingAction
        ? `/api/audit-reports/${id}/findings/${showActionModal}/actions/${editingAction.id}`
        : `/api/audit-reports/${id}/findings/${showActionModal}/actions`;
      const method = editingAction ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(actionForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowActionModal(null);
        fetchReport();
      }
    } catch (error) {
      console.error('Error saving action:', error);
    } finally {
      setSavingAction(false);
    }
  };

  const updateActionStatus = async (findingId: string, actionId: string, status: string) => {
    try {
      await fetch(`/api/audit-reports/${id}/findings/${findingId}/actions/${actionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchReport();
    } catch (error) {
      console.error('Error updating action status:', error);
    }
  };

  // ---- Delete ----
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeletingItem(true);
    try {
      let url = '';
      if (deleteTarget.type === 'finding') {
        url = `/api/audit-reports/${id}/findings/${deleteTarget.id}`;
      } else if (deleteTarget.type === 'action') {
        url = `/api/audit-reports/${id}/findings/${deleteTarget.findingId}/actions/${deleteTarget.id}`;
      }
      const res = await fetch(url, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setDeleteTarget(null);
        fetchReport();
      }
    } catch (error) {
      console.error('Error deleting:', error);
    } finally {
      setDeletingItem(false);
    }
  };

  const toggleFinding = (findingId: string) => {
    setExpandedFindings((prev) => {
      const next = new Set(prev);
      if (next.has(findingId)) {
        next.delete(findingId);
      } else {
        next.add(findingId);
      }
      return next;
    });
  };

  // ---- Helpers ----
  const severityColor = (s: string) => {
    switch (s) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'major': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const severityLabel = (s: string) => {
    if (isAr) {
      switch (s) {
        case 'critical': return 'حرجة';
        case 'major': return 'كبيرة';
        case 'medium': return 'متوسطة';
        case 'low': return 'منخفضة';
        default: return s;
      }
    }
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  const typeLabel = (t: string) => {
    if (isAr) {
      switch (t) {
        case 'observation': return 'ملاحظة';
        case 'recommendation': return 'توصية';
        case 'nonConformity': return 'عدم مطابقة';
        default: return t;
      }
    }
    switch (t) {
      case 'observation': return 'Observation';
      case 'recommendation': return 'Recommendation';
      case 'nonConformity': return 'Non-Conformity';
      default: return t;
    }
  };

  const statusLabel = (s: string) => {
    if (isAr) {
      switch (s) {
        case 'open': return 'مفتوحة';
        case 'inProgress': return 'قيد التنفيذ';
        case 'pendingVerification': return 'بانتظار التحقق';
        case 'closed': return 'مغلقة';
        case 'pending': return 'معلّقة';
        case 'completed': return 'مكتملة';
        case 'cancelled': return 'ملغاة';
        default: return s;
      }
    }
    switch (s) {
      case 'open': return 'Open';
      case 'inProgress': return 'In Progress';
      case 'pendingVerification': return 'Pending Verification';
      case 'closed': return 'Closed';
      case 'pending': return 'Pending';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return s;
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'open': case 'pending': return 'warning';
      case 'inProgress': return 'info';
      case 'pendingVerification': return 'info';
      case 'closed': case 'completed': return 'success';
      case 'cancelled': return 'secondary';
      default: return 'secondary';
    }
  };

  const priorityLabel = (p: string) => {
    if (isAr) {
      switch (p) {
        case 'high': return 'عالية';
        case 'medium': return 'متوسطة';
        case 'low': return 'منخفضة';
        default: return p;
      }
    }
    return p.charAt(0).toUpperCase() + p.slice(1);
  };

  if (!canAccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 text-center max-w-md">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">
            {isAr ? 'غير مصرح بالوصول' : 'Access Denied'}
          </h2>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#F39200]" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 text-center">
          <p>{isAr ? 'التقرير غير موجود' : 'Report not found'}</p>
        </Card>
      </div>
    );
  }

  const BackArrow = isAr ? ArrowRight : ArrowLeft;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/audit')}
            className="p-2 rounded-lg hover:bg-[var(--background-secondary)] transition-colors"
          >
            <BackArrow className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-[#F39200] font-semibold">
                {report.reportNumber}
              </span>
              <Badge variant={statusColor(report.status) as any}>
                {statusLabel(report.status)}
              </Badge>
            </div>
            <h1 className="text-xl font-bold mt-1">
              {isAr ? report.titleAr : report.titleEn || report.titleAr}
            </h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={startEditReport}>
            <Edit3 className="w-4 h-4" />
            {isAr ? 'تعديل' : 'Edit'}
          </Button>
        </div>
      </div>

      {/* Report Info Card */}
      <Card className="p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {report.department && (
            <div>
              <p className="text-[var(--foreground-secondary)] text-xs mb-1">
                {isAr ? 'الإدارة المُراجَعة' : 'Audited Department'}
              </p>
              <p className="font-medium flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-[var(--foreground-secondary)]" />
                {isAr ? report.department.nameAr : report.department.nameEn}
              </p>
            </div>
          )}
          {report.auditorName && (
            <div>
              <p className="text-[var(--foreground-secondary)] text-xs mb-1">
                {isAr ? 'المراجع' : 'Auditor'}
              </p>
              <p className="font-medium flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-[var(--foreground-secondary)]" />
                {report.auditorName}
              </p>
            </div>
          )}
          {report.reportDate && (
            <div>
              <p className="text-[var(--foreground-secondary)] text-xs mb-1">
                {isAr ? 'تاريخ التقرير' : 'Report Date'}
              </p>
              <p className="font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[var(--foreground-secondary)]" />
                {new Date(report.reportDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
              </p>
            </div>
          )}
          {(report.auditDateFrom || report.auditDateTo) && (
            <div>
              <p className="text-[var(--foreground-secondary)] text-xs mb-1">
                {isAr ? 'فترة المراجعة' : 'Audit Period'}
              </p>
              <p className="font-medium text-xs">
                {report.auditDateFrom && new Date(report.auditDateFrom).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                {report.auditDateFrom && report.auditDateTo && ' — '}
                {report.auditDateTo && new Date(report.auditDateTo).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
              </p>
            </div>
          )}
        </div>
        {report.summaryAr && (
          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <p className="text-sm text-[var(--foreground-secondary)]">
              {isAr ? report.summaryAr : report.summaryEn || report.summaryAr}
            </p>
          </div>
        )}
      </Card>

      {/* Findings Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            {isAr ? 'الملاحظات والتوصيات' : 'Findings & Recommendations'}
            <span className="text-sm font-normal text-[var(--foreground-secondary)]">
              ({report.findings.length})
            </span>
          </h2>
          <Button size="sm" onClick={() => openFindingModal()}>
            <Plus className="w-4 h-4" />
            {isAr ? 'ملاحظة جديدة' : 'New Finding'}
          </Button>
        </div>

        {report.findings.length === 0 ? (
          <Card className="p-8 text-center">
            <AlertTriangle className="w-10 h-10 text-[var(--foreground-secondary)] mx-auto mb-2 opacity-30" />
            <p className="text-sm text-[var(--foreground-secondary)]">
              {isAr ? 'لا توجد ملاحظات بعد' : 'No findings yet'}
            </p>
          </Card>
        ) : (
          report.findings.map((finding) => {
            const isExpanded = expandedFindings.has(finding.id);
            const completedActions = finding.actions.filter((a) => a.status === 'completed').length;

            return (
              <Card key={finding.id} className="overflow-hidden">
                {/* Finding Header */}
                <button
                  onClick={() => toggleFinding(finding.id)}
                  className="w-full p-4 flex items-start gap-3 hover:bg-[var(--background-secondary)]/50 transition-colors text-start"
                >
                  <div className={`mt-0.5 px-2 py-0.5 rounded text-xs font-bold ${severityColor(finding.severity)}`}>
                    {severityLabel(finding.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-[var(--foreground-secondary)]">
                        {finding.findingNumber}
                      </span>
                      <Badge variant={statusColor(finding.status) as any} className="text-[10px]">
                        {statusLabel(finding.status)}
                      </Badge>
                      <span className="text-[10px] text-[var(--foreground-secondary)] bg-[var(--background-secondary)] px-1.5 py-0.5 rounded">
                        {typeLabel(finding.type)}
                      </span>
                    </div>
                    <p className="font-semibold text-sm">
                      {isAr ? finding.titleAr : finding.titleEn || finding.titleAr}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-[var(--foreground-secondary)]">
                      {finding.assignee && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {isAr ? finding.assignee.fullName : finding.assignee.fullNameEn || finding.assignee.fullName}
                        </span>
                      )}
                      {finding.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(finding.dueDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                        </span>
                      )}
                      {finding.risk && (
                        <span className="flex items-center gap-1">
                          <Link2 className="w-3 h-3" />
                          {finding.risk.riskNumber}
                        </span>
                      )}
                      {finding.actions.length > 0 && (
                        <span className="flex items-center gap-1">
                          <ListChecks className="w-3 h-3" />
                          {completedActions}/{finding.actions.length} {isAr ? 'إجراءات' : 'actions'}
                        </span>
                      )}
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-[var(--foreground-secondary)] shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[var(--foreground-secondary)] shrink-0" />
                  )}
                </button>

                {/* Finding Details */}
                {isExpanded && (
                  <div className="border-t border-[var(--border)] p-4 space-y-4">
                    {/* Description */}
                    {(finding.descriptionAr || finding.descriptionEn) && (
                      <p className="text-sm text-[var(--foreground-secondary)]">
                        {isAr ? finding.descriptionAr : finding.descriptionEn || finding.descriptionAr}
                      </p>
                    )}

                    {/* Finding Actions Row */}
                    <div className="flex flex-wrap gap-2">
                      {finding.status === 'open' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateFindingStatus(finding.id, 'inProgress')}
                        >
                          {isAr ? 'بدء المتابعة' : 'Start Follow-up'}
                        </Button>
                      )}
                      {finding.status === 'inProgress' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateFindingStatus(finding.id, 'pendingVerification')}
                        >
                          {isAr ? 'إرسال للتحقق' : 'Send for Verification'}
                        </Button>
                      )}
                      {finding.status === 'pendingVerification' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateFindingStatus(finding.id, 'closed')}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {isAr ? 'إغلاق' : 'Close'}
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => openFindingModal(finding)}>
                        <Edit3 className="w-3.5 h-3.5" />
                        {isAr ? 'تعديل' : 'Edit'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteTarget({ type: 'finding', id: finding.id })}
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    {/* Actions List */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold flex items-center gap-1.5">
                          <ListChecks className="w-4 h-4 text-green-600" />
                          {isAr ? 'الإجراءات التصحيحية' : 'Corrective Actions'}
                        </h4>
                        <button
                          onClick={() => openActionModal(finding.id)}
                          className="text-xs text-[#F39200] hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          {isAr ? 'إضافة إجراء' : 'Add Action'}
                        </button>
                      </div>

                      {finding.actions.length === 0 ? (
                        <p className="text-xs text-[var(--foreground-secondary)] ps-6">
                          {isAr ? 'لا توجد إجراءات بعد' : 'No actions yet'}
                        </p>
                      ) : (
                        finding.actions.map((action, idx) => (
                          <div
                            key={action.id}
                            className="flex items-start gap-3 p-3 rounded-lg bg-[var(--background-secondary)]/50 border border-[var(--border)]"
                          >
                            <span className="w-6 h-6 rounded-full bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-[10px] font-bold shrink-0">
                              {idx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-sm font-medium">
                                  {isAr ? action.titleAr : action.titleEn || action.titleAr}
                                </p>
                                <Badge variant={statusColor(action.status) as any} className="text-[10px]">
                                  {statusLabel(action.status)}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap gap-3 text-xs text-[var(--foreground-secondary)]">
                                {action.assignee && (
                                  <span className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {isAr ? action.assignee.fullName : action.assignee.fullNameEn || action.assignee.fullName}
                                  </span>
                                )}
                                {action.dueDate && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(action.dueDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                                  </span>
                                )}
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                  action.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                                  action.priority === 'low' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                                }`}>
                                  {priorityLabel(action.priority)}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              {action.status === 'pending' && (
                                <button
                                  onClick={() => updateActionStatus(finding.id, action.id, 'inProgress')}
                                  className="p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600"
                                  title={isAr ? 'بدء التنفيذ' : 'Start'}
                                >
                                  <CircleDot className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {action.status === 'inProgress' && (
                                <button
                                  onClick={() => updateActionStatus(finding.id, action.id, 'completed')}
                                  className="p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600"
                                  title={isAr ? 'إنجاز' : 'Complete'}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => openActionModal(finding.id, action)}
                                className="p-1 rounded hover:bg-[var(--background-secondary)]"
                                title={isAr ? 'تعديل' : 'Edit'}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget({ type: 'action', id: action.id, findingId: finding.id })}
                                className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                                title={isAr ? 'حذف' : 'Delete'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* ====== MODALS ====== */}

      {/* Edit Report Modal */}
      <Modal
        isOpen={editingReport}
        onClose={() => setEditingReport(false)}
        title={isAr ? 'تعديل التقرير' : 'Edit Report'}
        size="lg"
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
          <div>
            <label className="block text-sm font-medium mb-1">{isAr ? 'العنوان (عربي)' : 'Title (Arabic)'}</label>
            <input
              type="text"
              value={editReportData.titleAr || ''}
              onChange={(e) => setEditReportData({ ...editReportData, titleAr: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{isAr ? 'العنوان (إنجليزي)' : 'Title (English)'}</label>
            <input
              type="text"
              value={editReportData.titleEn || ''}
              onChange={(e) => setEditReportData({ ...editReportData, titleEn: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
              dir="ltr"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{isAr ? 'الإدارة' : 'Department'}</label>
              <select
                value={editReportData.departmentId || ''}
                onChange={(e) => setEditReportData({ ...editReportData, departmentId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
              >
                <option value="">{isAr ? 'غير محدد' : 'Not specified'}</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{isAr ? d.nameAr : d.nameEn}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{isAr ? 'الحالة' : 'Status'}</label>
              <select
                value={editReportData.status || 'open'}
                onChange={(e) => setEditReportData({ ...editReportData, status: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
              >
                <option value="open">{isAr ? 'مفتوح' : 'Open'}</option>
                <option value="inProgress">{isAr ? 'قيد المتابعة' : 'In Progress'}</option>
                <option value="closed">{isAr ? 'مغلق' : 'Closed'}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{isAr ? 'المراجع' : 'Auditor'}</label>
            <input
              type="text"
              value={editReportData.auditorName || ''}
              onChange={(e) => setEditReportData({ ...editReportData, auditorName: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{isAr ? 'الملخص' : 'Summary'}</label>
            <textarea
              value={editReportData.summaryAr || ''}
              onChange={(e) => setEditReportData({ ...editReportData, summaryAr: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm resize-none"
            />
          </div>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setEditingReport(false)}>
            {isAr ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button onClick={saveReport} disabled={savingReport}>
            {savingReport && <Loader2 className="w-4 h-4 animate-spin" />}
            <Save className="w-4 h-4" />
            {isAr ? 'حفظ' : 'Save'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Finding Modal */}
      <Modal
        isOpen={showFindingModal}
        onClose={() => setShowFindingModal(false)}
        title={editingFinding ? (isAr ? 'تعديل الملاحظة' : 'Edit Finding') : (isAr ? 'ملاحظة جديدة' : 'New Finding')}
        size="lg"
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
          <div>
            <label className="block text-sm font-medium mb-1">{isAr ? 'العنوان (عربي) *' : 'Title (Arabic) *'}</label>
            <input
              type="text"
              value={findingForm.titleAr}
              onChange={(e) => setFindingForm({ ...findingForm, titleAr: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{isAr ? 'العنوان (إنجليزي)' : 'Title (English)'}</label>
            <input
              type="text"
              value={findingForm.titleEn}
              onChange={(e) => setFindingForm({ ...findingForm, titleEn: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{isAr ? 'الوصف (عربي)' : 'Description (Arabic)'}</label>
            <textarea
              value={findingForm.descriptionAr}
              onChange={(e) => setFindingForm({ ...findingForm, descriptionAr: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{isAr ? 'النوع' : 'Type'}</label>
              <select
                value={findingForm.type}
                onChange={(e) => setFindingForm({ ...findingForm, type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
              >
                <option value="observation">{isAr ? 'ملاحظة' : 'Observation'}</option>
                <option value="recommendation">{isAr ? 'توصية' : 'Recommendation'}</option>
                <option value="nonConformity">{isAr ? 'عدم مطابقة' : 'Non-Conformity'}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{isAr ? 'الأهمية' : 'Severity'}</label>
              <select
                value={findingForm.severity}
                onChange={(e) => setFindingForm({ ...findingForm, severity: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
              >
                <option value="critical">{isAr ? 'حرجة' : 'Critical'}</option>
                <option value="major">{isAr ? 'كبيرة' : 'Major'}</option>
                <option value="medium">{isAr ? 'متوسطة' : 'Medium'}</option>
                <option value="low">{isAr ? 'منخفضة' : 'Low'}</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{isAr ? 'الإدارة المعنية' : 'Department'}</label>
              <select
                value={findingForm.departmentId}
                onChange={(e) => setFindingForm({ ...findingForm, departmentId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
              >
                <option value="">{isAr ? 'غير محدد' : 'Not specified'}</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{isAr ? d.nameAr : d.nameEn}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{isAr ? 'المسؤول' : 'Assignee'}</label>
              <select
                value={findingForm.assigneeId}
                onChange={(e) => setFindingForm({ ...findingForm, assigneeId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
              >
                <option value="">{isAr ? 'غير محدد' : 'Not assigned'}</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{isAr ? u.fullName : u.fullNameEn || u.fullName}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{isAr ? 'ربط بخطر' : 'Link to Risk'}</label>
              <select
                value={findingForm.riskId}
                onChange={(e) => setFindingForm({ ...findingForm, riskId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
              >
                <option value="">{isAr ? 'بدون ربط' : 'No link'}</option>
                {risks.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.riskNumber} - {isAr ? r.titleAr : r.titleEn}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{isAr ? 'تاريخ الاستحقاق' : 'Due Date'}</label>
              <input
                type="date"
                value={findingForm.dueDate}
                onChange={(e) => setFindingForm({ ...findingForm, dueDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
              />
            </div>
          </div>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowFindingModal(false)}>
            {isAr ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button onClick={saveFinding} disabled={savingFinding || !findingForm.titleAr.trim()}>
            {savingFinding && <Loader2 className="w-4 h-4 animate-spin" />}
            {editingFinding ? (isAr ? 'حفظ التعديلات' : 'Save Changes') : (isAr ? 'إضافة' : 'Add')}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Action Modal */}
      <Modal
        isOpen={!!showActionModal}
        onClose={() => setShowActionModal(null)}
        title={editingAction ? (isAr ? 'تعديل الإجراء' : 'Edit Action') : (isAr ? 'إجراء تصحيحي جديد' : 'New Corrective Action')}
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
          <div>
            <label className="block text-sm font-medium mb-1">{isAr ? 'عنوان الإجراء (عربي) *' : 'Action Title (Arabic) *'}</label>
            <input
              type="text"
              value={actionForm.titleAr}
              onChange={(e) => setActionForm({ ...actionForm, titleAr: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{isAr ? 'الوصف' : 'Description'}</label>
            <textarea
              value={actionForm.descriptionAr}
              onChange={(e) => setActionForm({ ...actionForm, descriptionAr: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{isAr ? 'المكلف' : 'Assignee'}</label>
              <select
                value={actionForm.assigneeId}
                onChange={(e) => setActionForm({ ...actionForm, assigneeId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
              >
                <option value="">{isAr ? 'غير محدد' : 'Not assigned'}</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{isAr ? u.fullName : u.fullNameEn || u.fullName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{isAr ? 'الأولوية' : 'Priority'}</label>
              <select
                value={actionForm.priority}
                onChange={(e) => setActionForm({ ...actionForm, priority: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
              >
                <option value="high">{isAr ? 'عالية' : 'High'}</option>
                <option value="medium">{isAr ? 'متوسطة' : 'Medium'}</option>
                <option value="low">{isAr ? 'منخفضة' : 'Low'}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{isAr ? 'تاريخ الاستحقاق' : 'Due Date'}</label>
            <input
              type="date"
              value={actionForm.dueDate}
              onChange={(e) => setActionForm({ ...actionForm, dueDate: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{isAr ? 'ملاحظات' : 'Notes'}</label>
            <textarea
              value={actionForm.notesAr}
              onChange={(e) => setActionForm({ ...actionForm, notesAr: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm resize-none"
            />
          </div>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowActionModal(null)}>
            {isAr ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button onClick={saveAction} disabled={savingAction || !actionForm.titleAr.trim()}>
            {savingAction && <Loader2 className="w-4 h-4 animate-spin" />}
            {editingAction ? (isAr ? 'حفظ' : 'Save') : (isAr ? 'إضافة' : 'Add')}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={isAr ? 'تأكيد الحذف' : 'Confirm Delete'}
      >
        <p className="text-[var(--foreground-secondary)]">
          {deleteTarget?.type === 'finding'
            ? (isAr ? 'هل أنت متأكد من حذف هذه الملاحظة وجميع الإجراءات المرتبطة بها؟' : 'Are you sure you want to delete this finding and all its actions?')
            : (isAr ? 'هل أنت متأكد من حذف هذا الإجراء؟' : 'Are you sure you want to delete this action?')
          }
        </p>
        <ModalFooter>
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>
            {isAr ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={deletingItem}>
            {deletingItem && <Loader2 className="w-4 h-4 animate-spin" />}
            {isAr ? 'حذف' : 'Delete'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
