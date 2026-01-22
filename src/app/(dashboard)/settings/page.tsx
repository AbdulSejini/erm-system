'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import {
  Settings,
  Users,
  Building2,
  Tag,
  Bell,
  Database,
  Shield,
  Plus,
  Edit,
  Trash2,
  Search,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  X,
  Table2,
  Activity,
  Key,
  Lock,
  Eye,
  EyeOff,
  ShieldAlert,
  FileText,
  UserCheck,
  HardDrive,
  RefreshCw,
  Calendar,
  FileJson,
  UploadCloud,
  DownloadCloud,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { hrRisks, hrRisksSummary } from '@/data/hrRisks';
import RiskEditor from '@/components/RiskEditor';
import AuditLogTab from '@/components/AuditLogTab';

// Define all settings tabs
const allSettingsTabs = [
  { id: 'profile', icon: UserCheck },
  { id: 'changePassword', icon: Key },
  { id: 'users', icon: Users },
  { id: 'departments', icon: Building2 },
  { id: 'categories', icon: Tag },
  { id: 'sources', icon: FileText },
  { id: 'riskStatuses', icon: Activity },
  { id: 'riskOwners', icon: UserCheck },
  { id: 'notifications', icon: Bell },
  { id: 'dataManagement', icon: Database },
  { id: 'backup', icon: HardDrive },
  { id: 'auditLog', icon: Activity },
  { id: 'riskEditor', icon: Table2 },
];

// Define which tabs each role can access
// admin: full access to all tabs
// riskManager: same as admin
// riskAnalyst: only notifications (no users, departments, categories, dataManagement, auditLog, riskEditor)
// riskChampion: only notifications
// executive: only notifications
// employee: only notifications
const roleTabAccess: Record<string, string[]> = {
  admin: ['profile', 'changePassword', 'users', 'departments', 'categories', 'sources', 'riskStatuses', 'riskOwners', 'notifications', 'dataManagement', 'backup', 'auditLog', 'riskEditor'],
  riskManager: ['profile', 'changePassword', 'users', 'departments', 'categories', 'sources', 'riskStatuses', 'riskOwners', 'notifications', 'dataManagement', 'backup', 'auditLog', 'riskEditor'],
  riskAnalyst: ['profile', 'changePassword', 'notifications'],
  riskChampion: ['profile', 'changePassword', 'notifications'],
  executive: ['profile', 'changePassword', 'notifications'],
  employee: ['profile', 'changePassword', 'notifications'],
};

const mockUsers = [
  {
    id: '1',
    fullNameAr: 'عبدالإله سجيني',
    fullNameEn: 'Abdulelah Sejini',
    email: 'admin@saudicable.com',
    role: 'admin',
    departmentAr: 'إدارة المخاطر',
    departmentEn: 'Risk Management',
    status: 'active',
  },
  {
    id: '2',
    fullNameAr: 'أحمد محمد',
    fullNameEn: 'Ahmed Mohammed',
    email: 'ahmed@saudicable.com',
    role: 'riskChampion',
    departmentAr: 'سلسلة التوريد',
    departmentEn: 'Supply Chain',
    status: 'active',
  },
  {
    id: '3',
    fullNameAr: 'سارة علي',
    fullNameEn: 'Sarah Ali',
    email: 'sarah@saudicable.com',
    role: 'riskAnalyst',
    departmentAr: 'المالية',
    departmentEn: 'Finance',
    status: 'active',
  },
  {
    id: '4',
    fullNameAr: 'محمد عبدالله',
    fullNameEn: 'Mohammed Abdullah',
    email: 'mohammed@saudicable.com',
    role: 'riskChampion',
    departmentAr: 'تقنية المعلومات',
    departmentEn: 'IT',
    status: 'inactive',
  },
];

const mockDepartments = [
  { id: '1', nameAr: 'إدارة المخاطر', nameEn: 'Risk Management', code: 'RM', risksCount: 5 },
  { id: '2', nameAr: 'المالية', nameEn: 'Finance', code: 'FIN', risksCount: 8 },
  { id: '3', nameAr: 'العمليات', nameEn: 'Operations', code: 'OPS', risksCount: 12 },
  { id: '4', nameAr: 'تقنية المعلومات', nameEn: 'IT', code: 'IT', risksCount: 7 },
  { id: '5', nameAr: 'سلسلة التوريد', nameEn: 'Supply Chain', code: 'SC', risksCount: 6 },
  { id: '6', nameAr: 'السلامة والبيئة', nameEn: 'HSE', code: 'HSE', risksCount: 4 },
];

const mockCategories = [
  { id: '1', nameAr: 'مخاطر تشغيلية', nameEn: 'Operational Risks', code: 'OPR', color: 'bg-blue-500', risksCount: 15 },
  { id: '2', nameAr: 'مخاطر مالية', nameEn: 'Financial Risks', code: 'FIN', color: 'bg-green-500', risksCount: 8 },
  { id: '3', nameAr: 'مخاطر استراتيجية', nameEn: 'Strategic Risks', code: 'STR', color: 'bg-purple-500', risksCount: 5 },
  { id: '4', nameAr: 'مخاطر قانونية', nameEn: 'Legal/Compliance Risks', code: 'LEG', color: 'bg-orange-500', risksCount: 7 },
  { id: '5', nameAr: 'مخاطر تقنية', nameEn: 'Technology Risks', code: 'TEC', color: 'bg-cyan-500', risksCount: 10 },
  { id: '6', nameAr: 'مخاطر السمعة', nameEn: 'Reputational Risks', code: 'REP', color: 'bg-pink-500', risksCount: 3 },
];

const categoryColors = [
  { value: 'bg-blue-500', label: 'أزرق / Blue' },
  { value: 'bg-green-500', label: 'أخضر / Green' },
  { value: 'bg-purple-500', label: 'بنفسجي / Purple' },
  { value: 'bg-orange-500', label: 'برتقالي / Orange' },
  { value: 'bg-cyan-500', label: 'سماوي / Cyan' },
  { value: 'bg-pink-500', label: 'وردي / Pink' },
  { value: 'bg-red-500', label: 'أحمر / Red' },
  { value: 'bg-yellow-500', label: 'أصفر / Yellow' },
  { value: 'bg-indigo-500', label: 'نيلي / Indigo' },
  { value: 'bg-teal-500', label: 'أزرق مخضر / Teal' },
];

// Interfaces for API data
interface APICategory {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  color?: string | null;
  isActive: boolean;
  _count?: { risks: number };
}

interface APIDepartment {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  _count?: { risks: number };
}

interface DepartmentAccess {
  id: string;
  departmentId: string;
  canView: boolean;
  canEdit: boolean;
  department: {
    id: string;
    code: string;
    nameAr: string;
    nameEn: string;
  };
}

interface APIUser {
  id: string;
  fullName: string;
  fullNameEn?: string | null;
  email: string;
  role: string;
  status: string;
  departmentId?: string | null;
  department?: {
    id: string;
    nameAr: string;
    nameEn: string;
  } | null;
  accessibleDepartments?: DepartmentAccess[];
}

interface APISource {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  isActive: boolean;
  _count?: { risks: number };
}

interface APIRiskOwner {
  id: string;
  fullName: string;
  fullNameEn?: string | null;
  email?: string | null;
  phone?: string | null;
  departmentId?: string | null;
  department?: {
    id: string;
    code: string;
    nameAr: string;
    nameEn: string;
  } | null;
  isActive: boolean;
  _count?: { risks: number };
}

interface APIRiskStatus {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  color?: string | null;
  icon?: string | null;
  isDefault: boolean;
  isActive: boolean;
  order: number;
  _count?: { risks: number };
}

// Status color options
const statusColors = [
  { value: '#f59e0b', label: 'برتقالي / Orange' },
  { value: '#3b82f6', label: 'أزرق / Blue' },
  { value: '#10b981', label: 'أخضر / Green' },
  { value: '#6b7280', label: 'رمادي / Gray' },
  { value: '#8b5cf6', label: 'بنفسجي / Purple' },
  { value: '#ef4444', label: 'أحمر / Red' },
  { value: '#14b8a6', label: 'أزرق مخضر / Teal' },
  { value: '#ec4899', label: 'وردي / Pink' },
];

