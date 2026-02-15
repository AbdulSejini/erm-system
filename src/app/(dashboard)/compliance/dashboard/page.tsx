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

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
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

      {/* Top Stats Cards */}
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
        />
        <StatCard
          label={t('compliance.partiallyCompliant')}
          value={stats.byStatus.partiallyCompliant}
          icon={<MinusCircle className="h-5 w-5" />}
          color="yellow"
        />
        <StatCard
          label={t('compliance.nonCompliant')}
          value={stats.byStatus.nonCompliant}
          icon={<XCircle className="h-5 w-5" />}
          color="red"
        />
        <StatCard
          label={t('compliance.notAssessed')}
          value={stats.byStatus.notAssessed}
          icon={<HelpCircle className="h-5 w-5" />}
          color="gray"
        />
        <StatCard
          label={t('compliance.overdue')}
          value={stats.overdue}
          icon={<AlertTriangle className="h-5 w-5" />}
          color="red"
        />
      </div>

      {/* Compliance Rate + Criticality */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Compliance Rate */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-6">
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[var(--primary)]" />
            {t('compliance.complianceRate')}
          </h3>
          <div className="flex items-center justify-center">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border)" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke={complianceRate >= 70 ? '#22c55e' : complianceRate >= 40 ? '#eab308' : '#ef4444'}
                  strokeWidth="8"
                  strokeDasharray={`${complianceRate * 2.51} ${251 - complianceRate * 2.51}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-[var(--foreground)]">{complianceRate}%</span>
                <span className="text-xs text-[var(--foreground-secondary)]">{t('compliance.complianceRate')}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <StatusBar label={t('compliance.compliant')} count={stats.byStatus.compliant} total={stats.total} color="bg-green-500" />
            <StatusBar label={t('compliance.partiallyCompliant')} count={stats.byStatus.partiallyCompliant} total={stats.total} color="bg-yellow-500" />
            <StatusBar label={t('compliance.nonCompliant')} count={stats.byStatus.nonCompliant} total={stats.total} color="bg-red-500" />
            <StatusBar label={t('compliance.notAssessed')} count={stats.byStatus.notAssessed} total={stats.total} color="bg-gray-400" />
          </div>
        </div>

        {/* Criticality Distribution */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-6">
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <Target className="h-4 w-4 text-[var(--primary)]" />
            {t('compliance.byCriticality')}
          </h3>
          <div className="space-y-4">
            <CriticalityBar label={t('compliance.critical')} count={stats.byCriticality.critical} total={stats.total} color="bg-red-500" />
            <CriticalityBar label={t('compliance.high')} count={stats.byCriticality.high} total={stats.total} color="bg-orange-500" />
            <CriticalityBar label={t('compliance.medium')} count={stats.byCriticality.medium} total={stats.total} color="bg-yellow-500" />
            <CriticalityBar label={t('compliance.low')} count={stats.byCriticality.low} total={stats.total} color="bg-green-500" />
          </div>

          {/* Remediation Progress */}
          <div className="mt-6 pt-4 border-t border-[var(--border)]">
            <h4 className="text-xs font-semibold text-[var(--foreground-secondary)] mb-3 flex items-center gap-2">
              <Wrench className="h-3 w-3" />
              {t('compliance.remediationProgress')}
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-2 rounded-lg bg-[var(--background-tertiary)]">
                <p className="text-lg font-bold text-red-500">{stats.remediation.notStarted}</p>
                <p className="text-[10px] text-[var(--foreground-secondary)]">{t('compliance.notStarted')}</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-[var(--background-tertiary)]">
                <p className="text-lg font-bold text-yellow-500">{stats.remediation.inProgress}</p>
                <p className="text-[10px] text-[var(--foreground-secondary)]">{t('compliance.inProgress')}</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-[var(--background-tertiary)]">
                <p className="text-lg font-bold text-green-500">{stats.remediation.completed}</p>
                <p className="text-[10px] text-[var(--foreground-secondary)]">{t('compliance.completed')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* By Domain */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-6">
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-[var(--primary)]" />
          {t('compliance.byDomain')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {stats.byDomain.filter(d => d.count > 0).map(domain => (
            <div key={domain.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--background-tertiary)] hover:bg-[var(--border)] transition-colors cursor-pointer">
              <span className="text-sm text-[var(--foreground)] truncate flex-1">
                {isAr ? domain.nameAr : domain.nameEn}
              </span>
              <span className="ms-2 px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                {domain.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Due */}
      {stats.upcomingDue.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-6">
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[var(--primary)]" />
            {t('compliance.upcomingDue')} ({isAr ? 'خلال 30 يوم' : 'Next 30 days'})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-3 py-2 text-start text-xs font-semibold text-[var(--foreground-secondary)]">{t('compliance.code')}</th>
                  <th className="px-3 py-2 text-start text-xs font-semibold text-[var(--foreground-secondary)]">{t('compliance.obligationTitle')}</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--foreground-secondary)]">{t('compliance.complianceStatus')}</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--foreground-secondary)]">{t('compliance.nextDueDate')}</th>
                </tr>
              </thead>
              <tbody>
                {stats.upcomingDue.map(item => (
                  <tr
                    key={item.id}
                    onClick={() => router.push(`/compliance/${item.id}`)}
                    className="border-b border-[var(--border)] hover:bg-[var(--background-tertiary)] cursor-pointer"
                  >
                    <td className="px-3 py-2">
                      <span className="font-mono text-xs font-bold text-[var(--primary)]">{item.code}</span>
                    </td>
                    <td className="px-3 py-2 text-sm text-[var(--foreground)]">
                      {isAr ? item.titleAr : (item.titleEn || item.titleAr)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        item.complianceStatus === 'compliant' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        item.complianceStatus === 'partiallyCompliant' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        item.complianceStatus === 'nonCompliant' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {t(`compliance.${item.complianceStatus}` as 'compliance.compliant')}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center text-xs text-[var(--foreground-secondary)]">
                      {new Date(item.nextDueDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  const colorMap: Record<string, string> = {
    indigo: 'from-indigo-500 to-indigo-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    red: 'from-red-500 to-red-600',
    gray: 'from-gray-400 to-gray-500',
  };

  return (
    <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background)]">
      <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${colorMap[color] || colorMap.indigo} text-white mb-2`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-[var(--foreground)]">{value}</p>
      <p className="text-xs text-[var(--foreground-secondary)]">{label}</p>
    </div>
  );
}

function StatusBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[var(--foreground-secondary)] w-28 truncate">{label}</span>
      <div className="flex-1 h-2 bg-[var(--border)] rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-[var(--foreground)] w-12 text-end">{count} ({pct}%)</span>
    </div>
  );
}

function CriticalityBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-[var(--foreground)]">{label}</span>
        <span className="text-sm font-bold text-[var(--foreground)]">{count}</span>
      </div>
      <div className="h-3 bg-[var(--border)] rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

