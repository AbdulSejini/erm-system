'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import {
  Plus,
  Search,
  Wrench,
  Calendar,
  User,
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
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Target,
  ListChecks,
  AlertTriangle,
  FileText,
  Zap,
  Loader2,
  X,
  Pencil,
} from 'lucide-react';
import type { TreatmentStatus, TreatmentStrategy, RiskRating } from '@/types';

// Interface for API Risk data
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
}

// Normalize rating function
const normalizeRating = (rating: string | null | undefined): RiskRating => {
  if (!rating) return 'Moderate';
  if (rating === 'Catastrophic') return 'Critical';
  if (['Critical', 'Major', 'Moderate', 'Minor', 'Negligible'].includes(rating)) {
    return rating as RiskRating;
  }
  return 'Moderate';
};

// Determine treatment strategy based on risk
const determineStrategy = (status: string, inherentScore: number): TreatmentStrategy => {
  if (status === 'accepted') return 'accept';
  if (inherentScore >= 20) return 'reduce';
  if (inherentScore >= 12) return 'transfer';
  if (inherentScore >= 6) return 'reduce';
  return 'accept';
};

// Determine treatment status
const determineTreatmentStatus = (status: string, followUpDate: string | null): TreatmentStatus => {
  if (status === 'closed' || status === 'mitigated') return 'completed';
  if (followUpDate && new Date(followUpDate) < new Date()) return 'overdue';
  if (status === 'inProgress') return 'inProgress';
  return 'notStarted';
};

// Calculate progress based on status
const calculateProgress = (status: string, residualScore: number | null, inherentScore: number): number => {
  if (status === 'closed' || status === 'mitigated') return 100;
  if (status === 'accepted') return 100;
  if (!residualScore) return 0;
  const reduction = ((inherentScore - residualScore) / inherentScore) * 100;
  return Math.min(Math.max(Math.round(reduction), 0), 95);
};

// Keep for fallback when no API data
const mockTreatments = [
  {
    id: '1',
    riskNumber: 'FIN-R-001',
    riskTitleAr: 'خطر تأخر توريد المواد الخام',
    riskTitleEn: 'Raw Material Supply Delay Risk',
    riskRating: 'Critical' as RiskRating,
    inherentScore: 20,
    currentResidualScore: 12,
    targetResidualScore: 6,
    titleAr: 'تنويع مصادر التوريد',
    titleEn: 'Diversify Supply Sources',
    descriptionAr: 'التعاقد مع موردين بديلين لضمان استمرارية التوريد',
    descriptionEn: 'Contract with alternative suppliers to ensure supply continuity',
    strategy: 'reduce' as TreatmentStrategy,
    status: 'inProgress' as TreatmentStatus,
    progress: 65,
    responsibleAr: 'أحمد محمد',
    responsibleEn: 'Ahmed Mohammed',
    departmentAr: 'المشتريات',
    departmentEn: 'Procurement',
    startDate: '2025-11-01',
    dueDate: '2026-02-15',
    tasks: [
      { id: '1', titleAr: 'تحديد الموردين البديلين', titleEn: 'Identify alternative suppliers', completed: true },
      { id: '2', titleAr: 'تقييم جودة المنتجات', titleEn: 'Evaluate product quality', completed: true },
      { id: '3', titleAr: 'التفاوض على الأسعار', titleEn: 'Negotiate prices', completed: true },
      { id: '4', titleAr: 'توقيع العقود', titleEn: 'Sign contracts', completed: true },
      { id: '5', titleAr: 'تجربة الدفعة الأولى', titleEn: 'Test first batch', completed: false },
      { id: '6', titleAr: 'تقييم الأداء', titleEn: 'Evaluate performance', completed: false },
    ],
    kris: [
      { nameAr: 'عدد الموردين المعتمدين', nameEn: 'Number of approved suppliers', current: 3, target: 5 },
      { nameAr: 'متوسط وقت التسليم', nameEn: 'Average delivery time', current: 14, target: 7, unit: (isAr: boolean) => isAr ? 'يوم' : 'days' },
    ],
  },
  {
    id: '2',
    riskNumber: 'FIN-R-002',
    riskTitleAr: 'خطر تقلبات أسعار النحاس',
    riskTitleEn: 'Copper Price Fluctuation Risk',
    riskRating: 'Major' as RiskRating,
    inherentScore: 16,
    currentResidualScore: 12,
    targetResidualScore: 8,
    titleAr: 'التحوط بعقود آجلة',
    titleEn: 'Hedging with Forward Contracts',
    descriptionAr: 'استخدام العقود الآجلة للتحوط ضد تقلبات الأسعار',
    descriptionEn: 'Use forward contracts to hedge against price fluctuations',
    strategy: 'transfer' as TreatmentStrategy,
    status: 'notStarted' as TreatmentStatus,
    progress: 0,
    responsibleAr: 'سارة علي',
    responsibleEn: 'Sarah Ali',
    departmentAr: 'المالية',
    departmentEn: 'Finance',
    startDate: '2026-02-01',
    dueDate: '2026-03-01',
    tasks: [
      { id: '1', titleAr: 'دراسة خيارات التحوط', titleEn: 'Study hedging options', completed: false },
      { id: '2', titleAr: 'اختيار المؤسسة المالية', titleEn: 'Select financial institution', completed: false },
      { id: '3', titleAr: 'توقيع اتفاقية التحوط', titleEn: 'Sign hedging agreement', completed: false },
      { id: '4', titleAr: 'تنفيذ العقود الآجلة', titleEn: 'Execute forward contracts', completed: false },
    ],
    kris: [
      { nameAr: 'نسبة التحوط', nameEn: 'Hedging ratio', current: 0, target: 70, unit: () => '%' },
    ],
  },
  {
    id: '3',
    riskNumber: 'OPS-R-001',
    riskTitleAr: 'خطر انقطاع الكهرباء',
    riskTitleEn: 'Power Outage Risk',
    riskRating: 'Moderate' as RiskRating,
    inherentScore: 12,
    currentResidualScore: 4,
    targetResidualScore: 4,
    titleAr: 'تركيب مولدات احتياطية',
    titleEn: 'Install Backup Generators',
    descriptionAr: 'تركيب مولدات احتياطية لضمان استمرارية العمليات',
    descriptionEn: 'Install backup generators to ensure operational continuity',
    strategy: 'reduce' as TreatmentStrategy,
    status: 'completed' as TreatmentStatus,
    progress: 100,
    responsibleAr: 'خالد أحمد',
    responsibleEn: 'Khalid Ahmed',
    departmentAr: 'الصيانة',
    departmentEn: 'Maintenance',
    startDate: '2025-10-01',
    dueDate: '2026-01-10',
    tasks: [
      { id: '1', titleAr: 'دراسة الاحتياجات', titleEn: 'Study requirements', completed: true },
      { id: '2', titleAr: 'اختيار المورد', titleEn: 'Select vendor', completed: true },
      { id: '3', titleAr: 'شراء المولدات', titleEn: 'Purchase generators', completed: true },
      { id: '4', titleAr: 'التركيب', titleEn: 'Installation', completed: true },
      { id: '5', titleAr: 'الاختبار والتشغيل', titleEn: 'Testing and operation', completed: true },
    ],
    kris: [
      { nameAr: 'وقت الاستجابة للطوارئ', nameEn: 'Emergency response time', current: 30, target: 30, unit: (isAr: boolean) => isAr ? 'ثانية' : 'seconds' },
    ],
  },
  {
    id: '4',
    riskNumber: 'TECH-R-001',
    riskTitleAr: 'خطر الأمن السيبراني',
    riskTitleEn: 'Cybersecurity Risk',
    riskRating: 'Critical' as RiskRating,
    inherentScore: 25,
    currentResidualScore: 15,
    targetResidualScore: 8,
    titleAr: 'تحديث جدار الحماية',
    titleEn: 'Update Firewall',
    descriptionAr: 'تحديث وتعزيز أنظمة الحماية السيبرانية',
    descriptionEn: 'Update and enhance cybersecurity protection systems',
    strategy: 'reduce' as TreatmentStrategy,
    status: 'overdue' as TreatmentStatus,
    progress: 30,
    responsibleAr: 'محمد عبدالله',
    responsibleEn: 'Mohammed Abdullah',
    departmentAr: 'تقنية المعلومات',
    departmentEn: 'IT',
    startDate: '2025-11-15',
    dueDate: '2026-01-05',
    tasks: [
      { id: '1', titleAr: 'تقييم الوضع الحالي', titleEn: 'Assess current state', completed: true },
      { id: '2', titleAr: 'اختيار الحلول', titleEn: 'Select solutions', completed: true },
      { id: '3', titleAr: 'شراء التراخيص', titleEn: 'Purchase licenses', completed: false },
      { id: '4', titleAr: 'التركيب والإعداد', titleEn: 'Installation and setup', completed: false },
      { id: '5', titleAr: 'الاختبار', titleEn: 'Testing', completed: false },
      { id: '6', titleAr: 'التشغيل الفعلي', titleEn: 'Go live', completed: false },
      { id: '7', titleAr: 'التدريب', titleEn: 'Training', completed: false },
    ],
    kris: [
      { nameAr: 'عدد محاولات الاختراق المحجوبة', nameEn: 'Blocked intrusion attempts', current: 1200, target: 1500, unit: () => '' },
      { nameAr: 'وقت اكتشاف التهديدات', nameEn: 'Threat detection time', current: 45, target: 15, unit: (isAr: boolean) => isAr ? 'دقيقة' : 'min' },
    ],
  },
  {
    id: '5',
    riskNumber: 'HSE-R-001',
    riskTitleAr: 'خطر الإصابات المهنية',
    riskTitleEn: 'Occupational Injury Risk',
    riskRating: 'Minor' as RiskRating,
    inherentScore: 8,
    currentResidualScore: 4,
    targetResidualScore: 2,
    titleAr: 'قبول الخطر مع المراقبة',
    titleEn: 'Accept Risk with Monitoring',
    descriptionAr: 'قبول مستوى الخطر الحالي مع تعزيز إجراءات المراقبة',
    descriptionEn: 'Accept current risk level with enhanced monitoring procedures',
    strategy: 'accept' as TreatmentStrategy,
    status: 'inProgress' as TreatmentStatus,
    progress: 80,
    responsibleAr: 'فاطمة حسن',
    responsibleEn: 'Fatima Hassan',
    departmentAr: 'السلامة',
    departmentEn: 'Safety',
    startDate: '2025-12-01',
    dueDate: '2026-01-31',
    tasks: [
      { id: '1', titleAr: 'توثيق قرار القبول', titleEn: 'Document acceptance decision', completed: true },
      { id: '2', titleAr: 'إعداد خطة المراقبة', titleEn: 'Prepare monitoring plan', completed: true },
      { id: '3', titleAr: 'تحديد مؤشرات الأداء', titleEn: 'Define KPIs', completed: true },
      { id: '4', titleAr: 'بدء المراقبة الدورية', titleEn: 'Start periodic monitoring', completed: true },
      { id: '5', titleAr: 'التقرير الأول', titleEn: 'First report', completed: false },
    ],
    kris: [
      { nameAr: 'معدل الإصابات لكل 1000 ساعة عمل', nameEn: 'Injury rate per 1000 work hours', current: 0.5, target: 0.3, unit: () => '' },
    ],
  },
];

