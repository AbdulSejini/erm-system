import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { getClientInfo } from '@/lib/audit';

// POST - إنشاء خطة معالجة جديدة
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: riskId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    // التحقق من وجود الخطر
    const risk = await prisma.risk.findUnique({
      where: { id: riskId },
      select: { id: true, riskNumber: true, titleAr: true }
    });

    if (!risk) {
      return NextResponse.json(
        { success: false, error: 'الخطر غير موجود' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const clientInfo = getClientInfo(request);

    // إنشاء خطة المعالجة
    const treatmentPlan = await prisma.treatmentPlan.create({
      data: {
        riskId,
        titleAr: body.titleAr,
        titleEn: body.titleEn,
        descriptionAr: body.descriptionAr || '',
        descriptionEn: body.descriptionEn || '',
        strategy: body.strategy || 'reduce',
        status: body.status || 'notStarted',
        responsibleId: body.responsibleId,
        startDate: new Date(body.startDate),
        dueDate: new Date(body.dueDate),
        progress: body.progress || 0,
        cost: body.cost || null,
        createdById: session.user.id,
      },
      include: {
        responsible: {
          select: {
            id: true,
            fullName: true,
            fullNameEn: true,
          },
        },
      },
    });

    // تسجيل إضافة خطة المعالجة في سجل التعديلات
    await prisma.riskChangeLog.create({
      data: {
        riskId,
        userId: session.user.id,
        changeType: 'treatment_add',
        changeCategory: 'treatment',
        fieldName: 'treatments',
        fieldNameAr: 'خطط المعالجة',
        oldValue: null,
        newValue: JSON.stringify({
          id: treatmentPlan.id,
          titleAr: treatmentPlan.titleAr,
          titleEn: treatmentPlan.titleEn,
          strategy: treatmentPlan.strategy,
        }),
        description: `Added treatment plan: ${treatmentPlan.titleEn}`,
        descriptionAr: `تمت إضافة خطة معالجة: ${treatmentPlan.titleAr}`,
        relatedEntityId: treatmentPlan.id,
        ipAddress: clientInfo.ipAddress || null,
        userAgent: clientInfo.userAgent || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: treatmentPlan,
    });
  } catch (error) {
    console.error('Error creating treatment plan:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء خطة المعالجة' },
      { status: 500 }
    );
  }
}

// GET - جلب خطط المعالجة للخطر
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: riskId } = await params;

    const treatments = await prisma.treatmentPlan.findMany({
      where: { riskId },
      include: {
        responsible: {
          select: {
            id: true,
            fullName: true,
            fullNameEn: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            fullName: true,
            fullNameEn: true,
          },
        },
        tasks: {
          orderBy: { order: 'asc' },
          include: {
            assignedTo: {
              select: {
                id: true,
                fullName: true,
                fullNameEn: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: treatments,
    });
  } catch (error) {
    console.error('Error fetching treatment plans:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب خطط المعالجة' },
      { status: 500 }
    );
  }
}
