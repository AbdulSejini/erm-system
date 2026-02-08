import prisma from '@/lib/prisma';

/**
 * حساب حالة وتقدم خطة المعالجة تلقائيًا بناءً على حالة المهام
 *
 * المنطق:
 * - إذا لم تكن هناك مهام → notStarted
 * - إذا اكتملت جميع المهام → completed
 * - إذا بدأت أي مهمة (inProgress أو completed) → inProgress
 * - إذا تجاوز تاريخ الاستحقاق ولم تكتمل → overdue
 * - غير ذلك → notStarted
 */
export async function recalculateTreatmentStatus(treatmentPlanId: string) {
  // جلب خطة المعالجة مع جميع المهام
  const treatmentPlan = await prisma.treatmentPlan.findUnique({
    where: { id: treatmentPlanId },
    select: {
      id: true,
      status: true,
      progress: true,
      dueDate: true,
      tasks: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  if (!treatmentPlan) return null;

  // لا نغير الحالة إذا كانت ملغاة يدويًا
  if (treatmentPlan.status === 'cancelled') return treatmentPlan;

  const tasks = treatmentPlan.tasks;
  const totalTasks = tasks.length;

  // إذا لم تكن هناك مهام
  if (totalTasks === 0) {
    return treatmentPlan;
  }

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'inProgress').length;

  // حساب نسبة التقدم
  const progress = Math.round((completedTasks / totalTasks) * 100);

  // تحديد الحالة
  let newStatus: string;

  if (completedTasks === totalTasks) {
    // جميع المهام مكتملة
    newStatus = 'completed';
  } else if (completedTasks > 0 || inProgressTasks > 0) {
    // بعض المهام بدأت أو اكتملت
    // التحقق إذا تجاوز تاريخ الاستحقاق
    if (treatmentPlan.dueDate && new Date(treatmentPlan.dueDate) < new Date()) {
      newStatus = 'overdue';
    } else {
      newStatus = 'inProgress';
    }
  } else {
    // لم تبدأ أي مهمة
    // التحقق إذا تجاوز تاريخ الاستحقاق
    if (treatmentPlan.dueDate && new Date(treatmentPlan.dueDate) < new Date()) {
      newStatus = 'overdue';
    } else {
      newStatus = 'notStarted';
    }
  }

  // تحديث فقط إذا تغيرت القيم
  if (treatmentPlan.status !== newStatus || treatmentPlan.progress !== progress) {
    const updated = await prisma.treatmentPlan.update({
      where: { id: treatmentPlanId },
      data: {
        status: newStatus,
        progress: progress,
        // إذا اكتملت، نسجل تاريخ الإكمال
        ...(newStatus === 'completed' && !treatmentPlan.status?.includes('completed') ? {
          completionDate: new Date(),
        } : {}),
      },
    });
    return updated;
  }

  return treatmentPlan;
}

/**
 * إعادة حساب حالة المهمة بناءً على حالة الخطوات (steps)
 */
export async function recalculateTaskStatus(taskId: string) {
  const task = await prisma.treatmentTask.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      status: true,
      treatmentPlanId: true,
      steps: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  if (!task) return null;

  const steps = task.steps;
  const totalSteps = steps.length;

  // إذا لم تكن هناك خطوات، لا نغير حالة المهمة
  if (totalSteps === 0) return task;

  const completedSteps = steps.filter(s => s.status === 'completed').length;
  const inProgressSteps = steps.filter(s => s.status === 'inProgress').length;

  let newStatus: string;

  if (completedSteps === totalSteps) {
    newStatus = 'completed';
  } else if (completedSteps > 0 || inProgressSteps > 0) {
    newStatus = 'inProgress';
  } else {
    newStatus = 'notStarted';
  }

  if (task.status !== newStatus) {
    await prisma.treatmentTask.update({
      where: { id: taskId },
      data: {
        status: newStatus,
        ...(newStatus === 'completed' ? { completedAt: new Date() } : { completedAt: null }),
      },
    });
  }

  return task;
}
