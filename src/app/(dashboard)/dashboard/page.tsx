'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { RiskMatrix } from '@/components/shared/RiskMatrix';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Calendar,
  ArrowUpRight,
  Users,
  Wrench,
  Target,
  Activity,
  BarChart3,
  Shield,
  FileText,
  Bell,
  ChevronRight,
  Info,
  Zap,
} from 'lucide-react';
import type { RiskRating, TreatmentStatus } from '@/types';

// Mock data with new rating system
const mockStats = {
  totalRisks: 35,
  ratingBreakdown: {
    Critical: 3,
    Major: 8,
    Moderate: 12,
    Minor: 7,
    Negligible: 5,
  },
  openIncidents: 2,
  pendingTreatments: 8,
  completedTreatments: 12,
  overdueTreatments: 2,
  activeChampions: 5,
  avgResolutionRate: 72,
  riskTrend: -8, // negative means improvement
};

const mockMatrixData = [
  { likelihood: 5, impact: 5, count: 1 },
  { likelihood: 5, impact: 4, count: 2 },
  { likelihood: 4, impact: 5, count: 1 },
  { likelihood: 4, impact: 4, count: 2 },
  { likelihood: 4, impact: 3, count: 3 },
  { likelihood: 3, impact: 4, count: 2 },
  { likelihood: 3, impact: 3, count: 4 },
  { likelihood: 3, impact: 2, count: 3 },
  { likelihood: 2, impact: 3, count: 5 },
  { likelihood: 2, impact: 2, count: 4 },
  { likelihood: 2, impact: 1, count: 3 },
  { likelihood: 1, impact: 2, count: 2 },
  { likelihood: 1, impact: 1, count: 3 },
];

const mockRecentRisks = [
  {
    id: '1',
    number: 'FIN-R-001',
    titleAr: 'خطر تأخر توريد المواد الخام',
    titleEn: 'Raw Material Supply Delay Risk',
    rating: 'Critical' as RiskRating,
    score: 20,
    departmentAr: 'المالية',
    departmentEn: 'Finance',
    date: '2026-01-15',
    championAr: 'أحمد محمد',
    championEn: 'Ahmed Mohammed',
  },
  {
    id: '2',
    number: 'FIN-R-002',
    titleAr: 'خطر تقلبات أسعار النحاس',
    titleEn: 'Copper Price Fluctuation Risk',
    rating: 'Major' as RiskRating,
    score: 16,
    departmentAr: 'المالية',
    departmentEn: 'Finance',
    date: '2026-01-14',
    championAr: 'سارة علي',
    championEn: 'Sarah Ali',
  },
  {
    id: '3',
    number: 'OPS-R-001',
    titleAr: 'خطر انقطاع الكهرباء',
    titleEn: 'Power Outage Risk',
    rating: 'Moderate' as RiskRating,
    score: 12,
    departmentAr: 'العمليات',
    departmentEn: 'Operations',
    date: '2026-01-13',
    championAr: 'خالد أحمد',
    championEn: 'Khalid Ahmed',
  },
  {
    id: '4',
    number: 'COMP-R-001',
    titleAr: 'خطر الامتثال البيئي',
    titleEn: 'Environmental Compliance Risk',
    rating: 'Minor' as RiskRating,
    score: 6,
    departmentAr: 'الامتثال',
    departmentEn: 'Compliance',
    date: '2026-01-12',
    championAr: 'فاطمة حسن',
    championEn: 'Fatima Hassan',
  },
];

