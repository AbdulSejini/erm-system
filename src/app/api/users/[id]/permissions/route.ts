import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';
import {
  getEffectivePermissions,
  parseCustomPermissions,
  MODULES,
  type Module,
} from '@/lib/permissions';

const PRIVILEGED_ROLES = ['admin', 'riskManager'];

/**
 * GET - Get effective permissions for a user
 * Any authenticated user can check their own permissions; only admin/riskManager
 * can check others' permissions.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if ('error' in authResult) return authResult.error;

  const { id } = await params;

  // Only privileged roles can view other users' permissions
  if (id !== authResult.userId && !PRIVILEGED_ROLES.includes(authResult.role)) {
    return NextResponse.json(
      { success: false, error: 'Forbidden' },
      { status: 403 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        fullNameEn: true,
        role: true,
        customPermissions: true,
        department: { select: { id: true, nameAr: true, nameEn: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const permissions = getEffectivePermissions(user.role, user.customPermissions);
    const custom = parseCustomPermissions(user.customPermissions);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          fullNameEn: user.fullNameEn,
          role: user.role,
          department: user.department,
        },
        permissions,
        hasCustomOverrides: Object.keys(custom).length > 0,
      },
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update custom permissions for a user
 * Only admin and riskManager can do this.
 *
 * Body: { customPermissions: { [module: string]: boolean } | null }
 * Passing null resets to role defaults.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request, { roles: PRIVILEGED_ROLES as any });
  if ('error' in authResult) return authResult.error;

  const { id } = await params;

  try {
    const body = await request.json();

    // Prevent admin permissions from being modified (safety)
    const target = await prisma.user.findUnique({
      where: { id },
      select: { role: true },
    });
    if (!target) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    if (target.role === 'admin') {
      return NextResponse.json(
        { success: false, error: 'Cannot modify admin permissions' },
        { status: 403 }
      );
    }

    // Reset to defaults
    if (body.customPermissions === null || body.reset === true) {
      await prisma.user.update({
        where: { id },
        data: { customPermissions: null },
      });
      return NextResponse.json({ success: true });
    }

    // Validate and sanitize the permissions object
    const incoming = body.customPermissions || {};
    const sanitized: Record<string, boolean> = {};

    for (const m of MODULES) {
      if (incoming[m] !== undefined) {
        sanitized[m] = Boolean(incoming[m]);
      }
    }

    await prisma.user.update({
      where: { id },
      data: {
        customPermissions: Object.keys(sanitized).length > 0
          ? JSON.stringify(sanitized)
          : null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating permissions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update permissions' },
      { status: 500 }
    );
  }
}
