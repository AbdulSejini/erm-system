'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';

/**
 * Pagination bar used at the bottom of the risks table. Sticky at the
 * viewport bottom so the controls stay reachable on long pages without
 * having to scroll the whole table.
 *
 * Layout:
 *   [ page-size select + count ]          [ «  ‹  [N] / totalPages  ›  » ]
 *
 * Respects RTL: in Arabic, the arrow glyphs are mirrored so the
 * "previous" button still points towards the previous page visually.
 *
 * The parent owns `currentPage` + `itemsPerPage` state — this component
 * is purely presentational and delegates every user action through a
 * callback.
 */
interface RisksPaginationProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  /** Number of rows currently visible on this page. */
  visibleCount: number;
  /** Total rows across all pages after filters are applied. */
  totalCount: number;
  isAr: boolean;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  /** Page-size options — defaults to 5/10/20/50 if omitted. */
  pageSizeOptions?: { value: string; label: string }[];
}

const DEFAULT_PAGE_SIZE_OPTIONS = [
  { value: '5', label: '5' },
  { value: '10', label: '10' },
  { value: '20', label: '20' },
  { value: '50', label: '50' },
];

export function RisksPagination({
  currentPage,
  totalPages,
  itemsPerPage,
  visibleCount,
  totalCount,
  isAr,
  onPageChange,
  onItemsPerPageChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}: RisksPaginationProps) {
  return (
    <div className="sticky bottom-0 z-10 flex flex-col sm:flex-row items-center justify-between border-t border-[var(--border)] bg-[var(--card)]/95 backdrop-blur-sm p-2 sm:p-3 md:p-4 gap-3">
      <div className="flex items-center gap-2">
        <p className="text-xs sm:text-sm text-[var(--foreground-secondary)]">
          {isAr
            ? `عرض ${visibleCount} من ${totalCount} خطر`
            : `Showing ${visibleCount} of ${totalCount} risks`}
        </p>
        <Select
          options={pageSizeOptions}
          value={String(itemsPerPage)}
          onChange={(val) => onItemsPerPageChange(parseInt(val, 10))}
          className="w-16 h-8 text-xs"
        />
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          title={isAr ? 'الصفحة الأولى' : 'First page'}
        >
          {isAr ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {isAr ? <ChevronRight className="h-4 w-4 -ms-2" /> : <ChevronLeft className="h-4 w-4 -ms-2" />}
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          title={isAr ? 'الصفحة السابقة' : 'Previous page'}
        >
          {isAr ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
        <div className="flex items-center gap-1 px-2">
          <input
            type="number"
            min={1}
            max={totalPages || 1}
            value={currentPage}
            onChange={(e) => {
              const page = parseInt(e.target.value, 10);
              if (page >= 1 && page <= totalPages) {
                onPageChange(page);
              }
            }}
            className="w-12 h-8 text-center text-sm border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)]"
          />
          <span className="text-sm text-[var(--foreground-secondary)]">
            / {totalPages || 1}
          </span>
        </div>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          title={isAr ? 'الصفحة التالية' : 'Next page'}
        >
          {isAr ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          title={isAr ? 'الصفحة الأخيرة' : 'Last page'}
        >
          {isAr ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          {isAr ? <ChevronLeft className="h-4 w-4 -ms-2" /> : <ChevronRight className="h-4 w-4 -ms-2" />}
        </Button>
      </div>
    </div>
  );
}
