'use client';

import React, { useState, useRef } from 'react';
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

export default function SettingsPage() {
  const { t, language } = useTranslation();
  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [importedRisks, setImportedRisks] = useState<typeof hrRisks>([]);
  const [showImportSuccess, setShowImportSuccess] = useState(false);
  const [importStats, setImportStats] = useState({ total: 0, added: 0, updated: 0, skipped: 0, errors: 0 });
  const [importMode, setImportMode] = useState<'addOnly' | 'updateOnly' | 'addAndUpdate'>('addAndUpdate');
  const [showImportResultModal, setShowImportResultModal] = useState(false);
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
  const [selectedUser, setSelectedUser] = useState<typeof mockUsers[0] | null>(null);
  const [selectedDept, setSelectedDept] = useState<typeof mockDepartments[0] | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<typeof mockCategories[0] | null>(null);
  const [users, setUsers] = useState(mockUsers);
  const [departments, setDepartments] = useState(mockDepartments);
  const [categories, setCategories] = useState(mockCategories);

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

  // Add New Department
  const addNewDept = () => {
    if (newDeptForm.nameAr && newDeptForm.code) {
      const newDept = {
        id: String(Date.now()),
        nameAr: newDeptForm.nameAr,
        nameEn: newDeptForm.nameEn,
        code: newDeptForm.code,
        risksCount: 0,
      };
      setDepartments(prev => [...prev, newDept]);
      setNewDeptForm({ nameAr: '', nameEn: '', code: '' });
      setShowAddDeptModal(false);
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

  // Add New Category
  const addNewCategory = () => {
    if (newCategoryForm.nameAr && newCategoryForm.code) {
      const newCategory = {
        id: String(Date.now()),
        nameAr: newCategoryForm.nameAr,
        nameEn: newCategoryForm.nameEn,
        code: newCategoryForm.code,
        color: newCategoryForm.color,
        risksCount: 0,
      };
      setCategories(prev => [...prev, newCategory]);
      setNewCategoryForm({ nameAr: '', nameEn: '', code: '', color: 'bg-blue-500' });
      setShowAddCategoryModal(false);
    }
  };

  // Handle Edit Category
  const handleEditCategory = (category: typeof mockCategories[0]) => {
    setSelectedCategory(category);
    setEditCategoryForm({
      nameAr: category.nameAr,
      nameEn: category.nameEn,
      code: category.code,
      color: category.color,
    });
    setShowEditCategoryModal(true);
  };

  // Save Edit Category
  const saveEditCategory = () => {
    if (selectedCategory) {
      setCategories(prev => prev.map(c =>
        c.id === selectedCategory.id
          ? {
              ...c,
              nameAr: editCategoryForm.nameAr,
              nameEn: editCategoryForm.nameEn,
              code: editCategoryForm.code,
              color: editCategoryForm.color,
            }
          : c
      ));
      setShowEditCategoryModal(false);
      setSelectedCategory(null);
    }
  };

  // Handle Delete Category
  const handleDeleteCategory = (category: typeof mockCategories[0]) => {
    setSelectedCategory(category);
    setShowDeleteCategoryModal(true);
  };

  // Confirm Delete Category
  const confirmDeleteCategory = () => {
    if (selectedCategory) {
      setCategories(prev => prev.filter(c => c.id !== selectedCategory.id));
      setShowDeleteCategoryModal(false);
      setSelectedCategory(null);
    }
  };

  // File input ref for CSV/Excel import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Existing risk IDs for duplicate detection (simulated)
  const existingRiskIds = ['HR-001', 'HR-002', 'FIN-001', 'OPS-001', 'IT-001'];

  // Download import template
  const handleDownloadTemplate = () => {
    // CSV with BOM for Arabic support
    const BOM = '\uFEFF';
    const headers = [
      'Risk_ID',
      'Title_AR',
      'Title_EN',
      'Description_AR',
      'Description_EN',
      'Category',
      'Department',
      'Likelihood',
      'Impact',
      'Risk_Rating',
      'Status',
      'Owner_AR',
      'Owner_EN',
      'Treatment_Plan_AR',
      'Treatment_Plan_EN',
      'Due_Date',
      'Review_Date',
      'Comments'
    ];

    // Instructions row
    const instructions = [
      'رمز فريد (مطلوب)',
      'العنوان بالعربي',
      'العنوان بالإنجليزي',
      'الوصف بالعربي',
      'الوصف بالإنجليزي',
      'OPR/FIN/STR/LEG/TEC/REP',
      'RM/FIN/OPS/IT/SC/HSE',
      '1-5 (1=نادر، 5=شبه مؤكد)',
      '1-5 (1=ضئيل، 5=كارثي)',
      'Critical/Major/Moderate/Minor/Negligible',
      'Open/In Progress/Resolved/Closed',
      'اسم المسؤول بالعربي',
      'اسم المسؤول بالإنجليزي',
      'خطة المعالجة بالعربي',
      'خطة المعالجة بالإنجليزي',
      'YYYY-MM-DD',
      'YYYY-MM-DD',
      'ملاحظات إضافية'
    ];

    // Example rows
    const examples = [
      ['HR-001', 'استقالة الموظفين الرئيسيين', 'Key Employee Turnover', 'خطر فقدان الموظفين ذوي الخبرة العالية', 'Risk of losing highly experienced employees', 'OPR', 'RM', '3', '4', 'Major', 'Open', 'أحمد محمد', 'Ahmed Mohammed', 'تطوير خطط الاحتفاظ بالموظفين', 'Develop employee retention plans', '2026-03-31', '2026-02-28', 'يتطلب متابعة شهرية'],
      ['FIN-002', 'تقلبات أسعار الصرف', 'Currency Exchange Fluctuations', 'التعرض لمخاطر تقلب العملات الأجنبية', 'Exposure to foreign currency volatility', 'FIN', 'FIN', '4', '3', 'Major', 'In Progress', 'سارة علي', 'Sarah Ali', 'التحوط ضد مخاطر العملات', 'Currency hedging strategies', '2026-04-15', '2026-03-15', ''],
      ['IT-003', 'اختراق أمني', 'Security Breach', 'احتمال حدوث اختراق للأنظمة', 'Potential system security breach', 'TEC', 'IT', '2', '5', 'Major', 'Open', 'خالد أحمد', 'Khalid Ahmed', 'تعزيز الأمن السيبراني', 'Enhance cybersecurity measures', '2026-02-28', '2026-01-31', 'أولوية قصوى'],
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

  // Handle file selection for import
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileName = file.name;
      const fileExtension = fileName.split('.').pop()?.toLowerCase();

      if (fileExtension === 'csv' || fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Simulate parsing and processing the file
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          // Simulate parsing CSV - in real app, use a CSV parser library
          const lines = content.split('\n').filter(line => line.trim());

          // Skip header and instruction rows
          const dataRows = lines.slice(3);

          const results = {
            added: [] as string[],
            updated: [] as string[],
            skipped: [] as string[],
            errors: [] as { riskId: string; error: string }[]
          };

          dataRows.forEach((row, index) => {
            // Simple CSV parsing (in real app, use proper parser)
            const cells = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
            const riskId = cells[0]?.replace(/"/g, '').trim();

            if (!riskId) {
              results.errors.push({ riskId: `Row ${index + 4}`, error: isAr ? 'رمز الخطر مفقود' : 'Missing Risk ID' });
              return;
            }

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

          setImportResults(results);
          setImportStats({
            total: dataRows.length,
            added: results.added.length,
            updated: results.updated.length,
            skipped: results.skipped.length,
            errors: results.errors.length
          });
          setShowImportResultModal(true);
        };
        reader.readAsText(file);
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

  // Confirm import
  const confirmImport = () => {
    // In real app, this would save to database
    setImportedRisks(prev => [...prev, ...hrRisks.slice(0, importStats.added)]);
    setShowImportSuccess(true);
    setShowImportResultModal(false);
  };

  // Handle export risk register
  const handleExportRiskRegister = () => {
    // Create sample data for export
    const exportData = {
      exportDate: new Date().toISOString(),
      totalRisks: 48,
      data: 'Risk register data would be exported here'
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
      ? 'تم تصدير سجل المخاطر بنجاح!'
      : 'Risk register exported successfully!');
  };

  // Handle export as Excel
  const handleExportExcel = () => {
    // Create CSV content (Excel compatible)
    const headers = ['Risk ID', 'Description', 'Likelihood', 'Impact', 'Rating', 'Status'];
    const csvContent = [
      headers.join(','),
      'HR-001,"Employee turnover risk",3,4,Major,Open',
      'HR-002,"Skills gap in critical roles",2,3,Moderate,In Progress',
      'HR-003,"Compliance training delays",2,2,Minor,Resolved',
    ].join('\n');

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
      ? 'تم تصدير البيانات كملف Excel بنجاح!'
      : 'Data exported as Excel successfully!');
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
                    <Badge variant="primary" className="text-[10px] sm:text-xs">{category.risksCount}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
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
          <Button variant="outline" onClick={() => setShowImportResultModal(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={confirmImport} disabled={importStats.added === 0 && importStats.updated === 0}>
            <CheckCircle className="me-2 h-4 w-4" />
            {isAr ? 'تأكيد الاستيراد' : 'Confirm Import'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
