'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';

/**
 * Loading placeholder for the risks register.
 *
 * Mirrors the real layout (9-column table with 8 rows, or 6 summary
 * cards) so switching from the placeholder to real data doesn't cause
 * any layout shift. The grey blocks use `animate-pulse` for a subtle
 * shimmer effect.
 */
interface RisksSkeletonProps {
  viewMode: 'table' | 'cards';
}

export function RisksSkeleton({ viewMode }: RisksSkeletonProps) {
  if (viewMode === 'table') {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--background-secondary)]">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <th key={i} className="p-2 sm:p-3 md:p-4">
                      <div className="h-3 w-16 animate-pulse rounded bg-[var(--background-tertiary)]" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }).map((_, rowIdx) => (
                  <tr key={rowIdx} className="border-b border-[var(--border)]">
                    <td className="p-2 sm:p-3 md:p-4">
                      <div className="h-5 w-20 animate-pulse rounded bg-[var(--background-tertiary)]" />
                    </td>
                    <td className="p-2 sm:p-3 md:p-4">
                      <div className="space-y-1.5">
                        <div className="h-3 w-48 animate-pulse rounded bg-[var(--background-tertiary)]" />
                        <div className="h-2.5 w-32 animate-pulse rounded bg-[var(--background-tertiary)]" />
                      </div>
                    </td>
                    <td className="p-2 sm:p-3 md:p-4">
                      <div className="h-3 w-20 animate-pulse rounded bg-[var(--background-tertiary)]" />
                    </td>
                    <td className="p-2 sm:p-3 md:p-4">
                      <div className="h-3 w-16 animate-pulse rounded bg-[var(--background-tertiary)]" />
                    </td>
                    <td className="p-2 sm:p-3 md:p-4">
                      <div className="h-5 w-20 animate-pulse rounded-full bg-[var(--background-tertiary)]" />
                    </td>
                    <td className="p-2 sm:p-3 md:p-4">
                      <div className="h-5 w-20 animate-pulse rounded-full bg-[var(--background-tertiary)]" />
                    </td>
                    <td className="p-2 sm:p-3 md:p-4">
                      <div className="h-5 w-16 animate-pulse rounded-full bg-[var(--background-tertiary)]" />
                    </td>
                    <td className="p-2 sm:p-3 md:p-4">
                      <div className="h-3 w-24 animate-pulse rounded bg-[var(--background-tertiary)]" />
                    </td>
                    <td className="p-2 sm:p-3 md:p-4">
                      <div className="flex items-center justify-center gap-1">
                        <div className="h-6 w-6 animate-pulse rounded bg-[var(--background-tertiary)]" />
                        <div className="h-6 w-6 animate-pulse rounded bg-[var(--background-tertiary)]" />
                        <div className="h-6 w-6 animate-pulse rounded bg-[var(--background-tertiary)]" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Cards-mode skeleton: 6 placeholder cards in a responsive grid.
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="p-4">
          <div className="mb-3 flex items-start justify-between">
            <div className="h-5 w-24 animate-pulse rounded bg-[var(--background-tertiary)]" />
            <div className="h-5 w-16 animate-pulse rounded-full bg-[var(--background-tertiary)]" />
          </div>
          <div className="mb-2 h-4 w-3/4 animate-pulse rounded bg-[var(--background-tertiary)]" />
          <div className="mb-4 space-y-1.5">
            <div className="h-3 w-full animate-pulse rounded bg-[var(--background-tertiary)]" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-[var(--background-tertiary)]" />
          </div>
          <div className="mb-4 flex flex-wrap gap-2">
            <div className="h-6 w-20 animate-pulse rounded-full bg-[var(--background-tertiary)]" />
            <div className="h-6 w-24 animate-pulse rounded-full bg-[var(--background-tertiary)]" />
          </div>
          <div className="mb-4 grid grid-cols-2 gap-3 rounded-lg bg-[var(--background-secondary)] p-3">
            <div className="space-y-1.5">
              <div className="h-3 w-16 animate-pulse rounded bg-[var(--background-tertiary)]" />
              <div className="h-5 w-12 animate-pulse rounded bg-[var(--background-tertiary)]" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-16 animate-pulse rounded bg-[var(--background-tertiary)]" />
              <div className="h-5 w-12 animate-pulse rounded bg-[var(--background-tertiary)]" />
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-[var(--border)] pt-4">
            <div className="h-3 w-24 animate-pulse rounded bg-[var(--background-tertiary)]" />
            <div className="flex gap-1">
              <div className="h-7 w-7 animate-pulse rounded bg-[var(--background-tertiary)]" />
              <div className="h-7 w-7 animate-pulse rounded bg-[var(--background-tertiary)]" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
