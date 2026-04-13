import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

const ALLOWED_ROLES = ['admin', 'riskManager'];

// GET - جلب جميع تقارير المراجعة الداخلية
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request, { roles: ALLOWED_ROLES as any });
  if ('error' in authResult) return authResult.error;

  try {
    const reports = await prisma.auditReport.findMany({
      include: {
        department: {
          select: { id: true, nameAr: true, nameEn: true },
        },
        createdBy: {
          select: { id: true, fullName: true, fullNameEn: true },
        },
        findings: {
          select: {
            id: true,
            status: true,
            severity: true,
            actions: {
              select: { id: true, status: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // حساب الإحصائيات
    const allFindings = reports.flatMap((r) => r.findings);
    const allActions = allFindings.flatMap((f) => f.actions);

    const stats = {
      totalReports: reports.length,
      openReports: reports.filter((r) => r.status === 'open').length,
      inProgressReports: reports.filter((r) => r.status === 'inProgress').length,
      closedReports: reports.filter((r) => r.status === 'closed').length,
      totalFindings: allFindings.length,
      openFindings: allFindings.filter((f) => f.status === 'open').length,
      criticalFindings: allFindings.filter((f) => f.severity === 'critical' && f.status !== 'closed').length,
      totalActions: allActions.length,
      completedActions: allActions.filter((a) => a.status === 'completed').length,
      overdueActions: 0, // calculated on client side with dates
    };

    return NextResponse.json({ success: true, data: reports, stats });
  } catch (error) {
    console.error('Error fetching audit reports:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب تقارير المراجعة' },
      { status: 500 }
    );
  }
}

// POST - إنشاء تقرير مراجعة جديد
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request, { roles: ALLOWED_ROLES as any });
  if ('error' in authResult) return authResult.error;

  try {
    const body = await request.json();

    // Generate report number: AUD-YYYY-NNN
    const year = new Date().getFullYear();
    const lastReport = await prisma.auditReport.findFirst({
      where: { reportNumber: { startsWith: `AUD-${year}-` } },
      orderBy: { reportNumber: 'desc' },
    });
    const seq = lastReport
      ? parseInt(lastReport.reportNumber.split('-')[2]) + 1
      : 1;
    const reportNumber = `AUD-${year}-${String(seq).padStart(3, '0')}`;

    const report = await prisma.auditReport.create({
      data: {
        reportNumber,
        titleAr: body.titleAr,
        titleEn: body.titleEn || null,
        departmentId: body.departmentId || null,
        auditorName: body.auditorName || null,
        auditDateFrom: body.auditDateFrom ? new Date(body.auditDateFrom) : null,
        auditDateTo: body.auditDateTo ? new Date(body.auditDateTo) : null,
        reportDate: body.reportDate ? new Date(body.reportDate) : null,
        summaryAr: body.summaryAr || null,
        summaryEn: body.summaryEn || null,
        status: body.status || 'open',
        attachmentUrl: body.attachmentUrl || null,
        attachmentName: body.attachmentName || null,
        createdById: authResult.userId,
      },
      include: {
        department: {
          select: { id: true, nameAr: true, nameEn: true },
        },
        createdBy: {
          select: { id: true, fullName: true, fullNameEn: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    console.error('Error creating audit report:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء تقرير المراجعة' },
      { status: 500 }
    );
  }
}
