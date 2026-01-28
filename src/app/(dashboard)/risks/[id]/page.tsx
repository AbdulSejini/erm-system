'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RiskDiscussion } from '@/components/RiskDiscussion';
import {
  ArrowLeft,
  ArrowRight,
  Edit,
  Trash2,
  AlertTriangle,
  Building2,
  User,
  Calendar,
  Clock,
  FileText,
  Shield,
  Target,
  TrendingUp,
  CheckCircle,
  XCircle,
  Loader2,
  MessageSquare,
  Activity,
  Layers,
  BookOpen,
  Printer,
  X,
  ClipboardList,
  ListChecks,
  History,
  Plus,
  Minus,
  PenLine,
  Wrench,
} from 'lucide-react';
import type { RiskRating } from '@/types';

interface TreatmentTask {
  id: string;
  titleAr: string;
  titleEn: string;
  status: string;
  dueDate: string;
  completedDate: string | null;
}

interface TreatmentPlan {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  strategy: string;
  status: string;
  startDate: string;
  dueDate: string;
  completionDate: string | null;
  progress: number;
  cost: number | null;
  responsible?: {
    id: string;
    fullName: string;
    fullNameEn: string | null;
  };
  tasks: TreatmentTask[];
}

interface RiskAssessment {
  id: string;
  assessmentType: string;
  likelihood: number;
  impact: number;
  score: number;
  rating: string;
  notesAr: string | null;
  notesEn: string | null;
  assessmentDate: string;
  assessedBy?: {
    id: string;
    fullName: string;
    fullNameEn: string | null;
  };
}

interface ChangeLogEntry {
  id: string;
  changeType: string;
  changeCategory: string;
  fieldName: string | null;
  fieldNameAr: string | null;
  oldValue: string | null;
  newValue: string | null;
  description: string | null;
  descriptionAr: string | null;
  relatedEntityId: string | null;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    fullNameEn: string | null;
    avatar: string | null;
    role: string;
  };
}

interface RiskDetail {
  id: string;
  riskNumber: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  processText: string | null;
  subProcessText: string | null;
  potentialCauseAr: string | null;
  potentialCauseEn: string | null;
  potentialImpactAr: string | null;
  potentialImpactEn: string | null;
  inherentLikelihood: number;
  inherentImpact: number;
  inherentScore: number;
  inherentRating: string;
  residualLikelihood: number | null;
  residualImpact: number | null;
  residualScore: number | null;
  residualRating: string | null;
  mitigationActionsAr: string | null;
  mitigationActionsEn: string | null;
  status: string;
  approvalStatus: string;
  followUpDate: string | null;
  nextReviewDate: string | null;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    code: string;
    nameAr: string;
    nameEn: string;
    color?: string;
  } | null;
  department?: {
    id: string;
    code: string;
    nameAr: string;
    nameEn: string;
  };
  source?: {
    id: string;
    code: string;
    nameAr: string;
    nameEn: string;
  } | null;
  riskOwner?: {
    id: string;
    fullName: string;
    fullNameEn: string | null;
    department?: {
      nameAr: string;
      nameEn: string;
    } | null;
  } | null;
  owner?: {
    id: string;
    fullName: string;
    fullNameEn: string | null;
  };
  champion?: {
    id: string;
    fullName: string;
    fullNameEn: string | null;
  } | null;
  treatments?: TreatmentPlan[];
  assessments?: RiskAssessment[];
}

// Mock current user - في التطبيق الفعلي سيأتي من الجلسة
const currentUser = {
  id: 'user-1',
  role: 'admin',
};

