import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

const ALLOWED_ROLES = ['admin', 'riskManager'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; findingId: string }> }
) {
  const authResult = await requireAuth(request, { roles: ALLOWED_ROLES as any });
  if ('error' in authResult) return authResult.error;

  try {
    const { findingId } = await params;
    const body = await request.json();

    const updateData: any = {};
    const strFields = [
      'titleAr', 'titleEn', 'descriptionAr', 'descriptionEn',
      'type', 'severity', 'status',
      'managementResponseAr', 'managementResponseEn',
    ];
    for (const f of strFields) {
      if (body[f] !== undefined) updateData[f] = body[f];
    }
    const nullableFields = ['departmentId', 'assigneeId', 'riskId'];
    for (const f of nullableFields) {
      if (body[f] !== undefined) updateData[f] = body[f] || null;
    }
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.status === 'closed') updateData.closedAt = new Date();

    const finding = await prisma.auditFinding.update({
      where: { id: findingId },
      data: updateData,
      include: {
        department: { select: { id: true, nameAr: true, nameEn: true } },
        assignee: { select: { id: true, fullName: true, fullNameEn: true, email: true } },
        risk: { select: { id: true, riskNumber: true, titleAr: true, titleEn: true } },
      },
    });

    return NextResponse.json({ success: true, data: finding });
  } catch (error) {
    console.error('Error updating finding:', error);
    return NextResponse.json({ success: false, error: 'فشل في تحديث الملاحظة' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; findingId: string }> }
) {
  const authResult = await requireAuth(request, { roles: ALLOWED_ROLES as any });
  if ('error' in authResult) return authResult.error;

  try {
    const { findingId } = await params;
    await prisma.auditFinding.delete({ where: { id: findingId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting finding:', error);
    return NextResponse.json({ success: false, error: 'فشل في حذف الملاحظة' }, { status: 500 });
  }
}
