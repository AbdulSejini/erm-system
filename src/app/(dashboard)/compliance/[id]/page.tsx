'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/contexts/LanguageContext';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import {
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  MinusCircle,
  HelpCircle,
  AlertTriangle,
  Building2,
  User,
  Calendar,
  Target,
  FileText,
  Link2,
  ClipboardList,
  History,
  BarChart3,
  RefreshCw,
  ExternalLink,
  Pencil,
  Trash2,
  Printer,
  X,
  Save,
  Check,
} from 'lucide-react';

interface ObligationDetail {
  id: string;
  code: string;
  sequenceNumber: number;
  titleAr: string;
  titleEn: string;
  subDomainAr: string | null;
  subDomainEn: string | null;
  regulatoryReference: string | null;
  articleNumber: string | null;
  internalPolicyAr: string | null;
  internalPolicyEn: string | null;
  policyDocumentNumber: string | null;
  obligationType: string;
  responsibleDepartmentAr: string | null;
  responsibleDepartmentEn: string | null;
  directOwnerAr: string | null;
  directOwnerEn: string | null;
  backupOwnerAr: string | null;
  backupOwnerEn: string | null;
  defenseLine: string | null;
  recurrence: string | null;
  nextDueDate: string | null;
  lastReviewDate: string | null;
  nextReviewDate: string | null;
  alertDaysBefore: number;
  criticalityLevel: string | null;
  nonComplianceLikelihood: number | null;
  nonComplianceImpact: number | null;
  riskScore: number | null;
  riskRating: string | null;
  potentialPenaltiesAr: string | null;
  potentialPenaltiesEn: string | null;
  complianceStatus: string;
  completionPercentage: number;
  controlActivitiesAr: string | null;
  controlActivitiesEn: string | null;
  testingMethod: string | null;
  lastTestResult: string | null;
  lastTestDate: string | null;
  evidenceRequirementsAr: string | null;
  evidenceRequirementsEn: string | null;
  gapDescriptionAr: string | null;
  gapDescriptionEn: string | null;
  remediationPlanAr: string | null;
  remediationPlanEn: string | null;
  remediationTargetDate: string | null;
  remediationOwnerAr: string | null;
  remediationOwnerEn: string | null;
  remediationStatus: string | null;
  linkedRiskNumbers: string | null;
  kpiKriAr: string | null;
  kpiKriEn: string | null;
  notesAr: string | null;
  notesEn: string | null;
  domain: { id: string; nameAr: string; nameEn: string; code: string } | null;
  regulatoryBody: { id: string; nameAr: string; nameEn: string } | null;
  createdBy: { id: string; fullName: string; fullNameEn: string | null } | null;
  riskLinks: Array<{
    id: string;
    linkedAt: string;
    risk: {
      id: string;
      riskNumber: string;
      titleAr: string;
      titleEn: string | null;
      inherentRating: string | null;
      residualRating: string | null;
      status: string;
      department: { nameAr: string; nameEn: string } | null;
    };
    linkedBy: { id: string; fullName: string; fullNameEn: string | null } | null;
  }>;
  assessments: Array<{
    id: string;
    testResult: string;
    testDate: string;
    testingMethod: string | null;
    findingsAr: string | null;
    findingsEn: string | null;
    assessor: { id: string; fullName: string; fullNameEn: string | null };
    createdAt: string;
  }>;
  changeLogs: Array<{
    id: string;
    changeType: string;
    fieldName: string | null;
    oldValue: string | null;
    newValue: string | null;
    description: string | null;
    descriptionAr: string | null;
    user: { id: string; fullName: string; fullNameEn: string | null };
    createdAt: string;
  }>;
}

