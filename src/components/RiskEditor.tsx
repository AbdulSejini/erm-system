'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import {
  Save,
  Trash2,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  X,
} from 'lucide-react';

interface Risk {
  id: string;
  riskNumber: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  categoryId: string | null;
  departmentId: string;
  inherentLikelihood: number;
  inherentImpact: number;
  inherentScore: number;
  inherentRating: string;
  residualLikelihood: number | null;
  residualImpact: number | null;
  residualScore: number | null;
  residualRating: string | null;
  status: string;
  ownerId: string;
  mitigationActionsAr: string | null;
  mitigationActionsEn: string | null;
  potentialCauseAr: string | null;
  potentialCauseEn: string | null;
  potentialImpactAr: string | null;
  potentialImpactEn: string | null;
  category?: { id: string; nameAr: string; nameEn: string } | null;
  department?: { id: string; nameAr: string; nameEn: string };
  owner?: { id: string; fullName: string; fullNameEn: string | null };
}

interface Department {
  id: string;
  nameAr: string;
  nameEn: string;
  code: string;
}

interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  code: string;
}

interface User {
  id: string;
  fullName: string;
  fullNameEn: string | null;
}

interface EditedCell {
  riskId: string;
  field: string;
  value: string | number | null;
}

const statusOptions = [
  { value: 'open', labelAr: 'مفتوح', labelEn: 'Open' },
  { value: 'inProgress', labelAr: 'قيد المعالجة', labelEn: 'In Progress' },
  { value: 'mitigated', labelAr: 'تم التخفيف', labelEn: 'Mitigated' },
  { value: 'closed', labelAr: 'مغلق', labelEn: 'Closed' },
  { value: 'accepted', labelAr: 'مقبول', labelEn: 'Accepted' },
];

const ratingOptions = [
  { value: 'Critical', labelAr: 'حرج', labelEn: 'Critical', color: 'bg-red-500' },
  { value: 'Major', labelAr: 'عالي', labelEn: 'Major', color: 'bg-orange-500' },
  { value: 'Moderate', labelAr: 'متوسط', labelEn: 'Moderate', color: 'bg-yellow-500' },
  { value: 'Minor', labelAr: 'منخفض', labelEn: 'Minor', color: 'bg-blue-500' },
  { value: 'Negligible', labelAr: 'ضئيل', labelEn: 'Negligible', color: 'bg-green-500' },
];

