'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/contexts/LanguageContext';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import {
  ShieldCheck, Search, Filter, Plus, BarChart3, AlertTriangle,
  CheckCircle2, XCircle, MinusCircle, HelpCircle, RefreshCw,
  Download, Link2, X, ChevronDown, ChevronRight, Building2,
  Scale, Flame, AlertCircle, TrendingUp, Eye, Grid3X3, List,
  Layers, Calendar, Users, FileText, Activity,
} from 'lucide-react';

// ---- Types ----
interface ComplianceDomain {
  id: string;
  nameAr: string;
  nameEn: string;
  code: string;
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
  directOwnerAr: string | null;
  remediationStatus: string;
  domain: ComplianceDomain | null;
  regulatoryBody: { id: string; nameAr: string; nameEn: string } | null;
  _count: { riskLinks: number; assessments: number };
}

type ViewMode = 'domains' | 'table' | 'cards';

// ---- Status helpers ----
const STATUS_CONFIG = {
  compliant:          { labelAr: 'ملتزم',         labelEn: 'Compliant',           color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2,  ring: '#10b981' },
  partiallyCompliant: { labelAr: 'ملتزم جزئياً',  labelEn: 'Partial',             color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-900/20',     badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',     icon: MinusCircle,   ring: '#f59e0b' },
  nonCompliant:       { labelAr: 'غير ملتزم',      labelEn: 'Non-Compliant',       color: 'text-red-600',     bg: 'bg-red-50 dark:bg-red-900/20',         badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',           icon: XCircle,       ring: '#ef4444' },
  notAssessed:        { labelAr: 'غير مُقيَّم',    labelEn: 'Not Assessed',        color: 'text-slate-500',   bg: 'bg-slate-50 dark:bg-slate-800/20',     badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',      icon: HelpCircle,    ring: '#94a3b8' },
};

const CRIT_CONFIG = {
  critical: { labelAr: 'حرج',     labelEn: 'Critical', badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',         dot: 'bg-red-500' },
  high:     { labelAr: 'مرتفع',   labelEn: 'High',     badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', dot: 'bg-orange-500' },
  medium:   { labelAr: 'متوسط',   labelEn: 'Medium',   badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', dot: 'bg-yellow-500' },
  low:      { labelAr: 'منخفض',   labelEn: 'Low',      badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',    dot: 'bg-green-500' },
};

// ---- Domain color map ----
const DOMAIN_COLORS: Record<string, string> = {
  BOD:'#6366f1', AUC:'#8b5cf6', NRC:'#a855f7', RMC:'#d946ef', DIS:'#ec4899',
  ETH:'#f43f5e', ITR:'#ef4444', WBI:'#f97316', SHA:'#f59e0b', TAX:'#eab308',
  LAB:'#84cc16', SAU:'#22c55e', GOSI:'#10b981', HSE:'#14b8a6', IND:'#06b6d4',
  ENV:'#0ea5e9', LIC:'#3b82f6', OPS:'#2563eb', QUA:'#1d4ed8', CYB:'#4f46e5',
  DPR:'#7c3aed', AML:'#be185d', FIN:'#9f1239', SCM:'#78716c', GOV:'#57534e',
  ERM:'#44403c', DOC:'#a8a29e', CUS:'#737373', LEG:'#525252', IPR:'#404040',
  GEN:'#6b7280',
};

function getDomainColor(code: string): string {
  return DOMAIN_COLORS[code] || '#6b7280';
}

// ---- Mini progress ring ----
function ProgressRing({ pct, size = 36, color }: { pct: number; size?: number; color: string }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" strokeWidth={3} className="text-[var(--border)]" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={3}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
    </svg>
  );
}

// ---- Domain summary card ----
function DomainCard({
  domain, obligations, isAr, onExpand, expanded,
}: {
  domain: ComplianceDomain;
  obligations: Obligation[];
  isAr: boolean;
  onExpand: () => void;
  expanded: boolean;
}) {
  const color = getDomainColor(domain.code);
  const total = obligations.length;
  const compliant = obligations.filter(o => o.complianceStatus === 'compliant').length;
  const partial = obligations.filter(o => o.complianceStatus === 'partiallyCompliant').length;
  const nonCompliant = obligations.filter(o => o.complianceStatus === 'nonCompliant').length;
  const notAssessed = total - compliant - partial - nonCompliant;
  const pct = total > 0 ? Math.round((compliant / total) * 100) : 0;
  const avgCompletion = total > 0 ? Math.round(obligations.reduce((s, o) => s + (o.completionPercentage || 0) * 100, 0) / total) : 0;
  const critical = obligations.filter(o => o.criticalityLevel === 'critical').length;
  const overdue = obligations.filter(o => o.nextDueDate && new Date(o.nextDueDate) < new Date() && o.complianceStatus !== 'compliant').length;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] overflow-hidden shadow-sm hover:shadow-md transition-all">
      {/* Header bar */}
      <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }} />

      <div className="p-5">
        {/* Domain title + stats */}
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm"
            style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)` }}>
            {domain.code.slice(0, 3)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-[var(--foreground)] text-sm leading-tight">
                  {isAr ? domain.nameAr : domain.nameEn}
                </h3>
                <p className="text-[10px] text-[var(--foreground-secondary)] mt-0.5">{total} {isAr ? 'التزام' : 'obligations'}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <ProgressRing pct={pct} color={color} />
                <span className="text-sm font-bold" style={{ color }}>{pct}%</span>
              </div>
            </div>

            {/* Status pills */}
            <div className="flex flex-wrap gap-1 mt-3">
              {compliant > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" /> {compliant}
                </span>
              )}
              {partial > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                  <MinusCircle className="h-3 w-3" /> {partial}
                </span>
              )}
              {nonCompliant > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                  <XCircle className="h-3 w-3" /> {nonCompliant}
                </span>
              )}
              {notAssessed > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  <HelpCircle className="h-3 w-3" /> {notAssessed}
                </span>
              )}
            </div>

            {/* Footer row */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border)]">
              <div className="flex items-center gap-3">
                {critical > 0 && (
                  <span className="flex items-center gap-1 text-[11px] text-red-500">
                    <Flame className="h-3 w-3" /> {critical}
                  </span>
                )}
                {overdue > 0 && (
                  <span className="flex items-center gap-1 text-[11px] text-orange-500">
                    <AlertTriangle className="h-3 w-3" /> {overdue}
                  </span>
                )}
                <span className="text-[11px] text-[var(--foreground-secondary)]">
                  {avgCompletion}% {isAr ? 'إنجاز' : 'done'}
                </span>
              </div>
              <button
                onClick={onExpand}
                className="flex items-center gap-1 text-[11px] font-medium transition-colors"
                style={{ color }}
              >
                {isAr ? 'عرض' : 'View'}
                {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded obligation list */}
      {expanded && (
        <div className="border-t border-[var(--border)] bg-[var(--background-secondary)]">
          <div className="divide-y divide-[var(--border)] max-h-72 overflow-y-auto">
            {obligations.map(ob => {
              const sc = STATUS_CONFIG[ob.complianceStatus as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.notAssessed;
              const Icon = sc.icon;
              const isOverdue = ob.nextDueDate && new Date(ob.nextDueDate) < new Date() && ob.complianceStatus !== 'compliant';
              return (
                <ObligationRow key={ob.id} ob={ob} isAr={isAr} Icon={Icon} sc={sc} isOverdue={!!isOverdue} />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ObligationRow({ ob, isAr, Icon, sc, isOverdue }: {
  ob: Obligation; isAr: boolean;
  Icon: React.ElementType;
  sc: typeof STATUS_CONFIG['compliant'];
  isOverdue: boolean;
}) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(`/compliance/${ob.id}`)}
      className="w-full flex items-center gap-3 px-4 py-3 text-start hover:bg-[var(--background-tertiary)] transition-colors group"
    >
      <Icon className={`h-4 w-4 flex-shrink-0 ${sc.color}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-bold text-[var(--primary)] flex-shrink-0">{ob.code}</span>
          {ob.criticalityLevel === 'critical' && <Flame className="h-3 w-3 text-red-500 flex-shrink-0" />}
          {isOverdue && <AlertTriangle className="h-3 w-3 text-orange-500 flex-shrink-0" />}
        </div>
        <p className="text-xs text-[var(--foreground)] line-clamp-1 mt-0.5">
          {isAr ? ob.titleAr : (ob.titleEn || ob.titleAr)}
        </p>
        {ob.subDomainAr && (
          <p className="text-[10px] text-[var(--foreground-secondary)]">{ob.subDomainAr}</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-10 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-current transition-all" style={{ width: `${(ob.completionPercentage || 0) * 100}%`, color: sc.ring }} />
        </div>
        <ChevronRight className="h-3 w-3 text-[var(--foreground-secondary)] opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </button>
  );
}

// ---- Main Page ----
export default function CompliancePage() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const isAr = language === 'ar';
  const { data: session } = useSession();
  const { isImpersonating, impersonatedUser } = useImpersonation();

  const effectiveRole = (isImpersonating && impersonatedUser?.role) ? impersonatedUser.role : session?.user?.role;
  const canCreate = effectiveRole && ['admin', 'riskManager', 'riskAnalyst', 'riskChampion'].includes(effectiveRole);

  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [domains, setDomains] = useState<ComplianceDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('domains');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    domainId: '', status: '', criticality: '', recurrence: '', department: '',
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
      if (isImpersonating && impersonatedUser?.id) headers['X-Impersonate-User-Id'] = impersonatedUser.id;

      const res = await fetch(`/api/compliance?${params}`, { headers });
      const data = await res.json();
      if (data.success) {
        setObligations(data.data);
        const uniq = new Map<string, ComplianceDomain>();
        data.data.forEach((o: Obligation) => {
          if (o.domain && !uniq.has(o.domain.id)) uniq.set(o.domain.id, o.domain);
        });
        if (uniq.size > 0) setDomains(Array.from(uniq.values()));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, filters, isImpersonating, impersonatedUser]);

  useEffect(() => { fetchObligations(); }, [fetchObligations]);

  const handleSeedData = async () => {
    if (seeding) return;
    setSeeding(true);
    try {
      const res = await fetch('/api/compliance/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(isAr ? `${data.message}` : data.message);
        fetchObligations();
      } else {
        alert(data.error || 'Error');
      }
    } catch (err) { console.error(err); } finally { setSeeding(false); }
  };

  const handleCreate = async (formData: Record<string, unknown>) => {
    setSaving(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (isImpersonating && impersonatedUser?.id) headers['X-Impersonate-User-Id'] = impersonatedUser.id;
      const res = await fetch('/api/compliance', { method: 'POST', headers, body: JSON.stringify(formData) });
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        fetchObligations();
        router.push(`/compliance/${data.data.id}`);
      } else {
        alert(data.error || (isAr ? 'حدث خطأ' : 'An error occurred'));
      }
    } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  // ---- Computed stats ----
  const stats = useMemo(() => {
    const total = obligations.length;
    const compliant = obligations.filter(o => o.complianceStatus === 'compliant').length;
    const partial = obligations.filter(o => o.complianceStatus === 'partiallyCompliant').length;
    const nonCompliant = obligations.filter(o => o.complianceStatus === 'nonCompliant').length;
    const notAssessed = total - compliant - partial - nonCompliant;
    const overdue = obligations.filter(o => o.nextDueDate && new Date(o.nextDueDate) < new Date() && o.complianceStatus !== 'compliant').length;
    const critical = obligations.filter(o => o.criticalityLevel === 'critical').length;
    const avgCompletion = total > 0 ? Math.round(obligations.reduce((s, o) => s + (o.completionPercentage || 0) * 100, 0) / total) : 0;
    return { total, compliant, partial, nonCompliant, notAssessed, overdue, critical, avgCompletion };
  }, [obligations]);

  // ---- Group by domain ----
  const groupedByDomain = useMemo(() => {
    const map = new Map<string, { domain: ComplianceDomain; items: Obligation[] }>();
    for (const ob of obligations) {
      const key = ob.domain?.id || 'none';
      if (!map.has(key)) map.set(key, { domain: ob.domain!, items: [] });
      map.get(key)!.items.push(ob);
    }
    return Array.from(map.values()).sort((a, b) => b.items.length - a.items.length);
  }, [obligations]);

  const clearFilters = () => { setFilters({ domainId:'', status:'', criticality:'', recurrence:'', department:'' }); setSearch(''); };
  const hasActiveFilters = Object.values(filters).some(Boolean) || search;

  const toggleDomain = (id: string) => {
    setExpandedDomains(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedDomains(new Set(groupedByDomain.map(g => g.domain?.id || 'none')));
  const collapseAll = () => setExpandedDomains(new Set());

  return (
    <div className="min-h-screen bg-[var(--background)] p-4 md:p-6 space-y-6">

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6 text-white shadow-xl">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {isAr ? 'سجل الالتزام الرئيسي' : 'Master Compliance Register'}
              </h1>
              <p className="text-white/70 text-sm mt-0.5">
                {isAr ? 'شركة الكابلات السعودية' : 'Saudi Cable Company (SCC)'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => router.push('/compliance/dashboard')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-medium backdrop-blur-sm transition-all"
            >
              <BarChart3 className="h-4 w-4" />
              {isAr ? 'لوحة التحكم' : 'Dashboard'}
            </button>
            <button
              onClick={() => router.push('/compliance/calendar')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-medium backdrop-blur-sm transition-all"
            >
              <Calendar className="h-4 w-4" />
              {isAr ? 'التقويم' : 'Calendar'}
            </button>
            {canCreate && obligations.length === 0 && (
              <button
                onClick={handleSeedData}
                disabled={seeding}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-purple-700 hover:bg-white/90 text-sm font-medium transition-all disabled:opacity-50 shadow"
              >
                <Download className="h-4 w-4" />
                {seeding ? (isAr ? 'جاري الاستيراد...' : 'Importing...') : (isAr ? 'استيراد السجل' : 'Import Register')}
              </button>
            )}
            {canCreate && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-purple-700 hover:bg-white/90 text-sm font-medium transition-all shadow"
              >
                <Plus className="h-4 w-4" />
                {isAr ? 'التزام جديد' : 'New Obligation'}
              </button>
            )}
          </div>
        </div>

        {/* Stats bar */}
        {obligations.length > 0 && (
          <div className="relative mt-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: isAr ? 'الإجمالي' : 'Total', value: stats.total, icon: Layers, color: 'text-white' },
              { label: isAr ? 'ملتزم' : 'Compliant', value: stats.compliant, icon: CheckCircle2, color: 'text-emerald-300' },
              { label: isAr ? 'جزئي' : 'Partial', value: stats.partial, icon: MinusCircle, color: 'text-amber-300' },
              { label: isAr ? 'غير ملتزم' : 'Non-Compliant', value: stats.nonCompliant, icon: XCircle, color: 'text-red-300' },
              { label: isAr ? 'غير مُقيَّم' : 'Not Assessed', value: stats.notAssessed, icon: HelpCircle, color: 'text-slate-300' },
              { label: isAr ? 'متأخر' : 'Overdue', value: stats.overdue, icon: AlertTriangle, color: 'text-orange-300' },
              { label: isAr ? 'متوسط الإنجاز' : 'Avg Completion', value: `${stats.avgCompletion}%`, icon: TrendingUp, color: 'text-blue-300' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2">
                <Icon className={`h-4 w-4 ${color} flex-shrink-0`} />
                <div>
                  <p className="text-[10px] text-white/60 leading-tight">{label}</p>
                  <p className="text-sm font-bold text-white">{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground-secondary)]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={isAr ? 'بحث بالكود أو العنوان أو المرجع...' : 'Search by code, title or reference...'}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] py-2.5 ps-10 pe-4 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-secondary)] focus:border-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 transition-all"
          />
        </div>

        {/* View mode */}
        <div className="flex items-center bg-[var(--background-secondary)] rounded-xl border border-[var(--border)] p-1 gap-1">
          {([
            { v: 'domains', icon: Grid3X3, label: isAr ? 'مجالات' : 'Domains' },
            { v: 'cards',   icon: Layers,  label: isAr ? 'بطاقات' : 'Cards' },
            { v: 'table',   icon: List,    label: isAr ? 'جدول' : 'Table' },
          ] as const).map(({ v, icon: Icon, label }) => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              title={label}
              className={`p-2 rounded-lg transition-all ${viewMode === v ? 'bg-[#6366f1] text-white shadow' : 'text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)]'}`}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>

        {/* Filters toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-colors ${
            showFilters || hasActiveFilters
              ? 'border-[#6366f1] bg-[#6366f1]/10 text-[#6366f1]'
              : 'border-[var(--border)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
          }`}
        >
          <Filter className="h-4 w-4" />
          {isAr ? 'تصفية' : 'Filter'}
          {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-[#6366f1]" />}
        </button>

        {hasActiveFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <X className="h-3.5 w-3.5" /> {isAr ? 'مسح' : 'Clear'}
          </button>
        )}
      </div>

      {/* ── Filter panel ── */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 bg-[var(--background-secondary)] rounded-xl border border-[var(--border)] animate-in slide-in-from-top-2">
          <select value={filters.domainId} onChange={e => setFilters(f => ({ ...f, domainId: e.target.value }))}
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]">
            <option value="">{isAr ? 'كل المجالات' : 'All Domains'}</option>
            {domains.map(d => <option key={d.id} value={d.id}>{isAr ? d.nameAr : d.nameEn}</option>)}
          </select>
          <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]">
            <option value="">{isAr ? 'كل الحالات' : 'All Statuses'}</option>
            <option value="compliant">{isAr ? 'ملتزم' : 'Compliant'}</option>
            <option value="partiallyCompliant">{isAr ? 'ملتزم جزئياً' : 'Partially Compliant'}</option>
            <option value="nonCompliant">{isAr ? 'غير ملتزم' : 'Non-Compliant'}</option>
            <option value="notAssessed">{isAr ? 'غير مُقيَّم' : 'Not Assessed'}</option>
          </select>
          <select value={filters.criticality} onChange={e => setFilters(f => ({ ...f, criticality: e.target.value }))}
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]">
            <option value="">{isAr ? 'كل المستويات' : 'All Levels'}</option>
            <option value="critical">{isAr ? 'حرج' : 'Critical'}</option>
            <option value="high">{isAr ? 'مرتفع' : 'High'}</option>
            <option value="medium">{isAr ? 'متوسط' : 'Medium'}</option>
            <option value="low">{isAr ? 'منخفض' : 'Low'}</option>
          </select>
          <select value={filters.recurrence} onChange={e => setFilters(f => ({ ...f, recurrence: e.target.value }))}
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]">
            <option value="">{isAr ? 'كل الدوريات' : 'All Recurrences'}</option>
            <option value="annual">{isAr ? 'سنوي' : 'Annual'}</option>
            <option value="quarterly">{isAr ? 'ربع سنوي' : 'Quarterly'}</option>
            <option value="monthly">{isAr ? 'شهري' : 'Monthly'}</option>
            <option value="continuous">{isAr ? 'مستمر' : 'Continuous'}</option>
          </select>
          <input type="text" value={filters.department}
            onChange={e => setFilters(f => ({ ...f, department: e.target.value }))}
            placeholder={isAr ? 'الإدارة...' : 'Department...'}
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]" />
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-4">
            <RefreshCw className="h-10 w-10 animate-spin text-[#6366f1]" />
            <p className="text-sm text-[var(--foreground-secondary)]">{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
          </div>
        </div>
      ) : obligations.length === 0 ? (
        <EmptyState isAr={isAr} canCreate={!!canCreate} seeding={seeding} onSeed={handleSeedData} />
      ) : viewMode === 'domains' ? (
        <DomainsView
          groups={groupedByDomain} isAr={isAr}
          expandedDomains={expandedDomains} toggleDomain={toggleDomain}
          expandAll={expandAll} collapseAll={collapseAll}
        />
      ) : viewMode === 'cards' ? (
        <CardsView obligations={obligations} isAr={isAr} router={router} />
      ) : (
        <TableView obligations={obligations} isAr={isAr} router={router} />
      )}

      {/* Create modal */}
      {showCreateModal && (
        <CreateModal domains={domains} onSave={handleCreate} onClose={() => setShowCreateModal(false)} saving={saving} isAr={isAr} />
      )}
    </div>
  );
}

