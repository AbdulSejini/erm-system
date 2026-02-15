'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/contexts/LanguageContext';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  MinusCircle,
  HelpCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  TrendingUp,
  RefreshCw,
  Calendar,
  Wrench,
  Target,
  Building2,
  Clock,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Filter,
} from 'lucide-react';

interface StatsData {
  total: number;
  byStatus: {
    compliant: number;
    partiallyCompliant: number;
    nonCompliant: number;
    notAssessed: number;
  };
  byCriticality: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  byDomain: Array<{
    id: string;
    nameAr: string;
    nameEn: string;
    code: string;
    count: number;
  }>;
  byRegulatoryBody: Array<{
    id: string;
    nameAr: string;
    nameEn: string;
    count: number;
  }>;
  overdue: number;
  upcomingDue: Array<{
    id: string;
    code: string;
    titleAr: string;
    titleEn: string | null;
    nextDueDate: string;
    complianceStatus: string;
    criticalityLevel: string;
    domain: { nameAr: string; nameEn: string } | null;
  }>;
  remediation: {
    notStarted: number;
    inProgress: number;
    completed: number;
  };
  avgCompletion: number;
}

export default function ComplianceDashboardPage() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const isAr = language === 'ar';
  const { data: session } = useSession();
  const { isImpersonating, impersonatedUser } = useImpersonation();

  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const headers: Record<string, string> = {};
        if (isImpersonating && impersonatedUser?.id) {
          headers['X-Impersonate-User-Id'] = impersonatedUser.id;
        }
        const res = await fetch('/api/compliance/stats', { headers });
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [isImpersonating, impersonatedUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <RefreshCw className="h-10 w-10 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (!stats) return null;

  const complianceRate = stats.total > 0
    ? Math.round((stats.byStatus.compliant / stats.total) * 100)
    : 0;

  const statusData = [
    { key: 'compliant', count: stats.byStatus.compliant, color: '#22c55e', label: t('compliance.compliant') },
    { key: 'partiallyCompliant', count: stats.byStatus.partiallyCompliant, color: '#eab308', label: t('compliance.partiallyCompliant') },
    { key: 'nonCompliant', count: stats.byStatus.nonCompliant, color: '#ef4444', label: t('compliance.nonCompliant') },
    { key: 'notAssessed', count: stats.byStatus.notAssessed, color: '#9ca3af', label: t('compliance.notAssessed') },
  ];

  const maxDomainCount = Math.max(...stats.byDomain.map(d => d.count), 1);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/compliance')}
            className="p-2 rounded-xl hover:bg-[var(--background-tertiary)] transition-colors"
          >
            {isAr ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
          </button>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">{t('compliance.dashboard')}</h1>
            <p className="text-sm text-[var(--foreground-secondary)]">
              {stats.total} {t('compliance.obligations')}
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push('/compliance')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
        >
          <Filter className="h-4 w-4" />
          {isAr ? 'عرض السجل' : 'View Register'}
        </button>
      </div>

      {/* Top Stats Bar - Horizontal colored strip */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 overflow-hidden">
        <div className="flex items-center gap-4 mb-3">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            {t('compliance.byStatus')}
          </h3>
          <span className="text-xs text-[var(--foreground-secondary)]">
            {stats.total} {isAr ? 'إجمالي' : 'total'}
          </span>
        </div>
        {/* Stacked bar */}
        <div className="h-8 rounded-full overflow-hidden flex">
          {statusData.map(s => {
            const pct = stats.total > 0 ? (s.count / stats.total) * 100 : 0;
            if (pct === 0) return null;
            return (
              <div
                key={s.key}
                className="h-full transition-all duration-700 first:rounded-s-full last:rounded-e-full relative group"
                style={{ width: `${pct}%`, backgroundColor: s.color }}
                title={`${s.label}: ${s.count} (${Math.round(pct)}%)`}
              >
                {pct > 8 && (
                  <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                    {Math.round(pct)}%
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-3">
          {statusData.map(s => (
            <div key={s.key} className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-xs text-[var(--foreground-secondary)]">{s.label}</span>
              <span className="text-xs font-bold text-[var(--foreground)]">{s.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Stats Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          label={t('compliance.totalObligations')}
          value={stats.total}
          icon={<ShieldCheck className="h-5 w-5" />}
          color="indigo"
        />
        <StatCard
          label={t('compliance.compliant')}
          value={stats.byStatus.compliant}
          icon={<CheckCircle2 className="h-5 w-5" />}
          color="green"
          pct={stats.total > 0 ? Math.round((stats.byStatus.compliant / stats.total) * 100) : 0}
        />
        <StatCard
          label={t('compliance.partiallyCompliant')}
          value={stats.byStatus.partiallyCompliant}
          icon={<MinusCircle className="h-5 w-5" />}
          color="yellow"
          pct={stats.total > 0 ? Math.round((stats.byStatus.partiallyCompliant / stats.total) * 100) : 0}
        />
        <StatCard
          label={t('compliance.nonCompliant')}
          value={stats.byStatus.nonCompliant}
          icon={<XCircle className="h-5 w-5" />}
          color="red"
          pct={stats.total > 0 ? Math.round((stats.byStatus.nonCompliant / stats.total) * 100) : 0}
        />
        <StatCard
          label={t('compliance.notAssessed')}
          value={stats.byStatus.notAssessed}
          icon={<HelpCircle className="h-5 w-5" />}
          color="gray"
          pct={stats.total > 0 ? Math.round((stats.byStatus.notAssessed / stats.total) * 100) : 0}
        />
        <StatCard
          label={t('compliance.overdue')}
          value={stats.overdue}
          icon={<AlertTriangle className="h-5 w-5" />}
          color="red"
          pulse={stats.overdue > 0}
        />
      </div>

      {/* Two Column: Donut Chart + Domain Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Rate Donut */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-6">
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-6 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[var(--primary)]" />
            {t('compliance.complianceRate')}
          </h3>
          <div className="flex items-center gap-8">
            {/* Donut Chart */}
            <div className="relative w-44 h-44 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="38" fill="none" stroke="var(--border)" strokeWidth="10" />
                {/* Segments */}
                {(() => {
                  let offset = 0;
                  const circumference = 2 * Math.PI * 38;
                  return statusData.map(s => {
                    const pct = stats.total > 0 ? (s.count / stats.total) : 0;
                    const segmentLength = pct * circumference;
                    const dashArray = `${segmentLength} ${circumference - segmentLength}`;
                    const dashOffset = -offset;
                    offset += segmentLength;
                    if (pct === 0) return null;
                    return (
                      <circle
                        key={s.key}
                        cx="50" cy="50" r="38" fill="none"
                        stroke={s.color}
                        strokeWidth="10"
                        strokeDasharray={dashArray}
                        strokeDashoffset={dashOffset}
                        className="transition-all duration-1000"
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-[var(--foreground)]">{complianceRate}%</span>
                <span className="text-[10px] text-[var(--foreground-secondary)]">{t('compliance.complianceRate')}</span>
              </div>
            </div>

            {/* Status bars */}
            <div className="flex-1 space-y-3">
              {statusData.map(s => {
                const pct = stats.total > 0 ? Math.round((s.count / stats.total) * 100) : 0;
                return (
                  <div key={s.key} className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="text-xs text-[var(--foreground-secondary)] w-24 truncate">{s.label}</span>
                    <div className="flex-1 h-2.5 bg-[var(--border)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: s.color }}
                      />
                    </div>
                    <span className="text-xs font-bold text-[var(--foreground)] w-16 text-end">{s.count} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Domain Distribution - Horizontal bar chart */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-6">
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-6 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[var(--primary)]" />
            {t('compliance.byDomain')}
          </h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-thin">
            {stats.byDomain
              .filter(d => d.count > 0)
              .sort((a, b) => b.count - a.count)
              .map(domain => {
                const pct = (domain.count / maxDomainCount) * 100;
                return (
                  <div key={domain.id} className="group">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[var(--foreground)] truncate flex-1">
                        {isAr ? domain.nameAr : domain.nameEn}
                      </span>
                      <span className="text-xs font-bold text-[var(--primary)] ms-2">{domain.count}</span>
                    </div>
                    <div className="h-3 bg-[var(--border)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Two Column: Criticality + Remediation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Criticality Distribution */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-6">
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-6 flex items-center gap-2">
            <Target className="h-4 w-4 text-[var(--primary)]" />
            {t('compliance.byCriticality')}
          </h3>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { key: 'critical', color: '#ef4444', bg: 'bg-red-50 dark:bg-red-950/20' },
              { key: 'high', color: '#f97316', bg: 'bg-orange-50 dark:bg-orange-950/20' },
              { key: 'medium', color: '#eab308', bg: 'bg-yellow-50 dark:bg-yellow-950/20' },
              { key: 'low', color: '#22c55e', bg: 'bg-green-50 dark:bg-green-950/20' },
            ].map(c => (
              <div key={c.key} className={`text-center p-3 rounded-xl ${c.bg}`}>
                <p className="text-2xl font-bold" style={{ color: c.color }}>
                  {stats.byCriticality[c.key as keyof typeof stats.byCriticality]}
                </p>
                <p className="text-[10px] text-[var(--foreground-secondary)] mt-1">
                  {t(`compliance.${c.key}` as 'compliance.critical')}
                </p>
              </div>
            ))}
          </div>

          {/* Visual bars */}
          <div className="space-y-3">
            {[
              { key: 'critical', label: t('compliance.critical'), color: '#ef4444', count: stats.byCriticality.critical },
              { key: 'high', label: t('compliance.high'), color: '#f97316', count: stats.byCriticality.high },
              { key: 'medium', label: t('compliance.medium'), color: '#eab308', count: stats.byCriticality.medium },
              { key: 'low', label: t('compliance.low'), color: '#22c55e', count: stats.byCriticality.low },
            ].map(c => {
              const pct = stats.total > 0 ? Math.round((c.count / stats.total) * 100) : 0;
              return (
                <div key={c.key} className="flex items-center gap-3">
                  <span className="text-xs text-[var(--foreground-secondary)] w-16">{c.label}</span>
                  <div className="flex-1 h-2.5 bg-[var(--border)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: c.color }}
                    />
                  </div>
                  <span className="text-xs font-medium text-[var(--foreground)] w-12 text-end">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Remediation Progress + Avg Completion */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-6">
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-6 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-[var(--primary)]" />
            {t('compliance.remediationProgress')}
          </h3>

          {/* Average Completion Gauge */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-28 h-28">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="38" fill="none" stroke="var(--border)" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="38" fill="none"
                  stroke={stats.avgCompletion >= 0.7 ? '#22c55e' : stats.avgCompletion >= 0.4 ? '#eab308' : '#ef4444'}
                  strokeWidth="8"
                  strokeDasharray={`${stats.avgCompletion * 238.76} ${238.76 - stats.avgCompletion * 238.76}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-[var(--foreground)]">{Math.round(stats.avgCompletion * 100)}%</span>
                <span className="text-[8px] text-[var(--foreground-secondary)]">{t('compliance.avgCompletion')}</span>
              </div>
            </div>
          </div>

          {/* Remediation Cards */}
          <div className="grid grid-cols-3 gap-3">
            <RemediationCard
              label={t('compliance.notStarted')}
              count={stats.remediation.notStarted}
              color="red"
              icon={<Clock className="h-4 w-4" />}
            />
            <RemediationCard
              label={t('compliance.inProgress')}
              count={stats.remediation.inProgress}
              color="yellow"
              icon={<RefreshCw className="h-4 w-4" />}
            />
            <RemediationCard
              label={t('compliance.completed')}
              count={stats.remediation.completed}
              color="green"
              icon={<CheckCircle2 className="h-4 w-4" />}
            />
          </div>
        </div>
      </div>

      {/* Regulatory Body Distribution */}
      {stats.byRegulatoryBody.filter(rb => rb.count > 0).length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-6">
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[var(--primary)]" />
            {t('compliance.byRegulatoryBody')}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {stats.byRegulatoryBody
              .filter(rb => rb.count > 0)
              .sort((a, b) => b.count - a.count)
              .map(rb => (
                <div key={rb.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--background-tertiary)] border border-[var(--border)] hover:border-[var(--primary)] transition-all">
                  <span className="text-xs text-[var(--foreground)] truncate flex-1">
                    {isAr ? rb.nameAr : rb.nameEn}
                  </span>
                  <span className="ms-2 px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                    {rb.count}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Upcoming Due Table */}
      {stats.upcomingDue.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--background-secondary)]">
            <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[var(--primary)]" />
              {t('compliance.upcomingDue')}
              <span className="text-xs text-[var(--foreground-secondary)] font-normal">
                ({isAr ? 'خلال 30 يوم' : 'Next 30 days'})
              </span>
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-bold">
              {stats.upcomingDue.length}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--background-tertiary)]">
                  <th className="px-4 py-3 text-start text-xs font-semibold text-[var(--foreground-secondary)]">{t('compliance.code')}</th>
                  <th className="px-4 py-3 text-start text-xs font-semibold text-[var(--foreground-secondary)]">{t('compliance.obligationTitle')}</th>
                  <th className="px-4 py-3 text-start text-xs font-semibold text-[var(--foreground-secondary)]">{t('compliance.domain')}</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-[var(--foreground-secondary)]">{t('compliance.criticalityLevel')}</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-[var(--foreground-secondary)]">{t('compliance.complianceStatus')}</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-[var(--foreground-secondary)]">{t('compliance.nextDueDate')}</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {stats.upcomingDue.map(item => {
                  const daysLeft = Math.ceil((new Date(item.nextDueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  return (
                    <tr
                      key={item.id}
                      onClick={() => router.push(`/compliance/${item.id}`)}
                      className="border-b border-[var(--border)] hover:bg-[var(--background-tertiary)] cursor-pointer transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-bold text-[var(--primary)]">{item.code}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[var(--foreground)] line-clamp-1">
                          {isAr ? item.titleAr : (item.titleEn || item.titleAr)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-[var(--foreground-secondary)]">
                          {item.domain ? (isAr ? item.domain.nameAr : item.domain.nameEn) : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <CriticalityBadge level={item.criticalityLevel} t={t} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={item.complianceStatus} t={t} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-xs text-[var(--foreground)]">
                            {new Date(item.nextDueDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          <span className={`text-[10px] font-medium ${daysLeft <= 7 ? 'text-red-500' : daysLeft <= 14 ? 'text-orange-500' : 'text-[var(--foreground-secondary)]'}`}>
                            {daysLeft <= 0
                              ? (isAr ? 'متأخر!' : 'Overdue!')
                              : (isAr ? `${daysLeft} يوم` : `${daysLeft}d left`)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {isAr
                          ? <ChevronLeft className="h-4 w-4 text-[var(--foreground-secondary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                          : <ChevronRight className="h-4 w-4 text-[var(--foreground-secondary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Helper Components ---

function StatCard({ label, value, icon, color, pct, pulse }: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  pct?: number;
  pulse?: boolean;
}) {
  const colorMap: Record<string, { gradient: string; bg: string; text: string }> = {
    indigo: { gradient: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/20', text: 'text-indigo-600 dark:text-indigo-400' },
    green: { gradient: 'from-green-500 to-green-600', bg: 'bg-green-50 dark:bg-green-950/20', text: 'text-green-600 dark:text-green-400' },
    yellow: { gradient: 'from-yellow-500 to-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950/20', text: 'text-yellow-600 dark:text-yellow-400' },
    red: { gradient: 'from-red-500 to-red-600', bg: 'bg-red-50 dark:bg-red-950/20', text: 'text-red-600 dark:text-red-400' },
    gray: { gradient: 'from-gray-400 to-gray-500', bg: 'bg-gray-50 dark:bg-gray-800/20', text: 'text-gray-500 dark:text-gray-400' },
  };
  const c = colorMap[color] || colorMap.indigo;

  return (
    <div className={`p-4 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:shadow-md transition-all ${pulse ? 'animate-pulse' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${c.gradient} text-white`}>
          {icon}
        </div>
        {pct !== undefined && (
          <span className={`text-xs font-medium ${c.text}`}>{pct}%</span>
        )}
      </div>
      <p className="text-2xl font-bold text-[var(--foreground)]">{value}</p>
      <p className="text-xs text-[var(--foreground-secondary)] mt-0.5">{label}</p>
    </div>
  );
}

function RemediationCard({ label, count, color, icon }: {
  label: string;
  count: number;
  color: string;
  icon: React.ReactNode;
}) {
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    red: { bg: 'bg-red-50 dark:bg-red-950/20', text: 'text-red-600 dark:text-red-400', border: 'border-red-200 dark:border-red-900/30' },
    yellow: { bg: 'bg-yellow-50 dark:bg-yellow-950/20', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-900/30' },
    green: { bg: 'bg-green-50 dark:bg-green-950/20', text: 'text-green-600 dark:text-green-400', border: 'border-green-200 dark:border-green-900/30' },
  };
  const c = colorMap[color] || colorMap.red;

  return (
    <div className={`text-center p-3 rounded-xl border ${c.border} ${c.bg}`}>
      <div className={`inline-flex p-1.5 rounded-lg ${c.bg} ${c.text} mb-1`}>{icon}</div>
      <p className={`text-xl font-bold ${c.text}`}>{count}</p>
      <p className="text-[10px] text-[var(--foreground-secondary)]">{label}</p>
    </div>
  );
}

function StatusBadge({ status, t }: { status: string; t: (key: string) => string }) {
  const config: Record<string, string> = {
    compliant: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    partiallyCompliant: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    nonCompliant: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    notAssessed: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${config[status] || config.notAssessed}`}>
      {t(`compliance.${status}`)}
    </span>
  );
}

function CriticalityBadge({ level, t }: { level: string; t: (key: string) => string }) {
  const config: Record<string, string> = {
    critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${config[level] || config.medium}`}>
      {t(`compliance.${level}`)}
    </span>
  );
}