// Strategy descriptions for guidance
const strategyDescriptions = {
  avoid: {
    ar: 'تجنب الخطر عن طريق عدم القيام بالنشاط المسبب له أو تغيير طريقة تنفيذه بشكل جذري',
    en: 'Avoid the risk by not performing the activity that causes it or fundamentally changing how it is executed',
    examples: {
      ar: 'إلغاء مشروع عالي المخاطر، الانسحاب من سوق غير مستقر',
      en: 'Cancel high-risk project, exit unstable market',
    },
  },
  reduce: {
    ar: 'تقليل احتمالية حدوث الخطر أو تأثيره من خلال إجراءات رقابية إضافية',
    en: 'Reduce the likelihood or impact of the risk through additional control measures',
    examples: {
      ar: 'تركيب أنظمة إطفاء حريق، تدريب الموظفين، إضافة نقاط تفتيش',
      en: 'Install fire suppression systems, train employees, add checkpoints',
    },
  },
  transfer: {
    ar: 'نقل الخطر كلياً أو جزئياً إلى طرف ثالث مثل شركات التأمين أو المقاولين',
    en: 'Transfer the risk wholly or partially to a third party such as insurance companies or contractors',
    examples: {
      ar: 'شراء تأمين، التعاقد الخارجي، عقود آجلة للتحوط',
      en: 'Purchase insurance, outsourcing, forward contracts for hedging',
    },
  },
  accept: {
    ar: 'قبول الخطر عندما تكون تكلفة المعالجة أعلى من الأثر المحتمل أو عندما يكون الخطر ضمن الحدود المقبولة',
    en: 'Accept the risk when treatment cost exceeds potential impact or when risk is within acceptable limits',
    examples: {
      ar: 'المخاطر ذات التأثير المنخفض، المخاطر المتبقية بعد التخفيف',
      en: 'Low-impact risks, residual risks after mitigation',
    },
  },
};