// ── Domains view ──
function DomainsView({ groups, isAr, expandedDomains, toggleDomain, expandAll, collapseAll }: {
  groups: { domain: ComplianceDomain; items: Obligation[] }[];
  isAr: boolean;
  expandedDomains: Set<string>;
  toggleDomain: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--foreground-secondary)]">
          {groups.length} {isAr ? 'مجال' : 'domains'}
        </p>
        <div className="flex gap-2">
          <button onClick={expandAll} className="text-xs text-[#6366f1] hover:underline">{isAr ? 'فتح الكل' : 'Expand all'}</button>
          <span className="text-[var(--border)]">|</span>
          <button onClick={collapseAll} className="text-xs text-[var(--foreground-secondary)] hover:underline">{isAr ? 'إغلاق الكل' : 'Collapse all'}</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {groups.map(({ domain, items }) => (
          <DomainCard
            key={domain?.id || 'none'}
            domain={domain}
            obligations={items}
            isAr={isAr}
            expanded={expandedDomains.has(domain?.id || 'none')}
            onExpand={() => toggleDomain(domain?.id || 'none')}
          />
        ))}
      </div>
    </div>
  );
}

// ── Cards view ──
function CardsView({ obligations, isAr, router }: {
  obligations: Obligation[]; isAr: boolean;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {obligations.map((ob, idx) => {
        const sc = STATUS_CONFIG[ob.complianceStatus as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.notAssessed;
        const cc = CRIT_CONFIG[ob.criticalityLevel as keyof typeof CRIT_CONFIG] || CRIT_CONFIG.medium;
        const Icon = sc.icon;
        const color = getDomainColor(ob.domain?.code || 'GEN');
        const isOverdue = ob.nextDueDate && new Date(ob.nextDueDate) < new Date() && ob.complianceStatus !== 'compliant';
        return (
          <button
            key={ob.id}
            onClick={() => router.push(`/compliance/${ob.id}`)}
            className="text-start rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4 hover:shadow-md hover:border-[var(--primary)] transition-all group"
            style={{ animationDelay: `${idx * 20}ms` }}
          >
            <div className="h-1 w-full rounded-full mb-3" style={{ background: `linear-gradient(90deg, ${color}, ${color}44)` }} />
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="font-mono text-xs font-bold text-[var(--primary)]">{ob.code}</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${sc.badge}`}>
                <Icon className="h-2.5 w-2.5" />
                {isAr ? sc.labelAr : sc.labelEn}
              </span>
            </div>
            <p className="text-sm font-medium text-[var(--foreground)] line-clamp-2 mb-3">
              {isAr ? ob.titleAr : (ob.titleEn || ob.titleAr)}
            </p>
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${cc.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cc.dot}`} />
                {isAr ? cc.labelAr : cc.labelEn}
              </span>
              <div className="flex items-center gap-1.5">
                {isOverdue && <AlertTriangle className="h-3 w-3 text-orange-500" />}
                {ob._count.riskLinks > 0 && (
                  <span className="text-[10px] text-blue-500 flex items-center gap-0.5">
                    <Link2 className="h-2.5 w-2.5" />{ob._count.riskLinks}
                  </span>
                )}
                <div className="w-12 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(ob.completionPercentage || 0) * 100}%`, backgroundColor: color }} />
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Table view ──
function TableView({ obligations, isAr, router }: {
  obligations: Obligation[]; isAr: boolean;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--background)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--background-secondary)]">
            {[
              { k: 'code', label: isAr ? 'الكود' : 'Code' },
              { k: 'domain', label: isAr ? 'المجال' : 'Domain', min: true },
              { k: 'title', label: isAr ? 'الالتزام' : 'Obligation', min: true },
              { k: 'status', label: isAr ? 'الحالة' : 'Status' },
              { k: 'crit', label: isAr ? 'الأهمية' : 'Criticality' },
              { k: 'completion', label: isAr ? 'الإنجاز' : 'Completion' },
              { k: 'risks', label: isAr ? 'مخاطر' : 'Risks' },
              { k: 'due', label: isAr ? 'الاستحقاق' : 'Due Date' },
            ].map(col => (
              <th key={col.k} className={`px-4 py-3 text-start text-xs font-semibold text-[var(--foreground-secondary)] uppercase tracking-wide ${col.min ? 'min-w-[200px]' : ''}`}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {obligations.map((ob, idx) => {
            const sc = STATUS_CONFIG[ob.complianceStatus as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.notAssessed;
            const cc = CRIT_CONFIG[ob.criticalityLevel as keyof typeof CRIT_CONFIG] || CRIT_CONFIG.medium;
            const Icon = sc.icon;
            const color = getDomainColor(ob.domain?.code || 'GEN');
            const isOverdue = ob.nextDueDate && new Date(ob.nextDueDate) < new Date() && ob.complianceStatus !== 'compliant';
            return (
              <tr
                key={ob.id}
                onClick={() => router.push(`/compliance/${ob.id}`)}
                className={`border-b border-[var(--border)] cursor-pointer transition-colors hover:bg-[var(--background-tertiary)] ${isOverdue ? 'bg-red-50/30 dark:bg-red-900/5' : ''}`}
                style={{ animationDelay: `${idx * 15}ms` }}
              >
                <td className="px-4 py-3">
                  <span className="font-mono text-xs font-bold text-[var(--primary)]">{ob.code}</span>
                </td>
                <td className="px-4 py-3">
                  {ob.domain && (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-xs font-medium text-[var(--foreground)]">
                        {isAr ? ob.domain.nameAr : ob.domain.nameEn}
                      </span>
                    </div>
                  )}
                  {ob.subDomainAr && <p className="text-[10px] text-[var(--foreground-secondary)] mt-0.5 ms-4">{ob.subDomainAr}</p>}
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-[var(--foreground)] line-clamp-2">
                    {isAr ? ob.titleAr : (ob.titleEn || ob.titleAr)}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.badge}`}>
                    <Icon className="h-3 w-3" />
                    {isAr ? sc.labelAr : sc.labelEn}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cc.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cc.dot}`} />
                    {isAr ? cc.labelAr : cc.labelEn}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(ob.completionPercentage || 0) * 100}%`, backgroundColor: color }} />
                    </div>
                    <span className="text-xs text-[var(--foreground-secondary)]">{Math.round((ob.completionPercentage || 0) * 100)}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  {ob._count.riskLinks > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      <Link2 className="h-3 w-3" />{ob._count.riskLinks}
                    </span>
                  ) : <span className="text-xs text-[var(--foreground-secondary)]">–</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  {ob.nextDueDate ? (
                    <span className={`text-xs ${isOverdue ? 'text-red-500 font-semibold' : 'text-[var(--foreground-secondary)]'}`}>
                      {new Date(ob.nextDueDate).toLocaleDateString(isAr ? 'ar-SA-u-ca-gregory' : 'en-US')}
                      {isOverdue && <AlertTriangle className="h-3 w-3 inline ms-1" />}
                    </span>
                  ) : <span className="text-xs text-[var(--foreground-secondary)]">–</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Empty state ──
function EmptyState({ isAr, canCreate, seeding, onSeed }: {
  isAr: boolean; canCreate: boolean; seeding: boolean; onSeed: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center">
        <ShieldCheck className="h-12 w-12 text-indigo-400" />
      </div>
      <div className="text-center">
        <h3 className="text-xl font-bold text-[var(--foreground)]">
          {isAr ? 'لا توجد بيانات التزام' : 'No Compliance Data'}
        </h3>
        <p className="text-[var(--foreground-secondary)] mt-2 max-w-sm">
          {isAr
            ? 'قم باستيراد سجل الالتزام الرئيسي لشركة الكابلات السعودية (529 التزاماً عبر 31 مجالاً)'
            : 'Import the SCC Master Compliance Register (529 obligations across 31 domains)'}
        </p>
      </div>
      {canCreate && (
        <button
          onClick={onSeed}
          disabled={seeding}
          className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50"
        >
          <Download className="h-5 w-5" />
          {seeding ? (isAr ? 'جاري الاستيراد...' : 'Importing 529 obligations...') : (isAr ? 'استيراد سجل الالتزام الرئيسي' : 'Import Master Compliance Register')}
        </button>
      )}
    </div>
  );
}

// ── Create Modal ──
function CreateModal({ domains, onSave, onClose, saving, isAr }: {
  domains: ComplianceDomain[];
  onSave: (data: Record<string, unknown>) => void;
  onClose: () => void;
  saving: boolean;
  isAr: boolean;
}) {
  const [form, setForm] = useState<Record<string, unknown>>({
    titleAr: '', titleEn: '', domainId: '', subDomainAr: '', subDomainEn: '',
    obligationType: 'mandatory', criticalityLevel: 'medium',
    responsibleDepartmentAr: '', directOwnerAr: '', backupOwnerAr: '',
    defenseLine: '', recurrence: 'annual', nextDueDate: '',
    alertDaysBefore: 30, regulatoryReference: '', articleNumber: '',
    internalPolicyAr: '', policyDocumentNumber: '',
    complianceStatus: 'notAssessed', completionPercentage: 0,
    nonComplianceLikelihood: 1, nonComplianceImpact: 1,
    notesAr: '', notesEn: '',
  });

  const tabs = [
    { key: 'general',        label: isAr ? 'أساسي' : 'Basic' },
    { key: 'responsibility', label: isAr ? 'المسؤولية' : 'Ownership' },
    { key: 'dates',          label: isAr ? 'التواريخ' : 'Dates' },
    { key: 'risk',           label: isAr ? 'المخاطر' : 'Risk' },
    { key: 'notes',          label: isAr ? 'ملاحظات' : 'Notes' },
  ];
  const [activeTab, setActiveTab] = useState('general');
  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));
  const inp = "w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1] outline-none transition-all";
  const lbl = "block text-xs font-semibold text-[var(--foreground-secondary)] mb-1";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titleAr && !form.titleEn) {
      alert(isAr ? 'عنوان الالتزام مطلوب' : 'Obligation title is required');
      return;
    }
    if (!form.domainId) {
      alert(isAr ? 'المجال مطلوب' : 'Domain is required');
      return;
    }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[var(--background)] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-[var(--border)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-white">
              <Plus className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-[var(--foreground)]">
              {isAr ? 'إضافة التزام جديد' : 'New Compliance Obligation'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--background-tertiary)] transition-colors text-[var(--foreground-secondary)]">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 py-3 border-b border-[var(--border)] overflow-x-auto bg-[var(--muted)]/30">
          {tabs.map((tab, i) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === tab.key
                  ? 'bg-[#6366f1] text-white shadow-md'
                  : 'text-[var(--foreground-secondary)] hover:bg-[var(--background)] hover:text-[var(--foreground)]'
              }`}>
              <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${activeTab === tab.key ? 'bg-white/20' : 'bg-[var(--border)]'}`}>{i+1}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {activeTab === 'general' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2"><label className={lbl}>{isAr ? 'العنوان بالعربي *' : 'Title (Arabic) *'}</label><input className={inp} value={form.titleAr as string} onChange={e => set('titleAr', e.target.value)} dir="rtl" /></div>
              <div className="md:col-span-2"><label className={lbl}>{isAr ? 'العنوان بالإنجليزي' : 'Title (English)'}</label><input className={inp} value={form.titleEn as string} onChange={e => set('titleEn', e.target.value)} dir="ltr" /></div>
              <div><label className={lbl}>{isAr ? 'المجال *' : 'Domain *'}</label>
                <select className={inp} value={form.domainId as string} onChange={e => set('domainId', e.target.value)}>
                  <option value="">{isAr ? '-- اختر --' : '-- Select --'}</option>
                  {domains.map(d => <option key={d.id} value={d.id}>{isAr ? d.nameAr : d.nameEn}</option>)}
                </select>
              </div>
              <div><label className={lbl}>{isAr ? 'نوع الالتزام' : 'Type'}</label>
                <select className={inp} value={form.obligationType as string} onChange={e => set('obligationType', e.target.value)}>
                  <option value="mandatory">{isAr ? 'إلزامي' : 'Mandatory'}</option>
                  <option value="advisory">{isAr ? 'استشاري' : 'Advisory'}</option>
                  <option value="bestPractice">{isAr ? 'أفضل الممارسات' : 'Best Practice'}</option>
                </select>
              </div>
              <div><label className={lbl}>{isAr ? 'مستوى الأهمية' : 'Criticality'}</label>
                <select className={inp} value={form.criticalityLevel as string} onChange={e => set('criticalityLevel', e.target.value)}>
                  <option value="critical">{isAr ? 'حرج' : 'Critical'}</option>
                  <option value="high">{isAr ? 'مرتفع' : 'High'}</option>
                  <option value="medium">{isAr ? 'متوسط' : 'Medium'}</option>
                  <option value="low">{isAr ? 'منخفض' : 'Low'}</option>
                </select>
              </div>
              <div><label className={lbl}>{isAr ? 'المجال الفرعي' : 'Sub-Domain'}</label><input className={inp} value={form.subDomainAr as string} onChange={e => set('subDomainAr', e.target.value)} dir="rtl" /></div>
              <div><label className={lbl}>{isAr ? 'المرجع التنظيمي' : 'Regulatory Reference'}</label><input className={inp} value={form.regulatoryReference as string} onChange={e => set('regulatoryReference', e.target.value)} /></div>
              <div><label className={lbl}>{isAr ? 'رقم المادة' : 'Article Number'}</label><input className={inp} value={form.articleNumber as string} onChange={e => set('articleNumber', e.target.value)} /></div>
              <div><label className={lbl}>{isAr ? 'السياسة الداخلية' : 'Internal Policy'}</label><input className={inp} value={form.internalPolicyAr as string} onChange={e => set('internalPolicyAr', e.target.value)} dir="rtl" /></div>
              <div><label className={lbl}>{isAr ? 'رقم الوثيقة' : 'Policy Doc #'}</label><input className={inp} value={form.policyDocumentNumber as string} onChange={e => set('policyDocumentNumber', e.target.value)} /></div>
            </div>
          )}
          {activeTab === 'responsibility' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className={lbl}>{isAr ? 'الإدارة المسؤولة' : 'Responsible Dept'}</label><input className={inp} value={form.responsibleDepartmentAr as string} onChange={e => set('responsibleDepartmentAr', e.target.value)} dir="rtl" /></div>
              <div><label className={lbl}>{isAr ? 'المالك المباشر' : 'Direct Owner'}</label><input className={inp} value={form.directOwnerAr as string} onChange={e => set('directOwnerAr', e.target.value)} dir="rtl" /></div>
              <div><label className={lbl}>{isAr ? 'المالك البديل' : 'Backup Owner'}</label><input className={inp} value={form.backupOwnerAr as string} onChange={e => set('backupOwnerAr', e.target.value)} dir="rtl" /></div>
              <div><label className={lbl}>{isAr ? 'خط الدفاع' : 'Defense Line'}</label>
                <select className={inp} value={form.defenseLine as string} onChange={e => set('defenseLine', e.target.value)}>
                  <option value="">{isAr ? '-- اختر --' : '-- Select --'}</option>
                  <option value="first">{isAr ? 'خط الدفاع الأول' : 'First Line'}</option>
                  <option value="second">{isAr ? 'خط الدفاع الثاني' : 'Second Line'}</option>
                  <option value="third">{isAr ? 'خط الدفاع الثالث' : 'Third Line'}</option>
                </select>
              </div>
            </div>
          )}
          {activeTab === 'dates' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className={lbl}>{isAr ? 'الدورية' : 'Recurrence'}</label>
                <select className={inp} value={form.recurrence as string} onChange={e => set('recurrence', e.target.value)}>
                  <option value="annual">{isAr ? 'سنوي' : 'Annual'}</option>
                  <option value="semiAnnual">{isAr ? 'نصف سنوي' : 'Semi-Annual'}</option>
                  <option value="quarterly">{isAr ? 'ربع سنوي' : 'Quarterly'}</option>
                  <option value="monthly">{isAr ? 'شهري' : 'Monthly'}</option>
                  <option value="continuous">{isAr ? 'مستمر' : 'Continuous'}</option>
                  <option value="perEvent">{isAr ? 'عند الحدث' : 'Per Event'}</option>
                  <option value="oneTime">{isAr ? 'مرة واحدة' : 'One Time'}</option>
                </select>
              </div>
              <div><label className={lbl}>{isAr ? 'تاريخ الاستحقاق' : 'Next Due Date'}</label><input type="date" className={inp} value={form.nextDueDate as string} onChange={e => set('nextDueDate', e.target.value)} /></div>
              <div><label className={lbl}>{isAr ? 'التنبيه قبل (أيام)' : 'Alert Days Before'}</label><input type="number" className={inp} value={form.alertDaysBefore as number} onChange={e => set('alertDaysBefore', parseInt(e.target.value) || 30)} /></div>
            </div>
          )}
          {activeTab === 'risk' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className={lbl}>{isAr ? 'احتمالية عدم الالتزام (1-5)' : 'Non-Compliance Likelihood (1-5)'}</label><input type="number" min="1" max="5" className={inp} value={form.nonComplianceLikelihood as number} onChange={e => set('nonComplianceLikelihood', parseInt(e.target.value) || 1)} /></div>
              <div><label className={lbl}>{isAr ? 'أثر عدم الالتزام (1-5)' : 'Non-Compliance Impact (1-5)'}</label><input type="number" min="1" max="5" className={inp} value={form.nonComplianceImpact as number} onChange={e => set('nonComplianceImpact', parseInt(e.target.value) || 1)} /></div>
              <div className="md:col-span-2 p-4 rounded-xl bg-[var(--background-tertiary)]">
                <p className="text-xs font-semibold text-[var(--foreground-secondary)]">{isAr ? 'درجة المخاطرة' : 'Risk Score'}</p>
                <p className="text-3xl font-bold text-[#6366f1] mt-1">{(form.nonComplianceLikelihood as number) * (form.nonComplianceImpact as number)}</p>
              </div>
            </div>
          )}
          {activeTab === 'notes' && (
            <div className="grid gap-4">
              <div><label className={lbl}>{isAr ? 'ملاحظات (عربي)' : 'Notes (Arabic)'}</label><textarea rows={4} className={inp} value={form.notesAr as string} onChange={e => set('notesAr', e.target.value)} dir="rtl" /></div>
              <div><label className={lbl}>{isAr ? 'ملاحظات (إنجليزي)' : 'Notes (English)'}</label><textarea rows={4} className={inp} value={form.notesEn as string} onChange={e => set('notesEn', e.target.value)} dir="ltr" /></div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border)]">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--foreground-secondary)] hover:bg-[var(--background-tertiary)] transition-colors">
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:from-[#4f46e5] hover:to-[#7c3aed] transition-all disabled:opacity-50 shadow-md">
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {saving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'إنشاء الالتزام' : 'Create Obligation')}
          </button>
        </div>
      </div>
    </div>
  );
}
