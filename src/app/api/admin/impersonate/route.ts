import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { createAuditLog, getClientInfo } from '@/lib/audit';

// POST - بدء انتحال صلاحيات مستخدم آخر (للمدير فقط)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    // التحقق من أن المستخدم الحالي هو admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, fullName: true },
    });

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'هذه الميزة متاحة فقط لمدير النظام' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: 'معرف المستخدم المستهدف مطلوب' },
        { status: 400 }
      );
    }

    // جلب بيانات المستخدم المستهدف
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        fullName: true,
        fullNameEn: true,
        role: true,
        departmentId: true,
        department: {
          select: {
            nameAr: true,
            nameEn: true,
          },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // تسجيل عملية الانتحال في سجل التدقيق
    const clientInfo = getClientInfo(request);
    await createAuditLog({
      userId: currentUser.id,
      action: 'impersonate_start',
      entity: 'user',
      entityId: targetUser.id,
      newValues: {
        targetUserId: targetUser.id,
        targetUserName: targetUser.fullName,
        targetUserRole: targetUser.role,
      },
      ...clientInfo,
    });

    // إرجاع بيانات المستخدم المستهدف
    return NextResponse.json({
      success: true,
      data: {
        originalAdmin: {
          id: currentUser.id,
          name: currentUser.fullName,
        },
        impersonatedUser: {
          id: targetUser.id,
          email: targetUser.email,
          name: targetUser.fullName,
          nameEn: targetUser.fullNameEn,
          role: targetUser.role,
          departmentId: targetUser.departmentId,
          department: targetUser.department,
        },
      },
    });
  } catch (error) {
    console.error('Error starting impersonation:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في بدء انتحال الصلاحيات' },
      { status: 500 }
    );
  }
}

// DELETE - إنهاء انتحال الصلاحيات
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    // جلب معرف المدير الأصلي من الـ header أو body
    const body = await request.json().catch(() => ({}));
    const originalAdminId = body.originalAdminId;

    if (originalAdminId) {
      // تسجيل إنهاء الانتحال
      const clientInfo = getClientInfo(request);
      await createAuditLog({
        userId: originalAdminId,
        action: 'impersonate_end',
        entity: 'user',
        entityId: session.user.id,
        ...clientInfo,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'تم إنهاء انتحال الصلاحيات',
    });
  } catch (error) {
    console.error('Error ending impersonation:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إنهاء انتحال الصلاحيات' },
      { status: 500 }
    );
  }
}
