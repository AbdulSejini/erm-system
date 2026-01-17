'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import {
  FileBarChart,
  Download,
  Printer,
  Calendar,
  BarChart3,
  PieChart,
  TrendingUp,
  Table,
  FileText,
} from 'lucide-react';

const reportTypes = [
  {
    id: 'riskRegister',
    icon: Table,
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    id: 'riskMatrix',
    icon: BarChart3,
    color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  },
  {
    id: 'treatmentStatus',
    icon: TrendingUp,
    color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  },
  {
    id: 'incidentSummary',
    icon: FileText,
    color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  },
  {
    id: 'departmentRisks',
    icon: PieChart,
    color: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
  },
  {
    id: 'trendAnalysis',
    icon: TrendingUp,
    color: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
  },
];

const recentReports = [
  {
    id: '1',
    nameAr: 'تقرير سجل المخاطر - يناير 2026',
    nameEn: 'Risk Register Report - January 2026',
    type: 'riskRegister',
    generatedAt: '2026-01-15T10:30:00',
    generatedByAr: 'أحمد محمد',
    generatedByEn: 'Ahmed Mohammed',
    format: 'PDF',
  },
  {
    id: '2',
    nameAr: 'تقرير مصفوفة المخاطر',
    nameEn: 'Risk Matrix Report',
    type: 'riskMatrix',
    generatedAt: '2026-01-14T14:45:00',
    generatedByAr: 'سارة علي',
    generatedByEn: 'Sarah Ali',
    format: 'Excel',
  },
  {
    id: '3',
    nameAr: 'ملخص الحوادث - Q4 2025',
    nameEn: 'Incident Summary - Q4 2025',
    type: 'incidentSummary',
    generatedAt: '2026-01-10T09:15:00',
    generatedByAr: 'خالد أحمد',
    generatedByEn: 'Khalid Ahmed',
    format: 'PDF',
  },
];

