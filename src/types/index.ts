// User Types
export type UserRole = 'admin' | 'riskManager' | 'riskAnalyst' | 'riskChampion' | 'executive' | 'employee';
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface User {
  id: string;
  email: string;
  fullName: string;
  fullNameEn?: string;
  role: UserRole;
  departmentId: string;
  department?: Department;
  status: UserStatus;
  avatar?: string;
  phone?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Department Types
export type DepartmentType = 'department' | 'function' | 'process';

export interface Department {
  id: string;
  nameAr: string;
  nameEn: string;
  code: string;
  type: DepartmentType;
  managerId?: string;
  manager?: User;
  riskChampionId?: string;
  riskChampion?: User;
  parentId?: string;
  parent?: Department;
  children?: Department[];
  processes?: Process[];
  risks?: Risk[];
  createdAt: Date;
  updatedAt: Date;
}

// Process Types (العمليات)
export interface Process {
  id: string;
  nameAr: string;
  nameEn: string;
  code: string;
  departmentId: string;
  department?: Department;
  parentId?: string;
  parent?: Process;
  children?: Process[];
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// Risk Category Types (فئات المخاطر)
export type RiskCategoryCode = 'FIN' | 'OPS' | 'COMP' | 'HSE' | 'HR' | 'TECH' | 'REP';

export interface RiskCategory {
  id: string;
  code: RiskCategoryCode;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  examplesAr?: string;
  examplesEn?: string;
  color?: string;
  icon?: string;
  isActive: boolean;
  order: number;
}

// Risk Rating (تصنيف مستوى الخطر)
export type RiskRating = 'Critical' | 'Major' | 'Moderate' | 'Minor' | 'Negligible';

// Risk Level (for matrix display)
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'negligible';

// Risk Status
export type RiskStatus = 'open' | 'inProgress' | 'mitigated' | 'closed' | 'accepted';

// Risk Types - محدث ليتوافق مع سجل المخاطر الفعلي
export interface Risk {
  id: string;
  riskNumber: string; // مثل FIN-R-001
  issuedBy?: string; // الجهة المصدرة (KPMG, Internal, etc.)

  // المعلومات الأساسية
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;

  // التصنيف
  categoryId?: string;
  category?: RiskCategory;
  departmentId: string;
  department?: Department;
  processId?: string;
  process?: Process;

  // تفاصيل الخطر
  potentialCauseAr?: string;
  potentialCauseEn?: string;
  potentialImpactAr?: string;
  potentialImpactEn?: string;

  // تقييم المخاطر الأصلية (Inherent Risk)
  inherentLikelihood: number; // 1-5
  inherentImpact: number; // 1-5
  inherentScore: number; // محسوب تلقائياً (1-25)
  inherentRating: RiskRating;

  // تقييم المخاطر المتبقية (Residual Risk)
  residualLikelihood?: number;
  residualImpact?: number;
  residualScore?: number;
  residualRating?: RiskRating;

  // طبقات الحماية والضوابط
  layersOfProtectionAr?: string;
  layersOfProtectionEn?: string;

  // مؤشرات المخاطر الرئيسية (KRIs)
  krisAr?: string;
  krisEn?: string;

  // إجراءات التخفيف
  mitigationActionsAr?: string;
  mitigationActionsEn?: string;

  // الامتثال
  complianceRequired: boolean;
  complianceNoteAr?: string;
  complianceNoteEn?: string;
  iaRef?: string; // مرجع التدقيق الداخلي

  // الحالة والمتابعة
  status: RiskStatus;
  followUpDate?: Date;

  // المسؤولين
  ownerId: string;
  owner?: User;
  championId?: string;
  champion?: User;

  // التواريخ
  identifiedDate: Date;
  lastReviewDate?: Date;
  nextReviewDate?: Date;

  // العلاقات
  assessments?: RiskAssessment[];
  treatments?: TreatmentPlan[];
  incidents?: Incident[];

  // الإنشاء والتحديث
  createdById: string;
  createdBy?: User;
  createdAt: Date;
  updatedAt: Date;
}

// Risk Assessment Types
export interface RiskAssessment {
  id: string;
  riskId: string;
  risk?: Risk;
  assessmentType: 'inherent' | 'residual';
  likelihood: number;
  impact: number;
  score: number;
  rating: RiskRating;
  notesAr?: string;
  notesEn?: string;
  assessedById: string;
  assessedBy?: User;
  assessmentDate: Date;
  createdAt: Date;
}

// Treatment Plan Types
export type TreatmentStrategy = 'avoid' | 'reduce' | 'transfer' | 'accept';
export type TreatmentStatus = 'notStarted' | 'inProgress' | 'completed' | 'overdue' | 'cancelled';

export interface TreatmentPlan {
  id: string;
  riskId: string;
  risk?: Risk;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  strategy: TreatmentStrategy;
  status: TreatmentStatus;
  responsibleId: string;
  responsible?: User;
  startDate: Date;
  dueDate: Date;
  completionDate?: Date;
  progress: number;
  cost?: number;
  tasks?: TreatmentTask[];
  createdById: string;
  createdBy?: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface TreatmentTask {
  id: string;
  treatmentPlanId: string;
  treatmentPlan?: TreatmentPlan;
  titleAr: string;
  titleEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  status: TreatmentStatus;
  assignedToId?: string;
  assignedTo?: User;
  dueDate?: Date;
  completionDate?: Date;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// Incident Types
export type IncidentSeverity = 'critical' | 'major' | 'moderate' | 'minor';
export type IncidentStatus = 'reported' | 'investigating' | 'resolved' | 'closed';

export interface Incident {
  id: string;
  incidentNumber: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  incidentDate: Date;
  reportedDate: Date;
  severity: IncidentSeverity;
  status: IncidentStatus;
  departmentId: string;
  department?: Department;
  reportedById: string;
  reportedBy?: User;
  relatedRiskId?: string;
  relatedRisk?: Risk;
  rootCauseAr?: string;
  rootCauseEn?: string;
  correctiveActionsAr?: string;
  correctiveActionsEn?: string;
  lessonsLearnedAr?: string;
  lessonsLearnedEn?: string;
  resolvedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Notification Types
export type NotificationType = 'newRisk' | 'riskUpdated' | 'treatmentDue' | 'incidentReported' | 'reviewReminder';

export interface Notification {
  id: string;
  userId: string;
  user?: User;
  type: NotificationType;
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
  link?: string;
  isRead: boolean;
  createdAt: Date;
}

// Audit Log Types
export type AuditAction = 'create' | 'update' | 'delete' | 'soft_delete' | 'login' | 'logout' | 'export' | 'import';

export interface AuditLog {
  id: string;
  userId: string;
  user?: User;
  action: AuditAction;
  entity: string;
  entityId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// Criteria Types (معايير التقييم)
export interface LikelihoodCriteria {
  id: string;
  level: number; // 1-5
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  percentage?: string;
}

export interface ImpactCriteria {
  id: string;
  level: number; // 1-5
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  financialAr?: string;
  financialEn?: string;
  operationalAr?: string;
  operationalEn?: string;
  reputationalAr?: string;
  reputationalEn?: string;
}

export interface RiskRatingCriteria {
  id: string;
  minScore: number;
  maxScore: number;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  color: string;
  actionRequiredAr?: string;
  actionRequiredEn?: string;
}

// Dashboard Types
export interface DashboardStats {
  totalRisks: number;
  criticalRisks: number;
  majorRisks: number;
  moderateRisks: number;
  minorRisks: number;
  negligibleRisks: number;
  openIncidents: number;
  pendingTreatments: number;
  overdueTreatments: number;
  risksByCategory: RiskByCategory[];
  risksByDepartment: RiskByDepartment[];
}

export interface RiskMatrixCell {
  likelihood: number;
  impact: number;
  count: number;
  rating: RiskRating;
}

export interface RiskByDepartment {
  departmentId: string;
  departmentNameAr: string;
  departmentNameEn: string;
  total: number;
  critical: number;
  major: number;
  moderate: number;
  minor: number;
  negligible: number;
}

export interface RiskByCategory {
  categoryId: string;
  categoryCode: string;
  categoryNameAr: string;
  categoryNameEn: string;
  total: number;
  critical: number;
  major: number;
  moderate: number;
  minor: number;
  negligible: number;
}

export interface RiskTrend {
  date: string;
  total: number;
  critical: number;
  major: number;
  moderate: number;
  minor: number;
}

// Language and Theme Types
export type Language = 'ar' | 'en';
export type Theme = 'light' | 'dark' | 'system';

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form Types
export interface SelectOption {
  value: string;
  labelAr: string;
  labelEn: string;
}

// Wizard Step for Risk Creation
export interface WizardStep {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  isCompleted: boolean;
  isActive: boolean;
}

// Helper Functions
export const calculateRiskScore = (likelihood: number, impact: number): number => {
  return likelihood * impact;
};

export const getRiskRating = (score: number): RiskRating => {
  if (score >= 17) return 'Critical';
  if (score >= 13) return 'Major';
  if (score >= 9) return 'Moderate';
  if (score >= 5) return 'Minor';
  return 'Negligible';
};

export const getRiskRatingColor = (rating: RiskRating): string => {
  switch (rating) {
    case 'Critical': return '#DC2626'; // red
    case 'Major': return '#F39200'; // orange (Saudi Cable brand)
    case 'Moderate': return '#FBBF24'; // yellow
    case 'Minor': return '#22C55E'; // green
    case 'Negligible': return '#3B82F6'; // blue
    default: return '#6B7280'; // gray
  }
};

// Default Risk Categories (فئات المخاطر الافتراضية)
export const DEFAULT_RISK_CATEGORIES: Omit<RiskCategory, 'id'>[] = [
  {
    code: 'FIN',
    nameAr: 'المخاطر المالية',
    nameEn: 'Financial Risks',
    descriptionAr: 'المخاطر المتعلقة بالأداء المالي والتدفقات النقدية',
    descriptionEn: 'Risks related to financial performance and cash flows',
    examplesAr: 'تقلبات العملات، السيولة، الائتمان، التقارير المالية',
    examplesEn: 'Currency fluctuations, liquidity, credit, financial reporting',
    color: '#22C55E',
    icon: 'DollarSign',
    isActive: true,
    order: 1
  },
  {
    code: 'OPS',
    nameAr: 'المخاطر التشغيلية',
    nameEn: 'Operational Risks',
    descriptionAr: 'المخاطر المتعلقة بالعمليات والإنتاج والجودة',
    descriptionEn: 'Risks related to operations, production, and quality',
    examplesAr: 'توقف الإنتاج، سلسلة التوريد، الجودة، الكفاءة التشغيلية',
    examplesEn: 'Production stoppage, supply chain, quality, operational efficiency',
    color: '#3B82F6',
    icon: 'Settings',
    isActive: true,
    order: 2
  },
  {
    code: 'COMP',
    nameAr: 'مخاطر الامتثال',
    nameEn: 'Compliance Risks',
    descriptionAr: 'المخاطر المتعلقة بالأنظمة واللوائح والمعايير',
    descriptionEn: 'Risks related to regulations, laws, and standards',
    examplesAr: 'عدم الالتزام بالأنظمة، العقود، التراخيص، المعايير',
    examplesEn: 'Non-compliance with regulations, contracts, licenses, standards',
    color: '#8B5CF6',
    icon: 'Shield',
    isActive: true,
    order: 3
  },
  {
    code: 'HSE',
    nameAr: 'مخاطر الصحة والسلامة والبيئة',
    nameEn: 'Health, Safety & Environment Risks',
    descriptionAr: 'المخاطر المتعلقة بصحة وسلامة الموظفين والبيئة',
    descriptionEn: 'Risks related to employee health, safety, and environment',
    examplesAr: 'إصابات العمل، الحوادث الصناعية، المواد الخطرة، الانبعاثات',
    examplesEn: 'Work injuries, industrial accidents, hazardous materials, emissions',
    color: '#EF4444',
    icon: 'AlertTriangle',
    isActive: true,
    order: 4
  },
  {
    code: 'HR',
    nameAr: 'مخاطر الموارد البشرية',
    nameEn: 'Human Resources Risks',
    descriptionAr: 'المخاطر المتعلقة بالقوى العاملة والكفاءات',
    descriptionEn: 'Risks related to workforce and competencies',
    examplesAr: 'استقطاب الكفاءات، دوران العمالة، التدريب، التوطين',
    examplesEn: 'Talent acquisition, employee turnover, training, localization',
    color: '#F59E0B',
    icon: 'Users',
    isActive: true,
    order: 5
  },
  {
    code: 'TECH',
    nameAr: 'المخاطر التقنية',
    nameEn: 'Technology Risks',
    descriptionAr: 'المخاطر المتعلقة بتقنية المعلومات والأمن السيبراني',
    descriptionEn: 'Risks related to IT and cybersecurity',
    examplesAr: 'أمن المعلومات، البنية التحتية التقنية، التحول الرقمي، فشل الأنظمة',
    examplesEn: 'Information security, IT infrastructure, digital transformation, system failures',
    color: '#06B6D4',
    icon: 'Monitor',
    isActive: true,
    order: 6
  },
  {
    code: 'REP',
    nameAr: 'مخاطر السمعة',
    nameEn: 'Reputational Risks',
    descriptionAr: 'المخاطر المتعلقة بسمعة الشركة وعلاقاتها',
    descriptionEn: 'Risks related to company reputation and relationships',
    examplesAr: 'الإضرار بالسمعة، العلاقات مع أصحاب المصلحة، الإعلام',
    examplesEn: 'Reputation damage, stakeholder relations, media',
    color: '#EC4899',
    icon: 'Star',
    isActive: true,
    order: 7
  }
];

// Default Likelihood Criteria (معايير الاحتمالية الافتراضية)
export const DEFAULT_LIKELIHOOD_CRITERIA: Omit<LikelihoodCriteria, 'id'>[] = [
  {
    level: 1,
    nameAr: 'نادر',
    nameEn: 'Rare',
    descriptionAr: 'من غير المرجح حدوثه',
    descriptionEn: 'Unlikely to occur',
    percentage: 'أقل من 5%'
  },
  {
    level: 2,
    nameAr: 'غير محتمل',
    nameEn: 'Unlikely',
    descriptionAr: 'من المحتمل أن يحدث في ظروف استثنائية',
    descriptionEn: 'May occur in exceptional circumstances',
    percentage: '5-25%'
  },
  {
    level: 3,
    nameAr: 'محتمل',
    nameEn: 'Possible',
    descriptionAr: 'قد يحدث في بعض الأحيان',
    descriptionEn: 'Could occur sometimes',
    percentage: '25-50%'
  },
  {
    level: 4,
    nameAr: 'مرجح',
    nameEn: 'Likely',
    descriptionAr: 'من المرجح حدوثه في معظم الظروف',
    descriptionEn: 'Will probably occur in most circumstances',
    percentage: '50-75%'
  },
  {
    level: 5,
    nameAr: 'شبه مؤكد',
    nameEn: 'Almost Certain',
    descriptionAr: 'متوقع حدوثه في معظم الظروف',
    descriptionEn: 'Expected to occur in most circumstances',
    percentage: 'أكثر من 75%'
  }
];

// Default Impact Criteria (معايير التأثير الافتراضية)
export const DEFAULT_IMPACT_CRITERIA: Omit<ImpactCriteria, 'id'>[] = [
  {
    level: 1,
    nameAr: 'ضئيل',
    nameEn: 'Negligible',
    descriptionAr: 'تأثير ضئيل جداً',
    descriptionEn: 'Very minor impact',
    financialAr: 'خسائر أقل من 100,000 ريال',
    financialEn: 'Losses less than 100,000 SAR',
    operationalAr: 'لا يؤثر على العمليات',
    operationalEn: 'No impact on operations',
    reputationalAr: 'لا يوجد تأثير على السمعة',
    reputationalEn: 'No reputational impact'
  },
  {
    level: 2,
    nameAr: 'طفيف',
    nameEn: 'Minor',
    descriptionAr: 'تأثير طفيف يمكن التعامل معه',
    descriptionEn: 'Minor impact that can be managed',
    financialAr: 'خسائر 100,000 - 500,000 ريال',
    financialEn: 'Losses 100,000 - 500,000 SAR',
    operationalAr: 'تأخير طفيف في العمليات',
    operationalEn: 'Minor delay in operations',
    reputationalAr: 'تأثير محدود على السمعة',
    reputationalEn: 'Limited reputational impact'
  },
  {
    level: 3,
    nameAr: 'متوسط',
    nameEn: 'Moderate',
    descriptionAr: 'تأثير متوسط يتطلب اهتماماً',
    descriptionEn: 'Moderate impact requiring attention',
    financialAr: 'خسائر 500,000 - 2,000,000 ريال',
    financialEn: 'Losses 500,000 - 2,000,000 SAR',
    operationalAr: 'تأثير على الإنتاجية',
    operationalEn: 'Impact on productivity',
    reputationalAr: 'تغطية إعلامية سلبية محدودة',
    reputationalEn: 'Limited negative media coverage'
  },
  {
    level: 4,
    nameAr: 'جسيم',
    nameEn: 'Major',
    descriptionAr: 'تأثير جسيم على الشركة',
    descriptionEn: 'Major impact on the company',
    financialAr: 'خسائر 2,000,000 - 10,000,000 ريال',
    financialEn: 'Losses 2,000,000 - 10,000,000 SAR',
    operationalAr: 'توقف جزئي للعمليات',
    operationalEn: 'Partial operations stoppage',
    reputationalAr: 'تغطية إعلامية سلبية واسعة',
    reputationalEn: 'Wide negative media coverage'
  },
  {
    level: 5,
    nameAr: 'كارثي',
    nameEn: 'Catastrophic',
    descriptionAr: 'تأثير كارثي يهدد استمرارية الشركة',
    descriptionEn: 'Catastrophic impact threatening company continuity',
    financialAr: 'خسائر أكثر من 10,000,000 ريال',
    financialEn: 'Losses more than 10,000,000 SAR',
    operationalAr: 'توقف كامل للعمليات',
    operationalEn: 'Complete operations stoppage',
    reputationalAr: 'ضرر كبير ودائم للسمعة',
    reputationalEn: 'Major and permanent reputational damage'
  }
];

// Simplified Imported Risk Type (للاستيراد من Google Sheets)
// هيكل مبسط يركز على الحقول الأساسية فقط لسهولة الاستخدام
export interface ImportedRisk {
  id: string;
  riskId: string; // مثل HR-R-001
  department: string; // HR, Finance, etc.
  departmentAr: string;
  descriptionEn: string;
  descriptionAr: string;
  likelihood: number; // 1-5
  impact: number; // 1-5
  inherentScore: number; // likelihood × impact
  inherentRating: RiskRating;
  existingControlsEn: string;
  existingControlsAr: string;
  residualLikelihood?: number;
  residualImpact?: number;
  residualScore?: number;
  residualRating?: RiskRating;
  status: 'Open' | 'In Progress' | 'Closed';
  championId?: string;
  championName?: string;
  createdAt: Date;
  updatedAt: Date;
}

// CSV Import Column Mapping (تعيين أعمدة CSV)
export interface CSVColumnMapping {
  riskId: string; // Column G in spreadsheet
  department: string; // Column C
  descriptionEn: string; // Column I
  descriptionAr: string; // Column J
  likelihood: string; // Likelihood column
  impact: string; // Impact column
  totalScore: string; // Total Score column
  existingControls: string; // Existing Controls column
  residualRisk: string; // Residual Risk column
  status: string; // Column AG
  champion: string; // Column AI
}

// Default column mapping for Saudi Cable risk register
export const DEFAULT_CSV_MAPPING: CSVColumnMapping = {
  riskId: 'Risk_ID',
  department: 'Function',
  descriptionEn: 'Risk Description',
  descriptionAr: 'وصف الخطر',
  likelihood: 'Likelihood',
  impact: 'Impact',
  totalScore: 'Total Score',
  existingControls: 'Existing Controls',
  residualRisk: 'Residual Risk',
  status: 'Status',
  champion: 'Champion'
};

// Department codes mapping
export const DEPARTMENT_CODES: Record<string, { codeAr: string; codeEn: string }> = {
  'HR': { codeAr: 'الموارد البشرية', codeEn: 'Human Resources' },
  'Finance': { codeAr: 'المالية', codeEn: 'Finance' },
  'IT': { codeAr: 'تقنية المعلومات', codeEn: 'Information Technology' },
  'Operations': { codeAr: 'العمليات', codeEn: 'Operations' },
  'Supply Chain': { codeAr: 'سلسلة التوريد', codeEn: 'Supply Chain' },
  'HSE': { codeAr: 'السلامة والصحة والبيئة', codeEn: 'Health, Safety & Environment' },
  'Quality': { codeAr: 'الجودة', codeEn: 'Quality' },
  'Sales': { codeAr: 'المبيعات', codeEn: 'Sales' },
  'Procurement': { codeAr: 'المشتريات', codeEn: 'Procurement' },
  'Legal': { codeAr: 'الشؤون القانونية', codeEn: 'Legal Affairs' },
};

// Default Risk Rating Criteria (معايير تصنيف الخطر الافتراضية)
export const DEFAULT_RISK_RATING_CRITERIA: Omit<RiskRatingCriteria, 'id'>[] = [
  {
    minScore: 17,
    maxScore: 25,
    nameAr: 'حرج',
    nameEn: 'Critical',
    descriptionAr: 'مخاطرة حرجة تتطلب اهتماماً فورياً من مجلس الإدارة',
    descriptionEn: 'Critical risk requiring immediate Board attention',
    color: '#DC2626',
    actionRequiredAr: 'اهتمام فوري من مجلس الإدارة والإدارة التنفيذية',
    actionRequiredEn: 'Immediate attention from Board and Executive Management'
  },
  {
    minScore: 13,
    maxScore: 16,
    nameAr: 'عالي',
    nameEn: 'Major',
    descriptionAr: 'مخاطرة عالية تتطلب اهتماماً عاجلاً',
    descriptionEn: 'High risk requiring urgent attention',
    color: '#F39200',
    actionRequiredAr: 'خطة عمل واضحة وموارد كافية ومتابعة من الإدارة العليا',
    actionRequiredEn: 'Clear action plan, adequate resources, and senior management follow-up'
  },
  {
    minScore: 9,
    maxScore: 12,
    nameAr: 'متوسط',
    nameEn: 'Moderate',
    descriptionAr: 'مخاطرة متوسطة تتطلب متابعة منتظمة',
    descriptionEn: 'Moderate risk requiring regular monitoring',
    color: '#FBBF24',
    actionRequiredAr: 'متابعة دورية وخطط معالجة محددة',
    actionRequiredEn: 'Regular monitoring and specific treatment plans'
  },
  {
    minScore: 5,
    maxScore: 8,
    nameAr: 'منخفض',
    nameEn: 'Minor',
    descriptionAr: 'مخاطرة منخفضة يمكن إدارتها بالإجراءات الروتينية',
    descriptionEn: 'Low risk manageable through routine procedures',
    color: '#22C55E',
    actionRequiredAr: 'إدارة من خلال الإجراءات الروتينية',
    actionRequiredEn: 'Manage through routine procedures'
  },
  {
    minScore: 1,
    maxScore: 4,
    nameAr: 'ضئيل',
    nameEn: 'Negligible',
    descriptionAr: 'مخاطرة ضئيلة لا تتطلب إجراءات خاصة',
    descriptionEn: 'Negligible risk not requiring special actions',
    color: '#3B82F6',
    actionRequiredAr: 'المراقبة فقط',
    actionRequiredEn: 'Monitoring only'
  }
];
