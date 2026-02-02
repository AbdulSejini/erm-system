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

interface Task {
  id: string;
  titleAr: string;
  titleEn: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  status: string;
  assignedTo?: string;
  followedBy?: string;
  description?: string;
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
      dueDate: formData.dueDate,
      priority: 'medium',
      status: 'notStarted',
      assignedTo: '',
      followedBy: '',
      description: '',
    };
    setFormData({ ...formData, tasks: [...formData.tasks, newTask] });
  };

  const removeTask = (index: number) => {
    const newTasks = formData.tasks.filter((_, i) => i !== index);
    setFormData({ ...formData, tasks: newTasks });
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
    <div className="min-h-screen bg-gray-50 dark:bg-transparent p-4 md:p-6 space-y-6">
      {/* Hero Header with Animation */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#2E2D2C] border border-gray-100 dark:border-gray-700 shadow-sm animate-slideDown">
        {/* Background Gradient */}
        <div className={`absolute inset-0 opacity-10 ${strategyConf.bgClass}`} />
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#F39200] via-amber-400 to-[#F39200]" />

        <div className="relative p-6">
          {/* Back Button & Actions */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
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
                      <div className="space-y-3">
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
                        <div className="grid grid-cols-3 gap-3">
                          <select
                            value={task.priority}
                            onChange={(e) => updateTask(index, 'priority', e.target.value)}
                            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                          >
                            <option value="high">{isAr ? 'عالية' : 'High'}</option>
                            <option value="medium">{isAr ? 'متوسطة' : 'Medium'}</option>
                            <option value="low">{isAr ? 'منخفضة' : 'Low'}</option>
                          </select>
                          <Input
                            type="date"
                            value={task.dueDate?.split('T')[0] || ''}
                            onChange={(e) => updateTask(index, 'dueDate', e.target.value)}
                          />
                          <select
                            value={task.status}
                            onChange={(e) => updateTask(index, 'status', e.target.value)}
                            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                          >
                            <option value="notStarted">{isAr ? 'لم يبدأ' : 'Not Started'}</option>
                            <option value="inProgress">{isAr ? 'قيد التنفيذ' : 'In Progress'}</option>
                            <option value="completed">{isAr ? 'مكتمل' : 'Completed'}</option>
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 dark:text-gray-100">
                            {isAr ? task.titleAr : task.titleEn}
                          </h4>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {task.dueDate ? new Date(task.dueDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US') : '-'}
                            </span>
                            <Badge
                              variant={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'secondary'}
                              className="text-xs"
                            >
                              {isAr ? (task.priority === 'high' ? 'عالية' : task.priority === 'medium' ? 'متوسطة' : 'منخفضة') : task.priority}
                            </Badge>
                          </div>
                        </div>
                        <Badge className={`${statusConfig[task.status as TreatmentStatus]?.bgClass} ${statusConfig[task.status as TreatmentStatus]?.colorClass}`}>
                          {isAr ? statusConfig[task.status as TreatmentStatus]?.labelAr : statusConfig[task.status as TreatmentStatus]?.labelEn}
                        </Badge>
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
      `}</style>
    </div>
  );
}
