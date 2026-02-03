import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// دالة مساعدة للتحقق من صلاحيات التعديل/الحذف
async function checkEditPermission() {
  const session = await auth();
  if (!session?.user?.id) {
    return { allowed: false, error: 'غير مصرح', status: 401 };
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  // التحقق من الصلاحيات - يُسمح لـ admin, riskManager, riskAnalyst
  const allowedRoles = ['admin', 'riskManager', 'riskAnalyst'];
  if (!currentUser || !allowedRoles.includes(currentUser.role)) {
    return { allowed: false, error: 'غير مصرح بتعديل ملاك المخاطر', status: 403 };
  }

  return { allowed: true };
}

// GET - الحصول على مالك خطر محدد
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const owner = await prisma.riskOwner.findUnique({
      where: { id },
      include: {
        department: {
          select: {
            id: true,
            code: true,
            nameAr: true,
            nameEn: true,
          },
        },
        _count: {
          select: { risks: true },
        },
      },
    });

    if (!owner) {
      return NextResponse.json(
        { success: false, error: 'مالك الخطر غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: owner,
    });
  } catch (error) {
    console.error('Error fetching risk owner:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب مالك الخطر' },
      { status: 500 }
    );
  }
}

// PATCH - تحديث مالك خطر
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // التحقق من الصلاحيات
    const permCheck = await checkEditPermission();
    if (!permCheck.allowed) {
      return NextResponse.json(
        { success: false, error: permCheck.error },
        { status: permCheck.status }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // التحقق من وجود مالك الخطر
    const existingOwner = await prisma.riskOwner.findUnique({
      where: { id },
    });

    if (!existingOwner) {
      return NextResponse.json(
        { success: false, error: 'مالك الخطر غير موجود' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (body.fullName !== undefined) updateData.fullName = body.fullName.trim();
    if (body.fullNameEn !== undefined) updateData.fullNameEn = body.fullNameEn?.trim() || null;
    if (body.email !== undefined) updateData.email = body.email?.trim() || null;
    if (body.phone !== undefined) updateData.phone = body.phone?.trim() || null;
    if (body.departmentId !== undefined) {
      updateData.departmentId = body.departmentId && body.departmentId.trim() !== '' ? body.departmentId : null;
    }
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const owner = await prisma.riskOwner.update({
      where: { id },
      data: updateData,
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
      data: owner,
    });
  } catch (error) {
    console.error('Error updating risk owner:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث مالك الخطر' },
      { status: 500 }
    );
  }
}

// DELETE - حذف مالك خطر
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // التحقق من الصلاحيات
    const permCheck = await checkEditPermission();
    if (!permCheck.allowed) {
      return NextResponse.json(
        { success: false, error: permCheck.error },
        { status: permCheck.status }
      );
    }

    const { id } = await params;

    const existingOwner = await prisma.riskOwner.findUnique({
      where: { id },
      include: {
        _count: {
          select: { risks: true },
        },
      },
    });

    if (!existingOwner) {
      return NextResponse.json(
        { success: false, error: 'مالك الخطر غير موجود' },
        { status: 404 }
      );
    }

    // التحقق من عدم وجود مخاطر مرتبطة
    if (existingOwner._count.risks > 0) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن حذف مالك الخطر لوجود مخاطر مرتبطة به' },
        { status: 400 }
      );
    }

    await prisma.riskOwner.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'تم حذف مالك الخطر بنجاح',
    });
  } catch (error) {
    console.error('Error deleting risk owner:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حذف مالك الخطر' },
      { status: 500 }
    );
  }
}
