import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { RiskLevel } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateRiskScore(likelihood: number, impact: number): number {
  return likelihood * impact;
}

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 20) return 'critical';
  if (score >= 15) return 'high';
  if (score >= 10) return 'medium';
  if (score >= 5) return 'low';
  return 'negligible';
}

export function getRiskLevelColor(level: RiskLevel): string {
  switch (level) {
    case 'critical':
      return 'var(--risk-critical)';
    case 'high':
      return 'var(--risk-high)';
    case 'medium':
      return 'var(--risk-medium)';
    case 'low':
      return 'var(--risk-low)';
    case 'negligible':
      return 'var(--risk-negligible)';
    default:
      return 'var(--foreground-muted)';
  }
}

export function getRiskLevelBgColor(level: RiskLevel): string {
  switch (level) {
    case 'critical':
      return 'var(--risk-critical-bg)';
    case 'high':
      return 'var(--risk-high-bg)';
    case 'medium':
      return 'var(--risk-medium-bg)';
    case 'low':
      return 'var(--risk-low-bg)';
    case 'negligible':
      return 'var(--risk-negligible-bg)';
    default:
      return 'var(--background-secondary)';
  }
}

export function formatDate(date: Date | string, locale: 'ar' | 'en' = 'ar'): string {
  const d = new Date(date);
  return d.toLocaleDateString(locale === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: Date | string, locale: 'ar' | 'en' = 'ar'): string {
  const d = new Date(date);
  return d.toLocaleDateString(locale === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function generateRiskNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `RSK-${year}-${random}`;
}

export function generateIncidentNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INC-${year}-${random}`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function groupBy<T, K extends keyof T>(array: T[], key: K): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

export function sortByDate<T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'desc'): T[] {
  return [...array].sort((a, b) => {
    const dateA = new Date(a[key] as unknown as string).getTime();
    const dateB = new Date(b[key] as unknown as string).getTime();
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
}

export function calculateProgress(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export function isOverdue(dueDate: Date | string): boolean {
  return new Date(dueDate) < new Date();
}

export function getDaysUntilDue(dueDate: Date | string): number {
  const due = new Date(dueDate);
  const now = new Date();
  const diffTime = due.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
