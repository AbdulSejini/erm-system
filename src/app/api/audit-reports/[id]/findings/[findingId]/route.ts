import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

const ALLOWED_ROLES = ['admin', 'riskManager'];

// PATCH - تحديث ملاحظة المراجعة
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; findingId: string }> }
) {
  const authResult = await requireAuth(request, { roles: ALLOWED_ROLES as any });
  if ('error' in authResult) return authResult.error;

  try {
    const { findingId } = await params;
    const body = await request.json();

    const finding = await prisma.auditFinding.update({
      where: { id: findingId },
      data: {
        ...(body.titleAr !== undefined && { titleAr: body.titleAr }),
        ...(body.titleEn !== undefined && { titleEn: body.titleEn }),
        ...(body.descriptionAr !== undefined && { descriptionAr: body.descriptionAr }),
        ...(body.descriptionEn !== undefined && { descriptionEn: body.descriptionEn }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.severity !== undefined && { severity: body.severity }),
        ...(body.departmentId !== undefined && { departmentId: body.departmentId || null }),
        ...(body.assigneeId !== undefined && { assigneeId: body.assigneeId || null }),
        ...(body.riskId !== undefined && { riskId: body.riskId || null }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.dueDate !== undefined && { dueDate: body.dueDate ? new Date(body.dueDate) : null }),
        ...(body.status === 'closed' && { closedAt: new Date() }),
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
    console.error('Error updating audit finding:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث الملاحظة' },
      { status: 500 }
    );
  }
}

// DELETE - حذف ملاحظة المراجعة
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
    console.error('Error deleting audit finding:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حذف الملاحظة' },
      { status: 500 }
    );
  }
}
