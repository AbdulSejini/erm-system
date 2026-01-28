'use client';

import React, { useState, useEffect, useMemo, useTransition, useCallback } from 'react';
import { useTranslation } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import {
  Plus,
  Search,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Shield,
  TrendingDown,
  Share2,
  Ban,
  Check,
  Target,
  ListChecks,
  AlertTriangle,
  Loader2,
  X,
  Pencil,
  Trash2,
  ChevronRight,
  FileText,
  Users,
  Activity,
  Sparkles,
  Zap,
  BarChart3,
  CircleDot,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  Filter,
  SlidersHorizontal,
  Eye,
  MoreHorizontal,
} from 'lucide-react';
import type { TreatmentStatus, TreatmentStrategy, RiskRating } from '@/types';

// ============================================
// Types & Interfaces
// ============================================

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
  mitigationActionsAr: string | null;
  mitigationActionsEn: string | null;
  createdAt: string;
  updatedAt: string;
  followUpDate: string | null;
  department?: {
    id: string;
    nameAr: string;
    nameEn: string;
    riskChampion?: {
      id: string;
      fullName: string;
      fullNameEn: string | null;
    };
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
  };
  riskOwner?: {
    id: string;
    nameAr: string;
    nameEn: string | null;
    email: string | null;
  };
  treatmentPlans?: TreatmentPlanData[];
}

interface TreatmentPlanData {
  id: string;
  titleAr: string;
  titleEn: string;
  strategy: TreatmentStrategy;
  status: string;
  priority: string;
  progress: number;
  startDate: string;
  dueDate: string;
  responsibleId: string;
  responsible?: {
    fullName: string;
    fullNameEn: string | null;
  };
  tasks?: TaskData[];
}

interface TaskData {
  id: string;
  titleAr: string;
  titleEn: string;
  status: string;
  priority: string;
  dueDate: string | null;
}

interface Treatment {
  id: string;
  riskId: string;
  riskNumber: string;
  riskTitleAr: string;
  riskTitleEn: string;
  titleAr: string;
  titleEn: string;
  strategy: TreatmentStrategy;
  status: TreatmentStatus;
  inherentRating: RiskRating;
  inherentScore: number;
  residualRating: RiskRating;
  currentResidualScore: number;
  progress: number;
  priority: string;
  responsibleAr: string;
  responsibleEn: string;
  startDate: string;
  dueDate: string;
  tasks: TaskData[];
  departmentAr: string;
  departmentEn: string;
}

interface ResponsibleOption {
  id: string;
  name: string;
  nameEn: string;
  role: string;
}

// ============================================
// Helper Functions
// ============================================

const normalizeRating = (rating: string | null | undefined): RiskRating => {
  if (!rating) return 'Moderate';
  if (rating === 'Catastrophic') return 'Critical';
  if (['Critical', 'Major', 'Moderate', 'Minor', 'Negligible'].includes(rating)) {
    return rating as RiskRating;
  }
  return 'Moderate';
};

const determineStrategy = (status: string, inherentScore: number): TreatmentStrategy => {
  if (status === 'accepted') return 'accept';
  if (inherentScore >= 20) return 'avoid';
  if (inherentScore >= 12) return 'reduce';
  if (inherentScore >= 6) return 'transfer';
  return 'accept';
};

const determineStatus = (status: string, followUpDate: string | null): TreatmentStatus => {
  if (status === 'closed' || status === 'mitigated') return 'completed';
  if (status === 'accepted') return 'completed';
  if (followUpDate && new Date(followUpDate) < new Date()) return 'overdue';
  if (status === 'inProgress') return 'inProgress';
  return 'notStarted';
};

const calculateProgress = (inherentScore: number, residualScore: number | null): number => {
  if (!residualScore) return 0;
  const reduction = ((inherentScore - residualScore) / inherentScore) * 100;
  return Math.max(0, Math.min(100, Math.round(reduction)));
};

