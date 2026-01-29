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
} from 'lucide-react';
import type { TreatmentStatus, TreatmentStrategy, RiskRating } from '@/types';

// Strategy config
const strategyConfig = {
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
    icon: CheckCircle,
    colorClass: 'text-white',
    bgClass: 'bg-emerald-500 dark:bg-emerald-600',
    labelAr: 'قبول',
    labelEn: 'Accept',
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

const ratingColors: Record<RiskRating, { bg: string; text: string; label: { ar: string; en: string } }> = {
  Critical: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: { ar: 'حرج', en: 'Critical' } },
  Major: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', label: { ar: 'رئيسي', en: 'Major' } },
  Moderate: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', label: { ar: 'متوسط', en: 'Moderate' } },
  Minor: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: { ar: 'ثانوي', en: 'Minor' } },
  Negligible: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: { ar: 'ضئيل', en: 'Negligible' } },
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

        // Fetch treatment details - treatmentId is actually the risk.id
        const res = await fetch(`/api/risks?includeTreatments=true`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            // Find the risk by ID (the URL param is risk.id, not treatmentPlan.id)
            const risk = data.data.find((r: { id: string }) => r.id === treatmentId);
            if (risk) {
              // Get the first treatment plan if exists, or create a virtual one
              const foundTreatment = risk.treatmentPlans?.[0];

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
      }
    } catch (error) {
      console.error('Error deleting treatment:', error);
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
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#F39200]" />
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
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            {isAr ? 'لم يتم العثور على الخطة' : 'Treatment plan not found'}
          </p>
          <Button className="mt-4" onClick={() => router.push('/treatment')}>
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

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/treatment')}
            className="text-gray-600 dark:text-gray-300"
          >
            {isAr ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            <span className="ms-2">{isAr ? 'العودة' : 'Back'}</span>
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              {isAr ? treatment.titleAr || 'خطة معالجة' : treatment.titleEn || 'Treatment Plan'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {treatment.risk.riskNumber}
            </p>
          </div>
        </div>
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
                className="bg-[#F39200] hover:bg-[#e08600]"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <Save className="h-4 w-4 me-2" />}
                {isAr ? 'حفظ' : 'Save'}
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
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(true)}
                className="text-rose-600 border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/20"
              >
                <Trash2 className="h-4 w-4 me-2" />
                {isAr ? 'حذف' : 'Delete'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Treatment Details - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Treatment Info Card */}
          <Card className="bg-white dark:bg-[#2E2D2C] border-gray-100 dark:border-gray-700 shadow-sm">
            <CardHeader className="border-b border-gray-100 dark:border-gray-700">
              <CardTitle className="text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#F39200]" />
                {isAr ? 'تفاصيل الخطة' : 'Plan Details'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Strategy & Status */}
              <div className="flex flex-wrap gap-3">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${strategyConf.bgClass}`}>
                  <StrategyIcon className={`h-4 w-4 ${strategyConf.colorClass}`} />
                  <span className={`text-sm font-bold ${strategyConf.colorClass}`}>
                    {isAr ? strategyConf.labelAr : strategyConf.labelEn}
                  </span>
                </div>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${statusConf.bgClass} ${statusConf.colorClass}`}>
                  <StatusIcon className="h-4 w-4" />
                  <span className="text-sm font-semibold">
                    {isAr ? statusConf.labelAr : statusConf.labelEn}
                  </span>
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">{isAr ? 'التقدم' : 'Progress'}</span>
                  <span className="font-bold text-orange-600 dark:text-[#F39200]">{treatment.progress}%</span>
                </div>
                <div className="h-3 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#F39200] to-amber-400"
                    style={{ width: `${treatment.progress}%` }}
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{isAr ? 'تاريخ البدء' : 'Start Date'}</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {new Date(treatment.startDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{isAr ? 'تاريخ الاستحقاق' : 'Due Date'}</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {new Date(treatment.dueDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tasks Card */}
          <Card className="bg-white dark:bg-[#2E2D2C] border-gray-100 dark:border-gray-700 shadow-sm">
            <CardHeader className="border-b border-gray-100 dark:border-gray-700 flex flex-row items-center justify-between">
              <CardTitle className="text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-[#F39200]" />
                {isAr ? 'المهام التنفيذية' : 'Tasks'}
                <Badge variant="secondary" className="ms-2">{treatment.tasks?.length || 0}</Badge>
              </CardTitle>
              {isEditing && (
                <Button size="sm" onClick={addTask} className="bg-[#F39200] hover:bg-[#e08600]">
                  <Plus className="h-4 w-4 me-1" />
                  {isAr ? 'إضافة مهمة' : 'Add Task'}
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-4">
              {(isEditing ? formData.tasks : treatment.tasks)?.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <ListChecks className="mx-auto h-10 w-10 mb-2 opacity-50" />
                  <p>{isAr ? 'لا توجد مهام' : 'No tasks'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(isEditing ? formData.tasks : treatment.tasks)?.map((task, index) => (
                    <div
                      key={task.id}
                      className="p-4 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30"
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
            </CardContent>
          </Card>
        </div>

        {/* Risk Details - Right Column */}
        <div className="space-y-6">
          {/* Risk Info Card */}
          <Card className="bg-white dark:bg-[#2E2D2C] border-gray-100 dark:border-gray-700 shadow-sm">
            <CardHeader className="border-b border-gray-100 dark:border-gray-700">
              <CardTitle className="text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-500" />
                {isAr ? 'تفاصيل الخطر' : 'Risk Details'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Risk Number & Rating */}
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                  {treatment.risk.riskNumber}
                </span>
                <Badge className={`${ratingConf.bg} ${ratingConf.text}`}>
                  {isAr ? ratingConf.label.ar : ratingConf.label.en}
                </Badge>
              </div>

              {/* Risk Title */}
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{isAr ? 'عنوان الخطر' : 'Risk Title'}</p>
                <p className="font-semibold text-gray-800 dark:text-gray-100">
                  {isAr ? treatment.risk.titleAr : treatment.risk.titleEn}
                </p>
              </div>

              {/* Department */}
              {treatment.risk.department && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Building2 className="h-4 w-4" />
                  <span>{isAr ? treatment.risk.department.nameAr : treatment.risk.department.nameEn}</span>
                </div>
              )}

              {/* Owner */}
              {treatment.risk.owner && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <User className="h-4 w-4" />
                  <span>{isAr ? treatment.risk.owner.fullName : treatment.risk.owner.fullNameEn || treatment.risk.owner.fullName}</span>
                </div>
              )}

              {/* Risk Scores */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="text-center p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{isAr ? 'الدرجة الكامنة' : 'Inherent Score'}</p>
                  <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{treatment.risk.inherentScore}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{isAr ? 'الدرجة المتبقية' : 'Residual Score'}</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {treatment.risk.residualScore || '-'}
                  </p>
                </div>
              </div>

              {/* Causes */}
              {(treatment.risk.causesAr || treatment.risk.causesEn) && (
                <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                    {isAr ? 'أسباب الخطر' : 'Risk Causes'}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {isAr ? treatment.risk.causesAr : treatment.risk.causesEn}
                  </p>
                </div>
              )}

              {/* Consequences */}
              {(treatment.risk.consequencesAr || treatment.risk.consequencesEn) && (
                <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                    {isAr ? 'عواقب الخطر' : 'Risk Consequences'}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {isAr ? treatment.risk.consequencesAr : treatment.risk.consequencesEn}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
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
    </div>
  );
}
