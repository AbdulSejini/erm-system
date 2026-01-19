import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { createAuditLog, getClientInfo } from '@/lib/audit';

// GET - الحصول على خطر محدد
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const risk = await prisma.risk.findUnique({
      where: { id },
      include: {
        category: true,
        department: true,
        source: true,
        process: true,
        riskOwner: {
          include: {
            department: {
              select: {
                id: true,
                nameAr: true,
                nameEn: true,
              },
            },
          },
        },
        owner: {
          select: {
            id: true,
            fullName: true,
            fullNameEn: true,
          },
        },
        champion: {
          select: {
            id: true,
            fullName: true,
            fullNameEn: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            fullName: true,
            fullNameEn: true,
          },
        },
      },
    });

    if (!risk) {
      return NextResponse.json(
        { success: false, error: 'الخطر غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: risk,
    });
  } catch (error) {
    console.error('Error fetching risk:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب الخطر' },
      { status: 500 }
    );
  }
}

// PATCH - تحديث خطر
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // التحقق من وجود الخطر
    const existingRisk = await prisma.risk.findUnique({
      where: { id },
    });

    if (!existingRisk) {
      return NextResponse.json(
        { success: false, error: 'الخطر غير موجود' },
        { status: 404 }
      );
    }

    // بناء كائن التحديث
    const updateData: Record<string, unknown> = {};

    // الحقول النصية
    const textFields = [
      'riskNumber', 'titleAr', 'titleEn', 'descriptionAr', 'descriptionEn',
      'potentialCauseAr', 'potentialCauseEn', 'potentialImpactAr', 'potentialImpactEn',
      'layersOfProtectionAr', 'layersOfProtectionEn', 'krisAr', 'krisEn',
      'mitigationActionsAr', 'mitigationActionsEn', 'complianceNoteAr', 'complianceNoteEn',
      'iaRef', 'issuedBy', 'status', 'inherentRating', 'residualRating',
      'processText', 'subProcessText', 'approvalStatus'
    ];

    textFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    // الحقول الرقمية
    const numberFields = [
      'inherentLikelihood', 'inherentImpact', 'inherentScore',
      'residualLikelihood', 'residualImpact', 'residualScore'
    ];

    numberFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field] === null ? null : Number(body[field]);
      }
    });

    // حساب النتيجة والتصنيف إذا تغيرت الاحتمالية أو التأثير
    if (body.inherentLikelihood !== undefined || body.inherentImpact !== undefined) {
      const likelihood = body.inherentLikelihood ?? existingRisk.inherentLikelihood;
      const impact = body.inherentImpact ?? existingRisk.inherentImpact;
      updateData.inherentScore = likelihood * impact;
      updateData.inherentRating = calculateRating(likelihood * impact);
    }

    if (body.residualLikelihood !== undefined || body.residualImpact !== undefined) {
      const likelihood = body.residualLikelihood ?? existingRisk.residualLikelihood;
      const impact = body.residualImpact ?? existingRisk.residualImpact;
      if (likelihood && impact) {
        updateData.residualScore = likelihood * impact;
        updateData.residualRating = calculateRating(likelihood * impact);
      }
    }

    // العلاقات
    if (body.categoryId !== undefined) {
      updateData.categoryId = body.categoryId || null;
    }
    if (body.departmentId !== undefined) {
      updateData.departmentId = body.departmentId;
    }
    if (body.processId !== undefined) {
      updateData.processId = body.processId || null;
    }
    if (body.ownerId !== undefined) {
      updateData.ownerId = body.ownerId;
    }
    if (body.championId !== undefined) {
      updateData.championId = body.championId || null;
    }

    // التواريخ
    const dateFields = ['followUpDate', 'lastReviewDate', 'nextReviewDate'];
    dateFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field] ? new Date(body[field]) : null;
      }
    });

    // البولين
    if (body.complianceRequired !== undefined) {
      updateData.complianceRequired = Boolean(body.complianceRequired);
    }

    const updatedRisk = await prisma.risk.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        department: true,
        owner: {
          select: {
            id: true,
            fullName: true,
            fullNameEn: true,
          },
        },
      },
    });

    // Log the update
    const session = await auth();
    if (session?.user?.id) {
      const clientInfo = getClientInfo(request);
      await createAuditLog({
        userId: session.user.id,
        action: 'update',
        entity: 'risk',
        entityId: existingRisk.riskNumber,
        oldValues: { title: existingRisk.titleEn, status: existingRisk.status },
        newValues: { title: updatedRisk.titleEn, status: updatedRisk.status },
        ...clientInfo,
      });
    }

    return NextResponse.json({
      success: true,
      data: updatedRisk,
    });
  } catch (error) {
    console.error('Error updating risk:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث الخطر' },
      { status: 500 }
    );
  }
}

// DELETE - حذف خطر
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // التحقق من وجود الخطر
    const existingRisk = await prisma.risk.findUnique({
      where: { id },
    });

    if (!existingRisk) {
      return NextResponse.json(
        { success: false, error: 'الخطر غير موجود' },
        { status: 404 }
      );
    }

    await prisma.risk.delete({
      where: { id },
    });

    // Log the deletion
    const session = await auth();
    if (session?.user?.id) {
      const clientInfo = getClientInfo(request);
      await createAuditLog({
        userId: session.user.id,
        action: 'delete',
        entity: 'risk',
        entityId: existingRisk.riskNumber,
        oldValues: { riskNumber: existingRisk.riskNumber, title: existingRisk.titleEn },
        ...clientInfo,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'تم حذف الخطر بنجاح',
    });
  } catch (error) {
    console.error('Error deleting risk:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حذف الخطر' },
      { status: 500 }
    );
  }
}

// دالة حساب التصنيف
function calculateRating(score: number): string {
  if (score >= 20) return 'Critical';
  if (score >= 15) return 'Major';
  if (score >= 10) return 'Moderate';
  if (score >= 5) return 'Minor';
  return 'Negligible';
}