export default function RiskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t, language } = useTranslation();
  const isAr = language === 'ar';

  const [risk, setRisk] = useState<RiskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'discussion' | 'history'>('details');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [changeLogs, setChangeLogs] = useState<ChangeLogEntry[]>([]);
  const [changeLogsLoading, setChangeLogsLoading] = useState(false);

  // جلب بيانات الخطر
  useEffect(() => {
    const fetchRisk = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/risks/${params.id}`);
        const result = await response.json();

        if (result.success) {
          setRisk(result.data);
        } else {
          setError(result.error || 'فشل في جلب بيانات الخطر');
        }
      } catch (err) {
        console.error('Error fetching risk:', err);
        setError('حدث خطأ في الاتصال');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchRisk();
    }
  }, [params.id]);

  // جلب سجل التعديلات عند النقر على تبويب السجل
  useEffect(() => {
    const fetchChangeLogs = async () => {
      if (activeTab !== 'history' || !params.id) return;

      try {
        setChangeLogsLoading(true);
        const response = await fetch(`/api/risks/${params.id}/changelog`);
        const result = await response.json();

        if (result.success) {
          setChangeLogs(result.data.logs);
        }
      } catch (err) {
        console.error('Error fetching change logs:', err);
      } finally {
        setChangeLogsLoading(false);
      }
    };

    fetchChangeLogs();
  }, [activeTab, params.id]);

  // الحصول على لون التصنيف
  const getRatingColor = (rating: string | null): string => {
    switch (rating) {
      case 'Critical':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Major':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Moderate':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Minor':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Negligible':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // الحصول على لون الحالة
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-700';
      case 'inProgress':
        return 'bg-yellow-100 text-yellow-700';
      case 'mitigated':
        return 'bg-green-100 text-green-700';
      case 'closed':
        return 'bg-gray-100 text-gray-700';
      case 'accepted':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // الحصول على اسم الحالة
  const getStatusName = (status: string): string => {
    const statuses: Record<string, { ar: string; en: string }> = {
      open: { ar: 'مفتوح', en: 'Open' },
      inProgress: { ar: 'قيد المعالجة', en: 'In Progress' },
      mitigated: { ar: 'تم التخفيف', en: 'Mitigated' },
      closed: { ar: 'مغلق', en: 'Closed' },
      accepted: { ar: 'مقبول', en: 'Accepted' },
    };
    return isAr ? statuses[status]?.ar || status : statuses[status]?.en || status;
  };

  // الحصول على اسم حالة الموافقة
  const getApprovalStatusName = (status: string): string => {
    const statuses: Record<string, { ar: string; en: string }> = {
      Approved: { ar: 'معتمد', en: 'Approved' },
      Draft: { ar: 'مسودة', en: 'Draft' },
      Future: { ar: 'مستقبلي', en: 'Future' },
      'N/A': { ar: 'غير متاح', en: 'N/A' },
      Sent: { ar: 'مرسل', en: 'Sent' },
      'Under Discussing': { ar: 'قيد المناقشة', en: 'Under Discussion' },
    };
    return isAr ? statuses[status]?.ar || status : statuses[status]?.en || status;
  };

  // الحصول على اسم التصنيف
  const getRatingName = (rating: string | null): string => {
    if (!rating) return isAr ? 'غير محدد' : 'Not Set';
    const ratings: Record<string, { ar: string; en: string }> = {
      Critical: { ar: 'حرج', en: 'Critical' },
      Major: { ar: 'رئيسي', en: 'Major' },
      Moderate: { ar: 'متوسط', en: 'Moderate' },
      Minor: { ar: 'ثانوي', en: 'Minor' },
      Negligible: { ar: 'ضئيل', en: 'Negligible' },
    };
    return isAr ? ratings[rating]?.ar || rating : ratings[rating]?.en || rating;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (error || !risk) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <XCircle className="h-16 w-16 text-red-500" />
        <h2 className="text-xl font-semibold text-[var(--foreground)]">
          {error || (isAr ? 'الخطر غير موجود' : 'Risk not found')}
        </h2>
        <Button onClick={() => router.push('/risks')} variant="outline">
          {isAr ? 'العودة للقائمة' : 'Back to List'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/risks">
            <Button variant="ghost" size="sm" className="rounded-xl">
              {isAr ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <code className="text-sm bg-[var(--background-tertiary)] px-2 py-1 rounded-lg font-mono">
                {risk.riskNumber}
              </code>
              <span className={`text-xs px-2 py-1 rounded-full border ${getRatingColor(risk.inherentRating)}`}>
                {getRatingName(risk.inherentRating)}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] mt-1">
              {isAr ? risk.titleAr : risk.titleEn}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            leftIcon={<Printer className="h-4 w-4" />}
            onClick={() => setShowPrintModal(true)}
          >
            {isAr ? 'طباعة' : 'Print'}
          </Button>
          <Button variant="outline" size="sm" className="rounded-xl" leftIcon={<Edit className="h-4 w-4" />}>
            {isAr ? 'تعديل' : 'Edit'}
          </Button>
          <Button variant="outline" size="sm" className="rounded-xl text-red-600 hover:bg-red-50" leftIcon={<Trash2 className="h-4 w-4" />}>
            {isAr ? 'حذف' : 'Delete'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--border)]">
        <button
          onClick={() => setActiveTab('details')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'details'
              ? 'border-[var(--primary)] text-[var(--primary)]'
              : 'border-transparent text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
          }`}
        >
          <FileText className="h-4 w-4 inline-block me-2" />
          {isAr ? 'التفاصيل' : 'Details'}
        </button>
        <button
          onClick={() => setActiveTab('discussion')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'discussion'
              ? 'border-[var(--primary)] text-[var(--primary)]'
              : 'border-transparent text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
          }`}
        >
          <MessageSquare className="h-4 w-4 inline-block me-2" />
          {isAr ? 'المحادثات' : 'Discussion'}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-[var(--primary)] text-[var(--primary)]'
              : 'border-transparent text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
          }`}
        >
          <Activity className="h-4 w-4 inline-block me-2" />
          {isAr ? 'السجل' : 'History'}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description Card */}
            <Card className="rounded-2xl border border-[var(--border)] shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-[var(--primary)]" />
                  {isAr ? 'وصف الخطر' : 'Risk Description'}
                </h3>
                <p className="text-[var(--foreground)] whitespace-pre-wrap leading-relaxed">
                  {isAr ? risk.descriptionAr : risk.descriptionEn}
                </p>

                {/* Process Info */}
                {(risk.processText || risk.subProcessText) && (
                  <div className="mt-6 pt-6 border-t border-[var(--border)]">
                    <div className="grid gap-4 sm:grid-cols-2">
                      {risk.processText && (
                        <div>
                          <p className="text-sm text-[var(--foreground-secondary)]">{isAr ? 'العملية' : 'Process'}</p>
                          <p className="font-medium text-[var(--foreground)]">{risk.processText}</p>
                        </div>
                      )}
                      {risk.subProcessText && (
                        <div>
                          <p className="text-sm text-[var(--foreground-secondary)]">{isAr ? 'العملية الفرعية' : 'Sub Process'}</p>
                          <p className="font-medium text-[var(--foreground)]">{risk.subProcessText}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Risk Assessment Card */}
            <Card className="rounded-2xl border border-[var(--border)] shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-[var(--primary)]" />
                  {isAr ? 'تقييم الخطر' : 'Risk Assessment'}
                </h3>

                <div className="grid gap-6 sm:grid-cols-2">
                  {/* Inherent Risk */}
                  <div className="p-4 rounded-xl bg-[var(--background-tertiary)]">
                    <h4 className="font-medium text-[var(--foreground)] mb-3">{isAr ? 'الخطر الأصلي' : 'Inherent Risk'}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-[var(--foreground-secondary)]">{isAr ? 'الاحتمالية' : 'Likelihood'}</span>
                        <span className="font-medium">{risk.inherentLikelihood}/5</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-[var(--foreground-secondary)]">{isAr ? 'التأثير' : 'Impact'}</span>
                        <span className="font-medium">{risk.inherentImpact}/5</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-[var(--border)]">
                        <span className="text-sm text-[var(--foreground-secondary)]">{isAr ? 'الدرجة' : 'Score'}</span>
                        <span className="font-bold text-lg">{risk.inherentScore}</span>
                      </div>
                      <div className="flex justify-center pt-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRatingColor(risk.inherentRating)}`}>
                          {getRatingName(risk.inherentRating)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Residual Risk */}
                  <div className="p-4 rounded-xl bg-[var(--background-tertiary)]">
                    <h4 className="font-medium text-[var(--foreground)] mb-3">{isAr ? 'الخطر المتبقي' : 'Residual Risk'}</h4>
                    {risk.residualScore ? (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-[var(--foreground-secondary)]">{isAr ? 'الاحتمالية' : 'Likelihood'}</span>
                          <span className="font-medium">{risk.residualLikelihood}/5</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-[var(--foreground-secondary)]">{isAr ? 'التأثير' : 'Impact'}</span>
                          <span className="font-medium">{risk.residualImpact}/5</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-[var(--border)]">
                          <span className="text-sm text-[var(--foreground-secondary)]">{isAr ? 'الدرجة' : 'Score'}</span>
                          <span className="font-bold text-lg">{risk.residualScore}</span>
                        </div>
                        <div className="flex justify-center pt-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRatingColor(risk.residualRating)}`}>
                            {getRatingName(risk.residualRating)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-[var(--foreground-muted)]">
                        {isAr ? 'لم يتم تقييمه بعد' : 'Not assessed yet'}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mitigation Actions */}
            {(risk.mitigationActionsAr || risk.mitigationActionsEn) && (
              <Card className="rounded-2xl border border-[var(--border)] shadow-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-[var(--primary)]" />
                    {isAr ? 'إجراءات التخفيف' : 'Mitigation Actions'}
                  </h3>
                  <p className="text-[var(--foreground)] whitespace-pre-wrap">
                    {isAr ? risk.mitigationActionsAr : risk.mitigationActionsEn}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card className="rounded-2xl border border-[var(--border)] shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">{isAr ? 'الحالة' : 'Status'}</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-[var(--foreground-secondary)]">{isAr ? 'حالة الخطر' : 'Risk Status'}</p>
                    <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(risk.status)}`}>
                      {getStatusName(risk.status)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--foreground-secondary)]">{isAr ? 'حالة الموافقة' : 'Approval Status'}</p>
                    <span className="inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
                      {getApprovalStatusName(risk.approvalStatus)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="rounded-2xl border border-[var(--border)] shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">{isAr ? 'معلومات' : 'Information'}</h3>
                <div className="space-y-4">
                  {/* Department */}
                  {risk.department && (
                    <div className="flex items-start gap-3">
                      <Building2 className="h-5 w-5 text-[var(--foreground-muted)] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-[var(--foreground-secondary)]">{isAr ? 'الإدارة' : 'Department'}</p>
                        <p className="font-medium text-[var(--foreground)]">
                          {isAr ? risk.department.nameAr : risk.department.nameEn}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Category */}
                  {risk.category && (
                    <div className="flex items-start gap-3">
                      <Layers className="h-5 w-5 text-[var(--foreground-muted)] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-[var(--foreground-secondary)]">{isAr ? 'التصنيف' : 'Category'}</p>
                        <p className="font-medium text-[var(--foreground)]">
                          {isAr ? risk.category.nameAr : risk.category.nameEn}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Source */}
                  {risk.source && (
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-[var(--foreground-muted)] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-[var(--foreground-secondary)]">{isAr ? 'المصدر' : 'Source'}</p>
                        <p className="font-medium text-[var(--foreground)]">
                          {isAr ? risk.source.nameAr : risk.source.nameEn}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Risk Owner */}
                  {risk.riskOwner && (
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-[var(--foreground-muted)] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-[var(--foreground-secondary)]">{isAr ? 'مالك الخطر' : 'Risk Owner'}</p>
                        <p className="font-medium text-[var(--foreground)]">
                          {isAr ? risk.riskOwner.fullName : risk.riskOwner.fullNameEn || risk.riskOwner.fullName}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Champion */}
                  {risk.champion && (
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-[var(--foreground-muted)] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-[var(--foreground-secondary)]">{isAr ? 'رائد الخطر' : 'Risk Champion'}</p>
                        <p className="font-medium text-[var(--foreground)]">
                          {isAr ? risk.champion.fullName : risk.champion.fullNameEn || risk.champion.fullName}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Dates Card */}
            <Card className="rounded-2xl border border-[var(--border)] shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">{isAr ? 'التواريخ' : 'Dates'}</h3>
                <div className="space-y-4">
                  {risk.followUpDate && (
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-[var(--foreground-muted)] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-[var(--foreground-secondary)]">{isAr ? 'تاريخ المتابعة' : 'Follow-up Date'}</p>
                        <p className="font-medium text-[var(--foreground)]">
                          {new Date(risk.followUpDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                        </p>
                      </div>
                    </div>
                  )}
                  {risk.nextReviewDate && (
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-[var(--foreground-muted)] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-[var(--foreground-secondary)]">{isAr ? 'تاريخ المراجعة' : 'Review Date'}</p>
                        <p className="font-medium text-[var(--foreground)]">
                          {new Date(risk.nextReviewDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-[var(--foreground-muted)] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-[var(--foreground-secondary)]">{isAr ? 'تاريخ الإنشاء' : 'Created'}</p>
                      <p className="font-medium text-[var(--foreground)]">
                        {new Date(risk.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'discussion' && (
        <RiskDiscussion
          riskId={risk.id}
          currentUserId={currentUser.id}
          currentUserRole={currentUser.role}
        />
      )}

      {activeTab === 'history' && (
        <Card className="rounded-2xl border border-[var(--border)] shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
              <History className="h-5 w-5 text-[var(--primary)]" />
              {isAr ? 'سجل التعديلات' : 'Change Log'}
            </h3>

            {changeLogsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
              </div>
            ) : changeLogs.length === 0 ? (
              <div className="text-center py-8 text-[var(--foreground-muted)]">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>{isAr ? 'لا توجد تعديلات مسجلة' : 'No changes recorded yet'}</p>
              </div>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute start-[18px] top-0 bottom-0 w-0.5 bg-[var(--border)]" />

                <div className="space-y-6">
                  {changeLogs.map((log, index) => (
                    <div key={log.id} className="relative flex gap-4">
                      {/* Timeline dot */}
                      <div className={`relative z-10 flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                        log.changeType === 'treatment_add' ? 'bg-green-100 text-green-600' :
                        log.changeType === 'treatment_delete' ? 'bg-red-100 text-red-600' :
                        log.changeType === 'treatment_update' ? 'bg-blue-100 text-blue-600' :
                        log.changeCategory === 'assessment' ? 'bg-purple-100 text-purple-600' :
                        log.changeCategory === 'status' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-[var(--primary-light)] text-[var(--primary)]'
                      }`}>
                        {log.changeType === 'treatment_add' ? <Plus className="h-4 w-4" /> :
                         log.changeType === 'treatment_delete' ? <Minus className="h-4 w-4" /> :
                         log.changeType === 'treatment_update' ? <Wrench className="h-4 w-4" /> :
                         log.changeCategory === 'assessment' ? <Target className="h-4 w-4" /> :
                         log.changeCategory === 'status' ? <Activity className="h-4 w-4" /> :
                         <PenLine className="h-4 w-4" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 bg-[var(--card)] rounded-xl border border-[var(--border)] p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-[var(--foreground)]">
                              {isAr ? log.descriptionAr : log.description}
                            </p>
                            {log.fieldNameAr && (
                              <p className="text-sm text-[var(--foreground-secondary)] mt-1">
                                {isAr ? log.fieldNameAr : log.fieldName}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-[var(--foreground-muted)] whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {/* Value change display */}
                        {(log.oldValue || log.newValue) && log.changeType === 'update' && (
                          <div className="mt-3 flex items-center gap-2 text-sm">
                            {log.oldValue && (
                              <span className="px-2 py-1 rounded bg-red-50 text-red-700 line-through max-w-[200px] truncate">
                                {log.oldValue}
                              </span>
                            )}
                            <ArrowRight className="h-4 w-4 text-[var(--foreground-muted)]" />
                            {log.newValue && (
                              <span className="px-2 py-1 rounded bg-green-50 text-green-700 max-w-[200px] truncate">
                                {log.newValue}
                              </span>
                            )}
                          </div>
                        )}

                        {/* User info */}
                        <div className="mt-3 flex items-center gap-2 text-sm text-[var(--foreground-secondary)]">
                          <div className="w-6 h-6 rounded-full bg-[var(--primary-light)] flex items-center justify-center">
                            <User className="h-3 w-3 text-[var(--primary)]" />
                          </div>
                          <span>{isAr ? log.user.fullName : log.user.fullNameEn || log.user.fullName}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Print Modal */}
      {showPrintModal && (
        <PrintRiskModal
          risk={risk}
          isAr={isAr}
          onClose={() => setShowPrintModal(false)}
          getRatingColor={getRatingColor}
          getRatingName={getRatingName}
          getStatusName={getStatusName}
          getApprovalStatusName={getApprovalStatusName}
        />
      )}
    </div>
  );
}

// Brand Colors - شركة الكابلات السعودية
const brandColors = {
  primary: '#F39200',
  primaryLight: '#F3920020',
  dark: '#2E2D2C',
  darkLight: '#2E2D2C20',
};

// Print Modal Component
function PrintRiskModal({
  risk,
  isAr,
  onClose,
  getRatingColor,
  getRatingName,
  getStatusName,
  getApprovalStatusName,
}: {
  risk: RiskDetail;
  isAr: boolean;
  onClose: () => void;
  getRatingColor: (rating: string | null) => string;
  getRatingName: (rating: string | null) => string;
  getStatusName: (status: string) => string;
  getApprovalStatusName: (status: string) => string;
}) {
  const handlePrint = () => {
    window.print();
  };

  const getStrategyName = (strategy: string) => {
    const strategies: Record<string, { ar: string; en: string }> = {
      avoid: { ar: 'تجنب', en: 'Avoid' },
      reduce: { ar: 'تخفيض', en: 'Reduce' },
      transfer: { ar: 'نقل', en: 'Transfer' },
      accept: { ar: 'قبول', en: 'Accept' },
    };
    return isAr ? strategies[strategy]?.ar || strategy : strategies[strategy]?.en || strategy;
  };

  const getTreatmentStatusName = (status: string) => {
    const statuses: Record<string, { ar: string; en: string }> = {
      notStarted: { ar: 'لم يبدأ', en: 'Not Started' },
      inProgress: { ar: 'قيد التنفيذ', en: 'In Progress' },
      completed: { ar: 'مكتمل', en: 'Completed' },
      overdue: { ar: 'متأخر', en: 'Overdue' },
      cancelled: { ar: 'ملغي', en: 'Cancelled' },
    };
    return isAr ? statuses[status]?.ar || status : statuses[status]?.en || status;
  };

  const getTaskStatusName = (status: string) => {
    const statuses: Record<string, { ar: string; en: string }> = {
      pending: { ar: 'معلق', en: 'Pending' },
      inProgress: { ar: 'قيد التنفيذ', en: 'In Progress' },
      completed: { ar: 'مكتمل', en: 'Completed' },
      cancelled: { ar: 'ملغي', en: 'Cancelled' },
    };
    return isAr ? statuses[status]?.ar || status : statuses[status]?.en || status;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto py-4 print:bg-white print:p-0">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 print:shadow-none print:rounded-none print:max-w-full print:mx-0">
        {/* Header - Hidden in Print */}
        <div className="flex items-center justify-between p-4 border-b print:hidden" style={{ borderColor: brandColors.dark + '20' }}>
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: brandColors.dark }}>
            <Printer className="h-5 w-5" style={{ color: brandColors.primary }} />
            {isAr ? 'معاينة الطباعة' : 'Print Preview'}
          </h2>
          <div className="flex items-center gap-2">
            <Button onClick={handlePrint} leftIcon={<Printer className="h-4 w-4" />} style={{ backgroundColor: brandColors.primary }}>
              {isAr ? 'طباعة' : 'Print'}
            </Button>
            <Button variant="ghost" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Print Content */}
        <div className="p-6 print:p-8" dir={isAr ? 'rtl' : 'ltr'}>
          {/* Company Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b-2" style={{ borderColor: brandColors.primary }}>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: brandColors.dark }}>
                {isAr ? 'تقرير الخطر' : 'Risk Report'}
              </h1>
              <p className="text-sm text-gray-500">{isAr ? 'نظام إدارة المخاطر المؤسسية' : 'Enterprise Risk Management System'}</p>
            </div>
            <div className="text-end">
              <p className="font-bold" style={{ color: brandColors.primary }}>
                {isAr ? 'شركة الكابلات السعودية' : 'Saudi Cable Company'}
              </p>
              <p className="text-xs text-gray-500">
                {new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Risk Header */}
          <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: brandColors.primaryLight }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <code className="text-lg font-bold px-3 py-1 rounded" style={{ backgroundColor: brandColors.primary, color: 'white' }}>
                  {risk.riskNumber}
                </code>
                <h2 className="text-xl font-bold mt-2" style={{ color: brandColors.dark }}>
                  {isAr ? risk.titleAr : risk.titleEn}
                </h2>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRatingColor(risk.inherentRating)}`}>
                  {getRatingName(risk.inherentRating)}
                </span>
                <span className="text-sm px-3 py-1 rounded-full bg-gray-100">
                  {getStatusName(risk.status)}
                </span>
              </div>
            </div>
          </div>

          {/* Basic Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {risk.department && (
              <div className="p-3 rounded-lg border" style={{ borderColor: brandColors.dark + '20' }}>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {isAr ? 'الإدارة' : 'Department'}
                </p>
                <p className="font-medium" style={{ color: brandColors.dark }}>
                  {isAr ? risk.department.nameAr : risk.department.nameEn}
                </p>
              </div>
            )}
            {risk.category && (
              <div className="p-3 rounded-lg border" style={{ borderColor: brandColors.dark + '20' }}>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Layers className="h-3 w-3" />
                  {isAr ? 'التصنيف' : 'Category'}
                </p>
                <p className="font-medium" style={{ color: brandColors.dark }}>
                  {isAr ? risk.category.nameAr : risk.category.nameEn}
                </p>
              </div>
            )}
            {risk.riskOwner && (
              <div className="p-3 rounded-lg border" style={{ borderColor: brandColors.dark + '20' }}>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {isAr ? 'مالك الخطر' : 'Risk Owner'}
                </p>
                <p className="font-medium" style={{ color: brandColors.dark }}>
                  {isAr ? risk.riskOwner.fullName : risk.riskOwner.fullNameEn || risk.riskOwner.fullName}
                </p>
              </div>
            )}
            {risk.champion && (
              <div className="p-3 rounded-lg border" style={{ borderColor: brandColors.dark + '20' }}>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  {isAr ? 'رائد الخطر' : 'Risk Champion'}
                </p>
                <p className="font-medium" style={{ color: brandColors.dark }}>
                  {isAr ? risk.champion.fullName : risk.champion.fullNameEn || risk.champion.fullName}
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color: brandColors.dark }}>
              <BookOpen className="h-4 w-4" style={{ color: brandColors.primary }} />
              {isAr ? 'وصف الخطر' : 'Risk Description'}
            </h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap p-3 rounded-lg bg-gray-50">
              {isAr ? risk.descriptionAr : risk.descriptionEn}
            </p>
          </div>

          {/* Potential Cause & Impact */}
          {(risk.potentialCauseAr || risk.potentialImpactAr) && (
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {(risk.potentialCauseAr || risk.potentialCauseEn) && (
                <div>
                  <h3 className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color: brandColors.dark }}>
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    {isAr ? 'الأسباب المحتملة' : 'Potential Causes'}
                  </h3>
                  <p className="text-sm text-gray-700 p-3 rounded-lg bg-orange-50">
                    {isAr ? risk.potentialCauseAr : risk.potentialCauseEn}
                  </p>
                </div>
              )}
              {(risk.potentialImpactAr || risk.potentialImpactEn) && (
                <div>
                  <h3 className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color: brandColors.dark }}>
                    <Target className="h-4 w-4 text-red-500" />
                    {isAr ? 'التأثير المحتمل' : 'Potential Impact'}
                  </h3>
                  <p className="text-sm text-gray-700 p-3 rounded-lg bg-red-50">
                    {isAr ? risk.potentialImpactAr : risk.potentialImpactEn}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Risk Assessment */}
          <div className="mb-6">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: brandColors.dark }}>
              <Target className="h-4 w-4" style={{ color: brandColors.primary }} />
              {isAr ? 'تقييم الخطر' : 'Risk Assessment'}
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Inherent Risk */}
              <div className="p-4 rounded-lg border-2" style={{ borderColor: brandColors.primary }}>
                <h4 className="font-bold mb-3" style={{ color: brandColors.primary }}>
                  {isAr ? 'الخطر الأصلي (الكامن)' : 'Inherent Risk'}
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded bg-gray-50">
                    <p className="text-xs text-gray-500">{isAr ? 'الاحتمالية' : 'Likelihood'}</p>
                    <p className="text-xl font-bold" style={{ color: brandColors.dark }}>{risk.inherentLikelihood}</p>
                  </div>
                  <div className="p-2 rounded bg-gray-50">
                    <p className="text-xs text-gray-500">{isAr ? 'التأثير' : 'Impact'}</p>
                    <p className="text-xl font-bold" style={{ color: brandColors.dark }}>{risk.inherentImpact}</p>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: brandColors.primaryLight }}>
                    <p className="text-xs text-gray-500">{isAr ? 'الدرجة' : 'Score'}</p>
                    <p className="text-xl font-bold" style={{ color: brandColors.primary }}>{risk.inherentScore}</p>
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <span className={`px-4 py-1 rounded-full text-sm font-medium border ${getRatingColor(risk.inherentRating)}`}>
                    {getRatingName(risk.inherentRating)}
                  </span>
                </div>
              </div>

              {/* Residual Risk */}
              <div className="p-4 rounded-lg border-2 border-gray-200">
                <h4 className="font-bold mb-3 text-gray-600">
                  {isAr ? 'الخطر المتبقي' : 'Residual Risk'}
                </h4>
                {risk.residualScore ? (
                  <>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded bg-gray-50">
                        <p className="text-xs text-gray-500">{isAr ? 'الاحتمالية' : 'Likelihood'}</p>
                        <p className="text-xl font-bold" style={{ color: brandColors.dark }}>{risk.residualLikelihood}</p>
                      </div>
                      <div className="p-2 rounded bg-gray-50">
                        <p className="text-xs text-gray-500">{isAr ? 'التأثير' : 'Impact'}</p>
                        <p className="text-xl font-bold" style={{ color: brandColors.dark }}>{risk.residualImpact}</p>
                      </div>
                      <div className="p-2 rounded bg-green-50">
                        <p className="text-xs text-gray-500">{isAr ? 'الدرجة' : 'Score'}</p>
                        <p className="text-xl font-bold text-green-600">{risk.residualScore}</p>
                      </div>
                    </div>
                    <div className="mt-3 text-center">
                      <span className={`px-4 py-1 rounded-full text-sm font-medium border ${getRatingColor(risk.residualRating)}`}>
                        {getRatingName(risk.residualRating)}
                      </span>
                    </div>
                    {/* Risk Reduction */}
                    {risk.inherentScore && risk.residualScore && (
                      <div className="mt-3 p-2 rounded bg-green-50 text-center">
                        <p className="text-xs text-green-600">
                          {isAr ? 'نسبة التخفيض' : 'Risk Reduction'}:
                          <span className="font-bold ms-1">
                            {Math.round((1 - risk.residualScore / risk.inherentScore) * 100)}%
                          </span>
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    {isAr ? 'لم يتم تقييمه بعد' : 'Not assessed yet'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mitigation Actions */}
          {(risk.mitigationActionsAr || risk.mitigationActionsEn) && (
            <div className="mb-6">
              <h3 className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color: brandColors.dark }}>
                <Shield className="h-4 w-4" style={{ color: brandColors.primary }} />
                {isAr ? 'إجراءات التخفيف' : 'Mitigation Actions'}
              </h3>
              <p className="text-sm text-gray-700 p-3 rounded-lg bg-blue-50 whitespace-pre-wrap">
                {isAr ? risk.mitigationActionsAr : risk.mitigationActionsEn}
              </p>
            </div>
          )}

          {/* Treatment Plans */}
          {risk.treatments && risk.treatments.length > 0 && (
            <div className="mb-6 print:break-before-page">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: brandColors.dark }}>
                <ClipboardList className="h-4 w-4" style={{ color: brandColors.primary }} />
                {isAr ? 'خطط المعالجة' : 'Treatment Plans'}
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-gray-100">
                  {risk.treatments.length}
                </span>
              </h3>

              <div className="space-y-4">
                {risk.treatments.map((plan, index) => (
                  <div key={plan.id} className="border rounded-lg overflow-hidden" style={{ borderColor: brandColors.dark + '30' }}>
                    {/* Plan Header */}
                    <div className="p-3 flex items-center justify-between" style={{ backgroundColor: brandColors.darkLight }}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: brandColors.primary, color: 'white' }}>
                          {index + 1}
                        </span>
                        <span className="font-medium" style={{ color: brandColors.dark }}>
                          {isAr ? plan.titleAr : plan.titleEn}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white">
                          {getStrategyName(plan.strategy)}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          plan.status === 'completed' ? 'bg-green-100 text-green-700' :
                          plan.status === 'inProgress' ? 'bg-yellow-100 text-yellow-700' :
                          plan.status === 'overdue' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {getTreatmentStatusName(plan.status)}
                        </span>
                      </div>
                    </div>

                    {/* Plan Content */}
                    <div className="p-3">
                      <p className="text-sm text-gray-600 mb-3">
                        {isAr ? plan.descriptionAr : plan.descriptionEn}
                      </p>

                      {/* Plan Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-3">
                        <div className="p-2 rounded bg-gray-50">
                          <p className="text-gray-500">{isAr ? 'المسؤول' : 'Responsible'}</p>
                          <p className="font-medium">
                            {plan.responsible ? (isAr ? plan.responsible.fullName : plan.responsible.fullNameEn || plan.responsible.fullName) : '-'}
                          </p>
                        </div>
                        <div className="p-2 rounded bg-gray-50">
                          <p className="text-gray-500">{isAr ? 'تاريخ البدء' : 'Start Date'}</p>
                          <p className="font-medium">
                            {new Date(plan.startDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                          </p>
                        </div>
                        <div className="p-2 rounded bg-gray-50">
                          <p className="text-gray-500">{isAr ? 'تاريخ الاستحقاق' : 'Due Date'}</p>
                          <p className="font-medium">
                            {new Date(plan.dueDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                          </p>
                        </div>
                        <div className="p-2 rounded bg-gray-50">
                          <p className="text-gray-500">{isAr ? 'التقدم' : 'Progress'}</p>
                          <p className="font-medium">{plan.progress}%</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${plan.progress}%`,
                            backgroundColor: plan.progress === 100 ? '#22c55e' : brandColors.primary
                          }}
                        />
                      </div>

                      {/* Tasks */}
                      {plan.tasks && plan.tasks.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <h4 className="text-xs font-bold mb-2 flex items-center gap-1" style={{ color: brandColors.dark }}>
                            <ListChecks className="h-3 w-3" />
                            {isAr ? 'المهام' : 'Tasks'} ({plan.tasks.length})
                          </h4>
                          <div className="space-y-1">
                            {plan.tasks.map((task) => (
                              <div key={task.id} className="flex items-center gap-2 text-xs p-2 rounded bg-gray-50">
                                {task.status === 'completed' ? (
                                  <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                                ) : (
                                  <Clock className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                )}
                                <span className={task.status === 'completed' ? 'line-through text-gray-400' : ''}>
                                  {isAr ? task.titleAr : task.titleEn}
                                </span>
                                <span className="ms-auto text-gray-400">
                                  {getTaskStatusName(task.status)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="mb-6">
            <h3 className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color: brandColors.dark }}>
              <Calendar className="h-4 w-4" style={{ color: brandColors.primary }} />
              {isAr ? 'التواريخ المهمة' : 'Important Dates'}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="text-xs text-gray-500">{isAr ? 'تاريخ الإنشاء' : 'Created'}</p>
                <p className="font-medium" style={{ color: brandColors.dark }}>
                  {new Date(risk.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="text-xs text-gray-500">{isAr ? 'آخر تحديث' : 'Last Updated'}</p>
                <p className="font-medium" style={{ color: brandColors.dark }}>
                  {new Date(risk.updatedAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                </p>
              </div>
              {risk.followUpDate && (
                <div className="p-3 rounded-lg bg-orange-50">
                  <p className="text-xs text-orange-600">{isAr ? 'تاريخ المتابعة' : 'Follow-up Date'}</p>
                  <p className="font-medium text-orange-700">
                    {new Date(risk.followUpDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                  </p>
                </div>
              )}
              {risk.nextReviewDate && (
                <div className="p-3 rounded-lg bg-blue-50">
                  <p className="text-xs text-blue-600">{isAr ? 'تاريخ المراجعة' : 'Review Date'}</p>
                  <p className="font-medium text-blue-700">
                    {new Date(risk.nextReviewDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t-2 text-center text-xs text-gray-400" style={{ borderColor: brandColors.primary }}>
            <p>{isAr ? 'تقرير آلي من نظام إدارة المخاطر المؤسسية' : 'Automated report from Enterprise Risk Management System'}</p>
            <p className="mt-1 font-medium" style={{ color: brandColors.primary }}>
              {isAr ? 'شركة الكابلات السعودية' : 'Saudi Cable Company'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
