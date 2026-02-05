'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import {
  ArrowRight,
  ArrowLeft,
  Shield,
  TrendingDown,
  Share2,
  Ban,
  CheckCircle,
  Target,
  ListChecks,
  AlertTriangle,
  Loader2,
  X,
  Pencil,
  Trash2,
  Calendar,
  Users,
  Activity,
  CircleDot,
  Play,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  FileText,
  Building2,
  User,
  Clock,
  Save,
  Zap,
  TrendingUp,
  BarChart3,
  Info,
  Flame,
  ShieldAlert,
  Gauge,
  Mail,
  Copy,
  Link,
  Check,
  ExternalLink,
  FileCheck,
  FileDown,
  Printer,
  MessageSquare,
  Send,
  ChevronDown,
  ChevronUp,
  History,
  Paperclip,
  ListOrdered,
  MoreVertical,
} from 'lucide-react';
import type { TreatmentStatus, TreatmentStrategy, RiskRating } from '@/types';

// Strategy config
const strategyConfig = {
  avoid: {
    icon: Ban,
    colorClass: 'text-white',
    bgClass: 'bg-rose-500 dark:bg-rose-600',
    lightBg: 'bg-rose-50',
    labelAr: 'تجنب',
    labelEn: 'Avoid',
    descAr: 'تجنب الخطر عن طريق عدم القيام بالنشاط المسبب له',
    descEn: 'Avoid the risk by not performing the activity',
  },
  reduce: {
    icon: TrendingDown,
    colorClass: 'text-white',
    bgClass: 'bg-[#F39200] dark:bg-[#F39200]',
    lightBg: 'bg-orange-50',
    labelAr: 'تقليل',
    labelEn: 'Reduce',
    descAr: 'تقليل احتمالية أو تأثير الخطر من خلال إجراءات رقابية',
    descEn: 'Reduce likelihood or impact through controls',
  },
  transfer: {
    icon: Share2,
    colorClass: 'text-white',
    bgClass: 'bg-sky-500 dark:bg-sky-600',
    lightBg: 'bg-sky-50',
    labelAr: 'نقل',
    labelEn: 'Transfer',
    descAr: 'نقل الخطر إلى طرف ثالث مثل شركات التأمين',
    descEn: 'Transfer the risk to a third party like insurance',
  },
  accept: {
    icon: CheckCircle,
    colorClass: 'text-white',
    bgClass: 'bg-emerald-500 dark:bg-emerald-600',
    lightBg: 'bg-emerald-50',
    labelAr: 'قبول',
    labelEn: 'Accept',
    descAr: 'قبول الخطر عندما تكون تكلفة المعالجة أعلى من الأثر',
    descEn: 'Accept when treatment cost exceeds impact',
  },
};

