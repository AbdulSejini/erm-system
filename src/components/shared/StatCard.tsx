'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'critical' | 'high' | 'medium' | 'low' | 'info';
  onClick?: () => void;
}

const colorClasses = {
  primary: {
    bg: 'bg-[var(--primary-light)]',
    icon: 'text-[var(--primary)]',
  },
  critical: {
    bg: 'bg-[var(--risk-critical-bg)]',
    icon: 'text-[var(--risk-critical)]',
  },
  high: {
    bg: 'bg-[var(--risk-high-bg)]',
    icon: 'text-[var(--risk-high)]',
  },
  medium: {
    bg: 'bg-[var(--risk-medium-bg)]',
    icon: 'text-[var(--risk-medium)]',
  },
  low: {
    bg: 'bg-[var(--risk-low-bg)]',
    icon: 'text-[var(--risk-low)]',
  },
  info: {
    bg: 'bg-[var(--risk-negligible-bg)]',
    icon: 'text-[var(--risk-negligible)]',
  },
};

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color = 'primary',
  onClick,
}: StatCardProps) {
  const colors = colorClasses[color];

  return (
    <Card
      hover={!!onClick}
      onClick={onClick}
      className={cn('relative overflow-hidden', onClick && 'cursor-pointer')}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-[var(--foreground-secondary)]">{title}</p>
          <p className="mt-2 text-3xl font-bold text-[var(--foreground)]">
            {value}
          </p>
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              <span
                className={cn(
                  'text-sm font-medium',
                  trend.isPositive
                    ? 'text-[var(--status-success)]'
                    : 'text-[var(--status-error)]'
                )}
              >
                {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-[var(--foreground-muted)]">
                من الشهر الماضي
              </span>
            </div>
          )}
        </div>
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-lg',
            colors.bg
          )}
        >
          <Icon className={cn('h-6 w-6', colors.icon)} />
        </div>
      </div>
    </Card>
  );
}
