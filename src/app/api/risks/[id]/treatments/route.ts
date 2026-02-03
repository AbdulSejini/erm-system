import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { getClientInfo } from '@/lib/audit';

// POST - إنشاء خطة معالجة جديدة
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: riskId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    // جلب بيانات المستخدم للتحقق من صلاحياته
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        role: true,
        departmentId: true,
        department: {
          select: {
            nameAr: true,
            nameEn: true,
          },
        },
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // التحقق من صلاحية إنشاء خطط المعالجة
    // يُسمح لـ: admin, riskManager, riskChampion, أو أي مستخدم في إدارة المخاطر
    const allowedRoles = ['admin', 'riskManager', 'riskChampion'];
    const isAllowedRole = allowedRoles.includes(currentUser.role);

    // التحقق إذا كان المستخدم يعمل في إدارة المخاطر (Risk Management Department)
    const isInRiskManagementDept = currentUser.department?.nameEn?.toLowerCase().includes('risk') ||
                                   currentUser.department?.nameAr?.includes('مخاطر') ||
                                   currentUser.department?.nameAr?.includes('المخاطر');

    if (!isAllowedRole && !isInRiskManagementDept) {
      return NextResponse.json(
        {
          success: false,
          error: 'غير مصرح بإنشاء خطط المعالجة. يُسمح فقط لمدير المخاطر أو رائد المخاطر أو العاملين في إدارة المخاطر.'
        },
        { status: 403 }
      );
    }

    // التحقق من وجود الخطر وجلب بياناته الحالية
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
      }
    });

    if (!risk) {
      return NextResponse.json(
        { success: false, error: 'الخطر غير موجود' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const clientInfo = getClientInfo(request);

    // إنشاء خطة المعالجة
    const treatmentPlan = await prisma.treatmentPlan.create({
      data: {
        riskId,
        titleAr: body.titleAr,
        titleEn: body.titleEn,
        descriptionAr: body.descriptionAr || '',
        descriptionEn: body.descriptionEn || '',
        strategy: body.strategy || 'reduce',
        status: body.status || 'notStarted',
        priority: body.priority || 'medium',
        responsibleId: body.responsibleId,
        riskOwnerId: body.riskOwnerId || null,
        monitorId: body.monitorId || null,
        startDate: new Date(body.startDate),
        dueDate: new Date(body.dueDate),
        progress: body.progress || 0,
        cost: body.cost || null,
        // تعليق/تبرير خطة المعالجة
        justificationAr: body.justificationAr || null,
        justificationEn: body.justificationEn || null,
        // قياس الأثر بعد المعالجة (Residual Risk المتوقع)
        expectedResidualLikelihood: body.expectedResidualLikelihood || null,
        expectedResidualImpact: body.expectedResidualImpact || null,
        expectedResidualScore: body.expectedResidualLikelihood && body.expectedResidualImpact
          ? body.expectedResidualLikelihood * body.expectedResidualImpact
          : null,
        expectedResidualRating: body.expectedResidualRating || null,
        createdById: session.user.id,
      },
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

    // تسجيل إضافة خطة المعالجة في سجل التعديلات
    await prisma.riskChangeLog.create({
      data: {
        riskId,
        userId: session.user.id,
        changeType: 'treatment_add',
        changeCategory: 'treatment',
        fieldName: 'treatments',
        fieldNameAr: 'خطط المعالجة',
        oldValue: null,
        newValue: JSON.stringify({
          id: treatmentPlan.id,
          titleAr: treatmentPlan.titleAr,
          titleEn: treatmentPlan.titleEn,
          strategy: treatmentPlan.strategy,
        }),
        description: `Added treatment plan: ${treatmentPlan.titleEn}`,
        descriptionAr: `تمت إضافة خطة معالجة: ${treatmentPlan.titleAr}`,
        relatedEntityId: treatmentPlan.id,
        ipAddress: clientInfo.ipAddress || null,
        userAgent: clientInfo.userAgent || null,
      },
    });

    // تحديث الخطر المتبقي (Residual Risk) إذا طُلب ذلك
    if (body.updateRiskResidual && body.expectedResidualLikelihood && body.expectedResidualImpact) {
      const newResidualScore = body.expectedResidualLikelihood * body.expectedResidualImpact;
      const newResidualRating = newResidualScore >= 20 ? 'Critical' :
                                newResidualScore >= 15 ? 'Major' :
                                newResidualScore >= 10 ? 'Moderate' :
                                newResidualScore >= 5 ? 'Minor' : 'Negligible';

      // تحديث الخطر
      await prisma.risk.update({
        where: { id: riskId },
        data: {
          residualLikelihood: body.expectedResidualLikelihood,
          residualImpact: body.expectedResidualImpact,
          residualScore: newResidualScore,
          residualRating: newResidualRating,
        },
      });

      // تسجيل تغيير الاحتمالية المتبقية
      if (risk.residualLikelihood !== body.expectedResidualLikelihood) {
        await prisma.riskChangeLog.create({
          data: {
            riskId,
            userId: session.user.id,
            changeType: 'field_update',
            changeCategory: 'assessment',
            fieldName: 'residualLikelihood',
            fieldNameAr: 'الاحتمالية المتبقية',
            oldValue: risk.residualLikelihood?.toString() || null,
            newValue: body.expectedResidualLikelihood.toString(),
            description: `Updated residual likelihood from ${risk.residualLikelihood || 'N/A'} to ${body.expectedResidualLikelihood} (via treatment plan)`,
            descriptionAr: `تم تحديث الاحتمالية المتبقية من ${risk.residualLikelihood || 'غير محدد'} إلى ${body.expectedResidualLikelihood} (عبر خطة المعالجة)`,
            relatedEntityId: treatmentPlan.id,
            ipAddress: clientInfo.ipAddress || null,
            userAgent: clientInfo.userAgent || null,
          },
        });
      }

      // تسجيل تغيير التأثير المتبقي
      if (risk.residualImpact !== body.expectedResidualImpact) {
        await prisma.riskChangeLog.create({
          data: {
            riskId,
            userId: session.user.id,
            changeType: 'field_update',
            changeCategory: 'assessment',
            fieldName: 'residualImpact',
            fieldNameAr: 'التأثير المتبقي',
            oldValue: risk.residualImpact?.toString() || null,
            newValue: body.expectedResidualImpact.toString(),
            description: `Updated residual impact from ${risk.residualImpact || 'N/A'} to ${body.expectedResidualImpact} (via treatment plan)`,
            descriptionAr: `تم تحديث التأثير المتبقي من ${risk.residualImpact || 'غير محدد'} إلى ${body.expectedResidualImpact} (عبر خطة المعالجة)`,
            relatedEntityId: treatmentPlan.id,
            ipAddress: clientInfo.ipAddress || null,
            userAgent: clientInfo.userAgent || null,
          },
        });
      }

      // تسجيل تغيير درجة الخطر المتبقي
      if (risk.residualScore !== newResidualScore) {
        await prisma.riskChangeLog.create({
          data: {
            riskId,
            userId: session.user.id,
            changeType: 'field_update',
            changeCategory: 'assessment',
            fieldName: 'residualScore',
            fieldNameAr: 'درجة الخطر المتبقي',
            oldValue: risk.residualScore?.toString() || null,
            newValue: newResidualScore.toString(),
            description: `Updated residual score from ${risk.residualScore || 'N/A'} to ${newResidualScore} (via treatment plan: ${treatmentPlan.titleEn})`,
            descriptionAr: `تم تحديث درجة الخطر المتبقي من ${risk.residualScore || 'غير محدد'} إلى ${newResidualScore} (عبر خطة المعالجة: ${treatmentPlan.titleAr})`,
            relatedEntityId: treatmentPlan.id,
            ipAddress: clientInfo.ipAddress || null,
            userAgent: clientInfo.userAgent || null,
          },
        });
      }

      // تسجيل تغيير تصنيف الخطر المتبقي
      if (risk.residualRating !== newResidualRating) {
        await prisma.riskChangeLog.create({
          data: {
            riskId,
            userId: session.user.id,
            changeType: 'field_update',
            changeCategory: 'assessment',
            fieldName: 'residualRating',
            fieldNameAr: 'تصنيف الخطر المتبقي',
            oldValue: risk.residualRating || null,
            newValue: newResidualRating,
            description: `Updated residual rating from ${risk.residualRating || 'N/A'} to ${newResidualRating} (via treatment plan)`,
            descriptionAr: `تم تحديث تصنيف الخطر المتبقي من ${risk.residualRating || 'غير محدد'} إلى ${newResidualRating} (عبر خطة المعالجة)`,
            relatedEntityId: treatmentPlan.id,
            ipAddress: clientInfo.ipAddress || null,
            userAgent: clientInfo.userAgent || null,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: treatmentPlan,
    });
  } catch (error) {
    console.error('Error creating treatment plan:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء خطة المعالجة' },
      { status: 500 }
    );
  }
}

// GET - جلب خطط المعالجة للخطر
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: riskId } = await params;

    const treatments = await prisma.treatmentPlan.findMany({
      where: { riskId },
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
        createdBy: {
          select: {
            id: true,
            fullName: true,
            fullNameEn: true,
          },
        },
        tasks: {
          orderBy: { order: 'asc' },
          include: {
            assignedTo: {
              select: {
                id: true,
                fullName: true,
                fullNameEn: true,
              },
            },
            actionOwner: {
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
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: treatments,
    });
  } catch (error) {
    console.error('Error fetching treatment plans:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب خطط المعالجة' },
      { status: 500 }
    );
  }
}
