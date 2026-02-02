'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
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
  Sparkles,
  CircleDot,
  Play,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Download,
  RefreshCw,
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
  treatmentPlans?: TreatmentPlan[];
}

interface TreatmentPlan {
  id: string;
  titleAr: string;
  titleEn: string;
  strategy: string;
  status: string;
  priority: string;
  progress: number;
  startDate: string;
  dueDate: string;
  responsible?: {
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

// Animated counter hook
const useAnimatedCounter = (end: number, duration: number = 1000) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      setCount(Math.floor(progress * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return count;
};

// Animated stat card component
const AnimatedStatCard = ({
  value,
  label,
  icon: Icon,
  color,
  trend,
  delay = 0
}: {
  value: number;
  label: string;
  icon: React.ElementType;
  color: string;
  trend?: number;
  delay?: number;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const animatedValue = useAnimatedCounter(isVisible ? value : 0, 1500);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const colorClasses: Record<string, { bg: string; icon: string; text: string }> = {
    orange: { bg: 'bg-gradient-to-br from-orange-500 to-amber-500', icon: 'text-white', text: 'text-orange-600' },
    red: { bg: 'bg-gradient-to-br from-red-500 to-rose-500', icon: 'text-white', text: 'text-red-600' },
    green: { bg: 'bg-gradient-to-br from-emerald-500 to-green-500', icon: 'text-white', text: 'text-emerald-600' },
    blue: { bg: 'bg-gradient-to-br from-blue-500 to-indigo-500', icon: 'text-white', text: 'text-blue-600' },
    purple: { bg: 'bg-gradient-to-br from-purple-500 to-violet-500', icon: 'text-white', text: 'text-purple-600' },
  };

  const colors = colorClasses[color] || colorClasses.orange;

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800
        bg-white dark:bg-gray-900 p-5 shadow-sm
        transform transition-all duration-700 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1
      `}
    >
      {/* Background decoration */}
      <div className={`absolute -top-10 -end-10 w-32 h-32 rounded-full ${colors.bg} opacity-10 blur-2xl`} />

      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className={`text-3xl font-bold ${colors.text} dark:text-white`}>
              {animatedValue}
            </p>
            {trend !== undefined && (
              <span className={`text-xs font-medium flex items-center gap-0.5 ${trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(trend)}%
              </span>
            )}
          </div>
        </div>
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${colors.bg} shadow-lg`}>
          <Icon className={`h-7 w-7 ${colors.icon}`} />
        </div>
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const { t, language } = useTranslation();
  const isAr = language === 'ar';
  const [showAlerts, setShowAlerts] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // State for API data
  const [risks, setRisks] = useState<APIRisk[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch risks from API with treatment plans
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/risks?includeTreatments=true');
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

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Calculate stats from real data including treatment plans
  const stats = useMemo(() => {
    const ratingBreakdown = {
      Critical: risks.filter(r => normalizeRating(r.inherentRating) === 'Critical').length,
      Major: risks.filter(r => normalizeRating(r.inherentRating) === 'Major').length,
      Moderate: risks.filter(r => normalizeRating(r.inherentRating) === 'Moderate').length,
      Minor: risks.filter(r => normalizeRating(r.inherentRating) === 'Minor').length,
      Negligible: risks.filter(r => normalizeRating(r.inherentRating) === 'Negligible').length,
    };

    // Count treatment plans
    let totalTreatments = 0;
    let completedTreatments = 0;
    let inProgressTreatments = 0;
    let overdueTreatments = 0;
    let notStartedTreatments = 0;

    risks.forEach(risk => {
      if (risk.treatmentPlans && risk.treatmentPlans.length > 0) {
        risk.treatmentPlans.forEach(plan => {
          totalTreatments++;
          if (plan.status === 'completed') completedTreatments++;
          else if (plan.status === 'inProgress') inProgressTreatments++;
          else if (plan.status === 'notStarted') notStartedTreatments++;

          // Check if overdue
          if (plan.dueDate && new Date(plan.dueDate) < new Date() && plan.status !== 'completed') {
            overdueTreatments++;
          }
        });
      }
    });

    const openRisks = risks.filter(r => r.status === 'open' || r.status === 'inProgress').length;
    const mitigatedRisks = risks.filter(r => r.status === 'mitigated' || r.status === 'closed').length;
    const riskTrend = risks.length > 0 ? -Math.round((mitigatedRisks / risks.length) * 100) : 0;

    return {
      totalRisks: risks.length,
      ratingBreakdown,
      openIncidents: risks.filter(r => r.status === 'open').length,
      totalTreatments,
      completedTreatments,
      inProgressTreatments,
      notStartedTreatments,
      overdueTreatments,
      activeChampions: new Set(risks.map(r => r.owner?.id).filter(Boolean)).size,
      avgResolutionRate: risks.length > 0 ? Math.round((mitigatedRisks / risks.length) * 100) : 0,
      treatmentCompletionRate: totalTreatments > 0 ? Math.round((completedTreatments / totalTreatments) * 100) : 0,
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
      .slice(0, 5)
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
        hasTreatment: r.treatmentPlans && r.treatmentPlans.length > 0,
      }));
  }, [risks]);

  // Get upcoming deadlines from treatment plans
  const upcomingDeadlines = useMemo(() => {
    const deadlines: Array<{
      id: string;
      treatmentId: string;
      titleAr: string;
      titleEn: string;
      riskNumber: string;
      riskId: string;
      dueDate: string;
      daysLeft: number;
      type: 'treatment';
      status: TreatmentStatus;
      progress: number;
      responsibleAr: string;
      responsibleEn: string;
    }> = [];

    risks.forEach(risk => {
      if (risk.treatmentPlans && risk.treatmentPlans.length > 0) {
        risk.treatmentPlans.forEach(plan => {
          if (plan.dueDate && plan.status !== 'completed') {
            const dueDateObj = new Date(plan.dueDate);
            const today = new Date();
            const daysLeft = Math.ceil((dueDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            deadlines.push({
              id: plan.id,
              treatmentId: plan.id,
              titleAr: plan.titleAr || `خطة معالجة ${risk.riskNumber}`,
              titleEn: plan.titleEn || `Treatment for ${risk.riskNumber}`,
              riskNumber: risk.riskNumber,
              riskId: risk.id,
              dueDate: plan.dueDate,
              daysLeft,
              type: 'treatment',
              status: daysLeft < 0 ? 'overdue' : daysLeft <= 7 ? 'inProgress' : 'notStarted',
              progress: plan.progress || 0,
              responsibleAr: plan.responsible?.fullName || 'غير محدد',
              responsibleEn: plan.responsible?.fullNameEn || plan.responsible?.fullName || 'Not assigned',
            });
          }
        });
      }
    });

    return deadlines
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 5);
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

  // Generate alerts based on actual risk data
  const alertsData = useMemo(() => {
    const alerts: Array<{
      type: 'critical' | 'warning' | 'info';
      titleAr: string;
      titleEn: string;
      descAr: string;
      descEn: string;
      link?: string;
    }> = [];

    // Alert for critical risks
    const criticalCount = stats.ratingBreakdown.Critical;
    if (criticalCount > 0) {
      alerts.push({
        type: 'critical',
        titleAr: `${criticalCount} مخاطر حرجة تتطلب اهتمام فوري`,
        titleEn: `${criticalCount} critical risks require immediate attention`,
        descAr: 'يوجد مخاطر بتصنيف حرج في السجل',
        descEn: 'There are risks with critical rating in the register',
        link: '/risks?rating=Critical',
      });
    }

    // Alert for overdue treatments
    if (stats.overdueTreatments > 0) {
      alerts.push({
        type: 'warning',
        titleAr: `${stats.overdueTreatments} خطط معالجة متأخرة`,
        titleEn: `${stats.overdueTreatments} treatment plans overdue`,
        descAr: 'هناك خطط معالجة تجاوزت موعد الانتهاء',
        descEn: 'Some treatment plans have passed their due date',
        link: '/treatment?status=overdue',
      });
    }

    // Alert for overdue reviews
    const overdueRisks = risks.filter(r => {
      if (!r.nextReviewDate) return false;
      return new Date(r.nextReviewDate) < new Date();
    });
    if (overdueRisks.length > 0) {
      alerts.push({
        type: 'warning',
        titleAr: `${overdueRisks.length} مخاطر تجاوزت موعد المراجعة`,
        titleEn: `${overdueRisks.length} risks overdue for review`,
        descAr: 'هناك مخاطر تحتاج مراجعة دورية',
        descEn: 'Some risks need periodic review',
        link: '/risks',
      });
    }

    // Alert for unassigned risks
    const unassignedRisks = risks.filter(r => !r.owner);
    if (unassignedRisks.length > 0) {
      alerts.push({
        type: 'info',
        titleAr: `${unassignedRisks.length} مخاطر بدون مالك`,
        titleEn: `${unassignedRisks.length} risks without owner`,
        descAr: 'يرجى تعيين مالك لهذه المخاطر',
        descEn: 'Please assign owners to these risks',
        link: '/risks',
      });
    }

    // Alert for risks without treatment plans
    const risksWithoutTreatment = risks.filter(r =>
      !r.treatmentPlans || r.treatmentPlans.length === 0
    ).filter(r => r.status !== 'closed' && r.status !== 'mitigated');

    if (risksWithoutTreatment.length > 0) {
      alerts.push({
        type: 'info',
        titleAr: `${risksWithoutTreatment.length} مخاطر بدون خطة معالجة`,
        titleEn: `${risksWithoutTreatment.length} risks without treatment plan`,
        descAr: 'يرجى إضافة خطط معالجة لهذه المخاطر',
        descEn: 'Please add treatment plans for these risks',
        link: '/treatment',
      });
    }

    return alerts;
  }, [risks, stats]);

  // Handle Monthly Report generation
  const handleMonthlyReport = () => {
    const headers = [
      'Risk ID', 'Title', 'Category', 'Rating', 'Score', 'Status', 'Owner', 'Treatment Plans', 'Due Date'
    ];
    const rows = risks.map(r => [
      r.riskNumber,
      isAr ? r.titleAr : r.titleEn,
      r.category ? (isAr ? r.category.nameAr : r.category.nameEn) : '',
      r.inherentRating,
      r.inherentScore,
      r.status,
      r.owner?.fullName || '',
      r.treatmentPlans?.length || 0,
      r.followUpDate || ''
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `monthly_risk_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
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
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-orange-200 rounded-full animate-spin border-t-orange-500 mx-auto" />
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-orange-500 animate-pulse" />
          </div>
          <p className="mt-4 text-gray-500 dark:text-gray-400 animate-pulse">
            {isAr ? 'جاري تحميل لوحة المعلومات...' : 'Loading dashboard...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header with Glass Effect */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 p-6 shadow-xl">
        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -end-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-20 -start-20 w-48 h-48 bg-white/10 rounded-full blur-2xl animate-pulse delay-300" />
          <div className="absolute top-1/2 start-1/3 w-32 h-32 bg-white/5 rounded-full blur-xl animate-bounce" style={{ animationDuration: '3s' }} />
        </div>

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-white">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-8 w-8" />
              <h1 className="text-2xl sm:text-3xl font-bold">
                {t('dashboard.title')}
              </h1>
            </div>
            <p className="text-white/80 text-sm sm:text-base">
              {t('dashboard.welcome')}، {session?.user?.name || (isAr ? 'مستخدم' : 'User')}
            </p>
            <p className="text-white/60 text-xs mt-1">
              {new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="bg-white/20 border-white/30 text-white hover:bg-white/30 rounded-xl backdrop-blur-sm"
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 me-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isAr ? 'تحديث' : 'Refresh'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={handleMonthlyReport}
              className="bg-white/20 border-white/30 text-white hover:bg-white/30 rounded-xl backdrop-blur-sm"
            >
              {isAr ? 'تقرير شهري' : 'Monthly Report'}
            </Button>
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Bell className="h-4 w-4" />}
                onClick={() => setShowAlerts(!showAlerts)}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30 rounded-xl backdrop-blur-sm relative"
              >
                {isAr ? 'التنبيهات' : 'Alerts'}
                {alertsData.length > 0 && (
                  <span className="absolute -top-2 -end-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white font-bold animate-bounce">
                    {alertsData.length}
                  </span>
                )}
              </Button>

              {/* Alerts Dropdown */}
              {showAlerts && (
                <>
                  <div className="fixed inset-0 z-[100]" onClick={() => setShowAlerts(false)} />
                  <div className={`absolute top-full z-[110] mt-2 w-80 sm:w-96 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl ${isAr ? 'left-0' : 'right-0'} animate-slideDown`}>
                    <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {isAr ? 'التنبيهات' : 'Alerts'}
                        <span className="ms-2 text-xs font-normal text-gray-500">
                          ({alertsData.length})
                        </span>
                      </h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                      {alertsData.length === 0 ? (
                        <div className="p-8 text-center">
                          <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
                          <p className="mt-2 text-sm text-gray-500">
                            {isAr ? 'لا توجد تنبيهات - كل شيء على ما يرام!' : 'No alerts - everything is fine!'}
                          </p>
                        </div>
                      ) : (
                        alertsData.map((alert, index) => (
                          <Link
                            key={index}
                            href={alert.link || '#'}
                            className="block p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            onClick={() => setShowAlerts(false)}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-xl ${
                                alert.type === 'critical' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                                alert.type === 'warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                                'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                              }`}>
                                {alert.type === 'critical' ? <AlertTriangle className="h-4 w-4" /> :
                                 alert.type === 'warning' ? <AlertCircle className="h-4 w-4" /> :
                                 <Info className="h-4 w-4" />}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {isAr ? alert.titleAr : alert.titleEn}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {isAr ? alert.descAr : alert.descEn}
                                </p>
                              </div>
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats in Header */}
        <div className="relative z-10 mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <p className="text-white/70 text-xs">{isAr ? 'إجمالي المخاطر' : 'Total Risks'}</p>
            <p className="text-3xl font-bold text-white">{stats.totalRisks}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <p className="text-white/70 text-xs">{isAr ? 'خطط المعالجة' : 'Treatment Plans'}</p>
            <p className="text-3xl font-bold text-white">{stats.totalTreatments}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <p className="text-white/70 text-xs">{isAr ? 'معدل الإنجاز' : 'Completion Rate'}</p>
            <p className="text-3xl font-bold text-white">{stats.treatmentCompletionRate}%</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/20 flex items-center gap-2">
            <div>
              <p className="text-white/70 text-xs">{isAr ? 'المخاطر الحرجة' : 'Critical'}</p>
              <p className="text-3xl font-bold text-white">{stats.ratingBreakdown.Critical}</p>
            </div>
            {stats.ratingBreakdown.Critical > 0 && (
              <AlertTriangle className="h-6 w-6 text-white animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {/* Risk Rating Cards with Animation */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-5">
        {[
          { key: 'Critical', labelAr: 'حرج', labelEn: 'Critical', range: '20-25', gradient: 'from-red-500 to-rose-600', border: 'border-red-200', bg: 'from-red-50', text: 'text-red-600' },
          { key: 'Major', labelAr: 'رئيسي', labelEn: 'Major', range: '15-19', gradient: 'from-orange-500 to-amber-500', border: 'border-orange-200', bg: 'from-orange-50', text: 'text-orange-600' },
          { key: 'Moderate', labelAr: 'متوسط', labelEn: 'Moderate', range: '10-14', gradient: 'from-yellow-400 to-amber-400', border: 'border-yellow-200', bg: 'from-yellow-50', text: 'text-yellow-600' },
          { key: 'Minor', labelAr: 'ثانوي', labelEn: 'Minor', range: '5-9', gradient: 'from-emerald-500 to-green-500', border: 'border-emerald-200', bg: 'from-emerald-50', text: 'text-emerald-600' },
          { key: 'Negligible', labelAr: 'ضئيل', labelEn: 'Negligible', range: '1-4', gradient: 'from-sky-500 to-blue-500', border: 'border-sky-200', bg: 'from-sky-50', text: 'text-sky-600' },
        ].map((item, index) => (
          <Card
            key={item.key}
            className={`overflow-hidden ${item.border} shadow-sm rounded-2xl bg-gradient-to-b ${item.bg} to-white dark:to-gray-900 transform transition-all duration-500 hover:scale-105 hover:shadow-lg`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={`bg-gradient-to-r ${item.gradient} p-2.5 sm:p-3 text-center`}>
              <p className="text-white text-xs sm:text-sm font-semibold drop-shadow-sm">
                {isAr ? item.labelAr : item.labelEn}
              </p>
            </div>
            <div className="p-3 sm:p-4 text-center">
              <p className={`text-3xl sm:text-4xl font-bold ${item.text} dark:text-white`}>
                {stats.ratingBreakdown[item.key as keyof typeof stats.ratingBreakdown]}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-1 font-medium">{item.range}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Secondary Stats with Animated Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <AnimatedStatCard
          value={stats.inProgressTreatments}
          label={isAr ? 'خطط قيد التنفيذ' : 'In Progress'}
          icon={Play}
          color="blue"
          delay={100}
        />
        <AnimatedStatCard
          value={stats.completedTreatments}
          label={isAr ? 'خطط مكتملة' : 'Completed'}
          icon={CheckCircle}
          color="green"
          delay={200}
        />
        <AnimatedStatCard
          value={stats.overdueTreatments}
          label={isAr ? 'خطط متأخرة' : 'Overdue'}
          icon={Clock}
          color="red"
          delay={300}
        />
        <AnimatedStatCard
          value={stats.activeChampions}
          label={isAr ? 'رواد المخاطر' : 'Risk Champions'}
          icon={Users}
          color="purple"
          delay={400}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Risk Matrix */}
        <Card className="lg:col-span-2 border border-gray-200 dark:border-gray-800 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-gray-900">
          <div className="border-b border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-orange-500" />
                {t('dashboard.riskMatrix')}
              </h3>
              <Link href="/assessment">
                <Button variant="ghost" size="sm" className="text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20" rightIcon={<ChevronRight className="h-4 w-4" />}>
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

        {/* Upcoming Deadlines - Connected to Treatment Plans */}
        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-gray-900">
          <div className="border-b border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-500" />
                {t('dashboard.upcomingDeadlines')}
              </h3>
              <Link href="/treatment">
                <Button variant="ghost" size="sm" className="text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
          <CardContent className="p-4">
            <div className="space-y-3">
              {upcomingDeadlines.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-3">
                    <CheckCircle className="h-8 w-8 text-emerald-500" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isAr ? 'لا توجد مواعيد قادمة' : 'No upcoming deadlines'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {isAr ? 'جميع خطط المعالجة على المسار الصحيح' : 'All treatment plans are on track'}
                  </p>
                </div>
              ) : (
                upcomingDeadlines.map((deadline, index) => (
                  <Link
                    key={deadline.id}
                    href={`/treatment/${deadline.treatmentId}`}
                    className={`
                      block rounded-xl border p-3 transition-all hover:shadow-md transform hover:-translate-y-0.5
                      ${deadline.daysLeft < 0
                        ? 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800'
                        : deadline.daysLeft <= 3
                        ? 'border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800'
                        : deadline.daysLeft <= 7
                        ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800'
                        : 'border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700'
                      }
                    `}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {isAr ? deadline.titleAr : deadline.titleEn}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="rounded bg-white dark:bg-gray-900 px-1.5 py-0.5 text-xs border border-gray-200 dark:border-gray-700">
                            {deadline.riskNumber}
                          </code>
                          <span className="text-xs text-gray-500">
                            {isAr ? deadline.responsibleAr : deadline.responsibleEn}
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>{isAr ? 'التقدم' : 'Progress'}</span>
                            <span>{deadline.progress}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                deadline.progress >= 80 ? 'bg-emerald-500' :
                                deadline.progress >= 50 ? 'bg-amber-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${deadline.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <div
                        className={`shrink-0 rounded-xl px-2.5 py-1.5 text-xs font-bold ${
                          deadline.daysLeft < 0
                            ? 'bg-red-600 text-white'
                            : deadline.daysLeft <= 3
                            ? 'bg-orange-500 text-white'
                            : deadline.daysLeft <= 7
                            ? 'bg-yellow-500 text-white'
                            : 'bg-blue-500 text-white'
                        }`}
                      >
                        {deadline.daysLeft < 0
                          ? isAr ? `متأخر ${Math.abs(deadline.daysLeft)}d` : `${Math.abs(deadline.daysLeft)}d late`
                          : isAr ? `${deadline.daysLeft} يوم` : `${deadline.daysLeft}d`}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Risks Table */}
      <Card className="border border-gray-200 dark:border-gray-800 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-gray-900">
        <div className="border-b border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-500" />
              {t('dashboard.recentRisks')}
            </h3>
            <Link href="/risks">
              <Button variant="ghost" size="sm" className="text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20" rightIcon={<ArrowUpRight className="h-4 w-4" />}>
                {isAr ? 'عرض الكل' : 'View All'}
              </Button>
            </Link>
          </div>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-4 py-3 text-start text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('risks.riskId')}
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('risks.riskTitle')}
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {isAr ? 'التصنيف' : 'Rating'}
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {isAr ? 'خطة معالجة' : 'Treatment'}
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {isAr ? 'الرائد' : 'Champion'}
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('common.date')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {recentRisks.map((risk, index) => (
                  <tr
                    key={risk.id}
                    className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 animate-fadeIn"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-4 py-4">
                      <code className="rounded-lg bg-gray-100 dark:bg-gray-800 px-2 py-1 text-xs font-mono">
                        {risk.number}
                      </code>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {isAr ? risk.titleAr : risk.titleEn}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {isAr ? risk.departmentAr : risk.departmentEn}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getRatingColor(risk.rating)}`}>
                        {getRatingLabel(risk.rating)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {risk.hasTreatment ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-xs">{isAr ? 'نعم' : 'Yes'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-400">
                          <XCircle className="h-4 w-4" />
                          <span className="text-xs">{isAr ? 'لا' : 'No'}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {isAr ? risk.championAr : risk.championEn}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {new Date(risk.date).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Grid: Champion Performance */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Treatment Status Overview */}
        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-gray-900">
          <div className="border-b border-gray-200 dark:border-gray-800 p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-500" />
              {isAr ? 'حالة خطط المعالجة' : 'Treatment Plans Status'}
            </h3>
          </div>
          <CardContent className="p-4">
            <div className="space-y-4">
              {[
                { label: isAr ? 'لم يبدأ' : 'Not Started', value: stats.notStartedTreatments, color: 'bg-gray-500', icon: CircleDot },
                { label: isAr ? 'قيد التنفيذ' : 'In Progress', value: stats.inProgressTreatments, color: 'bg-blue-500', icon: Play },
                { label: isAr ? 'مكتمل' : 'Completed', value: stats.completedTreatments, color: 'bg-emerald-500', icon: CheckCircle2 },
                { label: isAr ? 'متأخر' : 'Overdue', value: stats.overdueTreatments, color: 'bg-red-500', icon: Clock },
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${item.color} bg-opacity-20`}>
                    <item.icon className={`h-4 w-4 ${item.color.replace('bg-', 'text-')}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{item.value}</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-1000 ease-out`}
                        style={{ width: `${stats.totalTreatments > 0 ? (item.value / stats.totalTreatments) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {stats.totalTreatments > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{isAr ? 'معدل الإنجاز الكلي' : 'Overall Completion Rate'}</span>
                  <span className="text-2xl font-bold text-orange-500">{stats.treatmentCompletionRate}%</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Champion Performance */}
        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-gray-900">
          <div className="border-b border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-500" />
                {isAr ? 'أداء الرواد' : 'Champion Performance'}
              </h3>
              <Link href="/users">
                <Button variant="ghost" size="sm" className="text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20" rightIcon={<ChevronRight className="h-4 w-4" />}>
                  {isAr ? 'عرض الكل' : 'View All'}
                </Button>
              </Link>
            </div>
          </div>
          <CardContent className="p-4">
            {championPerformance.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-sm text-gray-500">{isAr ? 'لا يوجد رواد مخاطر بعد' : 'No risk champions yet'}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {championPerformance.map((champion, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors animate-fadeIn"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-sm font-bold text-white shadow-md">
                      {(isAr ? champion.nameAr : champion.nameEn).charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {isAr ? champion.nameAr : champion.nameEn}
                          </p>
                          <p className="text-xs text-gray-500">
                            {isAr ? champion.departmentAr : champion.departmentEn} • {champion.risksManaged} {isAr ? 'مخاطر' : 'risks'}
                          </p>
                        </div>
                        <div
                          className={`text-sm font-bold px-2 py-1 rounded-lg ${
                            champion.resolutionRate >= 80
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : champion.resolutionRate >= 60
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                        >
                          {champion.resolutionRate}%
                        </div>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ease-out ${
                            champion.resolutionRate >= 80
                              ? 'bg-emerald-500'
                              : champion.resolutionRate >= 60
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${champion.resolutionRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add CSS animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
