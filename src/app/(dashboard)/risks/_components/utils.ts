/**
 * Shared formatting + variant helpers used by the risks table and the
 * risks card grid. Kept outside the React tree so either view can
 * import them without having to wire more props through the parent.
 */
import type { RiskRating, RiskStatus } from '@/types';
import type { APIRiskStatus } from './types';

/**
 * Maps a RiskRating value onto the <Badge variant="..."> values that
 * the shared UI Badge component understands.
 */
export function getRatingBadgeVariant(
  rating: RiskRating
): 'critical' | 'high' | 'medium' | 'low' | 'default' {
  switch (rating) {
    case 'Critical':
      return 'critical';
    case 'Major':
      return 'high';
    case 'Moderate':
      return 'medium';
    case 'Minor':
      return 'low';
    case 'Negligible':
      return 'default';
    default:
      return 'default';
  }
}

/**
 * Maps a RiskStatus value onto a <Badge variant="..."> color.
 */
export function getStatusBadgeVariant(
  status: RiskStatus
): 'success' | 'warning' | 'info' | 'default' {
  switch (status) {
    case 'closed':
    case 'mitigated':
      return 'success';
    case 'inProgress':
      return 'warning';
    case 'open':
      return 'info';
    default:
      return 'default';
  }
}

/**
 * Resolves a status code to its display name, preferring DB-defined
 * statuses when present and falling back to the translation file.
 *
 * Curried so table/card components can build a single bound helper
 * per render without having to pass `riskStatuses`, `isAr`, and the
 * translation function to every render call.
 */
export function makeStatusDisplayResolver(
  riskStatuses: APIRiskStatus[],
  isAr: boolean,
  t: (key: string) => string
): (statusCode: string) => string {
  return (statusCode: string) => {
    const statusFromDB = riskStatuses.find((s) => s.code === statusCode);
    if (statusFromDB) {
      return isAr ? statusFromDB.nameAr : statusFromDB.nameEn;
    }
    return t(`risks.statuses.${statusCode}`);
  };
}
