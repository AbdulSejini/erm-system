'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import type { TreatmentStatus, TreatmentStrategy, RiskRating } from '@/types';

// Mock data with new rating system
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

  const filteredTreatments = mockTreatments.filter((treatment) => {
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
    total: mockTreatments.length,
    completed: mockTreatments.filter((t) => t.status === 'completed').length,
    inProgress: mockTreatments.filter((t) => t.status === 'inProgress').length,
    overdue: mockTreatments.filter((t) => t.status === 'overdue').length,
    notStarted: mockTreatments.filter((t) => t.status === 'notStarted').length,
    avgProgress: Math.round(mockTreatments.reduce((sum, t) => sum + t.progress, 0) / mockTreatments.length),
  };

  // Calculate effectiveness
  const effectiveness = mockTreatments
    .filter((t) => t.status === 'completed')
    .map((t) => ((t.inherentScore - t.currentResidualScore) / t.inherentScore) * 100);
  const avgEffectiveness = effectiveness.length > 0 ? Math.round(effectiveness.reduce((a, b) => a + b, 0) / effectiveness.length) : 0;

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
          setWizardStep(1);
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
                {/* Risk selection list would go here */}
                <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-2 sm:p-3 md:p-4 text-center text-xs sm:text-sm text-[var(--foreground-muted)]">
                  {isAr ? 'سيتم عرض قائمة المخاطر هنا' : 'Risk list will be displayed here'}
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div>
                <h4 className="mb-2 sm:mb-3 text-sm sm:text-base font-semibold text-[var(--foreground)]">
                  {isAr ? 'اختر استراتيجية المعالجة' : 'Select treatment strategy'}
                </h4>
                <div className="grid gap-2 sm:gap-3 sm:grid-cols-2">
                  {(['avoid', 'reduce', 'transfer', 'accept'] as TreatmentStrategy[]).map((strategy) => (
                    <button
                      key={strategy}
                      className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-2 sm:p-3 md:p-4 text-start transition-colors hover:border-[var(--primary)] hover:bg-[var(--primary-light)]"
                    >
                      <div className="flex items-center gap-2">
                        {getStrategyIcon(strategy)}
                        <span className="text-xs sm:text-sm font-medium text-[var(--foreground)]">
                          {t(`treatment.strategies.${strategy}`)}
                        </span>
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
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="mb-1 block text-xs sm:text-sm text-[var(--foreground-secondary)]">
                      {isAr ? 'عنوان الخطة' : 'Plan Title'}
                    </label>
                    <Input placeholder={isAr ? 'أدخل عنوان الخطة' : 'Enter plan title'} />
                  </div>
                  <div className="grid gap-2 sm:gap-3 md:gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs sm:text-sm text-[var(--foreground-secondary)]">
                        {isAr ? 'المسؤول' : 'Responsible'}
                      </label>
                      <Input placeholder={isAr ? 'اختر المسؤول' : 'Select responsible'} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs sm:text-sm text-[var(--foreground-secondary)]">
                        {isAr ? 'تاريخ الانتهاء' : 'Due Date'}
                      </label>
                      <Input type="date" />
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
                <p className="mb-3 sm:mb-4 text-xs sm:text-sm text-[var(--foreground-secondary)]">
                  {isAr
                    ? 'قم بتقسيم خطة المعالجة إلى مهام قابلة للتتبع'
                    : 'Break down the treatment plan into trackable tasks'}
                </p>
                <Button variant="outline" size="sm" leftIcon={<Plus className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />}>
                  <span className="text-xs sm:text-sm">{isAr ? 'إضافة مهمة' : 'Add Task'}</span>
                </Button>
              </div>
            )}

            {wizardStep === 5 && (
              <div>
                <h4 className="mb-2 sm:mb-3 text-sm sm:text-base font-semibold text-[var(--foreground)]">
                  {isAr ? 'مراجعة وحفظ' : 'Review and Save'}
                </h4>
                <p className="text-xs sm:text-sm text-[var(--foreground-secondary)]">
                  {isAr
                    ? 'راجع تفاصيل خطة المعالجة قبل الحفظ'
                    : 'Review treatment plan details before saving'}
                </p>
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
          <Button variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
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
              <Button size="sm" onClick={() => setWizardStep(wizardStep + 1)}>
                <span className="text-xs sm:text-sm">{isAr ? 'التالي' : 'Next'}</span>
                <ArrowRight className="ms-1 sm:ms-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
              </Button>
            ) : (
              <Button size="sm" onClick={() => setShowAddModal(false)}>
                <Check className="me-1 sm:me-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="text-xs sm:text-sm">{t('common.save')}</span>
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
