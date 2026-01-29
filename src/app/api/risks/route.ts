import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { createAuditLog, getClientInfo } from '@/lib/audit';

// GET - الحصول على جميع المخاطر مع فلترة الصلاحيات
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('departmentId');
    const categoryId = searchParams.get('categoryId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const filterByAccess = searchParams.get('filterByAccess') !== 'false'; // افتراضياً يتم الفلترة

    // الحصول على الجلسة للتحقق من صلاحيات المستخدم
    const session = await auth();

    // بناء شروط البحث الأساسية
    const baseWhere: Record<string, unknown> = {};

    if (departmentId) {
      baseWhere.departmentId = departmentId;
    }
    if (categoryId) {
      baseWhere.categoryId = categoryId;
    }
    if (status) {
      baseWhere.status = status;
    }
    if (search) {
      baseWhere.OR = [
        { titleAr: { contains: search } },
        { titleEn: { contains: search } },
        { riskNumber: { contains: search } },
      ];
    }

    // تطبيق فلترة الصلاحيات حسب دور المستخدم
    let where = baseWhere;

    if (filterByAccess && session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          accessibleDepartments: {
            select: { departmentId: true },
          },
        },
      });

      if (user) {
        // المسؤول ومدير المخاطر ومحلل المخاطر والتنفيذي يرون كل المخاطر
        if (!['admin', 'riskManager', 'riskAnalyst', 'executive'].includes(user.role)) {
          // بناء قائمة الإدارات المسموح بها
          const allowedDepartmentIds = [
            user.departmentId, // الإدارة الأساسية للمستخدم
            ...user.accessibleDepartments.map(a => a.departmentId), // الإدارات الإضافية
          ].filter(Boolean) as string[];

          // إذا كان المستخدم موظف (employee) - يرى المخاطر حسب الإدارات المحددة له
          if (user.role === 'employee') {
            // التحقق من وجود RiskOwner مرتبط بهذا المستخدم عبر البريد
            const riskOwner = await prisma.riskOwner.findFirst({
              where: { email: user.email },
            });

            // بناء شروط الوصول
            const accessConditions: Record<string, unknown>[] = [
              { ownerId: user.id }, // مالك الخطر (User)
              { championId: user.id }, // رائد الخطر
            ];

            // إضافة المخاطر حسب RiskOwner إن وجد
            if (riskOwner) {
              accessConditions.push({ riskOwnerId: riskOwner.id });
            }

            // إضافة المخاطر حسب الإدارات المسموح بها
            if (allowedDepartmentIds.length > 0) {
              accessConditions.push({ departmentId: { in: allowedDepartmentIds } });
            }

            where = {
              ...baseWhere,
              OR: accessConditions,
            };
          }
          // إذا كان رائد مخاطر - يرى مخاطر إداراته فقط
          else if (user.role === 'riskChampion') {
            if (allowedDepartmentIds.length > 0) {
              where = {
                ...baseWhere,
                OR: [
                  { departmentId: { in: allowedDepartmentIds } }, // مخاطر الإدارات المسموح بها
                  { championId: user.id }, // أو المخاطر التي هو رائدها
                  { ownerId: user.id }, // أو المخاطر التي هو مالكها
                ],
              };
            } else {
              // إذا لم يكن لديه إدارات، يرى فقط المخاطر المرتبطة به مباشرة
              where = {
                ...baseWhere,
                OR: [
                  { championId: user.id },
                  { ownerId: user.id },
                ],
              };
            }
          }
        }
      }
    }

    const risks = await prisma.risk.findMany({
      where,
      include: {
        category: true,
        department: true,
        source: true,
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
      },
      orderBy: [
        // المخاطر المحذوفة تأتي في النهاية دائماً
        { isDeleted: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: risks,
      count: risks.length,
    });
  } catch (error) {
    console.error('Error fetching risks:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب المخاطر' },
      { status: 500 }
    );
  }
}

