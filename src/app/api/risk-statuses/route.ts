import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - الحصول على جميع حالات المخاطر
export async function GET() {
  try {
    const statuses = await prisma.riskStatus.findMany({
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: statuses,
    });
  } catch (error) {
    console.error('Error fetching risk statuses:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب حالات المخاطر' },
      { status: 500 }
    );
  }
}

// POST - إنشاء حالة جديدة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // التحقق من البيانات المطلوبة
    if (!body.code || !body.nameAr || !body.nameEn) {
      return NextResponse.json(
        { success: false, error: 'الكود والاسم بالعربي والإنجليزي مطلوبة' },
        { status: 400 }
      );
    }

    // التحقق من عدم تكرار الكود
    const existingStatus = await prisma.riskStatus.findUnique({
      where: { code: body.code },
    });

    if (existingStatus) {
      return NextResponse.json(
        { success: false, error: 'هذا الكود موجود مسبقاً' },
        { status: 400 }
      );
    }

    // إذا كانت الحالة افتراضية، إلغاء الافتراضي من الحالات الأخرى
    if (body.isDefault) {
      await prisma.riskStatus.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    // الحصول على أعلى ترتيب
    const maxOrder = await prisma.riskStatus.aggregate({
      _max: { order: true },
    });

    const status = await prisma.riskStatus.create({
      data: {
        code: body.code,
        nameAr: body.nameAr,
        nameEn: body.nameEn,
        descriptionAr: body.descriptionAr || null,
        descriptionEn: body.descriptionEn || null,
        color: body.color || null,
        icon: body.icon || null,
        isDefault: body.isDefault || false,
        isActive: body.isActive !== false,
        order: body.order ?? (maxOrder._max.order || 0) + 1,
      },
    });

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Error creating risk status:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء حالة المخاطر' },
      { status: 500 }
    );
  }
}
