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
} from 'lucide-react';
import type { RiskRating } from '@/types';

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
            <div className="text-center py-8 text-[var(--foreground-muted)]">
              <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{isAr ? 'سيتم إضافة سجل التغييرات قريباً' : 'Activity log coming soon'}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
