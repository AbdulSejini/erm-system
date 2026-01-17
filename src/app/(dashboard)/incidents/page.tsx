'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import {
  Plus,
  Search,
  AlertCircle,
  Eye,
  Edit,
  Calendar,
  User,
  Link,
} from 'lucide-react';
import type { IncidentSeverity, IncidentStatus } from '@/types';

const mockIncidents = [
  {
    id: '1',
    incidentNumber: 'INC-2026-0012',
    titleAr: 'انقطاع في خط الإنتاج رقم 3',
    titleEn: 'Production Line 3 Outage',
    descriptionAr: 'توقف خط الإنتاج رقم 3 لمدة 4 ساعات بسبب عطل في المحرك الرئيسي',
    descriptionEn: 'Production line 3 stopped for 4 hours due to main motor failure',
    severity: 'major' as IncidentSeverity,
    status: 'investigating' as IncidentStatus,
    departmentAr: 'العمليات',
    departmentEn: 'Operations',
    reportedByAr: 'خالد أحمد',
    reportedByEn: 'Khalid Ahmed',
    incidentDate: '2026-01-16',
    reportedDate: '2026-01-16',
    relatedRisk: 'RSK-2026-0043',
  },
  {
    id: '2',
    incidentNumber: 'INC-2026-0011',
    titleAr: 'محاولة اختراق للنظام',
    titleEn: 'System Breach Attempt',
    descriptionAr: 'تم رصد محاولات متعددة للوصول غير المصرح به للنظام',
    descriptionEn: 'Multiple unauthorized access attempts were detected',
    severity: 'critical' as IncidentSeverity,
    status: 'resolved' as IncidentStatus,
    departmentAr: 'تقنية المعلومات',
    departmentEn: 'IT',
    reportedByAr: 'محمد عبدالله',
    reportedByEn: 'Mohammed Abdullah',
    incidentDate: '2026-01-14',
    reportedDate: '2026-01-14',
    relatedRisk: 'RSK-2026-0041',
  },
  {
    id: '3',
    incidentNumber: 'INC-2026-0010',
    titleAr: 'تسرب مادة كيميائية',
    titleEn: 'Chemical Leak',
    descriptionAr: 'تسرب محدود لمادة التبريد في منطقة التخزين',
    descriptionEn: 'Limited coolant leak in storage area',
    severity: 'moderate' as IncidentSeverity,
    status: 'closed' as IncidentStatus,
    departmentAr: 'السلامة والبيئة',
    departmentEn: 'HSE',
    reportedByAr: 'فاطمة حسن',
    reportedByEn: 'Fatima Hassan',
    incidentDate: '2026-01-10',
    reportedDate: '2026-01-10',
    relatedRisk: null,
  },
  {
    id: '4',
    incidentNumber: 'INC-2026-0009',
    titleAr: 'تأخير شحنة مواد خام',
    titleEn: 'Raw Material Shipment Delay',
    descriptionAr: 'تأخر وصول شحنة النحاس الخام 5 أيام عن الموعد المحدد',
    descriptionEn: 'Copper shipment arrived 5 days late',
    severity: 'minor' as IncidentSeverity,
    status: 'reported' as IncidentStatus,
    departmentAr: 'سلسلة التوريد',
    departmentEn: 'Supply Chain',
    reportedByAr: 'أحمد محمد',
    reportedByEn: 'Ahmed Mohammed',
    incidentDate: '2026-01-08',
    reportedDate: '2026-01-09',
    relatedRisk: 'RSK-2026-0045',
  },
];

