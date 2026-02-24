'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import {
  Check,
  X,
  Clock,
  AlertCircle,
  Send,
  Eye,
  Edit3,
  Loader2,
  MessageSquare,
  User,
  Calendar,
  Building2,
  Gauge,
  RefreshCw,
} from 'lucide-react';

interface RiskApprovalRequest {
  id: string;
  riskId: string;
  status: string;
  reviewNoteAr: string | null;
  reviewNoteEn: string | null;
  reviewedAt: string | null;
  createdAt: string;
  risk: {
    id: string;
    riskNumber: string;
    titleAr: string;
    titleEn: string;
    descriptionAr: string;
    descriptionEn: string;
    processText: string | null;
    subProcessText: string | null;
    potentialCauseAr: string | null;
    potentialCauseEn: string | null;
    potentialImpactAr: string | null;
    potentialImpactEn: string | null;
    inherentLikelihood: number;
    inherentImpact: number;
    inherentScore: number;
    inherentRating: string;
    layersOfProtectionAr: string | null;
    layersOfProtectionEn: string | null;
    mitigationActionsAr: string | null;
    mitigationActionsEn: string | null;
    status: string;
    approvalStatus: string;
    issuedBy: string | null;
    category: {
      id: string;
      code: string;
      nameAr: string;
      nameEn: string;
    } | null;
    department: {
      id: string;
      code: string;
      nameAr: string;
      nameEn: string;
    };
    riskOwner: {
      id: string;
      fullName: string;
      fullNameEn: string | null;
    } | null;
    champion: {
      id: string;
      fullName: string;
      fullNameEn: string | null;
    } | null;
  };
  requester: {
    id: string;
    fullName: string;
    fullNameEn: string | null;
    email: string;
  };
  reviewer: {
    id: string;
    fullName: string;
    fullNameEn: string | null;
  } | null;
}

