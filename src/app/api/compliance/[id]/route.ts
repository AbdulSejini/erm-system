import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { createAuditLog, getClientInfo } from '@/lib/audit';
import { checkRateLimit, getClientIP, rateLimitConfigs } from '@/lib/rate-limit';

// GET - الحصول على تفاصيل التزام واحد
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(`compliance-detail-${clientIP}`, rateLimitConfigs.standard);
    if (!rateLimit.success) {
      return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const obligation = await prisma.complianceObligation.findUnique({
      where: { id },
      include: {
        domain: true,
        regulatoryBody: true,
        createdBy: {
          select: { id: true, fullName: true, fullNameEn: true, email: true },
        },
        riskLinks: {
          include: {
            risk: {
              select: {
                id: true,
                riskNumber: true,
                titleAr: true,
                titleEn: true,
                inherentRating: true,
                residualRating: true,
                status: true,
                department: { select: { nameAr: true, nameEn: true } },
              },
            },
            linkedBy: {
              select: { id: true, fullName: true, fullNameEn: true },
            },
          },
          orderBy: { linkedAt: 'desc' },
        },
        assessments: {
          include: {
            assessor: {
              select: { id: true, fullName: true, fullNameEn: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        changeLogs: {
          include: {
            user: {
              select: { id: true, fullName: true, fullNameEn: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!obligation) {
      return NextResponse.json({ success: false, error: 'الالتزام غير موجود' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: obligation });
  } catch (error) {
    console.error('Error fetching compliance obligation:', error);
    return NextResponse.json({ success: false, error: 'فشل في جلب الالتزام' }, { status: 500 });
  }
}

// PATCH - تحديث التزام
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(`compliance-patch-${clientIP}`, rateLimitConfigs.write);
    if (!rateLimit.success) {
      return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const role = session.user.role;

    // admin/riskManager = تعديل كامل, riskAnalyst = حالة ونسبة فقط
    if (!['admin', 'riskManager', 'riskAnalyst'].includes(role)) {
      return NextResponse.json({ success: false, error: 'ليس لديك صلاحية تعديل الالتزامات' }, { status: 403 });
    }

    const existing = await prisma.complianceObligation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'الالتزام غير موجود' }, { status: 404 });
    }

    const body = await request.json();
    const clientInfo = getClientInfo(request);

    // riskAnalyst يمكنه تعديل الحالة والنسبة فقط
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let updateData: any = {};

    if (role === 'riskAnalyst') {
      const allowedFields = ['complianceStatus', 'completionPercentage', 'lastTestResult', 'lastTestDate', 'notesAr', 'notesEn'];
      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updateData[field] = field.includes('Date') && body[field] ? new Date(body[field]) : body[field];
        }
      }
    } else {
      // admin/riskManager - تعديل كامل
      const fields = [
        'titleAr', 'titleEn',
        'domainId', 'subDomainAr', 'subDomainEn',
        'regulatoryReference', 'articleNumber',
        'internalPolicyAr', 'internalPolicyEn', 'policyDocumentNumber',
        'regulatoryBodyId', 'obligationType',
        'responsibleDepartmentAr', 'responsibleDepartmentEn',
        'directOwnerAr', 'directOwnerEn',
        'backupOwnerAr', 'backupOwnerEn', 'defenseLine',
        'recurrence', 'alertDaysBefore',
        'criticalityLevel', 'nonComplianceLikelihood', 'nonComplianceImpact',
        'potentialPenaltiesAr', 'potentialPenaltiesEn',
        'complianceStatus', 'completionPercentage',
        'controlActivitiesAr', 'controlActivitiesEn',
        'testingMethod', 'lastTestResult',
        'evidenceRequirementsAr', 'evidenceRequirementsEn',
        'gapDescriptionAr', 'gapDescriptionEn',
        'remediationPlanAr', 'remediationPlanEn',
        'remediationOwnerAr', 'remediationOwnerEn', 'remediationStatus',
        'linkedRiskNumbers', 'kpiKriAr', 'kpiKriEn',
        'notesAr', 'notesEn',
      ];
      const dateFields = ['nextDueDate', 'lastReviewDate', 'nextReviewDate', 'lastTestDate', 'remediationTargetDate'];

      for (const field of fields) {
        if (body[field] !== undefined) updateData[field] = body[field];
      }
      for (const field of dateFields) {
        if (body[field] !== undefined) updateData[field] = body[field] ? new Date(body[field]) : null;
      }

      // إعادة حساب درجة المخاطر
      if (body.nonComplianceLikelihood !== undefined || body.nonComplianceImpact !== undefined) {
        const likelihood = body.nonComplianceLikelihood ?? existing.nonComplianceLikelihood;
        const impact = body.nonComplianceImpact ?? existing.nonComplianceImpact;
        updateData.riskScore = likelihood * impact;
        updateData.riskRating = calculateRiskRating(likelihood * impact);
      }
    }

    const updated = await prisma.complianceObligation.update({
      where: { id },
      data: updateData,
      include: {
        domain: true,
        regulatoryBody: true,
      },
    });

    // تسجيل التغييرات
    const changedFields = Object.keys(updateData);
    for (const field of changedFields) {
      const oldValue = (existing as Record<string, unknown>)[field];
      const newValue = updateData[field];
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        await prisma.complianceChangeLog.create({
          data: {
            obligationId: id,
            userId: session.user.id,
            changeType: 'update',
            fieldName: field,
            oldValue: oldValue != null ? String(oldValue) : null,
            newValue: newValue != null ? String(newValue) : null,
            description: `Updated ${field}`,
            ipAddress: clientInfo.ipAddress,
            userAgent: clientInfo.userAgent,
          },
        });
      }
    }

    await createAuditLog({
      userId: session.user.id,
      action: 'update',
      entity: 'compliance' as 'risk',
      entityId: existing.code,
      oldValues: { fields: changedFields },
      newValues: updateData,
      ...clientInfo,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating compliance obligation:', error);
    return NextResponse.json({ success: false, error: 'فشل في تحديث الالتزام' }, { status: 500 });
  }
}

// DELETE - حذف التزام (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!['admin', 'riskManager'].includes(session.user.role)) {
      return NextResponse.json({ success: false, error: 'ليس لديك صلاحية حذف الالتزامات' }, { status: 403 });
    }

    const existing = await prisma.complianceObligation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'الالتزام غير موجود' }, { status: 404 });
    }

    await prisma.complianceObligation.update({
      where: { id },
      data: { isActive: false },
    });

    const clientInfo = getClientInfo(request);
    await createAuditLog({
      userId: session.user.id,
      action: 'soft_delete',
      entity: 'compliance' as 'risk',
      entityId: existing.code,
      ...clientInfo,
    });

    await prisma.complianceChangeLog.create({
      data: {
        obligationId: id,
        userId: session.user.id,
        changeType: 'delete',
        description: `Soft deleted obligation ${existing.code}`,
        descriptionAr: `تم حذف الالتزام ${existing.code}`,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
      },
    });

    return NextResponse.json({ success: true, message: 'تم حذف الالتزام' });
  } catch (error) {
    console.error('Error deleting compliance obligation:', error);
    return NextResponse.json({ success: false, error: 'فشل في حذف الالتزام' }, { status: 500 });
  }
}

function calculateRiskRating(score: number): string {
  if (score >= 20) return 'critical';
  if (score >= 15) return 'high';
  if (score >= 10) return 'medium';
  if (score >= 5) return 'low';
  return 'veryLow';
}
