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

    const dataRequest = await prisma.auditDataRequest.create({
      data: {
        engagementId,
        descriptionAr: body.descriptionAr,
        descriptionEn: body.descriptionEn || null,
        assigneeId: body.assigneeId || null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        status: 'pending',
        attachmentUrl: body.attachmentUrl || null,
        attachmentName: body.attachmentName || null,
        notesAr: body.notesAr || null,
      },
      include: {
        assignee: { select: { id: true, fullName: true, fullNameEn: true, email: true } },
      },
    });

    return NextResponse.json({ success: true, data: dataRequest });
  } catch (error) {
    console.error('Error creating data request:', error);
    return NextResponse.json({ success: false, error: 'فشل في إنشاء الطلب' }, { status: 500 });
  }
}
