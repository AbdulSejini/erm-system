import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - الحصول على مصدر محدد
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const source = await prisma.riskSource.findUnique({
      where: { id },
      include: {
        _count: {
          select: { risks: true },
        },
      },
    });

    if (!source) {
      return NextResponse.json(
        { success: false, error: 'المصدر غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: source,
    });
  } catch (error) {
    console.error('Error fetching source:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب المصدر' },
      { status: 500 }
    );
  }
}

// PATCH - تحديث مصدر
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // التحقق من وجود المصدر
    const existingSource = await prisma.riskSource.findUnique({
      where: { id },
    });

    if (!existingSource) {
      return NextResponse.json(
        { success: false, error: 'المصدر غير موجود' },
        { status: 404 }
      );
    }

    // إذا تم تحديث الكود، تحقق من عدم استخدامه
    if (body.code && body.code.toUpperCase() !== existingSource.code) {
      const codeExists = await prisma.riskSource.findUnique({
        where: { code: body.code.toUpperCase() },
      });

      if (codeExists) {
        return NextResponse.json(
          { success: false, error: 'الكود مستخدم مسبقاً' },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};

    if (body.code !== undefined) updateData.code = body.code.toUpperCase().trim();
    if (body.nameAr !== undefined) updateData.nameAr = body.nameAr.trim();
    if (body.nameEn !== undefined) updateData.nameEn = body.nameEn.trim();
    if (body.descriptionAr !== undefined) updateData.descriptionAr = body.descriptionAr?.trim() || null;
    if (body.descriptionEn !== undefined) updateData.descriptionEn = body.descriptionEn?.trim() || null;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.order !== undefined) updateData.order = body.order;

    const source = await prisma.riskSource.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: source,
    });
  } catch (error) {
    console.error('Error updating source:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث المصدر' },
      { status: 500 }
    );
  }
}

// DELETE - حذف مصدر
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existingSource = await prisma.riskSource.findUnique({
      where: { id },
      include: {
        _count: {
          select: { risks: true },
        },
      },
    });

    if (!existingSource) {
      return NextResponse.json(
        { success: false, error: 'المصدر غير موجود' },
        { status: 404 }
      );
    }

    // التحقق من عدم وجود مخاطر مرتبطة
    if (existingSource._count.risks > 0) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن حذف المصدر لوجود مخاطر مرتبطة به' },
        { status: 400 }
      );
    }

    await prisma.riskSource.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'تم حذف المصدر بنجاح',
    });
  } catch (error) {
    console.error('Error deleting source:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حذف المصدر' },
      { status: 500 }
    );
  }
}
