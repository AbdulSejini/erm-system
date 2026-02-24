'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTranslation } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Autocomplete } from '@/components/ui/Autocomplete';
import { RiskWizard } from '@/components/risks/RiskWizard';
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  Clock,
  Grid3X3,
  List,
  X,
  FileText,
  User,
  Calendar,
  Building2,
  Shield,
  RefreshCw,
  MessageSquare,
  ExternalLink,
  History,
  Activity,
  ArrowRight,
  Target,
  PenLine,
  Wrench,
  Minus,
  Loader2,
  ClipboardList,
  Gauge,
  Flame,
  ListChecks,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  SortAsc,
  SortDesc,
} from 'lucide-react';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { RiskDiscussion } from '@/components/RiskDiscussion';
import {
  type RiskRating,
  type RiskStatus,
  calculateRiskScore,
  getRiskRating,
} from '@/types';

// Interface for API category data
interface APICategory {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  color?: string | null;
  isActive: boolean;
}

interface APIRiskStatus {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  color?: string | null;
  icon?: string | null;
  isDefault: boolean;
  isActive: boolean;
  order: number;
}

interface ChangeLogEntry {
  id: string;
  changeType: string;
  changeCategory: string;
  fieldName: string | null;
  fieldNameAr: string | null;
  oldValue: string | null;
  newValue: string | null;
  description: string | null;
  descriptionAr: string | null;
  relatedEntityId: string | null;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    fullNameEn: string | null;
    avatar: string | null;
    role: string;
  };
}

interface TreatmentTask {
  id: string;
  titleAr: string;
  titleEn: string;
  status: string;
  dueDate: string;
  completedDate: string | null;
}

interface TreatmentPlan {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  strategy: string;
  status: string;
  startDate: string;
  dueDate: string;
  completionDate: string | null;
  progress: number;
  cost: number | null;
  responsible?: {
    id: string;
    fullName: string;
    fullNameEn: string | null;
  };
  tasks: TreatmentTask[];
}

interface RiskAssessment {
  id: string;
  assessmentType: string;
  likelihood: number;
  impact: number;
  score: number;
  rating: string;
  notesAr: string | null;
  notesEn: string | null;
  assessmentDate: string;
  assessedBy?: {
    id: string;
    fullName: string;
    fullNameEn: string | null;
  };
}

interface Incident {
  id: string;
  incidentNumber: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  status: string;
  severity: string;
  occurredAt: string;
  reportedBy?: {
    id: string;
    fullName: string;
    fullNameEn: string | null;
  };
}

import { hrRisks } from '@/data/hrRisks';

// Convert HR risks to match the page structure
const convertedHRRisks = hrRisks.map((hr) => ({
  id: `hr-${hr.id}`,
  riskNumber: hr.riskId,
  titleAr: hr.descriptionAr.substring(0, 50) + (hr.descriptionAr.length > 50 ? '...' : ''),
  titleEn: hr.descriptionEn.substring(0, 50) + (hr.descriptionEn.length > 50 ? '...' : ''),
  descriptionAr: hr.descriptionAr,
  descriptionEn: hr.descriptionEn,
  categoryCode: 'HR' as const,
  status: (hr.status === 'Open' ? 'open' : hr.status === 'In Progress' ? 'inProgress' : 'closed') as RiskStatus,
  departmentId: '',
  departmentAr: hr.departmentAr,
  departmentEn: hr.department,
  processAr: 'الموارد البشرية',
  processEn: 'Human Resources',
  ownerAr: hr.championName || 'غير محدد',
  ownerEn: hr.championName || 'Not Assigned',
  ownerId: undefined as string | undefined,
  championAr: hr.championName || 'غير محدد',
  championEn: hr.championName || 'Not Assigned',
  identifiedDate: hr.createdAt.toISOString().split('T')[0],
  inherentLikelihood: hr.likelihood,
  inherentImpact: hr.impact,
  inherentScore: hr.inherentScore,
  inherentRating: hr.inherentRating,
  residualLikelihood: hr.residualLikelihood || hr.likelihood,
  residualImpact: hr.residualImpact || hr.impact,
  residualScore: hr.residualScore || hr.inherentScore,
  residualRating: hr.residualRating || hr.inherentRating,
  issuedBy: 'Risk Register',
  potentialCauseAr: '',
  potentialCauseEn: '',
  potentialImpactAr: '',
  potentialImpactEn: '',
  layersOfProtectionAr: '',
  layersOfProtectionEn: '',
  krisAr: '',
  krisEn: '',
  mitigationActionsAr: '',
  mitigationActionsEn: '',
  processText: '',
  subProcessText: '',
  followUpDate: '',
  nextReviewDate: '',
  isDeleted: false,
  deletedAt: null as string | null,
  commentsCount: 0,
}));

// Mock data matching actual risk register structure
const mockRisks = [
  {
    id: '1',
    riskNumber: 'FIN-R-001',
    titleAr: 'خطر تقلبات أسعار النحاس',
    titleEn: 'Copper Price Fluctuation Risk',
    descriptionAr: 'تقلبات أسعار النحاس قد تؤثر سلباً على هوامش الربح وتكاليف الإنتاج',
    descriptionEn: 'Copper price fluctuations may negatively impact profit margins and production costs',
    categoryCode: 'FIN' as const,
    status: 'open' as RiskStatus,
    departmentId: '',
    departmentAr: 'المالية',
    departmentEn: 'Finance',
    processAr: 'المشتريات',
    processEn: 'Procurement',
    processText: 'المشتريات',
    subProcessAr: 'إدارة العقود',
    subProcessEn: 'Contract Management',
    subProcessText: 'إدارة العقود',
    ownerAr: 'سارة علي',
    ownerEn: 'Sarah Ali',
    ownerId: undefined as string | undefined,
    championAr: 'أحمد محمد',
    championEn: 'Ahmed Mohammed',
    identifiedDate: '2026-01-14',
    followUpDate: '',
    nextReviewDate: '',
    inherentLikelihood: 5,
    inherentImpact: 5,
    inherentScore: 25,
    inherentRating: 'Critical' as RiskRating,
    residualLikelihood: 4,
    residualImpact: 4,
    residualScore: 16,
    residualRating: 'Major' as RiskRating,
    issuedBy: 'KPMG',
    potentialCauseAr: 'تغيرات في أسعار السوق العالمية للنحاس',
    potentialCauseEn: 'Changes in global copper market prices',
    potentialImpactAr: 'انخفاض هوامش الربح وزيادة تكاليف الإنتاج',
    potentialImpactEn: 'Reduced profit margins and increased production costs',
    layersOfProtectionAr: '',
    layersOfProtectionEn: '',
    krisAr: '',
    krisEn: '',
    mitigationActionsAr: '',
    mitigationActionsEn: '',
    isDeleted: false,
    deletedAt: null as string | null,
    commentsCount: 0,
  },
  {
    id: '2',
    riskNumber: 'OPS-R-001',
    titleAr: 'خطر تأخر توريد المواد الخام',
    titleEn: 'Raw Material Supply Delay Risk',
    descriptionAr: 'تأخر توريد المواد الخام قد يؤدي إلى توقف خطوط الإنتاج',
    descriptionEn: 'Delayed raw material supply may cause production line stoppage',
    categoryCode: 'OPS',
    status: 'inProgress' as RiskStatus,
    departmentId: '',
    departmentAr: 'سلسلة التوريد',
    departmentEn: 'Supply Chain',
    processAr: 'المشتريات',
    processEn: 'Procurement',
    subProcessAr: 'إدارة الموردين',
    subProcessEn: 'Supplier Management',
    ownerAr: 'أحمد محمد',
    ownerEn: 'Ahmed Mohammed',
    ownerId: undefined as string | undefined,
    championAr: 'خالد أحمد',
    championEn: 'Khalid Ahmed',
    identifiedDate: '2026-01-15',
    inherentLikelihood: 4,
    inherentImpact: 4,
    inherentScore: 16,
    inherentRating: 'Major' as RiskRating,
    residualLikelihood: 3,
    residualImpact: 3,
    residualScore: 9,
    residualRating: 'Moderate' as RiskRating,
    issuedBy: 'Internal',
    potentialCauseAr: '',
    potentialCauseEn: '',
    potentialImpactAr: '',
    potentialImpactEn: '',
    layersOfProtectionAr: '',
    layersOfProtectionEn: '',
    krisAr: '',
    krisEn: '',
    mitigationActionsAr: '',
    mitigationActionsEn: '',
    processText: '',
    subProcessText: '',
    followUpDate: '',
    nextReviewDate: '',
    isDeleted: false,
    deletedAt: null as string | null,
    commentsCount: 0,
  },
  {
    id: '3',
    riskNumber: 'OPS-R-002',
    titleAr: 'خطر انقطاع الكهرباء',
    titleEn: 'Power Outage Risk',
    descriptionAr: 'انقطاع الكهرباء قد يؤدي إلى توقف الإنتاج وتلف المواد',
    descriptionEn: 'Power outages may lead to production stoppage and material damage',
    categoryCode: 'OPS',
    status: 'mitigated' as RiskStatus,
    departmentId: '',
    departmentAr: 'العمليات',
    departmentEn: 'Operations',
    processAr: 'الإنتاج',
    processEn: 'Production',
    ownerAr: 'خالد أحمد',
    ownerEn: 'Khalid Ahmed',
    ownerId: undefined as string | undefined,
    championAr: 'فاطمة حسن',
    championEn: 'Fatima Hassan',
    identifiedDate: '2026-01-13',
    inherentLikelihood: 3,
    inherentImpact: 4,
    inherentScore: 12,
    inherentRating: 'Moderate' as RiskRating,
    residualLikelihood: 2,
    residualImpact: 3,
    residualScore: 6,
    residualRating: 'Minor' as RiskRating,
    issuedBy: 'Internal',
    potentialCauseAr: '',
    potentialCauseEn: '',
    potentialImpactAr: '',
    potentialImpactEn: '',
    layersOfProtectionAr: '',
    layersOfProtectionEn: '',
    krisAr: '',
    krisEn: '',
    mitigationActionsAr: '',
    mitigationActionsEn: '',
    processText: '',
    subProcessText: '',
    followUpDate: '',
    nextReviewDate: '',
    isDeleted: false,
    deletedAt: null as string | null,
    commentsCount: 0,
  },
  {
    id: '4',
    riskNumber: 'TECH-R-001',
    titleAr: 'خطر الأمن السيبراني',
    titleEn: 'Cybersecurity Risk',
    descriptionAr: 'خطر الهجمات السيبرانية على أنظمة تقنية المعلومات',
    descriptionEn: 'Risk of cyber attacks on IT systems',
    categoryCode: 'TECH',
    status: 'open' as RiskStatus,
    departmentId: '',
    departmentAr: 'تقنية المعلومات',
    departmentEn: 'IT',
    processAr: 'الأمن السيبراني',
    processEn: 'Cybersecurity',
    ownerAr: 'محمد عبدالله',
    ownerEn: 'Mohammed Abdullah',
    ownerId: undefined as string | undefined,
    championAr: 'محمد عبدالله',
    championEn: 'Mohammed Abdullah',
    identifiedDate: '2026-01-10',
    inherentLikelihood: 4,
    inherentImpact: 5,
    inherentScore: 20,
    inherentRating: 'Critical' as RiskRating,
    residualLikelihood: 3,
    residualImpact: 4,
    residualScore: 12,
    residualRating: 'Moderate' as RiskRating,
    issuedBy: 'KPMG',
    potentialCauseAr: '',
    potentialCauseEn: '',
    potentialImpactAr: '',
    potentialImpactEn: '',
    layersOfProtectionAr: '',
    layersOfProtectionEn: '',
    krisAr: '',
    krisEn: '',
    mitigationActionsAr: '',
    mitigationActionsEn: '',
    processText: '',
    subProcessText: '',
    followUpDate: '',
    nextReviewDate: '',
    isDeleted: false,
    deletedAt: null as string | null,
    commentsCount: 0,
  },
  {
    id: '5',
    riskNumber: 'COMP-R-001',
    titleAr: 'خطر الامتثال البيئي',
    titleEn: 'Environmental Compliance Risk',
    descriptionAr: 'خطر عدم الامتثال للوائح البيئية المحلية والدولية',
    descriptionEn: 'Risk of non-compliance with local and international environmental regulations',
    categoryCode: 'COMP',
    status: 'open' as RiskStatus,
    departmentId: '',
    departmentAr: 'السلامة والبيئة',
    departmentEn: 'HSE',
    processAr: 'البيئة',
    processEn: 'Environment',
    ownerAr: 'فاطمة حسن',
    ownerEn: 'Fatima Hassan',
    ownerId: undefined as string | undefined,
    championAr: 'سارة علي',
    championEn: 'Sarah Ali',
    identifiedDate: '2026-01-12',
    inherentLikelihood: 2,
    inherentImpact: 3,
    inherentScore: 6,
    inherentRating: 'Minor' as RiskRating,
    residualLikelihood: 2,
    residualImpact: 2,
    residualScore: 4,
    residualRating: 'Negligible' as RiskRating,
    issuedBy: 'Internal',
    potentialCauseAr: '',
    potentialCauseEn: '',
    potentialImpactAr: '',
    potentialImpactEn: '',
    layersOfProtectionAr: '',
    layersOfProtectionEn: '',
    krisAr: '',
    krisEn: '',
    mitigationActionsAr: '',
    mitigationActionsEn: '',
    processText: '',
    subProcessText: '',
    followUpDate: '',
    nextReviewDate: '',
    isDeleted: false,
    deletedAt: null as string | null,
    commentsCount: 0,
  },
  {
    id: '6',
    riskNumber: 'HSE-R-001',
    titleAr: 'خطر إصابات العمل',
    titleEn: 'Workplace Injury Risk',
    descriptionAr: 'خطر الإصابات في موقع العمل نتيجة عدم الالتزام بمعايير السلامة',
    descriptionEn: 'Risk of workplace injuries due to non-compliance with safety standards',
    categoryCode: 'HSE',
    status: 'accepted' as RiskStatus,
    departmentId: '',
    departmentAr: 'السلامة والبيئة',
    departmentEn: 'HSE',
    processAr: 'السلامة المهنية',
    processEn: 'Occupational Safety',
    ownerAr: 'فاطمة حسن',
    ownerEn: 'Fatima Hassan',
    ownerId: undefined as string | undefined,
    championAr: 'خالد أحمد',
    championEn: 'Khalid Ahmed',
    identifiedDate: '2026-01-08',
    inherentLikelihood: 3,
    inherentImpact: 3,
    inherentScore: 9,
    inherentRating: 'Moderate' as RiskRating,
    residualLikelihood: 2,
    residualImpact: 2,
    residualScore: 4,
    residualRating: 'Negligible' as RiskRating,
    issuedBy: 'Internal',
    potentialCauseAr: '',
    potentialCauseEn: '',
    potentialImpactAr: '',
    potentialImpactEn: '',
    layersOfProtectionAr: '',
    layersOfProtectionEn: '',
    krisAr: '',
    krisEn: '',
    mitigationActionsAr: '',
    mitigationActionsEn: '',
    processText: '',
    subProcessText: '',
    followUpDate: '',
    nextReviewDate: '',
    isDeleted: false,
    deletedAt: null as string | null,
    commentsCount: 0,
  },
  // Include converted HR risks
  ...convertedHRRisks,
  // خطر محذوف للاختبار
  {
    id: 'deleted-1',
    riskNumber: 'DEL-R-001',
    titleAr: 'خطر محذوف - للاختبار',
    titleEn: 'Deleted Risk - For Testing',
    descriptionAr: 'هذا خطر تم حذفه للتأكد من عمل ميزة التمييز',
    descriptionEn: 'This is a deleted risk to verify the highlighting feature',
    categoryCode: 'OPS',
    status: 'closed' as RiskStatus,
    departmentId: '',
    departmentAr: 'تقنية المعلومات',
    departmentEn: 'IT',
    processAr: 'إدارة النظم',
    processEn: 'Systems Management',
    processText: 'إدارة النظم',
    subProcessAr: 'الصيانة',
    subProcessEn: 'Maintenance',
    subProcessText: 'الصيانة',
    ownerAr: 'النظام',
    ownerEn: 'System',
    ownerId: undefined as string | undefined,
    championAr: 'النظام',
    championEn: 'System',
    identifiedDate: '2026-01-01',
    followUpDate: '',
    nextReviewDate: '',
    inherentLikelihood: 2,
    inherentImpact: 2,
    inherentScore: 4,
    inherentRating: 'Negligible' as RiskRating,
    residualLikelihood: 1,
    residualImpact: 1,
    residualScore: 1,
    residualRating: 'Negligible' as RiskRating,
    issuedBy: 'Internal',
    potentialCauseAr: '',
    potentialCauseEn: '',
    potentialImpactAr: '',
    potentialImpactEn: '',
    layersOfProtectionAr: '',
    layersOfProtectionEn: '',
    krisAr: '',
    krisEn: '',
    mitigationActionsAr: '',
    mitigationActionsEn: '',
    isDeleted: true,
    deletedAt: '2026-01-15T10:00:00.000Z',
    commentsCount: 0,
  },
];

