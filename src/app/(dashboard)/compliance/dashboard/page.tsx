'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/contexts/LanguageContext';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import {
  ShieldCheck, CheckCircle2, XCircle, MinusCircle, HelpCircle,
  AlertTriangle, ArrowLeft, ArrowRight, BarChart3, TrendingUp,
  RefreshCw, Calendar, Wrench, Target, Building2, Clock,
  ChevronRight, ChevronLeft, Layers, Activity, Zap, Award,
  AlertCircle, BookOpen, Filter, TrendingDown, Percent,
} from 'lucide-react';

/* ─────────────────────────── DOMAIN COLORS ─────────────────────────── */
const DOMAIN_COLORS: Record<string, string> = {
  BOD: '#6366f1', AUC: '#8b5cf6', NRC: '#a855f7', RMC: '#d946ef',
  DIS: '#ec4899', ETH: '#f43f5e', ITR: '#ef4444', WBI: '#f97316',
  SHA: '#f59e0b', TAX: '#eab308', LAB: '#84cc16', SAU: '#22c55e',
  GOSI: '#10b981', HSE: '#14b8a6', IND: '#06b6d4', ENV: '#0ea5e9',
  LIC: '#3b82f6', OPS: '#6366f1', QUA: '#8b5cf6', CYB: '#a21caf',
  DPR: '#7c3aed', AML: '#dc2626', FIN: '#0891b2', SCM: '#059669',
  GOV: '#4f46e5', ERM: '#7c3aed', DOC: '#0284c7', CUS: '#0d9488',
  LEG: '#1d4ed8', IPR: '#9333ea', GEN: '#64748b',
};
function getDomainColor(code: string) { return DOMAIN_COLORS[code] || '#6366f1'; }

/* ─────────────────────────── TYPES ─────────────────────────── */
interface StatsData {
  total: number;
  byStatus: { compliant: number; partiallyCompliant: number; nonCompliant: number; notAssessed: number };
  byCriticality: { critical: number; high: number; medium: number; low: number };
  byDomain: Array<{ id: string; nameAr: string; nameEn: string; code: string; count: number }>;
  byRegulatoryBody: Array<{ id: string; nameAr: string; nameEn: string; count: number }>;
  overdue: number;
  upcomingDue: Array<{
    id: string; code: string; titleAr: string; titleEn: string | null;
    nextDueDate: string; complianceStatus: string; criticalityLevel: string;
    domain: { nameAr: string; nameEn: string } | null;
  }>;
  remediation: { notStarted: number; inProgress: number; completed: number };
  avgCompletion: number;
}

/* ─────────────────────────── ANIMATED COUNTER ─────────────────────────── */
function AnimatedCounter({ target, duration = 1200 }: { target: number; duration?: number }) {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);
  useEffect(() => {
    startRef.current = null;
    const animate = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    const id = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(id);
  }, [target, duration]);
  return <>{value}</>;
}

