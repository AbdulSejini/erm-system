'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/contexts/LanguageContext';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
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
  ChevronRight,
  History,
  Paperclip,
  ListOrdered,
  MessageCircle,
  ClipboardList,
  Reply,
} from 'lucide-react';
import OneDrivePicker from '@/components/OneDrivePicker';
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

interface ChangeLog {
  id: string;
  treatmentPlanId: string;
  userId: string;
  changeType: string;
  fieldName?: string;
  fieldNameAr?: string;
  oldValue?: string;
  newValue?: string;
  description?: string;
  descriptionAr?: string;
  relatedTaskId?: string;
  createdAt: string;
  user: TaskUpdateAuthor;
}

interface Discussion {
  id: string;
  treatmentPlanId: string;
  authorId: string;
  content: string;
  type: 'comment' | 'question' | 'reply' | 'mention' | 'decision';
  parentId?: string;
  isResolved: boolean;
  attachmentUrl?: string;
  attachmentName?: string;
  createdAt: string;
  author: TaskUpdateAuthor;
  replies?: Discussion[];
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
  descriptionAr?: string;
  descriptionEn?: string;
  justificationAr?: string;
  justificationEn?: string;
  strategy: TreatmentStrategy;
  status: TreatmentStatus;
  priority: string;
  startDate: string;
  dueDate: string;
  progress: number;
  tasks: Task[];
  responsible?: {
    id: string;
    fullName: string;
    fullNameEn?: string;
    email?: string;
  };
  risk: {
    id: string;
    riskNumber: string;
    titleAr: string;
    titleEn: string;
    descriptionAr?: string;
    descriptionEn?: string;
    potentialCauseAr?: string;
    potentialCauseEn?: string;
    potentialImpactAr?: string;
    potentialImpactEn?: string;
    layersOfProtectionAr?: string;
    layersOfProtectionEn?: string;
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
  const { isImpersonating, impersonatedUser } = useImpersonation();
  const isAr = language === 'ar';
  const treatmentId = params.id as string;

  const [treatment, setTreatment] = useState<TreatmentPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [canDelete, setCanDelete] = useState(false);

  // Email modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Task updates state
  const [taskUpdates, setTaskUpdates] = useState<Record<string, TaskUpdate[]>>({});
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [newUpdateContent, setNewUpdateContent] = useState<Record<string, string>>({});
  const [submittingUpdate, setSubmittingUpdate] = useState<string | null>(null);
  const [loadingUpdates, setLoadingUpdates] = useState<Record<string, boolean>>({});

  // Task steps state
  const [taskSteps, setTaskSteps] = useState<Record<string, TaskStep[]>>({});
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  const [newStepTitle, setNewStepTitle] = useState<Record<string, string>>({});
  const [submittingStep, setSubmittingStep] = useState<string | null>(null);
  const [loadingSteps, setLoadingSteps] = useState<Record<string, boolean>>({});

  // OneDrive attachment state for steps and updates
  const [newStepAttachmentUrl, setNewStepAttachmentUrl] = useState<Record<string, string>>({});
  const [newStepAttachmentName, setNewStepAttachmentName] = useState<Record<string, string>>({});
  const [newUpdateAttachmentUrl, setNewUpdateAttachmentUrl] = useState<Record<string, string>>({});
  const [newUpdateAttachmentName, setNewUpdateAttachmentName] = useState<Record<string, string>>({});

  // Step editing state
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editingStepTitle, setEditingStepTitle] = useState('');
  const [editingStepAttachmentUrl, setEditingStepAttachmentUrl] = useState('');
  const [editingStepAttachmentName, setEditingStepAttachmentName] = useState('');
  const [savingStep, setSavingStep] = useState(false);

  // Change log state
  const [changeLogs, setChangeLogs] = useState<ChangeLog[]>([]);
  const [loadingChangeLogs, setLoadingChangeLogs] = useState(false);
  const [showChangeLog, setShowChangeLog] = useState(false);

