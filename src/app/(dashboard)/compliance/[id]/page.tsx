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
  const canManageLinks = effectiveRole && ['admin', 'riskManager', 'riskAnalyst'].includes(effectiveRole);

  const [obligation, setObligation] = useState<ObligationDetail | null>(null);
  const [loading, setLoading] = useState(true);

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
    <div className="max-w-[1400px] mx-auto space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
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

      {/* Main content in sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Regulatory Reference */}
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

          {/* Responsibility */}
          <Section title={t('compliance.responsibility')} icon={<User className="h-5 w-5" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label={t('compliance.responsibleDepartment')} value={isAr ? obligation.responsibleDepartmentAr : obligation.responsibleDepartmentEn} />
              <Field label={t('compliance.directOwner')} value={isAr ? obligation.directOwnerAr : obligation.directOwnerEn} />
              <Field label={t('compliance.backupOwner')} value={isAr ? obligation.backupOwnerAr : obligation.backupOwnerEn} />
              <Field label={t('compliance.defenseLine')} value={obligation.defenseLine ? t(`compliance.${obligation.defenseLine.replace(' ', '')}Line` as 'compliance.firstLine') : null} />
            </div>
          </Section>

          {/* Control Activities & Testing */}
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

          {/* Gap Analysis & Remediation */}
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

          {/* Risk Assessment */}
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

        {/* Right column - 1/3 width */}
        <div className="space-y-6">
          {/* Linked Risks */}
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

          {/* Assessments */}
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

          {/* KPIs & Notes */}
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

          {/* Change Log */}
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
  );
}

// Helper components
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
