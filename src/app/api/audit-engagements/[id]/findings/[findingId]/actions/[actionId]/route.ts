import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

const ALLOWED_ROLES = ['admin', 'riskManager'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; findingId: string; actionId: string }> }
) {
  const authResult = await requireAuth(request, { roles: ALLOWED_ROLES as any });
  if ('error' in authResult) return authResult.error;

  try {
    const { actionId } = await params;
    const body = await request.json();

    const updateData: any = {};
    if (body.titleAr !== undefined) updateData.titleAr = body.titleAr;
    if (body.titleEn !== undefined) updateData.titleEn = body.titleEn;
    if (body.descriptionAr !== undefined) updateData.descriptionAr = body.descriptionAr;
    if (body.assigneeId !== undefined) updateData.assigneeId = body.assigneeId || null;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.notesAr !== undefined) updateData.notesAr = body.notesAr;
    if (body.status === 'completed') {
      updateData.completedAt = new Date();
      updateData.completedById = authResult.userId;
    }

    const action = await prisma.auditAction.update({
      where: { id: actionId },
      data: updateData,
      include: {
        assignee: { select: { id: true, fullName: true, fullNameEn: true, email: true } },
        completedBy: { select: { id: true, fullName: true, fullNameEn: true } },
      },
    });

    return NextResponse.json({ success: true, data: action });
  } catch (error) {
    console.error('Error updating action:', error);
    return NextResponse.json({ success: false, error: 'فشل في تحديث الإجراء' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; findingId: string; actionId: string }> }
) {
  const authResult = await requireAuth(request, { roles: ALLOWED_ROLES as any });
  if ('error' in authResult) return authResult.error;

  try {
    const { actionId } = await params;
    await prisma.auditAction.delete({ where: { id: actionId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting action:', error);
    return NextResponse.json({ success: false, error: 'فشل في حذف الإجراء' }, { status: 500 });
  }
}
