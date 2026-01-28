import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { createAuditLog, getClientInfo } from '@/lib/audit';

// أسماء الحقول بالعربي
const fieldNamesAr: Record<string, string> = {
  titleAr: 'العنوان بالعربي',
  titleEn: 'العنوان بالإنجليزي',
  descriptionAr: 'الوصف بالعربي',
  descriptionEn: 'الوصف بالإنجليزي',
  potentialCauseAr: 'السبب المحتمل بالعربي',
  potentialCauseEn: 'السبب المحتمل بالإنجليزي',
  potentialImpactAr: 'التأثير المحتمل بالعربي',
  potentialImpactEn: 'التأثير المحتمل بالإنجليزي',
  layersOfProtectionAr: 'طبقات الحماية بالعربي',
  layersOfProtectionEn: 'طبقات الحماية بالإنجليزي',
  mitigationActionsAr: 'إجراءات التخفيف بالعربي',
  mitigationActionsEn: 'إجراءات التخفيف بالإنجليزي',
  krisAr: 'مؤشرات المخاطر بالعربي',
  krisEn: 'مؤشرات المخاطر بالإنجليزي',
  status: 'الحالة',
  approvalStatus: 'حالة الموافقة',
  inherentLikelihood: 'احتمالية الخطر الأصلي',
  inherentImpact: 'تأثير الخطر الأصلي',
  inherentScore: 'درجة الخطر الأصلي',
  inherentRating: 'تصنيف الخطر الأصلي',
  residualLikelihood: 'احتمالية الخطر المتبقي',
  residualImpact: 'تأثير الخطر المتبقي',
  residualScore: 'درجة الخطر المتبقي',
  residualRating: 'تصنيف الخطر المتبقي',
  departmentId: 'الإدارة',
  categoryId: 'الفئة',
  ownerId: 'مالك الخطر',
  championId: 'رائد المخاطر',
  followUpDate: 'تاريخ المتابعة',
  processText: 'العملية',
  subProcessText: 'العملية الفرعية',
  complianceRequired: 'الامتثال مطلوب',
  riskNumber: 'رقم الخطر',
};

// دالة للحصول على وصف التغيير
function getChangeDescription(fieldName: string, oldValue: unknown, newValue: unknown): { en: string; ar: string } {
  const fieldAr = fieldNamesAr[fieldName] || fieldName;

  if (oldValue === null || oldValue === undefined || oldValue === '') {
    return {
      en: `Added ${fieldName}`,
      ar: `تمت إضافة ${fieldAr}`
    };
  }
  if (newValue === null || newValue === undefined || newValue === '') {
    return {
      en: `Removed ${fieldName}`,
      ar: `تم إزالة ${fieldAr}`
    };
  }
  return {
    en: `Changed ${fieldName}`,
    ar: `تم تعديل ${fieldAr}`
  };
}

