import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// POST - إنشاء تعليق موجه لإدارة أو مستخدم (بدون خطر)
export async function POST(request: NextRequest) {
  try {
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
      select: {
        id: true,
        fullName: true,
        fullNameEn: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // التحقق من صلاحية بدء المناقشات
    const canStartDiscussion = ['admin', 'riskManager', 'riskAnalyst'].includes(user.role);
    if (!canStartDiscussion) {
      return NextResponse.json(
        { success: false, error: 'ليس لديك صلاحية بدء مناقشة' },
        { status: 403 }
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

    const targetType = body.targetType || 'all';
    const targetDepartmentId = body.targetDepartmentId;
    const targetUserId = body.targetUserId;

    // التحقق من وجود هدف صحيح
    if (targetType === 'department' && !targetDepartmentId) {
      return NextResponse.json(
        { success: false, error: 'يجب اختيار إدارة' },
        { status: 400 }
      );
    }

    if (targetType === 'user' && !targetUserId) {
      return NextResponse.json(
        { success: false, error: 'يجب اختيار مستخدم' },
        { status: 400 }
      );
    }

    // إرسال الإشعارات للمستهدفين
    const notificationRecipients = new Set<string>();

    if (targetType === 'all') {
      // إرسال لجميع المستخدمين النشطين (ما عدا المرسل والـ admin)
      const allActiveUsers = await prisma.user.findMany({
        where: {
          status: 'active',
          id: { not: user.id },
          role: { not: 'admin' },
        },
        select: { id: true },
      });

      for (const activeUser of allActiveUsers) {
        notificationRecipients.add(activeUser.id);
      }
    } else if (targetType === 'user' && targetUserId) {
      // إرسال للمستخدم المحدد فقط
      if (targetUserId !== user.id) {
        const targetUser = await prisma.user.findUnique({
          where: { id: targetUserId },
          select: { id: true, status: true },
        });
        if (targetUser && targetUser.status === 'active') {
          notificationRecipients.add(targetUserId);
        }
      }
    } else if (targetType === 'department' && targetDepartmentId) {
      // إرسال لجميع منسوبي الإدارة
      const departmentUsers = await prisma.user.findMany({
        where: {
          departmentId: targetDepartmentId,
          status: 'active',
          id: { not: user.id },
          role: { not: 'admin' },
        },
        select: { id: true },
      });

      for (const deptUser of departmentUsers) {
        notificationRecipients.add(deptUser.id);
      }

      // المستخدمين الذين لديهم صلاحية الوصول
      const usersWithAccess = await prisma.userDepartmentAccess.findMany({
        where: {
          departmentId: targetDepartmentId,
          canView: true,
          user: {
            status: 'active',
            id: { not: user.id },
            role: { not: 'admin' },
          },
        },
        select: { userId: true },
      });

      for (const access of usersWithAccess) {
        notificationRecipients.add(access.userId);
      }

      // رائد المخاطر للإدارة
      const targetDepartment = await prisma.department.findUnique({
        where: { id: targetDepartmentId },
        select: { riskChampionId: true, nameAr: true, nameEn: true },
      });

      if (targetDepartment?.riskChampionId && targetDepartment.riskChampionId !== user.id) {
        notificationRecipients.add(targetDepartment.riskChampionId);
      }
    }

    // إنشاء الإشعارات
    const shortContent = body.content.length > 50
      ? body.content.substring(0, 50) + '...'
      : body.content;

    // الحصول على اسم الإدارة أو المستخدم المستهدف للرسالة
    let targetName = '';
    if (targetType === 'department' && targetDepartmentId) {
      const dept = await prisma.department.findUnique({
        where: { id: targetDepartmentId },
        select: { nameAr: true, nameEn: true },
      });
      targetName = dept?.nameAr || '';
    } else if (targetType === 'user' && targetUserId) {
      const targetUserInfo = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { fullName: true, fullNameEn: true },
      });
      targetName = targetUserInfo?.fullName || '';
    }

    const getNotificationTitle = () => {
      if (targetType === 'all') {
        return {
          ar: `رسالة عامة من ${user.fullName}`,
          en: `General message from ${user.fullNameEn || user.fullName}`,
        };
      } else if (targetType === 'department') {
        return {
          ar: `رسالة جديدة لإدارة ${targetName}`,
          en: `New message for department`,
        };
      } else {
        return {
          ar: `رسالة جديدة من ${user.fullName}`,
          en: `New message from ${user.fullNameEn || user.fullName}`,
        };
      }
    };

    const notificationTitle = getNotificationTitle();

    const notifications = Array.from(notificationRecipients).map((userId) => ({
      userId,
      type: 'directMessage',
      titleAr: notificationTitle.ar,
      titleEn: notificationTitle.en,
      messageAr: `${user.fullName}: "${shortContent}"`,
      messageEn: `${user.fullNameEn || user.fullName}: "${shortContent}"`,
      link: '/discussions',
      isRead: false,
    }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications,
      });
    }

    // حفظ الرسالة المباشرة في قاعدة البيانات
    const directMessage = await prisma.directMessage.create({
      data: {
        authorId: user.id,
        content: body.content.trim(),
        type: body.type || 'message',
        targetType,
        targetDepartmentId: targetType === 'department' ? targetDepartmentId : null,
        targetUserId: targetType === 'user' ? targetUserId : null,
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
        targetDepartment: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            code: true,
          },
        },
        targetUser: {
          select: {
            id: true,
            fullName: true,
            fullNameEn: true,
          },
        },
      },
    });

    console.log(`Sent ${notifications.length} direct notifications (targetType: ${targetType})`);

    return NextResponse.json({
      success: true,
      data: {
        message: directMessage,
        notificationsSent: notifications.length,
      },
    });
  } catch (error) {
    console.error('Error creating direct message:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إرسال الرسالة' },
      { status: 500 }
    );
  }
}

