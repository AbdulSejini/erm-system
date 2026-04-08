'use client';

import React from 'react';
import { X, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/utils';
import { getRatingBadgeVariant, getStatusBadgeVariant } from './utils';
import { RiskRowActions } from './RiskRowActions';
import type { RiskRow } from './RisksTable';

/**
 * Cards view for the risks register — the mobile-friendly alternative
 * to the table. Rendered when the user selects the cards layout (the
 * default on screens narrower than 768px).
 *
 * Deleted risks get a diagonal stripe overlay and a gradient banner
 * so they stand out even in the denser card layout.
 *
 * The cards-view pagination here is the simpler "Previous / N of M /
 * Next" strip. The sticky first/last + input pagination from the
 * table view doesn't fit naturally under a grid, so we keep the two
 * layouts separate.
 */
interface RisksCardGridProps {
  risks: RiskRow[];
  filteredCount: number;
  isAr: boolean;
  t: (key: string) => string;
  /** Returns a translated label for a RiskStatus code. */
  getStatusDisplayName: (code: string) => string;

  // Extra field the table doesn't use — description text for the card body.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getDescription: (risk: any) => string;

  // Pagination
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;

  // Row actions (loose types to match page-level mock-risk shape)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onViewRisk: (risk: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onDiscussRisk: (risk: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEditRisk: (risk: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onDeleteRisk: (risk: any) => void;
}

const CARD_PAGE_SIZE_OPTIONS = [
  { value: '6', label: '6' },
  { value: '12', label: '12' },
  { value: '24', label: '24' },
];

export function RisksCardGrid({
  risks,
  filteredCount,
  isAr,
  t,
  getStatusDisplayName,
  getDescription,
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  onViewRisk,
  onDiscussRisk,
  onEditRisk,
  onDeleteRisk,
}: RisksCardGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {risks.map((risk) => (
        <Card
          key={risk.id}
          hover
          className={cn(
            'overflow-hidden relative',
            risk.isDeleted && [
              'opacity-75 hover:opacity-90',
              'border-2 border-red-300 dark:border-red-700/70',
              'bg-gradient-to-br from-red-50/50 to-transparent dark:from-red-950/30 dark:to-transparent',
            ]
          )}
        >
          {/* Diagonal stripe overlay for deleted risks */}
          {risk.isDeleted && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-[repeating-linear-gradient(135deg,transparent,transparent_10px,rgba(239,68,68,0.1)_10px,rgba(239,68,68,0.1)_20px)]" />
            </div>
          )}
          <div className="p-4 relative">
            {/* Deleted banner */}
            {risk.isDeleted && (
              <div className="mb-3 -mx-4 -mt-4 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold text-center flex items-center justify-center gap-2 shadow-md">
                <Trash2 className="h-3.5 w-3.5 animate-pulse" />
                {isAr ? 'خطر محذوف' : 'Deleted Risk'}
                <Trash2 className="h-3.5 w-3.5 animate-pulse" />
              </div>
            )}

            {/* Header: risk number + status badge */}
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-2">
                {risk.isDeleted && (
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/50">
                    <X className="h-3.5 w-3.5 text-red-500" />
                  </span>
                )}
                <code
                  className={cn(
                    'rounded px-2 py-1 text-xs font-mono',
                    risk.isDeleted
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 line-through decoration-2'
                      : 'bg-[var(--background-tertiary)]'
                  )}
                >
                  {risk.riskNumber}
                </code>
              </div>
              <Badge
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                variant={getStatusBadgeVariant(risk.status as any)}
              >
                {getStatusDisplayName(risk.status)}
              </Badge>
            </div>

            {/* Title + description */}
            <h3
              className={cn(
                'mb-2 font-semibold',
                risk.isDeleted
                  ? 'line-through decoration-red-400 decoration-2 text-red-600/70 dark:text-red-400/70'
                  : 'text-[var(--foreground)]'
              )}
            >
              {isAr ? risk.titleAr : risk.titleEn}
            </h3>
            <p className="mb-4 text-sm text-[var(--foreground-secondary)] line-clamp-2">
              {getDescription(risk)}
            </p>

            {/* Category, Issued By, Department chips */}
            <div className="mb-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-[var(--background-secondary)] px-2 py-1">
                {t(`risks.categories.${risk.categoryCode}`)}
              </span>
              {risk.issuedBy && (
                <span className="rounded-full bg-[var(--background-secondary)] px-2 py-1">
                  {t('risks.issuedBy')}: {risk.issuedBy}
                </span>
              )}
              <span className="rounded-full bg-[var(--background-secondary)] px-2 py-1">
                {isAr ? risk.departmentAr : risk.departmentEn}
              </span>
            </div>

            {/* Risk scores: inherent vs residual */}
            <div className="mb-4 grid grid-cols-2 gap-4 rounded-lg bg-[var(--background-secondary)] p-3">
              <div>
                <p className="text-xs text-[var(--foreground-secondary)]">
                  {t('risks.inherentRisk')}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-lg font-bold">{risk.inherentScore}</span>
                  <Badge
                    variant={getRatingBadgeVariant(risk.inherentRating)}
                    className="text-xs"
                  >
                    {t(`risks.ratings.${risk.inherentRating}`)}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-xs text-[var(--foreground-secondary)]">
                  {t('risks.residualRisk')}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-lg font-bold">{risk.residualScore || '-'}</span>
                  {risk.residualRating && (
                    <Badge
                      variant={getRatingBadgeVariant(risk.residualRating)}
                      className="text-xs"
                    >
                      {t(`risks.ratings.${risk.residualRating}`)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Footer: owner + actions */}
            <div className="flex items-center justify-between border-t border-[var(--border)] pt-4">
              <div className="text-sm text-[var(--foreground-secondary)]">
                <span className="font-medium">{t('risks.riskOwner')}:</span>{' '}
                {isAr ? risk.ownerAr : risk.ownerEn}
              </div>
              <RiskRowActions
                risk={risk}
                isAr={isAr}
                onView={() => onViewRisk(risk)}
                onDiscuss={() => onDiscussRisk(risk)}
                onEdit={() => onEditRisk(risk)}
                onDelete={() => onDeleteRisk(risk)}
                size="md"
              />
            </div>
          </div>
        </Card>
      ))}

      {/* Cards-view pagination (simpler Previous/Next strip) */}
      {totalPages > 1 && (
        <div className="col-span-full">
          <Card>
            <CardContent className="p-3">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-[var(--foreground-secondary)]">
                    {isAr
                      ? `عرض ${risks.length} من ${filteredCount} خطر`
                      : `Showing ${risks.length} of ${filteredCount} risks`}
                  </p>
                  <Select
                    options={CARD_PAGE_SIZE_OPTIONS}
                    value={String(itemsPerPage)}
                    onChange={(val) => onItemsPerPageChange(parseInt(val, 10))}
                    className="w-16 h-8 text-xs"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    {isAr ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <ChevronLeft className="h-4 w-4" />
                    )}
                    <span className="ms-1">{isAr ? 'السابق' : 'Previous'}</span>
                  </Button>
                  <span className="text-sm text-[var(--foreground)]">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onPageChange(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage >= totalPages}
                  >
                    <span className="me-1">{isAr ? 'التالي' : 'Next'}</span>
                    {isAr ? (
                      <ChevronLeft className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
