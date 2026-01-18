'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { RiskMatrix } from '@/components/shared/RiskMatrix';
import {
  ClipboardCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Eye,
  Edit,
  AlertTriangle,
  CheckCircle,
  Info,
  HelpCircle,
  Calculator,
  Loader2,
} from 'lucide-react';
import {
  type RiskRating,
  calculateRiskScore,
  getRiskRating,
  DEFAULT_LIKELIHOOD_CRITERIA,
  DEFAULT_IMPACT_CRITERIA,
  DEFAULT_RISK_RATING_CRITERIA,
} from '@/types';

// Interface for API Risk data
interface APIRisk {
  id: string;
  riskNumber: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  inherentLikelihood: number;
  inherentImpact: number;
  inherentScore: number;
  inherentRating: string;
  residualLikelihood: number | null;
  residualImpact: number | null;
  residualScore: number | null;
  residualRating: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  nextReviewDate: string | null;
  category?: {
    id: string;
    code: string;
    nameAr: string;
    nameEn: string;
  } | null;
  department?: {
    id: string;
    nameAr: string;
    nameEn: string;
  };
  owner?: {
    id: string;
    fullName: string;
    fullNameEn: string | null;
  };
}

// Assessment data structure
interface Assessment {
  id: string;
  riskNumber: string;
  titleAr: string;
  titleEn: string;
  categoryCode: string;
  departmentAr: string;
  departmentEn: string;
  inherent: { likelihood: number; impact: number; score: number; rating: RiskRating };
  residual: { likelihood: number; impact: number; score: number; rating: RiskRating };
  assessedDate: string;
  assessedByAr: string;
  assessedByEn: string;
  lastReviewDate: string;
  nextReviewDate: string;
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

export default function AssessmentPage() {
  const { t, language } = useTranslation();
  const isAr = language === 'ar';
  const [selectedType, setSelectedType] = useState<'inherent' | 'residual'>('inherent');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCriteriaPanel, setShowCriteriaPanel] = useState(false);
  const [selectedCriteriaTab, setSelectedCriteriaTab] = useState<'likelihood' | 'impact' | 'rating'>('likelihood');