// POST - إنشاء خطر جديد أو استيراد مجموعة مخاطر
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // التحقق مما إذا كان استيراد جماعي
    if (body.bulkImport && Array.isArray(body.risks)) {
      return handleBulkImport(body.risks, body.mode || 'addAndUpdate');
    }

    // Get session for audit logging
    const session = await auth();
    const clientInfo = getClientInfo(request);

    // التحقق من عدم تكرار رقم الخطر
    if (body.riskNumber) {
      const existingRisk = await prisma.risk.findUnique({
        where: { riskNumber: body.riskNumber },
      });
      if (existingRisk) {
        return NextResponse.json(
          {
            success: false,
            error: 'رقم الخطر موجود مسبقاً',
            errorEn: 'Risk ID already exists',
            field: 'riskNumber'
          },
          { status: 400 }
        );
      }
    }

    // إنشاء خطر واحد
    const risk = await prisma.risk.create({
      data: {
        riskNumber: body.riskNumber,
        titleAr: body.titleAr,
        titleEn: body.titleEn,
        descriptionAr: body.descriptionAr || '',
        descriptionEn: body.descriptionEn || '',
        categoryId: body.categoryId || null,
        departmentId: body.departmentId,
        sourceId: body.sourceId || null,
        issuedBy: body.issuedBy || null,
        processText: body.processText || null,
        subProcessText: body.subProcessText || null,
        inherentLikelihood: body.inherentLikelihood || 3,
        inherentImpact: body.inherentImpact || 3,
        inherentScore: (body.inherentLikelihood || 3) * (body.inherentImpact || 3),
        inherentRating: body.inherentRating || calculateRating((body.inherentLikelihood || 3) * (body.inherentImpact || 3)),
        residualLikelihood: body.residualLikelihood,
        residualImpact: body.residualImpact,
        residualScore: body.residualLikelihood && body.residualImpact
          ? body.residualLikelihood * body.residualImpact
          : null,
        residualRating: body.residualLikelihood && body.residualImpact
          ? calculateRating(body.residualLikelihood * body.residualImpact)
          : null,
        status: body.status || 'open',
        approvalStatus: body.approvalStatus || 'Draft',
        ownerId: body.ownerId,
        riskOwnerId: body.riskOwnerId || null,
        championId: body.championId || null,
        createdById: body.createdById || body.ownerId,
        mitigationActionsAr: body.mitigationActionsAr,
        mitigationActionsEn: body.mitigationActionsEn,
        followUpDate: body.followUpDate ? new Date(body.followUpDate) : null,
        nextReviewDate: body.nextReviewDate ? new Date(body.nextReviewDate) : null,
      },
      include: {
        category: true,
        department: true,
        source: true,
        riskOwner: true,
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
      },
    });

    // Log the creation
    if (session?.user?.id) {
      await createAuditLog({
        userId: session.user.id,
        action: 'create',
        entity: 'risk',
        entityId: risk.riskNumber,
        newValues: { riskNumber: risk.riskNumber, title: risk.titleEn },
        ...clientInfo,
      });

      // إرسال الإشعارات للمستخدمين المعنيين
      const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, fullName: true },
      });

      if (currentUser) {
        await sendNewRiskNotifications(risk, currentUser);
      }
    }

    return NextResponse.json({
      success: true,
      data: risk,
    });
  } catch (error) {
    console.error('Error creating risk:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء الخطر' },
      { status: 500 }
    );
  }
}

// دالة حساب تصنيف الخطر
function calculateRating(score: number): string {
  if (score >= 20) return 'Critical';
  if (score >= 15) return 'Major';
  if (score >= 10) return 'Moderate';
  if (score >= 5) return 'Minor';
  return 'Negligible';
}

