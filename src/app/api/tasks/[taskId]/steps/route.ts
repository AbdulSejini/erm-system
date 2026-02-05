import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET - جلب خطوات المهمة
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const { taskId } = await params;

    // التحقق من وجود المهمة
    const task = await prisma.treatmentTask.findUnique({
      where: { id: taskId },
      select: { id: true },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'المهمة غير موجودة' },
        { status: 404 }
      );
    }

    // جلب الخطوات مرتبة
    const steps = await prisma.taskStep.findMany({
      where: { taskId },
      orderBy: { order: 'asc' },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            fullNameEn: true,
            email: true,
          },
        },
        completedBy: {
          select: {
            id: true,
            fullName: true,
            fullNameEn: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: steps,
    });
  } catch (error) {
    console.error('Error fetching task steps:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب الخطوات' },
      { status: 500 }
    );
  }
}

// POST - إضافة خطوة جديدة
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const { taskId } = await params;
    const body = await request.json();
    const { title, description, dueDate, attachmentUrl, attachmentName } = body;

    if (!title || title.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'عنوان الخطوة مطلوب' },
        { status: 400 }
      );
    }

    // التحقق من وجود المهمة
    const task = await prisma.treatmentTask.findUnique({
      where: { id: taskId },
      select: { id: true },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'المهمة غير موجودة' },
        { status: 404 }
      );
    }

    // جلب أعلى ترتيب حالي
    const maxOrderStep = await prisma.taskStep.findFirst({
      where: { taskId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const newOrder = (maxOrderStep?.order ?? -1) + 1;

    // إنشاء الخطوة
    const step = await prisma.taskStep.create({
      data: {
        taskId,
        createdById: session.user.id,
        title: title.trim(),
        description: description?.trim() || null,
        order: newOrder,
        dueDate: dueDate ? new Date(dueDate) : null,
        attachmentUrl: attachmentUrl || null,
        attachmentName: attachmentName || null,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            fullNameEn: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: step,
    });
  } catch (error) {
    console.error('Error creating task step:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء الخطوة' },
      { status: 500 }
    );
  }
}

// PATCH - تحديث خطوة (تغيير الحالة أو البيانات)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { stepId, title, description, status, dueDate, attachmentUrl, attachmentName } = body;

    if (!stepId) {
      return NextResponse.json(
        { success: false, error: 'معرف الخطوة مطلوب' },
        { status: 400 }
      );
    }

    // جلب الخطوة
    const existingStep = await prisma.taskStep.findUnique({
      where: { id: stepId },
      select: { id: true, status: true },
    });

    if (!existingStep) {
      return NextResponse.json(
        { success: false, error: 'الخطوة غير موجودة' },
        { status: 404 }
      );
    }

    // بناء بيانات التحديث
    const updateData: {
      title?: string;
      description?: string | null;
      status?: string;
      dueDate?: Date | null;
      completedAt?: Date | null;
      completedById?: string | null;
      attachmentUrl?: string | null;
      attachmentName?: string | null;
    } = {};

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (attachmentUrl !== undefined) updateData.attachmentUrl = attachmentUrl || null;
    if (attachmentName !== undefined) updateData.attachmentName = attachmentName || null;

    // تحديث الحالة
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'completed') {
        updateData.completedAt = new Date();
        updateData.completedById = session.user.id;
      } else {
        updateData.completedAt = null;
        updateData.completedById = null;
      }
    }

    const step = await prisma.taskStep.update({
      where: { id: stepId },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            fullNameEn: true,
            email: true,
          },
        },
        completedBy: {
          select: {
            id: true,
            fullName: true,
            fullNameEn: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: step,
    });
  } catch (error) {
    console.error('Error updating task step:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث الخطوة' },
      { status: 500 }
    );
  }
}

// DELETE - حذف خطوة
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const stepId = searchParams.get('stepId');

    if (!stepId) {
      return NextResponse.json(
        { success: false, error: 'معرف الخطوة مطلوب' },
        { status: 400 }
      );
    }

    // جلب الخطوة
    const step = await prisma.taskStep.findUnique({
      where: { id: stepId },
      select: { createdById: true },
    });

    if (!step) {
      return NextResponse.json(
        { success: false, error: 'الخطوة غير موجودة' },
        { status: 404 }
      );
    }

    // التحقق من الصلاحية (المنشئ أو admin أو riskManager)
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (
      step.createdById !== session.user.id &&
      !['admin', 'riskManager'].includes(currentUser?.role || '')
    ) {
      return NextResponse.json(
        { success: false, error: 'ليس لديك صلاحية حذف هذه الخطوة' },
        { status: 403 }
      );
    }

    await prisma.taskStep.delete({
      where: { id: stepId },
    });

    return NextResponse.json({
      success: true,
      message: 'تم حذف الخطوة بنجاح',
    });
  } catch (error) {
    console.error('Error deleting task step:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حذف الخطوة' },
      { status: 500 }
    );
  }
}
