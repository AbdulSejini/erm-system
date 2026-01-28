import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET - الحصول على تعليقات خطر معين
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: riskId } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    // الحصول على معلومات المستخدم
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        accessibleDepartments: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // الحصول على الخطر للتحقق من الصلاحيات
    const risk = await prisma.risk.findUnique({
      where: { id: riskId },
      select: {
        id: true,
        departmentId: true,
        ownerId: true,
        riskOwnerId: true,
        championId: true,
      },
    });

    if (!risk) {
      return NextResponse.json(
        { success: false, error: 'الخطر غير موجود' },
        { status: 404 }
      );
    }

    // التحقق من صلاحية الوصول
    const hasAccess = await checkRiskAccess(user, risk);
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'ليس لديك صلاحية الوصول لهذا الخطر' },
        { status: 403 }
      );
    }

    // تحديد ما إذا كان المستخدم من إدارة المخاطر (يمكنه رؤية التعليقات الداخلية)
    const canViewInternal = ['admin', 'riskManager', 'riskAnalyst'].includes(user.role);

    // الحصول على التعليقات الرئيسية فقط
    const comments = await prisma.riskComment.findMany({
      where: {
        riskId,
        parentId: null, // فقط التعليقات الرئيسية
        // إخفاء التعليقات الداخلية من غير إدارة المخاطر
        ...(canViewInternal ? {} : { isInternal: false }),
      },
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
        replies: {
          where: canViewInternal ? {} : { isInternal: false },
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
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: comments,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب التعليقات' },
      { status: 500 }
    );
  }
}

