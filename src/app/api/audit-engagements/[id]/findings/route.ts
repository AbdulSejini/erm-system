import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

const ALLOWED_ROLES = ['admin', 'riskManager'];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request, { roles: ALLOWED_ROLES as any });
  if ('error' in authResult) return authResult.error;

  try {
    const { id: engagementId } = await params;
    const body = await request.json();

    const engagement = await prisma.auditEngagement.findUnique({
      where: { id: engagementId },
      select: { engagementNumber: true },
    });
    if (!engagement) {
      return NextResponse.json({ success: false, error: 'غير موجود' }, { status: 404 });
    }

    const count = await prisma.auditFinding.count({ where: { engagementId } });
    const findingNumber = `${engagement.engagementNumber}-F${String(count + 1).padStart(2, '0')}`;

    const finding = await prisma.auditFinding.create({
      data: {
        engagementId,
        findingNumber,
        titleAr: body.titleAr,
        titleEn: body.titleEn || null,
        descriptionAr: body.descriptionAr || null,
        descriptionEn: body.descriptionEn || null,
        type: body.type || 'observation',
        severity: body.severity || 'medium',
        departmentId: body.departmentId || null,
        assigneeId: body.assigneeId || null,
        riskId: body.riskId || null,
        managementResponseAr: body.managementResponseAr || null,
        managementResponseEn: body.managementResponseEn || null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        status: 'open',
        createdById: authResult.userId,
      },
      include: {
        department: { select: { id: true, nameAr: true, nameEn: true } },
        assignee: { select: { id: true, fullName: true, fullNameEn: true, email: true } },
        risk: { select: { id: true, riskNumber: true, titleAr: true, titleEn: true } },
      },
    });

    return NextResponse.json({ success: true, data: finding });
  } catch (error) {
    console.error('Error creating finding:', error);
    return NextResponse.json({ success: false, error: 'فشل في إنشاء الملاحظة' }, { status: 500 });
  }
}
