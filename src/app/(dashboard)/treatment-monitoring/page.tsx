'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import {
  Search,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  Users,
  Target,
  TrendingUp,
  TrendingDown,
  Shield,
  Share2,
  Ban,
  Activity,
  BarChart3,
  Eye,
  ChevronRight,
  Loader2,
  Filter,
  UserCircle,
  Building2,
  ListTodo,
  CircleDot,
  Play,
  XCircle,
  Sparkles,
  ArrowUpRight,
  Timer,
  CheckCheck,
  Flame,
  Zap,
} from 'lucide-react';
import type { TreatmentStatus, TreatmentStrategy, RiskRating } from '@/types';

// ============================================
// Types
// ============================================

interface TreatmentPlanData {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  strategy: TreatmentStrategy;
  status: TreatmentStatus;
  priority: string;
  progress: number;
  startDate: string;
  dueDate: string;
  completionDate: string | null;
  cost: number | null;
  expectedResidualLikelihood: number | null;
  expectedResidualImpact: number | null;
  expectedResidualScore: number | null;
  expectedResidualRating: string | null;
  risk: {
    id: string;
    riskNumber: string;
    titleAr: string;
    titleEn: string;
    inherentRating: string;
    residualRating: string | null;
    department: {
      id: string;
      nameAr: string;
      nameEn: string;
      riskChampion?: {
        id: string;
        fullName: string;
        fullNameEn: string | null;
      };
    } | null;
    owner: {
      id: string;
      fullName: string;
      fullNameEn: string | null;
      email: string;
    } | null;
  };
  responsible: {
    id: string;
    fullName: string;
    fullNameEn: string | null;
    email: string;
    avatar: string | null;
    department: {
      id: string;
      nameAr: string;
      nameEn: string;
    } | null;
  };
  riskOwner: {
    id: string;
    fullName: string;
    fullNameEn: string | null;
    email: string;
  } | null;
  monitor: {
    id: string;
    fullName: string;
    fullNameEn: string | null;
    email: string;
    avatar: string | null;
  } | null;
  createdBy: {
    id: string;
    fullName: string;
    fullNameEn: string | null;
  };
  tasks: TaskData[];
}

interface TaskData {
  id: string;
  titleAr: string;
  titleEn: string;
  status: string;
  priority: string;
  dueDate: string | null;
  assignedTo: {
    id: string;
    fullName: string;
    fullNameEn: string | null;
    avatar: string | null;
  } | null;
}

interface Stats {
  total: number;
  notStarted: number;
  inProgress: number;
  completed: number;
  overdue: number;
  cancelled: number;
  highPriority: number;
  averageProgress: number;
}

interface ResponsibleStat {
  user: TreatmentPlanData['responsible'];
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
}

interface DepartmentStat {
  id: string;
  nameAr: string;
  nameEn: string;
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
}

interface StrategyStats {
  avoid: number;
  reduce: number;
  transfer: number;
  accept: number;
}

// ============================================
// Constants
// ============================================

const statusConfig: Record<string, { icon: React.ElementType; colorClass: string; bgClass: string; labelAr: string; labelEn: string }> = {
  notStarted: {
    icon: CircleDot,
    colorClass: 'text-gray-600 dark:text-gray-300',
    bgClass: 'bg-gray-100 dark:bg-gray-700/50',
    labelAr: 'لم يبدأ',
    labelEn: 'Not Started',
  },
  inProgress: {
    icon: Play,
    colorClass: 'text-sky-600 dark:text-sky-300',
    bgClass: 'bg-sky-50 dark:bg-sky-900/30',
    labelAr: 'قيد التنفيذ',
    labelEn: 'In Progress',
  },
  completed: {
    icon: CheckCircle2,
    colorClass: 'text-emerald-600 dark:text-emerald-300',
    bgClass: 'bg-emerald-50 dark:bg-emerald-900/30',
    labelAr: 'مكتمل',
    labelEn: 'Completed',
  },
  overdue: {
    icon: AlertCircle,
    colorClass: 'text-rose-600 dark:text-rose-300',
    bgClass: 'bg-rose-50 dark:bg-rose-900/30',
    labelAr: 'متأخر',
    labelEn: 'Overdue',
  },
  cancelled: {
    icon: XCircle,
    colorClass: 'text-gray-500 dark:text-gray-400',
    bgClass: 'bg-gray-50 dark:bg-gray-800/50',
    labelAr: 'ملغي',
    labelEn: 'Cancelled',
  },
};

