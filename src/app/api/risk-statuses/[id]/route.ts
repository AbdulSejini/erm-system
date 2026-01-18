import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - الحصول على حالة محددة
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const status = await prisma.riskStatus.findUnique({
      where: { id },
      include: {
        _count: {
          select: { risks: true },
        },
      },
    });

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'حالة المخاطر غير موجودة' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Error fetching risk status:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب حالة المخاطر' },
      { status: 500 }
    );
  }
}

// PATCH - تحديث حالة
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // التحقق من وجود الحالة
    const existingStatus = await prisma.riskStatus.findUnique({
      where: { id },
    });

    if (!existingStatus) {
      return NextResponse.json(
        { success: false, error: 'حالة المخاطر غير موجودة' },
        { status: 404 }
      );
    }

    // التحقق من عدم تكرار الكود
    if (body.code && body.code !== existingStatus.code) {
      const duplicateCode = await prisma.riskStatus.findUnique({
        where: { code: body.code },
      });

      if (duplicateCode) {
        return NextResponse.json(
          { success: false, error: 'هذا الكود موجود مسبقاً' },
          { status: 400 }
        );
      }
    }

    // إذا كانت الحالة افتراضية، إلغاء الافتراضي من الحالات الأخرى
    if (body.isDefault && !existingStatus.isDefault) {
      await prisma.riskStatus.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const updateData: Record<string, unknown> = {};

    // الحقول القابلة للتحديث
    const allowedFields = [
      'code', 'nameAr', 'nameEn', 'descriptionAr', 'descriptionEn',
      'color', 'icon', 'isDefault', 'isActive', 'order'
    ];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    const status = await prisma.riskStatus.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Error updating risk status:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث حالة المخاطر' },
      { status: 500 }
    );
  }
}

// DELETE - حذف حالة
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // التحقق من وجود الحالة
    const existingStatus = await prisma.riskStatus.findUnique({
      where: { id },
      include: {
        _count: {
          select: { risks: true },
        },
      },
    });

    if (!existingStatus) {
      return NextResponse.json(
        { success: false, error: 'حالة المخاطر غير موجودة' },
        { status: 404 }
      );
    }

    // التحقق من عدم وجود مخاطر مرتبطة
    if (existingStatus._count.risks > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `لا يمكن حذف هذه الحالة لأنها مرتبطة بـ ${existingStatus._count.risks} خطر`
        },
        { status: 400 }
      );
    }

    await prisma.riskStatus.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'تم حذف حالة المخاطر بنجاح',
    });
  } catch (error) {
    console.error('Error deleting risk status:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حذف حالة المخاطر' },
      { status: 500 }
    );
  }
}
