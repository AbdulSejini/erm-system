'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  Info,
  HelpCircle,
  Lightbulb,
  X,
} from 'lucide-react';
import {
  calculateRiskScore,
  getRiskRating,
  getRiskRatingColor,
  DEFAULT_RISK_CATEGORIES,
  DEFAULT_LIKELIHOOD_CRITERIA,
  DEFAULT_IMPACT_CRITERIA,
  type RiskRating,
} from '@/types';

interface RiskFormData {
  // Step 1: Basic Info
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  issuedBy: string;

  // Step 2: Classification
  categoryId: string;
  departmentId: string;
  processId: string;
  subProcessId: string;

  // Step 3: Causes & Impacts
  potentialCauseAr: string;
  potentialCauseEn: string;
  potentialImpactAr: string;
  potentialImpactEn: string;

  // Step 4: Assessment
  inherentLikelihood: number;
  inherentImpact: number;

  // Step 5: Controls & Treatment
  layersOfProtectionAr: string;
  layersOfProtectionEn: string;
  krisAr: string;
  krisEn: string;
  mitigationActionsAr: string;
  mitigationActionsEn: string;
  complianceRequired: boolean;
  complianceNoteAr: string;
  complianceNoteEn: string;

  // Responsible
  ownerId: string;
  championId: string;
}

const initialFormData: RiskFormData = {
  titleAr: '',
  titleEn: '',
  descriptionAr: '',
  descriptionEn: '',
  issuedBy: 'Internal',
  categoryId: '',
  departmentId: '',
  processId: '',
  subProcessId: '',
  potentialCauseAr: '',
  potentialCauseEn: '',
  potentialImpactAr: '',
  potentialImpactEn: '',
  inherentLikelihood: 3,
  inherentImpact: 3,
  layersOfProtectionAr: '',
  layersOfProtectionEn: '',
  krisAr: '',
  krisEn: '',
  mitigationActionsAr: '',
  mitigationActionsEn: '',
  complianceRequired: false,
  complianceNoteAr: '',
  complianceNoteEn: '',
  ownerId: '',
  championId: '',
};

// Mock data for departments and processes
const mockDepartments = [
  { id: '1', nameAr: 'المالية', nameEn: 'Finance', code: 'FIN' },
  { id: '2', nameAr: 'العمليات', nameEn: 'Operations', code: 'OPS' },
  { id: '3', nameAr: 'تقنية المعلومات', nameEn: 'IT', code: 'IT' },
  { id: '4', nameAr: 'سلسلة التوريد', nameEn: 'Supply Chain', code: 'SC' },
  { id: '5', nameAr: 'السلامة والبيئة', nameEn: 'HSE', code: 'HSE' },
  { id: '6', nameAr: 'الموارد البشرية', nameEn: 'Human Resources', code: 'HR' },
];

const mockProcesses: Record<string, Array<{ id: string; nameAr: string; nameEn: string; code: string }>> = {
  '1': [
    { id: 'p1', nameAr: 'المحاسبة', nameEn: 'Accounting', code: 'ACC' },
    { id: 'p2', nameAr: 'الخزينة', nameEn: 'Treasury', code: 'TRS' },
    { id: 'p3', nameAr: 'التقارير المالية', nameEn: 'Financial Reporting', code: 'FRP' },
  ],
  '2': [
    { id: 'p4', nameAr: 'الإنتاج', nameEn: 'Production', code: 'PRD' },
    { id: 'p5', nameAr: 'الصيانة', nameEn: 'Maintenance', code: 'MNT' },
    { id: 'p6', nameAr: 'الجودة', nameEn: 'Quality', code: 'QA' },
  ],
  '3': [
    { id: 'p7', nameAr: 'البنية التحتية', nameEn: 'Infrastructure', code: 'INF' },
    { id: 'p8', nameAr: 'الأمن السيبراني', nameEn: 'Cybersecurity', code: 'SEC' },
    { id: 'p9', nameAr: 'تطوير الأنظمة', nameEn: 'System Development', code: 'DEV' },
  ],
  '4': [
    { id: 'p10', nameAr: 'المشتريات', nameEn: 'Procurement', code: 'PRC' },
    { id: 'p11', nameAr: 'المخازن', nameEn: 'Warehousing', code: 'WHS' },
    { id: 'p12', nameAr: 'اللوجستيات', nameEn: 'Logistics', code: 'LOG' },
  ],
  '5': [
    { id: 'p13', nameAr: 'السلامة المهنية', nameEn: 'Occupational Safety', code: 'OSH' },
    { id: 'p14', nameAr: 'البيئة', nameEn: 'Environment', code: 'ENV' },
  ],
  '6': [
    { id: 'p15', nameAr: 'التوظيف', nameEn: 'Recruitment', code: 'REC' },
    { id: 'p16', nameAr: 'التدريب', nameEn: 'Training', code: 'TRN' },
  ],
};

