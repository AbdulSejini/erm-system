'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import {
  Plus,
  Search,
  Users,
  User,
  Mail,
  Phone,
  Building2,
  Award,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Star,
  BookOpen,
  HelpCircle,
  Target,
  BarChart3,
  FileText,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Edit,
  Eye,
  Shield,
  GraduationCap,
  Briefcase,
  RefreshCw,
} from 'lucide-react';

// Champion performance levels
type PerformanceLevel = 'excellent' | 'good' | 'needsImprovement' | 'new';

// API Types
interface APIChampion {
  id: string;
  fullName: string;
  fullNameEn: string | null;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  createdAt: string;
  department: {
    id: string;
    nameAr: string;
    nameEn: string;
    code: string;
  } | null;
  accessibleDepartments: Array<{
    departmentId: string;
    department: {
      id: string;
      nameAr: string;
      nameEn: string;
      code: string;
    };
  }>;
  _count?: {
    ownedRisks: number;
    championedRisks: number;
  };
  // Stats from risks
  risksAssigned?: number;
  risksResolved?: number;
  treatmentPlansActive?: number;
  treatmentPlansCompleted?: number;
}

// Training modules for champions
const trainingModules = [
  {
    id: '1',
    titleAr: 'أساسيات إدارة المخاطر',
    titleEn: 'Risk Management Fundamentals',
    descriptionAr: 'مقدمة شاملة لمبادئ إدارة المخاطر المؤسسية',
    descriptionEn: 'Comprehensive introduction to enterprise risk management principles',
    duration: '4 hours',
    required: true,
  },
  {
    id: '2',
    titleAr: 'تقييم المخاطر المتقدم',
    titleEn: 'Advanced Risk Assessment',
    descriptionAr: 'تقنيات متقدمة لتحديد وتقييم المخاطر',
    descriptionEn: 'Advanced techniques for identifying and assessing risks',
    duration: '6 hours',
    required: false,
  },
  {
    id: '3',
    titleAr: 'استخدام نظام ERM',
    titleEn: 'Using the ERM System',
    descriptionAr: 'دليل عملي لاستخدام نظام إدارة المخاطر',
    descriptionEn: 'Practical guide to using the risk management system',
    duration: '2 hours',
    required: true,
  },
];

