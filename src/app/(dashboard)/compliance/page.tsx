'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/contexts/LanguageContext';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import {
  ShieldCheck,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Plus,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MinusCircle,
  HelpCircle,
  RefreshCw,
  Download,
  Link2,
  X,
} from 'lucide-react';

interface ComplianceDomain {
  id: string;
  nameAr: string;
  nameEn: string;
  code: string;
}

interface RegulatoryBody {
  id: string;
  nameAr: string;
  nameEn: string;
}

interface Obligation {
  id: string;
  code: string;
  sequenceNumber: number;
  titleAr: string;
  titleEn: string | null;
  subDomainAr: string | null;
  complianceStatus: string;
  criticalityLevel: string;
  completionPercentage: number;
  nextDueDate: string | null;
  recurrence: string;
  responsibleDepartmentAr: string | null;
  responsibleDepartmentEn: string | null;
  directOwnerAr: string | null;
  directOwnerEn: string | null;
  remediationStatus: string;
  domain: ComplianceDomain | null;
  regulatoryBody: RegulatoryBody | null;
  _count: { riskLinks: number; assessments: number };
}

export default function CompliancePage() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const isAr = language === 'ar';
  const { data: session } = useSession();
  const { isImpersonating, impersonatedUser } = useImpersonation();

  const effectiveRole = (isImpersonating && impersonatedUser?.role)
    ? impersonatedUser.role : session?.user?.role;
  const canCreate = effectiveRole && ['admin', 'riskManager'].includes(effectiveRole);

  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [domains, setDomains] = useState<ComplianceDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    domainId: '',
    status: '',
    criticality: '',
    recurrence: '',
    department: '',
  });

  const fetchObligations = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filters.domainId) params.set('domainId', filters.domainId);
      if (filters.status) params.set('status', filters.status);
      if (filters.criticality) params.set('criticality', filters.criticality);
      if (filters.recurrence) params.set('recurrence', filters.recurrence);
      if (filters.department) params.set('department', filters.department);

      const headers: Record<string, string> = {};
      if (isImpersonating && impersonatedUser?.id) {
        headers['X-Impersonate-User-Id'] = impersonatedUser.id;
      }

      const res = await fetch(`/api/compliance?${params.toString()}`, { headers });
      const data = await res.json();
      if (data.success) {
        setObligations(data.data);
        // استخراج المجالات الفريدة
        const uniqueDomains = new Map<string, ComplianceDomain>();
        data.data.forEach((o: Obligation) => {
          if (o.domain && !uniqueDomains.has(o.domain.id)) {
            uniqueDomains.set(o.domain.id, o.domain);
          }
        });
        if (uniqueDomains.size > 0) setDomains(Array.from(uniqueDomains.values()));
      }
    } catch (error) {
      console.error('Error fetching obligations:', error);
    } finally {
      setLoading(false);
    }
  }, [search, filters, isImpersonating, impersonatedUser]);

  // جلب المجالات
  useEffect(() => {
    fetchObligations();
  }, [fetchObligations]);

  const handleSeedData = async () => {
    if (seeding) return;
    setSeeding(true);
    try {
      const res = await fetch('/api/compliance/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(isAr ? `تم استيراد ${data.data.obligations} التزام بنجاح` : `Successfully imported ${data.data.obligations} obligations`);
        fetchObligations();
      } else {
        alert(data.error || 'Error');
      }
    } catch (error) {
      console.error('Error seeding:', error);
    } finally {
      setSeeding(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; color: string; icon: React.ElementType }> = {
      compliant: { label: t('compliance.compliant'), color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle2 },
      partiallyCompliant: { label: t('compliance.partiallyCompliant'), color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: MinusCircle },
      nonCompliant: { label: t('compliance.nonCompliant'), color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
      notAssessed: { label: t('compliance.notAssessed'), color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', icon: HelpCircle },
    };
    const c = config[status] || config.notAssessed;
    const Icon = c.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${c.color}`}>
        <Icon className="h-3 w-3" />
        {c.label}
      </span>
    );
  };

  const getCriticalityBadge = (level: string) => {
    const config: Record<string, { label: string; color: string }> = {
      critical: { label: t('compliance.critical'), color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
      high: { label: t('compliance.high'), color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
      medium: { label: t('compliance.medium'), color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
      low: { label: t('compliance.low'), color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    };
    const c = config[level] || config.medium;
    return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${c.color}`}>{c.label}</span>;
  };

  const clearFilters = () => {
    setFilters({ domainId: '', status: '', criticality: '', recurrence: '', department: '' });
    setSearch('');
  };

  const hasActiveFilters = Object.values(filters).some(Boolean) || search;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">{t('compliance.title')}</h1>
            <p className="text-sm text-[var(--foreground-secondary)]">
              {obligations.length} {t('compliance.obligations')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => router.push('/compliance/dashboard')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--background-tertiary)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors text-sm"
          >
            <BarChart3 className="h-4 w-4" />
            {t('compliance.dashboard')}
          </button>

          {canCreate && obligations.length === 0 && (
            <button
              onClick={handleSeedData}
              disabled={seeding}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors text-sm disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {seeding ? (isAr ? 'جاري الاستيراد...' : 'Importing...') : t('compliance.seedData')}
            </button>
          )}

          {canCreate && (
            <button
              onClick={() => {/* TODO: Add obligation modal */}}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors text-sm"
            >
              <Plus className="h-4 w-4" />
              {t('compliance.addObligation')}
            </button>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground-secondary)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isAr ? 'بحث بالكود أو العنوان أو المرجع...' : 'Search by code, title, or reference...'}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] py-2.5 ps-10 pe-4 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-secondary)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-colors ${
              showFilters || hasActiveFilters
                ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]'
                : 'border-[var(--border)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
            }`}
          >
            <Filter className="h-4 w-4" />
            {t('compliance.filters')}
            {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <X className="h-3 w-3" />
              {t('compliance.clearFilters')}
            </button>
          )}
        </div>

        {/* Filter dropdowns */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 bg-[var(--background-secondary)] rounded-xl border border-[var(--border)] animate-in slide-in-from-top-2">
            <select
              value={filters.domainId}
              onChange={(e) => setFilters(f => ({ ...f, domainId: e.target.value }))}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
            >
              <option value="">{isAr ? 'كل المجالات' : 'All Domains'}</option>
              {domains.map(d => (
                <option key={d.id} value={d.id}>{isAr ? d.nameAr : d.nameEn}</option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
            >
              <option value="">{isAr ? 'كل الحالات' : 'All Statuses'}</option>
              <option value="compliant">{t('compliance.compliant')}</option>
              <option value="partiallyCompliant">{t('compliance.partiallyCompliant')}</option>
              <option value="nonCompliant">{t('compliance.nonCompliant')}</option>
              <option value="notAssessed">{t('compliance.notAssessed')}</option>
            </select>
            <select
              value={filters.criticality}
              onChange={(e) => setFilters(f => ({ ...f, criticality: e.target.value }))}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
            >
              <option value="">{isAr ? 'كل المستويات' : 'All Levels'}</option>
              <option value="critical">{t('compliance.critical')}</option>
              <option value="high">{t('compliance.high')}</option>
              <option value="medium">{t('compliance.medium')}</option>
              <option value="low">{t('compliance.low')}</option>
            </select>
            <select
              value={filters.recurrence}
              onChange={(e) => setFilters(f => ({ ...f, recurrence: e.target.value }))}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
            >
              <option value="">{isAr ? 'كل الدوريات' : 'All Recurrences'}</option>
              <option value="annual">{t('compliance.annual')}</option>
              <option value="quarterly">{t('compliance.quarterly')}</option>
              <option value="monthly">{t('compliance.monthly')}</option>
              <option value="continuous">{t('compliance.continuous')}</option>
              <option value="perEvent">{t('compliance.perEvent')}</option>
              <option value="perMeeting">{t('compliance.perMeeting')}</option>
            </select>
            <input
              type="text"
              value={filters.department}
              onChange={(e) => setFilters(f => ({ ...f, department: e.target.value }))}
              placeholder={isAr ? 'الإدارة...' : 'Department...'}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
            />
          </div>
        )}
      </div>

      {/* Obligations Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-8 w-8 animate-spin text-[var(--primary)]" />
        </div>
      ) : obligations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <ShieldCheck className="h-16 w-16 text-[var(--foreground-secondary)] opacity-30" />
          <p className="text-lg text-[var(--foreground-secondary)]">{t('compliance.noObligations')}</p>
          {canCreate && (
            <button
              onClick={handleSeedData}
              disabled={seeding}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              <Download className="h-5 w-5" />
              {seeding ? (isAr ? 'جاري الاستيراد...' : 'Importing...') : t('compliance.seedData')}
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--background)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--background-secondary)]">
                <th className="px-4 py-3 text-start font-semibold text-[var(--foreground-secondary)]">{t('compliance.code')}</th>
                <th className="px-4 py-3 text-start font-semibold text-[var(--foreground-secondary)]">{t('compliance.domain')}</th>
                <th className="px-4 py-3 text-start font-semibold text-[var(--foreground-secondary)] min-w-[250px]">{t('compliance.obligationTitle')}</th>
                <th className="px-4 py-3 text-center font-semibold text-[var(--foreground-secondary)]">{t('compliance.complianceStatus')}</th>
                <th className="px-4 py-3 text-center font-semibold text-[var(--foreground-secondary)]">{t('compliance.criticalityLevel')}</th>
                <th className="px-4 py-3 text-center font-semibold text-[var(--foreground-secondary)]">{t('compliance.completionPercentage')}</th>
                <th className="px-4 py-3 text-center font-semibold text-[var(--foreground-secondary)]">{t('compliance.linkedRisks')}</th>
                <th className="px-4 py-3 text-center font-semibold text-[var(--foreground-secondary)]">{t('compliance.nextDueDate')}</th>
              </tr>
            </thead>
            <tbody>
              {obligations.map((obligation, index) => {
                const isOverdue = obligation.nextDueDate && new Date(obligation.nextDueDate) < new Date() && obligation.complianceStatus !== 'compliant';
                return (
                  <tr
                    key={obligation.id}
                    onClick={() => router.push(`/compliance/${obligation.id}`)}
                    className={`border-b border-[var(--border)] cursor-pointer transition-colors hover:bg-[var(--background-tertiary)] ${
                      isOverdue ? 'bg-red-50/50 dark:bg-red-900/10' : ''
                    }`}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-[var(--primary)]">{obligation.code}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="text-xs font-medium text-[var(--foreground)]">
                          {obligation.domain ? (isAr ? obligation.domain.nameAr : obligation.domain.nameEn) : '-'}
                        </span>
                        {obligation.subDomainAr && (
                          <p className="text-[10px] text-[var(--foreground-secondary)] mt-0.5">{obligation.subDomainAr}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-[var(--foreground)] line-clamp-2">
                        {isAr ? obligation.titleAr : (obligation.titleEn || obligation.titleAr)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getStatusBadge(obligation.complianceStatus)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getCriticalityBadge(obligation.criticalityLevel)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="w-16 h-2 bg-[var(--border)] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                            style={{ width: `${(obligation.completionPercentage || 0) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-[var(--foreground-secondary)]">
                          {Math.round((obligation.completionPercentage || 0) * 100)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {obligation._count.riskLinks > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          <Link2 className="h-3 w-3" />
                          {obligation._count.riskLinks}
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--foreground-secondary)]">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {obligation.nextDueDate ? (
                        <span className={`text-xs ${isOverdue ? 'text-red-500 font-semibold' : 'text-[var(--foreground-secondary)]'}`}>
                          {new Date(obligation.nextDueDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                          {isOverdue && <AlertTriangle className="h-3 w-3 inline ms-1" />}
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--foreground-secondary)]">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