// GET - الحصول على جميع التعليقات والرسائل المباشرة مع التصفية
export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const departmentId = searchParams.get('departmentId');
    const riskId = searchParams.get('riskId');
    const authorId = searchParams.get('authorId');
    const type = searchParams.get('type');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // التصفية حسب الصلاحيات
    const isRiskManagement = ['admin', 'riskManager', 'riskAnalyst'].includes(user.role);

    // الحصول على قائمة الأقسام المتاحة للمستخدم
    const accessibleDeptIds = user.accessibleDepartments.map(d => d.departmentId);
    if (user.departmentId) {
      accessibleDeptIds.push(user.departmentId);
    }

    // ========== 1. جلب تعليقات المخاطر ==========
    const riskCommentWhere: Record<string, unknown> = {
      parentId: null,
    };

    if (!isRiskManagement) {
      riskCommentWhere.isInternal = false;
      riskCommentWhere.risk = {
        OR: [
          { departmentId: { in: accessibleDeptIds } },
          { ownerId: user.id },
          { championId: user.id },
        ],
      };
    }

    if (search) {
      riskCommentWhere.content = { contains: search, mode: 'insensitive' };
    }

    if (departmentId) {
      riskCommentWhere.risk = {
        ...((riskCommentWhere.risk as object) || {}),
        departmentId,
      };
    }

    if (riskId) {
      riskCommentWhere.riskId = riskId;
    }

    if (authorId) {
      riskCommentWhere.authorId = authorId;
    }

    if (type && type !== 'directMessage') {
      riskCommentWhere.type = type;
    }

    if (dateFrom || dateTo) {
      riskCommentWhere.createdAt = {};
      if (dateFrom) {
        (riskCommentWhere.createdAt as Record<string, Date>).gte = new Date(dateFrom);
      }
      if (dateTo) {
        (riskCommentWhere.createdAt as Record<string, Date>).lte = new Date(dateTo);
      }
    }

    // ========== 2. جلب الرسائل المباشرة ==========
    const directMessageWhere: Record<string, unknown> = {
      parentId: null,
    };

    // تصفية الرسائل المباشرة حسب الصلاحيات
    if (!isRiskManagement) {
      directMessageWhere.OR = [
        { authorId: user.id },
        { targetUserId: user.id },
        { targetDepartmentId: user.departmentId },
        { targetDepartmentId: { in: accessibleDeptIds } },
      ];
    }

    if (search) {
      directMessageWhere.content = { contains: search, mode: 'insensitive' };
    }

    if (departmentId) {
      directMessageWhere.targetDepartmentId = departmentId;
    }

    if (authorId) {
      directMessageWhere.authorId = authorId;
    }

    if (dateFrom || dateTo) {
      directMessageWhere.createdAt = {};
      if (dateFrom) {
        (directMessageWhere.createdAt as Record<string, Date>).gte = new Date(dateFrom);
      }
      if (dateTo) {
        (directMessageWhere.createdAt as Record<string, Date>).lte = new Date(dateTo);
      }
    }

    // إذا تم تحديد خطر معين، لا نعرض الرسائل المباشرة
    const shouldFetchDirectMessages = !riskId && (type === 'directMessage' || !type);

    // جلب البيانات
    const [riskComments, riskCommentsTotal, directMessages, directMessagesTotal] = await Promise.all([
      // جلب تعليقات المخاطر (إذا لم يكن النوع المحدد هو directMessage فقط)
      type !== 'directMessage' ? prisma.riskComment.findMany({
        where: riskCommentWhere,
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
          risk: {
            select: {
              id: true,
              riskNumber: true,
              titleAr: true,
              titleEn: true,
              department: {
                select: {
                  id: true,
                  nameAr: true,
                  nameEn: true,
                  code: true,
                },
              },
            },
          },
          replies: {
            where: isRiskManagement ? {} : { isInternal: false },
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
      }) : Promise.resolve([]),

      type !== 'directMessage' ? prisma.riskComment.count({ where: riskCommentWhere }) : Promise.resolve(0),

      // جلب الرسائل المباشرة
      shouldFetchDirectMessages ? prisma.directMessage.findMany({
        where: directMessageWhere,
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
          targetDepartment: {
            select: {
              id: true,
              nameAr: true,
              nameEn: true,
              code: true,
            },
          },
          targetUser: {
            select: {
              id: true,
              fullName: true,
              fullNameEn: true,
            },
          },
          replies: {
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
      }) : Promise.resolve([]),

      shouldFetchDirectMessages ? prisma.directMessage.count({ where: directMessageWhere }) : Promise.resolve(0),
    ]);

    // دمج وترتيب النتائج حسب التاريخ
    interface CommentItem {
      id: string;
      content: string;
      type: string;
      createdAt: Date;
      updatedAt: Date;
      author: {
        id: string;
        fullName: string;
        fullNameEn: string | null;
        role: string;
        avatar: string | null;
      };
      isDirectMessage: boolean;
      risk?: {
        id: string;
        riskNumber: string;
        titleAr: string;
        titleEn: string;
        department: {
          id: string;
          nameAr: string;
          nameEn: string;
          code: string;
        };
      } | null;
      targetDepartment?: {
        id: string;
        nameAr: string;
        nameEn: string;
        code: string;
      } | null;
      targetUser?: {
        id: string;
        fullName: string;
        fullNameEn: string | null;
      } | null;
      targetType?: string;
      isInternal?: boolean;
      replies: unknown[];
    }

    const allComments: CommentItem[] = [
      ...riskComments.map((c) => ({
        ...c,
        isDirectMessage: false,
        targetDepartment: null,
        targetUser: null,
        targetType: undefined,
      })),
      ...directMessages.map((m) => ({
        ...m,
        isDirectMessage: true,
        type: 'directMessage',
        risk: null,
        isInternal: false,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // تطبيق الصفحات
    const total = riskCommentsTotal + directMessagesTotal;
    const paginatedComments = allComments.slice((page - 1) * limit, page * limit);

    // إحصائيات عامة
    const stats = await prisma.riskComment.groupBy({
      by: ['type'],
      _count: true,
      where: isRiskManagement ? { parentId: null } : { parentId: null, isInternal: false },
    });

    const directMessageCount = await prisma.directMessage.count({
      where: isRiskManagement ? { parentId: null } : {
        parentId: null,
        OR: [
          { authorId: user.id },
          { targetUserId: user.id },
          { targetDepartmentId: user.departmentId },
          { targetDepartmentId: { in: accessibleDeptIds } },
        ],
      },
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [todayCount, weekCount, todayDirectCount, weekDirectCount] = await Promise.all([
      prisma.riskComment.count({
        where: {
          parentId: null,
          createdAt: { gte: todayStart },
          ...(isRiskManagement ? {} : { isInternal: false }),
        },
      }),
      prisma.riskComment.count({
        where: {
          parentId: null,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          ...(isRiskManagement ? {} : { isInternal: false }),
        },
      }),
      prisma.directMessage.count({
        where: {
          parentId: null,
          createdAt: { gte: todayStart },
        },
      }),
      prisma.directMessage.count({
        where: {
          parentId: null,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        comments: paginatedComments,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
        stats: {
          byType: {
            ...stats.reduce((acc, s) => ({ ...acc, [s.type]: s._count }), {}),
            directMessage: directMessageCount,
          },
          today: todayCount + todayDirectCount,
          thisWeek: weekCount + weekDirectCount,
          total,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب التعليقات' },
      { status: 500 }
    );
  }
}