const mockUpcomingDeadlines = [
  {
    id: '1',
    titleAr: 'مراجعة خطة الطوارئ',
    titleEn: 'Emergency Plan Review',
    riskNumber: 'OPS-R-003',
    dueDate: '2026-01-20',
    daysLeft: 3,
    type: 'treatment' as const,
    status: 'overdue' as TreatmentStatus,
  },
  {
    id: '2',
    titleAr: 'تحديث جدار الحماية',
    titleEn: 'Firewall Update',
    riskNumber: 'TECH-R-001',
    dueDate: '2026-01-22',
    daysLeft: 5,
    type: 'treatment' as const,
    status: 'inProgress' as TreatmentStatus,
  },
  {
    id: '3',
    titleAr: 'تقييم مخاطر الأمن السيبراني',
    titleEn: 'Cybersecurity Risk Assessment',
    riskNumber: 'TECH-R-002',
    dueDate: '2026-01-25',
    daysLeft: 8,
    type: 'assessment' as const,
    status: 'notStarted' as TreatmentStatus,
  },
  {
    id: '4',
    titleAr: 'تحديث سياسة إدارة المخاطر',
    titleEn: 'Risk Management Policy Update',
    riskNumber: 'COMP-R-002',
    dueDate: '2026-01-28',
    daysLeft: 11,
    type: 'review' as const,
    status: 'inProgress' as TreatmentStatus,
  },
];

const mockRecentActivities = [
  {
    id: '1',
    typeAr: 'تم إضافة خطر جديد',
    typeEn: 'New risk added',
    targetAr: 'خطر تقلبات العملة',
    targetEn: 'Currency Fluctuation Risk',
    riskNumber: 'FIN-R-003',
    userAr: 'أحمد محمد',
    userEn: 'Ahmed Mohammed',
    time: '10 دقائق',
    timeEn: '10 minutes ago',
    icon: AlertTriangle,
  },
  {
    id: '2',
    typeAr: 'تم إكمال معالجة',
    typeEn: 'Treatment completed',
    targetAr: 'تركيب مولدات احتياطية',
    targetEn: 'Backup Generators Installation',
    riskNumber: 'OPS-R-001',
    userAr: 'خالد أحمد',
    userEn: 'Khalid Ahmed',
    time: '30 دقيقة',
    timeEn: '30 minutes ago',
    icon: CheckCircle,
  },
  {
    id: '3',
    typeAr: 'تم تحديث تقييم',
    typeEn: 'Assessment updated',
    targetAr: 'خطر الأمن السيبراني',
    targetEn: 'Cybersecurity Risk',
    riskNumber: 'TECH-R-001',
    userAr: 'محمد عبدالله',
    userEn: 'Mohammed Abdullah',
    time: '1 ساعة',
    timeEn: '1 hour ago',
    icon: Activity,
  },
  {
    id: '4',
    typeAr: 'تم الإبلاغ عن حادث',
    typeEn: 'Incident reported',
    targetAr: 'انقطاع مؤقت للكهرباء',
    targetEn: 'Temporary Power Outage',
    riskNumber: 'OPS-R-001',
    userAr: 'سارة علي',
    userEn: 'Sarah Ali',
    time: '2 ساعة',
    timeEn: '2 hours ago',
    icon: AlertCircle,
  },
];

const mockChampionPerformance = [
  { nameAr: 'أحمد محمد', nameEn: 'Ahmed Mohammed', departmentAr: 'المالية', departmentEn: 'Finance', risksManaged: 8, resolutionRate: 87 },
  { nameAr: 'سارة علي', nameEn: 'Sarah Ali', departmentAr: 'العمليات', departmentEn: 'Operations', risksManaged: 12, resolutionRate: 75 },
  { nameAr: 'خالد أحمد', nameEn: 'Khalid Ahmed', departmentAr: 'تقنية المعلومات', departmentEn: 'IT', risksManaged: 6, resolutionRate: 50 },
  { nameAr: 'فاطمة حسن', nameEn: 'Fatima Hassan', departmentAr: 'السلامة', departmentEn: 'HSE', risksManaged: 4, resolutionRate: 100 },
];

