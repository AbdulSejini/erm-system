import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET - جلب تحديثات المهمة
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

    // جلب التحديثات
    const updates = await prisma.taskUpdate.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
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
      data: updates,
    });
  } catch (error) {
    console.error('Error fetching task updates:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب التحديثات' },
      { status: 500 }
    );
  }
}

// POST - إضافة تحديث جديد
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
    const { content, type, newStatus, progress, attachmentUrl, attachmentName } = body;

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'محتوى التحديث مطلوب' },
        { status: 400 }
      );
    }

    // التحقق من وجود المهمة وجلب حالتها الحالية
    const task = await prisma.treatmentTask.findUnique({
      where: { id: taskId },
      select: { id: true, status: true },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'المهمة غير موجودة' },
        { status: 404 }
      );
    }

    // إنشاء التحديث
    const updateData: {
      taskId: string;
      authorId: string;
      content: string;
      type: string;
      oldStatus?: string;
      newStatus?: string;
      progress?: number;
      attachmentUrl?: string;
      attachmentName?: string;
    } = {
      taskId,
      authorId: session.user.id,
      content: content.trim(),
      type: type || 'update',
    };

    // إذا كان تغيير حالة
    if (type === 'statusChange' && newStatus) {
      updateData.oldStatus = task.status;
      updateData.newStatus = newStatus;

      // تحديث حالة المهمة
      await prisma.treatmentTask.update({
        where: { id: taskId },
        data: {
          status: newStatus,
          completionDate: newStatus === 'completed' ? new Date() : null,
        },
      });
    }

    // إضافة نسبة الإنجاز إن وجدت
    if (progress !== undefined && progress !== null) {
      updateData.progress = progress;
    }

    // إضافة المرفق إن وجد
    if (attachmentUrl) {
      updateData.attachmentUrl = attachmentUrl;
      updateData.attachmentName = attachmentName || 'مرفق';
    }

    const update = await prisma.taskUpdate.create({
      data: updateData,
      include: {
        author: {
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
      data: update,
    });
  } catch (error) {
    console.error('Error creating task update:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إضافة التحديث' },
      { status: 500 }
    );
  }
}

// DELETE - حذف تحديث (للمؤلف فقط أو المسؤولين)
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
    const updateId = searchParams.get('updateId');

    if (!updateId) {
      return NextResponse.json(
        { success: false, error: 'معرف التحديث مطلوب' },
        { status: 400 }
      );
    }

    // جلب التحديث
    const update = await prisma.taskUpdate.findUnique({
      where: { id: updateId },
      select: { authorId: true },
    });

    if (!update) {
      return NextResponse.json(
        { success: false, error: 'التحديث غير موجود' },
        { status: 404 }
      );
    }

    // التحقق من الصلاحية (المؤلف أو admin أو riskManager)
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (
      update.authorId !== session.user.id &&
      !['admin', 'riskManager'].includes(currentUser?.role || '')
    ) {
      return NextResponse.json(
        { success: false, error: 'ليس لديك صلاحية حذف هذا التحديث' },
        { status: 403 }
      );
    }

    await prisma.taskUpdate.delete({
      where: { id: updateId },
    });

    return NextResponse.json({
      success: true,
      message: 'تم حذف التحديث بنجاح',
    });
  } catch (error) {
    console.error('Error deleting task update:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حذف التحديث' },
      { status: 500 }
    );
  }
}