// دالة الاستيراد الجماعي
async function handleBulkImport(
  risks: Array<Record<string, unknown>>,
  mode: 'addOnly' | 'updateOnly' | 'addAndUpdate'
) {
  const results = {
    added: 0,
    updated: 0,
    skipped: 0,
    errors: [] as string[],
  };

  // الحصول على الإدارات والفئات والمستخدمين الموجودين
  const [departments, categories, users] = await Promise.all([
    prisma.department.findMany(),
    prisma.riskCategory.findMany(),
    prisma.user.findMany({ select: { id: true, fullName: true, fullNameEn: true } }),
  ]);

  // إنشاء خرائط للبحث السريع
  const deptMap = new Map(departments.map(d => [d.nameAr.toLowerCase(), d.id]));
  const deptMapEn = new Map(departments.map(d => [d.nameEn.toLowerCase(), d.id]));
  const deptMapCode = new Map(departments.map(d => [d.code.toLowerCase(), d.id])); // خريطة بالرمز
  const catMap = new Map(categories.map(c => [c.nameAr.toLowerCase(), c.id]));
  const catMapEn = new Map(categories.map(c => [c.nameEn.toLowerCase(), c.id]));
  const catMapCode = new Map(categories.map(c => [c.code.toLowerCase(), c.id])); // خريطة بالرمز
  const userMap = new Map(users.map(u => [u.fullName.toLowerCase(), u.id]));
  const userMapEn = new Map(users.filter(u => u.fullNameEn).map(u => [u.fullNameEn!.toLowerCase(), u.id]));

  // الحصول على مستخدم افتراضي (أول admin أو أي مستخدم)
  let defaultUserId = users.find(u => true)?.id;
  if (!defaultUserId) {
    // إنشاء مستخدم افتراضي إذا لم يوجد
    const defaultUser = await prisma.user.create({
      data: {
        email: 'system@erm.local',
        password: 'system',
        fullName: 'النظام',
        fullNameEn: 'System',
        role: 'admin',
      },
    });
    defaultUserId = defaultUser.id;
  }

  // الحصول على إدارة افتراضية
  let defaultDeptId = departments[0]?.id;
  if (!defaultDeptId) {
    const defaultDept = await prisma.department.create({
      data: {
        nameAr: 'عام',
        nameEn: 'General',
        code: 'GEN',
      },
    });
    defaultDeptId = defaultDept.id;
  }

  for (const riskData of risks) {
    try {
      // دعم أسماء الأعمدة المختلفة (بمسافة أو شرطة سفلية)
      const riskNumber = String(riskData.Risk_ID || riskData['Risk ID'] || riskData.riskNumber || '').trim();

      if (!riskNumber) {
        results.errors.push('خطر بدون رقم تعريفي');
        results.skipped++;
        continue;
      }

      // البحث عن الخطر الموجود
      const existingRisk = await prisma.risk.findUnique({
        where: { riskNumber },
      });

      // تحديد الإدارة (بالاسم أو الرمز) - دعم أسماء الأعمدة المختلفة
      const deptCode = String(riskData.Department_Code || riskData['Department Code'] || '').toLowerCase().trim();
      const deptName = String(riskData.Department || '').toLowerCase().trim();

      let departmentId = deptMapCode.get(deptCode) || deptMap.get(deptName) || deptMapEn.get(deptName) || defaultDeptId;

      // تحديد الفئة (بالاسم أو الرمز) - دعم أسماء الأعمدة المختلفة
      const catCode = String(riskData.Category_Code || riskData['Category Code'] || '').toLowerCase().trim();
      const catName = String(riskData.Category || '').toLowerCase().trim();
      const categoryId = catMapCode.get(catCode) || catMap.get(catName) || catMapEn.get(catName) || null;

      // تحديد المالك
      const ownerName = String(riskData.Owner_AR || riskData.Owner_EN || '').toLowerCase().trim();
      const ownerId = userMap.get(ownerName) || userMapEn.get(ownerName) || defaultUserId;

      // تحويل البيانات
      const likelihood = parseInt(String(riskData.Likelihood || '3')) || 3;
      const impact = parseInt(String(riskData.Impact || '3')) || 3;
      const score = likelihood * impact;
      const rating = String(riskData.Risk_Rating || '') || calculateRating(score);

      if (existingRisk) {
        // الخطر موجود
        if (mode === 'addOnly') {
          results.skipped++;
          continue;
        }

        // بناء payload للتحديث - فقط الحقول الموجودة في البيانات المستوردة
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updatePayload: any = {};

        if (riskData.Title_AR || riskData.titleAr) updatePayload.titleAr = String(riskData.Title_AR || riskData.titleAr);
        if (riskData.Title_EN || riskData.titleEn) updatePayload.titleEn = String(riskData.Title_EN || riskData.titleEn);
        if (riskData.Description_AR || riskData.descriptionAr) updatePayload.descriptionAr = String(riskData.Description_AR || riskData.descriptionAr);
        if (riskData.Description_EN || riskData.descriptionEn) updatePayload.descriptionEn = String(riskData.Description_EN || riskData.descriptionEn);
        if (riskData.Category || riskData.Category_Code || riskData['Category Code']) updatePayload.categoryId = categoryId;
        if (riskData.Department || riskData.Department_Code || riskData['Department Code']) updatePayload.departmentId = departmentId;
        if (riskData.Likelihood) {
          updatePayload.inherentLikelihood = likelihood;
          updatePayload.inherentImpact = impact;
          updatePayload.inherentScore = score;
          updatePayload.inherentRating = rating;
        }
        if (riskData.Status) updatePayload.status = mapStatus(String(riskData.Status));
        if (riskData.Potential_Cause_AR) updatePayload.potentialCauseAr = String(riskData.Potential_Cause_AR);
        if (riskData.Potential_Cause_EN) updatePayload.potentialCauseEn = String(riskData.Potential_Cause_EN);
        if (riskData.Potential_Impact_AR) updatePayload.potentialImpactAr = String(riskData.Potential_Impact_AR);
        if (riskData.Potential_Impact_EN) updatePayload.potentialImpactEn = String(riskData.Potential_Impact_EN);
        if (riskData.Layers_Of_Protection_AR) updatePayload.layersOfProtectionAr = String(riskData.Layers_Of_Protection_AR);
        if (riskData.Layers_Of_Protection_EN) updatePayload.layersOfProtectionEn = String(riskData.Layers_Of_Protection_EN);
        if (riskData.KRIs_AR) updatePayload.krisAr = String(riskData.KRIs_AR);
        if (riskData.KRIs_EN) updatePayload.krisEn = String(riskData.KRIs_EN);
        if (riskData.Treatment_Plan_AR) updatePayload.mitigationActionsAr = String(riskData.Treatment_Plan_AR);
        if (riskData.Treatment_Plan_EN) updatePayload.mitigationActionsEn = String(riskData.Treatment_Plan_EN);
        if (riskData.Due_Date) updatePayload.followUpDate = parseDate(riskData.Due_Date);
        if (riskData.Review_Date) updatePayload.nextReviewDate = parseDate(riskData.Review_Date);
        if (riskData.Process) updatePayload.processText = String(riskData.Process);
        if (riskData.Sub_Process) updatePayload.subProcessText = String(riskData.Sub_Process);
        if (riskData.Approval_Status) updatePayload.approvalStatus = String(riskData.Approval_Status);

        // تحديث الخطر - فقط الحقول الموجودة في payload
        await prisma.risk.update({
          where: { riskNumber },
          data: updatePayload,
        });
        results.updated++;
      } else {
        // خطر جديد
        if (mode === 'updateOnly') {
          results.skipped++;
          continue;
        }

        // payload كامل للإضافة الجديدة
        const createPayload = {
          riskNumber,
          titleAr: String(riskData.Title_AR || riskData.titleAr || riskNumber),
          titleEn: String(riskData.Title_EN || riskData.titleEn || riskNumber),
          descriptionAr: String(riskData.Description_AR || riskData.descriptionAr || ''),
          descriptionEn: String(riskData.Description_EN || riskData.descriptionEn || ''),
          categoryId,
          departmentId,
          inherentLikelihood: likelihood,
          inherentImpact: impact,
          inherentScore: score,
          inherentRating: rating,
          status: mapStatus(String(riskData.Status || 'open')),
          ownerId,
          createdById: defaultUserId,
          potentialCauseAr: riskData.Potential_Cause_AR ? String(riskData.Potential_Cause_AR) : null,
          potentialCauseEn: riskData.Potential_Cause_EN ? String(riskData.Potential_Cause_EN) : null,
          potentialImpactAr: riskData.Potential_Impact_AR ? String(riskData.Potential_Impact_AR) : null,
          potentialImpactEn: riskData.Potential_Impact_EN ? String(riskData.Potential_Impact_EN) : null,
          layersOfProtectionAr: riskData.Layers_Of_Protection_AR ? String(riskData.Layers_Of_Protection_AR) : null,
          layersOfProtectionEn: riskData.Layers_Of_Protection_EN ? String(riskData.Layers_Of_Protection_EN) : null,
          krisAr: riskData.KRIs_AR ? String(riskData.KRIs_AR) : null,
          krisEn: riskData.KRIs_EN ? String(riskData.KRIs_EN) : null,
          mitigationActionsAr: riskData.Treatment_Plan_AR ? String(riskData.Treatment_Plan_AR) : null,
          mitigationActionsEn: riskData.Treatment_Plan_EN ? String(riskData.Treatment_Plan_EN) : null,
          followUpDate: parseDate(riskData.Due_Date),
          nextReviewDate: parseDate(riskData.Review_Date),
          processText: riskData.Process ? String(riskData.Process) : null,
          subProcessText: riskData.Sub_Process ? String(riskData.Sub_Process) : null,
          approvalStatus: riskData.Approval_Status ? String(riskData.Approval_Status) : 'Draft',
        };

        // إضافة الخطر
        await prisma.risk.create({
          data: createPayload,
        });
        results.added++;
      }
    } catch (error) {
      console.error('Error processing risk:', error);
      results.errors.push(`خطأ في معالجة الخطر: ${String(riskData.Risk_ID || 'unknown')}`);
      results.skipped++;
    }
  }

  return NextResponse.json({
    success: true,
    results,
    message: `تم الاستيراد: ${results.added} جديد، ${results.updated} محدث، ${results.skipped} تم تخطيه`,
  });
}

