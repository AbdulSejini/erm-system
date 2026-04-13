'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import {
  ClipboardCheck,
  Plus,
  Loader2,
  FileSearch,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Trash2,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

const PHASES = ['kickoff', 'dataRequest', 'fieldwork', 'draftReport', 'managementReview', 'ceoReview', 'auditCommittee'] as const;

interface Engagement {
  id: string;
  engagementNumber: string;
  titleAr: string;
  titleEn: string | null;
  auditorName: string | null;
  currentPhase: string;
  status: string;
  kickoffDate: string | null;
  createdAt: string;
  createdBy: { fullName: string; fullNameEn: string | null };
  dataRequests: Array<{ id: string; status: string }>;
  findings: Array<{
    id: string; status: string; severity: string;
    actions: Array<{ id: string; status: string }>;
  }>;
}

export default function AuditListPage() {
  const { language } = useTranslation();
  const isAr = language === 'ar';
  const { data: session } = useSession();
  const router = useRouter();

  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ titleAr: '', titleEn: '', auditorName: '', scopeAr: '' });

  const userRole = (session?.user as any)?.role || '';
  const canAccess = userRole === 'admin' || userRole === 'riskManager';

  const phaseLabel = (p: string) => {
    const labels: Record<string, [string, string]> = {
      kickoff: ['الاجتماع الافتتاحي', 'Kick-off'],
      dataRequest: ['طلب البيانات', 'Data Request'],
      fieldwork: ['العمل الميداني', 'Fieldwork'],
      draftReport: ['التقرير المبدئي', 'Draft Report'],
      managementReview: ['مناقشة الإدارة', 'Management Review'],
      ceoReview: ['الرئيس التنفيذي', 'CEO Review'],
      auditCommittee: ['لجنة المراجعة', 'Audit Committee'],
    };
    return labels[p]?.[isAr ? 0 : 1] || p;
  };

  const fetch_ = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/audit-engagements');
      const data = await res.json();
      if (data.success) setEngagements(data.data);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (canAccess) fetch_(); }, [canAccess, fetch_]);

  const handleCreate = async () => {
    if (!form.titleAr.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/audit-engagements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreate(false);
        setForm({ titleAr: '', titleEn: '', auditorName: '', scopeAr: '' });
        router.push(`/audit/${data.data.id}`);
      }
    } catch { /* ignore */ } finally { setCreating(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/audit-engagements/${deleteId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { setDeleteId(null); fetch_(); }
    } catch { /* ignore */ } finally { setDeleting(false); }
  };

  if (!canAccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 text-center max-w-md">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">{isAr ? 'غير مصرح بالوصول' : 'Access Denied'}</h2>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="w-7 h-7 text-[#F39200]" />
            {isAr ? 'متابعة المراجعة الداخلية' : 'Internal Audit Follow-up'}
          </h1>
          <p className="text-sm text-[var(--foreground-secondary)] mt-1">
            {isAr ? 'تتبع دورة حياة المراجعة من الافتتاح إلى الاعتماد' : 'Track audit lifecycle from kick-off to approval'}
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" />
          {isAr ? 'مراجعة جديدة' : 'New Audit'}
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#F39200]" />
        </div>
      ) : engagements.length === 0 ? (
        <Card className="p-12 text-center">
          <FileSearch className="w-12 h-12 text-[var(--foreground-secondary)] mx-auto mb-3 opacity-40" />
          <p className="text-[var(--foreground-secondary)]">
            {isAr ? 'لا توجد مراجعات بعد' : 'No audits yet'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {engagements.map((eng) => {
            const phaseIdx = PHASES.indexOf(eng.currentPhase as any);
            const delivered = eng.dataRequests.filter(d => d.status === 'delivered').length;
            const totalDR = eng.dataRequests.length;
            const openFindings = eng.findings.filter(f => f.status !== 'closed').length;

            return (
              <Card
                key={eng.id}
                className="p-5 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/audit/${eng.id}`)}
              >
                <div className="flex flex-col gap-3">
                  {/* Title row */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-[#F39200] font-bold">{eng.engagementNumber}</span>
                        {eng.status === 'completed' ? (
                          <Badge variant="success"><CheckCircle2 className="w-3 h-3" />{isAr ? 'مكتمل' : 'Completed'}</Badge>
                        ) : (
                          <Badge variant="info"><Clock className="w-3 h-3" />{phaseLabel(eng.currentPhase)}</Badge>
                        )}
                      </div>
                      <h3 className="font-semibold">{isAr ? eng.titleAr : eng.titleEn || eng.titleAr}</h3>
                      {eng.auditorName && <p className="text-xs text-[var(--foreground-secondary)] mt-0.5">{eng.auditorName}</p>}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteId(eng.id); }}
                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Phase progress mini bar */}
                  <div className="flex items-center gap-1">
                    {PHASES.map((p, i) => (
                      <React.Fragment key={p}>
                        <div className={`w-3 h-3 rounded-full shrink-0 ${
                          i < phaseIdx ? 'bg-green-500' :
                          i === phaseIdx ? 'bg-[#F39200]' :
                          'bg-[var(--border)]'
                        }`} />
                        {i < PHASES.length - 1 && (
                          <div className={`flex-1 h-0.5 ${i < phaseIdx ? 'bg-green-500' : 'bg-[var(--border)]'}`} />
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Stats row */}
                  <div className="flex gap-4 text-xs text-[var(--foreground-secondary)]">
                    {totalDR > 0 && (
                      <span>{isAr ? `طلبات البيانات: ${delivered}/${totalDR}` : `Data Requests: ${delivered}/${totalDR}`}</span>
                    )}
                    {eng.findings.length > 0 && (
                      <span>{isAr ? `ملاحظات: ${eng.findings.length}` : `Findings: ${eng.findings.length}`}
                        {openFindings > 0 && <span className="text-amber-600"> ({openFindings} {isAr ? 'مفتوحة' : 'open'})</span>}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title={isAr ? 'مراجعة داخلية جديدة' : 'New Audit Engagement'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{isAr ? 'عنوان المراجعة (عربي) *' : 'Audit Title (Arabic) *'}</label>
            <input value={form.titleAr} onChange={e => setForm({ ...form, titleAr: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
              placeholder={isAr ? 'مثال: Order to Cash & Procure to Pay' : 'e.g. Order to Cash & Procure to Pay'} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{isAr ? 'عنوان المراجعة (إنجليزي)' : 'Audit Title (English)'}</label>
            <input value={form.titleEn} onChange={e => setForm({ ...form, titleEn: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm" dir="ltr" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{isAr ? 'جهة المراجعة' : 'Auditor'}</label>
            <input value={form.auditorName} onChange={e => setForm({ ...form, auditorName: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
              placeholder={isAr ? 'مثال: KPMG' : 'e.g. KPMG'} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{isAr ? 'النطاق' : 'Scope'}</label>
            <textarea value={form.scopeAr} onChange={e => setForm({ ...form, scopeAr: e.target.value })} rows={2}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm resize-none" />
          </div>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowCreate(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
          <Button onClick={handleCreate} disabled={creating || !form.titleAr.trim()}>
            {creating && <Loader2 className="w-4 h-4 animate-spin" />}
            {isAr ? 'إنشاء' : 'Create'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title={isAr ? 'حذف المراجعة' : 'Delete Audit'}>
        <p className="text-[var(--foreground-secondary)]">
          {isAr ? 'هل أنت متأكد؟ سيتم حذف جميع البيانات المرتبطة.' : 'Are you sure? All related data will be deleted.'}
        </p>
        <ModalFooter>
          <Button variant="outline" onClick={() => setDeleteId(null)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isAr ? 'حذف' : 'Delete'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
