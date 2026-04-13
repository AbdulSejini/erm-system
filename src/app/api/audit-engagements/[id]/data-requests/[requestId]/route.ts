import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

const ALLOWED_ROLES = ['admin', 'riskManager'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  const authResult = await requireAuth(request, { roles: ALLOWED_ROLES as any });
  if ('error' in authResult) return authResult.error;

  try {
    const { requestId } = await params;
    const body = await request.json();

    const updateData: any = {};
    if (body.descriptionAr !== undefined) updateData.descriptionAr = body.descriptionAr;
    if (body.descriptionEn !== undefined) updateData.descriptionEn = body.descriptionEn;
    if (body.assigneeId !== undefined) updateData.assigneeId = body.assigneeId || null;
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === 'delivered') updateData.deliveredAt = new Date();
    }
    if (body.attachmentUrl !== undefined) updateData.attachmentUrl = body.attachmentUrl;
    if (body.attachmentName !== undefined) updateData.attachmentName = body.attachmentName;
    if (body.notesAr !== undefined) updateData.notesAr = body.notesAr;

    const dataRequest = await prisma.auditDataRequest.update({
      where: { id: requestId },
      data: updateData,
      include: {
        assignee: { select: { id: true, fullName: true, fullNameEn: true, email: true } },
      },
    });

    return NextResponse.json({ success: true, data: dataRequest });
  } catch (error) {
    console.error('Error updating data request:', error);
    return NextResponse.json({ success: false, error: 'فشل في تحديث الطلب' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  const authResult = await requireAuth(request, { roles: ALLOWED_ROLES as any });
  if ('error' in authResult) return authResult.error;

  try {
    const { requestId } = await params;
    await prisma.auditDataRequest.delete({ where: { id: requestId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting data request:', error);
    return NextResponse.json({ success: false, error: 'فشل في حذف الطلب' }, { status: 500 });
  }
}