// Status config
const statusConfig = {
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

const ratingColors: Record<RiskRating, { bg: string; text: string; border: string; label: { ar: string; en: string } }> = {
  Critical: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-300 dark:border-red-700', label: { ar: 'حرج', en: 'Critical' } },
  Major: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-300 dark:border-orange-700', label: { ar: 'رئيسي', en: 'Major' } },
  Moderate: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-300 dark:border-yellow-700', label: { ar: 'متوسط', en: 'Moderate' } },
  Minor: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', border: 'border-green-300 dark:border-green-700', label: { ar: 'ثانوي', en: 'Minor' } },
  Negligible: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-300 dark:border-blue-700', label: { ar: 'ضئيل', en: 'Negligible' } },
};

interface TaskAssignee {
  id: string;
  fullName: string;
  fullNameEn?: string;
  email?: string;
}

interface TaskUpdateAuthor {
  id: string;
  fullName: string;
  fullNameEn?: string;
  email?: string;
  avatar?: string;
}

interface TaskUpdate {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  type: 'update' | 'statusChange' | 'comment' | 'progress';
  oldStatus?: string;
  newStatus?: string;
  progress?: number;
  attachmentUrl?: string;
  attachmentName?: string;
  createdAt: string;
  author: TaskUpdateAuthor;
}

interface TaskStep {
  id: string;
  taskId: string;
  createdById: string;
  title: string;
  description?: string;
  status: 'pending' | 'inProgress' | 'completed' | 'cancelled';
  order: number;
  dueDate?: string;
  completedAt?: string;
  completedById?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  createdAt: string;
  createdBy: TaskUpdateAuthor;
  completedBy?: {
    id: string;
    fullName: string;
    fullNameEn?: string;
  };
}

interface Task {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  status: string;
  assignedTo?: TaskAssignee;
  assignedToId?: string;
  actionOwner?: TaskAssignee;
  actionOwnerId?: string;
  monitor?: TaskAssignee;
  monitorOwner?: TaskAssignee;
  monitorOwnerId?: string;
  oneDriveUrl?: string;
  oneDriveFileName?: string;
  successIndicatorAr?: string;
  successIndicatorEn?: string;
  completedAt?: string;
}

interface TreatmentPlan {
  id: string;
  titleAr: string;
  titleEn: string;
  strategy: TreatmentStrategy;
  status: TreatmentStatus;
  priority: string;
  startDate: string;
  dueDate: string;
  progress: number;
  tasks: Task[];
  risk: {
    id: string;
    riskNumber: string;
    titleAr: string;
    titleEn: string;
    descriptionAr?: string;
    descriptionEn?: string;
    causesAr?: string;
    causesEn?: string;
    consequencesAr?: string;
    consequencesEn?: string;
    inherentLikelihood: number;
    inherentImpact: number;
    inherentScore: number;
    inherentRating: RiskRating;
    residualLikelihood?: number;
    residualImpact?: number;
    residualScore?: number;
    residualRating?: RiskRating;
    department?: {
      nameAr: string;
      nameEn: string;
    };
    owner?: {
      fullName: string;
      fullNameEn?: string;
    };
  };
}

export default function TreatmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { language } = useTranslation();
  const isAr = language === 'ar';
  const treatmentId = params.id as string;

  const [treatment, setTreatment] = useState<TreatmentPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'risk'>('overview');
  const [canDelete, setCanDelete] = useState(false); // صلاحية الحذف

  // Email modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [responsiblePerson, setResponsiblePerson] = useState<{ name: string; nameEn: string; email?: string } | null>(null);

  // Task updates state
  const [taskUpdates, setTaskUpdates] = useState<Record<string, TaskUpdate[]>>({});
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [newUpdateContent, setNewUpdateContent] = useState<Record<string, string>>({});
  const [submittingUpdate, setSubmittingUpdate] = useState<string | null>(null);
  const [loadingUpdates, setLoadingUpdates] = useState<Record<string, boolean>>({});

  // Task steps state (خطوات سير العمل)
  const [taskSteps, setTaskSteps] = useState<Record<string, TaskStep[]>>({});
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  const [newStepTitle, setNewStepTitle] = useState<Record<string, string>>({});
  const [submittingStep, setSubmittingStep] = useState<string | null>(null);
  const [loadingSteps, setLoadingSteps] = useState<Record<string, boolean>>({});

  // Editable form state
  const [formData, setFormData] = useState({
    titleAr: '',
    titleEn: '',
    strategy: 'reduce' as TreatmentStrategy,
    status: 'notStarted' as TreatmentStatus,
    priority: 'medium',
    startDate: '',
    dueDate: '',
    tasks: [] as Task[],
  });

  // Risk owners for autocomplete
  const [riskOwnersList, setRiskOwnersList] = useState<{ id: string; nameAr: string; nameEn: string }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // جلب بيانات المستخدم الحالي للتحقق من صلاحية الحذف
        const userRes = await fetch('/api/auth/session');
        if (userRes.ok) {
          const sessionData = await userRes.json();
          if (sessionData?.user?.role) {
            // فقط admin و riskManager يمكنهم الحذف
            setCanDelete(['admin', 'riskManager'].includes(sessionData.user.role));
          }
        }

        // Fetch treatment details - treatmentId is the treatmentPlan.id
        const res = await fetch(`/api/risks?includeTreatments=true`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            // Find the risk that contains this treatment plan
            let foundRisk = null;
            let foundTreatment = null;

            for (const risk of data.data) {
              if (risk.treatmentPlans && risk.treatmentPlans.length > 0) {
                const treatment = risk.treatmentPlans.find((t: { id: string }) => t.id === treatmentId);
                if (treatment) {
                  foundRisk = risk;
                  foundTreatment = treatment;
                  break;
                }
              }
            }

            const risk = foundRisk;
            if (risk) {

              // Determine strategy and status from risk data
              const determineStrategy = (status: string, inherentScore: number) => {
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

              const treatmentData = {
                id: foundTreatment?.id || risk.id,
                titleAr: foundTreatment?.titleAr || risk.mitigationActionsAr || `خطة معالجة ${risk.riskNumber}`,
                titleEn: foundTreatment?.titleEn || risk.mitigationActionsEn || `Treatment Plan for ${risk.riskNumber}`,
                strategy: foundTreatment?.strategy || determineStrategy(risk.status, risk.inherentScore),
                status: foundTreatment?.status || determineStatus(risk.status, risk.followUpDate),
                priority: foundTreatment?.priority || (risk.inherentScore >= 15 ? 'high' : risk.inherentScore >= 8 ? 'medium' : 'low'),
                startDate: foundTreatment?.startDate || risk.createdAt,
                dueDate: foundTreatment?.dueDate || risk.followUpDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                progress: foundTreatment?.progress || calculateProgress(risk.inherentScore, risk.residualScore),
                tasks: foundTreatment?.tasks || [],
                risk: {
                  id: risk.id,
                  riskNumber: risk.riskNumber,
                  titleAr: risk.titleAr,
                  titleEn: risk.titleEn,
                  descriptionAr: risk.descriptionAr,
                  descriptionEn: risk.descriptionEn,
                  causesAr: risk.causesAr,
                  causesEn: risk.causesEn,
                  consequencesAr: risk.consequencesAr,
                  consequencesEn: risk.consequencesEn,
                  inherentLikelihood: risk.inherentLikelihood,
                  inherentImpact: risk.inherentImpact,
                  inherentScore: risk.inherentScore,
                  inherentRating: risk.inherentRating,
                  residualLikelihood: risk.residualLikelihood,
                  residualImpact: risk.residualImpact,
                  residualScore: risk.residualScore,
                  residualRating: risk.residualRating,
                  department: risk.department,
                  owner: risk.owner,
                },
              };

              setTreatment(treatmentData as TreatmentPlan);
              setFormData({
                titleAr: treatmentData.titleAr,
                titleEn: treatmentData.titleEn,
                strategy: treatmentData.strategy as TreatmentStrategy,
                status: treatmentData.status as TreatmentStatus,
                priority: treatmentData.priority,
                startDate: treatmentData.startDate?.split('T')[0] || '',
                dueDate: treatmentData.dueDate?.split('T')[0] || '',
                tasks: treatmentData.tasks || [],
              });

              // جلب بيانات المسؤول عن خطة المعالجة
              if (foundTreatment?.responsible) {
                setResponsiblePerson({
                  name: foundTreatment.responsible.fullName || '',
                  nameEn: foundTreatment.responsible.fullNameEn || foundTreatment.responsible.fullName || '',
                  email: foundTreatment.responsible.email || '',
                });
              }
            }
          }
        }

        // Fetch risk owners
        const ownersRes = await fetch('/api/risk-owners');
        if (ownersRes.ok) {
          const ownersData = await ownersRes.json();
          if (ownersData.success && ownersData.data) {
            setRiskOwnersList(ownersData.data.map((o: { id: string; fullName: string; fullNameEn: string | null }) => ({
              id: o.id,
              nameAr: o.fullName,
              nameEn: o.fullNameEn || o.fullName,
            })));
          }
        }
      } catch (error) {
        console.error('Error fetching treatment:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [treatmentId]);

  const handleSave = async () => {
    if (!treatment) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/risks/${treatment.risk.id}/treatments/${treatmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTreatment(prev => prev ? { ...prev, ...formData } : null);
          setIsEditing(false);
        }
      }
    } catch (error) {
      console.error('Error saving treatment:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!treatment) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/risks/${treatment.risk.id}/treatments/${treatmentId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.push('/treatment');
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'فشل في حذف خطة المعالجة');
      }
    } catch (error) {
      console.error('Error deleting treatment:', error);
      alert('حدث خطأ أثناء محاولة الحذف');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const updateTask = (index: number, field: string, value: string) => {
    const newTasks = [...formData.tasks];
    newTasks[index] = { ...newTasks[index], [field]: value };
    setFormData({ ...formData, tasks: newTasks });
  };

  const addTask = () => {
    const newTask: Task = {
      id: `temp-${Date.now()}`,
      titleAr: '',
      titleEn: '',
      descriptionAr: '',
      descriptionEn: '',
      dueDate: formData.dueDate,
      priority: 'medium',
      status: 'notStarted',
      actionOwnerId: '',
      monitorOwnerId: '',
      oneDriveUrl: '',
    };
    setFormData({ ...formData, tasks: [...formData.tasks, newTask] });
  };

  const removeTask = (index: number) => {
    const newTasks = formData.tasks.filter((_, i) => i !== index);
    setFormData({ ...formData, tasks: newTasks });
  };

  // دوال إدارة التحديثات
  const fetchTaskUpdates = async (taskId: string) => {
    setLoadingUpdates(prev => ({ ...prev, [taskId]: true }));
    try {
      const res = await fetch(`/api/tasks/${taskId}/updates`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTaskUpdates(prev => ({ ...prev, [taskId]: data.data }));
        }
      }
    } catch (error) {
      console.error('Error fetching task updates:', error);
    } finally {
      setLoadingUpdates(prev => ({ ...prev, [taskId]: false }));
    }
  };

  const toggleTaskExpanded = (taskId: string) => {
    const isExpanded = !expandedTasks[taskId];
    setExpandedTasks(prev => ({ ...prev, [taskId]: isExpanded }));
    if (isExpanded && !taskUpdates[taskId]) {
      fetchTaskUpdates(taskId);
    }
  };

  const submitTaskUpdate = async (taskId: string) => {
    const content = newUpdateContent[taskId]?.trim();
    if (!content) return;

    setSubmittingUpdate(taskId);
    try {
      const res = await fetch(`/api/tasks/${taskId}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, type: 'update' }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTaskUpdates(prev => ({
            ...prev,
            [taskId]: [data.data, ...(prev[taskId] || [])],
          }));
          setNewUpdateContent(prev => ({ ...prev, [taskId]: '' }));
        }
      }
    } catch (error) {
      console.error('Error submitting task update:', error);
    } finally {
      setSubmittingUpdate(null);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return isAr ? 'الآن' : 'Just now';
    if (minutes < 60) return isAr ? `منذ ${minutes} دقيقة` : `${minutes}m ago`;
    if (hours < 24) return isAr ? `منذ ${hours} ساعة` : `${hours}h ago`;
    if (days < 7) return isAr ? `منذ ${days} يوم` : `${days}d ago`;
    return date.toLocaleDateString(isAr ? 'ar-SA' : 'en-US');
  };

  // دوال إدارة خطوات سير العمل
  const fetchTaskSteps = async (taskId: string) => {
    setLoadingSteps(prev => ({ ...prev, [taskId]: true }));
    try {
      const res = await fetch(`/api/tasks/${taskId}/steps`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTaskSteps(prev => ({ ...prev, [taskId]: data.data }));
        }
      }
    } catch (error) {
      console.error('Error fetching task steps:', error);
    } finally {
      setLoadingSteps(prev => ({ ...prev, [taskId]: false }));
    }
  };

  const toggleStepsExpanded = (taskId: string) => {
    const isExpanded = !expandedSteps[taskId];
    setExpandedSteps(prev => ({ ...prev, [taskId]: isExpanded }));
    if (isExpanded && !taskSteps[taskId]) {
      fetchTaskSteps(taskId);
    }
  };

  const submitTaskStep = async (taskId: string) => {
    const title = newStepTitle[taskId]?.trim();
    if (!title) return;

    setSubmittingStep(taskId);
    try {
      const res = await fetch(`/api/tasks/${taskId}/steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTaskSteps(prev => ({
            ...prev,
            [taskId]: [...(prev[taskId] || []), data.data],
          }));
          setNewStepTitle(prev => ({ ...prev, [taskId]: '' }));
        }
      }
    } catch (error) {
      console.error('Error submitting task step:', error);
    } finally {
      setSubmittingStep(null);
    }
  };

  const updateStepStatus = async (taskId: string, stepId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/steps`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId, status: newStatus }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTaskSteps(prev => ({
            ...prev,
            [taskId]: prev[taskId]?.map(s => s.id === stepId ? data.data : s) || [],
          }));
        }
      }
    } catch (error) {
      console.error('Error updating step status:', error);
    }
  };

  const deleteTaskStep = async (taskId: string, stepId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/steps?stepId=${stepId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setTaskSteps(prev => ({
          ...prev,
          [taskId]: prev[taskId]?.filter(s => s.id !== stepId) || [],
        }));
      }
    } catch (error) {
      console.error('Error deleting task step:', error);
    }
  };

  // Step status config
  const stepStatusConfig = {
    pending: {
      label: isAr ? 'قيد الانتظار' : 'Pending',
      color: 'text-gray-500',
      bg: 'bg-gray-100 dark:bg-gray-700',
      icon: CircleDot,
    },
    inProgress: {
      label: isAr ? 'جاري التنفيذ' : 'In Progress',
      color: 'text-sky-500',
      bg: 'bg-sky-100 dark:bg-sky-900/30',
      icon: Play,
    },
    completed: {
      label: isAr ? 'مكتمل' : 'Completed',
      color: 'text-emerald-500',
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      icon: CheckCircle2,
    },
    cancelled: {
      label: isAr ? 'ملغي' : 'Cancelled',
      color: 'text-rose-500',
      bg: 'bg-rose-100 dark:bg-rose-900/30',
      icon: XCircle,
    },
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center bg-gray-50 dark:bg-transparent">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="relative">
            <div className="h-20 w-20 rounded-full border-4 border-[#F39200]/20" />
            <Loader2 className="absolute inset-0 m-auto h-10 w-10 animate-spin text-[#F39200]" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isAr ? 'جاري تحميل تفاصيل الخطة...' : 'Loading treatment details...'}
          </p>
        </div>
      </div>
    );
  }

  if (!treatment) {
    return (
      <div className="flex h-[60vh] items-center justify-center bg-gray-50 dark:bg-transparent">
        <div className="text-center animate-fadeIn">
          <div className="mx-auto h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <FileText className="h-10 w-10 text-gray-400" />
          </div>
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            {isAr ? 'لم يتم العثور على الخطة' : 'Treatment plan not found'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {isAr ? 'قد تكون الخطة محذوفة أو غير موجودة' : 'The plan may have been deleted or does not exist'}
          </p>
          <Button className="mt-6 bg-[#F39200] hover:bg-[#e08600]" onClick={() => router.push('/treatment')}>
            {isAr ? 'العودة للقائمة' : 'Back to List'}
          </Button>
        </div>
      </div>
    );
  }

  const strategyConf = strategyConfig[treatment.strategy];
  const statusConf = statusConfig[treatment.status];
  const StrategyIcon = strategyConf.icon;
  const StatusIcon = statusConf.icon;
  const ratingConf = ratingColors[treatment.risk.inherentRating] || ratingColors.Moderate;
  const residualRatingConf = treatment.risk.residualRating ? ratingColors[treatment.risk.residualRating] : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-transparent p-4 md:p-6 space-y-6 print-container">
      {/* Print Header - Only shows when printing */}
      <div className="print-only print-header hidden print:flex print:justify-between print:items-center print:border-b-4 print:border-[#F39200] print:pb-4 print:mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2E2D2C]">
            {isAr ? 'شركة الكابلات السعودية' : 'Saudi Cable Company'}
          </h1>
          <p className="text-sm text-gray-600">Enterprise Risk Management System</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-[#F39200]">
            {isAr ? 'خطة المعالجة' : 'Treatment Plan'}
          </p>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
          </p>
        </div>
      </div>

      {/* Hero Header with Animation */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#2E2D2C] border border-gray-100 dark:border-gray-700 shadow-sm animate-slideDown">
        {/* Background Gradient */}
        <div className={`absolute inset-0 opacity-10 ${strategyConf.bgClass}`} />
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#F39200] via-amber-400 to-[#F39200]" />

        <div className="relative p-6">
          {/* Back Button & Actions - Hidden when printing */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 no-print print:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/treatment')}
              className="w-fit text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
            >
              {isAr ? <ArrowRight className="h-4 w-4 me-2" /> : <ArrowLeft className="h-4 w-4 me-2" />}
              {isAr ? 'العودة للقائمة' : 'Back to List'}
            </Button>

            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="text-gray-600 dark:text-gray-300"
                  >
                    <X className="h-4 w-4 me-2" />
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-[#F39200] hover:bg-[#e08600] shadow-lg"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <Save className="h-4 w-4 me-2" />}
                    {isAr ? 'حفظ التغييرات' : 'Save Changes'}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => window.print()}
                    className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <FileDown className="h-4 w-4 me-2" />
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowEmailModal(true)}
                    className="text-sky-600 border-sky-300 hover:bg-sky-50 dark:hover:bg-sky-900/20"
                  >
                    <Mail className="h-4 w-4 me-2" />
                    {isAr ? 'نموذج البريد' : 'Email Template'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="text-[#F39200] border-[#F39200]/50 hover:bg-[#F39200]/10"
                  >
                    <Pencil className="h-4 w-4 me-2" />
                    {isAr ? 'تعديل' : 'Edit'}
                  </Button>
                  {canDelete && (
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteModal(true)}
                      className="text-rose-600 border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                    >
                      <Trash2 className="h-4 w-4 me-2" />
                      {isAr ? 'حذف' : 'Delete'}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Title Section */}
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Strategy Icon */}
            <div className={`shrink-0 w-16 h-16 rounded-2xl ${strategyConf.bgClass} flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform`}>
              <StrategyIcon className="h-8 w-8 text-white" />
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-sm font-bold text-[#F39200] bg-[#F39200]/10 px-3 py-1 rounded-full">
                  {treatment.risk.riskNumber}
                </span>
                <Badge className={`${ratingConf.bg} ${ratingConf.text} ${ratingConf.border} border`}>
                  {isAr ? ratingConf.label.ar : ratingConf.label.en}
                </Badge>
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusConf.bgClass} ${statusConf.colorClass}`}>
                  <StatusIcon className="h-3.5 w-3.5" />
                  <span>{isAr ? statusConf.labelAr : statusConf.labelEn}</span>
                </div>
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">
                {isAr ? treatment.risk.titleAr : treatment.risk.titleEn}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                {treatment.risk.department && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>{isAr ? treatment.risk.department.nameAr : treatment.risk.department.nameEn}</span>
                  </div>
                )}
                {treatment.risk.owner && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{isAr ? treatment.risk.owner.fullName : treatment.risk.owner.fullNameEn || treatment.risk.owner.fullName}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(treatment.dueDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {isAr ? 'نسبة الإنجاز' : 'Progress'}
              </span>
              <span className="text-2xl font-bold text-[#F39200]">{treatment.progress}%</span>
            </div>
            <div className="h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#F39200] to-amber-400 transition-all duration-1000 ease-out"
                style={{ width: `${treatment.progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slideUp">
        {/* Inherent Score */}
        <div className="bg-white dark:bg-[#2E2D2C] rounded-xl border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{isAr ? 'الدرجة الكامنة' : 'Inherent Score'}</p>
              <p className="text-3xl font-bold text-rose-600 dark:text-rose-400">{treatment.risk.inherentScore}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-100 dark:bg-rose-900/30">
              <Flame className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
          </div>
        </div>

        {/* Residual Score */}
        <div className="bg-white dark:bg-[#2E2D2C] rounded-xl border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{isAr ? 'الدرجة المتبقية' : 'Residual Score'}</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{treatment.risk.residualScore || '-'}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Likelihood */}
        <div className="bg-white dark:bg-[#2E2D2C] rounded-xl border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{isAr ? 'الاحتمالية' : 'Likelihood'}</p>
              <p className="text-3xl font-bold text-sky-600 dark:text-sky-400">{treatment.risk.inherentLikelihood}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-sky-100 dark:bg-sky-900/30">
              <Gauge className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            </div>
          </div>
        </div>

        {/* Impact */}
        <div className="bg-white dark:bg-[#2E2D2C] rounded-xl border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{isAr ? 'التأثير' : 'Impact'}</p>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{treatment.risk.inherentImpact}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
        {[
          { id: 'overview', labelAr: 'نظرة عامة', labelEn: 'Overview', icon: Info },
          { id: 'tasks', labelAr: 'المهام', labelEn: 'Tasks', icon: ListChecks },
          { id: 'risk', labelAr: 'تفاصيل الخطر', labelEn: 'Risk Details', icon: AlertTriangle },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'overview' | 'tasks' | 'risk')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-[#2E2D2C] text-[#F39200] shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {isAr ? tab.labelAr : tab.labelEn}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-fadeIn">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Strategy Card */}
            <div className="bg-white dark:bg-[#2E2D2C] rounded-xl border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-all">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-[#F39200]" />
                {isAr ? 'استراتيجية المعالجة' : 'Treatment Strategy'}
              </h3>
              <div className={`p-4 rounded-xl ${strategyConf.lightBg} dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${strategyConf.bgClass}`}>
                    <StrategyIcon className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-bold text-lg text-gray-800 dark:text-gray-100">
                    {isAr ? strategyConf.labelAr : strategyConf.labelEn}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isAr ? strategyConf.descAr : strategyConf.descEn}
                </p>
              </div>
            </div>

            {/* Timeline Card */}
            <div className="bg-white dark:bg-[#2E2D2C] rounded-xl border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-all">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#F39200]" />
                {isAr ? 'الجدول الزمني' : 'Timeline'}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{isAr ? 'تاريخ البدء' : 'Start Date'}</p>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                      {new Date(treatment.startDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="border-s-2 border-dashed border-gray-200 dark:border-gray-700 ms-1.5 h-8" />
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-[#F39200]" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{isAr ? 'تاريخ الاستحقاق' : 'Due Date'}</p>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                      {new Date(treatment.dueDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="bg-white dark:bg-[#2E2D2C] rounded-xl border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-[#F39200]" />
                {isAr ? 'المهام التنفيذية' : 'Action Tasks'}
                <Badge variant="secondary" className="ms-2">{treatment.tasks?.length || 0}</Badge>
              </h3>
              {isEditing && (
                <Button size="sm" onClick={addTask} className="bg-[#F39200] hover:bg-[#e08600]">
                  <Plus className="h-4 w-4 me-1" />
                  {isAr ? 'إضافة مهمة' : 'Add Task'}
                </Button>
              )}
            </div>

            {(isEditing ? formData.tasks : treatment.tasks)?.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                  <ListChecks className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">{isAr ? 'لا توجد مهام بعد' : 'No tasks yet'}</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  {isAr ? 'أضف المهام لتتبع تقدم خطة المعالجة' : 'Add tasks to track treatment plan progress'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {(isEditing ? formData.tasks : treatment.tasks)?.map((task, index) => (
                  <div
                    key={task.id}
                    className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 hover:shadow-sm transition-all"
                  >
                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-[#F39200]">
                            {isAr ? `المهمة ${index + 1}` : `Task ${index + 1}`}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeTask(index)}
                            className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {/* العناوين */}
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            placeholder={isAr ? 'العنوان (عربي)' : 'Title (Arabic)'}
                            value={task.titleAr}
                            onChange={(e) => updateTask(index, 'titleAr', e.target.value)}
                          />
                          <Input
                            placeholder={isAr ? 'العنوان (إنجليزي)' : 'Title (English)'}
                            value={task.titleEn}
                            onChange={(e) => updateTask(index, 'titleEn', e.target.value)}
                          />
                        </div>
                        {/* وصف المهمة */}
                        <div className="grid grid-cols-2 gap-3">
                          <textarea
                            placeholder={isAr ? 'وصف المهمة (عربي)' : 'Task Description (Arabic)'}
                            value={task.descriptionAr || ''}
                            onChange={(e) => updateTask(index, 'descriptionAr', e.target.value)}
                            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm min-h-[80px]"
                          />
                          <textarea
                            placeholder={isAr ? 'وصف المهمة (إنجليزي)' : 'Task Description (English)'}
                            value={task.descriptionEn || ''}
                            onChange={(e) => updateTask(index, 'descriptionEn', e.target.value)}
                            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm min-h-[80px]"
                          />
                        </div>
                        {/* المكلف والمتابع */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                              {isAr ? 'المكلف (منفذ الإجراء)' : 'Assigned To (Action Owner)'}
                            </label>
                            <select
                              value={task.actionOwnerId || ''}
                              onChange={(e) => updateTask(index, 'actionOwnerId', e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                            >
                              <option value="">{isAr ? '-- اختر المكلف --' : '-- Select Assignee --'}</option>
                              {riskOwnersList.map((owner) => (
                                <option key={owner.id} value={owner.id}>
                                  {isAr ? owner.nameAr : owner.nameEn}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                              {isAr ? 'المتابع' : 'Monitor'}
                            </label>
                            <select
                              value={task.monitorOwnerId || ''}
                              onChange={(e) => updateTask(index, 'monitorOwnerId', e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                            >
                              <option value="">{isAr ? '-- اختر المتابع --' : '-- Select Monitor --'}</option>
                              {riskOwnersList.map((owner) => (
                                <option key={owner.id} value={owner.id}>
                                  {isAr ? owner.nameAr : owner.nameEn}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        {/* الأولوية والتاريخ والحالة */}
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                              {isAr ? 'الأولوية' : 'Priority'}
                            </label>
                            <select
                              value={task.priority}
                              onChange={(e) => updateTask(index, 'priority', e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                            >
                              <option value="high">{isAr ? 'عالية' : 'High'}</option>
                              <option value="medium">{isAr ? 'متوسطة' : 'Medium'}</option>
                              <option value="low">{isAr ? 'منخفضة' : 'Low'}</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                              {isAr ? 'تاريخ الاستحقاق' : 'Due Date'}
                            </label>
                            <Input
                              type="date"
                              value={task.dueDate?.split('T')[0] || ''}
                              onChange={(e) => updateTask(index, 'dueDate', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                              {isAr ? 'الحالة' : 'Status'}
                            </label>
                            <select
                              value={task.status}
                              onChange={(e) => updateTask(index, 'status', e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                            >
                              <option value="notStarted">{isAr ? 'لم يبدأ' : 'Not Started'}</option>
                              <option value="inProgress">{isAr ? 'قيد التنفيذ' : 'In Progress'}</option>
                              <option value="completed">{isAr ? 'مكتمل' : 'Completed'}</option>
                            </select>
                          </div>
                        </div>
                        {/* رابط OneDrive */}
                        <div>
                          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                            {isAr ? 'رابط OneDrive/SharePoint' : 'OneDrive/SharePoint Link'}
                          </label>
                          <Input
                            placeholder={isAr ? 'الصق رابط OneDrive أو SharePoint هنا' : 'Paste OneDrive or SharePoint link here'}
                            value={task.oneDriveUrl || ''}
                            onChange={(e) => updateTask(index, 'oneDriveUrl', e.target.value)}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* رأس المهمة مع رقم وحالة */}
                        <div className="flex items-start justify-between gap-4 border-b border-gray-200 dark:border-gray-700 pb-4">
                          <div className="flex items-start gap-3">
                            <div className="shrink-0 w-10 h-10 rounded-xl bg-[#F39200]/10 flex items-center justify-center">
                              <span className="text-lg font-bold text-[#F39200]">{index + 1}</span>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                                {isAr ? task.titleAr : task.titleEn}
                              </h4>
                              {(task.descriptionAr || task.descriptionEn) && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
                                  {isAr ? task.descriptionAr : task.descriptionEn}
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge className={`shrink-0 px-3 py-1 ${statusConfig[task.status as TreatmentStatus]?.bgClass} ${statusConfig[task.status as TreatmentStatus]?.colorClass}`}>
                            {isAr ? statusConfig[task.status as TreatmentStatus]?.labelAr : statusConfig[task.status as TreatmentStatus]?.labelEn}
                          </Badge>
                        </div>

                        {/* معلومات المهمة الأساسية */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* المكلف */}
                          <div className="p-3 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200 dark:border-orange-800/50">
                            <div className="flex items-center gap-2 mb-2">
                              <User className="h-4 w-4 text-[#F39200]" />
                              <span className="text-xs font-semibold text-[#F39200] uppercase tracking-wide">
                                {isAr ? 'المكلف' : 'Assignee'}
                              </span>
                            </div>
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
                              {task.actionOwner
                                ? (isAr ? task.actionOwner.fullName : task.actionOwner.fullNameEn || task.actionOwner.fullName)
                                : (isAr ? 'غير محدد' : 'Not assigned')}
                            </p>
                            {task.actionOwner?.email && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                                {task.actionOwner.email}
                              </p>
                            )}
                          </div>

                          {/* المتابع */}
                          <div className="p-3 rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 border border-sky-200 dark:border-sky-800/50">
                            <div className="flex items-center gap-2 mb-2">
                              <Users className="h-4 w-4 text-sky-500" />
                              <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wide">
                                {isAr ? 'المتابع' : 'Monitor'}
                              </span>
                            </div>
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
                              {task.monitorOwner
                                ? (isAr ? task.monitorOwner.fullName : task.monitorOwner.fullNameEn || task.monitorOwner.fullName)
                                : task.monitor
                                  ? (isAr ? task.monitor.fullName : task.monitor.fullNameEn || task.monitor.fullName)
                                  : (isAr ? 'غير محدد' : 'Not assigned')}
                            </p>
                            {(task.monitorOwner?.email || task.monitor?.email) && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                                {task.monitorOwner?.email || task.monitor?.email}
                              </p>
                            )}
                          </div>

                          {/* تاريخ الاستحقاق */}
                          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border border-purple-200 dark:border-purple-800/50">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="h-4 w-4 text-purple-500" />
                              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">
                                {isAr ? 'الاستحقاق' : 'Due Date'}
                              </span>
                            </div>
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
                              {task.dueDate ? new Date(task.dueDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                            </p>
                          </div>

                          {/* الأولوية */}
                          <div className={`p-3 rounded-xl border ${task.priority === 'high' ? 'bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-900/20 dark:to-red-900/20 border-rose-200 dark:border-rose-800/50' : task.priority === 'medium' ? 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200 dark:border-amber-800/50' : 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200 dark:border-emerald-800/50'}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <Zap className={`h-4 w-4 ${task.priority === 'high' ? 'text-rose-500' : task.priority === 'medium' ? 'text-amber-500' : 'text-emerald-500'}`} />
                              <span className={`text-xs font-semibold uppercase tracking-wide ${task.priority === 'high' ? 'text-rose-600 dark:text-rose-400' : task.priority === 'medium' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                {isAr ? 'الأولوية' : 'Priority'}
                              </span>
                            </div>
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
                              {isAr ? (task.priority === 'high' ? 'عالية' : task.priority === 'medium' ? 'متوسطة' : 'منخفضة') : (task.priority === 'high' ? 'High' : task.priority === 'medium' ? 'Medium' : 'Low')}
                            </p>
                          </div>
                        </div>

                        {/* رابط OneDrive */}
                        {task.oneDriveUrl && (
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800">
                            <div className="p-2 rounded-lg bg-sky-500 text-white">
                              <FileCheck className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-sky-600 dark:text-sky-400 font-medium">{isAr ? 'مرفق' : 'Attachment'}</p>
                              <a
                                href={task.oneDriveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-semibold text-sky-700 dark:text-sky-300 hover:underline flex items-center gap-1"
                              >
                                {task.oneDriveFileName || (isAr ? 'عرض المرفق' : 'View Attachment')}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        )}

                        {/* قسم خطوات سير العمل */}
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                          <button
                            onClick={() => toggleStepsExpanded(task.id)}
                            className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 hover:from-emerald-100 hover:to-green-100 dark:hover:from-emerald-800/30 dark:hover:to-green-800/30 transition-all border border-emerald-200 dark:border-emerald-800/50"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-emerald-500/20">
                                <ListOrdered className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                              </div>
                              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                                {isAr ? 'خطوات سير العمل' : 'Workflow Steps'}
                              </span>
                              {taskSteps[task.id]?.length > 0 && (
                                <Badge className="bg-emerald-500 text-white text-xs">
                                  {taskSteps[task.id].filter(s => s.status === 'completed').length}/{taskSteps[task.id].length}
                                </Badge>
                              )}
                            </div>
                            {expandedSteps[task.id] ? (
                              <ChevronUp className="h-5 w-5 text-emerald-500" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-emerald-500" />
                            )}
                          </button>

                          {/* محتوى الخطوات */}
                          {expandedSteps[task.id] && (
                            <div className="mt-4 space-y-4 animate-fadeIn">
                              {/* حقل إضافة خطوة جديدة */}
                              <div className="flex gap-3">
                                <div className="flex-1">
                                  <input
                                    type="text"
                                    placeholder={isAr ? 'أضف خطوة جديدة في سير العمل...' : 'Add a new workflow step...'}
                                    value={newStepTitle[task.id] || ''}
                                    onChange={(e) => setNewStepTitle(prev => ({ ...prev, [task.id]: e.target.value }))}
                                    onKeyPress={(e) => e.key === 'Enter' && submitTaskStep(task.id)}
                                    className="w-full px-4 py-3 rounded-xl border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                                  />
                                </div>
                                <Button
                                  onClick={() => submitTaskStep(task.id)}
                                  disabled={!newStepTitle[task.id]?.trim() || submittingStep === task.id}
                                  className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {submittingStep === task.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Plus className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>

                              {/* قائمة الخطوات */}
                              {loadingSteps[task.id] ? (
                                <div className="flex items-center justify-center py-8">
                                  <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                                </div>
                              ) : taskSteps[task.id]?.length > 0 ? (
                                <div className="space-y-2">
                                  {taskSteps[task.id].map((step, stepIndex) => {
                                    const StepIcon = stepStatusConfig[step.status]?.icon || CircleDot;
                                    return (
                                      <div
                                        key={step.id}
                                        className={`p-4 rounded-xl border transition-all ${
                                          step.status === 'completed'
                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                                            : step.status === 'inProgress'
                                            ? 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800'
                                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                        }`}
                                      >
                                        <div className="flex items-start gap-3">
                                          {/* رقم الخطوة */}
                                          <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                            step.status === 'completed'
                                              ? 'bg-emerald-500 text-white'
                                              : step.status === 'inProgress'
                                              ? 'bg-sky-500 text-white'
                                              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                          }`}>
                                            {step.status === 'completed' ? (
                                              <CheckCircle2 className="h-4 w-4" />
                                            ) : (
                                              stepIndex + 1
                                            )}
                                          </div>

                                          {/* محتوى الخطوة */}
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                              <h5 className={`font-semibold text-sm ${
                                                step.status === 'completed' ? 'text-emerald-700 dark:text-emerald-300 line-through' : 'text-gray-800 dark:text-gray-100'
                                              }`}>
                                                {step.title}
                                              </h5>
                                              <div className="flex items-center gap-2">
                                                <Badge className={`text-xs ${stepStatusConfig[step.status]?.bg} ${stepStatusConfig[step.status]?.color}`}>
                                                  {stepStatusConfig[step.status]?.label}
                                                </Badge>
                                              </div>
                                            </div>

                                            {step.description && (
                                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {step.description}
                                              </p>
                                            )}

                                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                              <span className="flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                {isAr ? step.createdBy.fullName : step.createdBy.fullNameEn || step.createdBy.fullName}
                                              </span>
                                              {step.completedAt && step.completedBy && (
                                                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                                  <CheckCircle2 className="h-3 w-3" />
                                                  {isAr ? step.completedBy.fullName : step.completedBy.fullNameEn || step.completedBy.fullName}
                                                </span>
                                              )}
                                            </div>

                                            {/* أزرار تغيير الحالة */}
                                            <div className="flex items-center gap-2 mt-3">
                                              {step.status !== 'completed' && (
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={() => updateStepStatus(task.id, step.id, 'completed')}
                                                  className="text-xs h-7 text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                                                >
                                                  <CheckCircle2 className="h-3 w-3 me-1" />
                                                  {isAr ? 'إنجاز' : 'Complete'}
                                                </Button>
                                              )}
                                              {step.status === 'pending' && (
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={() => updateStepStatus(task.id, step.id, 'inProgress')}
                                                  className="text-xs h-7 text-sky-600 border-sky-300 hover:bg-sky-50"
                                                >
                                                  <Play className="h-3 w-3 me-1" />
                                                  {isAr ? 'بدء' : 'Start'}
                                                </Button>
                                              )}
                                              {step.status === 'completed' && (
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={() => updateStepStatus(task.id, step.id, 'pending')}
                                                  className="text-xs h-7 text-gray-600 border-gray-300 hover:bg-gray-50"
                                                >
                                                  <XCircle className="h-3 w-3 me-1" />
                                                  {isAr ? 'إلغاء الإنجاز' : 'Undo'}
                                                </Button>
                                              )}
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => deleteTaskStep(task.id, step.id)}
                                                className="text-xs h-7 text-rose-500 hover:bg-rose-50"
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="text-center py-8">
                                  <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-3">
                                    <ListOrdered className="h-6 w-6 text-emerald-500" />
                                  </div>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {isAr ? 'لا توجد خطوات بعد' : 'No steps yet'}
                                  </p>
                                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    {isAr ? 'أضف خطوات لتتبع سير العمل' : 'Add steps to track the workflow'}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* قسم التحديثات */}
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                          <button
                            onClick={() => toggleTaskExpanded(task.id)}
                            className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 hover:from-gray-100 hover:to-gray-150 dark:hover:from-gray-700/50 dark:hover:to-gray-600/50 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-[#F39200]/10">
                                <MessageSquare className="h-4 w-4 text-[#F39200]" />
                              </div>
                              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                {isAr ? 'التحديثات والتعليقات' : 'Updates & Comments'}
                              </span>
                              {taskUpdates[task.id]?.length > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  {taskUpdates[task.id].length}
                                </Badge>
                              )}
                            </div>
                            {expandedTasks[task.id] ? (
                              <ChevronUp className="h-5 w-5 text-gray-500" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-500" />
                            )}
                          </button>

                          {/* محتوى التحديثات */}
                          {expandedTasks[task.id] && (
                            <div className="mt-4 space-y-4 animate-fadeIn">
                              {/* حقل إضافة تحديث جديد */}
                              <div className="flex gap-3">
                                <div className="flex-1 relative">
                                  <textarea
                                    placeholder={isAr ? 'أضف تحديثاً أو تعليقاً...' : 'Add an update or comment...'}
                                    value={newUpdateContent[task.id] || ''}
                                    onChange={(e) => setNewUpdateContent(prev => ({ ...prev, [task.id]: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm resize-none min-h-[80px] focus:ring-2 focus:ring-[#F39200]/30 focus:border-[#F39200] transition-all"
                                  />
                                </div>
                                <Button
                                  onClick={() => submitTaskUpdate(task.id)}
                                  disabled={!newUpdateContent[task.id]?.trim() || submittingUpdate === task.id}
                                  className="h-fit bg-[#F39200] hover:bg-[#e08600] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {submittingUpdate === task.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Send className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>

                              {/* قائمة التحديثات */}
                              {loadingUpdates[task.id] ? (
                                <div className="flex items-center justify-center py-8">
                                  <Loader2 className="h-6 w-6 animate-spin text-[#F39200]" />
                                </div>
                              ) : taskUpdates[task.id]?.length > 0 ? (
                                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                  {taskUpdates[task.id].map((update) => (
                                    <div
                                      key={update.id}
                                      className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all"
                                    >
                                      <div className="flex items-start gap-3">
                                        <div className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#F39200] to-amber-500 flex items-center justify-center text-white font-bold text-sm">
                                          {(isAr ? update.author.fullName : update.author.fullNameEn || update.author.fullName)?.charAt(0) || 'U'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between gap-2 mb-1">
                                            <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                                              {isAr ? update.author.fullName : update.author.fullNameEn || update.author.fullName}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                                              {formatTimeAgo(update.createdAt)}
                                            </span>
                                          </div>
                                          <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                            {update.content}
                                          </p>
                                          {update.type === 'statusChange' && update.oldStatus && update.newStatus && (
                                            <div className="mt-2 flex items-center gap-2 text-xs">
                                              <Badge variant="secondary" className="opacity-60">
                                                {statusConfig[update.oldStatus as TreatmentStatus]?.labelAr || update.oldStatus}
                                              </Badge>
                                              <ArrowRight className="h-3 w-3 text-gray-400" />
                                              <Badge className={`${statusConfig[update.newStatus as TreatmentStatus]?.bgClass} ${statusConfig[update.newStatus as TreatmentStatus]?.colorClass}`}>
                                                {statusConfig[update.newStatus as TreatmentStatus]?.labelAr || update.newStatus}
                                              </Badge>
                                            </div>
                                          )}
                                          {update.attachmentUrl && (
                                            <a
                                              href={update.attachmentUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="mt-2 inline-flex items-center gap-1 text-xs text-sky-600 hover:underline"
                                            >
                                              <Paperclip className="h-3 w-3" />
                                              {update.attachmentName || (isAr ? 'مرفق' : 'Attachment')}
                                            </a>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-8">
                                  <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                                    <History className="h-6 w-6 text-gray-400" />
                                  </div>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {isAr ? 'لا توجد تحديثات بعد' : 'No updates yet'}
                                  </p>
                                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    {isAr ? 'أضف أول تحديث لهذه المهمة' : 'Add the first update for this task'}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Risk Details Tab */}
        {activeTab === 'risk' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Description */}
            {(treatment.risk.descriptionAr || treatment.risk.descriptionEn) && (
              <div className="bg-white dark:bg-[#2E2D2C] rounded-xl border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-all">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#F39200]" />
                  {isAr ? 'وصف الخطر' : 'Risk Description'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {isAr ? treatment.risk.descriptionAr : treatment.risk.descriptionEn}
                </p>
              </div>
            )}

            {/* Causes */}
            {(treatment.risk.causesAr || treatment.risk.causesEn) && (
              <div className="bg-white dark:bg-[#2E2D2C] rounded-xl border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-all">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-amber-500" />
                  {isAr ? 'الأسباب المحتملة' : 'Potential Causes'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {isAr ? treatment.risk.causesAr : treatment.risk.causesEn}
                </p>
              </div>
            )}

            {/* Consequences */}
            {(treatment.risk.consequencesAr || treatment.risk.consequencesEn) && (
              <div className="bg-white dark:bg-[#2E2D2C] rounded-xl border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-all lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-rose-500" />
                  {isAr ? 'الآثار المحتملة' : 'Potential Consequences'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {isAr ? treatment.risk.consequencesAr : treatment.risk.consequencesEn}
                </p>
              </div>
            )}

            {/* Risk Matrix Visualization */}
            <div className="bg-white dark:bg-[#2E2D2C] rounded-xl border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-all lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#F39200]" />
                {isAr ? 'تحليل المخاطر' : 'Risk Analysis'}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700/50">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{isAr ? 'الاحتمالية الكامنة' : 'Inherent Likelihood'}</p>
                  <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{treatment.risk.inherentLikelihood}</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700/50">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{isAr ? 'التأثير الكامن' : 'Inherent Impact'}</p>
                  <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{treatment.risk.inherentImpact}</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/50">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{isAr ? 'الاحتمالية المتبقية' : 'Residual Likelihood'}</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{treatment.risk.residualLikelihood || '-'}</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/50">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{isAr ? 'التأثير المتبقي' : 'Residual Impact'}</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{treatment.risk.residualImpact || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={isAr ? 'تأكيد الحذف' : 'Confirm Delete'}
      >
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-full bg-rose-100 dark:bg-rose-900/30">
              <Trash2 className="h-6 w-6 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                {isAr ? 'هل أنت متأكد من حذف هذه الخطة؟' : 'Are you sure you want to delete this plan?'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {isAr ? 'لا يمكن التراجع عن هذا الإجراء' : 'This action cannot be undone'}
              </p>
            </div>
          </div>
        </div>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setShowDeleteModal(false)}
            className="text-gray-600 dark:text-gray-300"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button
            onClick={handleDelete}
            disabled={deleting}
            className="bg-rose-600 hover:bg-rose-700 text-white"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <Trash2 className="h-4 w-4 me-2" />}
            {isAr ? 'حذف' : 'Delete'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Print Footer - Only shows when printing */}
      <div className="print-only hidden print:block print:fixed print:bottom-0 print:left-0 print:right-0 print:text-center print:text-xs print:text-gray-500 print:border-t print:border-gray-300 print:pt-2 print:bg-white">
        <p>
          {isAr
            ? `تم إنشاء هذا التقرير من نظام إدارة المخاطر المؤسسية - شركة الكابلات السعودية | ${new Date().toLocaleDateString('ar-SA')}`
            : `Generated from Enterprise Risk Management System - Saudi Cable Company | ${new Date().toLocaleDateString('en-US')}`
          }
        </p>
      </div>

      {/* Email Template Modal - نموذج البريد الإلكتروني */}
      {showEmailModal && treatment && (
        <Modal
          isOpen={showEmailModal}
          onClose={() => {
            setShowEmailModal(false);
            setCopiedField(null);
          }}
          title={isAr ? '📧 نموذج البريد الإلكتروني' : '📧 Email Template'}
          size="lg"
        >
          {(() => {
            const treatmentUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/treatment/${treatmentId}`;
            const responsibleName = responsiblePerson?.name || treatment.risk.owner?.fullName || '';
            const responsibleNameEn = responsiblePerson?.nameEn || treatment.risk.owner?.fullNameEn || responsibleName;
            const responsibleEmail = responsiblePerson?.email || '';

            // بناء قسم المهام
            const getTaskAssigneeName = (task: Task, isArabic: boolean) => {
              const assignee = task.actionOwner || (typeof task.assignedTo === 'object' ? task.assignedTo : null);
              if (!assignee) return isArabic ? 'غير محدد' : 'Not assigned';
              return isArabic ? assignee.fullName : (assignee.fullNameEn || assignee.fullName);
            };

            const getTaskAssigneeEmail = (task: Task) => {
              const assignee = task.actionOwner || (typeof task.assignedTo === 'object' ? task.assignedTo : null);
              return assignee?.email || '';
            };

            const getTaskMonitorName = (task: Task, isArabic: boolean) => {
              const monitor = task.monitorOwner || task.monitor;
              if (!monitor) return isArabic ? 'غير محدد' : 'Not assigned';
              return isArabic ? monitor.fullName : (monitor.fullNameEn || monitor.fullName);
            };

            const getTaskMonitorEmail = (task: Task) => {
              return task.monitorOwner?.email || task.monitor?.email || '';
            };

            // بناء نص المهام
            const tasksTextAr = treatment.tasks && treatment.tasks.length > 0
              ? treatment.tasks.map((task, index) => {
                  const assigneeName = getTaskAssigneeName(task, true);
                  const assigneeEmail = getTaskAssigneeEmail(task);
                  const monitorName = getTaskMonitorName(task, true);
                  const monitorEmail = getTaskMonitorEmail(task);
                  return `
  ${index + 1}. ${task.titleAr || task.titleEn || 'مهمة'}
     • المكلف: ${assigneeName}${assigneeEmail ? ` (${assigneeEmail})` : ''}
     • المتابع: ${monitorName}${monitorEmail ? ` (${monitorEmail})` : ''}
     • تاريخ الاستحقاق: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString('ar-SA') : 'غير محدد'}
     • الحالة: ${statusConfig[task.status as TreatmentStatus]?.labelAr || task.status}`;
                }).join('\n')
              : '  لا توجد مهام';

            const tasksTextEn = treatment.tasks && treatment.tasks.length > 0
              ? treatment.tasks.map((task, index) => {
                  const assigneeName = getTaskAssigneeName(task, false);
                  const assigneeEmail = getTaskAssigneeEmail(task);
                  const monitorName = getTaskMonitorName(task, false);
                  const monitorEmail = getTaskMonitorEmail(task);
                  return `
  ${index + 1}. ${task.titleEn || task.titleAr || 'Task'}
     • Assigned To: ${assigneeName}${assigneeEmail ? ` (${assigneeEmail})` : ''}
     • Monitor: ${monitorName}${monitorEmail ? ` (${monitorEmail})` : ''}
     • Due Date: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US') : 'Not specified'}
     • Status: ${statusConfig[task.status as TreatmentStatus]?.labelEn || task.status}`;
                }).join('\n')
              : '  No tasks';

            const emailSubject = isAr
              ? `خطة معالجة للخطر: ${treatment.risk.riskNumber} - ${treatment.risk.titleAr}`
              : `Treatment Plan for Risk: ${treatment.risk.riskNumber} - ${treatment.risk.titleEn || treatment.risk.titleAr}`;

            const emailBody = isAr
              ? `السلام عليكم ${responsibleName},

تم تعيينك كمسؤول عن خطة المعالجة التالية:

📋 تفاصيل خطة المعالجة:
━━━━━━━━━━━━━━━━━━━━━━
• رقم الخطر: ${treatment.risk.riskNumber}
• عنوان الخطر: ${treatment.risk.titleAr}
• عنوان الخطة: ${treatment.titleAr}
• الاستراتيجية: ${strategyConfig[treatment.strategy]?.labelAr || treatment.strategy}
• الحالة: ${statusConfig[treatment.status]?.labelAr || treatment.status}
• تاريخ الاستحقاق: ${new Date(treatment.dueDate).toLocaleDateString('ar-SA')}
• نسبة الإنجاز: ${treatment.progress}%
• المسؤول: ${responsibleName}${responsibleEmail ? ` (${responsibleEmail})` : ''}

📊 درجة الخطر:
• الدرجة الكامنة: ${treatment.risk.inherentScore} (${treatment.risk.inherentRating})
• الدرجة المتبقية: ${treatment.risk.residualScore || 'غير محدد'}

📝 المهام (${treatment.tasks?.length || 0}):
━━━━━━━━━━━━━━━━━━━━━━
${tasksTextAr}

🔗 رابط الخطة:
${treatmentUrl}

يرجى مراجعة الخطة والبدء في تنفيذ المهام المطلوبة.

مع تحيات فريق إدارة المخاطر`
              : `Hello ${responsibleNameEn},

You have been assigned as the responsible person for the following treatment plan:

📋 Treatment Plan Details:
━━━━━━━━━━━━━━━━━━━━━━
• Risk Number: ${treatment.risk.riskNumber}
• Risk Title: ${treatment.risk.titleEn || treatment.risk.titleAr}
• Plan Title: ${treatment.titleEn || treatment.titleAr}
• Strategy: ${strategyConfig[treatment.strategy]?.labelEn || treatment.strategy}
• Status: ${statusConfig[treatment.status]?.labelEn || treatment.status}
• Due Date: ${new Date(treatment.dueDate).toLocaleDateString('en-US')}
• Progress: ${treatment.progress}%
• Responsible: ${responsibleNameEn}${responsibleEmail ? ` (${responsibleEmail})` : ''}

📊 Risk Score:
• Inherent Score: ${treatment.risk.inherentScore} (${treatment.risk.inherentRating})
• Residual Score: ${treatment.risk.residualScore || 'Not specified'}

📝 Tasks (${treatment.tasks?.length || 0}):
━━━━━━━━━━━━━━━━━━━━━━
${tasksTextEn}

🔗 Plan Link:
${treatmentUrl}

Please review the plan and start implementing the required tasks.

Best regards,
Risk Management Team`;

            return (
              <div className="space-y-6">
                {/* Info Banner */}
                <div className="p-4 rounded-lg bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-sky-500 text-white">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sky-800 dark:text-sky-200">
                        {isAr ? 'نموذج البريد للمسؤول' : 'Email Template for Responsible Person'}
                      </h3>
                      <p className="text-sm text-sky-700 dark:text-sky-300">
                        {isAr
                          ? 'يمكنك نسخ هذا البريد وإرساله للمسؤول عن خطة المعالجة.'
                          : 'You can copy this email and send it to the person responsible for the treatment plan.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recipient Email */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--foreground-secondary)]">
                    {isAr ? 'البريد الإلكتروني' : 'Email Address'}
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-3 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)]">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{responsiblePerson?.email || (isAr ? 'غير متوفر' : 'Not available')}</span>
                      </div>
                    </div>
                    {responsiblePerson?.email && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(responsiblePerson.email || '');
                          setCopiedField('email');
                          setTimeout(() => setCopiedField(null), 2000);
                        }}
                        className="shrink-0"
                      >
                        {copiedField === 'email' ? (
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
                    )}
                  </div>
                </div>

                {/* Email Subject */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--foreground-secondary)]">
                    {isAr ? 'موضوع البريد' : 'Email Subject'}
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-3 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] overflow-x-auto">
                      <span className="text-sm whitespace-nowrap">{emailSubject}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(emailSubject);
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
                      <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{emailBody}</pre>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(emailBody);
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

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => {
                      const fullEmail = `${isAr ? 'الموضوع: ' : 'Subject: '}${emailSubject}\n\n${emailBody}`;
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
                      navigator.clipboard.writeText(treatmentUrl);
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
                      const mailtoLink = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
                      window.open(mailtoLink, '_blank');
                    }}
                  >
                    <Mail className="h-4 w-4" />
                    {isAr ? 'فتح البريد' : 'Open Email'}
                  </Button>
                </div>
              </div>
            );
          })()}

          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEmailModal(false);
                setCopiedField(null);
              }}
            >
              {isAr ? 'إغلاق' : 'Close'}
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-slideDown {
          animation: slideDown 0.4s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        /* ========================================
           PDF Print Styles - Saudi Cable Company Theme
           ======================================== */
        @media print {
          /* Hide non-printable elements */
          .no-print,
          nav,
          header,
          aside,
          button,
          .sidebar,
          [data-sidebar],
          [role="navigation"] {
            display: none !important;
          }

          /* Reset page styling */
          @page {
            size: A4;
            margin: 15mm;
          }

          body {
            font-family: 'Segoe UI', Tahoma, Arial, sans-serif !important;
            font-size: 11pt !important;
            line-height: 1.5 !important;
            color: #2E2D2C !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Main container full width */
          main,
          .print-container {
            width: 100% !important;
            max-width: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          /* Saudi Cable Company Header */
          .print-header {
            display: flex !important;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid #F39200 !important;
            padding-bottom: 15px !important;
            margin-bottom: 20px !important;
          }

          .print-header::before {
            content: "Saudi Cable Company - شركة الكابلات السعودية";
            font-size: 18pt !important;
            font-weight: bold !important;
            color: #2E2D2C !important;
          }

          .print-header::after {
            content: "Enterprise Risk Management";
            font-size: 12pt !important;
            color: #F39200 !important;
          }

          /* Card styling for print */
          .card,
          [class*="Card"],
          [class*="rounded-2xl"] {
            border: 1px solid #E5E7EB !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
            margin-bottom: 15px !important;
            padding: 15px !important;
            background: white !important;
          }

          /* Section headers */
          h1, h2, h3 {
            color: #2E2D2C !important;
            border-bottom: 2px solid #F39200 !important;
            padding-bottom: 5px !important;
            margin-bottom: 10px !important;
          }

          /* Strategy badge */
          [class*="bg-rose-500"],
          [class*="bg-orange-500"],
          [class*="bg-sky-500"],
          [class*="bg-emerald-500"],
          [class*="bg-[#F39200]"] {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Risk scores */
          .risk-score {
            font-size: 14pt !important;
            font-weight: bold !important;
          }

          /* Task list */
          .task-item {
            border-left: 3px solid #F39200 !important;
            padding-left: 10px !important;
            margin-bottom: 10px !important;
            page-break-inside: avoid !important;
          }

          /* Progress bar */
          [class*="bg-gradient"],
          .progress-bar {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Tables */
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }

          th, td {
            border: 1px solid #E5E7EB !important;
            padding: 8px !important;
            text-align: right !important;
          }

          th {
            background: #F39200 !important;
            color: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Footer */
          .print-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 9pt !important;
            color: #6B7280 !important;
            border-top: 1px solid #E5E7EB !important;
            padding-top: 10px !important;
          }

          .print-footer::before {
            content: "Generated from Saudi Cable Company ERM System - ";
          }

          .print-footer::after {
            content: " | Page " counter(page);
          }

          /* RTL Support */
          [dir="rtl"] body,
          .rtl {
            direction: rtl !important;
            text-align: right !important;
          }

          /* Badge colors */
          .badge-critical { background: #EF4444 !important; color: white !important; }
          .badge-major { background: #F97316 !important; color: white !important; }
          .badge-moderate { background: #EAB308 !important; color: black !important; }
          .badge-minor { background: #22C55E !important; color: white !important; }
          .badge-negligible { background: #3B82F6 !important; color: white !important; }

          /* Ensure colors print */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }

        /* Print-specific content that only shows when printing */
        .print-only {
          display: none !important;
        }

        @media print {
          .print-only {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
