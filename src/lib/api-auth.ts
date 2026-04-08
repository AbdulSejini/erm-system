import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * Known application roles. Kept as a string-union so callers can pass a
 * subset without importing additional enums. Must stay in sync with the
 * `role` column on the User model in prisma/schema.prisma.
 */
export type UserRole =
  | 'admin'
  | 'riskManager'
  | 'riskAnalyst'
  | 'riskChampion'
  | 'executive'
  | 'employee';

export interface RequireAuthOptions {
  /**
   * Allowed roles. If provided and non-empty, the request is rejected with
   * 403 unless the session's role matches one of them. Omit to allow any
   * authenticated user.
   */
  roles?: UserRole[];

  /**
   * When true, the admin may use the `X-Impersonate-User-Id` header to act
   * as another user. The effective user fields in the returned result will
   * reflect the impersonated user. The underlying session role check is
   * still performed against the REAL session — admins never lose their
   * admin-level authorization.
   *
   * Defaults to false because most routes should not silently switch
   * identities.
   */
  allowImpersonation?: boolean;
}

export interface AuthSuccess {
  /** The real, authenticated NextAuth session. */
  session: {
    user: {
      id: string;
      role: string;
      email?: string | null;
      name?: string | null;
    };
  };
  /** The real user id from the session (never the impersonated id). */
  userId: string;
  /** The real role from the session. */
  role: string;
  /**
   * The user id that should be used for data scoping. Equals `userId`
   * unless `allowImpersonation` was set AND the admin sent a valid
   * `X-Impersonate-User-Id` header.
   */
  effectiveUserId: string;
  /** The role associated with `effectiveUserId`. */
  effectiveRole: string;
  /** Email of `effectiveUserId`, or empty string if unavailable. */
  effectiveEmail: string;
  /** True when the caller is acting as someone else. */
  isImpersonating: boolean;
}

export interface AuthFailure {
  error: NextResponse;
}

/**
 * Guards an API route handler with a session + role check.
 *
 * Usage:
 *   export async function POST(request: NextRequest) {
 *     const authResult = await requireAuth(request, { roles: ['admin'] });
 *     if ('error' in authResult) return authResult.error;
 *     // proceed — authResult.session is guaranteed
 *   }
 *
 * Returns either an AuthSuccess (with session + effective user info) or
 * an AuthFailure carrying a 401/403 NextResponse that the caller must
 * return unchanged.
 */
export async function requireAuth(
  request: NextRequest,
  options?: RequireAuthOptions
): Promise<AuthSuccess | AuthFailure> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      ),
    };
  }

  const sessionRole = session.user.role as string;

  if (options?.roles && options.roles.length > 0) {
    if (!options.roles.includes(sessionRole as UserRole)) {
      return {
        error: NextResponse.json(
          { success: false, error: 'Forbidden: insufficient permissions' },
          { status: 403 }
        ),
      };
    }
  }

  // Resolve effective user (for impersonation-aware routes)
  let effectiveUserId = session.user.id;
  let effectiveRole = sessionRole;
  let effectiveEmail = session.user.email || '';
  let isImpersonating = false;

  if (options?.allowImpersonation && sessionRole === 'admin') {
    const impersonateUserId = request.headers.get('X-Impersonate-User-Id');
    if (impersonateUserId && impersonateUserId !== session.user.id) {
      const impersonated = await prisma.user.findUnique({
        where: { id: impersonateUserId },
        select: { id: true, role: true, email: true },
      });
      if (impersonated) {
        effectiveUserId = impersonated.id;
        effectiveRole = impersonated.role;
        effectiveEmail = impersonated.email;
        isImpersonating = true;
      }
    }
  }

  return {
    session: session as AuthSuccess['session'],
    userId: session.user.id,
    role: sessionRole,
    effectiveUserId,
    effectiveRole,
    effectiveEmail,
    isImpersonating,
  };
}

/**
 * Narrows the union returned by requireAuth.
 * Prefer: `if ('error' in result) return result.error;`
 */
export function isAuthError(
  result: AuthSuccess | AuthFailure
): result is AuthFailure {
  return 'error' in result;
}

// =============================================================================
// Treatment plan access control
// =============================================================================
//
// Rules (must mirror between the helper and any inline filter logic):
//
//   1. Privileged roles (admin / riskManager / riskAnalyst) see everything.
//   2. Any user from the SAME DEPARTMENT as the risk that the plan treats.
//      "Same department" includes both the user's primary departmentId and
//      any departments granted via UserDepartmentAccess (canView).
//   3. The plan's monitor.
//   4. Anyone assigned to or monitoring a task under the plan (via User id
//      OR RiskOwner id OR RiskOwner email).
//   5. Anyone who participated in a task STEP under the plan — either
//      created the step or marked it completed.
//
// Note: the previous rules included "responsible user" and "risk owner via
// email" as independent conditions. Those have been removed in favor of
// rule #2 (department membership) per the refined requirements.
// -----------------------------------------------------------------------------

/**
 * Roles that can see any treatment plan regardless of assignment.
 */
const TREATMENT_PRIVILEGED_ROLES: ReadonlySet<string> = new Set([
  'admin',
  'riskManager',
  'riskAnalyst',
]);

/**
 * Minimum shape a TreatmentPlan record must have to be evaluated for access.
 * Inline route queries can widen this type freely — only the fields listed
 * here are consulted.
 */
