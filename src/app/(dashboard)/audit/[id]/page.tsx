'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import {
  ArrowLeft, ArrowRight, ClipboardCheck, Plus, Edit3, Trash2,
  AlertTriangle, CheckCircle2, Clock, Loader2, Building2,
  Calendar, User, FileText, Link2, ChevronDown, ChevronUp,
  Save, XCircle, CircleDot, ListChecks, Check, Package,
  MessageSquare, ArrowRightCircle, Paperclip,
} from 'lucide-react';

/* ========== TYPES ========== */
interface AuditAction {
  id: string; titleAr: string; titleEn: string | null;
  descriptionAr: string | null; assigneeId: string | null;
  status: string; priority: string; dueDate: string | null;
  completedAt: string | null; notesAr: string | null;
  assignee: { id: string; fullName: string; fullNameEn: string | null; email: string } | null;
  completedBy: { id: string; fullName: string; fullNameEn: string | null } | null;
}

interface AuditFinding {
  id: string; findingNumber: string; titleAr: string; titleEn: string | null;
  descriptionAr: string | null; type: string; severity: string;
  departmentId: string | null; assigneeId: string | null;
  riskId: string | null; status: string;
  managementResponseAr: string | null; managementResponseEn: string | null;
  dueDate: string | null; closedAt: string | null;
  department: { id: string; nameAr: string; nameEn: string } | null;
  assignee: { id: string; fullName: string; fullNameEn: string | null; email: string } | null;
  risk: { id: string; riskNumber: string; titleAr: string; titleEn: string } | null;
  createdBy: { id: string; fullName: string; fullNameEn: string | null };
  actions: AuditAction[];
}

interface DataRequest {
  id: string; descriptionAr: string; descriptionEn: string | null;
  assigneeId: string | null; dueDate: string | null;
  status: string; deliveredAt: string | null;
  attachmentUrl: string | null; attachmentName: string | null; notesAr: string | null;
  assignee: { id: string; fullName: string; fullNameEn: string | null; email: string } | null;
}

interface Engagement {
  id: string; engagementNumber: string; titleAr: string; titleEn: string | null;
  auditorName: string | null; auditorContact: string | null; auditorEmail: string | null;
  scopeAr: string | null; scopeEn: string | null;
  currentPhase: string; status: string;
  kickoffDate: string | null; dataRequestDate: string | null;
  fieldworkDate: string | null; draftReportDate: string | null;
  managementReviewDate: string | null; ceoReviewDate: string | null;
  committeeDate: string | null;
  kickoffNotes: string | null; dataRequestNotes: string | null;
  fieldworkNotes: string | null; draftReportNotes: string | null;
  managementReviewNotes: string | null; ceoReviewNotes: string | null;
  committeeNotes: string | null;
  createdBy: { id: string; fullName: string; fullNameEn: string | null };
  dataRequests: DataRequest[];
  findings: AuditFinding[];
}

interface UserOption { id: string; fullName: string; fullNameEn: string | null; email: string }
interface DeptOption { id: string; nameAr: string; nameEn: string }
interface RiskOption { id: string; riskNumber: string; titleAr: string; titleEn: string }

const PHASES = [
  { key: 'kickoff', ar: 'الاجتماع الافتتاحي', en: 'Kick-off', dateField: 'kickoffDate', notesField: 'kickoffNotes' },
  { key: 'dataRequest', ar: 'طلب البيانات', en: 'Data Request (IRL)', dateField: 'dataRequestDate', notesField: 'dataRequestNotes' },
  { key: 'fieldwork', ar: 'العمل الميداني', en: 'Fieldwork', dateField: 'fieldworkDate', notesField: 'fieldworkNotes' },
  { key: 'draftReport', ar: 'التقرير المبدئي', en: 'Draft Report', dateField: 'draftReportDate', notesField: 'draftReportNotes' },
  { key: 'managementReview', ar: 'مناقشة الإدارة', en: 'Management Review', dateField: 'managementReviewDate', notesField: 'managementReviewNotes' },
  { key: 'ceoReview', ar: 'الرئيس التنفيذي', en: 'CEO Review', dateField: 'ceoReviewDate', notesField: 'ceoReviewNotes' },
  { key: 'auditCommittee', ar: 'لجنة المراجعة', en: 'Audit Committee', dateField: 'committeeDate', notesField: 'committeeNotes' },
] as const;