export default function RiskEditor() {
  const { language } = useTranslation();
  const isAr = language === 'ar';

  const [risks, setRisks] = useState<Risk[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');

  // Editing state
  const [editedCells, setEditedCells] = useState<Map<string, EditedCell>>(new Map());
  const [selectedRisks, setSelectedRisks] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // New risk form
  const [newRisk, setNewRisk] = useState({
    riskNumber: '',
    titleAr: '',
    titleEn: '',
    descriptionAr: '',
    descriptionEn: '',
    departmentId: '',
    categoryId: '',
    inherentLikelihood: 3,
    inherentImpact: 3,
    status: 'open',
    ownerId: '',
  });

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [risksRes, deptRes, catRes, usersRes] = await Promise.all([
        fetch('/api/risks'),
        fetch('/api/departments'),
        fetch('/api/categories'),
        fetch('/api/users'),
      ]);

      const risksData = await risksRes.json();
      const deptData = await deptRes.json();
      const catData = await catRes.json();
      const usersData = await usersRes.json();

      if (risksData.success) setRisks(risksData.data);
      if (deptData.success) setDepartments(deptData.data);
      if (catData.success) setCategories(catData.data);
      if (usersData.success) setUsers(usersData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      showNotification('error', isAr ? 'فشل في جلب البيانات' : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [isAr]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Show notification
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Handle cell edit
  const handleCellEdit = (riskId: string, field: string, value: string | number | null) => {
    const key = `${riskId}-${field}`;
    const newEditedCells = new Map(editedCells);
    newEditedCells.set(key, { riskId, field, value });
    setEditedCells(newEditedCells);

    // Update local state for immediate feedback
    setRisks(prev => prev.map(risk => {
      if (risk.id === riskId) {
        const updated = { ...risk, [field]: value };
        // Recalculate score if likelihood or impact changed
        if (field === 'inherentLikelihood' || field === 'inherentImpact') {
          const likelihood = field === 'inherentLikelihood' ? Number(value) : risk.inherentLikelihood;
          const impact = field === 'inherentImpact' ? Number(value) : risk.inherentImpact;
          updated.inherentScore = likelihood * impact;
          updated.inherentRating = calculateRating(updated.inherentScore);
        }
        if (field === 'residualLikelihood' || field === 'residualImpact') {
          const likelihood = field === 'residualLikelihood' ? Number(value) : (risk.residualLikelihood || 0);
          const impact = field === 'residualImpact' ? Number(value) : (risk.residualImpact || 0);
          if (likelihood && impact) {
            updated.residualScore = likelihood * impact;
            updated.residualRating = calculateRating(updated.residualScore);
          }
        }
        return updated;
      }
      return risk;
    }));
  };

  // Calculate rating from score
  const calculateRating = (score: number): string => {
    if (score >= 20) return 'Critical';
    if (score >= 15) return 'Major';
    if (score >= 10) return 'Moderate';
    if (score >= 5) return 'Minor';
    return 'Negligible';
  };

  // Save changes
  const saveChanges = async () => {
    if (editedCells.size === 0) return;

    setSaving(true);
    try {
      // Group edits by risk
      const riskUpdates = new Map<string, Record<string, unknown>>();
      editedCells.forEach(edit => {
        if (!riskUpdates.has(edit.riskId)) {
          riskUpdates.set(edit.riskId, {});
        }
        riskUpdates.get(edit.riskId)![edit.field] = edit.value;
      });

      // Send updates
      const promises = Array.from(riskUpdates.entries()).map(([riskId, updates]) =>
        fetch(`/api/risks/${riskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })
      );

      const results = await Promise.all(promises);
      const allSuccess = results.every(r => r.ok);

      if (allSuccess) {
        setEditedCells(new Map());
        showNotification('success', isAr ? 'تم حفظ التغييرات بنجاح' : 'Changes saved successfully');
        fetchData();
      } else {
        showNotification('error', isAr ? 'فشل في حفظ بعض التغييرات' : 'Failed to save some changes');
      }
    } catch (error) {
      console.error('Error saving:', error);
      showNotification('error', isAr ? 'فشل في حفظ التغييرات' : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // Delete selected risks
  const deleteSelectedRisks = async () => {
    if (selectedRisks.size === 0) return;

    setSaving(true);
    try {
      const promises = Array.from(selectedRisks).map(riskId =>
        fetch(`/api/risks/${riskId}`, { method: 'DELETE' })
      );

      await Promise.all(promises);
      setSelectedRisks(new Set());
      setShowDeleteModal(false);
      showNotification('success', isAr ? 'تم حذف المخاطر بنجاح' : 'Risks deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
      showNotification('error', isAr ? 'فشل في حذف المخاطر' : 'Failed to delete risks');
    } finally {
      setSaving(false);
    }
  };

  // Add new risk
  const addNewRisk = async () => {
    if (!newRisk.riskNumber || !newRisk.titleAr || !newRisk.departmentId) {
      showNotification('error', isAr ? 'يرجى ملء الحقول المطلوبة' : 'Please fill required fields');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/risks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newRisk,
          inherentScore: newRisk.inherentLikelihood * newRisk.inherentImpact,
          inherentRating: calculateRating(newRisk.inherentLikelihood * newRisk.inherentImpact),
        }),
      });

      if (response.ok) {
        setShowAddModal(false);
        setNewRisk({
          riskNumber: '',
          titleAr: '',
          titleEn: '',
          descriptionAr: '',
          descriptionEn: '',
          departmentId: '',
          categoryId: '',
          inherentLikelihood: 3,
          inherentImpact: 3,
          status: 'open',
          ownerId: '',
        });
        showNotification('success', isAr ? 'تم إضافة الخطر بنجاح' : 'Risk added successfully');
        fetchData();
      } else {
        showNotification('error', isAr ? 'فشل في إضافة الخطر' : 'Failed to add risk');
      }
    } catch (error) {
      console.error('Error adding risk:', error);
      showNotification('error', isAr ? 'فشل في إضافة الخطر' : 'Failed to add risk');
    } finally {
      setSaving(false);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      'Risk_ID', 'Title_AR', 'Title_EN', 'Department', 'Category',
      'Likelihood', 'Impact', 'Score', 'Rating', 'Status', 'Owner',
      'Potential_Cause_AR', 'Potential_Cause_EN', 'Potential_Impact_AR', 'Potential_Impact_EN'
    ];

    const rows = filteredRisks.map(risk => [
      risk.riskNumber,
      risk.titleAr,
      risk.titleEn,
      isAr ? risk.department?.nameAr : risk.department?.nameEn,
      isAr ? risk.category?.nameAr : risk.category?.nameEn,
      risk.inherentLikelihood,
      risk.inherentImpact,
      risk.inherentScore,
      risk.inherentRating,
      risk.status,
      isAr ? risk.owner?.fullName : risk.owner?.fullNameEn,
      risk.potentialCauseAr || '',
      risk.potentialCauseEn || '',
      risk.potentialImpactAr || '',
      risk.potentialImpactEn || '',
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell || ''}"`).join(','))
      .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `risks_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Filter risks
  const filteredRisks = risks.filter(risk => {
    const matchesSearch = !searchQuery ||
      risk.riskNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      risk.titleAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      risk.titleEn.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = !filterStatus || risk.status === filterStatus;
    const matchesDepartment = !filterDepartment || risk.departmentId === filterDepartment;

    return matchesSearch && matchesStatus && matchesDepartment;
  });

  // Pagination
  const totalPages = Math.ceil(filteredRisks.length / itemsPerPage);
  const paginatedRisks = filteredRisks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get rating color
  const getRatingColor = (rating: string) => {
    const option = ratingOptions.find(r => r.value === rating);
    return option?.color || 'bg-gray-500';
  };

  // Check if cell is edited
  const isCellEdited = (riskId: string, field: string) => {
    return editedCells.has(`${riskId}-${field}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 ${isAr ? 'left-4' : 'right-4'} z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {notification.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          {notification.message}
          <button onClick={() => setNotification(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--card-bg)] p-3 rounded-lg border border-[var(--border)]">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground-secondary)]" />
            <input
              type="text"
              placeholder={isAr ? 'بحث...' : 'Search...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9 pe-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] w-48"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          >
            <option value="">{isAr ? 'جميع الحالات' : 'All Statuses'}</option>
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {isAr ? opt.labelAr : opt.labelEn}
              </option>
            ))}
          </select>

          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          >
            <option value="">{isAr ? 'جميع الإدارات' : 'All Departments'}</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>
                {isAr ? dept.nameAr : dept.nameEn}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setShowAddModal(true)}
          >
            {isAr ? 'إضافة' : 'Add'}
          </Button>

          {selectedRisks.size > 0 && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Trash2 className="h-4 w-4" />}
              onClick={() => setShowDeleteModal(true)}
              className="text-red-500 border-red-500 hover:bg-red-50"
            >
              {isAr ? `حذف (${selectedRisks.size})` : `Delete (${selectedRisks.size})`}
            </Button>
          )}

          {editedCells.size > 0 && (
            <Button
              size="sm"
              leftIcon={<Save className="h-4 w-4" />}
              onClick={saveChanges}
              disabled={saving}
            >
              {saving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? `حفظ (${editedCells.size})` : `Save (${editedCells.size})`)}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={exportToCSV}
          >
            {isAr ? 'تصدير' : 'Export'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={fetchData}
          >
            {isAr ? 'تحديث' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-[var(--foreground-secondary)]">
        <span>{isAr ? `إجمالي: ${filteredRisks.length}` : `Total: ${filteredRisks.length}`}</span>
        {editedCells.size > 0 && (
          <span className="text-orange-500">
            {isAr ? `${editedCells.size} تغيير غير محفوظ` : `${editedCells.size} unsaved changes`}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-[var(--border)] rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-[var(--background-secondary)] sticky top-0">
            <tr>
              <th className="p-2 border-b border-[var(--border)] w-10">
                <input
                  type="checkbox"
                  checked={selectedRisks.size === paginatedRisks.length && paginatedRisks.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRisks(new Set(paginatedRisks.map(r => r.id)));
                    } else {
                      setSelectedRisks(new Set());
                    }
                  }}
                  className="rounded"
                />
              </th>
              <th className="p-2 border-b border-[var(--border)] text-start font-medium min-w-[100px]">
                {isAr ? 'رقم الخطر' : 'Risk ID'}
              </th>
              <th className="p-2 border-b border-[var(--border)] text-start font-medium min-w-[200px]">
                {isAr ? 'العنوان (عربي)' : 'Title (AR)'}
              </th>
              <th className="p-2 border-b border-[var(--border)] text-start font-medium min-w-[200px]">
                {isAr ? 'العنوان (إنجليزي)' : 'Title (EN)'}
              </th>
              <th className="p-2 border-b border-[var(--border)] text-start font-medium min-w-[120px]">
                {isAr ? 'الإدارة' : 'Department'}
              </th>
              <th className="p-2 border-b border-[var(--border)] text-start font-medium min-w-[120px]">
                {isAr ? 'التصنيف' : 'Category'}
              </th>
              <th className="p-2 border-b border-[var(--border)] text-center font-medium w-20">
                {isAr ? 'الاحتمالية' : 'Likelihood'}
              </th>
              <th className="p-2 border-b border-[var(--border)] text-center font-medium w-20">
                {isAr ? 'التأثير' : 'Impact'}
              </th>
              <th className="p-2 border-b border-[var(--border)] text-center font-medium w-20">
                {isAr ? 'الدرجة' : 'Score'}
              </th>
              <th className="p-2 border-b border-[var(--border)] text-center font-medium w-24">
                {isAr ? 'التصنيف' : 'Rating'}
              </th>
              <th className="p-2 border-b border-[var(--border)] text-start font-medium min-w-[100px]">
                {isAr ? 'الحالة' : 'Status'}
              </th>
              <th className="p-2 border-b border-[var(--border)] text-start font-medium min-w-[150px]">
                {isAr ? 'السبب المحتمل' : 'Potential Cause'}
              </th>
              <th className="p-2 border-b border-[var(--border)] text-start font-medium min-w-[150px]">
                {isAr ? 'التأثير المحتمل' : 'Potential Impact'}
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedRisks.map((risk, index) => (
              <tr
                key={risk.id}
                className={`${index % 2 === 0 ? 'bg-[var(--card-bg)]' : 'bg-[var(--background)]'} hover:bg-[var(--background-secondary)] transition-colors`}
              >
                <td className="p-2 border-b border-[var(--border)]">
                  <input
                    type="checkbox"
                    checked={selectedRisks.has(risk.id)}
                    onChange={(e) => {
                      const newSelected = new Set(selectedRisks);
                      if (e.target.checked) {
                        newSelected.add(risk.id);
                      } else {
                        newSelected.delete(risk.id);
                      }
                      setSelectedRisks(newSelected);
                    }}
                    className="rounded"
                  />
                </td>
                <td className="p-2 border-b border-[var(--border)]">
                  <input
                    type="text"
                    value={risk.riskNumber}
                    onChange={(e) => handleCellEdit(risk.id, 'riskNumber', e.target.value)}
                    className={`w-full px-2 py-1 text-sm bg-transparent border rounded focus:outline-none focus:ring-1 focus:ring-[var(--primary)] ${
                      isCellEdited(risk.id, 'riskNumber') ? 'border-orange-500 bg-orange-50' : 'border-transparent hover:border-[var(--border)]'
                    }`}
                  />
                </td>
                <td className="p-2 border-b border-[var(--border)]">
                  <input
                    type="text"
                    value={risk.titleAr}
                    onChange={(e) => handleCellEdit(risk.id, 'titleAr', e.target.value)}
                    className={`w-full px-2 py-1 text-sm bg-transparent border rounded focus:outline-none focus:ring-1 focus:ring-[var(--primary)] ${
                      isCellEdited(risk.id, 'titleAr') ? 'border-orange-500 bg-orange-50' : 'border-transparent hover:border-[var(--border)]'
                    }`}
                    dir="rtl"
                  />
                </td>
                <td className="p-2 border-b border-[var(--border)]">
                  <input
                    type="text"
                    value={risk.titleEn}
                    onChange={(e) => handleCellEdit(risk.id, 'titleEn', e.target.value)}
                    className={`w-full px-2 py-1 text-sm bg-transparent border rounded focus:outline-none focus:ring-1 focus:ring-[var(--primary)] ${
                      isCellEdited(risk.id, 'titleEn') ? 'border-orange-500 bg-orange-50' : 'border-transparent hover:border-[var(--border)]'
                    }`}
                    dir="ltr"
                  />
                </td>
                <td className="p-2 border-b border-[var(--border)]">
                  <select
                    value={risk.departmentId}
                    onChange={(e) => handleCellEdit(risk.id, 'departmentId', e.target.value)}
                    className={`w-full px-2 py-1 text-sm bg-transparent border rounded focus:outline-none focus:ring-1 focus:ring-[var(--primary)] ${
                      isCellEdited(risk.id, 'departmentId') ? 'border-orange-500 bg-orange-50' : 'border-transparent hover:border-[var(--border)]'
                    }`}
                  >
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {isAr ? dept.nameAr : dept.nameEn}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-2 border-b border-[var(--border)]">
                  <select
                    value={risk.categoryId || ''}
                    onChange={(e) => handleCellEdit(risk.id, 'categoryId', e.target.value || null)}
                    className={`w-full px-2 py-1 text-sm bg-transparent border rounded focus:outline-none focus:ring-1 focus:ring-[var(--primary)] ${
                      isCellEdited(risk.id, 'categoryId') ? 'border-orange-500 bg-orange-50' : 'border-transparent hover:border-[var(--border)]'
                    }`}
                  >
                    <option value="">{isAr ? 'بدون' : 'None'}</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {isAr ? cat.nameAr : cat.nameEn}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-2 border-b border-[var(--border)]">
                  <select
                    value={risk.inherentLikelihood}
                    onChange={(e) => handleCellEdit(risk.id, 'inherentLikelihood', parseInt(e.target.value))}
                    className={`w-full px-2 py-1 text-sm text-center bg-transparent border rounded focus:outline-none focus:ring-1 focus:ring-[var(--primary)] ${
                      isCellEdited(risk.id, 'inherentLikelihood') ? 'border-orange-500 bg-orange-50' : 'border-transparent hover:border-[var(--border)]'
                    }`}
                  >
                    {[1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </td>
                <td className="p-2 border-b border-[var(--border)]">
                  <select
                    value={risk.inherentImpact}
                    onChange={(e) => handleCellEdit(risk.id, 'inherentImpact', parseInt(e.target.value))}
                    className={`w-full px-2 py-1 text-sm text-center bg-transparent border rounded focus:outline-none focus:ring-1 focus:ring-[var(--primary)] ${
                      isCellEdited(risk.id, 'inherentImpact') ? 'border-orange-500 bg-orange-50' : 'border-transparent hover:border-[var(--border)]'
                    }`}
                  >
                    {[1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </td>
                <td className="p-2 border-b border-[var(--border)] text-center font-medium">
                  {risk.inherentScore}
                </td>
                <td className="p-2 border-b border-[var(--border)]">
                  <span className={`inline-block px-2 py-1 text-xs text-white rounded ${getRatingColor(risk.inherentRating)}`}>
                    {risk.inherentRating}
                  </span>
                </td>
                <td className="p-2 border-b border-[var(--border)]">
                  <select
                    value={risk.status}
                    onChange={(e) => handleCellEdit(risk.id, 'status', e.target.value)}
                    className={`w-full px-2 py-1 text-sm bg-transparent border rounded focus:outline-none focus:ring-1 focus:ring-[var(--primary)] ${
                      isCellEdited(risk.id, 'status') ? 'border-orange-500 bg-orange-50' : 'border-transparent hover:border-[var(--border)]'
                    }`}
                  >
                    {statusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {isAr ? opt.labelAr : opt.labelEn}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-2 border-b border-[var(--border)]">
                  <input
                    type="text"
                    value={isAr ? (risk.potentialCauseAr || '') : (risk.potentialCauseEn || '')}
                    onChange={(e) => handleCellEdit(risk.id, isAr ? 'potentialCauseAr' : 'potentialCauseEn', e.target.value)}
                    className={`w-full px-2 py-1 text-sm bg-transparent border rounded focus:outline-none focus:ring-1 focus:ring-[var(--primary)] ${
                      isCellEdited(risk.id, isAr ? 'potentialCauseAr' : 'potentialCauseEn') ? 'border-orange-500 bg-orange-50' : 'border-transparent hover:border-[var(--border)]'
                    }`}
                    dir={isAr ? 'rtl' : 'ltr'}
                    placeholder={isAr ? 'السبب المحتمل...' : 'Potential cause...'}
                  />
                </td>
                <td className="p-2 border-b border-[var(--border)]">
                  <input
                    type="text"
                    value={isAr ? (risk.potentialImpactAr || '') : (risk.potentialImpactEn || '')}
                    onChange={(e) => handleCellEdit(risk.id, isAr ? 'potentialImpactAr' : 'potentialImpactEn', e.target.value)}
                    className={`w-full px-2 py-1 text-sm bg-transparent border rounded focus:outline-none focus:ring-1 focus:ring-[var(--primary)] ${
                      isCellEdited(risk.id, isAr ? 'potentialImpactAr' : 'potentialImpactEn') ? 'border-orange-500 bg-orange-50' : 'border-transparent hover:border-[var(--border)]'
                    }`}
                    dir={isAr ? 'rtl' : 'ltr'}
                    placeholder={isAr ? 'التأثير المحتمل...' : 'Potential impact...'}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--foreground-secondary)]">
            {isAr
              ? `عرض ${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(currentPage * itemsPerPage, filteredRisks.length)} من ${filteredRisks.length}`
              : `Showing ${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(currentPage * itemsPerPage, filteredRisks.length)} of ${filteredRisks.length}`
            }
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={isAr ? 'تأكيد الحذف' : 'Confirm Delete'}
        size="sm"
      >
        <p className="text-[var(--foreground-secondary)]">
          {isAr
            ? `هل أنت متأكد من حذف ${selectedRisks.size} خطر؟ لا يمكن التراجع عن هذا الإجراء.`
            : `Are you sure you want to delete ${selectedRisks.size} risk(s)? This action cannot be undone.`
          }
        </p>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
            {isAr ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button
            variant="primary"
            onClick={deleteSelectedRisks}
            disabled={saving}
            className="bg-red-500 hover:bg-red-600"
          >
            {saving ? (isAr ? 'جاري الحذف...' : 'Deleting...') : (isAr ? 'حذف' : 'Delete')}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Add Risk Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={isAr ? 'إضافة خطر جديد' : 'Add New Risk'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={isAr ? 'رقم الخطر *' : 'Risk Number *'}
              value={newRisk.riskNumber}
              onChange={(e) => setNewRisk(prev => ({ ...prev, riskNumber: e.target.value }))}
              placeholder="e.g., FIN-R-001"
              required
            />
            <Select
              label={isAr ? 'الإدارة *' : 'Department *'}
              options={departments.map(d => ({ value: d.id, label: isAr ? d.nameAr : d.nameEn }))}
              value={newRisk.departmentId}
              onChange={(value) => setNewRisk(prev => ({ ...prev, departmentId: value }))}
              placeholder={isAr ? 'اختر الإدارة' : 'Select Department'}
            />
          </div>
          <Input
            label={isAr ? 'العنوان (عربي) *' : 'Title (Arabic) *'}
            value={newRisk.titleAr}
            onChange={(e) => setNewRisk(prev => ({ ...prev, titleAr: e.target.value }))}
            dir="rtl"
            required
          />
          <Input
            label={isAr ? 'العنوان (إنجليزي)' : 'Title (English)'}
            value={newRisk.titleEn}
            onChange={(e) => setNewRisk(prev => ({ ...prev, titleEn: e.target.value }))}
            dir="ltr"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label={isAr ? 'التصنيف' : 'Category'}
              options={[
                { value: '', label: isAr ? 'بدون' : 'None' },
                ...categories.map(c => ({ value: c.id, label: isAr ? c.nameAr : c.nameEn }))
              ]}
              value={newRisk.categoryId}
              onChange={(value) => setNewRisk(prev => ({ ...prev, categoryId: value }))}
            />
            <Select
              label={isAr ? 'الحالة' : 'Status'}
              options={statusOptions.map(s => ({ value: s.value, label: isAr ? s.labelAr : s.labelEn }))}
              value={newRisk.status}
              onChange={(value) => setNewRisk(prev => ({ ...prev, status: value }))}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label={isAr ? 'الاحتمالية' : 'Likelihood'}
              options={[1, 2, 3, 4, 5].map(n => ({ value: String(n), label: String(n) }))}
              value={String(newRisk.inherentLikelihood)}
              onChange={(value) => setNewRisk(prev => ({ ...prev, inherentLikelihood: parseInt(value) }))}
            />
            <Select
              label={isAr ? 'التأثير' : 'Impact'}
              options={[1, 2, 3, 4, 5].map(n => ({ value: String(n), label: String(n) }))}
              value={String(newRisk.inherentImpact)}
              onChange={(value) => setNewRisk(prev => ({ ...prev, inherentImpact: parseInt(value) }))}
            />
          </div>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowAddModal(false)}>
            {isAr ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button onClick={addNewRisk} disabled={saving}>
            {saving ? (isAr ? 'جاري الإضافة...' : 'Adding...') : (isAr ? 'إضافة' : 'Add')}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
