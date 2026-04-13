import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

const ALLOWED_ROLES = ['admin', 'riskManager'];

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request, { roles: ALLOWED_ROLES as any });
  if ('error' in authResult) return authResult.error;

  try {
    const engagements = await prisma.auditEngagement.findMany({
      include: {
        createdBy: { select: { id: true, fullName: true, fullNameEn: true } },
        dataRequests: { select: { id: true, status: true } },
        findings: {
          select: {
            id: true, status: true, severity: true,
            actions: { select: { id: true, status: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: engagements });
  } catch (error) {
    console.error('Error fetching audit engagements:', error);
    return NextResponse.json({ success: false, error: 'فشل في جلب المراجعات' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request, { roles: ALLOWED_ROLES as any });
  if ('error' in authResult) return authResult.error;

  try {
    const body = await request.json();
    const year = new Date().getFullYear();
    const last = await prisma.auditEngagement.findFirst({
      where: { engagementNumber: { startsWith: `AE-${year}-` } },
      orderBy: { engagementNumber: 'desc' },
    });
    const seq = last ? parseInt(last.engagementNumber.split('-')[2]) + 1 : 1;
    const engagementNumber = `AE-${year}-${String(seq).padStart(3, '0')}`;

    const engagement = await prisma.auditEngagement.create({
      data: {
        engagementNumber,
        titleAr: body.titleAr,
        titleEn: body.titleEn || null,
        auditorName: body.auditorName || null,
        auditorContact: body.auditorContact || null,
        auditorEmail: body.auditorEmail || null,
        scopeAr: body.scopeAr || null,
        scopeEn: body.scopeEn || null,
        currentPhase: 'kickoff',
        kickoffDate: body.kickoffDate ? new Date(body.kickoffDate) : new Date(),
        status: 'active',
        createdById: authResult.userId,
      },
    });

    return NextResponse.json({ success: true, data: engagement });
  } catch (error) {
    console.error('Error creating audit engagement:', error);
    return NextResponse.json({ success: false, error: 'فشل في إنشاء المراجعة' }, { status: 500 });
  }
}
