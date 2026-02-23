import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { checkRateLimit, getClientIP, rateLimitConfigs } from '@/lib/rate-limit';

// GET - جلب الالتزامات حسب الشهر للتقويم
export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(`compliance-calendar-${clientIP}`, rateLimitConfigs.standard);
    if (!rateLimit.success) {
      return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

    // بداية ونهاية الشهر
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const where = { isActive: true };

    // جلب الالتزامات المستحقة في هذا الشهر
    const obligations = await prisma.complianceObligation.findMany({
      where: {
        ...where,
        nextDueDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      select: {
        id: true,
        code: true,
        titleAr: true,
        titleEn: true,
        nextDueDate: true,
        complianceStatus: true,
        criticalityLevel: true,
        recurrence: true,
        completionPercentage: true,
        domain: { select: { id: true, nameAr: true, nameEn: true, code: true } },
      },
      orderBy: { nextDueDate: 'asc' },
    });

    // إحصائيات الشهر
    const today = new Date();
    const totalDue = obligations.length;
    const overdue = obligations.filter(o => o.nextDueDate && new Date(o.nextDueDate) < today && o.complianceStatus !== 'compliant').length;
    const compliant = obligations.filter(o => o.complianceStatus === 'compliant').length;
    const nonCompliant = obligations.filter(o => o.complianceStatus === 'nonCompliant').length;

    return NextResponse.json({
      success: true,
      data: {
        obligations,
        stats: {
          totalDue,
          overdue,
          compliant,
          nonCompliant,
        },
        month,
        year,
      },
    });
  } catch (error) {
    console.error('Error fetching compliance calendar:', error);
    return NextResponse.json({ success: false, error: 'فشل في جلب بيانات التقويم' }, { status: 500 });
  }
}
