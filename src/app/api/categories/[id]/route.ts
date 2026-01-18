import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - الحصول على تصنيف محدد
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const category = await prisma.riskCategory.findUnique({
      where: { id },
      include: {
        _count: { select: { risks: true } },
      },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'التصنيف غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب التصنيف' },
      { status: 500 }
    );
  }
}

// PATCH - تحديث تصنيف
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existingCategory = await prisma.riskCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: 'التصنيف غير موجود' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (body.code !== undefined) updateData.code = body.code;
    if (body.nameAr !== undefined) updateData.nameAr = body.nameAr;
    if (body.nameEn !== undefined) updateData.nameEn = body.nameEn;
    if (body.descriptionAr !== undefined) updateData.descriptionAr = body.descriptionAr;
    if (body.descriptionEn !== undefined) updateData.descriptionEn = body.descriptionEn;
    if (body.color !== undefined) updateData.color = body.color;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const category = await prisma.riskCategory.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث التصنيف' },
      { status: 500 }
    );
  }
}

// DELETE - حذف تصنيف
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existingCategory = await prisma.riskCategory.findUnique({
      where: { id },
      include: {
        _count: { select: { risks: true } },
      },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: 'التصنيف غير موجود' },
        { status: 404 }
      );
    }

    if (existingCategory._count.risks > 0) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن حذف التصنيف لوجود مخاطر مرتبطة به' },
        { status: 400 }
      );
    }

    await prisma.riskCategory.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'تم حذف التصنيف بنجاح',
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حذف التصنيف' },
      { status: 500 }
    );
  }
}
