import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - الحصول على جميع الإدارات
export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { nameAr: 'asc' },
      include: {
        _count: {
          select: { risks: true, users: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: departments,
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب الإدارات' },
      { status: 500 }
    );
  }
}

// POST - إنشاء إدارة جديدة
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
    const existingDept = await prisma.department.findUnique({
      where: { code: body.code },
    });

    if (existingDept) {
      return NextResponse.json(
        { success: false, error: 'رمز الإدارة مستخدم مسبقاً' },
        { status: 400 }
      );
    }

    const department = await prisma.department.create({
      data: {
        nameAr: body.nameAr.trim(),
        nameEn: body.nameEn?.trim() || body.nameAr.trim(),
        code: body.code.trim().toUpperCase(),
        type: body.type || 'department',
        managerId: body.managerId || null,
        riskChampionId: body.riskChampionId || null,
        parentId: body.parentId || null,
      },
      include: {
        _count: {
          select: { risks: true, users: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: department,
    });
  } catch (error) {
    console.error('Error creating department:', error);
    const errorMessage = error instanceof Error ? error.message : 'فشل في إنشاء الإدارة';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
