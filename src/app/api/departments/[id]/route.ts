import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - الحصول على إدارة محددة
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        _count: { select: { risks: true, users: true } },
      },
    });

    if (!department) {
      return NextResponse.json(
        { success: false, error: 'الإدارة غير موجودة' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: department,
    });
  } catch (error) {
    console.error('Error fetching department:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب الإدارة' },
      { status: 500 }
    );
  }
}

// PATCH - تحديث إدارة
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existingDept = await prisma.department.findUnique({
      where: { id },
    });

    if (!existingDept) {
      return NextResponse.json(
        { success: false, error: 'الإدارة غير موجودة' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (body.code !== undefined) updateData.code = body.code;
    if (body.nameAr !== undefined) updateData.nameAr = body.nameAr;
    if (body.nameEn !== undefined) updateData.nameEn = body.nameEn;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.managerId !== undefined) updateData.managerId = body.managerId;
    if (body.riskChampionId !== undefined) updateData.riskChampionId = body.riskChampionId;

    const department = await prisma.department.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: department,
    });
  } catch (error) {
    console.error('Error updating department:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث الإدارة' },
      { status: 500 }
    );
  }
}

// DELETE - حذف إدارة
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existingDept = await prisma.department.findUnique({
      where: { id },
      include: {
        _count: { select: { risks: true, users: true } },
      },
    });

    if (!existingDept) {
      return NextResponse.json(
        { success: false, error: 'الإدارة غير موجودة' },
        { status: 404 }
      );
    }

    if (existingDept._count.risks > 0 || existingDept._count.users > 0) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن حذف الإدارة لوجود مخاطر أو مستخدمين مرتبطين بها' },
        { status: 400 }
      );
    }

    await prisma.department.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'تم حذف الإدارة بنجاح',
    });
  } catch (error) {
    console.error('Error deleting department:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حذف الإدارة' },
      { status: 500 }
    );
  }
}
