import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - الحصول على جميع مصادر المخاطر
export async function GET() {
  try {
    const sources = await prisma.riskSource.findMany({
      include: {
        _count: {
          select: { risks: true },
        },
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: sources,
    });
  } catch (error) {
    console.error('Error fetching sources:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب مصادر المخاطر' },
      { status: 500 }
    );
  }
}

// POST - إنشاء مصدر جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // التحقق من البيانات المطلوبة
    if (!body.code || !body.nameAr || !body.nameEn) {
      return NextResponse.json(
        { success: false, error: 'الكود والاسم العربي والإنجليزي مطلوبين' },
        { status: 400 }
      );
    }

    // التحقق من عدم وجود الكود مسبقاً
    const existingSource = await prisma.riskSource.findUnique({
      where: { code: body.code.toUpperCase() },
    });

    if (existingSource) {
      return NextResponse.json(
        { success: false, error: 'الكود مستخدم مسبقاً' },
        { status: 400 }
      );
    }

    // الحصول على أعلى ترتيب
    const maxOrder = await prisma.riskSource.aggregate({
      _max: { order: true },
    });

    const source = await prisma.riskSource.create({
      data: {
        code: body.code.toUpperCase().trim(),
        nameAr: body.nameAr.trim(),
        nameEn: body.nameEn.trim(),
        descriptionAr: body.descriptionAr?.trim() || null,
        descriptionEn: body.descriptionEn?.trim() || null,
        isActive: body.isActive ?? true,
        order: (maxOrder._max.order || 0) + 1,
      },
    });

    return NextResponse.json({
      success: true,
      data: source,
    });
  } catch (error) {
    console.error('Error creating source:', error);
    const errorMessage = error instanceof Error ? error.message : 'فشل في إنشاء مصدر المخاطر';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