// POST - إضافة تعليق جديد
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: riskId } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // التحقق من البيانات المطلوبة
    if (!body.content || body.content.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'محتوى التعليق مطلوب' },
        { status: 400 }
      );
    }

    // الحصول على معلومات المستخدم
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        accessibleDepartments: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // الحصول على الخطر للتحقق من الصلاحيات
    const risk = await prisma.risk.findUnique({
      where: { id: riskId },
      select: {
        id: true,
        riskNumber: true,
        titleAr: true,
        titleEn: true,
        departmentId: true,
        ownerId: true,
        riskOwnerId: true,
        championId: true,
      },
    });

    if (!risk) {
      return NextResponse.json(
        { success: false, error: 'الخطر غير موجود' },
        { status: 404 }
      );
    }

    // التحقق من صلاحية الوصول
    const hasAccess = await checkRiskAccess(user, risk);
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'ليس لديك صلاحية الوصول لهذا الخطر' },
        { status: 403 }
      );
    }

    // التحقق من إمكانية إنشاء تعليق داخلي
    const canCreateInternal = ['admin', 'riskManager', 'riskAnalyst'].includes(user.role);
    const isInternal = body.isInternal && canCreateInternal;

    // إنشاء التعليق
    const comment = await prisma.riskComment.create({
      data: {
        riskId,
        authorId: session.user.id,
        content: body.content.trim(),
        type: body.type || 'comment',
        parentId: body.parentId || null,
        isInternal,
        attachments: body.attachments ? JSON.stringify(body.attachments) : null,
      },
      select: {
        id: true,
        content: true,
        type: true,
        parentId: true,
        isInternal: true,
        attachments: true,
        createdAt: true,
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

    // إرسال الإشعارات
    await sendCommentNotifications(risk, comment, user, isInternal);

    return NextResponse.json({
      success: true,
      data: comment,
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء التعليق' },
      { status: 500 }
    );
  }
}

// دالة التحقق من صلاحية الوصول للخطر
async function checkRiskAccess(
  user: {
    id: string;
    role: string;
    departmentId: string | null;
    accessibleDepartments: { departmentId: string; canView: boolean }[];
  },
  risk: {
    id: string;
    departmentId: string;
    ownerId: string;
    riskOwnerId: string | null;
    championId: string | null;
  }
): Promise<boolean> {
  // المسؤول ومدير المخاطر ومحلل المخاطر لديهم صلاحية كاملة
  if (['admin', 'riskManager', 'riskAnalyst'].includes(user.role)) {
    return true;
  }

  // مالك الخطر (User)
  if (risk.ownerId === user.id) {
    return true;
  }

  // رائد الخطر
  if (risk.championId === user.id) {
    return true;
  }

  // التحقق من الإدارة الأساسية للمستخدم
  if (user.departmentId === risk.departmentId) {
    return true;
  }

  // التحقق من الإدارات الإضافية للمستخدم
  const hasAccessToDepartment = user.accessibleDepartments.some(
    (access) => access.departmentId === risk.departmentId && access.canView
  );

  if (hasAccessToDepartment) {
    return true;
  }

  // التحقق من مالك الخطر (RiskOwner) - إذا كان المستخدم مرتبط به
  if (risk.riskOwnerId) {
    const riskOwner = await prisma.riskOwner.findUnique({
      where: { id: risk.riskOwnerId },
      select: { email: true },
    });

    if (riskOwner) {
      const userByEmail = await prisma.user.findUnique({
        where: { email: riskOwner.email || '' },
      });

      if (userByEmail && userByEmail.id === user.id) {
        return true;
      }
    }
  }

  return false;
}

// دالة إرسال الإشعارات عند إضافة تعليق
// الإشعارات تصل للمستخدمين حسب وظيفتهم والأقسام المتاحة لهم
// من أضاف التعليق لا يستلم إشعار
async function sendCommentNotifications(
  risk: {
    id: string;
    riskNumber: string;
    titleAr: string;
    titleEn: string;
    departmentId: string;
    ownerId: string;
    riskOwnerId: string | null;
    championId: string | null;
  },
  comment: {
    id: string;
    content: string;
    parentId?: string | null;
    author: {
      id: string;
      fullName: string;
      fullNameEn: string | null;
    };
  },
  currentUser: {
    id: string;
    fullName: string;
  },
  isInternal: boolean
) {
  try {
    const notificationRecipients = new Set<string>();

    // 1. صاحب الخطر (ownerId - User)
    if (risk.ownerId !== currentUser.id) {
      notificationRecipients.add(risk.ownerId);
    }

    // 2. صاحب الخطر (riskOwnerId - RiskOwner) - البحث عن المستخدم المرتبط بالبريد
    if (risk.riskOwnerId) {
      const riskOwner = await prisma.riskOwner.findUnique({
        where: { id: risk.riskOwnerId },
        select: { email: true },
      });

      if (riskOwner?.email) {
        const riskOwnerUser = await prisma.user.findUnique({
          where: { email: riskOwner.email },
          select: { id: true, status: true },
        });

        if (riskOwnerUser && riskOwnerUser.status === 'active' && riskOwnerUser.id !== currentUser.id) {
          notificationRecipients.add(riskOwnerUser.id);
        }
      }
    }

    // 3. رائد المخاطر للخطر (championId)
    if (risk.championId && risk.championId !== currentUser.id) {
      notificationRecipients.add(risk.championId);
    }

    // 4. رائد المخاطر للوظيفة/القسم (department.riskChampionId)
    const department = await prisma.department.findUnique({
      where: { id: risk.departmentId },
      select: {
        riskChampionId: true,
        code: true,
        nameAr: true,
      },
    });

    if (department?.riskChampionId && department.riskChampionId !== currentUser.id) {
      notificationRecipients.add(department.riskChampionId);
    }

    // 5. فريق إدارة المخاطر (admin, riskManager, riskAnalyst)
    // يستلمون إشعارات لجميع التعليقات
    const riskManagementTeam = await prisma.user.findMany({
      where: {
        role: { in: ['admin', 'riskManager', 'riskAnalyst'] },
        status: 'active',
        id: { not: currentUser.id },
      },
      select: { id: true },
    });

    for (const member of riskManagementTeam) {
      notificationRecipients.add(member.id);
    }

    // 6. المستخدمين في نفس الوظيفة/القسم (departmentId)
    // مثال: جميع مستخدمي الصيانة MAI يستلمون إشعار للخطر MAI-R-643
    const departmentUsers = await prisma.user.findMany({
      where: {
        departmentId: risk.departmentId,
        status: 'active',
        id: { not: currentUser.id },
      },
      select: { id: true },
    });

    for (const user of departmentUsers) {
      notificationRecipients.add(user.id);
    }

    // 7. المستخدمين الذين لديهم صلاحية الوصول للوظيفة (UserDepartmentAccess)
    // مثال: مستخدم لديه وصول لـ MAI يستلم إشعار للخطر MAI-R-643
    const usersWithAccess = await prisma.userDepartmentAccess.findMany({
      where: {
        departmentId: risk.departmentId,
        canView: true,
        user: {
          status: 'active',
          id: { not: currentUser.id },
        },
      },
      select: { userId: true },
    });

    for (const access of usersWithAccess) {
      notificationRecipients.add(access.userId);
    }

    // 8. رواد المخاطر الذين يديرون الوظيفة/القسم (championDepartments)
    // البحث عن جميع رواد المخاطر المسؤولين عن هذا القسم
    const championUsers = await prisma.user.findMany({
      where: {
        role: 'riskChampion',
        status: 'active',
        id: { not: currentUser.id },
        championDepartments: {
          some: { id: risk.departmentId },
        },
      },
      select: { id: true },
    });

    for (const champion of championUsers) {
      notificationRecipients.add(champion.id);
    }

    // 9. إذا كان التعليق رداً، نرسل إشعار لصاحب التعليق الأصلي
    if (comment.parentId) {
      const originalComment = await prisma.riskComment.findUnique({
        where: { id: comment.parentId },
        select: { authorId: true },
      });

      if (originalComment && originalComment.authorId !== currentUser.id) {
        // التحقق من أن المستخدم نشط
        const originalAuthor = await prisma.user.findUnique({
          where: { id: originalComment.authorId },
          select: { status: true },
        });
        if (originalAuthor?.status === 'active') {
          notificationRecipients.add(originalComment.authorId);
        }
      }
    }

    // إنشاء الإشعارات
    const shortContent = comment.content.length > 50
      ? comment.content.substring(0, 50) + '...'
      : comment.content;

    const notifications = Array.from(notificationRecipients).map((userId) => ({
      userId,
      type: 'newComment',
      titleAr: `تعليق جديد على الخطر ${risk.riskNumber}`,
      titleEn: `New comment on risk ${risk.riskNumber}`,
      messageAr: `قام ${currentUser.fullName} بإضافة تعليق: "${shortContent}"`,
      messageEn: `${comment.author.fullNameEn || currentUser.fullName} added a comment: "${shortContent}"`,
      link: `/risks/${risk.id}`,
      isRead: false,
    }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications,
      });
    }

    console.log(`Sent ${notifications.length} notifications for comment on risk ${risk.riskNumber} (${department?.code || 'N/A'})`);
  } catch (error) {
    console.error('Error sending comment notifications:', error);
    // لا نريد أن يفشل إنشاء التعليق بسبب فشل الإشعارات
  }
}
