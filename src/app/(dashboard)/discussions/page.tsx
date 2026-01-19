'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  MessageSquare,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  AlertTriangle,
  MessageCircle,
  Calendar,
  Building2,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  X,
} from 'lucide-react';

interface Comment {
  id: string;
  content: string;
  type: string;
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    fullName: string;
    fullNameEn: string | null;
    role: string;
    avatar: string | null;
  };
  risk: {
    id: string;
    riskNumber: string;
    titleAr: string;
    titleEn: string;
    department: {
      id: string;
      nameAr: string;
      nameEn: string;
      code: string;
    };
  };
  replies: Comment[];
}

interface Department {
  id: string;
  nameAr: string;
  nameEn: string;
  code: string;
}

interface Stats {
  byType: Record<string, number>;
  today: number;
  thisWeek: number;
  total: number;
}

export default function DiscussionsPage() {
  const { t, isRTL, language } = useTranslation();
  const router = useRouter();

  const [comments, setComments] = useState<Comment[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [stats, setStats] = useState<Stats>({ byType: {}, today: 0, thisWeek: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
      });

      if (searchQuery) params.append('search', searchQuery);
      if (selectedDepartment) params.append('departmentId', selectedDepartment);
      if (selectedType) params.append('type', selectedType);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const response = await fetch(`/api/comments?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setComments(data.data.comments);
        setTotalPages(data.data.pagination.totalPages);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, selectedDepartment, selectedType, dateFrom, dateTo]);

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await fetch('/api/departments');
      const data = await response.json();
      if (data.success) {
        setDepartments(data.data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchComments();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDepartment('');
    setSelectedType('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return language === 'ar' ? 'الآن' : 'Just now';
    if (diffMins < 60) return language === 'ar' ? `منذ ${diffMins} دقيقة` : `${diffMins}m ago`;
    if (diffHours < 24) return language === 'ar' ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;
    if (diffDays < 7) return language === 'ar' ? `منذ ${diffDays} يوم` : `${diffDays}d ago`;
    return formatDate(dateString);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      comment: { ar: 'تعليق', en: 'Comment' },
      question: { ar: 'سؤال', en: 'Question' },
      reply: { ar: 'رد', en: 'Reply' },
      statusUpdate: { ar: 'تحديث حالة', en: 'Status Update' },
      approval: { ar: 'موافقة', en: 'Approval' },
    };
    return labels[type]?.[language] || type;
  };

  const getTypeBadgeVariant = (type: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      comment: 'default',
      question: 'warning',
      reply: 'info',
      statusUpdate: 'success',
      approval: 'success',
    };
    return variants[type] || 'default';
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      admin: { ar: 'مدير النظام', en: 'Admin' },
      riskManager: { ar: 'مدير المخاطر', en: 'Risk Manager' },
      riskAnalyst: { ar: 'محلل مخاطر', en: 'Risk Analyst' },
      riskChampion: { ar: 'رائد مخاطر', en: 'Risk Champion' },
      employee: { ar: 'موظف', en: 'Employee' },
    };
    return labels[role]?.[language] || role;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="h-7 w-7 text-primary-600" />
            {language === 'ar' ? 'المناقشات والتعليقات' : 'Discussions & Comments'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {language === 'ar'
              ? 'متابعة جميع التعليقات والمناقشات على المخاطر'
              : 'Track all comments and discussions on risks'}
          </p>
        </div>

        <Button onClick={fetchComments} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} ${loading ? 'animate-spin' : ''}`} />
          {language === 'ar' ? 'تحديث' : 'Refresh'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  {language === 'ar' ? 'إجمالي التعليقات' : 'Total Comments'}
                </p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.total}</p>
              </div>
              <MessageSquare className="h-10 w-10 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {language === 'ar' ? 'اليوم' : 'Today'}
                </p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.today}</p>
              </div>
              <Clock className="h-10 w-10 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400">
                  {language === 'ar' ? 'هذا الأسبوع' : 'This Week'}
                </p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.thisWeek}</p>
              </div>
              <TrendingUp className="h-10 w-10 text-purple-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  {language === 'ar' ? 'أسئلة معلقة' : 'Pending Questions'}
                </p>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                  {stats.byType?.question || 0}
                </p>
              </div>
              <AlertTriangle className="h-10 w-10 text-amber-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search Input */}
              <div className="flex-1 min-w-[250px]">
                <div className="relative">
                  <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
                  <Input
                    placeholder={language === 'ar' ? 'البحث في التعليقات...' : 'Search comments...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={isRTL ? 'pr-10' : 'pl-10'}
                  />
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {language === 'ar' ? 'فلترة' : 'Filter'}
              </Button>

              <Button type="submit">
                <Search className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {language === 'ar' ? 'بحث' : 'Search'}
              </Button>
            </div>

            {/* Extended Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t dark:border-gray-700">
                <Select
                  label={language === 'ar' ? 'الإدارة' : 'Department'}
                  value={selectedDepartment}
                  onChange={(value) => setSelectedDepartment(value)}
                  options={[
                    { value: '', label: language === 'ar' ? 'جميع الإدارات' : 'All Departments' },
                    ...departments.map((d) => ({
                      value: d.id,
                      label: language === 'ar' ? d.nameAr : d.nameEn,
                    })),
                  ]}
                />

                <Select
                  label={language === 'ar' ? 'نوع التعليق' : 'Comment Type'}
                  value={selectedType}
                  onChange={(value) => setSelectedType(value)}
                  options={[
                    { value: '', label: language === 'ar' ? 'جميع الأنواع' : 'All Types' },
                    { value: 'comment', label: language === 'ar' ? 'تعليق' : 'Comment' },
                    { value: 'question', label: language === 'ar' ? 'سؤال' : 'Question' },
                    { value: 'statusUpdate', label: language === 'ar' ? 'تحديث حالة' : 'Status Update' },
                    { value: 'approval', label: language === 'ar' ? 'موافقة' : 'Approval' },
                  ]}
                />

                <Input
                  type="date"
                  label={language === 'ar' ? 'من تاريخ' : 'From Date'}
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />

                <Input
                  type="date"
                  label={language === 'ar' ? 'إلى تاريخ' : 'To Date'}
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />

                <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                  <Button type="button" variant="ghost" onClick={clearFilters}>
                    <X className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {language === 'ar' ? 'مسح الفلاتر' : 'Clear Filters'}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Comments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : comments.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageCircle className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {language === 'ar' ? 'لا توجد تعليقات' : 'No Comments Found'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {language === 'ar'
                  ? 'لم يتم العثور على تعليقات تطابق معايير البحث'
                  : 'No comments match your search criteria'}
              </p>
            </CardContent>
          </Card>
        ) : (
          comments.map((comment) => (
            <Card
              key={comment.id}
              className="hover:shadow-lg transition-shadow duration-200 cursor-pointer"
              onClick={() => router.push(`/risks/${comment.risk.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Author Avatar */}
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-lg">
                      {comment.author.fullName.charAt(0)}
                    </div>
                  </div>

                  {/* Comment Content */}
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {language === 'ar' ? comment.author.fullName : (comment.author.fullNameEn || comment.author.fullName)}
                      </span>
                      <Badge variant="info" size="sm">
                        {getRoleLabel(comment.author.role)}
                      </Badge>
                      <Badge variant={getTypeBadgeVariant(comment.type)} size="sm">
                        {getTypeLabel(comment.type)}
                      </Badge>
                      {comment.isInternal && (
                        <Badge variant="warning" size="sm">
                          {language === 'ar' ? 'داخلي' : 'Internal'}
                        </Badge>
                      )}
                      <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {getRelativeTime(comment.createdAt)}
                      </span>
                    </div>

                    {/* Risk Info */}
                    <div className="flex flex-wrap items-center gap-2 mb-3 text-sm">
                      <span className="flex items-center gap-1 text-primary-600 dark:text-primary-400 font-medium">
                        <AlertTriangle className="h-4 w-4" />
                        {comment.risk.riskNumber}
                      </span>
                      <span className="text-gray-500">-</span>
                      <span className="text-gray-700 dark:text-gray-300 truncate max-w-md">
                        {language === 'ar' ? comment.risk.titleAr : comment.risk.titleEn}
                      </span>
                      <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                        <Building2 className="h-3 w-3" />
                        {language === 'ar' ? comment.risk.department.nameAr : comment.risk.department.nameEn}
                      </span>
                    </div>

                    {/* Comment Text */}
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap line-clamp-3">
                      {comment.content}
                    </p>

                    {/* Replies Count */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <MessageCircle className="h-4 w-4" />
                        <span>
                          {comment.replies.length} {language === 'ar' ? 'ردود' : 'replies'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex items-start">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/risks/${comment.risk.id}`);
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>

          <span className="text-sm text-gray-600 dark:text-gray-400 px-4">
            {language === 'ar' ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </div>
  );
}