// دالة لتحديد فئة التغيير
function getChangeCategory(fieldName: string): string {
  if (['titleAr', 'titleEn', 'descriptionAr', 'descriptionEn', 'potentialCauseAr', 'potentialCauseEn', 'potentialImpactAr', 'potentialImpactEn', 'processText', 'subProcessText'].includes(fieldName)) {
    return 'risk_info';
  }
  if (['inherentLikelihood', 'inherentImpact', 'inherentScore', 'inherentRating', 'residualLikelihood', 'residualImpact', 'residualScore', 'residualRating'].includes(fieldName)) {
    return 'assessment';
  }
  if (['status', 'approvalStatus'].includes(fieldName)) {
    return 'status';
  }
  if (['ownerId', 'championId', 'departmentId'].includes(fieldName)) {
    return 'ownership';
  }
  return 'risk_info';
}

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
        // خطط المعالجة المرتبطة بالخطر
        treatments: {
          include: {
            responsible: {
              select: {
                id: true,
                fullName: true,
                fullNameEn: true,
              },
            },
            tasks: {
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        // تاريخ التقييمات
        assessments: {
          include: {
            assessedBy: {
              select: {
                id: true,
                fullName: true,
                fullNameEn: true,
              },
            },
          },
          orderBy: { assessmentDate: 'desc' },
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

      // إذا تغيرت الإدارة، نحدث رقم الخطر (نغير رمز الوظيفة فقط ونحافظ على الرقم التسلسلي)
      if (body.departmentId !== existingRisk.departmentId) {
        // جلب رمز الإدارة الجديدة
        const newDepartment = await prisma.department.findUnique({
          where: { id: body.departmentId },
          select: { code: true }
        });

        if (newDepartment) {
          // استخراج الرقم التسلسلي من رقم الخطر الحالي (مثل: IT-001 -> 001)
          const currentRiskNumber = existingRisk.riskNumber;
          const sequenceMatch = currentRiskNumber.match(/(\d+)$/);
          const sequenceNumber = sequenceMatch ? sequenceMatch[1] : '001';

          // إنشاء رقم الخطر الجديد برمز الوظيفة الجديد
          updateData.riskNumber = `${newDepartment.code}-${sequenceNumber}`;
        }
      }
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

    // Get session and client info before update
    const session = await auth();
    const clientInfo = getClientInfo(request);

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
    if (session?.user?.id) {
      await createAuditLog({
        userId: session.user.id,
        action: 'update',
        entity: 'risk',
        entityId: existingRisk.riskNumber,
        oldValues: { title: existingRisk.titleEn, status: existingRisk.status },
        newValues: { title: updatedRisk.titleEn, status: updatedRisk.status },
        ...clientInfo,
      });

      // تسجيل التعديلات في سجل تغييرات الخطر
      const changeLogs: Array<{
        riskId: string;
        userId: string;
        changeType: string;
        changeCategory: string;
        fieldName: string;
        fieldNameAr: string;
        oldValue: string | null;
        newValue: string | null;
        description: string;
        descriptionAr: string;
        ipAddress: string | null;
        userAgent: string | null;
      }> = [];

      // مقارنة الحقول وتسجيل التغييرات
      const fieldsToTrack = [
        'titleAr', 'titleEn', 'descriptionAr', 'descriptionEn',
        'potentialCauseAr', 'potentialCauseEn', 'potentialImpactAr', 'potentialImpactEn',
        'layersOfProtectionAr', 'layersOfProtectionEn', 'mitigationActionsAr', 'mitigationActionsEn',
        'krisAr', 'krisEn', 'status', 'approvalStatus',
        'inherentLikelihood', 'inherentImpact', 'inherentScore', 'inherentRating',
        'residualLikelihood', 'residualImpact', 'residualScore', 'residualRating',
        'departmentId', 'categoryId', 'ownerId', 'championId',
        'followUpDate', 'processText', 'subProcessText', 'complianceRequired', 'riskNumber'
      ];

      for (const field of fieldsToTrack) {
        const oldVal = existingRisk[field as keyof typeof existingRisk];
        const newVal = updateData[field];

        if (newVal !== undefined) {
          // تحويل القيم للمقارنة
          const oldValStr = oldVal === null || oldVal === undefined ? null : String(oldVal);
          const newValStr = newVal === null || newVal === undefined ? null : String(newVal);

          // تحقق إذا تغيرت القيمة
          if (oldValStr !== newValStr) {
            const desc = getChangeDescription(field, oldVal, newVal);
            changeLogs.push({
              riskId: id,
              userId: session.user.id,
              changeType: 'update',
              changeCategory: getChangeCategory(field),
              fieldName: field,
              fieldNameAr: fieldNamesAr[field] || field,
              oldValue: oldValStr,
              newValue: newValStr,
              description: desc.en,
              descriptionAr: desc.ar,
              ipAddress: clientInfo.ipAddress || null,
              userAgent: clientInfo.userAgent || null,
            });
          }
        }
      }

      // حفظ سجلات التغييرات
      if (changeLogs.length > 0) {
        await prisma.riskChangeLog.createMany({
          data: changeLogs,
        });
      }
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
