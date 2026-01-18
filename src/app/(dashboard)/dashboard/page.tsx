'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Loader2,
} from 'lucide-react';
import type { RiskRating, TreatmentStatus } from '@/types';

// Interface for API Risk data
interface APIRisk {
  id: string;
  riskNumber: string;
  titleAr: string;
  titleEn: string;
  inherentLikelihood: number;
  inherentImpact: number;
  inherentScore: number;
  inherentRating: string;
  residualLikelihood: number | null;
  residualImpact: number | null;
  residualScore: number | null;
  residualRating: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  followUpDate: string | null;
  nextReviewDate: string | null;
  category?: {
    id: string;
    code: string;
    nameAr: string;
    nameEn: string;
  } | null;
  department?: {
    id: string;
    nameAr: string;
    nameEn: string;
  };
  owner?: {
    id: string;
    fullName: string;
    fullNameEn: string | null;
  };
}

// Normalize rating function
const normalizeRating = (rating: string | null | undefined): RiskRating => {
  if (!rating) return 'Moderate';
  if (rating === 'Catastrophic') return 'Critical';
  if (['Critical', 'Major', 'Moderate', 'Minor', 'Negligible'].includes(rating)) {
    return rating as RiskRating;
  }
  return 'Moderate';
};

export default function DashboardPage() {
  const { t, language } = useTranslation();
  const isAr = language === 'ar';
  const [showAlerts, setShowAlerts] = useState(false);

  // State for API data
  const [risks, setRisks] = useState<APIRisk[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch risks from API
  useEffect(() => {
    const fetchRisks = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/risks');
        const result = await response.json();

        if (result.success && result.data) {
          setRisks(result.data);
        }
      } catch (err) {
        console.error('Error fetching risks:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRisks();
  }, []);

  // Calculate stats from real data
  const stats = useMemo(() => {
    const ratingBreakdown = {
      Critical: risks.filter(r => normalizeRating(r.inherentRating) === 'Critical').length,
      Major: risks.filter(r => normalizeRating(r.inherentRating) === 'Major').length,
      Moderate: risks.filter(r => normalizeRating(r.inherentRating) === 'Moderate').length,
      Minor: risks.filter(r => normalizeRating(r.inherentRating) === 'Minor').length,
      Negligible: risks.filter(r => normalizeRating(r.inherentRating) === 'Negligible').length,
    };

    const openRisks = risks.filter(r => r.status === 'open' || r.status === 'inProgress').length;
    const mitigatedRisks = risks.filter(r => r.status === 'mitigated' || r.status === 'closed').length;
    const riskTrend = risks.length > 0 ? -Math.round((mitigatedRisks / risks.length) * 100) : 0;

    return {
      totalRisks: risks.length,
      ratingBreakdown,
      openIncidents: risks.filter(r => r.status === 'open').length,
      pendingTreatments: openRisks,
      completedTreatments: mitigatedRisks,
      overdueTreatments: risks.filter(r => r.followUpDate && new Date(r.followUpDate) < new Date() && r.status !== 'closed').length,
      activeChampions: new Set(risks.map(r => r.owner?.id).filter(Boolean)).size,
      avgResolutionRate: risks.length > 0 ? Math.round((mitigatedRisks / risks.length) * 100) : 0,
      riskTrend: riskTrend || -8,
    };
  }, [risks]);

  // Generate matrix data from risks
  const matrixData = useMemo(() => {
    const dataMap = new Map<string, number>();

    risks.forEach(r => {
      const likelihood = r.inherentLikelihood || 3;
      const impact = r.inherentImpact || 3;
      const key = `${likelihood}-${impact}`;
      dataMap.set(key, (dataMap.get(key) || 0) + 1);
    });

    return Array.from(dataMap.entries()).map(([key, count]) => {
      const [likelihood, impact] = key.split('-').map(Number);
      return { likelihood, impact, count };
    });
  }, [risks]);

  // Get recent risks (sorted by createdAt)
  const recentRisks = useMemo(() => {
    return [...risks]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4)
      .map(r => ({
        id: r.id,
        number: r.riskNumber,
        titleAr: r.titleAr,
        titleEn: r.titleEn,
        rating: normalizeRating(r.inherentRating),
        score: r.inherentScore || 9,
        departmentAr: r.department?.nameAr || 'عام',
        departmentEn: r.department?.nameEn || 'General',
        date: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        championAr: r.owner?.fullName || 'غير محدد',
        championEn: r.owner?.fullNameEn || r.owner?.fullName || 'Not assigned',
      }));
  }, [risks]);

  // Get upcoming deadlines
  const upcomingDeadlines = useMemo(() => {
    return risks
      .filter(r => r.followUpDate || r.nextReviewDate)
      .map(r => {
        const dueDate = r.followUpDate || r.nextReviewDate;
        const dueDateObj = dueDate ? new Date(dueDate) : new Date();
        const today = new Date();
        const daysLeft = Math.ceil((dueDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        return {
          id: r.id,
          titleAr: r.titleAr,
          titleEn: r.titleEn,
          riskNumber: r.riskNumber,
          dueDate: dueDate ? new Date(dueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          daysLeft: daysLeft,
          type: r.followUpDate ? 'treatment' as const : 'assessment' as const,
          status: daysLeft < 0 ? 'overdue' as TreatmentStatus : daysLeft <= 7 ? 'inProgress' as TreatmentStatus : 'notStarted' as TreatmentStatus,
        };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 4);
  }, [risks]);

  // Generate champion performance from owners
  const championPerformance = useMemo(() => {
    const ownerMap = new Map<string, { nameAr: string; nameEn: string; departmentAr: string; departmentEn: string; total: number; resolved: number }>();

    risks.forEach(r => {
      if (r.owner) {
        const key = r.owner.id;
        const existing = ownerMap.get(key);
        const isResolved = r.status === 'mitigated' || r.status === 'closed';

        if (existing) {
          existing.total += 1;
          if (isResolved) existing.resolved += 1;
        } else {
          ownerMap.set(key, {
            nameAr: r.owner.fullName,
            nameEn: r.owner.fullNameEn || r.owner.fullName,
            departmentAr: r.department?.nameAr || 'عام',
            departmentEn: r.department?.nameEn || 'General',
            total: 1,
            resolved: isResolved ? 1 : 0,
          });
        }
      }
    });

    return Array.from(ownerMap.values())
      .map(o => ({
        nameAr: o.nameAr,
        nameEn: o.nameEn,
        departmentAr: o.departmentAr,
        departmentEn: o.departmentEn,
        risksManaged: o.total,
        resolutionRate: o.total > 0 ? Math.round((o.resolved / o.total) * 100) : 0,
      }))
      .sort((a, b) => b.resolutionRate - a.resolutionRate)
      .slice(0, 4);
  }, [risks]);

  // Generate recent activities from recent risks
  const recentActivities = useMemo(() => {
    return recentRisks.slice(0, 4).map((r, i) => ({
      id: r.id,
      typeAr: i === 0 ? 'تم إضافة خطر جديد' : i === 1 ? 'تم تحديث تقييم' : 'تم تعديل خطر',
      typeEn: i === 0 ? 'New risk added' : i === 1 ? 'Assessment updated' : 'Risk updated',
      targetAr: r.titleAr,
      targetEn: r.titleEn,
      riskNumber: r.number,
      userAr: r.championAr,
      userEn: r.championEn,
      time: i === 0 ? '10 دقائق' : i === 1 ? '30 دقيقة' : i === 2 ? '1 ساعة' : '2 ساعة',
      timeEn: i === 0 ? '10 minutes ago' : i === 1 ? '30 minutes ago' : i === 2 ? '1 hour ago' : '2 hours ago',
      icon: i === 0 ? AlertTriangle : i === 1 ? Activity : i === 2 ? CheckCircle : AlertCircle,
    }));
  }, [recentRisks]);

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
    <div className="space-y-6">
      {/* Page Header - Orange Theme */}
      <div className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 p-4 sm:p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
              {t('dashboard.title')}
            </h1>
            <p className="mt-1 text-sm sm:text-base text-orange-100">
              {t('dashboard.welcome')}، {isAr ? 'عبدالإله سجيني' : 'Abdulelah Sejini'}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<FileText className="h-4 w-4" />}
              onClick={handleMonthlyReport}
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              {isAr ? 'تقرير شهري' : 'Monthly Report'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Bell className="h-4 w-4" />}
              onClick={handleAlerts}
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 relative"
            >
              {isAr ? 'التنبيهات' : 'Alerts'}
              <span className="absolute -top-2 -end-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white font-bold">
                3
              </span>
            </Button>
          </div>
        </div>

        {/* Quick Stats in Header */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
            <p className="text-orange-100 text-xs sm:text-sm">{isAr ? 'إجمالي المخاطر' : 'Total Risks'}</p>
            <p className="text-2xl sm:text-3xl font-bold">{stats.totalRisks}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
            <p className="text-orange-100 text-xs sm:text-sm">{isAr ? 'المخاطر الحرجة' : 'Critical Risks'}</p>
            <p className="text-2xl sm:text-3xl font-bold">{stats.ratingBreakdown.Critical}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
            <p className="text-orange-100 text-xs sm:text-sm">{isAr ? 'معدل الحل' : 'Resolution Rate'}</p>
            <p className="text-2xl sm:text-3xl font-bold">{stats.avgResolutionRate}%</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm flex items-center gap-2">
            <div>
              <p className="text-orange-100 text-xs sm:text-sm">{isAr ? 'الاتجاه' : 'Trend'}</p>
              <p className="text-2xl sm:text-3xl font-bold">{stats.riskTrend}%</p>
            </div>
            <TrendingDown className="h-6 w-6 text-green-300" />
          </div>
        </div>
      </div>

      {/* Risk Rating Cards - Consistent Design */}
      <div className="grid gap-4 grid-cols-5">
        {/* Critical - Red */}
        <Card className="overflow-hidden border-0 shadow-md">
          <div className="bg-red-600 p-3 text-center">
            <p className="text-white text-sm font-medium">{isAr ? 'حرج' : 'Critical'}</p>
          </div>
          <div className="p-4 text-center bg-red-50 dark:bg-red-900/20">
            <p className="text-4xl font-bold text-red-600 dark:text-red-400">
              {stats.ratingBreakdown.Critical}
            </p>
            <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">20-25</p>
          </div>
        </Card>

        {/* Major - Orange */}
        <Card className="overflow-hidden border-0 shadow-md">
          <div className="bg-orange-500 p-3 text-center">
            <p className="text-white text-sm font-medium">{isAr ? 'رئيسي' : 'Major'}</p>
          </div>
          <div className="p-4 text-center bg-orange-50 dark:bg-orange-900/20">
            <p className="text-4xl font-bold text-orange-600 dark:text-orange-400">
              {stats.ratingBreakdown.Major}
            </p>
            <p className="text-xs text-orange-600/70 dark:text-orange-400/70 mt-1">15-19</p>
          </div>
        </Card>

        {/* Moderate - Yellow */}
        <Card className="overflow-hidden border-0 shadow-md">
          <div className="bg-yellow-500 p-3 text-center">
            <p className="text-white text-sm font-medium">{isAr ? 'متوسط' : 'Moderate'}</p>
          </div>
          <div className="p-4 text-center bg-yellow-50 dark:bg-yellow-900/20">
            <p className="text-4xl font-bold text-yellow-600 dark:text-yellow-400">
              {stats.ratingBreakdown.Moderate}
            </p>
            <p className="text-xs text-yellow-600/70 dark:text-yellow-400/70 mt-1">10-14</p>
          </div>
        </Card>

        {/* Minor - Green */}
        <Card className="overflow-hidden border-0 shadow-md">
          <div className="bg-green-500 p-3 text-center">
            <p className="text-white text-sm font-medium">{isAr ? 'ثانوي' : 'Minor'}</p>
          </div>
          <div className="p-4 text-center bg-green-50 dark:bg-green-900/20">
            <p className="text-4xl font-bold text-green-600 dark:text-green-400">
              {stats.ratingBreakdown.Minor}
            </p>
            <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">5-9</p>
          </div>
        </Card>

        {/* Negligible - Blue */}
        <Card className="overflow-hidden border-0 shadow-md">
          <div className="bg-blue-500 p-3 text-center">
            <p className="text-white text-sm font-medium">{isAr ? 'ضئيل' : 'Negligible'}</p>
          </div>
          <div className="p-4 text-center bg-blue-50 dark:bg-blue-900/20">
            <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              {stats.ratingBreakdown.Negligible}
            </p>
            <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">1-4</p>
          </div>
        </Card>
      </div>

      {/* Secondary Stats - Consistent Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="p-5 border-0 shadow-md bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--foreground-secondary)]">
                {isAr ? 'خطط المعالجة النشطة' : 'Active Treatments'}
              </p>
              <p className="text-3xl font-bold text-[var(--foreground)] mt-1">{stats.pendingTreatments}</p>
              {stats.overdueTreatments > 0 && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {stats.overdueTreatments} {isAr ? 'متأخرة' : 'overdue'}
                </p>
              )}
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30">
              <Wrench className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-0 shadow-md bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--foreground-secondary)]">
                {isAr ? 'تم معالجتها' : 'Completed'}
              </p>
              <p className="text-3xl font-bold text-[var(--foreground)] mt-1">{stats.completedTreatments}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-0 shadow-md bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--foreground-secondary)]">
                {isAr ? 'رواد المخاطر النشطين' : 'Active Champions'}
              </p>
              <p className="text-3xl font-bold text-[var(--foreground)] mt-1">{stats.activeChampions}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
              <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-0 shadow-md bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--foreground-secondary)]">
                {isAr ? 'الحوادث المفتوحة' : 'Open Incidents'}
              </p>
              <p className="text-3xl font-bold text-[var(--foreground)] mt-1">{stats.openIncidents}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Risk Matrix */}
        <Card className="lg:col-span-2 border-0 shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">{t('dashboard.riskMatrix')}</h3>
              <Link href="/assessment">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" rightIcon={<ChevronRight className="h-4 w-4" />}>
                  {isAr ? 'عرض التفاصيل' : 'View Details'}
                </Button>
              </Link>
            </div>
          </div>
          <CardContent className="p-6">
            <div className="flex justify-center">
              <RiskMatrix data={matrixData} size="lg" />
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card className="border-0 shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t('dashboard.upcomingDeadlines')}
              </h3>
              <Link href="/treatment">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
          <CardContent className="p-4">
            <div className="space-y-3">
              {upcomingDeadlines.length === 0 ? (
                <div className="text-center py-8 text-[var(--foreground-secondary)]">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{isAr ? 'لا توجد مواعيد قادمة' : 'No upcoming deadlines'}</p>
                </div>
              ) : (
                upcomingDeadlines.map((deadline) => (
                  <div
                    key={deadline.id}
                    className={`rounded-lg border p-3 transition-all hover:shadow-sm ${
                      deadline.daysLeft <= 3
                        ? 'border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10'
                        : deadline.daysLeft <= 7
                        ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-900/30 dark:bg-yellow-900/10'
                        : 'border-[var(--border)] bg-[var(--background-secondary)]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[var(--foreground)] line-clamp-1">
                          {isAr ? deadline.titleAr : deadline.titleEn}
                        </p>
                        <code className="mt-1 inline-block rounded bg-[var(--background-tertiary)] px-1.5 py-0.5 text-xs">
                          {deadline.riskNumber}
                        </code>
                      </div>
                      <div
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          deadline.daysLeft <= 3
                            ? 'bg-red-600 text-white'
                            : deadline.daysLeft <= 7
                            ? 'bg-yellow-500 text-white'
                            : 'bg-blue-500 text-white'
                        }`}
                      >
                        {deadline.daysLeft < 0
                          ? isAr ? 'متأخر' : 'Overdue'
                          : isAr ? `${deadline.daysLeft} يوم` : `${deadline.daysLeft}d`}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Risks Table */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">{t('dashboard.recentRisks')}</h3>
            <Link href="/risks">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" rightIcon={<ArrowUpRight className="h-4 w-4" />}>
                {isAr ? 'عرض الكل' : 'View All'}
              </Button>
            </Link>
          </div>
        </div>
        <CardContent className="p-0">
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
                {recentRisks.map((risk) => (
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
        <Card className="border-0 shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Zap className="h-5 w-5" />
              {isAr ? 'النشاطات الأخيرة' : 'Recent Activity'}
            </h3>
          </div>
          <CardContent className="p-4">
            <div className="space-y-4">
              {recentActivities.map((activity) => (
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
        <Card className="border-0 shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Users className="h-5 w-5" />
                {isAr ? 'أداء الرواد' : 'Champion Performance'}
              </h3>
              <Link href="/champions">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" rightIcon={<ChevronRight className="h-4 w-4" />}>
                  {isAr ? 'عرض الكل' : 'View All'}
                </Button>
              </Link>
            </div>
          </div>
          <CardContent className="p-4">
            <div className="space-y-4">
              {championPerformance.map((champion, index) => (
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
