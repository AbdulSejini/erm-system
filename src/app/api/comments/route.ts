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

    if (targetType === 'user' && targetUserId) {
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

    const notifications = Array.from(notificationRecipients).map((userId) => ({
      userId,
      type: 'directMessage',
      titleAr: targetType === 'department'
        ? `رسالة جديدة لإدارة ${targetName}`
        : `رسالة جديدة من ${user.fullName}`,
      titleEn: targetType === 'department'
        ? `New message for department`
        : `New message from ${user.fullNameEn || user.fullName}`,
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

    console.log(`Sent ${notifications.length} direct notifications (targetType: ${targetType})`);

    return NextResponse.json({
      success: true,
      data: {
        message: 'تم إرسال الرسالة بنجاح',
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

// GET - الحصول على جميع التعليقات مع التصفية
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

    // بناء شروط التصفية
    const whereClause: Record<string, unknown> = {
      parentId: null, // فقط التعليقات الرئيسية
    };

    // التصفية حسب الصلاحيات
    const isRiskManagement = ['admin', 'riskManager', 'riskAnalyst'].includes(user.role);

    if (!isRiskManagement) {
      // إخفاء التعليقات الداخلية
      whereClause.isInternal = false;

      // تصفية المخاطر حسب صلاحيات المستخدم
      const accessibleDeptIds = user.accessibleDepartments.map(d => d.departmentId);
      if (user.departmentId) {
        accessibleDeptIds.push(user.departmentId);
      }

      whereClause.risk = {
        OR: [
          { departmentId: { in: accessibleDeptIds } },
          { ownerId: user.id },
          { championId: user.id },
        ],
      };
    }

    // البحث في محتوى التعليق
    if (search) {
      whereClause.content = { contains: search, mode: 'insensitive' };
    }

    // التصفية حسب الإدارة
    if (departmentId) {
      whereClause.risk = {
        ...((whereClause.risk as object) || {}),
        departmentId,
      };
    }

    // التصفية حسب الخطر
    if (riskId) {
      whereClause.riskId = riskId;
    }

    // التصفية حسب الكاتب
    if (authorId) {
      whereClause.authorId = authorId;
    }

    // التصفية حسب نوع التعليق
    if (type) {
      whereClause.type = type;
    }

    // التصفية حسب التاريخ
    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) {
        (whereClause.createdAt as Record<string, Date>).gte = new Date(dateFrom);
      }
      if (dateTo) {
        (whereClause.createdAt as Record<string, Date>).lte = new Date(dateTo);
      }
    }

    // جلب التعليقات مع التقسيم
    const [comments, total] = await Promise.all([
      prisma.riskComment.findMany({
        where: whereClause,
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
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.riskComment.count({ where: whereClause }),
    ]);

    // إحصائيات عامة
    const stats = await prisma.riskComment.groupBy({
      by: ['type'],
      _count: true,
      where: isRiskManagement ? { parentId: null } : { parentId: null, isInternal: false },
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [todayCount, weekCount] = await Promise.all([
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
    ]);

    return NextResponse.json({
      success: true,
      data: {
        comments,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
        stats: {
          byType: stats.reduce((acc, s) => ({ ...acc, [s.type]: s._count }), {}),
          today: todayCount,
          thisWeek: weekCount,
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
