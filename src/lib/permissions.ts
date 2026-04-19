/**
 * Module-level access control for the ERM system.
 *
 * Layers of access control (in order of evaluation):
 *   1. Role-based defaults (DEFAULT_ROLE_PERMISSIONS)
 *   2. Per-user custom overrides (User.customPermissions JSON)
 *   3. Contextual/relational access (automatic, in data layer):
 *      - Treatment plan responsible → sees plan + same-dept members
 *      - Task assignee → sees plan + other assignees
 *      - Risk owner/champion → sees their risks
 *      - Same-department access via UserDepartmentAccess
 *
 * This file only handles layers 1 and 2 (module-level). Contextual rules
 * live in api-auth.ts and the data-query layer.
 */

export const MODULES = [
  'dashboard',
  'risks',
  'riskApprovals',
  'assessment',
  'tracking',
  'treatments',
  'treatmentMonitoring',
  'compliance',
  'incidents',
  'audit',
  'champions',
  'discussions',
  'reports',
] as const;

export type Module = typeof MODULES[number];

export const MODULE_LABELS: Record<Module, { ar: string; en: string }> = {
  dashboard: { ar: 'لوحة المعلومات', en: 'Dashboard' },
  risks: { ar: 'سجل المخاطر', en: 'Risk Register' },
  riskApprovals: { ar: 'اعتمادات المخاطر', en: 'Risk Approvals' },
  assessment: { ar: 'تقييم المخاطر', en: 'Risk Assessment' },
  tracking: { ar: 'متابعة المخاطر', en: 'Risk Tracking' },
  treatments: { ar: 'خطط المعالجة', en: 'Treatment Plans' },
  treatmentMonitoring: { ar: 'متابعة المعالجة', en: 'Treatment Monitoring' },
  compliance: { ar: 'الالتزام', en: 'Compliance' },
  incidents: { ar: 'الحوادث', en: 'Incidents' },
  audit: { ar: 'المراجعة الداخلية', en: 'Internal Audit' },
  champions: { ar: 'رواد المخاطر', en: 'Risk Champions' },
  discussions: { ar: 'المناقشات', en: 'Discussions' },
  reports: { ar: 'التقارير', en: 'Reports' },
};

/**
 * Modules that are restricted to admin/riskManager only — cannot be granted
 * to other roles even via custom permissions.
 */
export const RESTRICTED_MODULES: Module[] = ['audit'];

/**
 * Default module access by role. Admin and riskManager have access to all
 * modules. Other roles have sensible subsets.
 *
 * Note: role-level access is ALLOWED access — contextual access layers may
 * further restrict what data the user actually sees within each module
 * (e.g., riskChampion only sees their department's risks).
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, Module[]> = {
  admin: [...MODULES],
  riskManager: [...MODULES],
  riskAnalyst: [
    'dashboard',
    'risks',
    'riskApprovals',
    'assessment',
    'tracking',
    'treatments',
    'treatmentMonitoring',
    'incidents',
    'discussions',
    'reports',
  ],
  riskChampion: [
    'dashboard',
    'risks',
    'treatments',
    'champions',
    'discussions',
  ],
  executive: [
    'dashboard',
    'risks',
    'reports',
    'discussions',
  ],
  employee: [
    'dashboard',
    'discussions',
  ],
};

/**
 * Parse custom permissions JSON string into a map.
 */
export function parseCustomPermissions(
  customPerms: string | null | undefined
): Partial<Record<Module, boolean>> {
  if (!customPerms) return {};
  try {
    const parsed = JSON.parse(customPerms);
    if (typeof parsed !== 'object' || parsed === null) return {};
    return parsed;
  } catch {
    return {};
  }
}

/**
 * Check whether a user has access to a specific module.
 *
 * Evaluation order:
 *   1. admin → always true
 *   2. Restricted module + non-privileged role → false
 *   3. Custom permission override → use it
 *   4. Role default
 */
export function hasModuleAccess(
  role: string,
  customPerms: string | null | undefined,
  module: Module
): boolean {
  // admin always has full access
  if (role === 'admin') return true;

  // Restricted modules: only admin and riskManager
  if (RESTRICTED_MODULES.includes(module) && role !== 'riskManager') {
    return false;
  }

  // Custom override
  const custom = parseCustomPermissions(customPerms);
  if (custom[module] !== undefined) {
    return custom[module] === true;
  }

  // Role default
  return DEFAULT_ROLE_PERMISSIONS[role]?.includes(module) ?? false;
}

/**
 * Return a per-module access map with source attribution ("default" vs
 * "custom"). Used by the settings UI to visually distinguish overrides.
 */
export function getEffectivePermissions(
  role: string,
  customPerms: string | null | undefined
): Record<Module, { access: boolean; source: 'default' | 'custom' | 'restricted' }> {
  const custom = parseCustomPermissions(customPerms);
  const result = {} as Record<Module, { access: boolean; source: 'default' | 'custom' | 'restricted' }>;

  for (const m of MODULES) {
    // Restricted modules
    if (RESTRICTED_MODULES.includes(m) && role !== 'admin' && role !== 'riskManager') {
      result[m] = { access: false, source: 'restricted' };
      continue;
    }

    // admin bypass
    if (role === 'admin') {
      result[m] = { access: true, source: 'default' };
      continue;
    }

    // Custom override
    if (custom[m] !== undefined) {
      result[m] = { access: custom[m] === true, source: 'custom' };
      continue;
    }

    // Role default
    const defaultAccess = DEFAULT_ROLE_PERMISSIONS[role]?.includes(m) ?? false;
    result[m] = { access: defaultAccess, source: 'default' };
  }

  return result;
}

/**
 * Map a pathname to a module name, used to check sidebar/route visibility.
 */
export function pathToModule(pathname: string): Module | null {
  if (pathname.startsWith('/dashboard')) return 'dashboard';
  if (pathname.startsWith('/risk-approvals')) return 'riskApprovals';
  if (pathname.startsWith('/risks')) return 'risks';
  if (pathname.startsWith('/assessment')) return 'assessment';
  if (pathname.startsWith('/tracking')) return 'tracking';
  if (pathname.startsWith('/treatment-monitoring')) return 'treatmentMonitoring';
  if (pathname.startsWith('/treatment')) return 'treatments';
  if (pathname.startsWith('/compliance')) return 'compliance';
  if (pathname.startsWith('/incidents')) return 'incidents';
  if (pathname.startsWith('/audit')) return 'audit';
  if (pathname.startsWith('/champions')) return 'champions';
  if (pathname.startsWith('/discussions')) return 'discussions';
  if (pathname.startsWith('/reports')) return 'reports';
  return null;
}
