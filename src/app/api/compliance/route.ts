import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { createAuditLog, getClientInfo } from '@/lib/audit';
import { checkRateLimit, getClientIP, rateLimitConfigs } from '@/lib/rate-limit';

// GET - الحصول على جميع الالتزامات مع فلترة الصلاحيات
export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(`compliance-get-${clientIP}`, rateLimitConfigs.standard);
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests' },
        { status: 429 }
      );
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // دعم انتحال الصلاحيات
    const impersonateUserId = request.headers.get('X-Impersonate-User-Id');
    let effectiveUserId = session.user.id;
    let effectiveRole = session.user.role;

    if (impersonateUserId && session.user.role === 'admin') {
      effectiveUserId = impersonateUserId;
      const impUser = await prisma.user.findUnique({
        where: { id: impersonateUserId },
        select: { role: true },
      });
      if (impUser) effectiveRole = impUser.role;
    }

    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get('domainId');
    const status = searchParams.get('status');
    const criticality = searchParams.get('criticality');
    const regulatoryBodyId = searchParams.get('regulatoryBodyId');
    const recurrence = searchParams.get('recurrence');
    const search = searchParams.get('search');
    const department = searchParams.get('department');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '0');
    const skip = limit > 0 ? (page - 1) * limit : undefined;

    // بناء شروط البحث
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { isActive: true };

    if (domainId) where.domainId = domainId;
    if (status) where.complianceStatus = status;
    if (criticality) where.criticalityLevel = criticality;
    if (regulatoryBodyId) where.regulatoryBodyId = regulatoryBodyId;
    if (recurrence) where.recurrence = recurrence;
    if (department) {
      where.OR = [
        ...(where.OR || []),
        { responsibleDepartmentAr: { contains: department } },
        { responsibleDepartmentEn: { contains: department } },
      ];
    }

    if (search) {
      where.OR = [
        { code: { contains: search } },
        { titleAr: { contains: search } },
        { titleEn: { contains: search } },
        { subDomainAr: { contains: search } },
        { regulatoryReference: { contains: search } },
      ];
    }

    // فلترة حسب الصلاحيات - riskChampion يرى فقط التزامات إدارته
    if (effectiveRole === 'riskChampion') {
      const user = await prisma.user.findUnique({
        where: { id: effectiveUserId },
        include: {
          department: true,
          accessibleDepartments: { select: { department: { select: { nameAr: true, nameEn: true } } } },
        },
      });

      if (user) {
        const deptNames = [
          user.department?.nameAr,
          user.department?.nameEn,
          ...user.accessibleDepartments.map(a => a.department.nameAr),
          ...user.accessibleDepartments.map(a => a.department.nameEn),
        ].filter(Boolean) as string[];

        if (deptNames.length > 0) {
          where.OR = deptNames.flatMap(name => [
            { responsibleDepartmentAr: { contains: name } },
            { responsibleDepartmentEn: { contains: name } },
          ]);
        }
      }
    }

    const obligations = await prisma.complianceObligation.findMany({
      where,
      include: {
        domain: { select: { id: true, nameAr: true, nameEn: true, code: true } },
        regulatoryBody: { select: { id: true, nameAr: true, nameEn: true } },
        _count: { select: { riskLinks: true, assessments: true } },
      },
      orderBy: [
        { sequenceNumber: 'asc' },
      ],
      ...(limit > 0 && { skip, take: limit }),
    });

    const total = limit > 0 ? await prisma.complianceObligation.count({ where }) : obligations.length;

    return NextResponse.json({
      success: true,
      data: obligations,
      count: obligations.length,
      ...(limit > 0 && {
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasMore: page * limit < total,
        },
      }),
    });
  } catch (error) {
    console.error('Error fetching compliance obligations:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب الالتزامات' },
      { status: 500 }
    );
  }
}

