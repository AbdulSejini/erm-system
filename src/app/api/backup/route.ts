import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// الحد الأقصى للنسخ الاحتياطية المحتفظ بها
const MAX_BACKUPS = 3;

// دالة لحذف النسخ القديمة والاحتفاظ بآخر 3 نسخ فقط
async function cleanupOldBackups() {
  try {
    // جلب كل النسخ الاحتياطية مرتبة من الأحدث للأقدم
    const allBackups = await prisma.systemBackup.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // إذا كان عدد النسخ أكثر من الحد الأقصى، حذف القديمة
    if (allBackups.length > MAX_BACKUPS) {
      const backupsToDelete = allBackups.slice(MAX_BACKUPS);
      const idsToDelete = backupsToDelete.map(b => b.id);

      await prisma.systemBackup.deleteMany({
        where: { id: { in: idsToDelete } },
      });

      console.log(`Deleted ${idsToDelete.length} old backups. Keeping last ${MAX_BACKUPS}.`);
    }
  } catch (error) {
    console.error('Error cleaning up old backups:', error);
  }
}

// دالة لإنشاء بيانات النسخة الاحتياطية الشاملة
async function createBackupData() {
  // جلب جميع البيانات من قاعدة البيانات
  const [
    users,
    departments,
    processes,
    categories,
    risks,
    riskStatuses,
    sources,
    riskAssessments,
    comments,
    userDepartmentAccess,
    treatmentPlans,
    treatmentTasks,
    taskSteps,
    taskUpdates,
    riskOwners,
    riskChangeLogs,
    residualRiskRequests,
    riskApprovalRequests,
    notifications,
    auditLogs,
    systemSettings,
    likelihoodCriteria,
    impactCriteria,
    riskRatingCriteria,
    directMessages,
    incidents,
    treatmentPlanChangeLogs,
    treatmentDiscussions,
    complianceDomains,
    regulatoryBodies,
    complianceObligations,
    complianceRiskLinks,
    complianceAssessments,
    complianceChangeLogs,
  ] = await Promise.all([
    // المستخدمين (بدون كلمات المرور)
    prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        fullNameEn: true,
        email: true,
        role: true,
        status: true,
        avatar: true,
        phone: true,
        departmentId: true,
        authProvider: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    // الأقسام
    prisma.department.findMany(),
    // العمليات
    prisma.process.findMany(),
    // فئات المخاطر
    prisma.riskCategory.findMany(),
    // المخاطر
    prisma.risk.findMany(),
    // حالات المخاطر
    prisma.riskStatus.findMany(),
    // مصادر المخاطر
    prisma.riskSource.findMany(),
    // تقييمات المخاطر
    prisma.riskAssessment.findMany(),
    // تعليقات المخاطر
    prisma.riskComment.findMany(),
    // صلاحيات الأقسام للمستخدمين
    prisma.userDepartmentAccess.findMany(),
    // خطط المعالجة
    prisma.treatmentPlan.findMany(),
    // مهام المعالجة
    prisma.treatmentTask.findMany(),
    // خطوات المهام
    prisma.taskStep.findMany(),
    // تحديثات المهام
    prisma.taskUpdate.findMany(),
    // ملاك المخاطر
    prisma.riskOwner.findMany(),
    // سجل تغييرات المخاطر
    prisma.riskChangeLog.findMany({
      take: 10000,
      orderBy: { createdAt: 'desc' },
    }),
    // طلبات تغيير الخطر المتبقي
    prisma.residualRiskChangeRequest.findMany(),
    // طلبات اعتماد المخاطر
    prisma.riskApprovalRequest.findMany(),
    // الإشعارات
    prisma.notification.findMany({
      take: 5000,
      orderBy: { createdAt: 'desc' },
    }),
    // سجل التدقيق
    prisma.auditLog.findMany({
      take: 10000,
      orderBy: { createdAt: 'desc' },
    }),
    // إعدادات النظام
    prisma.systemSettings.findMany(),
    // معايير الاحتمالية
    prisma.likelihoodCriteria.findMany(),
    // معايير التأثير
    prisma.impactCriteria.findMany(),
    // معايير تصنيف الخطر
    prisma.riskRatingCriteria.findMany(),
    // الرسائل المباشرة
    prisma.directMessage.findMany({
      take: 5000,
      orderBy: { createdAt: 'desc' },
    }),
    // الحوادث
    prisma.incident.findMany(),
    // سجل تغييرات خطط المعالجة
    prisma.treatmentPlanChangeLog.findMany({
      take: 10000,
      orderBy: { createdAt: 'desc' },
    }),
    // مناقشات خطط المعالجة
    prisma.treatmentDiscussion.findMany(),
    // بيانات الالتزام
    prisma.complianceDomain.findMany(),
    prisma.regulatoryBody.findMany(),
    prisma.complianceObligation.findMany(),
    prisma.complianceRiskLink.findMany(),
    prisma.complianceAssessment.findMany(),
    prisma.complianceChangeLog.findMany({
      take: 10000,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const stats = {
    users: users.length,
    departments: departments.length,
    processes: processes.length,
    categories: categories.length,
    risks: risks.length,
    riskStatuses: riskStatuses.length,
    sources: sources.length,
    riskAssessments: riskAssessments.length,
    comments: comments.length,
    userDepartmentAccess: userDepartmentAccess.length,
    treatmentPlans: treatmentPlans.length,
    treatmentTasks: treatmentTasks.length,
    taskSteps: taskSteps.length,
    taskUpdates: taskUpdates.length,
    riskOwners: riskOwners.length,
    riskChangeLogs: riskChangeLogs.length,
    residualRiskRequests: residualRiskRequests.length,
    riskApprovalRequests: riskApprovalRequests.length,
    notifications: notifications.length,
    auditLogs: auditLogs.length,
    systemSettings: systemSettings.length,
    likelihoodCriteria: likelihoodCriteria.length,
    impactCriteria: impactCriteria.length,
    riskRatingCriteria: riskRatingCriteria.length,
    directMessages: directMessages.length,
    incidents: incidents.length,
    treatmentPlanChangeLogs: treatmentPlanChangeLogs.length,
    treatmentDiscussions: treatmentDiscussions.length,
    complianceDomains: complianceDomains.length,
    regulatoryBodies: regulatoryBodies.length,
    complianceObligations: complianceObligations.length,
    complianceRiskLinks: complianceRiskLinks.length,
    complianceAssessments: complianceAssessments.length,
    complianceChangeLogs: complianceChangeLogs.length,
  };

  const backup = {
    version: '3.0', // النسخة الشاملة
    createdAt: new Date().toISOString(),
    system: 'ERM System - Full Backup',
    data: {
      // البيانات الأساسية
      users,
      departments,
      processes,
      categories,
      riskStatuses,
      sources,
      riskOwners,
      // معايير التقييم
      likelihoodCriteria,
      impactCriteria,
      riskRatingCriteria,
      // المخاطر
      risks,
      riskAssessments,
      comments,
      riskChangeLogs,
      residualRiskRequests,
      riskApprovalRequests,
      // خطط المعالجة
      treatmentPlans,
      treatmentTasks,
      taskSteps,
      taskUpdates,
      treatmentPlanChangeLogs,
      treatmentDiscussions,
      // الحوادث
      incidents,
      // الصلاحيات والإعدادات
      userDepartmentAccess,
      systemSettings,
      // الرسائل والإشعارات
      directMessages,
      notifications,
      // سجل التدقيق
      auditLogs,
      // الالتزام
      complianceDomains,
      regulatoryBodies,
      complianceObligations,
      complianceRiskLinks,
      complianceAssessments,
      complianceChangeLogs,
    },
    stats,
  };

  return { backup, stats };
}

// GET - تصدير نسخة احتياطية من قاعدة البيانات
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const isAutomatic = request.nextUrl.searchParams.get('automatic') === 'true';

    // إنشاء بيانات النسخة الاحتياطية
    const { backup, stats } = await createBackupData();
    const jsonString = JSON.stringify(backup, null, 2);
    const fileName = `erm-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

    // تسجيل النسخة الاحتياطية في قاعدة البيانات
    await prisma.systemBackup.create({
      data: {
        fileName,
        fileSize: Buffer.byteLength(jsonString, 'utf8'),
        backupType: isAutomatic ? 'automatic' : 'manual',
        status: 'completed',
        createdById: session?.user?.id || null,
        stats: JSON.stringify(stats),
      },
    });

    // تنظيف النسخ القديمة والاحتفاظ بآخر 3 فقط
    await cleanupOldBackups();

    // إرجاع الملف كـ JSON للتحميل
    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Error creating backup:', error);

    // تسجيل الفشل
    try {
      await prisma.systemBackup.create({
        data: {
          fileName: `erm-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
          fileSize: 0,
          backupType: 'manual',
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    } catch (logError) {
      console.error('Error logging backup failure:', logError);
    }

    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء النسخة الاحتياطية' },
      { status: 500 }
    );
  }
}