  // Discussions state
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loadingDiscussions, setLoadingDiscussions] = useState(false);
  const [newDiscussionContent, setNewDiscussionContent] = useState('');
  const [submittingDiscussion, setSubmittingDiscussion] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

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

  // Tab navigation (replaces scroll-based navigation)
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'risk' | 'discussions' | 'log'>('overview');
  // Selected task in split-panel layout
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Check user permissions
        // إذا كان المدير ينتحل شخصية مستخدم آخر، نستخدم دور المستخدم المنتحل
        let effectiveRole = '';
        let effectiveUserId = '';
        let effectiveEmail = '';
        const userRes = await fetch('/api/auth/session');
        if (userRes.ok) {
          const sessionData = await userRes.json();
          effectiveRole = (isImpersonating && impersonatedUser?.role)
            ? impersonatedUser.role
            : sessionData?.user?.role || '';
          effectiveUserId = (isImpersonating && impersonatedUser?.id)
            ? impersonatedUser.id
            : sessionData?.user?.id || '';
          effectiveEmail = (isImpersonating && impersonatedUser?.email)
            ? impersonatedUser.email
            : sessionData?.user?.email || '';
        }

        // Fetch treatment details
        const res = await fetch(`/api/risks?includeTreatments=true`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
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

            if (foundRisk && foundTreatment) {
              const treatmentData: TreatmentPlan = {
                id: foundTreatment.id,
                titleAr: foundTreatment.titleAr,
                titleEn: foundTreatment.titleEn,
                descriptionAr: foundTreatment.descriptionAr,
                descriptionEn: foundTreatment.descriptionEn,
                justificationAr: foundTreatment.justificationAr,
                justificationEn: foundTreatment.justificationEn,
                strategy: foundTreatment.strategy,
                status: foundTreatment.status,
                priority: foundTreatment.priority || 'medium',
                startDate: foundTreatment.startDate,
                dueDate: foundTreatment.dueDate,
                progress: foundTreatment.progress || 0,
                tasks: foundTreatment.tasks || [],
                responsible: foundTreatment.responsible,
                risk: {
                  id: foundRisk.id,
                  riskNumber: foundRisk.riskNumber,
                  titleAr: foundRisk.titleAr,
                  titleEn: foundRisk.titleEn,
                  descriptionAr: foundRisk.descriptionAr,
                  descriptionEn: foundRisk.descriptionEn,
                  potentialCauseAr: foundRisk.potentialCauseAr,
                  potentialCauseEn: foundRisk.potentialCauseEn,
                  potentialImpactAr: foundRisk.potentialImpactAr,
                  potentialImpactEn: foundRisk.potentialImpactEn,
                  layersOfProtectionAr: foundRisk.layersOfProtectionAr,
                  layersOfProtectionEn: foundRisk.layersOfProtectionEn,
                  inherentLikelihood: foundRisk.inherentLikelihood,
                  inherentImpact: foundRisk.inherentImpact,
                  inherentScore: foundRisk.inherentScore,
                  inherentRating: foundRisk.inherentRating,
                  residualLikelihood: foundRisk.residualLikelihood,
                  residualImpact: foundRisk.residualImpact,
                  residualScore: foundRisk.residualScore,
                  residualRating: foundRisk.residualRating,
                  department: foundRisk.department,
                  owner: foundRisk.owner,
                },
              };

              setTreatment(treatmentData);
              setFormData({
                titleAr: treatmentData.titleAr,
                titleEn: treatmentData.titleEn,
                strategy: treatmentData.strategy,
                status: treatmentData.status,
                priority: treatmentData.priority,
                startDate: treatmentData.startDate?.split('T')[0] || '',
                dueDate: treatmentData.dueDate?.split('T')[0] || '',
                tasks: treatmentData.tasks || [],
              });

              // فحص الصلاحيات: بناءً على الدور أو المشاركة في الخطة
              let canEdit = ['admin', 'riskManager', 'riskAnalyst'].includes(effectiveRole);
              if (!canEdit) {
                // هل المستخدم هو المسؤول عن الخطة؟
                if (foundTreatment.responsible?.id === effectiveUserId) {
                  canEdit = true;
                }
                // هل المستخدم مكلف أو متابع في أي مهمة (عبر البريد الإلكتروني)؟
                if (!canEdit && effectiveEmail) {
                  const tasks = foundTreatment.tasks || [];
                  canEdit = tasks.some((task: { actionOwner?: { email?: string }; monitorOwner?: { email?: string } }) =>
                    task.actionOwner?.email === effectiveEmail ||
                    task.monitorOwner?.email === effectiveEmail
                  );
                }
              }
              setCanDelete(canEdit);

              // Fetch change logs and discussions
              fetchChangeLogs();
              fetchDiscussions();

              // تحميل خطوات سير العمل والتحديثات لجميع المهام تلقائياً
              const tasks = foundTreatment.tasks || [];
              for (const task of tasks) {
                if (task.id) {
                  fetchTaskSteps(task.id as string);
                  fetchTaskUpdates(task.id as string);
                }
              }
            }
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

  const fetchChangeLogs = async () => {
    setLoadingChangeLogs(true);
    try {
      const res = await fetch(`/api/treatments/${treatmentId}/changelog`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setChangeLogs(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching change logs:', error);
    } finally {
      setLoadingChangeLogs(false);
    }
  };

  const fetchDiscussions = async () => {
    setLoadingDiscussions(true);
    try {
      const res = await fetch(`/api/treatments/${treatmentId}/discussions`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setDiscussions(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching discussions:', error);
    } finally {
      setLoadingDiscussions(false);
    }
  };

  const submitDiscussion = async (parentId?: string) => {
    const content = parentId ? replyContent : newDiscussionContent;
    if (!content.trim()) return;

    setSubmittingDiscussion(true);
    try {
      const res = await fetch(`/api/treatments/${treatmentId}/discussions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          type: parentId ? 'reply' : 'comment',
          parentId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (parentId) {
            setDiscussions(prev => prev.map(d => {
              if (d.id === parentId) {
                return { ...d, replies: [...(d.replies || []), data.data] };
              }
              return d;
            }));
            setReplyContent('');
            setReplyingTo(null);
          } else {
            setDiscussions(prev => [data.data, ...prev]);
            setNewDiscussionContent('');
          }
        }
      }
    } catch (error) {
      console.error('Error submitting discussion:', error);
    } finally {
      setSubmittingDiscussion(false);
    }
  };

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
          // Log the change
          await fetch(`/api/treatments/${treatmentId}/changelog`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              changeType: 'update',
              descriptionAr: 'تم تحديث خطة المعالجة',
              description: 'Treatment plan updated',
            }),
          });
          fetchChangeLogs();
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
      }
    } catch (error) {
      console.error('Error deleting treatment:', error);
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Task updates functions
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
        body: JSON.stringify({
          content,
          type: 'update',
          attachmentUrl: newUpdateAttachmentUrl[taskId] || null,
          attachmentName: newUpdateAttachmentName[taskId] || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTaskUpdates(prev => ({
            ...prev,
            [taskId]: [data.data, ...(prev[taskId] || [])],
          }));
          setNewUpdateContent(prev => ({ ...prev, [taskId]: '' }));
          setNewUpdateAttachmentUrl(prev => ({ ...prev, [taskId]: '' }));
          setNewUpdateAttachmentName(prev => ({ ...prev, [taskId]: '' }));
        }
      }
    } catch (error) {
      console.error('Error submitting task update:', error);
    } finally {
      setSubmittingUpdate(null);
    }
  };

  // Task steps functions
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
        body: JSON.stringify({
          title,
          attachmentUrl: newStepAttachmentUrl[taskId] || null,
          attachmentName: newStepAttachmentName[taskId] || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTaskSteps(prev => ({
            ...prev,
            [taskId]: [...(prev[taskId] || []), data.data],
          }));
          setNewStepTitle(prev => ({ ...prev, [taskId]: '' }));
          setNewStepAttachmentUrl(prev => ({ ...prev, [taskId]: '' }));
          setNewStepAttachmentName(prev => ({ ...prev, [taskId]: '' }));
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

  // بدء تعديل خطوة
  const startEditStep = (step: TaskStep) => {
    setEditingStepId(step.id);
    setEditingStepTitle(step.title);
    setEditingStepAttachmentUrl(step.attachmentUrl || '');
    setEditingStepAttachmentName(step.attachmentName || '');
  };

  // إلغاء تعديل خطوة
  const cancelEditStep = () => {
    setEditingStepId(null);
    setEditingStepTitle('');
    setEditingStepAttachmentUrl('');
    setEditingStepAttachmentName('');
  };

  // حفظ تعديل خطوة
  const saveStepEdit = async (taskId: string, stepId: string) => {
    if (!editingStepTitle.trim()) return;
    setSavingStep(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/steps`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepId,
          title: editingStepTitle.trim(),
          attachmentUrl: editingStepAttachmentUrl || null,
          attachmentName: editingStepAttachmentName || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTaskSteps(prev => ({
            ...prev,
            [taskId]: prev[taskId]?.map(s => s.id === stepId ? data.data : s) || [],
          }));
          cancelEditStep();
        }
      }
    } catch (error) {
      console.error('Error saving step edit:', error);
    } finally {
      setSavingStep(false);
    }
  };

  // حذف خطوة
  const deleteStep = async (taskId: string, stepId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/steps?stepId=${stepId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTaskSteps(prev => ({
            ...prev,
            [taskId]: prev[taskId]?.filter(s => s.id !== stepId) || [],
          }));
        }
      }
    } catch (error) {
      console.error('Error deleting step:', error);
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
    return date.toLocaleDateString(isAr ? 'ar-SA-u-ca-gregory' : 'en-US');
  };

  const stepStatusConfig = {
    pending: { label: isAr ? 'قيد الانتظار' : 'Pending', color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-700', icon: CircleDot },
    inProgress: { label: isAr ? 'جاري التنفيذ' : 'In Progress', color: 'text-sky-500', bg: 'bg-sky-100 dark:bg-sky-900/30', icon: Play },
    completed: { label: isAr ? 'مكتمل' : 'Completed', color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30', icon: CheckCircle2 },
    cancelled: { label: isAr ? 'ملغي' : 'Cancelled', color: 'text-rose-500', bg: 'bg-rose-100 dark:bg-rose-900/30', icon: XCircle },
  };

  const changeTypeLabels: Record<string, { ar: string; en: string; icon: typeof History; color: string }> = {
    create: { ar: 'إنشاء', en: 'Created', icon: Plus, color: 'text-emerald-500' },
    update: { ar: 'تحديث', en: 'Updated', icon: Pencil, color: 'text-sky-500' },
    status_change: { ar: 'تغيير الحالة', en: 'Status Changed', icon: Activity, color: 'text-purple-500' },
    task_add: { ar: 'إضافة مهمة', en: 'Task Added', icon: ListChecks, color: 'text-emerald-500' },
    task_update: { ar: 'تحديث مهمة', en: 'Task Updated', icon: ClipboardList, color: 'text-sky-500' },
    progress_change: { ar: 'تغيير التقدم', en: 'Progress Changed', icon: TrendingUp, color: 'text-amber-500' },
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
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
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            {isAr ? 'لم يتم العثور على الخطة' : 'Treatment plan not found'}
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
  const completedTasksCount = treatment.tasks.filter(t => t.status === 'completed').length;

  const tabs = [
    { id: 'overview' as const, labelAr: 'نظرة عامة', labelEn: 'Overview', icon: Target, count: 0 },
    { id: 'tasks' as const, labelAr: 'المهام', labelEn: 'Tasks', icon: ListChecks, count: treatment.tasks.length },
    { id: 'risk' as const, labelAr: 'الخطر', labelEn: 'Risk', icon: ShieldAlert, count: 0 },
    { id: 'discussions' as const, labelAr: 'المناقشات', labelEn: 'Discussions', icon: MessageCircle, count: discussions.length },
    { id: 'log' as const, labelAr: 'السجل', labelEn: 'Log', icon: History, count: changeLogs.length },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] print-container">
      {/* ═══════ Compact Header + Tabs ═══════ */}
      <div className="sticky top-0 z-50 bg-[var(--background)]/95 backdrop-blur-sm border-b border-[var(--border)] print:hidden">
        <div className="max-w-5xl mx-auto px-4">
          {/* Row 1: Back + Title + Status + Progress + Actions */}
          <div className="flex items-center gap-3 py-3">
            <Button variant="ghost" size="sm" onClick={() => router.push('/treatment')} className="shrink-0">
              {isAr ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            </Button>
            <code className="shrink-0 text-xs font-mono font-bold text-[#F39200] bg-[#F39200]/10 px-2 py-0.5 rounded">
              {treatment.risk.riskNumber}
            </code>
            <h1 className="text-sm font-semibold truncate flex-1 text-[var(--foreground)]">
              {isAr ? treatment.titleAr : treatment.titleEn}
            </h1>
            <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${statusConf.bgClass} ${statusConf.colorClass}`}>
              <StatusIcon className="h-3.5 w-3.5" />
              {isAr ? statusConf.labelAr : statusConf.labelEn}
            </div>
            <div className="hidden md:flex items-center gap-2 min-w-[100px] shrink-0">
              <div className="flex-1 h-1.5 rounded-full bg-[var(--background-tertiary)]">
                <div className="h-full rounded-full bg-[#F39200] transition-all" style={{ width: `${treatment.progress}%` }} />
              </div>
              <span className="text-xs font-bold text-[#F39200] w-8">{treatment.progress}%</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="sm" onClick={() => window.print()} title="PDF"><FileDown className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" onClick={() => setShowEmailModal(true)} title={isAr ? 'بريد' : 'Email'}><Mail className="h-4 w-4" /></Button>
              {!isEditing ? (
                canDelete && (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} title={isAr ? 'تعديل' : 'Edit'}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowDeleteModal(true)} className="text-rose-500" title={isAr ? 'حذف' : 'Delete'}><Trash2 className="h-4 w-4" /></Button>
                  </>
                )
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}><X className="h-4 w-4" /></Button>
                  <Button size="sm" onClick={handleSave} disabled={saving} className="bg-[#F39200] hover:bg-[#e08600] text-white">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 me-1" />}
                    {isAr ? 'حفظ' : 'Save'}
                  </Button>
                </>
              )}
            </div>
          </div>
          {/* Row 2: Tab Navigation */}
          <div className="flex gap-1.5 py-2 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap',
                  activeTab === tab.id
                    ? 'bg-[#F39200] text-white shadow-md shadow-[#F39200]/25'
                    : 'bg-[var(--background-secondary)] text-[var(--foreground-secondary)] hover:bg-[var(--background-tertiary)] hover:text-[var(--foreground)]'
                )}
              >
                <tab.icon className="h-4 w-4" />
                {isAr ? tab.labelAr : tab.labelEn}
                {tab.count > 0 && (
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center font-bold',
                    activeTab === tab.id
                      ? 'bg-white/25 text-white'
                      : 'bg-[var(--background-tertiary)] text-[var(--foreground-secondary)]'
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════ Tab Content ═══════ */}
      <div className={cn('mx-auto p-4 md:p-6', activeTab === 'tasks' ? 'max-w-7xl' : 'max-w-5xl')}>

        {/* ── Overview Tab ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <Card className="p-0 overflow-hidden">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-[var(--border)] rtl:divide-x-reverse">
                {/* Strategy */}
                <div className="p-4 text-center">
                  <div className={`mx-auto w-10 h-10 rounded-lg ${strategyConf.bgClass} flex items-center justify-center mb-2`}>
                    <StrategyIcon className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-xs text-[var(--foreground-secondary)]">{isAr ? 'الاستراتيجية' : 'Strategy'}</p>
                  <p className="text-sm font-semibold">{isAr ? strategyConf.labelAr : strategyConf.labelEn}</p>
                </div>
                {/* Status */}
                <div className="p-4 text-center">
                  <div className={`mx-auto w-10 h-10 rounded-lg ${statusConf.bgClass} flex items-center justify-center mb-2`}>
                    <StatusIcon className={`h-5 w-5 ${statusConf.colorClass}`} />
                  </div>
                  <p className="text-xs text-[var(--foreground-secondary)]">{isAr ? 'الحالة' : 'Status'}</p>
                  <p className="text-sm font-semibold">{isAr ? statusConf.labelAr : statusConf.labelEn}</p>
                </div>
                {/* Progress */}
                <div className="p-4 text-center">
                  <p className="text-2xl font-bold text-[#F39200] mb-1">{treatment.progress}%</p>
                  <div className="h-1.5 rounded-full bg-[var(--background-tertiary)] mx-auto max-w-[80px]">
                    <div className="h-full rounded-full bg-[#F39200]" style={{ width: `${treatment.progress}%` }} />
                  </div>
                  <p className="text-xs text-[var(--foreground-secondary)] mt-1">{isAr ? 'الإنجاز' : 'Progress'}</p>
                </div>
                {/* Tasks */}
                <div className="p-4 text-center cursor-pointer hover:bg-[var(--background-secondary)] transition-colors" onClick={() => { setActiveTab('tasks'); if (treatment.tasks.length > 0 && !selectedTaskId) setSelectedTaskId(treatment.tasks[0].id); }}>
                  <p className="text-2xl font-bold text-sky-600">{completedTasksCount}<span className="text-base text-[var(--foreground-muted)]">/{treatment.tasks.length}</span></p>
                  <p className="text-xs text-[var(--foreground-secondary)] mt-1">{isAr ? 'المهام المكتملة' : 'Tasks Done'}</p>
                </div>
                {/* Inherent */}
                <div className="p-4 text-center">
                  <p className="text-2xl font-bold text-rose-600">{treatment.risk.inherentScore}</p>
                  <p className="text-xs text-rose-500">{treatment.risk.inherentLikelihood} × {treatment.risk.inherentImpact}</p>
                  <p className="text-xs text-[var(--foreground-secondary)] mt-1">{isAr ? 'الكامن' : 'Inherent'}</p>
                </div>
                {/* Residual */}
                <div className="p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{treatment.risk.residualScore || '-'}</p>
                  {treatment.risk.residualLikelihood && treatment.risk.residualImpact && (
                    <p className="text-xs text-emerald-500">{treatment.risk.residualLikelihood} × {treatment.risk.residualImpact}</p>
                  )}
                  <p className="text-xs text-[var(--foreground-secondary)] mt-1">{isAr ? 'المتبقي' : 'Residual'}</p>
                </div>
              </div>
            </Card>

            {/* Details Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Plan Details */}
              <Card>
                <CardContent>
                  <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">{isAr ? 'تفاصيل الخطة' : 'Plan Details'}</h3>
                  <div className="space-y-3">
                    {treatment.risk.department && (
                      <div className="flex items-center justify-between py-2 border-b border-[var(--border)]">
                        <span className="text-sm text-[var(--foreground-secondary)] flex items-center gap-2"><Building2 className="h-4 w-4" />{isAr ? 'الإدارة' : 'Department'}</span>
                        <span className="text-sm font-medium">{isAr ? treatment.risk.department.nameAr : treatment.risk.department.nameEn}</span>
                      </div>
                    )}
                    {treatment.responsible && (
                      <div className="flex items-center justify-between py-2 border-b border-[var(--border)]">
                        <span className="text-sm text-[var(--foreground-secondary)] flex items-center gap-2"><User className="h-4 w-4" />{isAr ? 'المسؤول' : 'Responsible'}</span>
                        <span className="text-sm font-medium">{isAr ? treatment.responsible.fullName : treatment.responsible.fullNameEn || treatment.responsible.fullName}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between py-2 border-b border-[var(--border)]">
                      <span className="text-sm text-[var(--foreground-secondary)] flex items-center gap-2"><Calendar className="h-4 w-4" />{isAr ? 'تاريخ البدء' : 'Start Date'}</span>
                      <span className="text-sm font-medium">{new Date(treatment.startDate).toLocaleDateString(isAr ? 'ar-SA-u-ca-gregory' : 'en-US')}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-[var(--foreground-secondary)] flex items-center gap-2"><Clock className="h-4 w-4" />{isAr ? 'الموعد النهائي' : 'Due Date'}</span>
                      <span className="text-sm font-medium">{new Date(treatment.dueDate).toLocaleDateString(isAr ? 'ar-SA-u-ca-gregory' : 'en-US')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Info */}
              <Card>
                <CardContent>
                  <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">{isAr ? 'الخطر المرتبط' : 'Linked Risk'}</h3>
                  <p className="text-sm font-medium text-[var(--foreground)] mb-2">{isAr ? treatment.risk.titleAr : treatment.risk.titleEn}</p>
                  {(treatment.risk.descriptionAr || treatment.risk.descriptionEn) && (
                    <p className="text-sm text-[var(--foreground-secondary)] mb-4 line-clamp-3">{isAr ? treatment.risk.descriptionAr : treatment.risk.descriptionEn}</p>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('risk')} className="w-full">
                    <ShieldAlert className="h-4 w-4 me-2" />
                    {isAr ? 'عرض تفاصيل الخطر' : 'View Risk Details'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Justification */}
            {(treatment.justificationAr || treatment.justificationEn) && (
              <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                <CardContent>
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-amber-600" />
                    <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">{isAr ? 'التبرير' : 'Justification'}</h3>
                  </div>
                  <p className="text-sm text-amber-900 dark:text-amber-200">{isAr ? treatment.justificationAr : treatment.justificationEn}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── Tasks Tab — Split layout: task list + detail panel ── */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            {/* Tasks Summary Bar */}
            {treatment.tasks.length > 0 && (
              <Card className="p-0">
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ListChecks className="h-5 w-5 text-[#F39200]" />
                    <span className="text-sm font-medium">{completedTasksCount}/{treatment.tasks.length} {isAr ? 'مكتمل' : 'completed'}</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-[150px]">
                    <div className="flex-1 h-2 rounded-full bg-[var(--background-tertiary)]">
                      <div className="h-full rounded-full bg-[#F39200] transition-all" style={{ width: `${treatment.tasks.length > 0 ? (completedTasksCount / treatment.tasks.length) * 100 : 0}%` }} />
                    </div>
                    <span className="text-xs font-bold text-[#F39200]">{treatment.tasks.length > 0 ? Math.round((completedTasksCount / treatment.tasks.length) * 100) : 0}%</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {treatment.tasks.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* Task List (left side) */}
              <div className="lg:col-span-2 space-y-2">
                {treatment.tasks.map((task, index) => {
                  const taskStatus = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.notStarted;
                  const TaskStatusIcon = taskStatus.icon;
                  const steps = taskSteps[task.id] || [];
                  const completedStepsCount = steps.filter(s => s.status === 'completed').length;
                  const isSelected = selectedTaskId === task.id;

                  const taskBorderColor = {
                    completed: 'border-s-emerald-500',
                    inProgress: 'border-s-sky-500',
                    overdue: 'border-s-rose-500',
                    notStarted: 'border-s-gray-300 dark:border-s-gray-600',
                    cancelled: 'border-s-gray-400',
                  }[task.status] || 'border-s-gray-300';

                  return (
                    <button
                      key={task.id}
                      onClick={() => {
                        setSelectedTaskId(task.id);
                        if (!expandedSteps[task.id]) toggleStepsExpanded(task.id);
                        if (!expandedTasks[task.id]) toggleTaskExpanded(task.id);
                      }}
                      className={cn(
                        'w-full text-start p-3 rounded-lg border-s-4 border border-[var(--border)] transition-all',
                        taskBorderColor,
                        isSelected
                          ? 'bg-[#F39200]/5 border-[#F39200] ring-1 ring-[#F39200]/30'
                          : 'bg-[var(--background)] hover:bg-[var(--background-secondary)]'
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="shrink-0 w-7 h-7 rounded-lg bg-[var(--background-tertiary)] flex items-center justify-center text-xs font-bold text-[var(--foreground-secondary)]">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="text-sm font-semibold text-[var(--foreground)] truncate">
                              {isAr ? task.titleAr : task.titleEn}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs ${taskStatus.bgClass} ${taskStatus.colorClass}`}>
                              <TaskStatusIcon className="h-3 w-3" />
                              <span>{isAr ? taskStatus.labelAr : taskStatus.labelEn}</span>
                            </div>
                            {steps.length > 0 && (
                              <span className="text-xs text-[var(--foreground-secondary)]">{completedStepsCount}/{steps.length}</span>
                            )}
                            {(task.actionOwner || task.assignedTo) && (
                              <span className="text-xs text-[var(--foreground-secondary)] truncate">
                                <User className="h-3 w-3 inline me-0.5" />
                                {isAr ? (task.actionOwner?.fullName || task.assignedTo?.fullName) : (task.actionOwner?.fullNameEn || task.assignedTo?.fullNameEn || task.actionOwner?.fullName || task.assignedTo?.fullName)}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className={cn('h-4 w-4 text-[var(--foreground-secondary)] shrink-0 transition-transform', isAr && 'rotate-180')} />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Task Detail Panel (right side) */}
              <div className="lg:col-span-3">
                {selectedTaskId ? (() => {
                  const task = treatment.tasks.find(t => t.id === selectedTaskId);
                  if (!task) return null;
                  const taskStatus = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.notStarted;
                  const TaskStatusIcon = taskStatus.icon;
                  const steps = taskSteps[task.id] || [];
                  const updates = taskUpdates[task.id] || [];
                  const completedStepsCount = steps.filter(s => s.status === 'completed').length;
                  const taskIndex = treatment.tasks.findIndex(t => t.id === selectedTaskId);

                  return (
                    <Card className="p-0 overflow-hidden sticky top-[120px]">
                      {/* Task detail header */}
                      <div className="p-4 border-b border-[var(--border)] bg-[var(--background-secondary)]">
                        <div className="flex items-center gap-3">
                          <span className="shrink-0 w-8 h-8 rounded-lg bg-[#F39200]/10 flex items-center justify-center text-sm font-bold text-[#F39200]">
                            {taskIndex + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-[var(--foreground)]">
                              {isAr ? task.titleAr : task.titleEn}
                            </h3>
                            {(isAr ? task.titleEn : task.titleAr) && (
                              <p className="text-xs text-[var(--foreground-secondary)]">{isAr ? task.titleEn : task.titleAr}</p>
                            )}
                          </div>
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${taskStatus.bgClass} ${taskStatus.colorClass}`}>
                            <TaskStatusIcon className="h-3.5 w-3.5" />
                            <span>{isAr ? taskStatus.labelAr : taskStatus.labelEn}</span>
                          </div>
                        </div>
                        {/* Task metadata */}
                        <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-[var(--foreground-secondary)]">
                          {(task.actionOwner || task.assignedTo) && (
                            <span className="flex items-center gap-1 bg-[var(--background)] px-2 py-1 rounded"><User className="h-3.5 w-3.5" />{isAr ? (task.actionOwner?.fullName || task.assignedTo?.fullName) : (task.actionOwner?.fullNameEn || task.assignedTo?.fullNameEn || task.actionOwner?.fullName || task.assignedTo?.fullName)}</span>
                          )}
                          {task.dueDate && (
                            <span className="flex items-center gap-1 bg-[var(--background)] px-2 py-1 rounded"><Calendar className="h-3.5 w-3.5" />{new Date(task.dueDate).toLocaleDateString(isAr ? 'ar-SA-u-ca-gregory' : 'en-US')}</span>
                          )}
                          {task.oneDriveUrl && (
                            <a href={task.oneDriveUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sky-600 hover:text-sky-700 bg-sky-50 dark:bg-sky-900/20 px-2 py-1 rounded">
                              <Paperclip className="h-3.5 w-3.5" />{isAr ? 'مرفق' : 'Attachment'}<ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        {(task.descriptionAr || task.descriptionEn) && (
                          <p className="text-xs text-[var(--foreground-secondary)] mt-2 p-2 bg-[var(--background)] rounded">{isAr ? task.descriptionAr : task.descriptionEn}</p>
                        )}
                      </div>

                      {/* Scrollable content: Steps + Updates */}
                      <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                        {/* Workflow Steps */}
                        <div className="p-4 border-b border-[var(--border)]">
                          <div className="flex items-center gap-2 mb-3">
                            <ListOrdered className="h-4 w-4 text-emerald-600" />
                            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{isAr ? 'خطوات سير العمل' : 'Workflow Steps'}</span>
                            {steps.length > 0 && (
                              <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                                {completedStepsCount}/{steps.length}
                              </span>
                            )}
                          </div>

                          {loadingSteps[task.id] ? (
                            <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-emerald-500" /></div>
                          ) : (
                            <div className="space-y-2">
                              {steps.map((step, stepIndex) => {
                                const stepConf = stepStatusConfig[step.status];
                                const StepIcon = stepConf.icon;
                                const isEditingStep = editingStepId === step.id;
                                return (
                                  <div key={step.id} className={`p-3 rounded-lg ${stepConf.bg} border border-gray-200 dark:border-gray-600`}>
                                    {isEditingStep ? (
                                      <div className="space-y-2">
                                        <Input
                                          value={editingStepTitle}
                                          onChange={(e) => setEditingStepTitle(e.target.value)}
                                          placeholder={isAr ? 'عنوان الخطوة...' : 'Step title...'}
                                          autoFocus
                                          onKeyPress={(e) => e.key === 'Enter' && saveStepEdit(task.id, step.id)}
                                        />
                                        <OneDrivePicker isAr={isAr} onFileSelect={(file) => { setEditingStepAttachmentUrl(file.url); setEditingStepAttachmentName(file.name); }} />
                                        {editingStepAttachmentUrl && (
                                          <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 p-2 rounded-lg">
                                            <Paperclip className="h-3.5 w-3.5" />
                                            <a href={editingStepAttachmentUrl} target="_blank" rel="noopener noreferrer" className="truncate max-w-[200px] hover:underline">{editingStepAttachmentName || (isAr ? 'مرفق' : 'Attachment')}</a>
                                            <button onClick={() => { setEditingStepAttachmentUrl(''); setEditingStepAttachmentName(''); }} className="text-red-400 hover:text-red-600 ms-auto"><X className="h-3.5 w-3.5" /></button>
                                          </div>
                                        )}
                                        <div className="flex gap-2 justify-end">
                                          <Button size="sm" variant="outline" onClick={cancelEditStep} className="text-xs">{isAr ? 'إلغاء' : 'Cancel'}</Button>
                                          <Button size="sm" onClick={() => saveStepEdit(task.id, step.id)} disabled={savingStep || !editingStepTitle.trim()} className="bg-emerald-500 hover:bg-emerald-600 text-xs">
                                            {savingStep ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Save className="h-3.5 w-3.5 me-1" />{isAr ? 'حفظ' : 'Save'}</>}
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-gray-500 w-5">{stepIndex + 1}</span>
                                        <button
                                          onClick={() => updateStepStatus(task.id, step.id, step.status === 'completed' ? 'pending' : 'completed')}
                                          className={`p-1 rounded-full ${step.status === 'completed' ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}
                                        >
                                          <StepIcon className="h-3.5 w-3.5" />
                                        </button>
                                        <span className={`flex-1 text-sm ${step.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>{step.title}</span>
                                        {step.attachmentUrl && (
                                          <a href={step.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 shrink-0" title={step.attachmentName || ''}><Paperclip className="h-3.5 w-3.5" /></a>
                                        )}
                                        <div className="flex items-center gap-0.5 shrink-0">
                                          <button onClick={() => startEditStep(step)} className="p-1 rounded text-gray-400 hover:text-emerald-600 transition-colors" title={isAr ? 'تعديل' : 'Edit'}><Pencil className="h-3 w-3" /></button>
                                          <button onClick={() => deleteStep(task.id, step.id)} className="p-1 rounded text-gray-400 hover:text-red-600 transition-colors" title={isAr ? 'حذف' : 'Delete'}><Trash2 className="h-3 w-3" /></button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}

                              {/* Add Step */}
                              <div className="flex gap-2 mt-2">
                                <Input
                                  value={newStepTitle[task.id] || ''}
                                  onChange={(e) => setNewStepTitle(prev => ({ ...prev, [task.id]: e.target.value }))}
                                  placeholder={isAr ? 'أضف خطوة جديدة...' : 'Add a new step...'}
                                  className="flex-1 text-sm"
                                  onKeyPress={(e) => e.key === 'Enter' && submitTaskStep(task.id)}
                                />
                                <Button
                                  size="sm"
                                  onClick={() => submitTaskStep(task.id)}
                                  disabled={submittingStep === task.id || !newStepTitle[task.id]?.trim()}
                                  className="bg-emerald-500 hover:bg-emerald-600"
                                >
                                  {submittingStep === task.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Updates */}
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <MessageSquare className="h-4 w-4 text-sky-600" />
                            <span className="text-sm font-semibold text-sky-700 dark:text-sky-300">{isAr ? 'التحديثات' : 'Updates'}</span>
                            {updates.length > 0 && (
                              <span className="text-xs bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 px-1.5 py-0.5 rounded">{updates.length}</span>
                            )}
                          </div>

                          {loadingUpdates[task.id] ? (
                            <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-sky-500" /></div>
                          ) : (
                            <div className="space-y-2">
                              {/* Add Update */}
                              <div className="flex gap-2">
                                <Input
                                  value={newUpdateContent[task.id] || ''}
                                  onChange={(e) => setNewUpdateContent(prev => ({ ...prev, [task.id]: e.target.value }))}
                                  placeholder={isAr ? 'أضف تحديث...' : 'Add an update...'}
                                  className="flex-1 text-sm"
                                  onKeyPress={(e) => e.key === 'Enter' && submitTaskUpdate(task.id)}
                                />
                                <Button
                                  size="sm"
                                  onClick={() => submitTaskUpdate(task.id)}
                                  disabled={submittingUpdate === task.id || !newUpdateContent[task.id]?.trim()}
                                  className="bg-sky-500 hover:bg-sky-600"
                                >
                                  {submittingUpdate === task.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                </Button>
                              </div>

                              {updates.map((update) => (
                                <div key={update.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                                  <div className="flex items-start gap-2">
                                    <div className="w-7 h-7 rounded-full bg-sky-100 dark:bg-sky-800 flex items-center justify-center text-sky-600 dark:text-sky-300 font-bold text-xs shrink-0">
                                      {update.author.fullName.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-0.5">
                                        <span className="font-medium text-xs">{isAr ? update.author.fullName : update.author.fullNameEn || update.author.fullName}</span>
                                        <span className="text-xs text-gray-400">{formatTimeAgo(update.createdAt)}</span>
                                      </div>
                                      <p className="text-sm text-gray-700 dark:text-gray-300">{update.content}</p>
                                      {update.attachmentUrl && (
                                        <a href={update.attachmentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-sky-600 hover:text-sky-800 dark:text-sky-400 mt-1">
                                          <Paperclip className="h-3 w-3" /><span className="max-w-[200px] truncate">{update.attachmentName || (isAr ? 'مرفق' : 'Attachment')}</span>
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })() : (
                  <Card className="p-0">
                    <div className="flex flex-col items-center justify-center py-16 text-[var(--foreground-secondary)]">
                      <ListChecks className="h-10 w-10 mb-3 opacity-40" />
                      <p className="text-sm">{isAr ? 'اختر مهمة لعرض تفاصيلها' : 'Select a task to view details'}</p>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <ListChecks className="h-12 w-12 text-[var(--foreground-muted)] mx-auto mb-3" />
              <p className="text-sm text-[var(--foreground-secondary)]">{isAr ? 'لا توجد مهام حتى الآن' : 'No tasks yet'}</p>
            </div>
          )}
          </div>
        )}

        {/* ── Risk Details Tab ── */}
        {activeTab === 'risk' && (
          <div className="space-y-6">
            {/* Risk Description */}
            {(treatment.risk.descriptionAr || treatment.risk.descriptionEn) && (
              <Card>
                <CardContent>
                  <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[var(--foreground-secondary)]" />
                    {isAr ? 'وصف الخطر' : 'Risk Description'}
                  </h3>
                  <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">
                    {isAr ? treatment.risk.descriptionAr : treatment.risk.descriptionEn}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Cause & Impact */}
            <div className="grid md:grid-cols-2 gap-6">
              {(treatment.risk.potentialCauseAr || treatment.risk.potentialCauseEn) && (
                <Card className="border-amber-200 dark:border-amber-800">
                  <CardContent>
                    <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      {isAr ? 'السبب المحتمل' : 'Potential Cause'}
                    </h3>
                    <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">
                      {isAr ? treatment.risk.potentialCauseAr : treatment.risk.potentialCauseEn}
                    </p>
                  </CardContent>
                </Card>
              )}
              {(treatment.risk.potentialImpactAr || treatment.risk.potentialImpactEn) && (
                <Card className="border-rose-200 dark:border-rose-800">
                  <CardContent>
                    <h3 className="text-sm font-semibold text-rose-700 dark:text-rose-300 mb-3 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      {isAr ? 'التأثير المحتمل' : 'Potential Impact'}
                    </h3>
                    <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">
                      {isAr ? treatment.risk.potentialImpactAr : treatment.risk.potentialImpactEn}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Existing Controls */}
            {(treatment.risk.layersOfProtectionAr || treatment.risk.layersOfProtectionEn) && (
              <Card className="border-emerald-200 dark:border-emerald-800">
                <CardContent>
                  <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    {isAr ? 'الضوابط الحالية' : 'Existing Controls'}
                  </h3>
                  <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">
                    {isAr ? treatment.risk.layersOfProtectionAr : treatment.risk.layersOfProtectionEn}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Risk Scores */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20">
                <CardContent>
                  <h3 className="text-sm font-semibold text-rose-700 dark:text-rose-300 mb-4 flex items-center gap-2">
                    <Flame className="h-4 w-4" />
                    {isAr ? 'الخطر الكامن' : 'Inherent Risk'}
                  </h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-rose-600 dark:text-rose-400 mb-1">{isAr ? 'الاحتمالية' : 'Likelihood'}</p>
                      <p className="text-2xl font-bold text-rose-700 dark:text-rose-300">{treatment.risk.inherentLikelihood}</p>
                    </div>
                    <div>
                      <p className="text-xs text-rose-600 dark:text-rose-400 mb-1">{isAr ? 'التأثير' : 'Impact'}</p>
                      <p className="text-2xl font-bold text-rose-700 dark:text-rose-300">{treatment.risk.inherentImpact}</p>
                    </div>
                    <div>
                      <p className="text-xs text-rose-600 dark:text-rose-400 mb-1">{isAr ? 'الدرجة' : 'Score'}</p>
                      <p className="text-2xl font-bold text-rose-700 dark:text-rose-300">{treatment.risk.inherentScore}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
                <CardContent>
                  <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-4 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    {isAr ? 'الخطر المتبقي' : 'Residual Risk'}
                  </h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">{isAr ? 'الاحتمالية' : 'Likelihood'}</p>
                      <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{treatment.risk.residualLikelihood || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">{isAr ? 'التأثير' : 'Impact'}</p>
                      <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{treatment.risk.residualImpact || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">{isAr ? 'الدرجة' : 'Score'}</p>
                      <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{treatment.risk.residualScore || '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ── Discussions Tab ── */}
        {activeTab === 'discussions' && (
          <div className="space-y-4">
            {/* New Discussion Input */}
            <Card>
              <CardContent>
                <div className="flex gap-3">
                  <div className="shrink-0 w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-300 font-bold text-sm">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newDiscussionContent}
                      onChange={(e) => setNewDiscussionContent(e.target.value)}
                      placeholder={isAr ? 'اكتب تعليقاً أو سؤالاً...' : 'Write a comment or question...'}
                      className="w-full p-3 border border-[var(--border)] rounded-lg bg-[var(--background-secondary)] resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      rows={3}
                    />
                    <div className="flex justify-end mt-2">
                      <Button
                        size="sm"
                        onClick={() => submitDiscussion()}
                        disabled={submittingDiscussion || !newDiscussionContent.trim()}
                        className="bg-purple-500 hover:bg-purple-600"
                      >
                        {submittingDiscussion ? <Loader2 className="h-4 w-4 animate-spin me-1" /> : <Send className="h-4 w-4 me-1" />}
                        {isAr ? 'إرسال' : 'Send'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Discussions List */}
            {loadingDiscussions ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-purple-500" /></div>
            ) : discussions.length > 0 ? (
              <div className="space-y-3">
                {discussions.map((discussion) => (
                  <Card key={discussion.id}>
                    <CardContent>
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-300 font-bold text-sm">
                          {discussion.author.fullName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold">{isAr ? discussion.author.fullName : discussion.author.fullNameEn || discussion.author.fullName}</span>
                            <span className="text-xs text-[var(--foreground-muted)]">{formatTimeAgo(discussion.createdAt)}</span>
                            {discussion.type === 'question' && (
                              <Badge className="bg-amber-100 text-amber-700 text-xs">{isAr ? 'سؤال' : 'Question'}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-[var(--foreground-secondary)] mb-2">{discussion.content}</p>

                          {/* Replies */}
                          {discussion.replies && discussion.replies.length > 0 && (
                            <div className="space-y-2 mt-3 pt-3 border-t border-[var(--border)]">
                              {discussion.replies.map((reply) => (
                                <div key={reply.id} className="flex items-start gap-2 ps-4">
                                  <div className="shrink-0 w-7 h-7 rounded-full bg-[var(--background-tertiary)] flex items-center justify-center text-[var(--foreground-secondary)] font-bold text-xs">
                                    {reply.author.fullName.charAt(0)}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <span className="text-xs font-medium">{isAr ? reply.author.fullName : reply.author.fullNameEn || reply.author.fullName}</span>
                                      <span className="text-xs text-[var(--foreground-muted)]">{formatTimeAgo(reply.createdAt)}</span>
                                    </div>
                                    <p className="text-xs text-[var(--foreground-secondary)]">{reply.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Reply */}
                          {replyingTo === discussion.id ? (
                            <div className="flex gap-2 mt-2">
                              <Input
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder={isAr ? 'اكتب رداً...' : 'Write a reply...'}
                                className="flex-1 text-sm"
                                onKeyPress={(e) => e.key === 'Enter' && submitDiscussion(discussion.id)}
                              />
                              <Button size="sm" onClick={() => submitDiscussion(discussion.id)} disabled={submittingDiscussion || !replyContent.trim()} className="bg-purple-500 hover:bg-purple-600">
                                {submittingDiscussion ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setReplyingTo(null)}><X className="h-3.5 w-3.5" /></Button>
                            </div>
                          ) : (
                            <button onClick={() => setReplyingTo(discussion.id)} className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 mt-1">
                              <Reply className="h-3.5 w-3.5" />{isAr ? 'رد' : 'Reply'}
                            </button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 text-[var(--foreground-muted)] mx-auto mb-3" />
                <p className="text-sm text-[var(--foreground-secondary)]">{isAr ? 'لا توجد مناقشات بعد' : 'No discussions yet'}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Change Log Tab ── */}
        {activeTab === 'log' && (
          <div>
            {loadingChangeLogs ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-[var(--foreground-secondary)]" /></div>
            ) : changeLogs.length > 0 ? (
              <div className="relative ps-8">
                <div className="absolute top-0 bottom-0 start-3 w-0.5 bg-[var(--border)]" />
                <div className="space-y-3">
                  {changeLogs.map((log) => {
                    const changeConf = changeTypeLabels[log.changeType] || { ar: log.changeType, en: log.changeType, icon: History, color: 'text-gray-500' };
                    const ChangeIcon = changeConf.icon;
                    return (
                      <div key={log.id} className="relative">
                        <div className="absolute -start-8 top-4 w-5 h-5 rounded-full flex items-center justify-center bg-[var(--background)] border-2 border-[var(--border)]">
                          <ChangeIcon className={`h-2.5 w-2.5 ${changeConf.color}`} />
                        </div>
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{isAr ? log.user.fullName : log.user.fullNameEn || log.user.fullName}</span>
                                <span className={`text-xs ${changeConf.color}`}>{isAr ? changeConf.ar : changeConf.en}</span>
                              </div>
                              <span className="text-xs text-[var(--foreground-muted)]">{formatTimeAgo(log.createdAt)}</span>
                            </div>
                            {(log.descriptionAr || log.description) && (
                              <p className="text-xs text-[var(--foreground-secondary)]">{isAr ? log.descriptionAr : log.description}</p>
                            )}
                            {log.fieldNameAr && log.oldValue && log.newValue && (
                              <div className="mt-1 text-xs text-[var(--foreground-muted)]">
                                <span className="font-medium">{isAr ? log.fieldNameAr : log.fieldName}:</span>
                                <span className="text-rose-500 line-through mx-1">{log.oldValue}</span>
                                <span>→</span>
                                <span className="text-emerald-500 mx-1">{log.newValue}</span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <History className="h-12 w-12 text-[var(--foreground-muted)] mx-auto mb-3" />
                <p className="text-sm text-[var(--foreground-secondary)]">{isAr ? 'لا توجد تعديلات مسجلة' : 'No changes recorded'}</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={isAr ? 'حذف خطة المعالجة' : 'Delete Treatment Plan'}
      >
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {isAr
            ? 'هل أنت متأكد من حذف هذه الخطة؟ لا يمكن التراجع عن هذا الإجراء.'
            : 'Are you sure you want to delete this plan? This action cannot be undone.'}
        </p>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
            {isAr ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button onClick={handleDelete} disabled={deleting} className="bg-rose-500 hover:bg-rose-600">
            {deleting ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <Trash2 className="h-4 w-4 me-2" />}
            {isAr ? 'حذف' : 'Delete'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Email Modal */}
      <Modal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        title={isAr ? 'نموذج البريد الإلكتروني' : 'Email Template'}
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">{isAr ? 'الموضوع' : 'Subject'}</label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={`${isAr ? 'خطة معالجة:' : 'Treatment Plan:'} ${treatment.risk.riskNumber} - ${isAr ? treatment.titleAr : treatment.titleEn}`}
                className="flex-1"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(`${isAr ? 'خطة معالجة:' : 'Treatment Plan:'} ${treatment.risk.riskNumber} - ${isAr ? treatment.titleAr : treatment.titleEn}`);
                  setCopiedField('subject');
                  setTimeout(() => setCopiedField(null), 2000);
                }}
              >
                {copiedField === 'subject' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">{isAr ? 'الرابط' : 'Link'}</label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={typeof window !== 'undefined' ? window.location.href : ''}
                className="flex-1"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setCopiedField('link');
                  setTimeout(() => setCopiedField(null), 2000);
                }}
              >
                {copiedField === 'link' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowEmailModal(false)}>
            {isAr ? 'إغلاق' : 'Close'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { background: white !important; }
          .print-container { padding: 0 !important; }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
        .animate-slideDown { animation: slideDown 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.5s ease-out; }
      `}</style>
    </div>
  );
}