export default function ComplianceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { t, language } = useTranslation();
  const isAr = language === 'ar';
  const { data: session } = useSession();
  const { isImpersonating, impersonatedUser } = useImpersonation();

  const effectiveRole = (isImpersonating && impersonatedUser?.role) ? impersonatedUser.role : session?.user?.role;
  const canEdit = effectiveRole && ['admin', 'riskManager', 'riskAnalyst'].includes(effectiveRole);
  const canDelete = effectiveRole && ['admin', 'riskManager'].includes(effectiveRole);

  const [obligation, setObligation] = useState<ObligationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchObligation = useCallback(async () => {
    try {
      setLoading(true);
      const headers: Record<string, string> = {};
      if (isImpersonating && impersonatedUser?.id) {
        headers['X-Impersonate-User-Id'] = impersonatedUser.id;
      }
      const res = await fetch(`/api/compliance/${id}`, { headers });
      const data = await res.json();
      if (data.success) {
        setObligation(data.data);
      }
    } catch (error) {
      console.error('Error fetching obligation:', error);
    } finally {
      setLoading(false);
    }
  }, [id, isImpersonating, impersonatedUser]);

  useEffect(() => {
    fetchObligation();
  }, [fetchObligation]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleDelete = async () => {
    if (!confirm(t('compliance.confirmDelete'))) return;
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (isImpersonating && impersonatedUser?.id) {
        headers['X-Impersonate-User-Id'] = impersonatedUser.id;
      }
      const res = await fetch(`/api/compliance/${id}`, { method: 'DELETE', headers });
      const data = await res.json();
      if (data.success) {
        router.push('/compliance');
      }
    } catch (error) {
      console.error('Error deleting obligation:', error);
    }
  };

  const handleSave = async (formData: Record<string, unknown>) => {
    setSaving(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (isImpersonating && impersonatedUser?.id) {
        headers['X-Impersonate-User-Id'] = impersonatedUser.id;
      }
      const res = await fetch(`/api/compliance/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setToast({ message: t('compliance.editSuccess'), type: 'success' });
        setShowEditModal(false);
        fetchObligation();
      } else {
        setToast({ message: data.error || t('compliance.editError'), type: 'error' });
      }
    } catch {
      setToast({ message: t('compliance.editError'), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const config: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
      compliant: { label: t('compliance.compliant'), color: 'text-green-700 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30', icon: CheckCircle2 },
      partiallyCompliant: { label: t('compliance.partiallyCompliant'), color: 'text-yellow-700 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', icon: MinusCircle },
      nonCompliant: { label: t('compliance.nonCompliant'), color: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30', icon: XCircle },
      notAssessed: { label: t('compliance.notAssessed'), color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-800', icon: HelpCircle },
    };
    return config[status] || config.notAssessed;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return isAr ? `منذ ${days} يوم` : `${days}d ago`;
    if (hours > 0) return isAr ? `منذ ${hours} ساعة` : `${hours}h ago`;
    return isAr ? `منذ ${minutes} دقيقة` : `${minutes}m ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <RefreshCw className="h-10 w-10 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (!obligation) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <ShieldCheck className="h-16 w-16 text-[var(--foreground-secondary)] opacity-30" />
        <p className="text-lg text-[var(--foreground-secondary)]">{isAr ? 'الالتزام غير موجود' : 'Obligation not found'}</p>
        <button onClick={() => router.push('/compliance')} className="text-[var(--primary)] hover:underline text-sm">
          {isAr ? 'العودة للسجل' : 'Back to Register'}
        </button>
      </div>
    );
  }

  const statusConfig = getStatusConfig(obligation.complianceStatus);
  const StatusIcon = statusConfig.icon;

  return (
    <>
      <div className="max-w-[1400px] mx-auto space-y-6 p-4 md:p-6 print-content">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 no-print">
          <button
            onClick={() => router.push('/compliance')}
            className="p-2 rounded-xl hover:bg-[var(--background-tertiary)] transition-colors"
          >
            {isAr ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-mono font-bold">
                {obligation.code}
              </span>
              <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                <StatusIcon className="h-3 w-3 inline me-1" />
                {statusConfig.label}
              </span>
            </div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">
              {isAr ? obligation.titleAr : (obligation.titleEn || obligation.titleAr)}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="p-2 rounded-xl hover:bg-[var(--background-tertiary)] transition-colors text-[var(--foreground-secondary)]"
              title={t('compliance.printObligation')}
            >
              <Printer className="h-5 w-5" />
            </button>
            {canEdit && (
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
              >
                <Pencil className="h-4 w-4" />
                {t('common.edit')}
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 transition-colors"
                title={t('compliance.deleteObligation')}
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Print Header (only visible when printing) */}
        <div className="hidden print-show">
          <div className="text-center mb-6 border-b-2 border-[#F39200] pb-4">
            <h1 className="text-xl font-bold">{isAr ? 'شركة الكابلات السعودية' : 'Saudi Cable Company'}</h1>
            <p className="text-sm text-gray-500">{isAr ? 'نموذج الالتزام التنظيمي' : 'Regulatory Compliance Form'}</p>
            <div className="flex justify-center gap-4 mt-2 text-xs text-gray-500">
              <span>{obligation.code}</span>
              <span>{new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}</span>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <InfoCard
            icon={<Building2 className="h-5 w-5" />}
            label={t('compliance.domain')}
            value={obligation.domain ? (isAr ? obligation.domain.nameAr : obligation.domain.nameEn) : '-'}
            sublabel={obligation.subDomainAr || undefined}
            color="indigo"
          />
          <InfoCard
            icon={<Target className="h-5 w-5" />}
            label={t('compliance.criticalityLevel')}
            value={obligation.criticalityLevel ? t(`compliance.${obligation.criticalityLevel}`) : '-'}
            sublabel={`${isAr ? 'درجة المخاطر' : 'Risk Score'}: ${obligation.riskScore ?? '-'}`}
            color={obligation.criticalityLevel === 'critical' ? 'red' : obligation.criticalityLevel === 'high' ? 'orange' : 'yellow'}
          />
          <InfoCard
            icon={<Calendar className="h-5 w-5" />}
            label={t('compliance.nextDueDate')}
            value={formatDate(obligation.nextDueDate)}
            sublabel={obligation.recurrence ? t(`compliance.${obligation.recurrence}`) : '-'}
            color="blue"
          />
          <InfoCard
            icon={<BarChart3 className="h-5 w-5" />}
            label={t('compliance.completionPercentage')}
            value={`${Math.round((obligation.completionPercentage || 0) * 100)}%`}
            progress={obligation.completionPercentage || 0}
            color="purple"
          />
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Section title={t('compliance.regulatoryReference')} icon={<FileText className="h-5 w-5" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label={t('compliance.regulatoryReference')} value={obligation.regulatoryReference} />
                <Field label={t('compliance.articleNumber')} value={obligation.articleNumber} />
                <Field label={t('compliance.internalPolicy')} value={isAr ? obligation.internalPolicyAr : obligation.internalPolicyEn} />
                <Field label={t('compliance.policyDocumentNumber')} value={obligation.policyDocumentNumber} />
                <Field label={t('compliance.regulatoryBody')} value={obligation.regulatoryBody ? (isAr ? obligation.regulatoryBody.nameAr : obligation.regulatoryBody.nameEn) : null} />
                <Field label={t('compliance.obligationType')} value={t(`compliance.${obligation.obligationType}`)} />
              </div>
            </Section>

            <Section title={t('compliance.responsibility')} icon={<User className="h-5 w-5" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label={t('compliance.responsibleDepartment')} value={isAr ? obligation.responsibleDepartmentAr : obligation.responsibleDepartmentEn} />
                <Field label={t('compliance.directOwner')} value={isAr ? obligation.directOwnerAr : obligation.directOwnerEn} />
                <Field label={t('compliance.backupOwner')} value={isAr ? obligation.backupOwnerAr : obligation.backupOwnerEn} />
                <Field label={t('compliance.defenseLine')} value={obligation.defenseLine ? t(`compliance.${obligation.defenseLine.replace(' ', '')}Line` as 'compliance.firstLine') : null} />
              </div>
            </Section>

            <Section title={t('compliance.statusAndMonitoring')} icon={<ClipboardList className="h-5 w-5" />}>
              <div className="space-y-4">
                <Field label={t('compliance.controlActivities')} value={isAr ? obligation.controlActivitiesAr : obligation.controlActivitiesEn} multiline />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label={t('compliance.testingMethod')} value={obligation.testingMethod ? t(`compliance.${obligation.testingMethod}` as 'compliance.documentReview') : null} />
                  <Field label={t('compliance.lastTestResult')} value={obligation.lastTestResult ? t(`compliance.${obligation.lastTestResult}` as 'compliance.passed') : null} />
                  <Field label={t('compliance.lastTestDate')} value={formatDate(obligation.lastTestDate)} />
                </div>
                <Field label={t('compliance.evidenceRequirements')} value={isAr ? obligation.evidenceRequirementsAr : obligation.evidenceRequirementsEn} multiline />
              </div>
            </Section>

            {(obligation.gapDescriptionAr || obligation.remediationPlanAr) && (
              <Section title={t('compliance.gapAnalysis')} icon={<AlertTriangle className="h-5 w-5" />}>
                <div className="space-y-4">
                  <Field label={t('compliance.gapDescription')} value={isAr ? obligation.gapDescriptionAr : obligation.gapDescriptionEn} multiline />
                  <Field label={t('compliance.remediationPlan')} value={isAr ? obligation.remediationPlanAr : obligation.remediationPlanEn} multiline />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field label={t('compliance.remediationTargetDate')} value={formatDate(obligation.remediationTargetDate)} />
                    <Field label={t('compliance.remediationOwner')} value={isAr ? obligation.remediationOwnerAr : obligation.remediationOwnerEn} />
                    <Field label={t('compliance.remediationStatus')} value={obligation.remediationStatus ? t(`compliance.${obligation.remediationStatus}` as 'compliance.notStarted') : null} />
                  </div>
                </div>
              </Section>
            )}

            <Section title={t('compliance.riskAssessment')} icon={<Target className="h-5 w-5" />}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-xl bg-[var(--background-tertiary)]">
                  <p className="text-xs text-[var(--foreground-secondary)] mb-1">{t('compliance.nonComplianceLikelihood')}</p>
                  <p className="text-2xl font-bold text-[var(--foreground)]">{obligation.nonComplianceLikelihood ?? '-'}</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-[var(--background-tertiary)]">
                  <p className="text-xs text-[var(--foreground-secondary)] mb-1">{t('compliance.nonComplianceImpact')}</p>
                  <p className="text-2xl font-bold text-[var(--foreground)]">{obligation.nonComplianceImpact ?? '-'}</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-[var(--background-tertiary)]">
                  <p className="text-xs text-[var(--foreground-secondary)] mb-1">{t('compliance.riskScore')}</p>
                  <p className="text-2xl font-bold text-[var(--primary)]">{obligation.riskScore ?? '-'}</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-[var(--background-tertiary)]">
                  <p className="text-xs text-[var(--foreground-secondary)] mb-1">{t('compliance.potentialPenalties')}</p>
                  <p className="text-xs text-[var(--foreground)]">{isAr ? obligation.potentialPenaltiesAr : obligation.potentialPenaltiesEn || '-'}</p>
                </div>
              </div>
            </Section>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <Section title={`${t('compliance.linkedRisks')} (${obligation.riskLinks.length})`} icon={<Link2 className="h-5 w-5" />}>
              {obligation.riskLinks.length > 0 ? (
                <div className="space-y-2">
                  {obligation.riskLinks.map(link => (
                    <div
                      key={link.id}
                      onClick={() => router.push(`/risks/${link.risk.id}`)}
                      className="p-3 rounded-xl border border-[var(--border)] hover:border-[var(--primary)] cursor-pointer transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-[var(--primary)]">{link.risk.riskNumber}</span>
                        <ExternalLink className="h-3 w-3 text-[var(--foreground-secondary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-sm text-[var(--foreground)] mt-1 line-clamp-2">
                        {isAr ? link.risk.titleAr : (link.risk.titleEn || link.risk.titleAr)}
                      </p>
                      {link.risk.department && (
                        <p className="text-xs text-[var(--foreground-secondary)] mt-1">
                          {isAr ? link.risk.department.nameAr : link.risk.department.nameEn}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--foreground-secondary)] text-center py-4">{isAr ? 'لا توجد مخاطر مرتبطة' : 'No linked risks'}</p>
              )}
            </Section>

            <Section title={`${t('compliance.assessments')} (${obligation.assessments.length})`} icon={<ClipboardList className="h-5 w-5" />}>
              {obligation.assessments.length > 0 ? (
                <div className="space-y-2">
                  {obligation.assessments.slice(0, 5).map(assessment => (
                    <div key={assessment.id} className="p-3 rounded-xl bg-[var(--background-tertiary)]">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          assessment.testResult === 'passed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          assessment.testResult === 'partial' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {t(`compliance.${assessment.testResult}` as 'compliance.passed')}
                        </span>
                        <span className="text-[10px] text-[var(--foreground-secondary)]">{getTimeAgo(assessment.createdAt)}</span>
                      </div>
                      <p className="text-xs text-[var(--foreground-secondary)]">
                        {isAr ? assessment.assessor.fullName : (assessment.assessor.fullNameEn || assessment.assessor.fullName)}
                      </p>
                      {(assessment.findingsAr || assessment.findingsEn) && (
                        <p className="text-xs text-[var(--foreground)] mt-1 line-clamp-2">
                          {isAr ? assessment.findingsAr : assessment.findingsEn}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--foreground-secondary)] text-center py-4">{isAr ? 'لا توجد تقييمات' : 'No assessments'}</p>
              )}
            </Section>

            {(obligation.kpiKriAr || obligation.notesAr) && (
              <Section title={t('compliance.kpiKri')} icon={<BarChart3 className="h-5 w-5" />}>
                {obligation.kpiKriAr && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-[var(--foreground-secondary)] mb-1">{t('compliance.kpiKri')}</p>
                    <p className="text-sm text-[var(--foreground)]">{isAr ? obligation.kpiKriAr : obligation.kpiKriEn}</p>
                  </div>
                )}
                {obligation.notesAr && (
                  <div>
                    <p className="text-xs font-medium text-[var(--foreground-secondary)] mb-1">{t('compliance.notes')}</p>
                    <p className="text-sm text-[var(--foreground)]">{isAr ? obligation.notesAr : obligation.notesEn}</p>
                  </div>
                )}
              </Section>
            )}

            <Section title={t('compliance.changeLog')} icon={<History className="h-5 w-5" />}>
              {obligation.changeLogs.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {obligation.changeLogs.slice(0, 10).map(log => (
                    <div key={log.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-[var(--background-tertiary)]">
                      <div className="mt-0.5 h-2 w-2 rounded-full bg-[var(--primary)] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[var(--foreground)]">
                          {isAr ? (log.descriptionAr || log.description) : (log.description || log.descriptionAr)}
                        </p>
                        <p className="text-[10px] text-[var(--foreground-secondary)]">
                          {isAr ? log.user.fullName : (log.user.fullNameEn || log.user.fullName)} - {getTimeAgo(log.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--foreground-secondary)] text-center py-4">{isAr ? 'لا توجد تغييرات' : 'No changes'}</p>
              )}
            </Section>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && obligation && (
        <EditModal
          obligation={obligation}
          onSave={handleSave}
          onClose={() => setShowEditModal(false)}
          saving={saving}
          effectiveRole={effectiveRole || ''}
          t={t}
          isAr={isAr}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.type === 'success' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
          {toast.message}
        </div>
      )}

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print-content, .print-content * { visibility: visible; }
          .print-content { position: absolute; left: 0; top: 0; width: 100%; padding: 20px !important; }
          .no-print { display: none !important; }
          .print-show { display: block !important; }
          @page { margin: 15mm; size: A4; }
        }
        @media not print {
          .print-show { display: none; }
        }
      `}</style>
    </>
  );
}

// --- Edit Modal ---
function EditModal({
  obligation,
  onSave,
  onClose,
  saving,
  effectiveRole,
  t,
  isAr,
}: {
  obligation: ObligationDetail;
  onSave: (data: Record<string, unknown>) => void;
  onClose: () => void;
  saving: boolean;
  effectiveRole: string;
  t: (key: string) => string;
  isAr: boolean;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [form, setForm] = useState<Record<string, any>>({
    titleAr: obligation.titleAr,
    titleEn: obligation.titleEn,
    complianceStatus: obligation.complianceStatus,
    completionPercentage: obligation.completionPercentage,
    criticalityLevel: obligation.criticalityLevel || 'medium',
    obligationType: obligation.obligationType,
    responsibleDepartmentAr: obligation.responsibleDepartmentAr || '',
    responsibleDepartmentEn: obligation.responsibleDepartmentEn || '',
    directOwnerAr: obligation.directOwnerAr || '',
    directOwnerEn: obligation.directOwnerEn || '',
    backupOwnerAr: obligation.backupOwnerAr || '',
    backupOwnerEn: obligation.backupOwnerEn || '',
    defenseLine: obligation.defenseLine || '',
    recurrence: obligation.recurrence || 'annual',
    nextDueDate: obligation.nextDueDate ? obligation.nextDueDate.split('T')[0] : '',
    lastReviewDate: obligation.lastReviewDate ? obligation.lastReviewDate.split('T')[0] : '',
    nextReviewDate: obligation.nextReviewDate ? obligation.nextReviewDate.split('T')[0] : '',
    alertDaysBefore: obligation.alertDaysBefore,
    nonComplianceLikelihood: obligation.nonComplianceLikelihood || 1,
    nonComplianceImpact: obligation.nonComplianceImpact || 1,
    regulatoryReference: obligation.regulatoryReference || '',
    articleNumber: obligation.articleNumber || '',
    internalPolicyAr: obligation.internalPolicyAr || '',
    internalPolicyEn: obligation.internalPolicyEn || '',
    policyDocumentNumber: obligation.policyDocumentNumber || '',
    controlActivitiesAr: obligation.controlActivitiesAr || '',
    controlActivitiesEn: obligation.controlActivitiesEn || '',
    testingMethod: obligation.testingMethod || '',
    lastTestResult: obligation.lastTestResult || '',
    lastTestDate: obligation.lastTestDate ? obligation.lastTestDate.split('T')[0] : '',
    evidenceRequirementsAr: obligation.evidenceRequirementsAr || '',
    evidenceRequirementsEn: obligation.evidenceRequirementsEn || '',
    gapDescriptionAr: obligation.gapDescriptionAr || '',
    gapDescriptionEn: obligation.gapDescriptionEn || '',
    remediationPlanAr: obligation.remediationPlanAr || '',
    remediationPlanEn: obligation.remediationPlanEn || '',
    remediationTargetDate: obligation.remediationTargetDate ? obligation.remediationTargetDate.split('T')[0] : '',
    remediationOwnerAr: obligation.remediationOwnerAr || '',
    remediationOwnerEn: obligation.remediationOwnerEn || '',
    remediationStatus: obligation.remediationStatus || 'notApplicable',
    potentialPenaltiesAr: obligation.potentialPenaltiesAr || '',
    potentialPenaltiesEn: obligation.potentialPenaltiesEn || '',
    kpiKriAr: obligation.kpiKriAr || '',
    kpiKriEn: obligation.kpiKriEn || '',
    notesAr: obligation.notesAr || '',
    notesEn: obligation.notesEn || '',
  });

  const isAnalyst = effectiveRole === 'riskAnalyst';

  // riskAnalyst يرى فقط التابات اللي يقدر يعدلها
  const allTabs = [
    { key: 'general', label: t('compliance.generalInfo'), analystAccess: false },
    { key: 'responsibility', label: t('compliance.responsibility'), analystAccess: false },
    { key: 'dates', label: t('compliance.dates'), analystAccess: false },
    { key: 'monitoring', label: t('compliance.statusAndMonitoring'), analystAccess: true },
    { key: 'risk', label: t('compliance.riskDetails'), analystAccess: false },
    { key: 'gap', label: t('compliance.gapAnalysis'), analystAccess: false },
    { key: 'notes', label: t('compliance.notes'), analystAccess: true },
  ];

  const tabs = isAnalyst ? allTabs.filter(tab => tab.analystAccess) : allTabs;
  const [activeTab, setActiveTab] = useState(isAnalyst ? 'monitoring' : 'general');

  const handleChange = (field: string, value: unknown) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-[var(--background)] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              <Pencil className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--foreground)]">{t('compliance.editObligation')}</h2>
              <p className="text-xs text-[var(--foreground-secondary)]">{obligation.code}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--background-tertiary)] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 py-2 border-b border-[var(--border)] overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-[var(--foreground-secondary)] hover:bg-[var(--background-tertiary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <FormField label={t('compliance.obligationTitle') + ' (AR)'} required>
                <input value={form.titleAr} onChange={e => handleChange('titleAr', e.target.value)} disabled={isAnalyst}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] disabled:opacity-50" />
              </FormField>
              <FormField label={t('compliance.obligationTitle') + ' (EN)'}>
                <input value={form.titleEn} onChange={e => handleChange('titleEn', e.target.value)} disabled={isAnalyst}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] disabled:opacity-50" />
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label={t('compliance.obligationType')}>
                  <select value={form.obligationType} onChange={e => handleChange('obligationType', e.target.value)} disabled={isAnalyst}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] disabled:opacity-50">
                    <option value="mandatory">{t('compliance.mandatory')}</option>
                    <option value="optional">{t('compliance.optional')}</option>
                    <option value="advisory">{t('compliance.advisory')}</option>
                  </select>
                </FormField>
                <FormField label={t('compliance.criticalityLevel')}>
                  <select value={form.criticalityLevel} onChange={e => handleChange('criticalityLevel', e.target.value)} disabled={isAnalyst}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] disabled:opacity-50">
                    <option value="critical">{t('compliance.critical')}</option>
                    <option value="high">{t('compliance.high')}</option>
                    <option value="medium">{t('compliance.medium')}</option>
                    <option value="low">{t('compliance.low')}</option>
                  </select>
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label={t('compliance.regulatoryReference')}>
                  <input value={form.regulatoryReference} onChange={e => handleChange('regulatoryReference', e.target.value)} disabled={isAnalyst}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] disabled:opacity-50" />
                </FormField>
                <FormField label={t('compliance.articleNumber')}>
                  <input value={form.articleNumber} onChange={e => handleChange('articleNumber', e.target.value)} disabled={isAnalyst}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] disabled:opacity-50" />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label={t('compliance.internalPolicy') + ' (AR)'}>
                  <input value={form.internalPolicyAr} onChange={e => handleChange('internalPolicyAr', e.target.value)} disabled={isAnalyst}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] disabled:opacity-50" />
                </FormField>
                <FormField label={t('compliance.policyDocumentNumber')}>
                  <input value={form.policyDocumentNumber} onChange={e => handleChange('policyDocumentNumber', e.target.value)} disabled={isAnalyst}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] disabled:opacity-50" />
                </FormField>
              </div>
            </div>
          )}

          {activeTab === 'responsibility' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label={t('compliance.responsibleDepartment') + ' (AR)'}>
                  <input value={form.responsibleDepartmentAr} onChange={e => handleChange('responsibleDepartmentAr', e.target.value)} disabled={isAnalyst}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] disabled:opacity-50" />
                </FormField>
                <FormField label={t('compliance.responsibleDepartment') + ' (EN)'}>
                  <input value={form.responsibleDepartmentEn} onChange={e => handleChange('responsibleDepartmentEn', e.target.value)} disabled={isAnalyst}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] disabled:opacity-50" />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label={t('compliance.directOwner') + ' (AR)'}>
                  <input value={form.directOwnerAr} onChange={e => handleChange('directOwnerAr', e.target.value)} disabled={isAnalyst}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] disabled:opacity-50" />
                </FormField>
                <FormField label={t('compliance.directOwner') + ' (EN)'}>
                  <input value={form.directOwnerEn} onChange={e => handleChange('directOwnerEn', e.target.value)} disabled={isAnalyst}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] disabled:opacity-50" />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label={t('compliance.backupOwner') + ' (AR)'}>
                  <input value={form.backupOwnerAr} onChange={e => handleChange('backupOwnerAr', e.target.value)} disabled={isAnalyst}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] disabled:opacity-50" />
                </FormField>
                <FormField label={t('compliance.backupOwner') + ' (EN)'}>
                  <input value={form.backupOwnerEn} onChange={e => handleChange('backupOwnerEn', e.target.value)} disabled={isAnalyst}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] disabled:opacity-50" />
                </FormField>
              </div>
              <FormField label={t('compliance.defenseLine')}>
                <select value={form.defenseLine} onChange={e => handleChange('defenseLine', e.target.value)} disabled={isAnalyst}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] disabled:opacity-50">
                  <option value="">{isAr ? 'اختر' : 'Select'}</option>
                  <option value="first">{t('compliance.firstLine')}</option>
                  <option value="second">{t('compliance.secondLine')}</option>
                  <option value="third">{t('compliance.thirdLine')}</option>
                </select>
              </FormField>
            </div>
          )}

          {activeTab === 'dates' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label={t('compliance.recurrence')}>
                  <select value={form.recurrence} onChange={e => handleChange('recurrence', e.target.value)} disabled={isAnalyst}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] disabled:opacity-50">
                    <option value="annual">{t('compliance.annual')}</option>
                    <option value="quarterly">{t('compliance.quarterly')}</option>
                    <option value="monthly">{t('compliance.monthly')}</option>
                    <option value="continuous">{t('compliance.continuous')}</option>
                    <option value="perEvent">{t('compliance.perEvent')}</option>
                    <option value="perMeeting">{t('compliance.perMeeting')}</option>
                  </select>
                </FormField>
                <FormField label={t('compliance.alertDaysBefore')}>
                  <input type="number" value={form.alertDaysBefore} onChange={e => handleChange('alertDaysBefore', parseInt(e.target.value))} disabled={isAnalyst}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] disabled:opacity-50" />
                </FormField>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <FormField label={t('compliance.nextDueDate')}>
                  <input type="date" value={form.nextDueDate} onChange={e => handleChange('nextDueDate', e.target.value)} disabled={isAnalyst}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] disabled:opacity-50" />
                </FormField>
                <FormField label={t('compliance.lastReviewDate')}>
                  <input type="date" value={form.lastReviewDate} onChange={e => handleChange('lastReviewDate', e.target.value)} disabled={isAnalyst}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] disabled:opacity-50" />
                </FormField>
                <FormField label={t('compliance.nextReviewDate')}>
                  <input type="date" value={form.nextReviewDate} onChange={e => handleChange('nextReviewDate', e.target.value)} disabled={isAnalyst}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] disabled:opacity-50" />
                </FormField>
              </div>
            </div>
          )}

          {activeTab === 'monitoring' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label={t('compliance.complianceStatus')}>
                  <select value={form.complianceStatus} onChange={e => handleChange('complianceStatus', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)]">
                    <option value="compliant">{t('compliance.compliant')}</option>
                    <option value="partiallyCompliant">{t('compliance.partiallyCompliant')}</option>
                    <option value="nonCompliant">{t('compliance.nonCompliant')}</option>
                    <option value="notAssessed">{t('compliance.notAssessed')}</option>
                  </select>
                </FormField>
                <FormField label={t('compliance.completionPercentage')}>
                  <input type="number" min="0" max="1" step="0.01" value={form.completionPercentage} onChange={e => handleChange('completionPercentage', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)]" />
                </FormField>
              </div>
              <FormField label={t('compliance.controlActivities') + ' (AR)'}>
                <textarea rows={3} value={form.controlActivitiesAr} onChange={e => handleChange('controlActivitiesAr', e.target.value)} disabled={isAnalyst}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] disabled:opacity-50" />
              </FormField>
              <div className="grid grid-cols-3 gap-4">
                <FormField label={t('compliance.testingMethod')}>
                  <select value={form.testingMethod} onChange={e => handleChange('testingMethod', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)]">
                    <option value="">{isAr ? 'اختر' : 'Select'}</option>
                    <option value="documentReview">{t('compliance.documentReview')}</option>
                    <option value="fieldInspection">{t('compliance.fieldInspection')}</option>
                    <option value="dataAnalysis">{t('compliance.dataAnalysis')}</option>
                    <option value="selfAssessment">{t('compliance.selfAssessment')}</option>
                    <option value="operationalTest">{t('compliance.operationalTest')}</option>
                    <option value="externalAudit">{t('compliance.externalAudit')}</option>
                  </select>
                </FormField>
                <FormField label={t('compliance.lastTestResult')}>
                  <select value={form.lastTestResult} onChange={e => handleChange('lastTestResult', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)]">
                    <option value="">{isAr ? 'اختر' : 'Select'}</option>
                    <option value="passed">{t('compliance.passed')}</option>
                    <option value="partial">{t('compliance.partial')}</option>
                    <option value="failed">{t('compliance.failed')}</option>
                    <option value="notTested">{t('compliance.notTested')}</option>
                  </select>
                </FormField>
                <FormField label={t('compliance.lastTestDate')}>
                  <input type="date" value={form.lastTestDate} onChange={e => handleChange('lastTestDate', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)]" />
                </FormField>
              </div>
              <FormField label={t('compliance.evidenceRequirements') + ' (AR)'}>
                <textarea rows={2} value={form.evidenceRequirementsAr} onChange={e => handleChange('evidenceRequirementsAr', e.target.value)} disabled={isAnalyst}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] disabled:opacity-50" />
              </FormField>
            </div>
          )}

          {activeTab === 'risk' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label={t('compliance.nonComplianceLikelihood')}>
                  <select value={form.nonComplianceLikelihood} onChange={e => handleChange('nonComplianceLikelihood', parseInt(e.target.value))} disabled={isAnalyst}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] disabled:opacity-50">
                    {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </FormField>
                <FormField label={t('compliance.nonComplianceImpact')}>
                  <select value={form.nonComplianceImpact} onChange={e => handleChange('nonComplianceImpact', parseInt(e.target.value))} disabled={isAnalyst}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] disabled:opacity-50">
                    {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </FormField>
              </div>
              <div className="p-4 rounded-xl bg-[var(--background-tertiary)] text-center">
                <p className="text-xs text-[var(--foreground-secondary)] mb-1">{t('compliance.riskScore')}</p>
                <p className="text-3xl font-bold text-[var(--primary)]">{form.nonComplianceLikelihood * form.nonComplianceImpact}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label={t('compliance.potentialPenalties') + ' (AR)'}>
                  <textarea rows={2} value={form.potentialPenaltiesAr} onChange={e => handleChange('potentialPenaltiesAr', e.target.value)} disabled={isAnalyst}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] disabled:opacity-50" />
                </FormField>
                <FormField label={t('compliance.potentialPenalties') + ' (EN)'}>
                  <textarea rows={2} value={form.potentialPenaltiesEn} onChange={e => handleChange('potentialPenaltiesEn', e.target.value)} disabled={isAnalyst}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] disabled:opacity-50" />
                </FormField>
              </div>
            </div>
          )}

          {activeTab === 'gap' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label={t('compliance.gapDescription') + ' (AR)'}>
                  <textarea rows={3} value={form.gapDescriptionAr} onChange={e => handleChange('gapDescriptionAr', e.target.value)} disabled={isAnalyst}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] disabled:opacity-50" />
                </FormField>
                <FormField label={t('compliance.gapDescription') + ' (EN)'}>
                  <textarea rows={3} value={form.gapDescriptionEn} onChange={e => handleChange('gapDescriptionEn', e.target.value)} disabled={isAnalyst}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] disabled:opacity-50" />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label={t('compliance.remediationPlan') + ' (AR)'}>
                  <textarea rows={3} value={form.remediationPlanAr} onChange={e => handleChange('remediationPlanAr', e.target.value)} disabled={isAnalyst}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] disabled:opacity-50" />
                </FormField>
                <FormField label={t('compliance.remediationPlan') + ' (EN)'}>
                  <textarea rows={3} value={form.remediationPlanEn} onChange={e => handleChange('remediationPlanEn', e.target.value)} disabled={isAnalyst}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] disabled:opacity-50" />
                </FormField>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <FormField label={t('compliance.remediationTargetDate')}>
                  <input type="date" value={form.remediationTargetDate} onChange={e => handleChange('remediationTargetDate', e.target.value)} disabled={isAnalyst}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] disabled:opacity-50" />
                </FormField>
                <FormField label={t('compliance.remediationOwner') + ' (AR)'}>
                  <input value={form.remediationOwnerAr} onChange={e => handleChange('remediationOwnerAr', e.target.value)} disabled={isAnalyst}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] disabled:opacity-50" />
                </FormField>
                <FormField label={t('compliance.remediationStatus')}>
                  <select value={form.remediationStatus} onChange={e => handleChange('remediationStatus', e.target.value)} disabled={isAnalyst}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] disabled:opacity-50">
                    <option value="notApplicable">{t('compliance.notApplicable')}</option>
                    <option value="notStarted">{t('compliance.notStarted')}</option>
                    <option value="inProgress">{t('compliance.inProgress')}</option>
                    <option value="completed">{t('compliance.completed')}</option>
                  </select>
                </FormField>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label={t('compliance.kpiKri') + ' (AR)'}>
                  <textarea rows={3} value={form.kpiKriAr} onChange={e => handleChange('kpiKriAr', e.target.value)} disabled={isAnalyst}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] disabled:opacity-50" />
                </FormField>
                <FormField label={t('compliance.kpiKri') + ' (EN)'}>
                  <textarea rows={3} value={form.kpiKriEn} onChange={e => handleChange('kpiKriEn', e.target.value)} disabled={isAnalyst}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] disabled:opacity-50" />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label={t('compliance.notes') + ' (AR)'}>
                  <textarea rows={4} value={form.notesAr} onChange={e => handleChange('notesAr', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)]" />
                </FormField>
                <FormField label={t('compliance.notes') + ' (EN)'}>
                  <textarea rows={4} value={form.notesEn} onChange={e => handleChange('notesEn', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)]" />
                </FormField>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)]">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-[var(--foreground-secondary)] hover:bg-[var(--background-tertiary)] transition-colors">
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
          >
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? t('compliance.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Helper Components ---
function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-[var(--foreground-secondary)] mb-1 block">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)] bg-[var(--background-secondary)]">
        <span className="text-[var(--primary)]">{icon}</span>
        <h2 className="text-sm font-semibold text-[var(--foreground)]">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Field({ label, value, multiline }: { label: string; value: string | null | undefined; multiline?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium text-[var(--foreground-secondary)] mb-1">{label}</p>
      {multiline ? (
        <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap">{value || '-'}</p>
      ) : (
        <p className="text-sm text-[var(--foreground)]">{value || '-'}</p>
      )}
    </div>
  );
}

function InfoCard({
  icon, label, value, sublabel, color, progress
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel?: string;
  color: string;
  progress?: number;
}) {
  const colorMap: Record<string, string> = {
    indigo: 'from-indigo-500 to-indigo-600',
    red: 'from-red-500 to-red-600',
    orange: 'from-orange-500 to-orange-600',
    yellow: 'from-yellow-500 to-yellow-600',
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
  };

  return (
    <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background)]">
      <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${colorMap[color] || colorMap.indigo} text-white mb-2`}>
        {icon}
      </div>
      <p className="text-xs text-[var(--foreground-secondary)]">{label}</p>
      <p className="text-lg font-bold text-[var(--foreground)]">{value}</p>
      {sublabel && <p className="text-[10px] text-[var(--foreground-secondary)] mt-0.5">{sublabel}</p>}
      {progress !== undefined && (
        <div className="mt-2 h-2 bg-[var(--border)] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${colorMap[color] || colorMap.indigo} transition-all`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
