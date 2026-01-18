import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - الحصول على جميع التصنيفات
export async function GET() {
  try {
    const categories = await prisma.riskCategory.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { risks: true },
        },
      },
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

    // التحقق من البيانات المطلوبة
    if (!body.nameAr || !body.code) {
      return NextResponse.json(
        { success: false, error: 'الاسم والرمز مطلوبان' },
        { status: 400 }
      );
    }

    // التحقق من عدم وجود الرمز مسبقاً
    const existingCategory = await prisma.riskCategory.findUnique({
      where: { code: body.code },
    });

    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: 'رمز التصنيف مستخدم مسبقاً' },
        { status: 400 }
      );
    }

    const category = await prisma.riskCategory.create({
      data: {
        code: body.code.trim().toUpperCase(),
        nameAr: body.nameAr.trim(),
        nameEn: body.nameEn?.trim() || body.nameAr.trim(),
        descriptionAr: body.descriptionAr?.trim() || null,
        descriptionEn: body.descriptionEn?.trim() || null,
        examplesAr: body.examplesAr || null,
        examplesEn: body.examplesEn || null,
        color: body.color || null,
        icon: body.icon || null,
        isActive: body.isActive ?? true,
        order: body.order || 0,
      },
      include: {
        _count: {
          select: { risks: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Error creating category:', error);
    const errorMessage = error instanceof Error ? error.message : 'فشل في إنشاء التصنيف';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
