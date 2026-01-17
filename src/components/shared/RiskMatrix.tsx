'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/contexts/LanguageContext';
import type { RiskLevel } from '@/types';

interface RiskMatrixCell {
  likelihood: number;
  impact: number;
  count: number;
}

interface RiskMatrixProps {
  data?: RiskMatrixCell[];
  onCellClick?: (likelihood: number, impact: number) => void;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const getCellLevel = (likelihood: number, impact: number): RiskLevel => {
  const score = likelihood * impact;
  if (score >= 20) return 'critical';
  if (score >= 15) return 'high';
  if (score >= 10) return 'medium';
  if (score >= 5) return 'low';
  return 'negligible';
};

const getCellColor = (level: RiskLevel): string => {
  switch (level) {
    case 'critical':
      return 'bg-red-600 hover:bg-red-700';
    case 'high':
      return 'bg-orange-500 hover:bg-orange-600';
    case 'medium':
      return 'bg-yellow-400 hover:bg-yellow-500';
    case 'low':
      return 'bg-green-500 hover:bg-green-600';
    case 'negligible':
      return 'bg-blue-500 hover:bg-blue-600';
    default:
      return 'bg-gray-400';
  }
};

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-16 h-16 text-base',
};

export function RiskMatrix({
  data = [],
  onCellClick,
  showLabels = true,
  size = 'md',
}: RiskMatrixProps) {
  const { t, language } = useTranslation();

  const likelihoodLabels = [
    t('assessment.likelihood.1'),
    t('assessment.likelihood.2'),
    t('assessment.likelihood.3'),
    t('assessment.likelihood.4'),
    t('assessment.likelihood.5'),
  ];

  const impactLabels = [
    t('assessment.impact.1'),
    t('assessment.impact.2'),
    t('assessment.impact.3'),
    t('assessment.impact.4'),
    t('assessment.impact.5'),
  ];

  const getCount = (likelihood: number, impact: number): number => {
    const cell = data.find(
      (c) => c.likelihood === likelihood && c.impact === impact
    );
    return cell?.count || 0;
  };

  return (
    <div className="overflow-x-auto">
      <div className="inline-block">
        <div className="flex">
          {/* Y-axis label */}
          {showLabels && (
            <div className="flex items-center justify-center pe-2">
              <span
                className="text-xs font-medium text-[var(--foreground-secondary)]"
                style={{
                  writingMode: 'vertical-rl',
                  transform: language === 'ar' ? 'rotate(180deg)' : 'rotate(180deg)',
                }}
              >
                {t('risks.likelihood')}
              </span>
            </div>
          )}

          <div>
            {/* Matrix Grid */}
            <div className="flex flex-col-reverse">
              {[1, 2, 3, 4, 5].map((likelihood) => (
                <div key={likelihood} className="flex items-center">
                  {/* Likelihood Label */}
                  {showLabels && (
                    <div className={cn('flex items-center justify-end pe-2', sizeClasses[size])}>
                      <span className="text-xs text-[var(--foreground-secondary)] truncate max-w-16">
                        {likelihood}
                      </span>
                    </div>
                  )}

                  {/* Row Cells */}
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((impact) => {
                      const level = getCellLevel(likelihood, impact);
                      const count = getCount(likelihood, impact);
                      return (
                        <button
                          key={`${likelihood}-${impact}`}
                          onClick={() => onCellClick?.(likelihood, impact)}
                          className={cn(
                            'flex items-center justify-center border border-white/20 font-medium text-white transition-all',
                            getCellColor(level),
                            sizeClasses[size],
                            onCellClick && 'cursor-pointer'
                          )}
                          title={`${t('risks.likelihood')}: ${likelihood}, ${t('risks.impact')}: ${impact}`}
                        >
                          {count > 0 && count}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* X-axis labels */}
            {showLabels && (
              <div className="flex">
                <div className={cn(sizeClasses[size])} /> {/* Spacer */}
                {[1, 2, 3, 4, 5].map((impact) => (
                  <div
                    key={impact}
                    className={cn(
                      'flex items-start justify-center pt-2',
                      sizeClasses[size]
                    )}
                  >
                    <span className="text-xs text-[var(--foreground-secondary)]">
                      {impact}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* X-axis title */}
            {showLabels && (
              <div className="mt-1 text-center">
                <span className="text-xs font-medium text-[var(--foreground-secondary)]">
                  {t('risks.impact')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          {[
            { level: 'critical' as RiskLevel, label: t('assessment.levels.critical') },
            { level: 'high' as RiskLevel, label: t('assessment.levels.high') },
            { level: 'medium' as RiskLevel, label: t('assessment.levels.medium') },
            { level: 'low' as RiskLevel, label: t('assessment.levels.low') },
            { level: 'negligible' as RiskLevel, label: t('assessment.levels.negligible') },
          ].map(({ level, label }) => (
            <div key={level} className="flex items-center gap-1.5">
              <div
                className={cn(
                  'h-3 w-3 rounded-sm',
                  getCellColor(level).split(' ')[0]
                )}
              />
              <span className="text-xs text-[var(--foreground-secondary)]">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