// Strategy metadata
const strategyConfig = {
  avoid: {
    icon: Ban,
    colorClass: 'text-red-500',
    bgClass: 'bg-red-50 dark:bg-red-900/20',
    borderClass: 'border-red-200 dark:border-red-800',
    labelAr: 'تجنب',
    labelEn: 'Avoid',
    descAr: 'تجنب الخطر عن طريق عدم القيام بالنشاط المسبب له',
    descEn: 'Avoid the risk by not performing the activity',
  },
  reduce: {
    icon: TrendingDown,
    colorClass: 'text-amber-500',
    bgClass: 'bg-amber-50 dark:bg-amber-900/20',
    borderClass: 'border-amber-200 dark:border-amber-800',
    labelAr: 'تقليل',
    labelEn: 'Reduce',
    descAr: 'تقليل احتمالية أو تأثير الخطر من خلال إجراءات رقابية',
    descEn: 'Reduce likelihood or impact through controls',
  },
  transfer: {
    icon: Share2,
    colorClass: 'text-blue-500',
    bgClass: 'bg-blue-50 dark:bg-blue-900/20',
    borderClass: 'border-blue-200 dark:border-blue-800',
    labelAr: 'نقل',
    labelEn: 'Transfer',
    descAr: 'نقل الخطر إلى طرف ثالث مثل شركات التأمين',
    descEn: 'Transfer the risk to a third party like insurance',
  },
  accept: {
    icon: CheckCircle,
    colorClass: 'text-green-500',
    bgClass: 'bg-green-50 dark:bg-green-900/20',
    borderClass: 'border-green-200 dark:border-green-800',
    labelAr: 'قبول',
    labelEn: 'Accept',
    descAr: 'قبول الخطر عندما تكون تكلفة المعالجة أعلى من الأثر',
    descEn: 'Accept when treatment cost exceeds impact',
  },
};

// Status metadata
const statusConfig = {
  notStarted: {
    icon: CircleDot,
    colorClass: 'text-slate-500',
    bgClass: 'bg-slate-100 dark:bg-slate-800',
    labelAr: 'لم يبدأ',
    labelEn: 'Not Started',
  },
  inProgress: {
    icon: Play,
    colorClass: 'text-blue-500',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    labelAr: 'قيد التنفيذ',
    labelEn: 'In Progress',
  },
  completed: {
    icon: CheckCircle2,
    colorClass: 'text-green-500',
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    labelAr: 'مكتمل',
    labelEn: 'Completed',
  },
  overdue: {
    icon: AlertCircle,
    colorClass: 'text-red-500',
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    labelAr: 'متأخر',
    labelEn: 'Overdue',
  },
  cancelled: {
    icon: XCircle,
    colorClass: 'text-gray-400',
    bgClass: 'bg-gray-100 dark:bg-gray-800',
    labelAr: 'ملغي',
    labelEn: 'Cancelled',
  },
};

// Rating colors
const ratingColors: Record<RiskRating, string> = {
  Critical: 'bg-red-500',
  Major: 'bg-orange-500',
  Moderate: 'bg-yellow-500',
  Minor: 'bg-green-500',
  Negligible: 'bg-blue-500',
};

// ============================================
// Main Component
// ============================================