export default function DashboardPage() {
  const { t, language } = useTranslation();
  const isAr = language === 'ar';
  const [showAlerts, setShowAlerts] = useState(false);

  // Handle Monthly Report generation
  const handleMonthlyReport = () => {
    alert(isAr ? 'جاري إنشاء التقرير الشهري...' : 'Generating monthly report...');
  };

  // Handle Alerts
  const handleAlerts = () => {
    setShowAlerts(!showAlerts);
  };

  const getRatingColor = (rating: RiskRating) => {
    switch (rating) {
      case 'Critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'Major':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'Moderate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Minor':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Negligible':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRatingLabel = (rating: RiskRating) => {
    const labels: Record<RiskRating, { ar: string; en: string }> = {
      Critical: { ar: 'حرج', en: 'Critical' },
      Major: { ar: 'رئيسي', en: 'Major' },
      Moderate: { ar: 'متوسط', en: 'Moderate' },
      Minor: { ar: 'ثانوي', en: 'Minor' },
      Negligible: { ar: 'ضئيل', en: 'Negligible' },
    };
    return isAr ? labels[rating].ar : labels[rating].en;
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--foreground)]">
            {t('dashboard.title')}
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-[var(--foreground-secondary)]">
            {t('dashboard.welcome')}، {isAr ? 'عبدالإله سجيني' : 'Abdulelah Sejini'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" leftIcon={<FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />} onClick={handleMonthlyReport}>
            <span className="text-xs sm:text-sm">{isAr ? 'تقرير شهري' : 'Monthly Report'}</span>
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4" />} onClick={handleAlerts}>
            <span className="relative text-xs sm:text-sm">
              {isAr ? 'التنبيهات' : 'Alerts'}
              <span className="absolute -top-1 -end-1 flex h-3.5 w-3.5 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-red-500 text-[8px] sm:text-[10px] text-white">
                3
              </span>
            </span>
          </Button>
        </div>
      </div>

      {/* Quick Info Banner */}
      <div className="rounded-lg border border-[var(--primary)]/30 bg-[var(--primary-light)] p-2 sm:p-3 md:p-4">
        <div className="flex flex-col gap-2 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Info className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--primary)] shrink-0" />
            <div>
              <p className="font-medium text-xs sm:text-sm md:text-base text-[var(--foreground)]">
                {isAr ? 'ملخص الشهر' : 'Monthly Summary'}
              </p>
              <p className="text-[10px] sm:text-xs md:text-sm text-[var(--foreground-secondary)]">
                {isAr
                  ? `تم تخفيض ${Math.abs(mockStats.riskTrend)}% من المخاطر مقارنة بالشهر الماضي`
                  : `Risks reduced by ${Math.abs(mockStats.riskTrend)}% compared to last month`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            <span className="font-bold text-sm sm:text-base text-green-600">{mockStats.riskTrend}%</span>
          </div>
        </div>
      </div>

      {/* Stats Grid - Rating Breakdown */}
      <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {/* Critical */}
        <Card className="relative overflow-hidden p-2 sm:p-3 md:p-4">
          <div className="absolute top-0 end-0 h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 translate-x-4 -translate-y-4 rounded-full bg-red-500/10" />
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30 shrink-0">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--foreground)]">
                {mockStats.ratingBreakdown.Critical}
              </p>
              <p className="text-[10px] sm:text-xs text-[var(--foreground-secondary)] truncate">
                {isAr ? 'حرج' : 'Critical'}
              </p>
            </div>
          </div>
        </Card>

        {/* Major */}
        <Card className="relative overflow-hidden p-2 sm:p-3 md:p-4">
          <div className="absolute top-0 end-0 h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 translate-x-4 -translate-y-4 rounded-full bg-orange-500/10" />
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30 shrink-0">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--foreground)]">
                {mockStats.ratingBreakdown.Major}
              </p>
              <p className="text-[10px] sm:text-xs text-[var(--foreground-secondary)] truncate">
                {isAr ? 'رئيسي' : 'Major'}
              </p>
            </div>
          </div>
        </Card>

        {/* Moderate */}
        <Card className="relative overflow-hidden p-2 sm:p-3 md:p-4">
          <div className="absolute top-0 end-0 h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 translate-x-4 -translate-y-4 rounded-full bg-yellow-500/10" />
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/30 shrink-0">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--foreground)]">
                {mockStats.ratingBreakdown.Moderate}
              </p>
              <p className="text-[10px] sm:text-xs text-[var(--foreground-secondary)] truncate">
                {isAr ? 'متوسط' : 'Moderate'}
              </p>
            </div>
          </div>
        </Card>

        {/* Minor */}
        <Card className="relative overflow-hidden p-2 sm:p-3 md:p-4">
          <div className="absolute top-0 end-0 h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 translate-x-4 -translate-y-4 rounded-full bg-blue-500/10" />
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 shrink-0">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--foreground)]">
                {mockStats.ratingBreakdown.Minor}
              </p>
              <p className="text-[10px] sm:text-xs text-[var(--foreground-secondary)] truncate">
                {isAr ? 'ثانوي' : 'Minor'}
              </p>
            </div>
          </div>
        </Card>

        {/* Negligible */}
        <Card className="relative overflow-hidden p-2 sm:p-3 md:p-4 col-span-2 sm:col-span-1">
          <div className="absolute top-0 end-0 h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 translate-x-4 -translate-y-4 rounded-full bg-green-500/10" />
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30 shrink-0">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--foreground)]">
                {mockStats.ratingBreakdown.Negligible}
              </p>
              <p className="text-[10px] sm:text-xs text-[var(--foreground-secondary)] truncate">
                {isAr ? 'ضئيل' : 'Negligible'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--foreground-secondary)]">
                {isAr ? 'إجمالي المخاطر' : 'Total Risks'}
              </p>
              <p className="text-2xl font-bold text-[var(--foreground)]">{mockStats.totalRisks}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary-light)]">
              <BarChart3 className="h-5 w-5 text-[var(--primary)]" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--foreground-secondary)]">
                {isAr ? 'خطط المعالجة النشطة' : 'Active Treatments'}
              </p>
              <p className="text-2xl font-bold text-[var(--foreground)]">{mockStats.pendingTreatments}</p>
              <p className="text-xs text-red-500">
                {mockStats.overdueTreatments} {isAr ? 'متأخرة' : 'overdue'}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
              <Wrench className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--foreground-secondary)]">
                {isAr ? 'معدل الحل' : 'Resolution Rate'}
              </p>
              <p className="text-2xl font-bold text-[var(--foreground)]">{mockStats.avgResolutionRate}%</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--foreground-secondary)]">
                {isAr ? 'رواد المخاطر النشطين' : 'Active Champions'}
              </p>
              <p className="text-2xl font-bold text-[var(--foreground)]">{mockStats.activeChampions}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Risk Matrix */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('dashboard.riskMatrix')}</CardTitle>
              <Link href="/assessment">
                <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="h-4 w-4" />}>
                  {isAr ? 'عرض التفاصيل' : 'View Details'}
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <RiskMatrix data={mockMatrixData} size="lg" />
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-red-500" />
                <span className="text-xs text-[var(--foreground-secondary)]">
                  {isAr ? 'حرج/رئيسي (17-25)' : 'Critical/Major (17-25)'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-yellow-500" />
                <span className="text-xs text-[var(--foreground-secondary)]">
                  {isAr ? 'متوسط (9-16)' : 'Moderate (9-16)'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-green-500" />
                <span className="text-xs text-[var(--foreground-secondary)]">
                  {isAr ? 'ثانوي/ضئيل (1-8)' : 'Minor/Negligible (1-8)'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[var(--primary)]" />
                {t('dashboard.upcomingDeadlines')}
              </CardTitle>
              <Link href="/treatment">
                <Button variant="ghost" size="sm">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockUpcomingDeadlines.map((deadline) => (
                <div
                  key={deadline.id}
                  className={`rounded-lg border p-3 ${
                    deadline.daysLeft <= 3
                      ? 'border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10'
                      : 'border-[var(--border)] bg-[var(--background-secondary)]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        {isAr ? deadline.titleAr : deadline.titleEn}
                      </p>
                      <code className="mt-1 inline-block rounded bg-[var(--background-tertiary)] px-1.5 py-0.5 text-xs">
                        {deadline.riskNumber}
                      </code>
                    </div>
                    <div
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        deadline.daysLeft <= 3
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          : deadline.daysLeft <= 7
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}
                    >
                      {isAr ? `${deadline.daysLeft} أيام` : `${deadline.daysLeft} days`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Risks Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('dashboard.recentRisks')}</CardTitle>
            <Link href="/risks">
              <Button variant="ghost" size="sm" rightIcon={<ArrowUpRight className="h-4 w-4" />}>
                {isAr ? 'عرض الكل' : 'View All'}
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="pb-3 text-start text-sm font-medium text-[var(--foreground-secondary)]">
                    {t('risks.riskId')}
                  </th>
                  <th className="pb-3 text-start text-sm font-medium text-[var(--foreground-secondary)]">
                    {t('risks.riskTitle')}
                  </th>
                  <th className="pb-3 text-start text-sm font-medium text-[var(--foreground-secondary)]">
                    {isAr ? 'التصنيف' : 'Rating'}
                  </th>
                  <th className="pb-3 text-start text-sm font-medium text-[var(--foreground-secondary)]">
                    {isAr ? 'الدرجة' : 'Score'}
                  </th>
                  <th className="pb-3 text-start text-sm font-medium text-[var(--foreground-secondary)]">
                    {isAr ? 'الرائد' : 'Champion'}
                  </th>
                  <th className="pb-3 text-start text-sm font-medium text-[var(--foreground-secondary)]">
                    {t('common.date')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockRecentRisks.map((risk) => (
                  <tr
                    key={risk.id}
                    className="border-b border-[var(--border)] transition-colors hover:bg-[var(--background-secondary)]"
                  >
                    <td className="py-4">
                      <code className="rounded bg-[var(--background-tertiary)] px-2 py-1 text-xs">
                        {risk.number}
                      </code>
                    </td>
                    <td className="py-4">
                      <div>
                        <p className="text-sm font-medium text-[var(--foreground)]">
                          {isAr ? risk.titleAr : risk.titleEn}
                        </p>
                        <p className="text-xs text-[var(--foreground-muted)]">
                          {isAr ? risk.departmentAr : risk.departmentEn}
                        </p>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${getRatingColor(risk.rating)}`}>
                        {getRatingLabel(risk.rating)}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className="text-sm font-bold text-[var(--foreground)]">{risk.score}</span>
                    </td>
                    <td className="py-4 text-sm text-[var(--foreground-secondary)]">
                      {isAr ? risk.championAr : risk.championEn}
                    </td>
                    <td className="py-4 text-sm text-[var(--foreground-secondary)]">
                      {new Date(risk.date).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Grid: Recent Activity & Champion Performance */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-[var(--primary)]" />
              {isAr ? 'النشاطات الأخيرة' : 'Recent Activity'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRecentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--background-tertiary)]">
                    <activity.icon className="h-4 w-4 text-[var(--foreground-secondary)]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-[var(--foreground)]">
                      <span className="font-medium">{isAr ? activity.userAr : activity.userEn}</span>{' '}
                      {isAr ? activity.typeAr : activity.typeEn}
                    </p>
                    <p className="text-xs text-[var(--foreground-secondary)]">
                      {isAr ? activity.targetAr : activity.targetEn}{' '}
                      <code className="rounded bg-[var(--background-tertiary)] px-1 text-[10px]">
                        {activity.riskNumber}
                      </code>
                    </p>
                    <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                      {isAr ? activity.time : activity.timeEn}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Champion Performance */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[var(--primary)]" />
                {isAr ? 'أداء الرواد' : 'Champion Performance'}
              </CardTitle>
              <Link href="/champions">
                <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="h-4 w-4" />}>
                  {isAr ? 'عرض الكل' : 'View All'}
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockChampionPerformance.map((champion, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary-light)] text-sm font-bold text-[var(--primary)]">
                    {(isAr ? champion.nameAr : champion.nameEn).charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-[var(--foreground)]">
                          {isAr ? champion.nameAr : champion.nameEn}
                        </p>
                        <p className="text-xs text-[var(--foreground-muted)]">
                          {isAr ? champion.departmentAr : champion.departmentEn} • {champion.risksManaged} {isAr ? 'مخاطر' : 'risks'}
                        </p>
                      </div>
                      <div
                        className={`text-sm font-bold ${
                          champion.resolutionRate >= 80
                            ? 'text-green-600'
                            : champion.resolutionRate >= 60
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {champion.resolutionRate}%
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--background-tertiary)]">
                      <div
                        className={`h-full rounded-full ${
                          champion.resolutionRate >= 80
                            ? 'bg-green-500'
                            : champion.resolutionRate >= 60
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${champion.resolutionRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
