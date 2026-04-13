import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

const ALLOWED_ROLES = ['admin', 'riskManager'];

// POST - إضافة إجراء تصحيحي لملاحظة المراجعة
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; findingId: string }> }
) {
  const authResult = await requireAuth(request, { roles: ALLOWED_ROLES as any });
  if ('error' in authResult) return authResult.error;

  try {
    const { findingId } = await params;
    const body = await request.json();

    const finding = await prisma.auditFinding.findUnique({
      where: { id: findingId },
      select: { id: true },
    });

    if (!finding) {
      return NextResponse.json(
        { success: false, error: 'الملاحظة غير موجودة' },
        { status: 404 }
      );
    }

    const action = await prisma.auditAction.create({
      data: {
        findingId,
        titleAr: body.titleAr,
        titleEn: body.titleEn || null,
        descriptionAr: body.descriptionAr || null,
        descriptionEn: body.descriptionEn || null,
        assigneeId: body.assigneeId || null,
        status: 'pending',
        priority: body.priority || 'medium',
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        attachmentUrl: body.attachmentUrl || null,
        attachmentName: body.attachmentName || null,
        notesAr: body.notesAr || null,
        notesEn: body.notesEn || null,
        createdById: authResult.userId,
      },
      include: {
        assignee: {
          select: { id: true, fullName: true, fullNameEn: true, email: true },
        },
        createdBy: {
          select: { id: true, fullName: true, fullNameEn: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: action });
  } catch (error) {
    console.error('Error creating audit action:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء الإجراء' },
      { status: 500 }
    );
  }
}