// دالة تحويل الحالة
function mapStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'مفتوح': 'open',
    'open': 'open',
    'قيد المعالجة': 'inProgress',
    'in progress': 'inProgress',
    'inprogress': 'inProgress',
    'تم التخفيف': 'mitigated',
    'mitigated': 'mitigated',
    'مغلق': 'closed',
    'closed': 'closed',
    'مقبول': 'accepted',
    'accepted': 'accepted',
  };
  return statusMap[status.toLowerCase()] || 'open';
}

// دالة تحويل التاريخ
function parseDate(dateValue: unknown): Date | null {
  if (!dateValue) return null;
  const date = new Date(String(dateValue));
  return isNaN(date.getTime()) ? null : date;
}

// دالة إرسال الإشعارات عند إنشاء خطر جديد
// الإشعارات تصل للمستخدمين حسب وظيفتهم والأقسام المتاحة لهم
// من أنشأ الخطر لا يستلم إشعار
async function sendNewRiskNotifications(
  risk: {
    id: string;
    riskNumber: string;
    titleAr: string;
    titleEn: string | null;
    departmentId: string;
    ownerId: string;
    riskOwnerId: string | null;
    championId: string | null;
    department: { nameAr: string; nameEn: string } | null;
  },
  currentUser: {
    id: string;
    fullName: string;
  }
) {
  try {
    const notificationRecipients = new Set<string>();

    // 1. صاحب الخطر (ownerId - User)
    if (risk.ownerId !== currentUser.id) {
      notificationRecipients.add(risk.ownerId);
    }

    // 2. صاحب الخطر (riskOwnerId - RiskOwner) - البحث عن المستخدم المرتبط بالبريد
    if (risk.riskOwnerId) {
      const riskOwner = await prisma.riskOwner.findUnique({
        where: { id: risk.riskOwnerId },
        select: { email: true },
      });

      if (riskOwner?.email) {
        const riskOwnerUser = await prisma.user.findUnique({
          where: { email: riskOwner.email },
          select: { id: true, status: true },
        });

        if (riskOwnerUser && riskOwnerUser.status === 'active' && riskOwnerUser.id !== currentUser.id) {
          notificationRecipients.add(riskOwnerUser.id);
        }
      }
    }

    // 3. رائد المخاطر للخطر (championId)
    if (risk.championId && risk.championId !== currentUser.id) {
      notificationRecipients.add(risk.championId);
    }

    // 4. رائد المخاطر للوظيفة/القسم (department.riskChampionId)
    const department = await prisma.department.findUnique({
      where: { id: risk.departmentId },
      select: {
        riskChampionId: true,
        code: true,
        nameAr: true,
      },
    });

    if (department?.riskChampionId && department.riskChampionId !== currentUser.id) {
      notificationRecipients.add(department.riskChampionId);
    }

    // 5. فريق إدارة المخاطر (admin, riskManager, riskAnalyst)
    // يستلمون إشعارات لجميع المخاطر الجديدة
    const riskManagementTeam = await prisma.user.findMany({
      where: {
        role: { in: ['admin', 'riskManager', 'riskAnalyst'] },
        status: 'active',
        id: { not: currentUser.id },
      },
      select: { id: true },
    });

    for (const member of riskManagementTeam) {
      notificationRecipients.add(member.id);
    }

    // 6. المستخدمين في نفس الوظيفة/القسم (departmentId)
    const departmentUsers = await prisma.user.findMany({
      where: {
        departmentId: risk.departmentId,
        status: 'active',
        id: { not: currentUser.id },
      },
      select: { id: true },
    });

    for (const user of departmentUsers) {
      notificationRecipients.add(user.id);
    }

    // 7. المستخدمين الذين لديهم صلاحية الوصول للوظيفة (UserDepartmentAccess)
    const usersWithAccess = await prisma.userDepartmentAccess.findMany({
      where: {
        departmentId: risk.departmentId,
        canView: true,
        user: {
          status: 'active',
          id: { not: currentUser.id },
        },
      },
      select: { userId: true },
    });

    for (const access of usersWithAccess) {
      notificationRecipients.add(access.userId);
    }

    // 8. رواد المخاطر الذين يديرون الوظيفة/القسم (championDepartments)
    const championUsers = await prisma.user.findMany({
      where: {
        role: 'riskChampion',
        status: 'active',
        id: { not: currentUser.id },
        championDepartments: {
          some: { id: risk.departmentId },
        },
      },
      select: { id: true },
    });

    for (const champion of championUsers) {
      notificationRecipients.add(champion.id);
    }

    // إنشاء الإشعارات
    const notifications = Array.from(notificationRecipients).map((userId) => ({
      userId,
      type: 'newRisk',
      titleAr: `خطر جديد: ${risk.riskNumber}`,
      titleEn: `New risk: ${risk.riskNumber}`,
      messageAr: `تم إضافة خطر جديد "${risk.titleAr}" في ${department?.nameAr || 'القسم'}`,
      messageEn: `New risk "${risk.titleEn || risk.titleAr}" added in ${risk.department?.nameEn || 'department'}`,
      link: `/risks/${risk.id}`,
      isRead: false,
    }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications,
      });
    }

    console.log(`Sent ${notifications.length} notifications for new risk ${risk.riskNumber} (${department?.code || 'N/A'})`);
  } catch (error) {
    console.error('Error sending new risk notifications:', error);
    // لا نريد أن يفشل إنشاء الخطر بسبب فشل الإشعارات
  }
}
