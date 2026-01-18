import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// PATCH - تحديث تعليق
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id: riskId, commentId } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // الحصول على التعليق
    const existingComment = await prisma.riskComment.findUnique({
      where: { id: commentId },
    });

    if (!existingComment) {
      return NextResponse.json(
        { success: false, error: 'التعليق غير موجود' },
        { status: 404 }
      );
    }

    // التحقق من أن الخطر صحيح
    if (existingComment.riskId !== riskId) {
      return NextResponse.json(
        { success: false, error: 'التعليق لا ينتمي لهذا الخطر' },
        { status: 400 }
      );
    }

    // الحصول على معلومات المستخدم
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // التحقق من الصلاحية: يمكن فقط لكاتب التعليق أو المسؤول تعديله
    const canEdit = existingComment.authorId === user.id ||
                    ['admin', 'riskManager'].includes(user.role);

    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: 'ليس لديك صلاحية تعديل هذا التعليق' },
        { status: 403 }
      );
    }

    // تحديث التعليق
    const updateData: Record<string, unknown> = {};

    if (body.content !== undefined) {
      updateData.content = body.content.trim();
    }

    // فقط إدارة المخاطر يمكنها تغيير حالة التعليق الداخلي
    if (body.isInternal !== undefined && ['admin', 'riskManager', 'riskAnalyst'].includes(user.role)) {
      updateData.isInternal = body.isInternal;
    }

    const comment = await prisma.riskComment.update({
      where: { id: commentId },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            fullNameEn: true,
            role: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: comment,
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث التعليق' },
      { status: 500 }
    );
  }
}

// DELETE - حذف تعليق
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id: riskId, commentId } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    // الحصول على التعليق
    const existingComment = await prisma.riskComment.findUnique({
      where: { id: commentId },
    });

    if (!existingComment) {
      return NextResponse.json(
        { success: false, error: 'التعليق غير موجود' },
        { status: 404 }
      );
    }

    // التحقق من أن الخطر صحيح
    if (existingComment.riskId !== riskId) {
      return NextResponse.json(
        { success: false, error: 'التعليق لا ينتمي لهذا الخطر' },
        { status: 400 }
      );
    }

    // الحصول على معلومات المستخدم
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // التحقق من الصلاحية: يمكن فقط لكاتب التعليق أو المسؤول حذفه
    const canDelete = existingComment.authorId === user.id ||
                      ['admin', 'riskManager'].includes(user.role);

    if (!canDelete) {
      return NextResponse.json(
        { success: false, error: 'ليس لديك صلاحية حذف هذا التعليق' },
        { status: 403 }
      );
    }

    // حذف التعليق (سيحذف الردود تلقائياً بسبب onDelete: Cascade)
    await prisma.riskComment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({
      success: true,
      message: 'تم حذف التعليق بنجاح',
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حذف التعليق' },
      { status: 500 }
    );
  }
}
