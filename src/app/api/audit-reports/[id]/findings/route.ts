import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

const ALLOWED_ROLES = ['admin', 'riskManager'];

// POST - إضافة ملاحظة جديدة لتقرير المراجعة
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request, { roles: ALLOWED_ROLES as any });
  if ('error' in authResult) return authResult.error;

  try {
    const { id: reportId } = await params;
    const body = await request.json();

    // التحقق من وجود التقرير
    const report = await prisma.auditReport.findUnique({
      where: { id: reportId },
      select: { id: true, reportNumber: true },
    });

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'التقرير غير موجود' },
        { status: 404 }
      );
    }

    // Generate finding number
    const existingFindings = await prisma.auditFinding.count({
      where: { reportId },
    });
    const findingNumber = `${report.reportNumber}-F${String(existingFindings + 1).padStart(2, '0')}`;

    const finding = await prisma.auditFinding.create({
      data: {
        reportId,
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
        status: 'open',
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        createdById: authResult.userId,
      },
      include: {
        department: {
          select: { id: true, nameAr: true, nameEn: true },
        },
        assignee: {
          select: { id: true, fullName: true, fullNameEn: true, email: true },
        },
        risk: {
          select: { id: true, riskNumber: true, titleAr: true, titleEn: true },
        },
        createdBy: {
          select: { id: true, fullName: true, fullNameEn: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: finding });
  } catch (error) {
    console.error('Error creating audit finding:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء الملاحظة' },
      { status: 500 }
    );
  }
}
