import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET - الحصول على جميع ملاك المخاطر
export async function GET() {
  try {
    const owners = await prisma.riskOwner.findMany({
      include: {
        department: {
          select: {
            id: true,
            code: true,
            nameAr: true,
            nameEn: true,
          },
        },
        _count: {
          select: { risks: true },
        },
      },
      orderBy: { fullName: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: owners,
    });
  } catch (error) {
    console.error('Error fetching risk owners:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب ملاك المخاطر' },
      { status: 500 }
    );
  }
}

// POST - إنشاء مالك خطر جديد
export async function POST(request: NextRequest) {
  try {
    // التحقق من الجلسة والصلاحيات
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    // جلب بيانات المستخدم
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    // التحقق من الصلاحيات - يُسمح لـ admin, riskManager, riskAnalyst
    const allowedRoles = ['admin', 'riskManager', 'riskAnalyst'];
    if (!currentUser || !allowedRoles.includes(currentUser.role)) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح بإضافة ملاك المخاطر' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // التحقق من البيانات المطلوبة
    if (!body.fullName) {
      return NextResponse.json(
        { success: false, error: 'الاسم الكامل مطلوب' },
        { status: 400 }
      );
    }

    // تحويل departmentId الفارغ إلى null
    const departmentId = body.departmentId && body.departmentId.trim() !== '' ? body.departmentId : null;

    const owner = await prisma.riskOwner.create({
      data: {
        fullName: body.fullName.trim(),
        fullNameEn: body.fullNameEn?.trim() || null,
        email: body.email?.trim() || null,
        phone: body.phone?.trim() || null,
        departmentId: departmentId,
        isActive: body.isActive ?? true,
      },
      include: {
        department: {
          select: {
            id: true,
            code: true,
            nameAr: true,
            nameEn: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: owner,
    });
  } catch (error) {
    console.error('Error creating risk owner:', error);
    const errorMessage = error instanceof Error ? error.message : 'فشل في إنشاء مالك الخطر';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
