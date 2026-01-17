'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { hrRisks, hrRisksSummary } from '@/data/hrRisks';

const settingsTabs = [
  { id: 'users', icon: Users },
  { id: 'departments', icon: Building2 },
  { id: 'categories', icon: Tag },
  { id: 'notifications', icon: Bell },
  { id: 'dataManagement', icon: Database },
];

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

export default function SettingsPage() {
  const { t, language } = useTranslation();
  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [importedRisks, setImportedRisks] = useState<typeof hrRisks>([]);
  const [showImportSuccess, setShowImportSuccess] = useState(false);
  const [importStats, setImportStats] = useState({ total: 0, imported: 0, errors: 0 });
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [showEditDeptModal, setShowEditDeptModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<typeof mockUsers[0] | null>(null);
  const [selectedDept, setSelectedDept] = useState<typeof mockDepartments[0] | null>(null);
  const [users, setUsers] = useState(mockUsers);
  const [departments, setDepartments] = useState(mockDepartments);

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

  // Handle Edit User
  const handleEditUser = (user: typeof mockUsers[0]) => {
    setSelectedUser(user);
    setEditUserForm({
      fullNameAr: user.fullNameAr,
      fullNameEn: user.fullNameEn,
      email: user.email,
      role: user.role,
      status: user.status,
    });
    setShowEditUserModal(true);
  };

  // Save Edit User
  const saveEditUser = () => {
    if (selectedUser) {
      setUsers(prev => prev.map(u =>
        u.id === selectedUser.id
          ? {
              ...u,
              fullNameAr: editUserForm.fullNameAr,
              fullNameEn: editUserForm.fullNameEn,
              email: editUserForm.email,
              role: editUserForm.role,
              status: editUserForm.status,
            }
          : u
      ));
      setShowEditUserModal(false);
      setSelectedUser(null);
    }
  };

  // Add New User
  const addNewUser = () => {
    if (newUserForm.fullNameAr && newUserForm.email) {
      const dept = mockDepartments.find(d => d.id === newUserForm.departmentId);
      const newUser = {
        id: String(Date.now()),
        fullNameAr: newUserForm.fullNameAr,
        fullNameEn: newUserForm.fullNameEn,
        email: newUserForm.email,
        role: newUserForm.role || 'employee',
        departmentAr: dept?.nameAr || '',
        departmentEn: dept?.nameEn || '',
        status: 'active',
      };
      setUsers(prev => [...prev, newUser]);
      setNewUserForm({ fullNameAr: '', fullNameEn: '', email: '', role: '', departmentId: '' });
      setShowAddModal(false);
    }
  };

  // Handle Delete User
  const handleDeleteUser = (user: typeof mockUsers[0]) => {
    setSelectedUser(user);
    setShowDeleteUserModal(true);
  };

  // Confirm Delete User
  const confirmDeleteUser = () => {
    if (selectedUser) {
      setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
      setShowDeleteUserModal(false);
      setSelectedUser(null);
    }
  };

  // Handle Edit Department
  const handleEditDept = (dept: typeof mockDepartments[0]) => {
    setSelectedDept(dept);
    setEditDeptForm({
      nameAr: dept.nameAr,
      nameEn: dept.nameEn,
      code: dept.code,
    });
    setShowEditDeptModal(true);
  };

  // Save Edit Department
  const saveEditDept = () => {
    if (selectedDept) {
      setDepartments(prev => prev.map(d =>
        d.id === selectedDept.id
          ? {
              ...d,
              nameAr: editDeptForm.nameAr,
              nameEn: editDeptForm.nameEn,
              code: editDeptForm.code,
            }
          : d
      ));
      setShowEditDeptModal(false);
      setSelectedDept(null);
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
        <Button leftIcon={<Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />} onClick={() => setShowAddModal(true)} className="text-xs sm:text-sm shrink-0">
          {t('users.addUser')}
        </Button>
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
                          {(isAr ? user.fullNameAr : user.fullNameEn).charAt(0)}
                        </div>
                        <span className="font-medium text-[var(--foreground)] text-xs sm:text-sm truncate max-w-[80px] sm:max-w-none">
                          {isAr ? user.fullNameAr : user.fullNameEn}
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
                      {isAr ? user.departmentAr : user.departmentEn}
                    </td>
                    <td className="p-2 sm:p-3 md:p-4 hidden sm:table-cell">
                      <Badge variant={user.status === 'active' ? 'success' : 'default'} className="text-[10px] sm:text-xs">
                        {t(`users.statuses.${user.status}`)}
                      </Badge>
                    </td>
                    <td className="p-2 sm:p-3 md:p-4">
                      <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                        <Button variant="ghost" size="icon-sm" className="h-6 w-6 sm:h-8 sm:w-8" onClick={() => handleEditUser(user)} title={isAr ? 'تعديل' : 'Edit'}>
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
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
        <Button leftIcon={<Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />} className="text-xs sm:text-sm">
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
                <Badge variant="primary" className="text-[10px] sm:text-xs">{dept.risksCount}</Badge>
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
      imported: hrRisks.length,
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
                  ? `تم استيراد ${importStats.imported} خطر من أصل ${importStats.total}`
                  : `Imported ${importStats.imported} risks out of ${importStats.total}`}
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

      {/* CSV/Excel Import */}
      <Card>
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
            <FileSpreadsheet className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--primary)]" />
            {t('settings.importData')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
          <div className="rounded-lg border-2 border-dashed border-[var(--border)] p-4 sm:p-6 md:p-8 text-center hover:border-[var(--primary)] transition-colors cursor-pointer">
            <FileSpreadsheet className="mx-auto h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-[var(--foreground-muted)]" />
            <p className="mt-2 sm:mt-3 md:mt-4 text-xs sm:text-sm text-[var(--foreground-secondary)]">
              {isAr
                ? 'اسحب وأفلت ملف Excel أو CSV هنا'
                : 'Drag and drop Excel or CSV file here'}
            </p>
            <p className="mt-1 text-[10px] sm:text-xs text-[var(--foreground-muted)]">
              {isAr ? 'الأعمدة المطلوبة: Risk_ID, Function, Risk Description, Likelihood, Impact, Status' : 'Required columns: Risk_ID, Function, Risk Description, Likelihood, Impact, Status'}
            </p>
            <Button variant="outline" className="mt-2 sm:mt-3 md:mt-4 text-xs sm:text-sm">
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
            <Button variant="outline" className="h-auto flex-col gap-1.5 sm:gap-2 p-2 sm:p-3 md:p-4 text-xs sm:text-sm">
              <Database className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-[var(--primary)]" />
              <span>{isAr ? 'تصدير سجل المخاطر' : 'Export Risk Register'}</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-1.5 sm:gap-2 p-2 sm:p-3 md:p-4 text-xs sm:text-sm">
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

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 border-b border-[var(--border)] pb-3 sm:pb-4">
        {settingsTabs.map((tab) => {
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

      {/* Tab Content */}
      {activeTab === 'users' && renderUsersTab()}
      {activeTab === 'departments' && renderDepartmentsTab()}
      {activeTab === 'notifications' && renderNotificationsTab()}
      {activeTab === 'dataManagement' && renderDataManagementTab()}
      {activeTab === 'categories' && (
        <Card>
          <CardContent className="p-8 text-center">
            <Tag className="mx-auto h-12 w-12 text-[var(--foreground-muted)]" />
            <p className="mt-4 text-[var(--foreground-secondary)]">
              {isAr ? 'إدارة تصنيفات المخاطر' : 'Manage risk categories'}
            </p>
          </CardContent>
        </Card>
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
              options={mockDepartments.map((d) => ({
                value: d.id,
                label: isAr ? d.nameAr : d.nameEn,
              }))}
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
                {isAr ? selectedUser.fullNameAr : selectedUser.fullNameEn}
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
    </div>
  );
}
