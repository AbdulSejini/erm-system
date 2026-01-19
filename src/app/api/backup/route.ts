import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - تصدير نسخة احتياطية من قاعدة البيانات
export async function GET() {
  try {
    // جلب جميع البيانات من قاعدة البيانات
    const [
      users,
      departments,
      categories,
      risks,
      riskStatuses,
      sources,
      comments,
      userDepartmentAccess,
      auditLogs,
      notifications,
    ] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          fullName: true,
          fullNameEn: true,
          email: true,
          role: true,
          status: true,
          phone: true,
          departmentId: true,
          createdAt: true,
          updatedAt: true,
          // لا نصدر كلمات المرور لأسباب أمنية
        },
      }),
      prisma.department.findMany(),
      prisma.riskCategory.findMany(),
      prisma.risk.findMany(),
      prisma.riskStatus.findMany(),
      prisma.riskSource.findMany(),
      prisma.riskComment.findMany(),
      prisma.userDepartmentAccess.findMany(),
      prisma.auditLog.findMany({
        take: 1000, // آخر 1000 سجل فقط
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.findMany({
        take: 500, // آخر 500 إشعار فقط
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const backup = {
      version: '1.0',
      createdAt: new Date().toISOString(),
      system: 'ERM System',
      data: {
        users,
        departments,
        categories,
        risks,
        riskStatuses,
        sources,
        comments,
        userDepartmentAccess,
        auditLogs,
        notifications,
      },
      stats: {
        users: users.length,
        departments: departments.length,
        categories: categories.length,
        risks: risks.length,
        riskStatuses: riskStatuses.length,
        sources: sources.length,
        comments: comments.length,
        userDepartmentAccess: userDepartmentAccess.length,
        auditLogs: auditLogs.length,
        notifications: notifications.length,
      },
    };

    // إرجاع الملف كـ JSON للتحميل
    const jsonString = JSON.stringify(backup, null, 2);
    const fileName = `erm-backup-${new Date().toISOString().split('T')[0]}.json`;

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء النسخة الاحتياطية' },
      { status: 500 }
    );
  }
}

// POST - استعادة نسخة احتياطية
export async function POST(request: NextRequest) {
  try {
    const backup = await request.json();

    // التحقق من صحة ملف النسخة الاحتياطية
    if (!backup.version || !backup.data || !backup.system) {
      return NextResponse.json(
        { success: false, error: 'ملف النسخة الاحتياطية غير صالح' },
        { status: 400 }
      );
    }

    if (backup.system !== 'ERM System') {
      return NextResponse.json(
        { success: false, error: 'ملف النسخة الاحتياطية ليس من نظام ERM' },
        { status: 400 }
      );
    }

    const results = {
      departments: 0,
      categories: 0,
      users: 0,
      risks: 0,
      riskStatuses: 0,
      sources: 0,
      comments: 0,
      userDepartmentAccess: 0,
      errors: [] as string[],
    };

    // استعادة الإدارات
    if (backup.data.departments && Array.isArray(backup.data.departments)) {
      for (const dept of backup.data.departments) {
        try {
          await prisma.department.upsert({
            where: { id: dept.id },
            update: {
              nameAr: dept.nameAr,
              nameEn: dept.nameEn,
              code: dept.code,
              type: dept.type,
              parentId: dept.parentId,
              managerId: dept.managerId,
              riskChampionId: dept.riskChampionId,
            },
            create: dept,
          });
          results.departments++;
        } catch (e) {
          results.errors.push(`Department ${dept.code}: ${e}`);
        }
      }
    }

    // استعادة الفئات
    if (backup.data.categories && Array.isArray(backup.data.categories)) {
      for (const cat of backup.data.categories) {
        try {
          await prisma.riskCategory.upsert({
            where: { id: cat.id },
            update: {
              nameAr: cat.nameAr,
              nameEn: cat.nameEn,
              code: cat.code,
              descriptionAr: cat.descriptionAr,
              descriptionEn: cat.descriptionEn,
              color: cat.color,
            },
            create: cat,
          });
          results.categories++;
        } catch (e) {
          results.errors.push(`Category ${cat.code}: ${e}`);
        }
      }
    }

    // استعادة حالات المخاطر
    if (backup.data.riskStatuses && Array.isArray(backup.data.riskStatuses)) {
      for (const status of backup.data.riskStatuses) {
        try {
          await prisma.riskStatus.upsert({
            where: { id: status.id },
            update: {
              nameAr: status.nameAr,
              nameEn: status.nameEn,
              code: status.code,
              color: status.color,
              order: status.order,
              isDefault: status.isDefault,
              isActive: status.isActive,
            },
            create: status,
          });
          results.riskStatuses++;
        } catch (e) {
          results.errors.push(`RiskStatus ${status.code}: ${e}`);
        }
      }
    }

    // استعادة المصادر
    if (backup.data.sources && Array.isArray(backup.data.sources)) {
      for (const source of backup.data.sources) {
        try {
          await prisma.riskSource.upsert({
            where: { id: source.id },
            update: {
              nameAr: source.nameAr,
              nameEn: source.nameEn,
              code: source.code,
            },
            create: source,
          });
          results.sources++;
        } catch (e) {
          results.errors.push(`Source ${source.code}: ${e}`);
        }
      }
    }

    // استعادة المخاطر
    if (backup.data.risks && Array.isArray(backup.data.risks)) {
      for (const risk of backup.data.risks) {
        try {
          await prisma.risk.upsert({
            where: { id: risk.id },
            update: {
              riskNumber: risk.riskNumber,
              titleAr: risk.titleAr,
              titleEn: risk.titleEn,
              descriptionAr: risk.descriptionAr,
              descriptionEn: risk.descriptionEn,
              categoryId: risk.categoryId,
              departmentId: risk.departmentId,
              ownerId: risk.ownerId,
              championId: risk.championId,
              sourceId: risk.sourceId,
              statusId: risk.statusId,
              status: risk.status,
              approvalStatus: risk.approvalStatus,
              inherentLikelihood: risk.inherentLikelihood,
              inherentImpact: risk.inherentImpact,
              inherentScore: risk.inherentScore,
              inherentRating: risk.inherentRating,
              residualLikelihood: risk.residualLikelihood,
              residualImpact: risk.residualImpact,
              residualScore: risk.residualScore,
              residualRating: risk.residualRating,
              potentialCauseAr: risk.potentialCauseAr,
              potentialCauseEn: risk.potentialCauseEn,
              potentialImpactAr: risk.potentialImpactAr,
              potentialImpactEn: risk.potentialImpactEn,
              layersOfProtectionAr: risk.layersOfProtectionAr,
              layersOfProtectionEn: risk.layersOfProtectionEn,
              mitigationActionsAr: risk.mitigationActionsAr,
              mitigationActionsEn: risk.mitigationActionsEn,
              krisAr: risk.krisAr,
              krisEn: risk.krisEn,
              followUpDate: risk.followUpDate ? new Date(risk.followUpDate) : null,
              lastReviewDate: risk.lastReviewDate ? new Date(risk.lastReviewDate) : null,
              nextReviewDate: risk.nextReviewDate ? new Date(risk.nextReviewDate) : null,
            },
            create: {
              ...risk,
              identifiedDate: risk.identifiedDate ? new Date(risk.identifiedDate) : new Date(),
              followUpDate: risk.followUpDate ? new Date(risk.followUpDate) : null,
              lastReviewDate: risk.lastReviewDate ? new Date(risk.lastReviewDate) : null,
              nextReviewDate: risk.nextReviewDate ? new Date(risk.nextReviewDate) : null,
              createdAt: risk.createdAt ? new Date(risk.createdAt) : new Date(),
              updatedAt: risk.updatedAt ? new Date(risk.updatedAt) : new Date(),
            },
          });
          results.risks++;
        } catch (e) {
          results.errors.push(`Risk ${risk.riskNumber}: ${e}`);
        }
      }
    }

    // استعادة التعليقات
    if (backup.data.comments && Array.isArray(backup.data.comments)) {
      for (const comment of backup.data.comments) {
        try {
          const existingComment = await prisma.riskComment.findUnique({
            where: { id: comment.id },
          });
          if (!existingComment) {
            await prisma.riskComment.create({
              data: {
                ...comment,
                createdAt: comment.createdAt ? new Date(comment.createdAt) : new Date(),
                updatedAt: comment.updatedAt ? new Date(comment.updatedAt) : new Date(),
              },
            });
            results.comments++;
          }
        } catch (e) {
          results.errors.push(`Comment ${comment.id}: ${e}`);
        }
      }
    }

    // استعادة صلاحيات الوصول
    if (backup.data.userDepartmentAccess && Array.isArray(backup.data.userDepartmentAccess)) {
      for (const access of backup.data.userDepartmentAccess) {
        try {
          await prisma.userDepartmentAccess.upsert({
            where: {
              userId_departmentId: {
                userId: access.userId,
                departmentId: access.departmentId,
              },
            },
            update: {
              canView: access.canView,
              canEdit: access.canEdit,
            },
            create: access,
          });
          results.userDepartmentAccess++;
        } catch (e) {
          results.errors.push(`UserDepartmentAccess: ${e}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'تم استعادة النسخة الاحتياطية بنجاح',
      results,
    });
  } catch (error) {
    console.error('Error restoring backup:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في استعادة النسخة الاحتياطية' },
      { status: 500 }
    );
  }
}