// POST - إنشاء التزام جديد (admin/riskManager فقط)
export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(`compliance-post-${clientIP}`, rateLimitConfigs.write);
    if (!rateLimit.success) {
      return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!['admin', 'riskManager'].includes(session.user.role)) {
      return NextResponse.json({ success: false, error: 'ليس لديك صلاحية إنشاء التزامات' }, { status: 403 });
    }

    const body = await request.json();

    if (!body.titleAr && !body.titleEn) {
      return NextResponse.json({ success: false, error: 'عنوان الالتزام مطلوب' }, { status: 400 });
    }

    if (!body.domainId) {
      return NextResponse.json({ success: false, error: 'المجال مطلوب' }, { status: 400 });
    }

    // توليد كود تلقائي
    let code = body.code;
    if (!code) {
      const lastObligation = await prisma.complianceObligation.findFirst({
        orderBy: { sequenceNumber: 'desc' },
        select: { sequenceNumber: true },
      });
      const nextSeq = (lastObligation?.sequenceNumber || 0) + 1;
      code = `CMP-NEW-${String(nextSeq).padStart(3, '0')}`;
    }

    // التحقق من عدم تكرار الكود
    const existing = await prisma.complianceObligation.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ success: false, error: 'كود الالتزام موجود مسبقاً' }, { status: 400 });
    }

    const lastSeq = await prisma.complianceObligation.findFirst({
      orderBy: { sequenceNumber: 'desc' },
      select: { sequenceNumber: true },
    });

    const likelihood = body.nonComplianceLikelihood || 1;
    const impact = body.nonComplianceImpact || 1;
    const riskScore = likelihood * impact;

    const obligation = await prisma.complianceObligation.create({
      data: {
        code,
        sequenceNumber: (lastSeq?.sequenceNumber || 0) + 1,
        domainId: body.domainId,
        subDomainAr: body.subDomainAr || null,
        subDomainEn: body.subDomainEn || null,
        titleAr: body.titleAr || '',
        titleEn: body.titleEn || '',
        regulatoryReference: body.regulatoryReference || null,
        articleNumber: body.articleNumber || null,
        internalPolicyAr: body.internalPolicyAr || null,
        internalPolicyEn: body.internalPolicyEn || null,
        policyDocumentNumber: body.policyDocumentNumber || null,
        regulatoryBodyId: body.regulatoryBodyId || null,
        obligationType: body.obligationType || 'mandatory',
        responsibleDepartmentAr: body.responsibleDepartmentAr || null,
        responsibleDepartmentEn: body.responsibleDepartmentEn || null,
        directOwnerAr: body.directOwnerAr || null,
        directOwnerEn: body.directOwnerEn || null,
        backupOwnerAr: body.backupOwnerAr || null,
        backupOwnerEn: body.backupOwnerEn || null,
        defenseLine: body.defenseLine || null,
        recurrence: body.recurrence || 'annual',
        nextDueDate: body.nextDueDate ? new Date(body.nextDueDate) : null,
        lastReviewDate: body.lastReviewDate ? new Date(body.lastReviewDate) : null,
        nextReviewDate: body.nextReviewDate ? new Date(body.nextReviewDate) : null,
        alertDaysBefore: body.alertDaysBefore || 30,
        criticalityLevel: body.criticalityLevel || 'medium',
        nonComplianceLikelihood: likelihood,
        nonComplianceImpact: impact,
        riskScore,
        riskRating: calculateRiskRating(riskScore),
        potentialPenaltiesAr: body.potentialPenaltiesAr || null,
        potentialPenaltiesEn: body.potentialPenaltiesEn || null,
        complianceStatus: body.complianceStatus || 'notAssessed',
        completionPercentage: body.completionPercentage || 0,
        controlActivitiesAr: body.controlActivitiesAr || null,
        controlActivitiesEn: body.controlActivitiesEn || null,
        testingMethod: body.testingMethod || null,
        lastTestResult: body.lastTestResult || null,
        lastTestDate: body.lastTestDate ? new Date(body.lastTestDate) : null,
        evidenceRequirementsAr: body.evidenceRequirementsAr || null,
        evidenceRequirementsEn: body.evidenceRequirementsEn || null,
        gapDescriptionAr: body.gapDescriptionAr || null,
        gapDescriptionEn: body.gapDescriptionEn || null,
        remediationPlanAr: body.remediationPlanAr || null,
        remediationPlanEn: body.remediationPlanEn || null,
        remediationTargetDate: body.remediationTargetDate ? new Date(body.remediationTargetDate) : null,
        remediationOwnerAr: body.remediationOwnerAr || null,
        remediationOwnerEn: body.remediationOwnerEn || null,
        remediationStatus: body.remediationStatus || 'notApplicable',
        linkedRiskNumbers: body.linkedRiskNumbers || null,
        kpiKriAr: body.kpiKriAr || null,
        kpiKriEn: body.kpiKriEn || null,
        notesAr: body.notesAr || null,
        notesEn: body.notesEn || null,
        createdById: session.user.id,
      },
      include: {
        domain: true,
        regulatoryBody: true,
      },
    });

    // تسجيل في سجل المراجعة
    const clientInfo = getClientInfo(request);
    await createAuditLog({
      userId: session.user.id,
      action: 'create',
      entity: 'compliance' as 'risk',
      entityId: obligation.code,
      newValues: { code: obligation.code, title: obligation.titleAr },
      ...clientInfo,
    });

    // تسجيل في سجل تغييرات الالتزام
    await prisma.complianceChangeLog.create({
      data: {
        obligationId: obligation.id,
        userId: session.user.id,
        changeType: 'create',
        description: `Created obligation ${obligation.code}`,
        descriptionAr: `تم إنشاء الالتزام ${obligation.code}`,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
      },
    });

    return NextResponse.json({ success: true, data: obligation });
  } catch (error) {
    console.error('Error creating compliance obligation:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء الالتزام' },
      { status: 500 }
    );
  }
}

function calculateRiskRating(score: number): string {
  if (score >= 20) return 'critical';
  if (score >= 15) return 'high';
  if (score >= 10) return 'medium';
  if (score >= 5) return 'low';
  return 'veryLow';
}