// POST - استعادة نسخة احتياطية أو إنشاء نسخة تلقائية
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');

    // إذا كان الطلب لإنشاء نسخة تلقائية
    if (contentType === 'application/x-www-form-urlencoded' || request.nextUrl.searchParams.get('action') === 'create-auto') {
      const session = await auth();

      // التحقق من الصلاحيات - فقط admin
      if (!session?.user?.id) {
        return NextResponse.json(
          { success: false, error: 'غير مصرح' },
          { status: 401 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });

      if (!user || user.role !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'هذا الإجراء متاح فقط لمدير النظام' },
          { status: 403 }
        );
      }

      // إنشاء النسخة الاحتياطية
      const { backup, stats } = await createBackupData();
      const jsonString = JSON.stringify(backup, null, 2);
      const fileName = `erm-backup-auto-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

      // تسجيل النسخة
      await prisma.systemBackup.create({
        data: {
          fileName,
          fileSize: Buffer.byteLength(jsonString, 'utf8'),
          backupType: 'automatic',
          status: 'completed',
          createdById: session.user.id,
          stats: JSON.stringify(stats),
        },
      });

      // تنظيف النسخ القديمة
      await cleanupOldBackups();

      return NextResponse.json({
        success: true,
        message: 'تم إنشاء النسخة الاحتياطية بنجاح',
        data: {
          fileName,
          fileSize: Buffer.byteLength(jsonString, 'utf8'),
          stats,
        },
      });
    }

    // استعادة نسخة احتياطية
    const backup = await request.json();

    // التحقق من صحة ملف النسخة الاحتياطية
    if (!backup.version || !backup.data || !backup.system) {
      return NextResponse.json(
        { success: false, error: 'ملف النسخة الاحتياطية غير صالح' },
        { status: 400 }
      );
    }

    if (!backup.system.includes('ERM System')) {
      return NextResponse.json(
        { success: false, error: 'ملف النسخة الاحتياطية ليس من نظام ERM' },
        { status: 400 }
      );
    }

    const results = {
      departments: 0,
      processes: 0,
      categories: 0,
      users: 0,
      risks: 0,
      riskAssessments: 0,
      riskStatuses: 0,
      sources: 0,
      comments: 0,
      userDepartmentAccess: 0,
      treatmentPlans: 0,
      treatmentTasks: 0,
      taskSteps: 0,
      taskUpdates: 0,
      riskOwners: 0,
      likelihoodCriteria: 0,
      impactCriteria: 0,
      riskRatingCriteria: 0,
      incidents: 0,
      directMessages: 0,
      systemSettings: 0,
      treatmentPlanChangeLogs: 0,
      treatmentDiscussions: 0,
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

    // استعادة ملاك المخاطر
    if (backup.data.riskOwners && Array.isArray(backup.data.riskOwners)) {
      for (const owner of backup.data.riskOwners) {
        try {
          await prisma.riskOwner.upsert({
            where: { id: owner.id },
            update: {
              fullName: owner.fullName,
              fullNameEn: owner.fullNameEn,
              email: owner.email,
              phone: owner.phone,
              departmentId: owner.departmentId,
            },
            create: owner,
          });
          results.riskOwners++;
        } catch (e) {
          results.errors.push(`RiskOwner ${owner.fullName}: ${e}`);
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
              followUpDate: risk.followUpDate ? new Date(risk.followUpDate) : undefined,
              lastReviewDate: risk.lastReviewDate ? new Date(risk.lastReviewDate) : undefined,
              nextReviewDate: risk.nextReviewDate ? new Date(risk.nextReviewDate) : undefined,
            },
            create: {
              ...risk,
              identifiedDate: risk.identifiedDate ? new Date(risk.identifiedDate) : new Date(),
              followUpDate: risk.followUpDate ? new Date(risk.followUpDate) : undefined,
              lastReviewDate: risk.lastReviewDate ? new Date(risk.lastReviewDate) : undefined,
              nextReviewDate: risk.nextReviewDate ? new Date(risk.nextReviewDate) : undefined,
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

    // استعادة خطط المعالجة
    if (backup.data.treatmentPlans && Array.isArray(backup.data.treatmentPlans)) {
      for (const plan of backup.data.treatmentPlans) {
        try {
          await prisma.treatmentPlan.upsert({
            where: { id: plan.id },
            update: {
              titleAr: plan.titleAr,
              titleEn: plan.titleEn,
              strategy: plan.strategy,
              status: plan.status,
              priority: plan.priority,
              progress: plan.progress,
              responsibleId: plan.responsibleId,
              startDate: plan.startDate ? new Date(plan.startDate) : undefined,
              dueDate: plan.dueDate ? new Date(plan.dueDate) : undefined,
            },
            create: {
              ...plan,
              startDate: plan.startDate ? new Date(plan.startDate) : undefined,
              dueDate: plan.dueDate ? new Date(plan.dueDate) : undefined,
              createdAt: plan.createdAt ? new Date(plan.createdAt) : new Date(),
              updatedAt: plan.updatedAt ? new Date(plan.updatedAt) : new Date(),
            },
          });
          results.treatmentPlans++;
        } catch (e) {
          results.errors.push(`TreatmentPlan ${plan.id}: ${e}`);
        }
      }
    }

    // استعادة مهام المعالجة
    if (backup.data.treatmentTasks && Array.isArray(backup.data.treatmentTasks)) {
      for (const task of backup.data.treatmentTasks) {
        try {
          await prisma.treatmentTask.upsert({
            where: { id: task.id },
            update: {
              titleAr: task.titleAr,
              titleEn: task.titleEn,
              status: task.status,
              priority: task.priority,
              dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
            },
            create: {
              ...task,
              dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
              createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
              updatedAt: task.updatedAt ? new Date(task.updatedAt) : new Date(),
            },
          });
          results.treatmentTasks++;
        } catch (e) {
          results.errors.push(`TreatmentTask ${task.id}: ${e}`);
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

    // استعادة العمليات (Processes)
    if (backup.data.processes && Array.isArray(backup.data.processes)) {
      for (const process of backup.data.processes) {
        try {
          await prisma.process.upsert({
            where: { id: process.id },
            update: {
              nameAr: process.nameAr,
              nameEn: process.nameEn,
              code: process.code,
              departmentId: process.departmentId,
              parentId: process.parentId,
              isActive: process.isActive,
              order: process.order,
            },
            create: process,
          });
          results.processes++;
        } catch (e) {
          results.errors.push(`Process ${process.code}: ${e}`);
        }
      }
    }

    // استعادة تقييمات المخاطر
    if (backup.data.riskAssessments && Array.isArray(backup.data.riskAssessments)) {
      for (const assessment of backup.data.riskAssessments) {
        try {
          const exists = await prisma.riskAssessment.findUnique({ where: { id: assessment.id } });
          if (!exists) {
            await prisma.riskAssessment.create({
              data: {
                ...assessment,
                assessmentDate: assessment.assessmentDate ? new Date(assessment.assessmentDate) : new Date(),
                createdAt: assessment.createdAt ? new Date(assessment.createdAt) : new Date(),
              },
            });
            results.riskAssessments++;
          }
        } catch (e) {
          results.errors.push(`RiskAssessment ${assessment.id}: ${e}`);
        }
      }
    }

    // استعادة خطوات المهام (Task Steps)
    if (backup.data.taskSteps && Array.isArray(backup.data.taskSteps)) {
      for (const step of backup.data.taskSteps) {
        try {
          const exists = await prisma.taskStep.findUnique({ where: { id: step.id } });
          if (!exists) {
            await prisma.taskStep.create({
              data: {
                ...step,
                dueDate: step.dueDate ? new Date(step.dueDate) : undefined,
                completedAt: step.completedAt ? new Date(step.completedAt) : undefined,
                createdAt: step.createdAt ? new Date(step.createdAt) : new Date(),
                updatedAt: step.updatedAt ? new Date(step.updatedAt) : new Date(),
              },
            });
            results.taskSteps++;
          }
        } catch (e) {
          results.errors.push(`TaskStep ${step.id}: ${e}`);
        }
      }
    }

    // استعادة تحديثات المهام (Task Updates)
    if (backup.data.taskUpdates && Array.isArray(backup.data.taskUpdates)) {
      for (const update of backup.data.taskUpdates) {
        try {
          const exists = await prisma.taskUpdate.findUnique({ where: { id: update.id } });
          if (!exists) {
            await prisma.taskUpdate.create({
              data: {
                ...update,
                createdAt: update.createdAt ? new Date(update.createdAt) : new Date(),
              },
            });
            results.taskUpdates++;
          }
        } catch (e) {
          results.errors.push(`TaskUpdate ${update.id}: ${e}`);
        }
      }
    }

    // استعادة معايير الاحتمالية
    if (backup.data.likelihoodCriteria && Array.isArray(backup.data.likelihoodCriteria)) {
      for (const criteria of backup.data.likelihoodCriteria) {
        try {
          await prisma.likelihoodCriteria.upsert({
            where: { id: criteria.id },
            update: {
              level: criteria.level,
              nameAr: criteria.nameAr,
              nameEn: criteria.nameEn,
              descriptionAr: criteria.descriptionAr,
              descriptionEn: criteria.descriptionEn,
              percentage: criteria.percentage,
            },
            create: criteria,
          });
          results.likelihoodCriteria++;
        } catch (e) {
          results.errors.push(`LikelihoodCriteria ${criteria.level}: ${e}`);
        }
      }
    }

    // استعادة معايير التأثير
    if (backup.data.impactCriteria && Array.isArray(backup.data.impactCriteria)) {
      for (const criteria of backup.data.impactCriteria) {
        try {
          await prisma.impactCriteria.upsert({
            where: { id: criteria.id },
            update: {
              level: criteria.level,
              nameAr: criteria.nameAr,
              nameEn: criteria.nameEn,
              descriptionAr: criteria.descriptionAr,
              descriptionEn: criteria.descriptionEn,
            },
            create: criteria,
          });
          results.impactCriteria++;
        } catch (e) {
          results.errors.push(`ImpactCriteria ${criteria.level}: ${e}`);
        }
      }
    }

    // استعادة معايير تصنيف الخطر
    if (backup.data.riskRatingCriteria && Array.isArray(backup.data.riskRatingCriteria)) {
      for (const criteria of backup.data.riskRatingCriteria) {
        try {
          await prisma.riskRatingCriteria.upsert({
            where: { id: criteria.id },
            update: {
              minScore: criteria.minScore,
              maxScore: criteria.maxScore,
              nameAr: criteria.nameAr,
              nameEn: criteria.nameEn,
              descriptionAr: criteria.descriptionAr,
              descriptionEn: criteria.descriptionEn,
              color: criteria.color,
            },
            create: criteria,
          });
          results.riskRatingCriteria++;
        } catch (e) {
          results.errors.push(`RiskRatingCriteria ${criteria.id}: ${e}`);
        }
      }
    }

    // استعادة الحوادث
    if (backup.data.incidents && Array.isArray(backup.data.incidents)) {
      for (const incident of backup.data.incidents) {
        try {
          await prisma.incident.upsert({
            where: { id: incident.id },
            update: {
              titleAr: incident.titleAr,
              titleEn: incident.titleEn,
              descriptionAr: incident.descriptionAr,
              descriptionEn: incident.descriptionEn,
              severity: incident.severity,
              status: incident.status,
            },
            create: {
              ...incident,
              incidentDate: incident.incidentDate ? new Date(incident.incidentDate) : new Date(),
              reportedDate: incident.reportedDate ? new Date(incident.reportedDate) : new Date(),
              resolvedDate: incident.resolvedDate ? new Date(incident.resolvedDate) : undefined,
              createdAt: incident.createdAt ? new Date(incident.createdAt) : new Date(),
              updatedAt: incident.updatedAt ? new Date(incident.updatedAt) : new Date(),
            },
          });
          results.incidents++;
        } catch (e) {
          results.errors.push(`Incident ${incident.incidentNumber}: ${e}`);
        }
      }
    }

    // استعادة الرسائل المباشرة
    if (backup.data.directMessages && Array.isArray(backup.data.directMessages)) {
      for (const message of backup.data.directMessages) {
        try {
          const exists = await prisma.directMessage.findUnique({ where: { id: message.id } });
          if (!exists) {
            await prisma.directMessage.create({
              data: {
                ...message,
                createdAt: message.createdAt ? new Date(message.createdAt) : new Date(),
                updatedAt: message.updatedAt ? new Date(message.updatedAt) : new Date(),
              },
            });
            results.directMessages++;
          }
        } catch (e) {
          results.errors.push(`DirectMessage ${message.id}: ${e}`);
        }
      }
    }

    // استعادة إعدادات النظام
    if (backup.data.systemSettings && Array.isArray(backup.data.systemSettings)) {
      for (const setting of backup.data.systemSettings) {
        try {
          await prisma.systemSettings.upsert({
            where: { id: setting.id },
            update: { value: setting.value },
            create: setting,
          });
          results.systemSettings++;
        } catch (e) {
          results.errors.push(`SystemSettings ${setting.key}: ${e}`);
        }
      }
    }

    // استعادة سجل تغييرات خطط المعالجة
    if (backup.data.treatmentPlanChangeLogs && Array.isArray(backup.data.treatmentPlanChangeLogs)) {
      for (const log of backup.data.treatmentPlanChangeLogs) {
        try {
          const exists = await prisma.treatmentPlanChangeLog.findUnique({ where: { id: log.id } });
          if (!exists) {
            await prisma.treatmentPlanChangeLog.create({
              data: {
                ...log,
                createdAt: log.createdAt ? new Date(log.createdAt) : new Date(),
              },
            });
            results.treatmentPlanChangeLogs++;
          }
        } catch (e) {
          results.errors.push(`TreatmentPlanChangeLog ${log.id}: ${e}`);
        }
      }
    }

    // استعادة مناقشات خطط المعالجة
    if (backup.data.treatmentDiscussions && Array.isArray(backup.data.treatmentDiscussions)) {
      for (const discussion of backup.data.treatmentDiscussions) {
        try {
          const exists = await prisma.treatmentDiscussion.findUnique({ where: { id: discussion.id } });
          if (!exists) {
            await prisma.treatmentDiscussion.create({
              data: {
                ...discussion,
                createdAt: discussion.createdAt ? new Date(discussion.createdAt) : new Date(),
                updatedAt: discussion.updatedAt ? new Date(discussion.updatedAt) : new Date(),
              },
            });
            results.treatmentDiscussions++;
          }
        } catch (e) {
          results.errors.push(`TreatmentDiscussion ${discussion.id}: ${e}`);
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
