import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

const ALLOWED_ROLES = ['admin', 'riskManager'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request, { roles: ALLOWED_ROLES as any });
  if ('error' in authResult) return authResult.error;

  try {
    const { id } = await params;
    const engagement = await prisma.auditEngagement.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, fullName: true, fullNameEn: true } },
        dataRequests: {
          include: {
            assignee: { select: { id: true, fullName: true, fullNameEn: true, email: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        findings: {
          include: {
            department: { select: { id: true, nameAr: true, nameEn: true } },
            assignee: { select: { id: true, fullName: true, fullNameEn: true, email: true } },
            risk: { select: { id: true, riskNumber: true, titleAr: true, titleEn: true } },
            createdBy: { select: { id: true, fullName: true, fullNameEn: true } },
            actions: {
              include: {
                assignee: { select: { id: true, fullName: true, fullNameEn: true, email: true } },
                completedBy: { select: { id: true, fullName: true, fullNameEn: true } },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!engagement) {
      return NextResponse.json({ success: false, error: 'غير موجود' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: engagement });
  } catch (error) {
    console.error('Error fetching engagement:', error);
    return NextResponse.json({ success: false, error: 'فشل في جلب المراجعة' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request, { roles: ALLOWED_ROLES as any });
  if ('error' in authResult) return authResult.error;

  try {
    const { id } = await params;
    const body = await request.json();

    // Build update data dynamically
    const updateData: any = {};
    const fields = [
      'titleAr', 'titleEn', 'auditorName', 'auditorContact', 'auditorEmail',
      'scopeAr', 'scopeEn', 'currentPhase', 'status',
      'kickoffNotes', 'dataRequestNotes', 'fieldworkNotes',
      'draftReportNotes', 'managementReviewNotes', 'ceoReviewNotes', 'committeeNotes',
    ];
    for (const f of fields) {
      if (body[f] !== undefined) updateData[f] = body[f];
    }
    const dateFields = [
      'kickoffDate', 'dataRequestDate', 'fieldworkDate', 'draftReportDate',
      'managementReviewDate', 'ceoReviewDate', 'committeeDate',
    ];
    for (const f of dateFields) {
      if (body[f] !== undefined) updateData[f] = body[f] ? new Date(body[f]) : null;
    }

    const engagement = await prisma.auditEngagement.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: engagement });
  } catch (error) {
    console.error('Error updating engagement:', error);
    return NextResponse.json({ success: false, error: 'فشل في تحديث المراجعة' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request, { roles: ALLOWED_ROLES as any });
  if ('error' in authResult) return authResult.error;

  try {
    const { id } = await params;
    await prisma.auditEngagement.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting engagement:', error);
    return NextResponse.json({ success: false, error: 'فشل في حذف المراجعة' }, { status: 500 });
  }
}
