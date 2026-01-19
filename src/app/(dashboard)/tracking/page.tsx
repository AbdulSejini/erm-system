'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  AlertTriangle,
  Building2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  Filter,
  Search,
  TrendingUp,
  TrendingDown,
  Target,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  User,
  BarChart3,
  Loader2,
  RefreshCw,
  ArrowUpRight,
  Shield,
  Activity,
} from 'lucide-react';
import type { RiskRating } from '@/types';

interface Department {
  id: string;
  nameAr: string;
  nameEn: string;
  code: string;
  riskChampion?: {
    id: string;
    fullName: string;
    fullNameEn: string | null;
  } | null;
}

interface Risk {
  id: string;
  riskNumber: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  inherentLikelihood: number;
  inherentImpact: number;
  inherentScore: number;
  inherentRating: string;
  residualLikelihood: number | null;
  residualImpact: number | null;
  residualScore: number | null;
  residualRating: string | null;
  status: string;
  approvalStatus: string | null;
  followUpDate: string | null;
  nextReviewDate: string | null;
  createdAt: string;
  updatedAt: string;
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
  champion?: {
    id: string;
    fullName: string;
    fullNameEn: string | null;
  } | null;
  category?: {
    id: string;
    code: string;
    nameAr: string;
    nameEn: string;
    color: string | null;
  } | null;
  _count?: {
    comments: number;
  };
}

interface DepartmentStats {
  department: Department;
  risks: Risk[];
  totalRisks: number;
  criticalRisks: number;
  majorRisks: number;
  moderateRisks: number;
  minorRisks: number;
  negligibleRisks: number;
  openRisks: number;
  inProgressRisks: number;
  mitigatedRisks: number;
  overdueRisks: number;
  upcomingReviews: number;
  avgInherentScore: number;
  avgResidualScore: number;
  riskReductionPercentage: number;
}