export default function RiskApprovalsPage() {
  const { t, language } = useTranslation();
  const isAr = language === 'ar';
  const searchParams = useSearchParams();
  const requestIdFromUrl = searchParams.get('id');

  const [requests, setRequests] = useState<RiskApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<RiskApprovalRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'defer' | 'request_revision' | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('pending');

  // جلب طلبات الاعتماد
  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);

      const response = await fetch(`/api/risk-approval-requests?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setRequests(data.data || []);

        // إذا كان هناك معرف طلب في URL، افتح تفاصيله
        if (requestIdFromUrl) {
          const targetRequest = (data.data || []).find((r: RiskApprovalRequest) => r.id === requestIdFromUrl);
          if (targetRequest) {
            setSelectedRequest(targetRequest);
            setShowDetailModal(true);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching approval requests:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus, requestIdFromUrl]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // تنفيذ إجراء المراجعة
  const handleAction = async () => {
    if (!selectedRequest || !actionType) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/risk-approval-requests/${selectedRequest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType,
          noteAr: actionNote,
          noteEn: actionNote,
        }),
      });

      if (response.ok) {
        setShowActionModal(false);
        setShowDetailModal(false);
        setActionNote('');
        setActionType(null);
        setSelectedRequest(null);
        fetchRequests();
      } else {
        const error = await response.json();
        alert(error.error || 'فشل في تنفيذ الإجراء');
      }
    } catch (error) {
      console.error('Error performing action:', error);
      alert('حدث خطأ أثناء تنفيذ الإجراء');
    } finally {
      setIsSubmitting(false);
    }
  };

  // فتح نافذة الإجراء
  const openActionModal = (action: 'approve' | 'reject' | 'defer' | 'request_revision') => {
    setActionType(action);
    setShowActionModal(true);
  };

  // الحصول على لون شارة الحالة
  const getStatusBadgeVariant = (status: string): 'warning' | 'success' | 'critical' | 'info' | 'default' => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'critical';
      case 'deferred': return 'info';
      case 'revision_requested': return 'default';
      default: return 'default';
    }
  };

  // ترجمة حالة الطلب
  const getStatusLabel = (status: string): string => {
    const labels: Record<string, { ar: string; en: string }> = {
      pending: { ar: 'في انتظار المراجعة', en: 'Pending Review' },
      approved: { ar: 'معتمد', en: 'Approved' },
      rejected: { ar: 'مرفوض', en: 'Rejected' },
      deferred: { ar: 'مؤجل', en: 'Deferred' },
      revision_requested: { ar: 'مطلوب تعديل', en: 'Revision Requested' },
    };
    return isAr ? labels[status]?.ar || status : labels[status]?.en || status;
  };

  // ترجمة نوع الإجراء
  const getActionLabel = (action: string): string => {
    const labels: Record<string, { ar: string; en: string }> = {
      approve: { ar: 'اعتماد الخطر', en: 'Approve Risk' },
      reject: { ar: 'رفض الخطر', en: 'Reject Risk' },
      defer: { ar: 'تأجيل النظر', en: 'Defer Review' },
      request_revision: { ar: 'طلب تعديل', en: 'Request Revision' },
    };
    return isAr ? labels[action]?.ar || action : labels[action]?.en || action;
  };

  // الحصول على لون تصنيف الخطر
  const getRatingColor = (rating: string): string => {
    switch (rating) {
      case 'Critical': return 'bg-red-500';
      case 'Major': return 'bg-orange-500';
      case 'Moderate': return 'bg-yellow-500';
      case 'Minor': return 'bg-blue-500';
      case 'Negligible': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            {isAr ? 'اعتمادات المخاطر' : 'Risk Approvals'}
          </h1>
          <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
            {isAr ? 'مراجعة واعتماد المخاطر المقدمة' : 'Review and approve submitted risks'}
          </p>
        </div>
        <Button variant="outline" onClick={fetchRequests} leftIcon={<RefreshCw className="h-4 w-4" />}>
          {isAr ? 'تحديث' : 'Refresh'}
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          {['pending', 'approved', 'rejected', 'deferred', 'revision_requested', ''].map((status) => (
            <Button
              key={status || 'all'}
              variant={filterStatus === status ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus(status)}
            >
              {status === '' ? (isAr ? 'الكل' : 'All') : getStatusLabel(status)}
            </Button>
          ))}
        </div>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card className="p-12 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[var(--primary)]" />
          <p className="mt-4 text-[var(--foreground-secondary)]">
            {isAr ? 'جاري التحميل...' : 'Loading...'}
          </p>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && requests.length === 0 && (
        <Card className="p-12 text-center">
          <Check className="mx-auto h-12 w-12 text-green-500" />
          <p className="mt-4 text-lg font-medium text-[var(--foreground)]">
            {isAr ? 'لا توجد طلبات معلقة' : 'No pending requests'}
          </p>
          <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
            {isAr ? 'جميع طلبات الاعتماد تمت مراجعتها' : 'All approval requests have been reviewed'}
          </p>
        </Card>
      )}

      {/* Requests List */}
      {!isLoading && requests.length > 0 && (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <code className="rounded bg-[var(--background-tertiary)] px-2 py-0.5 text-sm font-mono">
                      {request.risk.riskNumber}
                    </code>
                    <Badge variant={getStatusBadgeVariant(request.status)}>
                      {getStatusLabel(request.status)}
                    </Badge>
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-white text-xs ${getRatingColor(request.risk.inherentRating)}`}>
                      <Gauge className="h-3 w-3" />
                      {request.risk.inherentRating}
                    </div>
                  </div>

                  <h3 className="font-semibold text-[var(--foreground)] truncate">
                    {isAr ? request.risk.titleAr : request.risk.titleEn}
                  </h3>

                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-[var(--foreground-secondary)]">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {isAr ? request.risk.department?.nameAr : request.risk.department?.nameEn}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {isAr ? request.requester.fullName : (request.requester.fullNameEn || request.requester.fullName)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(request.createdAt).toLocaleDateString(isAr ? 'ar-SA-u-ca-gregory' : 'en-US')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedRequest(request);
                      setShowDetailModal(true);
                    }}
                    leftIcon={<Eye className="h-4 w-4" />}
                  >
                    {isAr ? 'عرض' : 'View'}
                  </Button>

                  {request.status === 'pending' && (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          openActionModal('approve');
                        }}
                        leftIcon={<Check className="h-4 w-4" />}
                      >
                        {isAr ? 'اعتماد' : 'Approve'}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedRequest(null);
        }}
        title={isAr ? 'تفاصيل طلب الاعتماد' : 'Approval Request Details'}
        size="xl"
      >
        {selectedRequest && (
          <div className="space-y-6">
            {/* Risk Header */}
            <div className="flex items-start justify-between border-b border-[var(--border)] pb-4">
              <div>
                <code className="rounded bg-[var(--background-tertiary)] px-3 py-1 text-sm font-mono">
                  {selectedRequest.risk.riskNumber}
                </code>
                <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                  {isAr ? selectedRequest.risk.titleAr : selectedRequest.risk.titleEn}
                </h3>
              </div>
              <Badge variant={getStatusBadgeVariant(selectedRequest.status)} className="text-sm">
                {getStatusLabel(selectedRequest.status)}
              </Badge>
            </div>

            {/* Risk Details Grid */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Description */}
              <div className="md:col-span-2">
                <h4 className="text-sm font-medium text-[var(--foreground-secondary)] mb-2">
                  {isAr ? 'الوصف' : 'Description'}
                </h4>
                <p className="text-[var(--foreground)]">
                  {isAr ? selectedRequest.risk.descriptionAr : selectedRequest.risk.descriptionEn}
                </p>
              </div>

              {/* Classification */}
              <div>
                <h4 className="text-sm font-medium text-[var(--foreground-secondary)] mb-2">
                  {isAr ? 'التصنيف' : 'Classification'}
                </h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-[var(--foreground-muted)]">{isAr ? 'الفئة:' : 'Category:'}</span> {isAr ? selectedRequest.risk.category?.nameAr : selectedRequest.risk.category?.nameEn}</p>
                  <p><span className="text-[var(--foreground-muted)]">{isAr ? 'الوظيفة:' : 'Function:'}</span> {isAr ? selectedRequest.risk.department?.nameAr : selectedRequest.risk.department?.nameEn}</p>
                  {selectedRequest.risk.processText && <p><span className="text-[var(--foreground-muted)]">{isAr ? 'العملية:' : 'Process:'}</span> {selectedRequest.risk.processText}</p>}
                  {selectedRequest.risk.subProcessText && <p><span className="text-[var(--foreground-muted)]">{isAr ? 'العملية الفرعية:' : 'Sub Process:'}</span> {selectedRequest.risk.subProcessText}</p>}
                </div>
              </div>

              {/* Assessment */}
              <div>
                <h4 className="text-sm font-medium text-[var(--foreground-secondary)] mb-2">
                  {isAr ? 'التقييم' : 'Assessment'}
                </h4>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-xs text-[var(--foreground-muted)]">{isAr ? 'الاحتمالية' : 'Likelihood'}</p>
                    <p className="text-2xl font-bold">{selectedRequest.risk.inherentLikelihood}</p>
                  </div>
                  <span className="text-xl">×</span>
                  <div className="text-center">
                    <p className="text-xs text-[var(--foreground-muted)]">{isAr ? 'التأثير' : 'Impact'}</p>
                    <p className="text-2xl font-bold">{selectedRequest.risk.inherentImpact}</p>
                  </div>
                  <span className="text-xl">=</span>
                  <div className="text-center">
                    <p className="text-xs text-[var(--foreground-muted)]">{isAr ? 'النتيجة' : 'Score'}</p>
                    <p className="text-2xl font-bold">{selectedRequest.risk.inherentScore}</p>
                  </div>
                  <div className={`px-3 py-1 rounded text-white font-medium ${getRatingColor(selectedRequest.risk.inherentRating)}`}>
                    {selectedRequest.risk.inherentRating}
                  </div>
                </div>
              </div>

              {/* Potential Cause */}
              {(selectedRequest.risk.potentialCauseAr || selectedRequest.risk.potentialCauseEn) && (
                <div>
                  <h4 className="text-sm font-medium text-[var(--foreground-secondary)] mb-2">
                    {isAr ? 'السبب المحتمل' : 'Potential Cause'}
                  </h4>
                  <p className="text-sm text-[var(--foreground)]">
                    {isAr ? selectedRequest.risk.potentialCauseAr : selectedRequest.risk.potentialCauseEn}
                  </p>
                </div>
              )}

              {/* Potential Impact */}
              {(selectedRequest.risk.potentialImpactAr || selectedRequest.risk.potentialImpactEn) && (
                <div>
                  <h4 className="text-sm font-medium text-[var(--foreground-secondary)] mb-2">
                    {isAr ? 'التأثير المحتمل' : 'Potential Impact'}
                  </h4>
                  <p className="text-sm text-[var(--foreground)]">
                    {isAr ? selectedRequest.risk.potentialImpactAr : selectedRequest.risk.potentialImpactEn}
                  </p>
                </div>
              )}

              {/* Existing Controls */}
              {(selectedRequest.risk.layersOfProtectionAr || selectedRequest.risk.layersOfProtectionEn) && (
                <div>
                  <h4 className="text-sm font-medium text-[var(--foreground-secondary)] mb-2">
                    {isAr ? 'الضوابط الحالية' : 'Existing Controls'}
                  </h4>
                  <p className="text-sm text-[var(--foreground)]">
                    {isAr ? selectedRequest.risk.layersOfProtectionAr : selectedRequest.risk.layersOfProtectionEn}
                  </p>
                </div>
              )}

              {/* Responsible */}
              <div>
                <h4 className="text-sm font-medium text-[var(--foreground-secondary)] mb-2">
                  {isAr ? 'المسؤولون' : 'Responsible'}
                </h4>
                <div className="space-y-1 text-sm">
                  {selectedRequest.risk.riskOwner && (
                    <p>
                      <span className="text-[var(--foreground-muted)]">{isAr ? 'مالك الخطر:' : 'Risk Owner:'}</span>{' '}
                      {isAr ? selectedRequest.risk.riskOwner.fullName : (selectedRequest.risk.riskOwner.fullNameEn || selectedRequest.risk.riskOwner.fullName)}
                    </p>
                  )}
                  {selectedRequest.risk.champion && (
                    <p>
                      <span className="text-[var(--foreground-muted)]">{isAr ? 'رائد المخاطر:' : 'Risk Champion:'}</span>{' '}
                      {isAr ? selectedRequest.risk.champion.fullName : (selectedRequest.risk.champion.fullNameEn || selectedRequest.risk.champion.fullName)}
                    </p>
                  )}
                </div>
              </div>

              {/* Requester Info */}
              <div className="md:col-span-2 border-t border-[var(--border)] pt-4">
                <h4 className="text-sm font-medium text-[var(--foreground-secondary)] mb-2">
                  {isAr ? 'معلومات الطلب' : 'Request Info'}
                </h4>
                <div className="flex flex-wrap gap-4 text-sm">
                  <p>
                    <span className="text-[var(--foreground-muted)]">{isAr ? 'مقدم الطلب:' : 'Submitted by:'}</span>{' '}
                    {isAr ? selectedRequest.requester.fullName : (selectedRequest.requester.fullNameEn || selectedRequest.requester.fullName)}
                  </p>
                  <p>
                    <span className="text-[var(--foreground-muted)]">{isAr ? 'تاريخ الإرسال:' : 'Submitted on:'}</span>{' '}
                    {new Date(selectedRequest.createdAt).toLocaleDateString(isAr ? 'ar-SA-u-ca-gregory' : 'en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {/* Review Notes (if any) */}
              {selectedRequest.reviewNoteAr && (
                <div className="md:col-span-2 border-t border-[var(--border)] pt-4">
                  <h4 className="text-sm font-medium text-[var(--foreground-secondary)] mb-2">
                    {isAr ? 'ملاحظات المراجعة' : 'Review Notes'}
                  </h4>
                  <p className="text-sm text-[var(--foreground)] bg-[var(--background-secondary)] p-3 rounded">
                    {isAr ? selectedRequest.reviewNoteAr : selectedRequest.reviewNoteEn}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedRequest?.status === 'pending' && (
          <ModalFooter>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                onClick={() => openActionModal('approve')}
                leftIcon={<Check className="h-4 w-4" />}
              >
                {isAr ? 'قبول' : 'Approve'}
              </Button>
              <Button
                variant="outline"
                onClick={() => openActionModal('request_revision')}
                leftIcon={<Edit3 className="h-4 w-4" />}
              >
                {isAr ? 'طلب تعديل' : 'Request Revision'}
              </Button>
              <Button
                variant="outline"
                onClick={() => openActionModal('defer')}
                leftIcon={<Clock className="h-4 w-4" />}
              >
                {isAr ? 'تأجيل' : 'Defer'}
              </Button>
              <Button
                variant="outline"
                className="text-red-500 border-red-500 hover:bg-red-50"
                onClick={() => openActionModal('reject')}
                leftIcon={<X className="h-4 w-4" />}
              >
                {isAr ? 'رفض' : 'Reject'}
              </Button>
            </div>
          </ModalFooter>
        )}
      </Modal>

      {/* Action Confirmation Modal */}
      <Modal
        isOpen={showActionModal}
        onClose={() => {
          setShowActionModal(false);
          setActionType(null);
          setActionNote('');
        }}
        title={actionType ? getActionLabel(actionType) : ''}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-[var(--foreground-secondary)]">
            {isAr
              ? `هل أنت متأكد من ${getActionLabel(actionType || '')} للخطر "${selectedRequest?.risk.riskNumber}"؟`
              : `Are you sure you want to ${getActionLabel(actionType || '')} risk "${selectedRequest?.risk.riskNumber}"?`}
          </p>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              {isAr ? 'ملاحظات (اختياري)' : 'Notes (optional)'}
            </label>
            <textarea
              className="flex min-h-24 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-20"
              value={actionNote}
              onChange={(e) => setActionNote(e.target.value)}
              placeholder={isAr ? 'أضف ملاحظات للمستخدم...' : 'Add notes for the user...'}
            />
          </div>
        </div>

        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => {
              setShowActionModal(false);
              setActionType(null);
              setActionNote('');
            }}
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button
            variant={actionType === 'approve' ? 'primary' : actionType === 'reject' ? 'secondary' : 'outline'}
            onClick={handleAction}
            disabled={isSubmitting}
            leftIcon={isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
          >
            {isSubmitting
              ? (isAr ? 'جاري التنفيذ...' : 'Processing...')
              : (isAr ? 'تأكيد' : 'Confirm')}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
