'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
  HelpCircle,
  Lightbulb,
  X,
  Send,
  Loader2,
} from 'lucide-react';
import {
  calculateRiskScore,
  getRiskRating,
  getRiskRatingColor,
  DEFAULT_LIKELIHOOD_CRITERIA,
  DEFAULT_IMPACT_CRITERIA,
} from '@/types';

// Types for data from database
interface RiskCategory {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  examplesAr?: string | null;
  examplesEn?: string | null;
  color?: string | null;
  isActive: boolean;
}

interface Department {
  id: string;
  nameAr: string;
  nameEn: string;
  code: string;
}

interface RiskOwnerType {
  id: string;
  fullName: string;
  fullNameEn?: string;
  email?: string;
  departmentId?: string;
}

interface User {
  id: string;
  fullName: string;
  fullNameEn?: string;
  role: string;
}

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
  processText: string;      // العملية كنص حر
  subProcessText: string;   // العملية الفرعية كنص حر

  // Step 3: Causes & Impacts
  potentialCauseAr: string;
  potentialCauseEn: string;
  potentialImpactAr: string;
  potentialImpactEn: string;

  // Step 4: Assessment
  inherentLikelihood: number;
  inherentImpact: number;

  // Step 5: Controls & Treatment
  existingControlsAr: string;  // الضوابط الحالية (بدلاً من طبقات الحماية)
  existingControlsEn: string;
  krisAr: string;
  krisEn: string;
  mitigationActionsAr: string;
  mitigationActionsEn: string;
  complianceRequired: boolean;
  complianceNoteAr: string;
  complianceNoteEn: string;

  // Responsible
  riskOwnerId: string;   // مالك الخطر من جدول RiskOwner
  championId: string;    // رائد المخاطر (يجب أن يكون دوره riskChampion)
}

const initialFormData: RiskFormData = {
  titleAr: '',
  titleEn: '',
  descriptionAr: '',
  descriptionEn: '',
  issuedBy: 'Internal',
  categoryId: '',
  departmentId: '',
  processText: '',
  subProcessText: '',
  potentialCauseAr: '',
  potentialCauseEn: '',
  potentialImpactAr: '',
  potentialImpactEn: '',
  inherentLikelihood: 3,
  inherentImpact: 3,
  existingControlsAr: '',
  existingControlsEn: '',
  krisAr: '',
  krisEn: '',
  mitigationActionsAr: '',
  mitigationActionsEn: '',
  complianceRequired: false,
  complianceNoteAr: '',
  complianceNoteEn: '',
  riskOwnerId: '',
  championId: '',
};


interface RiskWizardProps {
  onClose: () => void;
  onSave: (data: RiskFormData) => Promise<void>;
}

