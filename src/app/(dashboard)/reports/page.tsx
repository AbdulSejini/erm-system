'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  FileBarChart,
  Download,
  Printer,
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Table,
  Loader2,
  Eye,
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  Target,
  Activity,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';

interface Department {
  id: string;
  nameAr: string;
  nameEn: string;
  code: string;
}

interface Risk {
  id: string;
  riskNumber: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  status: string;
  approvalStatus: string;
  inherentLikelihood: number;
  inherentImpact: number;
  inherentScore: number;
  inherentRating: string;
  residualLikelihood: number | null;
  residualImpact: number | null;
  residualScore: number | null;
  residualRating: string | null;
  potentialCauseAr: string | null;
  potentialCauseEn: string | null;
  potentialImpactAr: string | null;
  potentialImpactEn: string | null;
  layersOfProtectionAr: string | null;
  layersOfProtectionEn: string | null;
  krisAr: string | null;
  krisEn: string | null;
  mitigationActionsAr: string | null;
  mitigationActionsEn: string | null;
  complianceRequired: boolean;
  complianceNoteAr: string | null;
  complianceNoteEn: string | null;
  iaRef: string | null;
  processText: string | null;
  subProcessText: string | null;
  issuedBy: string | null;
  identifiedDate: string;
  lastReviewDate: string | null;
  nextReviewDate: string | null;
  createdAt: string;
  updatedAt: string;
  followUpDate: string | null;
  isDeleted: boolean;
  department?: {
    id: string;
    nameAr: string;
    nameEn: string;
    code: string;
  };
  category?: {
    id: string;
    nameAr: string;
    nameEn: string;
    code: string;
  };
  source?: {
    id: string;
    nameAr: string;
    nameEn: string;
  };
  owner?: {
    id: string;
    fullName: string;
    fullNameEn: string | null;
  };
  riskOwner?: {
    nameAr: string;
    nameEn: string | null;
    department?: {
      id: string;
      nameAr: string;
      nameEn: string;
    };
  };
  champion?: {
    id: string;
    fullName: string;
    fullNameEn: string | null;
  };
}

interface ReportStats {
  totalRisks: number;
  byRating: Record<string, number>;
  byStatus: Record<string, number>;
  byDepartment: Record<string, number>;
  avgInherentScore: number;
  avgResidualScore: number;
  criticalCount: number;
  overdueCount: number;
  mitigatedCount: number;
  reductionPercentage: number;
}

// Brand Colors - شركة الكابلات السعودية
const brandColors = {
  primary: '#E8850A', // البرتقالي - متوافق مع النظام
  primaryLight: 'rgba(232, 133, 10, 0.1)',
  primaryMedium: 'rgba(232, 133, 10, 0.2)',
  dark: '#1E293B', // الرمادي الداكن - متوافق مع النظام
  darkLight: 'rgba(30, 41, 59, 0.1)',
};

const reportTypes = [
  {
    id: 'riskRegister',
    icon: Table,
    descAr: 'قائمة شاملة بجميع المخاطر المسجلة',
    descEn: 'Comprehensive list of all registered risks',
  },
  {
    id: 'riskMatrix',
    icon: BarChart3,
    descAr: 'توزيع المخاطر على مصفوفة الاحتمالية والتأثير',
    descEn: 'Risk distribution on likelihood-impact matrix',
  },
  {
    id: 'treatmentStatus',
    icon: TrendingUp,
    descAr: 'متابعة حالة معالجة المخاطر',
    descEn: 'Track risk treatment status',
  },
  {
    id: 'departmentRisks',
    icon: PieChart,
    descAr: 'تحليل المخاطر حسب الإدارة/الوظيفة',
    descEn: 'Risk analysis by department/function',
  },
];

