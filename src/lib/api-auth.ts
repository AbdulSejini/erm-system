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

/**
 * Roles that can see any treatment plan regardless of assignment.
 */
const TREATMENT_PRIVILEGED_ROLES: ReadonlySet<string> = new Set([
  'admin',
  'riskManager',
  'riskAnalyst',
]);

/**
 * Check whether the given user may read a specific TreatmentPlan.
 *
 * The rules match the filter logic in /api/risks (GET, includeTreatments):
 *   - Privileged roles (admin/riskManager/riskAnalyst) see everything
 *   - The plan's responsible user
 *   - The plan's monitor user
 *   - The plan's risk owner (matched via email)
 *   - Anyone assigned to OR monitoring a task under the plan
 *
 * Returns true on access, false otherwise. Caller should respond with 403
 * (or 404 to avoid leaking existence).
 */
export async function canAccessTreatmentPlan(
  treatmentPlanId: string,
  userId: string,
  userRole: string,
  userEmail: string
): Promise<boolean> {
  if (TREATMENT_PRIVILEGED_ROLES.has(userRole)) return true;

  // Lazy import to avoid pulling prisma into all consumers at module load
  const { default: prisma } = await import('@/lib/prisma');

  const plan = await prisma.treatmentPlan.findUnique({
    where: { id: treatmentPlanId },
    select: {
      responsibleId: true,
      monitorId: true,
      riskOwner: { select: { email: true } },
      tasks: {
        select: {
          assignedToId: true,
          monitorId: true,
          actionOwner: { select: { email: true } },
          monitorOwner: { select: { email: true } },
        },
      },
    },
  });

  if (!plan) return false;

  if (plan.responsibleId === userId) return true;
  if (plan.monitorId === userId) return true;
  if (userEmail && plan.riskOwner?.email === userEmail) return true;

  return (plan.tasks || []).some((task) => {
    if (task.assignedToId === userId) return true;
    if (task.monitorId === userId) return true;
    if (userEmail && task.actionOwner?.email === userEmail) return true;
    if (userEmail && task.monitorOwner?.email === userEmail) return true;
    return false;
  });
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