export default function IncidentsPage() {
  const { t, language } = useTranslation();
  const isAr = language === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const getSeverityColor = (severity: IncidentSeverity): 'critical' | 'high' | 'medium' | 'low' => {
    switch (severity) {
      case 'critical':
        return 'critical';
      case 'major':
        return 'high';
      case 'moderate':
        return 'medium';
      case 'minor':
        return 'low';
      default:
        return 'low';
    }
  };

  const getStatusColor = (status: IncidentStatus): 'info' | 'warning' | 'success' | 'default' => {
    switch (status) {
      case 'reported':
        return 'info';
      case 'investigating':
        return 'warning';
      case 'resolved':
      case 'closed':
        return 'success';
      default:
        return 'default';
    }
  };

  const filteredIncidents = mockIncidents.filter(
    (incident) =>
      incident.incidentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.titleAr.includes(searchQuery) ||
      incident.titleEn.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const stats = {
    total: mockIncidents.length,
    open: mockIncidents.filter((i) => i.status === 'reported' || i.status === 'investigating').length,
    critical: mockIncidents.filter((i) => i.severity === 'critical').length,
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--foreground)] truncate">
            {t('incidents.title')}
          </h1>
          <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-[var(--foreground-secondary)]">
            {isAr ? 'تسجيل ومتابعة الحوادث والأحداث' : 'Record and track incidents and events'}
          </p>
        </div>
        <Button leftIcon={<Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />} onClick={() => setShowAddModal(true)} className="shrink-0 text-xs sm:text-sm">
          {t('incidents.addIncident')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-3">
        <Card className="p-2 sm:p-3 md:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-lg bg-[var(--primary-light)] shrink-0">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--primary)]" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--foreground)]">{stats.total}</p>
              <p className="text-[10px] sm:text-xs text-[var(--foreground-secondary)] truncate">
                {isAr ? 'إجمالي الحوادث' : 'Total Incidents'}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-2 sm:p-3 md:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-lg bg-[var(--status-warning)]/10 shrink-0">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--status-warning)]" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--foreground)]">{stats.open}</p>
              <p className="text-[10px] sm:text-xs text-[var(--foreground-secondary)] truncate">
                {isAr ? 'حوادث مفتوحة' : 'Open Incidents'}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-2 sm:p-3 md:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-lg bg-[var(--risk-critical-bg)] shrink-0">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--risk-critical)]" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--foreground)]">{stats.critical}</p>
              <p className="text-[10px] sm:text-xs text-[var(--foreground-secondary)] truncate">
                {t('incidents.severities.critical')}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-2 sm:p-3 md:p-4">
          <Input
            placeholder={isAr ? 'بحث في الحوادث...' : 'Search incidents...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4 sm:h-5 sm:w-5" />}
            className="text-xs sm:text-sm"
          />
        </CardContent>
      </Card>

      {/* Incidents Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--background-secondary)]">
                  <th className="p-2 sm:p-3 md:p-4 text-start text-[10px] sm:text-xs md:text-sm font-medium text-[var(--foreground-secondary)]">
                    {t('incidents.incidentId')}
                  </th>
                  <th className="p-2 sm:p-3 md:p-4 text-start text-[10px] sm:text-xs md:text-sm font-medium text-[var(--foreground-secondary)]">
                    {t('incidents.incidentTitle')}
                  </th>
                  <th className="p-2 sm:p-3 md:p-4 text-start text-[10px] sm:text-xs md:text-sm font-medium text-[var(--foreground-secondary)]">
                    {t('incidents.severity')}
                  </th>
                  <th className="p-2 sm:p-3 md:p-4 text-start text-[10px] sm:text-xs md:text-sm font-medium text-[var(--foreground-secondary)]">
                    {t('common.status')}
                  </th>
                  <th className="p-2 sm:p-3 md:p-4 text-start text-[10px] sm:text-xs md:text-sm font-medium text-[var(--foreground-secondary)] hidden md:table-cell">
                    {t('risks.department')}
                  </th>
                  <th className="p-2 sm:p-3 md:p-4 text-start text-[10px] sm:text-xs md:text-sm font-medium text-[var(--foreground-secondary)] hidden lg:table-cell">
                    {t('incidents.relatedRisk')}
                  </th>
                  <th className="p-2 sm:p-3 md:p-4 text-start text-[10px] sm:text-xs md:text-sm font-medium text-[var(--foreground-secondary)] hidden sm:table-cell">
                    {t('incidents.incidentDate')}
                  </th>
                  <th className="p-2 sm:p-3 md:p-4 text-center text-[10px] sm:text-xs md:text-sm font-medium text-[var(--foreground-secondary)]">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredIncidents.map((incident) => (
                  <tr
                    key={incident.id}
                    className="border-b border-[var(--border)] transition-colors hover:bg-[var(--background-secondary)]"
                  >
                    <td className="p-2 sm:p-3 md:p-4">
                      <code className="rounded bg-[var(--background-tertiary)] px-1 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs">
                        {incident.incidentNumber}
                      </code>
                    </td>
                    <td className="p-2 sm:p-3 md:p-4">
                      <p className="font-medium text-[var(--foreground)] text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">
                        {isAr ? incident.titleAr : incident.titleEn}
                      </p>
                      <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-[var(--foreground-muted)] truncate">
                        {isAr ? incident.reportedByAr : incident.reportedByEn}
                      </p>
                    </td>
                    <td className="p-2 sm:p-3 md:p-4">
                      <Badge variant={getSeverityColor(incident.severity)} className="text-[10px] sm:text-xs">
                        {t(`incidents.severities.${incident.severity}`)}
                      </Badge>
                    </td>
                    <td className="p-2 sm:p-3 md:p-4">
                      <Badge variant={getStatusColor(incident.status)} className="text-[10px] sm:text-xs">
                        {t(`incidents.statuses.${incident.status}`)}
                      </Badge>
                    </td>
                    <td className="p-2 sm:p-3 md:p-4 text-xs sm:text-sm text-[var(--foreground-secondary)] hidden md:table-cell">
                      {isAr ? incident.departmentAr : incident.departmentEn}
                    </td>
                    <td className="p-2 sm:p-3 md:p-4 hidden lg:table-cell">
                      {incident.relatedRisk ? (
                        <div className="flex items-center gap-1">
                          <Link className="h-3 w-3 text-[var(--primary)]" />
                          <code className="text-[10px] sm:text-xs text-[var(--primary)]">
                            {incident.relatedRisk}
                          </code>
                        </div>
                      ) : (
                        <span className="text-xs sm:text-sm text-[var(--foreground-muted)]">-</span>
                      )}
                    </td>
                    <td className="p-2 sm:p-3 md:p-4 text-xs sm:text-sm text-[var(--foreground-secondary)] hidden sm:table-cell">
                      {new Date(incident.incidentDate).toLocaleDateString(
                        isAr ? 'ar-SA' : 'en-US'
                      )}
                    </td>
                    <td className="p-2 sm:p-3 md:p-4">
                      <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                        <Button variant="ghost" size="icon-sm" className="h-6 w-6 sm:h-8 sm:w-8">
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" className="h-6 w-6 sm:h-8 sm:w-8">
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={t('incidents.addIncident')}
        size="lg"
      >
        <form className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label={isAr ? 'عنوان الحادثة (عربي)' : 'Incident Title (Arabic)'} required />
            <Input label={isAr ? 'عنوان الحادثة (إنجليزي)' : 'Incident Title (English)'} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label={t('incidents.severity')}
              options={[
                { value: 'critical', label: t('incidents.severities.critical') },
                { value: 'major', label: t('incidents.severities.major') },
                { value: 'moderate', label: t('incidents.severities.moderate') },
                { value: 'minor', label: t('incidents.severities.minor') },
              ]}
              placeholder={isAr ? 'اختر الشدة' : 'Select Severity'}
            />
            <Input
              type="date"
              label={t('incidents.incidentDate')}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
              {t('incidents.incidentDescription')}
            </label>
            <textarea
              className="flex min-h-24 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-20"
              placeholder={isAr ? 'أدخل وصف تفصيلي للحادثة...' : 'Enter detailed incident description...'}
            />
          </div>
        </form>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowAddModal(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={() => setShowAddModal(false)}>
            {t('common.save')}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