const mockUsers = [
  { id: 'u1', nameAr: 'أحمد محمد', nameEn: 'Ahmed Mohammed' },
  { id: 'u2', nameAr: 'سارة علي', nameEn: 'Sarah Ali' },
  { id: 'u3', nameAr: 'خالد أحمد', nameEn: 'Khalid Ahmed' },
  { id: 'u4', nameAr: 'فاطمة حسن', nameEn: 'Fatima Hassan' },
  { id: 'u5', nameAr: 'محمد عبدالله', nameEn: 'Mohammed Abdullah' },
];

interface RiskWizardProps {
  onClose: () => void;
  onSave: (data: RiskFormData) => void;
}

export function RiskWizard({ onClose, onSave }: RiskWizardProps) {
  const { t, language } = useTranslation();
  const isAr = language === 'ar';

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<RiskFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof RiskFormData, string>>>({});
  const [showGuidance, setShowGuidance] = useState(true);

  const totalSteps = 6;

  // Calculate risk score and rating
  const riskScore = useMemo(() =>
    calculateRiskScore(formData.inherentLikelihood, formData.inherentImpact),
    [formData.inherentLikelihood, formData.inherentImpact]
  );

  const riskRating = useMemo(() => getRiskRating(riskScore), [riskScore]);
  const riskColor = useMemo(() => getRiskRatingColor(riskRating), [riskRating]);

  // Get processes based on selected department
  const availableProcesses = useMemo(() => {
    if (!formData.departmentId) return [];
    return mockProcesses[formData.departmentId] || [];
  }, [formData.departmentId]);

  const updateField = useCallback(<K extends keyof RiskFormData>(
    field: K,
    value: RiskFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const validateStep = useCallback((step: number): boolean => {
    const newErrors: Partial<Record<keyof RiskFormData, string>> = {};

    switch (step) {
      case 1:
        if (!formData.titleAr.trim()) newErrors.titleAr = t('validation.required');
        if (!formData.titleEn.trim()) newErrors.titleEn = t('validation.required');
        if (!formData.descriptionAr.trim()) newErrors.descriptionAr = t('validation.required');
        break;
      case 2:
        if (!formData.categoryId) newErrors.categoryId = t('validation.selectOption');
        if (!formData.departmentId) newErrors.departmentId = t('validation.selectOption');
        break;
      case 4:
        if (formData.inherentLikelihood < 1 || formData.inherentLikelihood > 5) {
          newErrors.inherentLikelihood = t('validation.required');
        }
        if (formData.inherentImpact < 1 || formData.inherentImpact > 5) {
          newErrors.inherentImpact = t('validation.required');
        }
        break;
      case 5:
        if (!formData.ownerId) newErrors.ownerId = t('validation.selectOption');
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(prev => prev + 1);
      }
    }
  }, [currentStep, validateStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleSave = useCallback(() => {
    if (validateStep(currentStep)) {
      onSave(formData);
    }
  }, [currentStep, formData, onSave, validateStep]);

  // Step content components
  const steps = [
    {
      title: t('risks.wizard.step1'),
      description: t('risks.wizard.step1Desc'),
    },
    {
      title: t('risks.wizard.step2'),
      description: t('risks.wizard.step2Desc'),
    },
    {
      title: t('risks.wizard.step3'),
      description: t('risks.wizard.step3Desc'),
    },
    {
      title: t('risks.wizard.step4'),
      description: t('risks.wizard.step4Desc'),
    },
    {
      title: t('risks.wizard.step5'),
      description: t('risks.wizard.step5Desc'),
    },
    {
      title: t('risks.wizard.step6'),
      description: t('risks.wizard.step6Desc'),
    },
  ];

  const renderGuidanceBox = (title: string, content: string) => (
    <div className="mb-4 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
      <Lightbulb className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
      <div>
        <p className="font-medium text-blue-900 dark:text-blue-100">{title}</p>
        <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">{content}</p>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      {showGuidance && renderGuidanceBox(
        t('risks.guidance.title'),
        t('risks.guidance.descriptionHelp')
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Input
            label={isAr ? 'عنوان الخطر (عربي) *' : 'Risk Title (Arabic) *'}
            value={formData.titleAr}
            onChange={(e) => updateField('titleAr', e.target.value)}
            error={errors.titleAr}
            placeholder={isAr ? 'مثال: خطر تأخر توريد المواد الخام' : 'e.g., Raw Material Supply Delay Risk'}
          />
        </div>
        <div>
          <Input
            label={isAr ? 'عنوان الخطر (إنجليزي) *' : 'Risk Title (English) *'}
            value={formData.titleEn}
            onChange={(e) => updateField('titleEn', e.target.value)}
            error={errors.titleEn}
            placeholder="e.g., Raw Material Supply Delay Risk"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
          {isAr ? 'وصف الخطر (عربي) *' : 'Risk Description (Arabic) *'}
        </label>
        <textarea
          className={`flex min-h-24 w-full rounded-lg border ${errors.descriptionAr ? 'border-red-500' : 'border-[var(--border)]'} bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-20`}
          value={formData.descriptionAr}
          onChange={(e) => updateField('descriptionAr', e.target.value)}
          placeholder={isAr ? 'صف الخطر بالتفصيل...' : 'Describe the risk in detail...'}
        />
        {errors.descriptionAr && (
          <p className="mt-1 text-xs text-red-500">{errors.descriptionAr}</p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
          {isAr ? 'وصف الخطر (إنجليزي)' : 'Risk Description (English)'}
        </label>
        <textarea
          className="flex min-h-24 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-20"
          value={formData.descriptionEn}
          onChange={(e) => updateField('descriptionEn', e.target.value)}
          placeholder="Describe the risk in detail..."
        />
      </div>

      <div className="w-full sm:w-1/2">
        <Select
          label={t('risks.issuedBy')}
          options={[
            { value: 'Internal', label: t('risks.issuers.Internal') },
            { value: 'KPMG', label: t('risks.issuers.KPMG') },
            { value: 'External', label: t('risks.issuers.External') },
          ]}
          value={formData.issuedBy}
          onChange={(value) => updateField('issuedBy', value)}
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      {showGuidance && renderGuidanceBox(
        t('risks.guidance.title'),
        isAr ? 'اختر الفئة المناسبة للخطر ثم حدد الوظيفة والعملية المرتبطة به' : 'Select the appropriate risk category, then specify the related function and process'
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Select
            label={`${t('risks.riskCategory')} *`}
            options={DEFAULT_RISK_CATEGORIES.map(cat => ({
              value: cat.code,
              label: isAr ? cat.nameAr : cat.nameEn,
            }))}
            value={formData.categoryId}
            onChange={(value) => updateField('categoryId', value)}
            placeholder={isAr ? 'اختر فئة الخطر' : 'Select Risk Category'}
            error={errors.categoryId}
          />
          {formData.categoryId && (
            <p className="mt-1 text-xs text-[var(--foreground-secondary)]">
              {isAr
                ? DEFAULT_RISK_CATEGORIES.find(c => c.code === formData.categoryId)?.examplesAr
                : DEFAULT_RISK_CATEGORIES.find(c => c.code === formData.categoryId)?.examplesEn
              }
            </p>
          )}
        </div>

        <div>
          <Select
            label={`${t('risks.department')} *`}
            options={mockDepartments.map(dept => ({
              value: dept.id,
              label: isAr ? dept.nameAr : dept.nameEn,
            }))}
            value={formData.departmentId}
            onChange={(value) => {
              updateField('departmentId', value);
              updateField('processId', '');
              updateField('subProcessId', '');
            }}
            placeholder={isAr ? 'اختر الوظيفة' : 'Select Function'}
            error={errors.departmentId}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Select
            label={t('risks.process')}
            options={availableProcesses.map(proc => ({
              value: proc.id,
              label: isAr ? proc.nameAr : proc.nameEn,
            }))}
            value={formData.processId}
            onChange={(value) => updateField('processId', value)}
            placeholder={isAr ? 'اختر العملية' : 'Select Process'}
            disabled={!formData.departmentId}
          />
          {!formData.departmentId && (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              {t('risks.wizard.selectDepartmentFirst')}
            </p>
          )}
        </div>

        <div>
          <Select
            label={t('risks.subProcess')}
            options={[]}
            value={formData.subProcessId}
            onChange={(value) => updateField('subProcessId', value)}
            placeholder={isAr ? 'اختر العملية الفرعية' : 'Select Sub Process'}
            disabled={!formData.processId}
          />
          {formData.departmentId && !formData.processId && (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              {t('risks.wizard.selectProcessFirst')}
            </p>
          )}
        </div>
      </div>

      {/* Auto-generated Risk Number Preview */}
      {formData.categoryId && formData.departmentId && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] p-4">
          <p className="mb-2 text-sm font-medium text-[var(--foreground-secondary)]">
            {isAr ? 'رقم الخطر المتوقع:' : 'Expected Risk Number:'}
          </p>
          <code className="rounded bg-[var(--background-tertiary)] px-3 py-1.5 text-lg font-mono">
            {formData.categoryId}-R-{String(Math.floor(Math.random() * 100) + 1).padStart(3, '0')}
          </code>
          <p className="mt-2 text-xs text-[var(--foreground-muted)]">
            {t('risks.wizard.autoNumbering')}
          </p>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      {showGuidance && renderGuidanceBox(
        t('risks.guidance.title'),
        t('risks.guidance.causeHelp')
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
          {t('risks.potentialCause')} ({isAr ? 'عربي' : 'Arabic'})
        </label>
        <textarea
          className="flex min-h-20 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-20"
          value={formData.potentialCauseAr}
          onChange={(e) => updateField('potentialCauseAr', e.target.value)}
          placeholder={isAr ? 'ما هي العوامل التي قد تسبب حدوث هذا الخطر؟' : 'What factors could cause this risk?'}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
          {t('risks.potentialCause')} ({isAr ? 'إنجليزي' : 'English'})
        </label>
        <textarea
          className="flex min-h-20 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-20"
          value={formData.potentialCauseEn}
          onChange={(e) => updateField('potentialCauseEn', e.target.value)}
          placeholder="What factors could cause this risk?"
        />
      </div>

      {showGuidance && (
        <div className="my-4 border-t border-[var(--border)] pt-4">
          {renderGuidanceBox(
            t('risks.guidance.title'),
            t('risks.guidance.impactHelp')
          )}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
          {t('risks.potentialImpact')} ({isAr ? 'عربي' : 'Arabic'})
        </label>
        <textarea
          className="flex min-h-20 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-20"
          value={formData.potentialImpactAr}
          onChange={(e) => updateField('potentialImpactAr', e.target.value)}
          placeholder={isAr ? 'ما هي النتائج المحتملة إذا حدث هذا الخطر؟' : 'What are the potential consequences?'}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
          {t('risks.potentialImpact')} ({isAr ? 'إنجليزي' : 'English'})
        </label>
        <textarea
          className="flex min-h-20 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-20"
          value={formData.potentialImpactEn}
          onChange={(e) => updateField('potentialImpactEn', e.target.value)}
          placeholder="What are the potential consequences?"
        />
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      {showGuidance && renderGuidanceBox(
        t('risks.guidance.title'),
        t('risks.wizard.ratingCalculated')
      )}

      {/* Likelihood Selection */}
      <div>
        <label className="mb-3 block text-sm font-medium text-[var(--foreground)]">
          {t('risks.likelihood')} *
        </label>
        <div className="grid gap-2">
          {DEFAULT_LIKELIHOOD_CRITERIA.map((criteria) => (
            <button
              key={criteria.level}
              type="button"
              onClick={() => updateField('inherentLikelihood', criteria.level)}
              className={`flex items-start gap-4 rounded-lg border-2 p-4 text-start transition-all ${
                formData.inherentLikelihood === criteria.level
                  ? 'border-[var(--primary)] bg-[var(--primary-light)]'
                  : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--border-hover)]'
              }`}
            >
              <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-white font-bold ${
                criteria.level === 5 ? 'bg-red-500' :
                criteria.level === 4 ? 'bg-orange-500' :
                criteria.level === 3 ? 'bg-yellow-500' :
                criteria.level === 2 ? 'bg-blue-500' :
                'bg-green-500'
              }`}>
                {criteria.level}
              </div>
              <div className="flex-1">
                <p className="font-medium text-[var(--foreground)]">
                  {isAr ? criteria.nameAr : criteria.nameEn}
                </p>
                <p className="mt-0.5 text-sm text-[var(--foreground-secondary)]">
                  {isAr ? criteria.descriptionAr : criteria.descriptionEn}
                </p>
                <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
                  {criteria.percentage}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Impact Selection */}
      <div>
        <label className="mb-3 block text-sm font-medium text-[var(--foreground)]">
          {t('risks.impact')} *
        </label>
        <div className="grid gap-2">
          {DEFAULT_IMPACT_CRITERIA.map((criteria) => (
            <button
              key={criteria.level}
              type="button"
              onClick={() => updateField('inherentImpact', criteria.level)}
              className={`flex items-start gap-4 rounded-lg border-2 p-4 text-start transition-all ${
                formData.inherentImpact === criteria.level
                  ? 'border-[var(--primary)] bg-[var(--primary-light)]'
                  : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--border-hover)]'
              }`}
            >
              <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-white font-bold ${
                criteria.level === 5 ? 'bg-red-500' :
                criteria.level === 4 ? 'bg-orange-500' :
                criteria.level === 3 ? 'bg-yellow-500' :
                criteria.level === 2 ? 'bg-blue-500' :
                'bg-green-500'
              }`}>
                {criteria.level}
              </div>
              <div className="flex-1">
                <p className="font-medium text-[var(--foreground)]">
                  {isAr ? criteria.nameAr : criteria.nameEn}
                </p>
                <p className="mt-0.5 text-sm text-[var(--foreground-secondary)]">
                  {isAr ? criteria.descriptionAr : criteria.descriptionEn}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Risk Score Display */}
      <div className="rounded-lg border-2 border-[var(--border)] bg-[var(--background-secondary)] p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--foreground-secondary)]">
              {t('risks.riskScore')}
            </p>
            <p className="mt-1 text-4xl font-bold text-[var(--foreground)]">{riskScore}</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-[var(--foreground-secondary)]">
              {t('risks.riskRating')}
            </p>
            <Badge
              variant={
                riskRating === 'Critical' ? 'critical' :
                riskRating === 'Major' ? 'high' :
                riskRating === 'Moderate' ? 'medium' :
                riskRating === 'Minor' ? 'low' :
                'default'
              }
              className="mt-1 text-lg px-4 py-1"
            >
              {t(`risks.ratings.${riskRating}`)}
            </Badge>
          </div>
          <div className="text-end">
            <p className="text-sm font-medium text-[var(--foreground-secondary)]">
              {isAr ? 'الصيغة' : 'Formula'}
            </p>
            <p className="mt-1 font-mono text-lg text-[var(--foreground)]">
              {formData.inherentLikelihood} × {formData.inherentImpact} = {riskScore}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded bg-[var(--background-tertiary)] p-3">
          <p className="text-sm text-[var(--foreground-secondary)]">
            {riskRating === 'Critical' && (isAr ? 'يتطلب اهتماماً فورياً من الإدارة العليا' : 'Requires immediate senior management attention')}
            {riskRating === 'Major' && (isAr ? 'يتطلب خطة معالجة عاجلة' : 'Requires urgent treatment plan')}
            {riskRating === 'Moderate' && (isAr ? 'يتطلب مراقبة وخطة معالجة' : 'Requires monitoring and treatment plan')}
            {riskRating === 'Minor' && (isAr ? 'يتطلب مراقبة دورية' : 'Requires periodic monitoring')}
            {riskRating === 'Negligible' && (isAr ? 'مقبول مع مراقبة أساسية' : 'Acceptable with basic monitoring')}
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      {showGuidance && renderGuidanceBox(
        t('risks.guidance.title'),
        t('risks.guidance.controlsHelp')
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
          {t('risks.layersOfProtection')} ({isAr ? 'عربي' : 'Arabic'})
        </label>
        <textarea
          className="flex min-h-20 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-20"
          value={formData.layersOfProtectionAr}
          onChange={(e) => updateField('layersOfProtectionAr', e.target.value)}
          placeholder={isAr ? 'ما هي الضوابط الحالية للتحكم في هذا الخطر؟' : 'What current controls are in place?'}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
          {t('risks.layersOfProtection')} ({isAr ? 'إنجليزي' : 'English'})
        </label>
        <textarea
          className="flex min-h-20 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-20"
          value={formData.layersOfProtectionEn}
          onChange={(e) => updateField('layersOfProtectionEn', e.target.value)}
          placeholder="What current controls are in place?"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
          {t('risks.mitigationActions')} ({isAr ? 'عربي' : 'Arabic'})
        </label>
        <textarea
          className="flex min-h-20 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-20"
          value={formData.mitigationActionsAr}
          onChange={(e) => updateField('mitigationActionsAr', e.target.value)}
          placeholder={isAr ? 'ما هي إجراءات التخفيف المقترحة؟' : 'What mitigation actions are proposed?'}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
          {t('risks.mitigationActions')} ({isAr ? 'إنجليزي' : 'English'})
        </label>
        <textarea
          className="flex min-h-20 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-20"
          value={formData.mitigationActionsEn}
          onChange={(e) => updateField('mitigationActionsEn', e.target.value)}
          placeholder="What mitigation actions are proposed?"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Select
            label={`${t('risks.riskOwner')} *`}
            options={mockUsers.map(user => ({
              value: user.id,
              label: isAr ? user.nameAr : user.nameEn,
            }))}
            value={formData.ownerId}
            onChange={(value) => updateField('ownerId', value)}
            placeholder={isAr ? 'اختر مالك الخطر' : 'Select Risk Owner'}
            error={errors.ownerId}
          />
        </div>

        <div>
          <Select
            label={t('risks.riskChampion')}
            options={mockUsers.map(user => ({
              value: user.id,
              label: isAr ? user.nameAr : user.nameEn,
            }))}
            value={formData.championId}
            onChange={(value) => updateField('championId', value)}
            placeholder={isAr ? 'اختر رائد المخاطر' : 'Select Risk Champion'}
          />
        </div>
      </div>

      <div className="rounded-lg border border-[var(--border)] p-4">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="complianceRequired"
            checked={formData.complianceRequired}
            onChange={(e) => updateField('complianceRequired', e.target.checked)}
            className="h-4 w-4 rounded border-[var(--border)] text-[var(--primary)]"
          />
          <label htmlFor="complianceRequired" className="text-sm font-medium text-[var(--foreground)]">
            {t('risks.complianceRequired')}
          </label>
        </div>

        {formData.complianceRequired && (
          <div className="mt-4">
            <Input
              label={t('risks.complianceNote')}
              value={formData.complianceNoteAr}
              onChange={(e) => updateField('complianceNoteAr', e.target.value)}
              placeholder={isAr ? 'أضف ملاحظات الامتثال...' : 'Add compliance notes...'}
            />
          </div>
        )}
      </div>
    </div>
  );

  const renderStep6 = () => {
    const selectedCategory = DEFAULT_RISK_CATEGORIES.find(c => c.code === formData.categoryId);
    const selectedDept = mockDepartments.find(d => d.id === formData.departmentId);
    const selectedProcess = availableProcesses.find(p => p.id === formData.processId);
    const selectedOwner = mockUsers.find(u => u.id === formData.ownerId);
    const selectedChampion = mockUsers.find(u => u.id === formData.championId);

    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
          <div className="flex items-center gap-3">
            <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
            <p className="font-medium text-green-900 dark:text-green-100">
              {isAr ? 'مراجعة المعلومات قبل الحفظ' : 'Review information before saving'}
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Basic Info */}
          <Card className="p-4">
            <h4 className="mb-3 font-semibold text-[var(--foreground)]">
              {t('risks.wizard.step1')}
            </h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-[var(--foreground-secondary)]">{t('risks.riskTitle')}: </span>
                <span className="font-medium">{isAr ? formData.titleAr : formData.titleEn}</span>
              </div>
              <div>
                <span className="text-[var(--foreground-secondary)]">{t('risks.issuedBy')}: </span>
                <span className="font-medium">{t(`risks.issuers.${formData.issuedBy}`)}</span>
              </div>
            </div>
          </Card>

          {/* Classification */}
          <Card className="p-4">
            <h4 className="mb-3 font-semibold text-[var(--foreground)]">
              {t('risks.wizard.step2')}
            </h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-[var(--foreground-secondary)]">{t('risks.riskCategory')}: </span>
                <span className="font-medium">
                  {selectedCategory ? (isAr ? selectedCategory.nameAr : selectedCategory.nameEn) : '-'}
                </span>
              </div>
              <div>
                <span className="text-[var(--foreground-secondary)]">{t('risks.department')}: </span>
                <span className="font-medium">
                  {selectedDept ? (isAr ? selectedDept.nameAr : selectedDept.nameEn) : '-'}
                </span>
              </div>
              <div>
                <span className="text-[var(--foreground-secondary)]">{t('risks.process')}: </span>
                <span className="font-medium">
                  {selectedProcess ? (isAr ? selectedProcess.nameAr : selectedProcess.nameEn) : '-'}
                </span>
              </div>
            </div>
          </Card>

          {/* Assessment */}
          <Card className="p-4">
            <h4 className="mb-3 font-semibold text-[var(--foreground)]">
              {t('risks.wizard.step4')}
            </h4>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-xs text-[var(--foreground-secondary)]">{t('risks.likelihood')}</p>
                <p className="text-2xl font-bold">{formData.inherentLikelihood}</p>
              </div>
              <span className="text-xl">×</span>
              <div className="text-center">
                <p className="text-xs text-[var(--foreground-secondary)]">{t('risks.impact')}</p>
                <p className="text-2xl font-bold">{formData.inherentImpact}</p>
              </div>
              <span className="text-xl">=</span>
              <div className="text-center">
                <p className="text-xs text-[var(--foreground-secondary)]">{t('risks.riskScore')}</p>
                <p className="text-2xl font-bold">{riskScore}</p>
              </div>
              <Badge
                variant={
                  riskRating === 'Critical' ? 'critical' :
                  riskRating === 'Major' ? 'high' :
                  riskRating === 'Moderate' ? 'medium' :
                  riskRating === 'Minor' ? 'low' :
                  'default'
                }
              >
                {t(`risks.ratings.${riskRating}`)}
              </Badge>
            </div>
          </Card>

          {/* Responsible */}
          <Card className="p-4">
            <h4 className="mb-3 font-semibold text-[var(--foreground)]">
              {isAr ? 'المسؤولين' : 'Responsible'}
            </h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-[var(--foreground-secondary)]">{t('risks.riskOwner')}: </span>
                <span className="font-medium">
                  {selectedOwner ? (isAr ? selectedOwner.nameAr : selectedOwner.nameEn) : '-'}
                </span>
              </div>
              <div>
                <span className="text-[var(--foreground-secondary)]">{t('risks.riskChampion')}: </span>
                <span className="font-medium">
                  {selectedChampion ? (isAr ? selectedChampion.nameAr : selectedChampion.nameEn) : '-'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-xl bg-[var(--card)] shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] p-6">
          <div>
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              {t('risks.wizard.title')}
            </h2>
            <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
              {t('common.step')} {currentStep} {t('common.of')} {totalSteps}: {steps[currentStep - 1].title}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowGuidance(!showGuidance)}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                showGuidance
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)]'
              }`}
            >
              <HelpCircle className="h-4 w-4" />
              {isAr ? 'الإرشادات' : 'Guidance'}
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4">
          <div className="flex gap-2">
            {steps.map((step, index) => (
              <div key={index} className="flex-1">
                <div
                  className={`h-2 rounded-full transition-colors ${
                    index + 1 < currentStep
                      ? 'bg-green-500'
                      : index + 1 === currentStep
                      ? 'bg-[var(--primary)]'
                      : 'bg-[var(--background-tertiary)]'
                  }`}
                />
                <p className={`mt-2 text-xs ${
                  index + 1 === currentStep
                    ? 'font-medium text-[var(--foreground)]'
                    : 'text-[var(--foreground-muted)]'
                }`}>
                  {step.title}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}
          {currentStep === 6 && renderStep6()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[var(--border)] p-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            leftIcon={isAr ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          >
            {t('common.previous')}
          </Button>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>

            {currentStep < totalSteps ? (
              <Button
                onClick={handleNext}
                rightIcon={isAr ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              >
                {t('common.next')}
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                leftIcon={<Check className="h-4 w-4" />}
              >
                {t('common.save')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