export default function TreatmentPage() {
  const { t, language } = useTranslation();
  const isAr = language === 'ar';
  const [isPending, startTransition] = useTransition();

  // Core data states
  const [risks, setRisks] = useState<APIRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [responsibleOptions, setResponsibleOptions] = useState<ResponsibleOption[]>([]);
  const [riskOwnersList, setRiskOwnersList] = useState<{ id: string; nameAr: string; nameEn: string }[]>([]);

  // UI states
  const [searchQuery, setSearchQuery] = useState('');
  const [riskSearchQuery, setRiskSearchQuery] = useState(''); // للبحث في قائمة المخاطر
  const [filterStatus, setFilterStatus] = useState<TreatmentStatus | 'all'>('all');
  const [filterStrategy, setFilterStrategy] = useState<TreatmentStrategy | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);

  // Wizard states
  const [wizardStep, setWizardStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // Form states - simplified
  const [formData, setFormData] = useState({
    riskId: '',
    strategy: '' as TreatmentStrategy | '',
    titleAr: '',
    titleEn: '',
    responsibleId: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    tasks: [] as { id: string; titleAr: string; titleEn: string; dueDate: string }[],
  });

  // ============================================
  // Data Fetching
  // ============================================

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [risksRes, usersRes, ownersRes] = await Promise.all([
          fetch('/api/risks?includeTreatments=true'),
          fetch('/api/users'),
          fetch('/api/risk-owners'),
        ]);

        if (risksRes.ok) {
          const data = await risksRes.json();
          setRisks(data.data || []);
        }

        if (usersRes.ok) {
          const data = await usersRes.json();
          const users = data.data || [];
          const options = users
            .filter((u: { role: string }) => ['riskManager', 'riskAnalyst', 'riskChampion', 'employee'].includes(u.role))
            .map((u: { id: string; fullName: string; fullNameEn: string | null; role: string }) => ({
              id: u.id,
              name: u.fullName,
              nameEn: u.fullNameEn || u.fullName,
              role: u.role,
            }));
          setResponsibleOptions(options);
        }

        if (ownersRes.ok) {
          const data = await ownersRes.json();
          if (data.success && data.data) {
            setRiskOwnersList(data.data.map((o: { id: string; nameAr: string; nameEn: string | null }) => ({
              id: o.id,
              nameAr: o.nameAr,
              nameEn: o.nameEn || o.nameAr,
            })));
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ============================================
  // Computed Data
  // ============================================

  const treatments = useMemo<Treatment[]>(() => {
    return risks.map((risk) => ({
      id: risk.id,
      riskId: risk.id,
      riskNumber: risk.riskNumber,
      riskTitleAr: risk.titleAr,
      riskTitleEn: risk.titleEn,
      titleAr: risk.mitigationActionsAr || `خطة معالجة ${risk.riskNumber}`,
      titleEn: risk.mitigationActionsEn || `Treatment Plan for ${risk.riskNumber}`,
      strategy: determineStrategy(risk.status, risk.inherentScore),
      status: determineStatus(risk.status, risk.followUpDate),
      inherentRating: normalizeRating(risk.inherentRating),
      inherentScore: risk.inherentScore,
      residualRating: normalizeRating(risk.residualRating),
      currentResidualScore: risk.residualScore || risk.inherentScore,
      progress: calculateProgress(risk.inherentScore, risk.residualScore),
      priority: risk.inherentScore >= 15 ? 'high' : risk.inherentScore >= 8 ? 'medium' : 'low',
      responsibleAr: risk.owner?.fullName || risk.champion?.fullName || 'غير محدد',
      responsibleEn: risk.owner?.fullNameEn || risk.champion?.fullNameEn || 'Not Assigned',
      startDate: risk.createdAt,
      dueDate: risk.followUpDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      tasks: risk.treatmentPlans?.[0]?.tasks || [],
      departmentAr: risk.department?.nameAr || 'غير محدد',
      departmentEn: risk.department?.nameEn || 'Not Assigned',
    }));
  }, [risks]);

  const filteredTreatments = useMemo(() => {
    return treatments.filter((t) => {
      const matchesSearch =
        t.riskNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.titleAr.includes(searchQuery) ||
        t.titleEn.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
      const matchesStrategy = filterStrategy === 'all' || t.strategy === filterStrategy;
      return matchesSearch && matchesStatus && matchesStrategy;
    });
  }, [treatments, searchQuery, filterStatus, filterStrategy]);

  const stats = useMemo(() => ({
    total: treatments.length,
    completed: treatments.filter((t) => t.status === 'completed').length,
    inProgress: treatments.filter((t) => t.status === 'inProgress').length,
    overdue: treatments.filter((t) => t.status === 'overdue').length,
    notStarted: treatments.filter((t) => t.status === 'notStarted').length,
  }), [treatments]);

  const avgProgress = useMemo(() => {
    if (treatments.length === 0) return 0;
    return Math.round(treatments.reduce((sum, t) => sum + t.progress, 0) / treatments.length);
  }, [treatments]);

  // ============================================
  // Handlers
  // ============================================

  const resetForm = useCallback(() => {
    setFormData({
      riskId: '',
      strategy: '',
      titleAr: '',
      titleEn: '',
      responsibleId: '',
      priority: 'medium',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      tasks: [],
    });
    setWizardStep(1);
  }, []);

  const openAddModal = useCallback(() => {
    resetForm();
    setShowAddModal(true);
  }, [resetForm]);

  const closeAddModal = useCallback(() => {
    setShowAddModal(false);
    resetForm();
  }, [resetForm]);

  const openViewModal = useCallback((treatment: Treatment) => {
    setSelectedTreatment(treatment);
    setShowViewModal(true);
  }, []);

  const handleSave = async () => {
    if (!formData.riskId || !formData.strategy || !formData.responsibleId) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/risks/${formData.riskId}/treatments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titleAr: formData.titleAr || `خطة معالجة`,
          titleEn: formData.titleEn || `Treatment Plan`,
          descriptionAr: '',
          descriptionEn: '',
          strategy: formData.strategy,
          status: 'notStarted',
          priority: formData.priority,
          responsibleId: formData.responsibleId,
          startDate: formData.startDate,
          dueDate: formData.dueDate,
          progress: 0,
        }),
      });

      if (response.ok) {
        const result = await response.json();

        // Create tasks if any
        if (formData.tasks.length > 0 && result.data?.id) {
          for (const task of formData.tasks) {
            await fetch(`/api/risks/${formData.riskId}/treatments/${result.data.id}/tasks`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                titleAr: task.titleAr,
                titleEn: task.titleEn,
                status: 'notStarted',
                priority: 'medium',
                dueDate: task.dueDate,
                order: formData.tasks.indexOf(task),
              }),
            });
          }
        }

        closeAddModal();
        // Refresh data
        const risksRes = await fetch('/api/risks?includeTreatments=true');
        if (risksRes.ok) {
          const data = await risksRes.json();
          setRisks(data.data || []);
        }
      }
    } catch (error) {
      console.error('Error saving treatment:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const addTask = () => {
    const newTask = {
      id: `task-${Date.now()}`,
      titleAr: '',
      titleEn: '',
      dueDate: formData.dueDate,
    };
    setFormData((prev) => ({ ...prev, tasks: [...prev.tasks, newTask] }));
  };

  const updateTask = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t, i) => (i === index ? { ...t, [field]: value } : t)),
    }));
  };

  const removeTask = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index),
    }));
  };

  // Get selected risk details
  const selectedRisk = useMemo(() => {
    return risks.find((r) => r.id === formData.riskId);
  }, [risks, formData.riskId]);

  // قائمة المخاطر المتاحة للإضافة (بدون خطط معالجة) - محسّنة
  const availableRisks = useMemo(() => {
    const filtered = risks.filter((r) => !r.treatmentPlans?.length);
    if (!riskSearchQuery) return filtered.slice(0, 20); // عرض أول 20 فقط للأداء
    const query = riskSearchQuery.toLowerCase();
    return filtered.filter((r) =>
      r.riskNumber.toLowerCase().includes(query) ||
      r.titleAr.includes(riskSearchQuery) ||
      r.titleEn.toLowerCase().includes(query)
    ).slice(0, 20);
  }, [risks, riskSearchQuery]);

  // ============================================
  // Loading State
  // ============================================

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-[var(--primary)]/20 animate-pulse" />
            <Loader2 className="absolute inset-0 m-auto h-8 w-8 animate-spin text-[var(--primary)]" />
          </div>
          <p className="text-sm text-[var(--foreground-secondary)] animate-pulse">
            {isAr ? 'جاري تحميل خطط المعالجة...' : 'Loading treatment plans...'}
          </p>
        </div>
      </div>
    );
  }

  // ============================================
  // Render
  // ============================================

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] text-white">
              <Shield className="h-6 w-6" />
            </div>
            {isAr ? 'خطط المعالجة' : 'Treatment Plans'}
          </h1>
          <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
            {isAr ? 'إدارة ومتابعة خطط معالجة المخاطر' : 'Manage and track risk treatment plans'}
          </p>
        </div>
        <Button onClick={openAddModal} className="gap-2 shadow-lg hover:shadow-xl transition-shadow">
          <Plus className="h-4 w-4" />
          {isAr ? 'إضافة خطة جديدة' : 'Add New Plan'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: isAr ? 'الإجمالي' : 'Total', value: stats.total, icon: ListChecks, color: 'text-[var(--primary)]', bg: 'bg-[var(--primary)]/10' },
          { label: isAr ? 'مكتمل' : 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: isAr ? 'قيد التنفيذ' : 'In Progress', value: stats.inProgress, icon: Play, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: isAr ? 'متأخر' : 'Overdue', value: stats.overdue, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
          { label: isAr ? 'لم يبدأ' : 'Not Started', value: stats.notStarted, icon: CircleDot, color: 'text-slate-500', bg: 'bg-slate-500/10' },
        ].map((stat, i) => (
          <Card key={i} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[var(--foreground-secondary)]">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress Overview */}
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-[var(--primary)]" />
              <span className="font-medium">{isAr ? 'متوسط التقدم' : 'Average Progress'}</span>
            </div>
            <span className="text-2xl font-bold text-[var(--primary)]">{avgProgress}%</span>
          </div>
          <div className="h-3 rounded-full bg-[var(--background-secondary)] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] transition-all duration-500"
              style={{ width: `${avgProgress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground-muted)]" />
          <Input
            placeholder={isAr ? 'بحث في خطط المعالجة...' : 'Search treatment plans...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-10"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as TreatmentStatus | 'all')}
            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          >
            <option value="all">{isAr ? 'كل الحالات' : 'All Status'}</option>
            <option value="notStarted">{isAr ? 'لم يبدأ' : 'Not Started'}</option>
            <option value="inProgress">{isAr ? 'قيد التنفيذ' : 'In Progress'}</option>
            <option value="completed">{isAr ? 'مكتمل' : 'Completed'}</option>
            <option value="overdue">{isAr ? 'متأخر' : 'Overdue'}</option>
          </select>
          <select
            value={filterStrategy}
            onChange={(e) => setFilterStrategy(e.target.value as TreatmentStrategy | 'all')}
            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          >
            <option value="all">{isAr ? 'كل الاستراتيجيات' : 'All Strategies'}</option>
            <option value="avoid">{isAr ? 'تجنب' : 'Avoid'}</option>
            <option value="reduce">{isAr ? 'تقليل' : 'Reduce'}</option>
            <option value="transfer">{isAr ? 'نقل' : 'Transfer'}</option>
            <option value="accept">{isAr ? 'قبول' : 'Accept'}</option>
          </select>
        </div>
      </div>

      {/* Treatment Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTreatments.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-[var(--background-secondary)] mb-4">
              <FileText className="h-8 w-8 text-[var(--foreground-muted)]" />
            </div>
            <p className="text-[var(--foreground-secondary)]">
              {isAr ? 'لا توجد خطط معالجة' : 'No treatment plans found'}
            </p>
            <Button variant="outline" className="mt-4" onClick={openAddModal}>
              <Plus className="h-4 w-4 me-2" />
              {isAr ? 'إضافة خطة جديدة' : 'Add New Plan'}
            </Button>
          </div>
        ) : (
          filteredTreatments.map((treatment) => {
            const StrategyIcon = strategyConfig[treatment.strategy].icon;
            const StatusIcon = statusConfig[treatment.status].icon;

            return (
              <Card
                key={treatment.id}
                className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
                onClick={() => openViewModal(treatment)}
              >
                {/* Card Header with Strategy Color */}
                <div className={`h-1 ${strategyConfig[treatment.strategy].bgClass}`} />

                <CardContent className="p-4 space-y-4">
                  {/* Top Row: Risk Number & Status */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${ratingColors[treatment.inherentRating]}`} />
                      <span className="text-xs font-mono text-[var(--foreground-secondary)]">
                        {treatment.riskNumber}
                      </span>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusConfig[treatment.status].bgClass} ${statusConfig[treatment.status].colorClass}`}>
                      <StatusIcon className="h-3 w-3" />
                      <span>{isAr ? statusConfig[treatment.status].labelAr : statusConfig[treatment.status].labelEn}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)] line-clamp-1 group-hover:text-[var(--primary)] transition-colors">
                      {isAr ? treatment.riskTitleAr : treatment.riskTitleEn}
                    </h3>
                    <p className="text-xs text-[var(--foreground-secondary)] mt-1">
                      {isAr ? treatment.departmentAr : treatment.departmentEn}
                    </p>
                  </div>

                  {/* Strategy Badge */}
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${strategyConfig[treatment.strategy].bgClass} ${strategyConfig[treatment.strategy].borderClass} border`}>
                    <StrategyIcon className={`h-4 w-4 ${strategyConfig[treatment.strategy].colorClass}`} />
                    <span className={`text-sm font-medium ${strategyConfig[treatment.strategy].colorClass}`}>
                      {isAr ? strategyConfig[treatment.strategy].labelAr : strategyConfig[treatment.strategy].labelEn}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[var(--foreground-secondary)]">{isAr ? 'التقدم' : 'Progress'}</span>
                      <span className="font-semibold text-[var(--primary)]">{treatment.progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--background-secondary)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] transition-all duration-500"
                        style={{ width: `${treatment.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer: Responsible & Due Date */}
                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                    <div className="flex items-center gap-2 text-xs text-[var(--foreground-secondary)]">
                      <Users className="h-3.5 w-3.5" />
                      <span className="truncate max-w-[100px]">
                        {isAr ? treatment.responsibleAr : treatment.responsibleEn}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--foreground-secondary)]">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{new Date(treatment.dueDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add Treatment Modal - Simplified Wizard */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={closeAddModal}
          title={isAr ? 'إضافة خطة معالجة جديدة' : 'Add New Treatment Plan'}
          size="lg"
        >
          <div className="space-y-6">
            {/* Wizard Steps Indicator */}
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3].map((step) => (
                <React.Fragment key={step}>
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all ${
                      wizardStep === step
                        ? 'bg-[var(--primary)] text-white scale-110'
                        : wizardStep > step
                        ? 'bg-green-500 text-white'
                        : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)]'
                    }`}
                  >
                    {wizardStep > step ? <Check className="h-4 w-4" /> : step}
                  </div>
                  {step < 3 && (
                    <div
                      className={`w-12 h-1 rounded ${
                        wizardStep > step ? 'bg-green-500' : 'bg-[var(--background-secondary)]'
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Step Labels */}
            <div className="flex justify-between text-xs text-[var(--foreground-secondary)]">
              <span>{isAr ? 'اختيار الخطر' : 'Select Risk'}</span>
              <span>{isAr ? 'تفاصيل الخطة' : 'Plan Details'}</span>
              <span>{isAr ? 'المهام' : 'Tasks'}</span>
            </div>

            {/* Step Content */}
            <div className="min-h-[300px]">
              {/* Step 1: Select Risk */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <Input
                    placeholder={isAr ? 'ابحث عن الخطر...' : 'Search for risk...'}
                    leftIcon={<Search className="h-4 w-4" />}
                    value={riskSearchQuery}
                    onChange={(e) => setRiskSearchQuery(e.target.value)}
                  />
                  <div className="max-h-[250px] overflow-y-auto space-y-2">
                    {availableRisks.length === 0 ? (
                      <div className="text-center py-8 text-[var(--foreground-secondary)]">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">{isAr ? 'لا توجد مخاطر متاحة' : 'No available risks'}</p>
                      </div>
                    ) : (
                      availableRisks.map((risk) => (
                        <div
                          key={risk.id}
                          onClick={() => {
                            startTransition(() => {
                              setFormData((prev) => ({
                                ...prev,
                                riskId: risk.id,
                                strategy: determineStrategy(risk.status, risk.inherentScore),
                                titleAr: `خطة معالجة ${risk.riskNumber}`,
                                titleEn: `Treatment Plan for ${risk.riskNumber}`,
                              }));
                            });
                          }}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            formData.riskId === risk.id
                              ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                              : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${ratingColors[normalizeRating(risk.inherentRating)]}`} />
                              <div>
                                <p className="font-medium text-sm">{risk.riskNumber}</p>
                                <p className="text-xs text-[var(--foreground-secondary)] line-clamp-1">
                                  {isAr ? risk.titleAr : risk.titleEn}
                                </p>
                              </div>
                            </div>
                            {formData.riskId === risk.id && (
                              <Check className="h-5 w-5 text-[var(--primary)]" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Plan Details */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  {/* Strategy Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2">{isAr ? 'الاستراتيجية' : 'Strategy'}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['avoid', 'reduce', 'transfer', 'accept'] as TreatmentStrategy[]).map((strategy) => {
                        const config = strategyConfig[strategy];
                        const Icon = config.icon;
                        return (
                          <button
                            key={strategy}
                            onClick={() => setFormData((prev) => ({ ...prev, strategy }))}
                            className={`p-3 rounded-lg border text-start transition-all ${
                              formData.strategy === strategy
                                ? `${config.borderClass} ${config.bgClass}`
                                : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Icon className={`h-4 w-4 ${config.colorClass}`} />
                              <span className="text-sm font-medium">
                                {isAr ? config.labelAr : config.labelEn}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Responsible */}
                  <div>
                    <label className="block text-sm font-medium mb-2">{isAr ? 'المسؤول' : 'Responsible'}</label>
                    <select
                      value={formData.responsibleId}
                      onChange={(e) => setFormData((prev) => ({ ...prev, responsibleId: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    >
                      <option value="">{isAr ? 'اختر المسؤول' : 'Select Responsible'}</option>
                      {responsibleOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {isAr ? opt.name : opt.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-medium mb-2">{isAr ? 'الأولوية' : 'Priority'}</label>
                    <div className="flex gap-2">
                      {(['high', 'medium', 'low'] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => setFormData((prev) => ({ ...prev, priority: p }))}
                          className={`flex-1 py-2 px-3 rounded-lg border text-sm transition-all ${
                            formData.priority === p
                              ? p === 'high'
                                ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20'
                                : p === 'medium'
                                ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/20'
                                : 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20'
                              : 'border-[var(--border)]'
                          }`}
                        >
                          {p === 'high' ? (isAr ? 'عالية' : 'High') : p === 'medium' ? (isAr ? 'متوسطة' : 'Medium') : (isAr ? 'منخفضة' : 'Low')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-2">{isAr ? 'تاريخ البدء' : 'Start Date'}</label>
                      <Input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">{isAr ? 'تاريخ الانتهاء' : 'Due Date'}</label>
                      <Input
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Tasks */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">{isAr ? 'المهام' : 'Tasks'}</label>
                    <Button variant="outline" size="sm" onClick={addTask}>
                      <Plus className="h-4 w-4 me-1" />
                      {isAr ? 'إضافة مهمة' : 'Add Task'}
                    </Button>
                  </div>

                  {formData.tasks.length === 0 ? (
                    <div className="text-center py-8 text-[var(--foreground-secondary)]">
                      <ListChecks className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{isAr ? 'لا توجد مهام' : 'No tasks yet'}</p>
                      <Button variant="outline" size="sm" className="mt-2" onClick={addTask}>
                        <Plus className="h-4 w-4 me-1" />
                        {isAr ? 'إضافة أول مهمة' : 'Add First Task'}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[250px] overflow-y-auto">
                      {formData.tasks.map((task, index) => (
                        <div key={task.id} className="p-3 rounded-lg border border-[var(--border)] bg-[var(--background-secondary)]">
                          <div className="flex items-start gap-2">
                            <span className="text-xs font-mono text-[var(--foreground-muted)] mt-2">{index + 1}</span>
                            <div className="flex-1 space-y-2">
                              <Input
                                placeholder={isAr ? 'عنوان المهمة (عربي)' : 'Task title (Arabic)'}
                                value={task.titleAr}
                                onChange={(e) => updateTask(index, 'titleAr', e.target.value)}
                              />
                              <Input
                                placeholder={isAr ? 'عنوان المهمة (إنجليزي)' : 'Task title (English)'}
                                value={task.titleEn}
                                onChange={(e) => updateTask(index, 'titleEn', e.target.value)}
                              />
                              <Input
                                type="date"
                                value={task.dueDate}
                                onChange={(e) => updateTask(index, 'dueDate', e.target.value)}
                              />
                            </div>
                            <button
                              onClick={() => removeTask(index)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <ModalFooter>
            <Button variant="outline" onClick={closeAddModal}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <div className="flex gap-2">
              {wizardStep > 1 && (
                <Button variant="outline" onClick={() => startTransition(() => setWizardStep(wizardStep - 1))}>
                  <ArrowLeft className="h-4 w-4 me-1" />
                  {isAr ? 'السابق' : 'Previous'}
                </Button>
              )}
              {wizardStep < 3 ? (
                <Button
                  onClick={() => startTransition(() => setWizardStep(wizardStep + 1))}
                  disabled={wizardStep === 1 && !formData.riskId}
                >
                  {isAr ? 'التالي' : 'Next'}
                  <ArrowRight className="h-4 w-4 ms-1" />
                </Button>
              ) : (
                <Button onClick={handleSave} disabled={isSaving || !formData.strategy || !formData.responsibleId}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 me-1 animate-spin" />
                      {isAr ? 'جاري الحفظ...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 me-1" />
                      {isAr ? 'حفظ الخطة' : 'Save Plan'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </ModalFooter>
        </Modal>
      )}

      {/* View Treatment Modal */}
      {showViewModal && selectedTreatment && (
        <Modal
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          title={isAr ? 'تفاصيل خطة المعالجة' : 'Treatment Plan Details'}
          size="lg"
        >
          <div className="space-y-6">
            {/* Risk Info */}
            <div className="p-4 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)]">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-3 h-3 rounded-full ${ratingColors[selectedTreatment.inherentRating]}`} />
                <span className="font-mono text-sm">{selectedTreatment.riskNumber}</span>
                <Badge variant={selectedTreatment.inherentRating === 'Critical' ? 'danger' : selectedTreatment.inherentRating === 'Major' ? 'warning' : 'default'}>
                  {selectedTreatment.inherentRating}
                </Badge>
              </div>
              <h3 className="font-semibold text-lg">
                {isAr ? selectedTreatment.riskTitleAr : selectedTreatment.riskTitleEn}
              </h3>
              <p className="text-sm text-[var(--foreground-secondary)] mt-1">
                {isAr ? selectedTreatment.departmentAr : selectedTreatment.departmentEn}
              </p>
            </div>

            {/* Strategy & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg ${strategyConfig[selectedTreatment.strategy].bgClass} border ${strategyConfig[selectedTreatment.strategy].borderClass}`}>
                <div className="flex items-center gap-2 mb-2">
                  {React.createElement(strategyConfig[selectedTreatment.strategy].icon, {
                    className: `h-5 w-5 ${strategyConfig[selectedTreatment.strategy].colorClass}`,
                  })}
                  <span className="font-medium">{isAr ? 'الاستراتيجية' : 'Strategy'}</span>
                </div>
                <p className={`text-lg font-semibold ${strategyConfig[selectedTreatment.strategy].colorClass}`}>
                  {isAr ? strategyConfig[selectedTreatment.strategy].labelAr : strategyConfig[selectedTreatment.strategy].labelEn}
                </p>
              </div>
              <div className={`p-4 rounded-lg ${statusConfig[selectedTreatment.status].bgClass}`}>
                <div className="flex items-center gap-2 mb-2">
                  {React.createElement(statusConfig[selectedTreatment.status].icon, {
                    className: `h-5 w-5 ${statusConfig[selectedTreatment.status].colorClass}`,
                  })}
                  <span className="font-medium">{isAr ? 'الحالة' : 'Status'}</span>
                </div>
                <p className={`text-lg font-semibold ${statusConfig[selectedTreatment.status].colorClass}`}>
                  {isAr ? statusConfig[selectedTreatment.status].labelAr : statusConfig[selectedTreatment.status].labelEn}
                </p>
              </div>
            </div>

            {/* Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{isAr ? 'التقدم' : 'Progress'}</span>
                <span className="text-xl font-bold text-[var(--primary)]">{selectedTreatment.progress}%</span>
              </div>
              <div className="h-4 rounded-full bg-[var(--background-secondary)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] transition-all duration-500"
                  style={{ width: `${selectedTreatment.progress}%` }}
                />
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-[var(--background-secondary)]">
                <p className="text-xs text-[var(--foreground-secondary)]">{isAr ? 'المسؤول' : 'Responsible'}</p>
                <p className="font-medium mt-1">{isAr ? selectedTreatment.responsibleAr : selectedTreatment.responsibleEn}</p>
              </div>
              <div className="p-3 rounded-lg bg-[var(--background-secondary)]">
                <p className="text-xs text-[var(--foreground-secondary)]">{isAr ? 'تاريخ الاستحقاق' : 'Due Date'}</p>
                <p className="font-medium mt-1">
                  {new Date(selectedTreatment.dueDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                </p>
              </div>
            </div>

            {/* Tasks */}
            {selectedTreatment.tasks.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <ListChecks className="h-4 w-4" />
                  {isAr ? 'المهام' : 'Tasks'} ({selectedTreatment.tasks.length})
                </h4>
                <div className="space-y-2">
                  {selectedTreatment.tasks.map((task, i) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-[var(--background-secondary)]"
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                        task.status === 'completed' ? 'bg-green-500 text-white' : 'bg-[var(--background)] border'
                      }`}>
                        {task.status === 'completed' ? <Check className="h-3 w-3" /> : i + 1}
                      </div>
                      <span className={task.status === 'completed' ? 'line-through text-[var(--foreground-muted)]' : ''}>
                        {isAr ? task.titleAr : task.titleEn}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <ModalFooter>
            <Button variant="outline" onClick={() => setShowViewModal(false)}>
              {isAr ? 'إغلاق' : 'Close'}
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
}
