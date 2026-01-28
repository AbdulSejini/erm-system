import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { getClientInfo } from '@/lib/audit';

// أسماء الحقول بالعربي
const fieldNamesAr: Record<string, string> = {
  titleAr: 'العنوان بالعربي',
  titleEn: 'العنوان بالإنجليزي',
  descriptionAr: 'الوصف بالعربي',
  descriptionEn: 'الوصف بالإنجليزي',
  strategy: 'الاستراتيجية',
  status: 'الحالة',
  priority: 'الأولوية',
  responsibleId: 'المسؤول',
  riskOwnerId: 'صاحب الخطر',
  monitorId: 'متابع التنفيذ',
  startDate: 'تاريخ البدء',
  dueDate: 'تاريخ الاستحقاق',
  completionDate: 'تاريخ الإنجاز',
  progress: 'نسبة التقدم',
  cost: 'التكلفة',
  expectedResidualLikelihood: 'احتمالية الخطر المتبقي المتوقعة',
  expectedResidualImpact: 'تأثير الخطر المتبقي المتوقع',
  expectedResidualScore: 'درجة الخطر المتبقي المتوقعة',
  expectedResidualRating: 'تصنيف الخطر المتبقي المتوقع',
};

// PATCH - تحديث خطة معالجة
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; treatmentId: string }> }
) {
  try {
    const { id: riskId, treatmentId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    // التحقق من وجود خطة المعالجة
    const existingTreatment = await prisma.treatmentPlan.findFirst({
      where: { id: treatmentId, riskId },
    });

    if (!existingTreatment) {
      return NextResponse.json(
        { success: false, error: 'خطة المعالجة غير موجودة' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const clientInfo = getClientInfo(request);

    // بناء كائن التحديث
    const updateData: Record<string, unknown> = {};

    const textFields = ['titleAr', 'titleEn', 'descriptionAr', 'descriptionEn', 'strategy', 'status', 'priority', 'expectedResidualRating'];
    textFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    // حقول المعرفات (المسؤول، صاحب الخطر، متابع التنفيذ)
    const idFields = ['responsibleId', 'riskOwnerId', 'monitorId'];
    idFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field] || null;
      }
    });

    // حقول الأرقام
    if (body.progress !== undefined) {
      updateData.progress = Number(body.progress);
    }

    if (body.cost !== undefined) {
      updateData.cost = body.cost === null ? null : Number(body.cost);
    }

    // حقول الخطر المتبقي المتوقع
    if (body.expectedResidualLikelihood !== undefined) {
      updateData.expectedResidualLikelihood = body.expectedResidualLikelihood === null ? null : Number(body.expectedResidualLikelihood);
    }

    if (body.expectedResidualImpact !== undefined) {
      updateData.expectedResidualImpact = body.expectedResidualImpact === null ? null : Number(body.expectedResidualImpact);
    }

    // حساب درجة الخطر المتبقي المتوقع تلقائياً
    if (body.expectedResidualLikelihood !== undefined || body.expectedResidualImpact !== undefined) {
      const likelihood = body.expectedResidualLikelihood ?? existingTreatment.expectedResidualLikelihood;
      const impact = body.expectedResidualImpact ?? existingTreatment.expectedResidualImpact;
      if (likelihood && impact) {
        updateData.expectedResidualScore = Number(likelihood) * Number(impact);
      } else {
        updateData.expectedResidualScore = null;
      }
    }

    const dateFields = ['startDate', 'dueDate', 'completionDate'];
    dateFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field] ? new Date(body[field]) : null;
      }
    });

    // تحديث خطة المعالجة
    const updatedTreatment = await prisma.treatmentPlan.update({
      where: { id: treatmentId },
      data: updateData,
      include: {
        responsible: {
          select: {
            id: true,
            fullName: true,
            fullNameEn: true,
          },
        },
        riskOwner: {
          select: {
            id: true,
            fullName: true,
            fullNameEn: true,
          },
        },
        monitor: {
          select: {
            id: true,
            fullName: true,
            fullNameEn: true,
          },
        },
      },
    });

    // تسجيل التعديلات
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
      relatedEntityId: string;
      ipAddress: string | null;
      userAgent: string | null;
    }> = [];

    const fieldsToTrack = ['titleAr', 'titleEn', 'descriptionAr', 'descriptionEn', 'strategy', 'status', 'priority', 'responsibleId', 'riskOwnerId', 'monitorId', 'startDate', 'dueDate', 'completionDate', 'progress', 'cost', 'expectedResidualLikelihood', 'expectedResidualImpact', 'expectedResidualScore', 'expectedResidualRating'];

    for (const field of fieldsToTrack) {
      const oldVal = existingTreatment[field as keyof typeof existingTreatment];
      const newVal = updateData[field];

      if (newVal !== undefined) {
        const oldValStr = oldVal === null || oldVal === undefined ? null : String(oldVal);
        const newValStr = newVal === null || newVal === undefined ? null : String(newVal);

        if (oldValStr !== newValStr) {
          const fieldAr = fieldNamesAr[field] || field;
          changeLogs.push({
            riskId,
            userId: session.user.id,
            changeType: 'treatment_update',
            changeCategory: 'treatment',
            fieldName: `treatment.${field}`,
            fieldNameAr: `خطة المعالجة - ${fieldAr}`,
            oldValue: oldValStr,
            newValue: newValStr,
            description: `Updated treatment plan "${existingTreatment.titleEn}": ${field} changed`,
            descriptionAr: `تم تحديث خطة المعالجة "${existingTreatment.titleAr}": تم تغيير ${fieldAr}`,
            relatedEntityId: treatmentId,
            ipAddress: clientInfo.ipAddress || null,
            userAgent: clientInfo.userAgent || null,
          });
        }
      }
    }

    if (changeLogs.length > 0) {
      await prisma.riskChangeLog.createMany({
        data: changeLogs,
      });
    }

    return NextResponse.json({
      success: true,
      data: updatedTreatment,
    });
  } catch (error) {
    console.error('Error updating treatment plan:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث خطة المعالجة' },
      { status: 500 }
    );
  }
}

