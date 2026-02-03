import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// PATCH - تحديث مهمة
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; treatmentId: string; taskId: string }> }
) {
  try {
    const { id: riskId, treatmentId, taskId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    // التحقق من وجود المهمة
    const existingTask = await prisma.treatmentTask.findFirst({
      where: {
        id: taskId,
        treatmentPlanId: treatmentId,
        treatmentPlan: { riskId },
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        { success: false, error: 'المهمة غير موجودة' },
        { status: 404 }
      );
    }

    const body = await request.json();

    console.log('Updating task with data:', {
      taskId,
      titleAr: body.titleAr,
      titleEn: body.titleEn,
      actionOwnerId: body.actionOwnerId,
      monitorOwnerId: body.monitorOwnerId,
    });

    // تحديث المهمة
    const task = await prisma.treatmentTask.update({
      where: { id: taskId },
      data: {
        ...(body.titleAr !== undefined && { titleAr: body.titleAr }),
        ...(body.titleEn !== undefined && { titleEn: body.titleEn }),
        ...(body.descriptionAr !== undefined && { descriptionAr: body.descriptionAr }),
        ...(body.descriptionEn !== undefined && { descriptionEn: body.descriptionEn }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.priority !== undefined && { priority: body.priority }),
        ...(body.actionOwnerId !== undefined && { actionOwnerId: body.actionOwnerId || null }),
        ...(body.monitorOwnerId !== undefined && { monitorOwnerId: body.monitorOwnerId || null }),
        ...(body.dueDate !== undefined && { dueDate: body.dueDate ? new Date(body.dueDate) : null }),
        ...(body.order !== undefined && { order: body.order }),
        ...(body.oneDriveUrl !== undefined && { oneDriveUrl: body.oneDriveUrl }),
        ...(body.oneDriveFileName !== undefined && { oneDriveFileName: body.oneDriveFileName }),
        ...(body.completedAt !== undefined && { completedAt: body.completedAt ? new Date(body.completedAt) : null }),
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

    console.log('Task updated successfully:', task.id);

    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث المهمة' },
      { status: 500 }
    );
  }
}

// DELETE - حذف مهمة
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; treatmentId: string; taskId: string }> }
) {
  try {
    const { id: riskId, treatmentId, taskId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    // التحقق من وجود المهمة
    const existingTask = await prisma.treatmentTask.findFirst({
      where: {
        id: taskId,
        treatmentPlanId: treatmentId,
        treatmentPlan: { riskId },
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        { success: false, error: 'المهمة غير موجودة' },
        { status: 404 }
      );
    }

    // حذف المهمة
    await prisma.treatmentTask.delete({
      where: { id: taskId },
    });

    console.log('Task deleted successfully:', taskId);

    return NextResponse.json({
      success: true,
      message: 'تم حذف المهمة بنجاح',
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حذف المهمة' },
      { status: 500 }
    );
  }
}
