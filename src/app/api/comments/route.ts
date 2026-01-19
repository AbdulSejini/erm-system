import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

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
