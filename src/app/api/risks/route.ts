import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { createAuditLog, getClientInfo } from '@/lib/audit';

// GET - الحصول على جميع المخاطر
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('departmentId');
    const categoryId = searchParams.get('categoryId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};

    if (departmentId) {
      where.departmentId = departmentId;
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { titleAr: { contains: search } },
        { titleEn: { contains: search } },
        { riskNumber: { contains: search } },
      ];
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
      orderBy: {
        createdAt: 'desc',
      },
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
        residualRating: body.residualRating,
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
  const catMap = new Map(categories.map(c => [c.nameAr.toLowerCase(), c.id]));
  const catMapEn = new Map(categories.map(c => [c.nameEn.toLowerCase(), c.id]));
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
      const riskNumber = String(riskData.Risk_ID || riskData.riskNumber || '').trim();

      if (!riskNumber) {
        results.errors.push('خطر بدون رقم تعريفي');
        results.skipped++;
        continue;
      }

      // البحث عن الخطر الموجود
      const existingRisk = await prisma.risk.findUnique({
        where: { riskNumber },
      });

      // تحديد الإدارة
      const deptName = String(riskData.Department || '').toLowerCase().trim();
      let departmentId = deptMap.get(deptName) || deptMapEn.get(deptName) || defaultDeptId;

      // تحديد الفئة
      const catName = String(riskData.Category || '').toLowerCase().trim();
      const categoryId = catMap.get(catName) || catMapEn.get(catName) || null;

      // تحديد المالك
      const ownerName = String(riskData.Owner_AR || riskData.Owner_EN || '').toLowerCase().trim();
      const ownerId = userMap.get(ownerName) || userMapEn.get(ownerName) || defaultUserId;

      // تحويل البيانات
      const likelihood = parseInt(String(riskData.Likelihood || '3')) || 3;
      const impact = parseInt(String(riskData.Impact || '3')) || 3;
      const score = likelihood * impact;
      const rating = String(riskData.Risk_Rating || '') || calculateRating(score);

      const riskPayload = {
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
        mitigationActionsAr: String(riskData.Treatment_Plan_AR || ''),
        mitigationActionsEn: String(riskData.Treatment_Plan_EN || ''),
        followUpDate: parseDate(riskData.Due_Date),
        nextReviewDate: parseDate(riskData.Review_Date),
      };

      if (existingRisk) {
        // الخطر موجود
        if (mode === 'addOnly') {
          results.skipped++;
          continue;
        }
        // تحديث الخطر
        await prisma.risk.update({
          where: { riskNumber },
          data: riskPayload,
        });
        results.updated++;
      } else {
        // خطر جديد
        if (mode === 'updateOnly') {
          results.skipped++;
          continue;
        }
        // إضافة الخطر
        await prisma.risk.create({
          data: riskPayload,
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
