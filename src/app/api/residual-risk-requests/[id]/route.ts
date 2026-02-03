import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// PATCH - الموافقة أو الرفض على طلب تغيير الخطر المتبقي
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    // التحقق من أن المستخدم مدير مخاطر
    const isRiskManager = session.user.role === 'admin' || session.user.role === 'riskManager';
    if (!isRiskManager) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح - يتطلب صلاحيات مدير المخاطر' },
        { status: 403 }
      );
    }

    // جلب الطلب
    const changeRequest = await prisma.residualRiskChangeRequest.findUnique({
      where: { id },
      include: {
        risk: {
          select: {
            id: true,
            riskNumber: true,
            titleAr: true,
            titleEn: true,
            residualLikelihood: true,
            residualImpact: true,
            residualScore: true,
            residualRating: true,
          },
        },
        requester: {
          select: {
            id: true,
            fullName: true,
            fullNameEn: true,
          },
        },
      },
    });

    if (!changeRequest) {
      return NextResponse.json(
        { success: false, error: 'الطلب غير موجود' },
        { status: 404 }
      );
    }

    if (changeRequest.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'تم معالجة هذا الطلب مسبقاً' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action, reviewNoteAr, reviewNoteEn } = body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'الإجراء غير صحيح' },
        { status: 400 }
      );
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    // تحديث الطلب
    const updatedRequest = await prisma.residualRiskChangeRequest.update({
      where: { id },
      data: {
        status: newStatus,
        reviewerId: session.user.id,
        reviewNoteAr: reviewNoteAr || null,
        reviewNoteEn: reviewNoteEn || null,
        reviewedAt: new Date(),
      },
      include: {
        risk: {
          select: {
            id: true,
            riskNumber: true,
            titleAr: true,
            titleEn: true,
          },
        },
        requester: {
          select: {
            id: true,
            fullName: true,
            fullNameEn: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            fullName: true,
            fullNameEn: true,
          },
        },
      },
    });

    // إذا تمت الموافقة، تحديث الخطر
    if (action === 'approve') {
      await prisma.risk.update({
        where: { id: changeRequest.riskId },
        data: {
          residualLikelihood: changeRequest.proposedLikelihood,
          residualImpact: changeRequest.proposedImpact,
          residualScore: changeRequest.proposedScore,
          residualRating: changeRequest.proposedRating,
        },
      });

      // تسجيل التغيير في سجل التعديلات
      await prisma.riskChangeLog.create({
        data: {
          riskId: changeRequest.riskId,
          userId: session.user.id,
          changeType: 'field_update',
          changeCategory: 'assessment',
          fieldName: 'residualRisk',
          fieldNameAr: 'الخطر المتبقي',
          oldValue: JSON.stringify({
            likelihood: changeRequest.currentLikelihood,
            impact: changeRequest.currentImpact,
            score: changeRequest.currentScore,
            rating: changeRequest.currentRating,
          }),
          newValue: JSON.stringify({
            likelihood: changeRequest.proposedLikelihood,
            impact: changeRequest.proposedImpact,
            score: changeRequest.proposedScore,
            rating: changeRequest.proposedRating,
          }),
          description: `Residual risk approved: ${changeRequest.justificationEn || changeRequest.justificationAr}`,
          descriptionAr: `تمت الموافقة على تغيير الخطر المتبقي: ${changeRequest.justificationAr}`,
          relatedEntityId: changeRequest.id,
        },
      });
    }

    // إرسال إشعار لصاحب الطلب
    await prisma.notification.create({
      data: {
        userId: changeRequest.requesterId,
        type: action === 'approve' ? 'residual_risk_approved' : 'residual_risk_rejected',
        titleAr: action === 'approve' ? 'تمت الموافقة على طلب تغيير الخطر المتبقي' : 'تم رفض طلب تغيير الخطر المتبقي',
        titleEn: action === 'approve' ? 'Residual Risk Change Approved' : 'Residual Risk Change Rejected',
        messageAr: action === 'approve'
          ? `تمت الموافقة على طلبك لتغيير الخطر المتبقي للخطر ${changeRequest.risk.riskNumber}${reviewNoteAr ? `. ملاحظة: ${reviewNoteAr}` : ''}`
          : `تم رفض طلبك لتغيير الخطر المتبقي للخطر ${changeRequest.risk.riskNumber}${reviewNoteAr ? `. السبب: ${reviewNoteAr}` : ''}`,
        messageEn: action === 'approve'
          ? `Your request to change residual risk for ${changeRequest.risk.riskNumber} has been approved${reviewNoteEn ? `. Note: ${reviewNoteEn}` : ''}`
          : `Your request to change residual risk for ${changeRequest.risk.riskNumber} has been rejected${reviewNoteEn ? `. Reason: ${reviewNoteEn}` : ''}`,
        link: `/risks/${changeRequest.riskId}`,
        isRead: false,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedRequest,
      message: action === 'approve' ? 'تمت الموافقة على الطلب' : 'تم رفض الطلب',
    });
  } catch (error) {
    console.error('Error processing residual risk change request:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في معالجة الطلب' },
      { status: 500 }
    );
  }
}

// GET - جلب تفاصيل طلب واحد
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const changeRequest = await prisma.residualRiskChangeRequest.findUnique({
      where: { id },
      include: {
        risk: {
          select: {
            id: true,
            riskNumber: true,
            titleAr: true,
            titleEn: true,
            inherentLikelihood: true,
            inherentImpact: true,
            inherentScore: true,
            inherentRating: true,
            residualLikelihood: true,
            residualImpact: true,
            residualScore: true,
            residualRating: true,
            department: {
              select: {
                nameAr: true,
                nameEn: true,
              },
            },
          },
        },
        requester: {
          select: {
            id: true,
            fullName: true,
            fullNameEn: true,
            email: true,
            department: {
              select: {
                nameAr: true,
                nameEn: true,
              },
            },
          },
        },
        reviewer: {
          select: {
            id: true,
            fullName: true,
            fullNameEn: true,
          },
        },
        treatmentPlan: {
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
            status: true,
            progress: true,
            strategy: true,
          },
        },
      },
    });

    if (!changeRequest) {
      return NextResponse.json(
        { success: false, error: 'الطلب غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: changeRequest,
    });
  } catch (error) {
    console.error('Error fetching residual risk change request:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في جلب الطلب' },
      { status: 500 }
    );
  }
}
