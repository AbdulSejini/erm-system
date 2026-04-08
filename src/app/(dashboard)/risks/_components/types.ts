/**
 * Shared type definitions for the risks page and its sub-components.
 *
 * This file is the single source of truth for the interfaces that more
 * than one piece of the risks UI needs to know about. Component-private
 * types should stay in the component that owns them.
 */
import type { RiskRating } from '@/types';

// ---------- API response shapes ----------

export interface APICategory {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  color?: string | null;
  isActive: boolean;
}

export interface APIRiskStatus {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  color?: string | null;
  icon?: string | null;
  isDefault: boolean;
  isActive: boolean;
  order: number;
}

export interface ChangeLogEntry {
  id: string;
  changeType: string;
  changeCategory: string;
  fieldName: string | null;
  fieldNameAr: string | null;
  oldValue: string | null;
  newValue: string | null;
  description: string | null;
  descriptionAr: string | null;
  relatedEntityId: string | null;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    fullNameEn: string | null;
    avatar: string | null;
    role: string;
  };
}

export interface TreatmentTask {
  id: string;
  titleAr: string;
  titleEn: string;
  status: string;
  dueDate: string;
  completedDate: string | null;
}

export interface TreatmentPlan {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  strategy: string;
  status: string;
  startDate: string;
  dueDate: string;
  completionDate: string | null;
  progress: number;
  cost: number | null;
  responsible?: {
    id: string;
    fullName: string;
    fullNameEn: string | null;
  };
  tasks: TreatmentTask[];
}

export interface RiskAssessment {
  id: string;
  assessmentType: string;
  likelihood: number;
  impact: number;
  score: number;
  rating: string;
  notesAr: string | null;
  notesEn: string | null;
  assessmentDate: string;
  assessedBy?: {
    id: string;
    fullName: string;
    fullNameEn: string | null;
  };
}

export interface Incident {
  id: string;
  incidentNumber: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  status: string;
  severity: string;
  occurredAt: string;
  reportedBy?: {
    id: string;
    fullName: string;
    fullNameEn: string | null;
  };
}

/**
 * Shape of a Risk as returned by GET /api/risks. The page layer
 * transforms this into the UI-friendly row type below before rendering.
 */
export interface APIRisk {
  id: string;
  riskNumber: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  categoryId: string | null;
  departmentId: string;
  inherentLikelihood: number;
  inherentImpact: number;
  inherentScore: number;
  inherentRating: RiskRating;
  residualLikelihood: number | null;
  residualImpact: number | null;
  residualScore: number | null;
  residualRating: string | null;
  status: string;
  issuedBy: string | null;
  approvalStatus: string | null;
  mitigationActionsAr: string | null;
  mitigationActionsEn: string | null;
  potentialCauseAr: string | null;
  potentialCauseEn: string | null;
  potentialImpactAr: string | null;
  potentialImpactEn: string | null;
  layersOfProtectionAr: string | null;
  layersOfProtectionEn: string | null;
  krisAr: string | null;
  krisEn: string | null;
  processText: string | null;
  subProcessText: string | null;
  followUpDate: string | null;
  nextReviewDate: string | null;
  identifiedDate: string;
  category?: { id: string; code: string; nameAr: string; nameEn: string } | null;
  department?: { id: string; code: string; nameAr: string; nameEn: string };
  source?: { id: string; code: string; nameAr: string; nameEn: string } | null;
  owner?: { id: string; fullName: string; fullNameEn: string | null };
  champion?: { id: string; fullName: string; fullNameEn: string | null };
  riskOwner?: { id: string; fullName: string; fullNameEn: string | null };
  riskOwnerId?: string | null;
  isDeleted?: boolean;
  deletedAt?: string | null;
  _count?: {
    comments: number;
  };
}

// ---------- UI sort state ----------

export type SortField =
  | 'riskNumber'
  | 'title'
  | 'inherentScore'
  | 'residualScore'
  | 'status'
  | 'identifiedDate';

export type SortDirection = 'asc' | 'desc';
