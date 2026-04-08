'use client';

import React from 'react';
import { BarChart3, AlertTriangle, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The five stat cards above the risks register. Each card is a button
 * that toggles a quick filter:
 *
 *   - Total      → clears the rating + status filters (show everything)
 *   - Critical   → filters by inherentRating = "Critical"
 *   - Major      → filters by inherentRating = "Major"
 *   - Open       → filters by status = "open"
 *   - Mitigated  → filters by status = "mitigated"
 *
 * The currently-active card draws a colored ring (matching its theme)
 * and reports `aria-pressed` for assistive tech. The parent is
 * responsible for computing the counts + the active-state booleans and
 * for wiring up the click handler to the real filter state.
 */
export type StatFilterKind = 'total' | 'critical' | 'major' | 'open' | 'mitigated';

interface RisksStatsCardsProps {
  stats: {
    total: number;
    critical: number;
    major: number;
    open: number;
    mitigated: number;
  };
  /** Is each card currently the active filter? */
  active: {
    total: boolean;
    critical: boolean;
    major: boolean;
    open: boolean;
    mitigated: boolean;
  };
  /** Localized labels for each card title. */
  labels: {
    total: string;
    critical: string;
    major: string;
    open: string;
    mitigated: string;
  };
  /** Toggle a card's filter on/off. */
  onToggle: (kind: StatFilterKind) => void;
}

/**
 * Shared shell styles for every stat card. Keeps the hover/focus/ring
 * treatment consistent in a single place.
 */
const baseCardClasses =
  'rounded-xl border bg-[var(--card)] p-2 sm:p-3 md:p-4 text-start transition-all ' +
  'hover:shadow-md hover:-translate-y-0.5 ' +
  'focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2';

export function RisksStatsCards({
  stats,
  active,
  labels,
  onToggle,
}: RisksStatsCardsProps) {
  return (
    <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
      {/* Total — clears all rating/status filters */}
      <button
        type="button"
        onClick={() => onToggle('total')}
        aria-pressed={active.total}
        className={cn(
          baseCardClasses,
          active.total
            ? 'border-[var(--primary)] ring-1 ring-[var(--primary)]'
            : 'border-[var(--border)]'
        )}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-lg bg-[var(--primary-light)] shrink-0">
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--primary)]" />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--foreground)]">
              {stats.total}
            </p>
            <p className="text-xs text-[var(--foreground-secondary)] truncate">
              {labels.total}
            </p>
          </div>
        </div>
      </button>

      {/* Critical rating filter */}
      <button
        type="button"
        onClick={() => onToggle('critical')}
        aria-pressed={active.critical}
        className={cn(
          baseCardClasses,
          active.critical
            ? 'border-[var(--risk-critical)] ring-1 ring-[var(--risk-critical)]'
            : 'border-[var(--border)]'
        )}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-lg bg-[var(--risk-critical-bg)] shrink-0">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--risk-critical)]" />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--foreground)]">
              {stats.critical}
            </p>
            <p className="text-xs text-[var(--foreground-secondary)] truncate">
              {labels.critical}
            </p>
          </div>
        </div>
      </button>

      {/* Major rating filter */}
      <button
        type="button"
        onClick={() => onToggle('major')}
        aria-pressed={active.major}
        className={cn(
          baseCardClasses,
          active.major
            ? 'border-[var(--risk-high)] ring-1 ring-[var(--risk-high)]'
            : 'border-[var(--border)]'
        )}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-lg bg-[var(--risk-high-bg)] shrink-0">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--risk-high)]" />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--foreground)]">
              {stats.major}
            </p>
            <p className="text-xs text-[var(--foreground-secondary)] truncate">
              {labels.major}
            </p>
          </div>
        </div>
      </button>

      {/* Open status filter */}
      <button
        type="button"
        onClick={() => onToggle('open')}
        aria-pressed={active.open}
        className={cn(
          baseCardClasses,
          active.open
            ? 'border-[var(--status-warning)] ring-1 ring-[var(--status-warning)]'
            : 'border-[var(--border)]'
        )}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-lg bg-[var(--status-warning)]/10 shrink-0">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--status-warning)]" />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--foreground)]">
              {stats.open}
            </p>
            <p className="text-xs text-[var(--foreground-secondary)] truncate">
              {labels.open}
            </p>
          </div>
        </div>
      </button>

      {/* Mitigated status filter */}
      <button
        type="button"
        onClick={() => onToggle('mitigated')}
        aria-pressed={active.mitigated}
        className={cn(
          'col-span-2 sm:col-span-1',
          baseCardClasses,
          active.mitigated
            ? 'border-[var(--status-success)] ring-1 ring-[var(--status-success)]'
            : 'border-[var(--border)]'
        )}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-lg bg-[var(--status-success)]/10 shrink-0">
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--status-success)]" />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--foreground)]">
              {stats.mitigated}
            </p>
            <p className="text-xs text-[var(--foreground-secondary)] truncate">
              {labels.mitigated}
            </p>
          </div>
        </div>
      </button>
    </div>
  );
}
