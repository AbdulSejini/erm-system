import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';
import { createAuditLog, getClientInfo } from '@/lib/audit';

// GET - الحصول على صلاحيات الوصول للإدارات لمستخدم معين
// (المستخدم نفسه أو admin/riskManager)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if ('error' in authResult) return authResult.error;

  try {
    const { id } = await params;

    const isSelf = id === authResult.userId;
    const canViewAny = ['admin', 'riskManager'].includes(authResult.role);
    if (!isSelf && !canViewAny) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // التحقق من وجود المستخدم
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, fullName: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    const departmentAccess = await prisma.userDepartmentAccess.findMany({
      where: { userId: id },
      include: {
        department: {
          select: {
            id: true,
            code: true,
            nameAr: true,
            nameEn: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: departmentAccess,
    });
  } catch (error) {
    console.error('Error fetching department access:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب صلاحيات الإدارات' },
      { status: 500 }
    );
  }
}

// POST - إضافة صلاحية وصول لإدارة (admin فقط)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request, { roles: ['admin'] });
  if ('error' in authResult) return authResult.error;

  try {
    const { id } = await params;
    const body = await request.json();

    // التحقق من البيانات المطلوبة
    if (!body.departmentId) {
      return NextResponse.json(
        { success: false, error: 'معرف الإدارة مطلوب' },
        { status: 400 }
      );
    }

    // التحقق من وجود المستخدم
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // التحقق من وجود الإدارة
    const department = await prisma.department.findUnique({
      where: { id: body.departmentId },
    });

    if (!department) {
      return NextResponse.json(
        { success: false, error: 'الإدارة غير موجودة' },
        { status: 404 }
      );
    }

    // التحقق من عدم وجود الصلاحية مسبقاً
    const existingAccess = await prisma.userDepartmentAccess.findUnique({
      where: {
        userId_departmentId: {
          userId: id,
          departmentId: body.departmentId,
        },
      },
    });

    if (existingAccess) {
      return NextResponse.json(
        { success: false, error: 'الصلاحية موجودة مسبقاً' },
        { status: 400 }
      );
    }

    const access = await prisma.userDepartmentAccess.create({
      data: {
        userId: id,
        departmentId: body.departmentId,
        canView: body.canView ?? true,
        canEdit: body.canEdit ?? false,
      },
      include: {
        department: {
          select: {
            id: true,
            code: true,
            nameAr: true,
            nameEn: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: access,
    });
  } catch (error) {
    console.error('Error adding department access:', error);
    const errorMessage = error instanceof Error ? error.message : 'فشل في إضافة صلاحية الإدارة';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// PUT - تحديث صلاحيات الوصول للإدارات (استبدال كامل — admin فقط)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request, { roles: ['admin'] });
  if ('error' in authResult) return authResult.error;

  try {
    const { id } = await params;
    const body = await request.json();

    // التحقق من وجود المستخدم
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // departmentIds: مصفوفة من معرفات الإدارات
    const departmentIds: string[] = body.departmentIds || [];

    // حذف جميع الصلاحيات الحالية
    await prisma.userDepartmentAccess.deleteMany({
      where: { userId: id },
    });

    // إضافة الصلاحيات الجديدة
    if (departmentIds.length > 0) {
      await prisma.userDepartmentAccess.createMany({
        data: departmentIds.map((deptId: string) => ({
          userId: id,
          departmentId: deptId,
          canView: true,
          canEdit: body.canEdit ?? false,
        })),
      });
    }

    // جلب الصلاحيات المحدثة
    const updatedAccess = await prisma.userDepartmentAccess.findMany({
      where: { userId: id },
      include: {
        department: {
          select: {
            id: true,
            code: true,
            nameAr: true,
            nameEn: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedAccess,
    });
  } catch (error) {
    console.error('Error updating department access:', error);
    const errorMessage = error instanceof Error ? error.message : 'فشل في تحديث صلاحيات الإدارات';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE - حذف صلاحية وصول لإدارة معينة (admin فقط)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request, { roles: ['admin'] });
  if ('error' in authResult) return authResult.error;

  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('departmentId');

    if (!departmentId) {
      return NextResponse.json(
        { success: false, error: 'معرف الإدارة مطلوب' },
        { status: 400 }
      );
    }

    const existingAccess = await prisma.userDepartmentAccess.findUnique({
      where: {
        userId_departmentId: {
          userId: id,
          departmentId: departmentId,
        },
      },
    });

    if (!existingAccess) {
      return NextResponse.json(
        { success: false, error: 'الصلاحية غير موجودة' },
        { status: 404 }
      );
    }

    await prisma.userDepartmentAccess.delete({
      where: {
        userId_departmentId: {
          userId: id,
          departmentId: departmentId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم حذف صلاحية الوصول بنجاح',
    });
  } catch (error) {
    console.error('Error deleting department access:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حذف صلاحية الإدارة' },
      { status: 500 }
    );
  }
}