const getRatingColor = (rating: string): string => {
  switch (rating) {
    case 'Critical':
      return 'bg-red-500';
    case 'Major':
      return 'bg-orange-500';
    case 'Moderate':
      return 'bg-yellow-500';
    case 'Minor':
      return 'bg-blue-500';
    case 'Negligible':
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
};

const getRatingBgLight = (rating: string): string => {
  switch (rating) {
    case 'Critical':
      return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    case 'Major':
      return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
    case 'Moderate':
      return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    case 'Minor':
      return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    case 'Negligible':
      return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    default:
      return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'open':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'inProgress':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'mitigated':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'accepted':
      return <Shield className="h-4 w-4 text-blue-500" />;
    case 'closed':
      return <XCircle className="h-4 w-4 text-gray-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-500" />;
  }
};

export default function RiskTrackingPage() {
  const { t, language } = useTranslation();
  const isAr = language === 'ar';

  const [loading, setLoading] = useState(true);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'departments' | 'timeline'>('departments');

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [risksRes, deptsRes] = await Promise.all([
          fetch('/api/risks'),
          fetch('/api/departments'),
        ]);

        const risksData = await risksRes.json();
        const deptsData = await deptsRes.json();

        if (risksData.success) {
          setRisks(risksData.data || []);
        }
        if (deptsData.success) {
          setDepartments(deptsData.data || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate department statistics
  const departmentStats = useMemo((): DepartmentStats[] => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    return departments.map((dept) => {
      const deptRisks = risks.filter((r) => r.department?.id === dept.id);

      // Filter by search and filters
      const filteredRisks = deptRisks.filter((risk) => {
        const matchesSearch =
          !searchQuery ||
          risk.titleAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
          risk.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
          risk.riskNumber.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRating =
          !selectedRating ||
          risk.inherentRating === selectedRating ||
          risk.residualRating === selectedRating;

        const matchesStatus = !selectedStatus || risk.status === selectedStatus;

        return matchesSearch && matchesRating && matchesStatus;
      });

      const criticalRisks = filteredRisks.filter(
        (r) => r.inherentRating === 'Critical' || r.residualRating === 'Critical'
      ).length;
      const majorRisks = filteredRisks.filter(
        (r) => r.inherentRating === 'Major' || r.residualRating === 'Major'
      ).length;
      const moderateRisks = filteredRisks.filter(
        (r) => r.inherentRating === 'Moderate' || r.residualRating === 'Moderate'
      ).length;
      const minorRisks = filteredRisks.filter(
        (r) => r.inherentRating === 'Minor' || r.residualRating === 'Minor'
      ).length;
      const negligibleRisks = filteredRisks.filter(
        (r) => r.inherentRating === 'Negligible' || r.residualRating === 'Negligible'
      ).length;

      const openRisks = filteredRisks.filter((r) => r.status === 'open').length;
      const inProgressRisks = filteredRisks.filter((r) => r.status === 'inProgress').length;
      const mitigatedRisks = filteredRisks.filter(
        (r) => r.status === 'mitigated' || r.status === 'closed'
      ).length;

      const overdueRisks = filteredRisks.filter((r) => {
        if (!r.followUpDate) return false;
        return new Date(r.followUpDate) < today;
      }).length;

      const upcomingReviews = filteredRisks.filter((r) => {
        if (!r.nextReviewDate) return false;
        const reviewDate = new Date(r.nextReviewDate);
        return reviewDate >= today && reviewDate <= nextWeek;
      }).length;

      const avgInherentScore =
        filteredRisks.length > 0
          ? filteredRisks.reduce((sum, r) => sum + r.inherentScore, 0) / filteredRisks.length
          : 0;

      const risksWithResidual = filteredRisks.filter((r) => r.residualScore !== null);
      const avgResidualScore =
        risksWithResidual.length > 0
          ? risksWithResidual.reduce((sum, r) => sum + (r.residualScore || 0), 0) /
            risksWithResidual.length
          : 0;

      const riskReductionPercentage =
        avgInherentScore > 0 ? ((avgInherentScore - avgResidualScore) / avgInherentScore) * 100 : 0;

      return {
        department: dept,
        risks: filteredRisks,
        totalRisks: filteredRisks.length,
        criticalRisks,
        majorRisks,
        moderateRisks,
        minorRisks,
        negligibleRisks,
        openRisks,
        inProgressRisks,
        mitigatedRisks,
        overdueRisks,
        upcomingReviews,
        avgInherentScore,
        avgResidualScore,
        riskReductionPercentage,
      };
    }).filter((stats) => stats.totalRisks > 0 || !searchQuery);
  }, [departments, risks, searchQuery, selectedRating, selectedStatus]);

  // Overall statistics
  const overallStats = useMemo(() => {
    const totalRisks = departmentStats.reduce((sum, d) => sum + d.totalRisks, 0);
    const criticalRisks = departmentStats.reduce((sum, d) => sum + d.criticalRisks, 0);
    const majorRisks = departmentStats.reduce((sum, d) => sum + d.majorRisks, 0);
    const overdueRisks = departmentStats.reduce((sum, d) => sum + d.overdueRisks, 0);
    const upcomingReviews = departmentStats.reduce((sum, d) => sum + d.upcomingReviews, 0);
    const avgReduction =
      departmentStats.length > 0
        ? departmentStats.reduce((sum, d) => sum + d.riskReductionPercentage, 0) /
          departmentStats.filter((d) => d.totalRisks > 0).length
        : 0;

    return {
      totalRisks,
      criticalRisks,
      majorRisks,
      overdueRisks,
      upcomingReviews,
      avgReduction: isNaN(avgReduction) ? 0 : avgReduction,
      departmentsWithRisks: departmentStats.filter((d) => d.totalRisks > 0).length,
    };
  }, [departmentStats]);

  const toggleDepartment = (deptId: string) => {
    const newExpanded = new Set(expandedDepartments);
    if (newExpanded.has(deptId)) {
      newExpanded.delete(deptId);
    } else {
      newExpanded.add(deptId);
    }
    setExpandedDepartments(newExpanded);
  };

  const expandAll = () => {
    setExpandedDepartments(new Set(departmentStats.map((d) => d.department.id)));
  };

  const collapseAll = () => {
    setExpandedDepartments(new Set());
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[var(--primary)]" />
          <p className="text-[var(--foreground-secondary)]">
            {isAr ? 'جاري تحميل البيانات...' : 'Loading data...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            {isAr ? 'متابعة المخاطر' : 'Risk Tracking'}
          </h1>
          <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
            {isAr
              ? 'متابعة وتتبع المخاطر حسب الإدارة والوظيفة'
              : 'Track and monitor risks by department'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            {isAr ? 'فلترة' : 'Filter'}
          </Button>
          <Button variant="outline" size="sm" onClick={expandAll} className="gap-2">
            <ChevronDown className="h-4 w-4" />
            {isAr ? 'توسيع الكل' : 'Expand All'}
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll} className="gap-2">
            <ChevronUp className="h-4 w-4" />
            {isAr ? 'طي الكل' : 'Collapse All'}
          </Button>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Card className="border-l-4 border-l-[var(--primary)]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary-light)]">
                <Target className="h-5 w-5 text-[var(--primary)]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--foreground)]">
                  {overallStats.totalRisks}
                </p>
                <p className="text-xs text-[var(--foreground-secondary)]">
                  {isAr ? 'إجمالي المخاطر' : 'Total Risks'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/20">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{overallStats.criticalRisks}</p>
                <p className="text-xs text-[var(--foreground-secondary)]">
                  {isAr ? 'مخاطر حرجة' : 'Critical'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-900/20">
                <AlertCircle className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{overallStats.majorRisks}</p>
                <p className="text-xs text-[var(--foreground-secondary)]">
                  {isAr ? 'مخاطر كبيرة' : 'Major'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{overallStats.overdueRisks}</p>
                <p className="text-xs text-[var(--foreground-secondary)]">
                  {isAr ? 'متأخرة' : 'Overdue'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{overallStats.upcomingReviews}</p>
                <p className="text-xs text-[var(--foreground-secondary)]">
                  {isAr ? 'مراجعات قادمة' : 'Upcoming'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/20">
                <TrendingDown className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {overallStats.avgReduction.toFixed(0)}%
                </p>
                <p className="text-xs text-[var(--foreground-secondary)]">
                  {isAr ? 'نسبة التخفيف' : 'Reduction'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
                <Input
                  placeholder={isAr ? 'بحث في المخاطر...' : 'Search risks...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-10"
                />
              </div>

              <Select
                value={selectedRating}
                onChange={(value) => setSelectedRating(value)}
                options={[
                  { value: '', label: isAr ? 'جميع التصنيفات' : 'All Ratings' },
                  { value: 'Critical', label: isAr ? 'حرج' : 'Critical' },
                  { value: 'Major', label: isAr ? 'كبير' : 'Major' },
                  { value: 'Moderate', label: isAr ? 'متوسط' : 'Moderate' },
                  { value: 'Minor', label: isAr ? 'طفيف' : 'Minor' },
                  { value: 'Negligible', label: isAr ? 'ضئيل' : 'Negligible' },
                ]}
              />

              <Select
                value={selectedStatus}
                onChange={(value) => setSelectedStatus(value)}
                options={[
                  { value: '', label: isAr ? 'جميع الحالات' : 'All Statuses' },
                  { value: 'open', label: isAr ? 'مفتوح' : 'Open' },
                  { value: 'inProgress', label: isAr ? 'قيد التنفيذ' : 'In Progress' },
                  { value: 'mitigated', label: isAr ? 'تم التخفيف' : 'Mitigated' },
                  { value: 'accepted', label: isAr ? 'مقبول' : 'Accepted' },
                  { value: 'closed', label: isAr ? 'مغلق' : 'Closed' },
                ]}
              />

              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedRating('');
                  setSelectedStatus('');
                }}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                {isAr ? 'إعادة تعيين' : 'Reset'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Department Cards */}
      <div className="space-y-4">
        {departmentStats.map((stats) => (
          <Card key={stats.department.id} className="overflow-hidden">
            {/* Department Header */}
            <div
              className="flex cursor-pointer items-center justify-between p-4 hover:bg-[var(--background-secondary)] transition-colors"
              onClick={() => toggleDepartment(stats.department.id)}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] text-white shadow-md">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">
                    {isAr ? stats.department.nameAr : stats.department.nameEn}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-[var(--foreground-secondary)]">
                    {stats.department.riskChampion && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {isAr
                          ? stats.department.riskChampion.fullName
                          : stats.department.riskChampion.fullNameEn ||
                            stats.department.riskChampion.fullName}
                      </span>
                    )}
                    <span>•</span>
                    <span>
                      {stats.totalRisks} {isAr ? 'خطر' : 'risks'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Risk Rating Pills */}
                <div className="hidden items-center gap-2 md:flex">
                  {stats.criticalRisks > 0 && (
                    <span className="flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      {stats.criticalRisks}
                    </span>
                  )}
                  {stats.majorRisks > 0 && (
                    <span className="flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                      <span className="h-2 w-2 rounded-full bg-orange-500" />
                      {stats.majorRisks}
                    </span>
                  )}
                  {stats.moderateRisks > 0 && (
                    <span className="flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                      <span className="h-2 w-2 rounded-full bg-yellow-500" />
                      {stats.moderateRisks}
                    </span>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="hidden w-32 lg:block">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-[var(--foreground-secondary)]">
                      {isAr ? 'التخفيف' : 'Reduction'}
                    </span>
                    <span className="font-medium text-green-600">
                      {stats.riskReductionPercentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
                      style={{ width: `${Math.min(stats.riskReductionPercentage, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Alerts */}
                {(stats.overdueRisks > 0 || stats.upcomingReviews > 0) && (
                  <div className="flex items-center gap-2">
                    {stats.overdueRisks > 0 && (
                      <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        <AlertTriangle className="h-3 w-3" />
                        {stats.overdueRisks}
                      </span>
                    )}
                    {stats.upcomingReviews > 0 && (
                      <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        <Calendar className="h-3 w-3" />
                        {stats.upcomingReviews}
                      </span>
                    )}
                  </div>
                )}

                {/* Expand/Collapse Icon */}
                {expandedDepartments.has(stats.department.id) ? (
                  <ChevronUp className="h-5 w-5 text-[var(--foreground-secondary)]" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-[var(--foreground-secondary)]" />
                )}
              </div>
            </div>

            {/* Expanded Content */}
            {expandedDepartments.has(stats.department.id) && (
              <div className="border-t border-[var(--border)]">
                {/* Department Stats Summary */}
                <div className="grid grid-cols-2 gap-4 border-b border-[var(--border)] bg-[var(--background-secondary)] p-4 sm:grid-cols-4 lg:grid-cols-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[var(--foreground)]">{stats.openRisks}</p>
                    <p className="text-xs text-[var(--foreground-secondary)]">
                      {isAr ? 'مفتوح' : 'Open'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">{stats.inProgressRisks}</p>
                    <p className="text-xs text-[var(--foreground-secondary)]">
                      {isAr ? 'قيد التنفيذ' : 'In Progress'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{stats.mitigatedRisks}</p>
                    <p className="text-xs text-[var(--foreground-secondary)]">
                      {isAr ? 'تم التخفيف' : 'Mitigated'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[var(--foreground)]">
                      {stats.avgInherentScore.toFixed(1)}
                    </p>
                    <p className="text-xs text-[var(--foreground-secondary)]">
                      {isAr ? 'متوسط الكامن' : 'Avg Inherent'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[var(--foreground)]">
                      {stats.avgResidualScore.toFixed(1)}
                    </p>
                    <p className="text-xs text-[var(--foreground-secondary)]">
                      {isAr ? 'متوسط المتبقي' : 'Avg Residual'}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <TrendingDown className="h-4 w-4 text-green-500" />
                      <p className="text-2xl font-bold text-green-600">
                        {stats.riskReductionPercentage.toFixed(0)}%
                      </p>
                    </div>
                    <p className="text-xs text-[var(--foreground-secondary)]">
                      {isAr ? 'نسبة التخفيف' : 'Reduction'}
                    </p>
                  </div>
                </div>

                {/* Risks Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[var(--background-tertiary)]">
                      <tr>
                        <th className="px-4 py-3 text-start text-xs font-medium text-[var(--foreground-secondary)]">
                          {isAr ? 'رقم الخطر' : 'Risk #'}
                        </th>
                        <th className="px-4 py-3 text-start text-xs font-medium text-[var(--foreground-secondary)]">
                          {isAr ? 'العنوان' : 'Title'}
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-[var(--foreground-secondary)]">
                          {isAr ? 'الحالة' : 'Status'}
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-[var(--foreground-secondary)]">
                          {isAr ? 'الكامن' : 'Inherent'}
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-[var(--foreground-secondary)]">
                          {isAr ? 'المتبقي' : 'Residual'}
                        </th>
                        <th className="px-4 py-3 text-start text-xs font-medium text-[var(--foreground-secondary)]">
                          {isAr ? 'المالك' : 'Owner'}
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-[var(--foreground-secondary)]">
                          {isAr ? 'المتابعة' : 'Follow-up'}
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-[var(--foreground-secondary)]">
                          {isAr ? 'إجراءات' : 'Actions'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {stats.risks.map((risk) => {
                        const isOverdue =
                          risk.followUpDate && new Date(risk.followUpDate) < new Date();

                        return (
                          <tr
                            key={risk.id}
                            className="hover:bg-[var(--background-secondary)] transition-colors"
                          >
                            <td className="px-4 py-3">
                              <span className="font-mono text-sm text-[var(--primary)]">
                                {risk.riskNumber}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="max-w-xs">
                                <p className="truncate font-medium text-[var(--foreground)]">
                                  {isAr ? risk.titleAr : risk.titleEn}
                                </p>
                                {risk.category && (
                                  <span
                                    className="mt-1 inline-block rounded px-1.5 py-0.5 text-xs"
                                    style={{
                                      backgroundColor: risk.category.color
                                        ? `${risk.category.color}20`
                                        : 'var(--background-tertiary)',
                                      color: risk.category.color || 'var(--foreground-secondary)',
                                    }}
                                  >
                                    {isAr ? risk.category.nameAr : risk.category.nameEn}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {getStatusIcon(risk.status)}
                                <span className="text-sm capitalize">
                                  {risk.status === 'inProgress'
                                    ? isAr
                                      ? 'قيد التنفيذ'
                                      : 'In Progress'
                                    : risk.status === 'open'
                                      ? isAr
                                        ? 'مفتوح'
                                        : 'Open'
                                      : risk.status === 'mitigated'
                                        ? isAr
                                          ? 'تم التخفيف'
                                          : 'Mitigated'
                                        : risk.status === 'accepted'
                                          ? isAr
                                            ? 'مقبول'
                                            : 'Accepted'
                                          : isAr
                                            ? 'مغلق'
                                            : 'Closed'}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-white ${getRatingColor(risk.inherentRating)}`}
                              >
                                {risk.inherentScore}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {risk.residualScore !== null ? (
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-white ${getRatingColor(risk.residualRating || '')}`}
                                >
                                  {risk.residualScore}
                                </span>
                              ) : (
                                <span className="text-sm text-[var(--foreground-muted)]">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {risk.owner && (
                                <span className="text-sm text-[var(--foreground)]">
                                  {isAr
                                    ? risk.owner.fullName
                                    : risk.owner.fullNameEn || risk.owner.fullName}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {risk.followUpDate ? (
                                <span
                                  className={`text-sm ${isOverdue ? 'font-medium text-red-600' : 'text-[var(--foreground-secondary)]'}`}
                                >
                                  {new Date(risk.followUpDate).toLocaleDateString(
                                    isAr ? 'ar-SA' : 'en-US'
                                  )}
                                  {isOverdue && (
                                    <AlertTriangle className="ms-1 inline h-3 w-3 text-red-500" />
                                  )}
                                </span>
                              ) : (
                                <span className="text-sm text-[var(--foreground-muted)]">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Link href={`/risks/${risk.id}`}>
                                <Button variant="ghost" size="sm" className="gap-1">
                                  <Eye className="h-4 w-4" />
                                  {isAr ? 'عرض' : 'View'}
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {stats.risks.length === 0 && (
                    <div className="py-12 text-center">
                      <Target className="mx-auto h-12 w-12 text-[var(--foreground-muted)]" />
                      <p className="mt-4 text-[var(--foreground-secondary)]">
                        {isAr ? 'لا توجد مخاطر مطابقة للفلترة' : 'No risks match the filter criteria'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        ))}

        {departmentStats.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="mx-auto h-12 w-12 text-[var(--foreground-muted)]" />
              <p className="mt-4 text-lg font-medium text-[var(--foreground)]">
                {isAr ? 'لا توجد بيانات' : 'No data available'}
              </p>
              <p className="mt-2 text-[var(--foreground-secondary)]">
                {isAr
                  ? 'لم يتم العثور على مخاطر مطابقة للمعايير المحددة'
                  : 'No risks found matching the specified criteria'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
