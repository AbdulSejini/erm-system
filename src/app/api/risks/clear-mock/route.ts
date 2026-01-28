import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// DELETE - حذف البيانات التجريبية (المخاطر التي تبدأ بـ HR-R)
export async function DELETE() {
  try {
    // التحقق من صلاحيات المستخدم (يجب أن يكون admin)
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'غير مصرح - يتطلب صلاحيات المدير' },
        { status: 403 }
      );
    }

    // حذف جميع المخاطر التي تبدأ بـ HR-R (البيانات التجريبية للموارد البشرية)
    const deletedRisks = await prisma.risk.deleteMany({
      where: {
        riskNumber: {
          startsWith: 'HR-R-'
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `تم حذف ${deletedRisks.count} خطر تجريبي`,
      deleted: deletedRisks.count
    });
  } catch (error) {
    console.error('Error clearing mock data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'فشل في حذف البيانات التجريبية',
        details: error instanceof Error ? error.message : 'خطأ غير معروف'
      },
      { status: 500 }
    );
  }
}
