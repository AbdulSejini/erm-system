'use client';

import React, { useState, useEffect, useMemo, useTransition, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/contexts/LanguageContext';
import { useImpersonation } from '@/contexts/ImpersonationContext';
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
  Cloud,
  Link,
  ExternalLink,
  CheckCircle as CheckIcon,
  Copy,
  Mail,
} from 'lucide-react';
import type { TreatmentStatus, TreatmentStrategy, RiskRating } from '@/types';
import OneDrivePicker from '@/components/OneDrivePicker';

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
  justificationAr?: string | null;
  justificationEn?: string | null;
  expectedResidualLikelihood?: number | null;
  expectedResidualImpact?: number | null;
  tasks?: Record<string, unknown>[];
}

interface TaskData {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  actionOwnerId: string | null;
  monitorOwnerId: string | null;
  oneDriveUrl: string | null;
  oneDriveFileName: string | null;
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
  responsibleId: string;
  responsibleAr: string;
  responsibleEn: string;
  startDate: string;
  dueDate: string;
  justificationAr: string | null;
  justificationEn: string | null;
  expectedResidualLikelihood: number | null;
  expectedResidualImpact: number | null;
  tasks: TaskData[];
  departmentId: string;
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

// Strategy metadata - ألوان متناسقة مع هوية شركة الكابلات السعودية
// البرتقالي #F39200 والرمادي الداكن #2E2D2C
const strategyConfig = {
  avoid: {
    icon: Ban,
    colorClass: 'text-white',
    bgClass: 'bg-rose-500 dark:bg-rose-600',
    borderClass: 'border-rose-500 dark:border-rose-500',
    labelAr: 'تجنب',
    labelEn: 'Avoid',
    descAr: 'تجنب الخطر عن طريق عدم القيام بالنشاط المسبب له',
    descEn: 'Avoid the risk by not performing the activity',
  },
  reduce: {
    icon: TrendingDown,
    colorClass: 'text-white',
    bgClass: 'bg-[#F39200] dark:bg-[#F39200]',
    borderClass: 'border-[#F39200] dark:border-[#F39200]',
    labelAr: 'تقليل',
    labelEn: 'Reduce',
    descAr: 'تقليل احتمالية أو تأثير الخطر من خلال إجراءات رقابية',
    descEn: 'Reduce likelihood or impact through controls',
  },
  transfer: {
    icon: Share2,
    colorClass: 'text-white',
    bgClass: 'bg-sky-500 dark:bg-sky-600',
    borderClass: 'border-sky-500 dark:border-sky-500',
    labelAr: 'نقل',
    labelEn: 'Transfer',
    descAr: 'نقل الخطر إلى طرف ثالث مثل شركات التأمين',
    descEn: 'Transfer the risk to a third party like insurance',
  },
  accept: {
    icon: CheckCircle,
    colorClass: 'text-white',
    bgClass: 'bg-emerald-500 dark:bg-emerald-600',
    borderClass: 'border-emerald-500 dark:border-emerald-500',
    labelAr: 'قبول',
    labelEn: 'Accept',
    descAr: 'قبول الخطر عندما تكون تكلفة المعالجة أعلى من الأثر',
    descEn: 'Accept when treatment cost exceeds impact',
  },
};

// Status metadata - ألوان فاتحة للوضع النهاري مع الحفاظ على الوضع الليلي
const statusConfig = {
  notStarted: {
    icon: CircleDot,
    colorClass: 'text-gray-600 dark:text-gray-300',
    bgClass: 'bg-gray-100 dark:bg-gray-700/50',
    borderClass: 'border-gray-200 dark:border-gray-600',
    labelAr: 'لم يبدأ',
    labelEn: 'Not Started',
  },
  inProgress: {
    icon: Play,
    colorClass: 'text-sky-600 dark:text-sky-300',
    bgClass: 'bg-sky-50 dark:bg-sky-900/30',
    borderClass: 'border-sky-200 dark:border-sky-600',
    labelAr: 'قيد التنفيذ',
    labelEn: 'In Progress',
  },
  completed: {
    icon: CheckCircle2,
    colorClass: 'text-emerald-600 dark:text-emerald-300',
    bgClass: 'bg-emerald-50 dark:bg-emerald-900/30',
    borderClass: 'border-emerald-200 dark:border-emerald-600',
    labelAr: 'مكتمل',
    labelEn: 'Completed',
  },
  overdue: {
    icon: AlertCircle,
    colorClass: 'text-rose-600 dark:text-rose-300',
    bgClass: 'bg-rose-50 dark:bg-rose-900/30',
    borderClass: 'border-rose-200 dark:border-rose-600',
    labelAr: 'متأخر',
    labelEn: 'Overdue',
  },
  cancelled: {
    icon: XCircle,
    colorClass: 'text-gray-500 dark:text-gray-400',
    bgClass: 'bg-gray-50 dark:bg-gray-800/50',
    borderClass: 'border-gray-200 dark:border-gray-600',
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language } = useTranslation();
  const isAr = language === 'ar';
  const [isPending, startTransition] = useTransition();
  const { isImpersonating, impersonatedUser } = useImpersonation();

  // URL params for pre-selecting risk
  const preselectedRiskId = searchParams.get('riskId');
  const autoOpen = searchParams.get('action') === 'add';

  // Helper function to get fetch headers with impersonation support
  const getHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (isImpersonating && impersonatedUser) {
      headers['X-Impersonate-User-Id'] = impersonatedUser.id;
    }
    return headers;
  }, [isImpersonating, impersonatedUser]);

  // Core data states
  const [risks, setRisks] = useState<APIRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [responsibleOptions, setResponsibleOptions] = useState<ResponsibleOption[]>([]);
  const [riskOwnersList, setRiskOwnersList] = useState<{ id: string; nameAr: string; nameEn: string }[]>([]);
  const [departments, setDepartments] = useState<{ id: string; nameAr: string; nameEn: string }[]>([]);
  const [canEditDelete, setCanEditDelete] = useState(false); // صلاحية التعديل والحذف (admin و riskManager فقط)

  // UI states
  const [searchQuery, setSearchQuery] = useState('');
  const [riskSearchQuery, setRiskSearchQuery] = useState(''); // للبحث في قائمة المخاطر
  const [filterStatus, setFilterStatus] = useState<TreatmentStatus | 'all'>('all');
  const [filterStrategy, setFilterStrategy] = useState<TreatmentStrategy | 'all'>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all'); // فرز حسب القسم
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; // عدد العناصر في كل صفحة

  // Autocomplete states للمكلف والمتابعة
  const [assignedToSearch, setAssignedToSearch] = useState<{ [key: number]: string }>({});
  const [followedBySearch, setFollowedBySearch] = useState<{ [key: number]: string }>({});
  const [showAssignedDropdown, setShowAssignedDropdown] = useState<{ [key: number]: boolean }>({});
  const [showFollowedDropdown, setShowFollowedDropdown] = useState<{ [key: number]: boolean }>({});

  // OneDrive states للمهام
  const [oneDriveValidating, setOneDriveValidating] = useState<{ [key: number]: boolean }>({});
  const [oneDriveError, setOneDriveError] = useState<{ [key: number]: string }>({});
  const [oneDriveValid, setOneDriveValid] = useState<{ [key: number]: boolean }>({});

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);

  // Email copy modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState<{
    recipientEmail: string;
    recipientName: string;
    subject: string;
    body: string;
    treatmentUrl: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Wizard states
  const [wizardStep, setWizardStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // Form states - محسّن مع حقول إضافية للمهام وإعادة تقييم الخطر المتبقي
  const [formData, setFormData] = useState({
    riskId: '',
    strategy: 'reduce' as TreatmentStrategy | '',
    titleAr: '',
    titleEn: '',
    responsibleId: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    // تعليق/تبرير خطة المعالجة
    justificationAr: '',
    justificationEn: '',
    // إعادة تقييم الخطر المتبقي (Residual Risk)
    residualLikelihood: null as number | null,
    residualImpact: null as number | null,
    updateResidualRisk: false, // هل يريد المستخدم تحديث الخطر المتبقي
    tasks: [] as {
      id: string;
      titleAr: string;
      titleEn: string;
      dueDate: string;
      priority: 'high' | 'medium' | 'low';
      assignedTo: string;
      followedBy: string;
      description: string;
      status: string;
      oneDriveUrl: string;
      oneDriveFileName: string;
    }[],
  });

  // ============================================
  // Data Fetching
  // ============================================

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const headers = getHeaders();

        // جلب بيانات الجلسة للتحقق من صلاحية التعديل والحذف
        const sessionRes = await fetch('/api/auth/session', { headers });
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          if (sessionData?.user?.role) {
            // فقط admin و riskManager يمكنهم التعديل والحذف
            setCanEditDelete(['admin', 'riskManager'].includes(sessionData.user.role));
          }
        }

        const [risksRes, usersRes, ownersRes] = await Promise.all([
          fetch('/api/risks?includeTreatments=true', { headers }),
          fetch('/api/users', { headers }),
          fetch('/api/risk-owners', { headers }),
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
            setRiskOwnersList(data.data.map((o: { id: string; fullName: string; fullNameEn: string | null }) => ({
              id: o.id,
              nameAr: o.fullName,
              nameEn: o.fullNameEn || o.fullName,
            })));
          }
        }

        // Fetch departments للفرز
        const deptRes = await fetch('/api/departments', { headers });
        if (deptRes.ok) {
          const deptData = await deptRes.json();
          if (deptData.success && deptData.data) {
            setDepartments(deptData.data.map((d: { id: string; nameAr: string; nameEn: string }) => ({
              id: d.id,
              nameAr: d.nameAr,
              nameEn: d.nameEn,
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
  }, [getHeaders, isImpersonating, impersonatedUser]);

  // ============================================
  // Computed Data
  // ============================================

  // عرض فقط المخاطر التي لديها خطط معالجة حقيقية في قاعدة البيانات
  const treatments = useMemo<Treatment[]>(() => {
    return risks
      .filter((risk) => risk.treatmentPlans && risk.treatmentPlans.length > 0)
      .flatMap((risk) =>
        risk.treatmentPlans!.map((plan) => ({
          id: plan.id,
          riskId: risk.id,
          riskNumber: risk.riskNumber,
          riskTitleAr: risk.titleAr,
          riskTitleEn: risk.titleEn,
          titleAr: plan.titleAr || `خطة معالجة ${risk.riskNumber}`,
          titleEn: plan.titleEn || `Treatment Plan for ${risk.riskNumber}`,
          strategy: plan.strategy as TreatmentStrategy,
          status: plan.status as TreatmentStatus,
          inherentRating: normalizeRating(risk.inherentRating),
          inherentScore: risk.inherentScore,
          residualRating: normalizeRating(risk.residualRating),
          currentResidualScore: risk.residualScore || risk.inherentScore,
          progress: plan.progress || 0,
          priority: (plan.priority || 'medium') as 'high' | 'medium' | 'low',
          responsibleId: plan.responsibleId || '',
          responsibleAr: plan.responsible?.fullName || risk.owner?.fullName || 'غير محدد',
          responsibleEn: plan.responsible?.fullNameEn || risk.owner?.fullNameEn || 'Not Assigned',
          startDate: plan.startDate || risk.createdAt,
          dueDate: plan.dueDate || risk.followUpDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          justificationAr: plan.justificationAr || null,
          justificationEn: plan.justificationEn || null,
          expectedResidualLikelihood: plan.expectedResidualLikelihood || null,
          expectedResidualImpact: plan.expectedResidualImpact || null,
          tasks: (plan.tasks || []).map((t: Record<string, unknown>) => ({
            id: t.id as string,
            titleAr: t.titleAr as string,
            titleEn: t.titleEn as string,
            descriptionAr: (t.descriptionAr as string) || null,
            descriptionEn: (t.descriptionEn as string) || null,
            status: t.status as string,
            priority: (t.priority as string) || 'medium',
            dueDate: (t.dueDate as string) || null,
            actionOwnerId: (t.actionOwnerId as string) || null,
            monitorOwnerId: (t.monitorOwnerId as string) || null,
            oneDriveUrl: (t.oneDriveUrl as string) || null,
            oneDriveFileName: (t.oneDriveFileName as string) || null,
          })),
          departmentId: risk.department?.id || '',
          departmentAr: risk.department?.nameAr || 'غير محدد',
          departmentEn: risk.department?.nameEn || 'Not Assigned',
        }))
      );
  }, [risks]);

  const filteredTreatments = useMemo(() => {
    return treatments.filter((t) => {
      const matchesSearch =
        t.riskNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.titleAr.includes(searchQuery) ||
        t.titleEn.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
      const matchesStrategy = filterStrategy === 'all' || t.strategy === filterStrategy;
      const matchesDepartment = filterDepartment === 'all' || t.departmentId === filterDepartment;
      return matchesSearch && matchesStatus && matchesStrategy && matchesDepartment;
    });
  }, [treatments, searchQuery, filterStatus, filterStrategy, filterDepartment]);

  // Pagination - عرض الصفحة الحالية فقط
  const paginatedTreatments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTreatments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTreatments, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredTreatments.length / itemsPerPage);

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
      strategy: 'reduce',
      titleAr: '',
      titleEn: '',
      responsibleId: '',
      priority: 'medium',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      justificationAr: '',
      justificationEn: '',
      residualLikelihood: null,
      residualImpact: null,
      updateResidualRisk: false,
      tasks: [],
    });
    setWizardStep(1);
    // إعادة تعيين الخطة المحددة (مهم للتفريق بين الإضافة والتعديل)
    setSelectedTreatment(null);
    // مسح حالة OneDrive
    setOneDriveValidating({});
    setOneDriveError({});
    setOneDriveValid({});
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

  // Open modal automatically if URL params specify
  useEffect(() => {
    if (autoOpen && !loading && risks.length > 0) {
      // فتح النموذج تلقائياً
      if (preselectedRiskId) {
        // التحقق من وجود الخطر
        const riskExists = risks.some(r => r.id === preselectedRiskId);
        if (riskExists) {
          setFormData(prev => ({ ...prev, riskId: preselectedRiskId }));
        }
      }
      setShowAddModal(true);
      // مسح الـ params من URL بدون إعادة تحميل
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [autoOpen, preselectedRiskId, loading, risks]);

  const handleSave = async () => {
    console.log('handleSave called with FULL formData:', JSON.stringify({
      riskId: formData.riskId,
      strategy: formData.strategy,
      responsibleId: formData.responsibleId,
      dueDate: formData.dueDate,
      justificationAr: formData.justificationAr,
      justificationEn: formData.justificationEn,
      tasksCount: formData.tasks.length,
      tasks: formData.tasks,
    }, null, 2));

    if (!formData.riskId || !formData.strategy || !formData.responsibleId) {
      console.error('Missing required fields:', { riskId: formData.riskId, strategy: formData.strategy, responsibleId: formData.responsibleId });
      alert(`حقول مطلوبة مفقودة: ${!formData.riskId ? 'الخطر، ' : ''}${!formData.strategy ? 'الاستراتيجية، ' : ''}${!formData.responsibleId ? 'المسؤول' : ''}`);
      return;
    }

    setIsSaving(true);
    try {
      // حساب الدرجة والتصنيف المتبقي إذا تم تحديثهما
      let expectedResidualScore = null;
      let expectedResidualRating = null;
      if (formData.updateResidualRisk && formData.residualLikelihood && formData.residualImpact) {
        expectedResidualScore = formData.residualLikelihood * formData.residualImpact;
        expectedResidualRating = expectedResidualScore >= 20 ? 'Critical' :
                                  expectedResidualScore >= 15 ? 'Major' :
                                  expectedResidualScore >= 10 ? 'Moderate' :
                                  expectedResidualScore >= 5 ? 'Minor' : 'Negligible';
      }

      // تحديد إذا كان تعديل أو إنشاء جديد
      const isEditing = selectedTreatment !== null;

      // التحقق مرة أخرى من وجود riskId قبل بناء URL
      if (!formData.riskId) {
        alert('خطأ: لم يتم تحديد الخطر. يرجى اختيار خطر من القائمة.');
        setIsSaving(false);
        return;
      }

      const apiUrl = isEditing
        ? `/api/risks/${formData.riskId}/treatments/${selectedTreatment.id}`
        : `/api/risks/${formData.riskId}/treatments`;
      const method = isEditing ? 'PATCH' : 'POST';

      console.log(`Sending ${method} request to:`, apiUrl);
      console.log('formData.riskId:', formData.riskId);

      const response = await fetch(apiUrl, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titleAr: formData.titleAr || `خطة معالجة`,
          titleEn: formData.titleEn || `Treatment Plan`,
          descriptionAr: formData.justificationAr || '',
          descriptionEn: formData.justificationEn || '',
          strategy: formData.strategy,
          status: isEditing ? undefined : 'notStarted', // لا نغير الحالة عند التعديل
          priority: formData.priority,
          responsibleId: formData.responsibleId,
          startDate: formData.startDate,
          dueDate: formData.dueDate,
          progress: isEditing ? undefined : 0, // لا نغير التقدم عند التعديل
          // تعليق/تبرير خطة المعالجة
          justificationAr: formData.justificationAr || null,
          justificationEn: formData.justificationEn || null,
          // إعادة تقييم الخطر المتبقي
          expectedResidualLikelihood: formData.updateResidualRisk ? formData.residualLikelihood : null,
          expectedResidualImpact: formData.updateResidualRisk ? formData.residualImpact : null,
          expectedResidualScore,
          expectedResidualRating,
          // تحديث الخطر المتبقي الفعلي
          updateRiskResidual: formData.updateResidualRisk,
        }),
      });

      console.log('Response status:', response.status, response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log(`Treatment ${isEditing ? 'updated' : 'created'} successfully:`, result);

        // Create or update tasks if any
        const treatmentId = result.data?.id || selectedTreatment?.id;
        if (formData.tasks.length > 0 && treatmentId) {
          console.log(`${isEditing ? 'Updating' : 'Creating'} tasks for treatment plan:`, treatmentId);
          console.log('Tasks:', formData.tasks);

          for (let i = 0; i < formData.tasks.length; i++) {
            const task = formData.tasks[i];
            // تحديد إذا كانت المهمة موجودة (لها id حقيقي وليس temp- أو task-)
            // المهام المؤقتة تبدأ بـ temp- أو task- (للتوافق مع المدخلات القديمة)
            const isTemporaryTask = task.id && (task.id.startsWith('temp-') || task.id.startsWith('task-'));
            const isExistingTask = task.id && !isTemporaryTask;
            const taskMethod = isExistingTask ? 'PATCH' : 'POST';
            const taskUrl = isExistingTask
              ? `/api/risks/${formData.riskId}/treatments/${treatmentId}/tasks/${task.id}`
              : `/api/risks/${formData.riskId}/treatments/${treatmentId}/tasks`;

            console.log(`${taskMethod} task ${i + 1}:`, task);

            const taskResponse = await fetch(taskUrl, {
              method: taskMethod,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                titleAr: task.titleAr || '',
                titleEn: task.titleEn || '',
                descriptionAr: task.description || null,
                descriptionEn: task.description || null,
                status: task.status || 'notStarted',
                priority: task.priority || 'medium',
                dueDate: task.dueDate || null,
                order: i,
                assignedToId: null, // للتوافق القديم مع Users
                actionOwnerId: task.assignedTo || null, // منفذ الإجراء من ملاك المخاطر
                monitorOwnerId: task.followedBy || null, // المتابع من ملاك المخاطر
                // OneDrive attachment
                oneDriveUrl: task.oneDriveUrl || null,
                oneDriveFileName: task.oneDriveFileName || null,
              }),
            });

            const taskResult = await taskResponse.json();
            console.log(`Task ${i + 1} ${isExistingTask ? 'update' : 'creation'} result:`, taskResult);

            if (!taskResponse.ok) {
              console.error(`Failed to ${isExistingTask ? 'update' : 'create'} task ${i + 1}:`, taskResult.error);
            }
          }
        }

        // جلب بيانات المسؤول لإعداد البريد الإلكتروني
        const responsibleUser = responsibleOptions.find(u => u.id === formData.responsibleId);
        const selectedRiskData = risks.find(r => r.id === formData.riskId);
        const treatmentUrl = `${window.location.origin}/treatment/${result.data.id}`;

        // إعداد بيانات البريد الإلكتروني
        const emailSubject = isAr
          ? `خطة معالجة جديدة للخطر: ${selectedRiskData?.riskNumber || ''} - ${selectedRiskData?.titleAr || ''}`
          : `New Treatment Plan for Risk: ${selectedRiskData?.riskNumber || ''} - ${selectedRiskData?.titleEn || selectedRiskData?.titleAr || ''}`;

        const emailBody = isAr
          ? `السلام عليكم ${responsibleUser?.name || ''},

تم إنشاء خطة معالجة جديدة وتم تعيينك كمسؤول عنها:

📋 تفاصيل خطة المعالجة:
━━━━━━━━━━━━━━━━━━━━━━
• رقم الخطر: ${selectedRiskData?.riskNumber || ''}
• عنوان الخطر: ${selectedRiskData?.titleAr || ''}
• عنوان الخطة: ${formData.titleAr || formData.titleEn || 'خطة معالجة'}
• الاستراتيجية: ${strategyConfig[formData.strategy as TreatmentStrategy]?.labelAr || formData.strategy}
• تاريخ الاستحقاق: ${formData.dueDate}
• عدد المهام: ${formData.tasks.length}

🔗 رابط الخطة:
${treatmentUrl}

يرجى مراجعة الخطة والبدء في تنفيذها.

مع تحيات فريق إدارة المخاطر`
          : `Hello ${responsibleUser?.nameEn || responsibleUser?.name || ''},

A new treatment plan has been created and you have been assigned as the responsible person:

📋 Treatment Plan Details:
━━━━━━━━━━━━━━━━━━━━━━
• Risk Number: ${selectedRiskData?.riskNumber || ''}
• Risk Title: ${selectedRiskData?.titleEn || selectedRiskData?.titleAr || ''}
• Plan Title: ${formData.titleEn || formData.titleAr || 'Treatment Plan'}
• Strategy: ${strategyConfig[formData.strategy as TreatmentStrategy]?.labelEn || formData.strategy}
• Due Date: ${formData.dueDate}
• Number of Tasks: ${formData.tasks.length}

🔗 Plan Link:
${treatmentUrl}

Please review the plan and start implementation.

Best regards,
Risk Management Team`;

        // إعداد بيانات modal البريد
        setEmailData({
          recipientEmail: '', // سيتم ملؤه من بيانات المستخدم إذا متاحة
          recipientName: responsibleUser?.name || responsibleUser?.nameEn || '',
          subject: emailSubject,
          body: emailBody,
          treatmentUrl,
        });

        closeAddModal();
        // إظهار modal نسخ البريد
        setShowEmailModal(true);

        // Refresh data
        console.log('Refreshing risks data...');
        const risksRes = await fetch('/api/risks?includeTreatments=true');
        console.log('Risks refresh response:', risksRes.status, risksRes.ok);
        if (risksRes.ok) {
          const data = await risksRes.json();
          console.log('Risks data received:', data.data?.length, 'risks, treatments:', data.data?.filter((r: { treatmentPlans?: unknown[] }) => r.treatmentPlans && r.treatmentPlans.length > 0).length);
          setRisks(data.data || []);
        }
      } else {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        alert(`فشل في حفظ خطة المعالجة: ${errorData.error || 'خطأ غير معروف'}`);
      }
    } catch (error) {
      console.error('Error saving treatment:', error);
      alert(`حدث خطأ أثناء الحفظ: ${error}`);
    } finally {
      setIsSaving(false);
    }
  };

  const addTask = () => {
    const newTask = {
      id: `temp-${Date.now()}`,
      titleAr: '',
      titleEn: '',
      dueDate: formData.dueDate,
      priority: 'medium' as 'high' | 'medium' | 'low',
      assignedTo: '',
      followedBy: '',
      description: '',
      status: 'notStarted',
      oneDriveUrl: '',
      oneDriveFileName: '',
    };
    console.log('Adding new task:', newTask);
    setFormData((prev) => {
      const newFormData = { ...prev, tasks: [...prev.tasks, newTask] };
      console.log('FormData after adding task:', { tasksCount: newFormData.tasks.length, justificationAr: newFormData.justificationAr });
      return newFormData;
    });
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
    // مسح حالة OneDrive للمهمة المحذوفة
    setOneDriveValidating(prev => { const n = {...prev}; delete n[index]; return n; });
    setOneDriveError(prev => { const n = {...prev}; delete n[index]; return n; });
    setOneDriveValid(prev => { const n = {...prev}; delete n[index]; return n; });
  };

  // التحقق من رابط OneDrive ومشاركته مع شركة الكابلات السعودية
  const validateOneDriveUrl = async (index: number, url: string) => {
    if (!url) {
      setOneDriveError(prev => ({ ...prev, [index]: '' }));
      setOneDriveValid(prev => ({ ...prev, [index]: false }));
      return;
    }

    // التحقق من أن الرابط هو رابط OneDrive صحيح
    const oneDrivePattern = /^https:\/\/(.*\.)?(sharepoint\.com|onedrive\.live\.com|1drv\.ms|onedrive\.com)/i;
    if (!oneDrivePattern.test(url)) {
      setOneDriveError(prev => ({
        ...prev,
        [index]: isAr
          ? 'الرابط غير صحيح. يرجى استخدام رابط OneDrive أو SharePoint صالح.'
          : 'Invalid URL. Please use a valid OneDrive or SharePoint link.'
      }));
      setOneDriveValid(prev => ({ ...prev, [index]: false }));
      return;
    }

    // التحقق من أن الرابط مشارك مع شركة الكابلات السعودية (sceco.com.sa)
    // نتحقق من وجود معرف المشاركة أو أن الرابط يحتوي على دومين الشركة
    const scecoPattern = /sceco\.com\.sa|saudiacables/i;
    const isSharedLink = url.includes(':x:') || url.includes('/s/') || url.includes('guestaccess') || url.includes('share');

    if (!scecoPattern.test(url) && !isSharedLink) {
      setOneDriveError(prev => ({
        ...prev,
        [index]: isAr
          ? '⚠️ يجب أن يكون الملف مشاركاً مع مستخدمي شركة الكابلات السعودية. الحل: افتح الملف في OneDrive > انقر على "مشاركة" > اختر "الأشخاص في شركة الكابلات السعودية" > انسخ الرابط الجديد.'
          : '⚠️ File must be shared with Saudi Cables Company users. Solution: Open file in OneDrive > Click "Share" > Select "People in Saudi Cables Company" > Copy the new link.'
      }));
      setOneDriveValid(prev => ({ ...prev, [index]: false }));
      return;
    }

    // الرابط صالح
    setOneDriveError(prev => ({ ...prev, [index]: '' }));
    setOneDriveValid(prev => ({ ...prev, [index]: true }));
  };

  // استخراج اسم الملف من رابط OneDrive
  const extractFileName = (url: string): string => {
    try {
      // محاولة استخراج اسم الملف من الرابط
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];
      if (fileName && fileName.includes('.')) {
        return decodeURIComponent(fileName);
      }
      return isAr ? 'ملف مرفق' : 'Attached file';
    } catch {
      return isAr ? 'ملف مرفق' : 'Attached file';
    }
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
    <div className="space-y-6 p-4 md:p-6 bg-gray-50 dark:bg-transparent min-h-screen">
      {/* Header Section - خلفية بيضاء مع حدود برتقالية للوضع النهاري */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-transparent p-4 rounded-xl border-t-4 border-t-[#F39200] dark:border-t-0 shadow-sm dark:shadow-none">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-[var(--foreground)] flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#F39200] to-amber-500 text-white shadow-md">
              <Shield className="h-6 w-6" />
            </div>
            {isAr ? 'خطط المعالجة' : 'Treatment Plans'}
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-[var(--foreground-secondary)]">
            {isAr ? 'إدارة ومتابعة خطط معالجة المخاطر' : 'Manage and track risk treatment plans'}
          </p>
        </div>
        <Button onClick={openAddModal} className="gap-2 shadow-lg hover:shadow-xl transition-shadow bg-[#F39200] hover:bg-[#e08600]">
          <Plus className="h-4 w-4" />
          {isAr ? 'إضافة خطة جديدة' : 'Add New Plan'}
        </Button>
      </div>

      {/* Stats Cards - تصميم مثل صفحة التقارير */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: isAr ? 'الإجمالي' : 'Total', value: stats.total, icon: ListChecks, color: 'text-[#F39200]', bg: 'bg-orange-50 dark:bg-[#F39200]/10', iconBg: 'bg-[#F39200]', border: 'border-[#F39200]/20' },
          { label: isAr ? 'مكتمل' : 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', iconBg: 'bg-emerald-500', border: 'border-emerald-200 dark:border-emerald-700/50' },
          { label: isAr ? 'قيد التنفيذ' : 'In Progress', value: stats.inProgress, icon: Play, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-900/20', iconBg: 'bg-sky-500', border: 'border-sky-200 dark:border-sky-700/50' },
          { label: isAr ? 'متأخر' : 'Overdue', value: stats.overdue, icon: AlertCircle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20', iconBg: 'bg-rose-500', border: 'border-rose-200 dark:border-rose-700/50' },
          { label: isAr ? 'لم يبدأ' : 'Not Started', value: stats.notStarted, icon: CircleDot, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-800/50', iconBg: 'bg-gray-500 dark:bg-gray-600', border: 'border-gray-200 dark:border-gray-600' },
        ].map((stat, i) => (
          <Card key={i} className={`overflow-hidden hover:shadow-md transition-all duration-300 border rounded-xl bg-[#FFFFFF] dark:bg-[#1E293B] ${stat.border}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{stat.label}</p>
                  <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                </div>
                <div className={`p-2.5 rounded-lg ${stat.iconBg}`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress Overview - تصميم مثل صفحة التقارير */}
      <Card className="overflow-hidden border border-[#F39200]/20 dark:border-[#F39200]/30 rounded-xl bg-[#FFFFFF] dark:bg-[#1E293B]">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-[#F39200]">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold text-lg text-gray-800 dark:text-gray-200">{isAr ? 'متوسط التقدم' : 'Average Progress'}</span>
            </div>
            <span className="text-3xl font-bold text-[#F39200]">{avgProgress}%</span>
          </div>
          <div className="h-3 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#F39200] transition-all duration-500"
              style={{ width: `${avgProgress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters - تصميم مثل صفحة التقارير */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 bg-white dark:bg-transparent rounded-xl border border-gray-100 dark:border-0">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={isAr ? 'بحث في خطط المعالجة...' : 'Search treatment plans...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F39200]"
          >
            <option value="all">{isAr ? 'كل الأقسام' : 'All Departments'}</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {isAr ? dept.nameAr : dept.nameEn}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as TreatmentStatus | 'all')}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F39200]"
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
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F39200]"
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {paginatedTreatments.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center bg-white dark:bg-transparent rounded-xl">
            <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              {isAr ? 'لا توجد خطط معالجة' : 'No treatment plans found'}
            </p>
            <Button variant="outline" className="mt-4" onClick={openAddModal}>
              <Plus className="h-4 w-4 me-2" />
              {isAr ? 'إضافة خطة جديدة' : 'Add New Plan'}
            </Button>
          </div>
        ) : (
          paginatedTreatments.map((treatment) => {
            const StrategyIcon = strategyConfig[treatment.strategy].icon;
            const StatusIcon = statusConfig[treatment.status].icon;
            const statusConf = statusConfig[treatment.status];
            const strategyConf = strategyConfig[treatment.strategy];

            return (
              <Card
                key={treatment.id}
                className="overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer group border border-gray-100 dark:border-gray-700 rounded-xl bg-[#FFFFFF] dark:bg-[#1E293B]"
                onClick={() => router.push(`/treatment/${treatment.id}`)}
              >
                {/* Card Header with Strategy Color */}
                <div className={`h-1 ${strategyConf.bgClass}`} />

                <CardContent className="p-4 space-y-3">
                  {/* Top Row: Risk Number & Status */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${ratingColors[treatment.inherentRating]}`} />
                      <span className="text-sm font-mono font-semibold text-gray-700 dark:text-gray-200">
                        {treatment.riskNumber}
                      </span>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConf.bgClass} ${statusConf.colorClass}`}>
                      <StatusIcon className="h-3 w-3" />
                      <span>{isAr ? statusConf.labelAr : statusConf.labelEn}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100 line-clamp-2 group-hover:text-[#F39200] transition-colors text-sm">
                      {isAr ? treatment.riskTitleAr : treatment.riskTitleEn}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {isAr ? treatment.departmentAr : treatment.departmentEn}
                    </p>
                  </div>

                  {/* Strategy Badge */}
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md ${strategyConf.bgClass}`}>
                    <StrategyIcon className={`h-3.5 w-3.5 ${strategyConf.colorClass}`} />
                    <span className={`text-xs font-semibold ${strategyConf.colorClass}`}>
                      {isAr ? strategyConf.labelAr : strategyConf.labelEn}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500 dark:text-gray-400">{isAr ? 'التقدم' : 'Progress'}</span>
                      <span className="font-semibold text-[#F39200]">{treatment.progress}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#F39200] transition-all duration-500"
                        style={{ width: `${treatment.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer: Responsible & Due Date */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <Users className="h-3.5 w-3.5" />
                      <span className="truncate max-w-[90px]">
                        {isAr ? treatment.responsibleAr : treatment.responsibleEn}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{new Date(treatment.dueDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        openViewModal(treatment);
                      }}
                    >
                      <Eye className="h-3.5 w-3.5 me-1" />
                      {isAr ? 'عرض' : 'View'}
                    </Button>
                    {/* زر التعديل - متاح فقط لمدير النظام ومدير المخاطر */}
                    {canEditDelete && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs border-[#F39200]/30 text-[#F39200] hover:bg-[#F39200]/5"
                        onClick={(e) => {
                          e.stopPropagation();
                          // فتح مودال التعديل
                          setSelectedTreatment(treatment);
                          setFormData({
                            riskId: treatment.riskId,
                            strategy: treatment.strategy,
                            titleAr: treatment.titleAr,
                            titleEn: treatment.titleEn,
                            responsibleId: treatment.responsibleId || '',
                            priority: treatment.priority as 'high' | 'medium' | 'low',
                            startDate: treatment.startDate.split('T')[0],
                            dueDate: treatment.dueDate.split('T')[0],
                            justificationAr: treatment.justificationAr || '',
                            justificationEn: treatment.justificationEn || '',
                            residualLikelihood: treatment.expectedResidualLikelihood || null,
                            residualImpact: treatment.expectedResidualImpact || null,
                            updateResidualRisk: !!(treatment.expectedResidualLikelihood && treatment.expectedResidualImpact),
                            tasks: treatment.tasks.map(t => ({
                              id: t.id,
                              titleAr: t.titleAr,
                              titleEn: t.titleEn,
                              dueDate: t.dueDate ? t.dueDate.split('T')[0] : '',
                              priority: (t.priority || 'medium') as 'high' | 'medium' | 'low',
                              assignedTo: t.actionOwnerId || '',
                              followedBy: t.monitorOwnerId || '',
                              description: t.descriptionAr || t.descriptionEn || '',
                              status: t.status,
                              oneDriveUrl: t.oneDriveUrl || '',
                              oneDriveFileName: t.oneDriveFileName || '',
                            })),
                          });
                          setWizardStep(2);
                          setShowAddModal(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5 me-1" />
                        {isAr ? 'تعديل' : 'Edit'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Pagination - تصميم مثل صفحة التقارير */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6 p-4 bg-white dark:bg-transparent rounded-xl border border-gray-100 dark:border-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="text-sm border-gray-200 dark:border-gray-600"
          >
            {isAr ? 'السابق' : 'Previous'}
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === pageNum
                      ? 'bg-[#F39200] text-white'
                      : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="text-sm border-gray-200 dark:border-gray-600"
          >
            {isAr ? 'التالي' : 'Next'}
          </Button>

          <span className="text-sm text-gray-500 dark:text-gray-400 ms-4">
            {isAr
              ? `صفحة ${currentPage} من ${totalPages} (${filteredTreatments.length} خطة)`
              : `Page ${currentPage} of ${totalPages} (${filteredTreatments.length} plans)`
            }
          </span>
        </div>
      )}

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
              {/* Step 1: Select Risk & Responsible */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  {/* Risk Search */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {isAr ? 'اختر الخطر' : 'Select Risk'} <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder={isAr ? 'ابحث عن الخطر...' : 'Search for risk...'}
                      leftIcon={<Search className="h-4 w-4" />}
                      value={riskSearchQuery}
                      onChange={(e) => setRiskSearchQuery(e.target.value)}
                    />
                    <div className="max-h-[180px] overflow-y-auto space-y-2 mt-2">
                      {availableRisks.length === 0 ? (
                        <div className="text-center py-6 text-[var(--foreground-secondary)]">
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

                  {/* Responsible - Required in Step 1 */}
                  <div className="pt-3 border-t border-[var(--border)]">
                    <label htmlFor="treatment-responsible-step1" className="block text-sm font-medium mb-2">
                      {isAr ? 'المسؤول عن خطة المعالجة' : 'Responsible for Treatment Plan'} <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="treatment-responsible-step1"
                      name="responsibleId"
                      value={formData.responsibleId}
                      onChange={(e) => setFormData((prev) => ({ ...prev, responsibleId: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg border bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] ${
                        !formData.responsibleId ? 'border-red-300' : 'border-[var(--border)]'
                      }`}
                    >
                      <option value="">{isAr ? 'اختر المسؤول' : 'Select Responsible'}</option>
                      {responsibleOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {isAr ? opt.name : opt.nameEn}
                        </option>
                      ))}
                    </select>
                    {!formData.responsibleId && formData.riskId && (
                      <p className="text-xs text-red-500 mt-1">
                        {isAr ? 'يرجى اختيار المسؤول للمتابعة' : 'Please select responsible to continue'}
                      </p>
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
                      <label htmlFor="treatment-start-date" className="block text-sm font-medium mb-2">{isAr ? 'تاريخ البدء' : 'Start Date'}</label>
                      <Input
                        id="treatment-start-date"
                        name="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label htmlFor="treatment-due-date" className="block text-sm font-medium mb-2">{isAr ? 'تاريخ الانتهاء' : 'Due Date'}</label>
                      <Input
                        id="treatment-due-date"
                        name="dueDate"
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* تعليق/تبرير خطة المعالجة - Justification */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {isAr ? 'تعليق / مسببات التعديل' : 'Justification / Reason for Change'}
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      {isAr
                        ? 'اشرح أسباب إنشاء خطة المعالجة هذه وما هي الأهداف المرجوة منها'
                        : 'Explain the reasons for creating this treatment plan and the expected outcomes'}
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label htmlFor="justification-ar" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                          {isAr ? 'التعليق (عربي)' : 'Justification (Arabic)'}
                        </label>
                        <textarea
                          id="justification-ar"
                          value={formData.justificationAr}
                          onChange={(e) => {
                            console.log('Justification AR changed:', e.target.value);
                            setFormData((prev) => ({ ...prev, justificationAr: e.target.value }));
                          }}
                          dir="rtl"
                          rows={3}
                          placeholder={isAr ? 'أدخل تبرير/تعليق خطة المعالجة...' : 'Enter treatment plan justification...'}
                          className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="justification-en" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                          {isAr ? 'التعليق (إنجليزي)' : 'Justification (English)'}
                        </label>
                        <textarea
                          id="justification-en"
                          value={formData.justificationEn}
                          onChange={(e) => setFormData((prev) => ({ ...prev, justificationEn: e.target.value }))}
                          dir="ltr"
                          rows={3}
                          placeholder="Enter treatment plan justification..."
                          className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* إعادة تقييم الخطر المتبقي - Residual Risk Re-assessment */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-3">
                      <label htmlFor="treatment-update-residual" className="flex items-center gap-2 cursor-pointer">
                        <input
                          id="treatment-update-residual"
                          name="updateResidualRisk"
                          type="checkbox"
                          checked={formData.updateResidualRisk}
                          onChange={(e) => setFormData((prev) => ({
                            ...prev,
                            updateResidualRisk: e.target.checked,
                            residualLikelihood: e.target.checked ? (selectedRisk?.residualLikelihood || selectedRisk?.inherentLikelihood || 3) : null,
                            residualImpact: e.target.checked ? (selectedRisk?.residualImpact || selectedRisk?.inherentImpact || 3) : null,
                          }))}
                          className="w-4 h-4 rounded border-gray-300 text-[#F39200] focus:ring-[#F39200]"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {isAr ? 'إعادة تقييم الخطر المتبقي' : 'Re-assess Residual Risk'}
                        </span>
                      </label>
                      <span className="text-xs text-gray-500">
                        {isAr ? '(اختياري)' : '(Optional)'}
                      </span>
                    </div>

                    {formData.updateResidualRisk && selectedRisk && (
                      <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700/50">
                        {/* عرض التقييم الكامن الحالي للمرجعية */}
                        <div className="mb-4 p-3 rounded-lg bg-white/80 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-600">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                            {isAr ? 'التقييم الكامن الحالي (للمرجعية)' : 'Current Inherent Assessment (Reference)'}
                          </p>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-600 dark:text-gray-400">{isAr ? 'الاحتمالية:' : 'Likelihood:'}</span>
                              <span className="font-bold text-gray-800 dark:text-gray-200">{selectedRisk.inherentLikelihood}</span>
                            </div>
                            <span className="text-gray-400">×</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-600 dark:text-gray-400">{isAr ? 'التأثير:' : 'Impact:'}</span>
                              <span className="font-bold text-gray-800 dark:text-gray-200">{selectedRisk.inherentImpact}</span>
                            </div>
                            <span className="text-gray-400">=</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-600 dark:text-gray-400">{isAr ? 'الدرجة:' : 'Score:'}</span>
                              <span className={`font-bold px-2 py-0.5 rounded text-sm ${
                                selectedRisk.inherentScore >= 20 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                selectedRisk.inherentScore >= 12 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                selectedRisk.inherentScore >= 6 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              }`}>
                                {selectedRisk.inherentScore}
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-2">
                          <TrendingDown className="h-4 w-4" />
                          {isAr ? 'التقييم المتبقي بعد المعالجة' : 'Residual Assessment After Treatment'}
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                          {/* الاحتمالية المتبقية */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                              {isAr ? 'الاحتمالية المتبقية' : 'Residual Likelihood'}
                            </label>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((val) => (
                                <button
                                  key={val}
                                  onClick={() => setFormData((prev) => ({ ...prev, residualLikelihood: val }))}
                                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                                    formData.residualLikelihood === val
                                      ? val >= 4 ? 'bg-red-500 text-white' :
                                        val === 3 ? 'bg-amber-500 text-white' :
                                        'bg-green-500 text-white'
                                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                  }`}
                                >
                                  {val}
                                </button>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-1 text-center">
                              {formData.residualLikelihood === 1 ? (isAr ? 'نادر' : 'Rare') :
                               formData.residualLikelihood === 2 ? (isAr ? 'غير محتمل' : 'Unlikely') :
                               formData.residualLikelihood === 3 ? (isAr ? 'ممكن' : 'Possible') :
                               formData.residualLikelihood === 4 ? (isAr ? 'محتمل' : 'Likely') :
                               formData.residualLikelihood === 5 ? (isAr ? 'شبه مؤكد' : 'Almost Certain') : ''}
                            </p>
                          </div>

                          {/* التأثير المتبقي */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                              {isAr ? 'التأثير المتبقي' : 'Residual Impact'}
                            </label>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((val) => (
                                <button
                                  key={val}
                                  onClick={() => setFormData((prev) => ({ ...prev, residualImpact: val }))}
                                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                                    formData.residualImpact === val
                                      ? val >= 4 ? 'bg-red-500 text-white' :
                                        val === 3 ? 'bg-amber-500 text-white' :
                                        'bg-green-500 text-white'
                                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                  }`}
                                >
                                  {val}
                                </button>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-1 text-center">
                              {formData.residualImpact === 1 ? (isAr ? 'ضئيل' : 'Negligible') :
                               formData.residualImpact === 2 ? (isAr ? 'طفيف' : 'Minor') :
                               formData.residualImpact === 3 ? (isAr ? 'متوسط' : 'Moderate') :
                               formData.residualImpact === 4 ? (isAr ? 'كبير' : 'Major') :
                               formData.residualImpact === 5 ? (isAr ? 'كارثي' : 'Catastrophic') : ''}
                            </p>
                          </div>
                        </div>

                        {/* عرض الدرجة المتبقية المحسوبة */}
                        {formData.residualLikelihood && formData.residualImpact && (
                          <div className="mt-4 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                {isAr ? 'درجة الخطر المتبقي:' : 'Residual Risk Score:'}
                              </span>
                              <div className="flex items-center gap-3">
                                <span className={`text-2xl font-bold px-3 py-1 rounded-lg ${
                                  (formData.residualLikelihood * formData.residualImpact) >= 20 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                  (formData.residualLikelihood * formData.residualImpact) >= 12 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                  (formData.residualLikelihood * formData.residualImpact) >= 6 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                }`}>
                                  {formData.residualLikelihood * formData.residualImpact}
                                </span>
                                {selectedRisk.inherentScore > (formData.residualLikelihood * formData.residualImpact) && (
                                  <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                    <TrendingDown className="h-3 w-3" />
                                    {isAr ? `تخفيض ${Math.round((1 - (formData.residualLikelihood * formData.residualImpact) / selectedRisk.inherentScore) * 100)}%` :
                                     `${Math.round((1 - (formData.residualLikelihood * formData.residualImpact) / selectedRisk.inherentScore) * 100)}% Reduction`}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Tasks - محسّن مع حقول إضافية */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">{isAr ? 'المهام التنفيذية' : 'Action Tasks'}</label>
                      <p className="text-xs text-gray-500 mt-0.5">{isAr ? 'أضف المهام المطلوبة لتنفيذ خطة المعالجة' : 'Add tasks required to implement the treatment plan'}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={addTask} className="border-green-500 text-green-600 hover:bg-green-50">
                      <Plus className="h-4 w-4 me-1" />
                      {isAr ? 'مهمة جديدة' : 'New Task'}
                    </Button>
                  </div>

                  {formData.tasks.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <ListChecks className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-gray-600 dark:text-gray-400 font-medium">{isAr ? 'لا توجد مهام بعد' : 'No tasks yet'}</p>
                      <p className="text-xs text-gray-500 mt-1 mb-4">{isAr ? 'أضف المهام لتتبع تقدم خطة المعالجة' : 'Add tasks to track treatment plan progress'}</p>
                      <Button onClick={addTask} className="bg-green-600 hover:bg-green-700">
                        <Plus className="h-4 w-4 me-2" />
                        {isAr ? 'إضافة أول مهمة' : 'Add First Task'}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[350px] overflow-y-auto pe-2">
                      {formData.tasks.map((task, index) => (
                        <div key={task.id} className="p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
                          {/* Task Header */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-bold">{index + 1}</span>
                              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{isAr ? `المهمة ${index + 1}` : `Task ${index + 1}`}</span>
                            </div>
                            <button
                              onClick={() => removeTask(index)}
                              className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              title={isAr ? 'حذف المهمة' : 'Delete Task'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Task Title - At least one required */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <div>
                              <label htmlFor={`task-title-ar-${index}`} className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                {isAr ? 'العنوان (عربي)' : 'Title (Arabic)'} {!task.titleEn && <span className="text-red-500">*</span>}
                              </label>
                              <Input
                                id={`task-title-ar-${index}`}
                                name={`task-title-ar-${index}`}
                                placeholder={isAr ? 'مثال: مراجعة السياسات الداخلية' : 'e.g., Review internal policies'}
                                value={task.titleAr}
                                onChange={(e) => updateTask(index, 'titleAr', e.target.value)}
                                className={`text-sm ${!task.titleAr && !task.titleEn ? 'border-red-300' : ''}`}
                              />
                            </div>
                            <div>
                              <label htmlFor={`task-title-en-${index}`} className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                {isAr ? 'العنوان (إنجليزي)' : 'Title (English)'} {!task.titleAr && <span className="text-red-500">*</span>}
                              </label>
                              <Input
                                id={`task-title-en-${index}`}
                                name={`task-title-en-${index}`}
                                placeholder={isAr ? 'مثال: Review internal policies' : 'e.g., Review internal policies'}
                                value={task.titleEn}
                                onChange={(e) => updateTask(index, 'titleEn', e.target.value)}
                                className={`text-sm ${!task.titleAr && !task.titleEn ? 'border-red-300' : ''}`}
                              />
                            </div>
                          </div>
                          {!task.titleAr && !task.titleEn && (
                            <p className="text-xs text-red-500 mb-2">{isAr ? 'يرجى إدخال العنوان بالعربي أو الإنجليزي على الأقل' : 'Please enter title in Arabic or English at least'}</p>
                          )}

                          {/* Task Details Row 1: Priority, Due Date, Status */}
                          <div className="grid grid-cols-3 gap-3 mb-3">
                            {/* Priority */}
                            <div>
                              <label htmlFor={`task-priority-${index}`} className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{isAr ? 'الأولوية' : 'Priority'}</label>
                              <select
                                id={`task-priority-${index}`}
                                name={`task-priority-${index}`}
                                value={task.priority || 'medium'}
                                onChange={(e) => updateTask(index, 'priority', e.target.value)}
                                className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#F39200]"
                              >
                                <option value="high">{isAr ? '🔴 عالية' : '🔴 High'}</option>
                                <option value="medium">{isAr ? '🟡 متوسطة' : '🟡 Medium'}</option>
                                <option value="low">{isAr ? '🟢 منخفضة' : '🟢 Low'}</option>
                              </select>
                            </div>

                            {/* Due Date */}
                            <div>
                              <label htmlFor={`task-due-date-${index}`} className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{isAr ? 'تاريخ الاستحقاق' : 'Due Date'}</label>
                              <Input
                                id={`task-due-date-${index}`}
                                name={`task-due-date-${index}`}
                                type="date"
                                value={task.dueDate}
                                onChange={(e) => updateTask(index, 'dueDate', e.target.value)}
                                className="text-sm"
                              />
                            </div>

                            {/* Status */}
                            <div>
                              <label htmlFor={`task-status-${index}`} className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{isAr ? 'الحالة' : 'Status'}</label>
                              <select
                                id={`task-status-${index}`}
                                name={`task-status-${index}`}
                                value={task.status || 'notStarted'}
                                onChange={(e) => updateTask(index, 'status', e.target.value)}
                                className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#F39200]"
                              >
                                <option value="notStarted">{isAr ? '⏳ لم يبدأ' : '⏳ Not Started'}</option>
                                <option value="inProgress">{isAr ? '🔄 قيد التنفيذ' : '🔄 In Progress'}</option>
                                <option value="completed">{isAr ? '✅ مكتمل' : '✅ Completed'}</option>
                              </select>
                            </div>
                          </div>

                          {/* Task Details Row 2: Assigned To & Followed By with Autocomplete */}
                          <div className="grid grid-cols-2 gap-3">
                            {/* Assigned To - المكلف (إجباري) */}
                            <div className="relative">
                              <label htmlFor={`task-assigned-${index}`} className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                {isAr ? 'المكلف' : 'Assigned To'} <span className="text-red-500">*</span>
                              </label>
                              <input
                                id={`task-assigned-${index}`}
                                name={`task-assigned-${index}`}
                                type="text"
                                value={assignedToSearch[index] !== undefined ? assignedToSearch[index] : (riskOwnersList.find(o => o.id === task.assignedTo)?.[isAr ? 'nameAr' : 'nameEn'] || '')}
                                onChange={(e) => {
                                  setAssignedToSearch({ ...assignedToSearch, [index]: e.target.value });
                                  setShowAssignedDropdown({ ...showAssignedDropdown, [index]: true });
                                }}
                                onFocus={() => setShowAssignedDropdown({ ...showAssignedDropdown, [index]: true })}
                                placeholder={isAr ? 'ابدأ بكتابة الاسم...' : 'Start typing name...'}
                                className={`w-full px-2 py-1.5 text-sm rounded-lg border bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#F39200] focus:border-[#F39200] ${!task.assignedTo ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                              />
                              {showAssignedDropdown[index] && (
                                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                  {riskOwnersList
                                    .filter(owner => {
                                      const searchVal = (assignedToSearch[index] || '').toLowerCase();
                                      return !searchVal || (owner.nameAr || '').toLowerCase().includes(searchVal) || (owner.nameEn || '').toLowerCase().includes(searchVal);
                                    })
                                    .slice(0, 10)
                                    .map(owner => (
                                      <button
                                        key={owner.id}
                                        type="button"
                                        onClick={() => {
                                          updateTask(index, 'assignedTo', owner.id);
                                          setAssignedToSearch({ ...assignedToSearch, [index]: isAr ? owner.nameAr : owner.nameEn });
                                          setShowAssignedDropdown({ ...showAssignedDropdown, [index]: false });
                                        }}
                                        className="w-full px-3 py-2 text-start text-sm hover:bg-[#F39200]/10 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
                                      >
                                        <span className="font-medium">{isAr ? owner.nameAr : owner.nameEn}</span>
                                      </button>
                                    ))
                                  }
                                  {riskOwnersList.filter(owner => {
                                    const searchVal = (assignedToSearch[index] || '').toLowerCase();
                                    return !searchVal || (owner.nameAr || '').toLowerCase().includes(searchVal) || (owner.nameEn || '').toLowerCase().includes(searchVal);
                                  }).length === 0 && (
                                    <div className="px-3 py-2 text-sm text-gray-500">{isAr ? 'لا توجد نتائج' : 'No results'}</div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Followed By - المتابعة */}
                            <div className="relative">
                              <label htmlFor={`task-followed-${index}`} className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{isAr ? 'المتابعة' : 'Followed By'}</label>
                              <input
                                id={`task-followed-${index}`}
                                name={`task-followed-${index}`}
                                type="text"
                                value={followedBySearch[index] !== undefined ? followedBySearch[index] : (riskOwnersList.find(o => o.id === task.followedBy)?.[isAr ? 'nameAr' : 'nameEn'] || '')}
                                onChange={(e) => {
                                  setFollowedBySearch({ ...followedBySearch, [index]: e.target.value });
                                  setShowFollowedDropdown({ ...showFollowedDropdown, [index]: true });
                                }}
                                onFocus={() => setShowFollowedDropdown({ ...showFollowedDropdown, [index]: true })}
                                placeholder={isAr ? 'ابدأ بكتابة الاسم...' : 'Start typing name...'}
                                className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#F39200] focus:border-[#F39200]"
                              />
                              {showFollowedDropdown[index] && (
                                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                  {riskOwnersList
                                    .filter(owner => {
                                      const searchVal = (followedBySearch[index] || '').toLowerCase();
                                      return !searchVal || (owner.nameAr || '').toLowerCase().includes(searchVal) || (owner.nameEn || '').toLowerCase().includes(searchVal);
                                    })
                                    .slice(0, 10)
                                    .map(owner => (
                                      <button
                                        key={owner.id}
                                        type="button"
                                        onClick={() => {
                                          updateTask(index, 'followedBy', owner.id);
                                          setFollowedBySearch({ ...followedBySearch, [index]: isAr ? owner.nameAr : owner.nameEn });
                                          setShowFollowedDropdown({ ...showFollowedDropdown, [index]: false });
                                        }}
                                        className="w-full px-3 py-2 text-start text-sm hover:bg-[#F39200]/10 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
                                      >
                                        <span className="font-medium">{isAr ? owner.nameAr : owner.nameEn}</span>
                                      </button>
                                    ))
                                  }
                                  {riskOwnersList.filter(owner => {
                                    const searchVal = (followedBySearch[index] || '').toLowerCase();
                                    return !searchVal || (owner.nameAr || '').toLowerCase().includes(searchVal) || (owner.nameEn || '').toLowerCase().includes(searchVal);
                                  }).length === 0 && (
                                    <div className="px-3 py-2 text-sm text-gray-500">{isAr ? 'لا توجد نتائج' : 'No results'}</div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Description - Required */}
                          <div className="mt-3">
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              {isAr ? 'وصف المهمة' : 'Task Description'} <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              value={task.description || ''}
                              onChange={(e) => updateTask(index, 'description', e.target.value)}
                              placeholder={isAr ? 'أضف تفاصيل المهمة...' : 'Add task details...'}
                              className={`w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-gray-700 focus:ring-2 focus:ring-orange-500 resize-none ${!task.description ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                              rows={2}
                            />
                            {!task.description && (
                              <p className="text-xs text-red-500 mt-1">{isAr ? 'يرجى إدخال وصف المهمة' : 'Please enter task description'}</p>
                            )}
                          </div>

                          {/* OneDrive Attachment */}
                          <div className="mt-3">
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
                              <Cloud className="h-3.5 w-3.5 text-blue-500" />
                              {isAr ? 'مرفق OneDrive (اختياري)' : 'OneDrive Attachment (Optional)'}
                            </label>
                            <div className="relative">
                              {/* خيارات الرفع */}
                              <div className="flex flex-wrap gap-2 mb-2">
                                {/* زر اختيار من OneDrive */}
                                <OneDrivePicker
                                  isAr={isAr}
                                  onFileSelect={(file) => {
                                    updateTask(index, 'oneDriveUrl', file.url);
                                    updateTask(index, 'oneDriveFileName', file.name);
                                    setOneDriveValid(prev => ({ ...prev, [index]: true }));
                                    setOneDriveError(prev => ({ ...prev, [index]: '' }));
                                  }}
                                />

                                {/* أو لصق الرابط يدوياً */}
                                <span className="text-xs text-gray-400 self-center">
                                  {isAr ? 'أو الصق الرابط:' : 'or paste link:'}
                                </span>
                              </div>

                              {/* حقل الرابط اليدوي */}
                              <div className="flex gap-2">
                                <div className="relative flex-1">
                                  <input
                                    type="url"
                                    value={task.oneDriveUrl || ''}
                                    onChange={(e) => {
                                      updateTask(index, 'oneDriveUrl', e.target.value);
                                      updateTask(index, 'oneDriveFileName', extractFileName(e.target.value));
                                    }}
                                    onBlur={(e) => validateOneDriveUrl(index, e.target.value)}
                                    placeholder={isAr ? 'الصق رابط OneDrive أو SharePoint هنا...' : 'Paste OneDrive or SharePoint link here...'}
                                    className={`w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 ${
                                      oneDriveError[index]
                                        ? 'border-red-400 dark:border-red-500'
                                        : oneDriveValid[index]
                                        ? 'border-green-400 dark:border-green-500'
                                        : 'border-gray-300 dark:border-gray-600'
                                    }`}
                                    dir="ltr"
                                  />
                                  {task.oneDriveUrl && (
                                    <div className="absolute left-2 top-1/2 -translate-y-1/2">
                                      {oneDriveValidating[index] ? (
                                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                      ) : oneDriveValid[index] ? (
                                        <CheckIcon className="h-4 w-4 text-green-500" />
                                      ) : oneDriveError[index] ? (
                                        <AlertCircle className="h-4 w-4 text-red-500" />
                                      ) : null}
                                    </div>
                                  )}
                                </div>
                                {task.oneDriveUrl && oneDriveValid[index] && (
                                  <a
                                    href={task.oneDriveUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    {isAr ? 'فتح' : 'Open'}
                                  </a>
                                )}
                                {task.oneDriveUrl && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      updateTask(index, 'oneDriveUrl', '');
                                      updateTask(index, 'oneDriveFileName', '');
                                      setOneDriveValid(prev => ({ ...prev, [index]: false }));
                                      setOneDriveError(prev => ({ ...prev, [index]: '' }));
                                    }}
                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title={isAr ? 'إزالة الملف' : 'Remove file'}
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                )}
                              </div>

                              {/* رسالة الخطأ/التوجيه */}
                              {oneDriveError[index] && (
                                <div className="mt-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                                  <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                                    {oneDriveError[index]}
                                  </p>
                                </div>
                              )}

                              {/* رسالة النجاح */}
                              {task.oneDriveUrl && oneDriveValid[index] && (
                                <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                                  <CheckIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                                  <p className="text-xs text-green-700 dark:text-green-400">
                                    {isAr ? `✓ الملف مرفق: ${task.oneDriveFileName || 'ملف مرفق'}` : `✓ File attached: ${task.oneDriveFileName || 'Attached file'}`}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tasks Summary */}
                  {formData.tasks.length > 0 && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                      <span className="text-sm font-medium text-orange-700 dark:text-orange-400">
                        {isAr ? `إجمالي المهام: ${formData.tasks.length}` : `Total Tasks: ${formData.tasks.length}`}
                      </span>
                      <Button variant="outline" size="sm" onClick={addTask} className="text-xs">
                        <Plus className="h-3 w-3 me-1" />
                        {isAr ? 'إضافة المزيد' : 'Add More'}
                      </Button>
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
                  disabled={
                    (wizardStep === 1 && (!formData.riskId || !formData.responsibleId)) ||
                    (wizardStep === 2 && !formData.strategy)
                  }
                >
                  {isAr ? 'التالي' : 'Next'}
                  <ArrowRight className="h-4 w-4 ms-1" />
                </Button>
              ) : (
                <Button
                  onClick={handleSave}
                  disabled={
                    isSaving ||
                    !formData.strategy ||
                    !formData.responsibleId ||
                    (formData.tasks.length > 0 && formData.tasks.some(t =>
                      !t.assignedTo ||
                      (!t.titleAr && !t.titleEn) ||
                      !t.description
                    ))
                  }>
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

      {/* Email Copy Modal - نافذة نسخ البريد الإلكتروني */}
      {showEmailModal && emailData && (
        <Modal
          isOpen={showEmailModal}
          onClose={() => {
            setShowEmailModal(false);
            setEmailData(null);
            setCopiedField(null);
          }}
          title={isAr ? '✅ تم إنشاء خطة المعالجة بنجاح' : '✅ Treatment Plan Created Successfully'}
          size="lg"
        >
          <div className="space-y-6">
            {/* Success Message */}
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-500 text-white">
                  <Check className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-800 dark:text-green-200">
                    {isAr ? 'تم الإنشاء بنجاح!' : 'Successfully Created!'}
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {isAr
                      ? 'يمكنك نسخ معلومات البريد الإلكتروني أدناه لإرسالها للمسؤول.'
                      : 'You can copy the email information below to send to the responsible person.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Recipient Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground-secondary)]">
                {isAr ? 'المسؤول' : 'Recipient'}
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-3 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)]">
                  <span className="font-medium">{emailData.recipientName}</span>
                </div>
              </div>
            </div>

            {/* Email Subject */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground-secondary)]">
                {isAr ? 'موضوع البريد' : 'Email Subject'}
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-3 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] overflow-x-auto">
                  <span className="text-sm whitespace-nowrap">{emailData.subject}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(emailData.subject);
                    setCopiedField('subject');
                    setTimeout(() => setCopiedField(null), 2000);
                  }}
                  className="shrink-0"
                >
                  {copiedField === 'subject' ? (
                    <>
                      <Check className="h-4 w-4 text-green-500 me-1" />
                      {isAr ? 'تم!' : 'Copied!'}
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 me-1" />
                      {isAr ? 'نسخ' : 'Copy'}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Email Body */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground-secondary)]">
                {isAr ? 'نص البريد' : 'Email Body'}
              </label>
              <div className="relative">
                <div className="p-4 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] max-h-60 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{emailData.body}</pre>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(emailData.body);
                    setCopiedField('body');
                    setTimeout(() => setCopiedField(null), 2000);
                  }}
                  className="absolute top-2 end-2"
                >
                  {copiedField === 'body' ? (
                    <>
                      <Check className="h-4 w-4 text-green-500 me-1" />
                      {isAr ? 'تم!' : 'Copied!'}
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 me-1" />
                      {isAr ? 'نسخ' : 'Copy'}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Copy All Button */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => {
                  const fullEmail = `${isAr ? 'الموضوع: ' : 'Subject: '}${emailData.subject}\n\n${emailData.body}`;
                  navigator.clipboard.writeText(fullEmail);
                  setCopiedField('all');
                  setTimeout(() => setCopiedField(null), 2000);
                }}
              >
                {copiedField === 'all' ? (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                    {isAr ? 'تم نسخ الكل!' : 'All Copied!'}
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    {isAr ? 'نسخ الكل' : 'Copy All'}
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => {
                  navigator.clipboard.writeText(emailData.treatmentUrl);
                  setCopiedField('link');
                  setTimeout(() => setCopiedField(null), 2000);
                }}
              >
                {copiedField === 'link' ? (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                    {isAr ? 'تم نسخ الرابط!' : 'Link Copied!'}
                  </>
                ) : (
                  <>
                    <Link className="h-4 w-4" />
                    {isAr ? 'نسخ الرابط فقط' : 'Copy Link Only'}
                  </>
                )}
              </Button>

              <Button
                className="flex-1 gap-2 bg-[#F39200] hover:bg-[#e08600]"
                onClick={() => {
                  // فتح تطبيق البريد الإلكتروني مع البيانات
                  const mailtoLink = `mailto:?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`;
                  window.open(mailtoLink, '_blank');
                }}
              >
                <Mail className="h-4 w-4" />
                {isAr ? 'فتح البريد' : 'Open Email'}
              </Button>
            </div>
          </div>

          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEmailModal(false);
                setEmailData(null);
                setCopiedField(null);
              }}
            >
              {isAr ? 'إغلاق' : 'Close'}
            </Button>
            <Button
              onClick={() => {
                setShowEmailModal(false);
                setEmailData(null);
                setCopiedField(null);
                router.push(`/treatment/${emailData.treatmentUrl.split('/').pop()}`);
              }}
            >
              {isAr ? 'عرض الخطة' : 'View Plan'}
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
}
