import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

const ALLOWED_ROLES = ['admin', 'riskManager'];

// GET - جلب تقرير مراجعة محدد مع كل التفاصيل
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request, { roles: ALLOWED_ROLES as any });
  if ('error' in authResult) return authResult.error;

  try {
    const { id } = await params;

    const report = await prisma.auditReport.findUnique({
      where: { id },
      include: {
        department: {
          select: { id: true, nameAr: true, nameEn: true },
        },
        createdBy: {
          select: { id: true, fullName: true, fullNameEn: true },
        },
        findings: {
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
            actions: {
              include: {
                assignee: {
                  select: { id: true, fullName: true, fullNameEn: true, email: true },
                },
                completedBy: {
                  select: { id: true, fullName: true, fullNameEn: true },
                },
                createdBy: {
                  select: { id: true, fullName: true, fullNameEn: true },
                },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'التقرير غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    console.error('Error fetching audit report:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب التقرير' },
      { status: 500 }
    );
  }
}

// PATCH - تحديث تقرير المراجعة
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request, { roles: ALLOWED_ROLES as any });
  if ('error' in authResult) return authResult.error;

  try {
    const { id } = await params;
    const body = await request.json();

    const report = await prisma.auditReport.update({
      where: { id },
      data: {
        ...(body.titleAr !== undefined && { titleAr: body.titleAr }),
        ...(body.titleEn !== undefined && { titleEn: body.titleEn }),
        ...(body.departmentId !== undefined && { departmentId: body.departmentId || null }),
        ...(body.auditorName !== undefined && { auditorName: body.auditorName }),
        ...(body.auditDateFrom !== undefined && { auditDateFrom: body.auditDateFrom ? new Date(body.auditDateFrom) : null }),
        ...(body.auditDateTo !== undefined && { auditDateTo: body.auditDateTo ? new Date(body.auditDateTo) : null }),
        ...(body.reportDate !== undefined && { reportDate: body.reportDate ? new Date(body.reportDate) : null }),
        ...(body.summaryAr !== undefined && { summaryAr: body.summaryAr }),
        ...(body.summaryEn !== undefined && { summaryEn: body.summaryEn }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.attachmentUrl !== undefined && { attachmentUrl: body.attachmentUrl }),
        ...(body.attachmentName !== undefined && { attachmentName: body.attachmentName }),
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
    console.error('Error updating audit report:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث التقرير' },
      { status: 500 }
    );
  }
}

// DELETE - حذف تقرير المراجعة
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request, { roles: ALLOWED_ROLES as any });
  if ('error' in authResult) return authResult.error;

  try {
    const { id } = await params;

    await prisma.auditReport.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting audit report:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حذف التقرير' },
      { status: 500 }
    );
  }
}
