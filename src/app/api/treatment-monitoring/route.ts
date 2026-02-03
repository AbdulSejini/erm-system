import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET - جلب جميع بيانات المعالجة للمتابعة
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    // جلب جميع خطط المعالجة مع التفاصيل الكاملة
    const treatmentPlans = await prisma.treatmentPlan.findMany({
      include: {
        risk: {
          select: {
            id: true,
            riskNumber: true,
            titleAr: true,
            titleEn: true,
            inherentLikelihood: true,
            inherentImpact: true,
            inherentScore: true,
            inherentRating: true,
            residualLikelihood: true,
            residualImpact: true,
            residualScore: true,
            residualRating: true,
            status: true,
            department: {
              select: {
                id: true,
                nameAr: true,
                nameEn: true,
                riskChampion: {
                  select: {
                    id: true,
                    fullName: true,
                    fullNameEn: true,
                  },
                },
              },
            },
            owner: {
              select: {
                id: true,
                fullName: true,
                fullNameEn: true,
                email: true,
              },
            },
          },
        },
        responsible: {
          select: {
            id: true,
            fullName: true,
            fullNameEn: true,
            email: true,
            avatar: true,
            department: {
              select: {
                id: true,
                nameAr: true,
                nameEn: true,
              },
            },
          },
        },
        riskOwner: {
          select: {
            id: true,
            fullName: true,
            fullNameEn: true,
            email: true,
          },
        },
        monitor: {
          select: {
            id: true,
            fullName: true,
            fullNameEn: true,
            email: true,
            avatar: true,
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
          include: {
            assignedTo: {
              select: {
                id: true,
                fullName: true,
                fullNameEn: true,
                avatar: true,
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
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { dueDate: 'asc' },
      ],
    });

    // حساب الإحصائيات
    const stats = {
      total: treatmentPlans.length,
      notStarted: treatmentPlans.filter((t) => t.status === 'notStarted').length,
      inProgress: treatmentPlans.filter((t) => t.status === 'inProgress').length,
      completed: treatmentPlans.filter((t) => t.status === 'completed').length,
      overdue: treatmentPlans.filter((t) => t.status === 'overdue' || (t.dueDate < new Date() && t.status !== 'completed' && t.status !== 'cancelled')).length,
      cancelled: treatmentPlans.filter((t) => t.status === 'cancelled').length,
      highPriority: treatmentPlans.filter((t) => t.priority === 'high' && t.status !== 'completed' && t.status !== 'cancelled').length,
      averageProgress: treatmentPlans.length > 0
        ? Math.round(treatmentPlans.reduce((acc, t) => acc + t.progress, 0) / treatmentPlans.length)
        : 0,
    };

    // الخطط التي تنتهي قريباً (خلال 7 أيام)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const upcomingDeadlines = treatmentPlans.filter(
      (t) =>
        t.dueDate <= sevenDaysFromNow &&
        t.dueDate >= new Date() &&
        t.status !== 'completed' &&
        t.status !== 'cancelled'
    );

    // المتأخرة
    const overduePlans = treatmentPlans.filter(
      (t) =>
        (t.status === 'overdue' || (t.dueDate < new Date() && t.status !== 'completed' && t.status !== 'cancelled'))
    );

    // تجميع المسؤولين مع أعداد المهام
    const responsibleStats = treatmentPlans.reduce((acc, plan) => {
      const responsibleId = plan.responsibleId;
      if (!acc[responsibleId]) {
        acc[responsibleId] = {
          user: plan.responsible,
          total: 0,
          completed: 0,
          inProgress: 0,
          overdue: 0,
        };
      }
      acc[responsibleId].total++;
      if (plan.status === 'completed') acc[responsibleId].completed++;
      if (plan.status === 'inProgress') acc[responsibleId].inProgress++;
      if (plan.status === 'overdue' || (plan.dueDate < new Date() && plan.status !== 'completed' && plan.status !== 'cancelled')) {
        acc[responsibleId].overdue++;
      }
      return acc;
    }, {} as Record<string, { user: typeof treatmentPlans[0]['responsible']; total: number; completed: number; inProgress: number; overdue: number }>);

    // إحصائيات الاستراتيجيات
    const strategyStats = {
      avoid: treatmentPlans.filter((t) => t.strategy === 'avoid').length,
      reduce: treatmentPlans.filter((t) => t.strategy === 'reduce').length,
      transfer: treatmentPlans.filter((t) => t.strategy === 'transfer').length,
      accept: treatmentPlans.filter((t) => t.strategy === 'accept').length,
    };

    // إحصائيات حسب الإدارة
    const departmentStats = treatmentPlans.reduce((acc, plan) => {
      const deptId = plan.risk.department?.id || 'unknown';
      const deptNameAr = plan.risk.department?.nameAr || 'غير محدد';
      const deptNameEn = plan.risk.department?.nameEn || 'Unspecified';
      if (!acc[deptId]) {
        acc[deptId] = {
          id: deptId,
          nameAr: deptNameAr,
          nameEn: deptNameEn,
          total: 0,
          completed: 0,
          inProgress: 0,
          overdue: 0,
        };
      }
      acc[deptId].total++;
      if (plan.status === 'completed') acc[deptId].completed++;
      if (plan.status === 'inProgress') acc[deptId].inProgress++;
      if (plan.status === 'overdue' || (plan.dueDate < new Date() && plan.status !== 'completed' && plan.status !== 'cancelled')) {
        acc[deptId].overdue++;
      }
      return acc;
    }, {} as Record<string, { id: string; nameAr: string; nameEn: string; total: number; completed: number; inProgress: number; overdue: number }>);

    return NextResponse.json({
      success: true,
      data: {
        treatmentPlans,
        stats,
        upcomingDeadlines,
        overduePlans,
        responsibleStats: Object.values(responsibleStats),
        strategyStats,
        departmentStats: Object.values(departmentStats),
      },
    });
  } catch (error) {
    console.error('Error fetching treatment monitoring data:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في جلب البيانات' },
      { status: 500 }
    );
  }
}