/* ─────────────────────────── MAIN PAGE ─────────────────────────── */
export default function ComplianceDashboardPage() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const isAr = language === 'ar';
  const { data: session } = useSession();
  const { isImpersonating, impersonatedUser } = useImpersonation();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'domains' | 'bodies' | 'upcoming'>('overview');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const headers: Record<string, string> = {};
        if (isImpersonating && impersonatedUser?.id) {
          headers['X-Impersonate-User-Id'] = impersonatedUser.id;
        }
        const res = await fetch('/api/compliance/stats', { headers });
        const data = await res.json();
        if (data.success) setStats(data.data);
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
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-indigo-200 dark:border-indigo-900/40" />
          <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
        </div>
        <p className="text-sm text-[var(--foreground-secondary)] animate-pulse">
          {isAr ? 'جاري تحميل لوحة الامتثال...' : 'Loading compliance dashboard...'}
        </p>
      </div>
    );
  }

  if (!stats) return null;

  const complianceRate = stats.total > 0 ? Math.round((stats.byStatus.compliant / stats.total) * 100) : 0;
  const partialRate = stats.total > 0 ? Math.round((stats.byStatus.partiallyCompliant / stats.total) * 100) : 0;
  const nonCompliantRate = stats.total > 0 ? Math.round((stats.byStatus.nonCompliant / stats.total) * 100) : 0;
  const notAssessedRate = stats.total > 0 ? Math.round((stats.byStatus.notAssessed / stats.total) * 100) : 0;

  const statusSegments = [
    { key: 'compliant', count: stats.byStatus.compliant, pct: complianceRate, color: '#22c55e', label: t('compliance.compliant') },
    { key: 'partiallyCompliant', count: stats.byStatus.partiallyCompliant, pct: partialRate, color: '#eab308', label: t('compliance.partiallyCompliant') },
    { key: 'nonCompliant', count: stats.byStatus.nonCompliant, pct: nonCompliantRate, color: '#ef4444', label: t('compliance.nonCompliant') },
    { key: 'notAssessed', count: stats.byStatus.notAssessed, pct: notAssessedRate, color: '#9ca3af', label: t('compliance.notAssessed') },
  ];

  const maxDomainCount = Math.max(...stats.byDomain.map(d => d.count), 1);
  const topDomains = [...stats.byDomain].filter(d => d.count > 0).sort((a, b) => b.count - a.count).slice(0, 12);
  const topBodies = [...stats.byRegulatoryBody].filter(rb => rb.count > 0).sort((a, b) => b.count - a.count).slice(0, 12);

  /* gauge arc  (semicircle: -90° to +90°) */
  const gaugeAngle = (complianceRate / 100) * 180 - 90; // -90 = left, +90 = right
  const gaugeColor = complianceRate >= 70 ? '#22c55e' : complianceRate >= 40 ? '#eab308' : '#ef4444';

  const tabs = [
    { id: 'overview' as const, label: isAr ? 'نظرة عامة' : 'Overview', icon: Activity },
    { id: 'domains' as const, label: isAr ? 'المجالات' : 'Domains', icon: Layers },
    { id: 'bodies' as const, label: isAr ? 'الجهات' : 'Regulators', icon: Building2 },
    { id: 'upcoming' as const, label: isAr ? 'المواعيد' : 'Upcoming', icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] pb-12">

      {/* ══════════════════ HERO HEADER ══════════════════ */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 px-6 py-10">
        {/* dot pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        {/* decorative circles */}
        <div className="absolute -top-20 -end-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-10 -start-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

        <div className="relative max-w-[1600px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/compliance')}
                className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors text-white"
              >
                {isAr ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
              </button>
              <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/30">
                <BarChart3 className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-white">
                  {isAr ? 'لوحة متابعة الامتثال' : 'Compliance Dashboard'}
                </h1>
                <p className="text-white/70 text-sm mt-0.5">
                  {stats.total} {t('compliance.obligations')} &mdash; {isAr ? 'سجل الامتثال الرئيسي' : 'Master Compliance Register'}
                </p>
              </div>
            </div>
            {/* Quick actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/compliance')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 text-white text-sm font-medium transition-all"
              >
                <BookOpen className="h-4 w-4" />
                {isAr ? 'السجل الرئيسي' : 'View Register'}
              </button>
            </div>
          </div>

          {/* ── Hero mini-stat strip ── */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: isAr ? 'إجمالي' : 'Total', value: stats.total, icon: ShieldCheck, color: 'text-white' },
              { label: t('compliance.compliant'), value: stats.byStatus.compliant, icon: CheckCircle2, color: 'text-green-300' },
              { label: t('compliance.partiallyCompliant'), value: stats.byStatus.partiallyCompliant, icon: MinusCircle, color: 'text-yellow-300' },
              { label: t('compliance.nonCompliant'), value: stats.byStatus.nonCompliant, icon: XCircle, color: 'text-red-300' },
              { label: t('compliance.notAssessed'), value: stats.byStatus.notAssessed, icon: HelpCircle, color: 'text-gray-300' },
              { label: isAr ? 'متأخر' : 'Overdue', value: stats.overdue, icon: AlertTriangle, color: 'text-orange-300' },
              { label: isAr ? 'اكتمال متوسط' : 'Avg Completion', value: `${Math.round(stats.avgCompletion * 100)}%`, icon: Percent, color: 'text-blue-200', raw: true },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 text-center hover:bg-white/20 transition-all">
                  <Icon className={`h-4 w-4 mx-auto mb-1 ${s.color}`} />
                  <div className="text-xl font-extrabold text-white">
                    {(s as { raw?: boolean }).raw ? s.value : <AnimatedCounter target={Number(s.value)} />}
                  </div>
                  <div className="text-[10px] text-white/60 truncate">{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ══════════════════ TAB NAV ══════════════════ */}
      <div className="sticky top-0 z-20 bg-[var(--background)] border-b border-[var(--border)] shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 flex items-center gap-1 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                  active
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ══════════════════ CONTENT ══════════════════ */}
      <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">

        {/* ════ OVERVIEW TAB ════ */}
        {activeTab === 'overview' && (
          <>
            {/* Row 1: Big gauge + status donut + stacked bars */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* ── Compliance Rate Gauge ── */}
              <div className="lg:col-span-1 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 flex flex-col items-center justify-center shadow-sm">
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-indigo-500" />
                  {isAr ? 'معدل الامتثال العام' : 'Overall Compliance Rate'}
                </h3>
                {/* Gauge SVG */}
                <div className="relative w-52 h-28 mb-4">
                  <svg viewBox="0 0 200 110" className="w-full h-full">
                    {/* Background arc */}
                    <path
                      d="M 20 100 A 80 80 0 0 1 180 100"
                      fill="none" stroke="var(--border)" strokeWidth="16" strokeLinecap="round"
                    />
                    {/* Colored arc */}
                    <path
                      d="M 20 100 A 80 80 0 0 1 180 100"
                      fill="none"
                      stroke={gaugeColor}
                      strokeWidth="16"
                      strokeLinecap="round"
                      strokeDasharray={`${(complianceRate / 100) * 251.3} 251.3`}
                      className="transition-all duration-1000"
                    />
                    {/* Needle */}
                    <g transform={`rotate(${gaugeAngle}, 100, 100)`}>
                      <line x1="100" y1="100" x2="100" y2="28" stroke={gaugeColor} strokeWidth="3" strokeLinecap="round" />
                      <circle cx="100" cy="100" r="6" fill={gaugeColor} />
                    </g>
                    {/* Tick marks */}
                    {[0, 25, 50, 75, 100].map(pct => {
                      const angle = (pct / 100) * 180 - 90;
                      const rad = (angle * Math.PI) / 180;
                      const x1 = 100 + 65 * Math.cos(rad);
                      const y1 = 100 + 65 * Math.sin(rad);
                      const x2 = 100 + 75 * Math.cos(rad);
                      const y2 = 100 + 75 * Math.sin(rad);
                      return <line key={pct} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--border)" strokeWidth="2" />;
                    })}
                  </svg>
                  {/* Center value */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
                    <div className="text-4xl font-black" style={{ color: gaugeColor }}>
                      <AnimatedCounter target={complianceRate} />%
                    </div>
                    <div className="text-[10px] text-[var(--foreground-secondary)] mt-0.5">
                      {isAr ? 'ملتزم بالكامل' : 'Fully Compliant'}
                    </div>
                  </div>
                </div>
                {/* Gauge labels */}
                <div className="flex items-center justify-between w-full text-[10px] text-[var(--foreground-secondary)] px-4">
                  <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                </div>
                {/* Rating badge */}
                <div className="mt-4">
                  {complianceRate >= 80 ? (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30">
                      <Award className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-bold text-green-700 dark:text-green-400">
                        {isAr ? 'ممتاز' : 'Excellent'}
                      </span>
                    </div>
                  ) : complianceRate >= 60 ? (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/30">
                      <Activity className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-bold text-yellow-700 dark:text-yellow-400">
                        {isAr ? 'جيد' : 'Good'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-bold text-red-700 dark:text-red-400">
                        {isAr ? 'يحتاج تحسين' : 'Needs Improvement'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Status Donut + Legend ── */}
              <div className="lg:col-span-1 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-purple-500" />
                  {t('compliance.byStatus')}
                </h3>
                <div className="flex items-center gap-6">
                  {/* Donut */}
                  <div className="relative w-36 h-36 shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="38" fill="none" stroke="var(--border)" strokeWidth="10" />
                      {(() => {
                        let offset = 0;
                        const circ = 2 * Math.PI * 38;
                        return statusSegments.map(s => {
                          const pct = stats.total > 0 ? s.count / stats.total : 0;
                          const len = pct * circ;
                          const da = `${len} ${circ - len}`;
                          const el = (
                            <circle key={s.key} cx="50" cy="50" r="38" fill="none"
                              stroke={s.color} strokeWidth="10"
                              strokeDasharray={da} strokeDashoffset={-offset}
                              className="transition-all duration-1000"
                            />
                          );
                          offset += len;
                          return el;
                        });
                      })()}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-[var(--foreground)]">{stats.total}</span>
                      <span className="text-[9px] text-[var(--foreground-secondary)]">{isAr ? 'إجمالي' : 'Total'}</span>
                    </div>
                  </div>
                  {/* Legend bars */}
                  <div className="flex-1 space-y-3">
                    {statusSegments.map(s => (
                      <div key={s.key}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[var(--foreground-secondary)] flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: s.color }} />
                            {s.label}
                          </span>
                          <span className="font-bold text-[var(--foreground)]">{s.count}</span>
                        </div>
                        <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${s.pct}%`, backgroundColor: s.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stacked bar */}
                <div className="mt-5">
                  <div className="flex rounded-full overflow-hidden h-6">
                    {statusSegments.map(s => {
                      const pct = stats.total > 0 ? (s.count / stats.total) * 100 : 0;
                      if (pct === 0) return null;
                      return (
                        <div
                          key={s.key}
                          className="relative group h-full transition-all duration-700 first:rounded-s-full last:rounded-e-full"
                          style={{ width: `${pct}%`, backgroundColor: s.color }}
                          title={`${s.label}: ${s.count} (${Math.round(pct)}%)`}
                        >
                          {pct > 10 && (
                            <span className="absolute inset-0 flex items-center justify-center text-white text-[9px] font-bold">
                              {Math.round(pct)}%
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ── Criticality heat grid ── */}
              <div className="lg:col-span-1 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                  <Target className="h-4 w-4 text-orange-500" />
                  {t('compliance.byCriticality')}
                </h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { key: 'critical', color: '#ef4444', bg: 'from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20', border: 'border-red-200 dark:border-red-900/30', label: t('compliance.critical') },
                    { key: 'high', color: '#f97316', bg: 'from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20', border: 'border-orange-200 dark:border-orange-900/30', label: t('compliance.high') },
                    { key: 'medium', color: '#eab308', bg: 'from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-900/30', label: t('compliance.medium') },
                    { key: 'low', color: '#22c55e', bg: 'from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20', border: 'border-green-200 dark:border-green-900/30', label: t('compliance.low') },
                  ].map(c => {
                    const count = stats.byCriticality[c.key as keyof typeof stats.byCriticality];
                    const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                    return (
                      <div key={c.key} className={`relative overflow-hidden rounded-xl border ${c.border} bg-gradient-to-br ${c.bg} p-4`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-3xl font-black" style={{ color: c.color }}>
                              <AnimatedCounter target={count} />
                            </p>
                            <p className="text-xs text-[var(--foreground-secondary)] mt-0.5">{c.label}</p>
                          </div>
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-white/60 dark:bg-black/20" style={{ color: c.color }}>
                            {pct}%
                          </span>
                        </div>
                        {/* mini bar */}
                        <div className="mt-2 h-1 bg-white/40 dark:bg-black/20 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: c.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Remediation mini-section */}
                <div className="border-t border-[var(--border)] pt-4">
                  <p className="text-xs font-semibold text-[var(--foreground-secondary)] mb-3 flex items-center gap-1.5">
                    <Wrench className="h-3 w-3" />
                    {t('compliance.remediationProgress')}
                  </p>
                  <div className="space-y-2">
                    {[
                      { key: 'notStarted', count: stats.remediation.notStarted, color: '#ef4444', label: t('compliance.notStarted') },
                      { key: 'inProgress', count: stats.remediation.inProgress, color: '#f59e0b', label: t('compliance.inProgress') },
                      { key: 'completed', count: stats.remediation.completed, color: '#22c55e', label: t('compliance.completed') },
                    ].map(r => {
                      const total = stats.remediation.notStarted + stats.remediation.inProgress + stats.remediation.completed;
                      const pct = total > 0 ? Math.round((r.count / total) * 100) : 0;
                      return (
                        <div key={r.key} className="flex items-center gap-2">
                          <span className="text-[10px] text-[var(--foreground-secondary)] w-20 truncate">{r.label}</span>
                          <div className="flex-1 h-2 bg-[var(--border)] rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: r.color }} />
                          </div>
                          <span className="text-[10px] font-bold text-[var(--foreground)] w-6 text-end">{r.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Alert cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: isAr ? 'ملتزم بالكامل' : 'Fully Compliant',
                  value: stats.byStatus.compliant, pct: complianceRate,
                  icon: CheckCircle2, from: 'from-emerald-500', to: 'to-green-600',
                  ring: 'ring-green-200 dark:ring-green-900/30',
                },
                {
                  label: isAr ? 'امتثال جزئي' : 'Partial Compliance',
                  value: stats.byStatus.partiallyCompliant, pct: partialRate,
                  icon: MinusCircle, from: 'from-amber-500', to: 'to-yellow-600',
                  ring: 'ring-yellow-200 dark:ring-yellow-900/30',
                },
                {
                  label: isAr ? 'غير ملتزم' : 'Non-Compliant',
                  value: stats.byStatus.nonCompliant, pct: nonCompliantRate,
                  icon: XCircle, from: 'from-rose-500', to: 'to-red-600',
                  ring: 'ring-red-200 dark:ring-red-900/30',
                },
                {
                  label: isAr ? 'الالتزامات المتأخرة' : 'Overdue Obligations',
                  value: stats.overdue, pct: stats.total > 0 ? Math.round((stats.overdue / stats.total) * 100) : 0,
                  icon: AlertTriangle, from: 'from-orange-500', to: 'to-amber-600',
                  ring: 'ring-orange-200 dark:ring-orange-900/30',
                },
              ].map((card, i) => {
                const Icon = card.icon;
                return (
                  <div key={i} className={`rounded-2xl border ring-2 ${card.ring} bg-[var(--background)] p-5 shadow-sm hover:shadow-md transition-all`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.from} ${card.to} shadow-lg`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-xs font-bold text-[var(--foreground-secondary)] bg-[var(--background-tertiary)] px-2 py-1 rounded-lg">
                        {card.pct}%
                      </span>
                    </div>
                    <p className="text-3xl font-black text-[var(--foreground)]">
                      <AnimatedCounter target={card.value} />
                    </p>
                    <p className="text-xs text-[var(--foreground-secondary)] mt-1">{card.label}</p>
                    {/* bar */}
                    <div className="mt-3 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${card.from} ${card.to} transition-all duration-700`}
                        style={{ width: `${card.pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ════ DOMAINS TAB ════ */}
        {activeTab === 'domains' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--foreground)]">
                {isAr ? 'توزيع الالتزامات حسب المجال' : 'Obligation Distribution by Domain'}
              </h2>
              <span className="text-sm text-[var(--foreground-secondary)]">
                {topDomains.length} {isAr ? 'مجال' : 'domains'}
              </span>
            </div>

            {/* Domain grid cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...stats.byDomain].filter(d => d.count > 0).sort((a, b) => b.count - a.count).map(domain => {
                const color = getDomainColor(domain.code);
                const pct = Math.round((domain.count / maxDomainCount) * 100);
                const percentage = stats.total > 0 ? Math.round((domain.count / stats.total) * 100) : 0;
                return (
                  <div
                    key={domain.id}
                    className="group rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4 hover:shadow-lg transition-all cursor-pointer hover:scale-[1.01]"
                    style={{ borderTop: `3px solid ${color}` }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Code badge */}
                      <div
                        className="h-10 w-10 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0 shadow-sm"
                        style={{ backgroundColor: color }}
                      >
                        {domain.code.slice(0, 3)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-[var(--foreground)] truncate">
                          {isAr ? domain.nameAr : domain.nameEn}
                        </h3>
                        <p className="text-xs text-[var(--foreground-secondary)] mt-0.5">
                          {isAr ? domain.nameEn : domain.nameAr}
                        </p>
                      </div>
                    </div>
                    {/* Count + bar */}
                    <div className="mt-3 flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-[var(--foreground)]">{domain.count} {isAr ? 'التزام' : 'obligations'}</span>
                      <span className="text-[var(--foreground-secondary)]">{percentage}% {isAr ? 'من الإجمالي' : 'of total'}</span>
                    </div>
                    <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 group-hover:opacity-80"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ════ REGULATORS TAB ════ */}
        {activeTab === 'bodies' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-[var(--foreground)]">
              {isAr ? 'توزيع الالتزامات حسب الجهة التنظيمية' : 'Obligations by Regulatory Body'}
            </h2>

            {/* Bubble-style grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {topBodies.map((rb, i) => {
                const colors = [
                  { bg: 'from-indigo-500 to-purple-600', ring: 'ring-indigo-200 dark:ring-indigo-900/30' },
                  { bg: 'from-blue-500 to-cyan-600', ring: 'ring-blue-200 dark:ring-blue-900/30' },
                  { bg: 'from-violet-500 to-purple-600', ring: 'ring-violet-200 dark:ring-violet-900/30' },
                  { bg: 'from-fuchsia-500 to-pink-600', ring: 'ring-fuchsia-200 dark:ring-fuchsia-900/30' },
                  { bg: 'from-sky-500 to-blue-600', ring: 'ring-sky-200 dark:ring-sky-900/30' },
                  { bg: 'from-teal-500 to-emerald-600', ring: 'ring-teal-200 dark:ring-teal-900/30' },
                ];
                const c = colors[i % colors.length];
                const pct = stats.total > 0 ? Math.round((rb.count / stats.total) * 100) : 0;
                return (
                  <div key={rb.id} className={`rounded-2xl border ring-2 ${c.ring} bg-[var(--background)] p-4 text-center hover:shadow-lg transition-all hover:scale-[1.02]`}>
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${c.bg} flex items-center justify-center mx-auto mb-3 shadow-md`}>
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <p className="text-2xl font-black text-[var(--foreground)]">
                      <AnimatedCounter target={rb.count} />
                    </p>
                    <p className="text-xs text-[var(--foreground-secondary)] mt-0.5 line-clamp-2">
                      {isAr ? rb.nameAr : rb.nameEn}
                    </p>
                    <span className={`mt-2 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${c.bg} text-white`}>
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bar chart */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-5 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-indigo-500" />
                {isAr ? 'مقارنة الجهات التنظيمية' : 'Regulatory Body Comparison'}
              </h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {topBodies.map((rb, i) => {
                  const maxCount = Math.max(...topBodies.map(b => b.count), 1);
                  const pct = (rb.count / maxCount) * 100;
                  const gradients = [
                    'from-indigo-500 to-purple-500',
                    'from-blue-500 to-cyan-500',
                    'from-violet-500 to-fuchsia-500',
                    'from-teal-500 to-emerald-500',
                    'from-sky-500 to-blue-500',
                    'from-pink-500 to-rose-500',
                  ];
                  return (
                    <div key={rb.id} className="flex items-center gap-3 group">
                      <span className="text-xs font-bold text-[var(--foreground-secondary)] w-5 text-center">{i + 1}</span>
                      <span className="text-sm text-[var(--foreground)] w-32 truncate">
                        {isAr ? rb.nameAr : rb.nameEn}
                      </span>
                      <div className="flex-1 h-6 bg-[var(--border)] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${gradients[i % gradients.length]} transition-all duration-700 flex items-center px-2`}
                          style={{ width: `${Math.max(pct, 5)}%` }}
                        >
                          {pct > 20 && (
                            <span className="text-white text-[10px] font-bold">{rb.count}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-bold text-[var(--foreground)] w-8 text-end">{rb.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ════ UPCOMING TAB ════ */}
        {activeTab === 'upcoming' && (
          <div className="space-y-6">
            {/* Alert banner */}
            {stats.overdue > 0 && (
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30">
                <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-red-700 dark:text-red-400">
                    {isAr ? `${stats.overdue} التزام متأخر!` : `${stats.overdue} Overdue Obligations!`}
                  </p>
                  <p className="text-xs text-red-600/70 dark:text-red-400/70">
                    {isAr ? 'هذه الالتزامات تجاوزت تاريخ الاستحقاق وتحتاج إجراء فوري' : 'These obligations have passed their due date and require immediate action'}
                  </p>
                </div>
              </div>
            )}

            {/* Upcoming table */}
            {stats.upcomingDue.length > 0 ? (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
                  <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-amber-500" />
                    {t('compliance.upcomingDue')}
                    <span className="text-xs text-[var(--foreground-secondary)] font-normal">
                      ({isAr ? 'خلال 30 يوم' : 'Next 30 days'})
                    </span>
                  </h3>
                  <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold">
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
                        const isUrgent = daysLeft <= 7;
                        const isSoon = daysLeft <= 14;
                        return (
                          <tr
                            key={item.id}
                            onClick={() => router.push(`/compliance/${item.id}`)}
                            className={`border-b border-[var(--border)] hover:bg-[var(--background-tertiary)] cursor-pointer transition-colors group ${isUrgent ? 'bg-red-50/50 dark:bg-red-950/10' : ''}`}
                          >
                            <td className="px-4 py-3">
                              <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{item.code}</span>
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
                              <CritBadge level={item.criticalityLevel} />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <StatusBadge status={item.complianceStatus} />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="text-xs text-[var(--foreground)]">
                                  {new Date(item.nextDueDate).toLocaleDateString(isAr ? 'ar-SA-u-ca-gregory' : 'en-US', { month: 'short', day: 'numeric' })}
                                </span>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  daysLeft <= 0
                                    ? 'bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400'
                                    : isUrgent
                                    ? 'bg-orange-100 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400'
                                    : isSoon
                                    ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-950/30 dark:text-yellow-400'
                                    : 'bg-[var(--background-tertiary)] text-[var(--foreground-secondary)]'
                                }`}>
                                  {daysLeft <= 0
                                    ? (isAr ? 'متأخر!' : 'Overdue!')
                                    : (isAr ? `${daysLeft} يوم` : `${daysLeft}d left`)}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {isAr
                                ? <ChevronLeft className="h-4 w-4 text-[var(--foreground-secondary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                                : <ChevronRight className="h-4 w-4 text-[var(--foreground-secondary)] opacity-0 group-hover:opacity-100 transition-opacity" />}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 rounded-2xl border border-dashed border-[var(--border)]">
                <Calendar className="h-12 w-12 mx-auto text-[var(--foreground-secondary)] opacity-30 mb-3" />
                <p className="text-[var(--foreground-secondary)]">
                  {isAr ? 'لا توجد التزامات مستحقة خلال الـ 30 يوم القادمة' : 'No obligations due in the next 30 days'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────── BADGE HELPERS ─────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    compliant: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    partiallyCompliant: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    nonCompliant: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    notAssessed: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  };
  const labels: Record<string, string> = {
    compliant: 'ملتزم', partiallyCompliant: 'جزئي', nonCompliant: 'غير ملتزم', notAssessed: 'لم يُقيَّم',
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg[status] || cfg.notAssessed}`}>
      {labels[status] || status}
    </span>
  );
}

function CritBadge({ level }: { level: string }) {
  const cfg: Record<string, string> = {
    critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  };
  const labels: Record<string, string> = { critical: 'حرج', high: 'عالي', medium: 'متوسط', low: 'منخفض' };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg[level] || cfg.medium}`}>
      {labels[level] || level}
    </span>
  );
}
