import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { requireAuth } from '@/lib/api-auth';
import { createAuditLog, getClientInfo } from '@/lib/audit';

// GET - الحصول على مستخدم محدد
// أي مستخدم مسجّل يستطيع قراءة نفسه. أدوار الإدارة يرون أي مستخدم.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if ('error' in authResult) return authResult.error;

  try {
    const { id } = await params;

    // Authorization: self OR admin/riskManager/riskAnalyst
    const isSelf = id === authResult.userId;
    const canViewAny = ['admin', 'riskManager', 'riskAnalyst'].includes(authResult.role);
    if (!isSelf && !canViewAny) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        fullNameEn: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
          },
        },
        createdAt: true,
        lastLogin: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب المستخدم' },
      { status: 500 }
    );
  }
}

// PATCH - تحديث مستخدم (admin فقط — يمنع privilege escalation)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request, { roles: ['admin'] });
  if ('error' in authResult) return authResult.error;

  try {
    const { id } = await params;
    const body = await request.json();

    // Prevent an admin from accidentally locking themselves out by
    // demoting their own role.
    if (id === authResult.userId && body.role && body.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'لا يمكنك تغيير دورك الخاص' },
        { status: 400 }
      );
    }

    // التحقق من وجود المستخدم
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // إذا كان هناك تحديث للبريد الإلكتروني، تحقق من عدم استخدامه
    if (body.email && body.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: body.email },
      });

      if (emailExists) {
        return NextResponse.json(
          { success: false, error: 'البريد الإلكتروني مستخدم مسبقاً' },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};

    if (body.fullName !== undefined) updateData.fullName = body.fullName;
    if (body.fullNameEn !== undefined) updateData.fullNameEn = body.fullNameEn;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.role !== undefined) updateData.role = body.role;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.departmentId !== undefined) updateData.departmentId = body.departmentId;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        fullNameEn: true,
        email: true,
        role: true,
        status: true,
      },
    });

    // Audit log
    const clientInfo = getClientInfo(request);
    await createAuditLog({
      userId: authResult.userId,
      action: 'update',
      entity: 'user',
      entityId: id,
      oldValues: { role: existingUser.role, status: existingUser.status },
      newValues: updateData,
      ...clientInfo,
    });

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث المستخدم' },
      { status: 500 }
    );
  }
}

// DELETE - حذف مستخدم (admin فقط)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request, { roles: ['admin'] });
  if ('error' in authResult) return authResult.error;

  try {
    const { id } = await params;

    // Prevent an admin from deleting themselves
    if (id === authResult.userId) {
      return NextResponse.json(
        { success: false, error: 'لا يمكنك حذف حسابك الخاص' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    // Audit log
    const clientInfo = getClientInfo(request);
    await createAuditLog({
      userId: authResult.userId,
      action: 'delete',
      entity: 'user',
      entityId: id,
      oldValues: { email: existingUser.email, role: existingUser.role },
      ...clientInfo,
    });

    return NextResponse.json({
      success: true,
      message: 'تم حذف المستخدم بنجاح',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حذف المستخدم' },
      { status: 500 }
    );
  }
}
