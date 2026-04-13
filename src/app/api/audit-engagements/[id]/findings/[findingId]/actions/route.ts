import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

const ALLOWED_ROLES = ['admin', 'riskManager'];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; findingId: string }> }
) {
  const authResult = await requireAuth(request, { roles: ALLOWED_ROLES as any });
  if ('error' in authResult) return authResult.error;

  try {
    const { findingId } = await params;
    const body = await request.json();

    const action = await prisma.auditAction.create({
      data: {
        findingId,
        titleAr: body.titleAr,
        titleEn: body.titleEn || null,
        descriptionAr: body.descriptionAr || null,
        assigneeId: body.assigneeId || null,
        status: 'pending',
        priority: body.priority || 'medium',
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        notesAr: body.notesAr || null,
        createdById: authResult.userId,
      },
      include: {
        assignee: { select: { id: true, fullName: true, fullNameEn: true, email: true } },
      },
    });

    return NextResponse.json({ success: true, data: action });
  } catch (error) {
    console.error('Error creating action:', error);
    return NextResponse.json({ success: false, error: 'فشل في إنشاء الإجراء' }, { status: 500 });
  }
}
