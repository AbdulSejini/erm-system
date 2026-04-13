import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

const ALLOWED_ROLES = ['admin', 'riskManager'];

// PATCH - تحديث إجراء تصحيحي
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; findingId: string; actionId: string }> }
) {
  const authResult = await requireAuth(request, { roles: ALLOWED_ROLES as any });
  if ('error' in authResult) return authResult.error;

  try {
    const { actionId } = await params;
    const body = await request.json();

    const action = await prisma.auditAction.update({
      where: { id: actionId },
      data: {
        ...(body.titleAr !== undefined && { titleAr: body.titleAr }),
        ...(body.titleEn !== undefined && { titleEn: body.titleEn }),
        ...(body.descriptionAr !== undefined && { descriptionAr: body.descriptionAr }),
        ...(body.descriptionEn !== undefined && { descriptionEn: body.descriptionEn }),
        ...(body.assigneeId !== undefined && { assigneeId: body.assigneeId || null }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.priority !== undefined && { priority: body.priority }),
        ...(body.dueDate !== undefined && { dueDate: body.dueDate ? new Date(body.dueDate) : null }),
        ...(body.attachmentUrl !== undefined && { attachmentUrl: body.attachmentUrl }),
        ...(body.attachmentName !== undefined && { attachmentName: body.attachmentName }),
        ...(body.notesAr !== undefined && { notesAr: body.notesAr }),
        ...(body.notesEn !== undefined && { notesEn: body.notesEn }),
        ...(body.status === 'completed' && {
          completedAt: new Date(),
          completedById: authResult.userId,
        }),
      },
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
    });

    return NextResponse.json({ success: true, data: action });
  } catch (error) {
    console.error('Error updating audit action:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث الإجراء' },
      { status: 500 }
    );
  }
}

// DELETE - حذف إجراء تصحيحي
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
    console.error('Error deleting audit action:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حذف الإجراء' },
      { status: 500 }
    );
  }
}
