import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET - جلب المناقشات لخطة المعالجة
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

    // جلب المناقشات الرئيسية (بدون parent) مع الردود
    const discussions = await prisma.treatmentDiscussion.findMany({
      where: {
        treatmentPlanId: treatmentId,
        parentId: null, // فقط التعليقات الرئيسية
      },
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
        replies: {
          orderBy: { createdAt: 'asc' },
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
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: discussions,
    });
  } catch (error) {
    console.error('Error fetching treatment discussions:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب المناقشات' },
      { status: 500 }
    );
  }
}

// POST - إضافة تعليق/مناقشة جديدة
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
      content,
      type,
      parentId,
      attachmentUrl,
      attachmentName,
      mentionedUserIds,
    } = body;

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'محتوى التعليق مطلوب' },
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

    // إذا كان رد على تعليق، التحقق من وجود التعليق الأصلي
    if (parentId) {
      const parentComment = await prisma.treatmentDiscussion.findUnique({
        where: { id: parentId },
        select: { id: true },
      });

      if (!parentComment) {
        return NextResponse.json(
          { success: false, error: 'التعليق الأصلي غير موجود' },
          { status: 404 }
        );
      }
    }

    // إنشاء المناقشة
    const discussion = await prisma.treatmentDiscussion.create({
      data: {
        treatmentPlanId: treatmentId,
        authorId: session.user.id,
        content: content.trim(),
        type: type || 'comment',
        parentId: parentId || null,
        attachmentUrl: attachmentUrl || null,
        attachmentName: attachmentName || null,
        mentionedUserIds: mentionedUserIds ? JSON.stringify(mentionedUserIds) : null,
      },
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
        replies: {
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
        },
      },
    });

    // إرسال إشعارات للمستخدمين المذكورين
    if (mentionedUserIds && Array.isArray(mentionedUserIds) && mentionedUserIds.length > 0) {
      const notifications = mentionedUserIds.map((userId: string) => ({
        userId,
        type: 'treatment_discussion_mention',
        titleAr: 'تم ذكرك في مناقشة',
        titleEn: 'You were mentioned in a discussion',
        messageAr: `قام ${session.user.name || 'مستخدم'} بذكرك في مناقشة خطة المعالجة`,
        messageEn: `${session.user.name || 'A user'} mentioned you in a treatment plan discussion`,
        link: `/treatment/${treatmentId}`,
      }));

      await prisma.notification.createMany({
        data: notifications,
      });
    }

    return NextResponse.json({
      success: true,
      data: discussion,
    });
  } catch (error) {
    console.error('Error creating treatment discussion:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إضافة التعليق' },
      { status: 500 }
    );
  }
}

// PATCH - تحديث تعليق (وضع علامة محلول، تعديل المحتوى)
export async function PATCH(
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

    const body = await request.json();
    const { discussionId, content, isResolved } = body;

    if (!discussionId) {
      return NextResponse.json(
        { success: false, error: 'معرف التعليق مطلوب' },
        { status: 400 }
      );
    }

    // جلب التعليق
    const existingDiscussion = await prisma.treatmentDiscussion.findUnique({
      where: { id: discussionId },
      select: { id: true, authorId: true },
    });

    if (!existingDiscussion) {
      return NextResponse.json(
        { success: false, error: 'التعليق غير موجود' },
        { status: 404 }
      );
    }

    // التحقق من الصلاحية (المؤلف أو admin أو riskManager)
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (
      existingDiscussion.authorId !== session.user.id &&
      !['admin', 'riskManager'].includes(currentUser?.role || '')
    ) {
      return NextResponse.json(
        { success: false, error: 'ليس لديك صلاحية تعديل هذا التعليق' },
        { status: 403 }
      );
    }

    // بناء بيانات التحديث
    const updateData: {
      content?: string;
      isResolved?: boolean;
    } = {};

    if (content !== undefined) updateData.content = content.trim();
    if (isResolved !== undefined) updateData.isResolved = isResolved;

    const discussion = await prisma.treatmentDiscussion.update({
      where: { id: discussionId },
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
        replies: {
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
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: discussion,
    });
  } catch (error) {
    console.error('Error updating treatment discussion:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث التعليق' },
      { status: 500 }
    );
  }
}

// DELETE - حذف تعليق
export async function DELETE(
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

    const { searchParams } = new URL(request.url);
    const discussionId = searchParams.get('discussionId');

    if (!discussionId) {
      return NextResponse.json(
        { success: false, error: 'معرف التعليق مطلوب' },
        { status: 400 }
      );
    }

    // جلب التعليق
    const discussion = await prisma.treatmentDiscussion.findUnique({
      where: { id: discussionId },
      select: { authorId: true },
    });

    if (!discussion) {
      return NextResponse.json(
        { success: false, error: 'التعليق غير موجود' },
        { status: 404 }
      );
    }

    // التحقق من الصلاحية (المؤلف أو admin أو riskManager)
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (
      discussion.authorId !== session.user.id &&
      !['admin', 'riskManager'].includes(currentUser?.role || '')
    ) {
      return NextResponse.json(
        { success: false, error: 'ليس لديك صلاحية حذف هذا التعليق' },
        { status: 403 }
      );
    }

    await prisma.treatmentDiscussion.delete({
      where: { id: discussionId },
    });

    return NextResponse.json({
      success: true,
      message: 'تم حذف التعليق بنجاح',
    });
  } catch (error) {
    console.error('Error deleting treatment discussion:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حذف التعليق' },
      { status: 500 }
    );
  }
}