// Combined all risks (fallback data)
const allRisks = mockRisks;

// Risk type for API response
interface APIRisk {
  id: string;
  riskNumber: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  categoryId: string | null;
  departmentId: string;
  inherentLikelihood: number;
  inherentImpact: number;
  inherentScore: number;
  inherentRating: RiskRating;
  residualLikelihood: number | null;
  residualImpact: number | null;
  residualScore: number | null;
  residualRating: string | null;
  status: string;
  issuedBy: string | null;
  approvalStatus: string | null;
  mitigationActionsAr: string | null;
  mitigationActionsEn: string | null;
  potentialCauseAr: string | null;
  potentialCauseEn: string | null;
  potentialImpactAr: string | null;
  potentialImpactEn: string | null;
  layersOfProtectionAr: string | null;
  layersOfProtectionEn: string | null;
  krisAr: string | null;
  krisEn: string | null;
  processText: string | null;
  subProcessText: string | null;
  followUpDate: string | null;
  nextReviewDate: string | null;
  identifiedDate: string;
  category?: { id: string; code: string; nameAr: string; nameEn: string } | null;
  department?: { id: string; code: string; nameAr: string; nameEn: string };
  source?: { id: string; code: string; nameAr: string; nameEn: string } | null;
  owner?: { id: string; fullName: string; fullNameEn: string | null };
  champion?: { id: string; fullName: string; fullNameEn: string | null };
  riskOwner?: { id: string; fullName: string; fullNameEn: string | null };
  riskOwnerId?: string | null;
  isDeleted?: boolean;
  deletedAt?: string | null;
  _count?: {
    comments: number;
  };
}