export default function ChampionsPage() {
  const { t, language } = useTranslation();
  const isAr = language === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [filterPerformance, setFilterPerformance] = useState<PerformanceLevel | 'all'>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Data states
  const [champions, setChampions] = useState<APIChampion[]>([]);
  const [departments, setDepartments] = useState<Array<{ id: string; nameAr: string; nameEn: string; code: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch champions (users with role riskChampion)
  const fetchChampions = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);

    try {
      // Fetch users with role riskChampion
      const usersRes = await fetch('/api/users?role=riskChampion');
      const usersData = await usersRes.json();

      if (usersData.success) {
        // Fetch risks to calculate stats for each champion
        const risksRes = await fetch('/api/risks?filterByAccess=false');
        const risksData = await risksRes.json();

        const risks = risksData.success ? risksData.data : [];

        // Calculate stats for each champion
        const championsWithStats = usersData.data.map((user: APIChampion) => {
          const championRisks = risks.filter((r: { championId?: string; ownerId?: string }) =>
            r.championId === user.id || r.ownerId === user.id
          );

          const resolved = championRisks.filter((r: { status: string }) =>
            r.status === 'mitigated' || r.status === 'closed'
          ).length;

          return {
            ...user,
            risksAssigned: championRisks.length,
            risksResolved: resolved,
            treatmentPlansActive: championRisks.filter((r: { status: string }) => r.status === 'inProgress').length,
            treatmentPlansCompleted: resolved,
          };
        });

        setChampions(championsWithStats);
      }
    } catch (error) {
      console.error('Error fetching champions:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch departments
  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch('/api/departments');
      const data = await res.json();
      if (data.success) {
        setDepartments(data.data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  }, []);

  useEffect(() => {
    fetchChampions();
    fetchDepartments();
  }, [fetchChampions, fetchDepartments]);

  const getPerformanceLevel = (champion: APIChampion): PerformanceLevel => {
    const daysActive = Math.floor((Date.now() - new Date(champion.createdAt).getTime()) / (1000 * 60 * 60 * 24));

    if (daysActive < 30) return 'new';

    const resolutionRate = champion.risksAssigned && champion.risksAssigned > 0
      ? (champion.risksResolved || 0) / champion.risksAssigned
      : 0;

    if (resolutionRate >= 0.7) return 'excellent';
    if (resolutionRate >= 0.4) return 'good';
    return 'needsImprovement';
  };

  const getPerformanceColor = (level: PerformanceLevel) => {
    switch (level) {
      case 'excellent':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'good':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'needsImprovement':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'new':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPerformanceLabel = (level: PerformanceLevel) => {
    switch (level) {
      case 'excellent':
        return isAr ? 'ممتاز' : 'Excellent';
      case 'good':
        return isAr ? 'جيد' : 'Good';
      case 'needsImprovement':
        return isAr ? 'يحتاج تحسين' : 'Needs Improvement';
      case 'new':
        return isAr ? 'جديد' : 'New';
      default:
        return '';
    }
  };

  const getPerformanceIcon = (level: PerformanceLevel) => {
    switch (level) {
      case 'excellent':
        return <Star className="h-3 w-3 sm:h-4 sm:w-4" />;
      case 'good':
        return <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />;
      case 'needsImprovement':
        return <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />;
      case 'new':
        return <Clock className="h-3 w-3 sm:h-4 sm:w-4" />;
      default:
        return null;
    }
  };

  const toggleCardExpand = (id: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCards(newExpanded);
  };

  // Get unique departments from champions
  const uniqueDepartments = [...new Set(champions.map((c) =>
    c.department ? (isAr ? c.department.nameAr : c.department.nameEn) : ''
  ).filter(Boolean))];

  const filteredChampions = champions.filter((champion) => {
    const name = isAr ? champion.fullName : (champion.fullNameEn || champion.fullName);
    const matchesSearch =
      champion.fullName.includes(searchQuery) ||
      (champion.fullNameEn || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      champion.email.toLowerCase().includes(searchQuery.toLowerCase());

    const performanceLevel = getPerformanceLevel(champion);
    const matchesPerformance = filterPerformance === 'all' || performanceLevel === filterPerformance;

    const deptName = champion.department
      ? (isAr ? champion.department.nameAr : champion.department.nameEn)
      : '';
    const matchesDepartment = filterDepartment === 'all' || deptName === filterDepartment;

    return matchesSearch && matchesPerformance && matchesDepartment;
  });

  // Stats
  const stats = {
    total: champions.length,
    excellent: champions.filter((c) => getPerformanceLevel(c) === 'excellent').length,
    needsTraining: champions.filter((c) => getPerformanceLevel(c) === 'new' || getPerformanceLevel(c) === 'needsImprovement').length,
    totalRisksManaged: champions.reduce((sum, c) => sum + (c.risksAssigned || 0), 0),
    avgResolutionRate: champions.length > 0
      ? Math.round(
          (champions.reduce((sum, c) => sum + (c.risksResolved || 0), 0) /
            Math.max(champions.reduce((sum, c) => sum + (c.risksAssigned || 0), 0), 1)) *
            100
        )
      : 0,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-[var(--primary)] mx-auto mb-4" />
          <p className="text-sm text-[var(--foreground-secondary)]">
            {isAr ? 'جاري تحميل رواد المخاطر...' : 'Loading risk champions...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--foreground)] truncate">
            {isAr ? 'رواد المخاطر' : 'Risk Champions'}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[var(--foreground-secondary)]">
            {isAr
              ? 'إدارة ومتابعة أداء رواد المخاطر في الإدارات المختلفة'
              : 'Manage and track risk champions performance across departments'}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 shrink-0 ${isRefreshing ? 'animate-spin' : ''}`} />}
            onClick={() => fetchChampions(true)}
            disabled={isRefreshing}
          >
            <span className="text-xs sm:text-sm">{isAr ? 'تحديث' : 'Refresh'}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />}
            onClick={() => setShowGuideModal(true)}
          >
            <span className="text-xs sm:text-sm">{isAr ? 'دليل الرواد' : 'Champion Guide'}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />}
            onClick={() => setShowTrainingModal(true)}
          >
            <span className="text-xs sm:text-sm">{isAr ? 'برنامج التدريب' : 'Training Program'}</span>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
        <Card className="p-2 sm:p-3 md:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-[var(--primary-light)] shrink-0">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--primary)]" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--foreground)]">{stats.total}</p>
              <p className="text-[10px] sm:text-xs text-[var(--foreground-secondary)] truncate">
                {isAr ? 'إجمالي الرواد' : 'Total Champions'}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-2 sm:p-3 md:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30 shrink-0">
              <Star className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--foreground)]">{stats.excellent}</p>
              <p className="text-[10px] sm:text-xs text-[var(--foreground-secondary)] truncate">
                {isAr ? 'أداء ممتاز' : 'Excellent Performance'}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-2 sm:p-3 md:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30 shrink-0">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--foreground)]">{stats.needsTraining}</p>
              <p className="text-[10px] sm:text-xs text-[var(--foreground-secondary)] truncate">
                {isAr ? 'بحاجة لتدريب' : 'Need Training'}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-2 sm:p-3 md:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 shrink-0">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--foreground)]">{stats.totalRisksManaged}</p>
              <p className="text-[10px] sm:text-xs text-[var(--foreground-secondary)] truncate">
                {isAr ? 'المخاطر المُدارة' : 'Managed Risks'}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-2 sm:p-3 md:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30 shrink-0">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--foreground)]">{stats.avgResolutionRate}%</p>
              <p className="text-[10px] sm:text-xs text-[var(--foreground-secondary)] truncate">
                {isAr ? 'معدل الحل' : 'Resolution Rate'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-2 sm:p-3 md:p-4">
          <div className="flex flex-col gap-2 sm:gap-3 md:gap-4 sm:flex-row sm:items-center">
            <div className="flex-1 min-w-0">
              <Input
                placeholder={isAr ? 'بحث بالاسم أو البريد الإلكتروني...' : 'Search by name or email...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-4 w-4 sm:h-5 sm:w-5" />}
              />
            </div>
            <div className="flex gap-2 shrink-0">
              <select
                className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
                value={filterPerformance}
                onChange={(e) => setFilterPerformance(e.target.value as PerformanceLevel | 'all')}
              >
                <option value="all">{isAr ? 'جميع المستويات' : 'All Levels'}</option>
                <option value="excellent">{isAr ? 'ممتاز' : 'Excellent'}</option>
                <option value="good">{isAr ? 'جيد' : 'Good'}</option>
                <option value="needsImprovement">{isAr ? 'يحتاج تحسين' : 'Needs Improvement'}</option>
                <option value="new">{isAr ? 'جديد' : 'New'}</option>
              </select>
              <select
                className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
              >
                <option value="all">{isAr ? 'جميع الإدارات' : 'All Departments'}</option>
                {uniqueDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Champions Grid */}
      <div className="grid gap-2 sm:gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredChampions.map((champion) => {
          const isExpanded = expandedCards.has(champion.id);
          const performanceLevel = getPerformanceLevel(champion);
          const resolutionRate = champion.risksAssigned && champion.risksAssigned > 0
            ? Math.round((champion.risksResolved || 0) / champion.risksAssigned * 100)
            : 0;

          return (
            <Card key={champion.id} className="overflow-hidden">
              <div className="p-2 sm:p-3 md:p-4">
                {/* Header */}
                <div className="mb-3 sm:mb-4 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-[var(--primary-light)] text-base sm:text-lg font-bold text-[var(--primary)] shrink-0">
                      {(isAr ? champion.fullName : (champion.fullNameEn || champion.fullName)).charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-[var(--foreground)] text-sm sm:text-base truncate">
                        {isAr ? champion.fullName : (champion.fullNameEn || champion.fullName)}
                      </h3>
                      <p className="text-xs sm:text-sm text-[var(--foreground-secondary)] truncate">
                        {isAr ? 'رائد مخاطر' : 'Risk Champion'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`flex items-center gap-1 rounded-full px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium shrink-0 ${getPerformanceColor(
                      performanceLevel
                    )}`}
                  >
                    <span className="shrink-0">{getPerformanceIcon(performanceLevel)}</span>
                    <span className="truncate">{getPerformanceLabel(performanceLevel)}</span>
                  </span>
                </div>

                {/* Department & Accessible Departments */}
                <div className="mb-3 sm:mb-4 flex flex-wrap items-center gap-1 sm:gap-2">
                  {champion.department && (
                    <Badge variant="default">
                      <Building2 className="me-1 h-3 w-3 shrink-0" />
                      <span className="truncate">{isAr ? champion.department.nameAr : champion.department.nameEn}</span>
                    </Badge>
                  )}
                  {champion.accessibleDepartments && champion.accessibleDepartments.length > 0 && (
                    <Badge variant="success">
                      <span className="truncate">+{champion.accessibleDepartments.length} {isAr ? 'وظائف' : 'depts'}</span>
                    </Badge>
                  )}
                </div>

                {/* Stats Row */}
                <div className="mb-3 sm:mb-4 grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="rounded-lg bg-[var(--background-secondary)] p-2 sm:p-3 text-center">
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--foreground)]">{champion.risksAssigned || 0}</p>
                    <p className="text-[10px] sm:text-xs text-[var(--foreground-secondary)] truncate">
                      {isAr ? 'المخاطر المسندة' : 'Assigned Risks'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[var(--background-secondary)] p-2 sm:p-3 text-center">
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--status-success)]">{resolutionRate}%</p>
                    <p className="text-[10px] sm:text-xs text-[var(--foreground-secondary)] truncate">
                      {isAr ? 'معدل الحل' : 'Resolution Rate'}
                    </p>
                  </div>
                </div>

                {/* Treatment Progress */}
                <div className="mb-3 sm:mb-4">
                  <div className="mb-1 flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-[var(--foreground-secondary)] truncate min-w-0">
                      {isAr ? 'المخاطر المحلولة' : 'Resolved Risks'}
                    </span>
                    <span className="font-medium text-[var(--foreground)] shrink-0">
                      {champion.risksResolved || 0}/{champion.risksAssigned || 0}
                    </span>
                  </div>
                  <div className="h-1.5 sm:h-2 overflow-hidden rounded-full bg-[var(--background-tertiary)]">
                    <div
                      className="h-full rounded-full bg-[var(--status-success)]"
                      style={{
                        width: `${resolutionRate}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Join Date */}
                <div className="mb-3 sm:mb-4 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-[var(--foreground-secondary)]">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                  <span className="truncate">{isAr ? 'تاريخ الانضمام:' : 'Joined:'}</span>
                  <span className="font-medium shrink-0">
                    {new Date(champion.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between border-t border-[var(--border)] pt-3 sm:pt-4">
                  <div className="flex gap-1 sm:gap-2">
                    <Button variant="ghost" size="sm" title={isAr ? 'عرض' : 'View'}>
                      <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                    <Button variant="ghost" size="sm" title={isAr ? 'مراسلة' : 'Message'}>
                      <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleCardExpand(champion.id)}
                    rightIcon={isExpanded ? <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5" /> : <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />}
                  >
                    <span className="text-xs sm:text-sm">{isExpanded ? (isAr ? 'أقل' : 'Less') : (isAr ? 'المزيد' : 'More')}</span>
                  </Button>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-[var(--border)] bg-[var(--background-secondary)] p-2 sm:p-3 md:p-4">
                  {/* Contact Info */}
                  <div className="mb-3 sm:mb-4 space-y-1.5 sm:space-y-2">
                    <h4 className="text-xs sm:text-sm font-semibold text-[var(--foreground)]">
                      {isAr ? 'معلومات الاتصال' : 'Contact Information'}
                    </h4>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-[var(--foreground-secondary)]">
                      <Mail className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                      <span className="truncate min-w-0">{champion.email}</span>
                    </div>
                    {champion.phone && (
                      <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-[var(--foreground-secondary)]">
                        <Phone className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                        <span dir="ltr" className="truncate min-w-0">{champion.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Accessible Departments */}
                  {champion.accessibleDepartments && champion.accessibleDepartments.length > 0 && (
                    <div>
                      <h4 className="mb-1.5 sm:mb-2 text-xs sm:text-sm font-semibold text-[var(--foreground)]">
                        {isAr ? 'الوظائف التي يمكنه الاطلاع عليها' : 'Accessible Departments'}
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {champion.accessibleDepartments.map((access) => (
                          <Badge key={access.departmentId} variant="default" size="sm">
                            {isAr ? access.department.nameAr : access.department.nameEn}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredChampions.length === 0 && (
        <Card className="p-4 sm:p-6 md:p-8 text-center">
          <Users className="mx-auto h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-[var(--foreground-muted)]" />
          <h3 className="mt-3 sm:mt-4 font-semibold text-sm sm:text-base text-[var(--foreground)]">
            {isAr ? 'لا يوجد رواد' : 'No Champions Found'}
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-[var(--foreground-secondary)]">
            {isAr
              ? 'لم يتم العثور على رواد مخاطر. يمكنك إضافة رواد من صفحة الإعدادات > المستخدمين'
              : 'No risk champions found. You can add champions from Settings > Users'}
          </p>
        </Card>
      )}

      {/* Training Program Modal */}
      <Modal
        isOpen={showTrainingModal}
        onClose={() => setShowTrainingModal(false)}
        title={isAr ? 'برنامج تدريب الرواد' : 'Champion Training Program'}
        size="lg"
      >
        <div className="space-y-3 sm:space-y-4">
          <p className="text-xs sm:text-sm text-[var(--foreground-secondary)]">
            {isAr
              ? 'برنامج تدريب شامل لتأهيل رواد المخاطر على إدارة المخاطر بفعالية'
              : 'Comprehensive training program to qualify risk champions for effective risk management'}
          </p>

          {trainingModules.map((module) => (
            <div
              key={module.id}
              className="rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] p-2 sm:p-3 md:p-4"
            >
              <div className="flex items-start justify-between gap-2 sm:gap-3">
                <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                  <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-[var(--primary-light)] shrink-0">
                    <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--primary)]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                      <h4 className="font-semibold text-xs sm:text-sm md:text-base text-[var(--foreground)] truncate">
                        {isAr ? module.titleAr : module.titleEn}
                      </h4>
                      {module.required && (
                        <Badge variant="danger" size="sm">
                          {isAr ? 'إلزامي' : 'Required'}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-[10px] sm:text-xs md:text-sm text-[var(--foreground-secondary)]">
                      {isAr ? module.descriptionAr : module.descriptionEn}
                    </p>
                    <div className="mt-1.5 sm:mt-2 flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-[var(--foreground-muted)]">
                      <span className="flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                        {module.duration}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <ModalFooter>
          <Button size="sm" onClick={() => setShowTrainingModal(false)}>
            <span className="text-xs sm:text-sm">{isAr ? 'إغلاق' : 'Close'}</span>
          </Button>
        </ModalFooter>
      </Modal>

      {/* Champion Guide Modal */}
      <Modal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        title={isAr ? 'دليل رائد المخاطر' : 'Risk Champion Guide'}
        size="lg"
      >
        <div className="space-y-4 sm:space-y-6">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] p-2 sm:p-3 md:p-4">
            <h4 className="mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2 font-semibold text-xs sm:text-sm md:text-base text-[var(--foreground)]">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--primary)] shrink-0" />
              {isAr ? 'مسؤوليات رائد المخاطر' : 'Risk Champion Responsibilities'}
            </h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-[var(--foreground-secondary)]">
              <li className="flex items-start gap-1.5 sm:gap-2">
                <CheckCircle className="mt-0.5 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 text-[var(--status-success)]" />
                <span className="min-w-0">{isAr
                  ? 'تحديد وتسجيل المخاطر في إدارته'
                  : 'Identify and register risks in their department'}</span>
              </li>
              <li className="flex items-start gap-1.5 sm:gap-2">
                <CheckCircle className="mt-0.5 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 text-[var(--status-success)]" />
                <span className="min-w-0">{isAr
                  ? 'تقييم المخاطر وتحديد مستوى الخطورة'
                  : 'Assess risks and determine severity levels'}</span>
              </li>
              <li className="flex items-start gap-1.5 sm:gap-2">
                <CheckCircle className="mt-0.5 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 text-[var(--status-success)]" />
                <span className="min-w-0">{isAr
                  ? 'إعداد ومتابعة خطط المعالجة'
                  : 'Develop and monitor treatment plans'}</span>
              </li>
              <li className="flex items-start gap-1.5 sm:gap-2">
                <CheckCircle className="mt-0.5 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 text-[var(--status-success)]" />
                <span className="min-w-0">{isAr
                  ? 'رفع التقارير الدورية لإدارة المخاطر'
                  : 'Submit periodic reports to risk management'}</span>
              </li>
              <li className="flex items-start gap-1.5 sm:gap-2">
                <CheckCircle className="mt-0.5 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 text-[var(--status-success)]" />
                <span className="min-w-0">{isAr
                  ? 'نشر ثقافة إدارة المخاطر في الإدارة'
                  : 'Promote risk management culture in the department'}</span>
              </li>
            </ul>
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] p-2 sm:p-3 md:p-4">
            <h4 className="mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2 font-semibold text-xs sm:text-sm md:text-base text-[var(--foreground)]">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--primary)] shrink-0" />
              {isAr ? 'مؤشرات الأداء' : 'Performance Indicators'}
            </h4>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="rounded bg-[var(--background)] p-2 sm:p-3">
                <div className="text-base sm:text-lg md:text-xl font-bold text-[var(--foreground)]">≥ 80%</div>
                <p className="text-[10px] sm:text-xs text-[var(--foreground-secondary)]">
                  {isAr ? 'معدل حل المخاطر المستهدف' : 'Target risk resolution rate'}
                </p>
              </div>
              <div className="rounded bg-[var(--background)] p-2 sm:p-3">
                <div className="text-base sm:text-lg md:text-xl font-bold text-[var(--foreground)]">≤ 30</div>
                <p className="text-[10px] sm:text-xs text-[var(--foreground-secondary)]">
                  {isAr ? 'أيام لتحديث سجل المخاطر' : 'Days to update risk register'}
                </p>
              </div>
              <div className="rounded bg-[var(--background)] p-2 sm:p-3">
                <div className="text-base sm:text-lg md:text-xl font-bold text-[var(--foreground)]">100%</div>
                <p className="text-[10px] sm:text-xs text-[var(--foreground-secondary)]">
                  {isAr ? 'إكمال التدريب الإلزامي' : 'Mandatory training completion'}
                </p>
              </div>
              <div className="rounded bg-[var(--background)] p-2 sm:p-3">
                <div className="text-base sm:text-lg md:text-xl font-bold text-[var(--foreground)]">≥ 90%</div>
                <p className="text-[10px] sm:text-xs text-[var(--foreground-secondary)]">
                  {isAr ? 'إكمال خطط المعالجة في الوقت' : 'On-time treatment plan completion'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--primary)]/30 bg-[var(--primary-light)] p-2 sm:p-3 md:p-4">
            <div className="flex gap-2 sm:gap-3">
              <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-[var(--primary)]" />
              <div className="min-w-0">
                <h5 className="font-medium text-xs sm:text-sm text-[var(--foreground)]">
                  {isAr ? 'للدعم والمساعدة' : 'For Support'}
                </h5>
                <p className="mt-1 text-[10px] sm:text-xs md:text-sm text-[var(--foreground-secondary)]">
                  {isAr
                    ? 'تواصل مع إدارة المخاطر المؤسسية للحصول على الدعم والتوجيه اللازم'
                    : 'Contact the Enterprise Risk Management department for support and guidance'}
                </p>
              </div>
            </div>
          </div>
        </div>
        <ModalFooter>
          <Button size="sm" onClick={() => setShowGuideModal(false)}>
            <span className="text-xs sm:text-sm">{isAr ? 'فهمت' : 'Got it'}</span>
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
