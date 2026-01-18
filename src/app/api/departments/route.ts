import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - الحصول على جميع الإدارات
export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { nameAr: 'asc' },
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

    const department = await prisma.department.create({
      data: {
        nameAr: body.nameAr,
        nameEn: body.nameEn,
        code: body.code,
        type: body.type || 'department',
        managerId: body.managerId || null,
        riskChampionId: body.riskChampionId || null,
        parentId: body.parentId || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: department,
    });
  } catch (error) {
    console.error('Error creating department:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء الإدارة' },
      { status: 500 }
    );
  }
}
