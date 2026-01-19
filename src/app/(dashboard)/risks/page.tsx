'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
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
  departmentAr: hr.departmentAr,
  departmentEn: hr.department,
  processAr: 'الموارد البشرية',
  processEn: 'Human Resources',
  ownerAr: hr.championName || 'غير محدد',
  ownerEn: hr.championName || 'Not Assigned',
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
    departmentAr: 'سلسلة التوريد',
    departmentEn: 'Supply Chain',
    processAr: 'المشتريات',
    processEn: 'Procurement',
    subProcessAr: 'إدارة الموردين',
    subProcessEn: 'Supplier Management',
    ownerAr: 'أحمد محمد',
    ownerEn: 'Ahmed Mohammed',
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
    departmentAr: 'العمليات',
    departmentEn: 'Operations',
    processAr: 'الإنتاج',
    processEn: 'Production',
    ownerAr: 'خالد أحمد',
    ownerEn: 'Khalid Ahmed',
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
    departmentAr: 'تقنية المعلومات',
    departmentEn: 'IT',
    processAr: 'الأمن السيبراني',
    processEn: 'Cybersecurity',
    ownerAr: 'محمد عبدالله',
    ownerEn: 'Mohammed Abdullah',
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
    departmentAr: 'السلامة والبيئة',
    departmentEn: 'HSE',
    processAr: 'البيئة',
    processEn: 'Environment',
    ownerAr: 'فاطمة حسن',
    ownerEn: 'Fatima Hassan',
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
    departmentAr: 'السلامة والبيئة',
    departmentEn: 'HSE',
    processAr: 'السلامة المهنية',
    processEn: 'Occupational Safety',
    ownerAr: 'فاطمة حسن',
    ownerEn: 'Fatima Hassan',
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
  },
  // Include converted HR risks
  ...convertedHRRisks,
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
}

