'use client';

import React from 'react';
import { BarChart3, Search, Plus, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

/**
 * Empty-state card shown in place of the risks table/cards when there
 * is nothing to render.
 *
 * Branches between two cases:
 *
 *   1. "Register is empty" — the database has zero risks at all.
 *      Shows a welcoming hero with an Add Risk CTA.
 *
 *   2. "No matching results" — there are risks, but the current
 *      search query and/or filters hide all of them. Shows the total
 *      count for orientation and offers a "Clear search & filters"
 *      CTA (only when something is actually filtered) alongside the
 *      standard Add Risk button.
 */
interface RiskEmptyStateProps {
  /** Total number of risks in the register (unfiltered count). */
  totalRiskCount: number;
  /** True when the user has a search query typed. */
  hasSearchQuery: boolean;
  /** Number of non-zero filter chips currently applied. */
  activeFiltersCount: number;
  /** Label for the "Add Risk" button (already localized). */
  addRiskLabel: string;
  /** True when the page is rendering in Arabic. */
  isAr: boolean;
  /** Opens the Add Risk wizard. */
  onAddRisk: () => void;
  /** Clears the search query AND resets every active filter. */
  onClearSearchAndFilters: () => void;
}

export function RiskEmptyState({
  totalRiskCount,
  hasSearchQuery,
  activeFiltersCount,
  addRiskLabel,
  isAr,
  onAddRisk,
  onClearSearchAndFilters,
}: RiskEmptyStateProps) {
  const registerIsEmpty = totalRiskCount === 0;
  const somethingIsFiltered = hasSearchQuery || activeFiltersCount > 0;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-8 sm:p-12">
        {registerIsEmpty ? (
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--primary-light)]">
              <BarChart3 className="h-8 w-8 text-[var(--primary)]" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-[var(--foreground)]">
              {isAr ? 'سجل المخاطر فارغ' : 'Risk register is empty'}
            </h3>
            <p className="mt-2 text-sm text-[var(--foreground-secondary)]">
              {isAr
                ? 'لم يتم تسجيل أي خطر بعد. ابدأ بإضافة أول خطر لتسجيله في النظام.'
                : 'No risks have been registered yet. Start by adding your first risk.'}
            </p>
            <div className="mt-6">
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={onAddRisk}
              >
                {addRiskLabel}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--background-secondary)]">
              <Search className="h-8 w-8 text-[var(--foreground-muted)]" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-[var(--foreground)]">
              {isAr ? 'لا توجد نتائج مطابقة' : 'No matching results'}
            </h3>
            <p className="mt-2 text-sm text-[var(--foreground-secondary)]">
              {isAr
                ? `لم نجد أي خطر يطابق معايير البحث والتصفية الحالية (${totalRiskCount} خطر في السجل).`
                : `We couldn't find any risks matching the current search and filters (${totalRiskCount} total in the register).`}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {somethingIsFiltered && (
                <Button
                  variant="outline"
                  leftIcon={<X className="h-4 w-4" />}
                  onClick={onClearSearchAndFilters}
                >
                  {isAr ? 'مسح البحث والفلاتر' : 'Clear search & filters'}
                </Button>
              )}
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={onAddRisk}
              >
                {addRiskLabel}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