/* ========== COMPONENT ========== */
export default function AuditDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [eng, setEng] = useState<Engagement | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [depts, setDepts] = useState<DeptOption[]>([]);
  const [risks, setRisks] = useState<RiskOption[]>([]);

  // Inline editing states
  const [editingHeader, setEditingHeader] = useState(false);
  const [headerForm, setHeaderForm] = useState<any>({});
  const [savingHeader, setSavingHeader] = useState(false);

  // Phase editing
  const [editPhase, setEditPhase] = useState<string | null>(null);
  const [phaseDate, setPhaseDate] = useState('');
  const [phaseNotes, setPhaseNotes] = useState('');
  const [savingPhase, setSavingPhase] = useState(false);

  // Data request
  const [showDRForm, setShowDRForm] = useState(false);
  const [editDR, setEditDR] = useState<DataRequest | null>(null);
  const [drForm, setDRForm] = useState({ descriptionAr: '', assigneeId: '', dueDate: '' });
  const [savingDR, setSavingDR] = useState(false);

  // Finding
  const [showFindingForm, setShowFindingForm] = useState(false);
  const [editFinding, setEditFinding] = useState<AuditFinding | null>(null);
  const [findingForm, setFindingForm] = useState({ titleAr: '', descriptionAr: '', type: 'observation', severity: 'medium', assigneeId: '', dueDate: '', managementResponseAr: '' });
  const [savingFinding, setSavingFinding] = useState(false);
  const [expandedFindings, setExpandedFindings] = useState<Set<string>>(new Set());

  // Action
  const [showActionForm, setShowActionForm] = useState<string | null>(null);
  const [editAction, setEditAction] = useState<AuditAction | null>(null);
  const [actionForm, setActionForm] = useState({ titleAr: '', assigneeId: '', priority: 'medium', dueDate: '' });
  const [savingAction, setSavingAction] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; findingId?: string } | null>(null);
  const [deletingItem, setDeletingItem] = useState(false);

  const userRole = (session?.user as any)?.role || '';
  const canAccess = userRole === 'admin' || userRole === 'riskManager';
  const BackArrow = isAr ? ArrowRight : ArrowLeft;

  /* ===== FETCH ===== */
  const fetchEng = useCallback(async () => {
    try {
      const res = await fetch(`/api/audit-engagements/${id}`);
      const data = await res.json();
      if (data.success) {
        setEng(data.data);
        setExpandedFindings(new Set(data.data.findings.map((f: any) => f.id)));
      }
    } catch { /* */ } finally { setLoading(false); }
  }, [id]);

  const fetchRef = useCallback(async () => {
    try {
      const [u, d, r] = await Promise.all([
        fetch('/api/users?status=active'), fetch('/api/departments'), fetch('/api/risks?limit=0'),
      ]);
      const [ud, dd, rd] = await Promise.all([u.json(), d.json(), r.json()]);
      if (ud.success) setUsers(ud.data || ud.users || []);
      if (dd.success) setDepts(dd.data);
      if (rd.success) setRisks(rd.data || []);
    } catch { /* */ }
  }, []);

  useEffect(() => { if (canAccess) { fetchEng(); fetchRef(); } }, [canAccess, fetchEng, fetchRef]);

  /* ===== HEADER ===== */
  const startEditHeader = () => {
    if (!eng) return;
    setHeaderForm({
      titleAr: eng.titleAr, titleEn: eng.titleEn || '',
      auditorName: eng.auditorName || '', auditorContact: eng.auditorContact || '',
      auditorEmail: eng.auditorEmail || '', scopeAr: eng.scopeAr || '',
    });
    setEditingHeader(true);
  };
  const saveHeader = async () => {
    setSavingHeader(true);
    try {
      const res = await fetch(`/api/audit-engagements/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(headerForm),
      });
      if ((await res.json()).success) { setEditingHeader(false); fetchEng(); }
    } catch { /* */ } finally { setSavingHeader(false); }
  };

  /* ===== PHASE ===== */
  const openPhaseEdit = (phaseKey: string) => {
    if (!eng) return;
    const p = PHASES.find(x => x.key === phaseKey);
    if (!p) return;
    const dateVal = (eng as any)[p.dateField];
    const notesVal = (eng as any)[p.notesField];
    setPhaseDate(dateVal ? dateVal.split('T')[0] : new Date().toISOString().split('T')[0]);
    setPhaseNotes(notesVal || '');
    setEditPhase(phaseKey);
  };
  const savePhase = async () => {
    if (!editPhase || !eng) return;
    setSavingPhase(true);
    const p = PHASES.find(x => x.key === editPhase)!;
    const phaseIdx = PHASES.findIndex(x => x.key === editPhase);
    const currentIdx = PHASES.findIndex(x => x.key === eng.currentPhase);
    const body: any = { [p.dateField]: phaseDate || null, [p.notesField]: phaseNotes || null };
    // Advance phase if this is the current or a future phase
    if (phaseIdx >= currentIdx) {
      const nextIdx = phaseIdx + 1;
      body.currentPhase = nextIdx < PHASES.length ? PHASES[nextIdx].key : eng.currentPhase;
      if (nextIdx >= PHASES.length) body.status = 'completed';
    }
    try {
      const res = await fetch(`/api/audit-engagements/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      if ((await res.json()).success) { setEditPhase(null); fetchEng(); }
    } catch { /* */ } finally { setSavingPhase(false); }
  };

  /* ===== DATA REQUESTS ===== */
  const openDRForm = (dr?: DataRequest) => {
    if (dr) {
      setEditDR(dr);
      setDRForm({ descriptionAr: dr.descriptionAr, assigneeId: dr.assigneeId || '', dueDate: dr.dueDate?.split('T')[0] || '' });
    } else {
      setEditDR(null);
      setDRForm({ descriptionAr: '', assigneeId: '', dueDate: '' });
    }
    setShowDRForm(true);
  };
  const saveDR = async () => {
    if (!drForm.descriptionAr.trim()) return;
    setSavingDR(true);
    try {
      const url = editDR ? `/api/audit-engagements/${id}/data-requests/${editDR.id}` : `/api/audit-engagements/${id}/data-requests`;
      const method = editDR ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(drForm) });
      if ((await res.json()).success) { setShowDRForm(false); fetchEng(); }
    } catch { /* */ } finally { setSavingDR(false); }
  };
  const toggleDRStatus = async (dr: DataRequest) => {
    const newStatus = dr.status === 'delivered' ? 'pending' : 'delivered';
    try {
      await fetch(`/api/audit-engagements/${id}/data-requests/${dr.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchEng();
    } catch { /* */ }
  };

  /* ===== FINDINGS ===== */
  const openFindingForm = (f?: AuditFinding) => {
    if (f) {
      setEditFinding(f);
      setFindingForm({ titleAr: f.titleAr, descriptionAr: f.descriptionAr || '', type: f.type, severity: f.severity, assigneeId: f.assigneeId || '', dueDate: f.dueDate?.split('T')[0] || '', managementResponseAr: f.managementResponseAr || '' });
    } else {
      setEditFinding(null);
      setFindingForm({ titleAr: '', descriptionAr: '', type: 'observation', severity: 'medium', assigneeId: '', dueDate: '', managementResponseAr: '' });
    }
    setShowFindingForm(true);
  };
  const saveFinding = async () => {
    if (!findingForm.titleAr.trim()) return;
    setSavingFinding(true);
    try {
      const url = editFinding ? `/api/audit-engagements/${id}/findings/${editFinding.id}` : `/api/audit-engagements/${id}/findings`;
      const method = editFinding ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(findingForm) });
      if ((await res.json()).success) { setShowFindingForm(false); fetchEng(); }
    } catch { /* */ } finally { setSavingFinding(false); }
  };
  const updateFindingStatus = async (fId: string, status: string) => {
    try {
      await fetch(`/api/audit-engagements/${id}/findings/${fId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
      });
      fetchEng();
    } catch { /* */ }
  };

  /* ===== ACTIONS ===== */
  const openActionForm = (findingId: string, a?: AuditAction) => {
    if (a) {
      setEditAction(a);
      setActionForm({ titleAr: a.titleAr, assigneeId: a.assigneeId || '', priority: a.priority, dueDate: a.dueDate?.split('T')[0] || '' });
    } else {
      setEditAction(null);
      setActionForm({ titleAr: '', assigneeId: '', priority: 'medium', dueDate: '' });
    }
    setShowActionForm(findingId);
  };
  const saveAction = async () => {
    if (!showActionForm || !actionForm.titleAr.trim()) return;
    setSavingAction(true);
    try {
      const url = editAction
        ? `/api/audit-engagements/${id}/findings/${showActionForm}/actions/${editAction.id}`
        : `/api/audit-engagements/${id}/findings/${showActionForm}/actions`;
      const method = editAction ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(actionForm) });
      if ((await res.json()).success) { setShowActionForm(null); fetchEng(); }
    } catch { /* */ } finally { setSavingAction(false); }
  };
  const updateActionStatus = async (fId: string, aId: string, status: string) => {
    try {
      await fetch(`/api/audit-engagements/${id}/findings/${fId}/actions/${aId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
      });
      fetchEng();
    } catch { /* */ }
  };

  /* ===== DELETE ===== */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeletingItem(true);
    try {
      let url = '';
      if (deleteTarget.type === 'dr') url = `/api/audit-engagements/${id}/data-requests/${deleteTarget.id}`;
      else if (deleteTarget.type === 'finding') url = `/api/audit-engagements/${id}/findings/${deleteTarget.id}`;
      else if (deleteTarget.type === 'action') url = `/api/audit-engagements/${id}/findings/${deleteTarget.findingId}/actions/${deleteTarget.id}`;
      const res = await fetch(url, { method: 'DELETE' });
      if ((await res.json()).success) { setDeleteTarget(null); fetchEng(); }
    } catch { /* */ } finally { setDeletingItem(false); }
  };

  /* ===== HELPERS ===== */
  const sevColor = (s: string) => {
    const m: Record<string, string> = {
      critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      major: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    };
    return m[s] || 'bg-gray-100 text-gray-800';
  };
  const sevLabel = (s: string) => isAr ? ({ critical: 'حرجة', major: 'كبيرة', medium: 'متوسطة', low: 'منخفضة' }[s] || s) : (s.charAt(0).toUpperCase() + s.slice(1));
  const typeLabel = (t: string) => isAr ? ({ observation: 'ملاحظة', recommendation: 'توصية', nonConformity: 'عدم مطابقة' }[t] || t) : ({ observation: 'Observation', recommendation: 'Recommendation', nonConformity: 'Non-Conformity' }[t] || t);
  const statusLabel = (s: string) => isAr ? ({ open: 'مفتوحة', inProgress: 'قيد التنفيذ', pendingVerification: 'بانتظار التحقق', closed: 'مغلقة', pending: 'معلّقة', completed: 'مكتملة', delivered: 'تم التسليم', cancelled: 'ملغاة' }[s] || s) : ({ open: 'Open', inProgress: 'In Progress', pendingVerification: 'Pending Verification', closed: 'Closed', pending: 'Pending', completed: 'Completed', delivered: 'Delivered', cancelled: 'Cancelled' }[s] || s);
  const statusVariant = (s: string) => ({ open: 'warning', pending: 'warning', inProgress: 'info', pendingVerification: 'info', closed: 'success', completed: 'success', delivered: 'success', cancelled: 'secondary' }[s] || 'secondary') as any;
  const priLabel = (p: string) => isAr ? ({ high: 'عالية', medium: 'متوسطة', low: 'منخفضة' }[p] || p) : (p.charAt(0).toUpperCase() + p.slice(1));
  const userName = (u: { fullName: string; fullNameEn: string | null } | null) => u ? (isAr ? u.fullName : u.fullNameEn || u.fullName) : '';
  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString(isAr ? 'ar-SA' : 'en-US') : '';
  const isOverdue = (d: string | null) => d ? new Date(d) < new Date() : false;

  /* ===== GUARDS ===== */
  if (!canAccess) return <div className="flex items-center justify-center min-h-[60vh]"><Card className="p-8 text-center"><XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" /><h2 className="text-xl font-bold">{isAr ? 'غير مصرح' : 'Access Denied'}</h2></Card></div>;
  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-[#F39200]" /></div>;
  if (!eng) return <div className="flex items-center justify-center min-h-[60vh]"><Card className="p-8 text-center"><p>{isAr ? 'غير موجود' : 'Not found'}</p></Card></div>;

  const currentPhaseIdx = PHASES.findIndex(p => p.key === eng.currentPhase);
  const deliveredDR = eng.dataRequests.filter(d => d.status === 'delivered').length;

  /* ===== RENDER ===== */
  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      {/* ── HEADER ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button onClick={() => router.push('/audit')} className="p-2 rounded-lg hover:bg-[var(--background-secondary)] mt-1">
            <BackArrow className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-mono text-[#F39200] font-bold">{eng.engagementNumber}</span>
              {eng.status === 'completed' ? (
                <Badge variant="success"><CheckCircle2 className="w-3 h-3" />{isAr ? 'مكتمل' : 'Completed'}</Badge>
              ) : (
                <Badge variant="info">{isAr ? PHASES[currentPhaseIdx]?.ar : PHASES[currentPhaseIdx]?.en}</Badge>
              )}
            </div>
            {editingHeader ? (
              <div className="space-y-3 mt-2">
                <input value={headerForm.titleAr} onChange={e => setHeaderForm({ ...headerForm, titleAr: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm font-semibold" placeholder={isAr ? 'العنوان' : 'Title'} />
                <div className="grid grid-cols-2 gap-2">
                  <input value={headerForm.auditorName} onChange={e => setHeaderForm({ ...headerForm, auditorName: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm" placeholder={isAr ? 'جهة المراجعة' : 'Auditor'} />
                  <input value={headerForm.auditorContact} onChange={e => setHeaderForm({ ...headerForm, auditorContact: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm" placeholder={isAr ? 'اسم المراجع' : 'Contact'} />
                </div>
                <textarea value={headerForm.scopeAr} onChange={e => setHeaderForm({ ...headerForm, scopeAr: e.target.value })} rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm resize-none" placeholder={isAr ? 'النطاق' : 'Scope'} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveHeader} disabled={savingHeader}>
                    {savingHeader ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    {isAr ? 'حفظ' : 'Save'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingHeader(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-xl font-bold">{isAr ? eng.titleAr : eng.titleEn || eng.titleAr}</h1>
                <div className="flex flex-wrap gap-3 mt-1 text-sm text-[var(--foreground-secondary)]">
                  {eng.auditorName && <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{eng.auditorName}</span>}
                  {eng.auditorContact && <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{eng.auditorContact}</span>}
                </div>
                {eng.scopeAr && <p className="text-sm text-[var(--foreground-secondary)] mt-2">{isAr ? eng.scopeAr : eng.scopeEn || eng.scopeAr}</p>}
              </>
            )}
          </div>
        </div>
        {!editingHeader && (
          <Button size="sm" variant="outline" onClick={startEditHeader}>
            <Edit3 className="w-4 h-4" />{isAr ? 'تعديل' : 'Edit'}
          </Button>
        )}
      </div>

      {/* ── PHASE PROGRESS ── */}
      <Card className="p-5">
        <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
          <ArrowRightCircle className="w-4 h-4 text-[#F39200]" />
          {isAr ? 'مراحل المراجعة' : 'Audit Phases'}
        </h2>
        <div className="flex items-center gap-0 mb-4 overflow-x-auto pb-2">
          {PHASES.map((p, i) => {
            const dateVal = (eng as any)[p.dateField];
            const isPast = i < currentPhaseIdx;
            const isCurrent = i === currentPhaseIdx;
            const isFuture = i > currentPhaseIdx;
            const isCompleted = eng.status === 'completed';

            return (
              <React.Fragment key={p.key}>
                <button
                  onClick={() => openPhaseEdit(p.key)}
                  className="flex flex-col items-center gap-1.5 min-w-[80px] group"
                  title={dateVal ? fmtDate(dateVal) : undefined}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    isPast || isCompleted ? 'bg-green-500 border-green-500 text-white' :
                    isCurrent ? 'bg-[#F39200] border-[#F39200] text-white animate-pulse' :
                    'bg-[var(--background)] border-[var(--border)] text-[var(--foreground-secondary)] group-hover:border-[#F39200]'
                  }`}>
                    {isPast || isCompleted ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-[10px] text-center leading-tight ${isCurrent ? 'font-bold text-[#F39200]' : 'text-[var(--foreground-secondary)]'}`}>
                    {isAr ? p.ar : p.en}
                  </span>
                  {dateVal && <span className="text-[9px] text-[var(--foreground-secondary)]">{fmtDate(dateVal)}</span>}
                </button>
                {i < PHASES.length - 1 && (
                  <div className={`flex-1 h-0.5 min-w-[20px] mt-[-20px] ${isPast || (isCompleted && i < PHASES.length - 1) ? 'bg-green-500' : 'bg-[var(--border)]'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Phase edit inline */}
        {editPhase && (
          <div className="border-t border-[var(--border)] pt-4 mt-2 space-y-3">
            <h3 className="text-sm font-semibold">
              {isAr ? PHASES.find(p => p.key === editPhase)?.ar : PHASES.find(p => p.key === editPhase)?.en}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[var(--foreground-secondary)]">{isAr ? 'التاريخ' : 'Date'}</label>
                <input type="date" value={phaseDate} onChange={e => setPhaseDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs text-[var(--foreground-secondary)]">{isAr ? 'ملاحظات' : 'Notes'}</label>
              <textarea value={phaseNotes} onChange={e => setPhaseNotes(e.target.value)} rows={2}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm resize-none" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={savePhase} disabled={savingPhase}>
                {savingPhase ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                {isAr ? 'حفظ وانتقل للمرحلة التالية' : 'Save & Advance'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditPhase(null)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
            </div>
          </div>
        )}
      </Card>

      {/* ── DATA REQUESTS (IRL) ── */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-500" />
            {isAr ? 'طلبات البيانات (IRL)' : 'Data Requests (IRL)'}
            {eng.dataRequests.length > 0 && (
              <span className="text-xs font-normal text-[var(--foreground-secondary)]">
                ({deliveredDR}/{eng.dataRequests.length} {isAr ? 'تم التسليم' : 'delivered'})
              </span>
            )}
          </h2>
          <Button size="sm" variant="outline" onClick={() => openDRForm()}>
            <Plus className="w-3 h-3" />{isAr ? 'إضافة' : 'Add'}
          </Button>
        </div>

        {eng.dataRequests.length === 0 ? (
          <p className="text-sm text-[var(--foreground-secondary)] text-center py-4">{isAr ? 'لا توجد طلبات بعد' : 'No requests yet'}</p>
        ) : (
          <div className="space-y-2">
            {eng.dataRequests.map((dr, idx) => (
              <div key={dr.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                dr.status === 'delivered' ? 'bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-800' :
                isOverdue(dr.dueDate) && dr.status === 'pending' ? 'bg-red-50/50 border-red-200 dark:bg-red-900/10 dark:border-red-800' :
                'bg-[var(--background-secondary)]/30 border-[var(--border)]'
              }`}>
                {/* Toggle */}
                <button onClick={() => toggleDRStatus(dr)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    dr.status === 'delivered' ? 'bg-green-500 border-green-500 text-white' : 'border-[var(--border)] hover:border-green-400'
                  }`}>
                  {dr.status === 'delivered' && <Check className="w-3.5 h-3.5" />}
                </button>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${dr.status === 'delivered' ? 'line-through text-[var(--foreground-secondary)]' : ''}`}>
                    <span className="text-xs text-[var(--foreground-secondary)] me-1">{idx + 1}.</span>
                    {dr.descriptionAr}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1 text-[10px] text-[var(--foreground-secondary)]">
                    {dr.assignee && <span className="flex items-center gap-0.5"><User className="w-2.5 h-2.5" />{userName(dr.assignee)}</span>}
                    {dr.dueDate && <span className={`flex items-center gap-0.5 ${isOverdue(dr.dueDate) && dr.status === 'pending' ? 'text-red-500 font-bold' : ''}`}>
                      <Calendar className="w-2.5 h-2.5" />{fmtDate(dr.dueDate)}
                    </span>}
                  </div>
                </div>
                {/* Actions */}
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openDRForm(dr)} className="p-1 rounded hover:bg-[var(--background-secondary)]"><Edit3 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeleteTarget({ type: 'dr', id: dr.id })} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── FINDINGS & ACTIONS ── */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            {isAr ? 'الملاحظات والتوصيات' : 'Findings & Recommendations'}
            <span className="text-xs font-normal text-[var(--foreground-secondary)]">({eng.findings.length})</span>
          </h2>
          <Button size="sm" variant="outline" onClick={() => openFindingForm()}>
            <Plus className="w-3 h-3" />{isAr ? 'ملاحظة جديدة' : 'New Finding'}
          </Button>
        </div>

        {eng.findings.length === 0 ? (
          <p className="text-sm text-[var(--foreground-secondary)] text-center py-4">{isAr ? 'لا توجد ملاحظات بعد' : 'No findings yet'}</p>
        ) : (
          <div className="space-y-3">
            {eng.findings.map((f) => {
              const isExp = expandedFindings.has(f.id);
              const doneActions = f.actions.filter(a => a.status === 'completed').length;
              return (
                <div key={f.id} className="border border-[var(--border)] rounded-lg overflow-hidden">
                  {/* Finding header */}
                  <button onClick={() => setExpandedFindings(prev => { const n = new Set(prev); n.has(f.id) ? n.delete(f.id) : n.add(f.id); return n; })}
                    className="w-full p-3 flex items-start gap-2 hover:bg-[var(--background-secondary)]/50 transition-colors text-start">
                    <span className={`mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${sevColor(f.severity)}`}>{sevLabel(f.severity)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-mono text-[var(--foreground-secondary)]">{f.findingNumber}</span>
                        <Badge variant={statusVariant(f.status)} className="text-[10px]">{statusLabel(f.status)}</Badge>
                        <span className="text-[10px] bg-[var(--background-secondary)] px-1.5 py-0.5 rounded">{typeLabel(f.type)}</span>
                      </div>
                      <p className="text-sm font-semibold">{isAr ? f.titleAr : f.titleEn || f.titleAr}</p>
                      <div className="flex gap-2 mt-1 text-[10px] text-[var(--foreground-secondary)]">
                        {f.assignee && <span className="flex items-center gap-0.5"><User className="w-2.5 h-2.5" />{userName(f.assignee)}</span>}
                        {f.actions.length > 0 && <span className="flex items-center gap-0.5"><ListChecks className="w-2.5 h-2.5" />{doneActions}/{f.actions.length}</span>}
                      </div>
                    </div>
                    {isExp ? <ChevronUp className="w-4 h-4 text-[var(--foreground-secondary)] shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-[var(--foreground-secondary)] shrink-0 mt-1" />}
                  </button>

                  {/* Expanded */}
                  {isExp && (
                    <div className="border-t border-[var(--border)] p-3 space-y-3">
                      {f.descriptionAr && <p className="text-sm text-[var(--foreground-secondary)]">{f.descriptionAr}</p>}

                      {/* Management response */}
                      {f.managementResponseAr && (
                        <div className="p-2 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
                          <p className="text-[10px] font-bold text-blue-600 mb-1">{isAr ? 'رد الإدارة' : 'Management Response'}</p>
                          <p className="text-sm">{f.managementResponseAr}</p>
                        </div>
                      )}

                      {/* Finding buttons */}
                      <div className="flex flex-wrap gap-2">
                        {f.status === 'open' && (
                          <Button size="sm" variant="outline" onClick={() => updateFindingStatus(f.id, 'inProgress')}>
                            {isAr ? 'بدء المتابعة' : 'Start'}
                          </Button>
                        )}
                        {f.status === 'inProgress' && (
                          <Button size="sm" variant="outline" onClick={() => updateFindingStatus(f.id, 'pendingVerification')}>
                            {isAr ? 'إرسال للتحقق' : 'Send for Verification'}
                          </Button>
                        )}
                        {f.status === 'pendingVerification' && (
                          <Button size="sm" variant="outline" onClick={() => updateFindingStatus(f.id, 'closed')}>
                            <CheckCircle2 className="w-3 h-3" />{isAr ? 'إغلاق' : 'Close'}
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => openFindingForm(f)}>
                          <Edit3 className="w-3 h-3" />{isAr ? 'تعديل' : 'Edit'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setDeleteTarget({ type: 'finding', id: f.id })} className="text-red-500">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>

                      {/* Actions */}
                      <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-semibold flex items-center gap-1"><ListChecks className="w-3.5 h-3.5 text-green-600" />{isAr ? 'الإجراءات التصحيحية' : 'Corrective Actions'}</h4>
                          <button onClick={() => openActionForm(f.id)} className="text-[10px] text-[#F39200] hover:underline flex items-center gap-0.5"><Plus className="w-3 h-3" />{isAr ? 'إضافة' : 'Add'}</button>
                        </div>
                        {f.actions.length === 0 ? (
                          <p className="text-xs text-[var(--foreground-secondary)] ps-5">{isAr ? 'لا توجد إجراءات' : 'No actions'}</p>
                        ) : f.actions.map((a, ai) => (
                          <div key={a.id} className="flex items-center gap-2 p-2 rounded-lg bg-[var(--background-secondary)]/30 border border-[var(--border)]">
                            <span className="w-5 h-5 rounded-full bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-[9px] font-bold shrink-0">{ai + 1}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-medium">{isAr ? a.titleAr : a.titleEn || a.titleAr}</p>
                                <Badge variant={statusVariant(a.status)} className="text-[9px]">{statusLabel(a.status)}</Badge>
                              </div>
                              <div className="flex gap-2 text-[9px] text-[var(--foreground-secondary)] mt-0.5">
                                {a.assignee && <span>{userName(a.assignee)}</span>}
                                {a.dueDate && <span>{fmtDate(a.dueDate)}</span>}
                                <span className={`${a.priority === 'high' ? 'text-red-500' : a.priority === 'low' ? 'text-green-500' : 'text-yellow-500'}`}>{priLabel(a.priority)}</span>
                              </div>
                            </div>
                            <div className="flex gap-0.5 shrink-0">
                              {a.status === 'pending' && (
                                <button onClick={() => updateActionStatus(f.id, a.id, 'inProgress')} className="p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500" title={isAr ? 'بدء' : 'Start'}><CircleDot className="w-3 h-3" /></button>
                              )}
                              {a.status === 'inProgress' && (
                                <button onClick={() => updateActionStatus(f.id, a.id, 'completed')} className="p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/20 text-green-500" title={isAr ? 'إنجاز' : 'Complete'}><CheckCircle2 className="w-3 h-3" /></button>
                              )}
                              <button onClick={() => openActionForm(f.id, a)} className="p-1 rounded hover:bg-[var(--background-secondary)]"><Edit3 className="w-3 h-3" /></button>
                              <button onClick={() => setDeleteTarget({ type: 'action', id: a.id, findingId: f.id })} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400"><Trash2 className="w-3 h-3" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ====== MODALS ====== */}

      {/* Data Request Modal */}
      <Modal isOpen={showDRForm} onClose={() => setShowDRForm(false)} title={editDR ? (isAr ? 'تعديل الطلب' : 'Edit Request') : (isAr ? 'طلب بيانات جديد' : 'New Data Request')}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{isAr ? 'وصف البيان المطلوب *' : 'Description *'}</label>
            <input value={drForm.descriptionAr} onChange={e => setDRForm({ ...drForm, descriptionAr: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">{isAr ? 'المسؤول' : 'Assignee'}</label>
              <select value={drForm.assigneeId} onChange={e => setDRForm({ ...drForm, assigneeId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm">
                <option value="">{isAr ? 'غير محدد' : 'Not assigned'}</option>
                {users.map(u => <option key={u.id} value={u.id}>{isAr ? u.fullName : u.fullNameEn || u.fullName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{isAr ? 'الاستحقاق' : 'Due Date'}</label>
              <input type="date" value={drForm.dueDate} onChange={e => setDRForm({ ...drForm, dueDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm" />
            </div>
          </div>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowDRForm(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
          <Button onClick={saveDR} disabled={savingDR || !drForm.descriptionAr.trim()}>
            {savingDR && <Loader2 className="w-4 h-4 animate-spin" />}
            {editDR ? (isAr ? 'حفظ' : 'Save') : (isAr ? 'إضافة' : 'Add')}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Finding Modal */}
      <Modal isOpen={showFindingForm} onClose={() => setShowFindingForm(false)}
        title={editFinding ? (isAr ? 'تعديل الملاحظة' : 'Edit Finding') : (isAr ? 'ملاحظة جديدة' : 'New Finding')} size="lg">
        <div className="space-y-4 max-h-[55vh] overflow-y-auto p-1">
          <div>
            <label className="block text-sm font-medium mb-1">{isAr ? 'العنوان *' : 'Title *'}</label>
            <input value={findingForm.titleAr} onChange={e => setFindingForm({ ...findingForm, titleAr: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{isAr ? 'الوصف' : 'Description'}</label>
            <textarea value={findingForm.descriptionAr} onChange={e => setFindingForm({ ...findingForm, descriptionAr: e.target.value })} rows={3}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">{isAr ? 'النوع' : 'Type'}</label>
              <select value={findingForm.type} onChange={e => setFindingForm({ ...findingForm, type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm">
                <option value="observation">{isAr ? 'ملاحظة' : 'Observation'}</option>
                <option value="recommendation">{isAr ? 'توصية' : 'Recommendation'}</option>
                <option value="nonConformity">{isAr ? 'عدم مطابقة' : 'Non-Conformity'}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{isAr ? 'الأهمية' : 'Severity'}</label>
              <select value={findingForm.severity} onChange={e => setFindingForm({ ...findingForm, severity: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm">
                <option value="critical">{isAr ? 'حرجة' : 'Critical'}</option>
                <option value="major">{isAr ? 'كبيرة' : 'Major'}</option>
                <option value="medium">{isAr ? 'متوسطة' : 'Medium'}</option>
                <option value="low">{isAr ? 'منخفضة' : 'Low'}</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">{isAr ? 'المسؤول' : 'Assignee'}</label>
              <select value={findingForm.assigneeId} onChange={e => setFindingForm({ ...findingForm, assigneeId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm">
                <option value="">{isAr ? 'غير محدد' : 'Not assigned'}</option>
                {users.map(u => <option key={u.id} value={u.id}>{isAr ? u.fullName : u.fullNameEn || u.fullName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{isAr ? 'الاستحقاق' : 'Due Date'}</label>
              <input type="date" value={findingForm.dueDate} onChange={e => setFindingForm({ ...findingForm, dueDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{isAr ? 'رد الإدارة' : 'Management Response'}</label>
            <textarea value={findingForm.managementResponseAr} onChange={e => setFindingForm({ ...findingForm, managementResponseAr: e.target.value })} rows={2}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm resize-none" />
          </div>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowFindingForm(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
          <Button onClick={saveFinding} disabled={savingFinding || !findingForm.titleAr.trim()}>
            {savingFinding && <Loader2 className="w-4 h-4 animate-spin" />}
            {editFinding ? (isAr ? 'حفظ' : 'Save') : (isAr ? 'إضافة' : 'Add')}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Action Modal */}
      <Modal isOpen={!!showActionForm} onClose={() => setShowActionForm(null)}
        title={editAction ? (isAr ? 'تعديل الإجراء' : 'Edit Action') : (isAr ? 'إجراء تصحيحي جديد' : 'New Action')}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{isAr ? 'عنوان الإجراء *' : 'Action Title *'}</label>
            <input value={actionForm.titleAr} onChange={e => setActionForm({ ...actionForm, titleAr: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">{isAr ? 'المكلف' : 'Assignee'}</label>
              <select value={actionForm.assigneeId} onChange={e => setActionForm({ ...actionForm, assigneeId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm">
                <option value="">{isAr ? 'غير محدد' : 'Not assigned'}</option>
                {users.map(u => <option key={u.id} value={u.id}>{isAr ? u.fullName : u.fullNameEn || u.fullName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{isAr ? 'الأولوية' : 'Priority'}</label>
              <select value={actionForm.priority} onChange={e => setActionForm({ ...actionForm, priority: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm">
                <option value="high">{isAr ? 'عالية' : 'High'}</option>
                <option value="medium">{isAr ? 'متوسطة' : 'Medium'}</option>
                <option value="low">{isAr ? 'منخفضة' : 'Low'}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{isAr ? 'الاستحقاق' : 'Due Date'}</label>
            <input type="date" value={actionForm.dueDate} onChange={e => setActionForm({ ...actionForm, dueDate: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm" />
          </div>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowActionForm(null)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
          <Button onClick={saveAction} disabled={savingAction || !actionForm.titleAr.trim()}>
            {savingAction && <Loader2 className="w-4 h-4 animate-spin" />}
            {editAction ? (isAr ? 'حفظ' : 'Save') : (isAr ? 'إضافة' : 'Add')}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title={isAr ? 'تأكيد الحذف' : 'Confirm Delete'}>
        <p className="text-[var(--foreground-secondary)]">
          {isAr ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete this?'}
        </p>
        <ModalFooter>
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
          <Button variant="danger" onClick={handleDelete} disabled={deletingItem}>
            {deletingItem && <Loader2 className="w-4 h-4 animate-spin" />}
            {isAr ? 'حذف' : 'Delete'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