export default function ReportsPage() {
  const { t, language } = useTranslation();
  const isAr = language === 'ar';
  const [selectedReport, setSelectedReport] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [filteredRisks, setFilteredRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  // Fetch departments
  const fetchDepartments = useCallback(async () => {
    try {
      const response = await fetch('/api/departments');
      const data = await response.json();
      if (data.success) {
        setDepartments(data.data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  }, []);

  // Fetch risks
  const fetchRisks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/risks');
      const data = await response.json();
      if (data.success) {
        setRisks(data.data);
        setFilteredRisks(data.data);
      }
    } catch (error) {
      console.error('Error fetching risks:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
    fetchRisks();
  }, [fetchDepartments, fetchRisks]);

  // Filter risks and calculate stats
  useEffect(() => {
    let filtered = [...risks];

    if (selectedDepartment) {
      filtered = filtered.filter(r => r.department?.id === selectedDepartment);
    }

    if (dateFrom) {
      filtered = filtered.filter(r => new Date(r.createdAt) >= new Date(dateFrom));
    }

    if (dateTo) {
      filtered = filtered.filter(r => new Date(r.createdAt) <= new Date(dateTo));
    }

    setFilteredRisks(filtered);

    // Calculate comprehensive stats
    if (filtered.length > 0) {
      const byRating: Record<string, number> = {};
      const byStatus: Record<string, number> = {};
      const byDepartment: Record<string, number> = {};
      let totalInherent = 0;
      let totalResidual = 0;
      let residualCount = 0;
      let criticalCount = 0;
      let overdueCount = 0;
      let mitigatedCount = 0;

      const now = new Date();

      filtered.forEach(risk => {
        // By rating
        const rating = risk.inherentRating || 'Unknown';
        byRating[rating] = (byRating[rating] || 0) + 1;

        // Critical count
        if (rating === 'Critical' || rating === 'Catastrophic') {
          criticalCount++;
        }

        // By status
        const status = risk.status || 'open';
        byStatus[status] = (byStatus[status] || 0) + 1;

        // Mitigated count
        if (status === 'mitigated' || status === 'closed') {
          mitigatedCount++;
        }

        // Overdue count
        if (risk.followUpDate && new Date(risk.followUpDate) < now && status !== 'closed' && status !== 'mitigated') {
          overdueCount++;
        }

        // By department
        const deptName = isAr ? (risk.department?.nameAr || 'غير محدد') : (risk.department?.nameEn || 'Unassigned');
        byDepartment[deptName] = (byDepartment[deptName] || 0) + 1;

        // Scores
        totalInherent += risk.inherentScore || 0;
        if (risk.residualScore) {
          totalResidual += risk.residualScore;
          residualCount++;
        }
      });

      const avgInherent = filtered.length > 0 ? totalInherent / filtered.length : 0;
      const avgResidual = residualCount > 0 ? totalResidual / residualCount : avgInherent;
      const reductionPercentage = avgInherent > 0 ? Math.round((1 - avgResidual / avgInherent) * 100) : 0;

      setStats({
        totalRisks: filtered.length,
        byRating,
        byStatus,
        byDepartment,
        avgInherentScore: Math.round(avgInherent * 10) / 10,
        avgResidualScore: Math.round(avgResidual * 10) / 10,
        criticalCount,
        overdueCount,
        mitigatedCount,
        reductionPercentage,
      });
    } else {
      setStats(null);
    }
  }, [risks, selectedDepartment, dateFrom, dateTo, isAr]);

  const departmentOptions = [
    { value: '', label: isAr ? 'جميع الإدارات' : 'All Departments' },
    ...departments.map(d => ({
      value: d.id,
      label: isAr ? d.nameAr : d.nameEn,
    })),
  ];

  const handleGenerateReport = () => {
    if (!selectedReport) {
      alert(isAr ? 'يرجى اختيار نوع التقرير' : 'Please select a report type');
      return;
    }
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setShowPreview(true);
    }, 500);
  };

  const getRatingColor = (rating: string) => {
    switch (rating?.toLowerCase()) {
      case 'critical':
      case 'catastrophic':
        return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-400', border: 'border-red-200' };
      case 'major':
        return { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-400', border: 'border-orange-200' };
      case 'moderate':
        return { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-400', border: 'border-yellow-200' };
      case 'minor':
        return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-400', border: 'border-blue-200' };
      case 'negligible':
        return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-400', border: 'border-green-200' };
      default:
        return { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-800 dark:text-gray-400', border: 'border-gray-200' };
    }
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'danger' | 'default' => {
    switch (status?.toLowerCase()) {
      case 'closed':
      case 'mitigated':
        return 'success';
      case 'inprogress':
        return 'warning';
      case 'open':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      open: { ar: 'مفتوح', en: 'Open' },
      inProgress: { ar: 'قيد التنفيذ', en: 'In Progress' },
      mitigated: { ar: 'تم التخفيف', en: 'Mitigated' },
      closed: { ar: 'مغلق', en: 'Closed' },
      accepted: { ar: 'مقبول', en: 'Accepted' },
    };
    return labels[status]?.[isAr ? 'ar' : 'en'] || status;
  };

  const getApprovalStatusLabel = (status: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      Draft: { ar: 'مسودة', en: 'Draft' },
      Approved: { ar: 'معتمد', en: 'Approved' },
      Future: { ar: 'مستقبلي', en: 'Future' },
      'N/A': { ar: 'غير متاح', en: 'N/A' },
      Sent: { ar: 'مرسل', en: 'Sent' },
      'Under Discussing': { ar: 'قيد المناقشة', en: 'Under Discussing' },
    };
    return labels[status]?.[isAr ? 'ar' : 'en'] || status;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString(isAr ? 'ar-SA-u-ca-gregory' : 'en-US');
    } catch {
      return '';
    }
  };

  const escapeCSVField = (field: string | number | boolean | null | undefined): string => {
    if (field === null || field === undefined) return '';
    const str = String(field);
    // Escape double quotes and wrap in quotes if contains special characters
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  };

  const handleExportCSV = () => {
    // جميع الأعمدة من قاعدة البيانات
    const headers = [
      isAr ? 'رقم الخطر' : 'Risk Number',
      isAr ? 'العنوان (عربي)' : 'Title (Arabic)',
      isAr ? 'العنوان (إنجليزي)' : 'Title (English)',
      isAr ? 'الوصف (عربي)' : 'Description (Arabic)',
      isAr ? 'الوصف (إنجليزي)' : 'Description (English)',
      isAr ? 'نوع الخطر' : 'Risk Category',
      isAr ? 'رمز نوع الخطر' : 'Category Code',
      isAr ? 'الوظيفة/الإدارة' : 'Department',
      isAr ? 'رمز الوظيفة' : 'Department Code',
      isAr ? 'مصدر الخطر' : 'Risk Source',
      isAr ? 'الجهة المصدرة' : 'Issued By',
      isAr ? 'العملية' : 'Process',
      isAr ? 'العملية الفرعية' : 'Sub Process',
      isAr ? 'السبب المحتمل (عربي)' : 'Potential Cause (Arabic)',
      isAr ? 'السبب المحتمل (إنجليزي)' : 'Potential Cause (English)',
      isAr ? 'التأثير المحتمل (عربي)' : 'Potential Impact (Arabic)',
      isAr ? 'التأثير المحتمل (إنجليزي)' : 'Potential Impact (English)',
      isAr ? 'الاحتمالية الكامنة' : 'Inherent Likelihood',
      isAr ? 'التأثير الكامن' : 'Inherent Impact',
      isAr ? 'الدرجة الكامنة' : 'Inherent Score',
      isAr ? 'التصنيف الكامن' : 'Inherent Rating',
      isAr ? 'الاحتمالية المتبقية' : 'Residual Likelihood',
      isAr ? 'التأثير المتبقي' : 'Residual Impact',
      isAr ? 'الدرجة المتبقية' : 'Residual Score',
      isAr ? 'التصنيف المتبقي' : 'Residual Rating',
      isAr ? 'طبقات الحماية (عربي)' : 'Layers of Protection (Arabic)',
      isAr ? 'طبقات الحماية (إنجليزي)' : 'Layers of Protection (English)',
      isAr ? 'مؤشرات المخاطر (عربي)' : 'KRIs (Arabic)',
      isAr ? 'مؤشرات المخاطر (إنجليزي)' : 'KRIs (English)',
      isAr ? 'إجراءات التخفيف (عربي)' : 'Mitigation Actions (Arabic)',
      isAr ? 'إجراءات التخفيف (إنجليزي)' : 'Mitigation Actions (English)',
      isAr ? 'يتطلب امتثال' : 'Compliance Required',
      isAr ? 'ملاحظة الامتثال (عربي)' : 'Compliance Note (Arabic)',
      isAr ? 'ملاحظة الامتثال (إنجليزي)' : 'Compliance Note (English)',
      isAr ? 'مرجع التدقيق الداخلي' : 'IA Reference',
      isAr ? 'الحالة' : 'Status',
      isAr ? 'حالة الموافقة' : 'Approval Status',
      isAr ? 'مالك الخطر' : 'Risk Owner',
      isAr ? 'مالك الخطر (المسجل)' : 'Risk Owner (Registered)',
      isAr ? 'قسم مالك الخطر' : 'Risk Owner Department',
      isAr ? 'رائد المخاطر' : 'Risk Champion',
      isAr ? 'تاريخ تحديد الخطر' : 'Identified Date',
      isAr ? 'تاريخ الإضافة' : 'Created Date',
      isAr ? 'تاريخ آخر تحديث' : 'Last Updated',
      isAr ? 'تاريخ المتابعة' : 'Follow-up Date',
      isAr ? 'تاريخ آخر مراجعة' : 'Last Review Date',
      isAr ? 'تاريخ المراجعة القادمة' : 'Next Review Date',
      isAr ? 'محذوف' : 'Is Deleted',
    ];

    const rows = filteredRisks.map(risk => [
      escapeCSVField(risk.riskNumber),
      escapeCSVField(risk.titleAr),
      escapeCSVField(risk.titleEn),
      escapeCSVField(risk.descriptionAr),
      escapeCSVField(risk.descriptionEn),
      escapeCSVField(isAr ? risk.category?.nameAr : risk.category?.nameEn),
      escapeCSVField(risk.category?.code),
      escapeCSVField(isAr ? risk.department?.nameAr : risk.department?.nameEn),
      escapeCSVField(risk.department?.code),
      escapeCSVField(isAr ? risk.source?.nameAr : risk.source?.nameEn),
      escapeCSVField(risk.issuedBy),
      escapeCSVField(risk.processText),
      escapeCSVField(risk.subProcessText),
      escapeCSVField(risk.potentialCauseAr),
      escapeCSVField(risk.potentialCauseEn),
      escapeCSVField(risk.potentialImpactAr),
      escapeCSVField(risk.potentialImpactEn),
      escapeCSVField(risk.inherentLikelihood),
      escapeCSVField(risk.inherentImpact),
      escapeCSVField(risk.inherentScore),
      escapeCSVField(risk.inherentRating),
      escapeCSVField(risk.residualLikelihood),
      escapeCSVField(risk.residualImpact),
      escapeCSVField(risk.residualScore),
      escapeCSVField(risk.residualRating),
      escapeCSVField(risk.layersOfProtectionAr),
      escapeCSVField(risk.layersOfProtectionEn),
      escapeCSVField(risk.krisAr),
      escapeCSVField(risk.krisEn),
      escapeCSVField(risk.mitigationActionsAr),
      escapeCSVField(risk.mitigationActionsEn),
      escapeCSVField(risk.complianceRequired ? (isAr ? 'نعم' : 'Yes') : (isAr ? 'لا' : 'No')),
      escapeCSVField(risk.complianceNoteAr),
      escapeCSVField(risk.complianceNoteEn),
      escapeCSVField(risk.iaRef),
      escapeCSVField(getStatusLabel(risk.status)),
      escapeCSVField(getApprovalStatusLabel(risk.approvalStatus)),
      escapeCSVField(isAr ? risk.owner?.fullName : (risk.owner?.fullNameEn || risk.owner?.fullName)),
      escapeCSVField(isAr ? risk.riskOwner?.nameAr : (risk.riskOwner?.nameEn || risk.riskOwner?.nameAr)),
      escapeCSVField(isAr ? risk.riskOwner?.department?.nameAr : risk.riskOwner?.department?.nameEn),
      escapeCSVField(isAr ? risk.champion?.fullName : (risk.champion?.fullNameEn || risk.champion?.fullName)),
      escapeCSVField(formatDate(risk.identifiedDate)),
      escapeCSVField(formatDate(risk.createdAt)),
      escapeCSVField(formatDate(risk.updatedAt)),
      escapeCSVField(formatDate(risk.followUpDate)),
      escapeCSVField(formatDate(risk.lastReviewDate)),
      escapeCSVField(formatDate(risk.nextReviewDate)),
      escapeCSVField(risk.isDeleted ? (isAr ? 'نعم' : 'Yes') : (isAr ? 'لا' : 'No')),
    ]);

    const csvContent = [
      headers.map(h => escapeCSVField(h)).join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `risk-register-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Executive Summary Component
  const ExecutiveSummary = () => {
    if (!stats) return null;

    const riskTrend = stats.reductionPercentage > 0 ? 'positive' : stats.reductionPercentage < 0 ? 'negative' : 'neutral';

    return (
      <div className="mb-6 p-4 rounded-xl border-2 border-[var(--primary)] bg-[var(--primary-light)]">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-lg bg-[var(--primary)]">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-bold text-[var(--foreground)]">
            {isAr ? 'الملخص التنفيذي' : 'Executive Summary'}
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Risk Exposure */}
          <div className="bg-[var(--card)] rounded-lg p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs text-[var(--foreground-muted)]">{isAr ? 'إجمالي التعرض للمخاطر' : 'Total Risk Exposure'}</p>
              <Shield className="h-4 w-4 text-[var(--primary)]" />
            </div>
            <p className="text-2xl font-bold mt-1 text-[var(--foreground)]">{stats.totalRisks}</p>
            <p className="text-xs text-[var(--foreground-muted)]">{isAr ? 'خطر مسجل' : 'registered risks'}</p>
          </div>

          {/* Risk Reduction */}
          <div className="bg-[var(--card)] rounded-lg p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs text-[var(--foreground-muted)]">{isAr ? 'نسبة تخفيض المخاطر' : 'Risk Reduction'}</p>
              {riskTrend === 'positive' ? (
                <ArrowDownRight className="h-4 w-4 text-green-500" />
              ) : riskTrend === 'negative' ? (
                <ArrowUpRight className="h-4 w-4 text-red-500" />
              ) : (
                <Minus className="h-4 w-4 text-[var(--foreground-muted)]" />
              )}
            </div>
            <p className={`text-2xl font-bold mt-1 ${riskTrend === 'positive' ? 'text-green-600 dark:text-green-400' : riskTrend === 'negative' ? 'text-red-600 dark:text-red-400' : 'text-[var(--foreground-secondary)]'}`}>
              {stats.reductionPercentage}%
            </p>
            <p className="text-xs text-[var(--foreground-muted)]">{isAr ? 'من المخاطر الكامنة' : 'from inherent risk'}</p>
          </div>

          {/* Critical Risks */}
          <div className="bg-[var(--card)] rounded-lg p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs text-[var(--foreground-muted)]">{isAr ? 'مخاطر حرجة' : 'Critical Risks'}</p>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <p className="text-2xl font-bold mt-1 text-red-600 dark:text-red-400">{stats.criticalCount}</p>
            <p className="text-xs text-[var(--foreground-muted)]">
              {stats.totalRisks > 0 ? `${Math.round((stats.criticalCount / stats.totalRisks) * 100)}%` : '0%'} {isAr ? 'من الإجمالي' : 'of total'}
            </p>
          </div>

          {/* Mitigated */}
          <div className="bg-[var(--card)] rounded-lg p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs text-[var(--foreground-muted)]">{isAr ? 'تم معالجتها' : 'Mitigated'}</p>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold mt-1 text-green-600 dark:text-green-400">{stats.mitigatedCount}</p>
            <p className="text-xs text-[var(--foreground-muted)]">
              {stats.totalRisks > 0 ? `${Math.round((stats.mitigatedCount / stats.totalRisks) * 100)}%` : '0%'} {isAr ? 'معدل الإنجاز' : 'completion rate'}
            </p>
          </div>
        </div>

        {/* Key Insights */}
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <h4 className="text-sm font-semibold mb-2 text-[var(--foreground)]">
            {isAr ? 'ملاحظات رئيسية' : 'Key Insights'}
          </h4>
          <ul className="text-sm space-y-1 text-[var(--foreground-secondary)]">
            {stats.overdueCount > 0 && (
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-red-500" />
                <span className="text-red-600 dark:text-red-400">
                  {isAr
                    ? `${stats.overdueCount} مخاطر تجاوزت موعد المتابعة المحدد`
                    : `${stats.overdueCount} risks have overdue follow-up dates`}
                </span>
              </li>
            )}
            {stats.criticalCount > 0 && (
              <li className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-[var(--primary)]" />
                <span>
                  {isAr
                    ? `${stats.criticalCount} مخاطر حرجة تتطلب اهتمام فوري`
                    : `${stats.criticalCount} critical risks require immediate attention`}
                </span>
              </li>
            )}
            {stats.reductionPercentage > 20 && (
              <li className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-green-500" />
                <span className="text-green-600 dark:text-green-400">
                  {isAr
                    ? `أداء ممتاز! تم تخفيض المخاطر بنسبة ${stats.reductionPercentage}%`
                    : `Excellent! Risk reduced by ${stats.reductionPercentage}%`}
                </span>
              </li>
            )}
          </ul>
        </div>
      </div>
    );
  };

  const renderReportPreview = () => {
    if (!stats) return null;

    switch (selectedReport) {
      case 'riskRegister':
        return (
          <div className="space-y-4">
            <ExecutiveSummary />

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg p-3 border border-[var(--primary)] bg-[var(--primary-light)]">
                <p className="text-xs text-[var(--foreground)]">{isAr ? 'إجمالي المخاطر' : 'Total Risks'}</p>
                <p className="text-2xl font-bold text-[var(--primary)]">{stats.totalRisks}</p>
              </div>
              <div className="bg-[var(--card)] rounded-lg p-3 border border-[var(--border)]">
                <p className="text-xs text-[var(--foreground-muted)]">{isAr ? 'متوسط الدرجة الكامنة' : 'Avg Inherent Score'}</p>
                <p className="text-2xl font-bold text-[var(--foreground)]">{stats.avgInherentScore}</p>
              </div>
              <div className="bg-[var(--card)] rounded-lg p-3 border border-[var(--border)]">
                <p className="text-xs text-[var(--foreground-muted)]">{isAr ? 'متوسط الدرجة المتبقية' : 'Avg Residual Score'}</p>
                <p className="text-2xl font-bold text-[var(--foreground)]">{stats.avgResidualScore}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                <p className="text-xs text-green-600 dark:text-green-400">{isAr ? 'نسبة التخفيض' : 'Reduction %'}</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.reductionPercentage}%</p>
              </div>
            </div>

            {/* Risk Table */}
            <div className="overflow-x-auto border border-[var(--border)] rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-[var(--secondary)]">
                  <tr>
                    <th className="p-3 text-start font-medium text-white">{isAr ? 'رقم الخطر' : 'Risk #'}</th>
                    <th className="p-3 text-start font-medium text-white">{isAr ? 'العنوان' : 'Title'}</th>
                    <th className="p-3 text-start font-medium text-white hidden md:table-cell">{isAr ? 'الإدارة' : 'Dept'}</th>
                    <th className="p-3 text-center font-medium text-white">{isAr ? 'الحالة' : 'Status'}</th>
                    <th className="p-3 text-center font-medium text-white">{isAr ? 'التصنيف' : 'Rating'}</th>
                    <th className="p-3 text-center font-medium text-white hidden sm:table-cell">{isAr ? 'الدرجة' : 'Score'}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRisks.slice(0, 20).map((risk, index) => {
                    const ratingColors = getRatingColor(risk.inherentRating);
                    return (
                      <tr key={risk.id} className={`border-t border-[var(--border)] ${index % 2 === 0 ? 'bg-[var(--card)]' : 'bg-[var(--background-tertiary)]'}`}>
                        <td className="p-3">
                          <code className="text-xs px-2 py-1 rounded font-medium bg-[var(--primary-light)] text-[var(--primary)]">
                            {risk.riskNumber}
                          </code>
                        </td>
                        <td className="p-3 max-w-[200px] truncate text-[var(--foreground)]">{isAr ? risk.titleAr : risk.titleEn}</td>
                        <td className="p-3 hidden md:table-cell text-[var(--foreground-muted)]">
                          {risk.department?.code || '-'}
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant={getStatusColor(risk.status)} size="sm">
                            {getStatusLabel(risk.status)}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${ratingColors.bg} ${ratingColors.text}`}>
                            {risk.inherentRating}
                          </span>
                        </td>
                        <td className="p-3 text-center hidden sm:table-cell font-bold text-[var(--foreground)]">
                          {risk.inherentScore}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredRisks.length > 20 && (
                <div className="p-3 text-center text-sm bg-[var(--primary-light)] text-[var(--foreground)]">
                  {isAr ? `و ${filteredRisks.length - 20} مخاطر أخرى...` : `And ${filteredRisks.length - 20} more risks...`}
                </div>
              )}
            </div>
          </div>
        );

      case 'riskMatrix':
        return (
          <div className="space-y-4">
            <ExecutiveSummary />

            {/* Rating Distribution */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-[var(--foreground)]">
                <Target className="h-4 w-4 text-[var(--primary)]" />
                {isAr ? 'توزيع المخاطر حسب التصنيف' : 'Risk Distribution by Rating'}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {['Critical', 'Major', 'Moderate', 'Minor', 'Negligible'].map(rating => {
                  const count = stats.byRating[rating] || (rating === 'Critical' ? stats.byRating['Catastrophic'] : 0) || 0;
                  const percentage = stats.totalRisks > 0 ? Math.round((count / stats.totalRisks) * 100) : 0;
                  const colors = getRatingColor(rating);
                  return (
                    <div key={rating} className={`rounded-lg p-3 border ${colors.bg} ${colors.border}`}>
                      <p className={`text-xs font-medium ${colors.text}`}>{rating}</p>
                      <p className={`text-2xl font-bold ${colors.text}`}>{count}</p>
                      <div className="h-1 rounded-full bg-white/50 dark:bg-black/20 mt-2 overflow-hidden">
                        <div className={`h-full ${colors.bg.replace('100', '500')}`} style={{ width: `${percentage}%` }} />
                      </div>
                      <p className={`text-xs mt-1 ${colors.text}`}>{percentage}%</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Risk Matrix Visual */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-[var(--foreground)]">
                <BarChart3 className="h-4 w-4 text-[var(--primary)]" />
                {isAr ? 'مصفوفة المخاطر (الاحتمالية × التأثير)' : 'Risk Matrix (Likelihood × Impact)'}
              </h4>
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <div className="grid grid-cols-6 text-xs">
                  {/* Header */}
                  <div className="p-2 font-bold text-white text-center bg-[var(--secondary)]"></div>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="p-2 text-center font-bold text-white bg-[var(--secondary)]">
                      {isAr ? `تأثير ${i}` : `Impact ${i}`}
                    </div>
                  ))}

                  {/* Matrix cells */}
                  {[5, 4, 3, 2, 1].map(likelihood => (
                    <React.Fragment key={likelihood}>
                      <div className="p-2 font-bold text-white text-center bg-[var(--secondary)]">
                        {isAr ? `احتمال ${likelihood}` : `L${likelihood}`}
                      </div>
                      {[1, 2, 3, 4, 5].map(impact => {
                        const score = likelihood * impact;
                        const count = filteredRisks.filter(r =>
                          r.inherentLikelihood === likelihood && r.inherentImpact === impact
                        ).length;

                        let bgColor = 'bg-green-100 dark:bg-green-900/30';
                        let textColor = 'text-green-700 dark:text-green-400';
                        if (score >= 20) {
                          bgColor = 'bg-red-100 dark:bg-red-900/30';
                          textColor = 'text-red-700 dark:text-red-400';
                        } else if (score >= 12) {
                          bgColor = 'bg-orange-100 dark:bg-orange-900/30';
                          textColor = 'text-orange-700 dark:text-orange-400';
                        } else if (score >= 6) {
                          bgColor = 'bg-yellow-100 dark:bg-yellow-900/30';
                          textColor = 'text-yellow-700 dark:text-yellow-400';
                        }

                        return (
                          <div
                            key={impact}
                            className={`${bgColor} p-3 text-center border-t border-l border-[var(--border)] transition-all hover:opacity-80`}
                          >
                            {count > 0 ? (
                              <div>
                                <span className={`text-xl font-bold ${textColor}`}>{count}</span>
                                <p className="text-[10px] text-[var(--foreground-muted)]">{isAr ? 'خطر' : 'risks'}</p>
                              </div>
                            ) : (
                              <span className="text-[var(--foreground-tertiary)]">-</span>
                            )}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-3 text-xs text-[var(--foreground-secondary)]">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800" />
                  <span>{isAr ? 'حرج (20-25)' : 'Critical (20-25)'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800" />
                  <span>{isAr ? 'رئيسي (12-19)' : 'Major (12-19)'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800" />
                  <span>{isAr ? 'متوسط (6-11)' : 'Moderate (6-11)'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800" />
                  <span>{isAr ? 'منخفض (1-5)' : 'Low (1-5)'}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'treatmentStatus':
        return (
          <div className="space-y-4">
            <ExecutiveSummary />

            {/* Status Distribution */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-[var(--foreground)]">
                <Activity className="h-4 w-4 text-[var(--primary)]" />
                {isAr ? 'توزيع حالات المخاطر' : 'Risk Status Distribution'}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(stats.byStatus).map(([status, count]) => {
                  const percentage = stats.totalRisks > 0 ? Math.round((count / stats.totalRisks) * 100) : 0;
                  const isSuccess = status === 'closed' || status === 'mitigated';
                  const isWarning = status === 'inProgress';
                  const isDanger = status === 'open';

                  return (
                    <div
                      key={status}
                      className={`rounded-lg p-4 border-2 ${
                        isSuccess ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20' :
                        isWarning ? 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20' :
                        isDanger ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20' :
                        'border-[var(--border)] bg-[var(--background-tertiary)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        {isSuccess && <CheckCircle className="h-6 w-6 text-green-500" />}
                        {isWarning && <Clock className="h-6 w-6 text-yellow-500" />}
                        {isDanger && <AlertTriangle className="h-6 w-6 text-red-500" />}
                        {!isSuccess && !isWarning && !isDanger && <Shield className="h-6 w-6 text-[var(--foreground-muted)]" />}
                        <span className={`text-3xl font-bold ${
                          isSuccess ? 'text-green-600 dark:text-green-400' :
                          isWarning ? 'text-yellow-600 dark:text-yellow-400' :
                          isDanger ? 'text-red-600 dark:text-red-400' :
                          'text-[var(--foreground-secondary)]'
                        }`}>{count}</span>
                      </div>
                      <p className="text-sm font-medium mt-2 text-[var(--foreground)]">{getStatusLabel(status)}</p>
                      <div className="h-2 rounded-full bg-white dark:bg-black/20 mt-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isSuccess ? 'bg-green-500' :
                            isWarning ? 'bg-yellow-500' :
                            isDanger ? 'bg-red-500' :
                            'bg-[var(--foreground-muted)]'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-[var(--foreground-muted)] mt-1">{percentage}% {isAr ? 'من الإجمالي' : 'of total'}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Progress Overview */}
            <div className="rounded-lg p-4 border border-[var(--primary)] bg-[var(--primary-light)]">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-[var(--foreground)]">
                <TrendingUp className="h-4 w-4 text-[var(--primary)]" />
                {isAr ? 'نظرة عامة على التقدم' : 'Progress Overview'}
              </h4>
              <div className="space-y-3">
                {Object.entries(stats.byStatus)
                  .sort((a, b) => b[1] - a[1])
                  .map(([status, count]) => {
                    const percentage = stats.totalRisks > 0 ? Math.round((count / stats.totalRisks) * 100) : 0;
                    return (
                      <div key={status}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-[var(--foreground)]">{getStatusLabel(status)}</span>
                          <span className="font-bold text-[var(--primary)]">{count} ({percentage}%)</span>
                        </div>
                        <div className="h-3 bg-white dark:bg-black/20 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              status === 'closed' || status === 'mitigated' ? 'bg-green-500' :
                              status === 'inProgress' ? 'bg-yellow-500' :
                              status === 'open' ? 'bg-red-500' : 'bg-[var(--primary)]'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        );

      case 'departmentRisks':
        return (
          <div className="space-y-4">
            <ExecutiveSummary />

            {/* Department Distribution */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-[var(--foreground)]">
                <PieChart className="h-4 w-4 text-[var(--primary)]" />
                {isAr ? 'توزيع المخاطر حسب الإدارة/الوظيفة' : 'Risk Distribution by Department/Function'}
              </h4>
              <div className="space-y-3">
                {Object.entries(stats.byDepartment)
                  .sort((a, b) => b[1] - a[1])
                  .map(([dept, count], index) => {
                    const percentage = stats.totalRisks > 0 ? Math.round((count / stats.totalRisks) * 100) : 0;
                    const isTop = index === 0;
                    return (
                      <div
                        key={dept}
                        className={`rounded-lg p-4 border-2 transition-all ${
                          isTop ? 'shadow-md border-[var(--primary)] bg-[var(--primary-light)]' : 'border-[var(--border)] bg-[var(--card)]'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            {isTop && <Zap className="h-4 w-4 text-[var(--primary)]" />}
                            <span className="font-semibold text-[var(--foreground)]">{dept}</span>
                          </div>
                          <div className="text-end">
                            <span className={`text-xl font-bold ${isTop ? 'text-[var(--primary)]' : 'text-[var(--foreground)]'}`}>{count}</span>
                            <span className="text-sm text-[var(--foreground-muted)] ms-1">({percentage}%)</span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden bg-[var(--background-tertiary)]">
                          <div
                            className={`h-full rounded-full transition-all ${isTop ? 'bg-[var(--primary)]' : 'bg-[var(--foreground-muted)]'}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        {isTop && (
                          <p className="text-xs mt-2 text-[var(--primary)]">
                            {isAr ? '⚡ أعلى تركيز للمخاطر' : '⚡ Highest risk concentration'}
                          </p>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Department Comparison */}
            <div className="rounded-lg p-4 border border-[var(--border)]">
              <h4 className="text-sm font-semibold mb-3 text-[var(--foreground)]">
                {isAr ? 'مقارنة الإدارات' : 'Department Comparison'}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-lg bg-[var(--background-tertiary)]">
                  <p className="text-xs text-[var(--foreground-muted)]">{isAr ? 'عدد الإدارات' : 'Total Depts'}</p>
                  <p className="text-2xl font-bold text-[var(--foreground)]">{Object.keys(stats.byDepartment).length}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-[var(--background-tertiary)]">
                  <p className="text-xs text-[var(--foreground-muted)]">{isAr ? 'متوسط المخاطر لكل إدارة' : 'Avg Risks/Dept'}</p>
                  <p className="text-2xl font-bold text-[var(--primary)]">
                    {Math.round(stats.totalRisks / Math.max(1, Object.keys(stats.byDepartment).length))}
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg bg-[var(--background-tertiary)]">
                  <p className="text-xs text-[var(--foreground-muted)]">{isAr ? 'أعلى إدارة' : 'Top Dept'}</p>
                  <p className="text-sm font-bold truncate text-[var(--foreground)]">
                    {Object.entries(stats.byDepartment).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
          <p className="text-sm text-[var(--foreground-secondary)]">
            {isAr ? 'جاري تحميل البيانات...' : 'Loading data...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[var(--primary)]">
              <FileBarChart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--foreground)]">
                {t('reports.title')}
              </h1>
              <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">
                {isAr ? 'إنشاء وتصدير تقارير إدارة المخاطر المؤسسية' : 'Generate and export enterprise risk management reports'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex flex-wrap gap-2">
          <div className="px-3 py-1.5 rounded-full text-sm font-medium bg-[var(--primary-light)] text-[var(--primary)]">
            {risks.length} {isAr ? 'خطر' : 'risks'}
          </div>
          <div className="px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
            {risks.filter(r => r.inherentRating === 'Critical' || r.inherentRating === 'Catastrophic').length} {isAr ? 'حرج' : 'critical'}
          </div>
        </div>
      </div>

      {/* Report Types Grid */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
          {t('reports.reportType')}
        </h2>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            const isSelected = selectedReport === report.id;
            return (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report.id)}
                className={`flex flex-col gap-2 rounded-xl border-2 p-4 text-start transition-all ${
                  isSelected
                    ? 'shadow-lg border-[var(--primary)] bg-[var(--primary-light)]'
                    : 'hover:shadow-md border-[var(--border)] bg-[var(--card)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`rounded-lg p-2 ${isSelected ? 'bg-[var(--primary)]' : 'bg-[var(--background-tertiary)]'}`}
                  >
                    <Icon className={`h-5 w-5 ${isSelected ? 'text-white' : 'text-[var(--primary)]'}`} />
                  </div>
                  {isSelected && (
                    <CheckCircle className="h-5 w-5 text-[var(--primary)]" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-[var(--foreground)]">
                    {t(`reports.types.${report.id}`)}
                  </h3>
                  <p className="text-xs text-[var(--foreground-muted)] mt-1">
                    {isAr ? report.descAr : report.descEn}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Report Parameters */}
      {selectedReport && (
        <Card className="border-2 border-[var(--border)]">
          <CardHeader className="p-4 bg-[var(--background-tertiary)]">
            <CardTitle className="text-sm flex items-center gap-2 text-[var(--foreground)]">
              <Shield className="h-4 w-4 text-[var(--primary)]" />
              {isAr ? 'معايير التقرير' : 'Report Parameters'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--foreground)]">
                  {isAr ? 'من تاريخ' : 'From Date'}
                </label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--foreground)]">
                  {isAr ? 'إلى تاريخ' : 'To Date'}
                </label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="text-sm"
                />
              </div>
              <Select
                label={t('reports.selectDepartment')}
                options={departmentOptions}
                value={selectedDepartment}
                onChange={setSelectedDepartment}
              />
              <div className="flex items-end">
                <Button
                  className="w-full text-sm font-semibold bg-[var(--primary)] hover:bg-[var(--primary-hover)]"
                  leftIcon={generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                  onClick={handleGenerateReport}
                  disabled={generating}
                >
                  {isAr ? 'عرض التقرير' : 'View Report'}
                </Button>
              </div>
            </div>

            {/* Filter Summary */}
            <div className="mt-4 p-3 rounded-lg text-sm bg-[var(--primary-light)]">
              <span className="text-[var(--foreground)]">
                {isAr ? `المخاطر المطابقة: ` : `Matching risks: `}
                <strong className="text-[var(--primary)]">{filteredRisks.length}</strong>
              </span>
              {selectedDepartment && (
                <>
                  <span className="mx-2 text-[var(--foreground)]">•</span>
                  <span className="text-[var(--foreground)]">
                    {isAr ? 'الإدارة: ' : 'Department: '}
                    <strong>{departments.find(d => d.id === selectedDepartment)?.[isAr ? 'nameAr' : 'nameEn']}</strong>
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Preview */}
      {showPreview && stats && (
        <Card ref={reportRef} className="border-2 border-[var(--border)] overflow-hidden print:border-0">
          <CardHeader className="p-4 flex flex-row items-center justify-between print:bg-white bg-[var(--secondary)]">
            <CardTitle className="text-base flex items-center gap-2 text-white">
              <FileBarChart className="h-5 w-5" />
              {t(`reports.types.${selectedReport}`)}
            </CardTitle>
            <div className="flex gap-2 print:hidden">
              <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={handleExportCSV} className="bg-white dark:bg-gray-800">
                CSV
              </Button>
              <Button variant="outline" size="sm" leftIcon={<Printer className="h-4 w-4" />} onClick={handlePrint} className="bg-white dark:bg-gray-800">
                {isAr ? 'طباعة' : 'Print'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)} className="text-white hover:bg-white/20">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {/* Report Header */}
            <div className="mb-4 pb-4 border-b border-[var(--border)] flex justify-between items-start">
              <div>
                <p className="text-xs text-[var(--foreground-muted)]">{isAr ? 'تاريخ التقرير' : 'Report Date'}</p>
                <p className="font-semibold text-[var(--foreground)]">
                  {new Date().toLocaleDateString(isAr ? 'ar-SA-u-ca-gregory' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div className="text-end">
                <p className="text-xs text-[var(--foreground-muted)]">{isAr ? 'الفترة' : 'Period'}</p>
                <p className="font-semibold text-[var(--foreground)]">
                  {dateFrom && dateTo
                    ? `${new Date(dateFrom).toLocaleDateString(isAr ? 'ar-SA-u-ca-gregory' : 'en-US')} - ${new Date(dateTo).toLocaleDateString(isAr ? 'ar-SA-u-ca-gregory' : 'en-US')}`
                    : (isAr ? 'جميع الفترات' : 'All time')
                  }
                </p>
              </div>
            </div>

            {/* Report Content */}
            {renderReportPreview()}

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-[var(--border)] text-center text-xs text-[var(--foreground-muted)]">
              <p>{isAr ? 'تقرير آلي من نظام إدارة المخاطر المؤسسية' : 'Automated report from Enterprise Risk Management System'}</p>
              <p className="mt-1 text-[var(--primary)]">
                {isAr ? 'شركة الكابلات السعودية' : 'Saudi Cable Company'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
