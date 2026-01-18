import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - الحصول على جميع التصنيفات
export async function GET() {
  try {
    const categories = await prisma.riskCategory.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب التصنيفات' },
      { status: 500 }
    );
  }
}

// POST - إنشاء تصنيف جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const category = await prisma.riskCategory.create({
      data: {
        code: body.code,
        nameAr: body.nameAr,
        nameEn: body.nameEn,
        descriptionAr: body.descriptionAr || null,
        descriptionEn: body.descriptionEn || null,
        examplesAr: body.examplesAr || null,
        examplesEn: body.examplesEn || null,
        color: body.color || null,
        icon: body.icon || null,
        isActive: body.isActive ?? true,
        order: body.order || 0,
      },
    });

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء التصنيف' },
      { status: 500 }
    );
  }
}
