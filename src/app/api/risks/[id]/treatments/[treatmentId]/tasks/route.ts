import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// POST - إنشاء مهمة جديدة
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; treatmentId: string }> }
) {
  try {
    const { id: riskId, treatmentId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    // التحقق من وجود خطة المعالجة
    const treatmentPlan = await prisma.treatmentPlan.findFirst({
      where: { id: treatmentId, riskId },
    });

    if (!treatmentPlan) {
      return NextResponse.json(
        { success: false, error: 'خطة المعالجة غير موجودة' },
        { status: 404 }
      );
    }

    const body = await request.json();

    // التحقق من وجود عنوان واحد على الأقل
    const titleAr = body.titleAr?.trim() || body.titleEn?.trim() || 'مهمة جديدة';
    const titleEn = body.titleEn?.trim() || body.titleAr?.trim() || 'New Task';

    console.log('Creating task with data:', {
      treatmentPlanId: treatmentId,
      titleAr,
      titleEn,
      actionOwnerId: body.actionOwnerId,
      assignedToId: body.assignedToId,
      monitorId: body.monitorId,
    });

    // إنشاء المهمة
    const task = await prisma.treatmentTask.create({
      data: {
        treatmentPlanId: treatmentId,
        titleAr: titleAr,
        titleEn: titleEn,
        descriptionAr: body.descriptionAr || null,
        descriptionEn: body.descriptionEn || null,
        status: body.status || 'notStarted',
        priority: body.priority || 'medium',
        assignedToId: body.assignedToId || null,
        actionOwnerId: body.actionOwnerId || null,
        monitorId: null, // للتوافق القديم مع Users
        monitorOwnerId: body.monitorOwnerId || body.monitorId || null, // المتابع من ملاك المخاطر
        successIndicatorAr: body.successIndicatorAr || null,
        successIndicatorEn: body.successIndicatorEn || null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        order: body.order || 0,
        // مرفقات OneDrive
        oneDriveUrl: body.oneDriveUrl || null,
        oneDriveFileName: body.oneDriveFileName || null,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            fullName: true,
            fullNameEn: true,
          },
        },
        actionOwner: {
          select: {
            id: true,
            fullName: true,
            fullNameEn: true,
            email: true,
          },
        },
        monitor: {
          select: {
            id: true,
            fullName: true,
            fullNameEn: true,
          },
        },
        monitorOwner: {
          select: {
            id: true,
            fullName: true,
            fullNameEn: true,
            email: true,
          },
        },
      },
    });

    console.log('Task created successfully:', task.id);

    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء المهمة' },
      { status: 500 }
    );
  }
}

// GET - جلب مهام خطة المعالجة
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; treatmentId: string }> }
) {
  try {
    const { treatmentId } = await params;

    const tasks = await prisma.treatmentTask.findMany({
      where: { treatmentPlanId: treatmentId },
      include: {
        assignedTo: {
          select: {
            id: true,
            fullName: true,
            fullNameEn: true,
          },
        },
        actionOwner: {
          select: {
            id: true,
            fullName: true,
            fullNameEn: true,
            email: true,
          },
        },
        monitor: {
          select: {
            id: true,
            fullName: true,
            fullNameEn: true,
          },
        },
        monitorOwner: {
          select: {
            id: true,
            fullName: true,
            fullNameEn: true,
            email: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب المهام' },
      { status: 500 }
    );
  }
}