const strategyConfig: Record<string, { icon: React.ElementType; colorClass: string; bgClass: string; labelAr: string; labelEn: string }> = {
  avoid: {
    icon: Ban,
    colorClass: 'text-white',
    bgClass: 'bg-rose-500 dark:bg-rose-600',
    labelAr: 'تجنب',
    labelEn: 'Avoid',
  },
  reduce: {
    icon: TrendingDown,
    colorClass: 'text-white',
    bgClass: 'bg-[#F39200] dark:bg-[#F39200]',
    labelAr: 'تقليل',
    labelEn: 'Reduce',
  },
  transfer: {
    icon: Share2,
    colorClass: 'text-white',
    bgClass: 'bg-sky-500 dark:bg-sky-600',
    labelAr: 'نقل',
    labelEn: 'Transfer',
  },
  accept: {
    icon: CheckCircle2,
    colorClass: 'text-white',
    bgClass: 'bg-emerald-500 dark:bg-emerald-600',
    labelAr: 'قبول',
    labelEn: 'Accept',
  },
};

const priorityConfig: Record<string, { colorClass: string; bgClass: string; labelAr: string; labelEn: string }> = {
  high: {
    colorClass: 'text-rose-600 dark:text-rose-400',
    bgClass: 'bg-rose-50 dark:bg-rose-900/30',
    labelAr: 'عالية',
    labelEn: 'High',
  },
  medium: {
    colorClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-50 dark:bg-amber-900/30',
    labelAr: 'متوسطة',
    labelEn: 'Medium',
  },
  low: {
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-50 dark:bg-emerald-900/30',
    labelAr: 'منخفضة',
    labelEn: 'Low',
  },
};

// ============================================
// Helper Components
// ============================================

const AnimatedCounter = ({ value, suffix = '' }: { value: number; suffix?: string }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  return <span>{displayValue}{suffix}</span>;
};

const ProgressRing = ({ progress, size = 60, strokeWidth = 6 }: { progress: number; size?: number; strokeWidth?: number }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  const getColor = () => {
    if (progress >= 75) return '#10B981';
    if (progress >= 50) return '#F39200';
    if (progress >= 25) return '#FBBF24';
    return '#EF4444';
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{progress}%</span>
      </div>
    </div>
  );
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  trend,
  color,
  delay = 0,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  trend?: 'up' | 'down' | 'neutral';
  color: string;
  delay?: number;
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`relative overflow-hidden rounded-xl p-4 transition-all duration-500 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
      style={{ backgroundColor: color + '10' }}
    >
      <div className="absolute -end-4 -top-4 h-20 w-20 rounded-full opacity-20" style={{ backgroundColor: color }} />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="rounded-lg p-2" style={{ backgroundColor: color + '20' }}>
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs ${trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-rose-500' : 'text-gray-500'}`}>
              {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : trend === 'down' ? <TrendingDown className="h-3 w-3" /> : null}
            </div>
          )}
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            <AnimatedCounter value={value} />
          </p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{label}</p>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Main Component
// ============================================