export default function RisksPage() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const isAr = language === 'ar';

  // Sort options type
  type SortField = 'riskNumber' | 'title' | 'inherentScore' | 'residualScore' | 'status' | 'identifiedDate';
  type SortDirection = 'asc' | 'desc';

  // Ref to track if this is the initial load (to prevent resetting page on mount)
  const isInitialMount = useRef(true);

  // Initialize state from URL params for persistence
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [filterRating, setFilterRating] = useState(searchParams.get('rating') || '');
  const [filterCategory, setFilterCategory] = useState(searchParams.get('category') || '');
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || '');
  const [filterDepartment, setFilterDepartment] = useState(searchParams.get('department') || '');
  const [sortField, setSortField] = useState<SortField>((searchParams.get('sortBy') as SortField) || 'inherentScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>((searchParams.get('sortDir') as SortDirection) || 'desc');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [itemsPerPage, setItemsPerPage] = useState(parseInt(searchParams.get('perPage') || '10', 10));
  const [showWizard, setShowWizard] = useState(false);
  const [showFilters, setShowFilters] = useState(
    !!(searchParams.get('rating') || searchParams.get('category') || searchParams.get('status') || searchParams.get('department'))
  );
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedRisk, setSelectedRisk] = useState<typeof mockRisks[0] | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [risks, setRisks] = useState(allRisks);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUsingFallbackData, setIsUsingFallbackData] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [categories, setCategories] = useState<APICategory[]>([]);
  const [riskStatuses, setRiskStatuses] = useState<APIRiskStatus[]>([]);
  const [allDepartments, setAllDepartments] = useState<{ id: string; code: string; nameAr: string; nameEn: string }[]>([]);
  const [viewModalTab, setViewModalTab] = useState<'details' | 'assessment' | 'treatments' | 'discussion' | 'incidents' | 'history'>('details');
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null);
  const [modalChangeLogs, setModalChangeLogs] = useState<ChangeLogEntry[]>([]);
  const [modalChangeLogsLoading, setModalChangeLogsLoading] = useState(false);
  const [modalTreatments, setModalTreatments] = useState<TreatmentPlan[]>([]);
  const [modalTreatmentsLoading, setModalTreatmentsLoading] = useState(false);
  const [modalAssessments, setModalAssessments] = useState<RiskAssessment[]>([]);
  const [modalAssessmentsLoading, setModalAssessmentsLoading] = useState(false);
  const [modalIncidents, setModalIncidents] = useState<Incident[]>([]);
  const [modalIncidentsLoading, setModalIncidentsLoading] = useState(false);
  const [riskOwners, setRiskOwners] = useState<{ id: string; fullName: string; fullNameEn: string | null }[]>([]);


  // Residual risk values reference (للعرض فقط - الخطر المتبقي لا يمكن تعديله من هنا)

  // Normalize rating to valid values
  const normalizeRating = (rating: string | null | undefined): RiskRating => {
    if (!rating) return 'Moderate';
    // Map Catastrophic to Critical for consistency
    if (rating === 'Catastrophic') return 'Critical';
    if (['Critical', 'Major', 'Moderate', 'Minor', 'Negligible'].includes(rating)) {
      return rating as RiskRating;
    }
    return 'Moderate';
  };

  // Fetch risks from API
  const fetchRisks = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    }

    try {
      const response = await fetch('/api/risks');
      const result = await response.json();

      if (result.success && result.data.length > 0) {
        // Transform API data to match the existing structure
        const transformedRisks = result.data.map((risk: APIRisk) => ({
          id: risk.id,
          riskNumber: risk.riskNumber,
          titleAr: risk.titleAr,
          titleEn: risk.titleEn,
          descriptionAr: risk.descriptionAr,
          descriptionEn: risk.descriptionEn,
          categoryCode: risk.category?.code || 'OPS',
          categoryId: risk.categoryId,
          departmentId: risk.departmentId,
          status: (risk.status || 'open') as RiskStatus,
          approvalStatus: risk.approvalStatus || 'Draft',
          departmentAr: risk.department?.nameAr || 'عام',
          departmentEn: risk.department?.nameEn || 'General',
          processAr: risk.processText || '',
          processEn: risk.processText || '',
          processText: risk.processText || '',
          subProcessAr: risk.subProcessText || '',
          subProcessEn: risk.subProcessText || '',
          subProcessText: risk.subProcessText || '',
          ownerAr: risk.riskOwner?.fullName || risk.owner?.fullName || 'غير محدد',
          ownerEn: risk.riskOwner?.fullNameEn || risk.riskOwner?.fullName || risk.owner?.fullNameEn || risk.owner?.fullName || 'Not Assigned',
          ownerId: risk.riskOwner?.id || risk.riskOwnerId,
          championAr: risk.champion?.fullName || 'غير محدد',
          championEn: risk.champion?.fullNameEn || risk.champion?.fullName || 'Not Assigned',
          championId: risk.champion?.id,
          identifiedDate: risk.identifiedDate?.split('T')[0] || new Date().toISOString().split('T')[0],
          followUpDate: risk.followUpDate?.split('T')[0] || '',
          nextReviewDate: risk.nextReviewDate?.split('T')[0] || '',
          inherentLikelihood: risk.inherentLikelihood || 3,
          inherentImpact: risk.inherentImpact || 3,
          inherentScore: risk.inherentScore || 9,
          inherentRating: normalizeRating(risk.inherentRating),
          residualLikelihood: risk.residualLikelihood || risk.inherentLikelihood || 3,
          residualImpact: risk.residualImpact || risk.inherentImpact || 3,
          residualScore: risk.residualScore || risk.inherentScore || 9,
          residualRating: normalizeRating(risk.residualRating || risk.inherentRating),
          issuedBy: risk.issuedBy || risk.source?.code || 'Internal',
          sourceId: risk.source?.id,
          potentialCauseAr: risk.potentialCauseAr || '',
          potentialCauseEn: risk.potentialCauseEn || '',
          potentialImpactAr: risk.potentialImpactAr || '',
          potentialImpactEn: risk.potentialImpactEn || '',
          layersOfProtectionAr: risk.layersOfProtectionAr || '',
          layersOfProtectionEn: risk.layersOfProtectionEn || '',
          krisAr: risk.krisAr || '',
          krisEn: risk.krisEn || '',
          mitigationActionsAr: risk.mitigationActionsAr || '',
          mitigationActionsEn: risk.mitigationActionsEn || '',
          commentsCount: risk._count?.comments || 0,
        }));

        setRisks(transformedRisks);
        setIsUsingFallbackData(false);
      } else {
        // Database is empty, seed initial data then refetch
        try {
          console.log('Seeding initial risks data...');
          const seedResponse = await fetch('/api/risks/seed', { method: 'POST' });
          const seedResult = await seedResponse.json();
          console.log('Seed result:', seedResult);

          if (seedResult.success && seedResult.results?.added > 0) {
            // Refetch risks after seeding
            const refetchResponse = await fetch('/api/risks');
            const refetchResult = await refetchResponse.json();
            if (refetchResult.success && refetchResult.data.length > 0) {
              const transformedRisks = refetchResult.data.map((risk: APIRisk) => ({
                id: risk.id,
                riskNumber: risk.riskNumber,
                titleAr: risk.titleAr,
                titleEn: risk.titleEn,
                descriptionAr: risk.descriptionAr,
                descriptionEn: risk.descriptionEn,
                categoryCode: risk.category?.code || 'OPS',
                categoryId: risk.categoryId,
                departmentId: risk.departmentId,
                status: (risk.status || 'open') as RiskStatus,
                approvalStatus: risk.approvalStatus || 'Draft',
                departmentAr: risk.department?.nameAr || 'عام',
                departmentEn: risk.department?.nameEn || 'General',
                processAr: risk.processText || '',
                processEn: risk.processText || '',
                processText: risk.processText || '',
                subProcessAr: risk.subProcessText || '',
                subProcessEn: risk.subProcessText || '',
                subProcessText: risk.subProcessText || '',
                ownerAr: risk.riskOwner?.fullName || risk.owner?.fullName || 'غير محدد',
                ownerEn: risk.riskOwner?.fullNameEn || risk.riskOwner?.fullName || risk.owner?.fullNameEn || risk.owner?.fullName || 'Not Assigned',
                ownerId: risk.riskOwner?.id || risk.riskOwnerId,
                championAr: risk.champion?.fullName || 'غير محدد',
                championEn: risk.champion?.fullNameEn || risk.champion?.fullName || 'Not Assigned',
                championId: risk.champion?.id,
                identifiedDate: risk.identifiedDate?.split('T')[0] || new Date().toISOString().split('T')[0],
                followUpDate: risk.followUpDate?.split('T')[0] || '',
                nextReviewDate: risk.nextReviewDate?.split('T')[0] || '',
                inherentLikelihood: risk.inherentLikelihood || 3,
                inherentImpact: risk.inherentImpact || 3,
                inherentScore: risk.inherentScore || 9,
                inherentRating: normalizeRating(risk.inherentRating),
                residualLikelihood: risk.residualLikelihood || risk.inherentLikelihood || 3,
                residualImpact: risk.residualImpact || risk.inherentImpact || 3,
                residualScore: risk.residualScore || risk.inherentScore || 9,
                residualRating: normalizeRating(risk.residualRating || risk.inherentRating),
                issuedBy: risk.issuedBy || risk.source?.code || 'Internal',
                sourceId: risk.source?.id,
                potentialCauseAr: risk.potentialCauseAr || '',
                potentialCauseEn: risk.potentialCauseEn || '',
                potentialImpactAr: risk.potentialImpactAr || '',
                potentialImpactEn: risk.potentialImpactEn || '',
                layersOfProtectionAr: risk.layersOfProtectionAr || '',
                layersOfProtectionEn: risk.layersOfProtectionEn || '',
                krisAr: risk.krisAr || '',
                krisEn: risk.krisEn || '',
                mitigationActionsAr: risk.mitigationActionsAr || '',
                mitigationActionsEn: risk.mitigationActionsEn || '',
                isDeleted: risk.isDeleted || false,
                deletedAt: risk.deletedAt || null,
                commentsCount: risk._count?.comments || 0,
              }));
              setRisks(transformedRisks);
              setIsUsingFallbackData(false);
              return;
            }
          }
        } catch (seedError) {
          console.error('Error seeding risks:', seedError);
        }
        // Use fallback data if seeding fails
        setRisks(allRisks);
        setIsUsingFallbackData(true);
      }
    } catch (error) {
      console.error('Error fetching risks:', error);
      // Use fallback data on error
      setRisks(allRisks);
      setIsUsingFallbackData(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch categories from API
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories');
      const result = await response.json();
      if (result.success && result.data.length > 0) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  // Fetch risk statuses from API
  const fetchRiskStatuses = useCallback(async () => {
    try {
      const response = await fetch('/api/risk-statuses');
      const result = await response.json();
      if (result.success && result.data.length > 0) {
        setRiskStatuses(result.data);
      }
    } catch (error) {
      console.error('Error fetching risk statuses:', error);
    }
  }, []);

  // Fetch departments from API
  const fetchDepartments = useCallback(async () => {
    try {
      const response = await fetch('/api/departments');
      const result = await response.json();
      if (result.success && result.data.length > 0) {
        setAllDepartments(result.data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  }, []);

  // Fetch risk owners from API
  const fetchRiskOwners = useCallback(async () => {
    try {
      const response = await fetch('/api/risk-owners');
      const result = await response.json();
      if (result.success && result.data.length > 0) {
        setRiskOwners(result.data);
      }
    } catch (error) {
      console.error('Error fetching risk owners:', error);
    }
  }, []);

  // Fetch risks, categories, statuses, departments, and risk owners on component mount
  useEffect(() => {
    fetchRisks();
    fetchCategories();
    fetchRiskStatuses();
    fetchDepartments();
    fetchRiskOwners();
  }, [fetchRisks, fetchCategories, fetchRiskStatuses, fetchDepartments, fetchRiskOwners]);

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setCurrentUser({ id: data.user.id, role: data.user.role });
          }
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };
    fetchCurrentUser();
  }, []);

  // Fetch change logs when history tab is selected
  useEffect(() => {
    const fetchChangeLogs = async () => {
      if (viewModalTab !== 'history' || !selectedRisk) return;

      try {
        setModalChangeLogsLoading(true);
        const response = await fetch(`/api/risks/${selectedRisk.id}/changelog`);
        const result = await response.json();

        if (result.success) {
          setModalChangeLogs(result.data.logs);
        }
      } catch (err) {
        console.error('Error fetching change logs:', err);
      } finally {
        setModalChangeLogsLoading(false);
      }
    };

    fetchChangeLogs();
  }, [viewModalTab, selectedRisk]);


  // Fetch treatments when treatments tab is selected
  useEffect(() => {
    const fetchTreatments = async () => {
      if (viewModalTab !== 'treatments' || !selectedRisk) return;

      try {
        setModalTreatmentsLoading(true);
        const response = await fetch(`/api/risks/${selectedRisk.id}/treatments`);
        const result = await response.json();

        if (result.success) {
          setModalTreatments(result.data);
        }
      } catch (err) {
        console.error('Error fetching treatments:', err);
      } finally {
        setModalTreatmentsLoading(false);
      }
    };

    fetchTreatments();
  }, [viewModalTab, selectedRisk]);

  // Fetch assessments when assessment tab is selected
  useEffect(() => {
    const fetchAssessments = async () => {
      if (viewModalTab !== 'assessment' || !selectedRisk) return;

      try {
        setModalAssessmentsLoading(true);
        const response = await fetch(`/api/risks/${selectedRisk.id}`);
        const result = await response.json();

        if (result.success && result.data.assessments) {
          setModalAssessments(result.data.assessments);
        }
      } catch (err) {
        console.error('Error fetching assessments:', err);
      } finally {
        setModalAssessmentsLoading(false);
      }
    };

    fetchAssessments();
  }, [viewModalTab, selectedRisk]);

  // Fetch incidents when incidents tab is selected
  useEffect(() => {
    const fetchIncidents = async () => {
      if (viewModalTab !== 'incidents' || !selectedRisk) return;

      try {
        setModalIncidentsLoading(true);
        const response = await fetch(`/api/risks/${selectedRisk.id}`);
        const result = await response.json();

        if (result.success && result.data.incidents) {
          setModalIncidents(result.data.incidents);
        }
      } catch (err) {
        console.error('Error fetching incidents:', err);
      } finally {
        setModalIncidentsLoading(false);
      }
    };

    fetchIncidents();
  }, [viewModalTab, selectedRisk]);

  // Handle refresh button click
  const handleRefresh = () => {
    fetchRisks(true);
  };

  // Handle migrate data to database
  const handleMigrateData = async () => {
    setIsMigrating(true);
    try {
      const response = await fetch('/api/risks/seed', { method: 'POST' });
      const result = await response.json();

      if (result.success) {
        // Refetch risks after migration
        await fetchRisks(true);
        alert(isAr
          ? `تم نقل البيانات بنجاح: ${result.results?.added || 0} خطر جديد`
          : `Data migrated successfully: ${result.results?.added || 0} new risks`);
      } else {
        alert(isAr ? 'فشل في نقل البيانات' : 'Failed to migrate data');
      }
    } catch (error) {
      console.error('Error migrating data:', error);
      alert(isAr ? 'حدث خطأ أثناء نقل البيانات' : 'Error occurred while migrating data');
    } finally {
      setIsMigrating(false);
    }
  };

  // Update URL with current filters (for persistence)
  const updateURLParams = useCallback((params: Record<string, string | number>) => {
    const newParams = new URLSearchParams(searchParams.toString());

    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== '' && value !== 1 && value !== 10) {
        newParams.set(key, String(value));
      } else {
        newParams.delete(key);
      }
    });

    const queryString = newParams.toString();
    const newURL = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(newURL, { scroll: false });
  }, [searchParams, pathname, router]);

  // Debounced search update
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Update URL when filters change
  useEffect(() => {
    updateURLParams({
      search: debouncedSearch,
      rating: filterRating,
      category: filterCategory,
      status: filterStatus,
      department: filterDepartment,
      sortBy: sortField,
      sortDir: sortDirection,
      page: currentPage,
      perPage: itemsPerPage,
    });
  }, [debouncedSearch, filterRating, filterCategory, filterStatus, filterDepartment, sortField, sortDirection, currentPage, itemsPerPage, updateURLParams]);

  // Reset to page 1 when filters change (but not on initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setCurrentPage(1);
  }, [debouncedSearch, filterRating, filterCategory, filterStatus, filterDepartment]);

  // Sort options
  const sortOptions = useMemo(() => [
    { value: 'inherentScore', label: isAr ? 'درجة الخطر الأصلي' : 'Inherent Risk Score' },
    { value: 'residualScore', label: isAr ? 'درجة الخطر المتبقي' : 'Residual Risk Score' },
    { value: 'riskNumber', label: isAr ? 'رقم الخطر' : 'Risk Number' },
    { value: 'title', label: isAr ? 'العنوان' : 'Title' },
    { value: 'status', label: isAr ? 'الحالة' : 'Status' },
    { value: 'identifiedDate', label: isAr ? 'تاريخ التعريف' : 'Identified Date' },
  ], [isAr]);

  // Handle sort change
  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default desc direction
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Rating options based on new rating system
  const ratingOptions = [
    { value: '', label: isAr ? 'جميع التصنيفات' : 'All Ratings' },
    { value: 'Critical', label: t('risks.ratings.Critical') },
    { value: 'Major', label: t('risks.ratings.Major') },
    { value: 'Moderate', label: t('risks.ratings.Moderate') },
    { value: 'Minor', label: t('risks.ratings.Minor') },
    { value: 'Negligible', label: t('risks.ratings.Negligible') },
  ];

  const categoryOptions = useMemo(() => [
    { value: '', label: isAr ? 'جميع الفئات' : 'All Categories' },
    ...categories.filter(cat => cat.isActive).map(cat => ({
      value: cat.code,
      label: isAr ? cat.nameAr : cat.nameEn,
    })),
  ], [categories, isAr]);

  // Status options from database, with fallback to default values
  const statusOptions = useMemo(() => {
    if (riskStatuses.length > 0) {
      return [
        { value: '', label: isAr ? 'جميع الحالات' : 'All Statuses' },
        ...riskStatuses.filter(s => s.isActive).map(status => ({
          value: status.code,
          label: isAr ? status.nameAr : status.nameEn,
        })),
      ];
    }
    // Fallback to default statuses if API hasn't loaded yet
    return [
      { value: '', label: isAr ? 'جميع الحالات' : 'All Statuses' },
      { value: 'open', label: t('risks.statuses.open') },
      { value: 'inProgress', label: t('risks.statuses.inProgress') },
      { value: 'mitigated', label: t('risks.statuses.mitigated') },
      { value: 'closed', label: t('risks.statuses.closed') },
      { value: 'accepted', label: t('risks.statuses.accepted') },
    ];
  }, [riskStatuses, isAr, t]);

  // Department options for filter
  const departmentOptions = useMemo(() => {
    const uniqueDepts = new Map<string, { nameAr: string; nameEn: string }>();
    risks.forEach(risk => {
      if (risk.departmentAr && risk.departmentEn) {
        const key = risk.departmentAr;
        if (!uniqueDepts.has(key)) {
          uniqueDepts.set(key, { nameAr: risk.departmentAr, nameEn: risk.departmentEn });
        }
      }
    });
    return [
      { value: '', label: isAr ? 'جميع الإدارات' : 'All Departments' },
      ...Array.from(uniqueDepts.entries()).map(([key, val]) => ({
        value: key,
        label: isAr ? val.nameAr : val.nameEn
      }))
    ];
  }, [risks, isAr]);

  const filteredRisks = useMemo(() => {
    // Filter first
    const filtered = risks.filter((risk) => {
      const matchesSearch =
        risk.riskNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        risk.titleAr.includes(searchQuery) ||
        risk.titleEn.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRating = !filterRating || risk.inherentRating === filterRating;
      const matchesCategory = !filterCategory || risk.categoryCode === filterCategory;
      const matchesStatus = !filterStatus || risk.status === filterStatus;
      const matchesDepartment = !filterDepartment || risk.departmentAr === filterDepartment;
      return matchesSearch && matchesRating && matchesCategory && matchesStatus && matchesDepartment;
    });

    // Then sort - المخاطر المحذوفة تأتي دائماً في النهاية
    return filtered.sort((a, b) => {
      // المخاطر المحذوفة تأتي في النهاية دائماً
      if (a.isDeleted && !b.isDeleted) return 1;
      if (!a.isDeleted && b.isDeleted) return -1;

      let comparison = 0;

      switch (sortField) {
        case 'riskNumber':
          comparison = a.riskNumber.localeCompare(b.riskNumber);
          break;
        case 'title':
          comparison = (isAr ? a.titleAr : a.titleEn).localeCompare(isAr ? b.titleAr : b.titleEn);
          break;
        case 'inherentScore':
          comparison = (a.inherentScore || 0) - (b.inherentScore || 0);
          break;
        case 'residualScore':
          comparison = (a.residualScore || 0) - (b.residualScore || 0);
          break;
        case 'status':
          const statusOrder = { open: 1, inProgress: 2, mitigated: 3, accepted: 4, closed: 5 };
          comparison = (statusOrder[a.status as keyof typeof statusOrder] || 0) - (statusOrder[b.status as keyof typeof statusOrder] || 0);
          break;
        case 'identifiedDate':
          comparison = new Date(a.identifiedDate || 0).getTime() - new Date(b.identifiedDate || 0).getTime();
          break;
        default:
          comparison = 0;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [risks, searchQuery, filterRating, filterCategory, filterStatus, filterDepartment, sortField, sortDirection, isAr]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredRisks.length / itemsPerPage);
  const paginatedRisks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRisks.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRisks, currentPage, itemsPerPage]);

  // Ensure currentPage is valid when filteredRisks change
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterRating) count++;
    if (filterCategory) count++;
    if (filterStatus) count++;
    if (filterDepartment) count++;
    return count;
  }, [filterRating, filterCategory, filterStatus, filterDepartment]);

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('');
    setFilterRating('');
    setFilterCategory('');
    setFilterStatus('');
    setFilterDepartment('');
    setCurrentPage(1);
  };

  // Statistics
  const stats = useMemo(() => ({
    total: risks.length,
    critical: risks.filter(r => r.inherentRating === 'Critical').length,
    major: risks.filter(r => r.inherentRating === 'Major').length,
    open: risks.filter(r => r.status === 'open' || r.status === 'inProgress').length,
    mitigated: risks.filter(r => r.status === 'mitigated' || r.status === 'closed').length,
  }), [risks]);

  const getRatingBadgeVariant = (rating: RiskRating): 'critical' | 'high' | 'medium' | 'low' | 'default' => {
    switch (rating) {
      case 'Critical': return 'critical';
      case 'Major': return 'high';
      case 'Moderate': return 'medium';
      case 'Minor': return 'low';
      case 'Negligible': return 'default';
      default: return 'default';
    }
  };

  const getStatusBadgeVariant = (status: RiskStatus): 'success' | 'warning' | 'info' | 'default' => {
    switch (status) {
      case 'closed':
      case 'mitigated': return 'success';
      case 'inProgress': return 'warning';
      case 'open': return 'info';
      default: return 'default';
    }
  };

  // Get status display name from API or fallback to translation
  const getStatusDisplayName = (statusCode: string): string => {
    const statusFromDB = riskStatuses.find(s => s.code === statusCode);
    if (statusFromDB) {
      return isAr ? statusFromDB.nameAr : statusFromDB.nameEn;
    }
    // Fallback to translation
    return t(`risks.statuses.${statusCode}`);
  };

  const handleSaveRisk = async (data: unknown) => {
    try {
      // أولاً: إنشاء الخطر في قاعدة البيانات
      const riskData = data as {
        titleAr: string;
        titleEn: string;
        descriptionAr: string;
        descriptionEn: string;
        issuedBy: string;
        sourceId: string;
        categoryId: string;
        departmentId: string;
        processText: string;
        subProcessText: string;
        potentialCauseAr: string;
        potentialCauseEn: string;
        potentialImpactAr: string;
        potentialImpactEn: string;
        inherentLikelihood: number;
        inherentImpact: number;
        existingControlsAr: string;
        existingControlsEn: string;
        mitigationActionsAr: string;
        mitigationActionsEn: string;
        riskOwnerId: string;
        championId: string;
        complianceRequired: boolean;
        complianceNoteAr: string;
      };

      // توليد رقم خطر تلقائي - الحصول على الرقم التسلسلي التالي من API
      const selectedDept = allDepartments.find(d => d.id === riskData.departmentId);
      const deptCode = selectedDept?.code || 'RISK';
      let riskNumber = `${deptCode}-R-001`;
      try {
        const nextNumRes = await fetch(`/api/risks/next-number?deptCode=${encodeURIComponent(deptCode)}`);
        if (nextNumRes.ok) {
          const nextNumData = await nextNumRes.json();
          if (nextNumData.success) {
            riskNumber = nextNumData.data.nextNumber;
          }
        }
      } catch {
        // fallback to timestamp if API fails
        riskNumber = `${deptCode}-R-${String(Date.now()).slice(-3)}`;
      }

      const response = await fetch('/api/risks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...riskData,
          riskNumber,
          layersOfProtectionAr: riskData.existingControlsAr,
          layersOfProtectionEn: riskData.existingControlsEn,
          ownerId: currentUser?.id, // المستخدم الحالي (User table)
          riskOwnerId: riskData.riskOwnerId, // مالك الخطر (RiskOwner table)
          createdById: currentUser?.id,
          status: 'open',
          approvalStatus: 'Draft',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'فشل في إنشاء الخطر');
      }

      const result = await response.json();
      const createdRisk = result.data;

      // ثانياً: إرسال طلب الاعتماد لمدير المخاطر
      const approvalResponse = await fetch('/api/risk-approval-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          riskId: createdRisk.id,
        }),
      });

      if (!approvalResponse.ok) {
        console.error('فشل في إرسال طلب الاعتماد');
      }

      // إغلاق المعالج وتحديث القائمة
      setShowWizard(false);
      fetchRisks();

      // عرض رسالة نجاح
      alert(isAr ? 'تم إرسال الخطر لمدير المخاطر للاعتماد' : 'Risk sent to Risk Manager for approval');
    } catch (error) {
      console.error('Error saving risk:', error);
      alert(isAr ? 'فشل في إنشاء الخطر' : 'Failed to create risk');
    }
  };

  // Handle View Risk
  const handleViewRisk = (risk: typeof mockRisks[0]) => {
    setSelectedRisk(risk);
    setShowViewModal(true);
  };

  // Handle Edit Risk
  const handleEditRisk = (risk: typeof mockRisks[0]) => {
    setSelectedRisk(risk);
    setShowEditModal(true);
  };

  // Handle Delete Risk
  const handleDeleteRisk = (risk: typeof mockRisks[0]) => {
    setSelectedRisk(risk);
    setShowDeleteModal(true);
  };

  // Confirm Delete - حذف ناعم (يبقى الخطر في النظام مع تغيير حالته لمحذوف)
  const confirmDeleteRisk = async () => {
    if (!selectedRisk) return;

    try {
      const response = await fetch(`/api/risks/${selectedRisk.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // تحديث الخطر في الـ state ليظهر كمحذوف
        setRisks(prev => prev.map(r =>
          r.id === selectedRisk.id
            ? { ...r, isDeleted: true, deletedAt: new Date().toISOString() }
            : r
        ));
        setShowDeleteModal(false);
        setSelectedRisk(null);
      } else {
        console.error('Failed to delete risk');
      }
    } catch (error) {
      console.error('Error deleting risk:', error);
    }
  };

  // Handle Export - متوافق مع قالب الاستيراد
  const handleExport = () => {
    // أعمدة متوافقة مع قالب الاستيراد
    const headers = [
      'Risk_ID',
      'Source_Code',
      'Category_Code',
      'Department_Code',
      'Process',
      'Sub_Process',
      'Title_AR',
      'Title_EN',
      'Description_AR',
      'Description_EN',
      'Approval_Status',
      'Likelihood',
      'Impact',
      'Risk_Rating',
      'Status',
      'Risk_Owner',
      'Risk_Champion',
      'Potential_Cause_AR',
      'Potential_Cause_EN',
      'Potential_Impact_AR',
      'Potential_Impact_EN',
      'Layers_Of_Protection_AR',
      'Layers_Of_Protection_EN',
      'KRIs_AR',
      'KRIs_EN',
      'Treatment_Plan_AR',
      'Treatment_Plan_EN',
      'Due_Date',
      'Review_Date',
      'Comments'
    ];

    // دالة لتنظيف وتهيئة القيمة للـ CSV
    const escapeCSV = (value: string | number | null | undefined): string => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      // إذا كانت القيمة تحتوي على فاصلة أو علامة اقتباس أو سطر جديد، نحيطها بعلامات اقتباس
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = filteredRisks.map(risk => {
      // استخراج البيانات من الـ API risk أو mock risk
      const apiRisk = risk as unknown as APIRisk;

      return [
        escapeCSV(risk.riskNumber),
        escapeCSV(apiRisk.source?.code || risk.issuedBy || ''),
        escapeCSV(apiRisk.category?.code || risk.categoryCode || ''),
        escapeCSV(apiRisk.department?.code || ''),
        escapeCSV(apiRisk.processText || risk.processAr || ''),
        escapeCSV(apiRisk.subProcessText || risk.subProcessAr || ''),
        escapeCSV(risk.titleAr),
        escapeCSV(risk.titleEn),
        escapeCSV(risk.descriptionAr),
        escapeCSV(risk.descriptionEn),
        escapeCSV(apiRisk.approvalStatus || 'Draft'),
        escapeCSV(risk.inherentLikelihood),
        escapeCSV(risk.inherentImpact),
        escapeCSV(risk.inherentRating),
        escapeCSV(risk.status),
        escapeCSV(apiRisk.riskOwner?.fullName || apiRisk.owner?.fullName || risk.ownerAr || ''),
        escapeCSV(apiRisk.champion?.fullName || risk.championAr || ''),
        escapeCSV(apiRisk.potentialCauseAr || risk.potentialCauseAr || ''),
        escapeCSV(apiRisk.potentialCauseEn || risk.potentialCauseEn || ''),
        escapeCSV(apiRisk.potentialImpactAr || risk.potentialImpactAr || ''),
        escapeCSV(apiRisk.potentialImpactEn || risk.potentialImpactEn || ''),
        escapeCSV(apiRisk.layersOfProtectionAr || ''),
        escapeCSV(apiRisk.layersOfProtectionEn || ''),
        escapeCSV(apiRisk.krisAr || ''),
        escapeCSV(apiRisk.krisEn || ''),
        escapeCSV(apiRisk.mitigationActionsAr || ''),
        escapeCSV(apiRisk.mitigationActionsEn || ''),
        escapeCSV(apiRisk.followUpDate ? new Date(apiRisk.followUpDate).toISOString().split('T')[0] : ''),
        escapeCSV(apiRisk.nextReviewDate ? new Date(apiRisk.nextReviewDate).toISOString().split('T')[0] : ''),
        '' // Comments
      ];
    });

    // إضافة BOM للتوافق مع Excel العربي
    const BOM = '\uFEFF';
    const csvContent = BOM + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

    // تحميل الملف
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `risk_register_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--foreground)]">
            {t('risks.title')}
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-[var(--foreground-secondary)]">
            {isAr
              ? `إجمالي المخاطر المسجلة: ${risks.length}`
              : `Total registered risks: ${risks.length}`}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <span className="text-xs sm:text-sm">{isAr ? 'تحديث' : 'Refresh'}</span>
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />} onClick={handleExport}>
            <span className="text-xs sm:text-sm">{t('common.export')}</span>
          </Button>
          <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />} onClick={() => setShowWizard(true)}>
            <span className="text-xs sm:text-sm">{t('risks.addRisk')}</span>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="p-2 sm:p-3 md:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-lg bg-[var(--primary-light)] shrink-0">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--primary)]" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--foreground)]">{stats.total}</p>
              <p className="text-[10px] sm:text-xs text-[var(--foreground-secondary)] truncate">
                {t('dashboard.totalRisks')}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-2 sm:p-3 md:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-lg bg-[var(--risk-critical-bg)] shrink-0">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--risk-critical)]" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--foreground)]">{stats.critical}</p>
              <p className="text-[10px] sm:text-xs text-[var(--foreground-secondary)] truncate">
                {t('dashboard.criticalRisks')}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-2 sm:p-3 md:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-lg bg-[var(--risk-high-bg)] shrink-0">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--risk-high)]" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--foreground)]">{stats.major}</p>
              <p className="text-[10px] sm:text-xs text-[var(--foreground-secondary)] truncate">
                {t('dashboard.majorRisks')}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-2 sm:p-3 md:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-lg bg-[var(--status-warning)]/10 shrink-0">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--status-warning)]" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--foreground)]">{stats.open}</p>
              <p className="text-[10px] sm:text-xs text-[var(--foreground-secondary)] truncate">
                {isAr ? 'مخاطر مفتوحة' : 'Open Risks'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-2 sm:p-3 md:p-4 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-lg bg-[var(--status-success)]/10 shrink-0">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--status-success)]" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--foreground)]">{stats.mitigated}</p>
              <p className="text-[10px] sm:text-xs text-[var(--foreground-secondary)] truncate">
                {isAr ? 'تم التخفيف' : 'Mitigated'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Warning Banner for Fallback Data */}
      {isUsingFallbackData && !isLoading && (
        <Card className="border-[var(--status-warning)] bg-[var(--status-warning)]/5">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--status-warning)]/20">
                  <AlertTriangle className="h-5 w-5 text-[var(--status-warning)]" />
                </div>
                <div>
                  <p className="font-medium text-[var(--foreground)]">
                    {isAr ? 'البيانات المعروضة هي بيانات تجريبية' : 'Displaying demo data'}
                  </p>
                  <p className="text-sm text-[var(--foreground-secondary)]">
                    {isAr
                      ? 'لتتمكن من تعديل وحفظ المخاطر، يجب نقل البيانات إلى قاعدة البيانات أولاً'
                      : 'To edit and save risks, you need to migrate data to the database first'}
                  </p>
                </div>
              </div>
              <Button
                variant="warning"
                size="sm"
                onClick={handleMigrateData}
                disabled={isMigrating}
                leftIcon={isMigrating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              >
                {isMigrating
                  ? (isAr ? 'جاري النقل...' : 'Migrating...')
                  : (isAr ? 'نقل البيانات' : 'Migrate Data')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-2 sm:p-3 md:p-4">
          <div className="flex flex-col gap-2 sm:gap-3 md:gap-4 lg:flex-row lg:items-center">
            <div className="flex-1">
              <div className="relative">
                <Input
                  placeholder={isAr ? 'بحث برقم الخطر أو العنوان...' : 'Search by risk number or title...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="h-4 w-4 sm:h-5 sm:w-5" />}
                  className="text-xs sm:text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 end-0 flex items-center pe-3 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {/* Sort Dropdown */}
              <div className="relative group">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<ArrowUpDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                  rightIcon={sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  className="min-w-[120px]"
                >
                  <span className="text-xs sm:text-sm truncate">
                    {sortOptions.find(opt => opt.value === sortField)?.label}
                  </span>
                </Button>
                <div className="absolute top-full mt-1 end-0 z-50 min-w-[200px] rounded-lg border border-[var(--border)] bg-[var(--background)] shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="p-1">
                    <div className="px-2 py-1.5 text-xs font-medium text-[var(--foreground-secondary)]">
                      {isAr ? 'ترتيب حسب' : 'Sort by'}
                    </div>
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleSortChange(option.value as SortField)}
                        className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-sm transition-colors hover:bg-[var(--background-secondary)] ${sortField === option.value ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'text-[var(--foreground)]'}`}
                      >
                        <span>{option.label}</span>
                        {sortField === option.value && (
                          sortDirection === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-[var(--border)] p-1">
                    <div className="px-2 py-1.5 text-xs font-medium text-[var(--foreground-secondary)]">
                      {isAr ? 'اتجاه الترتيب' : 'Direction'}
                    </div>
                    <button
                      onClick={() => setSortDirection('asc')}
                      className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors hover:bg-[var(--background-secondary)] ${sortDirection === 'asc' ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'text-[var(--foreground)]'}`}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                      <span>{isAr ? 'تصاعدي' : 'Ascending'}</span>
                    </button>
                    <button
                      onClick={() => setSortDirection('desc')}
                      className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors hover:bg-[var(--background-secondary)] ${sortDirection === 'desc' ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'text-[var(--foreground)]'}`}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                      <span>{isAr ? 'تنازلي' : 'Descending'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Filter Button */}
              <Button
                variant={showFilters ? 'primary' : 'outline'}
                size="sm"
                leftIcon={<Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                onClick={() => setShowFilters(!showFilters)}
                className="relative"
              >
                <span className="text-xs sm:text-sm">{isAr ? 'تصفية' : 'Filter'}</span>
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -end-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--status-error)] text-[10px] font-bold text-white">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-xs text-[var(--status-error)] hover:text-[var(--status-error)]"
                >
                  {isAr ? 'مسح الكل' : 'Clear all'}
                </Button>
              )}

              {/* View Mode Toggle */}
              <div className="flex rounded-lg border border-[var(--border)]">
                <button
                  onClick={() => setViewMode('table')}
                  className={`rounded-s-lg p-1.5 sm:p-2 transition-colors ${viewMode === 'table' ? 'bg-[var(--primary)] text-white' : 'text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)]'}`}
                >
                  <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`rounded-e-lg p-1.5 sm:p-2 transition-colors ${viewMode === 'cards' ? 'bg-[var(--primary)] text-white' : 'text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)]'}`}
                >
                  <Grid3X3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters & Sort Tags */}
          {(activeFiltersCount > 0 || sortField !== 'inherentScore' || sortDirection !== 'desc') && (
            <div className="mt-2 flex flex-wrap gap-2">
              {filterRating && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--primary)]/10 px-2.5 py-1 text-xs text-[var(--primary)]">
                  {t(`risks.ratings.${filterRating}`)}
                  <button onClick={() => setFilterRating('')} className="hover:text-[var(--status-error)]">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filterCategory && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--primary)]/10 px-2.5 py-1 text-xs text-[var(--primary)]">
                  {categoryOptions.find(c => c.value === filterCategory)?.label}
                  <button onClick={() => setFilterCategory('')} className="hover:text-[var(--status-error)]">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filterStatus && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--primary)]/10 px-2.5 py-1 text-xs text-[var(--primary)]">
                  {statusOptions.find(s => s.value === filterStatus)?.label}
                  <button onClick={() => setFilterStatus('')} className="hover:text-[var(--status-error)]">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filterDepartment && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--primary)]/10 px-2.5 py-1 text-xs text-[var(--primary)]">
                  {departmentOptions.find(d => d.value === filterDepartment)?.label}
                  <button onClick={() => setFilterDepartment('')} className="hover:text-[var(--status-error)]">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {/* Sort Tag */}
              {(sortField !== 'inherentScore' || sortDirection !== 'desc') && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--secondary)]/10 px-2.5 py-1 text-xs text-[var(--secondary)]">
                  {sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  {sortOptions.find(opt => opt.value === sortField)?.label}
                  <button
                    onClick={() => {
                      setSortField('inherentScore');
                      setSortDirection('desc');
                    }}
                    className="hover:text-[var(--status-error)]"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Filter Panel */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showFilters ? 'mt-3 sm:mt-4 max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="grid gap-2 sm:gap-3 md:gap-4 border-t border-[var(--border)] pt-3 sm:pt-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <Select
                label={t('risks.riskRating')}
                options={ratingOptions}
                value={filterRating}
                onChange={setFilterRating}
              />
              <Select
                label={t('risks.riskCategory')}
                options={categoryOptions}
                value={filterCategory}
                onChange={setFilterCategory}
              />
              <Select
                label={t('risks.riskStatus')}
                options={statusOptions}
                value={filterStatus}
                onChange={setFilterStatus}
              />
              <Select
                label={isAr ? 'الإدارة' : 'Department'}
                options={departmentOptions}
                value={filterDepartment}
                onChange={setFilterDepartment}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risks Display */}
      {isLoading ? (
        /* Loading State */
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center gap-4">
              <RefreshCw className="h-8 w-8 animate-spin text-[var(--primary)]" />
              <p className="text-sm text-[var(--foreground-secondary)]">
                {isAr ? 'جاري تحميل المخاطر...' : 'Loading risks...'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        /* Table View */
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--background-secondary)]">
                    <th
                      className="p-2 sm:p-3 md:p-4 text-start text-[10px] sm:text-xs md:text-sm font-medium text-[var(--foreground-secondary)] whitespace-nowrap cursor-pointer hover:bg-[var(--background-tertiary)] transition-colors"
                      onClick={() => handleSortChange('riskNumber')}
                    >
                      <div className="flex items-center gap-1">
                        {t('risks.riskNumber')}
                        {sortField === 'riskNumber' && (
                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        )}
                      </div>
                    </th>
                    <th
                      className="p-2 sm:p-3 md:p-4 text-start text-[10px] sm:text-xs md:text-sm font-medium text-[var(--foreground-secondary)] cursor-pointer hover:bg-[var(--background-tertiary)] transition-colors"
                      onClick={() => handleSortChange('title')}
                    >
                      <div className="flex items-center gap-1">
                        {t('risks.riskTitle')}
                        {sortField === 'title' && (
                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        )}
                      </div>
                    </th>
                    <th className="p-2 sm:p-3 md:p-4 text-start text-[10px] sm:text-xs md:text-sm font-medium text-[var(--foreground-secondary)] whitespace-nowrap">
                      {t('risks.riskCategory')}
                    </th>
                    <th
                      className="p-2 sm:p-3 md:p-4 text-start text-[10px] sm:text-xs md:text-sm font-medium text-[var(--foreground-secondary)] whitespace-nowrap cursor-pointer hover:bg-[var(--background-tertiary)] transition-colors"
                      onClick={() => handleSortChange('inherentScore')}
                    >
                      <div className="flex items-center gap-1">
                        {t('risks.inherentRisk')}
                        {sortField === 'inherentScore' && (
                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        )}
                      </div>
                    </th>
                    <th
                      className="p-2 sm:p-3 md:p-4 text-start text-[10px] sm:text-xs md:text-sm font-medium text-[var(--foreground-secondary)] whitespace-nowrap cursor-pointer hover:bg-[var(--background-tertiary)] transition-colors"
                      onClick={() => handleSortChange('residualScore')}
                    >
                      <div className="flex items-center gap-1">
                        {t('risks.residualRisk')}
                        {sortField === 'residualScore' && (
                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        )}
                      </div>
                    </th>
                    <th
                      className="p-2 sm:p-3 md:p-4 text-start text-[10px] sm:text-xs md:text-sm font-medium text-[var(--foreground-secondary)] whitespace-nowrap cursor-pointer hover:bg-[var(--background-tertiary)] transition-colors"
                      onClick={() => handleSortChange('status')}
                    >
                      <div className="flex items-center gap-1">
                        {t('common.status')}
                        {sortField === 'status' && (
                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        )}
                      </div>
                    </th>
                    <th className="p-2 sm:p-3 md:p-4 text-start text-[10px] sm:text-xs md:text-sm font-medium text-[var(--foreground-secondary)] whitespace-nowrap">
                      {t('risks.riskOwner')}
                    </th>
                    <th className="p-2 sm:p-3 md:p-4 text-center text-[10px] sm:text-xs md:text-sm font-medium text-[var(--foreground-secondary)] whitespace-nowrap">
                      {t('common.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRisks.map((risk) => (
                    <tr
                      key={risk.id}
                      className={cn(
                        "border-b border-[var(--border)] transition-all duration-300 hover:bg-[var(--background-secondary)]",
                        risk.isDeleted && [
                          "bg-gradient-to-r from-red-50/80 via-red-50/40 to-transparent",
                          "dark:from-red-950/40 dark:via-red-950/20 dark:to-transparent",
                          "border-l-4 border-l-red-500",
                          "opacity-70 hover:opacity-90"
                        ]
                      )}
                    >
                      <td className="p-2 sm:p-3 md:p-4">
                        <div className="flex items-center gap-1.5">
                          {/* أيقونة تحذير للمخاطر المحذوفة */}
                          {risk.isDeleted && (
                            <span className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-100 dark:bg-red-900/50 animate-pulse">
                              <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-red-500" />
                            </span>
                          )}
                          <code className={cn(
                            "rounded px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-mono",
                            risk.isDeleted
                              ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 line-through decoration-red-500 decoration-2"
                              : "bg-[var(--background-tertiary)]"
                          )}>
                            {risk.riskNumber}
                          </code>
                          {risk.isDeleted && (
                            <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] text-white font-bold px-1.5 py-0.5 rounded-full bg-red-500 shadow-sm animate-pulse">
                              <X className="h-2.5 w-2.5" />
                              {isAr ? 'محذوف' : 'Deleted'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-2 sm:p-3 md:p-4">
                        <div className="max-w-[200px] sm:max-w-[250px] md:max-w-[300px]">
                          <p className={cn(
                            "font-medium text-xs sm:text-sm truncate",
                            risk.isDeleted
                              ? "text-red-600/70 dark:text-red-400/70 line-through decoration-red-400"
                              : "text-[var(--foreground)]"
                          )}>
                            {isAr ? risk.titleAr : risk.titleEn}
                          </p>
                          <p className={cn(
                            "mt-0.5 text-[10px] sm:text-xs truncate",
                            risk.isDeleted
                              ? "text-red-400/60 dark:text-red-500/60"
                              : "text-[var(--foreground-muted)]"
                          )}>
                            {isAr ? risk.departmentAr : risk.departmentEn} • {isAr ? risk.processAr : risk.processEn}
                          </p>
                        </div>
                      </td>
                      <td className="p-2 sm:p-3 md:p-4">
                        <span className="text-[10px] sm:text-xs md:text-sm text-[var(--foreground-secondary)]">
                          {t(`risks.categories.${risk.categoryCode}`)}
                        </span>
                      </td>
                      <td className="p-2 sm:p-3 md:p-4">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <span className="font-mono text-[10px] sm:text-xs md:text-sm">{risk.inherentScore}</span>
                          <Badge variant={getRatingBadgeVariant(risk.inherentRating)} className="text-[9px] sm:text-[10px] md:text-xs px-1.5 sm:px-2">
                            {t(`risks.ratings.${risk.inherentRating}`)}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-2 sm:p-3 md:p-4">
                        {risk.residualScore ? (
                          <div className="flex items-center gap-1 sm:gap-2">
                            <span className="font-mono text-[10px] sm:text-xs md:text-sm">{risk.residualScore}</span>
                            <Badge variant={getRatingBadgeVariant(risk.residualRating!)} className="text-[9px] sm:text-[10px] md:text-xs px-1.5 sm:px-2">
                              {t(`risks.ratings.${risk.residualRating}`)}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-xs sm:text-sm text-[var(--foreground-muted)]">-</span>
                        )}
                      </td>
                      <td className="p-2 sm:p-3 md:p-4">
                        <Badge variant={getStatusBadgeVariant(risk.status)} className="text-[9px] sm:text-[10px] md:text-xs px-1.5 sm:px-2">
                          {getStatusDisplayName(risk.status)}
                        </Badge>
                      </td>
                      <td className="p-2 sm:p-3 md:p-4 text-[10px] sm:text-xs md:text-sm text-[var(--foreground-secondary)]">
                        {isAr ? risk.ownerAr : risk.ownerEn}
                      </td>
                      <td className="p-2 sm:p-3 md:p-4">
                        <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                          <Button variant="ghost" size="icon-sm" title={isAr ? 'عرض' : 'View'} onClick={() => handleViewRisk(risk)} className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8">
                            <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title={isAr ? 'التفاصيل والنقاش' : 'Details & Discussion'}
                            onClick={() => router.push(`/risks/${risk.id}`)}
                            className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-[var(--primary)] relative"
                          >
                            <MessageSquare className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                            {(risk.commentsCount || 0) > 0 && (
                              <span className="absolute -top-1 -end-1 flex items-center justify-center min-w-[14px] h-[14px] sm:min-w-[16px] sm:h-[16px] px-0.5 text-[9px] sm:text-[10px] font-bold bg-[#F39200] text-white rounded-full shadow-sm">
                                {risk.commentsCount > 99 ? '99+' : risk.commentsCount}
                              </span>
                            )}
                          </Button>
                          <Button variant="ghost" size="icon-sm" title={isAr ? 'تعديل' : 'Edit'} onClick={() => handleEditRisk(risk)} className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8">
                            <Edit className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title={isAr ? 'حذف' : 'Delete'}
                            className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-[var(--status-error)] hover:text-[var(--status-error)]"
                            onClick={() => handleDeleteRisk(risk)}
                          >
                            <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between border-t border-[var(--border)] p-2 sm:p-3 md:p-4 gap-3">
              <div className="flex items-center gap-2">
                <p className="text-[10px] sm:text-xs md:text-sm text-[var(--foreground-secondary)]">
                  {isAr
                    ? `عرض ${paginatedRisks.length} من ${filteredRisks.length} خطر`
                    : `Showing ${paginatedRisks.length} of ${filteredRisks.length} risks`}
                </p>
                <Select
                  options={[
                    { value: '5', label: '5' },
                    { value: '10', label: '10' },
                    { value: '20', label: '20' },
                    { value: '50', label: '50' },
                  ]}
                  value={String(itemsPerPage)}
                  onChange={(val) => {
                    setItemsPerPage(parseInt(val, 10));
                    setCurrentPage(1);
                  }}
                  className="w-16 h-8 text-xs"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  title={isAr ? 'الصفحة الأولى' : 'First page'}
                >
                  {isAr ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                  {isAr ? <ChevronRight className="h-4 w-4 -ms-2" /> : <ChevronLeft className="h-4 w-4 -ms-2" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  title={isAr ? 'الصفحة السابقة' : 'Previous page'}
                >
                  {isAr ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
                <div className="flex items-center gap-1 px-2">
                  <input
                    type="number"
                    min={1}
                    max={totalPages || 1}
                    value={currentPage}
                    onChange={(e) => {
                      const page = parseInt(e.target.value, 10);
                      if (page >= 1 && page <= totalPages) {
                        setCurrentPage(page);
                      }
                    }}
                    className="w-12 h-8 text-center text-sm border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)]"
                  />
                  <span className="text-sm text-[var(--foreground-secondary)]">
                    / {totalPages || 1}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  title={isAr ? 'الصفحة التالية' : 'Next page'}
                >
                  {isAr ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage >= totalPages}
                  title={isAr ? 'الصفحة الأخيرة' : 'Last page'}
                >
                  {isAr ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  {isAr ? <ChevronLeft className="h-4 w-4 -ms-2" /> : <ChevronRight className="h-4 w-4 -ms-2" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Card View */
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {paginatedRisks.map((risk) => (
            <Card key={risk.id} hover className={cn(
              "overflow-hidden relative",
              risk.isDeleted && [
                "opacity-75 hover:opacity-90",
                "border-2 border-red-300 dark:border-red-700/70",
                "bg-gradient-to-br from-red-50/50 to-transparent dark:from-red-950/30 dark:to-transparent"
              ]
            )}>
              {/* خط مائل للمخاطر المحذوفة */}
              {risk.isDeleted && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full bg-[repeating-linear-gradient(135deg,transparent,transparent_10px,rgba(239,68,68,0.1)_10px,rgba(239,68,68,0.1)_20px)]" />
                </div>
              )}
              <div className="p-4 relative">
                {/* Deleted Banner - محسّن */}
                {risk.isDeleted && (
                  <div className="mb-3 -mx-4 -mt-4 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold text-center flex items-center justify-center gap-2 shadow-md">
                    <Trash2 className="h-3.5 w-3.5 animate-pulse" />
                    {isAr ? 'خطر محذوف' : 'Deleted Risk'}
                    <Trash2 className="h-3.5 w-3.5 animate-pulse" />
                  </div>
                )}
                {/* Header */}
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {risk.isDeleted && (
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/50">
                        <X className="h-3.5 w-3.5 text-red-500" />
                      </span>
                    )}
                    <code className={cn(
                      "rounded px-2 py-1 text-xs font-mono",
                      risk.isDeleted
                        ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 line-through decoration-2"
                        : "bg-[var(--background-tertiary)]"
                    )}>
                      {risk.riskNumber}
                    </code>
                  </div>
                  <Badge variant={getStatusBadgeVariant(risk.status)}>
                    {getStatusDisplayName(risk.status)}
                  </Badge>
                </div>

                {/* Title */}
                <h3 className={cn(
                  "mb-2 font-semibold",
                  risk.isDeleted
                    ? "line-through decoration-red-400 decoration-2 text-red-600/70 dark:text-red-400/70"
                    : "text-[var(--foreground)]"
                )}>
                  {isAr ? risk.titleAr : risk.titleEn}
                </h3>
                <p className="mb-4 text-sm text-[var(--foreground-secondary)] line-clamp-2">
                  {isAr ? risk.descriptionAr : risk.descriptionEn}
                </p>

                {/* Category & Department */}
                <div className="mb-4 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-[var(--background-secondary)] px-2 py-1">
                    {t(`risks.categories.${risk.categoryCode}`)}
                  </span>
                  <span className="rounded-full bg-[var(--background-secondary)] px-2 py-1">
                    {isAr ? risk.departmentAr : risk.departmentEn}
                  </span>
                </div>

                {/* Risk Scores */}
                <div className="mb-4 grid grid-cols-2 gap-4 rounded-lg bg-[var(--background-secondary)] p-3">
                  <div>
                    <p className="text-xs text-[var(--foreground-secondary)]">
                      {t('risks.inherentRisk')}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-lg font-bold">{risk.inherentScore}</span>
                      <Badge variant={getRatingBadgeVariant(risk.inherentRating)} className="text-xs">
                        {t(`risks.ratings.${risk.inherentRating}`)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--foreground-secondary)]">
                      {t('risks.residualRisk')}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-lg font-bold">{risk.residualScore || '-'}</span>
                      {risk.residualRating && (
                        <Badge variant={getRatingBadgeVariant(risk.residualRating)} className="text-xs">
                          {t(`risks.ratings.${risk.residualRating}`)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-[var(--border)] pt-4">
                  <div className="text-sm text-[var(--foreground-secondary)]">
                    <span className="font-medium">{t('risks.riskOwner')}:</span>{' '}
                    {isAr ? risk.ownerAr : risk.ownerEn}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => handleViewRisk(risk)} title={isAr ? 'عرض' : 'View'}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => router.push(`/risks/${risk.id}`)}
                      title={isAr ? 'التفاصيل والنقاش' : 'Details & Discussion'}
                      className="text-[var(--primary)]"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleEditRisk(risk)} title={isAr ? 'تعديل' : 'Edit'}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" className="text-[var(--status-error)]" onClick={() => handleDeleteRisk(risk)} title={isAr ? 'حذف' : 'Delete'}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {/* Cards View Pagination */}
          {totalPages > 1 && (
            <div className="col-span-full">
              <Card>
                <CardContent className="p-3">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-[var(--foreground-secondary)]">
                        {isAr
                          ? `عرض ${paginatedRisks.length} من ${filteredRisks.length} خطر`
                          : `Showing ${paginatedRisks.length} of ${filteredRisks.length} risks`}
                      </p>
                      <Select
                        options={[
                          { value: '6', label: '6' },
                          { value: '12', label: '12' },
                          { value: '24', label: '24' },
                        ]}
                        value={String(itemsPerPage)}
                        onChange={(val) => {
                          setItemsPerPage(parseInt(val, 10));
                          setCurrentPage(1);
                        }}
                        className="w-16 h-8 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        {isAr ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                        <span className="ms-1">{isAr ? 'السابق' : 'Previous'}</span>
                      </Button>
                      <span className="text-sm text-[var(--foreground)]">
                        {currentPage} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage >= totalPages}
                      >
                        <span className="me-1">{isAr ? 'التالي' : 'Next'}</span>
                        {isAr ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* No Results */}
      {filteredRisks.length === 0 && (
        <Card className="p-12 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-[var(--foreground-muted)]" />
          <p className="mt-4 text-lg font-medium text-[var(--foreground)]">
            {isAr ? 'لا توجد مخاطر مطابقة' : 'No matching risks found'}
          </p>
          <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
            {isAr ? 'حاول تعديل معايير البحث أو التصفية' : 'Try adjusting your search or filter criteria'}
          </p>
        </Card>
      )}

      {/* Risk Wizard */}
      {showWizard && (
        <RiskWizard
          onClose={() => setShowWizard(false)}
          onSave={handleSaveRisk}
        />
      )}

      {/* View Risk Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedRisk(null);
          setViewModalTab('details');
          setModalChangeLogs([]);
          setModalTreatments([]);
          setModalAssessments([]);
          setModalIncidents([]);
        }}
        title={isAr ? 'تفاصيل الخطر' : 'Risk Details'}
        size="xl"
      >
        {selectedRisk && (
          <div className="space-y-4">
            {/* Header Info */}
            <div className="flex items-start justify-between">
              <div>
                <code className="rounded bg-[var(--background-tertiary)] px-3 py-1 text-sm font-mono">
                  {selectedRisk.riskNumber}
                </code>
                <h3 className="mt-2 text-lg font-semibold text-[var(--foreground)]">
                  {isAr ? selectedRisk.titleAr : selectedRisk.titleEn}
                </h3>
              </div>
              <Badge variant={getStatusBadgeVariant(selectedRisk.status)}>
                {getStatusDisplayName(selectedRisk.status)}
              </Badge>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-[var(--border)] overflow-x-auto">
              <button
                onClick={() => setViewModalTab('details')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  viewModalTab === 'details'
                    ? 'border-b-2 border-[var(--primary)] text-[var(--primary)]'
                    : 'text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                {isAr ? 'التفاصيل' : 'Details'}
              </button>
              <button
                onClick={() => setViewModalTab('assessment')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  viewModalTab === 'assessment'
                    ? 'border-b-2 border-[var(--primary)] text-[var(--primary)]'
                    : 'text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
                }`}
              >
                <Gauge className="h-3.5 w-3.5" />
                {isAr ? 'التقييم' : 'Assessment'}
              </button>
              <button
                onClick={() => setViewModalTab('treatments')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  viewModalTab === 'treatments'
                    ? 'border-b-2 border-[var(--primary)] text-[var(--primary)]'
                    : 'text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
                }`}
              >
                <ClipboardList className="h-3.5 w-3.5" />
                {isAr ? 'المعالجة' : 'Treatments'}
              </button>
              <button
                onClick={() => setViewModalTab('discussion')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  viewModalTab === 'discussion'
                    ? 'border-b-2 border-[var(--primary)] text-[var(--primary)]'
                    : 'text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                {isAr ? 'النقاش' : 'Discussion'}
              </button>
              <button
                onClick={() => setViewModalTab('incidents')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  viewModalTab === 'incidents'
                    ? 'border-b-2 border-[var(--primary)] text-[var(--primary)]'
                    : 'text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
                }`}
              >
                <Flame className="h-3.5 w-3.5" />
                {isAr ? 'الحوادث' : 'Incidents'}
              </button>
              <button
                onClick={() => setViewModalTab('history')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  viewModalTab === 'history'
                    ? 'border-b-2 border-[var(--primary)] text-[var(--primary)]'
                    : 'text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
                }`}
              >
                <History className="h-3.5 w-3.5" />
                {isAr ? 'السجل' : 'History'}
              </button>
            </div>

            {/* Tab Content */}
            <div className="max-h-[60vh] overflow-y-auto">
              {viewModalTab === 'details' ? (
                <div className="space-y-6">
                  {/* Description */}
                  <div>
                    <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--foreground-secondary)]">
                      <FileText className="h-4 w-4" />
                      {isAr ? 'الوصف' : 'Description'}
                    </h4>
                    <p className="text-sm text-[var(--foreground)]">
                      {isAr ? selectedRisk.descriptionAr : selectedRisk.descriptionEn}
                    </p>
                  </div>

            {/* Classification */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-[var(--background-secondary)] p-4">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--foreground-secondary)]">
                  <Building2 className="h-4 w-4" />
                  {isAr ? 'التصنيف' : 'Classification'}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--foreground-secondary)]">{t('risks.riskCategory')}:</span>
                    <span className="font-medium">{t(`risks.categories.${selectedRisk.categoryCode}`)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--foreground-secondary)]">{t('risks.department')}:</span>
                    <span className="font-medium">{isAr ? selectedRisk.departmentAr : selectedRisk.departmentEn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--foreground-secondary)]">{isAr ? 'العملية' : 'Process'}:</span>
                    <span className="font-medium">{isAr ? selectedRisk.processAr : selectedRisk.processEn}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-[var(--background-secondary)] p-4">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--foreground-secondary)]">
                  <User className="h-4 w-4" />
                  {isAr ? 'المسؤولون' : 'Responsible'}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--foreground-secondary)]">{t('risks.riskOwner')}:</span>
                    <span className="font-medium">{isAr ? selectedRisk.ownerAr : selectedRisk.ownerEn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--foreground-secondary)]">{isAr ? 'رائد المخاطر' : 'Champion'}:</span>
                    <span className="font-medium">{isAr ? selectedRisk.championAr : selectedRisk.championEn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--foreground-secondary)]">{isAr ? 'المصدر' : 'Issued By'}:</span>
                    <span className="font-medium">{selectedRisk.issuedBy}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Scores */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-[var(--border)] p-4">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--foreground-secondary)]">
                  <Shield className="h-4 w-4" />
                  {t('risks.inherentRisk')}
                </h4>
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold text-[var(--foreground)]">
                    {selectedRisk.inherentScore}
                  </div>
                  <div>
                    <Badge variant={getRatingBadgeVariant(selectedRisk.inherentRating)}>
                      {t(`risks.ratings.${selectedRisk.inherentRating}`)}
                    </Badge>
                    <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                      {isAr ? 'الاحتمالية' : 'Likelihood'}: {selectedRisk.inherentLikelihood} × {isAr ? 'الأثر' : 'Impact'}: {selectedRisk.inherentImpact}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-[var(--border)] p-4">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--foreground-secondary)]">
                  <Shield className="h-4 w-4" />
                  {t('risks.residualRisk')}
                </h4>
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold text-[var(--foreground)]">
                    {selectedRisk.residualScore || '-'}
                  </div>
                  {selectedRisk.residualRating && (
                    <div>
                      <Badge variant={getRatingBadgeVariant(selectedRisk.residualRating)}>
                        {t(`risks.ratings.${selectedRisk.residualRating}`)}
                      </Badge>
                      <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                        {isAr ? 'الاحتمالية' : 'Likelihood'}: {selectedRisk.residualLikelihood} × {isAr ? 'الأثر' : 'Impact'}: {selectedRisk.residualImpact}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Potential Cause & Impact */}
            {(selectedRisk.potentialCauseAr || selectedRisk.potentialCauseEn || selectedRisk.potentialImpactAr || selectedRisk.potentialImpactEn) && (
              <div className="grid gap-4 sm:grid-cols-2">
                {(selectedRisk.potentialCauseAr || selectedRisk.potentialCauseEn) && (
                  <div className="rounded-lg bg-[var(--background-secondary)] p-4">
                    <h4 className="mb-2 text-sm font-medium text-[var(--foreground-secondary)]">
                      {t('risks.potentialCause')}
                    </h4>
                    <p className="text-sm text-[var(--foreground)]">
                      {isAr ? (selectedRisk.potentialCauseAr || selectedRisk.potentialCauseEn) : (selectedRisk.potentialCauseEn || selectedRisk.potentialCauseAr)}
                    </p>
                  </div>
                )}
                {(selectedRisk.potentialImpactAr || selectedRisk.potentialImpactEn) && (
                  <div className="rounded-lg bg-[var(--background-secondary)] p-4">
                    <h4 className="mb-2 text-sm font-medium text-[var(--foreground-secondary)]">
                      {t('risks.potentialImpact')}
                    </h4>
                    <p className="text-sm text-[var(--foreground)]">
                      {isAr ? (selectedRisk.potentialImpactAr || selectedRisk.potentialImpactEn) : (selectedRisk.potentialImpactEn || selectedRisk.potentialImpactAr)}
                    </p>
                  </div>
                )}
              </div>
            )}

                  {/* Date */}
                  <div className="flex items-center gap-2 text-sm text-[var(--foreground-secondary)]">
                    <Calendar className="h-4 w-4" />
                    <span>{isAr ? 'تاريخ التحديد:' : 'Identified Date:'}</span>
                    <span className="font-medium">{new Date(selectedRisk.identifiedDate).toLocaleDateString(isAr ? 'ar-SA-u-ca-gregory' : 'en-US')}</span>
                  </div>
                </div>
              ) : viewModalTab === 'assessment' ? (
                /* Assessment Tab */
                <div className="py-2 space-y-4">
                  {/* Current Risk Scores */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border-2 border-[var(--primary)] p-4">
                      <h4 className="font-semibold text-sm text-[var(--primary)] mb-3 flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        {isAr ? 'الخطر الأصلي (الكامن)' : 'Inherent Risk'}
                      </h4>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded bg-[var(--background-secondary)]">
                          <p className="text-xs text-[var(--foreground-muted)]">{isAr ? 'الاحتمالية' : 'Likelihood'}</p>
                          <p className="text-xl font-bold text-[var(--foreground)]">{selectedRisk.inherentLikelihood}</p>
                        </div>
                        <div className="p-2 rounded bg-[var(--background-secondary)]">
                          <p className="text-xs text-[var(--foreground-muted)]">{isAr ? 'التأثير' : 'Impact'}</p>
                          <p className="text-xl font-bold text-[var(--foreground)]">{selectedRisk.inherentImpact}</p>
                        </div>
                        <div className="p-2 rounded bg-[var(--primary-light)]">
                          <p className="text-xs text-[var(--foreground-muted)]">{isAr ? 'الدرجة' : 'Score'}</p>
                          <p className="text-xl font-bold text-[var(--primary)]">{selectedRisk.inherentScore}</p>
                        </div>
                      </div>
                      <div className="mt-3 text-center">
                        <Badge variant={getRatingBadgeVariant(selectedRisk.inherentRating)}>
                          {t(`risks.ratings.${selectedRisk.inherentRating}`)}
                        </Badge>
                      </div>
                    </div>

                    <div className="rounded-lg border border-[var(--border)] p-4">
                      <h4 className="font-semibold text-sm text-[var(--foreground-secondary)] mb-3 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        {isAr ? 'الخطر المتبقي' : 'Residual Risk'}
                      </h4>
                      {selectedRisk.residualScore ? (
                        <>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="p-2 rounded bg-[var(--background-secondary)]">
                              <p className="text-xs text-[var(--foreground-muted)]">{isAr ? 'الاحتمالية' : 'Likelihood'}</p>
                              <p className="text-xl font-bold text-[var(--foreground)]">{selectedRisk.residualLikelihood}</p>
                            </div>
                            <div className="p-2 rounded bg-[var(--background-secondary)]">
                              <p className="text-xs text-[var(--foreground-muted)]">{isAr ? 'التأثير' : 'Impact'}</p>
                              <p className="text-xl font-bold text-[var(--foreground)]">{selectedRisk.residualImpact}</p>
                            </div>
                            <div className="p-2 rounded bg-green-50">
                              <p className="text-xs text-[var(--foreground-muted)]">{isAr ? 'الدرجة' : 'Score'}</p>
                              <p className="text-xl font-bold text-green-600">{selectedRisk.residualScore}</p>
                            </div>
                          </div>
                          <div className="mt-3 text-center">
                            <Badge variant={getRatingBadgeVariant(selectedRisk.residualRating || 'Moderate')}>
                              {t(`risks.ratings.${selectedRisk.residualRating}`)}
                            </Badge>
                          </div>
                          {selectedRisk.inherentScore && selectedRisk.residualScore && (
                            <div className="mt-3 p-2 rounded bg-green-50 text-center">
                              <p className="text-xs text-green-600">
                                {isAr ? 'نسبة التخفيض' : 'Risk Reduction'}:
                                <span className="font-bold ms-1">
                                  {Math.round((1 - selectedRisk.residualScore / selectedRisk.inherentScore) * 100)}%
                                </span>
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-6 text-[var(--foreground-muted)]">
                          {isAr ? 'لم يتم تقييمه بعد' : 'Not assessed yet'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Assessment History */}
                  <div>
                    <h4 className="font-semibold text-sm text-[var(--foreground)] mb-3 flex items-center gap-2">
                      <History className="h-4 w-4 text-[var(--primary)]" />
                      {isAr ? 'سجل التقييمات' : 'Assessment History'}
                    </h4>
                    {modalAssessmentsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-[var(--primary)]" />
                      </div>
                    ) : modalAssessments.length === 0 ? (
                      <div className="text-center py-6 text-[var(--foreground-muted)] bg-[var(--background-secondary)] rounded-lg">
                        <Gauge className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">{isAr ? 'لا توجد تقييمات سابقة' : 'No assessment history'}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {modalAssessments.map((assessment) => (
                          <div key={assessment.id} className="p-3 rounded-lg border border-[var(--border)] bg-[var(--card)]">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant={assessment.assessmentType === 'inherent' ? 'warning' : 'success'} size="sm">
                                {assessment.assessmentType === 'inherent' ? (isAr ? 'كامن' : 'Inherent') : (isAr ? 'متبقي' : 'Residual')}
                              </Badge>
                              <span className="text-xs text-[var(--foreground-muted)]">
                                {new Date(assessment.assessmentDate).toLocaleDateString(isAr ? 'ar-SA-u-ca-gregory' : 'en-US')}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-[var(--foreground-secondary)]">
                                {isAr ? 'الدرجة' : 'Score'}: <strong className="text-[var(--foreground)]">{assessment.score}</strong>
                              </span>
                              <span className="text-[var(--foreground-secondary)]">
                                {isAr ? 'التصنيف' : 'Rating'}: <strong className="text-[var(--foreground)]">{assessment.rating}</strong>
                              </span>
                            </div>
                            {assessment.assessedBy && (
                              <p className="text-xs text-[var(--foreground-muted)] mt-2">
                                {isAr ? 'بواسطة' : 'By'}: {isAr ? assessment.assessedBy.fullName : assessment.assessedBy.fullNameEn || assessment.assessedBy.fullName}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : viewModalTab === 'treatments' ? (
                /* Treatments Tab */
                <div className="py-2">
                  {/* Add Treatment Button - redirects to treatment page */}
                  <div className="mb-4">
                    <Button
                      size="sm"
                      onClick={() => {
                        if (selectedRisk) {
                          router.push(`/treatment?riskId=${selectedRisk.id}&action=add`);
                        }
                      }}
                      className="w-full border-2 border-dashed border-[var(--primary)] bg-transparent text-[var(--primary)] hover:bg-[var(--primary)]/10"
                    >
                      <Plus className="h-4 w-4 me-2" />
                      {isAr ? 'إضافة خطة معالجة جديدة' : 'Add New Treatment Plan'}
                    </Button>
                  </div>

                  {modalTreatmentsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
                    </div>
                  ) : modalTreatments.length === 0 ? (
                    <div className="text-center py-8 text-[var(--foreground-muted)]">
                      <ClipboardList className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>{isAr ? 'لا توجد خطط معالجة' : 'No treatment plans'}</p>
                      <p className="text-xs mt-1">{isAr ? 'انقر على الزر أعلاه لإضافة خطة معالجة' : 'Click the button above to add a treatment plan'}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {modalTreatments.map((plan, index) => (
                        <div key={plan.id} className="border border-[var(--border)] rounded-lg overflow-hidden">
                          {/* Plan Header */}
                          <div className="p-3 flex items-center justify-between bg-[var(--background-secondary)]">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold px-2 py-0.5 rounded bg-[var(--primary)] text-white">
                                {index + 1}
                              </span>
                              <span className="font-medium text-sm text-[var(--foreground)]">
                                {isAr ? plan.titleAr : plan.titleEn}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={
                                plan.strategy === 'avoid' ? 'danger' :
                                plan.strategy === 'reduce' ? 'warning' :
                                plan.strategy === 'transfer' ? 'info' : 'secondary'
                              } size="sm">
                                {plan.strategy === 'avoid' ? (isAr ? 'تجنب' : 'Avoid') :
                                 plan.strategy === 'reduce' ? (isAr ? 'تخفيض' : 'Reduce') :
                                 plan.strategy === 'transfer' ? (isAr ? 'نقل' : 'Transfer') :
                                 (isAr ? 'قبول' : 'Accept')}
                              </Badge>
                              <Badge variant={
                                plan.status === 'completed' ? 'success' :
                                plan.status === 'inProgress' ? 'warning' :
                                plan.status === 'overdue' ? 'danger' : 'secondary'
                              } size="sm">
                                {plan.status === 'completed' ? (isAr ? 'مكتمل' : 'Completed') :
                                 plan.status === 'inProgress' ? (isAr ? 'قيد التنفيذ' : 'In Progress') :
                                 plan.status === 'overdue' ? (isAr ? 'متأخر' : 'Overdue') :
                                 (isAr ? 'لم يبدأ' : 'Not Started')}
                              </Badge>
                            </div>
                          </div>

                          {/* Plan Content */}
                          <div className="p-3">
                            <p className="text-sm text-[var(--foreground-secondary)] mb-3">
                              {isAr ? plan.descriptionAr : plan.descriptionEn}
                            </p>

                            {/* Plan Details */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-3">
                              <div className="p-2 rounded bg-[var(--background-secondary)]">
                                <p className="text-[var(--foreground-muted)]">{isAr ? 'المسؤول' : 'Responsible'}</p>
                                <p className="font-medium text-[var(--foreground)]">
                                  {plan.responsible ? (isAr ? plan.responsible.fullName : plan.responsible.fullNameEn || plan.responsible.fullName) : '-'}
                                </p>
                              </div>
                              <div className="p-2 rounded bg-[var(--background-secondary)]">
                                <p className="text-[var(--foreground-muted)]">{isAr ? 'تاريخ البدء' : 'Start'}</p>
                                <p className="font-medium text-[var(--foreground)]">
                                  {new Date(plan.startDate).toLocaleDateString(isAr ? 'ar-SA-u-ca-gregory' : 'en-US')}
                                </p>
                              </div>
                              <div className="p-2 rounded bg-[var(--background-secondary)]">
                                <p className="text-[var(--foreground-muted)]">{isAr ? 'الاستحقاق' : 'Due'}</p>
                                <p className="font-medium text-[var(--foreground)]">
                                  {new Date(plan.dueDate).toLocaleDateString(isAr ? 'ar-SA-u-ca-gregory' : 'en-US')}
                                </p>
                              </div>
                              <div className="p-2 rounded bg-[var(--background-secondary)]">
                                <p className="text-[var(--foreground-muted)]">{isAr ? 'التقدم' : 'Progress'}</p>
                                <p className="font-medium text-[var(--foreground)]">{plan.progress}%</p>
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="h-2 rounded-full bg-[var(--background-secondary)] overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${plan.progress}%`,
                                  backgroundColor: plan.progress === 100 ? '#22c55e' : 'var(--primary)'
                                }}
                              />
                            </div>

                            {/* Tasks */}
                            {plan.tasks && plan.tasks.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-[var(--border)]">
                                <h5 className="text-xs font-bold mb-2 flex items-center gap-1 text-[var(--foreground)]">
                                  <ListChecks className="h-3 w-3" />
                                  {isAr ? 'المهام' : 'Tasks'} ({plan.tasks.length})
                                </h5>
                                <div className="space-y-1">
                                  {plan.tasks.map((task) => (
                                    <div key={task.id} className="flex items-center gap-2 text-xs p-2 rounded bg-[var(--background-secondary)]">
                                      {task.status === 'completed' ? (
                                        <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                                      ) : (
                                        <Clock className="h-3 w-3 text-[var(--foreground-muted)] flex-shrink-0" />
                                      )}
                                      <span className={task.status === 'completed' ? 'line-through text-[var(--foreground-muted)]' : 'text-[var(--foreground)]'}>
                                        {isAr ? task.titleAr : task.titleEn}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : viewModalTab === 'discussion' ? (
                /* Discussion Tab */
                <div className="py-2">
                  {currentUser ? (
                    <RiskDiscussion
                      riskId={selectedRisk.id}
                      currentUserId={currentUser.id}
                      currentUserRole={currentUser.role}
                    />
                  ) : (
                    <div className="text-center py-8 text-[var(--foreground-secondary)]">
                      {isAr ? 'جاري التحميل...' : 'Loading...'}
                    </div>
                  )}
                </div>
              ) : viewModalTab === 'incidents' ? (
                /* Incidents Tab */
                <div className="py-2">
                  {modalIncidentsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
                    </div>
                  ) : modalIncidents.length === 0 ? (
                    <div className="text-center py-8 text-[var(--foreground-muted)]">
                      <Flame className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>{isAr ? 'لا توجد حوادث مسجلة' : 'No incidents recorded'}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {modalIncidents.map((incident) => (
                        <div key={incident.id} className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)]">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <code className="text-xs bg-[var(--background-secondary)] px-2 py-0.5 rounded">
                                {incident.incidentNumber}
                              </code>
                              <h5 className="font-medium text-sm text-[var(--foreground)] mt-1">
                                {isAr ? incident.titleAr : incident.titleEn}
                              </h5>
                            </div>
                            <div className="flex gap-2">
                              <Badge variant={
                                incident.severity === 'critical' ? 'danger' :
                                incident.severity === 'major' ? 'warning' :
                                incident.severity === 'minor' ? 'info' : 'secondary'
                              } size="sm">
                                {incident.severity === 'critical' ? (isAr ? 'حرج' : 'Critical') :
                                 incident.severity === 'major' ? (isAr ? 'رئيسي' : 'Major') :
                                 incident.severity === 'minor' ? (isAr ? 'ثانوي' : 'Minor') :
                                 (isAr ? 'ضئيل' : 'Negligible')}
                              </Badge>
                              <Badge variant={
                                incident.status === 'resolved' ? 'success' :
                                incident.status === 'investigating' ? 'warning' : 'danger'
                              } size="sm">
                                {incident.status === 'resolved' ? (isAr ? 'تم الحل' : 'Resolved') :
                                 incident.status === 'investigating' ? (isAr ? 'قيد التحقيق' : 'Investigating') :
                                 (isAr ? 'مفتوح' : 'Open')}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-[var(--foreground-secondary)] mb-2">
                            {isAr ? incident.descriptionAr : incident.descriptionEn}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-[var(--foreground-muted)]">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(incident.occurredAt).toLocaleDateString(isAr ? 'ar-SA-u-ca-gregory' : 'en-US')}
                            </span>
                            {incident.reportedBy && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {isAr ? incident.reportedBy.fullName : incident.reportedBy.fullNameEn || incident.reportedBy.fullName}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* History Tab */
                <div className="py-2">
                  {modalChangeLogsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
                    </div>
                  ) : modalChangeLogs.length === 0 ? (
                    <div className="text-center py-8 text-[var(--foreground-muted)]">
                      <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>{isAr ? 'لا توجد تعديلات مسجلة' : 'No changes recorded yet'}</p>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute start-[18px] top-0 bottom-0 w-0.5 bg-[var(--border)]" />

                      <div className="space-y-4">
                        {modalChangeLogs.map((log) => (
                          <div key={log.id} className="relative flex gap-4">
                            {/* Timeline dot */}
                            <div className={`relative z-10 flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                              log.changeType === 'treatment_add' ? 'bg-green-100 text-green-600' :
                              log.changeType === 'treatment_delete' ? 'bg-red-100 text-red-600' :
                              log.changeType === 'treatment_update' ? 'bg-blue-100 text-blue-600' :
                              log.changeCategory === 'assessment' ? 'bg-purple-100 text-purple-600' :
                              log.changeCategory === 'status' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-[var(--primary-light)] text-[var(--primary)]'
                            }`}>
                              {log.changeType === 'treatment_add' ? <Plus className="h-4 w-4" /> :
                               log.changeType === 'treatment_delete' ? <Minus className="h-4 w-4" /> :
                               log.changeType === 'treatment_update' ? <Wrench className="h-4 w-4" /> :
                               log.changeCategory === 'assessment' ? <Target className="h-4 w-4" /> :
                               log.changeCategory === 'status' ? <Activity className="h-4 w-4" /> :
                               <PenLine className="h-4 w-4" />}
                            </div>

                            {/* Content */}
                            <div className="flex-1 bg-[var(--card)] rounded-xl border border-[var(--border)] p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="font-medium text-sm text-[var(--foreground)]">
                                    {isAr ? log.descriptionAr : log.description}
                                  </p>
                                  {log.fieldNameAr && (
                                    <p className="text-xs text-[var(--foreground-secondary)] mt-0.5">
                                      {isAr ? log.fieldNameAr : log.fieldName}
                                    </p>
                                  )}
                                </div>
                                <span className="text-xs text-[var(--foreground-muted)] whitespace-nowrap">
                                  {new Date(log.createdAt).toLocaleDateString(isAr ? 'ar-SA-u-ca-gregory' : 'en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>

                              {/* Value change display */}
                              {(log.oldValue || log.newValue) && log.changeType === 'update' && (
                                <div className="mt-2 flex items-center gap-2 text-xs">
                                  {log.oldValue && (
                                    <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 line-through max-w-[150px] truncate">
                                      {log.oldValue}
                                    </span>
                                  )}
                                  <ArrowRight className="h-3 w-3 text-[var(--foreground-muted)]" />
                                  {log.newValue && (
                                    <span className="px-2 py-0.5 rounded bg-green-50 text-green-700 max-w-[150px] truncate">
                                      {log.newValue}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* User info */}
                              <div className="mt-2 flex items-center gap-2 text-xs text-[var(--foreground-secondary)]">
                                <div className="w-5 h-5 rounded-full bg-[var(--primary-light)] flex items-center justify-center">
                                  <User className="h-3 w-3 text-[var(--primary)]" />
                                </div>
                                <span>{isAr ? log.user.fullName : log.user.fullNameEn || log.user.fullName}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowViewModal(false)}>
            {t('common.close')}
          </Button>
          <Button onClick={() => {
            setShowViewModal(false);
            handleEditRisk(selectedRisk!);
          }}>
            <Edit className="me-2 h-4 w-4" />
            {t('common.edit')}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Edit Risk Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedRisk(null);
        }}
        title={isAr ? 'تعديل الخطر' : 'Edit Risk'}
        size="xl"
      >
        {selectedRisk && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
            {/* Risk Number - Read Only */}
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                {isAr ? 'رقم الخطر' : 'Risk Number'}
              </label>
              <Input
                value={selectedRisk.riskNumber}
                disabled
                className="bg-[var(--background-secondary)] cursor-not-allowed opacity-70"
              />
              <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                {isAr ? 'رقم الخطر غير قابل للتعديل' : 'Risk ID cannot be modified'}
              </p>
            </div>

            {/* Title AR/EN */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                  {isAr ? 'العنوان (عربي)' : 'Title (Arabic)'}
                </label>
                <Input
                  value={selectedRisk.titleAr}
                  onChange={(e) => setSelectedRisk({ ...selectedRisk, titleAr: e.target.value })}
                  dir="rtl"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                  {isAr ? 'العنوان (إنجليزي)' : 'Title (English)'}
                </label>
                <Input
                  value={selectedRisk.titleEn}
                  onChange={(e) => setSelectedRisk({ ...selectedRisk, titleEn: e.target.value })}
                  dir="ltr"
                />
              </div>
            </div>

            {/* Description AR/EN */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                  {isAr ? 'الوصف (عربي)' : 'Description (Arabic)'}
                </label>
                <textarea
                  value={selectedRisk.descriptionAr}
                  onChange={(e) => setSelectedRisk({ ...selectedRisk, descriptionAr: e.target.value })}
                  dir="rtl"
                  rows={3}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                  {isAr ? 'الوصف (إنجليزي)' : 'Description (English)'}
                </label>
                <textarea
                  value={selectedRisk.descriptionEn}
                  onChange={(e) => setSelectedRisk({ ...selectedRisk, descriptionEn: e.target.value })}
                  dir="ltr"
                  rows={3}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                {isAr ? 'الإدارة' : 'Department'}
              </label>
              <Select
                options={allDepartments.map(dept => ({
                  value: dept.id,
                  label: isAr ? dept.nameAr : dept.nameEn
                }))}
                value={selectedRisk.departmentId || ''}
                onChange={(value) => {
                  const newDept = allDepartments.find(d => d.id === value);
                  if (newDept) {
                    // Extract sequence number from current risk number (e.g., PRO-R-761 -> 761)
                    const sequenceMatch = selectedRisk.riskNumber.match(/(\d+)$/);
                    const sequenceNumber = sequenceMatch ? sequenceMatch[1] : '001';
                    const newRiskNumber = `${newDept.code}-${sequenceNumber}`;
                    setSelectedRisk({
                      ...selectedRisk,
                      departmentId: value,
                      departmentAr: newDept.nameAr,
                      departmentEn: newDept.nameEn,
                      riskNumber: newRiskNumber
                    });
                  }
                }}
              />
              <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                {isAr ? 'عند تغيير الإدارة سيتم تحديث رمز الخطر تلقائياً' : 'Changing department will auto-update the risk code'}
              </p>
            </div>

            {/* Risk Owner */}
            <div>
              <Autocomplete
                label={isAr ? 'مالك الخطر' : 'Risk Owner'}
                placeholder={isAr ? 'ابحث عن مالك الخطر...' : 'Search for risk owner...'}
                options={riskOwners.map(owner => ({
                  id: owner.id,
                  label: isAr ? owner.fullName : (owner.fullNameEn || owner.fullName),
                  labelSecondary: isAr ? (owner.fullNameEn || undefined) : (owner.fullName !== owner.fullNameEn ? owner.fullName : undefined)
                }))}
                value={selectedRisk.ownerId || ''}
                onChange={(option) => {
                  if (option) {
                    const selectedOwner = riskOwners.find(o => o.id === option.id);
                    setSelectedRisk({
                      ...selectedRisk,
                      ownerId: option.id,
                      ownerAr: selectedOwner?.fullName || 'غير محدد',
                      ownerEn: selectedOwner?.fullNameEn || selectedOwner?.fullName || 'Not Assigned'
                    });
                  } else {
                    setSelectedRisk({
                      ...selectedRisk,
                      ownerId: undefined,
                      ownerAr: 'غير محدد',
                      ownerEn: 'Not Assigned'
                    });
                  }
                }}
                noResultsText={isAr ? 'لا توجد نتائج' : 'No results found'}
              />
            </div>

            {/* Category & Status */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                  {t('risks.riskCategory')}
                </label>
                <Select
                  options={categoryOptions.filter(o => o.value !== '')}
                  value={selectedRisk.categoryCode}
                  onChange={(value) => setSelectedRisk({ ...selectedRisk, categoryCode: value })}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                  {t('risks.riskStatus')}
                </label>
                <Select
                  options={statusOptions.filter(o => o.value !== '')}
                  value={selectedRisk.status}
                  onChange={(value) => setSelectedRisk({ ...selectedRisk, status: value as RiskStatus })}
                />
              </div>
            </div>

            {/* Inherent Risk Assessment */}
            <div className="rounded-lg border border-[var(--border)] p-4 bg-[var(--background-secondary)]">
              <h4 className="font-medium text-[var(--foreground)] mb-3">
                {t('risks.inherentRisk')}
              </h4>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                    {t('risks.likelihood')}
                  </label>
                  <Select
                    options={[1,2,3,4,5].map(n => ({ value: String(n), label: `${n} - ${t(`assessment.likelihood.${n}`)}` }))}
                    value={String(selectedRisk.inherentLikelihood)}
                    onChange={(value) => {
                      const likelihood = parseInt(value);
                      const score = likelihood * selectedRisk.inherentImpact;
                      const rating = getRiskRating(score);
                      setSelectedRisk({
                        ...selectedRisk,
                        inherentLikelihood: likelihood,
                        inherentScore: score,
                        inherentRating: rating
                      });
                    }}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                    {t('risks.impact')}
                  </label>
                  <Select
                    options={[1,2,3,4,5].map(n => ({ value: String(n), label: `${n} - ${t(`assessment.impact.${n}`)}` }))}
                    value={String(selectedRisk.inherentImpact)}
                    onChange={(value) => {
                      const impact = parseInt(value);
                      const score = selectedRisk.inherentLikelihood * impact;
                      const rating = getRiskRating(score);
                      setSelectedRisk({
                        ...selectedRisk,
                        inherentImpact: impact,
                        inherentScore: score,
                        inherentRating: rating
                      });
                    }}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                    {t('risks.riskScore')} / {t('risks.riskRating')}
                  </label>
                  <div className="flex items-center gap-2 h-10">
                    <span className="text-lg font-bold">{selectedRisk.inherentScore}</span>
                    <Badge variant={getRatingBadgeVariant(selectedRisk.inherentRating)}>
                      {t(`risks.ratings.${selectedRisk.inherentRating}`)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Residual Risk Assessment - للقراءة فقط */}
            <div className="rounded-lg border border-[var(--border)] p-4 bg-[var(--background-secondary)]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-[var(--foreground)]">
                  {t('risks.residualRisk')}
                </h4>
                <Badge variant="secondary" size="sm">
                  {isAr ? 'للقراءة فقط' : 'Read Only'}
                </Badge>
              </div>
              {/* Info message about updating via treatment plans */}
              <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50">
                <Shield className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  <p className="font-medium">
                    {isAr
                      ? 'لا يمكن تعديل الخطر المتبقي مباشرة من هنا'
                      : 'Residual risk cannot be modified directly from here'}
                  </p>
                  <p className="mt-1 text-blue-600 dark:text-blue-400">
                    {isAr
                      ? 'لتعديل الخطر المتبقي، يرجى إنشاء خطة معالجة جديدة من صفحة "المعالجة" مع تحديد القيم المتوقعة للخطر المتبقي.'
                      : 'To modify residual risk, please create a new treatment plan from the "Treatment" page with expected residual risk values.'}
                  </p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--foreground-muted)]">
                    {t('risks.likelihood')}
                  </label>
                  <div className="h-10 flex items-center px-3 rounded-lg bg-[var(--background)] border border-[var(--border)] opacity-70">
                    <span className="text-sm font-medium">
                      {selectedRisk.residualLikelihood} - {t(`assessment.likelihood.${selectedRisk.residualLikelihood}`)}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--foreground-muted)]">
                    {t('risks.impact')}
                  </label>
                  <div className="h-10 flex items-center px-3 rounded-lg bg-[var(--background)] border border-[var(--border)] opacity-70">
                    <span className="text-sm font-medium">
                      {selectedRisk.residualImpact} - {t(`assessment.impact.${selectedRisk.residualImpact}`)}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--foreground-muted)]">
                    {t('risks.riskScore')} / {t('risks.riskRating')}
                  </label>
                  <div className="flex items-center gap-2 h-10">
                    <span className="text-lg font-bold">{selectedRisk.residualScore}</span>
                    <Badge variant={getRatingBadgeVariant(selectedRisk.residualRating)}>
                      {t(`risks.ratings.${selectedRisk.residualRating}`)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Potential Cause */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                  {t('risks.potentialCause')} ({isAr ? 'عربي' : 'Arabic'})
                </label>
                <textarea
                  value={selectedRisk.potentialCauseAr || ''}
                  onChange={(e) => setSelectedRisk({ ...selectedRisk, potentialCauseAr: e.target.value })}
                  dir="rtl"
                  rows={3}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  placeholder={isAr ? 'أدخل السبب المحتمل...' : 'Enter potential cause...'}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                  {t('risks.potentialCause')} ({isAr ? 'إنجليزي' : 'English'})
                </label>
                <textarea
                  value={selectedRisk.potentialCauseEn || ''}
                  onChange={(e) => setSelectedRisk({ ...selectedRisk, potentialCauseEn: e.target.value })}
                  dir="ltr"
                  rows={3}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  placeholder="Enter potential cause..."
                />
              </div>
            </div>

            {/* Potential Impact */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                  {t('risks.potentialImpact')} ({isAr ? 'عربي' : 'Arabic'})
                </label>
                <textarea
                  value={selectedRisk.potentialImpactAr || ''}
                  onChange={(e) => setSelectedRisk({ ...selectedRisk, potentialImpactAr: e.target.value })}
                  dir="rtl"
                  rows={3}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  placeholder={isAr ? 'أدخل التأثير المحتمل...' : 'Enter potential impact...'}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                  {t('risks.potentialImpact')} ({isAr ? 'إنجليزي' : 'English'})
                </label>
                <textarea
                  value={selectedRisk.potentialImpactEn || ''}
                  onChange={(e) => setSelectedRisk({ ...selectedRisk, potentialImpactEn: e.target.value })}
                  dir="ltr"
                  rows={3}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  placeholder="Enter potential impact..."
                />
              </div>
            </div>

            {/* Layers of Protection */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                  {t('risks.layersOfProtection')} ({isAr ? 'عربي' : 'Arabic'})
                </label>
                <textarea
                  value={selectedRisk.layersOfProtectionAr || ''}
                  onChange={(e) => setSelectedRisk({ ...selectedRisk, layersOfProtectionAr: e.target.value })}
                  dir="rtl"
                  rows={3}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  placeholder={isAr ? 'أدخل طبقات الحماية...' : 'Enter layers of protection...'}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                  {t('risks.layersOfProtection')} ({isAr ? 'إنجليزي' : 'English'})
                </label>
                <textarea
                  value={selectedRisk.layersOfProtectionEn || ''}
                  onChange={(e) => setSelectedRisk({ ...selectedRisk, layersOfProtectionEn: e.target.value })}
                  dir="ltr"
                  rows={3}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  placeholder="Enter layers of protection..."
                />
              </div>
            </div>

            {/* KRIs */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                  {t('risks.kris')} ({isAr ? 'عربي' : 'Arabic'})
                </label>
                <textarea
                  value={selectedRisk.krisAr || ''}
                  onChange={(e) => setSelectedRisk({ ...selectedRisk, krisAr: e.target.value })}
                  dir="rtl"
                  rows={3}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  placeholder={isAr ? 'أدخل مؤشرات المخاطر الرئيسية...' : 'Enter KRIs...'}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                  {t('risks.kris')} ({isAr ? 'إنجليزي' : 'English'})
                </label>
                <textarea
                  value={selectedRisk.krisEn || ''}
                  onChange={(e) => setSelectedRisk({ ...selectedRisk, krisEn: e.target.value })}
                  dir="ltr"
                  rows={3}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  placeholder="Enter KRIs..."
                />
              </div>
            </div>

            {/* Mitigation Actions */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                  {t('risks.mitigationActions')} ({isAr ? 'عربي' : 'Arabic'})
                </label>
                <textarea
                  value={selectedRisk.mitigationActionsAr || ''}
                  onChange={(e) => setSelectedRisk({ ...selectedRisk, mitigationActionsAr: e.target.value })}
                  dir="rtl"
                  rows={3}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  placeholder={isAr ? 'أدخل إجراءات التخفيف...' : 'Enter mitigation actions...'}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                  {t('risks.mitigationActions')} ({isAr ? 'إنجليزي' : 'English'})
                </label>
                <textarea
                  value={selectedRisk.mitigationActionsEn || ''}
                  onChange={(e) => setSelectedRisk({ ...selectedRisk, mitigationActionsEn: e.target.value })}
                  dir="ltr"
                  rows={3}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  placeholder="Enter mitigation actions..."
                />
              </div>
            </div>

            {/* Process & Sub-Process */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                  {t('risks.process')}
                </label>
                <Input
                  value={selectedRisk.processText || selectedRisk.processAr || ''}
                  onChange={(e) => setSelectedRisk({ ...selectedRisk, processText: e.target.value, processAr: e.target.value, processEn: e.target.value })}
                  placeholder={isAr ? 'أدخل العملية...' : 'Enter process...'}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                  {t('risks.subProcess')}
                </label>
                <Input
                  value={selectedRisk.subProcessText || selectedRisk.subProcessAr || ''}
                  onChange={(e) => setSelectedRisk({ ...selectedRisk, subProcessText: e.target.value, subProcessAr: e.target.value, subProcessEn: e.target.value })}
                  placeholder={isAr ? 'أدخل العملية الفرعية...' : 'Enter sub-process...'}
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                  {t('risks.followUpDate')}
                </label>
                <Input
                  type="date"
                  value={selectedRisk.followUpDate || ''}
                  onChange={(e) => setSelectedRisk({ ...selectedRisk, followUpDate: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                  {t('risks.nextReviewDate')}
                </label>
                <Input
                  type="date"
                  value={selectedRisk.nextReviewDate || ''}
                  onChange={(e) => setSelectedRisk({ ...selectedRisk, nextReviewDate: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowEditModal(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={async () => {
            if (selectedRisk) {
              try {
                // Check if this is a mock/fallback risk (HR risks or other mock data)
                // Note: Prisma IDs start with 'cm' and are 25+ chars, mock IDs are simple like '1', '2', 'hr-1', 'mock-1'
                const isMockRisk = selectedRisk.id.startsWith('hr-') || selectedRisk.id.startsWith('mock-') ||
                  (selectedRisk.id.length < 10 && !selectedRisk.id.startsWith('cm'));

                console.log('DEBUG Save Risk:', {
                  id: selectedRisk.id,
                  idLength: selectedRisk.id.length,
                  startsWithCm: selectedRisk.id.startsWith('cm'),
                  isMockRisk,
                  departmentId: selectedRisk.departmentId,
                  ownerId: selectedRisk.ownerId
                });

                if (isMockRisk) {
                  // Create the risk in database first
                  const createResponse = await fetch('/api/risks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      riskNumber: selectedRisk.riskNumber,
                      departmentId: selectedRisk.departmentId || null,
                      ownerId: selectedRisk.ownerId || null,
                      titleAr: selectedRisk.titleAr,
                      titleEn: selectedRisk.titleEn,
                      descriptionAr: selectedRisk.descriptionAr,
                      descriptionEn: selectedRisk.descriptionEn,
                      status: selectedRisk.status || 'open',
                      inherentLikelihood: selectedRisk.inherentLikelihood || 3,
                      inherentImpact: selectedRisk.inherentImpact || 3,
                      residualLikelihood: selectedRisk.residualLikelihood,
                      residualImpact: selectedRisk.residualImpact,
                      potentialCauseAr: selectedRisk.potentialCauseAr,
                      potentialCauseEn: selectedRisk.potentialCauseEn,
                      potentialImpactAr: selectedRisk.potentialImpactAr,
                      potentialImpactEn: selectedRisk.potentialImpactEn,
                      layersOfProtectionAr: selectedRisk.layersOfProtectionAr,
                      layersOfProtectionEn: selectedRisk.layersOfProtectionEn,
                      krisAr: selectedRisk.krisAr,
                      krisEn: selectedRisk.krisEn,
                      mitigationActionsAr: selectedRisk.mitigationActionsAr,
                      mitigationActionsEn: selectedRisk.mitigationActionsEn,
                      processText: selectedRisk.processText || selectedRisk.processAr,
                      subProcessText: selectedRisk.subProcessText || selectedRisk.subProcessAr,
                      followUpDate: selectedRisk.followUpDate || null,
                      nextReviewDate: selectedRisk.nextReviewDate || null,
                    }),
                  });

                  if (createResponse.ok) {
                    const createData = await createResponse.json();
                    // Update local state with new ID
                    const newRisk = { ...selectedRisk, id: createData.data.id };
                    setRisks(prev => prev.map(r => r.id === selectedRisk.id ? newRisk : r));
                    setShowEditModal(false);
                    setSelectedRisk(null);
                    // Refresh from API
                    fetchRisks(false);
                    alert(isAr ? 'تم حفظ الخطر بنجاح في قاعدة البيانات' : 'Risk saved successfully to database');
                  } else {
                    const errorData = await createResponse.json();
                    console.error('Error creating risk:', errorData);
                    alert(isAr ? 'حدث خطأ أثناء حفظ الخطر في قاعدة البيانات' : 'Error saving risk to database');
                  }
                } else {
                  // Update existing risk in database
                  const response = await fetch(`/api/risks/${selectedRisk.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      riskNumber: selectedRisk.riskNumber,
                      departmentId: selectedRisk.departmentId,
                      riskOwnerId: selectedRisk.ownerId || null,
                      titleAr: selectedRisk.titleAr,
                      titleEn: selectedRisk.titleEn,
                      descriptionAr: selectedRisk.descriptionAr,
                      descriptionEn: selectedRisk.descriptionEn,
                      status: selectedRisk.status,
                      inherentLikelihood: selectedRisk.inherentLikelihood,
                      inherentImpact: selectedRisk.inherentImpact,
                      inherentScore: selectedRisk.inherentScore,
                      inherentRating: selectedRisk.inherentRating,
                      residualLikelihood: selectedRisk.residualLikelihood,
                      residualImpact: selectedRisk.residualImpact,
                      residualScore: selectedRisk.residualScore,
                      residualRating: selectedRisk.residualRating,
                      potentialCauseAr: selectedRisk.potentialCauseAr,
                      potentialCauseEn: selectedRisk.potentialCauseEn,
                      potentialImpactAr: selectedRisk.potentialImpactAr,
                      potentialImpactEn: selectedRisk.potentialImpactEn,
                      layersOfProtectionAr: selectedRisk.layersOfProtectionAr,
                      layersOfProtectionEn: selectedRisk.layersOfProtectionEn,
                      krisAr: selectedRisk.krisAr,
                      krisEn: selectedRisk.krisEn,
                      mitigationActionsAr: selectedRisk.mitigationActionsAr,
                      mitigationActionsEn: selectedRisk.mitigationActionsEn,
                      processText: selectedRisk.processText,
                      subProcessText: selectedRisk.subProcessText,
                      followUpDate: selectedRisk.followUpDate || null,
                      nextReviewDate: selectedRisk.nextReviewDate || null,
                    }),
                  });

                  if (response.ok) {
                    // Update local state
                    setRisks(prev => prev.map(r => r.id === selectedRisk.id ? selectedRisk : r));
                    setShowEditModal(false);
                    setSelectedRisk(null);
                    // Refresh from API
                    fetchRisks(false);
                  } else {
                    const errorData = await response.json();
                    console.error('Error updating risk:', errorData);
                    alert(isAr ? 'حدث خطأ أثناء حفظ التعديلات. الخطر قد لا يكون موجوداً في قاعدة البيانات.' : 'Error saving changes. The risk may not exist in the database.');
                  }
                }
              } catch (error) {
                console.error('Error updating risk:', error);
                alert(isAr ? 'حدث خطأ أثناء حفظ التعديلات' : 'Error saving changes');
              }
            }
          }}>
            {t('common.save')}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedRisk(null);
        }}
        title={isAr ? 'تأكيد الحذف' : 'Confirm Delete'}
        size="sm"
      >
        {selectedRisk && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <div>
                <p className="font-medium text-[var(--foreground)]">
                  {isAr ? 'هل أنت متأكد من حذف هذا الخطر؟' : 'Are you sure you want to delete this risk?'}
                </p>
                <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
                  {isAr ? 'لا يمكن التراجع عن هذا الإجراء' : 'This action cannot be undone'}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-[var(--border)] p-4">
              <code className="text-sm font-mono">{selectedRisk.riskNumber}</code>
              <p className="mt-1 font-medium text-[var(--foreground)]">
                {isAr ? selectedRisk.titleAr : selectedRisk.titleEn}
              </p>
            </div>
          </div>
        )}
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="danger"
            onClick={confirmDeleteRisk}
          >
            <Trash2 className="me-2 h-4 w-4" />
            {t('common.delete')}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
