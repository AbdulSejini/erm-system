'use client';

import React from 'react';
import { X, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { RiskRating } from '@/types';
import type { SortField, SortDirection } from './types';
import { getRatingBadgeVariant, getStatusBadgeVariant } from './utils';
import { RiskRowActions } from './RiskRowActions';
import { RisksPagination } from './RisksPagination';

/**
 * Table view for the risks register. Encapsulates the 9-column layout,
 * sortable headers, row rendering, deleted-row decorations, and the
 * footer pagination bar.
 *
 * Pure presentational — the parent owns all data and callbacks.
 */

/**
 * The UI-shape of a single risk row. Matches the transformed mock risk
 * used throughout the page (via `typeof mockRisks[0]`). Typed loosely
 * here to keep this file decoupled from the page's internal types.
 */
export interface RiskRow {
  id: string;
  riskNumber: string;
  titleAr: string;
  titleEn: string;
  departmentAr: string;
  departmentEn: string;
  processAr: string;
  processEn: string;
  categoryCode: string;
  issuedBy: string | null;
  inherentScore: number;
  inherentRating: RiskRating;
  residualScore: number | null;
  residualRating: RiskRating | null;
  status: string;
  ownerAr: string;
  ownerEn: string;
  commentsCount?: number;
  isDeleted?: boolean;
}

interface RisksTableProps {
  risks: RiskRow[];
  filteredCount: number;
  isAr: boolean;
  t: (key: string) => string;
  /** Returns a translated label for a RiskStatus code. */
  getStatusDisplayName: (code: string) => string;

  // Sort
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField) => void;

  // Pagination
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;

  // Row actions — loose types so the parent can pass in handlers bound
  // to its wider mock-risk shape without an explicit cast.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onViewRisk: (risk: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onDiscussRisk: (risk: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEditRisk: (risk: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onDeleteRisk: (risk: any) => void;
}

/** Small helper that renders the asc/desc caret next to a sort column. */
function SortCaret({
  field,
  sortField,
  sortDirection,
}: {
  field: SortField;
  sortField: SortField;
  sortDirection: SortDirection;
}) {
  if (sortField !== field) return null;
  return sortDirection === 'asc' ? (
    <ArrowUp className="h-3 w-3" />
  ) : (
    <ArrowDown className="h-3 w-3" />
  );
}