// Status icon options
const statusIcons = [
  { value: 'AlertCircle', label: 'تنبيه / Alert' },
  { value: 'Clock', label: 'ساعة / Clock' },
  { value: 'CheckCircle', label: 'تم / Check' },
  { value: 'XCircle', label: 'إغلاق / Close' },
  { value: 'Check', label: 'صح / Checkmark' },
  { value: 'Shield', label: 'درع / Shield' },
  { value: 'Flag', label: 'علم / Flag' },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const { t, language } = useTranslation();
  const searchParams = useSearchParams();
  const isAr = language === 'ar';

  // Get user role from session, default to 'employee' if not found
  const userRole = (session?.user as { role?: string })?.role || 'employee';

  // Get accessible tabs based on user role
  const accessibleTabs = useMemo(() => {
    const allowedTabIds = roleTabAccess[userRole] || roleTabAccess.employee;
    return allSettingsTabs.filter(tab => allowedTabIds.includes(tab.id));
  }, [userRole]);

  // Check if user can access a specific tab
  const canAccessTab = (tabId: string) => {
    const allowedTabIds = roleTabAccess[userRole] || roleTabAccess.employee;
    return allowedTabIds.includes(tabId);
  };

  // Get tab from URL or use first accessible tab
  const tabFromUrl = searchParams.get('tab');
  const defaultTab = (tabFromUrl && canAccessTab(tabFromUrl))
    ? tabFromUrl
    : (accessibleTabs.length > 0 ? accessibleTabs[0].id : 'profile');
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Update activeTab when URL changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && canAccessTab(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [importedRisks, setImportedRisks] = useState<typeof hrRisks>([]);
  const [showImportSuccess, setShowImportSuccess] = useState(false);
  const [importStats, setImportStats] = useState({ total: 0, added: 0, updated: 0, skipped: 0, errors: 0 });
  const [importMode, setImportMode] = useState<'addOnly' | 'updateOnly' | 'addAndUpdate'>('addAndUpdate');
  const [showImportResultModal, setShowImportResultModal] = useState(false);

  // Backup states
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [restoreResults, setRestoreResults] = useState<{
    success: boolean;
    message: string;
    results?: Record<string, number>;
    errors?: string[];
  } | null>(null);
  const backupFileInputRef = useRef<HTMLInputElement>(null);
  const [importResults, setImportResults] = useState<{
    added: string[];
    updated: string[];
    skipped: string[];
    errors: { riskId: string; error: string }[];
  }>({ added: [], updated: [], skipped: [], errors: [] });
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [showEditDeptModal, setShowEditDeptModal] = useState(false);
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
  const [showDepartmentAccessModal, setShowDepartmentAccessModal] = useState(false);
  const [selectedUserForAccess, setSelectedUserForAccess] = useState<APIUser | null>(null);
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>([]);
  const [savingAccess, setSavingAccess] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
  const [changePasswordForm, setChangePasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [selectedUser, setSelectedUser] = useState<typeof mockUsers[0] | null>(null);
  const [selectedDept, setSelectedDept] = useState<APIDepartment | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<APICategory | null>(null);
  const [selectedSource, setSelectedSource] = useState<APISource | null>(null);
  const [selectedRiskOwner, setSelectedRiskOwner] = useState<APIRiskOwner | null>(null);
  const [users, setUsers] = useState<APIUser[]>([]);
  const [departments, setDepartments] = useState<APIDepartment[]>([]);
  const [categories, setCategories] = useState<APICategory[]>([]);
  const [sources, setSources] = useState<APISource[]>([]);
  const [riskOwners, setRiskOwners] = useState<APIRiskOwner[]>([]);
  const [riskStatuses, setRiskStatuses] = useState<APIRiskStatus[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Modal states for sources
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  const [showEditSourceModal, setShowEditSourceModal] = useState(false);
  const [showDeleteSourceModal, setShowDeleteSourceModal] = useState(false);

  // Modal states for risk owners
  const [showAddRiskOwnerModal, setShowAddRiskOwnerModal] = useState(false);
  const [showEditRiskOwnerModal, setShowEditRiskOwnerModal] = useState(false);
  const [showDeleteRiskOwnerModal, setShowDeleteRiskOwnerModal] = useState(false);

  // Modal states for risk statuses
  const [showAddStatusModal, setShowAddStatusModal] = useState(false);
  const [showEditStatusModal, setShowEditStatusModal] = useState(false);
  const [showDeleteStatusModal, setShowDeleteStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<APIRiskStatus | null>(null);

  // Parsed risks data for import
  const [parsedRisksData, setParsedRisksData] = useState<Array<Record<string, string>>>([]);
  const [isImporting, setIsImporting] = useState(false);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [usersRes, deptsRes, catsRes, sourcesRes, ownersRes, statusesRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/departments'),
          fetch('/api/categories'),
          fetch('/api/sources'),
          fetch('/api/risk-owners'),
          fetch('/api/risk-statuses'),
        ]);

        const [usersData, deptsData, catsData, sourcesData, ownersData, statusesData] = await Promise.all([
          usersRes.json(),
          deptsRes.json(),
          catsRes.json(),
          sourcesRes.json(),
          ownersRes.json(),
          statusesRes.json(),
        ]);

        if (usersData.success) setUsers(usersData.data);
        if (deptsData.success) setDepartments(deptsData.data);
        if (catsData.success) setCategories(catsData.data);
        if (sourcesData.success) setSources(sourcesData.data);
        if (ownersData.success) setRiskOwners(ownersData.data);
        if (statusesData.success) setRiskStatuses(statusesData.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  // Form states for editing
  const [editUserForm, setEditUserForm] = useState({
    fullNameAr: '',
    fullNameEn: '',
    email: '',
    role: '',
    status: '',
  });

  // Form states for adding new user
  const [newUserForm, setNewUserForm] = useState({
    fullNameAr: '',
    fullNameEn: '',
    email: '',
    role: '',
    departmentId: '',
  });

  // Form states for editing department
  const [editDeptForm, setEditDeptForm] = useState({
    nameAr: '',
    nameEn: '',
    code: '',
  });

  // Form states for adding new department
  const [newDeptForm, setNewDeptForm] = useState({
    nameAr: '',
    nameEn: '',
    code: '',
  });

  // Form states for adding new category
  const [newCategoryForm, setNewCategoryForm] = useState({
    nameAr: '',
    nameEn: '',
    code: '',
    color: 'bg-blue-500',
  });

  // Form states for editing category
  const [editCategoryForm, setEditCategoryForm] = useState({
    nameAr: '',
    nameEn: '',
    code: '',
    color: '',
  });

  // Form states for adding new source
  const [newSourceForm, setNewSourceForm] = useState({
    nameAr: '',
    nameEn: '',
    code: '',
  });

  // Form states for editing source
  const [editSourceForm, setEditSourceForm] = useState({
    nameAr: '',
    nameEn: '',
    code: '',
  });

  // Form states for adding new risk owner
  const [newRiskOwnerForm, setNewRiskOwnerForm] = useState({
    fullName: '',
    fullNameEn: '',
    email: '',
    phone: '',
    departmentId: '',
  });

  // Form states for editing risk owner
  const [editRiskOwnerForm, setEditRiskOwnerForm] = useState({
    fullName: '',
    fullNameEn: '',
    email: '',
    phone: '',
    departmentId: '',
  });

  // Form states for adding new risk status
  const [newStatusForm, setNewStatusForm] = useState({
    code: '',
    nameAr: '',
    nameEn: '',
    descriptionAr: '',
    descriptionEn: '',
    color: '#3b82f6',
    icon: 'AlertCircle',
    isDefault: false,
  });

  // Form states for editing risk status
  const [editStatusForm, setEditStatusForm] = useState({
    code: '',
    nameAr: '',
    nameEn: '',
    descriptionAr: '',
    descriptionEn: '',
    color: '',
    icon: '',
    isDefault: false,
  });

  // Handle Edit User
  const handleEditUser = (user: APIUser) => {
    setSelectedUser(user as unknown as typeof mockUsers[0]);
    setEditUserForm({
      fullNameAr: user.fullName,
      fullNameEn: user.fullNameEn || '',
      email: user.email,
      role: user.role,
      status: user.status,
    });
    setShowEditUserModal(true);
  };

  // Handle Department Access Modal
  const handleDepartmentAccess = (user: APIUser) => {
    setSelectedUserForAccess(user);
    // Set currently accessible department IDs
    const accessibleIds = user.accessibleDepartments?.map(a => a.departmentId) || [];
    setSelectedDepartmentIds(accessibleIds);
    setShowDepartmentAccessModal(true);
  };

  // Save Department Access
  const saveDepartmentAccess = async () => {
    if (!selectedUserForAccess) return;

    setSavingAccess(true);
    try {
      const response = await fetch(`/api/users/${selectedUserForAccess.id}/department-access`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departmentIds: selectedDepartmentIds,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Refetch users to get the updated list
        const usersRes = await fetch('/api/users');
        const usersData = await usersRes.json();
        if (usersData.success) setUsers(usersData.data);

        setShowDepartmentAccessModal(false);
        setSelectedUserForAccess(null);
        setSelectedDepartmentIds([]);
        alert(isAr ? 'تم تحديث صلاحيات الوصول بنجاح!' : 'Access permissions updated successfully!');
      } else {
        alert(isAr ? `خطأ: ${result.error}` : `Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating department access:', error);
      alert(isAr ? 'حدث خطأ أثناء تحديث الصلاحيات' : 'An error occurred while updating permissions');
    } finally {
      setSavingAccess(false);
    }
  };

  // Toggle department selection
  const toggleDepartmentSelection = (departmentId: string) => {
    setSelectedDepartmentIds(prev => {
      if (prev.includes(departmentId)) {
        return prev.filter(id => id !== departmentId);
      } else {
        return [...prev, departmentId];
      }
    });
  };

  // Save Edit User
  const saveEditUser = async () => {
    if (selectedUser) {
      try {
        const response = await fetch(`/api/users/${selectedUser.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: editUserForm.fullNameAr,
            fullNameEn: editUserForm.fullNameEn || null,
            email: editUserForm.email,
            role: editUserForm.role,
            status: editUserForm.status,
          }),
        });

        const result = await response.json();

        if (result.success) {
          // Refetch users to get the updated list
          const usersRes = await fetch('/api/users');
          const usersData = await usersRes.json();
          if (usersData.success) setUsers(usersData.data);

          setShowEditUserModal(false);
          setSelectedUser(null);
          alert(isAr ? 'تم تحديث المستخدم بنجاح!' : 'User updated successfully!');
        } else {
          alert(isAr ? `خطأ: ${result.error}` : `Error: ${result.error}`);
        }
      } catch (error) {
        console.error('Error updating user:', error);
        alert(isAr ? 'حدث خطأ أثناء تحديث المستخدم' : 'An error occurred while updating user');
      }
    }
  };

  // Reset Password (Admin function)
  const handleResetPassword = async (userId: string) => {
    setResetPasswordUserId(userId);
    setShowResetPasswordModal(true);
  };

  const confirmResetPassword = async () => {
    if (!resetPasswordUserId) return;

    try {
      const response = await fetch(`/api/users/${resetPasswordUserId}/reset-password`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        alert(isAr
          ? `تم إعادة تعيين كلمة المرور بنجاح!\nكلمة المرور الجديدة: ${result.defaultPassword}`
          : `Password reset successfully!\nNew password: ${result.defaultPassword}`);
        setShowResetPasswordModal(false);
        setResetPasswordUserId(null);
      } else {
        alert(isAr ? `خطأ: ${result.error}` : `Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Reset password error:', error);
      alert(isAr ? 'حدث خطأ أثناء إعادة تعيين كلمة المرور' : 'An error occurred while resetting password');
    }
  };

  // Change Password (User function)
  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (!changePasswordForm.currentPassword || !changePasswordForm.newPassword) {
      setPasswordError(isAr ? 'يرجى ملء جميع الحقول' : 'Please fill all fields');
      return;
    }

    if (changePasswordForm.newPassword !== changePasswordForm.confirmPassword) {
      setPasswordError(isAr ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
      return;
    }

    if (changePasswordForm.newPassword.length < 6) {
      setPasswordError(isAr ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }

    try {
      const response = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: changePasswordForm.currentPassword,
          newPassword: changePasswordForm.newPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setPasswordSuccess(isAr ? 'تم تغيير كلمة المرور بنجاح!' : 'Password changed successfully!');
        setChangePasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => {
          setShowChangePasswordModal(false);
          setPasswordSuccess('');
        }, 2000);
      } else {
        setPasswordError(isAr ? result.error : result.error);
      }
    } catch (error) {
      console.error('Change password error:', error);
      setPasswordError(isAr ? 'حدث خطأ أثناء تغيير كلمة المرور' : 'An error occurred while changing password');
    }
  };

  // Add New User
  const addNewUser = async () => {
    if (newUserForm.fullNameAr && newUserForm.email) {
      try {
        // تحويل departmentId الفارغ إلى null
        const deptId = newUserForm.departmentId && newUserForm.departmentId.trim() !== ''
          ? newUserForm.departmentId
          : null;

        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: newUserForm.fullNameAr.trim(),
            fullNameEn: newUserForm.fullNameEn?.trim() || null,
            email: newUserForm.email.trim(),
            role: newUserForm.role || 'employee',
            departmentId: deptId,
            status: 'active',
          }),
        });

        const result = await response.json();

        if (result.success) {
          // Refetch users to get the updated list with proper structure
          const usersRes = await fetch('/api/users');
          const usersData = await usersRes.json();
          if (usersData.success) setUsers(usersData.data);

          setNewUserForm({ fullNameAr: '', fullNameEn: '', email: '', role: '', departmentId: '' });
          setShowAddModal(false);
          alert(isAr ? 'تم إضافة المستخدم بنجاح!' : 'User added successfully!');
        } else {
          alert(isAr ? `خطأ: ${result.error}` : `Error: ${result.error}`);
        }
      } catch (error) {
        console.error('Error adding user:', error);
        alert(isAr ? 'حدث خطأ أثناء إضافة المستخدم' : 'An error occurred while adding user');
      }
    }
  };

  // Add New Department
  const addNewDept = async () => {
    if (newDeptForm.nameAr && newDeptForm.code) {
      try {
        const response = await fetch('/api/departments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: newDeptForm.code,
            nameAr: newDeptForm.nameAr,
            nameEn: newDeptForm.nameEn,
          }),
        });

        const result = await response.json();

        if (result.success) {
          setDepartments(prev => [...prev, result.data]);
          setNewDeptForm({ nameAr: '', nameEn: '', code: '' });
          setShowAddDeptModal(false);
          alert(isAr ? 'تم إضافة الإدارة بنجاح!' : 'Department added successfully!');
        } else {
          alert(isAr ? `خطأ: ${result.error}` : `Error: ${result.error}`);
        }
      } catch (error) {
        console.error('Error adding department:', error);
        alert(isAr ? 'حدث خطأ أثناء إضافة الإدارة' : 'An error occurred while adding department');
      }
    }
  };

  // Handle Delete User
  const handleDeleteUser = (user: APIUser) => {
    setSelectedUser(user as unknown as typeof mockUsers[0]);
    setShowDeleteUserModal(true);
  };

  // Confirm Delete User
  const confirmDeleteUser = async () => {
    if (selectedUser) {
      try {
        const response = await fetch(`/api/users/${selectedUser.id}`, {
          method: 'DELETE',
        });

        const result = await response.json();

        if (result.success) {
          setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
          setShowDeleteUserModal(false);
          setSelectedUser(null);
          alert(isAr ? 'تم حذف المستخدم بنجاح!' : 'User deleted successfully!');
        } else {
          alert(isAr ? `خطأ: ${result.error}` : `Error: ${result.error}`);
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        alert(isAr ? 'حدث خطأ أثناء حذف المستخدم' : 'An error occurred while deleting user');
      }
    }
  };

  // Handle Edit Department
  const handleEditDept = (dept: APIDepartment) => {
    setSelectedDept(dept);
    setEditDeptForm({
      nameAr: dept.nameAr,
      nameEn: dept.nameEn,
      code: dept.code,
    });
    setShowEditDeptModal(true);
  };

  // Save Edit Department
  const saveEditDept = async () => {
    if (selectedDept) {
      try {
        const response = await fetch(`/api/departments/${selectedDept.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: editDeptForm.code,
            nameAr: editDeptForm.nameAr,
            nameEn: editDeptForm.nameEn,
          }),
        });

        const result = await response.json();

        if (result.success) {
          setDepartments(prev => prev.map(d =>
            d.id === selectedDept.id ? result.data : d
          ));
          setShowEditDeptModal(false);
          setSelectedDept(null);
          alert(isAr ? 'تم تحديث الإدارة بنجاح!' : 'Department updated successfully!');
        } else {
          alert(isAr ? `خطأ: ${result.error}` : `Error: ${result.error}`);
        }
      } catch (error) {
        console.error('Error updating department:', error);
        alert(isAr ? 'حدث خطأ أثناء تحديث الإدارة' : 'An error occurred while updating department');
      }
    }
  };

  // Add New Category
  const addNewCategory = async () => {
    if (newCategoryForm.nameAr && newCategoryForm.code) {
      try {
        const response = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: newCategoryForm.code,
            nameAr: newCategoryForm.nameAr,
            nameEn: newCategoryForm.nameEn,
            color: newCategoryForm.color,
          }),
        });

        const result = await response.json();

        if (result.success) {
          setCategories(prev => [...prev, result.data]);
          setNewCategoryForm({ nameAr: '', nameEn: '', code: '', color: 'bg-blue-500' });
          setShowAddCategoryModal(false);
          alert(isAr ? 'تم إضافة التصنيف بنجاح!' : 'Category added successfully!');
        } else {
          alert(isAr ? `خطأ: ${result.error}` : `Error: ${result.error}`);
        }
      } catch (error) {
        console.error('Error adding category:', error);
        alert(isAr ? 'حدث خطأ أثناء إضافة التصنيف' : 'An error occurred while adding category');
      }
    }
  };

  // Handle Edit Category
  const handleEditCategory = (category: APICategory) => {
    setSelectedCategory(category);
    setEditCategoryForm({
      nameAr: category.nameAr,
      nameEn: category.nameEn,
      code: category.code,
      color: category.color || 'bg-blue-500',
    });
    setShowEditCategoryModal(true);
  };

  // Save Edit Category
  const saveEditCategory = async () => {
    if (selectedCategory) {
      try {
        const response = await fetch(`/api/categories/${selectedCategory.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: editCategoryForm.code,
            nameAr: editCategoryForm.nameAr,
            nameEn: editCategoryForm.nameEn,
            color: editCategoryForm.color,
          }),
        });

        const result = await response.json();

        if (result.success) {
          setCategories(prev => prev.map(c =>
            c.id === selectedCategory.id ? result.data : c
          ));
          setShowEditCategoryModal(false);
          setSelectedCategory(null);
          alert(isAr ? 'تم تحديث التصنيف بنجاح!' : 'Category updated successfully!');
        } else {
          alert(isAr ? `خطأ: ${result.error}` : `Error: ${result.error}`);
        }
      } catch (error) {
        console.error('Error updating category:', error);
        alert(isAr ? 'حدث خطأ أثناء تحديث التصنيف' : 'An error occurred while updating category');
      }
    }
  };

  // Handle Delete Category
  const handleDeleteCategory = (category: APICategory) => {
    setSelectedCategory(category);
    setShowDeleteCategoryModal(true);
  };

  // Confirm Delete Category
  const confirmDeleteCategory = async () => {
    if (selectedCategory) {
      try {
        const response = await fetch(`/api/categories/${selectedCategory.id}`, {
          method: 'DELETE',
        });

        const result = await response.json();

        if (result.success) {
          setCategories(prev => prev.filter(c => c.id !== selectedCategory.id));
          setShowDeleteCategoryModal(false);
          setSelectedCategory(null);
          alert(isAr ? 'تم حذف التصنيف بنجاح!' : 'Category deleted successfully!');
        } else {
          alert(isAr ? `خطأ: ${result.error}` : `Error: ${result.error}`);
        }
      } catch (error) {
        console.error('Error deleting category:', error);
        alert(isAr ? 'حدث خطأ أثناء حذف التصنيف' : 'An error occurred while deleting category');
      }
    }
  };

  // ======= Source Handlers =======
  const handleAddSource = async () => {
    if (!newSourceForm.nameAr || !newSourceForm.nameEn || !newSourceForm.code) {
      alert(isAr ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    try {
      const response = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSourceForm),
      });

      const result = await response.json();

      if (result.success) {
        setSources(prev => [...prev, result.data]);
        setShowAddSourceModal(false);
        setNewSourceForm({ nameAr: '', nameEn: '', code: '' });
        alert(isAr ? 'تم إضافة المصدر بنجاح!' : 'Source added successfully!');
      } else {
        alert(isAr ? `خطأ: ${result.error}` : `Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error adding source:', error);
      alert(isAr ? 'حدث خطأ أثناء إضافة المصدر' : 'An error occurred while adding source');
    }
  };

  const handleEditSource = (source: APISource) => {
    setSelectedSource(source);
    setEditSourceForm({
      nameAr: source.nameAr,
      nameEn: source.nameEn,
      code: source.code,
    });
    setShowEditSourceModal(true);
  };

  const saveEditSource = async () => {
    if (selectedSource) {
      try {
        const response = await fetch(`/api/sources/${selectedSource.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editSourceForm),
        });

        const result = await response.json();

        if (result.success) {
          setSources(prev => prev.map(s => s.id === selectedSource.id ? result.data : s));
          setShowEditSourceModal(false);
          setSelectedSource(null);
          alert(isAr ? 'تم تحديث المصدر بنجاح!' : 'Source updated successfully!');
        } else {
          alert(isAr ? `خطأ: ${result.error}` : `Error: ${result.error}`);
        }
      } catch (error) {
        console.error('Error updating source:', error);
        alert(isAr ? 'حدث خطأ أثناء تحديث المصدر' : 'An error occurred while updating source');
      }
    }
  };

  const handleDeleteSource = (source: APISource) => {
    setSelectedSource(source);
    setShowDeleteSourceModal(true);
  };

  const confirmDeleteSource = async () => {
    if (selectedSource) {
      try {
        const response = await fetch(`/api/sources/${selectedSource.id}`, {
          method: 'DELETE',
        });

        const result = await response.json();

        if (result.success) {
          setSources(prev => prev.filter(s => s.id !== selectedSource.id));
          setShowDeleteSourceModal(false);
          setSelectedSource(null);
          alert(isAr ? 'تم حذف المصدر بنجاح!' : 'Source deleted successfully!');
        } else {
          alert(isAr ? `خطأ: ${result.error}` : `Error: ${result.error}`);
        }
      } catch (error) {
        console.error('Error deleting source:', error);
        alert(isAr ? 'حدث خطأ أثناء حذف المصدر' : 'An error occurred while deleting source');
      }
    }
  };

  // ======= Risk Status Handlers =======
  const handleAddStatus = async () => {
    if (!newStatusForm.nameAr || !newStatusForm.nameEn || !newStatusForm.code) {
      alert(isAr ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    try {
      const response = await fetch('/api/risk-statuses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStatusForm),
      });

      const result = await response.json();

      if (result.success) {
        setRiskStatuses(prev => [...prev, result.data]);
        setShowAddStatusModal(false);
        setNewStatusForm({
          code: '',
          nameAr: '',
          nameEn: '',
          descriptionAr: '',
          descriptionEn: '',
          color: '#3b82f6',
          icon: 'AlertCircle',
          isDefault: false,
        });
        alert(isAr ? 'تم إضافة الحالة بنجاح!' : 'Status added successfully!');
      } else {
        alert(isAr ? `خطأ: ${result.error}` : `Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error adding status:', error);
      alert(isAr ? 'حدث خطأ أثناء إضافة الحالة' : 'An error occurred while adding status');
    }
  };

  const handleEditStatus = (status: APIRiskStatus) => {
    setSelectedStatus(status);
    setEditStatusForm({
      code: status.code,
      nameAr: status.nameAr,
      nameEn: status.nameEn,
      descriptionAr: status.descriptionAr || '',
      descriptionEn: status.descriptionEn || '',
      color: status.color || '#3b82f6',
      icon: status.icon || 'AlertCircle',
      isDefault: status.isDefault,
    });
    setShowEditStatusModal(true);
  };

  const saveEditStatus = async () => {
    if (selectedStatus) {
      try {
        const response = await fetch(`/api/risk-statuses/${selectedStatus.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editStatusForm),
        });

        const result = await response.json();

        if (result.success) {
          setRiskStatuses(prev => prev.map(s => s.id === selectedStatus.id ? result.data : s));
          setShowEditStatusModal(false);
          setSelectedStatus(null);
          alert(isAr ? 'تم تحديث الحالة بنجاح!' : 'Status updated successfully!');
        } else {
          alert(isAr ? `خطأ: ${result.error}` : `Error: ${result.error}`);
        }
      } catch (error) {
        console.error('Error updating status:', error);
        alert(isAr ? 'حدث خطأ أثناء تحديث الحالة' : 'An error occurred while updating status');
      }
    }
  };

  const handleDeleteStatus = (status: APIRiskStatus) => {
    setSelectedStatus(status);
    setShowDeleteStatusModal(true);
  };

  const confirmDeleteStatus = async () => {
    if (selectedStatus) {
      try {
        const response = await fetch(`/api/risk-statuses/${selectedStatus.id}`, {
          method: 'DELETE',
        });

        const result = await response.json();

        if (result.success) {
          setRiskStatuses(prev => prev.filter(s => s.id !== selectedStatus.id));
          setShowDeleteStatusModal(false);
          setSelectedStatus(null);
          alert(isAr ? 'تم حذف الحالة بنجاح!' : 'Status deleted successfully!');
        } else {
          alert(isAr ? `خطأ: ${result.error}` : `Error: ${result.error}`);
        }
      } catch (error) {
        console.error('Error deleting status:', error);
        alert(isAr ? 'حدث خطأ أثناء حذف الحالة' : 'An error occurred while deleting status');
      }
    }
  };

  // ======= Risk Owner Handlers =======
  const handleAddRiskOwner = async () => {
    if (!newRiskOwnerForm.fullName) {
      alert(isAr ? 'يرجى إدخال الاسم الكامل' : 'Please enter the full name');
      return;
    }

    try {
      const response = await fetch('/api/risk-owners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRiskOwnerForm),
      });

      const result = await response.json();

      if (result.success) {
        setRiskOwners(prev => [...prev, result.data]);
        setShowAddRiskOwnerModal(false);
        setNewRiskOwnerForm({ fullName: '', fullNameEn: '', email: '', phone: '', departmentId: '' });
        alert(isAr ? 'تم إضافة مالك الخطر بنجاح!' : 'Risk Owner added successfully!');
      } else {
        alert(isAr ? `خطأ: ${result.error}` : `Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error adding risk owner:', error);
      alert(isAr ? 'حدث خطأ أثناء إضافة مالك الخطر' : 'An error occurred while adding risk owner');
    }
  };

  const handleEditRiskOwner = (owner: APIRiskOwner) => {
    setSelectedRiskOwner(owner);
    setEditRiskOwnerForm({
      fullName: owner.fullName,
      fullNameEn: owner.fullNameEn || '',
      email: owner.email || '',
      phone: owner.phone || '',
      departmentId: owner.departmentId || '',
    });
    setShowEditRiskOwnerModal(true);
  };

  const saveEditRiskOwner = async () => {
    if (selectedRiskOwner) {
      try {
        const response = await fetch(`/api/risk-owners/${selectedRiskOwner.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editRiskOwnerForm),
        });

        const result = await response.json();

        if (result.success) {
          setRiskOwners(prev => prev.map(o => o.id === selectedRiskOwner.id ? result.data : o));
          setShowEditRiskOwnerModal(false);
          setSelectedRiskOwner(null);
          alert(isAr ? 'تم تحديث مالك الخطر بنجاح!' : 'Risk Owner updated successfully!');
        } else {
          alert(isAr ? `خطأ: ${result.error}` : `Error: ${result.error}`);
        }
      } catch (error) {
        console.error('Error updating risk owner:', error);
        alert(isAr ? 'حدث خطأ أثناء تحديث مالك الخطر' : 'An error occurred while updating risk owner');
      }
    }
  };

  const handleDeleteRiskOwner = (owner: APIRiskOwner) => {
    setSelectedRiskOwner(owner);
    setShowDeleteRiskOwnerModal(true);
  };

  const confirmDeleteRiskOwner = async () => {
    if (selectedRiskOwner) {
      try {
        const response = await fetch(`/api/risk-owners/${selectedRiskOwner.id}`, {
          method: 'DELETE',
        });

        const result = await response.json();

        if (result.success) {
          setRiskOwners(prev => prev.filter(o => o.id !== selectedRiskOwner.id));
          setShowDeleteRiskOwnerModal(false);
          setSelectedRiskOwner(null);
          alert(isAr ? 'تم حذف مالك الخطر بنجاح!' : 'Risk Owner deleted successfully!');
        } else {
          alert(isAr ? `خطأ: ${result.error}` : `Error: ${result.error}`);
        }
      } catch (error) {
        console.error('Error deleting risk owner:', error);
        alert(isAr ? 'حدث خطأ أثناء حذف مالك الخطر' : 'An error occurred while deleting risk owner');
      }
    }
  };

  // File input ref for CSV/Excel import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Existing risk IDs for duplicate detection (fetched from API)
  const [existingRiskIds, setExistingRiskIds] = useState<string[]>([]);

  // Fetch existing risk IDs when component mounts
  useEffect(() => {
    const fetchExistingRiskIds = async () => {
      try {
        const response = await fetch('/api/risks?fields=riskNumber');
        const result = await response.json();
        if (result.success && result.data) {
          const ids = result.data.map((r: { riskNumber: string }) => r.riskNumber);
          setExistingRiskIds(ids);
        }
      } catch (error) {
        console.error('Failed to fetch existing risk IDs:', error);
      }
    };
    fetchExistingRiskIds();
  }, []);

  // Download import template
  const handleDownloadTemplate = () => {
    // CSV with BOM for Arabic support
    const BOM = '\uFEFF';
    const headers = [
      'Risk_ID',
      'Source_Code',
      'Category_Code',
      'Department_Code',
      'Process',
      'Sub_Process',
      'Title_AR',
      'Title_EN',
      'Description_AR',
      'Description_EN',
      'Approval_Status',
      'Likelihood',
      'Impact',
      'Risk_Rating',
      'Status',
      'Risk_Owner',
      'Risk_Champion',
      'Potential_Cause_AR',
      'Potential_Cause_EN',
      'Potential_Impact_AR',
      'Potential_Impact_EN',
      'Layers_Of_Protection_AR',
      'Layers_Of_Protection_EN',
      'KRIs_AR',
      'KRIs_EN',
      'Treatment_Plan_AR',
      'Treatment_Plan_EN',
      'Due_Date',
      'Review_Date',
      'Comments'
    ];

    // Build codes from database
    const categoryCodes = categories.map(c => c.code).join('/') || 'OPR/FIN/STR/LEG/TEC/REP';
    const departmentCodes = departments.map(d => d.code).join('/') || 'RM/FIN/OPS/IT/SC/HSE';
    const sourceCodes = sources.map(s => s.code).join('/') || 'KPMG/INT/EXT/AUD';
    const riskOwnerNames = riskOwners.map(o => o.fullName).slice(0, 3).join('/') || 'اسم المالك';
    const championNames = users.filter(u => u.role === 'riskChampion').map(u => u.fullName).slice(0, 3).join('/') || 'اسم رائد الخطر';

    // Instructions row with dynamic codes
    const instructions = [
      'رقم الخطر (فريد)',
      sourceCodes,
      categoryCodes,
      departmentCodes,
      'اسم العملية',
      'اسم العملية الفرعية',
      'العنوان بالعربي',
      'العنوان بالإنجليزي',
      'الوصف بالعربي',
      'الوصف بالإنجليزي',
      'Approved/Draft/Future/N/A/Sent/Under Discussing',
      '1-5 (1=نادر، 5=شبه مؤكد)',
      '1-5 (1=ضئيل، 5=كارثي)',
      'Critical/Major/Moderate/Minor/Negligible',
      'Open/In Progress/Resolved/Closed',
      riskOwnerNames,
      championNames,
      'السبب المحتمل بالعربي',
      'السبب المحتمل بالإنجليزي',
      'التأثير المحتمل بالعربي',
      'التأثير المحتمل بالإنجليزي',
      'طبقات الحماية بالعربي',
      'طبقات الحماية بالإنجليزي',
      'مؤشرات المخاطر بالعربي',
      'مؤشرات المخاطر بالإنجليزي',
      'خطة المعالجة بالعربي',
      'خطة المعالجة بالإنجليزي',
      'YYYY-MM-DD',
      'YYYY-MM-DD',
      'ملاحظات إضافية'
    ];

    // Example rows
    const examples = [
      ['HR-R-001', 'KPMG', 'OPR', 'HR', 'التوظيف', 'استقطاب الكفاءات', 'استقالة الموظفين الرئيسيين', 'Key Employee Turnover', 'خطر فقدان الموظفين ذوي الخبرة العالية', 'Risk of losing highly experienced employees', 'Approved', '3', '4', 'Major', 'Open', 'أحمد محمد', 'سارة علي', 'عدم وجود خطط تطوير وظيفي', 'Lack of career development plans', 'فقدان المعرفة المؤسسية وزيادة تكاليف التوظيف', 'Loss of institutional knowledge and increased hiring costs', 'برامج التطوير الوظيفي', 'Career development programs', 'معدل دوران الموظفين', 'Employee turnover rate', 'تطوير خطط الاحتفاظ بالموظفين', 'Develop employee retention plans', '2026-03-31', '2026-02-28', 'يتطلب متابعة شهرية'],
      ['FIN-R-002', 'INT', 'FIN', 'FIN', 'المالية', 'الخزينة', 'تقلبات أسعار الصرف', 'Currency Exchange Fluctuations', 'التعرض لمخاطر تقلب العملات الأجنبية', 'Exposure to foreign currency volatility', 'Draft', '4', '3', 'Major', 'In Progress', 'سارة علي', 'خالد أحمد', 'تقلبات الأسواق العالمية', 'Global market volatility', 'خسائر مالية في العقود الدولية', 'Financial losses in international contracts', 'سياسات التحوط', 'Hedging policies', 'نسبة التعرض للعملات', 'Currency exposure ratio', 'التحوط ضد مخاطر العملات', 'Currency hedging strategies', '2026-04-15', '2026-03-15', ''],
      ['IT-R-003', 'EXT', 'TEC', 'IT', 'تقنية المعلومات', 'الأمن السيبراني', 'اختراق أمني', 'Security Breach', 'احتمال حدوث اختراق للأنظمة', 'Potential system security breach', 'Sent', '2', '5', 'Major', 'Open', 'خالد أحمد', 'محمد عبدالله', 'ثغرات في الأنظمة الأمنية', 'Vulnerabilities in security systems', 'تسريب بيانات حساسة وتوقف الأعمال', 'Sensitive data leak and business disruption', 'جدران الحماية والتشفير', 'Firewalls and encryption', 'عدد محاولات الاختراق', 'Intrusion attempts count', 'تعزيز الأمن السيبراني', 'Enhance cybersecurity measures', '2026-02-28', '2026-01-31', 'أولوية قصوى'],
    ];

    const csvContent = BOM + [
      headers.join(','),
      instructions.map(i => `"${i}"`).join(','),
      '',
      ...examples.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'risk-import-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Parse CSV row properly handling quoted values
  const parseCSVRow = (row: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];

      if (char === '"') {
        if (inQuotes && row[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  // Parse CSV content handling multiline values inside quotes
  const parseCSVContent = (content: string): string[] => {
    const rows: string[] = [];
    let currentRow = '';
    let inQuotes = false;

    for (let i = 0; i < content.length; i++) {
      const char = content[i];

      if (char === '"') {
        // Check for escaped quote
        if (inQuotes && content[i + 1] === '"') {
          currentRow += '""';
          i++;
        } else {
          inQuotes = !inQuotes;
          currentRow += char;
        }
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        // End of row (outside quotes)
        if (char === '\r' && content[i + 1] === '\n') {
          i++; // Skip \n after \r
        }
        if (currentRow.trim()) {
          rows.push(currentRow);
        }
        currentRow = '';
      } else {
        currentRow += char;
      }
    }
    // Add last row if exists
    if (currentRow.trim()) {
      rows.push(currentRow);
    }
    return rows;
  };

  // Handle file selection for import
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileName = file.name;
      const fileExtension = fileName.split('.').pop()?.toLowerCase();

      if (fileExtension === 'csv' || fileExtension === 'xlsx' || fileExtension === 'xls') {
        const reader = new FileReader();
        reader.onload = (e) => {
          let content = e.target?.result as string;
          // Remove BOM if present
          if (content.charCodeAt(0) === 0xFEFF) {
            content = content.substring(1);
          }

          const lines = parseCSVContent(content);

          // Get headers from first row
          const headers = parseCSVRow(lines[0]);

          // Skip header and instruction rows (lines 0, 1, 2)
          const dataRows = lines.slice(3);

          const parsedData: Array<Record<string, string>> = [];
          const results = {
            added: [] as string[],
            updated: [] as string[],
            skipped: [] as string[],
            errors: [] as { riskId: string; error: string }[]
          };

          dataRows.forEach((row, index) => {
            if (!row.trim()) return;

            const cells = parseCSVRow(row);
            const riskId = cells[0]?.trim();

            if (!riskId) {
              results.errors.push({ riskId: `Row ${index + 4}`, error: isAr ? 'رمز الخطر مفقود' : 'Missing Risk ID' });
              return;
            }

            // Create risk object from parsed data
            const riskData: Record<string, string> = {};
            headers.forEach((header, i) => {
              riskData[header] = cells[i] || '';
            });

            parsedData.push(riskData);

            const isExisting = existingRiskIds.includes(riskId);

            if (isExisting) {
              if (importMode === 'addOnly') {
                results.skipped.push(riskId);
              } else {
                results.updated.push(riskId);
              }
            } else {
              if (importMode === 'updateOnly') {
                results.skipped.push(riskId);
              } else {
                results.added.push(riskId);
              }
            }
          });

          setParsedRisksData(parsedData);
          setImportResults(results);
          setImportStats({
            total: dataRows.filter(r => r.trim()).length,
            added: results.added.length,
            updated: results.updated.length,
            skipped: results.skipped.length,
            errors: results.errors.length
          });
          setShowImportResultModal(true);
        };
        reader.readAsText(file, 'UTF-8');
      } else {
        alert(isAr
          ? 'صيغة الملف غير مدعومة. يرجى استخدام CSV أو Excel.'
          : 'Unsupported file format. Please use CSV or Excel.');
      }
      // Reset file input
      event.target.value = '';
    }
  };

  // Handle choose file button click
  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  // Confirm import - send to API
  const confirmImport = async () => {
    if (parsedRisksData.length === 0) {
      alert(isAr ? 'لا توجد بيانات للاستيراد' : 'No data to import');
      return;
    }

    setIsImporting(true);

    try {
      const response = await fetch('/api/risks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bulkImport: true,
          risks: parsedRisksData,
          mode: importMode,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setImportStats({
          total: parsedRisksData.length,
          added: result.results.added,
          updated: result.results.updated,
          skipped: result.results.skipped,
          errors: result.results.errors.length,
        });
        setShowImportSuccess(true);
        setShowImportResultModal(false);
        setParsedRisksData([]);
      } else {
        alert(isAr ? `فشل الاستيراد: ${result.error}` : `Import failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Import error:', error);
      alert(isAr ? 'حدث خطأ أثناء الاستيراد' : 'An error occurred during import');
    } finally {
      setIsImporting(false);
    }
  };

  // Handle export risk register (JSON format)
  const handleExportRiskRegister = async () => {
    try {
      // Fetch all risks from API
      const response = await fetch('/api/risks');
      const result = await response.json();

      if (!result.success || !result.data) {
        alert(isAr ? 'فشل في جلب البيانات' : 'Failed to fetch data');
        return;
      }

      const risks = result.data;

      // Create export data structure
      const exportData = {
        exportDate: new Date().toISOString(),
        exportedBy: 'ERM System',
        totalRisks: risks.length,
        risks: risks.map((risk: Record<string, unknown>) => ({
          riskNumber: risk.riskNumber,
          titleAr: risk.titleAr,
          titleEn: risk.titleEn,
          descriptionAr: risk.descriptionAr,
          descriptionEn: risk.descriptionEn,
          inherentLikelihood: risk.inherentLikelihood,
          inherentImpact: risk.inherentImpact,
          inherentScore: risk.inherentScore,
          inherentRating: risk.inherentRating,
          residualLikelihood: risk.residualLikelihood,
          residualImpact: risk.residualImpact,
          residualScore: risk.residualScore,
          residualRating: risk.residualRating,
          status: risk.status,
          category: (risk.category as Record<string, unknown>)?.nameEn || '',
          department: (risk.department as Record<string, unknown>)?.nameEn || '',
          owner: (risk.owner as Record<string, unknown>)?.fullName || '',
          createdAt: risk.createdAt,
          updatedAt: risk.updatedAt,
        }))
      };

      // Create blob and download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `risk-register-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert(isAr
        ? `تم تصدير ${risks.length} خطر بنجاح!`
        : `Successfully exported ${risks.length} risks!`);
    } catch (error) {
      console.error('Export error:', error);
      alert(isAr ? 'حدث خطأ أثناء التصدير' : 'An error occurred during export');
    }
  };

  // Handle export as Excel (CSV format)
  const handleExportExcel = async () => {
    try {
      // Fetch all risks from API
      const response = await fetch('/api/risks');
      const result = await response.json();

      if (!result.success || !result.data) {
        alert(isAr ? 'فشل في جلب البيانات' : 'Failed to fetch data');
        return;
      }

      const risks = result.data;

      // Create CSV content with BOM for Excel Arabic support
      const BOM = '\uFEFF';
      const headers = [
        'Risk ID',
        'Title (Arabic)',
        'Title (English)',
        'Description (Arabic)',
        'Description (English)',
        'Inherent Likelihood',
        'Inherent Impact',
        'Inherent Score',
        'Inherent Rating',
        'Residual Likelihood',
        'Residual Impact',
        'Residual Score',
        'Residual Rating',
        'Status',
        'Category',
        'Department',
        'Owner',
        'Created At',
        'Updated At'
      ];

      const escapeCSV = (value: unknown): string => {
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const rows = risks.map((risk: Record<string, unknown>) => [
        risk.riskNumber,
        risk.titleAr,
        risk.titleEn,
        risk.descriptionAr,
        risk.descriptionEn,
        risk.inherentLikelihood,
        risk.inherentImpact,
        risk.inherentScore,
        risk.inherentRating,
        risk.residualLikelihood || '',
        risk.residualImpact || '',
        risk.residualScore || '',
        risk.residualRating || '',
        risk.status,
        (risk.category as Record<string, unknown>)?.nameEn || '',
        (risk.department as Record<string, unknown>)?.nameEn || '',
        (risk.owner as Record<string, unknown>)?.fullName || '',
        risk.createdAt ? new Date(risk.createdAt as string).toLocaleDateString() : '',
        risk.updatedAt ? new Date(risk.updatedAt as string).toLocaleDateString() : '',
      ].map(escapeCSV).join(','));

      const csvContent = BOM + [headers.join(','), ...rows].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `risk-register-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert(isAr
        ? `تم تصدير ${risks.length} خطر كملف Excel بنجاح!`
        : `Successfully exported ${risks.length} risks as Excel!`);
    } catch (error) {
      console.error('Export error:', error);
      alert(isAr ? 'حدث خطأ أثناء التصدير' : 'An error occurred during export');
    }
  };

  const getRoleColor = (role: string): 'primary' | 'success' | 'warning' | 'info' | 'default' => {
    switch (role) {
      case 'admin':
        return 'primary';
      case 'riskManager':
        return 'success';
      case 'riskChampion':
        return 'warning';
      case 'riskAnalyst':
        return 'info';
      default:
        return 'default';
    }
  };

  // Profile Tab
  const renderProfileTab = () => {
    const currentUser = users.find(u => u.email === session?.user?.email);

    return (
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            {t('settings.profile')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] text-2xl font-bold text-white">
              {currentUser?.fullName?.charAt(0) || session?.user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--foreground)]">
                {currentUser?.fullName || session?.user?.name}
              </h3>
              <p className="text-sm text-[var(--foreground-secondary)]">
                {session?.user?.email}
              </p>
              <Badge variant={currentUser?.status === 'active' ? 'success' : 'default'} className="mt-1">
                {t(`users.roles.${session?.user?.role || 'employee'}`)}
              </Badge>
            </div>
          </div>

          {/* User Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground-secondary)]">
                {isAr ? 'الاسم الكامل (عربي)' : 'Full Name (Arabic)'}
              </label>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] px-4 py-2.5 text-[var(--foreground)]">
                {currentUser?.fullName || '-'}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground-secondary)]">
                {isAr ? 'الاسم الكامل (إنجليزي)' : 'Full Name (English)'}
              </label>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] px-4 py-2.5 text-[var(--foreground)]">
                {currentUser?.fullNameEn || '-'}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground-secondary)]">
                {t('users.email')}
              </label>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] px-4 py-2.5 text-[var(--foreground)]">
                {session?.user?.email || '-'}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground-secondary)]">
                {t('users.role')}
              </label>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] px-4 py-2.5 text-[var(--foreground)]">
                {t(`users.roles.${session?.user?.role || 'employee'}`)}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground-secondary)]">
                {t('users.department')}
              </label>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] px-4 py-2.5 text-[var(--foreground)]">
                {currentUser?.department
                  ? (isAr ? currentUser.department.nameAr : currentUser.department.nameEn)
                  : '-'}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground-secondary)]">
                {t('users.status')}
              </label>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] px-4 py-2.5 text-[var(--foreground)]">
                {t(`users.statuses.${currentUser?.status || 'active'}`)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Change Password Tab
  const renderChangePasswordTab = () => {
    const handleChangePassword = async () => {
      setPasswordError('');
      setPasswordSuccess('');

      if (changePasswordForm.newPassword !== changePasswordForm.confirmPassword) {
        setPasswordError(t('settings.passwordMismatch'));
        return;
      }

      if (changePasswordForm.newPassword.length < 6) {
        setPasswordError(t('settings.passwordTooShort'));
        return;
      }

      try {
        const response = await fetch('/api/users/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentPassword: changePasswordForm.currentPassword,
            newPassword: changePasswordForm.newPassword,
          }),
        });

        const result = await response.json();

        if (result.success) {
          setPasswordSuccess(t('settings.passwordChanged'));
          setChangePasswordForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
        } else {
          setPasswordError(result.error || t('settings.incorrectPassword'));
        }
      } catch (error) {
        setPasswordError(isAr ? 'حدث خطأ في تغيير كلمة المرور' : 'Failed to change password');
      }
    };

    return (
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            {t('settings.changePassword')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {passwordError && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              {passwordSuccess}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--foreground)]">
              {t('settings.currentPassword')}
            </label>
            <div className="relative">
              <Input
                type="password"
                value={changePasswordForm.currentPassword}
                onChange={(e) => setChangePasswordForm({
                  ...changePasswordForm,
                  currentPassword: e.target.value
                })}
                placeholder={isAr ? 'أدخل كلمة المرور الحالية' : 'Enter current password'}
                leftIcon={<Lock className="h-4 w-4" />}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--foreground)]">
              {t('settings.newPassword')}
            </label>
            <Input
              type="password"
              value={changePasswordForm.newPassword}
              onChange={(e) => setChangePasswordForm({
                ...changePasswordForm,
                newPassword: e.target.value
              })}
              placeholder={isAr ? 'أدخل كلمة المرور الجديدة' : 'Enter new password'}
              leftIcon={<Key className="h-4 w-4" />}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--foreground)]">
              {t('settings.confirmNewPassword')}
            </label>
            <Input
              type="password"
              value={changePasswordForm.confirmPassword}
              onChange={(e) => setChangePasswordForm({
                ...changePasswordForm,
                confirmPassword: e.target.value
              })}
              placeholder={isAr ? 'أعد إدخال كلمة المرور الجديدة' : 'Confirm new password'}
              leftIcon={<Key className="h-4 w-4" />}
            />
          </div>

          <Button
            onClick={handleChangePassword}
            className="w-full mt-4"
            disabled={!changePasswordForm.currentPassword || !changePasswordForm.newPassword || !changePasswordForm.confirmPassword}
          >
            <Key className="h-4 w-4 me-2" />
            {t('settings.changePassword')}
          </Button>
        </CardContent>
      </Card>
    );
  };

  const renderUsersTab = () => (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col gap-2 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder={isAr ? 'بحث في المستخدمين...' : 'Search users...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="h-4 w-4 sm:h-5 sm:w-5" />}
          className="sm:max-w-xs text-xs sm:text-sm"
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            leftIcon={<Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
            onClick={() => setShowChangePasswordModal(true)}
            className="text-xs sm:text-sm shrink-0"
          >
            {isAr ? 'تغيير كلمة المرور' : 'Change Password'}
          </Button>
          <Button leftIcon={<Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />} onClick={() => setShowAddModal(true)} className="text-xs sm:text-sm shrink-0">
            {t('users.addUser')}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--background-secondary)]">
                  <th className="p-2 sm:p-3 md:p-4 text-start text-[10px] sm:text-xs md:text-sm font-medium text-[var(--foreground-secondary)]">
                    {t('users.fullName')}
                  </th>
                  <th className="p-2 sm:p-3 md:p-4 text-start text-[10px] sm:text-xs md:text-sm font-medium text-[var(--foreground-secondary)] hidden sm:table-cell">
                    {t('users.email')}
                  </th>
                  <th className="p-2 sm:p-3 md:p-4 text-start text-[10px] sm:text-xs md:text-sm font-medium text-[var(--foreground-secondary)]">
                    {t('users.role')}
                  </th>
                  <th className="p-2 sm:p-3 md:p-4 text-start text-[10px] sm:text-xs md:text-sm font-medium text-[var(--foreground-secondary)] hidden md:table-cell">
                    {t('users.department')}
                  </th>
                  <th className="p-2 sm:p-3 md:p-4 text-start text-[10px] sm:text-xs md:text-sm font-medium text-[var(--foreground-secondary)] hidden sm:table-cell">
                    {t('users.status')}
                  </th>
                  <th className="p-2 sm:p-3 md:p-4 text-start text-[10px] sm:text-xs md:text-sm font-medium text-[var(--foreground-secondary)] hidden md:table-cell">
                    {isAr ? 'الإدارات المتاحة' : 'Accessible Depts'}
                  </th>
                  <th className="p-2 sm:p-3 md:p-4 text-center text-[10px] sm:text-xs md:text-sm font-medium text-[var(--foreground-secondary)]">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-[var(--border)] transition-colors hover:bg-[var(--background-secondary)]"
                  >
                    <td className="p-2 sm:p-3 md:p-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 items-center justify-center rounded-full bg-[var(--primary)] text-[10px] sm:text-xs md:text-sm font-medium text-white shrink-0">
                          {(isAr ? user.fullName : (user.fullNameEn || user.fullName)).charAt(0)}
                        </div>
                        <span className="font-medium text-[var(--foreground)] text-xs sm:text-sm truncate max-w-[80px] sm:max-w-none">
                          {isAr ? user.fullName : (user.fullNameEn || user.fullName)}
                        </span>
                      </div>
                    </td>
                    <td className="p-2 sm:p-3 md:p-4 text-xs sm:text-sm text-[var(--foreground-secondary)] hidden sm:table-cell truncate max-w-[120px]">
                      {user.email}
                    </td>
                    <td className="p-2 sm:p-3 md:p-4">
                      <Badge variant={getRoleColor(user.role)} className="text-[10px] sm:text-xs">
                        {t(`users.roles.${user.role}`)}
                      </Badge>
                    </td>
                    <td className="p-2 sm:p-3 md:p-4 text-xs sm:text-sm text-[var(--foreground-secondary)] hidden md:table-cell">
                      {isAr ? user.department?.nameAr : user.department?.nameEn}
                    </td>
                    <td className="p-2 sm:p-3 md:p-4 hidden sm:table-cell">
                      <Badge variant={user.status === 'active' ? 'success' : 'default'} className="text-[10px] sm:text-xs">
                        {t(`users.statuses.${user.status}`)}
                      </Badge>
                    </td>
                    <td className="p-2 sm:p-3 md:p-4 hidden md:table-cell">
                      {user.accessibleDepartments && user.accessibleDepartments.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.accessibleDepartments.slice(0, 3).map((access) => (
                            <Badge key={access.id} variant="default" className="text-[9px] sm:text-[10px]">
                              {access.department.code}
                            </Badge>
                          ))}
                          {user.accessibleDepartments.length > 3 && (
                            <Badge variant="default" className="text-[9px] sm:text-[10px]">
                              +{user.accessibleDepartments.length - 3}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] sm:text-xs text-[var(--foreground-tertiary)]">
                          {isAr ? 'لا يوجد' : 'None'}
                        </span>
                      )}
                    </td>
                    <td className="p-2 sm:p-3 md:p-4">
                      <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                        <Button variant="ghost" size="icon-sm" className="h-6 w-6 sm:h-8 sm:w-8" onClick={() => handleEditUser(user)} title={isAr ? 'تعديل' : 'Edit'}>
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-[var(--secondary)] h-6 w-6 sm:h-8 sm:w-8"
                          onClick={() => handleDepartmentAccess(user)}
                          title={isAr ? 'صلاحيات الإدارات' : 'Department Access'}
                        >
                          <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-[var(--primary)] h-6 w-6 sm:h-8 sm:w-8"
                          onClick={() => handleResetPassword(user.id)}
                          title={isAr ? 'إعادة تعيين كلمة المرور' : 'Reset Password'}
                        >
                          <Key className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-[var(--status-error)] h-6 w-6 sm:h-8 sm:w-8"
                          onClick={() => handleDeleteUser(user)}
                          title={isAr ? 'حذف' : 'Delete'}
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
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

  const renderDepartmentsTab = () => (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex justify-end">
        <Button leftIcon={<Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />} className="text-xs sm:text-sm" onClick={() => setShowAddDeptModal(true)}>
          {t('departments.addDepartment')}
        </Button>
      </div>

      <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-2 lg:grid-cols-3">
        {departments.map((dept) => (
          <Card key={dept.id} hover>
            <CardContent className="p-2 sm:p-3 md:p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12 items-center justify-center rounded-lg bg-[var(--primary-light)] shrink-0">
                    <Building2 className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-[var(--primary)]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[var(--foreground)] text-xs sm:text-sm md:text-base truncate">
                      {isAr ? dept.nameAr : dept.nameEn}
                    </h3>
                    <p className="text-[10px] sm:text-xs md:text-sm text-[var(--foreground-secondary)]">{dept.code}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon-sm" className="h-6 w-6 sm:h-8 sm:w-8 shrink-0" onClick={() => handleEditDept(dept)} title={isAr ? 'تعديل' : 'Edit'}>
                  <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
              <div className="mt-3 sm:mt-4 flex items-center justify-between border-t border-[var(--border)] pt-2 sm:pt-3 md:pt-4">
                <span className="text-[10px] sm:text-xs md:text-sm text-[var(--foreground-secondary)]">
                  {t('departments.totalRisks')}
                </span>
                <Badge variant="primary" className="text-[10px] sm:text-xs">{dept._count?.risks || 0}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <Card>
      <CardHeader className="p-3 sm:p-4 md:p-6">
        <CardTitle className="text-sm sm:text-base md:text-lg">{t('settings.notifications')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-3 md:space-y-4 p-3 sm:p-4 md:p-6 pt-0">
        {[
          { key: 'newRisk', label: isAr ? 'إشعار عند إضافة خطر جديد' : 'Notify on new risk' },
          { key: 'riskUpdated', label: isAr ? 'إشعار عند تحديث خطر' : 'Notify on risk update' },
          { key: 'treatmentDue', label: isAr ? 'تذكير بموعد استحقاق المعالجة' : 'Treatment due reminder' },
          { key: 'incidentReported', label: isAr ? 'إشعار عند الإبلاغ عن حادثة' : 'Notify on incident report' },
          { key: 'reviewReminder', label: isAr ? 'تذكير بمراجعة المخاطر' : 'Risk review reminder' },
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between rounded-lg border border-[var(--border)] p-2 sm:p-3 md:p-4">
            <span className="text-xs sm:text-sm font-medium text-[var(--foreground)]">{item.label}</span>
            <label className="relative inline-flex cursor-pointer items-center shrink-0">
              <input type="checkbox" defaultChecked className="peer sr-only" />
              <div className="peer h-5 w-9 sm:h-6 sm:w-11 rounded-full bg-[var(--background-tertiary)] after:absolute after:start-[2px] after:top-[2px] after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-[var(--primary)] peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full"></div>
            </label>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  // Handle import HR risks from pre-loaded data
  const handleImportHRRisks = () => {
    setImportedRisks(hrRisks);
    setImportStats({
      total: hrRisks.length,
      added: hrRisks.length,
      updated: 0,
      skipped: 0,
      errors: 0
    });
    setShowImportSuccess(true);
  };

  const renderDataManagementTab = () => (
    <div className="space-y-3 sm:space-y-4">
      {/* Import Success Message */}
      {showImportSuccess && (
        <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 sm:p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-green-800 dark:text-green-200 text-sm">
                {isAr ? 'تم الاستيراد بنجاح!' : 'Import Successful!'}
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-green-700 dark:text-green-300">
                {isAr
                  ? `تم استيراد ${importStats.added + importStats.updated} خطر من أصل ${importStats.total} (${importStats.added} جديد، ${importStats.updated} محدث)`
                  : `Imported ${importStats.added + importStats.updated} risks out of ${importStats.total} (${importStats.added} new, ${importStats.updated} updated)`}
              </p>
            </div>
            <button
              onClick={() => setShowImportSuccess(false)}
              className="text-green-600 dark:text-green-400 hover:text-green-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Quick Import Section */}
      <Card>
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
            <Upload className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--primary)]" />
            {isAr ? 'استيراد سريع' : 'Quick Import'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
          <p className="text-xs sm:text-sm text-[var(--foreground-secondary)] mb-4">
            {isAr
              ? 'استيراد بيانات المخاطر المجهزة من سجل المخاطر السابق'
              : 'Import pre-configured risk data from previous risk register'}
          </p>

          {/* HR Risks Import Card */}
          <div className="rounded-lg border border-[var(--border)] p-3 sm:p-4 hover:border-[var(--primary)] transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30 shrink-0">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-[var(--foreground)] text-sm sm:text-base">
                    {isAr ? 'مخاطر الموارد البشرية' : 'HR Risks'}
                  </h4>
                  <p className="text-[10px] sm:text-xs text-[var(--foreground-secondary)]">
                    {isAr ? `${hrRisksSummary.total} خطر جاهز للاستيراد` : `${hrRisksSummary.total} risks ready to import`}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={handleImportHRRisks}
                leftIcon={<Upload className="h-3.5 w-3.5" />}
                className="text-xs shrink-0"
                disabled={importedRisks.length > 0}
              >
                {importedRisks.length > 0
                  ? (isAr ? 'تم الاستيراد' : 'Imported')
                  : (isAr ? 'استيراد' : 'Import')}
              </Button>
            </div>

            {/* Risk Summary */}
            <div className="mt-3 pt-3 border-t border-[var(--border)] grid grid-cols-5 gap-2 text-center">
              <div>
                <p className="text-xs sm:text-sm font-bold text-red-600">{hrRisksSummary.critical}</p>
                <p className="text-[9px] sm:text-[10px] text-[var(--foreground-muted)]">
                  {isAr ? 'حرج' : 'Critical'}
                </p>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-orange-600">{hrRisksSummary.major}</p>
                <p className="text-[9px] sm:text-[10px] text-[var(--foreground-muted)]">
                  {isAr ? 'عالي' : 'Major'}
                </p>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-yellow-600">{hrRisksSummary.moderate}</p>
                <p className="text-[9px] sm:text-[10px] text-[var(--foreground-muted)]">
                  {isAr ? 'متوسط' : 'Moderate'}
                </p>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-green-600">{hrRisksSummary.minor}</p>
                <p className="text-[9px] sm:text-[10px] text-[var(--foreground-muted)]">
                  {isAr ? 'منخفض' : 'Minor'}
                </p>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-blue-600">{hrRisksSummary.negligible}</p>
                <p className="text-[9px] sm:text-[10px] text-[var(--foreground-muted)]">
                  {isAr ? 'ضئيل' : 'Negligible'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Download Template */}
      <Card>
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
            <Download className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--primary)]" />
            {isAr ? 'تحميل نموذج الاستيراد' : 'Download Import Template'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
          <p className="text-xs sm:text-sm text-[var(--foreground-secondary)] mb-4">
            {isAr
              ? 'قم بتحميل النموذج وتعبئته بالبيانات ثم ارفعه للاستيراد. النموذج يحتوي على جميع الحقول المطلوبة مع أمثلة توضيحية.'
              : 'Download the template, fill it with your data, then upload it for import. The template contains all required fields with examples.'}
          </p>
          <div className="rounded-lg border border-[var(--border)] p-4 bg-[var(--background-secondary)]">
            <div className="flex flex-wrap gap-2 text-[10px] sm:text-xs mb-4">
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">Risk_ID</span>
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">Title</span>
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">Description</span>
              <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded">Category</span>
              <span className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded">Department</span>
              <span className="px-2 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded">Likelihood</span>
              <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded">Impact</span>
              <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">Status</span>
              <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded">+10 more</span>
            </div>
            <Button onClick={handleDownloadTemplate} leftIcon={<Download className="h-4 w-4" />}>
              {isAr ? 'تحميل النموذج (CSV)' : 'Download Template (CSV)'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* CSV/Excel Import */}
      <Card>
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
            <FileSpreadsheet className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--primary)]" />
            {t('settings.importData')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0 space-y-4">
          {/* Import Mode Selection */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              {isAr ? 'وضع الاستيراد' : 'Import Mode'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => setImportMode('addOnly')}
                className={`p-3 rounded-lg border-2 text-start transition-all ${
                  importMode === 'addOnly'
                    ? 'border-[var(--primary)] bg-[var(--primary-light)]'
                    : 'border-[var(--border)] hover:border-[var(--border-hover)]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Plus className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-sm">{isAr ? 'إضافة فقط' : 'Add Only'}</span>
                </div>
                <p className="text-[10px] sm:text-xs text-[var(--foreground-secondary)]">
                  {isAr ? 'إضافة مخاطر جديدة وتجاهل المكررات' : 'Add new risks, skip duplicates'}
                </p>
              </button>
              <button
                onClick={() => setImportMode('updateOnly')}
                className={`p-3 rounded-lg border-2 text-start transition-all ${
                  importMode === 'updateOnly'
                    ? 'border-[var(--primary)] bg-[var(--primary-light)]'
                    : 'border-[var(--border)] hover:border-[var(--border-hover)]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Edit className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-sm">{isAr ? 'تحديث فقط' : 'Update Only'}</span>
                </div>
                <p className="text-[10px] sm:text-xs text-[var(--foreground-secondary)]">
                  {isAr ? 'تحديث المخاطر الموجودة فقط' : 'Only update existing risks'}
                </p>
              </button>
              <button
                onClick={() => setImportMode('addAndUpdate')}
                className={`p-3 rounded-lg border-2 text-start transition-all ${
                  importMode === 'addAndUpdate'
                    ? 'border-[var(--primary)] bg-[var(--primary-light)]'
                    : 'border-[var(--border)] hover:border-[var(--border-hover)]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-sm">{isAr ? 'إضافة وتحديث' : 'Add & Update'}</span>
                </div>
                <p className="text-[10px] sm:text-xs text-[var(--foreground-secondary)]">
                  {isAr ? 'إضافة الجديد وتحديث الموجود' : 'Add new & update existing'}
                </p>
              </button>
            </div>
          </div>

          {/* Duplicate Detection Info */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs sm:text-sm font-medium text-blue-800 dark:text-blue-200">
                  {isAr ? 'كشف التكرار' : 'Duplicate Detection'}
                </p>
                <p className="text-[10px] sm:text-xs text-blue-700 dark:text-blue-300 mt-1">
                  {isAr
                    ? 'يتم كشف المخاطر المكررة عن طريق رمز الخطر (Risk_ID). إذا كان الرمز موجوداً مسبقاً، سيتم التعامل معه حسب وضع الاستيراد المحدد.'
                    : 'Duplicates are detected by Risk_ID. If the ID already exists, it will be handled based on the selected import mode.'}
                </p>
              </div>
            </div>
          </div>

          {/* File Upload Area */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".csv,.xlsx,.xls"
            className="hidden"
          />
          <div
            className="rounded-lg border-2 border-dashed border-[var(--border)] p-4 sm:p-6 md:p-8 text-center hover:border-[var(--primary)] transition-colors cursor-pointer"
            onClick={handleChooseFile}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-[var(--primary)]'); }}
            onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-[var(--primary)]'); }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('border-[var(--primary)]');
              const file = e.dataTransfer.files?.[0];
              if (file && fileInputRef.current) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                fileInputRef.current.files = dataTransfer.files;
                handleFileSelect({ target: fileInputRef.current } as React.ChangeEvent<HTMLInputElement>);
              }
            }}
          >
            <Upload className="mx-auto h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-[var(--foreground-muted)]" />
            <p className="mt-2 sm:mt-3 md:mt-4 text-xs sm:text-sm text-[var(--foreground-secondary)]">
              {isAr
                ? 'اسحب وأفلت ملف Excel أو CSV هنا'
                : 'Drag and drop Excel or CSV file here'}
            </p>
            <p className="mt-1 text-[10px] sm:text-xs text-[var(--foreground-muted)]">
              {isAr ? 'استخدم النموذج أعلاه للحصول على التنسيق الصحيح' : 'Use the template above to get the correct format'}
            </p>
            <Button variant="outline" className="mt-2 sm:mt-3 md:mt-4 text-xs sm:text-sm" onClick={(e) => { e.stopPropagation(); handleChooseFile(); }}>
              {isAr ? 'اختر ملف' : 'Choose File'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export Section */}
      <Card>
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
            <Download className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--primary)]" />
            {t('settings.exportData')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
          <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-2">
            <Button variant="outline" className="h-auto flex-col gap-1.5 sm:gap-2 p-2 sm:p-3 md:p-4 text-xs sm:text-sm" onClick={handleExportRiskRegister}>
              <Database className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-[var(--primary)]" />
              <span>{isAr ? 'تصدير سجل المخاطر' : 'Export Risk Register'}</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-1.5 sm:gap-2 p-2 sm:p-3 md:p-4 text-xs sm:text-sm" onClick={handleExportExcel}>
              <FileSpreadsheet className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-green-600" />
              <span>{isAr ? 'تصدير كـ Excel' : 'Export as Excel'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Imported Risks Preview */}
      {importedRisks.length > 0 && (
        <Card>
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="text-sm sm:text-base md:text-lg">
              {isAr ? 'المخاطر المستوردة' : 'Imported Risks'}
              <Badge variant="success" className="ms-2">{importedRisks.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-[var(--background-secondary)]">
                  <tr className="border-b border-[var(--border)]">
                    <th className="p-2 sm:p-3 text-start text-[10px] sm:text-xs font-medium text-[var(--foreground-secondary)]">
                      {isAr ? 'رقم الخطر' : 'Risk ID'}
                    </th>
                    <th className="p-2 sm:p-3 text-start text-[10px] sm:text-xs font-medium text-[var(--foreground-secondary)]">
                      {isAr ? 'الوصف' : 'Description'}
                    </th>
                    <th className="p-2 sm:p-3 text-start text-[10px] sm:text-xs font-medium text-[var(--foreground-secondary)]">
                      {isAr ? 'التقييم' : 'Rating'}
                    </th>
                    <th className="p-2 sm:p-3 text-start text-[10px] sm:text-xs font-medium text-[var(--foreground-secondary)]">
                      {isAr ? 'الحالة' : 'Status'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {importedRisks.slice(0, 10).map((risk) => (
                    <tr key={risk.id} className="border-b border-[var(--border)] hover:bg-[var(--background-secondary)]">
                      <td className="p-2 sm:p-3">
                        <code className="text-[10px] sm:text-xs font-mono bg-[var(--background-tertiary)] px-1.5 py-0.5 rounded">
                          {risk.riskId}
                        </code>
                      </td>
                      <td className="p-2 sm:p-3 text-[10px] sm:text-xs text-[var(--foreground)] max-w-[200px] truncate">
                        {isAr ? risk.descriptionAr : risk.descriptionEn}
                      </td>
                      <td className="p-2 sm:p-3">
                        <Badge
                          variant={
                            risk.inherentRating === 'Critical' ? 'critical' :
                            risk.inherentRating === 'Major' ? 'high' :
                            risk.inherentRating === 'Moderate' ? 'medium' :
                            risk.inherentRating === 'Minor' ? 'low' : 'default'
                          }
                          className="text-[9px] sm:text-[10px]"
                        >
                          {risk.inherentRating}
                        </Badge>
                      </td>
                      <td className="p-2 sm:p-3">
                        <Badge variant="info" className="text-[9px] sm:text-[10px]">
                          {risk.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {importedRisks.length > 10 && (
                <p className="text-center text-xs text-[var(--foreground-muted)] py-2">
                  {isAr
                    ? `+ ${importedRisks.length - 10} مخاطر إضافية`
                    : `+ ${importedRisks.length - 10} more risks`}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Backup handlers
  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const response = await fetch('/api/backup');
      if (!response.ok) {
        throw new Error('فشل في إنشاء النسخة الاحتياطية');
      }

      // Get the blob and create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `erm-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      alert(isAr ? 'تم إنشاء النسخة الاحتياطية بنجاح!' : 'Backup created successfully!');
    } catch (error) {
      console.error('Error creating backup:', error);
      alert(isAr ? 'فشل في إنشاء النسخة الاحتياطية' : 'Failed to create backup');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleBackupFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.json')) {
        alert(isAr ? 'يرجى اختيار ملف JSON' : 'Please select a JSON file');
        return;
      }
      setBackupFile(file);
      setShowRestoreModal(true);
    }
  };

  const handleRestoreBackup = async () => {
    if (!backupFile) return;

    setIsRestoringBackup(true);
    setRestoreResults(null);

    try {
      const fileContent = await backupFile.text();
      const backupData = JSON.parse(fileContent);

      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backupData),
      });

      const result = await response.json();

      setRestoreResults({
        success: result.success,
        message: result.message || (result.success ? 'تمت الاستعادة بنجاح' : 'فشلت الاستعادة'),
        results: result.results,
        errors: result.results?.errors,
      });

      if (result.success) {
        // Refresh the page data
        window.location.reload();
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
      setRestoreResults({
        success: false,
        message: isAr ? 'فشل في قراءة ملف النسخة الاحتياطية' : 'Failed to read backup file',
      });
    } finally {
      setIsRestoringBackup(false);
    }
  };

  // Render Backup Tab
  const renderBackupTab = () => (
    <div className="space-y-4 sm:space-y-6">
      {/* Backup Info */}
      <Card>
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
            <HardDrive className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--primary)]" />
            {isAr ? 'النسخ الاحتياطي واستعادة البيانات' : 'Backup & Restore'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
          <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20 p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  {isAr ? 'معلومات هامة' : 'Important Information'}
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  {isAr
                    ? 'النسخة الاحتياطية تشمل: المستخدمين، الإدارات، التصنيفات، المخاطر، الحالات، المصادر، التعليقات، وصلاحيات الوصول. لا تتضمن كلمات المرور لأسباب أمنية.'
                    : 'Backup includes: Users, Departments, Categories, Risks, Statuses, Sources, Comments, and Access Permissions. Passwords are not included for security reasons.'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Backup */}
      <Card>
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
            <DownloadCloud className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            {isAr ? 'إنشاء نسخة احتياطية' : 'Create Backup'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
          <p className="text-sm text-[var(--foreground-secondary)] mb-4">
            {isAr
              ? 'قم بتحميل نسخة احتياطية كاملة من قاعدة البيانات بتنسيق JSON. يمكنك استخدام هذا الملف لاستعادة البيانات لاحقاً.'
              : 'Download a complete backup of the database in JSON format. You can use this file to restore data later.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleCreateBackup}
              disabled={isCreatingBackup}
              leftIcon={isCreatingBackup ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              className="flex-1 sm:flex-none"
            >
              {isCreatingBackup
                ? (isAr ? 'جاري إنشاء النسخة...' : 'Creating backup...')
                : (isAr ? 'تحميل النسخة الاحتياطية' : 'Download Backup')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Restore Backup */}
      <Card>
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
            <UploadCloud className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
            {isAr ? 'استعادة من نسخة احتياطية' : 'Restore from Backup'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
          <div className="rounded-lg border border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20 p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  {isAr ? 'تحذير' : 'Warning'}
                </p>
                <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                  {isAr
                    ? 'استعادة النسخة الاحتياطية ستقوم بتحديث أو إضافة البيانات الموجودة. تأكد من أنك تريد المتابعة.'
                    : 'Restoring backup will update or add existing data. Make sure you want to proceed.'}
                </p>
              </div>
            </div>
          </div>

          <input
            type="file"
            accept=".json"
            ref={backupFileInputRef}
            onChange={handleBackupFileSelect}
            className="hidden"
          />

          <Button
            variant="outline"
            onClick={() => backupFileInputRef.current?.click()}
            leftIcon={<Upload className="h-4 w-4" />}
          >
            {isAr ? 'اختيار ملف النسخة الاحتياطية' : 'Select Backup File'}
          </Button>
        </CardContent>
      </Card>

      {/* Restore Confirmation Modal */}
      <Modal
        isOpen={showRestoreModal}
        onClose={() => {
          setShowRestoreModal(false);
          setBackupFile(null);
          setRestoreResults(null);
        }}
        title={isAr ? 'تأكيد الاستعادة' : 'Confirm Restore'}
        size="md"
      >
        {restoreResults ? (
          <div className="space-y-4">
            <div className={`rounded-lg p-4 ${restoreResults.success ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
              <div className="flex items-center gap-2">
                {restoreResults.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <p className={`font-medium ${restoreResults.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                  {restoreResults.message}
                </p>
              </div>
            </div>

            {restoreResults.results && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {isAr ? 'نتائج الاستعادة:' : 'Restore Results:'}
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(restoreResults.results)
                    .filter(([key]) => key !== 'errors')
                    .map(([key, value]) => (
                      <div key={key} className="flex justify-between p-2 bg-[var(--background-secondary)] rounded">
                        <span className="text-[var(--foreground-secondary)]">{key}:</span>
                        <span className="font-medium">{value as number}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-[var(--background-secondary)] rounded-lg">
              <FileJson className="h-8 w-8 text-[var(--primary)]" />
              <div>
                <p className="font-medium text-[var(--foreground)]">{backupFile?.name}</p>
                <p className="text-sm text-[var(--foreground-secondary)]">
                  {backupFile && `${(backupFile.size / 1024).toFixed(2)} KB`}
                </p>
              </div>
            </div>

            <p className="text-sm text-[var(--foreground-secondary)]">
              {isAr
                ? 'هل أنت متأكد من أنك تريد استعادة البيانات من هذا الملف؟ سيتم تحديث أو إضافة البيانات الموجودة.'
                : 'Are you sure you want to restore data from this file? Existing data will be updated or added.'}
            </p>
          </div>
        )}
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => {
              setShowRestoreModal(false);
              setBackupFile(null);
              setRestoreResults(null);
            }}
          >
            {restoreResults ? (isAr ? 'إغلاق' : 'Close') : (isAr ? 'إلغاء' : 'Cancel')}
          </Button>
          {!restoreResults && (
            <Button
              variant="danger"
              onClick={handleRestoreBackup}
              disabled={isRestoringBackup}
              leftIcon={isRestoringBackup ? <RefreshCw className="h-4 w-4 animate-spin" /> : undefined}
            >
              {isRestoringBackup
                ? (isAr ? 'جاري الاستعادة...' : 'Restoring...')
                : (isAr ? 'استعادة البيانات' : 'Restore Data')}
            </Button>
          )}
        </ModalFooter>
      </Modal>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="min-w-0">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--foreground)] truncate">
          {t('settings.title')}
        </h1>
        <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-[var(--foreground-secondary)]">
          {isAr ? 'إدارة إعدادات النظام والمستخدمين' : 'Manage system settings and users'}
        </p>
      </div>

      {/* Limited Access Notice for non-admin users */}
      {accessibleTabs.length <= 1 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20 p-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                {isAr ? 'صلاحيات محدودة' : 'Limited Access'}
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                {isAr
                  ? 'لديك صلاحيات محدودة في هذه الصفحة. يمكنك فقط إدارة إعدادات الإشعارات الخاصة بك.'
                  : 'You have limited access to this page. You can only manage your notification settings.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 border-b border-[var(--border)] pb-3 sm:pb-4">
        {accessibleTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 sm:gap-2 rounded-lg px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs md:text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)]'
              }`}
            >
              <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
              {t(`settings.${tab.id}`)}
            </button>
          );
        })}
      </div>

      {/* Tab Content - Only render if user has access */}
      {activeTab === 'profile' && canAccessTab('profile') && renderProfileTab()}
      {activeTab === 'changePassword' && canAccessTab('changePassword') && renderChangePasswordTab()}
      {activeTab === 'users' && canAccessTab('users') && renderUsersTab()}
      {activeTab === 'departments' && canAccessTab('departments') && renderDepartmentsTab()}
      {activeTab === 'notifications' && canAccessTab('notifications') && renderNotificationsTab()}
      {activeTab === 'dataManagement' && canAccessTab('dataManagement') && renderDataManagementTab()}
      {activeTab === 'backup' && canAccessTab('backup') && renderBackupTab()}
      {activeTab === 'auditLog' && canAccessTab('auditLog') && <AuditLogTab />}
      {activeTab === 'riskEditor' && canAccessTab('riskEditor') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                {isAr ? 'محرر المخاطر' : 'Risk Editor'}
              </h2>
              <p className="text-sm text-[var(--foreground-secondary)]">
                {isAr ? 'تعديل وإدارة جميع المخاطر في جدول شبيه بالإكسل' : 'Edit and manage all risks in an Excel-like table'}
              </p>
            </div>
          </div>
          <RiskEditor />
        </div>
      )}
      {activeTab === 'categories' && canAccessTab('categories') && (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex justify-end">
            <Button leftIcon={<Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />} className="text-xs sm:text-sm" onClick={() => setShowAddCategoryModal(true)}>
              {isAr ? 'إضافة تصنيف' : 'Add Category'}
            </Button>
          </div>

          <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Card key={category.id} hover>
                <CardContent className="p-2 sm:p-3 md:p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className={`flex h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12 items-center justify-center rounded-lg ${category.color} shrink-0`}>
                        <Tag className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-[var(--foreground)] text-xs sm:text-sm md:text-base truncate">
                          {isAr ? category.nameAr : category.nameEn}
                        </h3>
                        <p className="text-[10px] sm:text-xs md:text-sm text-[var(--foreground-secondary)]">{category.code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button variant="ghost" size="icon-sm" className="h-6 w-6 sm:h-8 sm:w-8" onClick={() => handleEditCategory(category)} title={isAr ? 'تعديل' : 'Edit'}>
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--status-error)]" onClick={() => handleDeleteCategory(category)} title={isAr ? 'حذف' : 'Delete'}>
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 sm:mt-4 flex items-center justify-between border-t border-[var(--border)] pt-2 sm:pt-3 md:pt-4">
                    <span className="text-[10px] sm:text-xs md:text-sm text-[var(--foreground-secondary)]">
                      {isAr ? 'عدد المخاطر' : 'Risks Count'}
                    </span>
                    <Badge variant="primary" className="text-[10px] sm:text-xs">{category._count?.risks || 0}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Sources Tab */}
      {activeTab === 'sources' && canAccessTab('sources') && (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex justify-end">
            <Button leftIcon={<Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />} className="text-xs sm:text-sm" onClick={() => setShowAddSourceModal(true)}>
              {isAr ? 'إضافة مصدر' : 'Add Source'}
            </Button>
          </div>

          <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-2 lg:grid-cols-3">
            {sources.map((source) => (
              <Card key={source.id} hover>
                <CardContent className="p-2 sm:p-3 md:p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className="flex h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12 items-center justify-center rounded-lg bg-blue-500 shrink-0">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-[var(--foreground)] text-xs sm:text-sm md:text-base truncate">
                          {isAr ? source.nameAr : source.nameEn}
                        </h3>
                        <p className="text-[10px] sm:text-xs md:text-sm text-[var(--foreground-secondary)]">{source.code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button variant="ghost" size="icon-sm" className="h-6 w-6 sm:h-8 sm:w-8" onClick={() => handleEditSource(source)} title={isAr ? 'تعديل' : 'Edit'}>
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--status-error)]" onClick={() => handleDeleteSource(source)} title={isAr ? 'حذف' : 'Delete'}>
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 sm:mt-4 flex items-center justify-between border-t border-[var(--border)] pt-2 sm:pt-3 md:pt-4">
                    <span className="text-[10px] sm:text-xs md:text-sm text-[var(--foreground-secondary)]">
                      {isAr ? 'عدد المخاطر' : 'Risks Count'}
                    </span>
                    <Badge variant="primary" className="text-[10px] sm:text-xs">{source._count?.risks || 0}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Risk Statuses Tab */}
      {activeTab === 'riskStatuses' && canAccessTab('riskStatuses') && (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex justify-end">
            <Button leftIcon={<Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />} className="text-xs sm:text-sm" onClick={() => setShowAddStatusModal(true)}>
              {isAr ? 'إضافة حالة' : 'Add Status'}
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="p-2 sm:p-3 text-start text-xs sm:text-sm font-semibold text-[var(--foreground)]">
                    {isAr ? 'الحالة' : 'Status'}
                  </th>
                  <th className="p-2 sm:p-3 text-start text-xs sm:text-sm font-semibold text-[var(--foreground)]">
                    {isAr ? 'الكود' : 'Code'}
                  </th>
                  <th className="p-2 sm:p-3 text-start text-xs sm:text-sm font-semibold text-[var(--foreground)]">
                    {isAr ? 'الوصف' : 'Description'}
                  </th>
                  <th className="p-2 sm:p-3 text-center text-xs sm:text-sm font-semibold text-[var(--foreground)]">
                    {isAr ? 'افتراضي' : 'Default'}
                  </th>
                  <th className="p-2 sm:p-3 text-center text-xs sm:text-sm font-semibold text-[var(--foreground)]">
                    {isAr ? 'المخاطر' : 'Risks'}
                  </th>
                  <th className="p-2 sm:p-3 text-center text-xs sm:text-sm font-semibold text-[var(--foreground)]">
                    {isAr ? 'الإجراءات' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {riskStatuses.map((status) => (
                  <tr key={status.id} className="border-b border-[var(--border)] hover:bg-[var(--background-tertiary)]">
                    <td className="p-2 sm:p-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div
                          className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full"
                          style={{ backgroundColor: status.color || '#3b82f6' }}
                        >
                          <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </div>
                        <p className="font-medium text-[var(--foreground)] text-xs sm:text-sm">
                          {isAr ? status.nameAr : status.nameEn}
                        </p>
                      </div>
                    </td>
                    <td className="p-2 sm:p-3 text-xs sm:text-sm text-[var(--foreground-secondary)]">
                      {status.code}
                    </td>
                    <td className="p-2 sm:p-3 text-xs sm:text-sm text-[var(--foreground-secondary)] max-w-[200px] truncate">
                      {isAr ? status.descriptionAr || '-' : status.descriptionEn || '-'}
                    </td>
                    <td className="p-2 sm:p-3 text-center">
                      {status.isDefault ? (
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mx-auto" />
                      ) : (
                        <span className="text-[var(--foreground-secondary)]">-</span>
                      )}
                    </td>
                    <td className="p-2 sm:p-3 text-center">
                      <Badge variant="primary" className="text-[10px] sm:text-xs">{status._count?.risks || 0}</Badge>
                    </td>
                    <td className="p-2 sm:p-3">
                      <div className="flex justify-center gap-1">
                        <Button variant="ghost" size="icon-sm" className="h-6 w-6 sm:h-8 sm:w-8" onClick={() => handleEditStatus(status)} title={isAr ? 'تعديل' : 'Edit'}>
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--status-error)]" onClick={() => handleDeleteStatus(status)} title={isAr ? 'حذف' : 'Delete'}>
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Risk Owners Tab */}
      {activeTab === 'riskOwners' && canAccessTab('riskOwners') && (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex justify-end">
            <Button leftIcon={<Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />} className="text-xs sm:text-sm" onClick={() => setShowAddRiskOwnerModal(true)}>
              {isAr ? 'إضافة مالك خطر' : 'Add Risk Owner'}
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="p-2 sm:p-3 text-start text-xs sm:text-sm font-semibold text-[var(--foreground)]">
                    {isAr ? 'الاسم' : 'Name'}
                  </th>
                  <th className="p-2 sm:p-3 text-start text-xs sm:text-sm font-semibold text-[var(--foreground)]">
                    {isAr ? 'البريد الإلكتروني' : 'Email'}
                  </th>
                  <th className="p-2 sm:p-3 text-start text-xs sm:text-sm font-semibold text-[var(--foreground)]">
                    {isAr ? 'الإدارة' : 'Department'}
                  </th>
                  <th className="p-2 sm:p-3 text-start text-xs sm:text-sm font-semibold text-[var(--foreground)]">
                    {isAr ? 'المخاطر' : 'Risks'}
                  </th>
                  <th className="p-2 sm:p-3 text-center text-xs sm:text-sm font-semibold text-[var(--foreground)]">
                    {isAr ? 'الإجراءات' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {riskOwners.map((owner) => (
                  <tr key={owner.id} className="border-b border-[var(--border)] hover:bg-[var(--background-tertiary)]">
                    <td className="p-2 sm:p-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] text-white text-xs sm:text-sm font-semibold">
                          {owner.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-[var(--foreground)] text-xs sm:text-sm">
                            {isAr ? owner.fullName : (owner.fullNameEn || owner.fullName)}
                          </p>
                          {owner.phone && (
                            <p className="text-[10px] sm:text-xs text-[var(--foreground-secondary)]">{owner.phone}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-2 sm:p-3 text-xs sm:text-sm text-[var(--foreground-secondary)]">
                      {owner.email || '-'}
                    </td>
                    <td className="p-2 sm:p-3 text-xs sm:text-sm text-[var(--foreground-secondary)]">
                      {owner.department ? (isAr ? owner.department.nameAr : owner.department.nameEn) : '-'}
                    </td>
                    <td className="p-2 sm:p-3">
                      <Badge variant="primary" className="text-[10px] sm:text-xs">{owner._count?.risks || 0}</Badge>
                    </td>
                    <td className="p-2 sm:p-3">
                      <div className="flex justify-center gap-1">
                        <Button variant="ghost" size="icon-sm" className="h-6 w-6 sm:h-8 sm:w-8" onClick={() => handleEditRiskOwner(owner)} title={isAr ? 'تعديل' : 'Edit'}>
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--status-error)]" onClick={() => handleDeleteRiskOwner(owner)} title={isAr ? 'حذف' : 'Delete'}>
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={t('users.addUser')}
        size="lg"
      >
        <form className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={isAr ? 'الاسم الكامل (عربي)' : 'Full Name (Arabic)'}
              value={newUserForm.fullNameAr}
              onChange={(e) => setNewUserForm(prev => ({ ...prev, fullNameAr: e.target.value }))}
              required
            />
            <Input
              label={isAr ? 'الاسم الكامل (إنجليزي)' : 'Full Name (English)'}
              value={newUserForm.fullNameEn}
              onChange={(e) => setNewUserForm(prev => ({ ...prev, fullNameEn: e.target.value }))}
              required
            />
          </div>
          <Input
            type="email"
            label={t('users.email')}
            value={newUserForm.email}
            onChange={(e) => setNewUserForm(prev => ({ ...prev, email: e.target.value }))}
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label={t('users.role')}
              options={[
                { value: 'admin', label: t('users.roles.admin') },
                { value: 'riskManager', label: t('users.roles.riskManager') },
                { value: 'riskAnalyst', label: t('users.roles.riskAnalyst') },
                { value: 'riskChampion', label: t('users.roles.riskChampion') },
                { value: 'employee', label: t('users.roles.employee') },
              ]}
              value={newUserForm.role}
              onChange={(value) => setNewUserForm(prev => ({ ...prev, role: value }))}
              placeholder={isAr ? 'اختر الدور' : 'Select Role'}
            />
            <Select
              label={t('users.department')}
              options={[
                { value: '', label: isAr ? 'بدون إدارة' : 'No Department' },
                ...departments.map((d) => ({
                  value: d.id,
                  label: isAr ? d.nameAr : d.nameEn,
                })),
              ]}
              value={newUserForm.departmentId}
              onChange={(value) => setNewUserForm(prev => ({ ...prev, departmentId: value }))}
              placeholder={isAr ? 'اختر الإدارة' : 'Select Department'}
            />
          </div>
        </form>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowAddModal(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={addNewUser}>
            {t('common.save')}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditUserModal}
        onClose={() => {
          setShowEditUserModal(false);
          setSelectedUser(null);
        }}
        title={isAr ? 'تعديل المستخدم' : 'Edit User'}
        size="lg"
      >
        {selectedUser && (
          <form className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label={isAr ? 'الاسم الكامل (عربي)' : 'Full Name (Arabic)'}
                value={editUserForm.fullNameAr}
                onChange={(e) => setEditUserForm(prev => ({ ...prev, fullNameAr: e.target.value }))}
              />
              <Input
                label={isAr ? 'الاسم الكامل (إنجليزي)' : 'Full Name (English)'}
                value={editUserForm.fullNameEn}
                onChange={(e) => setEditUserForm(prev => ({ ...prev, fullNameEn: e.target.value }))}
              />
            </div>
            <Input
              type="email"
              label={t('users.email')}
              value={editUserForm.email}
              onChange={(e) => setEditUserForm(prev => ({ ...prev, email: e.target.value }))}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label={t('users.role')}
                options={[
                  { value: 'admin', label: t('users.roles.admin') },
                  { value: 'riskManager', label: t('users.roles.riskManager') },
                  { value: 'riskAnalyst', label: t('users.roles.riskAnalyst') },
                  { value: 'riskChampion', label: t('users.roles.riskChampion') },
                  { value: 'employee', label: t('users.roles.employee') },
                ]}
                value={editUserForm.role}
                onChange={(value) => setEditUserForm(prev => ({ ...prev, role: value }))}
              />
              <Select
                label={t('users.status')}
                options={[
                  { value: 'active', label: t('users.statuses.active') },
                  { value: 'inactive', label: t('users.statuses.inactive') },
                ]}
                value={editUserForm.status}
                onChange={(value) => setEditUserForm(prev => ({ ...prev, status: value }))}
              />
            </div>
          </form>
        )}
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowEditUserModal(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={saveEditUser}>
            {t('common.save')}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete User Confirmation Modal */}
      <Modal
        isOpen={showDeleteUserModal}
        onClose={() => {
          setShowDeleteUserModal(false);
          setSelectedUser(null);
        }}
        title={isAr ? 'تأكيد الحذف' : 'Confirm Delete'}
        size="sm"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
              <Trash2 className="h-6 w-6 text-red-500" />
              <div>
                <p className="font-medium text-[var(--foreground)]">
                  {isAr ? 'هل أنت متأكد من حذف هذا المستخدم؟' : 'Are you sure you want to delete this user?'}
                </p>
                <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
                  {isAr ? 'لا يمكن التراجع عن هذا الإجراء' : 'This action cannot be undone'}
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-[var(--border)] p-4">
              <p className="font-medium text-[var(--foreground)]">
                {isAr ? (selectedUser as unknown as APIUser).fullName : ((selectedUser as unknown as APIUser).fullNameEn || (selectedUser as unknown as APIUser).fullName)}
              </p>
              <p className="text-sm text-[var(--foreground-secondary)]">{selectedUser.email}</p>
            </div>
          </div>
        )}
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowDeleteUserModal(false)}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" onClick={confirmDeleteUser}>
            <Trash2 className="me-2 h-4 w-4" />
            {t('common.delete')}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Edit Department Modal */}
      <Modal
        isOpen={showEditDeptModal}
        onClose={() => {
          setShowEditDeptModal(false);
          setSelectedDept(null);
        }}
        title={isAr ? 'تعديل الإدارة' : 'Edit Department'}
        size="md"
      >
        {selectedDept && (
          <form className="space-y-4">
            <Input
              label={isAr ? 'اسم الإدارة (عربي)' : 'Department Name (Arabic)'}
              value={editDeptForm.nameAr}
              onChange={(e) => setEditDeptForm(prev => ({ ...prev, nameAr: e.target.value }))}
            />
            <Input
              label={isAr ? 'اسم الإدارة (إنجليزي)' : 'Department Name (English)'}
              value={editDeptForm.nameEn}
              onChange={(e) => setEditDeptForm(prev => ({ ...prev, nameEn: e.target.value }))}
            />
            <Input
              label={isAr ? 'رمز الإدارة' : 'Department Code'}
              value={editDeptForm.code}
              onChange={(e) => setEditDeptForm(prev => ({ ...prev, code: e.target.value }))}
            />
          </form>
        )}
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowEditDeptModal(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={saveEditDept}>
            {t('common.save')}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Add Department Modal */}
      <Modal
        isOpen={showAddDeptModal}
        onClose={() => setShowAddDeptModal(false)}
        title={t('departments.addDepartment')}
        size="md"
      >
        <form className="space-y-4">
          <Input
            label={isAr ? 'اسم الإدارة (عربي)' : 'Department Name (Arabic)'}
            value={newDeptForm.nameAr}
            onChange={(e) => setNewDeptForm(prev => ({ ...prev, nameAr: e.target.value }))}
            required
          />
          <Input
            label={isAr ? 'اسم الإدارة (إنجليزي)' : 'Department Name (English)'}
            value={newDeptForm.nameEn}
            onChange={(e) => setNewDeptForm(prev => ({ ...prev, nameEn: e.target.value }))}
            required
          />
          <Input
            label={isAr ? 'رمز الإدارة' : 'Department Code'}
            value={newDeptForm.code}
            onChange={(e) => setNewDeptForm(prev => ({ ...prev, code: e.target.value }))}
            required
          />
        </form>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowAddDeptModal(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={addNewDept}>
            {t('common.save')}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Add Category Modal */}
      <Modal
        isOpen={showAddCategoryModal}
        onClose={() => setShowAddCategoryModal(false)}
        title={isAr ? 'إضافة تصنيف جديد' : 'Add New Category'}
        size="md"
      >
        <form className="space-y-4">
          <Input
            label={isAr ? 'اسم التصنيف (عربي)' : 'Category Name (Arabic)'}
            value={newCategoryForm.nameAr}
            onChange={(e) => setNewCategoryForm(prev => ({ ...prev, nameAr: e.target.value }))}
            required
          />
          <Input
            label={isAr ? 'اسم التصنيف (إنجليزي)' : 'Category Name (English)'}
            value={newCategoryForm.nameEn}
            onChange={(e) => setNewCategoryForm(prev => ({ ...prev, nameEn: e.target.value }))}
            required
          />
          <Input
            label={isAr ? 'رمز التصنيف' : 'Category Code'}
            value={newCategoryForm.code}
            onChange={(e) => setNewCategoryForm(prev => ({ ...prev, code: e.target.value }))}
            required
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
              {isAr ? 'اللون' : 'Color'}
            </label>
            <div className="flex flex-wrap gap-2">
              {categoryColors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setNewCategoryForm(prev => ({ ...prev, color: color.value }))}
                  className={`h-8 w-8 rounded-full ${color.value} transition-all ${
                    newCategoryForm.color === color.value
                      ? 'ring-2 ring-offset-2 ring-[var(--primary)]'
                      : 'hover:scale-110'
                  }`}
                  title={color.label}
                />
              ))}
            </div>
          </div>
        </form>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowAddCategoryModal(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={addNewCategory}>
            {t('common.save')}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        isOpen={showEditCategoryModal}
        onClose={() => {
          setShowEditCategoryModal(false);
          setSelectedCategory(null);
        }}
        title={isAr ? 'تعديل التصنيف' : 'Edit Category'}
        size="md"
      >
        {selectedCategory && (
          <form className="space-y-4">
            <Input
              label={isAr ? 'اسم التصنيف (عربي)' : 'Category Name (Arabic)'}
              value={editCategoryForm.nameAr}
              onChange={(e) => setEditCategoryForm(prev => ({ ...prev, nameAr: e.target.value }))}
            />
            <Input
              label={isAr ? 'اسم التصنيف (إنجليزي)' : 'Category Name (English)'}
              value={editCategoryForm.nameEn}
              onChange={(e) => setEditCategoryForm(prev => ({ ...prev, nameEn: e.target.value }))}
            />
            <Input
              label={isAr ? 'رمز التصنيف' : 'Category Code'}
              value={editCategoryForm.code}
              onChange={(e) => setEditCategoryForm(prev => ({ ...prev, code: e.target.value }))}
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                {isAr ? 'اللون' : 'Color'}
              </label>
              <div className="flex flex-wrap gap-2">
                {categoryColors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setEditCategoryForm(prev => ({ ...prev, color: color.value }))}
                    className={`h-8 w-8 rounded-full ${color.value} transition-all ${
                      editCategoryForm.color === color.value
                        ? 'ring-2 ring-offset-2 ring-[var(--primary)]'
                        : 'hover:scale-110'
                    }`}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
          </form>
        )}
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowEditCategoryModal(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={saveEditCategory}>
            {t('common.save')}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Category Confirmation Modal */}
      <Modal
        isOpen={showDeleteCategoryModal}
        onClose={() => {
          setShowDeleteCategoryModal(false);
          setSelectedCategory(null);
        }}
        title={isAr ? 'تأكيد الحذف' : 'Confirm Delete'}
        size="sm"
      >
        {selectedCategory && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
              <Trash2 className="h-6 w-6 text-red-500" />
              <div>
                <p className="font-medium text-[var(--foreground)]">
                  {isAr ? 'هل أنت متأكد من حذف هذا التصنيف؟' : 'Are you sure you want to delete this category?'}
                </p>
                <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
                  {isAr ? 'لا يمكن التراجع عن هذا الإجراء' : 'This action cannot be undone'}
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-[var(--border)] p-4">
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full ${selectedCategory.color}`}></div>
                <div>
                  <p className="font-medium text-[var(--foreground)]">
                    {isAr ? selectedCategory.nameAr : selectedCategory.nameEn}
                  </p>
                  <p className="text-sm text-[var(--foreground-secondary)]">{selectedCategory.code}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowDeleteCategoryModal(false)}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" onClick={confirmDeleteCategory}>
            <Trash2 className="me-2 h-4 w-4" />
            {t('common.delete')}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Add Source Modal */}
      <Modal
        isOpen={showAddSourceModal}
        onClose={() => setShowAddSourceModal(false)}
        title={isAr ? 'إضافة مصدر جديد' : 'Add New Source'}
        size="md"
      >
        <form className="space-y-4">
          <Input
            label={isAr ? 'الكود' : 'Code'}
            value={newSourceForm.code}
            onChange={(e) => setNewSourceForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
            placeholder={isAr ? 'مثال: KPMG' : 'e.g., KPMG'}
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={isAr ? 'الاسم بالعربي' : 'Name (Arabic)'}
              value={newSourceForm.nameAr}
              onChange={(e) => setNewSourceForm(prev => ({ ...prev, nameAr: e.target.value }))}
              required
            />
            <Input
              label={isAr ? 'الاسم بالإنجليزي' : 'Name (English)'}
              value={newSourceForm.nameEn}
              onChange={(e) => setNewSourceForm(prev => ({ ...prev, nameEn: e.target.value }))}
              required
            />
          </div>
        </form>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowAddSourceModal(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleAddSource}>
            {t('common.save')}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Edit Source Modal */}
      <Modal
        isOpen={showEditSourceModal}
        onClose={() => { setShowEditSourceModal(false); setSelectedSource(null); }}
        title={isAr ? 'تعديل المصدر' : 'Edit Source'}
        size="md"
      >
        <form className="space-y-4">
          <Input
            label={isAr ? 'الكود' : 'Code'}
            value={editSourceForm.code}
            onChange={(e) => setEditSourceForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={isAr ? 'الاسم بالعربي' : 'Name (Arabic)'}
              value={editSourceForm.nameAr}
              onChange={(e) => setEditSourceForm(prev => ({ ...prev, nameAr: e.target.value }))}
              required
            />
            <Input
              label={isAr ? 'الاسم بالإنجليزي' : 'Name (English)'}
              value={editSourceForm.nameEn}
              onChange={(e) => setEditSourceForm(prev => ({ ...prev, nameEn: e.target.value }))}
              required
            />
          </div>
        </form>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowEditSourceModal(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={saveEditSource}>
            {t('common.save')}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Source Modal */}
      <Modal
        isOpen={showDeleteSourceModal}
        onClose={() => { setShowDeleteSourceModal(false); setSelectedSource(null); }}
        title={isAr ? 'تأكيد الحذف' : 'Confirm Delete'}
        size="sm"
      >
        {selectedSource && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg bg-red-50 p-4">
              <Trash2 className="h-6 w-6 text-red-500" />
              <div>
                <p className="font-medium text-[var(--foreground)]">
                  {isAr ? 'هل أنت متأكد من حذف هذا المصدر؟' : 'Are you sure you want to delete this source?'}
                </p>
                <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
                  {isAr ? 'لا يمكن التراجع عن هذا الإجراء' : 'This action cannot be undone'}
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-[var(--border)] p-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-[var(--foreground)]">
                    {isAr ? selectedSource.nameAr : selectedSource.nameEn}
                  </p>
                  <p className="text-sm text-[var(--foreground-secondary)]">{selectedSource.code}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowDeleteSourceModal(false)}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" onClick={confirmDeleteSource}>
            <Trash2 className="me-2 h-4 w-4" />
            {t('common.delete')}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Add Risk Owner Modal */}
      <Modal
        isOpen={showAddRiskOwnerModal}
        onClose={() => setShowAddRiskOwnerModal(false)}
        title={isAr ? 'إضافة مالك خطر جديد' : 'Add New Risk Owner'}
        size="lg"
      >
        <form className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={isAr ? 'الاسم الكامل (عربي)' : 'Full Name (Arabic)'}
              value={newRiskOwnerForm.fullName}
              onChange={(e) => setNewRiskOwnerForm(prev => ({ ...prev, fullName: e.target.value }))}
              required
            />
            <Input
              label={isAr ? 'الاسم الكامل (إنجليزي)' : 'Full Name (English)'}
              value={newRiskOwnerForm.fullNameEn}
              onChange={(e) => setNewRiskOwnerForm(prev => ({ ...prev, fullNameEn: e.target.value }))}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              type="email"
              label={isAr ? 'البريد الإلكتروني' : 'Email'}
              value={newRiskOwnerForm.email}
              onChange={(e) => setNewRiskOwnerForm(prev => ({ ...prev, email: e.target.value }))}
            />
            <Input
              label={isAr ? 'رقم الهاتف' : 'Phone'}
              value={newRiskOwnerForm.phone}
              onChange={(e) => setNewRiskOwnerForm(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>
          <Select
            label={isAr ? 'الإدارة' : 'Department'}
            options={[
              { value: '', label: isAr ? 'بدون إدارة' : 'No Department' },
              ...departments.map((d) => ({
                value: d.id,
                label: isAr ? d.nameAr : d.nameEn,
              })),
            ]}
            value={newRiskOwnerForm.departmentId}
            onChange={(value) => setNewRiskOwnerForm(prev => ({ ...prev, departmentId: value }))}
            placeholder={isAr ? 'اختر الإدارة' : 'Select Department'}
          />
        </form>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowAddRiskOwnerModal(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleAddRiskOwner}>
            {t('common.save')}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Edit Risk Owner Modal */}
      <Modal
        isOpen={showEditRiskOwnerModal}
        onClose={() => { setShowEditRiskOwnerModal(false); setSelectedRiskOwner(null); }}
        title={isAr ? 'تعديل مالك الخطر' : 'Edit Risk Owner'}
        size="lg"
      >
        <form className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={isAr ? 'الاسم الكامل (عربي)' : 'Full Name (Arabic)'}
              value={editRiskOwnerForm.fullName}
              onChange={(e) => setEditRiskOwnerForm(prev => ({ ...prev, fullName: e.target.value }))}
              required
            />
            <Input
              label={isAr ? 'الاسم الكامل (إنجليزي)' : 'Full Name (English)'}
              value={editRiskOwnerForm.fullNameEn}
              onChange={(e) => setEditRiskOwnerForm(prev => ({ ...prev, fullNameEn: e.target.value }))}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              type="email"
              label={isAr ? 'البريد الإلكتروني' : 'Email'}
              value={editRiskOwnerForm.email}
              onChange={(e) => setEditRiskOwnerForm(prev => ({ ...prev, email: e.target.value }))}
            />
            <Input
              label={isAr ? 'رقم الهاتف' : 'Phone'}
              value={editRiskOwnerForm.phone}
              onChange={(e) => setEditRiskOwnerForm(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>
          <Select
            label={isAr ? 'الإدارة' : 'Department'}
            options={[
              { value: '', label: isAr ? 'بدون إدارة' : 'No Department' },
              ...departments.map((d) => ({
                value: d.id,
                label: isAr ? d.nameAr : d.nameEn,
              })),
            ]}
            value={editRiskOwnerForm.departmentId}
            onChange={(value) => setEditRiskOwnerForm(prev => ({ ...prev, departmentId: value }))}
            placeholder={isAr ? 'اختر الإدارة' : 'Select Department'}
          />
        </form>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowEditRiskOwnerModal(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={saveEditRiskOwner}>
            {t('common.save')}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Risk Owner Modal */}
      <Modal
        isOpen={showDeleteRiskOwnerModal}
        onClose={() => { setShowDeleteRiskOwnerModal(false); setSelectedRiskOwner(null); }}
        title={isAr ? 'تأكيد الحذف' : 'Confirm Delete'}
        size="sm"
      >
        {selectedRiskOwner && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg bg-red-50 p-4">
              <Trash2 className="h-6 w-6 text-red-500" />
              <div>
                <p className="font-medium text-[var(--foreground)]">
                  {isAr ? 'هل أنت متأكد من حذف مالك الخطر هذا؟' : 'Are you sure you want to delete this risk owner?'}
                </p>
                <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
                  {isAr ? 'لا يمكن التراجع عن هذا الإجراء' : 'This action cannot be undone'}
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-[var(--border)] p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] flex items-center justify-center text-white font-semibold">
                  {selectedRiskOwner.fullName.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-[var(--foreground)]">
                    {isAr ? selectedRiskOwner.fullName : (selectedRiskOwner.fullNameEn || selectedRiskOwner.fullName)}
                  </p>
                  <p className="text-sm text-[var(--foreground-secondary)]">{selectedRiskOwner.email || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowDeleteRiskOwnerModal(false)}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" onClick={confirmDeleteRiskOwner}>
            <Trash2 className="me-2 h-4 w-4" />
            {t('common.delete')}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Add Risk Status Modal */}
      <Modal
        isOpen={showAddStatusModal}
        onClose={() => setShowAddStatusModal(false)}
        title={isAr ? 'إضافة حالة جديدة' : 'Add New Status'}
        size="lg"
      >
        <form className="space-y-4">
          <Input
            label={isAr ? 'الكود' : 'Code'}
            value={newStatusForm.code}
            onChange={(e) => setNewStatusForm(prev => ({ ...prev, code: e.target.value.toLowerCase() }))}
            placeholder={isAr ? 'مثال: open' : 'e.g., open'}
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={isAr ? 'الاسم بالعربي' : 'Name (Arabic)'}
              value={newStatusForm.nameAr}
              onChange={(e) => setNewStatusForm(prev => ({ ...prev, nameAr: e.target.value }))}
              required
            />
            <Input
              label={isAr ? 'الاسم بالإنجليزي' : 'Name (English)'}
              value={newStatusForm.nameEn}
              onChange={(e) => setNewStatusForm(prev => ({ ...prev, nameEn: e.target.value }))}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={isAr ? 'الوصف بالعربي' : 'Description (Arabic)'}
              value={newStatusForm.descriptionAr}
              onChange={(e) => setNewStatusForm(prev => ({ ...prev, descriptionAr: e.target.value }))}
            />
            <Input
              label={isAr ? 'الوصف بالإنجليزي' : 'Description (English)'}
              value={newStatusForm.descriptionEn}
              onChange={(e) => setNewStatusForm(prev => ({ ...prev, descriptionEn: e.target.value }))}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label={isAr ? 'اللون' : 'Color'}
              options={statusColors.map(c => ({ value: c.value, label: c.label }))}
              value={newStatusForm.color}
              onChange={(value) => setNewStatusForm(prev => ({ ...prev, color: value }))}
            />
            <Select
              label={isAr ? 'الأيقونة' : 'Icon'}
              options={statusIcons.map(i => ({ value: i.value, label: i.label }))}
              value={newStatusForm.icon}
              onChange={(value) => setNewStatusForm(prev => ({ ...prev, icon: value }))}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={newStatusForm.isDefault}
              onChange={(e) => setNewStatusForm(prev => ({ ...prev, isDefault: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="isDefault" className="text-sm text-[var(--foreground)]">
              {isAr ? 'حالة افتراضية للمخاطر الجديدة' : 'Default status for new risks'}
            </label>
          </div>
        </form>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowAddStatusModal(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleAddStatus}>
            {t('common.save')}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Edit Risk Status Modal */}
      <Modal
        isOpen={showEditStatusModal}
        onClose={() => { setShowEditStatusModal(false); setSelectedStatus(null); }}
        title={isAr ? 'تعديل الحالة' : 'Edit Status'}
        size="lg"
      >
        <form className="space-y-4">
          <Input
            label={isAr ? 'الكود' : 'Code'}
            value={editStatusForm.code}
            onChange={(e) => setEditStatusForm(prev => ({ ...prev, code: e.target.value.toLowerCase() }))}
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={isAr ? 'الاسم بالعربي' : 'Name (Arabic)'}
              value={editStatusForm.nameAr}
              onChange={(e) => setEditStatusForm(prev => ({ ...prev, nameAr: e.target.value }))}
              required
            />
            <Input
              label={isAr ? 'الاسم بالإنجليزي' : 'Name (English)'}
              value={editStatusForm.nameEn}
              onChange={(e) => setEditStatusForm(prev => ({ ...prev, nameEn: e.target.value }))}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={isAr ? 'الوصف بالعربي' : 'Description (Arabic)'}
              value={editStatusForm.descriptionAr}
              onChange={(e) => setEditStatusForm(prev => ({ ...prev, descriptionAr: e.target.value }))}
            />
            <Input
              label={isAr ? 'الوصف بالإنجليزي' : 'Description (English)'}
              value={editStatusForm.descriptionEn}
              onChange={(e) => setEditStatusForm(prev => ({ ...prev, descriptionEn: e.target.value }))}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label={isAr ? 'اللون' : 'Color'}
              options={statusColors.map(c => ({ value: c.value, label: c.label }))}
              value={editStatusForm.color}
              onChange={(value) => setEditStatusForm(prev => ({ ...prev, color: value }))}
            />
            <Select
              label={isAr ? 'الأيقونة' : 'Icon'}
              options={statusIcons.map(i => ({ value: i.value, label: i.label }))}
              value={editStatusForm.icon}
              onChange={(value) => setEditStatusForm(prev => ({ ...prev, icon: value }))}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="editIsDefault"
              checked={editStatusForm.isDefault}
              onChange={(e) => setEditStatusForm(prev => ({ ...prev, isDefault: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="editIsDefault" className="text-sm text-[var(--foreground)]">
              {isAr ? 'حالة افتراضية للمخاطر الجديدة' : 'Default status for new risks'}
            </label>
          </div>
        </form>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowEditStatusModal(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={saveEditStatus}>
            {t('common.save')}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Risk Status Modal */}
      <Modal
        isOpen={showDeleteStatusModal}
        onClose={() => { setShowDeleteStatusModal(false); setSelectedStatus(null); }}
        title={isAr ? 'تأكيد الحذف' : 'Confirm Delete'}
        size="sm"
      >
        {selectedStatus && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
              <Trash2 className="h-6 w-6 text-red-500" />
              <div>
                <p className="font-medium text-[var(--foreground)]">
                  {isAr ? 'هل أنت متأكد من حذف هذه الحالة؟' : 'Are you sure you want to delete this status?'}
                </p>
                <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
                  {isAr ? 'لا يمكن التراجع عن هذا الإجراء' : 'This action cannot be undone'}
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-[var(--border)] p-4">
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: selectedStatus.color || '#3b82f6' }}
                >
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-[var(--foreground)]">
                    {isAr ? selectedStatus.nameAr : selectedStatus.nameEn}
                  </p>
                  <p className="text-sm text-[var(--foreground-secondary)]">{selectedStatus.code}</p>
                </div>
              </div>
            </div>
            {(selectedStatus._count?.risks || 0) > 0 && (
              <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-3">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  {isAr
                    ? `تحذير: هذه الحالة مرتبطة بـ ${selectedStatus._count?.risks} خطر`
                    : `Warning: This status is linked to ${selectedStatus._count?.risks} risks`}
                </p>
              </div>
            )}
          </div>
        )}
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowDeleteStatusModal(false)}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" onClick={confirmDeleteStatus}>
            <Trash2 className="me-2 h-4 w-4" />
            {t('common.delete')}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Import Result Modal */}
      <Modal
        isOpen={showImportResultModal}
        onClose={() => setShowImportResultModal(false)}
        title={isAr ? 'نتائج الاستيراد' : 'Import Results'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{importStats.added}</p>
              <p className="text-xs text-green-700 dark:text-green-300">{isAr ? 'سيتم إضافتها' : 'To be Added'}</p>
            </div>
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">{importStats.updated}</p>
              <p className="text-xs text-blue-700 dark:text-blue-300">{isAr ? 'سيتم تحديثها' : 'To be Updated'}</p>
            </div>
            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-3 text-center">
              <p className="text-2xl font-bold text-yellow-600">{importStats.skipped}</p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">{isAr ? 'سيتم تجاهلها' : 'To be Skipped'}</p>
            </div>
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-center">
              <p className="text-2xl font-bold text-red-600">{importStats.errors}</p>
              <p className="text-xs text-red-700 dark:text-red-300">{isAr ? 'أخطاء' : 'Errors'}</p>
            </div>
          </div>

          {/* Details */}
          <div className="max-h-[300px] overflow-y-auto space-y-3">
            {importResults.added.length > 0 && (
              <div className="rounded-lg border border-green-200 dark:border-green-800 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Plus className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-sm text-green-700 dark:text-green-300">
                    {isAr ? 'مخاطر جديدة ستتم إضافتها' : 'New risks to be added'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {importResults.added.map(id => (
                    <code key={id} className="text-xs bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded text-green-700 dark:text-green-300">{id}</code>
                  ))}
                </div>
              </div>
            )}

            {importResults.updated.length > 0 && (
              <div className="rounded-lg border border-blue-200 dark:border-blue-800 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Edit className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-sm text-blue-700 dark:text-blue-300">
                    {isAr ? 'مخاطر موجودة سيتم تحديثها' : 'Existing risks to be updated'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {importResults.updated.map(id => (
                    <code key={id} className="text-xs bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded text-blue-700 dark:text-blue-300">{id}</code>
                  ))}
                </div>
              </div>
            )}

            {importResults.skipped.length > 0 && (
              <div className="rounded-lg border border-yellow-200 dark:border-yellow-800 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium text-sm text-yellow-700 dark:text-yellow-300">
                    {isAr ? 'مخاطر سيتم تجاهلها (حسب وضع الاستيراد)' : 'Risks to be skipped (per import mode)'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {importResults.skipped.map(id => (
                    <code key={id} className="text-xs bg-yellow-100 dark:bg-yellow-900/30 px-2 py-0.5 rounded text-yellow-700 dark:text-yellow-300">{id}</code>
                  ))}
                </div>
              </div>
            )}

            {importResults.errors.length > 0 && (
              <div className="rounded-lg border border-red-200 dark:border-red-800 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <X className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-sm text-red-700 dark:text-red-300">
                    {isAr ? 'أخطاء' : 'Errors'}
                  </span>
                </div>
                <div className="space-y-1">
                  {importResults.errors.map((err, idx) => (
                    <div key={idx} className="text-xs text-red-700 dark:text-red-300">
                      <code className="bg-red-100 dark:bg-red-900/30 px-1 rounded">{err.riskId}</code>: {err.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Import Mode Reminder */}
          <div className="rounded-lg bg-[var(--background-secondary)] p-3">
            <p className="text-xs text-[var(--foreground-secondary)]">
              {isAr ? 'وضع الاستيراد المحدد: ' : 'Selected import mode: '}
              <span className="font-medium text-[var(--foreground)]">
                {importMode === 'addOnly' && (isAr ? 'إضافة فقط' : 'Add Only')}
                {importMode === 'updateOnly' && (isAr ? 'تحديث فقط' : 'Update Only')}
                {importMode === 'addAndUpdate' && (isAr ? 'إضافة وتحديث' : 'Add & Update')}
              </span>
            </p>
          </div>
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={() => setShowImportResultModal(false)} disabled={isImporting}>
            {t('common.cancel')}
          </Button>
          <Button onClick={confirmImport} disabled={isImporting || (importStats.added === 0 && importStats.updated === 0)}>
            {isImporting ? (
              <>
                <span className="me-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {isAr ? 'جاري الاستيراد...' : 'Importing...'}
              </>
            ) : (
              <>
                <CheckCircle className="me-2 h-4 w-4" />
                {isAr ? 'تأكيد الاستيراد' : 'Confirm Import'}
              </>
            )}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Reset Password Confirmation Modal */}
      <Modal
        isOpen={showResetPasswordModal}
        onClose={() => {
          setShowResetPasswordModal(false);
          setResetPasswordUserId(null);
        }}
        title={isAr ? 'إعادة تعيين كلمة المرور' : 'Reset Password'}
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
            <Key className="h-6 w-6 text-yellow-500" />
            <div>
              <p className="font-medium text-[var(--foreground)]">
                {isAr ? 'هل أنت متأكد من إعادة تعيين كلمة المرور؟' : 'Are you sure you want to reset the password?'}
              </p>
              <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
                {isAr ? 'سيتم تعيين كلمة المرور إلى: Welcome@123' : 'Password will be reset to: Welcome@123'}
              </p>
            </div>
          </div>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowResetPasswordModal(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={confirmResetPassword}>
            <Key className="me-2 h-4 w-4" />
            {isAr ? 'إعادة تعيين' : 'Reset Password'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={showChangePasswordModal}
        onClose={() => {
          setShowChangePasswordModal(false);
          setChangePasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
          setPasswordError('');
          setPasswordSuccess('');
        }}
        title={isAr ? 'تغيير كلمة المرور' : 'Change Password'}
        size="md"
      >
        <div className="space-y-4">
          {passwordError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-sm text-red-600 dark:text-red-400">{passwordError}</p>
            </div>
          )}
          {passwordSuccess && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <p className="text-sm text-green-600 dark:text-green-400">{passwordSuccess}</p>
            </div>
          )}
          <Input
            type="password"
            label={isAr ? 'كلمة المرور الحالية' : 'Current Password'}
            value={changePasswordForm.currentPassword}
            onChange={(e) => setChangePasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
            leftIcon={<Lock className="h-4 w-4" />}
          />
          <Input
            type="password"
            label={isAr ? 'كلمة المرور الجديدة' : 'New Password'}
            value={changePasswordForm.newPassword}
            onChange={(e) => setChangePasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
            leftIcon={<Lock className="h-4 w-4" />}
          />
          <Input
            type="password"
            label={isAr ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}
            value={changePasswordForm.confirmPassword}
            onChange={(e) => setChangePasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
            leftIcon={<Lock className="h-4 w-4" />}
          />
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowChangePasswordModal(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleChangePassword}>
            <Lock className="me-2 h-4 w-4" />
            {isAr ? 'تغيير كلمة المرور' : 'Change Password'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Department Access Modal */}
      <Modal
        isOpen={showDepartmentAccessModal}
        onClose={() => {
          setShowDepartmentAccessModal(false);
          setSelectedUserForAccess(null);
          setSelectedDepartmentIds([]);
        }}
        title={isAr ? 'صلاحيات الوصول للإدارات' : 'Department Access Permissions'}
        size="lg"
      >
        {selectedUserForAccess && (
          <div className="space-y-4">
            {/* User Info */}
            <div className="rounded-lg bg-[var(--background-secondary)] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary)] text-white">
                  {selectedUserForAccess.fullName.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-[var(--foreground)]">
                    {selectedUserForAccess.fullName}
                  </p>
                  <p className="text-sm text-[var(--foreground-secondary)]">
                    {selectedUserForAccess.email}
                  </p>
                </div>
                <Badge variant="default" className="ms-auto">
                  {t(`users.roles.${selectedUserForAccess.role}`)}
                </Badge>
              </div>
            </div>

            {/* Instructions */}
            <div className="text-sm text-[var(--foreground-secondary)]">
              {isAr
                ? 'اختر الإدارات التي يمكن لهذا المستخدم الاطلاع على مخاطرها:'
                : 'Select departments this user can access risks for:'}
            </div>

            {/* Department Selection */}
            <div className="max-h-[300px] overflow-y-auto rounded-lg border border-[var(--border)]">
              {departments.length === 0 ? (
                <div className="p-4 text-center text-[var(--foreground-secondary)]">
                  {isAr ? 'لا توجد إدارات' : 'No departments found'}
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {departments.map((dept) => (
                    <label
                      key={dept.id}
                      className="flex cursor-pointer items-center gap-3 p-3 hover:bg-[var(--background-secondary)] transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDepartmentIds.includes(dept.id)}
                        onChange={() => toggleDepartmentSelection(dept.id)}
                        className="h-4 w-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-[var(--foreground)]">
                          {isAr ? dept.nameAr : dept.nameEn}
                        </p>
                        <p className="text-xs text-[var(--foreground-secondary)]">
                          {dept.code}
                        </p>
                      </div>
                      <Badge variant="default" className="text-[10px]">
                        {dept._count?.risks || 0} {isAr ? 'مخاطر' : 'risks'}
                      </Badge>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Selection Summary */}
            <div className="flex items-center justify-between rounded-lg bg-[var(--background-secondary)] p-3">
              <span className="text-sm text-[var(--foreground-secondary)]">
                {isAr ? 'الإدارات المحددة:' : 'Selected departments:'}
              </span>
              <Badge variant={selectedDepartmentIds.length > 0 ? 'success' : 'default'}>
                {selectedDepartmentIds.length}
              </Badge>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDepartmentIds(departments.map(d => d.id))}
                className="text-xs"
              >
                {isAr ? 'تحديد الكل' : 'Select All'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDepartmentIds([])}
                className="text-xs"
              >
                {isAr ? 'إلغاء الكل' : 'Clear All'}
              </Button>
            </div>
          </div>
        )}
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => {
              setShowDepartmentAccessModal(false);
              setSelectedUserForAccess(null);
              setSelectedDepartmentIds([]);
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button onClick={saveDepartmentAccess} disabled={savingAccess}>
            {savingAccess ? (
              <>
                <span className="me-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {isAr ? 'جاري الحفظ...' : 'Saving...'}
              </>
            ) : (
              <>
                <CheckCircle className="me-2 h-4 w-4" />
                {t('common.save')}
              </>
            )}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
