import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - جلب سجل التعديلات للخطر
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: riskId } = await params;
    const { searchParams } = new URL(request.url);

    // معاملات التصفية
    const changeType = searchParams.get('changeType');
    const changeCategory = searchParams.get('changeCategory');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    // التحقق من وجود الخطر
    const risk = await prisma.risk.findUnique({
      where: { id: riskId },
      select: { id: true }
    });

    if (!risk) {
      return NextResponse.json(
        { success: false, error: 'الخطر غير موجود' },
        { status: 404 }
      );
    }

    // بناء شروط البحث
    const where: Record<string, unknown> = { riskId };

    if (changeType) {
      where.changeType = changeType;
    }

    if (changeCategory) {
      where.changeCategory = changeCategory;
    }

    // جلب سجل التعديلات
    const [changeLogs, total] = await Promise.all([
      prisma.riskChangeLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              fullNameEn: true,
              avatar: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit ? parseInt(limit) : 50,
        skip: offset ? parseInt(offset) : 0,
      }),
      prisma.riskChangeLog.count({ where }),
    ]);

    // تجميع التغييرات حسب التاريخ والمستخدم
    const groupedLogs = changeLogs.reduce((acc, log) => {
      const dateKey = new Date(log.createdAt).toISOString().split('T')[0];
      const userKey = log.userId;
      const key = `${dateKey}-${userKey}`;

      if (!acc[key]) {
        acc[key] = {
          date: dateKey,
          user: log.user,
          changes: [],
        };
      }

      acc[key].changes.push({
        id: log.id,
        changeType: log.changeType,
        changeCategory: log.changeCategory,
        fieldName: log.fieldName,
        fieldNameAr: log.fieldNameAr,
        oldValue: log.oldValue,
        newValue: log.newValue,
        description: log.description,
        descriptionAr: log.descriptionAr,
        relatedEntityId: log.relatedEntityId,
        createdAt: log.createdAt,
      });

      return acc;
    }, {} as Record<string, { date: string; user: unknown; changes: unknown[] }>);

    return NextResponse.json({
      success: true,
      data: {
        logs: changeLogs,
        grouped: Object.values(groupedLogs),
        pagination: {
          total,
          limit: limit ? parseInt(limit) : 50,
          offset: offset ? parseInt(offset) : 0,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching risk changelog:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب سجل التعديلات' },
      { status: 500 }
    );
  }
}
