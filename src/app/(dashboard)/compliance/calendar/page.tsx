'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/contexts/LanguageContext';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  ArrowRight,
  Loader2,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface CalendarObligation {
  id: string;
  code: string;
  titleAr: string;
  titleEn: string | null;
  nextDueDate: string;
  complianceStatus: string;
  criticalityLevel: string;
  recurrence: string | null;
  completionPercentage: number;
  domain: { id: string; nameAr: string; nameEn: string; code: string } | null;
}

interface CalendarStats {
  totalDue: number;
  overdue: number;
  compliant: number;
  nonCompliant: number;
}

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  compliant: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  partiallyCompliant: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
  nonCompliant: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' },
  notAssessed: { bg: 'bg-gray-50 dark:bg-gray-800/40', text: 'text-gray-600 dark:text-gray-400', dot: 'bg-gray-400' },
};

const criticalityBorder: Record<string, string> = {
  critical: 'border-l-red-500',
  high: 'border-l-orange-500',
  medium: 'border-l-yellow-500',
  low: 'border-l-blue-500',
};

export default function ComplianceCalendarPage() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const isAr = language === 'ar';
  const { data: session } = useSession();
  const { isImpersonating, impersonatedUser } = useImpersonation();

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [obligations, setObligations] = useState<CalendarObligation[]>([]);
  const [stats, setStats] = useState<CalendarStats>({ totalDue: 0, overdue: 0, compliant: 0, nonCompliant: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const fetchCalendarData = useCallback(async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (isImpersonating && impersonatedUser) {
        headers['X-Impersonate-User-Id'] = impersonatedUser.id;
      }
      const res = await fetch(`/api/compliance/calendar?month=${currentMonth}&year=${currentYear}`, { headers });
      const data = await res.json();
      if (data.success) {
        setObligations(data.data.obligations);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching calendar:', error);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear, isImpersonating, impersonatedUser]);

  useEffect(() => {
    fetchCalendarData();
    setSelectedDay(null);
  }, [fetchCalendarData]);

  // حساب أيام الشهر
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0=Sunday

  // تجميع الالتزامات حسب اليوم
  const obligationsByDay: Record<number, CalendarObligation[]> = {};
  obligations.forEach(o => {
    if (o.nextDueDate) {
      const day = new Date(o.nextDueDate).getDate();
      if (!obligationsByDay[day]) obligationsByDay[day] = [];
      obligationsByDay[day].push(o);
    }
  });

  const goToPrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth() + 1);
    setCurrentYear(today.getFullYear());
    setSelectedDay(today.getDate());
  };

  const monthNames = isAr
    ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const dayNames = isAr
    ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const isToday = (day: number) =>
    day === today.getDate() && currentMonth === today.getMonth() + 1 && currentYear === today.getFullYear();

  const isPast = (day: number) => {
    const d = new Date(currentYear, currentMonth - 1, day);
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return d < t;
  };

  const selectedObligations = selectedDay ? (obligationsByDay[selectedDay] || []) : [];

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      compliant: { ar: 'ملتزم', en: 'Compliant' },
      partiallyCompliant: { ar: 'ملتزم جزئياً', en: 'Partially' },
      nonCompliant: { ar: 'غير ملتزم', en: 'Non-Compliant' },
      notAssessed: { ar: 'لم يُقيّم', en: 'Not Assessed' },
    };
    return isAr ? labels[status]?.ar || status : labels[status]?.en || status;
  };

  const getRecurrenceLabel = (rec: string | null) => {
    if (!rec) return '';
    const labels: Record<string, { ar: string; en: string }> = {
      annual: { ar: 'سنوي', en: 'Annual' },
      quarterly: { ar: 'ربع سنوي', en: 'Quarterly' },
      monthly: { ar: 'شهري', en: 'Monthly' },
      continuous: { ar: 'مستمر', en: 'Continuous' },
      perEvent: { ar: 'لكل حدث', en: 'Per Event' },
      perMeeting: { ar: 'لكل اجتماع', en: 'Per Meeting' },
    };
    return isAr ? labels[rec]?.ar || rec : labels[rec]?.en || rec;
  };

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-7 w-7 text-[#F39200]" />
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            {isAr ? 'تقويم الالتزام' : 'Compliance Calendar'}
          </h1>
        </div>
        <button
          onClick={() => router.push('/compliance')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-sm hover:bg-[var(--muted)] transition-colors"
        >
          {isAr ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
          {isAr ? 'سجل الالتزام' : 'Compliance Register'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-[var(--foreground-secondary)]">{isAr ? 'مستحقة هذا الشهر' : 'Due This Month'}</span>
          </div>
          <p className="text-2xl font-bold text-[var(--foreground)]">{stats.totalDue}</p>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-xs text-[var(--foreground-secondary)]">{isAr ? 'متأخرة' : 'Overdue'}</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-xs text-[var(--foreground-secondary)]">{isAr ? 'ملتزم' : 'Compliant'}</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{stats.compliant}</p>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="h-4 w-4 text-orange-500" />
            <span className="text-xs text-[var(--foreground-secondary)]">{isAr ? 'غير ملتزم' : 'Non-Compliant'}</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">{stats.nonCompliant}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
          {/* Month Navigation */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-gradient-to-r from-[#F39200]/5 to-transparent">
            <button onClick={goToPrevMonth} className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors">
              {isAr ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-[var(--foreground)]">
                {monthNames[currentMonth - 1]} {currentYear}
              </h2>
              <button
                onClick={goToToday}
                className="px-3 py-1 text-xs rounded-full bg-[#F39200]/10 text-[#F39200] hover:bg-[#F39200]/20 transition-colors font-medium"
              >
                {isAr ? 'اليوم' : 'Today'}
              </button>
            </div>
            <button onClick={goToNextMonth} className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors">
              {isAr ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="h-8 w-8 animate-spin text-[#F39200]" />
            </div>
          ) : (
            <div className="p-3">
              {/* Day Headers */}
              <div className="grid grid-cols-7 mb-2">
                {dayNames.map(day => (
                  <div key={day} className="text-center text-xs font-semibold text-[var(--foreground-secondary)] py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells before first day */}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[80px] md:min-h-[100px]" />
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayObligations = obligationsByDay[day] || [];
                  const hasObligations = dayObligations.length > 0;
                  const hasOverdue = dayObligations.some(o => isPast(day) && o.complianceStatus !== 'compliant');
                  const isSelected = selectedDay === day;

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                      className={`
                        min-h-[80px] md:min-h-[100px] p-1.5 rounded-lg border text-start transition-all
                        ${isSelected ? 'border-[#F39200] bg-[#F39200]/5 ring-1 ring-[#F39200]/30' : 'border-transparent hover:border-[var(--border)] hover:bg-[var(--muted)]/50'}
                        ${isToday(day) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}
                      `}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`
                          text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                          ${isToday(day) ? 'bg-[#F39200] text-white' : 'text-[var(--foreground)]'}
                        `}>
                          {day}
                        </span>
                        {hasObligations && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${hasOverdue ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                            {dayObligations.length}
                          </span>
                        )}
                      </div>

                      {/* Obligation dots/previews */}
                      <div className="space-y-0.5">
                        {dayObligations.slice(0, 3).map(o => (
                          <div
                            key={o.id}
                            className={`flex items-center gap-1 px-1 py-0.5 rounded text-[10px] truncate ${statusColors[o.complianceStatus]?.bg || 'bg-gray-50'} ${statusColors[o.complianceStatus]?.text || 'text-gray-600'}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusColors[o.complianceStatus]?.dot || 'bg-gray-400'}`} />
                            <span className="truncate">{o.code}</span>
                          </div>
                        ))}
                        {dayObligations.length > 3 && (
                          <span className="text-[10px] text-[var(--foreground-secondary)] px-1">
                            +{dayObligations.length - 3}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Side Panel - Selected Day Details */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[var(--border)] bg-gradient-to-r from-[#F39200]/5 to-transparent">
            <h3 className="font-bold text-[var(--foreground)]">
              {selectedDay
                ? `${selectedDay} ${monthNames[currentMonth - 1]}`
                : isAr ? 'اختر يوماً' : 'Select a day'}
            </h3>
            {selectedDay && (
              <p className="text-xs text-[var(--foreground-secondary)] mt-1">
                {selectedObligations.length} {isAr ? 'التزام مستحق' : 'obligations due'}
              </p>
            )}
          </div>

          <div className="p-3 space-y-2 max-h-[600px] overflow-y-auto">
            {!selectedDay && (
              <div className="flex flex-col items-center justify-center py-16 text-[var(--foreground-secondary)]">
                <CalendarDays className="h-12 w-12 opacity-20 mb-3" />
                <p className="text-sm">{isAr ? 'اضغط على يوم لعرض التفاصيل' : 'Click a day to view details'}</p>
              </div>
            )}

            {selectedDay && selectedObligations.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-[var(--foreground-secondary)]">
                <CheckCircle2 className="h-12 w-12 opacity-20 mb-3" />
                <p className="text-sm">{isAr ? 'لا التزامات مستحقة' : 'No obligations due'}</p>
              </div>
            )}

            {selectedObligations.map(o => (
              <button
                key={o.id}
                onClick={() => router.push(`/compliance/${o.id}`)}
                className={`w-full text-start p-3 rounded-lg border border-[var(--border)] hover:shadow-md transition-all border-l-4 ${criticalityBorder[o.criticalityLevel] || 'border-l-gray-300'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-[#F39200]">{o.code}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[o.complianceStatus]?.bg} ${statusColors[o.complianceStatus]?.text}`}>
                    {getStatusLabel(o.complianceStatus)}
                  </span>
                </div>
                <p className="text-sm font-medium text-[var(--foreground)] mb-1 line-clamp-2">
                  {isAr ? o.titleAr : (o.titleEn || o.titleAr)}
                </p>
                <div className="flex items-center gap-3 text-[10px] text-[var(--foreground-secondary)]">
                  {o.domain && (
                    <span>{isAr ? o.domain.nameAr : o.domain.nameEn}</span>
                  )}
                  {o.recurrence && (
                    <span className="flex items-center gap-1">
                      <RefreshCw className="h-3 w-3" />
                      {getRecurrenceLabel(o.recurrence)}
                    </span>
                  )}
                </div>
                {/* Progress bar */}
                <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-[#F39200] transition-all"
                    style={{ width: `${Math.round((o.completionPercentage || 0) * 100)}%` }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
