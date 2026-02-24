'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  X,
  Edit3,
  Save,
  MessageSquare,
  FileText,
  History,
  Zap,
  Play,
  Pause,
  CheckCircle2,
  ArrowRight,
  Send,
  Plus,
  Sparkles,
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
  treatmentPlans?: Array<{
    id: string;
    titleAr: string;
    titleEn: string;
    status: string;
    progress: number;
    dueDate: string;
  }>;
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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'open':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'inProgress':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'mitigated':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'accepted':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'closed':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    default:
      return 'bg-gray-100 text-gray-700';
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

  // Side Panel States
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [quickNote, setQuickNote] = useState('');
  const [editedStatus, setEditedStatus] = useState('');
  const [editedFollowUpDate, setEditedFollowUpDate] = useState('');

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [risksRes, deptsRes] = await Promise.all([
        fetch('/api/risks?includeTreatments=true'),
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
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open risk panel
  const openRiskPanel = (risk: Risk) => {
    setSelectedRisk(risk);
    setEditedStatus(risk.status);
    setEditedFollowUpDate(risk.followUpDate ? risk.followUpDate.split('T')[0] : '');
    setIsEditing(false);
    setQuickNote('');
  };

  // Close risk panel
  const closeRiskPanel = () => {
    setSelectedRisk(null);
    setIsEditing(false);
    setQuickNote('');
  };

  // Quick status update
  const updateRiskStatus = async (newStatus: string) => {
    if (!selectedRisk) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/risks/${selectedRisk.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        // Update local state
        setRisks(prev => prev.map(r => r.id === selectedRisk.id ? { ...r, status: newStatus } : r));
        setSelectedRisk(prev => prev ? { ...prev, status: newStatus } : null);
        setEditedStatus(newStatus);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Save risk changes
  const saveRiskChanges = async () => {
    if (!selectedRisk) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/risks/${selectedRisk.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editedStatus,
          followUpDate: editedFollowUpDate || null,
        }),
      });

      if (res.ok) {
        // Update local state
        setRisks(prev => prev.map(r => r.id === selectedRisk.id ? {
          ...r,
          status: editedStatus,
          followUpDate: editedFollowUpDate || null,
        } : r));
        setSelectedRisk(prev => prev ? {
          ...prev,
          status: editedStatus,
          followUpDate: editedFollowUpDate || null,
        } : null);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving changes:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Add quick note/comment
  const addQuickNote = async () => {
    if (!selectedRisk || !quickNote.trim()) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/risks/${selectedRisk.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: quickNote }),
      });

      if (res.ok) {
        setQuickNote('');
        // Optionally refresh risk data
      }
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setIsSaving(false);
    }
  };

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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return isAr ? 'مفتوح' : 'Open';
      case 'inProgress': return isAr ? 'قيد التنفيذ' : 'In Progress';
      case 'mitigated': return isAr ? 'تم التخفيف' : 'Mitigated';
      case 'accepted': return isAr ? 'مقبول' : 'Accepted';
      case 'closed': return isAr ? 'مغلق' : 'Closed';
      default: return status;
    }
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
    <div className="flex h-[calc(100vh-120px)]">
      {/* Main Content */}
      <div className={`flex-1 overflow-auto transition-all duration-300 ${selectedRisk ? 'me-[450px]' : ''}`}>
        <div className="space-y-6 p-1">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--foreground)]">
                {isAr ? 'متابعة المخاطر' : 'Risk Tracking'}
              </h1>
              <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
                {isAr
                  ? 'اضغط على أي خطر لعرض التفاصيل والتعديل السريع'
                  : 'Click any risk for quick view and edit'}
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
                      {isAr ? 'حرج' : 'Critical'}
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
                      {isAr ? 'رئيسي' : 'Major'}
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
                      {isAr ? 'متأخر' : 'Overdue'}
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
                      {isAr ? 'قادم' : 'Upcoming'}
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
                      {isAr ? 'التخفيف' : 'Reduction'}
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
                      { value: 'Major', label: isAr ? 'رئيسي' : 'Major' },
                      { value: 'Moderate', label: isAr ? 'متوسط' : 'Moderate' },
                      { value: 'Minor', label: isAr ? 'ثانوي' : 'Minor' },
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
                      <p className="text-sm text-[var(--foreground-secondary)]">
                        {stats.totalRisks} {isAr ? 'خطر' : 'risks'}
                      </p>
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
                    <div className="hidden w-24 lg:block">
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

                    {/* Expand/Collapse Icon */}
                    {expandedDepartments.has(stats.department.id) ? (
                      <ChevronUp className="h-5 w-5 text-[var(--foreground-secondary)]" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-[var(--foreground-secondary)]" />
                    )}
                  </div>
                </div>

                {/* Expanded Content - Compact Risk Cards */}
                {expandedDepartments.has(stats.department.id) && (
                  <div className="border-t border-[var(--border)] p-4">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {stats.risks.map((risk) => {
                        const isOverdue = risk.followUpDate && new Date(risk.followUpDate) < new Date();
                        const isSelected = selectedRisk?.id === risk.id;

                        return (
                          <div
                            key={risk.id}
                            onClick={() => openRiskPanel(risk)}
                            className={`
                              cursor-pointer rounded-xl border p-4 transition-all duration-200
                              hover:shadow-md hover:border-[var(--primary)]
                              ${isSelected ? 'border-[var(--primary)] bg-[var(--primary-light)] shadow-md' : 'border-[var(--border)] bg-[var(--background)]'}
                              ${isOverdue ? 'border-l-4 border-l-red-500' : ''}
                            `}
                          >
                            {/* Risk Header */}
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-mono text-xs text-[var(--primary)] font-semibold">
                                    {risk.riskNumber}
                                  </span>
                                  {isOverdue && (
                                    <AlertTriangle className="h-3 w-3 text-red-500" />
                                  )}
                                </div>
                                <h4 className="font-medium text-sm text-[var(--foreground)] line-clamp-2">
                                  {isAr ? risk.titleAr : risk.titleEn}
                                </h4>
                              </div>
                              <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(risk.status)}`}>
                                {getStatusLabel(risk.status)}
                              </span>
                            </div>

                            {/* Risk Scores */}
                            <div className="flex items-center gap-2 mb-3">
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-[var(--foreground-secondary)]">
                                  {isAr ? 'كامن:' : 'Inh:'}
                                </span>
                                <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium text-white ${getRatingColor(risk.inherentRating)}`}>
                                  {risk.inherentScore}
                                </span>
                              </div>
                              {risk.residualScore !== null && (
                                <>
                                  <ArrowRight className="h-3 w-3 text-[var(--foreground-muted)]" />
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-[var(--foreground-secondary)]">
                                      {isAr ? 'متبقي:' : 'Res:'}
                                    </span>
                                    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium text-white ${getRatingColor(risk.residualRating || '')}`}>
                                      {risk.residualScore}
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Bottom Info */}
                            <div className="flex items-center justify-between text-xs text-[var(--foreground-secondary)]">
                              {risk.owner && (
                                <div className="flex items-center gap-1 truncate">
                                  <User className="h-3 w-3 shrink-0" />
                                  <span className="truncate">
                                    {isAr ? risk.owner.fullName : risk.owner.fullNameEn || risk.owner.fullName}
                                  </span>
                                </div>
                              )}
                              {risk.followUpDate && (
                                <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-500 font-medium' : ''}`}>
                                  <Calendar className="h-3 w-3" />
                                  <span>{new Date(risk.followUpDate).toLocaleDateString(isAr ? 'ar-SA-u-ca-gregory' : 'en-US', { month: 'short', day: 'numeric' })}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {stats.risks.length === 0 && (
                      <div className="py-8 text-center">
                        <Target className="mx-auto h-10 w-10 text-[var(--foreground-muted)]" />
                        <p className="mt-2 text-sm text-[var(--foreground-secondary)]">
                          {isAr ? 'لا توجد مخاطر مطابقة' : 'No matching risks'}
                        </p>
                      </div>
                    )}
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
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Side Panel for Risk Details */}
      {selectedRisk && (
        <div className="fixed inset-y-0 end-0 w-[450px] bg-[var(--background)] border-s border-[var(--border)] shadow-2xl z-50 flex flex-col animate-slideIn">
          {/* Panel Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)]">
            <div className="text-white">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm opacity-80">{selectedRisk.riskNumber}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(selectedRisk.status)}`}>
                  {getStatusLabel(selectedRisk.status)}
                </span>
              </div>
              <h2 className="font-bold text-lg mt-1 line-clamp-1">
                {isAr ? selectedRisk.titleAr : selectedRisk.titleEn}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeRiskPanel}
              className="text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Quick Actions */}
            <div className="bg-[var(--background-secondary)] rounded-xl p-4">
              <h3 className="font-semibold text-sm text-[var(--foreground)] mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                {isAr ? 'إجراءات سريعة' : 'Quick Actions'}
              </h3>

              {/* Primary Actions */}
              <div className="space-y-2 mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 justify-start text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/20"
                  onClick={() => window.open(`/risks/${selectedRisk.id}`, '_blank')}
                >
                  <Eye className="h-4 w-4" />
                  {isAr ? 'عرض الخطر كاملاً' : 'View Full Risk'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 justify-start text-purple-600 border-purple-200 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:hover:bg-purple-900/20"
                  onClick={() => window.open(`/treatment?riskId=${selectedRisk.id}`, '_blank')}
                >
                  <FileText className="h-4 w-4" />
                  {isAr ? 'إدارة خطط المعالجة' : 'Manage Treatment Plans'}
                </Button>
              </div>

              {/* Status Actions */}
              <p className="text-xs text-[var(--foreground-secondary)] mb-2">{isAr ? 'تحديث الحالة:' : 'Update Status:'}</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={selectedRisk.status === 'inProgress' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => updateRiskStatus('inProgress')}
                  disabled={isSaving || selectedRisk.status === 'inProgress'}
                  className="gap-1"
                >
                  <Play className="h-3 w-3" />
                  {isAr ? 'بدء العمل' : 'Start'}
                </Button>
                <Button
                  variant={selectedRisk.status === 'mitigated' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => updateRiskStatus('mitigated')}
                  disabled={isSaving || selectedRisk.status === 'mitigated'}
                  className="gap-1"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  {isAr ? 'تم التخفيف' : 'Mitigated'}
                </Button>
                <Button
                  variant={selectedRisk.status === 'accepted' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => updateRiskStatus('accepted')}
                  disabled={isSaving || selectedRisk.status === 'accepted'}
                  className="gap-1"
                >
                  <Shield className="h-3 w-3" />
                  {isAr ? 'قبول' : 'Accept'}
                </Button>
                <Button
                  variant={selectedRisk.status === 'closed' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => updateRiskStatus('closed')}
                  disabled={isSaving || selectedRisk.status === 'closed'}
                  className="gap-1"
                >
                  <XCircle className="h-3 w-3" />
                  {isAr ? 'إغلاق' : 'Close'}
                </Button>
              </div>
            </div>

            {/* Risk Scores */}
            <div className="bg-[var(--background-secondary)] rounded-xl p-4">
              <h3 className="font-semibold text-sm text-[var(--foreground)] mb-3">
                {isAr ? 'تقييم المخاطر' : 'Risk Assessment'}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-[var(--background)]">
                  <p className="text-xs text-[var(--foreground-secondary)] mb-1">
                    {isAr ? 'الخطر الكامن' : 'Inherent Risk'}
                  </p>
                  <div className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-white ${getRatingColor(selectedRisk.inherentRating)}`}>
                    <span className="text-2xl font-bold">{selectedRisk.inherentScore}</span>
                  </div>
                  <p className="text-xs mt-1 text-[var(--foreground-secondary)]">
                    {selectedRisk.inherentLikelihood} × {selectedRisk.inherentImpact}
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg bg-[var(--background)]">
                  <p className="text-xs text-[var(--foreground-secondary)] mb-1">
                    {isAr ? 'الخطر المتبقي' : 'Residual Risk'}
                  </p>
                  {selectedRisk.residualScore !== null ? (
                    <>
                      <div className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-white ${getRatingColor(selectedRisk.residualRating || '')}`}>
                        <span className="text-2xl font-bold">{selectedRisk.residualScore}</span>
                      </div>
                      <p className="text-xs mt-1 text-[var(--foreground-secondary)]">
                        {selectedRisk.residualLikelihood} × {selectedRisk.residualImpact}
                      </p>
                    </>
                  ) : (
                    <div className="inline-flex items-center gap-1 rounded-lg px-3 py-2 bg-gray-200 dark:bg-gray-700">
                      <span className="text-lg text-[var(--foreground-muted)]">-</span>
                    </div>
                  )}
                </div>
              </div>
              {selectedRisk.residualScore !== null && (
                <div className="mt-3 flex items-center justify-center gap-2 text-sm">
                  <TrendingDown className="h-4 w-4 text-green-500" />
                  <span className="text-green-600 font-medium">
                    {Math.round(((selectedRisk.inherentScore - selectedRisk.residualScore) / selectedRisk.inherentScore) * 100)}%
                    {isAr ? ' تخفيف' : ' reduction'}
                  </span>
                </div>
              )}
            </div>

            {/* Risk Details */}
            <div className="bg-[var(--background-secondary)] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm text-[var(--foreground)]">
                  {isAr ? 'التفاصيل' : 'Details'}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className="gap-1"
                >
                  <Edit3 className="h-3 w-3" />
                  {isEditing ? (isAr ? 'إلغاء' : 'Cancel') : (isAr ? 'تعديل' : 'Edit')}
                </Button>
              </div>

              <div className="space-y-3">
                {/* Department */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--foreground-secondary)]">
                    {isAr ? 'الإدارة' : 'Department'}
                  </span>
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    {selectedRisk.department && (isAr ? selectedRisk.department.nameAr : selectedRisk.department.nameEn)}
                  </span>
                </div>

                {/* Owner */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--foreground-secondary)]">
                    {isAr ? 'المالك' : 'Owner'}
                  </span>
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    {selectedRisk.owner && (isAr ? selectedRisk.owner.fullName : selectedRisk.owner.fullNameEn || selectedRisk.owner.fullName)}
                  </span>
                </div>

                {/* Category */}
                {selectedRisk.category && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--foreground-secondary)]">
                      {isAr ? 'الفئة' : 'Category'}
                    </span>
                    <span
                      className="text-xs px-2 py-1 rounded"
                      style={{
                        backgroundColor: selectedRisk.category.color ? `${selectedRisk.category.color}20` : 'var(--background-tertiary)',
                        color: selectedRisk.category.color || 'var(--foreground-secondary)',
                      }}
                    >
                      {isAr ? selectedRisk.category.nameAr : selectedRisk.category.nameEn}
                    </span>
                  </div>
                )}

                {/* Follow-up Date */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--foreground-secondary)]">
                    {isAr ? 'تاريخ المتابعة' : 'Follow-up Date'}
                  </span>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editedFollowUpDate}
                      onChange={(e) => setEditedFollowUpDate(e.target.value)}
                      className="text-sm px-2 py-1 rounded border border-[var(--border)] bg-[var(--background)]"
                    />
                  ) : (
                    <span className={`text-sm font-medium ${selectedRisk.followUpDate && new Date(selectedRisk.followUpDate) < new Date() ? 'text-red-500' : 'text-[var(--foreground)]'}`}>
                      {selectedRisk.followUpDate
                        ? new Date(selectedRisk.followUpDate).toLocaleDateString(isAr ? 'ar-SA-u-ca-gregory' : 'en-US')
                        : '-'}
                    </span>
                  )}
                </div>

                {/* Status (Editable) */}
                {isEditing && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--foreground-secondary)]">
                      {isAr ? 'الحالة' : 'Status'}
                    </span>
                    <select
                      value={editedStatus}
                      onChange={(e) => setEditedStatus(e.target.value)}
                      className="text-sm px-2 py-1 rounded border border-[var(--border)] bg-[var(--background)]"
                    >
                      <option value="open">{isAr ? 'مفتوح' : 'Open'}</option>
                      <option value="inProgress">{isAr ? 'قيد التنفيذ' : 'In Progress'}</option>
                      <option value="mitigated">{isAr ? 'تم التخفيف' : 'Mitigated'}</option>
                      <option value="accepted">{isAr ? 'مقبول' : 'Accepted'}</option>
                      <option value="closed">{isAr ? 'مغلق' : 'Closed'}</option>
                    </select>
                  </div>
                )}

                {/* Save Button */}
                {isEditing && (
                  <Button
                    onClick={saveRiskChanges}
                    disabled={isSaving}
                    className="w-full gap-2 mt-2"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {isAr ? 'حفظ التغييرات' : 'Save Changes'}
                  </Button>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="bg-[var(--background-secondary)] rounded-xl p-4">
              <h3 className="font-semibold text-sm text-[var(--foreground)] mb-2">
                {isAr ? 'الوصف' : 'Description'}
              </h3>
              <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">
                {isAr ? selectedRisk.descriptionAr : selectedRisk.descriptionEn}
              </p>
            </div>

            {/* Treatment Plans */}
            {selectedRisk.treatmentPlans && selectedRisk.treatmentPlans.length > 0 && (
              <div className="bg-[var(--background-secondary)] rounded-xl p-4">
                <h3 className="font-semibold text-sm text-[var(--foreground)] mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  {isAr ? 'خطط المعالجة' : 'Treatment Plans'}
                </h3>
                <div className="space-y-2">
                  {selectedRisk.treatmentPlans.map((plan) => (
                    <div key={plan.id} className="p-3 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-[var(--foreground)]">
                          {isAr ? plan.titleAr : plan.titleEn}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(plan.status)}`}>
                          {plan.progress}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-[var(--background-tertiary)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                          style={{ width: `${plan.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Note */}
            <div className="bg-[var(--background-secondary)] rounded-xl p-4">
              <h3 className="font-semibold text-sm text-[var(--foreground)] mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-purple-500" />
                {isAr ? 'إضافة ملاحظة سريعة' : 'Add Quick Note'}
              </h3>
              <div className="flex gap-2">
                <Input
                  placeholder={isAr ? 'اكتب ملاحظتك هنا...' : 'Type your note here...'}
                  value={quickNote}
                  onChange={(e) => setQuickNote(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={addQuickNote}
                  disabled={!quickNote.trim() || isSaving}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Panel Footer */}
          <div className="p-4 border-t border-[var(--border)] bg-[var(--background-secondary)]">
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => window.open(`/risks/${selectedRisk.id}`, '_blank')}
              >
                <ArrowUpRight className="h-4 w-4" />
                {isAr ? 'فتح الصفحة الكاملة' : 'Open Full Page'}
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => window.open(`/risks/${selectedRisk.id}/edit`, '_blank')}
              >
                <Edit3 className="h-4 w-4" />
                {isAr ? 'تعديل كامل' : 'Full Edit'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-in animation style */}
      <style jsx global>{`
        @keyframes slideIn {
          from {
            transform: translateX(${isAr ? '-100%' : '100%'});
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
