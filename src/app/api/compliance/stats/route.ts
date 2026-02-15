import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { checkRateLimit, getClientIP, rateLimitConfigs } from '@/lib/rate-limit';

// GET - إحصائيات لوحة تحكم الالتزام
export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(`compliance-stats-${clientIP}`, rateLimitConfigs.standard);
    if (!rateLimit.success) {
      return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const where = { isActive: true };

    // إجمالي الالتزامات
    const total = await prisma.complianceObligation.count({ where });

    // حسب الحالة
    const [compliant, partiallyCompliant, nonCompliant, notAssessed] = await Promise.all([
      prisma.complianceObligation.count({ where: { ...where, complianceStatus: 'compliant' } }),
      prisma.complianceObligation.count({ where: { ...where, complianceStatus: 'partiallyCompliant' } }),
      prisma.complianceObligation.count({ where: { ...where, complianceStatus: 'nonCompliant' } }),
      prisma.complianceObligation.count({ where: { ...where, complianceStatus: 'notAssessed' } }),
    ]);

    // حسب الخطورة
    const [critical, high, medium, low] = await Promise.all([
      prisma.complianceObligation.count({ where: { ...where, criticalityLevel: 'critical' } }),
      prisma.complianceObligation.count({ where: { ...where, criticalityLevel: 'high' } }),
      prisma.complianceObligation.count({ where: { ...where, criticalityLevel: 'medium' } }),
      prisma.complianceObligation.count({ where: { ...where, criticalityLevel: 'low' } }),
    ]);

    // حسب المجال
    const byDomain = await prisma.complianceDomain.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { obligations: { where } } },
      },
      orderBy: { order: 'asc' },
    });

    // المتأخرة (nextDueDate < today)
    const today = new Date();
    const overdue = await prisma.complianceObligation.count({
      where: {
        ...where,
        nextDueDate: { lt: today },
        complianceStatus: { not: 'compliant' },
      },
    });

    // القادمة خلال 30 يوم
    const next30Days = new Date();
    next30Days.setDate(next30Days.getDate() + 30);
    const upcomingDue = await prisma.complianceObligation.findMany({
      where: {
        ...where,
        nextDueDate: { gte: today, lte: next30Days },
      },
      select: {
        id: true,
        code: true,
        titleAr: true,
        titleEn: true,
        nextDueDate: true,
        complianceStatus: true,
        criticalityLevel: true,
        domain: { select: { nameAr: true, nameEn: true } },
      },
      orderBy: { nextDueDate: 'asc' },
      take: 20,
    });

    // حالة المعالجة
    const [remNotStarted, remInProgress, remCompleted] = await Promise.all([
      prisma.complianceObligation.count({ where: { ...where, remediationStatus: 'notStarted' } }),
      prisma.complianceObligation.count({ where: { ...where, remediationStatus: 'inProgress' } }),
      prisma.complianceObligation.count({ where: { ...where, remediationStatus: 'completed' } }),
    ]);

    // نسبة الامتثال الكلية
    const allObligations = await prisma.complianceObligation.findMany({
      where,
      select: { completionPercentage: true },
    });
    const avgCompletion = allObligations.length > 0
      ? allObligations.reduce((sum, o) => sum + (o.completionPercentage || 0), 0) / allObligations.length
      : 0;

    // حسب الجهة الرقابية
    const byRegulatoryBody = await prisma.regulatoryBody.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { obligations: { where } } },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        total,
        byStatus: { compliant, partiallyCompliant, nonCompliant, notAssessed },
        byCriticality: { critical, high, medium, low },
        byDomain: byDomain.map(d => ({
          id: d.id,
          nameAr: d.nameAr,
          nameEn: d.nameEn,
          code: d.code,
          count: d._count.obligations,
        })),
        byRegulatoryBody: byRegulatoryBody.map(rb => ({
          id: rb.id,
          nameAr: rb.nameAr,
          nameEn: rb.nameEn,
          count: rb._count.obligations,
        })),
        overdue,
        upcomingDue,
        remediation: { notStarted: remNotStarted, inProgress: remInProgress, completed: remCompleted },
        avgCompletion: Math.round(avgCompletion * 100) / 100,
      },
    });
  } catch (error) {
    console.error('Error fetching compliance stats:', error);
    return NextResponse.json({ success: false, error: 'فشل في جلب الإحصائيات' }, { status: 500 });
  }
}
