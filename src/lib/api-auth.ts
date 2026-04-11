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
//   1. All members of the Risk Management department (nameEn contains "risk"
//      or nameAr contains "مخاطر") can see every treatment plan.
//   2. The plan's responsible person (responsibleId).
//   3. Any user from the SAME DEPARTMENT as the risk that the plan treats.
//      "Same department" includes both the user's primary departmentId and
//      any departments granted via UserDepartmentAccess (canView).
//   4. Anyone assigned to a task (actionOwnerId) or step participant
//      (createdById / completedById) under the plan.
// -----------------------------------------------------------------------------

/**
 * Minimum shape a TreatmentPlan record must have to be evaluated for access.
 * Inline route queries can widen this type freely — only the fields listed
 * here are consulted.
 */
export interface TreatmentPlanAccessShape {
  responsibleId?: string | null;
  risk: { departmentId: string | null } | null;
  tasks?: Array<{
    actionOwnerId?: string | null;
    actionOwner?: { email: string | null } | null;
    steps?: Array<{
      createdById: string;
      completedById: string | null;
    }> | null;
  }> | null;
}

/**
 * Resolved per-user context reused across access checks — fetched once and
 * then applied to many plans in memory. For Risk Management department
 * members we short-circuit to `{ isPrivileged: true }`.
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
  _userRole: string,
  userEmail: string
): Promise<TreatmentAccessContext> {
  const { default: prisma } = await import('@/lib/prisma');

  // Rule 1: members of Risk Management department see everything
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      departmentId: true,
      department: { select: { nameAr: true, nameEn: true } },
      accessibleDepartments: {
        where: { canView: true },
        select: { departmentId: true },
      },
    },
  });

  const isRiskMgmtDept =
    user?.department?.nameEn?.toLowerCase().includes('risk') ||
    user?.department?.nameAr?.includes('مخاطر') ||
    false;

  if (isRiskMgmtDept) {
    return { isPrivileged: true };
  }

  const riskOwner = userEmail
    ? await prisma.riskOwner.findFirst({
        where: { email: userEmail },
        select: { id: true },
      })
    : null;

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
  // Rule 1: Risk Management department (resolved in context)
  if (context.isPrivileged) return true;

  // Rule 2: plan responsible person
  if (plan.responsibleId && plan.responsibleId === context.userId) {
    return true;
  }

  // Rule 3: same-department membership
  const riskDeptId = plan.risk?.departmentId ?? null;
  if (riskDeptId && context.departmentIds.has(riskDeptId)) {
    return true;
  }

  // Rule 4: task actionOwner or step participant
  for (const task of plan.tasks || []) {
    // Task-level: actionOwner (RiskOwner references via id OR email)
    if (context.riskOwnerId && task.actionOwnerId === context.riskOwnerId) {
      return true;
    }
    if (context.userEmail && task.actionOwner?.email === context.userEmail) {
      return true;
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
  const { default: prisma } = await import('@/lib/prisma');

  const [context, plan] = await Promise.all([
    getUserTreatmentAccessContext(userId, userRole, userEmail),
    prisma.treatmentPlan.findUnique({
      where: { id: treatmentPlanId },
      select: {
        responsibleId: true,
        risk: { select: { departmentId: true } },
        tasks: {
          select: {
            actionOwnerId: true,
            actionOwner: { select: { email: true } },
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
  const { default: prisma } = await import('@/lib/prisma');
  const task = await prisma.treatmentTask.findUnique({
    where: { id: taskId },
    select: { treatmentPlanId: true },
  });
  if (!task) return false;
  return canAccessTreatmentPlan(task.treatmentPlanId, userId, userRole, userEmail);
}