export default function RisksPage() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const isAr = language === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRating, setFilterRating] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [showWizard, setShowWizard] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedRisk, setSelectedRisk] = useState<typeof mockRisks[0] | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [risks, setRisks] = useState(allRisks);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [categories, setCategories] = useState<APICategory[]>([]);
  const [riskStatuses, setRiskStatuses] = useState<APIRiskStatus[]>([]);
  const [viewModalTab, setViewModalTab] = useState<'details' | 'discussion'>('details');
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null);

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
          ownerAr: risk.owner?.fullName || risk.riskOwner?.fullName || 'غير محدد',
          ownerEn: risk.owner?.fullNameEn || risk.owner?.fullName || risk.riskOwner?.fullNameEn || risk.riskOwner?.fullName || 'Not Assigned',
          ownerId: risk.owner?.id,
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
        }));

        setRisks(transformedRisks);
      } else {
        // Use fallback data if API returns empty
        setRisks(allRisks);
      }
    } catch (error) {
      console.error('Error fetching risks:', error);
      // Use fallback data on error
      setRisks(allRisks);
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

  // Fetch risks, categories, and statuses on component mount
  useEffect(() => {
    fetchRisks();
    fetchCategories();
    fetchRiskStatuses();
  }, [fetchRisks, fetchCategories, fetchRiskStatuses]);

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

  // Handle refresh button click
  const handleRefresh = () => {
    fetchRisks(true);
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
    return risks.filter((risk) => {
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
  }, [risks, searchQuery, filterRating, filterCategory, filterStatus, filterDepartment]);

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

  const handleSaveRisk = (data: unknown) => {
    console.log('Saving risk:', data);
    setShowWizard(false);
    // Here you would typically save to database
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

  // Confirm Delete
  const confirmDeleteRisk = () => {
    if (selectedRisk) {
      setRisks(prev => prev.filter(r => r.id !== selectedRisk.id));
      setShowDeleteModal(false);
      setSelectedRisk(null);
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

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-2 sm:p-3 md:p-4">
          <div className="flex flex-col gap-2 sm:gap-3 md:gap-4 lg:flex-row lg:items-end">
            <div className="flex-1">
              <Input
                placeholder={isAr ? 'بحث برقم الخطر أو العنوان...' : 'Search by risk number or title...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-4 w-4 sm:h-5 sm:w-5" />}
                className="text-xs sm:text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                onClick={() => setShowFilters(!showFilters)}
              >
                <span className="text-xs sm:text-sm">{isAr ? 'تصفية' : 'Filter'}</span>
              </Button>
              <div className="flex rounded-lg border border-[var(--border)]">
                <button
                  onClick={() => setViewMode('table')}
                  className={`rounded-s-lg p-1.5 sm:p-2 ${viewMode === 'table' ? 'bg-[var(--primary)] text-white' : 'text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)]'}`}
                >
                  <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`rounded-e-lg p-1.5 sm:p-2 ${viewMode === 'cards' ? 'bg-[var(--primary)] text-white' : 'text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)]'}`}
                >
                  <Grid3X3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              </div>
            </div>
          </div>

          {showFilters && (
            <div className="mt-3 sm:mt-4 grid gap-2 sm:gap-3 md:gap-4 border-t border-[var(--border)] pt-3 sm:pt-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
          )}
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
                    <th className="p-2 sm:p-3 md:p-4 text-start text-[10px] sm:text-xs md:text-sm font-medium text-[var(--foreground-secondary)] whitespace-nowrap">
                      {t('risks.riskNumber')}
                    </th>
                    <th className="p-2 sm:p-3 md:p-4 text-start text-[10px] sm:text-xs md:text-sm font-medium text-[var(--foreground-secondary)]">
                      {t('risks.riskTitle')}
                    </th>
                    <th className="p-2 sm:p-3 md:p-4 text-start text-[10px] sm:text-xs md:text-sm font-medium text-[var(--foreground-secondary)] whitespace-nowrap">
                      {t('risks.riskCategory')}
                    </th>
                    <th className="p-2 sm:p-3 md:p-4 text-start text-[10px] sm:text-xs md:text-sm font-medium text-[var(--foreground-secondary)] whitespace-nowrap">
                      {t('risks.inherentRisk')}
                    </th>
                    <th className="p-2 sm:p-3 md:p-4 text-start text-[10px] sm:text-xs md:text-sm font-medium text-[var(--foreground-secondary)] whitespace-nowrap">
                      {t('risks.residualRisk')}
                    </th>
                    <th className="p-2 sm:p-3 md:p-4 text-start text-[10px] sm:text-xs md:text-sm font-medium text-[var(--foreground-secondary)] whitespace-nowrap">
                      {t('common.status')}
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
                  {filteredRisks.map((risk) => (
                    <tr
                      key={risk.id}
                      className="border-b border-[var(--border)] transition-colors hover:bg-[var(--background-secondary)]"
                    >
                      <td className="p-2 sm:p-3 md:p-4">
                        <code className="rounded bg-[var(--background-tertiary)] px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-mono">
                          {risk.riskNumber}
                        </code>
                      </td>
                      <td className="p-2 sm:p-3 md:p-4">
                        <div className="max-w-[200px] sm:max-w-[250px] md:max-w-[300px]">
                          <p className="font-medium text-xs sm:text-sm text-[var(--foreground)] truncate">
                            {isAr ? risk.titleAr : risk.titleEn}
                          </p>
                          <p className="mt-0.5 text-[10px] sm:text-xs text-[var(--foreground-muted)] truncate">
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
                            className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-[var(--primary)]"
                          >
                            <MessageSquare className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
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
            <div className="flex items-center justify-between border-t border-[var(--border)] p-2 sm:p-3 md:p-4">
              <p className="text-[10px] sm:text-xs md:text-sm text-[var(--foreground-secondary)]">
                {isAr
                  ? `عرض ${filteredRisks.length} من ${risks.length} خطر`
                  : `Showing ${filteredRisks.length} of ${risks.length} risks`}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon-sm" disabled>
                  {isAr ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
                <span className="text-sm text-[var(--foreground)]">1 / 1</span>
                <Button variant="outline" size="icon-sm" disabled>
                  {isAr ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Card View */
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredRisks.map((risk) => (
            <Card key={risk.id} hover className="overflow-hidden">
              <div className="p-4">
                {/* Header */}
                <div className="mb-3 flex items-start justify-between">
                  <code className="rounded bg-[var(--background-tertiary)] px-2 py-1 text-xs font-mono">
                    {risk.riskNumber}
                  </code>
                  <Badge variant={getStatusBadgeVariant(risk.status)}>
                    {getStatusDisplayName(risk.status)}
                  </Badge>
                </div>

                {/* Title */}
                <h3 className="mb-2 font-semibold text-[var(--foreground)]">
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
            <div className="flex gap-1 border-b border-[var(--border)]">
              <button
                onClick={() => setViewModalTab('details')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                  viewModalTab === 'details'
                    ? 'border-b-2 border-[var(--primary)] text-[var(--primary)]'
                    : 'text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
                }`}
              >
                <FileText className="h-4 w-4" />
                {isAr ? 'التفاصيل' : 'Details'}
              </button>
              <button
                onClick={() => setViewModalTab('discussion')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                  viewModalTab === 'discussion'
                    ? 'border-b-2 border-[var(--primary)] text-[var(--primary)]'
                    : 'text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                {isAr ? 'النقاش' : 'Discussion'}
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
                    <span className="font-medium">{new Date(selectedRisk.identifiedDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}</span>
                  </div>
                </div>
              ) : (
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

            {/* Residual Risk Assessment */}
            <div className="rounded-lg border border-[var(--border)] p-4 bg-[var(--background-secondary)]">
              <h4 className="font-medium text-[var(--foreground)] mb-3">
                {t('risks.residualRisk')}
              </h4>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                    {t('risks.likelihood')}
                  </label>
                  <Select
                    options={[1,2,3,4,5].map(n => ({ value: String(n), label: `${n} - ${t(`assessment.likelihood.${n}`)}` }))}
                    value={String(selectedRisk.residualLikelihood)}
                    onChange={(value) => {
                      const likelihood = parseInt(value);
                      const score = likelihood * selectedRisk.residualImpact;
                      const rating = getRiskRating(score);
                      setSelectedRisk({
                        ...selectedRisk,
                        residualLikelihood: likelihood,
                        residualScore: score,
                        residualRating: rating
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
                    value={String(selectedRisk.residualImpact)}
                    onChange={(value) => {
                      const impact = parseInt(value);
                      const score = selectedRisk.residualLikelihood * impact;
                      const rating = getRiskRating(score);
                      setSelectedRisk({
                        ...selectedRisk,
                        residualImpact: impact,
                        residualScore: score,
                        residualRating: rating
                      });
                    }}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
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
                // Send update to API
                const response = await fetch(`/api/risks/${selectedRisk.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    riskNumber: selectedRisk.riskNumber,
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
                }
              } catch (error) {
                console.error('Error updating risk:', error);
                // Still update local state as fallback
                setRisks(prev => prev.map(r => r.id === selectedRisk.id ? selectedRisk : r));
                setShowEditModal(false);
                setSelectedRisk(null);
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