export default function TreatmentPage() {
  const { t, language } = useTranslation();
  const isAr = language === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState<string | null>(null);
  const [showStrategyGuide, setShowStrategyGuide] = useState(false);
  const [filterStatus, setFilterStatus] = useState<TreatmentStatus | 'all'>('all');
  const [filterStrategy, setFilterStrategy] = useState<TreatmentStrategy | 'all'>('all');
  const [wizardStep, setWizardStep] = useState(1);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // State for API data
  const [risks, setRisks] = useState<APIRisk[]>([]);
  const [loading, setLoading] = useState(true);

  // State for wizard form
  const [selectedRiskId, setSelectedRiskId] = useState<string | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<TreatmentStrategy | null>(null);
  const [planTitle, setPlanTitle] = useState('');
  const [responsibleId, setResponsibleId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [tasks, setTasks] = useState<{ id: string; titleAr: string; titleEn: string }[]>([]);
  const [newTaskTitleAr, setNewTaskTitleAr] = useState('');
  const [newTaskTitleEn, setNewTaskTitleEn] = useState('');
  const [riskSearchQuery, setRiskSearchQuery] = useState('');
  const [responsibleOptions, setResponsibleOptions] = useState<{ id: string; name: string; nameEn: string; role: string }[]>([]);
  const [allResponsibleUsers, setAllResponsibleUsers] = useState<{ id: string; name: string; nameEn: string; role: string }[]>([]);
  const [responsibleSearchQuery, setResponsibleSearchQuery] = useState('');
  const [showResponsibleDropdown, setShowResponsibleDropdown] = useState(false);

  // State for editing treatment
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTreatmentId, setEditingTreatmentId] = useState<string | null>(null);
  const [editWizardStep, setEditWizardStep] = useState(1);

  // Fetch risks from API
  useEffect(() => {
    const fetchRisks = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/risks');
        const result = await response.json();

        if (result.success && result.data) {
          setRisks(result.data);
        }
      } catch (err) {
        console.error('Error fetching risks:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRisks();
  }, []);

  // Fetch all potential responsible users (riskManager, riskAnalyst, riskChampion, employee) + Risk Owners
  useEffect(() => {
    const fetchResponsibleUsers = async () => {
      try {
        // Fetch users with allowed roles
        const usersResponse = await fetch('/api/users');
        const usersResult = await usersResponse.json();

        const allUsers: { id: string; name: string; nameEn: string; role: string }[] = [];

        if (usersResult.success && usersResult.data) {
          // Filter users: riskManager, riskAnalyst, riskChampion, employee (NOT admin)
          const filteredUsers = usersResult.data
            .filter((user: { role: string; status: string }) =>
              ['riskManager', 'riskAnalyst', 'riskChampion', 'employee'].includes(user.role) &&
              user.status === 'active'
            )
            .map((user: { id: string; fullName: string; fullNameEn: string | null; role: string }) => ({
              id: user.id,
              name: user.fullName,
              nameEn: user.fullNameEn || user.fullName,
              role: getRoleLabel(user.role, isAr),
            }));
          allUsers.push(...filteredUsers);
        }

        // Fetch Risk Owners
        const riskOwnersResponse = await fetch('/api/risk-owners');
        const riskOwnersResult = await riskOwnersResponse.json();

        if (riskOwnersResult.success && riskOwnersResult.data) {
          const riskOwners = riskOwnersResult.data.map((owner: { id: string; nameAr: string; nameEn: string | null }) => ({
            id: `riskOwner_${owner.id}`, // Prefix to distinguish from users
            name: owner.nameAr,
            nameEn: owner.nameEn || owner.nameAr,
            role: isAr ? 'مالك خطر' : 'Risk Owner',
          }));
          allUsers.push(...riskOwners);
        }

        setAllResponsibleUsers(allUsers);
      } catch (err) {
        console.error('Error fetching responsible users:', err);
      }
    };

    fetchResponsibleUsers();
  }, [isAr]);

  // Helper function to get role label
  const getRoleLabel = (role: string, isArabic: boolean): string => {
    const roleLabels: Record<string, { ar: string; en: string }> = {
      riskManager: { ar: 'مدير المخاطر', en: 'Risk Manager' },
      riskAnalyst: { ar: 'محلل المخاطر', en: 'Risk Analyst' },
      riskChampion: { ar: 'رائد المخاطر', en: 'Risk Champion' },
      employee: { ar: 'موظف', en: 'Employee' },
    };
    return roleLabels[role]?.[isArabic ? 'ar' : 'en'] || role;
  };

  // Update responsible options when a risk is selected (combine risk-specific + all users)
  useEffect(() => {
    const options: { id: string; name: string; nameEn: string; role: string }[] = [];

    if (selectedRiskId) {
      const selectedRisk = risks.find(r => r.id === selectedRiskId);
      if (selectedRisk) {
        // Add risk owner (priority)
        if (selectedRisk.owner) {
          options.push({
            id: selectedRisk.owner.id,
            name: selectedRisk.owner.fullName,
            nameEn: selectedRisk.owner.fullNameEn || selectedRisk.owner.fullName,
            role: isAr ? 'مالك الخطر' : 'Risk Owner',
          });
        }

        // Add risk champion (from risk)
        if (selectedRisk.champion) {
          const exists = options.some(o => o.id === selectedRisk.champion!.id);
          if (!exists) {
            options.push({
              id: selectedRisk.champion.id,
              name: selectedRisk.champion.fullName,
              nameEn: selectedRisk.champion.fullNameEn || selectedRisk.champion.fullName,
              role: isAr ? 'رائد الخطر' : 'Risk Champion',
            });
          }
        }

        // Add department risk champion
        if (selectedRisk.department?.riskChampion) {
          const exists = options.some(o => o.id === selectedRisk.department!.riskChampion!.id);
          if (!exists) {
            options.push({
              id: selectedRisk.department.riskChampion.id,
              name: selectedRisk.department.riskChampion.fullName,
              nameEn: selectedRisk.department.riskChampion.fullNameEn || selectedRisk.department.riskChampion.fullName,
              role: isAr ? 'رائد مخاطر القسم' : 'Department Risk Champion',
            });
          }
        }
      }
    }

    // Add all other responsible users that are not already in the list
    for (const user of allResponsibleUsers) {
      const exists = options.some(o => o.id === user.id);
      if (!exists) {
        options.push(user);
      }
    }

    setResponsibleOptions(options);

    // Auto-select risk owner if available and no selection yet
    if (selectedRiskId && options.length > 0 && !responsibleId) {
      setResponsibleId(options[0].id);
      setResponsibleSearchQuery(isAr ? options[0].name : options[0].nameEn);
    }
  }, [selectedRiskId, risks, isAr, allResponsibleUsers]);

  // Reset wizard form when modal closes
  const resetWizardForm = () => {
    setSelectedRiskId(null);
    setSelectedStrategy(null);
    setPlanTitle('');
    setResponsibleId(null);
    setResponsibleSearchQuery('');
    setShowResponsibleDropdown(false);
    setDueDate('');
    setTasks([]);
    setNewTaskTitleAr('');
    setNewTaskTitleEn('');
    setRiskSearchQuery('');
    setWizardStep(1);
  };

  // Open edit modal with existing treatment data
  const openEditModal = (treatmentId: string) => {
    const treatment = treatments.find(t => t.id === treatmentId);
    if (!treatment) return;

    setEditingTreatmentId(treatmentId);
    setSelectedRiskId(treatmentId); // Risk ID is same as treatment ID in current implementation
    setSelectedStrategy(treatment.strategy);
    setPlanTitle(isAr ? treatment.titleAr : treatment.titleEn);
    setDueDate(treatment.dueDate);
    setTasks(treatment.tasks.map(t => ({
      id: t.id,
      titleAr: t.titleAr,
      titleEn: t.titleEn,
    })));

    // Find responsible from options
    const responsible = responsibleOptions.find(
      o => (isAr ? o.name : o.nameEn) === (isAr ? treatment.responsibleAr : treatment.responsibleEn)
    );
    if (responsible) {
      setResponsibleId(responsible.id);
      setResponsibleSearchQuery(isAr ? responsible.name : responsible.nameEn);
    }

    setEditWizardStep(1);
    setShowEditModal(true);
  };

  // Reset edit form
  const resetEditForm = () => {
    setEditingTreatmentId(null);
    setSelectedRiskId(null);
    setSelectedStrategy(null);
    setPlanTitle('');
    setResponsibleId(null);
    setResponsibleSearchQuery('');
    setShowResponsibleDropdown(false);
    setDueDate('');
    setTasks([]);
    setNewTaskTitleAr('');
    setNewTaskTitleEn('');
    setEditWizardStep(1);
  };

  // Close responsible dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.responsible-dropdown-container')) {
        setShowResponsibleDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Add a new task
  const addTask = () => {
    if (newTaskTitleAr.trim() || newTaskTitleEn.trim()) {
      setTasks([
        ...tasks,
        {
          id: Date.now().toString(),
          titleAr: newTaskTitleAr.trim() || newTaskTitleEn.trim(),
          titleEn: newTaskTitleEn.trim() || newTaskTitleAr.trim(),
        },
      ]);
      setNewTaskTitleAr('');
      setNewTaskTitleEn('');
    }
  };

  // Remove a task
  const removeTask = (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  // Filter risks for selection
  const filteredRisksForSelection = risks.filter(risk => {
    if (!riskSearchQuery) return true;
    const query = riskSearchQuery.toLowerCase();
    return (
      risk.riskNumber.toLowerCase().includes(query) ||
      risk.titleAr.includes(riskSearchQuery) ||
      risk.titleEn.toLowerCase().includes(query)
    );
  });

  // Get selected risk details
  const selectedRisk = selectedRiskId ? risks.find(r => r.id === selectedRiskId) : null;

  // Generate treatments from risks
  const treatments = useMemo(() => {
    if (risks.length === 0) return mockTreatments;

    return risks.map(risk => {
      const strategy = determineStrategy(risk.status, risk.inherentScore || 9);
      const treatmentStatus = determineTreatmentStatus(risk.status, risk.followUpDate);
      const progress = calculateProgress(risk.status, risk.residualScore, risk.inherentScore || 9);

      // Generate pseudo tasks based on mitigation actions
      const tasks = risk.mitigationActionsAr || risk.mitigationActionsEn
        ? [
            { id: '1', titleAr: 'تحليل الخطر', titleEn: 'Analyze risk', completed: true },
            { id: '2', titleAr: 'تحديد خطة المعالجة', titleEn: 'Define treatment plan', completed: progress > 20 },
            { id: '3', titleAr: 'تنفيذ الإجراءات', titleEn: 'Implement actions', completed: progress > 50 },
            { id: '4', titleAr: 'مراجعة الفعالية', titleEn: 'Review effectiveness', completed: progress > 80 },
          ]
        : [
            { id: '1', titleAr: 'تحليل الخطر', titleEn: 'Analyze risk', completed: false },
            { id: '2', titleAr: 'تحديد خطة المعالجة', titleEn: 'Define treatment plan', completed: false },
          ];

      return {
        id: risk.id,
        riskNumber: risk.riskNumber,
        riskTitleAr: risk.titleAr,
        riskTitleEn: risk.titleEn,
        riskRating: normalizeRating(risk.inherentRating),
        inherentScore: risk.inherentScore || 9,
        currentResidualScore: risk.residualScore || risk.inherentScore || 9,
        targetResidualScore: Math.max(4, Math.floor((risk.inherentScore || 9) * 0.4)),
        titleAr: risk.mitigationActionsAr || 'خطة معالجة الخطر',
        titleEn: risk.mitigationActionsEn || 'Risk Treatment Plan',
        descriptionAr: risk.mitigationActionsAr || 'إجراءات التخفيف من الخطر',
        descriptionEn: risk.mitigationActionsEn || 'Risk mitigation actions',
        strategy: strategy,
        status: treatmentStatus,
        progress: progress,
        responsibleAr: risk.owner?.fullName || 'غير محدد',
        responsibleEn: risk.owner?.fullNameEn || risk.owner?.fullName || 'Not assigned',
        departmentAr: risk.department?.nameAr || 'عام',
        departmentEn: risk.department?.nameEn || 'General',
        startDate: risk.createdAt ? new Date(risk.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        dueDate: risk.followUpDate
          ? new Date(risk.followUpDate).toISOString().split('T')[0]
          : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        tasks: tasks,
        kris: [
          {
            nameAr: 'نسبة التخفيض',
            nameEn: 'Reduction percentage',
            current: risk.residualScore ? Math.round(((risk.inherentScore || 9) - risk.residualScore) / (risk.inherentScore || 9) * 100) : 0,
            target: 60,
            unit: () => '%'
          },
        ],
      };
    });
  }, [risks]);

  const getRatingColor = (rating: RiskRating) => {
    switch (rating) {
      case 'Critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'Major':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'Moderate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Minor':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Negligible':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: TreatmentStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-[var(--status-success)]" />;
      case 'inProgress':
        return <Clock className="h-4 w-4 text-[var(--status-warning)]" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-[var(--status-error)]" />;
      default:
        return <Clock className="h-4 w-4 text-[var(--foreground-muted)]" />;
    }
  };

  const getStatusColor = (status: TreatmentStatus): 'success' | 'warning' | 'danger' | 'default' => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'inProgress':
        return 'warning';
      case 'overdue':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getStrategyIcon = (strategy: TreatmentStrategy) => {
    switch (strategy) {
      case 'avoid':
        return <Ban className="h-4 w-4" />;
      case 'reduce':
        return <TrendingDown className="h-4 w-4" />;
      case 'transfer':
        return <Share2 className="h-4 w-4" />;
      case 'accept':
        return <Check className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getStrategyColor = (strategy: TreatmentStrategy): 'info' | 'success' | 'warning' | 'default' => {
    switch (strategy) {
      case 'avoid':
        return 'info';
      case 'reduce':
        return 'success';
      case 'transfer':
        return 'warning';
      default:
        return 'default';
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

  const filteredTreatments = treatments.filter((treatment) => {
    const matchesSearch =
      treatment.riskNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      treatment.titleAr.includes(searchQuery) ||
      treatment.titleEn.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || treatment.status === filterStatus;
    const matchesStrategy = filterStrategy === 'all' || treatment.strategy === filterStrategy;
    return matchesSearch && matchesStatus && matchesStrategy;
  });

  // Stats
  const stats = {
    total: treatments.length,
    completed: treatments.filter((t) => t.status === 'completed').length,
    inProgress: treatments.filter((t) => t.status === 'inProgress').length,
    overdue: treatments.filter((t) => t.status === 'overdue').length,
    notStarted: treatments.filter((t) => t.status === 'notStarted').length,
    avgProgress: treatments.length > 0 ? Math.round(treatments.reduce((sum, t) => sum + t.progress, 0) / treatments.length) : 0,
  };

  // Calculate effectiveness
  const effectiveness = treatments
    .filter((t) => t.status === 'completed')
    .map((t) => ((t.inherentScore - t.currentResidualScore) / t.inherentScore) * 100);
  const avgEffectiveness = effectiveness.length > 0 ? Math.round(effectiveness.reduce((a, b) => a + b, 0) / effectiveness.length) : 0;

  // Show loading state
  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
          <p className="text-sm text-[var(--foreground-secondary)]">
            {isAr ? 'جاري تحميل البيانات...' : 'Loading data...'}
          </p>
        </div>
      </div>
    );
  }

  // Wizard steps for adding treatment
  const wizardSteps = [
    { id: 1, labelAr: 'اختيار الخطر', labelEn: 'Select Risk' },
    { id: 2, labelAr: 'استراتيجية المعالجة', labelEn: 'Treatment Strategy' },
    { id: 3, labelAr: 'تفاصيل الخطة', labelEn: 'Plan Details' },
    { id: 4, labelAr: 'المهام', labelEn: 'Tasks' },
    { id: 5, labelAr: 'المراجعة', labelEn: 'Review' },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--foreground)] truncate">
            {t('treatment.title')}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[var(--foreground-secondary)]">
            {isAr
              ? 'إدارة ومتابعة خطط معالجة المخاطر وتتبع تقدم التنفيذ'
              : 'Manage and track risk treatment plans and implementation progress'}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />}
            onClick={() => setShowStrategyGuide(true)}
          >
            <span className="text-xs sm:text-sm">{isAr ? 'دليل الاستراتيجيات' : 'Strategy Guide'}</span>
          </Button>
          <Button size="sm" leftIcon={<Plus className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />} onClick={() => setShowAddModal(true)}>
            <span className="text-xs sm:text-sm">{t('treatment.addPlan')}</span>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
        <Card className="p-2 sm:p-3 md:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-[var(--primary-light)] shrink-0">
              <Wrench className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--primary)]" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--foreground)]">{stats.total}</p>
              <p className="text-[10px] sm:text-xs text-[var(--foreground-secondary)] truncate">
                {isAr ? 'إجمالي الخطط' : 'Total Plans'}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-2 sm:p-3 md:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-[var(--status-success)]/10 shrink-0">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--status-success)]" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--foreground)]">{stats.completed}</p>
              <p className="text-[10px] sm:text-xs text-[var(--foreground-secondary)] truncate">
                {t('treatment.statuses.completed')}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-2 sm:p-3 md:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-[var(--status-warning)]/10 shrink-0">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--status-warning)]" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--foreground)]">{stats.inProgress}</p>
              <p className="text-[10px] sm:text-xs text-[var(--foreground-secondary)] truncate">
                {t('treatment.statuses.inProgress')}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-2 sm:p-3 md:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-[var(--status-error)]/10 shrink-0">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--status-error)]" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--foreground)]">{stats.overdue}</p>
              <p className="text-[10px] sm:text-xs text-[var(--foreground-secondary)] truncate">
                {t('treatment.statuses.overdue')}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-2 sm:p-3 md:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30 shrink-0">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--foreground)]">{avgEffectiveness}%</p>
              <p className="text-[10px] sm:text-xs text-[var(--foreground-secondary)] truncate">
                {isAr ? 'فعالية المعالجة' : 'Treatment Effectiveness'}
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
                placeholder={isAr ? 'بحث في خطط المعالجة...' : 'Search treatment plans...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />}
              />
            </div>
            <div className="flex gap-2 shrink-0">
              <select
                className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as TreatmentStatus | 'all')}
              >
                <option value="all">{isAr ? 'جميع الحالات' : 'All Statuses'}</option>
                <option value="notStarted">{isAr ? 'لم يبدأ' : 'Not Started'}</option>
                <option value="inProgress">{isAr ? 'قيد التنفيذ' : 'In Progress'}</option>
                <option value="completed">{isAr ? 'مكتمل' : 'Completed'}</option>
                <option value="overdue">{isAr ? 'متأخر' : 'Overdue'}</option>
              </select>
              <select
                className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
                value={filterStrategy}
                onChange={(e) => setFilterStrategy(e.target.value as TreatmentStrategy | 'all')}
              >
                <option value="all">{isAr ? 'جميع الاستراتيجيات' : 'All Strategies'}</option>
                <option value="avoid">{t('treatment.strategies.avoid')}</option>
                <option value="reduce">{t('treatment.strategies.reduce')}</option>
                <option value="transfer">{t('treatment.strategies.transfer')}</option>
                <option value="accept">{t('treatment.strategies.accept')}</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Treatment Cards */}
      <div className="space-y-2 sm:space-y-3 md:space-y-4">
        {filteredTreatments.map((treatment) => {
          const isExpanded = expandedCards.has(treatment.id);
          const completedTasks = treatment.tasks.filter((t) => t.completed).length;
          const reductionPercent = Math.round(
            ((treatment.inherentScore - treatment.currentResidualScore) / treatment.inherentScore) * 100
          );
          const targetReductionPercent = Math.round(
            ((treatment.inherentScore - treatment.targetResidualScore) / treatment.inherentScore) * 100
          );

          return (
            <Card key={treatment.id} className="overflow-hidden">
              {/* Main Card Content */}
              <div className="p-2 sm:p-3 md:p-4">
                {/* Header */}
                <div className="mb-2 sm:mb-3 md:mb-4 flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div
                      className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg shrink-0 ${
                        treatment.status === 'overdue'
                          ? 'bg-[var(--status-error)]/10'
                          : treatment.status === 'completed'
                          ? 'bg-[var(--status-success)]/10'
                          : 'bg-[var(--primary-light)]'
                      }`}
                    >
                      {getStrategyIcon(treatment.strategy)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                        <code className="rounded bg-[var(--background-tertiary)] px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs">
                          {treatment.riskNumber}
                        </code>
                        <span className={`rounded-full px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium ${getRatingColor(treatment.riskRating)}`}>
                          {isAr ? t(`risks.ratings.${treatment.riskRating}`) : treatment.riskRating}
                        </span>
                        {getStatusIcon(treatment.status)}
                        <Badge variant={getStatusColor(treatment.status)} size="sm">
                          {t(`treatment.statuses.${treatment.status}`)}
                        </Badge>
                      </div>
                      <h3 className="mt-1 text-sm sm:text-base font-semibold text-[var(--foreground)] truncate">
                        {isAr ? treatment.titleAr : treatment.titleEn}
                      </h3>
                      <p className="text-xs sm:text-sm text-[var(--foreground-secondary)] truncate">
                        {isAr ? treatment.riskTitleAr : treatment.riskTitleEn}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={getStrategyColor(treatment.strategy)}>
                      {getStrategyIcon(treatment.strategy)}
                      <span className="ms-1 text-[10px] sm:text-xs">{t(`treatment.strategies.${treatment.strategy}`)}</span>
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(treatment.id)}
                      className="p-1.5"
                    >
                      <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>

                {/* Progress & Stats Row */}
                <div className="mb-2 sm:mb-3 md:mb-4 grid gap-2 sm:gap-3 md:gap-4 sm:grid-cols-3">
                  {/* Progress */}
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-[var(--foreground-secondary)]">
                        {t('treatment.progress')}
                      </span>
                      <span className="font-medium text-[var(--foreground)]">
                        {treatment.progress}%
                      </span>
                    </div>
                    <div className="h-1.5 sm:h-2 overflow-hidden rounded-full bg-[var(--background-tertiary)]">
                      <div
                        className={`h-full rounded-full transition-all ${
                          treatment.status === 'completed'
                            ? 'bg-[var(--status-success)]'
                            : treatment.status === 'overdue'
                            ? 'bg-[var(--status-error)]'
                            : 'bg-[var(--primary)]'
                        }`}
                        style={{ width: `${treatment.progress}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[10px] sm:text-xs text-[var(--foreground-muted)]">
                      {completedTasks}/{treatment.tasks.length} {isAr ? 'مهام مكتملة' : 'tasks completed'}
                    </p>
                  </div>

                  {/* Risk Reduction */}
                  <div className="rounded-lg bg-[var(--background-secondary)] p-2 sm:p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-xs text-[var(--foreground-secondary)]">
                        {isAr ? 'تخفيض الخطر' : 'Risk Reduction'}
                      </span>
                      <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-[var(--status-success)] shrink-0" />
                    </div>
                    <div className="mt-1 flex items-baseline gap-1 sm:gap-2">
                      <span className="text-base sm:text-lg font-bold text-[var(--foreground)]">
                        {reductionPercent}%
                      </span>
                      <span className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">
                        ({treatment.inherentScore} → {treatment.currentResidualScore})
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] sm:text-xs text-[var(--foreground-muted)]">
                      {isAr ? 'الهدف:' : 'Target:'} {targetReductionPercent}%
                    </p>
                  </div>

                  {/* Timeline */}
                  <div className="rounded-lg bg-[var(--background-secondary)] p-2 sm:p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-xs text-[var(--foreground-secondary)]">
                        {isAr ? 'الجدول الزمني' : 'Timeline'}
                      </span>
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-[var(--foreground-muted)] shrink-0" />
                    </div>
                    <div className="mt-1 text-xs sm:text-sm">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="text-[var(--foreground-secondary)]">{isAr ? 'البداية:' : 'Start:'}</span>
                        <span className="font-medium">{new Date(treatment.startDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="text-[var(--foreground-secondary)]">{isAr ? 'الانتهاء:' : 'Due:'}</span>
                        <span className={`font-medium ${treatment.status === 'overdue' ? 'text-[var(--status-error)]' : ''}`}>
                          {new Date(treatment.dueDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Responsible & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 border-t border-[var(--border)] pt-2 sm:pt-3 md:pt-4">
                  <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-[var(--foreground-secondary)] min-w-0">
                    <div className="flex items-center gap-1 min-w-0">
                      <User className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                      <span className="truncate">{isAr ? treatment.responsibleAr : treatment.responsibleEn}</span>
                    </div>
                    <span className="text-[var(--foreground-muted)] shrink-0">•</span>
                    <span className="truncate">{isAr ? treatment.departmentAr : treatment.departmentEn}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleCardExpand(treatment.id)}
                    rightIcon={isExpanded ? <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" /> : <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />}
                  >
                    <span className="text-xs sm:text-sm">{isExpanded ? (isAr ? 'إخفاء التفاصيل' : 'Hide Details') : (isAr ? 'عرض التفاصيل' : 'Show Details')}</span>
                  </Button>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-[var(--border)] bg-[var(--background-secondary)] p-2 sm:p-3 md:p-4">
                  <div className="grid gap-3 sm:gap-4 md:gap-6 lg:grid-cols-2">
                    {/* Tasks */}
                    <div>
                      <h4 className="mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base font-semibold text-[var(--foreground)]">
                        <ListChecks className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                        {isAr ? 'المهام' : 'Tasks'}
                      </h4>
                      <div className="space-y-1.5 sm:space-y-2">
                        {treatment.tasks.map((task) => (
                          <div
                            key={task.id}
                            className={`flex items-center gap-2 sm:gap-3 rounded-lg border p-2 sm:p-3 ${
                              task.completed
                                ? 'border-[var(--status-success)]/30 bg-[var(--status-success)]/5'
                                : 'border-[var(--border)] bg-[var(--background)]'
                            }`}
                          >
                            <div
                              className={`flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full shrink-0 ${
                                task.completed
                                  ? 'bg-[var(--status-success)] text-white'
                                  : 'border-2 border-[var(--border)]'
                              }`}
                            >
                              {task.completed && <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
                            </div>
                            <span
                              className={`flex-1 text-xs sm:text-sm min-w-0 truncate ${
                                task.completed
                                  ? 'text-[var(--foreground-secondary)] line-through'
                                  : 'text-[var(--foreground)]'
                              }`}
                            >
                              {isAr ? task.titleAr : task.titleEn}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* KRIs */}
                    <div>
                      <h4 className="mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base font-semibold text-[var(--foreground)]">
                        <Zap className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                        {isAr ? 'مؤشرات المخاطر الرئيسية' : 'Key Risk Indicators'}
                      </h4>
                      <div className="space-y-2 sm:space-y-3">
                        {treatment.kris.map((kri, index) => {
                          const progress = Math.min(100, (kri.current / kri.target) * 100);
                          const isOnTarget = kri.current >= kri.target;
                          return (
                            <div
                              key={index}
                              className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-2 sm:p-3"
                            >
                              <div className="mb-1.5 sm:mb-2 flex items-center justify-between gap-2">
                                <span className="text-xs sm:text-sm font-medium text-[var(--foreground)] min-w-0 truncate">
                                  {isAr ? kri.nameAr : kri.nameEn}
                                </span>
                                <span
                                  className={`text-xs sm:text-sm font-bold shrink-0 ${
                                    isOnTarget ? 'text-[var(--status-success)]' : 'text-[var(--status-warning)]'
                                  }`}
                                >
                                  {kri.current} {kri.unit ? kri.unit(isAr) : ''}
                                </span>
                              </div>
                              <div className="h-1.5 sm:h-2 overflow-hidden rounded-full bg-[var(--background-tertiary)]">
                                <div
                                  className={`h-full rounded-full ${
                                    isOnTarget ? 'bg-[var(--status-success)]' : 'bg-[var(--status-warning)]'
                                  }`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <p className="mt-1 text-[10px] sm:text-xs text-[var(--foreground-muted)]">
                                {isAr ? 'الهدف:' : 'Target:'} {kri.target} {kri.unit ? kri.unit(isAr) : ''}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Description */}
                      <div className="mt-3 sm:mt-4 rounded-lg border border-[var(--border)] bg-[var(--background)] p-2 sm:p-3">
                        <h5 className="mb-1.5 sm:mb-2 flex items-center gap-2 text-xs sm:text-sm font-medium text-[var(--foreground)]">
                          <FileText className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                          {isAr ? 'الوصف' : 'Description'}
                        </h5>
                        <p className="text-xs sm:text-sm text-[var(--foreground-secondary)]">
                          {isAr ? treatment.descriptionAr : treatment.descriptionEn}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredTreatments.length === 0 && (
        <Card className="p-4 sm:p-6 md:p-8 text-center">
          <Wrench className="mx-auto h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-[var(--foreground-muted)]" />
          <h3 className="mt-2 sm:mt-3 md:mt-4 text-sm sm:text-base font-semibold text-[var(--foreground)]">
            {isAr ? 'لا توجد خطط معالجة' : 'No Treatment Plans'}
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-[var(--foreground-secondary)]">
            {isAr
              ? 'لم يتم العثور على خطط معالجة تطابق البحث'
              : 'No treatment plans found matching your search'}
          </p>
        </Card>
      )}

      {/* Add Treatment Modal with Wizard */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetWizardForm();
        }}
        title={t('treatment.addPlan')}
        size="lg"
      >
        <div className="space-y-3 sm:space-y-4 md:space-y-6">
          {/* Wizard Steps */}
          <div className="flex items-center justify-between overflow-x-auto">
            {wizardSteps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className={`flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full text-xs sm:text-sm font-medium ${
                      wizardStep === step.id
                        ? 'bg-[var(--primary)] text-white'
                        : wizardStep > step.id
                        ? 'bg-[var(--status-success)] text-white'
                        : 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)]'
                    }`}
                  >
                    {wizardStep > step.id ? <Check className="h-3 w-3 sm:h-4 sm:w-4" /> : step.id}
                  </div>
                  <span className="mt-1 text-[10px] sm:text-xs text-[var(--foreground-secondary)] text-center max-w-[60px] sm:max-w-none truncate">
                    {isAr ? step.labelAr : step.labelEn}
                  </span>
                </div>
                {index < wizardSteps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-1 sm:mx-2 min-w-[20px] ${
                      wizardStep > step.id ? 'bg-[var(--status-success)]' : 'bg-[var(--background-tertiary)]'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step Content */}
          <div className="min-h-[150px] sm:min-h-[200px] rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] p-2 sm:p-3 md:p-4">
            {wizardStep === 1 && (
              <div>
                <h4 className="mb-2 sm:mb-3 text-sm sm:text-base font-semibold text-[var(--foreground)]">
                  {isAr ? 'اختر الخطر المراد معالجته' : 'Select the risk to treat'}
                </h4>
                <p className="mb-3 sm:mb-4 text-xs sm:text-sm text-[var(--foreground-secondary)]">
                  {isAr
                    ? 'اختر من قائمة المخاطر المسجلة التي تحتاج إلى خطة معالجة'
                    : 'Choose from the list of registered risks that need a treatment plan'}
                </p>
                {/* Search input */}
                <div className="mb-3">
                  <Input
                    placeholder={isAr ? 'البحث عن خطر...' : 'Search for a risk...'}
                    value={riskSearchQuery}
                    onChange={(e) => setRiskSearchQuery(e.target.value)}
                    leftIcon={<Search className="h-4 w-4" />}
                  />
                </div>
                {/* Risk selection list */}
                <div className="max-h-[250px] overflow-y-auto space-y-2">
                  {filteredRisksForSelection.length === 0 ? (
                    <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4 text-center text-sm text-[var(--foreground-muted)]">
                      {isAr ? 'لا توجد مخاطر متاحة' : 'No risks available'}
                    </div>
                  ) : (
                    filteredRisksForSelection.map((risk) => (
                      <button
                        key={risk.id}
                        onClick={() => setSelectedRiskId(risk.id)}
                        className={`w-full rounded-lg border p-3 text-start transition-colors ${
                          selectedRiskId === risk.id
                            ? 'border-[var(--primary)] bg-[var(--primary-light)]'
                            : 'border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary)]/50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <code className="shrink-0 rounded bg-[var(--background-tertiary)] px-1.5 py-0.5 text-[10px] sm:text-xs">
                              {risk.riskNumber}
                            </code>
                            <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${getRatingColor(normalizeRating(risk.inherentRating))}`}>
                              {normalizeRating(risk.inherentRating)}
                            </span>
                          </div>
                          {selectedRiskId === risk.id && (
                            <Check className="h-4 w-4 text-[var(--primary)] shrink-0" />
                          )}
                        </div>
                        <p className="mt-1 text-sm font-medium text-[var(--foreground)] truncate">
                          {isAr ? risk.titleAr : risk.titleEn}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--foreground-muted)] truncate">
                          {risk.department ? (isAr ? risk.department.nameAr : risk.department.nameEn) : '-'}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div>
                <h4 className="mb-2 sm:mb-3 text-sm sm:text-base font-semibold text-[var(--foreground)]">
                  {isAr ? 'اختر استراتيجية المعالجة' : 'Select treatment strategy'}
                </h4>
                {selectedRisk && (
                  <div className="mb-3 p-2 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                    <p className="text-xs text-[var(--foreground-muted)]">
                      {isAr ? 'الخطر المختار:' : 'Selected risk:'}
                    </p>
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      {selectedRisk.riskNumber} - {isAr ? selectedRisk.titleAr : selectedRisk.titleEn}
                    </p>
                  </div>
                )}
                <div className="grid gap-2 sm:gap-3 sm:grid-cols-2">
                  {(['avoid', 'reduce', 'transfer', 'accept'] as TreatmentStrategy[]).map((strategy) => (
                    <button
                      key={strategy}
                      onClick={() => setSelectedStrategy(strategy)}
                      className={`rounded-lg border p-2 sm:p-3 md:p-4 text-start transition-colors ${
                        selectedStrategy === strategy
                          ? 'border-[var(--primary)] bg-[var(--primary-light)]'
                          : 'border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary)]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {getStrategyIcon(strategy)}
                          <span className="text-xs sm:text-sm font-medium text-[var(--foreground)]">
                            {t(`treatment.strategies.${strategy}`)}
                          </span>
                        </div>
                        {selectedStrategy === strategy && (
                          <Check className="h-4 w-4 text-[var(--primary)] shrink-0" />
                        )}
                      </div>
                      <p className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-[var(--foreground-secondary)]">
                        {isAr ? strategyDescriptions[strategy].ar : strategyDescriptions[strategy].en}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <div>
                <h4 className="mb-2 sm:mb-3 text-sm sm:text-base font-semibold text-[var(--foreground)]">
                  {isAr ? 'تفاصيل خطة المعالجة' : 'Treatment plan details'}
                </h4>
                {/* Selected risk and strategy summary */}
                {selectedRisk && selectedStrategy && (
                  <div className="mb-3 p-2 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <span className="text-[var(--foreground-muted)]">{isAr ? 'الخطر:' : 'Risk:'}</span>
                        <span className="ms-1 font-medium text-[var(--foreground)]">{selectedRisk.riskNumber}</span>
                      </div>
                      <div>
                        <span className="text-[var(--foreground-muted)]">{isAr ? 'الاستراتيجية:' : 'Strategy:'}</span>
                        <span className="ms-1 font-medium text-[var(--foreground)]">{t(`treatment.strategies.${selectedStrategy}`)}</span>
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="mb-1 block text-xs sm:text-sm text-[var(--foreground-secondary)]">
                      {isAr ? 'عنوان الخطة' : 'Plan Title'}
                    </label>
                    <Input
                      placeholder={isAr ? 'أدخل عنوان الخطة' : 'Enter plan title'}
                      value={planTitle}
                      onChange={(e) => setPlanTitle(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2 sm:gap-3 md:gap-4 sm:grid-cols-2">
                    <div className="relative responsible-dropdown-container">
                      <label className="mb-1 block text-xs sm:text-sm text-[var(--foreground-secondary)]">
                        {isAr ? 'المسؤول' : 'Responsible'}
                      </label>
                      <div className="relative">
                        <Input
                          placeholder={isAr ? 'ابحث عن المسؤول...' : 'Search for responsible...'}
                          value={responsibleSearchQuery}
                          onChange={(e) => {
                            setResponsibleSearchQuery(e.target.value);
                            setShowResponsibleDropdown(true);
                            // Clear selection if user is typing
                            if (responsibleId) {
                              const selected = responsibleOptions.find(o => o.id === responsibleId);
                              const displayName = selected ? (isAr ? selected.name : selected.nameEn) : '';
                              if (e.target.value !== displayName) {
                                setResponsibleId(null);
                              }
                            }
                          }}
                          onFocus={() => setShowResponsibleDropdown(true)}
                          leftIcon={<User className="h-4 w-4" />}
                        />
                        {/* Dropdown */}
                        {showResponsibleDropdown && (
                          <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--background)] shadow-lg">
                            {responsibleOptions
                              .filter(option => {
                                if (!responsibleSearchQuery) return true;
                                const query = responsibleSearchQuery.toLowerCase();
                                return (
                                  option.name.toLowerCase().includes(query) ||
                                  option.nameEn.toLowerCase().includes(query) ||
                                  option.role.toLowerCase().includes(query)
                                );
                              })
                              .slice(0, 10)
                              .map((option) => (
                                <button
                                  key={option.id}
                                  type="button"
                                  onClick={() => {
                                    setResponsibleId(option.id);
                                    setResponsibleSearchQuery(isAr ? option.name : option.nameEn);
                                    setShowResponsibleDropdown(false);
                                  }}
                                  className={`w-full px-3 py-2 text-start text-sm hover:bg-[var(--background-secondary)] ${
                                    responsibleId === option.id ? 'bg-[var(--primary-light)]' : ''
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-[var(--foreground)]">
                                      {isAr ? option.name : option.nameEn}
                                    </span>
                                    {responsibleId === option.id && (
                                      <Check className="h-4 w-4 text-[var(--primary)]" />
                                    )}
                                  </div>
                                  <span className="text-xs text-[var(--foreground-muted)]">
                                    {option.role}
                                  </span>
                                </button>
                              ))}
                            {responsibleOptions.filter(option => {
                              if (!responsibleSearchQuery) return true;
                              const query = responsibleSearchQuery.toLowerCase();
                              return (
                                option.name.toLowerCase().includes(query) ||
                                option.nameEn.toLowerCase().includes(query) ||
                                option.role.toLowerCase().includes(query)
                              );
                            }).length === 0 && (
                              <div className="px-3 py-2 text-sm text-[var(--foreground-muted)]">
                                {isAr ? 'لا توجد نتائج' : 'No results found'}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {/* Selected indicator */}
                      {responsibleId && (
                        <p className="mt-1 text-xs text-[var(--status-success)]">
                          {isAr ? '✓ تم اختيار المسؤول' : '✓ Responsible selected'}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-xs sm:text-sm text-[var(--foreground-secondary)]">
                        {isAr ? 'تاريخ الانتهاء' : 'Due Date'}
                      </label>
                      <Input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {wizardStep === 4 && (
              <div>
                <h4 className="mb-2 sm:mb-3 text-sm sm:text-base font-semibold text-[var(--foreground)]">
                  {isAr ? 'إضافة المهام' : 'Add Tasks'}
                </h4>
                <p className="mb-3 text-xs sm:text-sm text-[var(--foreground-secondary)]">
                  {isAr
                    ? 'قم بتقسيم خطة المعالجة إلى مهام قابلة للتتبع'
                    : 'Break down the treatment plan into trackable tasks'}
                </p>

                {/* Task input form */}
                <div className="mb-4 p-3 rounded-lg border border-[var(--border)] bg-[var(--background)]">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs text-[var(--foreground-secondary)]">
                        {isAr ? 'عنوان المهمة (عربي)' : 'Task Title (Arabic)'}
                      </label>
                      <Input
                        placeholder={isAr ? 'أدخل عنوان المهمة بالعربية' : 'Enter task title in Arabic'}
                        value={newTaskTitleAr}
                        onChange={(e) => setNewTaskTitleAr(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-[var(--foreground-secondary)]">
                        {isAr ? 'عنوان المهمة (إنجليزي)' : 'Task Title (English)'}
                      </label>
                      <Input
                        placeholder={isAr ? 'أدخل عنوان المهمة بالإنجليزية' : 'Enter task title in English'}
                        value={newTaskTitleEn}
                        onChange={(e) => setNewTaskTitleEn(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Plus className="h-4 w-4" />}
                      onClick={addTask}
                      disabled={!newTaskTitleAr.trim() && !newTaskTitleEn.trim()}
                    >
                      <span className="text-xs sm:text-sm">{isAr ? 'إضافة مهمة' : 'Add Task'}</span>
                    </Button>
                  </div>
                </div>

                {/* Tasks list */}
                {tasks.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-[var(--foreground-secondary)]">
                      {isAr ? `المهام المضافة (${tasks.length})` : `Added Tasks (${tasks.length})`}
                    </p>
                    {tasks.map((task, index) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] p-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--background-tertiary)] text-xs font-medium">
                            {index + 1}
                          </span>
                          <span className="text-sm text-[var(--foreground)] truncate">
                            {isAr ? task.titleAr : task.titleEn}
                          </span>
                        </div>
                        <button
                          onClick={() => removeTask(task.id)}
                          className="shrink-0 p-1 text-[var(--foreground-muted)] hover:text-[var(--status-error)] transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-[var(--border)] p-4 text-center">
                    <ListChecks className="mx-auto h-8 w-8 text-[var(--foreground-muted)]" />
                    <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                      {isAr ? 'لم يتم إضافة أي مهام بعد' : 'No tasks added yet'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {wizardStep === 5 && (
              <div>
                <h4 className="mb-2 sm:mb-3 text-sm sm:text-base font-semibold text-[var(--foreground)]">
                  {isAr ? 'مراجعة وحفظ' : 'Review and Save'}
                </h4>
                <p className="mb-3 text-xs sm:text-sm text-[var(--foreground-secondary)]">
                  {isAr
                    ? 'راجع تفاصيل خطة المعالجة قبل الحفظ'
                    : 'Review treatment plan details before saving'}
                </p>

                {/* Summary */}
                <div className="space-y-3">
                  {/* Risk */}
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
                    <p className="text-xs text-[var(--foreground-muted)] mb-1">{isAr ? 'الخطر' : 'Risk'}</p>
                    {selectedRisk ? (
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        {selectedRisk.riskNumber} - {isAr ? selectedRisk.titleAr : selectedRisk.titleEn}
                      </p>
                    ) : (
                      <p className="text-sm text-[var(--status-error)]">{isAr ? 'لم يتم اختيار خطر' : 'No risk selected'}</p>
                    )}
                  </div>

                  {/* Strategy */}
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
                    <p className="text-xs text-[var(--foreground-muted)] mb-1">{isAr ? 'الاستراتيجية' : 'Strategy'}</p>
                    {selectedStrategy ? (
                      <div className="flex items-center gap-2">
                        {getStrategyIcon(selectedStrategy)}
                        <span className="text-sm font-medium text-[var(--foreground)]">
                          {t(`treatment.strategies.${selectedStrategy}`)}
                        </span>
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--status-error)]">{isAr ? 'لم يتم اختيار استراتيجية' : 'No strategy selected'}</p>
                    )}
                  </div>

                  {/* Plan Details */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
                      <p className="text-xs text-[var(--foreground-muted)] mb-1">{isAr ? 'عنوان الخطة' : 'Plan Title'}</p>
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        {planTitle || (isAr ? 'غير محدد' : 'Not specified')}
                      </p>
                    </div>
                    <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
                      <p className="text-xs text-[var(--foreground-muted)] mb-1">{isAr ? 'تاريخ الانتهاء' : 'Due Date'}</p>
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        {dueDate ? new Date(dueDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US') : (isAr ? 'غير محدد' : 'Not specified')}
                      </p>
                    </div>
                  </div>

                  {/* Responsible */}
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
                    <p className="text-xs text-[var(--foreground-muted)] mb-1">{isAr ? 'المسؤول' : 'Responsible'}</p>
                    {responsibleId ? (
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        {(() => {
                          const responsible = responsibleOptions.find(o => o.id === responsibleId);
                          return responsible ? (isAr ? `${responsible.name} (${responsible.role})` : `${responsible.nameEn} (${responsible.role})`) : '-';
                        })()}
                      </p>
                    ) : (
                      <p className="text-sm text-[var(--status-error)]">{isAr ? 'لم يتم اختيار مسؤول' : 'No responsible selected'}</p>
                    )}
                  </div>

                  {/* Tasks */}
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
                    <p className="text-xs text-[var(--foreground-muted)] mb-1">{isAr ? 'المهام' : 'Tasks'}</p>
                    {tasks.length > 0 ? (
                      <ul className="text-sm space-y-1">
                        {tasks.map((task, index) => (
                          <li key={task.id} className="flex items-center gap-2 text-[var(--foreground)]">
                            <span className="text-[var(--foreground-muted)]">{index + 1}.</span>
                            {isAr ? task.titleAr : task.titleEn}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-[var(--foreground-muted)]">{isAr ? 'لا توجد مهام' : 'No tasks'}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Guidance Panel */}
          <div className="rounded-lg border border-[var(--primary)]/30 bg-[var(--primary-light)] p-2 sm:p-3 md:p-4">
            <div className="flex gap-2 sm:gap-3">
              <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-[var(--primary)]" />
              <div className="min-w-0">
                <h5 className="text-xs sm:text-sm font-medium text-[var(--foreground)]">
                  {isAr ? 'نصيحة' : 'Tip'}
                </h5>
                <p className="mt-1 text-[10px] sm:text-xs md:text-sm text-[var(--foreground-secondary)]">
                  {wizardStep === 1 && (isAr
                    ? 'ابدأ بالمخاطر ذات التصنيف الحرج (Critical) أو الرئيسي (Major) لأنها تتطلب معالجة عاجلة'
                    : 'Start with Critical or Major rated risks as they require urgent treatment')}
                  {wizardStep === 2 && (isAr
                    ? 'استراتيجية التخفيف (Reduce) هي الأكثر شيوعاً وتناسب معظم المخاطر التشغيلية'
                    : 'The Reduce strategy is most common and suits most operational risks')}
                  {wizardStep === 3 && (isAr
                    ? 'حدد مسؤولاً واضحاً لكل خطة معالجة لضمان المتابعة والمساءلة'
                    : 'Assign a clear owner for each treatment plan to ensure accountability')}
                  {wizardStep === 4 && (isAr
                    ? 'قسم الخطة إلى مهام صغيرة يمكن إنجازها في أسبوع أو أقل'
                    : 'Break down the plan into small tasks that can be completed in a week or less')}
                  {wizardStep === 5 && (isAr
                    ? 'تأكد من مراجعة جميع التفاصيل قبل الحفظ'
                    : 'Make sure to review all details before saving')}
                </p>
              </div>
            </div>
          </div>
        </div>
        <ModalFooter>
          <Button variant="outline" size="sm" onClick={() => {
            setShowAddModal(false);
            resetWizardForm();
          }}>
            <span className="text-xs sm:text-sm">{t('common.cancel')}</span>
          </Button>
          <div className="flex gap-2">
            {wizardStep > 1 && (
              <Button variant="outline" size="sm" onClick={() => setWizardStep(wizardStep - 1)}>
                <ArrowLeft className="me-1 sm:me-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="text-xs sm:text-sm">{isAr ? 'السابق' : 'Previous'}</span>
              </Button>
            )}
            {wizardStep < 5 ? (
              <Button
                size="sm"
                onClick={() => setWizardStep(wizardStep + 1)}
                disabled={
                  (wizardStep === 1 && !selectedRiskId) ||
                  (wizardStep === 2 && !selectedStrategy)
                }
              >
                <span className="text-xs sm:text-sm">{isAr ? 'التالي' : 'Next'}</span>
                <ArrowRight className="ms-1 sm:ms-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => {
                  // TODO: Implement save functionality
                  setShowAddModal(false);
                  resetWizardForm();
                }}
                disabled={!selectedRiskId || !selectedStrategy}
              >
                <Check className="me-1 sm:me-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="text-xs sm:text-sm">{t('common.save')}</span>
              </Button>
            )}
          </div>
        </ModalFooter>
      </Modal>

      {/* Edit Treatment Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetEditForm();
        }}
        title={isAr ? 'تعديل خطة المعالجة' : 'Edit Treatment Plan'}
        size="lg"
      >
        <div className="space-y-3 sm:space-y-4 md:space-y-6">
          {/* Edit Wizard Steps */}
          <div className="flex items-center justify-between overflow-x-auto">
            {[
              { id: 1, labelAr: 'الاستراتيجية', labelEn: 'Strategy' },
              { id: 2, labelAr: 'تفاصيل الخطة', labelEn: 'Plan Details' },
              { id: 3, labelAr: 'المهام', labelEn: 'Tasks' },
              { id: 4, labelAr: 'المراجعة', labelEn: 'Review' },
            ].map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className={`flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full text-xs sm:text-sm font-medium ${
                      editWizardStep === step.id
                        ? 'bg-[var(--primary)] text-white'
                        : editWizardStep > step.id
                        ? 'bg-[var(--status-success)] text-white'
                        : 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)]'
                    }`}
                  >
                    {editWizardStep > step.id ? <Check className="h-3 w-3 sm:h-4 sm:w-4" /> : step.id}
                  </div>
                  <span className="mt-1 text-[10px] sm:text-xs text-[var(--foreground-secondary)] text-center max-w-[60px] sm:max-w-none truncate">
                    {isAr ? step.labelAr : step.labelEn}
                  </span>
                </div>
                {index < 3 && (
                  <div
                    className={`h-0.5 flex-1 mx-1 sm:mx-2 min-w-[20px] ${
                      editWizardStep > step.id ? 'bg-[var(--status-success)]' : 'bg-[var(--background-tertiary)]'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Edit Step Content */}
          <div className="min-h-[150px] sm:min-h-[200px] rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] p-2 sm:p-3 md:p-4">
            {/* Show selected risk info */}
            {editingTreatmentId && (
              <div className="mb-3 p-2 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                <p className="text-xs text-[var(--foreground-muted)]">
                  {isAr ? 'الخطر:' : 'Risk:'}
                </p>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {(() => {
                    const treatment = treatments.find(t => t.id === editingTreatmentId);
                    return treatment ? `${treatment.riskNumber} - ${isAr ? treatment.riskTitleAr : treatment.riskTitleEn}` : '-';
                  })()}
                </p>
              </div>
            )}

            {editWizardStep === 1 && (
              <div>
                <h4 className="mb-2 sm:mb-3 text-sm sm:text-base font-semibold text-[var(--foreground)]">
                  {isAr ? 'تعديل استراتيجية المعالجة' : 'Edit treatment strategy'}
                </h4>
                <div className="grid gap-2 sm:gap-3 sm:grid-cols-2">
                  {(['avoid', 'reduce', 'transfer', 'accept'] as TreatmentStrategy[]).map((strategy) => (
                    <button
                      key={strategy}
                      onClick={() => setSelectedStrategy(strategy)}
                      className={`rounded-lg border p-2 sm:p-3 md:p-4 text-start transition-colors ${
                        selectedStrategy === strategy
                          ? 'border-[var(--primary)] bg-[var(--primary-light)]'
                          : 'border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary)]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {getStrategyIcon(strategy)}
                          <span className="text-xs sm:text-sm font-medium text-[var(--foreground)]">
                            {t(`treatment.strategies.${strategy}`)}
                          </span>
                        </div>
                        {selectedStrategy === strategy && (
                          <Check className="h-4 w-4 text-[var(--primary)] shrink-0" />
                        )}
                      </div>
                      <p className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-[var(--foreground-secondary)]">
                        {isAr ? strategyDescriptions[strategy].ar : strategyDescriptions[strategy].en}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {editWizardStep === 2 && (
              <div>
                <h4 className="mb-2 sm:mb-3 text-sm sm:text-base font-semibold text-[var(--foreground)]">
                  {isAr ? 'تعديل تفاصيل الخطة' : 'Edit plan details'}
                </h4>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="mb-1 block text-xs sm:text-sm text-[var(--foreground-secondary)]">
                      {isAr ? 'عنوان الخطة' : 'Plan Title'}
                    </label>
                    <Input
                      placeholder={isAr ? 'أدخل عنوان الخطة' : 'Enter plan title'}
                      value={planTitle}
                      onChange={(e) => setPlanTitle(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2 sm:gap-3 md:gap-4 sm:grid-cols-2">
                    <div className="relative responsible-dropdown-container">
                      <label className="mb-1 block text-xs sm:text-sm text-[var(--foreground-secondary)]">
                        {isAr ? 'المسؤول' : 'Responsible'}
                      </label>
                      <div className="relative">
                        <Input
                          placeholder={isAr ? 'ابحث عن المسؤول...' : 'Search for responsible...'}
                          value={responsibleSearchQuery}
                          onChange={(e) => {
                            setResponsibleSearchQuery(e.target.value);
                            setShowResponsibleDropdown(true);
                            if (responsibleId) {
                              const selected = responsibleOptions.find(o => o.id === responsibleId);
                              const displayName = selected ? (isAr ? selected.name : selected.nameEn) : '';
                              if (e.target.value !== displayName) {
                                setResponsibleId(null);
                              }
                            }
                          }}
                          onFocus={() => setShowResponsibleDropdown(true)}
                          leftIcon={<User className="h-4 w-4" />}
                        />
                        {showResponsibleDropdown && (
                          <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--background)] shadow-lg">
                            {responsibleOptions
                              .filter(option => {
                                if (!responsibleSearchQuery) return true;
                                const query = responsibleSearchQuery.toLowerCase();
                                return (
                                  option.name.toLowerCase().includes(query) ||
                                  option.nameEn.toLowerCase().includes(query) ||
                                  option.role.toLowerCase().includes(query)
                                );
                              })
                              .slice(0, 10)
                              .map((option) => (
                                <button
                                  key={option.id}
                                  type="button"
                                  onClick={() => {
                                    setResponsibleId(option.id);
                                    setResponsibleSearchQuery(isAr ? option.name : option.nameEn);
                                    setShowResponsibleDropdown(false);
                                  }}
                                  className={`w-full px-3 py-2 text-start text-sm hover:bg-[var(--background-secondary)] ${
                                    responsibleId === option.id ? 'bg-[var(--primary-light)]' : ''
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-[var(--foreground)]">
                                      {isAr ? option.name : option.nameEn}
                                    </span>
                                    {responsibleId === option.id && (
                                      <Check className="h-4 w-4 text-[var(--primary)]" />
                                    )}
                                  </div>
                                  <span className="text-xs text-[var(--foreground-muted)]">
                                    {option.role}
                                  </span>
                                </button>
                              ))}
                            {responsibleOptions.filter(option => {
                              if (!responsibleSearchQuery) return true;
                              const query = responsibleSearchQuery.toLowerCase();
                              return (
                                option.name.toLowerCase().includes(query) ||
                                option.nameEn.toLowerCase().includes(query) ||
                                option.role.toLowerCase().includes(query)
                              );
                            }).length === 0 && (
                              <div className="px-3 py-2 text-sm text-[var(--foreground-muted)]">
                                {isAr ? 'لا توجد نتائج' : 'No results found'}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {responsibleId && (
                        <p className="mt-1 text-xs text-[var(--status-success)]">
                          {isAr ? '✓ تم اختيار المسؤول' : '✓ Responsible selected'}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-xs sm:text-sm text-[var(--foreground-secondary)]">
                        {isAr ? 'تاريخ الانتهاء' : 'Due Date'}
                      </label>
                      <Input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {editWizardStep === 3 && (
              <div>
                <h4 className="mb-2 sm:mb-3 text-sm sm:text-base font-semibold text-[var(--foreground)]">
                  {isAr ? 'تعديل المهام' : 'Edit Tasks'}
                </h4>
                <p className="mb-3 text-xs sm:text-sm text-[var(--foreground-secondary)]">
                  {isAr
                    ? 'يمكنك إضافة أو حذف المهام'
                    : 'You can add or remove tasks'}
                </p>

                {/* Task input form */}
                <div className="mb-4 p-3 rounded-lg border border-[var(--border)] bg-[var(--background)]">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs text-[var(--foreground-secondary)]">
                        {isAr ? 'عنوان المهمة (عربي)' : 'Task Title (Arabic)'}
                      </label>
                      <Input
                        placeholder={isAr ? 'أدخل عنوان المهمة بالعربية' : 'Enter task title in Arabic'}
                        value={newTaskTitleAr}
                        onChange={(e) => setNewTaskTitleAr(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-[var(--foreground-secondary)]">
                        {isAr ? 'عنوان المهمة (إنجليزي)' : 'Task Title (English)'}
                      </label>
                      <Input
                        placeholder={isAr ? 'أدخل عنوان المهمة بالإنجليزية' : 'Enter task title in English'}
                        value={newTaskTitleEn}
                        onChange={(e) => setNewTaskTitleEn(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Plus className="h-4 w-4" />}
                      onClick={addTask}
                      disabled={!newTaskTitleAr.trim() && !newTaskTitleEn.trim()}
                    >
                      <span className="text-xs sm:text-sm">{isAr ? 'إضافة مهمة' : 'Add Task'}</span>
                    </Button>
                  </div>
                </div>

                {/* Tasks list */}
                {tasks.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-[var(--foreground-secondary)]">
                      {isAr ? `المهام (${tasks.length})` : `Tasks (${tasks.length})`}
                    </p>
                    {tasks.map((task, index) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] p-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--background-tertiary)] text-xs font-medium">
                            {index + 1}
                          </span>
                          <span className="text-sm text-[var(--foreground)] truncate">
                            {isAr ? task.titleAr : task.titleEn}
                          </span>
                        </div>
                        <button
                          onClick={() => removeTask(task.id)}
                          className="shrink-0 p-1 text-[var(--foreground-muted)] hover:text-[var(--status-error)] transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-[var(--border)] p-4 text-center">
                    <ListChecks className="mx-auto h-8 w-8 text-[var(--foreground-muted)]" />
                    <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                      {isAr ? 'لم يتم إضافة أي مهام بعد' : 'No tasks added yet'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {editWizardStep === 4 && (
              <div>
                <h4 className="mb-2 sm:mb-3 text-sm sm:text-base font-semibold text-[var(--foreground)]">
                  {isAr ? 'مراجعة التعديلات' : 'Review Changes'}
                </h4>
                <p className="mb-3 text-xs sm:text-sm text-[var(--foreground-secondary)]">
                  {isAr
                    ? 'راجع التعديلات قبل الحفظ'
                    : 'Review changes before saving'}
                </p>

                {/* Summary */}
                <div className="space-y-3">
                  {/* Strategy */}
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
                    <p className="text-xs text-[var(--foreground-muted)] mb-1">{isAr ? 'الاستراتيجية' : 'Strategy'}</p>
                    {selectedStrategy ? (
                      <div className="flex items-center gap-2">
                        {getStrategyIcon(selectedStrategy)}
                        <span className="text-sm font-medium text-[var(--foreground)]">
                          {t(`treatment.strategies.${selectedStrategy}`)}
                        </span>
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--status-error)]">{isAr ? 'لم يتم اختيار استراتيجية' : 'No strategy selected'}</p>
                    )}
                  </div>

                  {/* Plan Details */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
                      <p className="text-xs text-[var(--foreground-muted)] mb-1">{isAr ? 'عنوان الخطة' : 'Plan Title'}</p>
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        {planTitle || (isAr ? 'غير محدد' : 'Not specified')}
                      </p>
                    </div>
                    <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
                      <p className="text-xs text-[var(--foreground-muted)] mb-1">{isAr ? 'تاريخ الانتهاء' : 'Due Date'}</p>
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        {dueDate ? new Date(dueDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US') : (isAr ? 'غير محدد' : 'Not specified')}
                      </p>
                    </div>
                  </div>

                  {/* Responsible */}
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
                    <p className="text-xs text-[var(--foreground-muted)] mb-1">{isAr ? 'المسؤول' : 'Responsible'}</p>
                    {responsibleId ? (
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        {(() => {
                          const responsible = responsibleOptions.find(o => o.id === responsibleId);
                          return responsible ? (isAr ? `${responsible.name} (${responsible.role})` : `${responsible.nameEn} (${responsible.role})`) : '-';
                        })()}
                      </p>
                    ) : (
                      <p className="text-sm text-[var(--foreground-muted)]">{isAr ? 'غير محدد' : 'Not specified'}</p>
                    )}
                  </div>

                  {/* Tasks */}
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
                    <p className="text-xs text-[var(--foreground-muted)] mb-1">{isAr ? 'المهام' : 'Tasks'}</p>
                    {tasks.length > 0 ? (
                      <ul className="text-sm space-y-1">
                        {tasks.map((task, index) => (
                          <li key={task.id} className="flex items-center gap-2 text-[var(--foreground)]">
                            <span className="text-[var(--foreground-muted)]">{index + 1}.</span>
                            {isAr ? task.titleAr : task.titleEn}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-[var(--foreground-muted)]">{isAr ? 'لا توجد مهام' : 'No tasks'}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <ModalFooter>
          <Button variant="outline" size="sm" onClick={() => {
            setShowEditModal(false);
            resetEditForm();
          }}>
            <span className="text-xs sm:text-sm">{t('common.cancel')}</span>
          </Button>
          <div className="flex gap-2">
            {editWizardStep > 1 && (
              <Button variant="outline" size="sm" onClick={() => setEditWizardStep(editWizardStep - 1)}>
                <ArrowLeft className="me-1 sm:me-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="text-xs sm:text-sm">{isAr ? 'السابق' : 'Previous'}</span>
              </Button>
            )}
            {editWizardStep < 4 ? (
              <Button
                size="sm"
                onClick={() => setEditWizardStep(editWizardStep + 1)}
                disabled={editWizardStep === 1 && !selectedStrategy}
              >
                <span className="text-xs sm:text-sm">{isAr ? 'التالي' : 'Next'}</span>
                <ArrowRight className="ms-1 sm:ms-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => {
                  // TODO: Implement save edit functionality
                  setShowEditModal(false);
                  resetEditForm();
                }}
              >
                <Check className="me-1 sm:me-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="text-xs sm:text-sm">{isAr ? 'حفظ التعديلات' : 'Save Changes'}</span>
              </Button>
            )}
          </div>
        </ModalFooter>
      </Modal>

      {/* Strategy Guide Modal */}
      <Modal
        isOpen={showStrategyGuide}
        onClose={() => setShowStrategyGuide(false)}
        title={isAr ? 'دليل استراتيجيات المعالجة' : 'Treatment Strategies Guide'}
        size="lg"
      >
        <div className="space-y-2 sm:space-y-3 md:space-y-4">
          <p className="text-xs sm:text-sm text-[var(--foreground-secondary)]">
            {isAr
              ? 'استراتيجيات المعالجة الأربعة الرئيسية لإدارة المخاطر:'
              : 'The four main treatment strategies for risk management:'}
          </p>
          {(['avoid', 'reduce', 'transfer', 'accept'] as TreatmentStrategy[]).map((strategy) => (
            <div
              key={strategy}
              className="rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] p-2 sm:p-3 md:p-4"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div
                  className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg shrink-0 ${
                    strategy === 'avoid'
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      : strategy === 'reduce'
                      ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                      : strategy === 'transfer'
                      ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400'
                  }`}
                >
                  {getStrategyIcon(strategy)}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm sm:text-base font-semibold text-[var(--foreground)]">
                    {t(`treatment.strategies.${strategy}`)}
                  </h4>
                  <p className="text-xs sm:text-sm text-[var(--foreground-secondary)]">
                    {isAr ? strategyDescriptions[strategy].ar : strategyDescriptions[strategy].en}
                  </p>
                </div>
              </div>
              <div className="mt-2 sm:mt-3 rounded bg-[var(--background)] p-2 sm:p-3">
                <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">
                  <span className="font-medium">{isAr ? 'أمثلة:' : 'Examples:'}</span>{' '}
                  {isAr ? strategyDescriptions[strategy].examples.ar : strategyDescriptions[strategy].examples.en}
                </p>
              </div>
            </div>
          ))}
        </div>
        <ModalFooter>
          <Button size="sm" onClick={() => setShowStrategyGuide(false)}>
            <span className="text-xs sm:text-sm">{isAr ? 'فهمت' : 'Got it'}</span>
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