export function RiskWizard({ onClose, onSave }: RiskWizardProps) {
  const { t, language } = useTranslation();
  const isAr = language === 'ar';

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<RiskFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof RiskFormData, string>>>({});
  const [showGuidance, setShowGuidance] = useState(true);

  // Data from API
  const [categories, setCategories] = useState<RiskCategory[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [riskOwners, setRiskOwners] = useState<RiskOwnerType[]>([]);
  const [riskChampions, setRiskChampions] = useState<User[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = 6;

  // Fetch data from API on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        // Fetch categories from database
        const catRes = await fetch('/api/categories');
        if (catRes.ok) {
          const catData = await catRes.json();
          const activeCategories = (catData.data || []).filter((c: RiskCategory) => c.isActive);
          setCategories(activeCategories);
        }

        // Fetch departments
        const deptRes = await fetch('/api/departments');
        if (deptRes.ok) {
          const deptData = await deptRes.json();
          setDepartments(deptData.data || []);
        }

        // Fetch risk owners from RiskOwner table
        const ownersRes = await fetch('/api/risk-owners');
        if (ownersRes.ok) {
          const ownersData = await ownersRes.json();
          setRiskOwners(ownersData.data || []);
        }

        // Fetch users with role riskChampion for risk champion field
        const championsRes = await fetch('/api/users?role=riskChampion');
        if (championsRes.ok) {
          const championsData = await championsRes.json();
          setRiskChampions(championsData.data || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, []);

  // Calculate risk score and rating
  const riskScore = useMemo(() =>
    calculateRiskScore(formData.inherentLikelihood, formData.inherentImpact),
    [formData.inherentLikelihood, formData.inherentImpact]
  );

  const riskRating = useMemo(() => getRiskRating(riskScore), [riskScore]);

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
      case 3:
        // السبب المحتمل إجباري (عربي أو إنجليزي)
        if (!formData.potentialCauseAr.trim() && !formData.potentialCauseEn.trim()) {
          newErrors.potentialCauseAr = isAr ? 'يرجى إدخال السبب المحتمل بالعربي أو الإنجليزي' : 'Please enter potential cause in Arabic or English';
        }
        // التأثير المحتمل إجباري (عربي أو إنجليزي)
        if (!formData.potentialImpactAr.trim() && !formData.potentialImpactEn.trim()) {
          newErrors.potentialImpactAr = isAr ? 'يرجى إدخال التأثير المحتمل بالعربي أو الإنجليزي' : 'Please enter potential impact in Arabic or English';
        }
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
        if (!formData.riskOwnerId) newErrors.riskOwnerId = t('validation.selectOption');
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t, isAr]);

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

  const handleSubmit = useCallback(async () => {
    // منع الضغط المتكرر
    if (isSubmitting) return;

    if (validateStep(currentStep)) {
      setIsSubmitting(true);
      try {
        await onSave(formData);
      } catch (error) {
        console.error('Error submitting risk:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [currentStep, formData, onSave, validateStep, isSubmitting]);

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
            options={categories.map(cat => ({
              value: cat.id,
              label: isAr ? cat.nameAr : cat.nameEn,
            }))}
            value={formData.categoryId}
            onChange={(value) => updateField('categoryId', value)}
            placeholder={isAr ? 'اختر فئة الخطر' : 'Select Risk Category'}
            error={errors.categoryId}
            disabled={isLoadingData}
          />
          {formData.categoryId && (
            <p className="mt-1 text-xs text-[var(--foreground-secondary)]">
              {isAr
                ? categories.find(c => c.id === formData.categoryId)?.examplesAr
                : categories.find(c => c.id === formData.categoryId)?.examplesEn
              }
            </p>
          )}
        </div>

        <div>
          <Select
            label={`${isAr ? 'الوظيفة' : 'Function'} *`}
            options={departments.map(dept => ({
              value: dept.id,
              label: isAr ? dept.nameAr : dept.nameEn,
            }))}
            value={formData.departmentId}
            onChange={(value) => updateField('departmentId', value)}
            placeholder={isAr ? 'اختر الوظيفة' : 'Select Function'}
            error={errors.departmentId}
            disabled={isLoadingData}
          />
        </div>
      </div>

      {/* حقول العملية والعملية الفرعية كنص حر */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Input
            label={isAr ? 'العملية' : 'Process'}
            value={formData.processText}
            onChange={(e) => updateField('processText', e.target.value)}
            placeholder={isAr ? 'أدخل العملية...' : 'Enter process...'}
          />
        </div>

        <div>
          <Input
            label={isAr ? 'العملية الفرعية' : 'Sub Process'}
            value={formData.subProcessText}
            onChange={(e) => updateField('subProcessText', e.target.value)}
            placeholder={isAr ? 'أدخل العملية الفرعية...' : 'Enter sub process...'}
          />
        </div>
      </div>

      {/* Auto-generated Risk Number Preview */}
      {formData.categoryId && formData.departmentId && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] p-4">
          <p className="mb-2 text-sm font-medium text-[var(--foreground-secondary)]">
            {isAr ? 'رقم الخطر المتوقع:' : 'Expected Risk Number:'}
          </p>
          <code className="rounded bg-[var(--background-tertiary)] px-3 py-1.5 text-lg font-mono">
            {departments.find(d => d.id === formData.departmentId)?.code || 'XXX'}-{String(Math.floor(Math.random() * 100) + 1).padStart(3, '0')}
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
          {isAr ? 'السبب المحتمل (عربي) *' : 'Potential Cause (Arabic) *'}
        </label>
        <textarea
          className={`flex min-h-20 w-full rounded-lg border ${errors.potentialCauseAr ? 'border-red-500' : 'border-[var(--border)]'} bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-20`}
          value={formData.potentialCauseAr}
          onChange={(e) => updateField('potentialCauseAr', e.target.value)}
          placeholder={isAr ? 'ما هي العوامل التي قد تسبب حدوث هذا الخطر؟' : 'What factors could cause this risk?'}
        />
        {errors.potentialCauseAr && (
          <p className="mt-1 text-xs text-red-500">{errors.potentialCauseAr}</p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
          {isAr ? 'السبب المحتمل (إنجليزي) *' : 'Potential Cause (English) *'}
        </label>
        <textarea
          className="flex min-h-20 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-20"
          value={formData.potentialCauseEn}
          onChange={(e) => updateField('potentialCauseEn', e.target.value)}
          placeholder="What factors could cause this risk?"
        />
        <p className="mt-1 text-xs text-[var(--foreground-muted)]">
          {isAr ? '* مطلوب إدخال السبب المحتمل بالعربي أو الإنجليزي على الأقل' : '* At least Arabic or English cause is required'}
        </p>
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
          {isAr ? 'التأثير المحتمل (عربي) *' : 'Potential Impact (Arabic) *'}
        </label>
        <textarea
          className={`flex min-h-20 w-full rounded-lg border ${errors.potentialImpactAr ? 'border-red-500' : 'border-[var(--border)]'} bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-20`}
          value={formData.potentialImpactAr}
          onChange={(e) => updateField('potentialImpactAr', e.target.value)}
          placeholder={isAr ? 'ما هي النتائج المحتملة إذا حدث هذا الخطر؟' : 'What are the potential consequences?'}
        />
        {errors.potentialImpactAr && (
          <p className="mt-1 text-xs text-red-500">{errors.potentialImpactAr}</p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
          {isAr ? 'التأثير المحتمل (إنجليزي) *' : 'Potential Impact (English) *'}
        </label>
        <textarea
          className="flex min-h-20 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-20"
          value={formData.potentialImpactEn}
          onChange={(e) => updateField('potentialImpactEn', e.target.value)}
          placeholder="What are the potential consequences?"
        />
        <p className="mt-1 text-xs text-[var(--foreground-muted)]">
          {isAr ? '* مطلوب إدخال التأثير المحتمل بالعربي أو الإنجليزي على الأقل' : '* At least Arabic or English impact is required'}
        </p>
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

      {/* الضوابط الحالية (بدلاً من طبقات الحماية) */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
          {isAr ? 'الضوابط الحالية (عربي)' : 'Existing Controls (Arabic)'}
        </label>
        <textarea
          className="flex min-h-20 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-20"
          value={formData.existingControlsAr}
          onChange={(e) => updateField('existingControlsAr', e.target.value)}
          placeholder={isAr ? 'ما هي الضوابط الحالية للتحكم في هذا الخطر؟' : 'What current controls are in place?'}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
          {isAr ? 'الضوابط الحالية (إنجليزي)' : 'Existing Controls (English)'}
        </label>
        <textarea
          className="flex min-h-20 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-20"
          value={formData.existingControlsEn}
          onChange={(e) => updateField('existingControlsEn', e.target.value)}
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
        {/* مالك الخطر - من جدول RiskOwner */}
        <div>
          <Select
            label={`${isAr ? 'مالك الخطر' : 'Risk Owner'} *`}
            options={riskOwners.map(owner => ({
              value: owner.id,
              label: isAr ? owner.fullName : (owner.fullNameEn || owner.fullName),
            }))}
            value={formData.riskOwnerId}
            onChange={(value) => updateField('riskOwnerId', value)}
            placeholder={isAr ? 'اختر مالك الخطر' : 'Select Risk Owner'}
            error={errors.riskOwnerId}
            disabled={isLoadingData}
          />
        </div>

        {/* رائد المخاطر - من جدول Users مع فلترة دور riskChampion */}
        <div>
          <Select
            label={isAr ? 'رائد المخاطر' : 'Risk Champion'}
            options={riskChampions.map(user => ({
              value: user.id,
              label: isAr ? user.fullName : (user.fullNameEn || user.fullName),
            }))}
            value={formData.championId}
            onChange={(value) => updateField('championId', value)}
            placeholder={isAr ? 'اختر رائد المخاطر' : 'Select Risk Champion'}
            disabled={isLoadingData}
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
    const selectedCategory = categories.find(c => c.id === formData.categoryId);
    const selectedDept = departments.find(d => d.id === formData.departmentId);
    const selectedOwner = riskOwners.find(o => o.id === formData.riskOwnerId);
    const selectedChampion = riskChampions.find(u => u.id === formData.championId);

    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <div className="flex items-center gap-3">
            <Send className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <p className="font-medium text-amber-900 dark:text-amber-100">
              {isAr ? 'مراجعة المعلومات قبل الإرسال لمدير المخاطر للموافقة' : 'Review information before sending to Risk Manager for approval'}
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
                <span className="text-[var(--foreground-secondary)]">{isAr ? 'الوظيفة' : 'Function'}: </span>
                <span className="font-medium">
                  {selectedDept ? (isAr ? selectedDept.nameAr : selectedDept.nameEn) : '-'}
                </span>
              </div>
              <div>
                <span className="text-[var(--foreground-secondary)]">{isAr ? 'العملية' : 'Process'}: </span>
                <span className="font-medium">{formData.processText || '-'}</span>
              </div>
              <div>
                <span className="text-[var(--foreground-secondary)]">{isAr ? 'العملية الفرعية' : 'Sub Process'}: </span>
                <span className="font-medium">{formData.subProcessText || '-'}</span>
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
                <span className="text-[var(--foreground-secondary)]">{isAr ? 'مالك الخطر' : 'Risk Owner'}: </span>
                <span className="font-medium">
                  {selectedOwner ? (isAr ? selectedOwner.fullName : (selectedOwner.fullNameEn || selectedOwner.fullName)) : '-'}
                </span>
              </div>
              <div>
                <span className="text-[var(--foreground-secondary)]">{isAr ? 'رائد المخاطر' : 'Risk Champion'}: </span>
                <span className="font-medium">
                  {selectedChampion ? (isAr ? selectedChampion.fullName : (selectedChampion.fullNameEn || selectedChampion.fullName)) : '-'}
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
                onClick={handleSubmit}
                disabled={isSubmitting}
                leftIcon={isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              >
                {isSubmitting
                  ? (isAr ? 'جاري الإرسال...' : 'Sending...')
                  : (isAr ? 'إرسال لمدير المخاطر للموافقة' : 'Send to Risk Manager for Approval')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export type { RiskFormData };