export default function TreatmentMonitoringPage() {
  const { t, language, isRTL } = useTranslation();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [responsibleFilter, setResponsibleFilter] = useState<string>('all');
  const [selectedPlan, setSelectedPlan] = useState<TreatmentPlanData | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlanData[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    notStarted: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
    cancelled: 0,
    highPriority: 0,
    averageProgress: 0,
  });
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<TreatmentPlanData[]>([]);
  const [overduePlans, setOverduePlans] = useState<TreatmentPlanData[]>([]);
  const [responsibleStats, setResponsibleStats] = useState<ResponsibleStat[]>([]);
  const [strategyStats, setStrategyStats] = useState<StrategyStats>({ avoid: 0, reduce: 0, transfer: 0, accept: 0 });
  const [departmentStats, setDepartmentStats] = useState<DepartmentStat[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/treatment-monitoring');
      const data = await response.json();

      if (data.success) {
        setTreatmentPlans(data.data.treatmentPlans);
        setStats(data.data.stats);
        setUpcomingDeadlines(data.data.upcomingDeadlines);
        setOverduePlans(data.data.overduePlans);
        setResponsibleStats(data.data.responsibleStats);
        setStrategyStats(data.data.strategyStats);
        setDepartmentStats(data.data.departmentStats);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique departments and responsibles for filters
  const departments = useMemo(() => {
    const depts = new Map<string, { nameAr: string; nameEn: string }>();
    treatmentPlans.forEach((plan) => {
      if (plan.risk.department) {
        depts.set(plan.risk.department.id, {
          nameAr: plan.risk.department.nameAr,
          nameEn: plan.risk.department.nameEn,
        });
      }
    });
    return Array.from(depts.entries()).map(([id, names]) => ({ id, ...names }));
  }, [treatmentPlans]);

  const responsibles = useMemo(() => {
    const users = new Map<string, { fullName: string; fullNameEn: string | null }>();
    treatmentPlans.forEach((plan) => {
      users.set(plan.responsible.id, {
        fullName: plan.responsible.fullName,
        fullNameEn: plan.responsible.fullNameEn,
      });
    });
    return Array.from(users.entries()).map(([id, names]) => ({ id, ...names }));
  }, [treatmentPlans]);

  // Filter treatment plans
  const filteredPlans = useMemo(() => {
    return treatmentPlans.filter((plan) => {
      const matchesSearch =
        searchQuery === '' ||
        plan.titleAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.risk.riskNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.risk.titleAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.risk.titleEn.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || plan.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || plan.priority === priorityFilter;
      const matchesDepartment = departmentFilter === 'all' || plan.risk.department?.id === departmentFilter;
      const matchesResponsible = responsibleFilter === 'all' || plan.responsible.id === responsibleFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesDepartment && matchesResponsible;
    });
  }, [treatmentPlans, searchQuery, statusFilter, priorityFilter, departmentFilter, responsibleFilter]);

  const getDaysRemaining = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#F39200]" />
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Page Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900 dark:text-white">
              <div className="rounded-xl bg-gradient-to-br from-[#F39200] to-[#E08200] p-3 shadow-lg shadow-orange-200 dark:shadow-orange-900/30">
                <Activity className="h-7 w-7 text-white" />
              </div>
              {language === 'ar' ? 'متابعة المعالجة' : 'Treatment Monitoring'}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {language === 'ar'
                ? 'متابعة شاملة لجميع خطط معالجة المخاطر والمسؤولين والتقدم'
                : 'Comprehensive monitoring of all risk treatment plans, responsibilities, and progress'}
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => router.push('/treatment')}
            rightIcon={<ChevronRight className="h-4 w-4" />}
          >
            {language === 'ar' ? 'إدارة الخطط' : 'Manage Plans'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          icon={ListTodo}
          label={language === 'ar' ? 'إجمالي الخطط' : 'Total Plans'}
          value={stats.total}
          color="#6366F1"
          delay={0}
        />
        <StatCard
          icon={CircleDot}
          label={language === 'ar' ? 'لم تبدأ' : 'Not Started'}
          value={stats.notStarted}
          color="#94A3B8"
          delay={100}
        />
        <StatCard
          icon={Play}
          label={language === 'ar' ? 'قيد التنفيذ' : 'In Progress'}
          value={stats.inProgress}
          color="#0EA5E9"
          delay={200}
        />
        <StatCard
          icon={CheckCircle2}
          label={language === 'ar' ? 'مكتملة' : 'Completed'}
          value={stats.completed}
          color="#10B981"
          delay={300}
        />
        <StatCard
          icon={AlertCircle}
          label={language === 'ar' ? 'متأخرة' : 'Overdue'}
          value={stats.overdue}
          color="#EF4444"
          delay={400}
        />
        <StatCard
          icon={Flame}
          label={language === 'ar' ? 'أولوية عالية' : 'High Priority'}
          value={stats.highPriority}
          color="#F39200"
          delay={500}
        />
      </div>

      {/* Average Progress */}
      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        {/* Progress Overview */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#F39200]" />
              {language === 'ar' ? 'نظرة عامة على التقدم' : 'Progress Overview'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-6">
              <ProgressRing progress={stats.averageProgress} size={120} strokeWidth={10} />
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {language === 'ar' ? 'متوسط التقدم الإجمالي' : 'Average Overall Progress'}
                </p>
              </div>
              <div className="w-full space-y-3">
                {Object.entries(strategyStats).map(([strategy, count]) => {
                  const config = strategyConfig[strategy];
                  const Icon = config.icon;
                  const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                  return (
                    <div key={strategy} className="flex items-center gap-3">
                      <div className={`rounded-lg p-1.5 ${config.bgClass}`}>
                        <Icon className={`h-4 w-4 ${config.colorClass}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 dark:text-gray-300">
                            {language === 'ar' ? config.labelAr : config.labelEn}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">{count}</span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${config.bgClass}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-amber-500" />
              {language === 'ar' ? 'مواعيد قريبة' : 'Upcoming Deadlines'}
              {upcomingDeadlines.length > 0 && (
                <Badge variant="warning" size="sm">{upcomingDeadlines.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingDeadlines.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
                  <CheckCheck className="mb-2 h-10 w-10 text-emerald-500" />
                  <p>{language === 'ar' ? 'لا توجد مواعيد قريبة' : 'No upcoming deadlines'}</p>
                </div>
              ) : (
                upcomingDeadlines.slice(0, 5).map((plan) => {
                  const days = getDaysRemaining(plan.dueDate);
                  return (
                    <div
                      key={plan.id}
                      className="group flex cursor-pointer items-center gap-3 rounded-lg border border-gray-100 p-3 transition-all hover:border-[#F39200] hover:bg-orange-50/50 dark:border-gray-700 dark:hover:border-[#F39200] dark:hover:bg-orange-900/10"
                      onClick={() => setSelectedPlan(plan)}
                    >
                      <div className={`rounded-lg p-2 ${days <= 2 ? 'bg-rose-100 dark:bg-rose-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                        <Calendar className={`h-4 w-4 ${days <= 2 ? 'text-rose-600' : 'text-amber-600'}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                          {language === 'ar' ? plan.titleAr : plan.titleEn}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {plan.risk.riskNumber}
                        </p>
                      </div>
                      <div className={`rounded-full px-2 py-1 text-xs font-medium ${
                        days <= 2 ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                      }`}>
                        {days} {language === 'ar' ? 'يوم' : 'days'}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Overdue Plans */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              {language === 'ar' ? 'خطط متأخرة' : 'Overdue Plans'}
              {overduePlans.length > 0 && (
                <Badge variant="danger" size="sm">{overduePlans.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overduePlans.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
                  <Sparkles className="mb-2 h-10 w-10 text-emerald-500" />
                  <p>{language === 'ar' ? 'لا توجد خطط متأخرة!' : 'No overdue plans!'}</p>
                </div>
              ) : (
                overduePlans.slice(0, 5).map((plan) => {
                  const days = Math.abs(getDaysRemaining(plan.dueDate));
                  return (
                    <div
                      key={plan.id}
                      className="group flex cursor-pointer items-center gap-3 rounded-lg border border-rose-100 bg-rose-50/50 p-3 transition-all hover:border-rose-300 dark:border-rose-900/30 dark:bg-rose-900/10 dark:hover:border-rose-700"
                      onClick={() => setSelectedPlan(plan)}
                    >
                      <div className="rounded-lg bg-rose-100 p-2 dark:bg-rose-900/30">
                        <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                          {language === 'ar' ? plan.titleAr : plan.titleEn}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {language === 'ar' ? plan.responsible.fullName : plan.responsible.fullNameEn || plan.responsible.fullName}
                        </p>
                      </div>
                      <div className="rounded-full bg-rose-100 px-2 py-1 text-xs font-medium text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                        -{days} {language === 'ar' ? 'يوم' : 'days'}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Responsible Performance */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        {/* By Responsible */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-500" />
              {language === 'ar' ? 'أداء المسؤولين' : 'Responsible Performance'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {responsibleStats.slice(0, 6).map((stat, index) => (
                <div
                  key={stat.user.id}
                  className="flex items-center gap-4 rounded-lg border border-gray-100 p-3 transition-all hover:border-[#F39200]/50 hover:shadow-sm dark:border-gray-700 dark:hover:border-[#F39200]/50"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-sm font-bold text-white">
                    {stat.user.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900 dark:text-white">
                      {language === 'ar' ? stat.user.fullName : stat.user.fullNameEn || stat.user.fullName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {language === 'ar' ? stat.user.department?.nameAr : stat.user.department?.nameEn}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{stat.total}</p>
                      <p className="text-xs text-gray-500">{language === 'ar' ? 'إجمالي' : 'Total'}</p>
                    </div>
                    <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
                    <div className="flex gap-2">
                      <div className="flex items-center gap-1 rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" />
                        {stat.completed}
                      </div>
                      <div className="flex items-center gap-1 rounded bg-sky-100 px-2 py-1 text-xs font-medium text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                        <Play className="h-3 w-3" />
                        {stat.inProgress}
                      </div>
                      {stat.overdue > 0 && (
                        <div className="flex items-center gap-1 rounded bg-rose-100 px-2 py-1 text-xs font-medium text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                          <AlertCircle className="h-3 w-3" />
                          {stat.overdue}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* By Department */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-cyan-500" />
              {language === 'ar' ? 'المعالجة حسب الإدارة' : 'Treatment by Department'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {departmentStats.slice(0, 6).map((dept, index) => {
                const completionRate = dept.total > 0 ? Math.round((dept.completed / dept.total) * 100) : 0;
                return (
                  <div
                    key={dept.id}
                    className="rounded-lg border border-gray-100 p-3 transition-all hover:border-[#F39200]/50 hover:shadow-sm dark:border-gray-700 dark:hover:border-[#F39200]/50"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {language === 'ar' ? dept.nameAr : dept.nameEn}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {dept.total} {language === 'ar' ? 'خطة' : 'plans'}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className={`text-sm font-medium ${completionRate >= 70 ? 'text-emerald-600' : completionRate >= 40 ? 'text-amber-600' : 'text-rose-600'}`}>
                            {completionRate}% {language === 'ar' ? 'مكتمل' : 'complete'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {dept.completed > 0 && (
                          <Badge variant="success" size="sm">{dept.completed}</Badge>
                        )}
                        {dept.inProgress > 0 && (
                          <Badge variant="info" size="sm">{dept.inProgress}</Badge>
                        )}
                        {dept.overdue > 0 && (
                          <Badge variant="danger" size="sm">{dept.overdue}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-1000"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder={language === 'ar' ? 'بحث في الخطط...' : 'Search plans...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-10"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <option value="all">{language === 'ar' ? 'كل الحالات' : 'All Status'}</option>
              <option value="notStarted">{language === 'ar' ? 'لم يبدأ' : 'Not Started'}</option>
              <option value="inProgress">{language === 'ar' ? 'قيد التنفيذ' : 'In Progress'}</option>
              <option value="completed">{language === 'ar' ? 'مكتمل' : 'Completed'}</option>
              <option value="overdue">{language === 'ar' ? 'متأخر' : 'Overdue'}</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <option value="all">{language === 'ar' ? 'كل الأولويات' : 'All Priorities'}</option>
              <option value="high">{language === 'ar' ? 'عالية' : 'High'}</option>
              <option value="medium">{language === 'ar' ? 'متوسطة' : 'Medium'}</option>
              <option value="low">{language === 'ar' ? 'منخفضة' : 'Low'}</option>
            </select>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <option value="all">{language === 'ar' ? 'كل الإدارات' : 'All Departments'}</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {language === 'ar' ? dept.nameAr : dept.nameEn}
                </option>
              ))}
            </select>

            <select
              value={responsibleFilter}
              onChange={(e) => setResponsibleFilter(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <option value="all">{language === 'ar' ? 'كل المسؤولين' : 'All Responsibles'}</option>
              {responsibles.map((user) => (
                <option key={user.id} value={user.id}>
                  {language === 'ar' ? user.fullName : user.fullNameEn || user.fullName}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-1 dark:border-gray-700">
              <button
                onClick={() => setViewMode('cards')}
                className={`rounded-md p-2 transition-colors ${viewMode === 'cards' ? 'bg-[#F39200] text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'}`}
              >
                <BarChart3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`rounded-md p-2 transition-colors ${viewMode === 'table' ? 'bg-[#F39200] text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'}`}
              >
                <ListTodo className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Treatment Plans Grid */}
      {viewMode === 'cards' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPlans.map((plan, index) => {
            const statusConf = statusConfig[plan.status] || statusConfig.notStarted;
            const strategyConf = strategyConfig[plan.strategy] || strategyConfig.reduce;
            const priorityConf = priorityConfig[plan.priority] || priorityConfig.medium;
            const StatusIcon = statusConf.icon;
            const StrategyIcon = strategyConf.icon;
            const daysRemaining = getDaysRemaining(plan.dueDate);
            const isOverdue = daysRemaining < 0 && plan.status !== 'completed' && plan.status !== 'cancelled';

            return (
              <Card
                key={plan.id}
                hover
                className={`group transition-all duration-300 hover:shadow-lg ${isOverdue ? 'border-rose-200 dark:border-rose-800' : ''}`}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => setSelectedPlan(plan)}
              >
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="mb-4 flex items-start justify-between">
                    <div className={`rounded-lg p-2 ${strategyConf.bgClass}`}>
                      <StrategyIcon className={`h-5 w-5 ${strategyConf.colorClass}`} />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${priorityConf.bgClass} ${priorityConf.colorClass}`}>
                        {plan.priority === 'high' && <Zap className="h-3 w-3" />}
                        {language === 'ar' ? priorityConf.labelAr : priorityConf.labelEn}
                      </div>
                      <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusConf.bgClass} ${statusConf.colorClass}`}>
                        <StatusIcon className="h-3 w-3" />
                        {language === 'ar' ? statusConf.labelAr : statusConf.labelEn}
                      </div>
                    </div>
                  </div>

                  {/* Title & Risk */}
                  <h3 className="mb-1 line-clamp-2 font-semibold text-gray-900 dark:text-white">
                    {language === 'ar' ? plan.titleAr : plan.titleEn}
                  </h3>
                  <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
                    {plan.risk.riskNumber} - {language === 'ar' ? plan.risk.titleAr : plan.risk.titleEn}
                  </p>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{language === 'ar' ? 'التقدم' : 'Progress'}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{plan.progress}%</span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#F39200] to-[#FFB84D] transition-all duration-500"
                        style={{ width: `${plan.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-2">
                    {/* Responsible */}
                    <div className="flex items-center gap-2 text-sm">
                      <UserCircle className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {language === 'ar' ? plan.responsible.fullName : plan.responsible.fullNameEn || plan.responsible.fullName}
                      </span>
                    </div>

                    {/* Due Date */}
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className={`h-4 w-4 ${isOverdue ? 'text-rose-500' : 'text-gray-400'}`} />
                      <span className={isOverdue ? 'font-medium text-rose-600 dark:text-rose-400' : 'text-gray-600 dark:text-gray-400'}>
                        {formatDate(plan.dueDate)}
                        {isOverdue && ` (${Math.abs(daysRemaining)} ${language === 'ar' ? 'يوم متأخر' : 'days overdue'})`}
                      </span>
                    </div>

                    {/* Tasks */}
                    {plan.tasks.length > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <ListTodo className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">
                          {plan.tasks.filter((t) => t.status === 'completed').length}/{plan.tasks.length} {language === 'ar' ? 'مهام' : 'tasks'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* View Button */}
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      rightIcon={<ArrowUpRight className="h-4 w-4" />}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      {language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-start text-sm font-semibold text-gray-600 dark:text-gray-300">
                    {language === 'ar' ? 'الخطة' : 'Plan'}
                  </th>
                  <th className="px-4 py-3 text-start text-sm font-semibold text-gray-600 dark:text-gray-300">
                    {language === 'ar' ? 'الخطر' : 'Risk'}
                  </th>
                  <th className="px-4 py-3 text-start text-sm font-semibold text-gray-600 dark:text-gray-300">
                    {language === 'ar' ? 'المسؤول' : 'Responsible'}
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">
                    {language === 'ar' ? 'الاستراتيجية' : 'Strategy'}
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">
                    {language === 'ar' ? 'الحالة' : 'Status'}
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">
                    {language === 'ar' ? 'التقدم' : 'Progress'}
                  </th>
                  <th className="px-4 py-3 text-start text-sm font-semibold text-gray-600 dark:text-gray-300">
                    {language === 'ar' ? 'الموعد' : 'Due Date'}
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">
                    {language === 'ar' ? 'إجراءات' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPlans.map((plan) => {
                  const statusConf = statusConfig[plan.status] || statusConfig.notStarted;
                  const strategyConf = strategyConfig[plan.strategy] || strategyConfig.reduce;
                  const StatusIcon = statusConf.icon;
                  const StrategyIcon = strategyConf.icon;
                  const daysRemaining = getDaysRemaining(plan.dueDate);
                  const isOverdue = daysRemaining < 0 && plan.status !== 'completed' && plan.status !== 'cancelled';

                  return (
                    <tr
                      key={plan.id}
                      className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      onClick={() => setSelectedPlan(plan)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {language === 'ar' ? plan.titleAr : plan.titleEn}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400">{plan.risk.riskNumber}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {language === 'ar' ? plan.responsible.fullName : plan.responsible.fullNameEn || plan.responsible.fullName}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${strategyConf.bgClass} ${strategyConf.colorClass}`}>
                          <StrategyIcon className="h-3 w-3" />
                          {language === 'ar' ? strategyConf.labelAr : strategyConf.labelEn}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${statusConf.bgClass} ${statusConf.colorClass}`}>
                          <StatusIcon className="h-3 w-3" />
                          {language === 'ar' ? statusConf.labelAr : statusConf.labelEn}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-2 w-16 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                            <div
                              className="h-full rounded-full bg-[#F39200]"
                              style={{ width: `${plan.progress}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{plan.progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className={`text-sm ${isOverdue ? 'font-medium text-rose-600 dark:text-rose-400' : 'text-gray-600 dark:text-gray-400'}`}>
                          {formatDate(plan.dueDate)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button variant="ghost" size="icon-sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {filteredPlans.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16 dark:border-gray-700">
          <Target className="mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {language === 'ar' ? 'لا توجد خطط معالجة' : 'No treatment plans found'}
          </h3>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            {language === 'ar' ? 'جرب تغيير معايير البحث' : 'Try adjusting your search filters'}
          </p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedPlan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setSelectedPlan(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {language === 'ar' ? selectedPlan.titleAr : selectedPlan.titleEn}
                </h2>
                <p className="mt-1 text-gray-500 dark:text-gray-400">
                  {selectedPlan.risk.riskNumber} - {language === 'ar' ? selectedPlan.risk.titleAr : selectedPlan.risk.titleEn}
                </p>
              </div>
              <button
                onClick={() => setSelectedPlan(null)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{language === 'ar' ? 'نسبة التقدم' : 'Progress'}</span>
                <span className="font-bold text-gray-900 dark:text-white">{selectedPlan.progress}%</span>
              </div>
              <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#F39200] to-[#FFB84D] transition-all duration-500"
                  style={{ width: `${selectedPlan.progress}%` }}
                />
              </div>
            </div>

            {/* Info Grid */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">{language === 'ar' ? 'المسؤول' : 'Responsible'}</p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-sm font-bold text-white">
                    {selectedPlan.responsible.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {language === 'ar' ? selectedPlan.responsible.fullName : selectedPlan.responsible.fullNameEn || selectedPlan.responsible.fullName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{selectedPlan.responsible.email}</p>
                  </div>
                </div>
              </div>

              {selectedPlan.monitor && (
                <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{language === 'ar' ? 'المتابع' : 'Monitor'}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 text-sm font-bold text-white">
                      {selectedPlan.monitor.fullName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {language === 'ar' ? selectedPlan.monitor.fullName : selectedPlan.monitor.fullNameEn || selectedPlan.monitor.fullName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{selectedPlan.monitor.email}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">{language === 'ar' ? 'الإدارة' : 'Department'}</p>
                <p className="mt-2 font-medium text-gray-900 dark:text-white">
                  {language === 'ar' ? selectedPlan.risk.department?.nameAr : selectedPlan.risk.department?.nameEn}
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">{language === 'ar' ? 'التكلفة' : 'Cost'}</p>
                <p className="mt-2 font-medium text-gray-900 dark:text-white">
                  {selectedPlan.cost ? `${selectedPlan.cost.toLocaleString()} ${language === 'ar' ? 'ر.س' : 'SAR'}` : '-'}
                </p>
              </div>
            </div>

            {/* Dates */}
            <div className="mb-6 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 dark:bg-gray-700">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {language === 'ar' ? 'البداية:' : 'Start:'} {formatDate(selectedPlan.startDate)}
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 dark:bg-gray-700">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {language === 'ar' ? 'الموعد:' : 'Due:'} {formatDate(selectedPlan.dueDate)}
                </span>
              </div>
              {selectedPlan.completionDate && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-100 px-3 py-2 dark:bg-emerald-900/30">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm text-emerald-700 dark:text-emerald-300">
                    {language === 'ar' ? 'الإنجاز:' : 'Completed:'} {formatDate(selectedPlan.completionDate)}
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">{language === 'ar' ? 'الوصف' : 'Description'}</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {language === 'ar' ? selectedPlan.descriptionAr : selectedPlan.descriptionEn}
              </p>
            </div>

            {/* Tasks */}
            {selectedPlan.tasks.length > 0 && (
              <div>
                <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">
                  {language === 'ar' ? 'المهام' : 'Tasks'} ({selectedPlan.tasks.length})
                </h3>
                <div className="space-y-2">
                  {selectedPlan.tasks.map((task) => {
                    const taskStatus = statusConfig[task.status] || statusConfig.notStarted;
                    const TaskIcon = taskStatus.icon;
                    return (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                      >
                        <div className={`rounded-full p-1.5 ${taskStatus.bgClass}`}>
                          <TaskIcon className={`h-4 w-4 ${taskStatus.colorClass}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-gray-900 dark:text-white">
                            {language === 'ar' ? task.titleAr : task.titleEn}
                          </p>
                          {task.assignedTo && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {language === 'ar' ? task.assignedTo.fullName : task.assignedTo.fullNameEn || task.assignedTo.fullName}
                            </p>
                          )}
                        </div>
                        {task.dueDate && (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(task.dueDate)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-6 dark:border-gray-700">
              <Button variant="outline" onClick={() => setSelectedPlan(null)}>
                {language === 'ar' ? 'إغلاق' : 'Close'}
              </Button>
              <Button
                variant="primary"
                onClick={() => router.push(`/risks/${selectedPlan.risk.id}`)}
                rightIcon={<ArrowUpRight className="h-4 w-4" />}
              >
                {language === 'ar' ? 'عرض الخطر' : 'View Risk'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
