import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// دالة لحساب التصنيف بناءً على الدرجة
function calculateRating(score: number): string {
  if (score >= 17) return 'Critical';
  if (score >= 13) return 'Major';
  if (score >= 9) return 'Moderate';
  if (score >= 5) return 'Minor';
  return 'Negligible';
}

// POST - إنشاء طلب تغيير الخطر المتبقي
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      riskId,
      treatmentPlanId,
      proposedLikelihood,
      proposedImpact,
      justificationAr,
      justificationEn,
      requestType = 'manual',
    } = body;

    // التحقق من وجود الخطر
    const risk = await prisma.risk.findUnique({
      where: { id: riskId },
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
    });

    if (!risk) {
      return NextResponse.json(
        { success: false, error: 'الخطر غير موجود' },
        { status: 404 }
      );
    }

    // حساب الدرجة والتصنيف المقترح
    const proposedScore = proposedLikelihood * proposedImpact;
    const proposedRating = calculateRating(proposedScore);

    // التحقق مما إذا كان المستخدم مدير مخاطر - موافقة تلقائية
    const isRiskManager = session.user.role === 'admin' || session.user.role === 'riskManager';

    // إنشاء طلب التغيير
    const changeRequest = await prisma.residualRiskChangeRequest.create({
      data: {
        riskId,
        requesterId: session.user.id,
        treatmentPlanId: treatmentPlanId || null,
        currentLikelihood: risk.residualLikelihood,
        currentImpact: risk.residualImpact,
        currentScore: risk.residualScore,
        currentRating: risk.residualRating,
        proposedLikelihood,
        proposedImpact,
        proposedScore,
        proposedRating,
        justificationAr,
        justificationEn: justificationEn || null,
        requestType,
        // الموافقة التلقائية لمدير المخاطر
        status: isRiskManager ? 'auto_approved' : 'pending',
        reviewerId: isRiskManager ? session.user.id : null,
        reviewedAt: isRiskManager ? new Date() : null,
        reviewNoteAr: isRiskManager ? 'موافقة تلقائية - مدير المخاطر' : null,
        reviewNoteEn: isRiskManager ? 'Auto-approved - Risk Manager' : null,
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
      },
    });

    // إذا تمت الموافقة التلقائية، تحديث الخطر مباشرة
    if (isRiskManager) {
      await prisma.risk.update({
        where: { id: riskId },
        data: {
          residualLikelihood: proposedLikelihood,
          residualImpact: proposedImpact,
          residualScore: proposedScore,
          residualRating: proposedRating,
        },
      });

      // تسجيل التغيير في سجل التعديلات
      await prisma.riskChangeLog.create({
        data: {
          riskId,
          userId: session.user.id,
          changeType: 'field_update',
          changeCategory: 'assessment',
          fieldName: 'residualRisk',
          fieldNameAr: 'الخطر المتبقي',
          oldValue: JSON.stringify({
            likelihood: risk.residualLikelihood,
            impact: risk.residualImpact,
            score: risk.residualScore,
            rating: risk.residualRating,
          }),
          newValue: JSON.stringify({
            likelihood: proposedLikelihood,
            impact: proposedImpact,
            score: proposedScore,
            rating: proposedRating,
          }),
          description: `Residual risk updated (auto-approved): ${justificationEn || justificationAr}`,
          descriptionAr: `تم تحديث الخطر المتبقي (موافقة تلقائية): ${justificationAr}`,
          relatedEntityId: changeRequest.id,
        },
      });
    } else {
      // إرسال إشعار لمديري المخاطر
      const riskManagers = await prisma.user.findMany({
        where: {
          role: { in: ['admin', 'riskManager'] },
          status: 'active',
        },
        select: { id: true },
      });

      // إنشاء إشعارات لكل مدير مخاطر
      const notifications = riskManagers.map((manager) => ({
        userId: manager.id,
        type: 'residual_risk_approval',
        titleAr: 'طلب موافقة على تغيير الخطر المتبقي',
        titleEn: 'Residual Risk Change Approval Required',
        messageAr: `طلب ${changeRequest.requester.fullName} تعديل الخطر المتبقي للخطر ${risk.riskNumber}. التبرير: ${justificationAr}`,
        messageEn: `${changeRequest.requester.fullNameEn || changeRequest.requester.fullName} requested to modify residual risk for ${risk.riskNumber}. Justification: ${justificationEn || justificationAr}`,
        link: `/risks/${riskId}?tab=approval`,
        isRead: false,
      }));

      await prisma.notification.createMany({
        data: notifications,
      });
    }

    return NextResponse.json({
      success: true,
      data: changeRequest,
      message: isRiskManager
        ? 'تم تحديث الخطر المتبقي مباشرة'
        : 'تم إرسال طلب الموافقة لمدير المخاطر',
    });
  } catch (error) {
    console.error('Error creating residual risk change request:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في إنشاء الطلب' },
      { status: 500 }
    );
  }
}

// GET - جلب طلبات تغيير الخطر المتبقي
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const riskId = searchParams.get('riskId');
    const pending = searchParams.get('pending') === 'true';

    // بناء شروط البحث
    const where: {
      status?: string | { in: string[] };
      riskId?: string;
    } = {};

    if (status) {
      where.status = status;
    }

    if (pending) {
      where.status = 'pending';
    }

    if (riskId) {
      where.riskId = riskId;
    }

    // فقط مديري المخاطر يمكنهم رؤية جميع الطلبات
    const isRiskManager = session.user.role === 'admin' || session.user.role === 'riskManager';

    const requests = await prisma.residualRiskChangeRequest.findMany({
      where: isRiskManager ? where : { ...where, requesterId: session.user.id },
      include: {
        risk: {
          select: {
            id: true,
            riskNumber: true,
            titleAr: true,
            titleEn: true,
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
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // عدد الطلبات المعلقة
    const pendingCount = await prisma.residualRiskChangeRequest.count({
      where: { status: 'pending' },
    });

    return NextResponse.json({
      success: true,
      data: requests,
      pendingCount,
    });
  } catch (error) {
    console.error('Error fetching residual risk change requests:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في جلب الطلبات' },
      { status: 500 }
    );
  }
}