export default function ReportsPage() {
  const { t, language } = useTranslation();
  const isAr = language === 'ar';
  const [selectedReport, setSelectedReport] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');

  const departmentOptions = [
    { value: '', label: isAr ? 'جميع الإدارات' : 'All Departments' },
    { value: 'it', label: isAr ? 'تقنية المعلومات' : 'IT' },
    { value: 'finance', label: isAr ? 'المالية' : 'Finance' },
    { value: 'operations', label: isAr ? 'العمليات' : 'Operations' },
    { value: 'supply', label: isAr ? 'سلسلة التوريد' : 'Supply Chain' },
    { value: 'hse', label: isAr ? 'السلامة والبيئة' : 'HSE' },
  ];

  const handleGenerateReport = () => {
    alert(isAr ? 'جاري إنشاء التقرير...' : 'Generating report...');
  };

  const handleExportPDF = () => {
    alert(isAr ? 'جاري تصدير التقرير كـ PDF...' : 'Exporting report as PDF...');
  };

  const handleExportExcel = () => {
    alert(isAr ? 'جاري تصدير التقرير كـ Excel...' : 'Exporting report as Excel...');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadReport = (report: typeof recentReports[0]) => {
    alert(isAr ? `جاري تحميل: ${report.nameAr}` : `Downloading: ${report.nameEn}`);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="min-w-0">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--foreground)] truncate">
          {t('reports.title')}
        </h1>
        <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-[var(--foreground-secondary)]">
          {isAr ? 'إنشاء وتصدير تقارير إدارة المخاطر' : 'Generate and export risk management reports'}
        </p>
      </div>

      {/* Report Types Grid */}
      <div>
        <h2 className="mb-2 sm:mb-3 md:mb-4 text-sm sm:text-base md:text-lg font-semibold text-[var(--foreground)]">
          {t('reports.reportType')}
        </h2>
        <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-2 lg:grid-cols-3">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            const isSelected = selectedReport === report.id;
            return (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report.id)}
                className={`flex items-start gap-2 sm:gap-3 md:gap-4 rounded-lg sm:rounded-xl border-2 p-2 sm:p-3 md:p-4 text-start transition-all ${
                  isSelected
                    ? 'border-[var(--primary)] bg-[var(--primary-light)]'
                    : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--border-hover)]'
                }`}
              >
                <div className={`rounded-lg p-1.5 sm:p-2 shrink-0 ${report.color}`}>
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-medium text-[var(--foreground)] text-xs sm:text-sm md:text-base truncate">
                    {t(`reports.types.${report.id}`)}
                  </h3>
                  <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs md:text-sm text-[var(--foreground-secondary)]">
                    {isAr
                      ? 'انقر للاختيار'
                      : 'Click to select'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Report Parameters */}
      {selectedReport && (
        <Card>
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="text-sm sm:text-base md:text-lg">{isAr ? 'معايير التقرير' : 'Report Parameters'}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
            <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1 sm:mb-1.5 block text-xs sm:text-sm font-medium text-[var(--foreground)]">
                  {isAr ? 'من تاريخ' : 'From Date'}
                </label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="text-xs sm:text-sm"
                />
              </div>
              <div>
                <label className="mb-1 sm:mb-1.5 block text-xs sm:text-sm font-medium text-[var(--foreground)]">
                  {isAr ? 'إلى تاريخ' : 'To Date'}
                </label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="text-xs sm:text-sm"
                />
              </div>
              <Select
                label={t('reports.selectDepartment')}
                options={departmentOptions}
                value={selectedDepartment}
                onChange={setSelectedDepartment}
              />
              <div className="flex items-end gap-2 col-span-2 lg:col-span-1">
                <Button
                  className="flex-1 text-xs sm:text-sm"
                  leftIcon={<FileBarChart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                  onClick={handleGenerateReport}
                >
                  {t('reports.generateReport')}
                </Button>
              </div>
            </div>

            {/* Export Options */}
            <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-2 sm:gap-4 border-t border-[var(--border)] pt-3 sm:pt-4">
              <span className="text-xs sm:text-sm text-[var(--foreground-secondary)]">
                {isAr ? 'تصدير كـ:' : 'Export as:'}
              </span>
              <div className="flex gap-1.5 sm:gap-2">
                <Button variant="outline" size="sm" leftIcon={<FileText className="h-3 w-3 sm:h-4 sm:w-4" />} className="text-xs sm:text-sm px-2 sm:px-3" onClick={handleExportPDF}>
                  PDF
                </Button>
                <Button variant="outline" size="sm" leftIcon={<Table className="h-3 w-3 sm:h-4 sm:w-4" />} className="text-xs sm:text-sm px-2 sm:px-3" onClick={handleExportExcel}>
                  Excel
                </Button>
                <Button variant="outline" size="sm" leftIcon={<Printer className="h-3 w-3 sm:h-4 sm:w-4" />} className="text-xs sm:text-sm px-2 sm:px-3" onClick={handlePrint}>
                  {t('common.print')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Reports */}
      <Card>
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="text-sm sm:text-base md:text-lg">{isAr ? 'التقارير الأخيرة' : 'Recent Reports'}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--background-secondary)]">
                  <th className="p-2 sm:p-3 md:p-4 text-start text-[10px] sm:text-xs md:text-sm font-medium text-[var(--foreground-secondary)]">
                    {isAr ? 'اسم التقرير' : 'Report Name'}
                  </th>
                  <th className="p-2 sm:p-3 md:p-4 text-start text-[10px] sm:text-xs md:text-sm font-medium text-[var(--foreground-secondary)] hidden sm:table-cell">
                    {t('reports.reportType')}
                  </th>
                  <th className="p-2 sm:p-3 md:p-4 text-start text-[10px] sm:text-xs md:text-sm font-medium text-[var(--foreground-secondary)]">
                    {isAr ? 'الصيغة' : 'Format'}
                  </th>
                  <th className="p-2 sm:p-3 md:p-4 text-start text-[10px] sm:text-xs md:text-sm font-medium text-[var(--foreground-secondary)] hidden md:table-cell">
                    {isAr ? 'أنشئ بواسطة' : 'Generated By'}
                  </th>
                  <th className="p-2 sm:p-3 md:p-4 text-start text-[10px] sm:text-xs md:text-sm font-medium text-[var(--foreground-secondary)] hidden sm:table-cell">
                    {t('common.date')}
                  </th>
                  <th className="p-2 sm:p-3 md:p-4 text-center text-[10px] sm:text-xs md:text-sm font-medium text-[var(--foreground-secondary)]">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentReports.map((report) => (
                  <tr
                    key={report.id}
                    className="border-b border-[var(--border)] transition-colors hover:bg-[var(--background-secondary)]"
                  >
                    <td className="p-2 sm:p-3 md:p-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-lg bg-[var(--background-secondary)] shrink-0">
                          <FileBarChart className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--primary)]" />
                        </div>
                        <span className="font-medium text-[var(--foreground)] text-xs sm:text-sm truncate max-w-[100px] sm:max-w-none">
                          {isAr ? report.nameAr : report.nameEn}
                        </span>
                      </div>
                    </td>
                    <td className="p-2 sm:p-3 md:p-4 text-xs sm:text-sm text-[var(--foreground-secondary)] hidden sm:table-cell">
                      {t(`reports.types.${report.type}`)}
                    </td>
                    <td className="p-2 sm:p-3 md:p-4">
                      <span className="rounded bg-[var(--background-tertiary)] px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium">
                        {report.format}
                      </span>
                    </td>
                    <td className="p-2 sm:p-3 md:p-4 text-xs sm:text-sm text-[var(--foreground-secondary)] hidden md:table-cell">
                      {isAr ? report.generatedByAr : report.generatedByEn}
                    </td>
                    <td className="p-2 sm:p-3 md:p-4 text-xs sm:text-sm text-[var(--foreground-secondary)] hidden sm:table-cell">
                      {new Date(report.generatedAt).toLocaleDateString(
                        isAr ? 'ar-SA' : 'en-US'
                      )}
                    </td>
                    <td className="p-2 sm:p-3 md:p-4">
                      <div className="flex items-center justify-center">
                        <Button variant="ghost" size="sm" leftIcon={<Download className="h-3 w-3 sm:h-4 sm:w-4" />} className="text-[10px] sm:text-xs px-1.5 sm:px-2" onClick={() => handleDownloadReport(report)}>
                          {isAr ? 'تحميل' : 'Download'}
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
    </div>
  );
}