// DELETE - حذف خطة معالجة
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; treatmentId: string }> }
) {
  try {
    const { id: riskId, treatmentId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    // التحقق من وجود خطة المعالجة
    const existingTreatment = await prisma.treatmentPlan.findFirst({
      where: { id: treatmentId, riskId },
    });

    if (!existingTreatment) {
      return NextResponse.json(
        { success: false, error: 'خطة المعالجة غير موجودة' },
        { status: 404 }
      );
    }

    const clientInfo = getClientInfo(request);

    // حذف خطة المعالجة
    await prisma.treatmentPlan.delete({
      where: { id: treatmentId },
    });

    // تسجيل الحذف
    await prisma.riskChangeLog.create({
      data: {
        riskId,
        userId: session.user.id,
        changeType: 'treatment_delete',
        changeCategory: 'treatment',
        fieldName: 'treatments',
        fieldNameAr: 'خطط المعالجة',
        oldValue: JSON.stringify({
          id: existingTreatment.id,
          titleAr: existingTreatment.titleAr,
          titleEn: existingTreatment.titleEn,
          strategy: existingTreatment.strategy,
        }),
        newValue: null,
        description: `Deleted treatment plan: ${existingTreatment.titleEn}`,
        descriptionAr: `تم حذف خطة المعالجة: ${existingTreatment.titleAr}`,
        relatedEntityId: treatmentId,
        ipAddress: clientInfo.ipAddress || null,
        userAgent: clientInfo.userAgent || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم حذف خطة المعالجة بنجاح',
    });
  } catch (error) {
    console.error('Error deleting treatment plan:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حذف خطة المعالجة' },
      { status: 500 }
    );
  }
}
