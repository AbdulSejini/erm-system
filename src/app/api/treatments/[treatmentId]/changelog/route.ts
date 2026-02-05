import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET - جلب سجل التعديلات لخطة المعالجة
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ treatmentId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const { treatmentId } = await params;

    // التحقق من وجود خطة المعالجة
    const treatmentPlan = await prisma.treatmentPlan.findUnique({
      where: { id: treatmentId },
      select: { id: true },
    });

    if (!treatmentPlan) {
      return NextResponse.json(
        { success: false, error: 'خطة المعالجة غير موجودة' },
        { status: 404 }
      );
    }

    // جلب سجل التعديلات
    const changeLogs = await prisma.treatmentPlanChangeLog.findMany({
      where: { treatmentPlanId: treatmentId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            fullNameEn: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: changeLogs,
    });
  } catch (error) {
    console.error('Error fetching treatment change logs:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب سجل التعديلات' },
      { status: 500 }
    );
  }
}

// POST - إضافة سجل تعديل جديد (يُستخدم داخلياً عند التعديل)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ treatmentId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const { treatmentId } = await params;
    const body = await request.json();
    const {
      changeType,
      fieldName,
      fieldNameAr,
      oldValue,
      newValue,
      description,
      descriptionAr,
      relatedTaskId,
    } = body;

    if (!changeType) {
      return NextResponse.json(
        { success: false, error: 'نوع التعديل مطلوب' },
        { status: 400 }
      );
    }

    // التحقق من وجود خطة المعالجة
    const treatmentPlan = await prisma.treatmentPlan.findUnique({
      where: { id: treatmentId },
      select: { id: true },
    });

    if (!treatmentPlan) {
      return NextResponse.json(
        { success: false, error: 'خطة المعالجة غير موجودة' },
        { status: 404 }
      );
    }

    // إنشاء سجل التعديل
    const changeLog = await prisma.treatmentPlanChangeLog.create({
      data: {
        treatmentPlanId: treatmentId,
        userId: session.user.id,
        changeType,
        fieldName: fieldName || null,
        fieldNameAr: fieldNameAr || null,
        oldValue: oldValue ? JSON.stringify(oldValue) : null,
        newValue: newValue ? JSON.stringify(newValue) : null,
        description: description || null,
        descriptionAr: descriptionAr || null,
        relatedTaskId: relatedTaskId || null,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        userAgent: request.headers.get('user-agent') || null,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            fullNameEn: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: changeLog,
    });
  } catch (error) {
    console.error('Error creating treatment change log:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إضافة سجل التعديل' },
      { status: 500 }
    );
  }
}