export interface TreatmentPlanAccessShape {
  monitorId: string | null;
  risk: { departmentId: string | null } | null;
  tasks?: Array<{
    assignedToId?: string | null;
    monitorId?: string | null;
    actionOwnerId?: string | null;
    monitorOwnerId?: string | null;
    actionOwner?: { email: string | null } | null;
    monitorOwner?: { email: string | null } | null;
    steps?: Array<{
      createdById: string;
      completedById: string | null;
    }> | null;
  }> | null;
}

/**
 * Resolved per-user context reused across access checks — fetched once and
 * then applied to many plans in memory. For privileged roles we short-circuit
 * to `{ isPrivileged: true }` so callers can skip the DB lookup entirely.
 */
export type TreatmentAccessContext =
  | { isPrivileged: true }
  | {
      isPrivileged: false;
      userId: string;
      userEmail: string;
      /** User's primary department + accessible departments (UserDepartmentAccess) */
      departmentIds: Set<string>;
      /** Matching RiskOwner.id (if any) looked up via user.email */
      riskOwnerId: string | null;
    };

/**
 * Load the per-user context needed to evaluate treatment access for many
 * plans. Call once per request, then pass to `userCanAccessTreatmentPlan`
 * as many times as needed.
 */
export async function getUserTreatmentAccessContext(
  userId: string,
  userRole: string,
  userEmail: string
): Promise<TreatmentAccessContext> {
  if (TREATMENT_PRIVILEGED_ROLES.has(userRole)) {
    return { isPrivileged: true };
  }

  const { default: prisma } = await import('@/lib/prisma');

  const [user, riskOwner] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        departmentId: true,
        accessibleDepartments: {
          where: { canView: true },
          select: { departmentId: true },
        },
      },
    }),
    userEmail
      ? prisma.riskOwner.findFirst({
          where: { email: userEmail },
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);

  const departmentIds = new Set<string>();
  if (user?.departmentId) departmentIds.add(user.departmentId);
  for (const a of user?.accessibleDepartments || []) {
    departmentIds.add(a.departmentId);
  }

  return {
    isPrivileged: false,
    userId,
    userEmail,
    departmentIds,
    riskOwnerId: riskOwner?.id ?? null,
  };
}

/**
 * Pure, in-memory access check. Given a treatment plan record (shaped per
 * `TreatmentPlanAccessShape`) and a pre-resolved user context, decide
 * whether the user is allowed to see this plan.
 *
 * Safe to call many times per request after a single context load.
 */
export function userCanAccessTreatmentPlan(
  plan: TreatmentPlanAccessShape,
  context: TreatmentAccessContext
): boolean {
  if (context.isPrivileged) return true;

  // Rule 2: same-department membership
  const riskDeptId = plan.risk?.departmentId ?? null;
  if (riskDeptId && context.departmentIds.has(riskDeptId)) {
    return true;
  }

  // Rule 3: plan monitor
  if (plan.monitorId && plan.monitorId === context.userId) {
    return true;
  }

  // Rules 4 & 5: task involvement or step involvement
  for (const task of plan.tasks || []) {
    // Task-level involvement (User references)
    if (task.assignedToId && task.assignedToId === context.userId) return true;
    if (task.monitorId && task.monitorId === context.userId) return true;

    // Task-level involvement (RiskOwner references via id OR email)
    if (context.riskOwnerId) {
      if (task.actionOwnerId === context.riskOwnerId) return true;
      if (task.monitorOwnerId === context.riskOwnerId) return true;
    }
    if (context.userEmail) {
      if (task.actionOwner?.email === context.userEmail) return true;
      if (task.monitorOwner?.email === context.userEmail) return true;
    }

    // Step-level involvement
    for (const step of task.steps || []) {
      if (step.createdById === context.userId) return true;
      if (step.completedById === context.userId) return true;
    }
  }

  return false;
}

/**
 * Convenience wrapper that loads both the plan (with the minimum fields
 * needed for access evaluation) and the user context, then returns a
 * boolean. Use from single-plan routes (discussions, changelog, etc.).
 */
export async function canAccessTreatmentPlan(
  treatmentPlanId: string,
  userId: string,
  userRole: string,
  userEmail: string
): Promise<boolean> {
  if (TREATMENT_PRIVILEGED_ROLES.has(userRole)) return true;

  const { default: prisma } = await import('@/lib/prisma');

  const [context, plan] = await Promise.all([
    getUserTreatmentAccessContext(userId, userRole, userEmail),
    prisma.treatmentPlan.findUnique({
      where: { id: treatmentPlanId },
      select: {
        monitorId: true,
        risk: { select: { departmentId: true } },
        tasks: {
          select: {
            assignedToId: true,
            monitorId: true,
            actionOwnerId: true,
            monitorOwnerId: true,
            actionOwner: { select: { email: true } },
            monitorOwner: { select: { email: true } },
            steps: {
              select: { createdById: true, completedById: true },
            },
          },
        },
      },
    }),
  ]);

  if (!plan) return false;
  return userCanAccessTreatmentPlan(plan, context);
}

/**
 * Check whether the given user may read a specific TreatmentTask.
 * Delegates to the plan-level access check after looking up the plan id.
 */
export async function canAccessTreatmentTask(
  taskId: string,
  userId: string,
  userRole: string,
  userEmail: string
): Promise<boolean> {
  if (TREATMENT_PRIVILEGED_ROLES.has(userRole)) return true;

  const { default: prisma } = await import('@/lib/prisma');
  const task = await prisma.treatmentTask.findUnique({
    where: { id: taskId },
    select: { treatmentPlanId: true },
  });
  if (!task) return false;
  return canAccessTreatmentPlan(task.treatmentPlanId, userId, userRole, userEmail);
}