export function RisksTable({
  risks,
  filteredCount,
  isAr,
  t,
  getStatusDisplayName,
  sortField,
  sortDirection,
  onSortChange,
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  onViewRisk,
  onDiscussRisk,
  onEditRisk,
  onDeleteRisk,
}: RisksTableProps) {
  const headerBase =
    'p-2 sm:p-3 md:p-4 text-start text-xs sm:text-sm font-medium text-[var(--foreground-secondary)] whitespace-nowrap';
  const sortableHeaderBase = `${headerBase} cursor-pointer hover:bg-[var(--background-tertiary)] transition-colors`;

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--background-secondary)]">
                <th
                  className={sortableHeaderBase}
                  onClick={() => onSortChange('riskNumber')}
                >
                  <div className="flex items-center gap-1">
                    {t('risks.riskNumber')}
                    <SortCaret field="riskNumber" sortField={sortField} sortDirection={sortDirection} />
                  </div>
                </th>
                <th
                  className={`${sortableHeaderBase.replace(' whitespace-nowrap', '')}`}
                  onClick={() => onSortChange('title')}
                >
                  <div className="flex items-center gap-1">
                    {t('risks.riskTitle')}
                    <SortCaret field="title" sortField={sortField} sortDirection={sortDirection} />
                  </div>
                </th>
                <th className={headerBase}>{t('risks.riskCategory')}</th>
                <th className={headerBase}>{t('risks.issuedBy')}</th>
                <th className={sortableHeaderBase} onClick={() => onSortChange('inherentScore')}>
                  <div className="flex items-center gap-1">
                    {t('risks.inherentRisk')}
                    <SortCaret field="inherentScore" sortField={sortField} sortDirection={sortDirection} />
                  </div>
                </th>
                <th className={sortableHeaderBase} onClick={() => onSortChange('residualScore')}>
                  <div className="flex items-center gap-1">
                    {t('risks.residualRisk')}
                    <SortCaret field="residualScore" sortField={sortField} sortDirection={sortDirection} />
                  </div>
                </th>
                <th className={sortableHeaderBase} onClick={() => onSortChange('status')}>
                  <div className="flex items-center gap-1">
                    {t('common.status')}
                    <SortCaret field="status" sortField={sortField} sortDirection={sortDirection} />
                  </div>
                </th>
                <th className={headerBase}>{t('risks.riskOwner')}</th>
                <th className={`${headerBase.replace('text-start', 'text-center')}`}>
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {risks.map((risk) => (
                <tr
                  key={risk.id}
                  className={cn(
                    'border-b border-[var(--border)] transition-all duration-300 hover:bg-[var(--background-secondary)]',
                    risk.isDeleted && [
                      'bg-gradient-to-r from-red-50/80 via-red-50/40 to-transparent',
                      'dark:from-red-950/40 dark:via-red-950/20 dark:to-transparent',
                      'border-l-4 border-l-red-500',
                      'opacity-70 hover:opacity-90',
                    ]
                  )}
                >
                  <td className="p-2 sm:p-3 md:p-4">
                    <div className="flex items-center gap-1.5">
                      {risk.isDeleted && (
                        <span className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-100 dark:bg-red-900/50 animate-pulse">
                          <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-red-500" />
                        </span>
                      )}
                      <code
                        className={cn(
                          'rounded px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-mono',
                          risk.isDeleted
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 line-through decoration-red-500 decoration-2'
                            : 'bg-[var(--background-tertiary)]'
                        )}
                      >
                        {risk.riskNumber}
                      </code>
                      {risk.isDeleted && (
                        <span className="inline-flex items-center gap-1 text-xs text-white font-bold px-1.5 py-0.5 rounded-full bg-red-500 shadow-sm animate-pulse">
                          <X className="h-2.5 w-2.5" />
                          {isAr ? 'محذوف' : 'Deleted'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-2 sm:p-3 md:p-4">
                    <div className="max-w-[200px] sm:max-w-[250px] md:max-w-[300px]">
                      <p
                        className={cn(
                          'font-medium text-xs sm:text-sm truncate',
                          risk.isDeleted
                            ? 'text-red-600/70 dark:text-red-400/70 line-through decoration-red-400'
                            : 'text-[var(--foreground)]'
                        )}
                      >
                        {isAr ? risk.titleAr : risk.titleEn}
                      </p>
                      <p
                        className={cn(
                          'mt-0.5 text-xs truncate',
                          risk.isDeleted
                            ? 'text-red-400/60 dark:text-red-500/60'
                            : 'text-[var(--foreground-muted)]'
                        )}
                      >
                        {isAr ? risk.departmentAr : risk.departmentEn} • {isAr ? risk.processAr : risk.processEn}
                      </p>
                    </div>
                  </td>
                  <td className="p-2 sm:p-3 md:p-4">
                    <span className="text-xs sm:text-sm text-[var(--foreground-secondary)]">
                      {t(`risks.categories.${risk.categoryCode}`)}
                    </span>
                  </td>
                  <td className="p-2 sm:p-3 md:p-4">
                    <span className="text-xs sm:text-sm text-[var(--foreground-secondary)]">
                      {risk.issuedBy || '—'}
                    </span>
                  </td>
                  <td className="p-2 sm:p-3 md:p-4">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="font-mono text-xs sm:text-sm">{risk.inherentScore}</span>
                      <Badge
                        variant={getRatingBadgeVariant(risk.inherentRating)}
                        className="text-xs px-1.5 sm:px-2"
                      >
                        {t(`risks.ratings.${risk.inherentRating}`)}
                      </Badge>
                    </div>
                  </td>
                  <td className="p-2 sm:p-3 md:p-4">
                    {risk.residualScore ? (
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="font-mono text-xs sm:text-sm">{risk.residualScore}</span>
                        <Badge
                          variant={getRatingBadgeVariant(risk.residualRating!)}
                          className="text-xs px-1.5 sm:px-2"
                        >
                          {t(`risks.ratings.${risk.residualRating}`)}
                        </Badge>
                      </div>
                    ) : (
                      <span className="text-xs sm:text-sm text-[var(--foreground-muted)]">-</span>
                    )}
                  </td>
                  <td className="p-2 sm:p-3 md:p-4">
                    <Badge
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      variant={getStatusBadgeVariant(risk.status as any)}
                      className="text-xs px-1.5 sm:px-2"
                    >
                      {getStatusDisplayName(risk.status)}
                    </Badge>
                  </td>
                  <td className="p-2 sm:p-3 md:p-4 text-xs sm:text-sm text-[var(--foreground-secondary)]">
                    {isAr ? risk.ownerAr : risk.ownerEn}
                  </td>
                  <td className="p-2 sm:p-3 md:p-4">
                    <RiskRowActions
                      risk={risk}
                      isAr={isAr}
                      onView={() => onViewRisk(risk)}
                      onDiscuss={() => onDiscussRisk(risk)}
                      onEdit={() => onEditRisk(risk)}
                      onDelete={() => onDeleteRisk(risk)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <RisksPagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          visibleCount={risks.length}
          totalCount={filteredCount}
          isAr={isAr}
          onPageChange={onPageChange}
          onItemsPerPageChange={onItemsPerPageChange}
        />
      </CardContent>
    </Card>
  );
}
