'use client';

import React, { useEffect, useRef } from 'react';
import {
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  List,
  Grid3X3,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import type { SortField, SortDirection } from './types';

/**
 * Full filter / sort / view-toggle bar that sits between the stats
 * cards and the risks grid on the register page.
 *
 * Composed of five sub-regions, all inside a single Card:
 *
 *   1. Search input with a clear button
 *   2. Click-based sort dropdown (field + direction)
 *   3. Filter button + "clear all" affordance
 *   4. Table/cards view toggle
 *   5. Collapsible filter panel (4 selects) + active-filter chip row
 *
 * The sort dropdown owns its own open/close state locally (it's
 * self-contained); everything else is fully controlled by the parent
 * page so searchParams / URL state stays authoritative.
 */

export interface FilterOption {
  value: string;
  label: string;
}

interface RisksFilterBarProps {
  // Search
  searchQuery: string;
  onSearchChange: (value: string) => void;

  // Sort
  sortField: SortField;
  sortDirection: SortDirection;
  sortOptions: FilterOption[];
  onSortFieldChange: (field: SortField) => void;
  onSortDirectionChange: (dir: SortDirection) => void;

  // Filters (values + setters)
  filterRating: string;
  filterCategory: string;
  filterStatus: string;
  filterDepartment: string;
  onFilterRatingChange: (val: string) => void;
  onFilterCategoryChange: (val: string) => void;
  onFilterStatusChange: (val: string) => void;
  onFilterDepartmentChange: (val: string) => void;

  // Filter options (dropdown contents)
  ratingOptions: FilterOption[];
  categoryOptions: FilterOption[];
  statusOptions: FilterOption[];
  departmentOptions: FilterOption[];

  // Panel visibility + counters
  showFilters: boolean;
  onToggleFilters: () => void;
  activeFiltersCount: number;
  onClearAllFilters: () => void;

  // View mode
  viewMode: 'table' | 'cards';
  onViewModeChange: (mode: 'table' | 'cards') => void;

  // Localization
  isAr: boolean;
  /** Pre-translated labels for the rating chip + ratings dropdown. */
  ratingChipLabel: string;
  /** Localized section labels for the collapsible filter panel. */
  labels: {
    riskRating: string;
    riskCategory: string;
    riskStatus: string;
    department: string;
  };
}

export function RisksFilterBar({
  searchQuery,
  onSearchChange,
  sortField,
  sortDirection,
  sortOptions,
  onSortFieldChange,
  onSortDirectionChange,
  filterRating,
  filterCategory,
  filterStatus,
  filterDepartment,
  onFilterRatingChange,
  onFilterCategoryChange,
  onFilterStatusChange,
  onFilterDepartmentChange,
  ratingOptions,
  categoryOptions,
  statusOptions,
  departmentOptions,
  showFilters,
  onToggleFilters,
  activeFiltersCount,
  onClearAllFilters,
  viewMode,
  onViewModeChange,
  isAr,
  ratingChipLabel,
  labels,
}: RisksFilterBarProps) {
  // Local sort menu open/close state — the dropdown is self-contained.
  const [sortMenuOpen, setSortMenuOpen] = React.useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sortMenuOpen) return;
    function onDocClick(e: MouseEvent) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setSortMenuOpen(false);
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setSortMenuOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [sortMenuOpen]);

  // Should the active-filters chip row render at all?
  const hasActiveFilters =
    activeFiltersCount > 0 ||
    sortField !== 'inherentScore' ||
    sortDirection !== 'desc';

  return (
    <Card>
      <CardContent className="p-2 sm:p-3 md:p-4">
        <div className="flex flex-col gap-2 sm:gap-3 md:gap-4 lg:flex-row lg:items-center">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Input
                placeholder={
                  isAr
                    ? 'بحث برقم الخطر أو العنوان...'
                    : 'Search by risk number or title...'
                }
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                leftIcon={<Search className="h-4 w-4 sm:h-5 sm:w-5" />}
                className="text-xs sm:text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute inset-y-0 end-0 flex items-center pe-3 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {/* Sort Dropdown — click-based, keyboard + touch friendly */}
            <div className="relative" ref={sortMenuRef}>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<ArrowUpDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                rightIcon={
                  sortDirection === 'asc' ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )
                }
                className="min-w-[120px]"
                onClick={() => setSortMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={sortMenuOpen}
              >
                <span className="text-xs sm:text-sm truncate">
                  {sortOptions.find((opt) => opt.value === sortField)?.label}
                </span>
              </Button>
              {sortMenuOpen && (
                <div
                  role="menu"
                  className="absolute top-full mt-1 end-0 z-50 min-w-[200px] rounded-lg border border-[var(--border)] bg-[var(--background)] shadow-lg"
                >
                  <div className="p-1">
                    <div className="px-2 py-1.5 text-xs font-medium text-[var(--foreground-secondary)]">
                      {isAr ? 'ترتيب حسب' : 'Sort by'}
                    </div>
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        role="menuitem"
                        onClick={() => {
                          onSortFieldChange(option.value as SortField);
                          setSortMenuOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-sm transition-colors hover:bg-[var(--background-secondary)] ${
                          sortField === option.value
                            ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                            : 'text-[var(--foreground)]'
                        }`}
                      >
                        <span>{option.label}</span>
                        {sortField === option.value &&
                          (sortDirection === 'asc' ? (
                            <ArrowUp className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5" />
                          ))}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-[var(--border)] p-1">
                    <div className="px-2 py-1.5 text-xs font-medium text-[var(--foreground-secondary)]">
                      {isAr ? 'اتجاه الترتيب' : 'Direction'}
                    </div>
                    <button
                      role="menuitem"
                      onClick={() => {
                        onSortDirectionChange('asc');
                        setSortMenuOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors hover:bg-[var(--background-secondary)] ${
                        sortDirection === 'asc'
                          ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                          : 'text-[var(--foreground)]'
                      }`}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                      <span>{isAr ? 'تصاعدي' : 'Ascending'}</span>
                    </button>
                    <button
                      role="menuitem"
                      onClick={() => {
                        onSortDirectionChange('desc');
                        setSortMenuOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors hover:bg-[var(--background-secondary)] ${
                        sortDirection === 'desc'
                          ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                          : 'text-[var(--foreground)]'
                      }`}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                      <span>{isAr ? 'تنازلي' : 'Descending'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Filter Button */}
            <Button
              variant={showFilters ? 'primary' : 'outline'}
              size="sm"
              leftIcon={<Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
              onClick={onToggleFilters}
              className="relative"
            >
              <span className="text-xs sm:text-sm">
                {isAr ? 'تصفية' : 'Filter'}
              </span>
              {activeFiltersCount > 0 && (
                // 10px is intentional here — this is a 16px circular badge
                // and 12px would overflow the bubble.
                <span className="absolute -top-1 -end-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--status-error)] text-[10px] font-bold text-white">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAllFilters}
                className="text-xs text-[var(--status-error)] hover:text-[var(--status-error)]"
              >
                {isAr ? 'مسح الكل' : 'Clear all'}
              </Button>
            )}

            {/* View Mode Toggle */}
            <div className="flex rounded-lg border border-[var(--border)]">
              <button
                onClick={() => onViewModeChange('table')}
                className={`rounded-s-lg p-1.5 sm:p-2 transition-colors ${
                  viewMode === 'table'
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)]'
                }`}
              >
                <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
              <button
                onClick={() => onViewModeChange('cards')}
                className={`rounded-e-lg p-1.5 sm:p-2 transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)]'
                }`}
              >
                <Grid3X3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filters & Sort Tags */}
        {hasActiveFilters && (
          <div className="mt-2 flex flex-wrap gap-2">
            {filterRating && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--primary)]/10 px-2.5 py-1 text-xs text-[var(--primary)]">
                {ratingChipLabel}
                <button
                  onClick={() => onFilterRatingChange('')}
                  className="hover:text-[var(--status-error)]"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filterCategory && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--primary)]/10 px-2.5 py-1 text-xs text-[var(--primary)]">
                {categoryOptions.find((c) => c.value === filterCategory)?.label}
                <button
                  onClick={() => onFilterCategoryChange('')}
                  className="hover:text-[var(--status-error)]"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filterStatus && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--primary)]/10 px-2.5 py-1 text-xs text-[var(--primary)]">
                {statusOptions.find((s) => s.value === filterStatus)?.label}
                <button
                  onClick={() => onFilterStatusChange('')}
                  className="hover:text-[var(--status-error)]"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filterDepartment && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--primary)]/10 px-2.5 py-1 text-xs text-[var(--primary)]">
                {
                  departmentOptions.find((d) => d.value === filterDepartment)
                    ?.label
                }
                <button
                  onClick={() => onFilterDepartmentChange('')}
                  className="hover:text-[var(--status-error)]"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {/* Sort Tag */}
            {(sortField !== 'inherentScore' || sortDirection !== 'desc') && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--secondary)]/10 px-2.5 py-1 text-xs text-[var(--secondary)]">
                {sortDirection === 'asc' ? (
                  <ArrowUp className="h-3 w-3" />
                ) : (
                  <ArrowDown className="h-3 w-3" />
                )}
                {sortOptions.find((opt) => opt.value === sortField)?.label}
                <button
                  onClick={() => {
                    onSortFieldChange('inherentScore');
                    onSortDirectionChange('desc');
                  }}
                  className="hover:text-[var(--status-error)]"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Filter Panel */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            showFilters ? 'mt-3 sm:mt-4 max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="grid gap-2 sm:gap-3 md:gap-4 border-t border-[var(--border)] pt-3 sm:pt-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Select
              label={labels.riskRating}
              options={ratingOptions}
              value={filterRating}
              onChange={onFilterRatingChange}
            />
            <Select
              label={labels.riskCategory}
              options={categoryOptions}
              value={filterCategory}
              onChange={onFilterCategoryChange}
            />
            <Select
              label={labels.riskStatus}
              options={statusOptions}
              value={filterStatus}
              onChange={onFilterStatusChange}
            />
            <Select
              label={labels.department}
              options={departmentOptions}
              value={filterDepartment}
              onChange={onFilterDepartmentChange}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