  // State for API data
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch risks from API
  useEffect(() => {
    const fetchRisks = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/risks');
        const result = await response.json();

        if (result.success && result.data) {
          // Transform API data to Assessment format
          const transformedData: Assessment[] = result.data.map((risk: APIRisk) => ({
            id: risk.id,
            riskNumber: risk.riskNumber,
            titleAr: risk.titleAr,
            titleEn: risk.titleEn,
            categoryCode: risk.category?.code || 'GEN',
            departmentAr: risk.department?.nameAr || 'عام',
            departmentEn: risk.department?.nameEn || 'General',
            inherent: {
              likelihood: risk.inherentLikelihood || 3,
              impact: risk.inherentImpact || 3,
              score: risk.inherentScore || 9,
              rating: normalizeRating(risk.inherentRating),
            },
            residual: {
              likelihood: risk.residualLikelihood || risk.inherentLikelihood || 3,
              impact: risk.residualImpact || risk.inherentImpact || 3,
              score: risk.residualScore || risk.inherentScore || 9,
              rating: normalizeRating(risk.residualRating || risk.inherentRating),
            },
            assessedDate: risk.updatedAt ? new Date(risk.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            assessedByAr: risk.owner?.fullName || 'النظام',
            assessedByEn: risk.owner?.fullNameEn || risk.owner?.fullName || 'System',
            lastReviewDate: risk.updatedAt ? new Date(risk.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            nextReviewDate: risk.nextReviewDate
              ? new Date(risk.nextReviewDate).toISOString().split('T')[0]
              : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          }));

          setAssessments(transformedData);
        }
      } catch (err) {
        console.error('Error fetching risks:', err);
        setError(isAr ? 'فشل في تحميل البيانات' : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchRisks();
  }, [isAr]);

  // Filter assessments
  const filteredAssessments = useMemo(() => {
    return assessments.filter((a) =>
      a.riskNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.titleAr.includes(searchQuery) ||
      a.titleEn.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, assessments]);

  // Statistics
  const stats = useMemo(() => ({
    total: assessments.length,
    critical: assessments.filter(a => a.inherent.rating === 'Critical').length,
    major: assessments.filter(a => a.inherent.rating === 'Major').length,
    moderate: assessments.filter(a => a.inherent.rating === 'Moderate').length,
    minor: assessments.filter(a => a.inherent.rating === 'Minor').length,
    negligible: assessments.filter(a => a.inherent.rating === 'Negligible').length,
    avgReduction: assessments.length > 0
      ? Math.round(assessments.reduce((acc, a) => acc + (a.inherent.score - a.residual.score), 0) / assessments.length)
      : 0,
  }), [assessments]);

  // Generate matrix data from assessments
  const matrixData = useMemo(() => {
    const dataMap = new Map<string, number>();

    assessments.forEach(a => {
      const data = selectedType === 'inherent' ? a.inherent : a.residual;
      const key = `${data.likelihood}-${data.impact}`;
      dataMap.set(key, (dataMap.get(key) || 0) + 1);
    });

    return Array.from(dataMap.entries()).map(([key, count]) => {
      const [likelihood, impact] = key.split('-').map(Number);
      return { likelihood, impact, count };
    });
  }, [assessments, selectedType]);

  const getTrendIcon = (inherentScore: number, residualScore: number) => {
    const diff = inherentScore - residualScore;
    if (diff > 5) return <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--status-success)] shrink-0" />;
    if (diff > 0) return <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--status-success)] shrink-0" />;
    if (diff === 0) return <Minus className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--foreground-muted)] shrink-0" />;
    return <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--status-error)] shrink-0" />;
  };

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

  const getRatingColor = (rating: RiskRating): string => {
    switch (rating) {
      case 'Critical': return 'bg-red-500';
      case 'Major': return 'bg-orange-500';
      case 'Moderate': return 'bg-yellow-500';
      case 'Minor': return 'bg-blue-500';
      case 'Negligible': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  // Loading state
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

  // Error state
  if (error) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertTriangle className="h-12 w-12 text-[var(--status-error)]" />
          <p className="text-lg font-medium text-[var(--foreground)]">{error}</p>
          <Button onClick={() => window.location.reload()}>
            {isAr ? 'إعادة المحاولة' : 'Try Again'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--foreground)] truncate">
            {t('assessment.title')}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[var(--foreground-secondary)]">
            {isAr
              ? 'تقييم المخاطر باستخدام مصفوفة الاحتمالية والتأثير (1-5)'
              : 'Assess risks using likelihood and impact matrix (1-5)'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />}
          onClick={() => setShowCriteriaPanel(!showCriteriaPanel)}
        >
          <span className="text-xs sm:text-sm">{isAr ? 'معايير التقييم' : 'Assessment Criteria'}</span>
        </Button>
      </div>

      {/* Assessment Criteria Panel */}
      {showCriteriaPanel && (
        <Card className="p-2 sm:p-3 md:p-4">
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl md:text-2xl">
                <Info className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--primary)] shrink-0" />
                <span className="min-w-0 truncate">{isAr ? 'معايير التقييم' : 'Assessment Criteria'}</span>
              </CardTitle>
              <div className="flex rounded-lg border border-[var(--border)] p-1 shrink-0">
                <button
                  onClick={() => setSelectedCriteriaTab('likelihood')}
                  className={`rounded-md px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium transition-colors ${
                    selectedCriteriaTab === 'likelihood'
                      ? 'bg-[var(--primary)] text-white'
                      : 'text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {t('risks.likelihood')}
                </button>
                <button
                  onClick={() => setSelectedCriteriaTab('impact')}
                  className={`rounded-md px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium transition-colors ${
                    selectedCriteriaTab === 'impact'
                      ? 'bg-[var(--primary)] text-white'
                      : 'text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {t('risks.impact')}
                </button>
                <button
                  onClick={() => setSelectedCriteriaTab('rating')}
                  className={`rounded-md px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium transition-colors ${
                    selectedCriteriaTab === 'rating'
                      ? 'bg-[var(--primary)] text-white'
                      : 'text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {t('risks.riskRating')}
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {selectedCriteriaTab === 'likelihood' && (
              <div className="grid gap-2 sm:gap-3 md:gap-4">
                {DEFAULT_LIKELIHOOD_CRITERIA.map((criteria) => (
                  <div
                    key={criteria.level}
                    className="flex items-start gap-2 sm:gap-4 rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] p-2 sm:p-3 md:p-4"
                  >
                    <div className={`flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full text-white font-bold text-xs sm:text-sm ${
                      criteria.level === 5 ? 'bg-red-500' :
                      criteria.level === 4 ? 'bg-orange-500' :
                      criteria.level === 3 ? 'bg-yellow-500' :
                      criteria.level === 2 ? 'bg-blue-500' :
                      'bg-green-500'
                    }`}>
                      {criteria.level}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[var(--foreground)] text-xs sm:text-sm truncate">
                        {isAr ? criteria.nameAr : criteria.nameEn}
                      </p>
                      <p className="mt-0.5 text-[10px] sm:text-xs text-[var(--foreground-secondary)]">
                        {isAr ? criteria.descriptionAr : criteria.descriptionEn}
                      </p>
                      <p className="mt-1 text-[10px] sm:text-xs text-[var(--foreground-muted)]">
                        {criteria.percentage}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedCriteriaTab === 'impact' && (
              <div className="grid gap-2 sm:gap-3 md:gap-4">
                {DEFAULT_IMPACT_CRITERIA.map((criteria) => (
                  <div
                    key={criteria.level}
                    className="flex items-start gap-2 sm:gap-4 rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] p-2 sm:p-3 md:p-4"
                  >
                    <div className={`flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full text-white font-bold text-xs sm:text-sm ${
                      criteria.level === 5 ? 'bg-red-500' :
                      criteria.level === 4 ? 'bg-orange-500' :
                      criteria.level === 3 ? 'bg-yellow-500' :
                      criteria.level === 2 ? 'bg-blue-500' :
                      'bg-green-500'
                    }`}>
                      {criteria.level}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[var(--foreground)] text-xs sm:text-sm truncate">
                        {isAr ? criteria.nameAr : criteria.nameEn}
                      </p>
                      <p className="mt-0.5 text-[10px] sm:text-xs text-[var(--foreground-secondary)]">
                        {isAr ? criteria.descriptionAr : criteria.descriptionEn}
                      </p>
                      <div className="mt-2 grid gap-1 text-[10px] sm:text-xs text-[var(--foreground-muted)]">
                        {criteria.financialAr && (
                          <p>
                            <span className="font-medium">{isAr ? 'المالي:' : 'Financial:'}</span>{' '}
                            {isAr ? criteria.financialAr : criteria.financialEn}
                          </p>
                        )}
                        {criteria.operationalAr && (
                          <p>
                            <span className="font-medium">{isAr ? 'التشغيلي:' : 'Operational:'}</span>{' '}
                            {isAr ? criteria.operationalAr : criteria.operationalEn}
                          </p>
                        )}
                        {criteria.reputationalAr && (
                          <p>
                            <span className="font-medium">{isAr ? 'السمعة:' : 'Reputational:'}</span>{' '}
                            {isAr ? criteria.reputationalAr : criteria.reputationalEn}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedCriteriaTab === 'rating' && (
              <div className="space-y-2 sm:space-y-4">
                <div className="flex items-center gap-2 sm:gap-3 rounded-lg border border-blue-200 bg-blue-50 p-2 sm:p-3 md:p-4 dark:border-blue-800 dark:bg-blue-900/20">
                  <Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-blue-900 dark:text-blue-100 text-xs sm:text-sm truncate">
                      {isAr ? 'الصيغة: درجة الخطر = الاحتمالية × التأثير' : 'Formula: Risk Score = Likelihood × Impact'}
                    </p>
                    <p className="text-[10px] sm:text-xs text-blue-700 dark:text-blue-300">
                      {isAr ? 'المدى: 1 إلى 25' : 'Range: 1 to 25'}
                    </p>
                  </div>
                </div>

                <div className="grid gap-2 sm:gap-3 md:gap-4">
                  {DEFAULT_RISK_RATING_CRITERIA.map((criteria) => (
                    <div
                      key={criteria.nameEn}
                      className="flex items-start gap-2 sm:gap-4 rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] p-2 sm:p-3 md:p-4"
                    >
                      <div className={`flex h-8 sm:h-10 min-w-[60px] sm:min-w-[80px] shrink-0 items-center justify-center rounded-lg text-white font-bold text-[10px] sm:text-sm ${getRatingColor(criteria.nameEn as RiskRating)}`}>
                        {criteria.minScore}-{criteria.maxScore}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[var(--foreground)] text-xs sm:text-sm truncate">
                          {isAr ? criteria.nameAr : criteria.nameEn}
                        </p>
                        <p className="mt-0.5 text-[10px] sm:text-xs text-[var(--foreground-secondary)]">
                          {isAr ? criteria.descriptionAr : criteria.descriptionEn}
                        </p>
                        {criteria.actionRequiredAr && (
                          <p className="mt-1 text-[10px] sm:text-xs font-medium text-[var(--primary)]">
                            {isAr ? criteria.actionRequiredAr : criteria.actionRequiredEn}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
        <Card className="p-2 sm:p-3 md:p-4">
          <div className="text-center">
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--foreground)]">{stats.total}</p>
            <p className="text-[10px] sm:text-xs text-[var(--foreground-secondary)] truncate">
              {isAr ? 'إجمالي المخاطر' : 'Total Risks'}
            </p>
          </div>
        </Card>
        <Card className="border-red-200 bg-red-50 p-2 sm:p-3 md:p-4 dark:border-red-800 dark:bg-red-900/20">
          <div className="text-center">
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-red-600 dark:text-red-400">{stats.critical}</p>
            <p className="text-[10px] sm:text-xs text-red-600 dark:text-red-400 truncate">
              {t('risks.ratings.Critical')}
            </p>
          </div>
        </Card>
        <Card className="border-orange-200 bg-orange-50 p-2 sm:p-3 md:p-4 dark:border-orange-800 dark:bg-orange-900/20">
          <div className="text-center">
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.major}</p>
            <p className="text-[10px] sm:text-xs text-orange-600 dark:text-orange-400 truncate">
              {t('risks.ratings.Major')}
            </p>
          </div>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50 p-2 sm:p-3 md:p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
          <div className="text-center">
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.moderate}</p>
            <p className="text-[10px] sm:text-xs text-yellow-600 dark:text-yellow-400 truncate">
              {t('risks.ratings.Moderate')}
            </p>
          </div>
        </Card>
        <Card className="border-blue-200 bg-blue-50 p-2 sm:p-3 md:p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <div className="text-center">
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.minor}</p>
            <p className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 truncate">
              {t('risks.ratings.Minor')}
            </p>
          </div>
        </Card>
        <Card className="border-green-200 bg-green-50 p-2 sm:p-3 md:p-4 dark:border-green-800 dark:bg-green-900/20">
          <div className="text-center">
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">-{stats.avgReduction}</p>
            <p className="text-[10px] sm:text-xs text-green-600 dark:text-green-400 truncate">
              {isAr ? 'متوسط التخفيض' : 'Avg. Reduction'}
            </p>
          </div>
        </Card>
      </div>

      {/* Assessment Type Toggle */}
      <Card className="p-2 sm:p-3 md:p-4">
        <CardContent className="p-0">
          <div className="flex flex-col gap-2 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="text-[10px] sm:text-xs font-medium text-[var(--foreground)] shrink-0">
                {isAr ? 'نوع التقييم:' : 'Assessment Type:'}
              </span>
              <div className="flex rounded-lg border border-[var(--border)] p-1 shrink-0">
                <button
                  onClick={() => setSelectedType('inherent')}
                  className={`rounded-md px-2 sm:px-4 py-1 sm:py-2 text-[10px] sm:text-xs font-medium transition-colors ${
                    selectedType === 'inherent'
                      ? 'bg-[var(--primary)] text-white'
                      : 'text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {t('risks.inherentRisk')}
                </button>
                <button
                  onClick={() => setSelectedType('residual')}
                  className={`rounded-md px-2 sm:px-4 py-1 sm:py-2 text-[10px] sm:text-xs font-medium transition-colors ${
                    selectedType === 'residual'
                      ? 'bg-[var(--primary)] text-white'
                      : 'text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {t('risks.residualRisk')}
                </button>
              </div>
            </div>
            <div className="w-full sm:w-64">
              <Input
                placeholder={isAr ? 'بحث...' : 'Search...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
        {/* Risk Matrix */}
        <Card className="lg:col-span-2 p-2 sm:p-3 md:p-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl md:text-2xl">
              <ClipboardCheck className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--primary)] shrink-0" />
              <span className="min-w-0 truncate">{t('dashboard.riskMatrix')} - {selectedType === 'inherent' ? t('risks.inherentRisk') : t('risks.residualRisk')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-2 sm:py-4">
              <RiskMatrix data={matrixData} size="lg" />
            </div>
            <div className="mt-2 sm:mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-4 md:gap-6 text-[10px] sm:text-xs">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 sm:h-3 sm:w-3 rounded bg-red-500 shrink-0"></div>
                <span className="truncate">{t('risks.ratings.Critical')} (17-25)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 sm:h-3 sm:w-3 rounded bg-orange-500 shrink-0"></div>
                <span className="truncate">{t('risks.ratings.Major')} (13-16)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 sm:h-3 sm:w-3 rounded bg-yellow-500 shrink-0"></div>
                <span className="truncate">{t('risks.ratings.Moderate')} (9-12)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 sm:h-3 sm:w-3 rounded bg-blue-500 shrink-0"></div>
                <span className="truncate">{t('risks.ratings.Minor')} (5-8)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 sm:h-3 sm:w-3 rounded bg-green-500 shrink-0"></div>
                <span className="truncate">{t('risks.ratings.Negligible')} (1-4)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Reference */}
        <Card className="p-2 sm:p-3 md:p-4">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl md:text-2xl">{isAr ? 'مرجع سريع' : 'Quick Reference'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 md:space-y-6">
            {/* Likelihood Scale */}
            <div>
              <h4 className="mb-2 sm:mb-3 text-[10px] sm:text-xs font-medium text-[var(--foreground)]">
                {t('assessment.likelihoodScale')}
              </h4>
              <div className="space-y-1 sm:space-y-2">
                {[5, 4, 3, 2, 1].map((level) => (
                  <div key={level} className="flex items-center gap-2">
                    <span className={`flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded text-[10px] sm:text-xs font-medium text-white ${
                      level === 5 ? 'bg-red-500' :
                      level === 4 ? 'bg-orange-500' :
                      level === 3 ? 'bg-yellow-500' :
                      level === 2 ? 'bg-blue-500' :
                      'bg-green-500'
                    }`}>
                      {level}
                    </span>
                    <span className="text-[10px] sm:text-xs text-[var(--foreground-secondary)] min-w-0 truncate">
                      {t(`assessment.likelihood.${level}`)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Impact Scale */}
            <div>
              <h4 className="mb-2 sm:mb-3 text-[10px] sm:text-xs font-medium text-[var(--foreground)]">
                {t('assessment.impactScale')}
              </h4>
              <div className="space-y-1 sm:space-y-2">
                {[5, 4, 3, 2, 1].map((level) => (
                  <div key={level} className="flex items-center gap-2">
                    <span className={`flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded text-[10px] sm:text-xs font-medium text-white ${
                      level === 5 ? 'bg-red-500' :
                      level === 4 ? 'bg-orange-500' :
                      level === 3 ? 'bg-yellow-500' :
                      level === 2 ? 'bg-blue-500' :
                      'bg-green-500'
                    }`}>
                      {level}
                    </span>
                    <span className="text-[10px] sm:text-xs text-[var(--foreground-secondary)] min-w-0 truncate">
                      {t(`assessment.impact.${level}`)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Formula */}
            <div className="rounded-lg bg-[var(--background-secondary)] p-2 sm:p-3 md:p-4">
              <p className="text-[10px] sm:text-xs font-medium text-[var(--foreground-muted)]">
                {isAr ? 'الصيغة' : 'Formula'}
              </p>
              <p className="mt-1 font-mono text-sm sm:text-base md:text-lg font-bold text-[var(--foreground)]">
                {isAr ? 'الدرجة = الاحتمالية × التأثير' : 'Score = Likelihood × Impact'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assessments Table */}
      <Card className="p-2 sm:p-3 md:p-4">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg sm:text-xl md:text-2xl">
            <span className="min-w-0 truncate">{isAr ? 'سجل التقييمات' : 'Assessment Records'}</span>
            <span className="text-[10px] sm:text-xs font-normal text-[var(--foreground-secondary)] shrink-0">
              {filteredAssessments.length} {isAr ? 'سجل' : 'records'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--background-secondary)]">
                  <th className="p-2 sm:p-3 md:p-4 text-start text-[10px] sm:text-xs font-medium text-[var(--foreground-secondary)]">
                    {t('risks.riskNumber')}
                  </th>
                  <th className="p-2 sm:p-3 md:p-4 text-start text-[10px] sm:text-xs font-medium text-[var(--foreground-secondary)]">
                    {t('risks.riskTitle')}
                  </th>
                  <th className="p-2 sm:p-3 md:p-4 text-center text-[10px] sm:text-xs font-medium text-[var(--foreground-secondary)]">
                    {t('risks.inherentRisk')}
                  </th>
                  <th className="p-2 sm:p-3 md:p-4 text-center text-[10px] sm:text-xs font-medium text-[var(--foreground-secondary)]">
                    {t('risks.residualRisk')}
                  </th>
                  <th className="p-2 sm:p-3 md:p-4 text-center text-[10px] sm:text-xs font-medium text-[var(--foreground-secondary)]">
                    {isAr ? 'التخفيض' : 'Reduction'}
                  </th>
                  <th className="p-2 sm:p-3 md:p-4 text-start text-[10px] sm:text-xs font-medium text-[var(--foreground-secondary)]">
                    {t('assessment.assessedBy')}
                  </th>
                  <th className="p-2 sm:p-3 md:p-4 text-start text-[10px] sm:text-xs font-medium text-[var(--foreground-secondary)]">
                    {t('risks.nextReviewDate')}
                  </th>
                  <th className="p-2 sm:p-3 md:p-4 text-center text-[10px] sm:text-xs font-medium text-[var(--foreground-secondary)]">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAssessments.map((assessment) => {
                  const reduction = assessment.inherent.score - assessment.residual.score;
                  const reductionPercent = Math.round((reduction / assessment.inherent.score) * 100);

                  return (
                    <tr
                      key={assessment.id}
                      className="border-b border-[var(--border)] transition-colors hover:bg-[var(--background-secondary)]"
                    >
                      <td className="p-2 sm:p-3 md:p-4">
                        <code className="rounded bg-[var(--background-tertiary)] px-1 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-mono">
                          {assessment.riskNumber}
                        </code>
                      </td>
                      <td className="p-2 sm:p-3 md:p-4">
                        <div className="min-w-0">
                          <p className="font-medium text-[var(--foreground)] text-xs sm:text-sm truncate">
                            {isAr ? assessment.titleAr : assessment.titleEn}
                          </p>
                          <p className="mt-0.5 text-[10px] sm:text-xs text-[var(--foreground-muted)] truncate">
                            {isAr ? assessment.departmentAr : assessment.departmentEn}
                          </p>
                        </div>
                      </td>
                      <td className="p-2 sm:p-3 md:p-4 text-center">
                        <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                          <Badge variant={getRatingBadgeVariant(assessment.inherent.rating)}>
                            {assessment.inherent.score}
                          </Badge>
                          <span className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">
                            {assessment.inherent.likelihood} × {assessment.inherent.impact}
                          </span>
                          <span className="text-[10px] sm:text-xs font-medium text-[var(--foreground-secondary)]">
                            {t(`risks.ratings.${assessment.inherent.rating}`)}
                          </span>
                        </div>
                      </td>
                      <td className="p-2 sm:p-3 md:p-4 text-center">
                        <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                          <Badge variant={getRatingBadgeVariant(assessment.residual.rating)}>
                            {assessment.residual.score}
                          </Badge>
                          <span className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">
                            {assessment.residual.likelihood} × {assessment.residual.impact}
                          </span>
                          <span className="text-[10px] sm:text-xs font-medium text-[var(--foreground-secondary)]">
                            {t(`risks.ratings.${assessment.residual.rating}`)}
                          </span>
                        </div>
                      </td>
                      <td className="p-2 sm:p-3 md:p-4">
                        <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                          <div className="flex items-center gap-1">
                            {getTrendIcon(assessment.inherent.score, assessment.residual.score)}
                            <span className="font-mono font-medium text-[var(--status-success)] text-xs sm:text-sm">
                              -{reduction}
                            </span>
                          </div>
                          <span className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">
                            ({reductionPercent}%)
                          </span>
                        </div>
                      </td>
                      <td className="p-2 sm:p-3 md:p-4 text-[10px] sm:text-xs text-[var(--foreground-secondary)]">
                        {isAr ? assessment.assessedByAr : assessment.assessedByEn}
                      </td>
                      <td className="p-2 sm:p-3 md:p-4">
                        <span className="text-[10px] sm:text-xs text-[var(--foreground-secondary)]">
                          {new Date(assessment.nextReviewDate).toLocaleDateString(
                            isAr ? 'ar-SA' : 'en-US'
                          )}
                        </span>
                      </td>
                      <td className="p-2 sm:p-3 md:p-4">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon-sm" title={isAr ? 'عرض' : 'View'}>
                            <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" title={isAr ? 'إعادة تقييم' : 'Reassess'}>
                            <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredAssessments.length === 0 && (
            <div className="p-6 sm:p-8 md:p-12 text-center">
              <AlertTriangle className="mx-auto h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-[var(--foreground-muted)]" />
              <p className="mt-2 sm:mt-4 text-sm sm:text-base md:text-lg font-medium text-[var(--foreground)]">
                {isAr ? 'لا توجد تقييمات مطابقة' : 'No matching assessments found'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
